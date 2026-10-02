import { useLiveQuery } from 'dexie-react-hooks'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ExerciseInfo } from '../components/ExerciseInfo'
import { ExerciseList } from '../components/ExercisePicker'
import { primeAudio, RestTimer, type RestState } from '../components/RestTimer'
import { BLOCK_LABEL, Button, Card, cx, Empty, Field, Input, parseNum, Sheet } from '../components/ui'
import { alive, db, remove, save } from '../lib/db'
import { exerciseName, useExercises } from '../lib/exercises'
import type { CardioLog, ProgramItem, Session, SetLog } from '../lib/types'
import { dayItems, formatDuration, formatKg, previousSets, repRange } from '../lib/workout'

interface Entry {
  key: string
  exerciseId: string
  item: ProgramItem | null
  cardio: boolean
}

function readLocal<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}

function writeLocal(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage may be unavailable (private mode); state still works in memory.
  }
}

function useWakeLock() {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null
    const request = async () => {
      try {
        if (document.visibilityState === 'visible') lock = await navigator.wakeLock?.request('screen')
      } catch {
        // Not supported or denied; the screen may dim, nothing else breaks.
      }
    }
    void request()
    document.addEventListener('visibilitychange', request)
    return () => {
      document.removeEventListener('visibilitychange', request)
      void lock?.release()
    }
  }, [])
}

