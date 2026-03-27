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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Users, Bot, MessageSquare, ExternalLink } from "lucide-react";

const mockTenants = [
  {
    id: "1",
    name: "Empresa Alpha Ltda",
    slug: "alpha",
    plan: "pro",
    agents: 5,
    messages: 1234,
    created_at: "2025-01-15",
  },
  {
    id: "2",
    name: "Construtora Beta",
    slug: "beta",
    plan: "starter",
    agents: 2,
    messages: 387,
    created_at: "2025-02-03",
  },
  {
    id: "3",
    name: "Imobiliária Gama",
    slug: "gama",
    plan: "pro",
    agents: 8,
    messages: 2891,
    created_at: "2025-02-20",
  },
];

const planColor: Record<string, string> = {
  free: "bg-gray-800 text-gray-300 border-gray-700",
  starter: "bg-blue-900/40 text-blue-300 border-blue-700",
  pro: "bg-violet-900/40 text-violet-300 border-violet-700",
  enterprise: "bg-amber-900/40 text-amber-300 border-amber-700",
};

export default function TenantsPage() {
  const [tenants, setTenants] = useState(mockTenants);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", plan: "starter" });

  function handleCreate() {
    const newTenant = {
      id: String(Date.now()),
      ...form,
      agents: 0,
      messages: 0,
      created_at: new Date().toISOString().split("T")[0],
    };
    setTenants((t) => [...t, newTenant]);
    setOpen(false);
    setForm({ name: "", slug: "", plan: "starter" });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Clientes</h1>
          <p className="text-gray-400 text-sm mt-1">Gerencie os tenants da plataforma</p>
        </div>

        <Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Novo Cliente
        </Button>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger className="hidden" />
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
                <Select value={form.plan} onValueChange={(v) => setForm((f) => ({ ...f, plan: v ?? "starter" }))}>
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
                disabled={!form.name || !form.slug}
              >
                Criar Cliente
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {tenants.map((tenant) => (
          <Card key={tenant.id} className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-violet-900/50 flex items-center justify-center">
                    <Users className="w-4 h-4 text-violet-400" />
                  </div>
                  <CardTitle className="text-white text-sm">{tenant.name}</CardTitle>
                </div>
                <Badge className={`text-xs border ${planColor[tenant.plan]}`}>
                  {tenant.plan}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-gray-500 font-mono">/{tenant.slug}</p>
              <div className="flex gap-4 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Bot className="w-3 h-3" /> {tenant.agents} agentes
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> {tenant.messages.toLocaleString()} msgs
                </span>
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1 text-xs text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  <ExternalLink className="w-3 h-3 mr-1" /> Painel do Cliente
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
