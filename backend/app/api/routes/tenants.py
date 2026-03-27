from fastapi import APIRouter, HTTPException
from app.core.supabase import get_supabase
from app.models.schemas import TenantCreate

router = APIRouter(prefix="/tenants", tags=["tenants"])


@router.get("/")
def list_tenants():
    sb = get_supabase()
    return sb.table("tenants").select("*").execute().data


@router.post("/")
def create_tenant(body: TenantCreate):
    sb = get_supabase()
    result = sb.table("tenants").insert(body.model_dump()).execute()
    return result.data[0]


@router.get("/{tenant_id}")
def get_tenant(tenant_id: str):
    sb = get_supabase()
    result = sb.table("tenants").select("*").eq("id", tenant_id).single().execute()
    if not result.data:
        raise HTTPException(404, "Tenant not found")
    return result.data


@router.get("/{tenant_id}/usage")
def get_usage(tenant_id: str):
    sb = get_supabase()
    result = (
        sb.table("usage_logs")
        .select("input_tokens, output_tokens, created_at, model, provider")
        .eq("tenant_id", tenant_id)
        .order("created_at", desc=True)
        .limit(100)
        .execute()
    )
    data = result.data
    total_input = sum(r["input_tokens"] for r in data)
    total_output = sum(r["output_tokens"] for r in data)
    return {
        "total_input_tokens": total_input,
        "total_output_tokens": total_output,
        "total_tokens": total_input + total_output,
        "logs": data,
    }
