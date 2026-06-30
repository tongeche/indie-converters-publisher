-- Add retail price to books
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS price numeric(8,2);

-- Add google-books retailer
INSERT INTO public.retailers (slug, label) VALUES
  ('google-books', 'Google Books'),
  ('bookshop',     'Bookshop.org')
ON CONFLICT (slug) DO NOTHING;

-- Allow public to read book_retailer_links (already exists but ensure it)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'book_retailer_links' AND policyname = 'public_read_book_retailer_links'
  ) THEN
    CREATE POLICY "public_read_book_retailer_links" ON public.book_retailer_links
      FOR SELECT USING (true);
  END IF;
END $$;
