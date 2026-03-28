const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  // Tenants
  listTenants: () => req<any[]>("/tenants/"),
  getTenant: (id: string) => req<any>(`/tenants/${id}`),
  createTenant: (body: any) => req("/tenants/", { method: "POST", body: JSON.stringify(body) }),
  getTenantUsage: (id: string) => req<any>(`/tenants/${id}/usage`),

  // Agents
  listAgents: (tenantId?: string) => req<any[]>(`/agents/${tenantId ? `?tenant_id=${tenantId}` : ""}`),
  getAgent: (id: string) => req<any>(`/agents/${id}`),
  createAgent: (body: any) => req("/agents/", { method: "POST", body: JSON.stringify(body) }),
  updateAgent: (id: string, body: any) => req(`/agents/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteAgent: (id: string) => req(`/agents/${id}`, { method: "DELETE" }),
  chat: (body: any) => req("/agents/chat", { method: "POST", body: JSON.stringify(body) }),

  // Settings
  listSettings: () => req<any>("/settings/"),
  updateSetting: (key: string, value: string) => req("/settings/", { method: "PUT", body: JSON.stringify({ key, value }) }),

  // Evolution (WhatsApp)
  evolutionCreateInstance: (instanceName: string) =>
    req("/evolution/instance/create", { method: "POST", body: JSON.stringify({ instanceName }) }),
  evolutionGetQR: (instanceName: string) => req<any>(`/evolution/instance/${instanceName}/qr`),
  evolutionGetState: (instanceName: string) => req<any>(`/evolution/instance/${instanceName}/state`),
  evolutionDeleteInstance: (instanceName: string) =>
    req(`/evolution/instance/${instanceName}`, { method: "DELETE" }),
};
