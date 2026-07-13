-- Verified retail prices for independently-published catalogue books,
-- fetched directly from each publisher's own site (2026-07-12), batch 5.
-- Where a page listed multiple format prices, the lower of the two was
-- used, matching the "lowest price wins" convention used elsewhere in the
-- price-comparison feature. "The Book of X" and "Tress of the Emerald Sea"
-- initially 404'd on guessed URLs (twodollarradio.com/products/the-book-of-x,
-- dragonsteel.com) and were re-found via search: correct slug is
-- "book-of-x" (not "the-book-of-x") and the correct domain is
-- dragonsteelbooks.com (not dragonsteel.com).

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.graywolfpress.org/books/citizen', 22.00, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'citizen-an-american-lyric' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.graywolfpress.org/books/dream-house', 26.00, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'in-the-dream-house' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://coffeehousepress.org/products/temporary', 18.00, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'temporary' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://twodollarradio.com/products/book-of-x', 9.99, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'the-book-of-x' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.dragonsteelbooks.com/products/tress-of-the-emerald-sea-ebook', 10.00, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'tress-of-the-emerald-sea' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();
