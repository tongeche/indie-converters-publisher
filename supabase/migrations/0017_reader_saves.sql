-- Reader saves: lets readers bookmark books and gives authors a real "Saves" metric
CREATE TABLE reader_saves (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id    uuid REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (book_id, user_id)
);

ALTER TABLE reader_saves ENABLE ROW LEVEL SECURITY;

-- Readers can manage their own saves
CREATE POLICY "users_manage_own_saves" ON reader_saves
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Authors can read saves on books they own (for Reports tab)
CREATE POLICY "authors_read_saves_on_own_books" ON reader_saves
  FOR SELECT TO authenticated
  USING (
    book_id IN (
      SELECT id FROM books WHERE author_user_id = auth.uid()
    )
  );
