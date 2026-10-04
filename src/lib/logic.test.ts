import { beforeEach, describe, expect, it } from 'vitest'
import { calcTargets } from '../data/nutrition'
import { TEMPLATE } from '../data/programs'
import { db, LOCAL_USER, remove, save, setMeta } from './db'
import { adoptLocalData, mergeRemote } from './sync'
import type { SetLog } from './types'
import { bestOf, dayItems, e1rm, ensurePerson, findPRs, installTemplate, isoWeekday, previousSets, programDays, progressSeries } from './workout'

function set(partial: Partial<SetLog>): SetLog {
  return {
    id: crypto.randomUUID(),
    user_id: LOCAL_USER,
    updated_at: '2026-01-01T00:00:00.000Z',
    session_id: 's1',
    exercise_id: 'Barbell_Squat',
    item_id: null,
    set_no: 1,
    weight_kg: 100,
    reps: 5,
    done_at: '2026-01-01T10:00:00.000Z',
    ...partial,
  }
}

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('e1rm', () => {
  it('uses Epley and returns the weight for singles', () => {
    expect(e1rm(100, 1)).toBe(100)
    expect(e1rm(100, 5)).toBeCloseTo(116.67, 1)
    expect(e1rm(0, 5)).toBe(0)
  })
})

describe('isoWeekday', () => {
  it('maps Sunday to 7 and Monday to 1', () => {
    expect(isoWeekday(new Date(2026, 9, 4))).toBe(7) // Sunday
    expect(isoWeekday(new Date(2026, 9, 5))).toBe(1) // Monday
  })
})

describe('calcTargets', () => {
  it('gives a surplus for the strength plan and a deficit for the toning plan', () => {
    const him = calcTargets({ sex: 'male', age: 29, height_cm: 170, weight_kg: 70, plan: 'guc' })
    const her = calcTargets({ sex: 'female', age: 30, height_cm: 170, weight_kg: 70, plan: 'sikilasma' })
    expect(him.kcal).toBe(2750)
    expect(him.protein).toBe(140)
    expect(her.kcal).toBe(1800)
    expect(her.protein).toBe(125)
    expect(her.carbs).toBeGreaterThan(0)
  })
})

describe('installTemplate', () => {
  it('builds the same days for both plans, with cardio only where the plan has it', async () => {
    const strength = await installTemplate('guc')
    const sDays = await programDays(strength.id)
    expect(sDays.map((d) => d.weekday)).toEqual(TEMPLATE.map((t) => t.weekday))
    const monday = await dayItems(sDays[0].id)
    expect(monday.find((i) => i.block === 'cardio')).toBeUndefined()
    expect(monday[0]).toMatchObject({ exercise_id: 'Barbell_Squat', sets: 5, rep_min: 3, rep_max: 5 })

    const toning = await installTemplate('sikilasma')
    const tDays = await programDays(toning.id)
    const tMonday = await dayItems(tDays[0].id)
    expect(tMonday[0]).toMatchObject({ exercise_id: 'Barbell_Squat', sets: 3, rep_min: 8 })
    expect(tMonday.at(-1)).toMatchObject({ block: 'cardio', duration_min: 15 })

    // Only the newest program stays active.
    const programs = await db.programs.toArray()
    expect(programs.filter((p) => p.active).map((p) => p.id)).toEqual([toning.id])
  })
})

describe('ensurePerson', () => {
  it('sets up each person once with their own plan, weight and profile', async () => {
    await setMeta('uid', 'simge')
    await ensurePerson('simge')
    await ensurePerson('simge')
    const profile = await db.profiles.get('simge')
    expect(profile).toMatchObject({ user_id: 'simge', name: 'Simge', plan_key: 'sikilasma', kcal_target: 1800 })
    expect(await db.programs.where('user_id').equals('simge').count()).toBe(1)
    expect((await db.body_weights.toArray()).map((w) => w.kg)).toEqual([70])

    await setMeta('uid', 'mert')
    await ensurePerson('mert')
    expect(await db.profiles.get('mert')).toMatchObject({ user_id: 'mert', plan_key: 'guc', kcal_target: 2750 })
    expect(await db.programs.where('user_id').equals('simge').count()).toBe(1)
  })
})

