-- Let authenticated users (freelancers) browse open briefs at /get-hired/projects
CREATE POLICY "authenticated_read_open_briefs" ON hire_briefs
  FOR SELECT TO authenticated
  USING (status = 'open');
