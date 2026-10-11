import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card, cx, Page } from '../components/ui'
import { SyncBadge } from '../components/SyncBadge'
import { alive, db } from '../lib/db'
import { exerciseName, useExercises } from '../lib/exercises'
import type { ProgramDay } from '../lib/types'
import { useBodyWeights, useProfile, useUid } from '../lib/user'
import {
  activeProgram,
  dayItems,
  estimateMinutes,
  formatKg,
  isoWeekday,
  localDate,
  openSession,
  programDays,
  repRange,
  startSession,
  weekStatus,
  type DayStatus,
} from '../lib/workout'

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

const STATUS_LABEL: Record<DayStatus, string> = {
  done: 'Yapıldı',
  today: 'Bugün',
  missed: 'Kaçırıldı',
  skipped: 'Atlandı',
  upcoming: '',
  unscheduled: '',
  'before-start': '',
}

export default function TodayPage() {
  const uid = useUid()
  const profile = useProfile()
  const weights = useBodyWeights()
  const exercises = useExercises()
  const navigate = useNavigate()
  const [picked, setPicked] = useState<string | null>(null)
  const today = isoWeekday()

  const data = useLiveQuery(async () => {
    const program = await activeProgram(uid)
    const days = program ? await programDays(program.id) : []
    const items = new Map(await Promise.all(days.map(async (d) => [d.id, await dayItems(d.id)] as const)))
    const open = await openSession(uid)
    const sessions = alive(await db.sessions.where('user_id').equals(uid).toArray())
    return { days, items, open, status: weekStatus(days, sessions, new Date(), program ? new Date(program.updated_at) : undefined) }
  }, [uid, today])

  async function begin(day: ProgramDay | null) {
    if (data?.open) {
      navigate(`/seans/${data.open.id}`)
      return
    }
    const s = await startSession(day)
    navigate(`/seans/${s.id}`)
  }

  const lastWeight = weights?.at(-1)
  const todayDay = data?.days.find((d) => d.weekday === today) ?? null
  // Default focus: today's workout unless it is done, then the first missed one.
  const defaultDay =
    (todayDay && data?.status.get(todayDay.id) !== 'done' ? todayDay : null) ??
    data?.days.find((d) => data.status.get(d.id) === 'missed') ??
    todayDay
  const selected = data?.days.find((d) => d.id === picked) ?? defaultDay
  const selectedStatus = selected ? data?.status.get(selected.id) : undefined
  const selectedItems = selected ? (data?.items.get(selected.id) ?? []) : []
  const missed = data?.days.filter((d) => data.status.get(d.id) === 'missed') ?? []

  return (
    <Page
      title={profile ? `Merhaba, ${profile.name}` : 'Bugün'}
      action={
        <div className="flex items-center gap-2">
          <SyncBadge />
          <Link to="/ayarlar" className="rounded-full p-2 text-slate-400" aria-label="Ayarlar">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
            </svg>
          </Link>
        </div>
      }
    >
      {data?.open && (
        <Card onClick={() => navigate(`/seans/${data.open!.id}`)} tone="accent" className="mb-4">
          <div className="text-sm text-emerald-300">Devam eden antrenman</div>
          <div className="font-semibold text-white">{data.open.day_name}</div>
        </Card>
      )}

      <div className="mb-4 flex justify-between gap-1">
        {WEEKDAYS.map((label, i) => {
          const wd = i + 1
          const day = data?.days.find((x) => x.weekday === wd)
          const st = day ? data?.status.get(day.id) : undefined
          const isSelected = !!day && day.id === selected?.id
          return (
            <button
              key={label}
              disabled={!day}
              onClick={() => day && setPicked(day.id)}
              className="flex flex-1 flex-col items-center gap-1"
              aria-label={day ? `${day.name} ${STATUS_LABEL[st ?? 'upcoming']}` : label}
            >
              <span className={cx('text-xs', wd === today ? 'font-bold text-white' : 'text-slate-500')}>{label}</span>
              <span
                className={cx(
                  'flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold',
                  st === 'done' && 'bg-accent-strong text-slate-950',
                  st === 'missed' && 'border-2 border-amber-400 text-amber-300',
                  (st === 'today' || st === 'upcoming' || st === 'skipped' || st === 'before-start') && (day?.optional ? 'border border-dashed border-slate-600' : 'border border-slate-500'),
                  !day && 'bg-slate-800/50',
                  isSelected && 'ring-2 ring-accent ring-offset-2 ring-offset-[#0b1120]',
                )}
              >
                {st === 'done' ? '✓' : st === 'missed' ? '!' : ''}
              </span>
            </button>
          )
        })}
      </div>

      {data && selected && (
        <Card className="mb-4">
          <div className={cx('text-sm', selectedStatus === 'missed' ? 'text-amber-300' : 'text-slate-400')}>
            {selectedStatus === 'today'
              ? 'Bugünün antrenmanı'
              : selectedStatus === 'missed'
                ? 'Kaçırılan antrenman · bugün yapabilirsin'
                : selectedStatus === 'done'
                  ? 'Bu hafta yapıldı ✓'
                  : 'Seçili antrenman'}
            {selected.optional && ' · isteğe bağlı'}
          </div>
          <div className="text-lg font-bold text-white">{selected.name}</div>
          {profile && <div className="mb-3 text-xs text-slate-500">≈ {estimateMinutes(selectedItems, profile.plan_key)} dk</div>}
          <ul className="mb-4 space-y-1.5">
            {selectedItems.map((it) => (
              <li key={it.id} className="flex justify-between gap-3 text-sm">
                <span className="text-slate-200">{exerciseName(exercises, it.exercise_id)}</span>
                <span className="shrink-0 text-slate-500">
                  {it.block === 'cardio' ? `${it.duration_min ?? ''} dk` : `${it.sets}×${repRange(it)}`}
                </span>
              </li>
            ))}
          </ul>
          <Button className="w-full" onClick={() => begin(selected)}>
            {data.open ? 'Devam eden antrenmana dön' : selectedStatus === 'done' ? 'Tekrar yap' : 'Antrenmanı başlat'}
          </Button>
        </Card>
      )}
      {data && !selected && (
        <Card className="mb-4">
          <div className="text-lg font-bold text-white">Bugün dinlenme günü 😌</div>
          <p className="mt-1 text-sm text-slate-400">Aşağıdan haftanın herhangi bir antrenmanını başlatabilirsin.</p>
        </Card>
      )}

      {missed.length > 0 && selectedStatus !== 'missed' && (
        <Card tone="warn" className="mb-4">
          <div className="text-sm font-semibold text-amber-300">Bu hafta kaçırılan</div>
          {missed.map((d) => (
            <button key={d.id} onClick={() => setPicked(d.id)} className="mt-1 block text-left text-sm text-slate-200 underline-offset-4 hover:underline">
              {d.name}
            </button>
          ))}
        </Card>
      )}

      <h2 className="mb-2 text-sm font-semibold text-slate-300">Bu haftanın programı</h2>
      <div className="mb-4 space-y-2">
        {data?.days.map((d) => {
          const st = data.status.get(d.id) ?? 'upcoming'
          return (
            <Card key={d.id} onClick={() => setPicked(d.id)} className={cx('py-3', d.id === selected?.id && 'ring-1 ring-accent/60')}>
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-slate-200">{d.name}</span>
                {STATUS_LABEL[st] && (
                  <span
                    className={cx(
                      'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                      st === 'done' && 'bg-emerald-500/15 text-emerald-300',
                      st === 'missed' && 'bg-amber-500/15 text-amber-300',
                      st === 'today' && 'bg-sky-500/15 text-sky-300',
                      st === 'skipped' && 'bg-slate-700 text-slate-400',
                    )}
                  >
                    {STATUS_LABEL[st]}
                  </span>
                )}
              </div>
            </Card>
          )
        })}
        <button onClick={() => begin(null)} className="w-full py-2 text-sm text-slate-500">
          + Serbest antrenman (boş)
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card onClick={() => navigate('/ilerleme?tab=vucut')}>
          <div className="text-xs text-slate-400">Vücut ağırlığı</div>
          <div className="text-xl font-bold text-white">{lastWeight ? `${formatKg(lastWeight.kg)} kg` : '—'}</div>
          <div className="text-xs text-slate-500">
            {lastWeight ? (lastWeight.date === localDate() ? 'bugün' : lastWeight.date.split('-').reverse().join('.')) : 'kayıt yok'}
          </div>
        </Card>
        <Card onClick={() => navigate('/beslenme')}>
          <div className="text-xs text-slate-400">Günlük hedef</div>
          <div className="text-xl font-bold text-white">{profile?.kcal_target ?? '—'} kcal</div>
          <div className="text-xs text-slate-500">{profile?.protein_target ?? '—'} g protein</div>
        </Card>
      </div>
    </Page>
  )
}
