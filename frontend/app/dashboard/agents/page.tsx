"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, Bot, Pencil, Trash2, MessageSquare } from "lucide-react";
import { api } from "@/lib/api";

// Mock data for demo
const mockAgents = [
  {
    id: "1",
    name: "Assistente Comercial",
    description: "Qualifica leads e envia orçamentos",
    provider: "anthropic",
    model: "claude-sonnet-4-6",
    status: "active",
    tools_enabled: ["email", "crm"],
  },
  {
    id: "2",
    name: "Suporte Técnico",
    description: "Responde dúvidas sobre produtos e abre chamados",
    provider: "openai",
    model: "gpt-4o",
    status: "active",
    tools_enabled: ["tickets"],
  },
  {
    id: "3",
    name: "Agendamento",
    description: "Agenda reuniões e consultas via WhatsApp",
    provider: "anthropic",
    model: "claude-haiku-4-5-20251001",
    status: "inactive",
    tools_enabled: ["calendar"],
  },
];

const providerColor: Record<string, string> = {
  anthropic: "bg-orange-900/40 text-orange-300 border-orange-700",
  openai: "bg-green-900/40 text-green-300 border-green-700",
};

export default function AgentsPage() {
  const [agents, setAgents] = useState(mockAgents);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    system_prompt: "",
    provider: "anthropic",
    model: "claude-sonnet-4-6",
    temperature: "0.7",
  });

  function handleChange(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleCreate() {
    const newAgent = {
      id: String(Date.now()),
      ...form,
      status: "active",
      tools_enabled: [],
    };
    setAgents((a) => [...a, newAgent]);
    setOpen(false);
    setForm({ name: "", description: "", system_prompt: "", provider: "anthropic", model: "claude-sonnet-4-6", temperature: "0.7" });
  }

  function handleDelete(id: string) {
    setAgents((a) => a.filter((ag) => ag.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Agentes</h1>
          <p className="text-gray-400 text-sm mt-1">Configure e gerencie seus agentes de IA</p>
        </div>

        <Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Novo Agente
        </Button>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger className="hidden" />
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
                  placeholder="Você é um assistente comercial especializado em..."
                  value={form.system_prompt}
                  onChange={(e) => handleChange("system_prompt", e.target.value)}
                  className="bg-gray-800 border-gray-700 min-h-[100px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Provedor</Label>
                  <Select value={form.provider} onValueChange={(v) => handleChange("provider", v ?? "")}>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="anthropic">Anthropic</SelectItem>
                      <SelectItem value="openai">OpenAI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Modelo</Label>
                  <Select value={form.model} onValueChange={(v) => handleChange("model", v ?? "")}>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="claude-sonnet-4-6">Claude Sonnet 4.6</SelectItem>
                      <SelectItem value="claude-opus-4-6">Claude Opus 4.6</SelectItem>
                      <SelectItem value="claude-haiku-4-5-20251001">Claude Haiku 4.5</SelectItem>
                      <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
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
                disabled={!form.name || !form.system_prompt}
              >
                Criar Agente
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <Card key={agent.id} className="bg-gray-900 border-gray-800 flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-violet-900/50 flex items-center justify-center">
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
              <p className="text-xs text-gray-400">{agent.description}</p>
              <div className="flex flex-wrap gap-1">
                <Badge className={`text-xs border ${providerColor[agent.provider]}`}>
                  {agent.provider}
                </Badge>
                <Badge className="text-xs bg-gray-800 text-gray-300 border-gray-700">
                  {agent.model}
                </Badge>
              </div>
              {agent.tools_enabled.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {agent.tools_enabled.map((tool) => (
                    <span key={tool} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                      {tool}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-auto pt-2">
                <Button size="sm" variant="ghost" className="flex-1 text-gray-400 hover:text-white hover:bg-gray-800">
                  <MessageSquare className="w-3 h-3 mr-1" /> Testar
                </Button>
                <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white hover:bg-gray-800">
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-500 hover:text-red-400 hover:bg-red-950/30"
                  onClick={() => handleDelete(agent.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
