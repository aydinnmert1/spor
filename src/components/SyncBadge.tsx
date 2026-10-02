import { useSyncState } from '../lib/sync'
import { cx } from './ui'

const LABEL = {
  local: 'Yerel',
  idle: 'Senkron',
  syncing: 'Eşitleniyor',
  offline: 'Çevrimdışı',
  error: 'Hata',
} as const

export function SyncBadge() {
  const s = useSyncState()
  return (
    <span
      className={cx(
        'rounded-full px-2.5 py-1 text-[11px] font-semibold',
        s.status === 'idle' && 'bg-emerald-500/15 text-emerald-300',
        s.status === 'syncing' && 'bg-sky-500/15 text-sky-300',
        s.status === 'offline' && 'bg-amber-500/15 text-amber-300',
        s.status === 'error' && 'bg-red-500/15 text-red-300',
        s.status === 'local' && 'bg-slate-700 text-slate-300',
      )}
      title={s.error ?? undefined}
    >
      {LABEL[s.status]}
      {s.pending > 0 && s.status !== 'local' ? ` · ${s.pending}` : ''}
    </span>
  )
}
