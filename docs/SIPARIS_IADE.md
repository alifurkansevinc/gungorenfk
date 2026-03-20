# Sipariş tam iade modülü — el kitabı

> **Durum:** Kod projede hazır; “yapıyoruz” dediğinizde bu sayfayı adım adım takip edebilirsiniz.  
> Ekstra env değişkeni gerekmez (mevcut `IYZICO_*` ile çalışır).

---

## 1. Ne işe yarıyor?

- Admin **Siparişler** → sipariş detayı → **Ödendi** ve ödeme **iyzico** ise **“Tam iade (iyzico + stok)”**.
- Sıra: **iyzico para iadesi** → **stok geri** (`stock_by_size`) → **taraftar mağaza harcaması** (`store_spend_total`) düşürme → sipariş **`REFUNDED`** + durum **`CANCELLED`**.

---

## 2. İlgili dosyalar

| Dosya | Rol |
|--------|-----|
| `src/lib/iyzico.ts` | `refundPaymentV2()` — `POST /v2/payment/refund` |
| `src/lib/order-refund.ts` | Stok iadesi + `store_spend_total` geri alma |
| `src/app/api/admin/orders/refund/route.ts` | `POST { "orderId": "<uuid>" }` |
| `src/app/admin/(panel)/siparisler/page.tsx` | Detay modalda iade butonu |

---

## 3. “Yapıyoruz” kontrol listesi

- [ ] `npm run build` lokalde hatasız.
- [ ] Vercel’de `IYZICO_API_KEY`, `IYZICO_SECRET_KEY`, `IYZICO_BASE_URL` (sandbox/canlı) tanımlı.
- [ ] Sandbox’ta test kartı ile küçük tutarlı sipariş → ödeme → adminden **Tam iade** → iyzico panelinde hareket, stok, sipariş satırı, `fan_profiles` kontrolü.
- [ ] Canlıya almadan önce: gerçekten deploy etmek istiyor musunuz? (`README` — `main` push = deploy).

---

## 4. Commit / push (hazır olduğunuzda)

Örnek tek mesaj:

```bash
git add -A
git commit -m "Özellik: sipariş tam iade (iyzico + stok + harcama)"
git push
```

(İsterseniz sadece iade ile ilgili dosyaları seçerek `git add` yapın.)

---

## 5. Önemli uyarılar

| Konu | Açıklama |
|------|-----------|
| `payment_id` | Başarılı ödeme sonrası callback’te gerçek **iyzico paymentId** yazılmalı. **Eski** kayıtta sadece form **token** varsa iade **başarısız** olabilir. |
| Kısmi iade | Yok; yalnızca **sipariş toplamı** kadar tam iade. |
| Rozet seviye | `store_spend_total` düşer; **otomatik seviye düşürme** yok (ileride eklenebilir). |
| Para iade + stok | iyzico başarılı, stok güncellenemezse API `500` döner; stok **manuel** düzeltilmeli (log). |

---

## 6. API (manuel test)

```http
POST /api/admin/orders/refund
Content-Type: application/json
Cookie: (admin oturumu)

{ "orderId": "<sipariş UUID>" }
```

Başarılı yanıt örneği: `{ "success": true, "data": { "orderNumber", "refundedPrice", "refundHostReference" } }`

---

## 7. Sonraki iyi geliştirmeler (opsiyonel)

- Kısmi iade (tutar / kalem seçimi).
- İade sonrası rozet seviyesini yeniden hesaplama.
- Admin işlem log tablosu (kim, ne zaman iade etti).

---

*Son güncelleme: bu belge “yapıyoruz” anında tek referans olarak kullanılmak üzere hazırlanmıştır.*
