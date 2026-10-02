import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card, cx, Page } from '../components/ui'
import { SyncBadge } from '../components/SyncBadge'
import { alive, db } from '../lib/db'
import { exerciseName, useExercises } from '../lib/exercises'
import type { ProgramDay } from '../lib/types'
import { useBodyWeights, useProfile, useUid } from '../lib/user'
import { activeProgram, dayItems, formatKg, isoWeekday, localDate, openSession, programDays, repRange, startSession } from '../lib/workout'

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']

export default function TodayPage() {
  const uid = useUid()
  const profile = useProfile()
  const weights = useBodyWeights()
  const exercises = useExercises()
  const navigate = useNavigate()
  const [showOthers, setShowOthers] = useState(false)
  const today = isoWeekday()

  const data = useLiveQuery(async () => {
    const program = await activeProgram(uid)
    const days = program ? await programDays(program.id) : []
    const todayDay = days.find((d) => d.weekday === today) ?? null
    const items = todayDay ? await dayItems(todayDay.id) : []
    const open = await openSession(uid)
    const monday = new Date()
    monday.setHours(0, 0, 0, 0)
    monday.setDate(monday.getDate() - (today - 1))
    const week = alive(await db.sessions.where('user_id').equals(uid).toArray()).filter(
      (s) => s.ended_at && new Date(s.started_at) >= monday,
    )
    return { days, todayDay, items, open, doneWeekdays: new Set(week.map((s) => isoWeekday(new Date(s.started_at)))) }
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
  const doneToday = data?.doneWeekdays.has(today)

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
        {WEEKDAYS.map((d, i) => {
          const wd = i + 1
          const day = data?.days.find((x) => x.weekday === wd)
          const done = data?.doneWeekdays.has(wd)
          return (
            <div key={d} className="flex flex-1 flex-col items-center gap-1">
              <span className={cx('text-xs', wd === today ? 'font-bold text-white' : 'text-slate-500')}>{d}</span>
              <span
                className={cx(
                  'flex h-9 w-9 items-center justify-center rounded-full text-sm',
                  done ? 'bg-accent-strong text-slate-950' : day ? (day.optional ? 'border border-dashed border-slate-600' : 'border border-slate-500') : 'bg-slate-800/50',
                  wd === today && !done && 'ring-2 ring-accent',
                )}
              >
                {done ? '✓' : ''}
              </span>
            </div>
          )
        })}
      </div>

      {data && (
        <Card className="mb-4">
          {data.todayDay ? (
            <>
              <div className="text-sm text-slate-400">Bugünün antrenmanı{data.todayDay.optional && ' · isteğe bağlı'}</div>
              <div className="mb-3 text-lg font-bold text-white">{data.todayDay.name}</div>
              <ul className="mb-4 space-y-1.5">
                {data.items.map((it) => (
                  <li key={it.id} className="flex justify-between gap-3 text-sm">
                    <span className="text-slate-200">{exerciseName(exercises, it.exercise_id)}</span>
                    <span className="shrink-0 text-slate-500">
                      {it.block === 'cardio' ? `${it.duration_min ?? ''} dk` : `${it.sets}×${repRange(it)}`}
                    </span>
                  </li>
                ))}
              </ul>
              <Button className="w-full" onClick={() => begin(data.todayDay)}>
                {data.open ? 'Antrenmana dön' : doneToday ? 'Tekrar başlat' : 'Antrenmanı başlat'}
              </Button>
            </>
          ) : (
            <>
              <div className="text-lg font-bold text-white">Bugün dinlenme günü 😌</div>
              <p className="mt-1 text-sm text-slate-400">Programında bugün için antrenman yok. İstersen aşağıdan başka bir gün başlat.</p>
            </>
          )}
        </Card>
      )}

      <button onClick={() => setShowOthers((v) => !v)} className="mb-2 text-sm font-semibold text-slate-300">
        {showOthers ? '▾' : '▸'} Başka bir antrenman başlat
      </button>
      {showOthers && data && (
        <div className="mb-4 space-y-2">
          {data.days
            .filter((d) => d.id !== data.todayDay?.id)
            .map((d) => (
              <Card key={d.id} onClick={() => begin(d)} className="py-3">
                <span className="text-slate-200">{d.name}</span>
              </Card>
            ))}
          <Card onClick={() => begin(null)} className="py-3">
            <span className="text-slate-200">Serbest antrenman (boş)</span>
          </Card>
        </div>
      )}

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
