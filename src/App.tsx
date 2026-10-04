import type { Session as AuthSession } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { cx } from './components/ui'
import { isPersonKey, type PersonKey } from './data/people'
import { getMeta, setMeta } from './lib/db'
import { supabase } from './lib/supabase'
import { adoptLocalData, startSyncLoop, syncNow } from './lib/sync'
import { UidContext, useProfile } from './lib/user'
import { ensurePerson } from './lib/workout'
import ExerciseDetailPage from './pages/ExerciseDetailPage'
import ExercisesPage from './pages/ExercisesPage'
import Login from './pages/Login'
import NutritionPage from './pages/NutritionPage'
import PersonPicker from './pages/PersonPicker'
import ProgramPage from './pages/ProgramPage'
import ProgressPage from './pages/ProgressPage'
import SessionDetailPage from './pages/SessionDetailPage'
import SessionPage from './pages/SessionPage'
import SettingsPage from './pages/SettingsPage'
import TodayPage from './pages/TodayPage'

type Boot =
  | { kind: 'loading' }
  | { kind: 'login' }
  | { kind: 'pick'; cloud: boolean }
  | { kind: 'ready'; person: PersonKey; cloud: boolean }

export default function App() {
  const [boot, setBoot] = useState<Boot>({ kind: 'loading' })

  useEffect(() => {
    const choosePerson = async (cloud: boolean) => {
      const person = await getMeta<string>('person')
      setBoot(isPersonKey(person) ? { kind: 'ready', person, cloud } : { kind: 'pick', cloud })
    }
    if (!supabase) {
      void choosePerson(false)
      return
    }
    const resolve = async (session: AuthSession | null) => {
      if (session) await choosePerson(true)
      else if (await getMeta<boolean>('localMode')) await choosePerson(false)
      else setBoot({ kind: 'login' })
    }
    // Supabase advises not to await other work inside the auth callback.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => void resolve(session), 0)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  if (boot.kind === 'loading') return <Splash />
  if (boot.kind === 'login') return <Login onLocal={() => setBoot({ kind: 'pick', cloud: false })} />
  if (boot.kind === 'pick') {
    return (
      <PersonPicker
        onPick={async (person) => {
          await setMeta('person', person)
          setBoot({ kind: 'ready', person, cloud: boot.cloud })
        }}
      />
    )
  }
  return (
    <UidContext.Provider value={boot.person}>
      <Ready person={boot.person} cloud={boot.cloud} />
    </UidContext.Provider>
  )
}

function Splash() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-accent" />
    </div>
  )
}

const preparing = new Map<string, Promise<void>>()

/** Runs once per person per app load, even if the effect fires twice. */
function preparePerson(person: PersonKey, client: typeof supabase): Promise<void> {
  if (!preparing.has(person)) {
    preparing.set(
      person,
      (async () => {
        await setMeta('uid', person)
        // Download first so an existing account is not mistaken for a new person.
        await syncNow(client)
        await adoptLocalData(person)
        await ensurePerson(person)
      })(),
    )
  }
  return preparing.get(person)!
}

function Ready({ person, cloud }: { person: PersonKey; cloud: boolean }) {
  const profile = useProfile()
  const [prepared, setPrepared] = useState(false)

  useEffect(() => {
    const client = cloud ? supabase : null
    const stop = startSyncLoop(client)
    void preparePerson(person, client).then(() => setPrepared(true))
    return stop
  }, [person, cloud])

  if (!prepared || !profile) return <Splash />
  return <Shell />
}

const NAV = [
  { to: '/', label: 'Bugün', icon: 'M3 12l9-9 9 9M5 10v10h14V10' },
  { to: '/program', label: 'Program', icon: 'M4 6h16M4 12h16M4 18h10' },
  { to: '/hareketler', label: 'Hareketler', icon: 'M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11' },
  { to: '/ilerleme', label: 'İlerleme', icon: 'M3 20h18M6 16l4-5 4 3 5-7' },
  { to: '/beslenme', label: 'Beslenme', icon: 'M7 3v8a3 3 0 0 0 6 0V3M10 3v18M17 3c-2 2-2 6 0 8v10' },
]

function Shell() {
  const location = useLocation()
  const inSession = location.pathname.startsWith('/seans/')
  return (
    <>
      <Routes>
        <Route path="/" element={<TodayPage />} />
        <Route path="/seans/:id" element={<SessionPage />} />
        <Route path="/program" element={<ProgramPage />} />
        <Route path="/hareketler" element={<ExercisesPage />} />
        <Route path="/hareketler/:id" element={<ExerciseDetailPage />} />
        <Route path="/ilerleme" element={<ProgressPage />} />
        <Route path="/gecmis/:id" element={<SessionDetailPage />} />
        <Route path="/beslenme" element={<NutritionPage />} />
        <Route path="/ayarlar" element={<SettingsPage />} />
      </Routes>
      {!inSession && (
        <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-white/5 bg-slate-950/95 backdrop-blur">
          <div className="mx-auto flex max-w-xl">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === '/'}
                className={({ isActive }) =>
                  cx('flex flex-1 flex-col items-center gap-1 pt-2 text-[11px] font-medium', isActive ? 'text-accent' : 'text-slate-500')
                }
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d={n.icon} />
                </svg>
                {n.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </>
  )
}
