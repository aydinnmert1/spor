import Dexie, { type Table } from 'dexie'
import type { Draft, Row, TableName, TableRows } from './types'

export const LOCAL_USER = 'local'

export interface OutboxEntry {
  seq?: number
  table: TableName
  row_id: string
}

export interface Meta {
  key: string
  value: unknown
}

class SporDB extends Dexie {
  profiles!: Table<TableRows['profiles'], string>
  programs!: Table<TableRows['programs'], string>
  program_days!: Table<TableRows['program_days'], string>
  program_items!: Table<TableRows['program_items'], string>
  exercise_notes!: Table<TableRows['exercise_notes'], string>
  sessions!: Table<TableRows['sessions'], string>
  set_logs!: Table<TableRows['set_logs'], string>
  cardio_logs!: Table<TableRows['cardio_logs'], string>
  body_weights!: Table<TableRows['body_weights'], string>
  body_measurements!: Table<TableRows['body_measurements'], string>
  outbox!: Table<OutboxEntry, number>
  meta!: Table<Meta, string>

  constructor() {
    super('spor')
    this.version(1).stores({
      profiles: 'id, user_id',
      programs: 'id, user_id',
      program_days: 'id, user_id, program_id',
      program_items: 'id, user_id, day_id',
      exercise_notes: 'id, user_id, exercise_id',
      sessions: 'id, user_id, started_at, program_day_id',
      set_logs: 'id, user_id, session_id, exercise_id',
      cardio_logs: 'id, user_id, session_id, exercise_id',
      body_weights: 'id, user_id, date',
      body_measurements: 'id, user_id, date',
      outbox: '++seq, table',
      meta: 'key',
    })
  }
}

export const db = new SporDB()

export function table<T extends TableName>(name: T): Table<TableRows[T], string> {
  return db.table(name)
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
  return (await db.meta.get(key))?.value as T | undefined
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  await db.meta.put({ key, value })
}

export async function currentUserId(): Promise<string> {
  return (await getMeta<string>('uid')) ?? LOCAL_USER
}

const listeners = new Set<() => void>()

/** Called after local writes so the sync engine can push soon. */
export function onLocalWrite(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** Insert or update a row locally and queue it for upload. */
export async function save<T extends TableName>(name: T, draft: Draft<TableRows[T]> | TableRows[T]): Promise<TableRows[T]> {
  const user_id = await currentUserId()
  const row = {
    ...draft,
    id: draft.id ?? crypto.randomUUID(),
    user_id,
    updated_at: new Date().toISOString(),
  } as TableRows[T]
  await db.transaction('rw', db.table(name), db.outbox, async () => {
    await table(name).put(row)
    await db.outbox.add({ table: name, row_id: row.id })
  })
  listeners.forEach((fn) => fn())
  return row
}

/** Soft delete so the deletion syncs to other devices. */
export async function remove(name: TableName, id: string): Promise<void> {
  const existing = await table(name).get(id)
  if (!existing) return
  await save(name, { ...existing, deleted: true } as never)
}

export function alive<T extends Row>(rows: T[]): T[] {
  return rows.filter((r) => !r.deleted)
}