export default function SessionPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const exercises = useExercises()
  useWakeLock()

  const data = useLiveQuery(async () => {
    const session = (await db.sessions.get(id)) ?? null
    if (!session || session.deleted) return { session: null, items: [], sets: [], cardio: [] }
    const items = session.program_day_id ? await dayItems(session.program_day_id) : []
    const sets = alive(await db.set_logs.where('session_id').equals(id).toArray())
    const cardio = alive(await db.cardio_logs.where('session_id').equals(id).toArray())
    return { session, items, sets, cardio }
  }, [id])

  const [extras, setExtras] = useState<string[]>(() => readLocal(`extras:${id}`, []))
  const [rest, setRestState] = useState<RestState | null>(() => readLocal(`rest:${id}`, null))
  const [info, setInfo] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const setRest = useCallback(
    (r: RestState | null) => {
      setRestState(r)
      writeLocal(`rest:${id}`, r)
    },
    [id],
  )

  const startRest = useCallback((sec: number) => sec > 0 && setRest({ endsAt: Date.now() + sec * 1000, total: sec }), [setRest])

  const entries = useMemo<Entry[]>(() => {
    if (!data?.session) return []
    const list: Entry[] = data.items.map((it) => ({ key: it.id, exerciseId: it.exercise_id, item: it, cardio: it.block === 'cardio' }))
    // Exercises added during the session: from logs (survive reloads) and from this device's list.
    const adHoc: string[] = []
    for (const l of [...data.sets, ...data.cardio].sort((a, b) => a.done_at.localeCompare(b.done_at))) {
      if (!l.item_id && !adHoc.includes(l.exercise_id)) adHoc.push(l.exercise_id)
    }
    for (const e of extras) if (!adHoc.includes(e)) adHoc.push(e)
    for (const exId of adHoc) {
      list.push({
        key: `x-${exId}`,
        exerciseId: exId,
        item: null,
        cardio: exercises?.get(exId)?.category === 'cardio' || data.cardio.some((c) => c.exercise_id === exId && !c.item_id),
      })
    }
    return list
  }, [data, extras, exercises])

  if (!data) return null
  if (!data.session) {
    return (
      <div className="pt-safe px-4">
        <Empty>Antrenman bulunamadı.</Empty>
        <Button variant="secondary" className="w-full" onClick={() => navigate('/')}>Ana sayfa</Button>
      </div>
    )
  }

  const session = data.session
  const totalSets = data.sets.length
  const volume = data.sets.reduce((s, l) => s + l.weight_kg * l.reps, 0)

  function addExtra(exId: string) {
    const next = [...extras.filter((e) => e !== exId), exId]
    setExtras(next)
    writeLocal(`extras:${id}`, next)
    setAdding(false)
  }

  async function finish() {
    await save('sessions', { ...session, ended_at: new Date().toISOString() })
    setRest(null)
    writeLocal(`extras:${id}`, null)
    navigate(`/gecmis/${id}?bitti=1`, { replace: true })
  }

  async function discard() {
    for (const s of data!.sets) await remove('set_logs', s.id)
    for (const c of data!.cardio) await remove('cardio_logs', c.id)
    await remove('sessions', session.id)
    setRest(null)
    writeLocal(`extras:${id}`, null)
    navigate('/', { replace: true })
  }

  let lastBlock: string | null = null

  return (
    <div className="mx-auto max-w-xl px-4 pb-40">
      <header className="pt-safe sticky top-0 z-30 -mx-4 border-b border-white/5 bg-[#0b1120]/95 px-4 backdrop-blur">
        <div className="flex items-center gap-2 py-3">
          <button onClick={() => navigate('/')} className="-ml-2 p-2 text-2xl leading-none text-slate-400" aria-label="Geri">
            ‹
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate font-bold text-white">{session.day_name}</div>
            <div className="text-xs tabular-nums text-slate-400">
              {formatDuration(now - Date.parse(session.started_at))} · {totalSets} set · {formatKg(Math.round(volume))} kg hacim
            </div>
          </div>
          <Button onClick={() => setFinishing(true)} className="min-h-9 px-3 py-1.5 text-sm">
            Bitir
          </Button>
        </div>
      </header>

      <div className="space-y-3 pt-4">
        {entries.map((e) => {
          const block = e.item?.block ?? (e.cardio ? 'cardio' : 'accessory')
          const header = block !== lastBlock && e.item ? BLOCK_LABEL[block] : null
          lastBlock = block
          return (
            <div key={e.key}>
              {header && <div className="mb-2 mt-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{header}</div>}
              {e.cardio ? (
                <CardioCard
                  session={session}
                  entry={e}
                  name={exerciseName(exercises, e.exerciseId)}
                  logs={data.cardio.filter((c) => c.exercise_id === e.exerciseId && c.item_id === (e.item?.id ?? null))}
                  onInfo={() => setInfo(e.exerciseId)}
                />
              ) : (
                <StrengthCard
                  session={session}
                  entry={e}
                  name={exerciseName(exercises, e.exerciseId)}
                  logs={data.sets
                    .filter((s) => s.exercise_id === e.exerciseId && s.item_id === (e.item?.id ?? null))
                    .sort((a, b) => a.set_no - b.set_no)}
                  onInfo={() => setInfo(e.exerciseId)}
                  onLogged={(sec) => {
                    primeAudio()
                    startRest(sec)
                  }}
                />
              )}
            </div>
          )
        })}

        <Button variant="secondary" className="w-full" onClick={() => setAdding(true)}>
          + Hareket ekle
        </Button>
      </div>

      <RestTimer rest={rest} onChange={setRest} />

      <Sheet open={!!info} onClose={() => setInfo(null)} title={info ? exerciseName(exercises, info) : ''}>
        {info && exercises?.get(info) ? <ExerciseInfo ex={exercises.get(info)!} /> : <Empty>Yükleniyor…</Empty>}
        <div className="h-6" />
      </Sheet>

      <Sheet open={adding} onClose={() => setAdding(false)} title="Hareket ekle">
        <ExerciseList onPick={(ex) => addExtra(ex.id)} />
      </Sheet>

      <Sheet open={finishing} onClose={() => setFinishing(false)} title="Antrenmanı bitir">
        <p className="mb-4 text-sm text-slate-300">
          {totalSets} set{data.cardio.length > 0 && `, ${data.cardio.length} kardiyo`} kaydedildi. Süre {formatDuration(now - Date.parse(session.started_at))}.
        </p>
        <div className="space-y-2 pb-4">
          <Button className="w-full" onClick={finish}>Bitir ve kaydet</Button>
          <Button variant="secondary" className="w-full" onClick={() => setFinishing(false)}>Devam et</Button>
          <Button variant="danger" className="w-full" onClick={() => confirm('Bu antrenman ve tüm setleri silinsin mi?') && void discard()}>
            Antrenmanı sil
          </Button>
        </div>
      </Sheet>
    </div>
  )
}

function ExerciseHeader({ name, item, onInfo }: { name: string; item: ProgramItem | null; onInfo: () => void }) {
  return (
    <div className="mb-3">
      <button onClick={onInfo} className="flex w-full items-start justify-between gap-2 text-left">
        <span className="text-base font-bold text-white">{name}</span>
        <span className="mt-0.5 shrink-0 rounded-full bg-slate-700 px-2 py-0.5 text-[11px] font-semibold text-slate-300">Nasıl?</span>
      </button>
      {item && (
        <div className="mt-0.5 text-sm text-slate-400">
          {item.block === 'cardio'
            ? `${item.duration_min ?? '—'} dk`
            : `Hedef ${item.sets} × ${repRange(item)} · dinlenme ${formatDuration(item.rest_sec * 1000)}`}
        </div>
      )}
      {item?.note && <div className="mt-1 text-xs text-amber-200/80">{item.note}</div>}
    </div>
  )
}

