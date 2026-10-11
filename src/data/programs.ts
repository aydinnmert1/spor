import type { Block, PlanKey } from '../lib/types'

// Upper/Lower split, version 3 (2026-10-11): no cardio finishers on lifting days.
// Mon Upper A · Tue Lower A · Wed cardio · Thu Upper B · Fri Lower B · Sat/Sun cardio.
// Cardio days are identical for both: 45 min bike (Wed), incline walk (Sat), elliptical (Sun).
// Same days and stations for both; protocol differs:
// - "guc" (Mert, strength, 10+ years): main lifts 3-6 reps, long rest. Bench and
//   squat are each trained twice a week (bench + incline bench, back + front squat).
// - "sikilasma" (Simge, fat loss + toning, ~1 year): 8-15 reps, 45-90 s rest,
//   with cardio on its own days (Wed/Sat/Sun).
// Every session is capped at 60 minutes; see estimateMinutes and its test.

/** Bump to replace everyone's active program with this template on next launch. */
export const TEMPLATE_VERSION = 3

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
    title: 'Güç odaklı · Upper/Lower',
    summary:
      'Pzt Upper A · Sal Lower A · Per Upper B · Cum Lower B, Çar/Cmt/Paz 45 dk kardiyo. Bench, squat ve deadlift ağır ve az tekrarlı; bench ile squat haftada ikişer kez.',
    progression:
      'Ana kaldırışta bütün setlerde üst tekrar sınırına ulaşınca bir sonraki antrenmanda kiloyu artır: squat/deadlift +2,5 kg, bench/press +1,25-2,5 kg. Yardımcı hareketlerde de aynı mantık. Bir hareket 2 antrenman üst üste takılırsa o hareketin kilosunu %10 düşürüp yeniden tırman.',
  },
  sikilasma: {
    title: 'Kilo verme + sıkılaşma · Upper/Lower',
    summary:
      'Aynı günler ve istasyonlar; 8-15 tekrar, kısa dinlenme. Kardiyo ağırlık günlerinden ayrı: Çar/Cmt/Paz 45 dk tempolu kardiyo.',
    progression:
      'Çift ilerleme: bir hareketin bütün setlerinde üst tekrar sınırına (ör. 12) rahat ulaşınca bir sonraki antrenmanda kiloyu bir kademe artır, tekrar alt sınırdan (ör. 10) başlayıp yeniden yukarı tırman.',
  },
}

export const PROGRAM_NAME: Record<PlanKey, string> = {
  guc: 'Upper/Lower · Güç',
  sikilasma: 'Upper/Lower · Sıkılaşma',
}

const WARMUP = 'Önce 5 dk genel ısınma (bisiklet/kürek + mobilite), sonra kademeli ısınma setleri.'

