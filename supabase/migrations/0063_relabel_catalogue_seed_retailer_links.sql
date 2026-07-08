-- Every book_retailer_links row created by the pre-pricing-feature catalogue
-- seed migrations (0037/0038/0041/0053/0056, etc.) landed with source =
-- 'author' by column default, even though none of those books have an
-- author_user_id — there was no author, editor, or Google check involved,
-- just research done at seed time. That's misleading (the BookDetail
-- disclaimer implies a human "author" vouched for it). Relabel those rows to
-- a distinct 'catalogue' source so it's accurate; the UI treats it exactly
-- like 'author'/'editor' (no special badge — only 'google_books' gets one).

alter table public.book_retailer_links
  drop constraint if exists book_retailer_links_source_check;
alter table public.book_retailer_links
  add constraint book_retailer_links_source_check
  check (source in ('author', 'editor', 'google_books', 'catalogue'));

update public.book_retailer_links l
set source = 'catalogue'
from public.books b
where l.book_id = b.id
  and b.author_user_id is null
  and l.source = 'author';

comment on column public.book_retailer_links.source is 'Who supplied this price/link: ''author'' (wizard/EditBook), ''editor'' (Catalogue Prices tool), ''google_books'' (auto-verified), or ''catalogue'' (seeded at migration time before this feature existed, no human attribution).';
