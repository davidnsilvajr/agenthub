from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.core.supabase import get_supabase
from app.core.platform_settings import get_setting_value  # noqa: F401 — re-exported for convenience

router = APIRouter(prefix="/settings", tags=["settings"])

ALLOWED_KEYS = {
    "OPENAI_API_KEY",
    "GEMINI_API_KEY",
    "ANTHROPIC_API_KEY",
    "EVOLUTION_API_URL",
    "EVOLUTION_API_KEY",
}


class SettingUpdate(BaseModel):
    key: str
    value: str


@router.get("/")
def list_settings():
    sb = get_supabase()
    rows = sb.table("platform_settings").select("key, updated_at").execute()
    # Return keys without values for security listing
    result = {}
    for row in rows.data:
        result[row["key"]] = {"configured": True, "updated_at": row["updated_at"]}
    # Fill in unconfigured allowed keys
    for k in ALLOWED_KEYS:
        if k not in result:
            result[k] = {"configured": False, "updated_at": None}
    return result


@router.get("/{key}")
def get_setting(key: str):
    if key not in ALLOWED_KEYS:
        raise HTTPException(status_code=400, detail="Key not allowed")
    sb = get_supabase()
    row = sb.table("platform_settings").select("*").eq("key", key).execute()
    if row.data:
        # Mask value
        val = row.data[0]["value"]
        masked = val[:4] + "..." + val[-4:] if len(val) > 8 else "****"
        return {"key": key, "masked_value": masked, "configured": True}
    return {"key": key, "configured": False}


@router.put("/")
def update_setting(body: SettingUpdate):
    if body.key not in ALLOWED_KEYS:
        raise HTTPException(status_code=400, detail="Key not allowed")
    sb = get_supabase()
    sb.table("platform_settings").upsert({
        "key": body.key,
        "value": body.value,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).execute()
    return {"success": True, "key": body.key}
