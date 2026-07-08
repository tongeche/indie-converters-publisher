-- Fourth manually-curated price batch. Prices verified directly against
-- publisher pages (fetched, not guessed), 2026-07-08. Smaller batch than
-- previous rounds — several publisher pages (Macmillan, New Harbinger,
-- HarperCollins, Simon & Schuster) blocked WebFetch or returned unpopulated
-- template pages this round, so those were skipped rather than guessed.
--   Why Has Nobody Told Me This Before? -> penguin.co.uk/books/454841 (£20.00 GBP, ISBN 9780241529744)
--   The Let Them Theory                 -> penguinrandomhouse.com/books/743134 ($29.99 USD hardcover, ISBN 9781401971366)
--   The Mountain Is You                 -> shopcatalog.com/products/the-mountain-is-you ($17.99 USD, our stored ISBN 9786070788734)

insert into public.retailers (slug, label) values ('publisher-site', 'Publisher Site') on conflict (slug) do nothing;

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.penguin.co.uk/books/454841/why-has-nobody-told-me-this-before-by-smith-dr-julie/', 20.00, 'GBP', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'why-has-nobody-told-me-this-before' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.penguinrandomhouse.com/books/743134/the-let-them-theory-by-mel-robbins/', 29.99, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'the-let-them-theory' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://shopcatalog.com/products/the-mountain-is-you', 17.99, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'the-mountain-is-you' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();
