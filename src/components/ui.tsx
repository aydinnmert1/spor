import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function Page({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-28 pt-safe">
      <header className="flex items-center justify-between gap-3 pb-3 pt-4">
        <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
        {action}
      </header>
      {children}
    </div>
  )
}

type Tone = 'default' | 'accent' | 'done'

export function Card({
  children,
  className,
  onClick,
  tone = 'default',
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
  tone?: Tone
}) {
  return (
    <div
      onClick={onClick}
      className={cx(
        'rounded-2xl border p-4',
        tone === 'default' && 'border-white/5 bg-slate-800/60',
        tone === 'accent' && 'border-accent/60 bg-emerald-500/10',
        tone === 'done' && 'border-accent/30 bg-slate-800/60',
        onClick && 'cursor-pointer active:brightness-125',
        className,
      )}
    >
      {children}
    </div>
  )
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={cx(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 font-semibold transition active:scale-[0.98] disabled:opacity-40',
        variant === 'primary' && 'bg-accent-strong text-slate-950',
        variant === 'secondary' && 'bg-slate-700 text-white',
        variant === 'ghost' && 'text-slate-300',
        variant === 'danger' && 'bg-red-500/15 text-red-300',
        className,
      )}
    />
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-slate-400">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  )
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cx(
        'w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-white outline-none placeholder:text-slate-600 focus:border-accent',
        className,
      )}
    />
  )
}

/** Parses Turkish decimal commas too. Returns null for empty input. */
export function parseNum(v: string): number | null {
  const t = v.trim().replace(',', '.')
  if (t === '') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="pb-safe max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl border-t border-white/10 bg-slate-900 px-4 pt-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-600" />
        {title && (
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <button onClick={onClose} className="px-2 text-2xl leading-none text-slate-400" aria-label="Kapat">
              ×
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="mb-4 flex rounded-xl bg-slate-800/80 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            'flex-1 rounded-lg py-2 text-sm font-semibold',
            value === o.value ? 'bg-slate-600 text-white' : 'text-slate-400',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-8 text-center text-sm text-slate-500">{children}</p>
}

export const BLOCK_LABEL = { main: 'Ana hareket', accessory: 'Yardımcı', cardio: 'Kardiyo' } as const
