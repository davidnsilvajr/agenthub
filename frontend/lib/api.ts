const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  return res.json();
}

export const api = {
  // Tenants
  listTenants: () => request<any[]>("/tenants/"),
  createTenant: (body: any) =>
    request("/tenants/", { method: "POST", body: JSON.stringify(body) }),
  getTenantUsage: (id: string) => request<any>(`/tenants/${id}/usage`),

  // Agents
  listAgents: (tenantId: string) =>
    request<any[]>(`/agents/?tenant_id=${tenantId}`),
  createAgent: (body: any) =>
    request("/agents/", { method: "POST", body: JSON.stringify(body) }),
  updateAgent: (id: string, body: any) =>
    request(`/agents/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteAgent: (id: string) =>
    request(`/agents/${id}`, { method: "DELETE" }),

  // Chat
  chat: (body: any) =>
    request<any>("/agents/chat", { method: "POST", body: JSON.stringify(body) }),
};
