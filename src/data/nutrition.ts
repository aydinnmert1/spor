import type { PlanKey, Sex } from '../lib/types'

export interface Targets {
  kcal: number
  protein: number
  fat: number
  carbs: number
}

const round = (n: number, step: number) => Math.round(n / step) * step

/**
 * Daily targets from Mifflin-St Jeor BMR × 1.55 (training 5 days a week).
 * Strength plan: small surplus, 2.0 g/kg protein. Toning plan: ~450 kcal deficit, 1.8 g/kg protein.
 */
export function calcTargets(p: { sex: Sex; age: number; height_cm: number; weight_kg: number; plan: PlanKey }): Targets {
  const bmr = 10 * p.weight_kg + 6.25 * p.height_cm - 5 * p.age + (p.sex === 'male' ? 5 : -161)
  const tdee = bmr * 1.55
  const strength = p.plan === 'guc'
  const kcal = round(Math.max(strength ? tdee + 250 : tdee - 450, p.sex === 'male' ? 1800 : 1400), 50)
  const protein = round(p.weight_kg * (strength ? 2.0 : 1.8), 5)
  const fat = round(p.weight_kg * (strength ? 0.9 : 0.8), 5)
  const carbs = round(Math.max(0, (kcal - protein * 4 - fat * 9) / 4), 5)
  return { kcal, protein, fat, carbs }
}

export interface MealOption {
  title: string
  items: string
  kcal: number
  protein: number
}

export interface FixedMeal {
  items: string[]
  kcal: number
  protein: number
}

export interface MealSlot {
  key: string
  title: string
  when: string
  why: string
  /** A meal that is always eaten as-is; `options` are then optional additions. */
  fixed?: Record<PlanKey, FixedMeal>
  options: Record<PlanKey, MealOption[]>
}

/** Weekday rhythm: training first thing in the morning, breakfast after. */
export const DAY_FLOW: { time: string; label: string }[] = [
  { time: '07:30', label: 'Kalk' },
  { time: '08:00', label: 'Spor' },
  { time: '09:30', label: 'Kahvaltı' },
  { time: '13:00', label: 'Öğle' },
  { time: '16:30', label: 'Ara öğün' },
  { time: '19:30', label: 'Akşam' },
]

// Breakfast bowl portions are estimates: ~200 g yogurt, 1 banana, a handful of
// blueberries, 1 tbsp tahini, ~10 almonds; plus ~5 baby biscuits or ~30 g granola.
const BOWL_BASE = ['Yoğurt (~200 g)', 'Muz (1 adet)', 'Yaban mersini (1 avuç)', 'Tahin (1 yemek kaşığı)', 'Badem (~10 adet)']

