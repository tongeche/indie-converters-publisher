-- Normalize book metadata already present in public.books.
-- This does not fetch or infer external catalogue data.

-- Keep the legacy isbn13 column in sync with the newer isbn_13 column.
update public.books
set isbn13 = isbn_13
where isbn13 is null
  and isbn_13 is not null;

-- Derive ISBN-10 from 978-prefixed ISBN-13 values.
with cleaned as (
  select
    id,
    substring(regexp_replace(isbn_13, '[^0-9Xx]', '', 'g') from 4 for 9) as core
  from public.books
  where isbn10 is null
    and regexp_replace(isbn_13, '[^0-9Xx]', '', 'g') ~ '^978[0-9]{10}$'
),
checks as (
  select
    id,
    core,
    (
      substring(core from 1 for 1)::int * 10 +
      substring(core from 2 for 1)::int * 9 +
      substring(core from 3 for 1)::int * 8 +
      substring(core from 4 for 1)::int * 7 +
      substring(core from 5 for 1)::int * 6 +
      substring(core from 6 for 1)::int * 5 +
      substring(core from 7 for 1)::int * 4 +
      substring(core from 8 for 1)::int * 3 +
      substring(core from 9 for 1)::int * 2
    ) as weighted_sum
  from cleaned
),
derived as (
  select
    id,
    core ||
      case ((11 - (weighted_sum % 11)) % 11)
        when 10 then 'X'
        else ((11 - (weighted_sum % 11)) % 11)::text
      end as isbn10
  from checks
)
update public.books b
set isbn10 = d.isbn10
from derived d
where b.id = d.id;

-- Create publisher rows from existing publisher_name values, then connect books.
-- The in-house spelling "Indie Converters" maps to the existing IndieConverters publisher.
with source_publishers as (
  select distinct
    trim(publisher_name) as name,
    btrim(regexp_replace(lower(trim(publisher_name)), '[^a-z0-9]+', '-', 'g'), '-') as slug
  from public.books
  where nullif(trim(publisher_name), '') is not null
    and lower(trim(publisher_name)) <> 'indie converters'
)
insert into public.publishers (name, slug)
select name, slug
from source_publishers
where slug <> ''
on conflict (slug) do update
set name = excluded.name,
    updated_at = now();

update public.books b
set publisher_id = p.id
from public.publishers p
where b.publisher_id is null
  and nullif(trim(b.publisher_name), '') is not null
  and (
    (lower(trim(b.publisher_name)) = 'indie converters' and p.slug = 'indieconverters')
    or p.slug = btrim(regexp_replace(lower(trim(b.publisher_name)), '[^a-z0-9]+', '-', 'g'), '-')
  );
