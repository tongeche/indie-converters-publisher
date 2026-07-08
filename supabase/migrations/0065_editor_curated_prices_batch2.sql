-- Second manually-curated price batch. Each price verified directly against
-- the publisher's own product page (fetched, not guessed), 2026-07-08:
--   The Anxious Generation -> penguinrandomhouse.com/books/729231 ($30.00 hardcover — no paperback yet, ISBN 9780593655030)
--   Stolen Focus            -> penguinrandomhouse.com/books/634289 ($20.00, ISBN 9780593138533)
--   Supercommunicators      -> penguinrandomhouse.com/books/677212 ($20.00, ISBN 9780593243923)
--   Nightbitch              -> penguinrandomhouse.com/books/665285 ($17.00, ISBN 9780593312148)
--   The Memory Police       -> penguinrandomhouse.com/books/252774 ($18.00, ISBN 9781101911815)
--   The Push                -> penguinrandomhouse.com/books/625327 ($18.00, ISBN 9781984881687)

insert into public.retailers (slug, label) values ('publisher-site', 'Publisher Site') on conflict (slug) do nothing;

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.penguinrandomhouse.com/books/729231/the-anxious-generation-by-jonathan-haidt/', 30.00, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'the-anxious-generation' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.penguinrandomhouse.com/books/634289/stolen-focus-by-johann-hari/', 20.00, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'stolen-focus' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.penguinrandomhouse.com/books/677212/supercommunicators-by-charles-duhigg/', 20.00, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'supercommunicators' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.penguinrandomhouse.com/books/665285/nightbitch-by-rachel-yoder/', 17.00, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'nightbitch' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.penguinrandomhouse.com/books/252774/the-memory-police-by-yoko-ogawa/', 18.00, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'the-memory-police' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.penguinrandomhouse.com/books/625327/the-push-a-gma-book-club-pick-by-ashley-audrain/', 18.00, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'the-push' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();
