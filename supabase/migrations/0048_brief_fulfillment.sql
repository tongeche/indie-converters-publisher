ALTER TABLE hire_briefs ADD COLUMN IF NOT EXISTS hired_freelancer_id uuid REFERENCES freelancers(id) ON DELETE SET NULL;
ALTER TABLE hire_briefs ADD CONSTRAINT hire_briefs_status_check CHECK (status IN ('open','filled'));

-- Replace the owner-read policy to also cover guest-posted rows reclaimed by email
DROP POLICY "users_read_own_briefs" ON hire_briefs;
CREATE POLICY "users_read_own_briefs" ON hire_briefs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR (user_id IS NULL AND contact_email = auth.email()));

-- Authors can update (close) their own briefs, including reclaimed guest ones
CREATE POLICY "authors_update_own_briefs" ON hire_briefs
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR (user_id IS NULL AND contact_email = auth.email()))
  WITH CHECK (user_id = auth.uid() OR (user_id IS NULL AND contact_email = auth.email()));

-- Mark a brief filled, optionally crediting a freelancer's hire_count.
-- SECURITY DEFINER (mirrors increment_book_view in 0018_book_views.sql), so it
-- re-checks ownership itself instead of relying on the caller's RLS context,
-- and only increments hire_count if the brief update actually matched a row
-- the caller owns (prevents an arbitrary freelancer_id from inflating counts).
CREATE OR REPLACE FUNCTION mark_brief_filled(p_brief_id uuid, p_freelancer_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rows_updated int;
BEGIN
  UPDATE hire_briefs
  SET status = 'filled', hired_freelancer_id = p_freelancer_id
  WHERE id = p_brief_id
    AND status = 'open'
    AND (user_id = auth.uid() OR (user_id IS NULL AND contact_email = auth.email()));

  GET DIAGNOSTICS rows_updated = ROW_COUNT;

  IF rows_updated = 1 AND p_freelancer_id IS NOT NULL THEN
    UPDATE freelancers SET hire_count = hire_count + 1 WHERE id = p_freelancer_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION mark_brief_filled(uuid, uuid) TO authenticated;
