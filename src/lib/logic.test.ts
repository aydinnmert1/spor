import { beforeEach, describe, expect, it } from 'vitest'
import { calcTargets } from '../data/nutrition'
import { TEMPLATE_VERSION, TEMPLATES } from '../data/programs'
import { db, LOCAL_USER, remove, save, setMeta } from './db'
import { adoptLocalData, mergeRemote } from './sync'
import type { SetLog } from './types'
import { bestOf, dayItems, e1rm, ensurePerson, estimateMinutes, weekStatus, findPRs, installTemplate, isoWeekday, previousSets, programDays, progressSeries } from './workout'

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
  it('gives Mert four lifting days of a main lift plus supersets, cardio optional', async () => {
    const strength = await installTemplate('guc')
    expect(strength.template_version).toBe(TEMPLATE_VERSION.guc)
    const days = await programDays(strength.id)
    expect(days.map((d) => d.weekday)).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(days.map((d) => d.optional)).toEqual([false, false, true, false, false, true, true])
    const lifting = days.filter((d) => !d.optional)
    const mains: string[] = []
    for (const day of lifting) {
      const items = await dayItems(day.id)
      expect(items[0].block).toBe('main')
      expect(items.slice(1).every((i) => i.block === 'accessory')).toBe(true)
      expect((items.length - 1) % 2).toBe(0)
      // Superset openers carry no rest; the partner carries the rest between rounds.
      for (let i = 1; i < items.length; i += 2) {
        expect(items[i].rest_sec).toBe(0)
        expect(items[i + 1].rest_sec).toBeGreaterThan(0)
      }
      mains.push(items[0].exercise_id)
    }
    expect(mains).toEqual(['Barbell_Squat', 'Barbell_Bench_Press_-_Medium_Grip', 'Barbell_Deadlift', 'Standing_Military_Press'])
    const friday = await dayItems(lifting[3].id)
    expect(friday.map((i) => i.exercise_id)).toEqual(expect.arrayContaining(['Lying_Leg_Curls', 'Standing_Calf_Raises']))
    const all = (await Promise.all(days.map((d) => dayItems(d.id)))).flat().map((i) => i.exercise_id)
    expect(all).not.toContain('Split_Squat_with_Dumbbells')
    expect(all).not.toContain('Face_Pull')
  })

  it('gives Simge two full-body days, every other day optional cardio', async () => {
    const toning = await installTemplate('sikilasma')
    expect(toning.template_version).toBe(TEMPLATE_VERSION.sikilasma)
    const days = await programDays(toning.id)
    expect(days.map((d) => d.weekday)).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(days.filter((d) => !d.optional).map((d) => d.weekday)).toEqual([1, 4])
    for (const day of days) {
      const items = await dayItems(day.id)
      if (day.optional) expect(items).toMatchObject([{ block: 'cardio', duration_min: 45 }])
      else expect(items.some((i) => i.block === 'cardio')).toBe(false)
    }
    const ids = (await Promise.all(days.map((d) => dayItems(d.id)))).flat().map((i) => i.exercise_id)
    expect(ids).not.toContain('Split_Squat_with_Dumbbells')
    expect(ids).not.toContain('Face_Pull')
  })
})

describe('session length', () => {
  for (const plan of ['guc', 'sikilasma'] as const) {
    it(`keeps every ${plan} session within 60 minutes`, () => {
      for (const day of TEMPLATES[plan]) {
        const items = day.items
          .filter((i) => i[plan])
          .map((i) => ({
            block: i.block,
            sets: i[plan]![0],
            rest_sec: i[plan]![3],
            duration_min: i.minutes?.[plan] ?? null,
            per_side: !!i.perSide,
          }))
        const min = estimateMinutes(items, plan)
        expect(min, `${plan} · ${day.name}: ${min} dk`).toBeLessThanOrEqual(60)
        expect(min).toBeGreaterThanOrEqual(30)
      }
    })
  }
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

describe('template upgrade', () => {
  it('replaces an older active program with the current template and keeps it after that', async () => {
    await setMeta('uid', 'mert')
    const old = await save('programs', { name: 'Güç Programı', active: true, template_version: null })
    await ensurePerson('mert')
    const programs = await db.programs.where('user_id').equals('mert').toArray()
    const active = programs.filter((p) => p.active)
    expect(active).toHaveLength(1)
    expect(active[0].template_version).toBe(TEMPLATE_VERSION.guc)
    expect(programs.find((p) => p.id === old.id)?.active).toBe(false)

    await ensurePerson('mert')
    expect(await db.programs.where('user_id').equals('mert').count()).toBe(2)
  })
})

describe('per-plan rollout', () => {
  it('replaces only the plan whose template version went up', async () => {
    await setMeta('uid', 'simge')
    const simge = await save('programs', { name: 'Upper/Lower · Sıkılaşma', active: true, template_version: TEMPLATE_VERSION.sikilasma })
    await ensurePerson('simge')
    expect((await db.programs.where('user_id').equals('simge').toArray()).map((p) => p.id)).toEqual([simge.id])

    await setMeta('uid', 'mert')
    await save('programs', { name: 'Upper/Lower · Güç', active: true, template_version: 3 })
    await ensurePerson('mert')
    const mert = (await db.programs.where('user_id').equals('mert').toArray()).filter((p) => p.active)
    expect(mert.map((p) => p.template_version)).toEqual([TEMPLATE_VERSION.guc])
  })
})

describe('weekStatus', () => {
  const day = (id: string, weekday: number, optional = false) =>
    ({ id, user_id: 'mert', updated_at: '', program_id: 'p', position: weekday, name: id, weekday, optional }) as const
  const session = (dayId: string, startedAt: string) =>
    ({ id: crypto.randomUUID(), user_id: 'mert', updated_at: '', program_day_id: dayId, day_name: dayId, started_at: startedAt, ended_at: startedAt, note: '' }) as const

  it('marks missed days and credits a make-up session to the day it belongs to', () => {
    const days = [day('mon', 1), day('tue', 2), day('wed', 3), day('thu', 4), day('sun', 7, true)]
    // Thursday 2026-10-15; Monday done on Monday, Tuesday made up on Wednesday.
    const now = new Date(2026, 9, 15, 10, 0)
    const sessions = [session('mon', new Date(2026, 9, 12, 8).toISOString()), session('tue', new Date(2026, 9, 14, 8).toISOString())]
    const st = weekStatus(days, sessions, now)
    expect(st.get('mon')).toBe('done')
    expect(st.get('tue')).toBe('done')
    expect(st.get('wed')).toBe('missed')
    expect(st.get('thu')).toBe('today')
    expect(st.get('sun')).toBe('upcoming')
  })

  it('does not count days before the program started as missed', () => {
    const days = [day('mon', 1), day('tue', 2), day('wed', 3)]
    const now = new Date(2026, 9, 15, 10, 0)
    const st = weekStatus(days, [], now, new Date(2026, 9, 13, 20, 0))
    expect(st.get('mon')).toBe('before-start')
    expect(st.get('tue')).toBe('missed')
    expect(st.get('wed')).toBe('missed')
  })

  it('ignores sessions from last week and unfinished ones', () => {
    const days = [day('mon', 1)]
    const now = new Date(2026, 9, 15, 10, 0)
    const lastWeek = session('mon', new Date(2026, 9, 5, 8).toISOString())
    const open = { ...session('mon', new Date(2026, 9, 12, 8).toISOString()), ended_at: null }
    expect(weekStatus(days, [lastWeek, open], now).get('mon')).toBe('missed')
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
