import type { Block, PlanKey } from '../lib/types'

// Each plan has its own weekly template:
// - "guc" (Mert, strength, 10+ years), v5 (2026-10-22): 4 lifting days, Mon squat,
//   Tue bench, Thu deadlift, Fri overhead press. Each opens with the main lift and is
//   followed by two supersets of non-competing pairs (push + pull, core + grip) for
//   grip, core and pushing/pulling strength; Friday adds leg curl + calf raise.
//   Wed/Sat/Sun cardio is optional.
// - "sikilasma" (Simge, fat loss + toning, ~1 year), v5 (2026-11-02): two full-body
//   days (Mon, Thu), 10-15 reps, 30-90 s rest; every other day is optional cardio.
// Every session is capped at 60 minutes; see estimateMinutes and its test.
// Supersets: the first exercise has 0 s rest, the second carries the rest between rounds.

/** Bump a plan's version to replace that plan's active program on next launch. */
export const TEMPLATE_VERSION: Record<PlanKey, number> = { guc: 6, sikilasma: 5 }

/** [sets, repMin, repMax, restSec] */
type Dose = [number, number, number, number]

const CARDIO: Dose = [1, 1, 1, 0]

export interface TemplateItem {
  exercise: string
  /** Per-plan variant of the station (e.g. dumbbells instead of a barbell). */
  exerciseFor?: Partial<Record<PlanKey, string>>
  block: Block
  guc: Dose | null
  sikilasma: Dose | null
  /** Reps are per leg/arm, so each set takes roughly twice as long. */
  perSide?: boolean
  /** Cardio target minutes per plan */
  minutes?: Partial<Record<PlanKey, number>>
  note?: string
  noteFor?: Partial<Record<PlanKey, string>>
}

export interface TemplateDay {
  name: string
  weekday: number
  optional?: Partial<Record<PlanKey, boolean>>
  items: TemplateItem[]
}

export const PLAN_LABELS: Record<PlanKey, { title: string; summary: string; progression: string }> = {
  guc: {
    title: 'Güç odaklı · 4 gün + süperset',
    summary:
      'Pzt squat · Sal bench · Per deadlift · Cum ayakta omuz press. Her gün ana kaldırış + iki uyumlu süperset (itme + çekme, karın + kavrama); Cuma ek olarak arka bacak + baldır. Çar/Cmt/Paz kardiyo isteğe bağlı.',
    progression:
      'Ana kaldırışlarda bütün setlerde üst tekrar sınırına ulaşınca bir sonraki hafta kiloyu artır: squat/deadlift +2,5 kg, bench +1,25-2,5 kg, omuz press +1-1,25 kg (mikro plaka). Yardımcı hareketlerde de üst tekrar sınırına ulaşınca kilo artır. Her 5-6 haftada bir hafif hafta: setleri yarıya indir, kilolar ~%10 düşük.',
  },
  sikilasma: {
    title: 'Sıkılaşma · 2 gün tüm vücut',
    summary:
      'Pzt ve Per tüm vücut ağırlık (~44 dk), 10-15 tekrar ve kısa dinlenme. Diğer günler 45 dk kardiyo, isteğe bağlı.',
    progression:
      'Çift ilerleme: bir hareketin bütün setlerinde üst tekrar sınırına (ör. 12) rahat ulaşınca bir sonraki antrenmanda kiloyu bir kademe artır, tekrar alt sınırdan (ör. 10) başlayıp yeniden yukarı tırman.',
  },
}

export const PROGRAM_NAME: Record<PlanKey, string> = {
  guc: '4 Gün · Güç + Süperset',
  sikilasma: '2 Gün · Tüm Vücut Sıkılaşma',
}

const WARMUP = 'Önce 5 dk genel ısınma (bisiklet/kürek + mobilite), sonra kademeli ısınma setleri.'

