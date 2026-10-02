// Turkish names and instructions layered over the open-source exercise database
// (github.com/yuhonas/free-exercise-db, public domain). Exercises not listed here
// show their English name and instructions.

export interface TrExercise {
  name: string
  instructions?: string[]
  tips?: string
}

export const EXERCISES_TR: Record<string, TrExercise> = {
  Barbell_Squat: {
    name: 'Squat (Halter)',
    instructions: [
      'Barı rack’te omuz hizasının biraz altına ayarla. Barın altına gir, barı trapezlerin üstüne (high bar) ya da arka omuzlara (low bar) yerleştir.',
      'Ayaklar omuz genişliğinde, parmak uçları hafif dışa. Barı rack’ten kaldırıp iki-üç adım geri çekil.',
      'Derin nefes al, karnı sık (brace). Kalça ve dizleri aynı anda bükerek in; dizler ayak parmaklarının yönünü takip etsin.',
      'Kalça kırımı diz hizasının altına inene kadar (ya da formunun izin verdiği kadar) in, sırt nötr kalsın.',
      'Topuklardan iterek kalk, göğüs ve kalça aynı hızda yükselsin. Tepede nefes ver.',
    ],
    tips: 'Dizlerin içe kaçmasın, topuklar yerden kalkmasın. Ağır setlerde rack güvenlik barlarını ayarla.',
  },
  Front_Barbell_Squat: {
    name: 'Front Squat',
    instructions: [
      'Barı ön omuzlara (deltoidlerin üstüne) yerleştir; dirsekler yukarıda ve önde, eller bara gevşek temas etsin (clean grip ya da çapraz kol).',
      'Ayaklar omuz genişliğinde. Gövde dik, karın sıkı.',
      'Dirsekleri yüksek tutarak dik bir gövdeyle derin squat’a in.',
      'Topuklardan iterek kalk, dirsekler düşmesin.',
    ],
    tips: 'Bilek esnekliği kısıtlıysa çapraz kol tutuşu veya kayış kullan. Alternatif: Goblet squat.',
  },
  Romanian_Deadlift: {
    name: 'Romanian Deadlift (RDL)',
    instructions: [
      'Barı kalça hizasında, omuz genişliğinde tut. Dizler hafif bükülü, sırt düz.',
      'Kalçayı geriye iterek bel kırımı yap; bar bacaklara yakın kaysın.',
      'Hamstringlerde gerilme hissedene kadar (genelde diz altı-kaval ortası) in, sırt yuvarlanmasın.',
      'Kalçayı öne iterek ve kalçaları sıkarak başlangıca dön.',
    ],
    tips: 'Hareket kalçadan gelir, dizden değil. Aşağıda bar yere değmez.',
  },
  Barbell_Deadlift: {
    name: 'Deadlift',
    instructions: [
      'Bar ayak ortasının üstünde olacak şekilde dur, ayaklar kalça genişliğinde.',
      'Eğil, barı bacakların hemen dışından tut. Kaval kemikleri bara değene kadar dizleri bük, göğsü kaldır, sırtı düzle.',
      'Nefes al, karnı sık, latsları gerdir (“barı bükmeye çalış”).',
      'Yeri iterek barı kaldır; bar bacaklara sürtünerek yükselsin. Tepede kalçayı kilitle, arkaya yaslanma.',
      'Kontrollü şekilde aynı yoldan barı yere bırak.',
    ],
    tips: 'Bel yuvarlanıyorsa kiloyu düşür. Ağır setlerde kemer ve kayış kullanılabilir.',
  },
  Leg_Press: {
    name: 'Leg Press',
    instructions: [
      'Makineye otur, sırt ve kalça pede tam yaslansın. Ayaklar platformda omuz genişliğinde.',
      'Kilidi aç, dizleri göğse doğru kontrollü bük; kalça pedden kalkmasın.',
      'Topuk ve ayak ortasından iterek platformu kaldır, dizleri tam kilitleme.',
    ],
    tips: 'Ayakları yüksekte tutmak kalça/hamstring, alçakta tutmak quadriceps vurgusunu artırır.',
  },
  Lying_Leg_Curls: {
    name: 'Lying Leg Curl',
    instructions: [
      'Makineye yüzüstü uzan, ped aşil tendonunun hemen üstünde olsun.',
      'Kalçayı pede bastırarak topukları kalçaya doğru bük.',
      'Tepede bir saniye sık, yavaşça (2-3 sn) indir.',
    ],
  },
  Seated_Calf_Raise: {
    name: 'Oturarak Baldır Kaldırma',
    instructions: [
      'Makineye otur, ped dizlerin üstünde, ayak ön tabanı platformun kenarında.',
      'Topukları olabildiğince aşağı indir (tam esneme).',
      'Parmak uçlarına yüksel, tepede 1 saniye sık, yavaşça in.',
    ],
  },
  Plank: {
    name: 'Plank',
    instructions: [
      'Ön kollar yerde, dirsekler omuzların altında. Bacaklar düz, parmak uçlarında dur.',
      'Baştan topuğa düz bir çizgi oluştur; kalça düşmesin ve havaya kalkmasın.',
      'Karnı ve kalçayı sık, normal nefes alarak süre boyunca pozisyonu koru.',
    ],
    tips: 'Programdaki tekrar değeri saniyedir.',
  },
  Walking_Treadmill: {
    name: 'Eğimli Yürüyüş (Koşu Bandı)',
    instructions: [
      'Koşu bandında eğimi %8-12, hızı 5-6 km/s’ye ayarla.',
      'Tutunmadan, dik gövdeyle tempolu yürü. Konuşabilecek ama şarkı söyleyemeyecek yoğunlukta kal.',
    ],
    tips: 'Kilo verme için en verimli ve eklem dostu kardiyo seçeneklerinden biri.',
  },
  Jogging_Treadmill: {
    name: 'Hafif Koşu (Koşu Bandı)',
    instructions: [
      'Isınma için 3-5 dk yürü, sonra rahat bir koşu temposuna geç.',
      'Bölge 2: nefes nefese kalmadan, cümle kurabildiğin tempoda koş.',
      'Son 3-5 dk yürüyerek soğu.',
    ],
  },
  'Barbell_Bench_Press_-_Medium_Grip': {
    name: 'Bench Press (Halter)',
    instructions: [
      'Sehpaya uzan, gözler barın altında. Ayaklar yere sağlam bassın.',
      'Kürek kemiklerini geri ve aşağı çek, hafif sırt kavisi oluştur.',
      'Barı omuz genişliğinin biraz dışından tut, rack’ten çıkar ve omuz hizasına getir.',
      'Kontrollü şekilde göğsün alt kısmına indir; dirsekler gövdeyle ~45-70° açı yapsın.',
      'Göğse dokununca barı yukarı ve hafif geriye doğru it.',
    ],
    tips: 'Ağır setlerde spotter ya da güvenlik barı kullan. Kalça sehpadan kalkmasın.',
  },
  Incline_Dumbbell_Press: {
    name: 'Eğimli Dambıl Press',
    instructions: [
      'Sehpayı 30-45° eğime ayarla, dambılları dizlerinden yardım alarak omuz hizasına getir.',
      'Kürek kemikleri geride, dambıllar üst göğüs hizasında.',
      'Dambılları yukarı it, tepede birbirine yaklaştır ama çarpıştırma.',
      'Kontrollü şekilde göğüste esneme hissedene kadar indir.',
    ],
  },
  Seated_Cable_Rows: {
    name: 'Oturarak Kablo Row',
    instructions: [
      'Makineye otur, ayaklar platformda, dizler hafif bükük. V tutamağı kavra.',
      'Göğüs dik, sırt nötr. Tutamağı karnına doğru çek, kürek kemiklerini sık.',
      'Kolları kontrollü uzatarak sırtın esnemesine izin ver, gövdeyle sallanma.',
    ],
  },
  Side_Lateral_Raise: {
    name: 'Yana Açış (Dambıl)',
    instructions: [
      'Dik dur, dambıllar yanlarda, dirsekler hafif bükük.',
      'Kolları yana doğru omuz hizasına kadar kaldır; serçe parmak tarafı hafif yukarıda olabilir.',
      'Tepede kısa bir duraklama, sonra yavaşça indir.',
    ],
    tips: 'Hafif kilo, temiz form. Trapezlerle kaldırmamaya, omuzları kulaktan uzak tutmaya dikkat et.',
  },
  'Triceps_Pushdown_-_Rope_Attachment': {
    name: 'Triceps Pushdown (Halat)',
    instructions: [
      'Kablo makinesinin üst makarasına halat tak, dirsekleri gövdenin yanına sabitle.',
      'Halatı aşağı it, en altta halatın uçlarını dışa açarak triceps’i sık.',
      'Dirsekleri oynatmadan yavaşça başlangıca dön.',
    ],
  },
  Face_Pull: {
    name: 'Face Pull',
    instructions: [
      'Kablo makarasını yüz hizasına ayarla, halat tak, avuçlar içe bakacak şekilde tut.',
      'Halatı yüzüne doğru çek, elleri kulak hizasında dışa aç; dirsekler yüksek kalsın.',
      'Arka omuz ve kürek kemiklerini sık, kontrollü geri dön.',
    ],
    tips: 'Omuz sağlığı ve duruş için harika; ağır değil, kaliteli tekrar.',
  },
  Elliptical_Trainer: {
    name: 'Eliptik Bisiklet',
    instructions: [
      'Pedallara bas, kolları tut. Direnci orta seviyeye ayarla.',
      'Dik gövdeyle sabit bir tempoda pedal çevir; konuşabilecek yoğunlukta kal.',
      'İstersen son 5 dakikada 30 sn hızlı / 30 sn yavaş aralıklar ekle.',
    ],
  },
  Pullups: {
    name: 'Barfiks',
    instructions: [
      'Barı omuz genişliğinin biraz dışından, avuçlar öne bakacak şekilde tut ve asıl.',
      'Kürek kemiklerini aşağı çekerek başla, göğsü bara doğru götür; çene bar üstüne çıksın.',
      'Kontrollü şekilde kollar tam uzayana kadar in.',
    ],
    tips: 'Güç seviyende ise ağırlık kemeriyle yap. Tam barfiks çıkmıyorsa: band destekli barfiks ya da lat pulldown.',
  },
  'Chin-Up': {
    name: 'Chin-Up (Ters Tutuş Barfiks)',
    instructions: [
      'Barı omuz genişliğinde, avuçlar sana bakacak şekilde tut.',
      'Göğsü bara doğru çekerek çeneyi bar üstüne çıkar; dirsekler gövdeye yakın.',
      'Kollar tam uzayana kadar kontrollü in.',
    ],
    tips: 'Alternatif: dar tutuş lat pulldown veya band destekli chin-up.',
  },
  Bent_Over_Barbell_Row: {
    name: 'Eğilerek Halter Row',
    instructions: [
      'Barı omuz genişliğinde tut, dizleri hafif bük ve kalçadan ~45° öne eğil. Sırt düz.',
      'Barı karın üstüne/göbek hizasına doğru çek, dirsekler gövdeye yakın.',
      'Kürek kemiklerini sık, kontrollü indir; gövde açısını sabit tut.',
    ],
  },
  Barbell_Hip_Thrust: {
    name: 'Hip Thrust (Halter)',
    instructions: [
      'Sırtının üst kısmını sehpaya daya, barı (pedle) kalça kıvrımına yerleştir.',
      'Ayaklar yerde, dizler 90° olacak şekilde konumlan.',
      'Topuklardan iterek kalçayı kaldır, tepede gövde ve uyluk düz bir çizgi oluştursun; kalçayı 1 sn sık.',
      'Kontrollü şekilde indir.',
    ],
    tips: 'Bel ile değil kalça ile kaldır; tepede kaburgaları aşağıda tut.',
  },
  Hammer_Curls: {
    name: 'Hammer Curl',
    instructions: [
      'Dik dur, dambıllar yanlarda, avuçlar birbirine bakıyor.',
      'Dirsekleri sabit tutarak dambılları omuza doğru kaldır.',
      'Kontrollü şekilde indir.',
    ],
  },
  Hanging_Leg_Raise: {
    name: 'Asılı Bacak Kaldırma',
    instructions: [
      'Barfiks barına asıl, omuzları aktif tut.',
      'Sallanmadan bacakları (ya da dizleri bükerek) kalça hizasının üstüne kaldır, pelvisi hafif yukarı kıvır.',
      'Yavaşça indir.',
    ],
    tips: 'Zor geliyorsa dizleri bükerek yap.',
  },
  Bicycling_Stationary: {
    name: 'Sabit Bisiklet',
    instructions: [
      '3 dk hafif dirençle ısın.',
      'Aralıklı: 30 sn yüksek direnç/hızlı, 60-90 sn hafif tempo; tekrarla.',
      'Son 2-3 dk hafif pedalla soğu.',
    ],
  },
  Standing_Military_Press: {
    name: 'Ayakta Omuz Press (Overhead Press)',
    instructions: [
      'Barı rack’ten ön omuz hizasında al, tutuş omuz genişliğinde.',
      'Kalça ve karnı sık, gövde dik.',
      'Barı başının üstüne düz bir çizgide it; bar geçerken başını hafif geri çek, sonra öne getir.',
      'Tepede kilitle, kontrollü şekilde ön omuza indir.',
    ],
    tips: 'Belden geriye kavis yapma; kalçaları sıkı tut.',
  },
  'Dips_-_Chest_Version': {
    name: 'Dips (Paralel Bar)',
    instructions: [
      'Paralel barlarda kollar düz şekilde kendini kaldır.',
      'Gövdeyi hafif öne eğerek dirsekleri bük ve omuzlar dirsek hizasına gelene kadar in.',
      'Kolları iterek başlangıca dön.',
    ],
    tips: 'Güç seviyende ağırlık kemeri ekle. Zor geliyorsa: dips makinesi ya da band destekli.',
  },
  'One-Arm_Dumbbell_Row': {
    name: 'Tek Kol Dambıl Row',
    instructions: [
      'Bir el ve aynı taraf dizi sehpaya daya, sırt düz.',
      'Diğer elde dambılı kalçana doğru çek, dirsek gövdeye yakın.',
      'Tepede sırtı sık, kontrollü indir. Diğer kola geç.',
    ],
  },
  Barbell_Curl: {
    name: 'Barbell Curl',
    instructions: [
      'Barı omuz genişliğinde, avuçlar yukarı bakacak şekilde tut.',
      'Dirsekleri sabit tutarak barı omuz hizasına kaldır.',
      'Kontrollü şekilde indir, gövdeyle sallanma.',
    ],
  },
  'EZ-Bar_Skullcrusher': {
    name: 'Skullcrusher (EZ Bar)',
    instructions: [
      'Sehpaya uzan, EZ barı kollar düz şekilde göğüs üstünde tut.',
      'Dirsekleri sabit tutarak barı alnına/başının arkasına doğru indir.',
      'Triceps ile barı tekrar yukarı it.',
    ],
  },
  Push_Press: {
    name: 'Push Press',
    instructions: [
      'Barı ön omuzda tut, ayaklar kalça genişliğinde.',
      'Dizleri hafifçe bük (çeyrek dip), hemen bacaklarla patlayıcı şekilde it.',
      'Bacak gücünü kullanarak barı başın üstüne kilitle.',
      'Kontrollü şekilde omuza indir.',
    ],
  },
  Split_Squat_with_Dumbbells: {
    name: 'Split Squat (Dambıl)',
    instructions: [
      'Ellerde dambıllar, bir ayak önde bir ayak arkada geniş adım pozisyonu al.',
      'Arka dizi yere doğru indir; ön diz ayak bileği üzerinde kalsın.',
      'Ön topuktan iterek kalk. Bir bacağın tekrarlarını bitir, diğerine geç.',
    ],
    tips: 'Tekrar sayısı her bacak içindir. Arka ayağı sehpaya koyarsan Bulgarian split squat olur.',
  },
  Farmers_Walk: {
    name: 'Farmer’s Walk',
    instructions: [
      'Ağır dambıl veya kettlebell’leri yanlarda tut.',
      'Dik gövde, omuzlar geride, karın sıkı; kısa ve hızlı adımlarla yürü.',
      'Hedef mesafeyi tamamla, kontrollü bırak.',
    ],
    tips: 'Programdaki tekrar değeri metredir.',
  },
  'One-Arm_Kettlebell_Swings': {
    name: 'Kettlebell Swing',
    instructions: [
      'Kettlebell’i iki elle ya da tek elle tut, ayaklar omuz genişliğinde.',
      'Kalçayı geriye iterek kettlebell’i bacak arasına salla.',
      'Kalçayı patlayıcı şekilde öne iterek kettlebell’i göğüs hizasına kadar savur; kollar sadece yönlendirir.',
    ],
    tips: 'Squat değil kalça menteşesi. Bel nötr kalsın.',
  },
  Rowing_Stationary: {
    name: 'Kürek Ergometresi',
    instructions: [
      'Ayakları kayışlara bağla. Sıra: bacaklar it → gövde geriye → kollar çek.',
      'Dönüşte ters sıra: kollar uzan → gövde öne → bacaklar bük.',
      'Kondisyon için: 30 sn sert / 30 sn kolay aralıklar.',
    ],
  },
  // Common alternatives (name only)
  'Wide-Grip_Lat_Pulldown': { name: 'Lat Pulldown (Geniş Tutuş)' },
  'Close-Grip_Front_Lat_Pulldown': { name: 'Lat Pulldown (Dar Tutuş)' },
  'Band_Assisted_Pull-Up': { name: 'Band Destekli Barfiks' },
  Goblet_Squat: { name: 'Goblet Squat' },
  Leg_Extensions: { name: 'Leg Extension' },
  Dumbbell_Lunges: { name: 'Lunge (Dambıl)' },
  Barbell_Walking_Lunge: { name: 'Yürüyerek Lunge (Halter)' },
  Barbell_Glute_Bridge: { name: 'Glute Bridge (Halter)' },
  Cable_Crossover: { name: 'Kablo Crossover' },
  Hyperextensions_Back_Extensions: { name: 'Back Extension (Hiperekstansiyon)' },
  Sumo_Deadlift: { name: 'Sumo Deadlift' },
  'Dips_-_Triceps_Version': { name: 'Dips (Triceps)' },
  'Close-Grip_Barbell_Bench_Press': { name: 'Dar Tutuş Bench Press' },
  'Barbell_Incline_Bench_Press_-_Medium_Grip': { name: 'Eğimli Bench Press (Halter)' },
  Russian_Twist: { name: 'Russian Twist' },
  Mountain_Climbers: { name: 'Mountain Climber' },
  Ab_Roller: { name: 'Ab Roller' },
  Seated_Leg_Curl: { name: 'Oturarak Leg Curl' },
  Standing_Calf_Raises: { name: 'Ayakta Baldır Kaldırma' },
  Dumbbell_Bench_Press: { name: 'Dambıl Bench Press' },
  Dumbbell_Shoulder_Press: { name: 'Dambıl Omuz Press' },
  Hammer_Grip_Incline_DB_Bench_Press: { name: 'Hammer Tutuş Eğimli Dambıl Press' },
  Pallof_Press: { name: 'Pallof Press' },
  Running_Treadmill: { name: 'Koşu (Koşu Bandı)' },
  Bicycling: { name: 'Bisiklet' },
  Battling_Ropes: { name: 'Battle Rope' },
  Sled_Push: { name: 'Kızak İtme' },
  Single_Leg_Glute_Bridge: { name: 'Tek Bacak Glute Bridge' },
  'One-Legged_Cable_Kickback': { name: 'Kablo Kickback (Kalça)' },
  Triceps_Pushdown: { name: 'Triceps Pushdown' },
  Hack_Squat: { name: 'Hack Squat' },
  Smith_Machine_Squat: { name: 'Smith Machine Squat' },
}

