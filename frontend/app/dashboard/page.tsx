import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Users, MessageSquare, Zap } from "lucide-react";

const stats = [
  { label: "Clientes Ativos", value: "12", icon: Users, delta: "+2 este mês" },
  { label: "Agentes Rodando", value: "34", icon: Bot, delta: "+8 este mês" },
  { label: "Mensagens Hoje", value: "1.847", icon: MessageSquare, delta: "+12% vs ontem" },
  { label: "Tokens Consumidos", value: "2.3M", icon: Zap, delta: "este mês" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="text-gray-400 text-sm mt-1">Visão geral da plataforma</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, delta }) => (
          <Card key={label} className="bg-gray-900 border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                {label}
              </CardTitle>
              <Icon className="w-4 h-4 text-violet-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{value}</div>
              <p className="text-xs text-gray-500 mt-1">{delta}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent activity placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Clientes Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {["Empresa Alpha", "Construtora Beta", "Imob Gama"].map((name) => (
                <div
                  key={name}
                  className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"
                >
                  <span className="text-sm text-gray-300">{name}</span>
                  <Badge variant="secondary" className="bg-violet-900/40 text-violet-300 border-violet-700">
                    Ativo
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-base">Agentes Mais Usados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Assistente Comercial", msgs: 542 },
                { name: "Suporte Técnico", msgs: 381 },
                { name: "Gerador de Orçamentos", msgs: 214 },
              ].map(({ name, msgs }) => (
                <div
                  key={name}
                  className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"
                >
                  <span className="text-sm text-gray-300">{name}</span>
                  <span className="text-xs text-gray-500">{msgs} msgs</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
