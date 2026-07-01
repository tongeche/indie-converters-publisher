-- Public catalogue fields for surfacing indie verification in the app.
-- These fields are intentionally nullable; review/backfill happens separately.

alter table public.books
  add column if not exists indie_status text,
  add column if not exists indie_confidence smallint,
  add column if not exists indie_verified_at timestamptz,
  add column if not exists indie_source_summary text,
  add column if not exists indie_evidence_urls text[] not null default '{}'::text[];

do $$
begin
  alter table public.books
    add constraint books_indie_status_check
    check (
      indie_status is null
      or indie_status in (
        'self_published',
        'small_press',
        'likely_indie',
        'likely_traditional',
        'uncertain'
      )
    );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.books
    add constraint books_indie_confidence_check
    check (indie_confidence is null or indie_confidence between 0 and 100);
exception
  when duplicate_object then null;
end $$;

create index if not exists books_indie_status_idx
  on public.books (indie_status, indie_confidence desc)
  where indie_status is not null;

create index if not exists books_indie_verified_at_idx
  on public.books (indie_verified_at desc)
  where indie_verified_at is not null;

comment on column public.books.indie_status is
  'Public indie verification status for catalogue display. Values mirror app_private.book_indie_classification_candidates.classification.';

comment on column public.books.indie_confidence is
  'Public confidence score from 0-100 for indie_status.';

comment on column public.books.indie_verified_at is
  'Timestamp when the public indie verification fields were last promoted from reviewed evidence.';

comment on column public.books.indie_source_summary is
  'Short public-facing summary of the evidence behind indie_status.';

comment on column public.books.indie_evidence_urls is
  'Public evidence URLs used to support indie_status, such as Google Books, Open Library, publisher, or retailer records.';
