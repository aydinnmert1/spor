import type { SupabaseClient } from '@supabase/supabase-js'
import { useSyncExternalStore } from 'react'
import { db, getMeta, LOCAL_USER, onLocalWrite, setMeta, table } from './db'
import { SYNC_TABLES, type Row, type TableName } from './types'

export type SyncStatus = 'local' | 'idle' | 'syncing' | 'offline' | 'error'

interface SyncState {
  status: SyncStatus
  pending: number
  lastSync: string | null
  error: string | null
}

let state: SyncState = { status: 'local', pending: 0, lastSync: null, error: null }
const subscribers = new Set<() => void>()

function setState(patch: Partial<SyncState>) {
  state = { ...state, ...patch }
  subscribers.forEach((fn) => fn())
}

export function useSyncState(): SyncState {
  return useSyncExternalStore(
    (fn) => {
      subscribers.add(fn)
      return () => subscribers.delete(fn)
    },
    () => state,
  )
}

const PAGE = 1000

/** Upload queued local changes. Entries are removed only after the server accepted them. */
export async function pushOutbox(client: SupabaseClient): Promise<void> {
  const entries = await db.outbox.orderBy('seq').toArray()
  if (entries.length === 0) return
  const maxSeq = entries[entries.length - 1].seq!
  const idsByTable = new Map<TableName, Set<string>>()
  for (const e of entries) {
    if (!idsByTable.has(e.table)) idsByTable.set(e.table, new Set())
    idsByTable.get(e.table)!.add(e.row_id)
  }
  for (const [name, ids] of idsByTable) {
    const rows = (await table(name).bulkGet([...ids])).filter((r): r is NonNullable<typeof r> => !!r)
    // Rows written before sign-in still carry the local placeholder id; never upload those.
    const uploadable = rows.filter((r) => r.user_id !== LOCAL_USER)
    for (let i = 0; i < uploadable.length; i += PAGE) {
      const { error } = await client.from(name).upsert(uploadable.slice(i, i + PAGE), { onConflict: 'id' })
      if (error) throw new Error(`${name}: ${error.message}`)
    }
  }
  await db.outbox.where('seq').belowOrEqual(maxSeq).delete()
}

/** Merge a remote row into the local store; the newer `updated_at` wins. */
export async function mergeRemote(name: TableName, remote: Row): Promise<boolean> {
  const local = await table(name).get(remote.id)
  // Postgres returns "+00:00" offsets while the client writes "Z", so compare as instants.
  const remoteTime = Date.parse(remote.updated_at)
  if (local && Date.parse(local.updated_at) > remoteTime) return false
  await table(name).put({ ...remote, updated_at: new Date(remoteTime).toISOString() } as never)
  return true
}

/**
 * Download rows changed on the server since the last pull. The account is
 * shared by both people, so this fetches both; screens filter by person.
 */
export async function pull(client: SupabaseClient): Promise<void> {
  for (const name of SYNC_TABLES) {
    const metaKey = `pull:${name}`
    let since = (await getMeta<string>(metaKey)) ?? '1970-01-01T00:00:00Z'
    for (;;) {
      const { data, error } = await client
        .from(name)
        .select('*')
        .gt('updated_at', since)
        .order('updated_at')
        .limit(PAGE)
      if (error) throw new Error(`${name}: ${error.message}`)
      if (!data || data.length === 0) break
      for (const { owner: _owner, ...row } of data as (Row & { owner?: string })[]) await mergeRemote(name, row)
      since = (data[data.length - 1] as Row).updated_at
      await setMeta(metaKey, since)
      if (data.length < PAGE) break
    }
  }
}

/** Hand rows created before a person was chosen (older app versions) over to that person and queue them. */
export async function adoptLocalData(uid: string): Promise<number> {
  let count = 0
  await db.transaction('rw', [...SYNC_TABLES.map((n) => db.table(n)), db.outbox], async () => {
    for (const name of SYNC_TABLES) {
      const rows = await table(name).where('user_id').equals(LOCAL_USER).toArray()
      for (const row of rows) {
        const adopted = { ...row, user_id: uid, updated_at: new Date().toISOString() }
        // The profile row is keyed by user id.
        if (name === 'profiles') {
          await table(name).delete(row.id)
          adopted.id = uid
        }
        await table(name).put(adopted as never)
        await db.outbox.add({ table: name, row_id: adopted.id })
        count++
      }
    }
  })
  return count
}

let running: Promise<void> | null = null

/** `client` is null when there is no cloud project or no signed-in account. */
export async function syncNow(client: SupabaseClient | null): Promise<void> {
  if (!client) {
    setState({ status: 'local', pending: await db.outbox.count() })
    return
  }
  if (running) return running
  running = (async () => {
    if (!navigator.onLine) {
      setState({ status: 'offline', pending: await db.outbox.count() })
      return
    }
    setState({ status: 'syncing' })
    try {
      await pushOutbox(client)
      await pull(client)
      setState({ status: 'idle', lastSync: new Date().toISOString(), error: null, pending: await db.outbox.count() })
    } catch (e) {
      setState({ status: 'error', error: e instanceof Error ? e.message : String(e), pending: await db.outbox.count() })
    }
  })().finally(() => {
    running = null
  })
  return running
}

/** Keep syncing in the background: on local writes (debounced), when back online, and every minute. */
export function startSyncLoop(client: SupabaseClient | null): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined
  const soon = () => {
    clearTimeout(timer)
    timer = setTimeout(() => void syncNow(client), 1500)
  }
  const now = () => void syncNow(client)
  const offWrite = onLocalWrite(soon)
  window.addEventListener('online', now)
  document.addEventListener('visibilitychange', now)
  const interval = setInterval(now, 60_000)
  now()
  return () => {
    offWrite()
    clearTimeout(timer)
    clearInterval(interval)
    window.removeEventListener('online', now)
    document.removeEventListener('visibilitychange', now)
  }
}
