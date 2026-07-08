-- Phase 2 of price comparison: distinguish author-declared retailer prices
-- from ones we cross-check automatically via the free Google Books API, so
-- the UI can label them differently ("entered by the author" vs "verified").

alter table public.book_retailer_links
  add column if not exists source text not null default 'author',
  add column if not exists price_updated_at timestamptz;

do $$
begin
  alter table public.book_retailer_links
    add constraint book_retailer_links_source_check check (source in ('author', 'google_books'));
exception
  when duplicate_object then null;
end $$;

update public.book_retailer_links
set price_updated_at = coalesce(price_updated_at, now())
where price_updated_at is null;

comment on column public.book_retailer_links.source is 'Who supplied this price: ''author'' (entered in the wizard/edit form) or ''google_books'' (auto cross-checked via scripts/enrich-google-books-prices.mjs). Author-editing flows must never touch google_books rows.';
comment on column public.book_retailer_links.price_updated_at is 'When this row''s price was last set or verified.';
