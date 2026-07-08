-- Lets a platform editor curate retailer links/prices for ANY book, not just
-- ones with an author account. Most of the catalogue (discovery-catalogue
-- seed books) has no author_user_id at all, so Phase 1's author-only RLS
-- policy on book_retailer_links never applies to them — there's no one to
-- enter a price. This adds an editor escape hatch, mirroring the existing
-- editors_can_write_books policy on public.books (0001_core.sql).

alter table public.book_retailer_links
  drop constraint if exists book_retailer_links_source_check;
alter table public.book_retailer_links
  add constraint book_retailer_links_source_check check (source in ('author', 'editor', 'google_books'));

drop policy if exists "editors_manage_book_retailer_links" on public.book_retailer_links;
create policy "editors_manage_book_retailer_links" on public.book_retailer_links
  for all to authenticated
  using (exists (select 1 from public.editors e where e.user_id = auth.uid()))
  with check (exists (select 1 from public.editors e where e.user_id = auth.uid()));

-- Make the current platform operator an editor so the tool is actually usable.
insert into public.editors (user_id)
select id from auth.users where email = 'tongeche@gmail.com'
on conflict (user_id) do nothing;
