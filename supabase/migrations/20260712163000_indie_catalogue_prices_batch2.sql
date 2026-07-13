-- Verified retail prices for independently-published catalogue books,
-- fetched directly from each publisher's own site (2026-07-12), batch 2.
-- ndbooks.com (New Directions) and cassavarepublic.biz returned HTTP 403
-- on every attempt this round and were skipped rather than guessed:
-- "Hurricane Season", "Minor Detail", "Like a Mule Bringing Ice Cream to
-- the Sun" remain unpriced. pulitzer.org (a finalists page, not a retailer)
-- also had no purchasable price for "In the Distance".

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://coffeehousepress.org/products/i-hotel-reissue', 21.95, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'i-hotel' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.graywolfpress.org/books/if-egyptian-cannot-speak-english', 17.00, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'if-an-egyptian-cannot-speak-english' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://coffeehousepress.org/products/jawbone', 18.00, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'jawbone' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.transitbooks.org/books/kintu', 16.95, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'kintu' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.graywolfpress.org/books/nervous-conditions', 17.00, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'nervous-conditions' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://argyllproductions.com/product/paladins-grace/', 5.99, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'paladins-grace' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.graywolfpress.org/books/she-would-be-king', 17.00, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'she-would-be-king' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.graywolfpress.org/books/argonauts', 17.00, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'the-argonauts' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();
