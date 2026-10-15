-- Puan durumu Mackolik takım sayfasından çekilir. Eski fikstür yolu puan-durumu olsun.
UPDATE site_settings
SET value = to_jsonb(
  replace(
    replace(
      replace(value #>> '{}', '/ma%C3%A7lar/', '/puan-durumu/'),
      '/maçlar/',
      '/puan-durumu/'
    ),
    '/maclar/',
    '/puan-durumu/'
  )
)
WHERE key = 'mackolik_fixture_url'
  AND value #>> '{}' LIKE '%mackolik.com%';
