-- Verified retail prices, batch 4 (2026-07-12). Bookshop.org and
-- Hatchards.co.uk returned HTTP 403 on every single attempt this round
-- (8 Bookshop.org links, including both direct product pages and search
-- pages, plus 1 Hatchards page) and were skipped rather than guessed.
-- jellybooks.com's excerpt reader page for "A Small Silence" shows no
-- price at all (it's a preview reader, not a store).

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.barnesandnoble.com/w/the-pause-principle-timothy-ongeche/1147208390', 3.49, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'the-pause-principle' and r.slug = 'barnes-noble'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://indiepubs.com/products/the-theory-of-flight/', 16.95, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'the-theory-of-flight' and r.slug = 'other'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();
