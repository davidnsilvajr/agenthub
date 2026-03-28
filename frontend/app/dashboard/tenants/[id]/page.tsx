"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Bot,
  MessageSquare,
  Plus,
  Settings2,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";

const planColor: Record<string, string> = {
  free: "bg-gray-800 text-gray-300 border-gray-700",
  starter: "bg-blue-900/40 text-blue-300 border-blue-700",
  pro: "bg-violet-900/40 text-violet-300 border-violet-700",
  enterprise: "bg-amber-900/40 text-amber-300 border-amber-700",
};

const providerColor: Record<string, string> = {
  anthropic: "bg-orange-900/40 text-orange-300 border-orange-700",
  openai: "bg-green-900/40 text-green-300 border-green-700",
  gemini: "bg-blue-900/40 text-blue-300 border-blue-700",
};

const modelsByProvider: Record<string, string[]> = {
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
  gemini: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
  anthropic: ["claude-sonnet-4-6", "claude-haiku-4-5-20251001", "claude-opus-4-6"],
};

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [tenant, setTenant] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    system_prompt: "",
    provider: "anthropic",
    model: "claude-sonnet-4-6",
    temperature: "0.7",
  });

  useEffect(() => {
    async function load() {
      try {
        const [tenantData, agentsData] = await Promise.all([
          api.getTenant(id),
          api.listAgents(id),
        ]);
        setTenant(tenantData);
        setAgents(agentsData);
      } catch (err: any) {
        setError(err.message ?? "Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function handleChange(key: string, val: string) {
    setForm((f) => {
      const updated = { ...f, [key]: val };
      if (key === "provider") {
        updated.model = modelsByProvider[val]?.[0] ?? "";
      }
      return updated;
    });
  }

  async function handleCreate() {
    setCreating(true);
    try {
      const newAgent = await api.createAgent({ ...form, tenant_id: id, status: "active" });
      setAgents((a) => [...a, newAgent]);
      setDialogOpen(false);
      setForm({
        name: "",
        description: "",
        system_prompt: "",
        provider: "anthropic",
        model: "claude-sonnet-4-6",
        temperature: "0.7",
      });
    } catch (err: any) {
      alert(err.message ?? "Erro ao criar agente");
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-24 bg-gray-800" />
          <Skeleton className="h-7 w-48 bg-gray-800" />
        </div>
        <div className="grid grid-cols-2 gap-4 max-w-xs">
          <Skeleton className="h-20 bg-gray-800 rounded-lg" />
          <Skeleton className="h-20 bg-gray-800 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 bg-gray-800 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          className="text-gray-400 hover:text-white"
          onClick={() => router.push("/dashboard/tenants")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white hover:bg-gray-800"
            onClick={() => router.push("/dashboard/tenants")}
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">{tenant?.name}</h1>
              <Badge className={`text-xs border ${planColor[tenant?.plan] ?? planColor.free}`}>
                {tenant?.plan ?? "free"}
              </Badge>
            </div>
            <p className="text-gray-500 text-sm font-mono mt-0.5">/{tenant?.slug}</p>
          </div>
        </div>
        <Button
          className="bg-violet-600 hover:bg-violet-700 text-white"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" /> Novo Agente
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 max-w-sm">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-gray-400">
              <Bot className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wide">Agentes</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">{agents.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-gray-400">
              <MessageSquare className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wide">Mensagens</span>
            </div>
            <p className="text-2xl font-bold text-white mt-1">—</p>
          </CardContent>
        </Card>
      </div>

      {/* Agents */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Agentes</h2>
        {agents.length === 0 ? (
          <div className="border border-dashed border-gray-700 rounded-lg p-8 text-center">
            <Bot className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Nenhum agente criado ainda</p>
            <Button
              size="sm"
              className="mt-3 bg-violet-600 hover:bg-violet-700 text-white"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="w-3 h-3 mr-1" /> Criar primeiro agente
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <Card key={agent.id} className="bg-gray-900 border-gray-800 flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-violet-900/50 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-violet-400" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-white text-sm truncate">{agent.name}</CardTitle>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded border ${
                            agent.status === "active"
                              ? "bg-emerald-900/40 text-emerald-300 border-emerald-700"
                              : "bg-gray-800 text-gray-400 border-gray-700"
                          }`}
                        >
                          {agent.status === "active" ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-3">
                  {agent.description && (
                    <p className="text-xs text-gray-400 line-clamp-2">{agent.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1">
                    <Badge
                      className={`text-xs border ${providerColor[agent.provider] ?? "bg-gray-800 text-gray-300 border-gray-700"}`}
                    >
                      {agent.provider}
                    </Badge>
                    <Badge className="text-xs bg-gray-800 text-gray-300 border-gray-700">
                      {agent.model}
                    </Badge>
                  </div>
                  <div className="flex gap-2 mt-auto pt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-1 text-xs text-gray-400 hover:text-white hover:bg-gray-800"
                      onClick={() =>
                        router.push(`/dashboard/tenants/${id}/agents/${agent.id}`)
                      }
                    >
                      <Settings2 className="w-3 h-3 mr-1" /> Configurar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-1 text-xs text-gray-400 hover:text-white hover:bg-gray-800"
                      disabled
                    >
                      <MessageSquare className="w-3 h-3 mr-1" /> Chat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Agent Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Agente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label>Nome</Label>
              <Input
                placeholder="Ex: Assistente Comercial"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <div className="space-y-1">
              <Label>Descrição</Label>
              <Input
                placeholder="Breve descrição do agente"
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <div className="space-y-1">
              <Label>System Prompt</Label>
              <Textarea
                placeholder="Você é um assistente especializado em..."
                value={form.system_prompt}
                onChange={(e) => handleChange("system_prompt", e.target.value)}
                className="bg-gray-800 border-gray-700 min-h-[100px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Provedor</Label>
                <Select
                  value={form.provider}
                  onValueChange={(v) => handleChange("provider", v ?? "anthropic")}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="gemini">Gemini</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Modelo</Label>
                <Select
                  value={form.model}
                  onValueChange={(v) => handleChange("model", v ?? "")}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {(modelsByProvider[form.provider] ?? []).map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Temperatura: {form.temperature}</Label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={form.temperature}
                onChange={(e) => handleChange("temperature", e.target.value)}
                className="w-full accent-violet-500"
              />
            </div>
            <Button
              onClick={handleCreate}
              className="w-full bg-violet-600 hover:bg-violet-700"
              disabled={creating || !form.name || !form.system_prompt}
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Criando...
                </>
              ) : (
                "Criar Agente"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
