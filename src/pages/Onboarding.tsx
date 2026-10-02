import { useState, type FormEvent } from 'react'
import { Button, Card, Field, Input, parseNum, Segmented } from '../components/ui'
import { calcTargets } from '../data/nutrition'
import { PLAN_LABELS } from '../data/programs'
import { save } from '../lib/db'
import type { PlanKey, Sex } from '../lib/types'
import { useUid } from '../lib/user'
import { installTemplate, localDate } from '../lib/workout'

export default function Onboarding() {
  const uid = useUid()
  const [name, setName] = useState('')
  const [sex, setSex] = useState<Sex>('male')
  const [birthYear, setBirthYear] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [plan, setPlan] = useState<PlanKey>('guc')
  const [busy, setBusy] = useState(false)

  const by = parseNum(birthYear)
  const h = parseNum(height)
  const w = parseNum(weight)
  const valid = name.trim() && by && by > 1920 && by < 2020 && h && h > 100 && w && w > 30

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!valid || !by || !h || !w) return
    setBusy(true)
    const t = calcTargets({ sex, age: new Date().getFullYear() - by, height_cm: h, weight_kg: w, plan })
    await save('body_weights', { date: localDate(), kg: w })
    await installTemplate(plan)
    // Profile last: its appearance is what moves the app past onboarding.
    await save('profiles', {
      id: uid,
      name: name.trim(),
      sex,
      birth_year: by,
      height_cm: h,
      plan_key: plan,
      kcal_target: t.kcal,
      protein_target: t.protein,
    })
  }

  return (
    <div className="pt-safe mx-auto max-w-xl px-4 pb-10">
      <h1 className="pb-1 pt-6 text-2xl font-bold text-white">Hoş geldin 👋</h1>
      <p className="mb-6 text-sm text-slate-400">Programını ve beslenme hedeflerini hazırlamak için birkaç bilgi.</p>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Adın">
          <Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" />
        </Field>
        <div>
          <span className="mb-1 block text-sm text-slate-400">Cinsiyet</span>
          <Segmented
            value={sex}
            onChange={setSex}
            options={[
              { value: 'male', label: 'Erkek' },
              { value: 'female', label: 'Kadın' },
            ]}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Doğum yılı">
            <Input inputMode="numeric" value={birthYear} onChange={(e) => setBirthYear(e.target.value)} placeholder="1997" />
          </Field>
          <Field label="Boy (cm)">
            <Input inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="170" />
          </Field>
          <Field label="Kilo (kg)">
            <Input inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70" />
          </Field>
        </div>
        <div>
          <span className="mb-2 block text-sm text-slate-400">Program</span>
          <div className="space-y-3">
            {(Object.keys(PLAN_LABELS) as PlanKey[]).map((key) => (
              <Card
                key={key}
                onClick={() => setPlan(key)}
                tone={plan === key ? 'accent' : 'default'}
              >
                <div className="font-semibold text-white">{PLAN_LABELS[key].title}</div>
                <p className="mt-1 text-sm text-slate-400">{PLAN_LABELS[key].summary}</p>
              </Card>
            ))}
          </div>
        </div>
        <Button type="submit" disabled={!valid || busy} className="w-full">
          {busy ? 'Hazırlanıyor…' : 'Başla'}
        </Button>
      </form>
    </div>
  )
}
