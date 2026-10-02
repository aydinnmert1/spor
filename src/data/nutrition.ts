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

export interface MealSlot {
  key: string
  title: string
  when: string
  why: string
  options: Record<PlanKey, MealOption[]>
}

export const MEAL_SLOTS: MealSlot[] = [
  {
    key: 'kahvalti',
    title: 'Kahvaltı',
    when: 'Uyandıktan sonra 1 saat içinde',
    why: 'Güne proteinle başlamak tokluk sağlar ve günlük protein hedefini kolaylaştırır.',
    options: {
      guc: [
        { title: 'Klasik yumurtalı', items: '3 yumurta (haşlanmış/omlet) + 60 g beyaz peynir + 2 dilim tam buğday ekmek + domates, salatalık, 5-6 zeytin', kcal: 650, protein: 38 },
        { title: 'Yulaf kasesi', items: '80 g yulaf + 250 ml süt + 1 ölçek whey (veya 200 g yoğurt) + 1 muz + 1 yemek kaşığı fıstık ezmesi', kcal: 700, protein: 45 },
        { title: 'Menemen', items: '3 yumurtalı menemen + 2 dilim ekmek + 40 g kaşar + 1 bardak ayran', kcal: 680, protein: 40 },
      ],
      sikilasma: [
        { title: 'Yumurta + peynir', items: '2 yumurta + 1 yumurta beyazı + 40 g light beyaz peynir + 1 dilim tam buğday ekmek + bol yeşillik, domates, salatalık', kcal: 380, protein: 30 },
        { title: 'Yoğurt kasesi', items: '200 g süzme yoğurt + 30 g yulaf + 1 avuç çilek/yaban mersini + 1 tatlı kaşığı bal + tarçın', kcal: 360, protein: 26 },
        { title: 'Sebzeli omlet', items: '2 yumurta + 2 beyaz ile ıspanak/mantarlı omlet + 1 dilim çavdar ekmeği + 5 zeytin', kcal: 350, protein: 28 },
      ],
    },
  },
  {
    key: 'ara1',
    title: 'Ara öğün',
    when: 'Kahvaltı ile öğle arası',
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
    key: 'ogle',
    title: 'Öğle',
    when: '12:00-14:00',
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
    key: 'oncesi',
    title: 'Antrenman öncesi',
    when: 'Antrenmandan 60-90 dk önce',
    why: 'Karbonhidrat enerji verir, az yağ ve lif mideyi yormaz. Ağır güç antrenmanında performansı artırır.',
    options: {
      guc: [
        { title: 'Muz + yoğurt', items: '1-2 muz + 200 g yoğurt + 1 tatlı kaşığı bal', kcal: 380, protein: 13 },
        { title: 'Pirinç patlağı', items: '3-4 pirinç patlağı + 1 yk fıstık ezmesi + 1 muz', kcal: 350, protein: 9 },
        { title: 'Ekmek + bal + peynir', items: '2 dilim ekmek + 1 yk bal + 40 g beyaz peynir', kcal: 380, protein: 14 },
      ],
      sikilasma: [
        { title: 'Muz', items: '1 orta boy muz (+ isteğe bağlı 1 kahve, şekersiz)', kcal: 110, protein: 1 },
        { title: 'Pirinç patlağı + peynir', items: '2 pirinç patlağı + 30 g light peynir', kcal: 150, protein: 7 },
        { title: 'Hurma + yoğurt', items: '2-3 hurma + 100 g yoğurt', kcal: 170, protein: 5 },
      ],
    },
  },
  {
    key: 'sonrasi',
    title: 'Antrenman sonrası',
    when: 'Antrenmandan sonraki 1-2 saat',
    why: 'Protein kas onarımını başlatır; karbonhidrat glikojen depolarını doldurur.',
    options: {
      guc: [
        { title: 'Shake + muz', items: '1 ölçek whey + 300 ml süt + 1 muz + 40 g yulaf (blenderda)', kcal: 550, protein: 42 },
        { title: 'Ayran + tavuk dürüm', items: '150 g tavuk + lavaş + yeşillik dürüm + 1 büyük ayran', kcal: 600, protein: 48 },
      ],
      sikilasma: [
        { title: 'Protein shake', items: '1 ölçek whey + su veya 200 ml yarım yağlı süt', kcal: 180, protein: 28 },
        { title: 'Yoğurt + meyve', items: '200 g süzme yoğurt + 1 avuç meyve', kcal: 200, protein: 20 },
        { title: 'Ton balığı', items: '1 kutu ton balığı (süzülmüş) + salata + 1 dilim tam buğday ekmek', kcal: 260, protein: 30 },
      ],
    },
  },
  {
    key: 'aksam',
    title: 'Akşam',
    when: '19:00-21:00',
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
    'Güç antrenmanında karbonhidratı kısma: antrenman öncesi ve sonrası öğünlerde pilav, makarna, patates, ekmek, meyve.',
    'Kilo haftada ~0,25 kg artıyorsa hedef tam yerinde; hiç artmıyorsa günlük porsiyonları biraz büyüt.',
    'Günde en az 2,5-3 litre su; antrenman günü daha fazla.',
    'Kreatin monohidrat (günde 3-5 g) güç gelişimi için en çok araştırılmış takviyedir.',
  ],
  sikilasma: [
    'Kilo verirken kas korumak için protein en önemli kural: her öğünde protein olsun.',
    'Tabağın yarısı sebze/salata, çeyreği protein, çeyreği karbonhidrat.',
    'Şekerli içecekler, meyve suları ve hamur işlerini sınırla; tatlı isteğini meyve + yoğurtla karşıla.',
    'Haftada 0,3-0,6 kg kayıp ideal; daha hızlısı kas kaybı ve yorgunluk getirir.',
    'Günde en az 2-2,5 litre su; açlık hissinin bir kısmı susuzluktur.',
    'Günlük adım hedefi: 8.000-10.000. Hafta sonu kardiyosu buna katkı sağlar.',
  ],
}
