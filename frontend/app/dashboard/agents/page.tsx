"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Bot, Pencil, Trash2, MessageSquare, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

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

const defaultModel: Record<string, string> = {
  openai: "gpt-4o",
  gemini: "gemini-2.0-flash",
  anthropic: "claude-sonnet-4-6",
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    system_prompt: "",
    provider: "anthropic",
    model: "claude-sonnet-4-6",
    temperature: "0.7",
  });

  async function loadAgents() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listAgents();
      setAgents(data);
    } catch (err: any) {
      setError(err.message ?? "Erro ao carregar agentes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAgents();
  }, []);

  function handleChange(key: string, value: string) {
    setForm((f) => {
      const updated = { ...f, [key]: value };
      if (key === "provider") {
        updated.model = defaultModel[value] ?? modelsByProvider[value]?.[0] ?? "";
      }
      return updated;
    });
  }

  async function handleCreate() {
    setCreating(true);
    try {
      await api.createAgent({ ...form, status: "active" });
      setOpen(false);
      setForm({
        name: "",
        description: "",
        system_prompt: "",
        provider: "anthropic",
        model: "claude-sonnet-4-6",
        temperature: "0.7",
      });
      await loadAgents();
    } catch (err: any) {
      alert(err.message ?? "Erro ao criar agente");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este agente?")) return;
    setDeleting(id);
    try {
      await api.deleteAgent(id);
      setAgents((a) => a.filter((ag) => ag.id !== id));
    } catch (err: any) {
      alert(err.message ?? "Erro ao excluir agente");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Agentes</h1>
          <p className="text-gray-400 text-sm mt-1">
            Configure e gerencie seus agentes de IA
          </p>
        </div>

        <Button
          className="bg-violet-600 hover:bg-violet-700 text-white"
          onClick={() => setOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" /> Novo Agente
        </Button>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-lg">
            <DialogHeader>
              <DialogTitle>Criar Agente</DialogTitle>
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

      {error && (
        <div className="rounded-lg bg-red-900/30 border border-red-700/50 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-gray-900 border-gray-800">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-2">
                  <Skeleton className="w-8 h-8 rounded-lg bg-gray-800 flex-shrink-0" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-4 w-32 bg-gray-800" />
                    <Skeleton className="h-3 w-16 bg-gray-800" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-3 w-full bg-gray-800" />
                <div className="flex gap-1">
                  <Skeleton className="h-5 w-20 bg-gray-800 rounded-full" />
                  <Skeleton className="h-5 w-24 bg-gray-800 rounded-full" />
                </div>
                <Skeleton className="h-8 w-full bg-gray-800" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {agents.length === 0 ? (
            <div className="col-span-full border border-dashed border-gray-700 rounded-lg p-10 text-center">
              <Bot className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Nenhum agente criado ainda</p>
              <Button
                size="sm"
                className="mt-3 bg-violet-600 hover:bg-violet-700 text-white"
                onClick={() => setOpen(true)}
              >
                <Plus className="w-3 h-3 mr-1" /> Criar primeiro agente
              </Button>
            </div>
          ) : (
            agents.map((agent) => (
              <Card key={agent.id} className="bg-gray-900 border-gray-800 flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-violet-900/50 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-violet-400" />
                      </div>
                      <div>
                        <CardTitle className="text-white text-sm">{agent.name}</CardTitle>
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
                      className={`text-xs border ${
                        providerColor[agent.provider] ??
                        "bg-gray-800 text-gray-300 border-gray-700"
                      }`}
                    >
                      {agent.provider}
                    </Badge>
                    <Badge className="text-xs bg-gray-800 text-gray-300 border-gray-700">
                      {agent.model}
                    </Badge>
                  </div>
                  {Array.isArray(agent.tools_enabled) && agent.tools_enabled.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {agent.tools_enabled.map((tool: string) => (
                        <span
                          key={tool}
                          className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2 mt-auto pt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-1 text-gray-400 hover:text-white hover:bg-gray-800"
                      disabled
                    >
                      <MessageSquare className="w-3 h-3 mr-1" /> Testar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gray-400 hover:text-white hover:bg-gray-800"
                      disabled
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-400 hover:bg-red-950/30"
                      onClick={() => handleDelete(agent.id)}
                      disabled={deleting === agent.id}
                    >
                      {deleting === agent.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
