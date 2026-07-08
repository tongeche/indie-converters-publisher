-- Price comparison feature: let authors attach a price to each retailer link,
-- instead of the platform only ever holding one flat price for the whole book.
-- IndieConverters never sells directly; this lets us show readers where a
-- book is cheapest across the retailers the author has actually linked.

alter table public.book_retailer_links
  add column if not exists price numeric(8,2),
  add column if not exists currency text not null default 'USD';

do $$
begin
  alter table public.book_retailer_links
    add constraint book_retailer_links_price_nonneg check (price is null or price >= 0);
exception
  when duplicate_object then null;
end $$;

-- Required for the upsert-on-conflict calls already used against this table
-- (api.js's upsertBuyLink already passes onConflict: 'book_id,retailer_id' with
-- no matching constraint ever created — inserts relying on that upsert semantics
-- would fail at the database level without this).
do $$
begin
  alter table public.book_retailer_links
    add constraint book_retailer_links_book_retailer_unique unique (book_id, retailer_id);
exception
  when duplicate_object then null;
end $$;

-- Missing write policy: books/books_authors/books_genres all have an
-- authenticated-author write policy; book_retailer_links never got one, so
-- inserts from the wizard's non-editor author flow were likely silently
-- blocked by RLS this whole time. Fixing this regardless of the new columns.
drop policy if exists "authors_manage_own_book_retailer_links" on public.book_retailer_links;
create policy "authors_manage_own_book_retailer_links" on public.book_retailer_links
  for all to authenticated
  using (exists (select 1 from public.books b where b.id = book_id and b.author_user_id = auth.uid()))
  with check (exists (select 1 from public.books b where b.id = book_id and b.author_user_id = auth.uid()));

-- Backfill: give existing single-link books a starting price so they don't
-- suddenly show "no price" on their one retailer. Best-effort default, not
-- authoritative — the author should still verify/refine it per retailer.
update public.book_retailer_links l
set price = b.price
from public.books b
where l.book_id = b.id
  and l.price is null
  and b.price is not null
  and b.price > 0;

comment on column public.book_retailer_links.price is 'Price at this specific retailer, as declared by the author. Nullable — a link can exist with no price yet. Drives the price-comparison view on Book Detail.';
comment on column public.book_retailer_links.currency is 'ISO 4217 currency code for price. Defaults to USD; no currency selector in the UI yet.';
