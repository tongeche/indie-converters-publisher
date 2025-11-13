-- Create publishers table
CREATE TABLE IF NOT EXISTS publishers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  website_url TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add publisher_id to books table
ALTER TABLE books
ADD COLUMN IF NOT EXISTS publisher_id UUID REFERENCES publishers(id) ON DELETE SET NULL;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_books_publisher_id ON books(publisher_id);

-- Add comment
COMMENT ON COLUMN books.publisher_id IS 'Reference to the publisher who published this book';

-- Insert IndieConverters as a publisher
INSERT INTO publishers (name, slug, description, website_url)
VALUES (
  'IndieConverters',
  'indieconverters',
  'The largest independent self-publishing platform connecting authors with readers worldwide.',
  'https://indieconverters.com'
) ON CONFLICT (slug) DO NOTHING;

-- Get IndieConverters publisher ID for reference
DO $$
DECLARE
  indie_publisher_id UUID;
BEGIN
  SELECT id INTO indie_publisher_id FROM publishers WHERE slug = 'indieconverters';
  
  -- Update some books to be published by IndieConverters (you can modify these)
  -- Based on imprints or other criteria
  UPDATE books 
  SET publisher_id = indie_publisher_id
  WHERE id IN (
    SELECT id 
    FROM books 
    WHERE imprint_id IS NOT NULL 
    LIMIT 10
  );
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_publishers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for publishers table
CREATE TRIGGER trigger_update_publishers_updated_at
  BEFORE UPDATE ON publishers
  FOR EACH ROW
  EXECUTE FUNCTION update_publishers_updated_at();
