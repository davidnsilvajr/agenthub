# AgentHub

Plataforma multi-tenant de agentes de IA com dashboard admin, suporte a Telegram/WhatsApp, Claude e GPT-4.

## Estrutura

```
agenthub/
├── frontend/          # Next.js 14 + Tailwind + shadcn/ui
├── backend/           # FastAPI + Python
│   └── app/
│       ├── api/routes/   # agents, tenants, webhooks
│       ├── core/         # config, supabase client
│       ├── models/       # schemas Pydantic
│       └── services/     # agent_service (lógica de IA)
└── supabase/
    └── schema.sql     # Tabelas e RLS
```

## Setup rápido

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # preencha as variáveis
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local  # preencha as variáveis
npm run dev
```

### Supabase
1. Crie um projeto em supabase.com
2. Rode `supabase/schema.sql` no SQL Editor
3. Copie URL + keys para os `.env`

## Rotas API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /api/v1/tenants/ | Lista clientes |
| POST | /api/v1/tenants/ | Cria cliente |
| GET | /api/v1/agents/?tenant_id= | Lista agentes |
| POST | /api/v1/agents/ | Cria agente |
| PATCH | /api/v1/agents/{id} | Atualiza agente |
| POST | /api/v1/agents/chat | Envia mensagem |
| POST | /api/v1/webhooks/telegram/{token} | Webhook Telegram |
| POST | /api/v1/webhooks/whatsapp | Webhook WhatsApp |
| GET | /api/v1/tenants/{id}/usage | Uso de tokens |
