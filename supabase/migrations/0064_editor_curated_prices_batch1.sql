-- First manually-curated price batch for catalogue-seed books that had zero
-- price data. Each price was verified directly against the publisher's own
-- product page (fetched, not guessed) on 2026-07-07/08:
--   Quiet                    -> penguinrandomhouse.com/books/22821  ($20.00, ISBN 9780307352156)
--   The Power of Habit       -> penguinrandomhouse.com/books/202855 ($21.00, ISBN 9780812981605)
--   Mindset                  -> penguinrandomhouse.com/books/44330  ($20.00, ISBN 9780345472328)
--   The Body Keeps the Score -> penguinrandomhouse.com/books/313183 ($19.00, ISBN 9780143127741)
--   The Righteous Mind       -> penguinrandomhouse.com/books/73535  ($22.00, ISBN 9780307455772)
--   Thinking, Fast and Slow  -> us.macmillan.com/books/9780374533557 ($22.00, ISBN 9780374533557)
-- Note: several of these ISBNs differ from the ISBN already stored on the
-- book row (e.g. our stored ISBN for Thinking, Fast and Slow is a Spanish
-- edition) — that's a separate data-quality issue, not corrected here. This
-- migration only adds a priced retailer link; it doesn't touch books.isbn_13.

insert into public.retailers (slug, label) values ('publisher-site', 'Publisher Site') on conflict (slug) do nothing;

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.penguinrandomhouse.com/books/22821/quiet-by-susan-cain/', 20.00, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'quiet' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.penguinrandomhouse.com/books/202855/the-power-of-habit-by-charles-duhigg/9780812981605/', 21.00, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'the-power-of-habit' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.penguinrandomhouse.com/books/44330/mindset-by-carol-s-dweck-phd/', 20.00, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'mindset' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.penguinrandomhouse.com/books/313183/the-body-keeps-the-score-by-bessel-van-der-kolk-md/', 19.00, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'the-body-keeps-the-score' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.penguinrandomhouse.com/books/73535/the-righteous-mind-by-jonathan-haidt/', 22.00, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'the-righteous-mind' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://us.macmillan.com/books/9780374533557/thinkingfastandslow/', 22.00, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'thinking-fast-and-slow' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();
