-- Verified retail prices for independently-published catalogue books,
-- fetched directly from each publisher's own site (2026-07-12). Cassava
-- Republic's site (cassavarepublic.biz) returned HTTP 403 on every attempt
-- and was skipped rather than guessed — "A Small Silence" and "When We
-- Speak of Nothing" remain unpriced pending a future retry or a different
-- source.

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://archipelagobooks.org/book/a-general-theory-of-oblivion/', 18.00, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'a-general-theory-of-oblivion' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.europaeditions.com/book/9781609457853/all-your-children-scattered', 18.00, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'all-your-children-scattered' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://coffeehousepress.org/products/among-strange-victims', 16.95, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'among-strange-victims' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.graywolfpress.org/books/blackass', 16.00, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'blackass' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.wavepoetry.com/products/bluets', 16.00, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'bluets' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.andotherstories.org/boulder/', 11.73, 'GBP', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'boulder' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://groveatlantic.com/book/convenience-store-woman/', 17.00, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'convenience-store-woman' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.akashicbooks.com/catalog/dance-of-the-jakaranda/', 16.95, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'dance-of-the-jakaranda' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.biblioasis.com/shop/fiction/ducks-newburyport-trade-paper/', 28.95, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'ducks-newburyport' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://charcopress.com/bookstore/elena-knows', 11.99, 'GBP', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'elena-knows' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://groveatlantic.com/book/freshwater/', 18.00, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'freshwater' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();