/** Simge's week: two full-body days, everything else optional cardio. */
const FULL_BODY: TemplateDay[] = [
  {
    name: 'Pazartesi · Tüm Vücut A',
    weekday: 1,
    items: [
      { exercise: 'Barbell_Squat', block: 'main', guc: null, sikilasma: [3, 10, 12, 90], note: `${WARMUP} Bar formu bozuluyorsa o gün goblet squat yap.` },
      { exercise: 'Barbell_Bench_Press_-_Medium_Grip', block: 'main', guc: null, sikilasma: [3, 10, 12, 90], note: '1-2 hafif ısınma seti yeterli.' },
      { exercise: 'Seated_Cable_Rows', block: 'accessory', guc: null, sikilasma: [3, 10, 12, 75], note: 'Kürek kemiklerini sık; gövdeyle sallanma.' },
      { exercise: 'Barbell_Hip_Thrust', block: 'accessory', guc: null, sikilasma: [3, 10, 12, 75], note: 'Tepede 1 sn kalçayı sık.' },
      { exercise: 'Side_Lateral_Raise', block: 'accessory', guc: null, sikilasma: [2, 12, 15, 45] },
      { exercise: 'Plank', block: 'accessory', guc: null, sikilasma: [3, 30, 45, 30], note: 'Tekrar = saniye' },
    ],
  },
  {
    name: 'Salı · Kardiyo (isteğe bağlı)',
    weekday: 2,
    optional: { sikilasma: true },
    items: [{ exercise: 'Walking_Treadmill', block: 'cardio', guc: null, sikilasma: CARDIO, minutes: { sikilasma: 45 }, note: 'İsteğe bağlı. Eğim %8-12, 5-6 km/s tempolu yürüyüş.' }],
  },
  {
    name: 'Çarşamba · Kardiyo (isteğe bağlı)',
    weekday: 3,
    optional: { sikilasma: true },
    items: [{ exercise: 'Bicycling_Stationary', block: 'cardio', guc: null, sikilasma: CARDIO, minutes: { sikilasma: 45 }, note: 'İsteğe bağlı. Konuşabileceğin tempo, orta direnç.' }],
  },
  {
    name: 'Perşembe · Tüm Vücut B',
    weekday: 4,
    items: [
      { exercise: 'Romanian_Deadlift', block: 'main', guc: null, sikilasma: [3, 10, 12, 90], note: `${WARMUP} Sırt düz, 2-3 sn iniş.` },
      { exercise: 'Leg_Press', block: 'accessory', guc: null, sikilasma: [3, 12, 15, 60], note: 'Ayaklar platformun ortasında, kalça pedden kalkmasın.' },
      { exercise: 'Dumbbell_Shoulder_Press', block: 'accessory', guc: null, sikilasma: [3, 10, 12, 75] },
      { exercise: 'Wide-Grip_Lat_Pulldown', block: 'accessory', guc: null, sikilasma: [3, 10, 12, 60] },
      { exercise: 'Incline_Dumbbell_Press', block: 'accessory', guc: null, sikilasma: [2, 10, 12, 60] },
      { exercise: 'Reverse_Machine_Flyes', block: 'accessory', guc: null, sikilasma: [2, 15, 20, 45], note: 'Arka omuz; omuz sağlığı ve duruş için.' },
      { exercise: 'Hanging_Leg_Raise', block: 'accessory', guc: null, sikilasma: [3, 8, 12, 45], note: 'Zor gelirse dizleri bükerek.' },
    ],
  },
  {
    name: 'Cuma · Kardiyo (isteğe bağlı)',
    weekday: 5,
    optional: { sikilasma: true },
    items: [{ exercise: 'Elliptical_Trainer', block: 'cardio', guc: null, sikilasma: CARDIO, minutes: { sikilasma: 45 }, note: 'İsteğe bağlı. Orta direnç, sabit tempo.' }],
  },
  {
    name: 'Cumartesi · Kardiyo (isteğe bağlı)',
    weekday: 6,
    optional: { sikilasma: true },
    items: [{ exercise: 'Walking_Treadmill', block: 'cardio', guc: null, sikilasma: CARDIO, minutes: { sikilasma: 45 }, note: 'İsteğe bağlı. Eğimli bantta ya da dışarıda tempolu yürüyüş.' }],
  },
  {
    name: 'Pazar · Kardiyo (isteğe bağlı)',
    weekday: 7,
    optional: { sikilasma: true },
    items: [{ exercise: 'Elliptical_Trainer', block: 'cardio', guc: null, sikilasma: CARDIO, minutes: { sikilasma: 45 }, note: 'İsteğe bağlı. Eliptik ya da dışarıda tempolu yürüyüş.' }],
  },
]

