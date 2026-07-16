-- Human-support requests created from the assistant widget.
--
-- Contact details are intentionally kept out of assistant_messages metadata.
-- This table has no browser-facing grants or policies: requests must pass
-- through the validated Netlify endpoint, which writes with service_role.

create table if not exists public.assistant_handoffs (
  id uuid primary key default gen_random_uuid(),
  assistant_session_id uuid references public.assistant_sessions(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  visitor_id text,
  contact_name text,
  contact_email text not null,
  topic text not null,
  message text not null,
  page_url text,
  consent_accepted_at timestamptz not null,
  status text not null default 'new',
  request_fingerprint text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assistant_handoffs_name_length check (
    contact_name is null or length(trim(contact_name)) between 1 and 100
  ),
  constraint assistant_handoffs_email_valid check (
    length(contact_email) between 3 and 254
    and contact_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  constraint assistant_handoffs_topic_valid check (
    topic in ('publishing', 'book_discovery', 'account', 'hiring', 'technical', 'other')
  ),
  constraint assistant_handoffs_message_length check (
    length(trim(message)) between 10 and 1000
  ),
  constraint assistant_handoffs_page_url_length check (
    page_url is null or length(page_url) <= 500
  ),
  constraint assistant_handoffs_visitor_id_length check (
    visitor_id is null or length(visitor_id) <= 128
  ),
  constraint assistant_handoffs_status_valid check (
    status in ('new', 'in_progress', 'resolved', 'closed')
  ),
  constraint assistant_handoffs_fingerprint_length check (
    length(request_fingerprint) = 64
  )
);

comment on table public.assistant_handoffs is 'Server-validated requests to continue an assistant conversation with the human support team.';
comment on column public.assistant_handoffs.request_fingerprint is 'Salted SHA-256 request fingerprint used only for abuse throttling; no raw IP is stored.';
comment on column public.assistant_handoffs.consent_accepted_at is 'When the visitor accepted the assistant privacy notice before submitting contact details.';

create index if not exists idx_assistant_handoffs_status_created
  on public.assistant_handoffs(status, created_at desc);
create index if not exists idx_assistant_handoffs_email_created
  on public.assistant_handoffs(lower(contact_email), created_at desc);
create index if not exists idx_assistant_handoffs_fingerprint_created
  on public.assistant_handoffs(request_fingerprint, created_at desc);

-- Serialise requests by both fingerprint and email before checking limits, so
-- parallel submissions cannot race between a count and an insert.
create or replace function public.submit_assistant_handoff(
  p_assistant_session_id uuid,
  p_user_id uuid,
  p_visitor_id text,
  p_contact_name text,
  p_contact_email text,
  p_topic text,
  p_message text,
  p_page_url text,
  p_consent_accepted_at timestamptz,
  p_request_fingerprint text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_request_id uuid;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_request_fingerprint, 0)
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(pg_catalog.lower(p_contact_email), 1)
  );

  if (
    select pg_catalog.count(*)
    from public.assistant_handoffs
    where request_fingerprint = p_request_fingerprint
      and created_at >= pg_catalog.now() - interval '15 minutes'
  ) >= 5 then
    raise exception using errcode = 'P0001', message = 'support_rate_limited';
  end if;

  if (
    select pg_catalog.count(*)
    from public.assistant_handoffs
    where pg_catalog.lower(contact_email) = pg_catalog.lower(p_contact_email)
      and created_at >= pg_catalog.now() - interval '1 hour'
  ) >= 3 then
    raise exception using errcode = 'P0001', message = 'support_rate_limited';
  end if;

  insert into public.assistant_handoffs (
    assistant_session_id,
    user_id,
    visitor_id,
    contact_name,
    contact_email,
    topic,
    message,
    page_url,
    consent_accepted_at,
    request_fingerprint
  ) values (
    p_assistant_session_id,
    p_user_id,
    p_visitor_id,
    p_contact_name,
    pg_catalog.lower(p_contact_email),
    p_topic,
    p_message,
    p_page_url,
    p_consent_accepted_at,
    p_request_fingerprint
  ) returning id into v_request_id;

  return v_request_id;
end;
$function$;

revoke all on function public.submit_assistant_handoff(uuid, uuid, text, text, text, text, text, text, timestamptz, text)
  from public, anon, authenticated;
grant execute on function public.submit_assistant_handoff(uuid, uuid, text, text, text, text, text, text, timestamptz, text)
  to service_role;

drop trigger if exists trg_assistant_handoffs_updated_at on public.assistant_handoffs;
create trigger trg_assistant_handoffs_updated_at
before update on public.assistant_handoffs
for each row execute function public.set_updated_at();

alter table public.assistant_handoffs enable row level security;

revoke all on table public.assistant_handoffs from anon, authenticated;
grant select, insert, update on table public.assistant_handoffs to service_role;
grant select on table public.assistant_sessions to service_role;
