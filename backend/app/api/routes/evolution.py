import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.core.platform_settings import get_setting_value
from app.core.config import settings

router = APIRouter(prefix="/evolution", tags=["evolution"])


def get_evolution_config():
    url = get_setting_value("EVOLUTION_API_URL") or settings.EVOLUTION_API_URL
    key = get_setting_value("EVOLUTION_API_KEY") or settings.EVOLUTION_API_KEY
    if not url:
        raise HTTPException(status_code=400, detail="Evolution API URL not configured. Go to Settings.")
    return url.rstrip("/"), key


class CreateInstanceBody(BaseModel):
    instanceName: str
    token: str = ""


@router.post("/instance/create")
async def create_instance(body: CreateInstanceBody):
    base_url, api_key = get_evolution_config()
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{base_url}/instance/create",
            json={
                "instanceName": body.instanceName,
                "token": body.token or body.instanceName,
                "qrcode": True,
                "integration": "WHATSAPP-BAILEYS",
            },
            headers={"apikey": api_key},
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()


@router.get("/instance/{instance_name}/qr")
async def get_qr(instance_name: str):
    base_url, api_key = get_evolution_config()
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{base_url}/instance/connect/{instance_name}",
            headers={"apikey": api_key},
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()


@router.get("/instance/{instance_name}/state")
async def get_state(instance_name: str):
    base_url, api_key = get_evolution_config()
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{base_url}/instance/connectionState/{instance_name}",
            headers={"apikey": api_key},
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json()


@router.delete("/instance/{instance_name}")
async def delete_instance(instance_name: str):
    base_url, api_key = get_evolution_config()
    async with httpx.AsyncClient() as client:
        resp = await client.delete(
            f"{base_url}/instance/delete/{instance_name}",
            headers={"apikey": api_key},
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json()
