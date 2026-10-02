// Every synced row carries these fields. `user_id` is the Supabase auth uid,
// or LOCAL_USER while the app runs without a cloud account.
export interface Row {
  id: string
  user_id: string
  updated_at: string
  deleted?: boolean
}

export type Sex = 'male' | 'female'
export type PlanKey = 'guc' | 'sikilasma'

export interface Profile extends Row {
  name: string
  sex: Sex
  birth_year: number
  height_cm: number
  plan_key: PlanKey
  kcal_target: number
  protein_target: number
}

export interface Program extends Row {
  name: string
  active: boolean
}

export interface ProgramDay extends Row {
  program_id: string
  position: number
  name: string
  /** 1 = Monday ... 7 = Sunday, null = not tied to a weekday */
  weekday: number | null
  optional: boolean
}

export type Block = 'main' | 'accessory' | 'cardio'

export interface ProgramItem extends Row {
  day_id: string
  position: number
  exercise_id: string
  block: Block
  sets: number
  rep_min: number
  rep_max: number
  rest_sec: number
  /** Cardio items: target minutes */
  duration_min: number | null
  note: string
}

export interface ExerciseNote extends Row {
  exercise_id: string
  youtube_url: string
  note: string
}

export interface Session extends Row {
  program_day_id: string | null
  day_name: string
  started_at: string
  ended_at: string | null
  note: string
}

export interface SetLog extends Row {
  session_id: string
  exercise_id: string
  item_id: string | null
  set_no: number
  weight_kg: number
  reps: number
  done_at: string
}

export interface CardioLog extends Row {
  session_id: string
  exercise_id: string
  item_id: string | null
  duration_min: number
  distance_km: number | null
  note: string
  done_at: string
}

export interface BodyWeight extends Row {
  date: string
  kg: number
}

export interface BodyMeasurement extends Row {
  date: string
  waist: number | null
  hip: number | null
  chest: number | null
  arm: number | null
  thigh: number | null
  shoulder: number | null
}

export interface TableRows {
  profiles: Profile
  programs: Program
  program_days: ProgramDay
  program_items: ProgramItem
  exercise_notes: ExerciseNote
  sessions: Session
  set_logs: SetLog
  cardio_logs: CardioLog
  body_weights: BodyWeight
  body_measurements: BodyMeasurement
}

export type TableName = keyof TableRows

export const SYNC_TABLES: TableName[] = [
  'profiles',
  'programs',
  'program_days',
  'program_items',
  'exercise_notes',
  'sessions',
  'set_logs',
  'cardio_logs',
  'body_weights',
  'body_measurements',
]

/** Fields the caller supplies when saving; bookkeeping fields are filled in by `save`. */
export type Draft<T extends Row> = Omit<T, 'user_id' | 'updated_at' | 'id'> & { id?: string }
