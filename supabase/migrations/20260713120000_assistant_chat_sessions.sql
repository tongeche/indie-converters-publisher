-- Assistant chat session persistence.
--
-- The landing assistant is client-side for now, but we store a consented
-- session/message trail so support history and a future AI endpoint have a
-- durable foundation.

create table if not exists public.assistant_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  visitor_id text,
  page_url text,
  consent_accepted_at timestamptz not null,
  started_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint assistant_sessions_owner_present check (user_id is not null or visitor_id is not null)
);

comment on table public.assistant_sessions is 'Consent-backed assistant chat sessions from the site widget.';
comment on column public.assistant_sessions.visitor_id is 'Opaque browser-local id for anonymous visitors. Not a security credential.';
comment on column public.assistant_sessions.consent_accepted_at is 'When the user accepted the assistant terms/privacy note.';

create table if not exists public.assistant_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.assistant_sessions(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null check (length(trim(content)) > 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.assistant_messages is 'Messages exchanged inside an assistant session. Assistant replies are mock/client-generated until backend AI is wired.';

create index if not exists idx_assistant_sessions_user_id on public.assistant_sessions(user_id);
create index if not exists idx_assistant_sessions_visitor_id on public.assistant_sessions(visitor_id);
create index if not exists idx_assistant_sessions_last_message_at on public.assistant_sessions(last_message_at desc);
create index if not exists idx_assistant_messages_session_id on public.assistant_messages(session_id);
create index if not exists idx_assistant_messages_created_at on public.assistant_messages(created_at);

create or replace function public.touch_assistant_session_last_message()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.assistant_sessions
  set last_message_at = new.created_at
  where id = new.session_id;

  return new;
end;
$$;

drop trigger if exists trg_touch_assistant_session_last_message on public.assistant_messages;
create trigger trg_touch_assistant_session_last_message
after insert on public.assistant_messages
for each row execute function public.touch_assistant_session_last_message();

alter table public.assistant_sessions enable row level security;
alter table public.assistant_messages enable row level security;

grant select, insert, update on public.assistant_sessions to anon, authenticated;
grant select, insert on public.assistant_messages to anon, authenticated;

drop policy if exists "anon_create_assistant_session" on public.assistant_sessions;
create policy "anon_create_assistant_session"
  on public.assistant_sessions for insert
  to anon
  with check (user_id is null and visitor_id is not null);

drop policy if exists "authenticated_create_own_assistant_session" on public.assistant_sessions;
create policy "authenticated_create_own_assistant_session"
  on public.assistant_sessions for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "authenticated_read_own_assistant_sessions" on public.assistant_sessions;
create policy "authenticated_read_own_assistant_sessions"
  on public.assistant_sessions for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "authenticated_update_own_assistant_sessions" on public.assistant_sessions;
create policy "authenticated_update_own_assistant_sessions"
  on public.assistant_sessions for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "anon_create_assistant_messages" on public.assistant_messages;
create policy "anon_create_assistant_messages"
  on public.assistant_messages for insert
  to anon
  with check (
    user_id is null
    and exists (
      select 1
      from public.assistant_sessions s
      where s.id = assistant_messages.session_id
        and s.user_id is null
        and s.visitor_id is not null
    )
  );

drop policy if exists "authenticated_create_own_assistant_messages" on public.assistant_messages;
create policy "authenticated_create_own_assistant_messages"
  on public.assistant_messages for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.assistant_sessions s
      where s.id = assistant_messages.session_id
        and s.user_id = (select auth.uid())
    )
  );

drop policy if exists "authenticated_read_own_assistant_messages" on public.assistant_messages;
create policy "authenticated_read_own_assistant_messages"
  on public.assistant_messages for select
  to authenticated
  using (
    exists (
      select 1
      from public.assistant_sessions s
      where s.id = assistant_messages.session_id
        and s.user_id = (select auth.uid())
    )
  );
