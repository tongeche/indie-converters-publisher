-- Full-text search on books (title, subtitle, description, keywords)
ALTER TABLE books
  ADD COLUMN IF NOT EXISTS search_tsv tsvector;

CREATE OR REPLACE FUNCTION books_update_search_tsv()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_tsv := to_tsvector('english'::regconfig,
    coalesce(NEW.title, '')       || ' ' ||
    coalesce(NEW.subtitle, '')    || ' ' ||
    coalesce(NEW.description, '') || ' ' ||
    coalesce(array_to_string(NEW.keywords, ' '), '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS books_search_tsv_update ON books;
CREATE TRIGGER books_search_tsv_update
  BEFORE INSERT OR UPDATE ON books
  FOR EACH ROW EXECUTE FUNCTION books_update_search_tsv();

UPDATE books SET search_tsv = to_tsvector('english'::regconfig,
  coalesce(title, '')       || ' ' ||
  coalesce(subtitle, '')    || ' ' ||
  coalesce(description, '') || ' ' ||
  coalesce(array_to_string(keywords, ' '), '')
);

CREATE INDEX IF NOT EXISTS books_search_tsv_idx ON books USING GIN (search_tsv);
