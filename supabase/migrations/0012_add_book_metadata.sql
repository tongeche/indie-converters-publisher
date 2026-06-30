-- Extended book metadata for detail page
ALTER TABLE public.books
  ADD COLUMN IF NOT EXISTS pub_year      smallint,
  ADD COLUMN IF NOT EXISTS page_count    smallint,
  ADD COLUMN IF NOT EXISTS isbn_13       text,
  ADD COLUMN IF NOT EXISTS language      text DEFAULT 'English',
  ADD COLUMN IF NOT EXISTS publisher_name text;
