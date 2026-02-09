# İlk admin kullanıcısı

1. Sitede **Taraftar Ol** ile normal bir hesap açın (e-posta + şifre).
2. Supabase Dashboard → **Table Editor** → **admin_users**.
3. **Insert row**: `user_id` alanına, az önce açtığınız hesabın kullanıcı ID’sini yazın.
   - Kullanıcı ID’sini bulmak için: Supabase → **Authentication** → **Users** → ilgili kullanıcının **UUID** değerini kopyalayın.
4. Kaydedin. Bu kullanıcı artık **Admin Girişi** ile `/admin/giris` üzerinden giriş yapıp admin panelini kullanabilir.

## Logo

- **Güngören Belediye Spor Kulübü / İstanbul Güngörenspor** logosunu `public/logo.png` olarak projeye ekleyin.
- Logo yoksa header’da bordo daire içinde “G” harfi gösterilir.