export const MEAL_SLOTS: MealSlot[] = [
  {
    key: 'uyaninca',
    title: 'Uyanınca (spordan önce)',
    when: '07:30 · antrenmandan 30 dk önce',
    why: 'Antrenmana 30 dakika var: mideyi yormayan, hızlı sindirilen bir şey ya da sadece su. Aç antrenman da olur; başın dönerse ya da güç düşerse küçük bir karbonhidrat ekle.',
    options: {
      guc: [
        { title: 'Su + kahve', items: '1-2 bardak su, istersen sade kahve', kcal: 5, protein: 0 },
        { title: 'Küçük muz', items: '1 küçük muz — özellikle squat/deadlift günleri', kcal: 90, protein: 1 },
        { title: 'Hurma', items: '2-3 hurma', kcal: 70, protein: 1 },
      ],
      sikilasma: [
        { title: 'Su + kahve', items: '1-2 bardak su, istersen sade kahve', kcal: 5, protein: 0 },
        { title: 'Hurma', items: '1-2 hurma — açlık hissedersen', kcal: 45, protein: 0 },
      ],
    },
  },
  {
    key: 'kahvalti',
    title: 'Kahvaltı (spordan sonra)',
    when: '09:30 · duştan sonra',
    why: 'Antrenman sonrası ilk öğün: karbonhidrat enerjiyi yerine koyar, protein kas onarımını başlatır. Bowl’un sabit; aşağıdakiler isteğe bağlı eklemeler.',
    fixed: {
      guc: { items: [...BOWL_BASE, 'Bebe bisküvisi (~5 adet)'], kcal: 530, protein: 16 },
      sikilasma: { items: [...BOWL_BASE, 'Granola (~30 g)'], kcal: 550, protein: 17 },
    },
    options: {
      guc: [
        { title: 'Haşlanmış yumurta', items: '2-3 haşlanmış yumurta — protein hedefi için en kolay ekleme', kcal: 190, protein: 17 },
        { title: 'Yumurta + peynir + ekmek', items: '2 yumurta + 40 g beyaz peynir + 1 dilim tam buğday ekmek + domates, salatalık', kcal: 320, protein: 23 },
        { title: 'Süt ya da ayran', items: '1 büyük bardak süt veya ayran', kcal: 120, protein: 7 },
      ],
      sikilasma: [
        { title: 'Haşlanmış yumurta', items: '1 haşlanmış yumurta', kcal: 75, protein: 6 },
        { title: 'Lor peyniri', items: '50 g lor peyniri', kcal: 50, protein: 6 },
        { title: 'Yeşillik', items: 'Salatalık, domates, yeşillik — doyurur, kalorisi yok denecek kadar az', kcal: 30, protein: 1 },
      ],
    },
  },
  {
    key: 'ogle',
    title: 'Öğle',
    when: '13:00',
    why: 'Günün ana öğünlerinden biri: protein + kompleks karbonhidrat + sebze.',
    options: {
      guc: [
        { title: 'Tavuk + pilav', items: '200 g ızgara tavuk göğsü + 1,5 kase bulgur ya da pirinç pilavı + çoban salata (1 yk zeytinyağı)', kcal: 750, protein: 55 },
        { title: 'Köfte + piyaz', items: '200 g ızgara köfte + 1 porsiyon piyaz + 1 dilim ekmek + yeşil salata', kcal: 800, protein: 50 },
        { title: 'Kuru fasulye menü', items: '1 kase etli kuru fasulye + 1 kase pilav + 1 kase yoğurt veya cacık', kcal: 750, protein: 38 },
      ],
      sikilasma: [
        { title: 'Tavuk salata', items: '150 g ızgara tavuk + büyük karışık salata (1 tk zeytinyağı, limon) + 4 yk bulgur', kcal: 450, protein: 42 },
        { title: 'Mercimek + yoğurt', items: '1 kase mercimek çorbası + 1 kase zeytinyağlı sebze yemeği + 150 g yoğurt', kcal: 430, protein: 22 },
        { title: 'Balık', items: '180 g fırın/ızgara balık (levrek, somon, uskumru) + roka salatası + 1 küçük patates', kcal: 470, protein: 38 },
      ],
    },
  },
  {
    key: 'ara',
    title: 'Ara öğün',
    when: '16:30',
    why: 'Uzun açlıkları önler, kas yıkımını azaltır ve akşam aşırı yemeyi engeller.',
    options: {
      guc: [
        { title: 'Süt + kuruyemiş', items: '300 ml süt (veya kefir) + 30 g çiğ badem/ceviz + 1 meyve', kcal: 420, protein: 18 },
        { title: 'Ton balıklı sandviç', items: '1 kutu ton balığı (süzülmüş) + 2 dilim tam buğday ekmek + marul, domates', kcal: 400, protein: 32 },
      ],
      sikilasma: [
        { title: 'Kefir + meyve', items: '1 bardak (250 ml) kefir + 1 elma', kcal: 200, protein: 9 },
        { title: 'Yoğurt + badem', items: '150 g yoğurt + 10 adet çiğ badem', kcal: 200, protein: 11 },
        { title: 'Haşlanmış yumurta', items: '2 haşlanmış yumurta + salatalık/havuç dilimleri', kcal: 160, protein: 13 },
      ],
    },
  },
  {
    key: 'aksam',
    title: 'Akşam',
    when: '19:30',
    why: 'Protein ve sebze ağırlıklı; günün kalan kalori ihtiyacına göre karbonhidrat.',
    options: {
      guc: [
        { title: 'Et + makarna', items: '200 g kırmızı et (sote/ızgara) + 1,5 kase tam buğday makarna + salata', kcal: 800, protein: 55 },
        { title: 'Somon + patates', items: '200 g somon + 250 g fırın patates + buharda brokoli', kcal: 750, protein: 45 },
        { title: 'Ev yemeği', items: '1,5 porsiyon etli sebze yemeği + 1 kase pilav + 1 kase yoğurt', kcal: 700, protein: 38 },
      ],
      sikilasma: [
        { title: 'Izgara tavuk + sebze', items: '150 g tavuk + fırın sebze (kabak, biber, patlıcan) + 150 g yoğurt', kcal: 420, protein: 45 },
        { title: 'Etli sebze', items: '1 porsiyon etli taze fasulye/bamya/ıspanak + 150 g yoğurt + salata', kcal: 400, protein: 26 },
        { title: 'Köfte + salata', items: '150 g ızgara köfte + büyük mevsim salata + 3 yk bulgur', kcal: 480, protein: 35 },
      ],
    },
  },
  {
    key: 'gece',
    title: 'Gece (isteğe bağlı)',
    when: 'Yatmadan 1 saat önce',
    why: 'Yavaş sindirilen protein gece boyunca kaslara amino asit sağlar.',
    options: {
      guc: [
        { title: 'Lor + bal', items: '150 g lor peyniri + 1 tatlı kaşığı bal + 1 avuç ceviz', kcal: 350, protein: 25 },
        { title: 'Süt + yulaf', items: '300 ml süt + 30 g yulaf + tarçın', kcal: 300, protein: 15 },
      ],
      sikilasma: [
        { title: 'Lor peyniri', items: '100 g lor + tarçın', kcal: 100, protein: 12 },
        { title: 'Kefir', items: '1 bardak kefir', kcal: 130, protein: 8 },
      ],
    },
  },
]

