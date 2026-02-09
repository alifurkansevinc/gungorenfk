# Güngören FK – Veritabanı, GitHub ve Vercel Bağlantı Rehberi

Bu rehber, site yazımına başlamadan önce **veritabanı**, **GitHub** ve **Vercel** bağlantılarını nasıl kuracağınızı adım adım anlatır.

---

## 1. GitHub’a Bağlama

Proje zaten bir klasörde; bunu GitHub’a göndermek için:

### 1.1 Git’i başlat (henüz yapılmadıysa)

```bash
cd "/Users/alifurkansevinc/Desktop/Güngören FK/gungorenfk"
git init
```

### 1.2 GitHub’da yeni repo oluştur

1. [github.com](https://github.com) → **New repository**
2. İsim: örn. `gungorenfk`
3. **Public** seçin, README eklemeyin (zaten var)
4. **Create repository** tıklayın

### 1.3 Projeyi GitHub’a bağla ve ilk push

GitHub’da repo oluşturduktan sonra sayfada gösterilen komutlardan **“push an existing repository”** kısmını kullanın:

```bash
git remote add origin https://github.com/KULLANICI_ADINIZ/gungorenfk.git
git add .
git commit -m "İlk commit: Next.js projesi"
git branch -M main
git push -u origin main
```

`KULLANICI_ADINIZ` yerine kendi GitHub kullanıcı adınızı yazın.

---

## 2. Veritabanı Seçimi ve Bağlantı

İki yaygın seçenek:

### Seçenek A: Vercel + Neon (PostgreSQL) – Önerilen

1. [Vercel Dashboard](https://vercel.com/dashboard) → Projenizi seçin (önce 3. adımda Vercel’e bağlayın).
2. **Storage** veya **Integrations** → **Neon** (veya “Postgres”) ekleyin.
3. Yeni veritabanı oluşturun; Vercel otomatik olarak projenize `POSTGRES_URL` gibi değişkenleri ekler.
4. Lokal geliştirme için: Vercel’deki **Settings → Environment Variables** kısmından bu değişkenleri kopyalayıp proje klasöründe `.env.local` dosyasına yapıştırın:

   ```bash
   cp .env.example .env.local
   ```

   Sonra `.env.local` içine örnek:

   ```
   POSTGRES_URL="postgres://kullanici:sifre@host/db?sslmode=require"
   ```

### Seçenek B: Supabase (PostgreSQL)

1. [supabase.com](https://supabase.com) → hesap aç → **New project**.
2. Proje adı ve şifre belirleyin, region seçin.
3. **Settings → API** bölümünden:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Bu iki değişkeni projede `.env.local` içine yazın (ve Vercel’de Environment Variables’a ekleyin).

Proje içinde veritabanı kullanımı için ileride `@vercel/postgres` veya `@supabase/supabase-js` paketleri eklenebilir; hangi veritabanını seçtiğinize göre yönlendirme yapacağız.

---

## 3. Vercel’e Bağlama ve Deploy

### 3.1 GitHub repo’yu Vercel’e bağla

1. [vercel.com](https://vercel.com) → giriş yapın (GitHub ile giriş en kolayı).
2. **Add New… → Project**.
3. **Import Git Repository** → GitHub’daki `gungorenfk` reposunu seçin.
4. **Framework Preset**: Next.js otomatik algılanır.
5. **Root Directory**: boş bırakın (proje kökü).
6. **Environment Variables**: Daha önce veritabanı için hazırladığınız değişkenleri burada ekleyin (örn. `POSTGRES_URL` veya Supabase değişkenleri).
7. **Deploy** tıklayın.

Birkaç dakika sonra size bir `*.vercel.app` adresi verilir; her `main` branch’e push’ta otomatik yeni deploy alırsınız.

### 3.2 Özel domain (isteğe bağlı)

Vercel’de proje → **Settings → Domains** → kendi domain’inizi ekleyebilirsiniz.

---

## 4. Özet Akış

| Sıra | Ne yapıyorsunuz        | Nerede / Nasıl |
|------|------------------------|-----------------|
| 1    | Git + GitHub           | `git init` → GitHub’da repo → `git remote add origin` → `git push` |
| 2    | Veritabanı             | Vercel’de Neon veya Supabase ile bağlayın; `.env.local` ve Vercel env’e ekleyin |
| 3    | Vercel deploy          | Vercel’de “Import” ile GitHub repo’yu seçin, env’leri ekleyin, Deploy |
| 4    | Site yazımı            | Kod değişiklikleri → `git push` → otomatik deploy |

---

## 5. Lokal Çalıştırma

```bash
npm install
cp .env.example .env.local   # .env.local'i veritabanı bilgileriyle doldurun
npm run dev
```

Tarayıcıda: [http://localhost:3000](http://localhost:3000)

---

İsterseniz bir sonraki adımda hangi veritabanını (Neon mu Supabase mi) kullanacağınızı söyleyin; ona göre örnek bir “haberler” veya “maç sonuçları” tablosu ve API route’ları yazalım.
