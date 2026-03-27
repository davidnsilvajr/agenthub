from pydantic import BaseModel, UUID4
from typing import Optional, Any
from datetime import datetime
from enum import Enum


class AIProvider(str, Enum):
    anthropic = "anthropic"
    openai = "openai"


class AgentStatus(str, Enum):
    active = "active"
    inactive = "inactive"


class MessageRole(str, Enum):
    user = "user"
    assistant = "assistant"
    system = "system"


# --- Tenant ---
class TenantCreate(BaseModel):
    name: str
    slug: str
    plan: str = "free"
    max_agents: int = 3
    max_messages_per_month: int = 1000


class Tenant(TenantCreate):
    id: UUID4
    created_at: datetime


# --- Agent ---
class AgentCreate(BaseModel):
    tenant_id: UUID4
    name: str
    description: Optional[str] = None
    system_prompt: str
    provider: AIProvider = AIProvider.anthropic
    model: str = "claude-sonnet-4-6"
    temperature: float = 0.7
    max_tokens: int = 1024
    status: AgentStatus = AgentStatus.active
    tools_enabled: list[str] = []
    metadata: dict[str, Any] = {}


class AgentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    system_prompt: Optional[str] = None
    provider: Optional[AIProvider] = None
    model: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    status: Optional[AgentStatus] = None
    tools_enabled: Optional[list[str]] = None
    metadata: Optional[dict[str, Any]] = None


class Agent(AgentCreate):
    id: UUID4
    created_at: datetime


# --- Message ---
class MessageCreate(BaseModel):
    conversation_id: UUID4
    role: MessageRole
    content: str
    metadata: dict[str, Any] = {}


class Message(MessageCreate):
    id: UUID4
    created_at: datetime


# --- Conversation ---
class ConversationCreate(BaseModel):
    tenant_id: UUID4
    agent_id: UUID4
    channel: str  # telegram | whatsapp | web
    external_user_id: str
    metadata: dict[str, Any] = {}


class Conversation(ConversationCreate):
    id: UUID4
    created_at: datetime


# --- Chat ---
class ChatRequest(BaseModel):
    agent_id: UUID4
    message: str
    conversation_id: Optional[UUID4] = None
    channel: str = "web"
    external_user_id: str = "anonymous"


class ChatResponse(BaseModel):
    conversation_id: UUID4
    message: str
    usage: dict[str, int] = {}