export const NUTRITION_TIPS: Record<PlanKey, string[]> = {
  guc: [
    'Her öğünde bir avuç içi büyüklüğünde protein kaynağı olsun (et, tavuk, balık, yumurta, yoğurt, baklagil).',
    'Kahvaltı bowl’u tek başına ~16 g protein; yanına yumurta/peynir eklemek günlük 140 g hedefini çok kolaylaştırır.',
    'Sabah aç karnına ağır setlerde güç düşerse ya da başın dönerse uyanınca küçük bir muz veya 2-3 hurma ye.',
    'Antrenmandan sonra kahvaltıyı 1 saatten fazla geciktirme.',
    'Kilo haftada ~0,25 kg artıyorsa hedef tam yerinde; hiç artmıyorsa öğle ve akşam porsiyonlarını biraz büyüt.',
    'Günde en az 2,5-3 litre su; antrenman sırasında 500-750 ml yudum yudum.',
  ],
  sikilasma: [
    'Kahvaltı bowl’un aynen kalıyor; kalori açığı öğle, ara öğün ve akşam porsiyonlarıyla sağlanıyor.',
    'Kilo verirken kası korumak için protein en önemli kural: öğle ve akşamda mutlaka protein olsun.',
    'Tabağın yarısı sebze/salata, çeyreği protein, çeyreği karbonhidrat.',
    'Şekerli içecekler, meyve suları ve hamur işlerini sınırla; tatlı isteğini meyve + yoğurtla karşıla.',
    'Haftada 0,3-0,6 kg kayıp ideal; daha hızlısı kas kaybı ve yorgunluk getirir.',
    'Günde en az 2-2,5 litre su; açlık hissinin bir kısmı susuzluktur.',
    'Günlük adım hedefi: 8.000-10.000. Hafta sonu kardiyosu buna katkı sağlar.',
  ],
}
