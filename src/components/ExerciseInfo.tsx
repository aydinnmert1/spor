import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { CATEGORY_TR, EQUIPMENT_TR, LEVEL_TR, MUSCLES_TR } from '../data/exercises-tr'
import { alive, db, save } from '../lib/db'
import { imageUrl, youtubeSearchUrl, type Exercise } from '../lib/exercises'
import { useUid } from '../lib/user'
import { Button, Field, Input } from './ui'

/** Alternates the start/end photos so the movement reads like a short animation. */
export function ExerciseImages({ ex, size = 'lg' }: { ex: Exercise; size?: 'sm' | 'lg' }) {
  const [frame, setFrame] = useState(0)
  useEffect(() => {
    if (ex.images.length < 2) return
    const id = setInterval(() => setFrame((f) => (f + 1) % ex.images.length), 1200)
    return () => clearInterval(id)
  }, [ex.images.length])
  if (ex.images.length === 0) return null
  return (
    <div className={size === 'lg' ? 'relative aspect-[4/3] overflow-hidden rounded-2xl bg-white' : 'relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-white'}>
      {ex.images.map((img, i) => (
        <img
          key={img}
          src={imageUrl(img)}
          alt={ex.name}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-contain transition-opacity duration-300"
          style={{ opacity: i === frame ? 1 : 0 }}
        />
      ))}
    </div>
  )
}

function youtubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/)
  return m ? m[1] : null
}

export function ExerciseInfo({ ex }: { ex: Exercise }) {
  const uid = useUid()
  const note = useLiveQuery(
    async () => alive(await db.exercise_notes.where('exercise_id').equals(ex.id).toArray()).find((n) => n.user_id === uid) ?? null,
    [ex.id, uid],
  )
  const [editing, setEditing] = useState(false)
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')

  function startEdit() {
    setUrl(note?.youtube_url ?? '')
    setText(note?.note ?? '')
    setEditing(true)
  }

  async function saveNote() {
    await save('exercise_notes', { id: note?.id, exercise_id: ex.id, youtube_url: url.trim(), note: text.trim() })
    setEditing(false)
  }

  const vid = note?.youtube_url ? youtubeId(note.youtube_url) : null

  return (
    <div className="space-y-4">
      <ExerciseImages ex={ex} />

      <div className="flex flex-wrap gap-1.5 text-xs">
        {ex.primaryMuscles.map((m) => (
          <span key={m} className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-emerald-300">{MUSCLES_TR[m] ?? m}</span>
        ))}
        {ex.secondaryMuscles.map((m) => (
          <span key={m} className="rounded-full bg-slate-700 px-2.5 py-1 text-slate-300">{MUSCLES_TR[m] ?? m}</span>
        ))}
        {ex.equipment && <span className="rounded-full bg-slate-800 px-2.5 py-1 text-slate-400">{EQUIPMENT_TR[ex.equipment] ?? ex.equipment}</span>}
        <span className="rounded-full bg-slate-800 px-2.5 py-1 text-slate-400">{CATEGORY_TR[ex.category] ?? ex.category}</span>
        <span className="rounded-full bg-slate-800 px-2.5 py-1 text-slate-400">{LEVEL_TR[ex.level] ?? ex.level}</span>
      </div>

      <div>
        <h3 className="mb-2 font-semibold text-white">Nasıl yapılır?</h3>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-300">
          {ex.instructions.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
        {!ex.instructionsTr && <p className="mt-2 text-xs text-slate-500">Bu hareketin talimatları kaynak veritabanından (İngilizce).</p>}
        {ex.tips && <p className="mt-3 rounded-xl bg-amber-500/10 p-3 text-sm text-amber-200">💡 {ex.tips}</p>}
      </div>

      <div>
        <h3 className="mb-2 font-semibold text-white">Video</h3>
        {vid ? (
          <div className="aspect-video overflow-hidden rounded-2xl bg-black">
            <iframe
              className="h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${vid}`}
              title={ex.name}
              allow="encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <a
            href={youtubeSearchUrl(ex)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-red-500/15 py-3 font-semibold text-red-300"
          >
            ▶ YouTube’da nasıl yapıldığını izle
          </a>
        )}
        {note?.note && !editing && <p className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-800 p-3 text-sm text-slate-200">📝 {note.note}</p>}
        {editing ? (
          <div className="mt-3 space-y-3">
            <Field label="YouTube linki" hint="Beğendiğin bir anlatım videosunun linkini yapıştır, burada gömülü oynatılır.">
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://youtu.be/…" inputMode="url" />
            </Field>
            <Field label="Kişisel not">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-3 py-2.5 text-white outline-none focus:border-accent"
                placeholder="Ör. koltuk ayarı 4, dar tutuş…"
              />
            </Field>
            <div className="flex gap-2">
              <Button onClick={saveNote} className="flex-1">Kaydet</Button>
              <Button variant="secondary" onClick={() => setEditing(false)}>Vazgeç</Button>
            </div>
          </div>
        ) : (
          <button onClick={startEdit} className="mt-3 text-sm font-semibold text-accent">
            {note ? 'Video / notu düzenle' : '+ Kendi video linkini veya notunu ekle'}
          </button>
        )}
      </div>
    </div>
  )
}
