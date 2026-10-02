import { useEffect, useRef, useState } from 'react'
import { formatDuration } from '../lib/workout'

export interface RestState {
  endsAt: number
  total: number
}

let audio: AudioContext | null = null

/** Must be called from a tap so iOS allows sound later. */
export function primeAudio() {
  try {
    audio ??= new AudioContext()
    if (audio.state === 'suspended') void audio.resume()
  } catch {
    // Audio is a nicety; ignore if unavailable.
  }
}

function beep() {
  if (!audio) return
  const t = audio.currentTime
  for (const [i, f] of [880, 880, 1320].entries()) {
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.frequency.value = f
    gain.gain.setValueAtTime(0.0001, t + i * 0.25)
    gain.gain.exponentialRampToValueAtTime(0.4, t + i * 0.25 + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.25 + 0.2)
    osc.connect(gain).connect(audio.destination)
    osc.start(t + i * 0.25)
    osc.stop(t + i * 0.25 + 0.22)
  }
}

export function RestTimer({ rest, onChange }: { rest: RestState | null; onChange: (r: RestState | null) => void }) {
  const [now, setNow] = useState(Date.now())
  const fired = useRef<number | null>(null)

  useEffect(() => {
    if (!rest) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [rest])

  const left = rest ? rest.endsAt - now : 0

  useEffect(() => {
    if (!rest || left > 0 || fired.current === rest.endsAt) return
    fired.current = rest.endsAt
    beep()
    navigator.vibrate?.([200, 100, 200])
    const t = setTimeout(() => onChange(null), 4000)
    return () => clearTimeout(t)
  }, [rest, left, onChange])

  if (!rest) return null
  const done = left <= 0
  const pct = done ? 100 : 100 - (left / (rest.total * 1000)) * 100

  return (
    <div className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/95 backdrop-blur">
      <div className="h-1 bg-slate-800">
        <div className="h-1 bg-accent transition-[width] duration-200" style={{ width: `${pct}%` }} />
      </div>
      <div className="mx-auto flex max-w-xl items-center justify-between gap-2 px-4 py-2">
        <button
          className="h-11 w-14 rounded-xl bg-slate-800 text-sm font-semibold text-slate-200"
          onClick={() => onChange({ ...rest, endsAt: rest.endsAt - 15_000 })}
        >
          −15
        </button>
        <div className="text-center">
          <div className="text-[11px] uppercase tracking-wide text-slate-400">{done ? 'Dinlenme bitti' : 'Dinlenme'}</div>
          <div className={done ? 'text-3xl font-bold tabular-nums text-accent' : 'text-3xl font-bold tabular-nums text-white'}>
            {done ? 'Başla!' : formatDuration(left)}
          </div>
        </div>
        <button
          className="h-11 w-14 rounded-xl bg-slate-800 text-sm font-semibold text-slate-200"
          onClick={() => onChange({ endsAt: Math.max(rest.endsAt, Date.now()) + 15_000, total: rest.total + 15 })}
        >
          +15
        </button>
        <button className="h-11 rounded-xl px-3 text-sm font-semibold text-slate-400" onClick={() => onChange(null)}>
          Atla
        </button>
      </div>
    </div>
  )
}
