"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Save,
  Loader2,
  CheckCircle2,
  Smartphone,
  QrCode,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";

const modelsByProvider: Record<string, { value: string; label: string }[]> = {
  openai: [
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  ],
  gemini: [
    { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro" },
    { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
  ],
  anthropic: [
    { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
    { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
    { value: "claude-opus-4-6", label: "Claude Opus 4.6" },
  ],
};

const stateColor: Record<string, string> = {
  open: "bg-emerald-900/40 text-emerald-300 border-emerald-700",
  connecting: "bg-yellow-900/40 text-yellow-300 border-yellow-700",
  close: "bg-gray-800 text-gray-400 border-gray-700",
};

const stateLabel: Record<string, string> = {
  open: "Conectado",
  connecting: "Conectando...",
  close: "Desconectado",
};

export default function AgentConfigPage() {
  const { id: tenantId, agentId } = useParams<{ id: string; agentId: string }>();
  const router = useRouter();

  // Agent form state
  const [loadingAgent, setLoadingAgent] = useState(true);
  const [form, setForm] = useState<any>({
    name: "",
    description: "",
    system_prompt: "",
    provider: "anthropic",
    model: "claude-sonnet-4-6",
    temperature: 0.7,
    max_tokens: 1000,
    status: "active",
  });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Evolution (WhatsApp) state
  const [instanceName, setInstanceName] = useState("");
  const [instanceCreated, setInstanceCreated] = useState(false);
  const [creatingInstance, setCreatingInstance] = useState(false);
  const [instanceError, setInstanceError] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<string>("close");
  const [deletingInstance, setDeletingInstance] = useState(false);

  // QR Code dialog
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load agent on mount
  useEffect(() => {
    api
      .getAgent(agentId)
      .then((data) => {
        setForm({
          name: data.name ?? "",
          description: data.description ?? "",
          system_prompt: data.system_prompt ?? "",
          provider: data.provider ?? "anthropic",
          model: data.model ?? "claude-sonnet-4-6",
          temperature: data.temperature ?? 0.7,
          max_tokens: data.max_tokens ?? 1000,
          status: data.status ?? "active",
        });
        if (data.whatsapp_instance) {
          setInstanceName(data.whatsapp_instance);
          setInstanceCreated(true);
        } else {
          setInstanceName(agentId);
        }
      })
      .catch(() => {
        setInstanceName(agentId);
      })
      .finally(() => setLoadingAgent(false));
  }, [agentId]);

  // Poll state when connecting
  useEffect(() => {
    if (instanceCreated && connectionState === "connecting") {
      pollRef.current = setInterval(async () => {
        try {
          const data = await api.evolutionGetState(instanceName);
          const state = data?.state ?? data?.instance?.state ?? "close";
          setConnectionState(state);
          if (state === "open") {
            clearInterval(pollRef.current!);
          }
        } catch {
          // ignore polling errors
        }
      }, 5000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [instanceCreated, connectionState, instanceName]);

  function handleFormChange(key: string, value: string | number) {
    setForm((f: any) => {
      const updated = { ...f, [key]: value };
      if (key === "provider") {
        updated.model = modelsByProvider[value as string]?.[0]?.value ?? "";
      }
      return updated;
    });
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await api.updateAgent(agentId, form);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message ?? "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateInstance() {
    setCreatingInstance(true);
    setInstanceError(null);
    try {
      await api.evolutionCreateInstance(instanceName);
      setInstanceCreated(true);
      setConnectionState("close");
    } catch (err: any) {
      setInstanceError(err.message ?? "Erro ao criar instância");
    } finally {
      setCreatingInstance(false);
    }
  }

  async function handleShowQR() {
    setQrLoading(true);
    setQrError(null);
    setQrBase64(null);
    setQrDialogOpen(true);
    setConnectionState("connecting");
    try {
      const data = await api.evolutionGetQR(instanceName);
      const base64 = data?.qrcode?.base64 ?? data?.base64 ?? null;
      setQrBase64(base64);
    } catch (err: any) {
      setQrError(err.message ?? "Erro ao obter QR Code");
    } finally {
      setQrLoading(false);
    }
  }

  async function handleDeleteInstance() {
    if (!confirm(`Desconectar instância "${instanceName}"?`)) return;
    setDeletingInstance(true);
    try {
      await api.evolutionDeleteInstance(instanceName);
      setInstanceCreated(false);
      setConnectionState("close");
      setQrBase64(null);
      setInstanceName(agentId);
    } catch (err: any) {
      alert(err.message ?? "Erro ao deletar instância");
    } finally {
      setDeletingInstance(false);
    }
  }

  async function refreshState() {
    try {
      const data = await api.evolutionGetState(instanceName);
      const state = data?.state ?? data?.instance?.state ?? "close";
      setConnectionState(state);
    } catch {
      // ignore
    }
  }

  if (loadingAgent) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-40 bg-gray-800" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[600px] bg-gray-800 rounded-lg" />
          <Skeleton className="h-[400px] bg-gray-800 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white hover:bg-gray-800"
          onClick={() => router.push(`/dashboard/tenants/${tenantId}`)}
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
        </Button>
        <h1 className="text-2xl font-bold text-white">{form.name || "Agente"}</h1>
        <Badge
          className={`text-xs border ${
            form.status === "active"
              ? "bg-emerald-900/40 text-emerald-300 border-emerald-700"
              : "bg-gray-800 text-gray-400 border-gray-700"
          }`}
        >
          {form.status === "active" ? "Ativo" : "Inativo"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: AI Configuration */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-white">Configurações do Agente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-gray-300">Nome</Label>
              <Input
                value={form.name}
                onChange={(e) => handleFormChange("name", e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Nome do agente"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-gray-300">Descrição</Label>
              <Input
                value={form.description}
                onChange={(e) => handleFormChange("description", e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Breve descrição do agente"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-gray-300">System Prompt</Label>
              <Textarea
                value={form.system_prompt}
                onChange={(e) => handleFormChange("system_prompt", e.target.value)}
                className="bg-gray-800 border-gray-700 text-white font-mono text-sm min-h-[160px] resize-y"
                placeholder="Você é um assistente especializado em..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-gray-300">Provedor</Label>
                <Select
                  value={form.provider}
                  onValueChange={(v) => handleFormChange("provider", v ?? "anthropic")}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="gemini">Gemini</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-gray-300">Modelo</Label>
                <Select
                  value={form.model}
                  onValueChange={(v) => handleFormChange("model", v ?? "")}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    {(modelsByProvider[form.provider] ?? []).map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">
                Temperatura:{" "}
                <span className="text-white font-mono">
                  {Number(form.temperature).toFixed(1)}
                </span>
              </Label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={form.temperature}
                onChange={(e) =>
                  handleFormChange("temperature", parseFloat(e.target.value))
                }
                className="w-full accent-violet-500"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Preciso (0.0)</span>
                <span>Criativo (1.0)</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-gray-300">Max Tokens</Label>
              <Input
                type="number"
                value={form.max_tokens}
                onChange={(e) =>
                  handleFormChange("max_tokens", parseInt(e.target.value) || 1000)
                }
                className="bg-gray-800 border-gray-700 text-white"
                min={100}
                max={8000}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-gray-300">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => handleFormChange("status", v ?? "active")}
              >
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white">
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {saveError && (
              <p className="text-sm text-red-400">{saveError}</p>
            )}
            {saveSuccess && (
              <p className="text-sm text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Salvo com sucesso!
              </p>
            )}

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Salvar Configurações
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* RIGHT: WhatsApp / Evolution */}
        <div className="space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <CardTitle className="text-white">WhatsApp via Evolution API</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-gray-300">Nome da Instância</Label>
                <Input
                  value={instanceName}
                  onChange={(e) => setInstanceName(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white font-mono text-sm"
                  placeholder="nome-da-instancia"
                  disabled={instanceCreated}
                />
                <p className="text-xs text-gray-500">
                  Identificador único para esta instância WhatsApp
                </p>
              </div>

              {!instanceCreated ? (
                <>
                  {instanceError && (
                    <p className="text-sm text-red-400">{instanceError}</p>
                  )}
                  <Button
                    onClick={handleCreateInstance}
                    disabled={creatingInstance || !instanceName.trim()}
                    className="w-full bg-emerald-700 hover:bg-emerald-600 text-white"
                  >
                    {creatingInstance ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Criando...
                      </>
                    ) : (
                      "Criar Instância"
                    )}
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  {/* Connection state */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-300">Status:</span>
                      <Badge
                        className={`text-xs border ${stateColor[connectionState] ?? stateColor.close}`}
                      >
                        {stateLabel[connectionState] ?? connectionState}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-gray-400 hover:text-white hover:bg-gray-800 h-7 px-2"
                      onClick={refreshState}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {connectionState !== "open" && (
                    <Button
                      onClick={handleShowQR}
                      className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                    >
                      <QrCode className="w-4 h-4 mr-2" /> Conectar (QR Code)
                    </Button>
                  )}

                  <Button
                    onClick={handleDeleteInstance}
                    disabled={deletingInstance}
                    variant="ghost"
                    className="w-full text-red-500 hover:text-red-400 hover:bg-red-950/30 border border-red-800/50"
                  >
                    {deletingInstance ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Desconectando...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" /> Desconectar
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-violet-400" />
              Conectar WhatsApp
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            <p className="text-sm text-gray-400 text-center">
              Abra o WhatsApp no seu celular e escaneie o QR Code abaixo.
            </p>
            {qrLoading && (
              <div className="flex flex-col items-center gap-2 py-8">
                <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
                <span className="text-gray-400 text-sm">Gerando QR Code...</span>
              </div>
            )}
            {qrError && (
              <p className="text-red-400 text-sm text-center">{qrError}</p>
            )}
            {qrBase64 && !qrLoading && (
              <div className="bg-white p-3 rounded-lg">
                <img
                  src={`data:image/png;base64,${qrBase64}`}
                  alt="QR Code WhatsApp"
                  className="w-56 h-56"
                />
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Badge
                className={`text-xs border ${stateColor[connectionState] ?? stateColor.close}`}
              >
                {stateLabel[connectionState] ?? connectionState}
              </Badge>
              {connectionState === "connecting" && (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Aguardando scan...
                </span>
              )}
              {connectionState === "open" && (
                <span className="text-emerald-400">Conectado! Pode fechar esta janela.</span>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
