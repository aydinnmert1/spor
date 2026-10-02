import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Button, Card, Empty } from '../components/ui'
import { alive, db, remove } from '../lib/db'
import { exerciseName, useExercises } from '../lib/exercises'
import type { SetLog } from '../lib/types'
import { useUid } from '../lib/user'
import { findPRs, formatDuration, formatKg } from '../lib/workout'

export default function SessionDetailPage() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const justFinished = params.get('bitti') === '1'
  const navigate = useNavigate()
  const uid = useUid()
  const exercises = useExercises()

  const data = useLiveQuery(async () => {
    const session = await db.sessions.get(id)
    if (!session || session.deleted) return null
    const sets = alive(await db.set_logs.where('session_id').equals(id).toArray())
    const cardio = alive(await db.cardio_logs.where('session_id').equals(id).toArray())
    const exIds = [...new Set(sets.map((s) => s.exercise_id))]
    const earlier: SetLog[] = []
    for (const ex of exIds) {
      const logs = await db.set_logs.where('exercise_id').equals(ex).toArray()
      earlier.push(...logs.filter((l) => !l.deleted && l.user_id === uid && l.session_id !== id && l.done_at < session.started_at))
    }
    return { session, sets, cardio, prs: findPRs(sets, earlier) }
  }, [id, uid])

  if (data === undefined) return null
  if (data === null) {
    return (
      <div className="pt-safe px-4">
        <Empty>Antrenman bulunamadı.</Empty>
      </div>
    )
  }

  const { session, sets, cardio, prs } = data
  const groups = new Map<string, SetLog[]>()
  for (const s of [...sets].sort((a, b) => a.done_at.localeCompare(b.done_at))) {
    if (!groups.has(s.exercise_id)) groups.set(s.exercise_id, [])
    groups.get(s.exercise_id)!.push(s)
  }
  const volume = sets.reduce((sum, s) => sum + s.weight_kg * s.reps, 0)
  const duration = session.ended_at ? Date.parse(session.ended_at) - Date.parse(session.started_at) : 0
  const prIds = new Set(prs.map((p) => p.id))

  async function del() {
    if (!confirm('Bu antrenman ve tüm setleri silinsin mi?')) return
    for (const s of sets) await remove('set_logs', s.id)
    for (const c of cardio) await remove('cardio_logs', c.id)
    await remove('sessions', session.id)
    navigate('/ilerleme?tab=gecmis', { replace: true })
  }

  return (
    <div className="mx-auto max-w-xl px-4 pb-28">
      <header className="pt-safe flex items-center gap-2 py-3">
        <button onClick={() => (justFinished ? navigate('/') : navigate(-1))} className="-ml-2 p-2 text-2xl leading-none text-slate-400" aria-label="Geri">
          ‹
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">{session.day_name}</h1>
          <div className="text-xs text-slate-400">
            {new Date(session.started_at).toLocaleString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </header>

      {justFinished && (
        <Card tone="accent" className="mb-4 text-center">
          <div className="text-3xl">💪</div>
          <div className="mt-1 text-lg font-bold text-white">Antrenman tamamlandı!</div>
          {prs.length > 0 && <div className="text-sm text-emerald-300">{prs.length} yeni kişisel rekor</div>}
        </Card>
      )}

      <div className="mb-4 grid grid-cols-3 gap-2">
        <Stat label="Süre" value={session.ended_at ? formatDuration(duration) : 'devam ediyor'} />
        <Stat label="Set" value={String(sets.length)} />
        <Stat label="Hacim" value={`${formatKg(Math.round(volume))} kg`} />
      </div>

      {prs.length > 0 && (
        <Card className="mb-4">
          <h3 className="mb-2 font-semibold text-white">🏆 Kişisel rekorlar</h3>
          {prs.map((p) => (
            <div key={p.id} className="flex justify-between text-sm">
              <span className="text-slate-300">{exerciseName(exercises, p.exercise_id)}</span>
              <span className="font-semibold text-amber-300">
                {formatKg(p.weight_kg)} kg × {p.reps}
              </span>
            </div>
          ))}
        </Card>
      )}

      <div className="space-y-3">
        {[...groups.entries()].map(([exId, list]) => (
          <Card key={exId}>
            <div className="mb-2 font-semibold text-white">{exerciseName(exercises, exId)}</div>
            <div className="flex flex-wrap gap-1.5">
              {list.map((s) => (
                <span key={s.id} className={prIds.has(s.id) ? 'rounded-lg bg-amber-500/20 px-2 py-1 text-sm text-amber-200' : 'rounded-lg bg-slate-900 px-2 py-1 text-sm text-slate-200'}>
                  {formatKg(s.weight_kg)}×{s.reps}
                </span>
              ))}
            </div>
          </Card>
        ))}
        {cardio.map((c) => (
          <Card key={c.id}>
            <div className="font-semibold text-white">{exerciseName(exercises, c.exercise_id)}</div>
            <div className="text-sm text-slate-300">
              {formatKg(c.duration_min)} dk{c.distance_km ? ` · ${formatKg(c.distance_km)} km` : ''}
            </div>
          </Card>
        ))}
        {sets.length === 0 && cardio.length === 0 && <Empty>Bu antrenmanda kayıt yok.</Empty>}
      </div>

      <div className="mt-6 space-y-2">
        {justFinished && <Button className="w-full" onClick={() => navigate('/')}>Ana sayfa</Button>}
        {!session.ended_at && <Button className="w-full" onClick={() => navigate(`/seans/${session.id}`)}>Antrenmana dön</Button>}
        <Button variant="danger" className="w-full" onClick={del}>Antrenmanı sil</Button>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-3 text-center">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="font-bold text-white">{value}</div>
    </Card>
  )
}
