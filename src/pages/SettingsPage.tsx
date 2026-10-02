import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, cx, Field, Input, Page, parseNum } from '../components/ui'
import { PLAN_LABELS } from '../data/programs'
import { LOCAL_USER, save, setMeta, table } from '../lib/db'
import { supabase } from '../lib/supabase'
import { syncNow, useSyncState } from '../lib/sync'
import { SYNC_TABLES, type PlanKey } from '../lib/types'
import { targetsFor, useBodyWeights, useProfile, useUid } from '../lib/user'
import { installTemplate } from '../lib/workout'

export default function SettingsPage() {
  const uid = useUid()
  const profile = useProfile()
  const weights = useBodyWeights()
  const sync = useSyncState()
  const navigate = useNavigate()
  const [email, setEmail] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [height, setHeight] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    void supabase?.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
  }, [])

  useEffect(() => {
    if (profile) {
      setName(profile.name)
      setHeight(String(profile.height_cm))
      setBirthYear(String(profile.birth_year))
    }
  }, [profile])

  if (!profile) return null

  async function saveProfile() {
    const next = {
      ...profile!,
      name: name.trim() || profile!.name,
      height_cm: parseNum(height) ?? profile!.height_cm,
      birth_year: parseNum(birthYear) ?? profile!.birth_year,
    }
    const w = weights?.at(-1)?.kg
    if (w) {
      const t = targetsFor(next, w)
      next.kcal_target = t.kcal
      next.protein_target = t.protein
    }
    await save('profiles', next)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  async function switchPlan(plan: PlanKey) {
    const msg =
      plan === profile!.plan_key
        ? 'Program şablondan yeniden yüklensin mi? Programda yaptığın değişiklikler sıfırlanır (geçmiş antrenmanların silinmez).'
        : `"${PLAN_LABELS[plan].title}" programına geçilsin mi? Mevcut programın pasif olur, geçmişin korunur.`
    if (!confirm(msg)) return
    await installTemplate(plan)
    const w = weights?.at(-1)?.kg
    const next = { ...profile!, plan_key: plan }
    if (w) {
      const t = targetsFor(next, w)
      next.kcal_target = t.kcal
      next.protein_target = t.protein
    }
    await save('profiles', next)
    navigate('/program')
  }

  async function exportData() {
    const dump: Record<string, unknown> = { exported_at: new Date().toISOString() }
    for (const name of SYNC_TABLES) dump[name] = (await table(name).where('user_id').equals(uid).toArray()).filter((r) => !r.deleted)
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `spor-yedek-${new Date().toISOString().slice(0, 10)}.json`
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
          <h3 className="mb-3 font-semibold text-white">Profil</h3>
          <div className="space-y-3">
            <Field label="Ad">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Boy (cm)">
                <Input value={height} onChange={(e) => setHeight(e.target.value)} inputMode="decimal" />
              </Field>
              <Field label="Doğum yılı">
                <Input value={birthYear} onChange={(e) => setBirthYear(e.target.value)} inputMode="numeric" />
              </Field>
            </div>
            <Button className="w-full" onClick={saveProfile}>
              {saved ? 'Kaydedildi ✓' : 'Kaydet'}
            </Button>
          </div>
        </Card>

        <Card>
          <h3 className="mb-1 font-semibold text-white">Program</h3>
          <p className="mb-3 text-xs text-slate-400">Seçili plan programı ve beslenme hedeflerini belirler.</p>
          <div className="space-y-2">
            {(Object.keys(PLAN_LABELS) as PlanKey[]).map((key) => (
              <button
                key={key}
                onClick={() => switchPlan(key)}
                className={cx(
                  'w-full rounded-xl border p-3 text-left',
                  profile.plan_key === key ? 'border-accent bg-emerald-500/10' : 'border-white/10',
                )}
              >
                <div className="font-semibold text-white">
                  {PLAN_LABELS[key].title}
                  {profile.plan_key === key && <span className="ml-2 text-xs text-emerald-300">seçili · dokun: sıfırla</span>}
                </div>
                <div className="mt-0.5 text-xs text-slate-400">{PLAN_LABELS[key].summary}</div>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-2 font-semibold text-white">Hesap ve eşitleme</h3>
          {uid === LOCAL_USER ? (
            <>
              <p className="mb-3 text-sm text-slate-400">
                Hesapsız kullanıyorsun; veriler yalnızca bu telefonda. {supabase ? 'Hesaba bağlanınca mevcut verilerin hesabına taşınır.' : ''}
              </p>
              {supabase && <Button variant="secondary" className="w-full" onClick={connectAccount}>Hesaba bağlan</Button>}
            </>
          ) : (
            <>
              <p className="text-sm text-slate-300">{email}</p>
              <p className="mb-3 mt-1 text-xs text-slate-500">
                {sync.status === 'error' && <span className="text-red-300">Hata: {sync.error}. </span>}
                {sync.pending > 0 ? `${sync.pending} değişiklik gönderilmeyi bekliyor. ` : 'Tüm veriler bulutta. '}
                {sync.lastSync && `Son eşitleme ${new Date(sync.lastSync).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}.`}
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => syncNow(supabase, uid)}>Şimdi eşitle</Button>
                <Button variant="danger" onClick={signOut}>Çıkış</Button>
              </div>
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
