-- ============================================================
-- AgentHub — Schema Supabase
-- ============================================================

-- Extensões
create extension if not exists "uuid-ossp";

-- ============================================================
-- Tenants (clientes da plataforma)
-- ============================================================
create table tenants (
  id          uuid primary key default uuid_generate_v4(),
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
create table agents (
  id             uuid primary key default uuid_generate_v4(),
  tenant_id      uuid not null references tenants(id) on delete cascade,
  name           text not null,
  description    text,
  system_prompt  text not null,
  provider       text not null default 'anthropic',  -- anthropic | openai
  model          text not null default 'claude-sonnet-4-6',
  temperature    float not null default 0.7,
  max_tokens     int not null default 1024,
  status         text not null default 'active',     -- active | inactive
  tools_enabled  text[] not null default '{}',
  metadata       jsonb not null default '{}',
  created_at     timestamptz not null default now()
);

-- ============================================================
-- Integrations (Telegram bots, WhatsApp numbers por tenant)
-- ============================================================
create table integrations (
  id         uuid primary key default uuid_generate_v4(),
  tenant_id  uuid not null references tenants(id) on delete cascade,
  agent_id   uuid not null references agents(id) on delete cascade,
  type       text not null,   -- telegram | whatsapp
  config     jsonb not null default '{}',  -- bot_token, phone_number, etc.
  created_at timestamptz not null default now()
);

-- ============================================================
-- Conversations
-- ============================================================
create table conversations (
  id               uuid primary key default uuid_generate_v4(),
  tenant_id        uuid not null references tenants(id) on delete cascade,
  agent_id         uuid not null references agents(id) on delete cascade,
  channel          text not null,   -- telegram | whatsapp | web
  external_user_id text not null,
  metadata         jsonb not null default '{}',
  created_at       timestamptz not null default now()
);

-- ============================================================
-- Messages
-- ============================================================
create table messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role            text not null,    -- user | assistant | system
  content         text not null,
  metadata        jsonb not null default '{}',
  created_at      timestamptz not null default now()
);

create index messages_conversation_id_idx on messages(conversation_id, created_at);

-- ============================================================
-- Usage Logs
-- ============================================================
create table usage_logs (
  id              uuid primary key default uuid_generate_v4(),
  tenant_id       uuid not null references tenants(id) on delete cascade,
  agent_id        uuid references agents(id) on delete set null,
  conversation_id uuid references conversations(id) on delete set null,
  provider        text not null,
  model           text not null,
  input_tokens    int not null default 0,
  output_tokens   int not null default 0,
  created_at      timestamptz not null default now()
);

create index usage_logs_tenant_id_idx on usage_logs(tenant_id, created_at);

-- ============================================================
-- Row Level Security (básico — expanda conforme necessário)
-- ============================================================
alter table tenants enable row level security;
alter table agents enable row level security;
alter table integrations enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table usage_logs enable row level security;

-- Service role tem acesso total (usado pelo backend)
create policy "service_role_all" on tenants for all using (true);
create policy "service_role_all" on agents for all using (true);
create policy "service_role_all" on integrations for all using (true);
create policy "service_role_all" on conversations for all using (true);
create policy "service_role_all" on messages for all using (true);
create policy "service_role_all" on usage_logs for all using (true);

-- Platform settings (key-value store for API keys and configs)
CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON platform_settings
  FOR ALL USING (auth.role() = 'service_role');
