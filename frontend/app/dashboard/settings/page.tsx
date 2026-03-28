"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, Loader2, Save } from "lucide-react";
import { api } from "@/lib/api";

interface SettingState {
  value: string;
  configured: boolean;
}

interface SettingsMap {
  [key: string]: SettingState;
}

interface SectionSaveState {
  loading: boolean;
  success: boolean;
  error: string | null;
}

function ConfiguredBadge({ configured }: { configured: boolean }) {
  if (configured) {
    return (
      <Badge className="bg-emerald-900/40 text-emerald-300 border border-emerald-700 gap-1 text-xs">
        <CheckCircle2 className="w-3 h-3" /> Configurado
      </Badge>
    );
  }
  return (
    <Badge className="bg-gray-800 text-gray-400 border border-gray-700 gap-1 text-xs">
      <XCircle className="w-3 h-3" /> Não configurado
    </Badge>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsMap>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [sectionState, setSectionState] = useState<Record<string, SectionSaveState>>({});

  useEffect(() => {
    api
      .listSettings()
      .then((data: SettingsMap) => {
        setSettings(data);
        // Pre-fill values with empty strings (never expose stored values)
        const initial: Record<string, string> = {};
        Object.keys(data).forEach((k) => {
          initial[k] = "";
        });
        setValues(initial);
      })
      .catch(() => {
        /* silently fail — page still usable */
      })
      .finally(() => setLoading(false));
  }, []);

  function setValue(key: string, val: string) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  async function saveSection(sectionId: string, keys: string[]) {
    setSectionState((s) => ({
      ...s,
      [sectionId]: { loading: true, success: false, error: null },
    }));

    try {
      for (const key of keys) {
        if (values[key]?.trim()) {
          await api.updateSetting(key, values[key].trim());
        }
      }
      // Refresh settings to update configured status
      const updated = await api.listSettings();
      setSettings(updated);
      setSectionState((s) => ({
        ...s,
        [sectionId]: { loading: false, success: true, error: null },
      }));
      // Clear success after 3s
      setTimeout(() => {
        setSectionState((s) => ({
          ...s,
          [sectionId]: { ...s[sectionId], success: false },
        }));
      }, 3000);
    } catch (err: any) {
      setSectionState((s) => ({
        ...s,
        [sectionId]: { loading: false, success: false, error: err.message ?? "Erro ao salvar" },
      }));
    }
  }

  function getSectionState(id: string): SectionSaveState {
    return sectionState[id] ?? { loading: false, success: false, error: null };
  }

  function SaveButton({ sectionId, keys }: { sectionId: string; keys: string[] }) {
    const state = getSectionState(sectionId);
    return (
      <div className="space-y-2">
        {state.error && (
          <p className="text-xs text-red-400">{state.error}</p>
        )}
        {state.success && (
          <p className="text-xs text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Salvo com sucesso!
          </p>
        )}
        <Button
          onClick={() => saveSection(sectionId, keys)}
          disabled={state.loading || keys.every((k) => !values[k]?.trim())}
          className="bg-violet-600 hover:bg-violet-700 text-white"
          size="sm"
        >
          {state.loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" /> Salvar
            </>
          )}
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Configurações</h1>
          <p className="text-gray-400 text-sm mt-1">Gerencie as chaves de API e integrações</p>
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-gray-900 border-gray-800">
            <CardHeader>
              <Skeleton className="h-5 w-40 bg-gray-800" />
              <Skeleton className="h-4 w-64 bg-gray-800" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-9 w-full bg-gray-800" />
              <Skeleton className="h-8 w-24 bg-gray-800" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-gray-400 text-sm mt-1">Gerencie as chaves de API e integrações da plataforma</p>
      </div>

      {/* OpenAI */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-base">OpenAI</CardTitle>
              <CardDescription className="text-gray-400 text-sm mt-1">
                Para modelos GPT-4o e GPT-4o-mini
              </CardDescription>
            </div>
            <ConfiguredBadge configured={settings["OPENAI_API_KEY"]?.configured ?? false} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-gray-300 text-sm">OpenAI API Key</Label>
            <Input
              type="password"
              placeholder={settings["OPENAI_API_KEY"]?.configured ? "••••••••••••••••••••" : "sk-..."}
              value={values["OPENAI_API_KEY"] ?? ""}
              onChange={(e) => setValue("OPENAI_API_KEY", e.target.value)}
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600"
            />
          </div>
          <SaveButton sectionId="openai" keys={["OPENAI_API_KEY"]} />
        </CardContent>
      </Card>

      {/* Google Gemini */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-base">Google Gemini</CardTitle>
              <CardDescription className="text-gray-400 text-sm mt-1">
                Para modelos Gemini 2.0 Flash e Gemini 1.5 Pro
              </CardDescription>
            </div>
            <ConfiguredBadge configured={settings["GEMINI_API_KEY"]?.configured ?? false} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-gray-300 text-sm">Gemini API Key</Label>
            <Input
              type="password"
              placeholder={settings["GEMINI_API_KEY"]?.configured ? "••••••••••••••••••••" : "AIza..."}
              value={values["GEMINI_API_KEY"] ?? ""}
              onChange={(e) => setValue("GEMINI_API_KEY", e.target.value)}
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600"
            />
          </div>
          <SaveButton sectionId="gemini" keys={["GEMINI_API_KEY"]} />
        </CardContent>
      </Card>

      {/* Anthropic */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-base">Anthropic</CardTitle>
              <CardDescription className="text-gray-400 text-sm mt-1">
                Para modelos Claude
              </CardDescription>
            </div>
            <ConfiguredBadge configured={settings["ANTHROPIC_API_KEY"]?.configured ?? false} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-gray-300 text-sm">Anthropic API Key</Label>
            <Input
              type="password"
              placeholder={settings["ANTHROPIC_API_KEY"]?.configured ? "••••••••••••••••••••" : "sk-ant-..."}
              value={values["ANTHROPIC_API_KEY"] ?? ""}
              onChange={(e) => setValue("ANTHROPIC_API_KEY", e.target.value)}
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600"
            />
          </div>
          <SaveButton sectionId="anthropic" keys={["ANTHROPIC_API_KEY"]} />
        </CardContent>
      </Card>

      {/* Evolution API */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-base">Evolution API</CardTitle>
              <CardDescription className="text-gray-400 text-sm mt-1">
                Integração WhatsApp via Evolution API
              </CardDescription>
            </div>
            <ConfiguredBadge
              configured={
                (settings["EVOLUTION_API_URL"]?.configured ?? false) &&
                (settings["EVOLUTION_API_KEY"]?.configured ?? false)
              }
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-gray-300 text-sm">URL da Evolution API</Label>
            <Input
              type="text"
              placeholder={
                settings["EVOLUTION_API_URL"]?.configured
                  ? "••••••••••••••••••••"
                  : "https://evolution.suaempresa.com"
              }
              value={values["EVOLUTION_API_URL"] ?? ""}
              onChange={(e) => setValue("EVOLUTION_API_URL", e.target.value)}
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600"
            />
            <p className="text-xs text-gray-500">
              URL base da sua instância Evolution API (ex: https://evolution.suaempresa.com)
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-gray-300 text-sm">Evolution API Key</Label>
            <Input
              type="password"
              placeholder={settings["EVOLUTION_API_KEY"]?.configured ? "••••••••••••••••••••" : "sua-api-key"}
              value={values["EVOLUTION_API_KEY"] ?? ""}
              onChange={(e) => setValue("EVOLUTION_API_KEY", e.target.value)}
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600"
            />
            <p className="text-xs text-gray-500">API Key da Evolution API</p>
          </div>
          <SaveButton sectionId="evolution" keys={["EVOLUTION_API_URL", "EVOLUTION_API_KEY"]} />
        </CardContent>
      </Card>
    </div>
  );
}
