import type { PlanKey, Sex } from '../lib/types'

// The app has exactly two users. Picking one on first launch replaces any
// sign-up form; their row key (`user_id`) is the person key below.

export type PersonKey = 'mert' | 'simge'

export interface Person {
  key: PersonKey
  name: string
  sex: Sex
  birth_year: number
  height_cm: number
  start_weight_kg: number
  plan: PlanKey
}

export const PEOPLE: Record<PersonKey, Person> = {
  mert: { key: 'mert', name: 'Mert', sex: 'male', birth_year: 1997, height_cm: 170, start_weight_kg: 70, plan: 'guc' },
  simge: { key: 'simge', name: 'Simge', sex: 'female', birth_year: 1996, height_cm: 170, start_weight_kg: 70, plan: 'sikilasma' },
}

export function isPersonKey(v: unknown): v is PersonKey {
  return v === 'mert' || v === 'simge'
}
