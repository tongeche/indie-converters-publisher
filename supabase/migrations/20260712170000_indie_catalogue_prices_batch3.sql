-- Verified retail prices for independently-published catalogue books,
-- fetched directly from each publisher's own site (2026-07-12), batch 3.
-- Where a page listed both an ebook and print price, the lower of the two
-- was used, matching the "lowest price wins" convention already used
-- elsewhere in the price-comparison feature.
--
-- Skipped this round: "The Babysitter at Rest" and "The Wallcreeper"
-- (dorothyproject.com pages link out to NYRB but show no price directly),
-- "The Factory" and "The Hole" (ndbooks.com returned HTTP 403), and "When
-- We Speak of Nothing" (cassavarepublic.biz — blocked on every attempt
-- across all three of its books in this catalogue).

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.graywolfpress.org/books/house-rust', 18.00, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'the-house-of-rust' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://otherpress.com/product/the-hundred-wells-of-salaga-9781590519950/', 9.99, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'the-hundred-wells-of-salaga' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://coffeehousepress.org/products/the-story-of-my-teeth', 16.95, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'the-story-of-my-teeth' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.catalystpress.org/all-content/the-theory-of-flight', 16.95, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'the-theory-of-flight' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://twodollarradio.com/products/they-cant-kill-us', 16.95, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'they-cant-kill-us-until-they-kill-us' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.graywolfpress.org/books/mournable-body', 17.00, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'this-mournable-body' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.tiltedaxispress.com/tomb-of-sand', 9.99, 'GBP', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'tomb-of-sand' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://store.deepvellum.org/products/tram-83', 14.95, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'tram-83' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.biblioasis.com/shop/fiction/translated-fiction/transparent-city/', 9.99, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'transparent-city' and r.slug = 'publisher-site'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();
