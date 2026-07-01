-- Store provenance for author biographies.

alter table public.authors
  add column if not exists bio_source text,
  add column if not exists bio_source_url text,
  add column if not exists bio_attribution text,
  add column if not exists bio_updated_at timestamptz;

comment on column public.authors.bio_source is
  'Source used to prepare the long author bio, such as author provided, official website, publisher page, Open Library, or Wikimedia.';

comment on column public.authors.bio_source_url is
  'URL for the author bio source or reference page, when available.';

comment on column public.authors.bio_attribution is
  'Required attribution for the author bio source, when applicable.';

comment on column public.authors.bio_updated_at is
  'Timestamp when long_bio or its source metadata was last updated.';
