-- Verified retail prices for independently-published catalogue books,
-- fetched directly from each self-published author's own storefront
-- (2026-07-12), batch 7. Tagged retailer "own" (not "publisher-site")
-- since both H.D. Carlton and Mark Dawson sell directly through their own
-- author-run stores rather than a traditional publisher.
--
-- Skipped this round: andrewsmcmeel.com pages for "milk and honey" and
-- "the princess saves herself in this one" (no price shown in fetched
-- content), soundstrue.com ("No Bad Parts", same), and Legends & Lattes
-- (Travis Baldree has no self-pub storefront left — now sold exclusively
-- through Tor/Macmillan, out of scope for author-declared direct pricing).

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://hdcarlton.com/product/haunting-adeline-paperback/', 16.00, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'haunting-adeline' and r.slug = 'own'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://markjdawson.com/products/the-cleaner-hardback', 11.99, 'GBP', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'the-cleaner' and r.slug = 'own'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();
