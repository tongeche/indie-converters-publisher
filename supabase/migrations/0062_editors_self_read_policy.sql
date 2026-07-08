-- public.editors has had RLS enabled since 0001_core.sql but was never given
-- any policy at all — meaning even a real editor could never read their own
-- row (checkIsEditor() in src/lib/api.js was silently returning false).
-- Let an authenticated user check only their own editor status.

drop policy if exists "self_read_editor_status" on public.editors;
create policy "self_read_editor_status" on public.editors
  for select to authenticated
  using (auth.uid() = user_id);
