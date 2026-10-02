import { useNavigate, useParams } from 'react-router-dom'
import { ExerciseInfo } from '../components/ExerciseInfo'
import { ExerciseHistory } from '../components/ExerciseHistory'
import { Empty } from '../components/ui'
import { exerciseName, useExercises } from '../lib/exercises'

export default function ExerciseDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const exercises = useExercises()
  const ex = exercises?.get(id)

  return (
    <div className="mx-auto max-w-xl px-4 pb-28">
      <header className="pt-safe flex items-center gap-2 py-3">
        <button onClick={() => navigate(-1)} className="-ml-2 p-2 text-2xl leading-none text-slate-400" aria-label="Geri">
          ‹
        </button>
        <h1 className="text-xl font-bold text-white">{exerciseName(exercises, id)}</h1>
      </header>
      {ex ? <ExerciseInfo ex={ex} /> : <Empty>{exercises ? 'Hareket bulunamadı.' : 'Yükleniyor…'}</Empty>}
      <div className="mt-6">
        <ExerciseHistory exerciseId={id} />
      </div>
    </div>
  )
}