function StrengthCard({
  session,
  entry,
  name,
  logs,
  onInfo,
  onLogged,
}: {
  session: Session
  entry: Entry
  name: string
  logs: SetLog[]
  onInfo: () => void
  onLogged: (restSec: number) => void
}) {
  const prev = useLiveQuery(() => previousSets(entry.exerciseId, session.id), [entry.exerciseId, session.id])
  const [extra, setExtra] = useState(false)
  const [editing, setEditing] = useState<SetLog | null>(null)
  const target = entry.item?.sets ?? 3
  const done = logs.length >= target
  const showRow = !done || extra

  const n = logs.length
  const defaultKg = logs.at(-1)?.weight_kg ?? prev?.[n]?.weight_kg ?? prev?.at(-1)?.weight_kg
  const defaultReps = prev?.[n]?.reps

  async function log(kg: number, reps: number) {
    await save('set_logs', {
      session_id: session.id,
      exercise_id: entry.exerciseId,
      item_id: entry.item?.id ?? null,
      set_no: n + 1,
      weight_kg: kg,
      reps,
      done_at: new Date().toISOString(),
    })
    setExtra(false)
    onLogged(entry.item?.rest_sec ?? 90)
  }

  return (
    <Card tone={done ? 'done' : 'default'}>
      <ExerciseHeader name={name} item={entry.item} onInfo={onInfo} />
      {prev && prev.length > 0 && (
        <div className="mb-2 text-xs text-slate-500">
          Önceki: {prev.map((p) => `${formatKg(p.weight_kg)}×${p.reps}`).join(' · ')}
        </div>
      )}
      <div className="space-y-1.5">
        {logs.map((l) => (
          <button
            key={l.id}
            onClick={() => setEditing(l)}
            className="flex w-full items-center gap-3 rounded-xl bg-emerald-500/10 px-3 py-2 text-left"
          >
            <span className="w-6 text-sm font-semibold text-emerald-300">{l.set_no}</span>
            <span className="flex-1 font-semibold tabular-nums text-white">
              {formatKg(l.weight_kg)} kg × {l.reps}
            </span>
            <span className="text-emerald-300">✓</span>
          </button>
        ))}
        {showRow && (
          <SetRow
            key={`${n}-${prev ? 'p' : 'x'}`}
            setNo={n + 1}
            extra={n >= target}
            defaultKg={defaultKg}
            defaultReps={defaultReps}
            placeholderReps={entry.item ? repRange(entry.item) : 'tekrar'}
            onLog={log}
          />
        )}
      </div>
      {!showRow && (
        <button onClick={() => setExtra(true)} className="mt-2 text-sm font-semibold text-slate-400">
          + Set ekle
        </button>
      )}
      <EditSetSheet set={editing} onClose={() => setEditing(null)} />
    </Card>
  )
}

function SetRow({
  setNo,
  extra,
  defaultKg,
  defaultReps,
  placeholderReps,
  onLog,
}: {
  setNo: number
  extra: boolean
  defaultKg?: number
  defaultReps?: number
  placeholderReps: string
  onLog: (kg: number, reps: number) => void
}) {
  const [kg, setKg] = useState(defaultKg !== undefined ? String(defaultKg).replace('.', ',') : '')
  const [reps, setReps] = useState(defaultReps !== undefined ? String(defaultReps) : '')
  const kgNum = parseNum(kg)
  const repsNum = parseNum(reps)
  const valid = kgNum !== null && kgNum >= 0 && repsNum !== null && repsNum > 0

  const step = (d: number) => setKg(String(Math.max(0, (kgNum ?? 0) + d)).replace('.', ','))

  return (
    <div className="grid grid-cols-[1.25rem_2.25rem_minmax(0,1.3fr)_2.25rem_minmax(0,1fr)_2.75rem] items-center gap-1.5 rounded-xl bg-slate-900/80 p-2">
      <span className={cx('text-center text-sm font-semibold', extra ? 'text-amber-300' : 'text-slate-400')}>{setNo}</span>
      <button onClick={() => step(-2.5)} className="h-10 rounded-lg bg-slate-800 text-slate-300" aria-label="2,5 kg azalt">
        −
      </button>
      <Input value={kg} onChange={(e) => setKg(e.target.value)} inputMode="decimal" placeholder="kg" className="px-1 py-2 text-center font-semibold" />
      <button onClick={() => step(2.5)} className="h-10 rounded-lg bg-slate-800 text-slate-300" aria-label="2,5 kg artır">
        +
      </button>
      <Input
        value={reps}
        onChange={(e) => setReps(e.target.value)}
        inputMode="numeric"
        placeholder={placeholderReps}
        className="px-1 py-2 text-center font-semibold"
      />
      <button
        disabled={!valid}
        onClick={() => valid && onLog(kgNum!, Math.round(repsNum!))}
        className="h-10 rounded-xl bg-accent-strong text-lg font-bold text-slate-950 disabled:bg-slate-700 disabled:text-slate-500"
        aria-label="Seti kaydet"
      >
        ✓
      </button>
    </div>
  )
}

