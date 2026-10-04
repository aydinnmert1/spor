# Spor Takip

Mert ve Simge için; iPhone ve Android'de çalışan, ana ekrana eklenebilen (PWA) antrenman takip uygulaması. Açılışta yalnızca kişi seçilir (Mert / Simge); her kayıt o kişiye özeldir.

- **Canlı antrenman modu:** program günü sırayla açılır; her set için kilo/tekrar girilir, önceki antrenmanın kiloları görünür, setler arası dinlenme sayacı çalışır (sesli uyarı, ekran kapanmaz).
- **Program:** güç odaklı ve kilo verme/sıkılaşma olmak üzere iki plan; aynı günler ve hareketler, plana göre farklı set/tekrar/dinlenme ve kardiyo. Uygulama içinden düzenlenebilir.
- **Hareket kütüphanesi:** ~870 hareket, adım adım görseller ve talimatlar ([free-exercise-db](https://github.com/yuhonas/free-exercise-db), public domain). Programdaki hareketlerin Türkçe anlatımı var; her harekete kendi YouTube linkini ve notunu ekleyebilirsin.
- **İlerleme:** hareket bazlı grafik (tahmini 1RM, en ağır set, hacim), kişisel rekorlar, vücut ağırlığı, vücut ölçüleri, antrenman takvimi ve geçmişi.
- **Beslenme:** kişiye göre günlük kalori/makro hedefi; sabah sporu (07:30 kalk, 08:00-09:00 spor) ve sabit kahvaltı bowl'una göre öğün önerileri. Takviye önerilmez, kayıt tutulmaz.
- **Çevrimdışı çalışır**, internet gelince buluta eşitler (Supabase, ortak aile hesabı).

## Bulut hesabını açma (bir kerelik)

Bulut ayarlanmadan uygulama "yerel modda" çalışır: veriler yalnızca o telefonda kalır. Telefon değişse de veriler kaybolmasın diye:

1. [supabase.com](https://supabase.com) üzerinde ücretsiz hesap aç ve yeni bir proje oluştur.
2. Projede **SQL Editor → New query**, [`supabase/schema.sql`](supabase/schema.sql) dosyasının içeriğini yapıştır ve **Run**.
3. **Authentication → Sign In / Providers → Email**: "Confirm email" seçeneğini kapatabilirsin (kapalıysa kayıt olur olmaz giriş yapılır). Uygulamada **tek bir ortak aile hesabı** oluşturulur; iki telefon da aynı e-posta/şifreyle bir kez giriş yapar, sonra kişi seçilir.
4. **Project Settings → API**: `Project URL` ve `anon public` anahtarını al.
5. GitHub deposunda bu iki değeri değişken olarak ekle ve yeniden yayınla:

```bash
gh variable set VITE_SUPABASE_URL --body "https://xxxx.supabase.co"
```

```bash
gh variable set VITE_SUPABASE_ANON_KEY --body "eyJ..."
```

```bash
gh workflow run deploy.yml
```

`anon` anahtarı herkese açık olacak şekilde tasarlanmıştır; verileri satır bazlı güvenlik (RLS) korur.

Yerel modda girilen veriler, hesaba ilk girişte otomatik olarak buluta gönderilir.

## Geliştirme

```bash
npm install
```

```bash
npm run dev
```

```bash
npx vitest run
```

Yerelde bulutla denemek için `.env.local` dosyasına `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` yaz.

## Yapı

| Yol | İçerik |
|---|---|
| `src/lib/db.ts` | IndexedDB (Dexie) yerel depo, gönderim kuyruğu |
| `src/lib/sync.ts` | Supabase ile itme/çekme eşitlemesi (son yazan kazanır) |
| `src/lib/workout.ts` | Program kurulumu, 1RM, rekorlar, ilerleme serileri |
| `src/data/programs.ts` | Haftalık program şablonu (iki plan) |
| `src/data/people.ts` | Mert ve Simge'nin sabit profil bilgileri |
| `src/data/nutrition.ts` | Kalori/makro hesabı ve öğün önerileri |
| `src/data/exercises-tr.ts` | Hareketlerin Türkçe adları ve anlatımları |
| `public/exercises.json` | Hareket veritabanı |
| `supabase/schema.sql` | Bulut tabloları ve RLS kuralları |
