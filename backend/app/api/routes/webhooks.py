import hmac, hashlib
from fastapi import APIRouter, Request, HTTPException, Header
from app.core.config import settings
from app.core.supabase import get_supabase
from app.models.schemas import ChatRequest
from app.services.agent_service import run_agent
import httpx

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/telegram/{bot_token}")
async def telegram_webhook(bot_token: str, request: Request):
    """Receive updates from Telegram bot."""
    body = await request.json()
    message = body.get("message") or body.get("edited_message")
    if not message:
        return {"ok": True}

    chat_id = message["chat"]["id"]
    text = message.get("text", "")
    if not text:
        return {"ok": True}

    # Find agent linked to this bot token
    sb = get_supabase()
    integration = (
        sb.table("integrations")
        .select("agent_id, tenant_id")
        .eq("type", "telegram")
        .eq("config->>bot_token", bot_token)
        .single()
        .execute()
    )
    if not integration.data:
        return {"ok": True}

    agent_id = integration.data["agent_id"]
    chat_request = ChatRequest(
        agent_id=agent_id,
        message=text,
        channel="telegram",
        external_user_id=str(chat_id),
    )
    response = await run_agent(chat_request)

    # Send reply back to Telegram
    async with httpx.AsyncClient() as client:
        await client.post(
            f"https://api.telegram.org/bot{bot_token}/sendMessage",
            json={"chat_id": chat_id, "text": response.message},
        )

    return {"ok": True}


@router.post("/whatsapp")
async def whatsapp_webhook(request: Request):
    """Receive messages from WhatsApp via Twilio."""
    form = await request.form()
    from_number = form.get("From", "").replace("whatsapp:", "")
    body_text = form.get("Body", "")
    to_number = form.get("To", "").replace("whatsapp:", "")

    if not body_text:
        return {"ok": True}

    sb = get_supabase()
    integration = (
        sb.table("integrations")
        .select("agent_id, tenant_id")
        .eq("type", "whatsapp")
        .eq("config->>phone_number", to_number)
        .single()
        .execute()
    )
    if not integration.data:
        return {"ok": True}

    agent_id = integration.data["agent_id"]
    chat_request = ChatRequest(
        agent_id=agent_id,
        message=body_text,
        channel="whatsapp",
        external_user_id=from_number,
    )
    response = await run_agent(chat_request)

    # Reply via Twilio TwiML
    twiml = f'<?xml version="1.0" encoding="UTF-8"?><Response><Message>{response.message}</Message></Response>'
    from fastapi.responses import Response as FastAPIResponse
    return FastAPIResponse(content=twiml, media_type="application/xml")
