import type { Block, PlanKey } from '../lib/types'

// Shared weekly skeleton: both partners do the same days and the same exercises.
// "guc" = strength-first, 10+ years, ~60 min.
// "sikilasma" = fat loss + toning, ~1 year: lower volume (about the 45-minute
// share of the strength version) plus a cardio block, also ~60 min in total.

/** [sets, repMin, repMax, restSec] */
type Dose = [number, number, number, number]

export interface TemplateItem {
  exercise: string
  block: Block
  guc: Dose | null
  sikilasma: Dose | null
  /** Cardio target minutes per plan */
  minutes?: Partial<Record<PlanKey, number>>
  note?: string
  noteSikilasma?: string
}

export interface TemplateDay {
  name: string
  weekday: number
  optional?: boolean
  items: TemplateItem[]
}

export const PLAN_LABELS: Record<PlanKey, { title: string; summary: string }> = {
  guc: {
    title: 'Güç odaklı',
    summary: 'Hafta içi 5 gün. Ana kaldırışlarda ağır, az tekrar (güç), ardından kas için yardımcı hareketler. Cuma kondisyon bitirişi.',
  },
  sikilasma: {
    title: 'Kilo verme + sıkılaşma',
    summary: 'Aynı günler ve hareketler; daha az set, orta-yüksek tekrar, kısa dinlenme. Her antrenmanın sonunda 12-15 dk kardiyo.',
  },
}

export const PROGRAM_NAME: Record<PlanKey, string> = {
  guc: 'Güç Programı',
  sikilasma: 'Sıkılaşma Programı',
}

