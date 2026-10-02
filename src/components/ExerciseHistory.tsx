import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { alive, db } from '../lib/db'
import { useUid } from '../lib/user'
import { bestOf, e1rm, formatKg, progressSeries } from '../lib/workout'
import { LineChart } from './LineChart'
import { Card, Segmented } from './ui'

type Metric = 'e1rm' | 'maxWeight' | 'volume'

export function ExerciseHistory({ exerciseId }: { exerciseId: string }) {
  const uid = useUid()
  const [metric, setMetric] = useState<Metric>('e1rm')
  const logs = useLiveQuery(
    async () => alive(await db.set_logs.where('exercise_id').equals(exerciseId).toArray()).filter((l) => l.user_id === uid),
    [exerciseId, uid],
  )
  if (!logs) return null
  if (logs.length === 0) return <p className="text-sm text-slate-500">Bu hareket için henüz kayıtlı set yok.</p>

  const best = bestOf(logs)
  const series = progressSeries(logs)
  const recent = [...series].reverse().slice(0, 8)

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-white">İlerlemen</h3>
      {best && (
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <div className="text-xs text-slate-400">En ağır set</div>
            <div className="text-lg font-bold text-white">
              {formatKg(best.maxWeight.weight_kg)} kg × {best.maxWeight.reps}
            </div>
          </Card>
          <Card>
            <div className="text-xs text-slate-400">Tahmini 1RM</div>
            <div className="text-lg font-bold text-white">{formatKg(Math.round(e1rm(best.bestE1rm.weight_kg, best.bestE1rm.reps) * 10) / 10)} kg</div>
          </Card>
        </div>
      )}
      <Card>
        <Segmented
          value={metric}
          onChange={setMetric}
          options={[
            { value: 'e1rm', label: 'Tahmini 1RM' },
            { value: 'maxWeight', label: 'En ağır' },
            { value: 'volume', label: 'Hacim' },
          ]}
        />
        <LineChart points={series.map((s) => ({ date: s.date, value: s[metric] }))} />
      </Card>
      <div className="space-y-1">
        {recent.map((s) => (
          <div key={s.date} className="flex justify-between text-sm">
            <span className="text-slate-400">{s.date.split('-').reverse().join('.')}</span>
            <span className="text-slate-200">
              en ağır {formatKg(s.maxWeight)} kg · 1RM ~{Math.round(s.e1rm)} kg
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
