import { calcTargets } from '../data/nutrition'
import { PEOPLE, type PersonKey } from '../data/people'
import { PROGRAM_NAME, TEMPLATE } from '../data/programs'
import { alive, currentUserId, db, save } from './db'
import type { PlanKey, Program, ProgramDay, ProgramItem, Session, SetLog } from './types'

/** Epley estimate of the one-rep max. */
export function e1rm(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0
  if (reps === 1) return weight
  return weight * (1 + reps / 30)
}

/** 1 = Monday ... 7 = Sunday */
export function isoWeekday(d = new Date()): number {
  return ((d.getDay() + 6) % 7) + 1
}

export function localDate(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Create the user's program from the shared template, using their plan's doses. */
export async function installTemplate(plan: PlanKey): Promise<Program> {
  const uid = await currentUserId()
  for (const p of alive(await db.programs.where('user_id').equals(uid).toArray())) {
    if (p.active) await save('programs', { ...p, active: false })
  }
  const program = await save('programs', { name: PROGRAM_NAME[plan], active: true })
  let dayPos = 0
  for (const t of TEMPLATE) {
    const day = await save('program_days', {
      program_id: program.id,
      position: dayPos++,
      name: t.name,
      weekday: t.weekday,
      optional: !!t.optional,
    })
    let pos = 0
    for (const item of t.items) {
      const dose = item[plan]
      if (!dose) continue
      const [sets, rep_min, rep_max, rest_sec] = dose
      const note = [item.note, plan === 'sikilasma' ? item.noteSikilasma : undefined].filter(Boolean).join(' ')
      await save('program_items', {
        day_id: day.id,
        position: pos++,
        exercise_id: item.exercise,
        block: item.block,
        sets,
        rep_min,
        rep_max,
        rest_sec,
        duration_min: item.minutes?.[plan] ?? null,
        note,
      })
    }
  }
  return program
}

/**
 * Make sure the chosen person has a program, a starting body weight and an
 * up-to-date profile. Call after `uid` meta is set to the person key.
 */
export async function ensurePerson(key: PersonKey): Promise<void> {
  const person = PEOPLE[key]
  if (!(await activeProgram(key))) await installTemplate(person.plan)
  const weights = alive(await db.body_weights.where('user_id').equals(key).toArray()).sort((a, b) => a.date.localeCompare(b.date))
  if (weights.length === 0) await save('body_weights', { date: localDate(), kg: person.start_weight_kg })
  const weight = weights.at(-1)?.kg ?? person.start_weight_kg
  const t = calcTargets({
    sex: person.sex,
    age: new Date().getFullYear() - person.birth_year,
    height_cm: person.height_cm,
    weight_kg: weight,
    plan: person.plan,
  })
  const existing = alive(await db.profiles.where('user_id').equals(key).toArray())[0]
  const wanted = {
    name: person.name,
    sex: person.sex,
    birth_year: person.birth_year,
    height_cm: person.height_cm,
    plan_key: person.plan,
    kcal_target: t.kcal,
    protein_target: t.protein,
  }
  const same = existing && (Object.keys(wanted) as (keyof typeof wanted)[]).every((k) => existing[k] === wanted[k])
  if (!same) await save('profiles', { id: key, ...wanted })
}

export async function activeProgram(uid: string): Promise<Program | undefined> {
  return alive(await db.programs.where('user_id').equals(uid).toArray()).find((p) => p.active)
}

export async function programDays(programId: string): Promise<ProgramDay[]> {
  return alive(await db.program_days.where('program_id').equals(programId).toArray()).sort((a, b) => a.position - b.position)
}

export async function dayItems(dayId: string): Promise<ProgramItem[]> {
  return alive(await db.program_items.where('day_id').equals(dayId).toArray()).sort((a, b) => a.position - b.position)
}

export async function startSession(day: ProgramDay | null): Promise<Session> {
  return save('sessions', {
    program_day_id: day?.id ?? null,
    day_name: day?.name ?? 'Serbest antrenman',
    started_at: new Date().toISOString(),
    ended_at: null,
    note: '',
  })
}

export async function openSession(uid: string): Promise<Session | undefined> {
  const sessions = alive(await db.sessions.where('user_id').equals(uid).toArray())
  return sessions.filter((s) => !s.ended_at).sort((a, b) => b.started_at.localeCompare(a.started_at))[0]
}

/** Sets of this exercise from the most recent other session that has any. */
export async function previousSets(exerciseId: string, excludeSessionId: string): Promise<SetLog[]> {
  const uid = await currentUserId()
  const logs = alive(await db.set_logs.where('exercise_id').equals(exerciseId).toArray()).filter(
    (l) => l.user_id === uid && l.session_id !== excludeSessionId,
  )
  if (logs.length === 0) return []
  const latest = logs.reduce((a, b) => (a.done_at > b.done_at ? a : b))
  return logs.filter((l) => l.session_id === latest.session_id).sort((a, b) => a.set_no - b.set_no)
}

export interface ExerciseBest {
  maxWeight: SetLog
  bestE1rm: SetLog
}

export function bestOf(logs: SetLog[]): ExerciseBest | null {
  const valid = logs.filter((l) => !l.deleted && l.weight_kg > 0 && l.reps > 0)
  if (valid.length === 0) return null
  return {
    maxWeight: valid.reduce((a, b) => (b.weight_kg > a.weight_kg || (b.weight_kg === a.weight_kg && b.reps > a.reps) ? b : a)),
    bestE1rm: valid.reduce((a, b) => (e1rm(b.weight_kg, b.reps) > e1rm(a.weight_kg, a.reps) ? b : a)),
  }
}

/** Per-day progress points: heaviest set and best estimated 1RM. */
export function progressSeries(logs: SetLog[]): { date: string; maxWeight: number; e1rm: number; volume: number }[] {
  const byDay = new Map<string, SetLog[]>()
  for (const l of logs) {
    if (l.deleted) continue
    const d = localDate(new Date(l.done_at))
    if (!byDay.has(d)) byDay.set(d, [])
    byDay.get(d)!.push(l)
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, sets]) => ({
      date,
      maxWeight: Math.max(...sets.map((s) => s.weight_kg)),
      e1rm: Math.max(...sets.map((s) => e1rm(s.weight_kg, s.reps))),
      volume: sets.reduce((sum, s) => sum + s.weight_kg * s.reps, 0),
    }))
}

/** Sets in `current` that beat every earlier set of the same exercise by estimated 1RM. */
export function findPRs(current: SetLog[], earlier: SetLog[]): SetLog[] {
  const prs: SetLog[] = []
  const byExercise = new Map<string, SetLog[]>()
  for (const s of current) {
    if (!byExercise.has(s.exercise_id)) byExercise.set(s.exercise_id, [])
    byExercise.get(s.exercise_id)!.push(s)
  }
  for (const [exerciseId, sets] of byExercise) {
    const prior = earlier.filter((e) => e.exercise_id === exerciseId && !e.deleted)
    if (prior.length === 0) continue
    const priorBest = Math.max(...prior.map((p) => e1rm(p.weight_kg, p.reps)))
    const best = bestOf(sets)?.bestE1rm
    if (best && e1rm(best.weight_kg, best.reps) > priorBest) prs.push(best)
  }
  return prs
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatKg(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ',')
}

export function repRange(item: Pick<ProgramItem, 'rep_min' | 'rep_max'>): string {
  return item.rep_min === item.rep_max ? String(item.rep_min) : `${item.rep_min}-${item.rep_max}`
}