export const MUSCLES_TR: Record<string, string> = {
  abdominals: 'Karın',
  hamstrings: 'Arka bacak',
  adductors: 'İç bacak',
  quadriceps: 'Ön bacak',
  biceps: 'Biceps',
  shoulders: 'Omuz',
  chest: 'Göğüs',
  'middle back': 'Orta sırt',
  calves: 'Baldır',
  glutes: 'Kalça',
  'lower back': 'Bel',
  lats: 'Kanat (lat)',
  triceps: 'Triceps',
  traps: 'Trapez',
  forearms: 'Ön kol',
  neck: 'Boyun',
  abductors: 'Dış kalça',
}

export const EQUIPMENT_TR: Record<string, string> = {
  'body only': 'Vücut ağırlığı',
  machine: 'Makine',
  other: 'Diğer',
  'foam roll': 'Foam roller',
  kettlebells: 'Kettlebell',
  dumbbell: 'Dambıl',
  cable: 'Kablo',
  barbell: 'Halter',
  bands: 'Direnç bandı',
  'medicine ball': 'Sağlık topu',
  'exercise ball': 'Pilates topu',
  'e-z curl bar': 'EZ bar',
}

export const CATEGORY_TR: Record<string, string> = {
  strength: 'Kuvvet',
  stretching: 'Esneme',
  plyometrics: 'Pliometrik',
  strongman: 'Strongman',
  powerlifting: 'Powerlifting',
  cardio: 'Kardiyo',
  'olympic weightlifting': 'Olimpik kaldırış',
}

export const LEVEL_TR: Record<string, string> = {
  beginner: 'Başlangıç',
  intermediate: 'Orta',
  expert: 'İleri',
}
