-- Page view tracking: lightweight anonymous counter on each book row
ALTER TABLE books ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;

-- SECURITY DEFINER so anonymous readers can increment without needing UPDATE RLS
CREATE OR REPLACE FUNCTION increment_book_view(book_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE books
  SET view_count = view_count + 1
  WHERE slug = book_slug AND is_published = true;
END;
$$;

-- Grant execute to anon and authenticated so any visitor can fire it
GRANT EXECUTE ON FUNCTION increment_book_view(text) TO anon, authenticated;