const HEAVY = 'Ağır gün. Önce 5 dk genel ısınma, sonra kademeli ısınma setleri (bar → %40 → %60 → %75 → %85).'
const SS1 = (next: string) => `Süperset 1/2: dinlenmeden ${next}’e geç.`
const SS2 = (prev: string) => `Süperset 2/2: sonra dinlen, ${prev}’e dön.`

/** Mert's 4-day week: one main lift + two supersets per day (Friday adds a legs superset). */
const FOUR_DAY: TemplateDay[] = [
  {
    name: 'Pazartesi · Squat',
    weekday: 1,
    items: [
      { exercise: 'Barbell_Squat', block: 'main', guc: [5, 3, 5, 180], sikilasma: null, note: `${HEAVY} ~%80-87 1RM.` },
      { exercise: 'Dumbbell_Shoulder_Press', block: 'accessory', guc: [3, 8, 10, 0], sikilasma: null, note: `Dikey itme (hacim; ağır omuz günü Cuma). ${SS1('barfiks')}` },
      { exercise: 'Pullups', block: 'accessory', guc: [4, 5, 6, 120], sikilasma: null, note: `Dikey çekme, ağırlık kemeriyle. ${SS2('press')} 4. sette barfiks tek.` },
      { exercise: 'Hanging_Leg_Raise', block: 'accessory', guc: [3, 10, 15, 0], sikilasma: null, note: `Karın. ${SS1('wrist curl')}` },
      { exercise: 'Palms-Up_Barbell_Wrist_Curl_Over_A_Bench', block: 'accessory', guc: [3, 15, 20, 60], sikilasma: null, note: `Kavrama. ${SS2('bacak kaldırma')}` },
    ],
  },
  {
    name: 'Salı · Bench',
    weekday: 2,
    items: [
      { exercise: 'Barbell_Bench_Press_-_Medium_Grip', block: 'main', guc: [5, 3, 5, 180], sikilasma: null, note: `${HEAVY} ~%80-87 1RM.` },
      { exercise: 'Dips_-_Chest_Version', block: 'accessory', guc: [3, 6, 8, 0], sikilasma: null, note: `İtme, ağırlık kemeriyle. ${SS1('row')}` },
      { exercise: 'Bent_Over_Barbell_Row', block: 'accessory', guc: [4, 6, 8, 120], sikilasma: null, note: `Yatay çekme. ${SS2('dips')} 4. sette row tek.` },
      { exercise: 'Ab_Roller', block: 'accessory', guc: [3, 8, 12, 0], sikilasma: null, note: `Karın (öne kaymaya direnç). ${SS1('farmer’s walk')}` },
      { exercise: 'Farmers_Walk', block: 'accessory', guc: [3, 30, 40, 90], sikilasma: null, note: `Kavrama. Tekrar = metre. ${SS2('ab wheel')}` },
    ],
  },
  {
    name: 'Çarşamba · Kardiyo (isteğe bağlı)',
    weekday: 3,
    optional: { guc: true },
    items: [
      { exercise: 'Bicycling_Stationary', block: 'cardio', guc: CARDIO, sikilasma: null, minutes: { guc: 45 }, note: 'İsteğe bağlı. Bölge 2: konuşabileceğin tempo, orta direnç.' },
    ],
  },
  {
    name: 'Perşembe · Deadlift',
    weekday: 4,
    items: [
      { exercise: 'Barbell_Deadlift', block: 'main', guc: [4, 2, 4, 210], sikilasma: null, note: `${HEAVY} ~%85-90 1RM.` },
      { exercise: 'Leg_Press', block: 'accessory', guc: [3, 8, 10, 0], sikilasma: null, note: `Ön bacak + kalça. ${SS1('chin-up')}` },
      { exercise: 'Chin-Up', block: 'accessory', guc: [3, 6, 8, 90], sikilasma: null, note: `Çekme, ağırlık kemeriyle. ${SS2('leg press')}` },
      { exercise: 'Pallof_Press', block: 'accessory', perSide: true, guc: [3, 10, 10, 0], sikilasma: null, note: `Karın (dönmeye direnç). Tekrar her taraf için. ${SS1('reverse curl')}` },
      { exercise: 'Reverse_Barbell_Curl', block: 'accessory', guc: [3, 10, 12, 60], sikilasma: null, note: `Ön kol dış yüzü. ${SS2('Pallof press')}` },
    ],
  },
  {
    name: 'Cuma · Omuz press',
    weekday: 5,
    items: [
      { exercise: 'Standing_Military_Press', block: 'main', guc: [5, 3, 5, 150], sikilasma: null, note: `${HEAVY} Ayakta, sıkı form; kalçayı ve karnı sık.` },
      { exercise: 'Incline_Dumbbell_Press', block: 'accessory', guc: [3, 8, 10, 0], sikilasma: null, note: `Eğimli itme. ${SS1('row')}` },
      { exercise: 'One-Arm_Dumbbell_Row', block: 'accessory', perSide: true, guc: [3, 8, 10, 90], sikilasma: null, note: `Yatay çekme, tekrar her kol için. ${SS2('press')}` },
      { exercise: 'Side_Bridge', block: 'accessory', perSide: true, guc: [3, 30, 45, 0], sikilasma: null, note: `Karın (yana eğilmeye direnç). Tekrar = saniye, her taraf. ${SS1('hammer curl')}` },
      { exercise: 'Hammer_Curls', block: 'accessory', guc: [3, 10, 12, 60], sikilasma: null, note: `Kavrama + ön kol. ${SS2('yan plank')}` },
      { exercise: 'Lying_Leg_Curls', block: 'accessory', guc: [3, 10, 12, 0], sikilasma: null, note: `Arka bacak. ${SS1('baldır kaldırma')}` },
      { exercise: 'Standing_Calf_Raises', block: 'accessory', guc: [3, 10, 12, 60], sikilasma: null, note: `Baldır; altta 1 sn esnet. ${SS2('leg curl')}` },
    ],
  },
  {
    name: 'Cumartesi · Kardiyo (isteğe bağlı)',
    weekday: 6,
    optional: { guc: true },
    items: [
      { exercise: 'Walking_Treadmill', block: 'cardio', guc: CARDIO, sikilasma: null, minutes: { guc: 45 }, note: 'İsteğe bağlı. Eğim %8-12, 5-6 km/s tempolu yürüyüş.' },
    ],
  },
  {
    name: 'Pazar · Kardiyo (isteğe bağlı)',
    weekday: 7,
    optional: { guc: true },
    items: [
      { exercise: 'Elliptical_Trainer', block: 'cardio', guc: CARDIO, sikilasma: null, minutes: { guc: 45 }, note: 'İsteğe bağlı. Orta direnç, sabit tempo.' },
    ],
  },
]

export const TEMPLATES: Record<PlanKey, TemplateDay[]> = {
  guc: FOUR_DAY,
  sikilasma: FULL_BODY,
}
