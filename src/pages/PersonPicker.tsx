import { PEOPLE, type PersonKey } from '../data/people'

export default function PersonPicker({ onPick }: { onPick: (key: PersonKey) => void }) {
  return (
    <div className="pt-safe mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-strong text-3xl">🏋️</div>
        <h1 className="text-3xl font-bold text-white">Spor Takip</h1>
        <p className="mt-2 text-sm text-slate-400">Bu telefonu kim kullanıyor?</p>
      </div>
      <div className="space-y-3">
        {(Object.keys(PEOPLE) as PersonKey[]).map((key) => (
          <button
            key={key}
            onClick={() => onPick(key)}
            className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-slate-800/60 p-5 text-left active:brightness-125"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-700 text-xl font-bold text-white">
              {PEOPLE[key].name[0]}
            </span>
            <span className="text-xl font-semibold text-white">{PEOPLE[key].name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
