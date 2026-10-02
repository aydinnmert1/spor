import { useMemo, useState } from 'react'
import { MUSCLES_TR } from '../data/exercises-tr'
import { searchKey, useExercises, type Exercise } from '../lib/exercises'
import { ExerciseImages } from './ExerciseInfo'
import { cx, Input } from './ui'

const MUSCLE_FILTERS = ['chest', 'lats', 'middle back', 'shoulders', 'quadriceps', 'hamstrings', 'glutes', 'biceps', 'triceps', 'abdominals', 'calves']

/** Searchable exercise list. Turkish-named (curated) exercises come first. */
export function ExerciseList({ onPick, limit = 80 }: { onPick: (ex: Exercise) => void; limit?: number }) {
  const exercises = useExercises()
  const [q, setQ] = useState('')
  const [muscle, setMuscle] = useState<string | null>(null)
  const [cardio, setCardio] = useState(false)

  const results = useMemo(() => {
    if (!exercises) return []
    const key = searchKey(q)
    const list = [...exercises.values()].filter((e) => {
      if (muscle && !e.primaryMuscles.includes(muscle)) return false
      if (cardio && e.category !== 'cardio') return false
      if (!key) return true
      return searchKey(e.name).includes(key) || searchKey(e.nameEn).includes(key)
    })
    const curated = (e: Exercise) => (e.name !== e.nameEn ? 0 : 1)
    list.sort((a, b) => curated(a) - curated(b) || a.name.localeCompare(b.name, 'tr'))
    return list
  }, [exercises, q, muscle, cardio])

  return (
    <div>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Hareket ara (Türkçe veya İngilizce)…" type="search" />
      <div className="-mx-4 mt-3 flex gap-1.5 overflow-x-auto px-4 pb-1">
        <Chip active={!muscle && !cardio} onClick={() => { setMuscle(null); setCardio(false) }}>Tümü</Chip>
        <Chip active={cardio} onClick={() => { setCardio(!cardio); setMuscle(null) }}>Kardiyo</Chip>
        {MUSCLE_FILTERS.map((m) => (
          <Chip key={m} active={muscle === m} onClick={() => { setMuscle(muscle === m ? null : m); setCardio(false) }}>
            {MUSCLES_TR[m]}
          </Chip>
        ))}
      </div>
      {!exercises && <p className="py-6 text-center text-sm text-slate-500">Yükleniyor…</p>}
      <ul className="mt-2 divide-y divide-white/5">
        {results.slice(0, limit).map((ex) => (
          <li key={ex.id}>
            <button onClick={() => onPick(ex)} className="flex w-full items-center gap-3 py-2.5 text-left">
              <ExerciseImages ex={ex} size="sm" />
              <div className="min-w-0">
                <div className="truncate font-medium text-slate-100">{ex.name}</div>
                <div className="truncate text-xs text-slate-500">
                  {ex.primaryMuscles.map((m) => MUSCLES_TR[m] ?? m).join(', ')}
                  {ex.name !== ex.nameEn && ` · ${ex.nameEn}`}
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
      {results.length > limit && (
        <p className="py-3 text-center text-xs text-slate-500">{results.length - limit} hareket daha var, aramayı daralt.</p>
      )}
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cx('shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold', active ? 'bg-accent-strong text-slate-950' : 'bg-slate-800 text-slate-300')}
    >
      {children}
    </button>
  )
}
