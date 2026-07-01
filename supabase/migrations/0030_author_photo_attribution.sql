-- Store source and licensing metadata for author photos.

alter table public.authors
  add column if not exists photo_source text,
  add column if not exists photo_license text,
  add column if not exists photo_attribution text;

comment on column public.authors.photo_source is
  'Where the author photo came from, such as author upload, Open Library, Wikimedia Commons, or publisher press kit.';

comment on column public.authors.photo_license is
  'License or usage basis for the author photo, such as author provided, CC BY-SA 4.0, or public domain.';

comment on column public.authors.photo_attribution is
  'Required credit line for the author photo, when applicable.';
