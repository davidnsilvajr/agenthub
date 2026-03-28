import uuid
from typing import Optional
from anthropic import Anthropic
from openai import AsyncOpenAI

from app.core.config import settings
from app.core.supabase import get_supabase
from app.core.platform_settings import get_setting_value
from app.models.schemas import ChatRequest, ChatResponse, AIProvider


async def run_agent(request: ChatRequest) -> ChatResponse:
    sb = get_supabase()

    # 1. Fetch agent config
    agent_row = sb.table("agents").select("*").eq("id", str(request.agent_id)).single().execute()
    agent = agent_row.data
    if not agent:
        raise ValueError("Agent not found")

    # 2. Get or create conversation
    if request.conversation_id:
        conv_id = str(request.conversation_id)
    else:
        conv = sb.table("conversations").insert({
            "tenant_id": agent["tenant_id"],
            "agent_id": str(request.agent_id),
            "channel": request.channel,
            "external_user_id": request.external_user_id,
        }).execute()
        conv_id = conv.data[0]["id"]

    # 3. Load history (last 20 messages)
    history_rows = (
        sb.table("messages")
        .select("role, content")
        .eq("conversation_id", conv_id)
        .order("created_at", desc=False)
        .limit(20)
        .execute()
    )
    history = [{"role": r["role"], "content": r["content"]} for r in history_rows.data]

    # 4. Save user message
    sb.table("messages").insert({
        "conversation_id": conv_id,
        "role": "user",
        "content": request.message,
    }).execute()

    # 5. Build messages list
    messages = history + [{"role": "user", "content": request.message}]

    # 6. Call AI provider
    provider = agent.get("provider", "anthropic")
    model = agent.get("model", "claude-sonnet-4-6")
    system_prompt = agent.get("system_prompt", "Você é um assistente útil.")
    temperature = float(agent.get("temperature", 0.7))
    max_tokens = int(agent.get("max_tokens", 1024))

    if provider == AIProvider.anthropic:
        api_key = get_setting_value("ANTHROPIC_API_KEY") or settings.ANTHROPIC_API_KEY
        client = Anthropic(api_key=api_key)
        response = client.messages.create(
            model=model,
            system=system_prompt,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        reply = response.content[0].text
        usage = {
            "input_tokens": response.usage.input_tokens,
            "output_tokens": response.usage.output_tokens,
        }
    elif provider == AIProvider.gemini:
        import google.generativeai as genai
        api_key = get_setting_value("GEMINI_API_KEY") or settings.GEMINI_API_KEY
        genai.configure(api_key=api_key)
        gemini_model = genai.GenerativeModel(
            model_name=model,
            system_instruction=system_prompt,
        )
        # Convert messages to Gemini format (exclude last user message; sent via send_message)
        gemini_history = []
        for msg in history:
            role = "user" if msg["role"] == "user" else "model"
            gemini_history.append({"role": role, "parts": [msg["content"]]})
        chat = gemini_model.start_chat(history=gemini_history)
        response = chat.send_message(request.message)
        reply = response.text
        usage = {"input_tokens": 0, "output_tokens": 0}  # Gemini doesn't expose token counts in basic API
    else:
        api_key = get_setting_value("OPENAI_API_KEY") or settings.OPENAI_API_KEY
        client = AsyncOpenAI(api_key=api_key)
        response = await client.chat.completions.create(
            model=model,
            messages=[{"role": "system", "content": system_prompt}] + messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        reply = response.choices[0].message.content
        usage = {
            "input_tokens": response.usage.prompt_tokens,
            "output_tokens": response.usage.completion_tokens,
        }

    # 7. Save assistant message
    sb.table("messages").insert({
        "conversation_id": conv_id,
        "role": "assistant",
        "content": reply,
    }).execute()

    # 8. Log usage
    sb.table("usage_logs").insert({
        "tenant_id": agent["tenant_id"],
        "agent_id": str(request.agent_id),
        "conversation_id": conv_id,
        "provider": provider,
        "model": model,
        "input_tokens": usage.get("input_tokens", 0),
        "output_tokens": usage.get("output_tokens", 0),
    }).execute()

    return ChatResponse(
        conversation_id=uuid.UUID(conv_id),
        message=reply,
        usage=usage,
    )