describe('previousSets', () => {
  it('returns the sets of the latest other session, in order', async () => {
    await db.set_logs.bulkPut([
      set({ session_id: 'old', set_no: 1, weight_kg: 90, done_at: '2026-01-01T10:00:00Z' }),
      set({ session_id: 'last', set_no: 2, weight_kg: 102.5, done_at: '2026-01-08T10:05:00Z' }),
      set({ session_id: 'last', set_no: 1, weight_kg: 100, done_at: '2026-01-08T10:00:00Z' }),
      set({ session_id: 'now', set_no: 1, weight_kg: 105, done_at: '2026-01-15T10:00:00Z' }),
    ])
    const prev = await previousSets('Barbell_Squat', 'now')
    expect(prev.map((s) => s.weight_kg)).toEqual([100, 102.5])
  })
})

describe('records', () => {
  it('finds best sets and PRs against earlier sessions', () => {
    const earlier = [set({ weight_kg: 100, reps: 5 })]
    const today = [set({ session_id: 's2', weight_kg: 105, reps: 3 }), set({ session_id: 's2', weight_kg: 100, reps: 6 })]
    expect(bestOf(today)!.maxWeight.weight_kg).toBe(105)
    // 100x6 (120) beats 100x5 (116.7); 105x3 is 115.5
    expect(findPRs(today, earlier).map((s) => s.reps)).toEqual([6])
    expect(findPRs(today, [])).toEqual([])
  })

  it('groups progress by day', () => {
    const series = progressSeries([
      set({ weight_kg: 100, reps: 5, done_at: '2026-01-01T10:00:00' }),
      set({ weight_kg: 110, reps: 2, done_at: '2026-01-01T10:10:00' }),
      set({ weight_kg: 105, reps: 5, done_at: '2026-01-05T10:00:00' }),
    ])
    expect(series).toHaveLength(2)
    expect(series[0].maxWeight).toBe(110)
    expect(series[0].volume).toBe(720)
  })
})

describe('local store and sync', () => {
  it('queues every write and soft-deletes', async () => {
    const w = await save('body_weights', { date: '2026-01-01', kg: 70 })
    await remove('body_weights', w.id)
    expect((await db.body_weights.get(w.id))!.deleted).toBe(true)
    expect(await db.outbox.count()).toBe(2)
  })

  it('keeps the newer row when merging remote data', async () => {
    await db.body_weights.put({ id: 'w1', user_id: 'u', updated_at: '2026-01-02T00:00:00.000Z', date: '2026-01-01', kg: 71 })
    const older = await mergeRemote('body_weights', { id: 'w1', user_id: 'u', updated_at: '2026-01-01T00:00:00+00:00', date: '2026-01-01', kg: 70 } as never)
    expect(older).toBe(false)
    const newer = await mergeRemote('body_weights', { id: 'w1', user_id: 'u', updated_at: '2026-01-03T00:00:00+00:00', date: '2026-01-01', kg: 72 } as never)
    expect(newer).toBe(true)
    expect((await db.body_weights.get('w1'))!.kg).toBe(72)
  })

  it('hands local-mode rows to the signed-in account', async () => {
    await save('body_weights', { date: '2026-01-01', kg: 70 })
    await save('profiles', { id: LOCAL_USER, name: 'A', sex: 'male', birth_year: 1997, height_cm: 170, plan_key: 'guc', kcal_target: 1, protein_target: 1 })
    await db.outbox.clear()
    await setMeta('uid', 'user-1')
    expect(await adoptLocalData('user-1')).toBe(2)
    expect((await db.body_weights.toArray())[0].user_id).toBe('user-1')
    expect(await db.profiles.get('user-1')).toBeDefined()
    expect(await db.profiles.get(LOCAL_USER)).toBeUndefined()
    expect(await db.outbox.count()).toBe(2)
  })
})
