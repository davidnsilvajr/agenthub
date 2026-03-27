from fastapi import APIRouter, HTTPException
from app.core.supabase import get_supabase
from app.models.schemas import AgentCreate, AgentUpdate, ChatRequest, ChatResponse
from app.services.agent_service import run_agent

router = APIRouter(prefix="/agents", tags=["agents"])


@router.get("/")
def list_agents(tenant_id: str):
    sb = get_supabase()
    result = sb.table("agents").select("*").eq("tenant_id", tenant_id).execute()
    return result.data


@router.post("/")
def create_agent(body: AgentCreate):
    sb = get_supabase()
    result = sb.table("agents").insert(body.model_dump(mode="json")).execute()
    return result.data[0]


@router.get("/{agent_id}")
def get_agent(agent_id: str):
    sb = get_supabase()
    result = sb.table("agents").select("*").eq("id", agent_id).single().execute()
    if not result.data:
        raise HTTPException(404, "Agent not found")
    return result.data


@router.patch("/{agent_id}")
def update_agent(agent_id: str, body: AgentUpdate):
    sb = get_supabase()
    payload = {k: v for k, v in body.model_dump(mode="json").items() if v is not None}
    result = sb.table("agents").update(payload).eq("id", agent_id).execute()
    return result.data[0]


@router.delete("/{agent_id}")
def delete_agent(agent_id: str):
    sb = get_supabase()
    sb.table("agents").delete().eq("id", agent_id).execute()
    return {"ok": True}


@router.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest):
    try:
        return await run_agent(body)
    except ValueError as e:
        raise HTTPException(404, str(e))
    except Exception as e:
        raise HTTPException(500, str(e))
