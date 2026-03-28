from app.core.supabase import get_supabase


def get_setting_value(key: str) -> str:
    """Get setting value from the platform_settings table. Returns empty string on any error."""
    try:
        sb = get_supabase()
        row = sb.table("platform_settings").select("value").eq("key", key).execute()
        if row.data:
            return row.data[0]["value"]
    except Exception:
        pass
    return ""
