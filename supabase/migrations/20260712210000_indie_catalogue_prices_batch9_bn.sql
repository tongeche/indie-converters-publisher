-- Verified retail prices sourced from Barnes & Noble (a legitimate
-- third-party retailer, not the original publisher) for indie-catalogue
-- books that no longer have a live self-pub/publisher storefront, or
-- whose publisher's own page never showed a price (2026-07-12), batch 9.
-- This widens the "editor"-sourced retailer beyond publisher-site per an
-- explicit decision to accept third-party prices once the primary-source
-- options are exhausted for the remaining unpriced titles.
--
-- Complex PTSD: Pete Walker's own site and Barnes & Noble's paperback
-- listing (id 1117705063) both show no visible/live price; the $19.99
-- figure used here is B&N's audiobook-purchase price (the only confirmed
-- price found), not the paperback.

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.barnesandnoble.com/w/a-girl-is-a-body-of-water-jennifer-nansubuga-makumbi/1137324736', 17.95, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'a-girl-is-a-body-of-water' and r.slug = 'barnes-noble'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.barnesandnoble.com/w/adult-children-of-emotionally-immature-parents-lindsay-c-gibson-psyd/1121368782', 15.15, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'adult-children-of-emotionally-immature-parents' and r.slug = 'barnes-noble'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.barnesandnoble.com/w/complex-ptsd-pete-walker/1131837879', 19.99, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'complex-ptsd' and r.slug = 'barnes-noble'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.barnesandnoble.com/w/dungeon-crawler-carl-matt-dinniman/1145437169', 20.00, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'dungeon-crawler-carl' and r.slug = 'barnes-noble'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.barnesandnoble.com/w/hurricane-season-fernanda-melchor/1131712485', 16.95, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'hurricane-season' and r.slug = 'barnes-noble'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.barnesandnoble.com/w/in-the-distance-hernan-diaz/1125855695', 18.00, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'in-the-distance' and r.slug = 'barnes-noble'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.barnesandnoble.com/w/like-a-mule-bringing-ice-cream-to-the-sun-sarah-ladipo-manyika/1123445334', 11.98, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'like-a-mule-bringing-ice-cream-to-the-sun' and r.slug = 'barnes-noble'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();
