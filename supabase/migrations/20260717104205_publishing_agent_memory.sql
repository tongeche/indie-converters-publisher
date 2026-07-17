-- Durable, server-owned working memory for Alex, the publishing assistant.
-- These tables intentionally have no anon/authenticated grants or policies.
-- They are accessed only by trusted server code using the service role.

create table if not exists public.publishing_agent_state (
  id uuid primary key default gen_random_uuid(),
  assistant_session_id uuid not null unique references public.assistant_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  draft_key text not null check (length(trim(draft_key)) between 1 and 160),
  confirmed_facts jsonb not null default '[]'::jsonb check (jsonb_typeof(confirmed_facts) = 'array'),
  author_decisions jsonb not null default '[]'::jsonb check (jsonb_typeof(author_decisions) = 'array'),
  working_state jsonb not null default '{}'::jsonb check (jsonb_typeof(working_state) = 'object'),
  last_response_id text,
  last_agent text not null default 'Alex',
  last_tools jsonb not null default '[]'::jsonb check (jsonb_typeof(last_tools) = 'array'),
  expires_at timestamptz not null default (now() + interval '180 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, draft_key)
);

comment on table public.publishing_agent_state is 'Server-only durable memory for Alex, scoped to one authenticated author and publishing draft.';
comment on column public.publishing_agent_state.confirmed_facts is 'Author-confirmed facts only. AI inferences must never be stored here without approval.';
comment on column public.publishing_agent_state.working_state is 'Non-authoritative conversational state such as the unresolved question and current task.';

create table if not exists public.publishing_agent_approvals (
  id uuid primary key default gen_random_uuid(),
  agent_state_id uuid not null references public.publishing_agent_state(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  tool_name text not null check (length(trim(tool_name)) between 1 and 120),
  tool_arguments jsonb not null default '{}'::jsonb check (jsonb_typeof(tool_arguments) = 'object'),
  run_state jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'expired', 'completed', 'failed')),
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  error_message text
);

comment on table public.publishing_agent_approvals is 'Server-only approval queue for resumable publishing-agent actions.';

create index if not exists idx_publishing_agent_state_user_draft
  on public.publishing_agent_state (user_id, draft_key);
create index if not exists idx_publishing_agent_state_expires_at
  on public.publishing_agent_state (expires_at);
create index if not exists idx_publishing_agent_approvals_pending
  on public.publishing_agent_approvals (user_id, status, requested_at desc)
  where status = 'pending';
create index if not exists idx_publishing_agent_approvals_expires_at
  on public.publishing_agent_approvals (expires_at)
  where status = 'pending';

alter table public.publishing_agent_state enable row level security;
alter table public.publishing_agent_approvals enable row level security;

revoke all on table public.publishing_agent_state from anon, authenticated;
revoke all on table public.publishing_agent_approvals from anon, authenticated;
grant select, insert, update, delete on table public.publishing_agent_state to service_role;
grant select, insert, update, delete on table public.publishing_agent_approvals to service_role;