export const TEMPLATE: TemplateDay[] = [
  {
    name: 'Pazartesi · Alt Vücut (Squat)',
    weekday: 1,
    items: [
      { exercise: 'Barbell_Squat', block: 'main', guc: [5, 3, 5, 180], sikilasma: [3, 8, 10, 120], note: 'Ana güç hareketi. Önce 3-4 ısınma seti.' },
      { exercise: 'Romanian_Deadlift', block: 'accessory', guc: [3, 6, 8, 120], sikilasma: [3, 10, 12, 90] },
      { exercise: 'Leg_Press', block: 'accessory', guc: [3, 8, 10, 90], sikilasma: [2, 12, 15, 75] },
      { exercise: 'Lying_Leg_Curls', block: 'accessory', guc: [3, 10, 12, 60], sikilasma: [2, 12, 15, 60] },
      { exercise: 'Seated_Calf_Raise', block: 'accessory', guc: [3, 12, 15, 60], sikilasma: [2, 15, 20, 45] },
      { exercise: 'Plank', block: 'accessory', guc: [3, 45, 60, 45], sikilasma: [2, 30, 45, 45], note: 'Tekrar = saniye' },
      { exercise: 'Walking_Treadmill', block: 'cardio', guc: null, sikilasma: [1, 1, 1, 0], minutes: { sikilasma: 15 }, note: 'Eğim %8-12, 5-6 km/s' },
    ],
  },
  {
    name: 'Salı · Üst Vücut İtiş (Bench)',
    weekday: 2,
    items: [
      { exercise: 'Barbell_Bench_Press_-_Medium_Grip', block: 'main', guc: [5, 3, 5, 180], sikilasma: [3, 8, 10, 120], note: 'Ana güç hareketi. Önce 3-4 ısınma seti.' },
      { exercise: 'Incline_Dumbbell_Press', block: 'accessory', guc: [3, 8, 10, 90], sikilasma: [3, 10, 12, 75] },
      { exercise: 'Seated_Cable_Rows', block: 'accessory', guc: [3, 8, 10, 90], sikilasma: [3, 10, 12, 75] },
      { exercise: 'Side_Lateral_Raise', block: 'accessory', guc: [3, 12, 15, 60], sikilasma: [2, 12, 15, 45] },
      { exercise: 'Triceps_Pushdown_-_Rope_Attachment', block: 'accessory', guc: [3, 10, 12, 60], sikilasma: [2, 12, 15, 45] },
      { exercise: 'Face_Pull', block: 'accessory', guc: [3, 15, 20, 45], sikilasma: [2, 15, 20, 45] },
      { exercise: 'Elliptical_Trainer', block: 'cardio', guc: null, sikilasma: [1, 1, 1, 0], minutes: { sikilasma: 15 } },
    ],
  },
  {
    name: 'Çarşamba · Arka Zincir (Deadlift)',
    weekday: 3,
    items: [
      { exercise: 'Barbell_Deadlift', block: 'main', guc: [5, 2, 4, 210], sikilasma: [3, 6, 8, 120], note: 'Ana güç hareketi. Önce 3-4 ısınma seti.' },
      { exercise: 'Pullups', block: 'accessory', guc: [4, 5, 8, 120], sikilasma: [3, 6, 10, 90], note: 'Güçlüysen ağırlık kemeriyle.', noteSikilasma: 'Gerekirse band destekli ya da lat pulldown ile yap.' },
      { exercise: 'Bent_Over_Barbell_Row', block: 'accessory', guc: [4, 6, 8, 90], sikilasma: [3, 10, 12, 75] },
      { exercise: 'Barbell_Hip_Thrust', block: 'accessory', guc: [3, 8, 10, 90], sikilasma: [3, 10, 12, 75] },
      { exercise: 'Hammer_Curls', block: 'accessory', guc: [3, 10, 12, 60], sikilasma: [2, 12, 15, 45] },
      { exercise: 'Hanging_Leg_Raise', block: 'accessory', guc: [3, 10, 15, 60], sikilasma: [2, 8, 12, 45] },
      { exercise: 'Bicycling_Stationary', block: 'cardio', guc: null, sikilasma: [1, 1, 1, 0], minutes: { sikilasma: 12 }, note: '30 sn sert / 90 sn hafif aralıklar' },
    ],
  },
  {
    name: 'Perşembe · Omuz + Üst Vücut',
    weekday: 4,
    items: [
      { exercise: 'Standing_Military_Press', block: 'main', guc: [5, 3, 5, 180], sikilasma: [3, 8, 10, 120], note: 'Ana güç hareketi. Önce 2-3 ısınma seti.' },
      { exercise: 'Chin-Up', block: 'accessory', guc: [3, 6, 8, 120], sikilasma: [3, 6, 10, 90], noteSikilasma: 'Gerekirse band destekli ya da dar tutuş lat pulldown.' },
      { exercise: 'Dips_-_Chest_Version', block: 'accessory', guc: [3, 6, 10, 90], sikilasma: [2, 6, 10, 75], noteSikilasma: 'Gerekirse dips makinesi ya da band destekli.' },
      { exercise: 'One-Arm_Dumbbell_Row', block: 'accessory', guc: [3, 8, 10, 75], sikilasma: [2, 10, 12, 60], note: 'Tekrar her kol için.' },
      { exercise: 'Barbell_Curl', block: 'accessory', guc: [3, 8, 10, 60], sikilasma: [2, 12, 15, 45] },
      { exercise: 'EZ-Bar_Skullcrusher', block: 'accessory', guc: [3, 8, 10, 60], sikilasma: [2, 12, 15, 45] },
      { exercise: 'Walking_Treadmill', block: 'cardio', guc: null, sikilasma: [1, 1, 1, 0], minutes: { sikilasma: 15 }, note: 'Eğim %8-12, 5-6 km/s' },
    ],
  },
  {
    name: 'Cuma · Tüm Vücut + Kondisyon',
    weekday: 5,
    items: [
      { exercise: 'Front_Barbell_Squat', block: 'main', guc: [4, 4, 6, 150], sikilasma: [3, 8, 10, 90], noteSikilasma: 'Rahat değilse goblet squat yapabilirsin.' },
      { exercise: 'Push_Press', block: 'main', guc: [4, 3, 5, 150], sikilasma: [3, 8, 10, 90] },
      { exercise: 'Split_Squat_with_Dumbbells', block: 'accessory', guc: [3, 8, 10, 75], sikilasma: [3, 10, 12, 60], note: 'Tekrar her bacak için.' },
      { exercise: 'Farmers_Walk', block: 'accessory', guc: [3, 40, 40, 60], sikilasma: [3, 30, 30, 60], note: 'Tekrar = metre' },
      { exercise: 'One-Arm_Kettlebell_Swings', block: 'accessory', guc: [3, 15, 20, 60], sikilasma: [3, 15, 15, 45] },
      { exercise: 'Rowing_Stationary', block: 'cardio', guc: [1, 1, 1, 0], sikilasma: [1, 1, 1, 0], minutes: { guc: 8, sikilasma: 12 }, note: '30 sn sert / 30 sn kolay aralıklar' },
    ],
  },
  {
    name: 'Cumartesi · Kardiyo (İsteğe bağlı)',
    weekday: 6,
    optional: true,
    items: [
      { exercise: 'Jogging_Treadmill', block: 'cardio', guc: [1, 1, 1, 0], sikilasma: [1, 1, 1, 0], minutes: { guc: 30, sikilasma: 40 }, note: 'Bölge 2: konuşabileceğin tempo. Yürüyüş, bisiklet ya da eliptik de olur.' },
    ],
  },
  {
    name: 'Pazar · Kardiyo (İsteğe bağlı)',
    weekday: 7,
    optional: true,
    items: [
      { exercise: 'Walking_Treadmill', block: 'cardio', guc: [1, 1, 1, 0], sikilasma: [1, 1, 1, 0], minutes: { guc: 30, sikilasma: 45 }, note: 'Hafif tempolu yürüyüş ya da dışarıda doğa yürüyüşü.' },
    ],
  },
]
