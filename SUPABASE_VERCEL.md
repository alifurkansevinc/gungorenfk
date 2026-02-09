# Supabase + Vercel Bağlantısı

## Veritabanı şeması (ilk kurulumda bir kez)

Supabase projesini oluşturduktan sonra **SQL Editor**’de `supabase/migrations/001_initial_schema.sql` dosyasının içeriğini çalıştırın. Bu işlem 81 il, İstanbul ilçeleri, Güngören mahalleleri, taraftar/maç/kadro/haber/galeri/mağaza tablolarını ve 5 rozet kademesini oluşturur. Ardından **demo veriler** için `supabase/seed_demo_data.sql` dosyasını SQL Editor'de çalıştırın; maçlar, kadro, haberler, galeri ve mağaza örnek verilerle dolar.

## Sizin yapmanız gerekenler

### 1. Supabase’ten alacağınız iki değer

1. [supabase.com](https://supabase.com) → giriş → projenizi seçin (yoksa **New project** ile oluşturun).
2. Sol menüden **Project Settings** (dişli ikon) → **API** sekmesi.
3. Şunları kopyalayın:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` olarak kullanılacak  
   - **Project API keys** altında **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY` olarak kullanılacak  

Bu iki değeri bana vermenize gerek yok; sadece aşağıdaki yerlere siz yapıştıracaksınız.

---

### 2. Lokal proje (bilgisayarınızda)

Proje klasöründe `.env.local` dosyası oluşturun (yoksa):

```bash
cp .env.example .env.local
```

`.env.local` içeriği (kendi değerlerinizle):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....
```

Kaydedin. `npm run dev` ile çalıştırdığınızda Supabase’e bağlanır.

---

### 3. Vercel’e push (deploy için)

1. [vercel.com](https://vercel.com) → projenizi seçin (GitHub’dan import ettiğiniz **gungorenfk**).
2. **Settings** → **Environment Variables**.
3. İki değişken ekleyin:

| Name | Value | Environment |
|------|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase’ten kopyaladığınız **Project URL** | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase’ten kopyaladığınız **anon public** key | Production, Preview, Development |

4. **Save** → İsterseniz **Redeploy** ile son deploy’u bu env’lerle yenileyin.

Bundan sonra her `git push` ile Vercel’deki site da aynı Supabase veritabanına bağlı çalışır.

---

## Özet: Bana vermeniz gereken bir şey yok

- **Supabase:** Project URL + anon key’i sadece siz `.env.local` ve Vercel Environment Variables’a eklersiniz.  
- **Kod tarafı:** Projede Supabase client hazır; bu iki env tanımlı olunca hem local hem Vercel’de bağlantı çalışır.

Sorunuz olursa veya ilk tabloyu (ör. haberler, maç sonuçları) birlikte tasarlayalım derseniz yazın.
