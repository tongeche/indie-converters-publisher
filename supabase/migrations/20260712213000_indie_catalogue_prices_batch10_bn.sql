-- Verified retail prices sourced from Barnes & Noble (batch 10, continuing
-- batch 9's third-party-retailer approach) for indie-catalogue books whose
-- publisher/self-pub storefronts blocked fetches or showed no price
-- (2026-07-12). Where multiple formats were listed, the lowest was used.
--
-- "A Small Silence" (Jumoke Verissimo, Cassava Republic) has no listing on
-- Barnes & Noble, Waterstones, or Blackwell's -- its only retail presence
-- is Amazon and Cassava Republic's own site (cassavarepublic.biz), both of
-- which have blocked every fetch attempt this session. Left unpriced.

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.barnesandnoble.com/w/legends-lattes-travis-baldree/1141022971', 17.99, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'legends-and-lattes' and r.slug = 'barnes-noble'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.barnesandnoble.com/w/milk-and-honey-rupi-kaur/1120688841', 14.99, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'milk-and-honey' and r.slug = 'barnes-noble'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.barnesandnoble.com/w/minor-detail-adania-shibli/1134209412', 15.95, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'minor-detail' and r.slug = 'barnes-noble'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.barnesandnoble.com/w/mostly-dead-things-kristen-arnett/1129598964', 15.95, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'mostly-dead-things' and r.slug = 'barnes-noble'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.barnesandnoble.com/w/the-5-love-languages-gary-chapman/1112878532', 16.99, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'the-5-love-languages' and r.slug = 'barnes-noble'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.barnesandnoble.com/w/the-atlas-six-olivie-blake/1139432349', 11.99, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'the-atlas-six' and r.slug = 'barnes-noble'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.barnesandnoble.com/w/the-babysitter-at-rest-jen-george/1123889525', 9.99, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'the-babysitter-at-rest' and r.slug = 'barnes-noble'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.barnesandnoble.com/w/the-book-of-not-tsitsi-dangarembga/1101420076', 9.99, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'the-book-of-not' and r.slug = 'barnes-noble'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.barnesandnoble.com/w/the-hole-hiroko-oyamada/1136470010', 14.20, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'the-hole' and r.slug = 'barnes-noble'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.barnesandnoble.com/w/the-long-way-to-a-small-angry-planet-becky-chambers/1119952314', 14.99, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'the-long-way-to-a-small-angry-planet' and r.slug = 'barnes-noble'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.barnesandnoble.com/w/the-princess-saves-herself-in-this-one-amanda-lovelace/1123913448', 7.99, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'the-princess-saves-herself-in-this-one' and r.slug = 'barnes-noble'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.barnesandnoble.com/w/the-psychology-of-money-morgan-housel/1136394564', 12.79, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'the-psychology-of-money' and r.slug = 'barnes-noble'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.barnesandnoble.com/w/the-wallcreeper-nell-zink/1119843815', 9.99, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'the-wallcreeper' and r.slug = 'barnes-noble'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();

insert into public.book_retailer_links (book_id, retailer_id, url, price, currency, source, price_updated_at)
select b.id, r.id, 'https://www.barnesandnoble.com/w/when-we-speak-of-nothing-dr-olumide-popoola/1126627780', 11.98, 'USD', 'editor', now()
from public.books b, public.retailers r
where b.slug = 'when-we-speak-of-nothing' and r.slug = 'barnes-noble'
on conflict (book_id, retailer_id) do update set
  url = excluded.url, price = excluded.price, currency = excluded.currency, source = 'editor', price_updated_at = now();
