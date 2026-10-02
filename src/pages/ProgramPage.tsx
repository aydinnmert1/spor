import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { ExerciseList } from '../components/ExercisePicker'
import { BLOCK_LABEL, Button, Card, cx, Empty, Field, Input, Page, parseNum, Segmented, Sheet } from '../components/ui'
import { save, remove } from '../lib/db'
import { exerciseName, useExercises } from '../lib/exercises'
import type { Block, ProgramDay, ProgramItem } from '../lib/types'
import { useUid } from '../lib/user'
import { activeProgram, dayItems, formatDuration, programDays, repRange } from '../lib/workout'

const WEEKDAY_NAMES = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']

export default function ProgramPage() {
  const uid = useUid()
  const exercises = useExercises()
  const [open, setOpen] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<ProgramItem | null>(null)
  const [addingTo, setAddingTo] = useState<ProgramDay | null>(null)
  const [editingDay, setEditingDay] = useState<ProgramDay | 'new' | null>(null)

  const data = useLiveQuery(async () => {
    const program = await activeProgram(uid)
    if (!program) return { program: null, days: [] }
    const days = await programDays(program.id)
    const withItems = await Promise.all(days.map(async (d) => ({ day: d, items: await dayItems(d.id) })))
    return { program, days: withItems }
  }, [uid])

  if (!data) return null
  if (!data.program) return <Page title="Program"><Empty>Aktif program yok. Ayarlar’dan şablon yükleyebilirsin.</Empty></Page>

  async function move(items: ProgramItem[], index: number, dir: -1 | 1) {
    const j = index + dir
    if (j < 0 || j >= items.length) return
    const a = items[index]
    const b = items[j]
    await save('program_items', { ...a, position: b.position })
    await save('program_items', { ...b, position: a.position })
  }

  async function addExercise(day: ProgramDay, exerciseId: string, items: ProgramItem[]) {
    const cardio = exercises?.get(exerciseId)?.category === 'cardio'
    const item = await save('program_items', {
      day_id: day.id,
      position: (items.at(-1)?.position ?? -1) + 1,
      exercise_id: exerciseId,
      block: cardio ? 'cardio' : 'accessory',
      sets: cardio ? 1 : 3,
      rep_min: cardio ? 1 : 8,
      rep_max: cardio ? 1 : 12,
      rest_sec: cardio ? 0 : 90,
      duration_min: cardio ? 15 : null,
      note: '',
    })
    setAddingTo(null)
    setEditingItem(item)
  }

  const program = data.program

  return (
    <Page title={program.name}>
      <p className="mb-4 text-sm text-slate-400">Bir güne dokunarak hareketleri gör; harekete dokunarak set, tekrar ve dinlenmeyi değiştir.</p>
      <div className="space-y-3">
        {data.days.map(({ day, items }) => {
          const isOpen = open === day.id
          return (
            <Card key={day.id} className="p-0">
              <button onClick={() => setOpen(isOpen ? null : day.id)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
                <div>
                  <div className="font-semibold text-white">{day.name}</div>
                  <div className="text-xs text-slate-400">
                    {items.length} hareket{day.optional && ' · isteğe bağlı'}
                  </div>
                </div>
                <span className="text-slate-500">{isOpen ? '▾' : '▸'}</span>
              </button>
              {isOpen && (
                <div className="border-t border-white/5 px-4 pb-4">
                  <ul className="divide-y divide-white/5">
                    {items.map((it, i) => (
                      <li key={it.id} className="flex items-center gap-2 py-2.5">
                        <div className="flex flex-col">
                          <button onClick={() => move(items, i, -1)} className="px-1 text-xs text-slate-500 disabled:opacity-20" disabled={i === 0} aria-label="Yukarı">▲</button>
                          <button onClick={() => move(items, i, 1)} className="px-1 text-xs text-slate-500 disabled:opacity-20" disabled={i === items.length - 1} aria-label="Aşağı">▼</button>
                        </div>
                        <button onClick={() => setEditingItem(it)} className="min-w-0 flex-1 text-left">
                          <div className="truncate text-sm font-medium text-slate-100">{exerciseName(exercises, it.exercise_id)}</div>
                          <div className="text-xs text-slate-500">
                            {BLOCK_LABEL[it.block]} ·{' '}
                            {it.block === 'cardio' ? `${it.duration_min ?? '—'} dk` : `${it.sets}×${repRange(it)} · ${formatDuration(it.rest_sec * 1000)}`}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex gap-2">
                    <Button variant="secondary" className="flex-1 text-sm" onClick={() => setAddingTo(day)}>+ Hareket</Button>
                    <Button variant="ghost" className="text-sm" onClick={() => setEditingDay(day)}>Günü düzenle</Button>
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>
      <Button variant="ghost" className="mt-3 w-full" onClick={() => setEditingDay('new')}>+ Gün ekle</Button>

      <ItemSheet item={editingItem} name={editingItem ? exerciseName(exercises, editingItem.exercise_id) : ''} onClose={() => setEditingItem(null)} />

      <Sheet open={!!addingTo} onClose={() => setAddingTo(null)} title="Hareket ekle">
        {addingTo && (
          <ExerciseList onPick={(ex) => addExercise(addingTo, ex.id, data.days.find((d) => d.day.id === addingTo.id)?.items ?? [])} />
        )}
      </Sheet>

      <DaySheet
        day={editingDay}
        programId={program.id}
        nextPosition={(data.days.at(-1)?.day.position ?? -1) + 1}
        onClose={() => setEditingDay(null)}
      />
    </Page>
  )
}

function ItemSheet({ item, name, onClose }: { item: ProgramItem | null; name: string; onClose: () => void }) {
  return (
    <Sheet open={!!item} onClose={onClose} title={name}>
      {item && <ItemForm key={item.id + item.updated_at} item={item} onClose={onClose} />}
    </Sheet>
  )
}

function ItemForm({ item, onClose }: { item: ProgramItem; onClose: () => void }) {
  const [block, setBlock] = useState<Block>(item.block)
  const [sets, setSets] = useState(String(item.sets))
  const [repMin, setRepMin] = useState(String(item.rep_min))
  const [repMax, setRepMax] = useState(String(item.rep_max))
  const [rest, setRest] = useState(String(item.rest_sec))
  const [minutes, setMinutes] = useState(item.duration_min ? String(item.duration_min) : '')
  const [note, setNote] = useState(item.note)

  async function submit() {
    const rmin = parseNum(repMin) ?? item.rep_min
    await save('program_items', {
      ...item,
      block,
      sets: Math.max(1, Math.round(parseNum(sets) ?? item.sets)),
      rep_min: Math.round(rmin),
      rep_max: Math.round(Math.max(rmin, parseNum(repMax) ?? rmin)),
      rest_sec: Math.max(0, Math.round(parseNum(rest) ?? item.rest_sec)),
      duration_min: parseNum(minutes),
      note: note.trim(),
    })
    onClose()
  }

  return (
    <div className="space-y-4 pb-4">
      <Segmented
        value={block}
        onChange={setBlock}
        options={[
          { value: 'main', label: BLOCK_LABEL.main },
          { value: 'accessory', label: BLOCK_LABEL.accessory },
          { value: 'cardio', label: BLOCK_LABEL.cardio },
        ]}
      />
      {block === 'cardio' ? (
        <Field label="Süre (dk)">
          <Input value={minutes} onChange={(e) => setMinutes(e.target.value)} inputMode="decimal" />
        </Field>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          <Field label="Set">
            <Input value={sets} onChange={(e) => setSets(e.target.value)} inputMode="numeric" />
          </Field>
          <Field label="Min tekrar">
            <Input value={repMin} onChange={(e) => setRepMin(e.target.value)} inputMode="numeric" />
          </Field>
          <Field label="Max tekrar">
            <Input value={repMax} onChange={(e) => setRepMax(e.target.value)} inputMode="numeric" />
          </Field>
          <Field label="Dinlenme sn">
            <Input value={rest} onChange={(e) => setRest(e.target.value)} inputMode="numeric" />
          </Field>
        </div>
      )}
      <Field label="Not">
        <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ör. önce 3 ısınma seti" />
      </Field>
      <Button className="w-full" onClick={submit}>Kaydet</Button>
      <Button
        variant="danger"
        className="w-full"
        onClick={async () => {
          if (!confirm('Bu hareket programdan çıkarılsın mı?')) return
          await remove('program_items', item.id)
          onClose()
        }}
      >
        Programdan çıkar
      </Button>
    </div>
  )
}

function DaySheet({
  day,
  programId,
  nextPosition,
  onClose,
}: {
  day: ProgramDay | 'new' | null
  programId: string
  nextPosition: number
  onClose: () => void
}) {
  return (
    <Sheet open={!!day} onClose={onClose} title={day === 'new' ? 'Yeni gün' : 'Günü düzenle'}>
      {day && <DayForm key={day === 'new' ? 'new' : day.id} day={day === 'new' ? null : day} programId={programId} nextPosition={nextPosition} onClose={onClose} />}
    </Sheet>
  )
}

function DayForm({ day, programId, nextPosition, onClose }: { day: ProgramDay | null; programId: string; nextPosition: number; onClose: () => void }) {
  const [name, setName] = useState(day?.name ?? '')
  const [weekday, setWeekday] = useState<number | null>(day?.weekday ?? null)
  const [optional, setOptional] = useState(day?.optional ?? false)

  async function submit() {
    if (!name.trim()) return
    await save('program_days', {
      ...(day ?? { program_id: programId, position: nextPosition }),
      name: name.trim(),
      weekday,
      optional,
    } as ProgramDay)
    onClose()
  }

  return (
    <div className="space-y-4 pb-4">
      <Field label="Gün adı">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ör. Pazartesi · Bacak" />
      </Field>
      <div>
        <span className="mb-1 block text-sm text-slate-400">Haftanın günü</span>
        <div className="flex flex-wrap gap-1.5">
          {WEEKDAY_NAMES.map((w, i) => (
            <button
              key={w}
              onClick={() => setWeekday(weekday === i + 1 ? null : i + 1)}
              className={cx('rounded-full px-3 py-1.5 text-xs font-semibold', weekday === i + 1 ? 'bg-accent-strong text-slate-950' : 'bg-slate-800 text-slate-300')}
            >
              {w}
            </button>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-3 text-sm text-slate-300">
        <input type="checkbox" checked={optional} onChange={(e) => setOptional(e.target.checked)} className="h-5 w-5 accent-emerald-500" />
        İsteğe bağlı gün
      </label>
      <Button className="w-full" onClick={submit} disabled={!name.trim()}>Kaydet</Button>
      {day && (
        <Button
          variant="danger"
          className="w-full"
          onClick={async () => {
            if (!confirm('Bu gün programdan silinsin mi? Geçmiş antrenmanların silinmez.')) return
            await remove('program_days', day.id)
            onClose()
          }}
        >
          Günü sil
        </Button>
      )}
    </div>
  )
}
