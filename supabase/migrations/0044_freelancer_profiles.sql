-- Freelancer profiles: self-serve signup for /get-hired, publicly readable
-- for the future /hire/browse directory
CREATE TABLE freelancers (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid REFERENCES auth.users(id) UNIQUE NOT NULL,
  display_name   text NOT NULL,
  service_type   text NOT NULL CHECK (service_type IN ('ghostwriting','editing','cover-design','formatting','other')),
  bio            text NOT NULL,
  portfolio_url  text,
  rate_min       numeric,
  rate_max       numeric,
  location       text,
  contact_email  text NOT NULL,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

ALTER TABLE freelancers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_freelancers" ON freelancers
  FOR SELECT USING (true);

CREATE POLICY "freelancers_insert_own_profile" ON freelancers
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "freelancers_update_own_profile" ON freelancers
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
