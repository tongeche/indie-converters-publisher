-- Third manually-curated price batch. Each price verified directly against
-- the publisher's own product page (fetched, not guessed), 2026-07-08:
--   Emotional Intelligence  -> penguinrandomhouse.com/books/69105  ($21.00, ISBN 9780553804911)
--   Behave                  -> penguinrandomhouse.com/books/311787 ($22.00, ISBN 9780143110910)
--   Dopamine Nation         -> penguinrandomhouse.com/books/624957 ($20.00, ISBN 9781524746742)
--   Attached                -> penguinrandomhouse.com/books/303069 ($20.00, ISBN 9781585429134)
--   The Myth of Normal      -> penguinrandomhouse.com/books/608273 ($32.00 hardcover — no paperback price shown, ISBN 9780593083888)
--   Man's Search for Meaning-> beacon.org/Mans-Search-for-Meaning-P602 ($17.95, ISBN 9780807014271)

insert into public.retailers (slug, label) values ('publisher-site', 'Publisher Site') on conflict (slug) do nothing;

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.penguinrandomhouse.com/books/69105/emotional-intelligence-by-daniel-goleman/', 21.00, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'emotional-intelligence' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.penguinrandomhouse.com/books/311787/behave-by-robert-m-sapolsky/', 22.00, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'behave' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.penguinrandomhouse.com/books/624957/dopamine-nation-by-anna-lembke-md/', 20.00, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'dopamine-nation' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.penguinrandomhouse.com/books/303069/attached-by-amir-levine-md-and-rachel-sf-heller-ma/', 20.00, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'attached' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.penguinrandomhouse.com/books/608273/the-myth-of-normal-by-gabor-mate-md-with-daniel-mate/', 32.00, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'the-myth-of-normal' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.beacon.org/Mans-Search-for-Meaning-P602.aspx', 17.95, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'mans-search-for-meaning' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();