export const TEMPLATE: TemplateDay[] = [
  {
    name: 'Pazartesi · Upper A (Bench)',
    weekday: 1,
    items: [
      { exercise: 'Barbell_Bench_Press_-_Medium_Grip', block: 'main', guc: [4, 4, 6, 180], sikilasma: [3, 10, 12, 90], note: WARMUP },
      { exercise: 'Bent_Over_Barbell_Row', block: 'accessory', guc: [3, 6, 8, 120], sikilasma: [3, 10, 12, 75], note: 'Sırt düz, bar göbeğe. Bel yorulursa göğüs destekli row makinesi.' },
      {
        exercise: 'Standing_Military_Press',
        exerciseFor: { sikilasma: 'Dumbbell_Shoulder_Press' },
        block: 'main',
        guc: [3, 5, 6, 150],
        sikilasma: [3, 10, 12, 90],
        note: '1-2 ısınma seti yeterli; omuzlar bench’ten sıcak.',
      },
      { exercise: 'Wide-Grip_Lat_Pulldown', block: 'accessory', guc: [3, 8, 10, 90], sikilasma: [3, 12, 15, 60] },
      { exercise: 'Barbell_Curl', block: 'accessory', guc: [3, 10, 12, 0], sikilasma: [3, 12, 15, 0], note: 'Süperset 1/2: dinlenmeden pushdown’a geç.' },
      { exercise: 'Triceps_Pushdown_-_Rope_Attachment', block: 'accessory', guc: [3, 10, 12, 60], sikilasma: [3, 12, 15, 45], note: 'Süperset 2/2: sonra dinlen, curl’e dön.' },
    ],
  },
  {
    name: 'Salı · Lower A (Squat)',
    weekday: 2,
    items: [
      {
        exercise: 'Barbell_Squat',
        block: 'main',
        guc: [4, 4, 6, 180],
        sikilasma: [3, 10, 12, 90],
        note: WARMUP,
        noteFor: { sikilasma: 'Bar formu bozuluyorsa o gün goblet squat yap.' },
      },
      { exercise: 'Romanian_Deadlift', block: 'accessory', guc: [3, 6, 8, 120], sikilasma: [3, 10, 12, 75], note: 'Ağır ama kontrollü; 2-3 sn iniş.' },
      { exercise: 'Split_Squat_with_Dumbbells', block: 'accessory', perSide: true, guc: [3, 8, 10, 90], sikilasma: [3, 10, 12, 60], note: 'Tekrar her bacak için. Arka ayak sehpada = Bulgarian split squat. Alternatif: leg press.' },
      { exercise: 'Lying_Leg_Curls', block: 'accessory', guc: [2, 10, 12, 60], sikilasma: [3, 12, 15, 45] },
      { exercise: 'Standing_Calf_Raises', block: 'accessory', guc: [3, 10, 12, 60], sikilasma: [3, 15, 15, 45], note: 'Altta 1 sn esnet, üstte 1 sn sık.' },
      { exercise: 'Barbell_Shrug', block: 'accessory', guc: [3, 10, 12, 60], sikilasma: null, note: 'Tepede 1 sn sık; omuzları döndürme, sadece yukarı-aşağı.' },
      { exercise: 'Plank', block: 'accessory', guc: [2, 45, 60, 45], sikilasma: [3, 30, 45, 30], note: 'Tekrar = saniye' },
    ],
  },
  {
    name: 'Çarşamba · Kardiyo',
    weekday: 3,
    items: [
      {
        exercise: 'Bicycling_Stationary',
        block: 'cardio',
        guc: CARDIO,
        sikilasma: CARDIO,
        minutes: { guc: 45, sikilasma: 45 },
        note: 'Bölge 2: konuşabileceğin ama şarkı söyleyemeyeceğin tempo. Orta direnç, 80-90 devir.',
      },
    ],
  },
  {
    name: 'Perşembe · Upper B (Eğimli press + çekiş)',
    weekday: 4,
    items: [
      {
        exercise: 'Barbell_Incline_Bench_Press_-_Medium_Grip',
        exerciseFor: { sikilasma: 'Incline_Dumbbell_Press' },
        block: 'main',
        guc: [4, 5, 6, 150],
        sikilasma: [3, 10, 12, 90],
        note: WARMUP,
      },
      {
        exercise: 'Pullups',
        exerciseFor: { sikilasma: 'Band_Assisted_Pull-Up' },
        block: 'accessory',
        guc: [4, 5, 8, 120],
        sikilasma: [3, 8, 10, 75],
        noteFor: { guc: '8 tekrarı rahat geçince ağırlık kemeri ekle.', sikilasma: 'Asist makinesi de olur; asisti azaltarak ilerle.' },
      },
      { exercise: 'Seated_Cable_Rows', block: 'accessory', guc: [3, 8, 10, 90], sikilasma: [3, 12, 12, 60], note: 'Dar tutuş, kürek kemiklerini sık.' },
      { exercise: 'Side_Lateral_Raise', block: 'accessory', guc: [3, 12, 15, 45], sikilasma: [3, 15, 15, 45] },
      { exercise: 'Face_Pull', block: 'accessory', guc: [2, 15, 20, 45], sikilasma: [2, 15, 20, 45], note: 'Omuz sağlığı ve duruş için.' },
      { exercise: 'Incline_Dumbbell_Curl', block: 'accessory', guc: [3, 10, 12, 0], sikilasma: [3, 12, 12, 0], note: 'Süperset 1/2: dinlenmeden skullcrusher’a geç.' },
      { exercise: 'EZ-Bar_Skullcrusher', block: 'accessory', guc: [3, 10, 12, 60], sikilasma: [3, 12, 12, 45], note: 'Süperset 2/2: sonra dinlen, curl’e dön.' },
    ],
  },
  {
    name: 'Cuma · Lower B (Deadlift)',
    weekday: 5,
    items: [
      { exercise: 'Barbell_Deadlift', block: 'main', guc: [4, 3, 5, 210], sikilasma: [3, 8, 10, 120], note: WARMUP, noteFor: { sikilasma: 'Hafif-orta kilo, form öncelikli.' } },
      {
        exercise: 'Front_Barbell_Squat',
        exerciseFor: { sikilasma: 'Barbell_Hip_Thrust' },
        block: 'main',
        guc: [3, 5, 6, 150],
        sikilasma: [3, 10, 12, 75],
        noteFor: { guc: 'Haftanın 2. squat günü; Salı’dan ~%15 hafif.', sikilasma: 'Kalça için en etkili hareket; tepede 1 sn sık.' },
      },
      { exercise: 'Dumbbell_Lunges', block: 'accessory', perSide: true, guc: [3, 10, 10, 90], sikilasma: [3, 10, 12, 60], note: 'Yürüyerek lunge; tekrar her bacak için.' },
      { exercise: 'Leg_Extensions', block: 'accessory', guc: [3, 10, 12, 60], sikilasma: [3, 15, 15, 45] },
      { exercise: 'Seated_Calf_Raise', block: 'accessory', guc: null, sikilasma: [2, 15, 20, 45] },
      {
        exercise: 'Hanging_Leg_Raise',
        block: 'accessory',
        guc: [3, 10, 15, 0],
        sikilasma: [3, 8, 12, 45],
        noteFor: { guc: 'Süperset 1/2: dinlenmeden wrist curl’e geç.', sikilasma: 'Zor gelirse dizleri bükerek.' },
      },
      {
        exercise: 'Palms-Up_Barbell_Wrist_Curl_Over_A_Bench',
        block: 'accessory',
        guc: [3, 15, 20, 60],
        sikilasma: null,
        note: 'Süperset 2/2: sonra dinlen, bacak kaldırmaya dön. Ön kol ve kavrama gücü.',
      },
    ],
  },
  {
    name: 'Cumartesi · Kardiyo',
    weekday: 6,
    items: [
      {
        exercise: 'Walking_Treadmill',
        block: 'cardio',
        guc: CARDIO,
        sikilasma: CARDIO,
        minutes: { guc: 45, sikilasma: 45 },
        note: 'Eğim %8-12, 5-6 km/s tempolu yürüyüş; tutunmadan.',
      },
    ],
  },
  {
    name: 'Pazar · Kardiyo',
    weekday: 7,
    items: [
      {
        exercise: 'Elliptical_Trainer',
        block: 'cardio',
        guc: CARDIO,
        sikilasma: CARDIO,
        minutes: { guc: 45, sikilasma: 45 },
        note: 'Orta direnç, sabit tempo; konuşabileceğin yoğunluk.',
      },
    ],
  },
]