function EditSetSheet({ set, onClose }: { set: SetLog | null; onClose: () => void }) {
  const [kg, setKg] = useState('')
  const [reps, setReps] = useState('')
  useEffect(() => {
    if (set) {
      setKg(String(set.weight_kg).replace('.', ','))
      setReps(String(set.reps))
    }
  }, [set])
  if (!set) return null
  const kgNum = parseNum(kg)
  const repsNum = parseNum(reps)
  return (
    <Sheet open onClose={onClose} title={`${set.set_no}. set`}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Kilo (kg)">
          <Input value={kg} onChange={(e) => setKg(e.target.value)} inputMode="decimal" />
        </Field>
        <Field label="Tekrar">
          <Input value={reps} onChange={(e) => setReps(e.target.value)} inputMode="numeric" />
        </Field>
      </div>
      <div className="space-y-2 py-4">
        <Button
          className="w-full"
          disabled={kgNum === null || !repsNum}
          onClick={async () => {
            await save('set_logs', { ...set, weight_kg: kgNum!, reps: Math.round(repsNum!) })
            onClose()
          }}
        >
          Kaydet
        </Button>
        <Button
          variant="danger"
          className="w-full"
          onClick={async () => {
            await remove('set_logs', set.id)
            onClose()
          }}
        >
          Seti sil
        </Button>
      </div>
    </Sheet>
  )
}

function CardioCard({
  session,
  entry,
  name,
  logs,
  onInfo,
}: {
  session: Session
  entry: Entry
  name: string
  logs: CardioLog[]
  onInfo: () => void
}) {
  const [minutes, setMinutes] = useState(entry.item?.duration_min ? String(entry.item.duration_min) : '')
  const [km, setKm] = useState('')
  const min = parseNum(minutes)

  async function log() {
    if (!min) return
    await save('cardio_logs', {
      session_id: session.id,
      exercise_id: entry.exerciseId,
      item_id: entry.item?.id ?? null,
      duration_min: min,
      distance_km: parseNum(km),
      note: '',
      done_at: new Date().toISOString(),
    })
    setKm('')
  }

  return (
    <Card tone={logs.length > 0 ? 'done' : 'default'}>
      <ExerciseHeader name={name} item={entry.item} onInfo={onInfo} />
      <div className="space-y-1.5">
        {logs.map((l) => (
          <div key={l.id} className="flex items-center gap-3 rounded-xl bg-emerald-500/10 px-3 py-2">
            <span className="flex-1 font-semibold text-white">
              {formatKg(l.duration_min)} dk{l.distance_km ? ` · ${formatKg(l.distance_km)} km` : ''}
            </span>
            <button onClick={() => remove('cardio_logs', l.id)} className="text-xs text-slate-400">
              sil
            </button>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_2.75rem] items-center gap-2 rounded-xl bg-slate-900/80 p-2">
            <Input value={minutes} onChange={(e) => setMinutes(e.target.value)} inputMode="decimal" placeholder="dk" className="px-2 py-2 text-center font-semibold" />
            <span className="text-sm text-slate-500">dk</span>
            <Input value={km} onChange={(e) => setKm(e.target.value)} inputMode="decimal" placeholder="km" className="px-2 py-2 text-center font-semibold" />
            <span className="text-sm text-slate-500">km</span>
            <button
              disabled={!min}
              onClick={log}
              className="h-10 rounded-xl bg-accent-strong text-lg font-bold text-slate-950 disabled:bg-slate-700 disabled:text-slate-500"
              aria-label="Kardiyoyu kaydet"
            >
              ✓
            </button>
          </div>
        )}
      </div>
    </Card>
  )
}
