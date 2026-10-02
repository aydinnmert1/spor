import { useLiveQuery } from 'dexie-react-hooks'
import { createContext, useContext } from 'react'
import { calcTargets } from '../data/nutrition'
import { alive, db } from './db'
import type { BodyWeight, Profile } from './types'

export const UidContext = createContext<string>('local')

export function useUid(): string {
  return useContext(UidContext)
}

/** undefined while loading, null when the user has no profile yet */
export function useProfile(): Profile | null | undefined {
  const uid = useUid()
  return useLiveQuery(async () => alive(await db.profiles.where('user_id').equals(uid).toArray())[0] ?? null, [uid])
}

export function useBodyWeights(): BodyWeight[] | undefined {
  const uid = useUid()
  return useLiveQuery(
    async () => alive(await db.body_weights.where('user_id').equals(uid).toArray()).sort((a, b) => a.date.localeCompare(b.date)),
    [uid],
  )
}

export function ageOf(p: Pick<Profile, 'birth_year'>): number {
  return new Date().getFullYear() - p.birth_year
}

export function targetsFor(p: Profile, weightKg: number) {
  return calcTargets({ sex: p.sex, age: ageOf(p), height_cm: p.height_cm, weight_kg: weightKg, plan: p.plan_key })
}
