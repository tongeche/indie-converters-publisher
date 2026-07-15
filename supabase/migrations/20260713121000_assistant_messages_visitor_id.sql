-- Let anonymous assistant messages pass RLS without granting read access to
-- anonymous sessions. The visitor id is opaque browser-local metadata, not an
-- authorization secret.

alter table public.assistant_messages
  add column if not exists visitor_id text;

comment on column public.assistant_messages.visitor_id is 'Opaque browser-local id for anonymous visitors. Not a security credential.';

create index if not exists idx_assistant_messages_visitor_id on public.assistant_messages(visitor_id);

drop policy if exists "anon_create_assistant_messages" on public.assistant_messages;
create policy "anon_create_assistant_messages"
  on public.assistant_messages for insert
  to anon
  with check (user_id is null and visitor_id is not null);
