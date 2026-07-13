-- Missed from batch 10: Fourth Wing (Rebecca Yarros), priced via Barnes &
-- Noble ebook edition (lowest of paperback/hardcover/ebook/audiobook)
-- (2026-07-12).

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.barnesandnoble.com/w/fourth-wing-rebecca-yarros/1142297916', 14.99, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'fourth-wing' and r.slug = 'barnes-noble'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();
