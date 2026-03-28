-- ============================================================
-- AgentHub — Schema Supabase
-- ============================================================

-- ============================================================
-- Tenants (clientes da plataforma)
-- ============================================================
create table if not exists tenants (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  plan        text not null default 'free',
  max_agents  int not null default 3,
  max_messages_per_month int not null default 1000,
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

-- ============================================================
-- Agents
-- ============================================================
create table if not exists agents (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references tenants(id) on delete cascade,
  name           text not null,
  description    text,
  system_prompt  text not null,
  provider       text not null default 'anthropic',
  model          text not null default 'claude-sonnet-4-6',
  temperature    float not null default 0.7,
  max_tokens     int not null default 1024,
  status         text not null default 'active',
  tools_enabled  text[] not null default '{}',
  metadata       jsonb not null default '{}',
  created_at     timestamptz not null default now()
);

-- ============================================================
-- Integrations
-- ============================================================
create table if not exists integrations (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants(id) on delete cascade,
  agent_id   uuid not null references agents(id) on delete cascade,
  type       text not null,
  config     jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ============================================================
-- Conversations
-- ============================================================
create table if not exists conversations (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references tenants(id) on delete cascade,
  agent_id         uuid not null references agents(id) on delete cascade,
  channel          text not null,
  external_user_id text not null,
  metadata         jsonb not null default '{}',
  created_at       timestamptz not null default now()
);

-- ============================================================
-- Messages
-- ============================================================
create table if not exists messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role            text not null,
  content         text not null,
  metadata        jsonb not null default '{}',
  created_at      timestamptz not null default now()
);

create index if not exists messages_conversation_id_idx on messages(conversation_id, created_at);

-- ============================================================
-- Usage Logs
-- ============================================================
create table if not exists usage_logs (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  agent_id        uuid references agents(id) on delete set null,
  conversation_id uuid references conversations(id) on delete set null,
  provider        text not null,
  model           text not null,
  input_tokens    int not null default 0,
  output_tokens   int not null default 0,
  created_at      timestamptz not null default now()
);

create index if not exists usage_logs_tenant_id_idx on usage_logs(tenant_id, created_at);

-- ============================================================
-- Platform Settings
-- ============================================================
create table if not exists platform_settings (
  key        text primary key,
  value      text not null default '',
  updated_at timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table tenants enable row level security;
alter table agents enable row level security;
alter table integrations enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table usage_logs enable row level security;
alter table platform_settings enable row level security;

-- Service role tem acesso total
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'tenants' and policyname = 'service_role_all') then
    create policy "service_role_all" on tenants for all using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'agents' and policyname = 'service_role_all') then
    create policy "service_role_all" on agents for all using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'integrations' and policyname = 'service_role_all') then
    create policy "service_role_all" on integrations for all using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'conversations' and policyname = 'service_role_all') then
    create policy "service_role_all" on conversations for all using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'messages' and policyname = 'service_role_all') then
    create policy "service_role_all" on messages for all using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'usage_logs' and policyname = 'service_role_all') then
    create policy "service_role_all" on usage_logs for all using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'platform_settings' and policyname = 'service_role_all') then
    create policy "service_role_all" on platform_settings for all using (true);
  end if;
end $$;
