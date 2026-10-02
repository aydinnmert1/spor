import { useNavigate } from 'react-router-dom'
import { ExerciseList } from '../components/ExercisePicker'
import { Page } from '../components/ui'

export default function ExercisesPage() {
  const navigate = useNavigate()
  return (
    <Page title="Hareketler">
      <ExerciseList onPick={(ex) => navigate(`/hareketler/${encodeURIComponent(ex.id)}`)} limit={120} />
    </Page>
  )
}
