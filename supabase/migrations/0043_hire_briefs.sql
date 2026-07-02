-- Hire briefs: lets authors submit a real project request from /hire/post
CREATE TABLE hire_briefs (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  service_type   text NOT NULL CHECK (service_type IN ('ghostwriting','editing','cover-design','formatting','other')),
  title          text NOT NULL,
  description    text NOT NULL,
  budget_min     numeric,
  budget_max     numeric,
  timeline       text,
  contact_name   text NOT NULL,
  contact_email  text NOT NULL,
  status         text NOT NULL DEFAULT 'open',
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE hire_briefs ENABLE ROW LEVEL SECURITY;

-- Anyone (logged in or guest) can submit a brief
CREATE POLICY "anyone_can_submit_brief" ON hire_briefs
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Authenticated users can see their own submitted briefs
CREATE POLICY "users_read_own_briefs" ON hire_briefs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
