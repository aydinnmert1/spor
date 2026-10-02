import { useState } from 'react'
import { formatKg } from '../lib/workout'

export interface Point {
  date: string // YYYY-MM-DD
  value: number
}

const W = 340
const H = 160
const PAD = { l: 34, r: 10, t: 12, b: 22 }

function shortDate(d: string) {
  const [, m, day] = d.split('-')
  return `${Number(day)}.${Number(m)}`
}

/** Minimal responsive SVG line chart; tap a point to read its value. */
export function LineChart({ points, unit = 'kg' }: { points: Point[]; unit?: string }) {
  const [active, setActive] = useState<number | null>(null)
  if (points.length === 0) return <p className="py-10 text-center text-sm text-slate-500">Henüz veri yok.</p>

  const values = points.map((p) => p.value)
  let min = Math.min(...values)
  let max = Math.max(...values)
  if (min === max) {
    min -= 1
    max += 1
  }
  const span = max - min
  min -= span * 0.1
  max += span * 0.1

  const times = points.map((p) => Date.parse(p.date))
  const t0 = Math.min(...times)
  const t1 = Math.max(...times)
  const x = (t: number) => PAD.l + (t1 === t0 ? (W - PAD.l - PAD.r) / 2 : ((t - t0) / (t1 - t0)) * (W - PAD.l - PAD.r))
  const y = (v: number) => PAD.t + (1 - (v - min) / (max - min)) * (H - PAD.t - PAD.b)

  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(times[i]).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
  const ticks = [min + (max - min) * 0.15, (min + max) / 2, max - (max - min) * 0.15]
  const sel = active !== null ? points[active] : points[points.length - 1]

  return (
    <div>
      <div className="mb-1 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-white">
          {formatKg(Math.round(sel.value * 10) / 10)} {unit}
        </span>
        <span className="text-xs text-slate-400">{sel.date.split('-').reverse().join('.')}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full touch-none select-none">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} stroke="#334155" strokeDasharray="3 4" strokeWidth={0.6} />
            <text x={PAD.l - 6} y={y(t) + 3} textAnchor="end" fontSize={9} fill="#64748b">
              {Math.round(t)}
            </text>
          </g>
        ))}
        <text x={PAD.l} y={H - 6} fontSize={9} fill="#64748b">
          {shortDate(points[0].date)}
        </text>
        <text x={W - PAD.r} y={H - 6} fontSize={9} fill="#64748b" textAnchor="end">
          {shortDate(points[points.length - 1].date)}
        </text>
        <path d={path} fill="none" stroke="#34d399" strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={x(times[i])}
            cy={y(p.value)}
            r={(active ?? points.length - 1) === i ? 5 : 3}
            fill={(active ?? points.length - 1) === i ? '#34d399' : '#0b1120'}
            stroke="#34d399"
            strokeWidth={1.8}
          />
        ))}
        {points.map((p, i) => (
          <rect
            key={`hit-${i}`}
            x={x(times[i]) - 12}
            y={0}
            width={24}
            height={H}
            fill="transparent"
            onClick={() => setActive(i)}
            aria-label={`${p.date}: ${p.value}`}
          />
        ))}
      </svg>
    </div>
  )
}
