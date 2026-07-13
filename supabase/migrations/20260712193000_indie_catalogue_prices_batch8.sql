-- Verified retail prices for independently-published catalogue books,
-- fetched directly from each publisher's own site (2026-07-12), batch 8.
--
-- Skipped this round (loaded but showed no visible price, or blocked):
-- pete-walker.com ("Complex PTSD" — "Buy Now" links with no price shown),
-- entangledpublishing.com ("Fourth Wing" — price field present but empty,
-- book shown as pre-order only), moodypublishers.com ("The 5 Love
-- Languages" — HTTP 403). No confirmed direct-store URL was found at all
-- for "A Girl Is a Body of Water" (Tin House), "Dungeon Crawler Carl"
-- (Dandy House/Royal Road), "The Atlas Six" (no surviving self-pub store),
-- "The Book of Not" (Ayebia Clarke — only a stale 2006 list price found,
-- no live page), or "The Long Way to a Small, Angry Planet" (Hodderscape
-- has no dedicated product page).

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://nightshade.start-publishing.com/book/1426/the-croning/', 24.99, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'the-croning' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.lollieditions.com/books/the-employees', 12.99, 'GBP', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'the-employees' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();
