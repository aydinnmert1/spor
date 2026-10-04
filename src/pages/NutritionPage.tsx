import { useEffect, useState } from 'react'
import { Card, cx, Page } from '../components/ui'
import { DAY_FLOW, MEAL_SLOTS, NUTRITION_TIPS } from '../data/nutrition'
import { save } from '../lib/db'
import { targetsFor, useBodyWeights, useProfile } from '../lib/user'
import { formatKg } from '../lib/workout'

export default function NutritionPage() {
  const profile = useProfile()
  const weights = useBodyWeights()
  const [open, setOpen] = useState<string | null>('kahvalti')
  const weight = weights?.at(-1)?.kg
  const targets = profile && weight ? targetsFor(profile, weight) : null

  // Keep the stored targets in step with the latest body weight.
  useEffect(() => {
    if (profile && targets && (profile.kcal_target !== targets.kcal || profile.protein_target !== targets.protein)) {
      void save('profiles', { ...profile, kcal_target: targets.kcal, protein_target: targets.protein })
    }
  }, [profile, targets])

  if (!profile) return null
  const plan = profile.plan_key

  return (
    <Page title="Beslenme">
      {targets && (
        <Card className="mb-4">
          <div className="mb-3 flex items-baseline justify-between">
            <div>
              <div className="text-xs text-slate-400">Günlük hedef</div>
              <div className="text-3xl font-bold text-white">{targets.kcal} <span className="text-base font-medium text-slate-400">kcal</span></div>
            </div>
            <div className="text-right text-xs text-slate-500">
              {formatKg(weight!)} kg’a göre
              <br />
              {plan === 'guc' ? 'hafif kalori fazlası' : '~450 kcal açık'}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Macro label="Protein" value={targets.protein} color="bg-emerald-400" />
            <Macro label="Karbonhidrat" value={targets.carbs} color="bg-sky-400" />
            <Macro label="Yağ" value={targets.fat} color="bg-amber-400" />
          </div>
        </Card>
      )}

      <Card className="mb-4">
        <div className="mb-2 text-xs text-slate-400">Hafta içi günün akışı</div>
        <div className="flex justify-between gap-1">
          {DAY_FLOW.map((f) => (
            <div key={f.time} className="flex flex-1 flex-col items-center gap-1 text-center">
              <span className={cx('h-2 w-2 rounded-full', f.label === 'Spor' ? 'bg-accent' : 'bg-slate-500')} />
              <span className="text-[11px] font-semibold tabular-nums text-white">{f.time}</span>
              <span className="text-[10px] leading-tight text-slate-400">{f.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <p className="mb-3 text-sm text-slate-400">
        Saymak zorunda değilsin: her öğünde bir seçenek seçmen günlük hedefe yaklaşık olarak ulaştırır.
      </p>

      <div className="space-y-2">
        {MEAL_SLOTS.map((slot) => {
          const isOpen = open === slot.key
          return (
            <Card key={slot.key} className="p-0">
              <button onClick={() => setOpen(isOpen ? null : slot.key)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
                <div>
                  <div className="font-semibold text-white">{slot.title}</div>
                  <div className="text-xs text-slate-400">{slot.when}</div>
                </div>
                <span className="text-slate-500">{isOpen ? '▾' : '▸'}</span>
              </button>
              {isOpen && (
                <div className="space-y-2 border-t border-white/5 px-4 pb-4 pt-3">
                  <p className="text-xs text-slate-400">{slot.why}</p>
                  {slot.fixed && (
                    <div className="rounded-xl border border-accent/40 bg-emerald-500/10 p-3">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-semibold text-emerald-200">Sabit bowl’un</span>
                        <span className="shrink-0 text-xs text-emerald-300/80">
                          ~{slot.fixed[plan].kcal} kcal · {slot.fixed[plan].protein} g P
                        </span>
                      </div>
                      <ul className="mt-1.5 flex flex-wrap gap-1.5">
                        {slot.fixed[plan].items.map((it) => (
                          <li key={it} className="rounded-full bg-slate-900/60 px-2.5 py-1 text-xs text-slate-200">{it}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {slot.fixed && <div className="pt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Yanına eklemek istersen</div>}
                  {slot.options[plan].map((o) => (
                    <div key={o.title} className="rounded-xl bg-slate-900/70 p-3">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-semibold text-slate-100">{o.title}</span>
                        <span className="shrink-0 text-xs text-slate-400">
                          {slot.fixed ? '+' : '~'}{o.kcal} kcal · {o.protein} g P
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-300">{o.items}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      <Card className="mt-4">
        <h3 className="mb-2 font-semibold text-white">İpuçları</h3>
        <ul className="space-y-2 text-sm text-slate-300">
          {NUTRITION_TIPS[plan].map((t) => (
            <li key={t} className="flex gap-2">
              <span className="text-accent">•</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </Card>
      <p className="mt-4 text-center text-xs text-slate-500">Değerler yaklaşıktır, tıbbi tavsiye değildir.</p>
    </Page>
  )
}

function Macro({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl bg-slate-900/70 p-2">
      <div className={cx('mx-auto mb-1 h-1 w-8 rounded-full', color)} />
      <div className="text-lg font-bold text-white">{value} g</div>
      <div className="text-[11px] text-slate-400">{label}</div>
    </div>
  )
}
