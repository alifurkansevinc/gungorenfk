# Admin nasıl eklenir?

Admin paneli **`/admin/giris`** adresinden kullanılır. Bir kullanıcının admin olabilmesi için Supabase’de hem **Auth**’ta hesap hem de **admin_users** tablosunda kayıt olması gerekir.

---

## 1. Supabase’de bir kullanıcı oluşturun

İki yol:

**A) Siteden (Taraftar kaydı)**  
- Sitede **Taraftar Ol** ile e-posta + şifre ile kayıt olun.  
- Bu hesap Supabase **Authentication → Users** listesinde görünür.

**B) Supabase Dashboard’dan**  
- [Supabase](https://supabase.com/dashboard) → Projeniz → **Authentication** → **Users** → **Add user** → **Create new user**.  
- E-posta ve şifre verin, oluşturun.

---

## 2. Kullanıcı ID’sini (UUID) kopyalayın

- **Authentication** → **Users** → Az önce oluşturduğunuz kullanıcıya tıklayın.  
- **User UID** (UUID) alanını kopyalayın (örn. `a1b2c3d4-e5f6-7890-abcd-ef1234567890`).

---

## 3. Bu kullanıcıyı admin yapın

**Table Editor ile:**

1. Sol menüden **Table Editor** → **admin_users** tablosunu açın.  
2. **Insert row** (veya **Add row**) tıklayın.  
3. Sadece **user_id** alanını doldurun: kopyaladığınız UUID’yi yapıştırın.  
4. **id** ve **created_at** boş bırakılabilir (otomatik atanır).  
5. Kaydedin.

**SQL Editor ile:**

1. **SQL Editor** → New query.  
2. Aşağıdaki sorguda `BURAYA_USER_UUID_YAPIŞTIR` kısmını gerçek User UID ile değiştirip çalıştırın:

```sql
INSERT INTO admin_users (user_id)
VALUES ('BURAYA_USER_UUID_YAPIŞTIR');
```

---

## 4. Admin girişi yapın

- Sitede **`/admin/giris`** sayfasına gidin.  
- Az önce kullandığınız e-posta ve şifre ile giriş yapın.  
- Giriş başarılıysa admin panele (Dashboard, Taraftarlar, Maçlar, Kadro, Gelişmeler, Mağaza) yönlendirilirsiniz.

---

## Özet

| Adım | Ne yapılır? |
|------|------------------|
| 1 | Supabase Auth’ta kullanıcı oluştur (siteden Taraftar Ol veya Dashboard’dan Add user). |
| 2 | Authentication → Users’tan bu kullanıcının **User UID** değerini kopyala. |
| 3 | Table Editor → **admin_users** → Insert row → **user_id** = bu UUID. Veya SQL Editor’de yukarıdaki `INSERT` ile ekle. |
| 4 | `/admin/giris` sayfasından aynı e-posta/şifre ile giriş yap. |

İlk admin mutlaka **Supabase Dashboard** (Table Editor veya SQL) ile eklenir; sitede “admin ekle” butonu yoktur. Sonradan başka admin eklemek için de aynı yöntem kullanılır: yeni kullanıcı oluşturup **admin_users**’a `user_id` ile satır eklersiniz.

---

## Logo (opsiyonel)

- Güngören FK logosunu **`public/logo.png`** olarak projeye ekleyin.  
- Logo yoksa header’da bordo daire içinde “G” harfi gösterilir.
