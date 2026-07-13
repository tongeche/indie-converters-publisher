-- Verified retail prices for independently-published catalogue books,
-- fetched directly from each publisher's own site (2026-07-12), batch 6.
-- Where a page listed multiple format prices, the lower of the two was
-- used, matching the "lowest price wins" convention used elsewhere in the
-- price-comparison feature.
--
-- Skipped this round: mhpbooks.com (Melville House, "The Queue") and
-- newharbinger.com ("Adult Children of Emotionally Immature Parents")
-- both returned HTTP 403; harriman-house.com ("The Psychology of Money")
-- loaded but showed no visible price; tinhouse.com's page for "Mostly
-- Dead Things" returned HTTP 404 (likely no longer carried directly).

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.europaeditions.com/book/9781609450786/my-brilliant-friend', 9.99, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'my-brilliant-friend' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://sohopress.com/books/the-seep/', 14.99, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'the-seep' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.hazelden.org/store/item/550281?The-Gifts-of-Imperfection=', 15.16, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'the-gifts-of-imperfection' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();
