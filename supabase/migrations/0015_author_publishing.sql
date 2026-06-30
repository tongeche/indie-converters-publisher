-- ════════════════════════════════════════
-- 0015 · Author self-publishing support
-- ════════════════════════════════════════

-- 1. Extend books with author ownership + manuscript path
ALTER TABLE books ADD COLUMN IF NOT EXISTS author_user_id  uuid REFERENCES auth.users(id);
ALTER TABLE books ADD COLUMN IF NOT EXISTS manuscript_path text;

-- 2. Link authors table to auth users so we can find/create profiles
ALTER TABLE authors ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) UNIQUE;

-- 3. Books RLS — authors manage their own listings
CREATE POLICY "authors_read_own_books" ON books
  FOR SELECT TO authenticated
  USING (author_user_id = auth.uid());

CREATE POLICY "authors_insert_own_books" ON books
  FOR INSERT TO authenticated
  WITH CHECK (author_user_id = auth.uid());

CREATE POLICY "authors_update_own_books" ON books
  FOR UPDATE TO authenticated
  USING (author_user_id = auth.uid())
  WITH CHECK (author_user_id = auth.uid());

CREATE POLICY "authors_delete_own_books" ON books
  FOR DELETE TO authenticated
  USING (author_user_id = auth.uid());

-- 4. Junction tables — allow authors to link genres/authors to their own books
CREATE POLICY "authors_insert_books_authors" ON books_authors
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM books b WHERE b.id = book_id AND b.author_user_id = auth.uid())
  );

CREATE POLICY "authors_insert_books_genres" ON books_genres
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM books b WHERE b.id = book_id AND b.author_user_id = auth.uid())
  );

-- 5. Authors table — authenticated users can create/manage their own author profile
CREATE POLICY "authors_insert_own_profile" ON authors
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "authors_update_own_profile" ON authors
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 6. Storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'manuscripts', 'manuscripts', false, 52428800,
    ARRAY[
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/rtf', 'text/plain', 'text/rtf',
      'application/vnd.oasis.opendocument.text',
      'application/octet-stream'
    ]
  ),
  (
    'covers', 'covers', true, 5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  )
ON CONFLICT (id) DO NOTHING;

-- 7. Storage RLS — manuscripts (owner only)
CREATE POLICY "authors_upload_manuscripts" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'manuscripts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "authors_read_own_manuscripts" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'manuscripts' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 8. Storage RLS — covers (authenticated upload, public read)
CREATE POLICY "authors_upload_covers" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'covers');

CREATE POLICY "public_read_covers" ON storage.objects
  FOR SELECT USING (bucket_id = 'covers');
