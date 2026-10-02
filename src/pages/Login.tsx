import { useState, type FormEvent } from 'react'
import { Button, Field, Input, Segmented } from '../components/ui'
import { setMeta } from '../lib/db'
import { supabase } from '../lib/supabase'

export default function Login({ onLocal }: { onLocal: () => void }) {
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ kind: 'error' | 'info'; text: string } | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setBusy(true)
    setMessage(null)
    const { data, error } =
      mode === 'in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })
    setBusy(false)
    if (error) {
      setMessage({ kind: 'error', text: translateError(error.message) })
    } else if (mode === 'up' && !data.session) {
      setMessage({ kind: 'info', text: 'Hesap oluşturuldu. E-postana gelen onay bağlantısına tıkla, sonra buradan giriş yap.' })
      setMode('in')
    }
    // On success the auth listener in App takes over.
  }

  async function useLocal() {
    await setMeta('localMode', true)
    onLocal()
  }

  return (
    <div className="pt-safe mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-strong text-3xl">🏋️</div>
        <h1 className="text-3xl font-bold text-white">Spor Takip</h1>
        <p className="mt-2 text-sm text-slate-400">Programın, setlerin ve ilerlemen her cihazda seninle.</p>
      </div>
      <Segmented
        value={mode}
        onChange={setMode}
        options={[
          { value: 'in', label: 'Giriş yap' },
          { value: 'up', label: 'Hesap oluştur' },
        ]}
      />
      <form onSubmit={submit} className="space-y-4">
        <Field label="E-posta">
          <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Şifre" hint={mode === 'up' ? 'En az 6 karakter' : undefined}>
          <Input
            type="password"
            autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {message && (
          <p className={message.kind === 'error' ? 'text-sm text-red-300' : 'text-sm text-emerald-300'}>{message.text}</p>
        )}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? 'Bekle…' : mode === 'in' ? 'Giriş yap' : 'Hesap oluştur'}
        </Button>
      </form>
      <button onClick={useLocal} className="mt-8 text-sm text-slate-500 underline underline-offset-4">
        Hesapsız devam et (veriler sadece bu telefonda kalır)
      </button>
    </div>
  )
}

function translateError(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return 'E-posta veya şifre hatalı.'
  if (/email not confirmed/i.test(msg)) return 'E-posta henüz onaylanmamış. Gelen kutunu kontrol et.'
  if (/already registered/i.test(msg)) return 'Bu e-posta ile zaten bir hesap var. Giriş yap.'
  if (/password/i.test(msg)) return 'Şifre en az 6 karakter olmalı.'
  if (/fetch|network/i.test(msg)) return 'İnternet bağlantısı yok gibi görünüyor.'
  return msg
}
