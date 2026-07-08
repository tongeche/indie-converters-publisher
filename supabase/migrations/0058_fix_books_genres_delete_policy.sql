-- books_genres only ever got an authenticated INSERT policy (0015_author_publishing.sql),
-- never a DELETE one. api.js's updateBookGenres() does delete-then-reinsert on every
-- save, so the delete has been silently blocked by RLS for every real author (delete
-- with 0 visible rows is not an error), leaving stale rows that then collide with the
-- reinsert on the primary key (book_id, genre_id) — surfaced as a 409 while verifying
-- the price-comparison feature's EditBook.jsx save flow.

drop policy if exists "authors_delete_books_genres" on public.books_genres;
create policy "authors_delete_books_genres" on public.books_genres
  for delete to authenticated
  using (exists (select 1 from public.books b where b.id = book_id and b.author_user_id = auth.uid()));
