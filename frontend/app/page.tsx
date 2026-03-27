import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap, Bot, Users, MessageSquare, BarChart2 } from "lucide-react";

const features = [
  { icon: Bot, title: "Agentes Personalizáveis", desc: "Configure prompt, modelo, temperatura e ferramentas por agente." },
  { icon: Users, title: "Multi-Tenant", desc: "Cada cliente tem seu próprio espaço isolado com agentes e histórico." },
  { icon: MessageSquare, title: "Telegram & WhatsApp", desc: "Conecte agentes a canais de mensagem com webhooks prontos." },
  { icon: BarChart2, title: "Usage & Billing", desc: "Monitore tokens consumidos por cliente e agente em tempo real." },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-violet-400" />
          <span className="font-bold text-lg">AgentHub</span>
        </div>
        <Link href="/dashboard">
          <Button className="bg-violet-600 hover:bg-violet-700 text-white">
            Entrar no Dashboard
          </Button>
        </Link>
      </nav>

      <section className="text-center py-24 px-8">
        <div className="inline-flex items-center gap-2 bg-violet-900/30 border border-violet-700 rounded-full px-4 py-1.5 text-sm text-violet-300 mb-6">
          <Zap className="w-3.5 h-3.5" /> Plataforma Multi-Tenant de Agentes de IA
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-3xl mx-auto leading-tight">
          Agentes de IA para{" "}
          <span className="text-violet-400">cada cliente</span>, num só lugar
        </h1>
        <p className="mt-6 text-lg text-gray-400 max-w-xl mx-auto">
          Crie, configure e monitore agentes de IA personalizados para seus clientes. Integrado com Telegram, WhatsApp, Claude e GPT-4.
        </p>
        <div className="mt-8 flex gap-3 justify-center">
          <Link href="/dashboard">
            <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-white">
              Acessar Dashboard
            </Button>
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-8 pb-24 grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <Icon className="w-6 h-6 text-violet-400 mb-3" />
            <h3 className="font-semibold text-white mb-1">{title}</h3>
            <p className="text-sm text-gray-400">{desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
