import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { LineChart } from '../components/LineChart'
import { Button, Card, cx, Empty, Field, Input, Page, parseNum, Segmented, Sheet } from '../components/ui'
import { alive, db, remove, save } from '../lib/db'
import { exerciseName, useExercises } from '../lib/exercises'
import type { BodyMeasurement } from '../lib/types'
import { useBodyWeights, useUid } from '../lib/user'
import { bestOf, e1rm, formatKg, localDate } from '../lib/workout'

type Tab = 'hareket' | 'vucut' | 'gecmis'

export default function ProgressPage() {
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) ?? 'hareket'
  return (
    <Page title="İlerleme">
      <Segmented
        value={tab}
        onChange={(t) => setParams({ tab: t }, { replace: true })}
        options={[
          { value: 'hareket', label: 'Hareketler' },
          { value: 'vucut', label: 'Vücut' },
          { value: 'gecmis', label: 'Geçmiş' },
        ]}
      />
      {tab === 'hareket' && <LiftsTab />}
      {tab === 'vucut' && <BodyTab />}
      {tab === 'gecmis' && <HistoryTab />}
    </Page>
  )
}

function LiftsTab() {
  const uid = useUid()
  const exercises = useExercises()
  const navigate = useNavigate()
  const rows = useLiveQuery(async () => {
    const logs = alive(await db.set_logs.where('user_id').equals(uid).toArray())
    const byEx = new Map<string, typeof logs>()
    for (const l of logs) {
      if (!byEx.has(l.exercise_id)) byEx.set(l.exercise_id, [])
      byEx.get(l.exercise_id)!.push(l)
    }
    return [...byEx.entries()]
      .map(([id, list]) => {
        const best = bestOf(list)
        const last = list.reduce((a, b) => (a.done_at > b.done_at ? a : b))
        return { id, best, last, count: new Set(list.map((l) => l.session_id)).size }
      })
      .sort((a, b) => b.last.done_at.localeCompare(a.last.done_at))
  }, [uid])

  if (!rows) return null
  if (rows.length === 0) return <Empty>İlk antrenmanını kaydettiğinde hareket bazlı grafikler burada görünecek.</Empty>
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <Card key={r.id} onClick={() => navigate(`/hareketler/${encodeURIComponent(r.id)}`)} className="py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-medium text-white">{exerciseName(exercises, r.id)}</div>
              <div className="text-xs text-slate-500">
                {r.count} antrenman · son {new Date(r.last.done_at).toLocaleDateString('tr-TR')}
              </div>
            </div>
            {r.best && (
              <div className="shrink-0 text-right">
                <div className="font-bold text-accent">{Math.round(e1rm(r.best.bestE1rm.weight_kg, r.best.bestE1rm.reps))} kg</div>
                <div className="text-[11px] text-slate-500">tahmini 1RM</div>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}

type MeasureKey = keyof Pick<BodyMeasurement, 'waist' | 'hip' | 'chest' | 'shoulder' | 'arm' | 'thigh'>

const MEASURES: { key: MeasureKey; label: string }[] = [
  { key: 'waist', label: 'Bel' },
  { key: 'hip', label: 'Kalça' },
  { key: 'chest', label: 'Göğüs' },
  { key: 'shoulder', label: 'Omuz' },
  { key: 'arm', label: 'Kol' },
  { key: 'thigh', label: 'Bacak (uyluk)' },
]

function BodyTab() {
  const uid = useUid()
  const weights = useBodyWeights()
  const measurements = useLiveQuery(
    async () => alive(await db.body_measurements.where('user_id').equals(uid).toArray()).sort((a, b) => b.date.localeCompare(a.date)),
    [uid],
  )
  const [kg, setKg] = useState('')
  const [date, setDate] = useState(localDate())
  const [measuring, setMeasuring] = useState(false)
  const [showAll, setShowAll] = useState(false)

  async function addWeight() {
    const v = parseNum(kg)
    if (!v) return
    const existing = weights?.find((w) => w.date === date)
    await save('body_weights', { id: existing?.id, date, kg: v })
    setKg('')
  }

  const first = weights?.[0]
  const last = weights?.at(-1)
  const diff = first && last && first !== last ? last.kg - first.kg : null
  const firstM = measurements?.at(-1)
  const lastM = measurements?.[0]

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="mb-3 font-semibold text-white">Kilo</h3>
        <div className="mb-4 flex gap-2">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="flex-1" />
          <Input value={kg} onChange={(e) => setKg(e.target.value)} inputMode="decimal" placeholder="kg" className="w-24 text-center" />
          <Button onClick={addWeight} disabled={!parseNum(kg)}>Ekle</Button>
        </div>
        <LineChart points={(weights ?? []).map((w) => ({ date: w.date, value: w.kg }))} />
        {diff !== null && (
          <p className="mt-2 text-sm text-slate-400">
            Başlangıçtan beri: <span className={cx('font-semibold', diff < 0 ? 'text-sky-300' : 'text-emerald-300')}>{diff > 0 ? '+' : ''}{formatKg(Math.round(diff * 10) / 10)} kg</span>
          </p>
        )}
        {weights && weights.length > 0 && (
          <>
            <button onClick={() => setShowAll(!showAll)} className="mt-3 text-sm text-slate-400">
              {showAll ? 'Kayıtları gizle' : 'Tüm kayıtlar'}
            </button>
            {showAll && (
              <ul className="mt-2 divide-y divide-white/5 text-sm">
                {[...weights].reverse().map((w) => (
                  <li key={w.id} className="flex items-center justify-between py-2">
                    <span className="text-slate-400">{w.date.split('-').reverse().join('.')}</span>
                    <span className="text-white">{formatKg(w.kg)} kg</span>
                    <button onClick={() => remove('body_weights', w.id)} className="text-xs text-slate-500">sil</button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-white">Ölçüler (cm)</h3>
          <Button variant="secondary" className="min-h-9 py-1 text-sm" onClick={() => setMeasuring(true)}>+ Ölçüm</Button>
        </div>
        {lastM ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500">
                <th className="py-1 text-left font-normal" />
                {firstM && firstM !== lastM && <th className="py-1 text-right font-normal">{firstM.date.split('-').reverse().join('.')}</th>}
                <th className="py-1 text-right font-normal">{lastM.date.split('-').reverse().join('.')}</th>
                {firstM && firstM !== lastM && <th className="py-1 text-right font-normal">Fark</th>}
              </tr>
            </thead>
            <tbody>
              {MEASURES.map((m) => {
                const a = firstM?.[m.key]
                const b = lastM[m.key]
                if (b == null && a == null) return null
                const d = a != null && b != null && firstM !== lastM ? b - a : null
                return (
                  <tr key={m.key} className="border-t border-white/5">
                    <td className="py-1.5 text-slate-300">{m.label}</td>
                    {firstM && firstM !== lastM && <td className="py-1.5 text-right text-slate-400">{a != null ? formatKg(a) : '—'}</td>}
                    <td className="py-1.5 text-right font-semibold text-white">{b != null ? formatKg(b) : '—'}</td>
                    {firstM && firstM !== lastM && (
                      <td className={cx('py-1.5 text-right', d && d < 0 ? 'text-sky-300' : 'text-emerald-300')}>
                        {d != null ? `${d > 0 ? '+' : ''}${formatKg(Math.round(d * 10) / 10)}` : ''}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-slate-500">Ayda bir ölçüm almak sıkılaşmayı kilodan daha iyi gösterir.</p>
        )}
        {measurements && measurements.length > 1 && (
          <p className="mt-2 text-xs text-slate-500">{measurements.length} ölçüm kaydı</p>
        )}
      </Card>

      <Sheet open={measuring} onClose={() => setMeasuring(false)} title="Yeni ölçüm">
        <MeasureForm onClose={() => setMeasuring(false)} />
      </Sheet>
    </div>
  )
}

function MeasureForm({ onClose }: { onClose: () => void }) {
  const [date, setDate] = useState(localDate())
  const [values, setValues] = useState<Record<string, string>>({})

  async function submit() {
    const row = { date } as Record<string, unknown>
    for (const m of MEASURES) row[m.key] = parseNum(values[m.key] ?? '')
    await save('body_measurements', row as never)
    onClose()
  }

  return (
    <div className="space-y-3 pb-4">
      <Field label="Tarih">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        {MEASURES.map((m) => (
          <Field key={m.key} label={`${m.label} (cm)`}>
            <Input value={values[m.key] ?? ''} onChange={(e) => setValues({ ...values, [m.key]: e.target.value })} inputMode="decimal" />
          </Field>
        ))}
      </div>
      <p className="text-xs text-slate-500">Bel: göbek hizası. Kalça: en geniş yer. Kol/bacak: en kalın yer, aynı taraf. Sabah, aç karnına ölç.</p>
      <Button className="w-full" onClick={submit}>Kaydet</Button>
    </div>
  )
}

function HistoryTab() {
  const uid = useUid()
  const navigate = useNavigate()
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const sessions = useLiveQuery(
    async () =>
      alive(await db.sessions.where('user_id').equals(uid).toArray())
        .filter((s) => s.ended_at)
        .sort((a, b) => b.started_at.localeCompare(a.started_at)),
    [uid],
  )
  if (!sessions) return null

  const byDate = new Map<string, number>()
  for (const s of sessions) {
    const d = localDate(new Date(s.started_at))
    byDate.set(d, (byDate.get(d) ?? 0) + 1)
  }
  const year = month.getFullYear()
  const m = month.getMonth()
  const offset = (month.getDay() + 6) % 7
  const daysInMonth = new Date(year, m + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  const inMonth = sessions.filter((s) => {
    const d = new Date(s.started_at)
    return d.getFullYear() === year && d.getMonth() === m
  })
  const today = localDate()

  return (
    <div className="space-y-4">
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <button onClick={() => setMonth(new Date(year, m - 1, 1))} className="px-3 text-xl text-slate-400" aria-label="Önceki ay">‹</button>
          <div className="font-semibold capitalize text-white">{month.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</div>
          <button onClick={() => setMonth(new Date(year, m + 1, 1))} className="px-3 text-xl text-slate-400" aria-label="Sonraki ay">›</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-slate-500">
          {['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].map((d) => <div key={d}>{d}</div>)}
          {cells.map((day, i) => {
            if (!day) return <div key={i} />
            const key = localDate(new Date(year, m, day))
            const has = byDate.has(key)
            return (
              <div
                key={i}
                className={cx(
                  'flex aspect-square items-center justify-center rounded-lg text-sm',
                  has ? 'bg-accent-strong font-bold text-slate-950' : 'text-slate-300',
                  key === today && !has && 'ring-1 ring-accent',
                )}
              >
                {day}
              </div>
            )
          })}
        </div>
        <p className="mt-3 text-sm text-slate-400">Bu ay {inMonth.length} antrenman</p>
      </Card>

      {sessions.length === 0 ? (
        <Empty>Henüz tamamlanmış antrenman yok.</Empty>
      ) : (
        <div className="space-y-2">
          {sessions.slice(0, 50).map((s) => (
            <Card key={s.id} onClick={() => navigate(`/gecmis/${s.id}`)} className="py-3">
              <div className="flex justify-between gap-3">
                <span className="truncate font-medium text-white">{s.day_name}</span>
                <span className="shrink-0 text-sm text-slate-500">{new Date(s.started_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
