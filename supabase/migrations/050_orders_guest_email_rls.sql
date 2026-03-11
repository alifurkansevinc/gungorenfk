-- Kullanıcılar, giriş yaptıkları e-posta ile yapılmış misafir siparişlerini de görebilsin (Benim Köşem).
CREATE POLICY "Users read guest orders by email" ON orders FOR SELECT USING (
  user_id IS NULL
  AND guest_email IS NOT NULL
  AND guest_email = (SELECT email FROM public.fan_profiles WHERE user_id = auth.uid() LIMIT 1)
);
