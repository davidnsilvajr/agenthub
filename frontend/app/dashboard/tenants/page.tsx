"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Users, Bot, MessageSquare, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

const planColor: Record<string, string> = {
  free: "bg-gray-800 text-gray-300 border-gray-700",
  starter: "bg-blue-900/40 text-blue-300 border-blue-700",
  pro: "bg-violet-900/40 text-violet-300 border-violet-700",
  enterprise: "bg-amber-900/40 text-amber-300 border-amber-700",
};

export default function TenantsPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", plan: "starter" });

  async function loadTenants() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listTenants();
      setTenants(data);
    } catch (err: any) {
      setError(err.message ?? "Erro ao carregar clientes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTenants();
  }, []);

  async function handleCreate() {
    setCreating(true);
    try {
      await api.createTenant(form);
      setOpen(false);
      setForm({ name: "", slug: "", plan: "starter" });
      await loadTenants();
    } catch (err: any) {
      alert(err.message ?? "Erro ao criar cliente");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="text-gray-400 text-sm mt-1">Gerencie os tenants da plataforma</p>
        </div>

        <Button
          className="bg-violet-600 hover:bg-violet-700 text-white"
          onClick={() => setOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" /> Novo Cliente
        </Button>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Cliente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label>Nome da Empresa</Label>
                <Input
                  placeholder="Ex: Empresa Alpha Ltda"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div className="space-y-1">
                <Label>Slug (identificador único)</Label>
                <Input
                  placeholder="ex: empresa-alpha"
                  value={form.slug}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                    }))
                  }
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div className="space-y-1">
                <Label>Plano</Label>
                <Select
                  value={form.plan}
                  onValueChange={(v) => setForm((f) => ({ ...f, plan: v ?? "starter" }))}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleCreate}
                className="w-full bg-violet-600 hover:bg-violet-700"
                disabled={creating || !form.name || !form.slug}
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Criando...
                  </>
                ) : (
                  "Criar Cliente"
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-8 h-8 rounded-full bg-gray-800" />
                    <Skeleton className="h-4 w-32 bg-gray-800" />
                  </div>
                  <Skeleton className="h-5 w-16 bg-gray-800 rounded-full" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-3 w-24 bg-gray-800" />
                <Skeleton className="h-3 w-40 bg-gray-800" />
                <Skeleton className="h-8 w-full bg-gray-800" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tenants.length === 0 ? (
            <div className="col-span-full border border-dashed border-gray-700 rounded-lg p-10 text-center">
              <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Nenhum cliente cadastrado ainda</p>
              <Button
                size="sm"
                className="mt-3 bg-violet-600 hover:bg-violet-700 text-white"
                onClick={() => setOpen(true)}
              >
                <Plus className="w-3 h-3 mr-1" /> Adicionar primeiro cliente
              </Button>
            </div>
          ) : (
            tenants.map((tenant) => (
              <Card
                key={tenant.id}
                className="bg-gray-900 border-gray-800 cursor-pointer hover:border-gray-600 transition-colors"
                onClick={() => router.push(`/dashboard/tenants/${tenant.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-violet-900/50 flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-violet-400" />
                      </div>
                      <CardTitle className="text-white text-sm truncate">
                        {tenant.name}
                      </CardTitle>
                    </div>
                    <Badge
                      className={`text-xs border flex-shrink-0 ${planColor[tenant.plan] ?? planColor.free}`}
                    >
                      {tenant.plan ?? "free"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-gray-500 font-mono">/{tenant.slug}</p>
                  <div className="flex gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Bot className="w-3 h-3" />
                      {tenant.agents_count ?? 0} agentes
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {(tenant.messages ?? 0).toLocaleString()} msgs
                    </span>
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
