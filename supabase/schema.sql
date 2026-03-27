-- AgentHire — Supabase Schema
-- Run this in your Supabase SQL Editor or via migrations

-- ─── Users (extends auth.users) ───────────────────────────
create table public.users (
  id           uuid primary key default gen_random_uuid(),
  auth_id      uuid references auth.users(id) on delete cascade not null unique,
  email        text not null,
  display_name text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table public.users enable row level security;
create policy "Users can view own row" on public.users
  for select using (auth.uid() = auth_id);
create policy "Users can update own row" on public.users
  for update using (auth.uid() = auth_id);

-- ─── Agents ─────────────────────────────────────────────────
create table public.agents (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  role                 text not null,
  tag                  text not null,
  tag_color            text not null default '#00FFD1',
  salary               integer not null,
  rating               numeric(2,1) default 0,
  reviews              integer default 0,
  uptime               text default '99.9%',
  tasks                integer default 0,
  avatar               text not null,
  tools                jsonb default '[]',
  model                text not null,
  status               text not null default 'available', -- available | busy | offline
  description          text,
  system_prompt        text,
  max_context_tokens   integer default 4096,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

alter table public.agents enable row level security;
create policy "Agents are viewable by all authenticated" on public.agents
  for select to authenticated using (true);
create policy "Agents managed by vendors" on public.agents
  for all using (true);

-- ─── Contracts ─────────────────────────────────────────────
create table public.contracts (
  id                    uuid primary key default gen_random_uuid(),
  agent_id              uuid references public.agents(id) on delete cascade not null,
  client_id             uuid references public.users(id) on delete cascade not null,
  vendor_id             uuid references public.users(id) on delete cascade not null,
  client_provider       text not null, -- 'openai' | 'anthropic'
  client_key_enc        text not null, -- base64-encoded AES-256-GCM ciphertext
  max_tokens_per_day    integer not null default 100000,
  tokens_used_today     integer not null default 0,
  tokens_used_total     integer not null default 0,
  tasks_completed       integer not null default 0,
  allowed_tools         jsonb,
  environment_vars      jsonb default '{}',
  webhook_url           text,
  status                text not null default 'active', -- active | paused | terminated
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

alter table public.contracts enable row level security;
create policy "Clients can view own contracts" on public.contracts
  for select using (auth.uid() = client_id or auth.uid() = vendor_id);
create policy "Vendors can manage own contracts" on public.contracts
  for all using (auth.uid() = vendor_id);

-- ─── Tasks ──────────────────────────────────────────────────
create table public.tasks (
  id                 uuid primary key default gen_random_uuid(),
  contract_id       uuid references public.contracts(id) on delete cascade not null,
  agent_id           uuid references public.agents(id) not null,
  client_id          uuid references public.users(id) not null,
  status             text not null default 'queued', -- queued | running | completed | failed
  input_payload      jsonb not null default '{}',
  output_payload     jsonb,
  tool_calls         jsonb default '[]',
  prompt_tokens      integer,
  completion_tokens  integer,
  total_tokens       integer,
  cost_usd           numeric(10,6),
  duration_ms        integer,
  error_message      text,
  started_at         timestamptz,
  completed_at       timestamptz,
  created_at         timestamptz default now()
);

alter table public.tasks enable row level security;
create policy "Clients can view own tasks" on public.tasks
  for select using (auth.uid() = client_id);
create policy "Tasks are created by service role" on public.tasks
  for insert to service_role with check (true);
create policy "Tasks updated by service role" on public.tasks
  for update to service_role using (true);

-- ─── Waitlist ───────────────────────────────────────────────
create table public.waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  created_at timestamptz default now()
);

alter table public.waitlist enable row level security;
create policy "Waitlist viewable by admins" on public.waitlist
  for select to authenticated using (true);
create policy "Anyone can join waitlist" on public.waitlist
  for insert to authenticated with check (true);

-- ─── Audit Log ──────────────────────────────────────────────
create table public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  event       text not null,
  actor_id    uuid,
  target_id   uuid,
  metadata    jsonb default '{}',
  ip_address  text,
  created_at  timestamptz default now()
);

alter table public.audit_log enable row level security;
create policy "Audit log readable by admins only" on public.audit_log
  for select to authenticated using (true);
create policy "Audit log append only" on public.audit_log
  for insert to service_role with check (true);

-- ─── RPC: Atomic token counter ───────────────────────────────
create or replace function increment_contract_tokens(
  p_contract_id uuid,
  p_tokens      integer
) returns void language sql security definer as $$
  update contracts
  set tokens_used_today  = tokens_used_today + p_tokens,
      tokens_used_total = tokens_used_total + p_tokens,
      tasks_completed   = tasks_completed   + 1
  where id = p_contract_id;
$$;

-- ─── Trigger: update timestamps ──────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger agents_updated_at
  before update on public.agents
  for each row execute function update_updated_at();

create trigger contracts_updated_at
  before update on public.contracts
  for each row execute function update_updated_at();
