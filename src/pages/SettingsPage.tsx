import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Page } from '../components/ui'
import { PEOPLE } from '../data/people'
import { PLAN_LABELS } from '../data/programs'
import { setMeta, table } from '../lib/db'
import { supabase } from '../lib/supabase'
import { syncNow, useSyncState } from '../lib/sync'
import { SYNC_TABLES } from '../lib/types'
import { useProfile, useUid } from '../lib/user'
import { installTemplate } from '../lib/workout'

export default function SettingsPage() {
  const uid = useUid()
  const profile = useProfile()
  const sync = useSyncState()
  const navigate = useNavigate()
  const [email, setEmail] = useState<string | null>(null)
  const cloud = sync.status !== 'local'

  useEffect(() => {
    if (cloud) void supabase?.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
  }, [cloud])

  if (!profile) return null
  const other = Object.values(PEOPLE).find((p) => p.key !== uid)!

  async function resetProgram() {
    if (!confirm('Program şablondan yeniden yüklensin mi? Programda yaptığın değişiklikler sıfırlanır; geçmiş antrenmanların silinmez.')) return
    await installTemplate(profile!.plan_key)
    navigate('/program')
  }

  async function switchPerson() {
    if (!confirm(`Bu telefonda ${other.name} olarak devam edilsin mi? ${profile!.name} kayıtları silinmez.`)) return
    await setMeta('person', null)
    location.reload()
  }

  async function exportData() {
    const dump: Record<string, unknown> = { person: uid, exported_at: new Date().toISOString() }
    for (const name of SYNC_TABLES) dump[name] = (await table(name).where('user_id').equals(uid).toArray()).filter((r) => !r.deleted)
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `spor-${uid}-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async function signOut() {
    if (sync.pending > 0 && !confirm(`${sync.pending} değişiklik henüz buluta gönderilmedi. Yine de çıkış yapılsın mı?`)) return
    await supabase?.auth.signOut()
    await setMeta('localMode', false)
    location.reload()
  }

  async function connectAccount() {
    await setMeta('localMode', false)
    location.reload()
  }

  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)

  return (
    <Page
      title="Ayarlar"
      action={
        <button onClick={() => navigate(-1)} className="text-sm font-semibold text-accent">
          Kapat
        </button>
      }
    >
      <div className="space-y-4">
        <Card>
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-700 text-xl font-bold text-white">{profile.name[0]}</span>
            <div className="flex-1">
              <div className="text-lg font-semibold text-white">{profile.name}</div>
              <div className="text-xs text-slate-400">{PLAN_LABELS[profile.plan_key].title}</div>
            </div>
          </div>
          <Button variant="secondary" className="mt-4 w-full" onClick={switchPerson}>
            {other.name} olarak devam et
          </Button>
        </Card>

        <Card>
          <h3 className="mb-1 font-semibold text-white">Program</h3>
          <p className="mb-3 text-xs text-slate-400">{PLAN_LABELS[profile.plan_key].summary}</p>
          <Button variant="secondary" className="w-full" onClick={resetProgram}>Programı şablondan sıfırla</Button>
        </Card>

        <Card>
          <h3 className="mb-2 font-semibold text-white">Bulut ve eşitleme</h3>
          {cloud ? (
            <>
              <p className="text-sm text-slate-300">{email}</p>
              <p className="mb-3 mt-1 text-xs text-slate-500">
                {sync.status === 'error' && <span className="text-red-300">Hata: {sync.error}. </span>}
                {sync.pending > 0 ? `${sync.pending} değişiklik gönderilmeyi bekliyor. ` : 'Tüm veriler bulutta. '}
                {sync.lastSync && `Son eşitleme ${new Date(sync.lastSync).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}.`}
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => syncNow(supabase)}>Şimdi eşitle</Button>
                <Button variant="danger" onClick={signOut}>Çıkış</Button>
              </div>
            </>
          ) : (
            <>
              <p className="mb-3 text-sm text-slate-400">
                Veriler yalnızca bu telefonda.{' '}
                {supabase ? 'Hesaba bağlanınca mevcut kayıtların buluta taşınır.' : 'Bulut henüz kurulmadı.'}
              </p>
              {supabase && <Button variant="secondary" className="w-full" onClick={connectAccount}>Hesaba bağlan</Button>}
            </>
          )}
        </Card>

        <Card>
          <h3 className="mb-2 font-semibold text-white">Ana ekrana ekle</h3>
          <p className="text-sm text-slate-400">
            {isIos
              ? 'Safari’de alttaki Paylaş (□↑) düğmesine dokun → “Ana Ekrana Ekle”. Uygulama tam ekran açılır ve internet olmadan da çalışır.'
              : 'Chrome’da sağ üstteki ⋮ menüsü → “Ana ekrana ekle” / “Uygulamayı yükle”. Uygulama tam ekran açılır ve internet olmadan da çalışır.'}
          </p>
        </Card>

        <Card>
          <h3 className="mb-2 font-semibold text-white">Veri</h3>
          <Button variant="secondary" className="w-full" onClick={exportData}>Yedeği indir (JSON)</Button>
        </Card>
      </div>
    </Page>
  )
}
