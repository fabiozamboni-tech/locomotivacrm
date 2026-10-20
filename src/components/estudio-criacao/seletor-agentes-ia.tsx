import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sparkles,
  Zap,
  Globe,
  Cpu,
  Palette,
  CheckCircle2,
  Server,
  Layers,
  Bot,
  Flame,
  Info,
} from "lucide-react";
import type { ApiSettingsMap } from "@/lib/api-settings";

export interface AgenteIaOption {
  id: string;
  provider: "groq" | "gemini" | "openrouter" | "cerebras" | "lovable" | "ollama" | "bespoke";
  nome: string;
  modelo: string;
  descricao: string;
  icone: React.ElementType;
  badge: string;
  badgeVariant?: "default" | "secondary" | "outline";
  destaque?: boolean;
  categoria: "openrouter" | "rapidos" | "editorial";
}

export const AGENTES_IA_CATALOGO: AgenteIaOption[] = [
  // 1. MOTOR EDITORIAL LOCOMOTIVA (ANTI-IA BESPOKE)
  {
    id: "bespoke_anti_ia",
    provider: "bespoke",
    nome: "Motor Editorial Locomotiva",
    modelo: "GSAP Anti-IA Bespoke Engine",
    descricao: "Design editorial contemporâneo sem vieses de IA. Fundo claro, grid assimétrico e GSAP ScrollTrigger calibrado.",
    icone: Palette,
    badge: "100% Anti-IA",
    badgeVariant: "default",
    destaque: true,
    categoria: "editorial",
  },

  // 2. OPENROUTER - ANTHROPIC CLAUDE 3.5 SONNET
  {
    id: "openrouter_claude_35_sonnet",
    provider: "openrouter",
    nome: "Anthropic Claude 3.5 Sonnet",
    modelo: "anthropic/claude-3.5-sonnet",
    descricao: "O padrão-ouro em UI/UX e desenvolvimento frontend. Precisão milimétrica em layouts e animações GSAP.",
    icone: Sparkles,
    badge: "OpenRouter · Elite UI/UX",
    badgeVariant: "default",
    destaque: true,
    categoria: "openrouter",
  },

  // 3. OPENROUTER - OPENAI GPT-4o
  {
    id: "openrouter_gpt4o",
    provider: "openrouter",
    nome: "OpenAI GPT-4o",
    modelo: "openai/gpt-4o",
    descricao: "Raciocínio lógico e multimodal de ponta. Estruturação completa de páginas e copywriting persuasivo.",
    icone: Bot,
    badge: "OpenRouter · Flagship",
    badgeVariant: "secondary",
    categoria: "openrouter",
  },

  // 4. OPENROUTER - MOONSHOT KIMI
  {
    id: "openrouter_moonshot_kimi",
    provider: "openrouter",
    nome: "Moonshot Kimi",
    modelo: "moonshotai/moonshot-v1-8k",
    descricao: "Especialista em absorção de contextos profundos do cliente e nuances textuais para copies de alto impacto.",
    icone: Globe,
    badge: "OpenRouter · Kimi",
    badgeVariant: "outline",
    categoria: "openrouter",
  },

  // 5. OPENROUTER - ZHIPU GLM-4
  {
    id: "openrouter_zhipu_glm",
    provider: "openrouter",
    nome: "Zhipu GLM-4",
    modelo: "thudm/glm-4-9b-chat",
    descricao: "Modelo global de alto desempenho para geração ágil, estruturação semântica e código dinâmico.",
    icone: Cpu,
    badge: "OpenRouter · GLM",
    badgeVariant: "outline",
    categoria: "openrouter",
  },

  // 6. OPENROUTER - DEEPSEEK R1 (FREE)
  {
    id: "openrouter_deepseek_r1",
    provider: "openrouter",
    nome: "OpenRouter · DeepSeek R1",
    modelo: "deepseek/deepseek-r1:free",
    descricao: "Raciocínio analítico avançado do catálogo awesome-free-llm-apis com foco em arquitetura semântica.",
    icone: Globe,
    badge: "OpenRouter Free",
    badgeVariant: "outline",
    categoria: "openrouter",
  },

  // 7. GOOGLE GEMINI 1.5 PRO
  {
    id: "gemini_15_pro",
    provider: "gemini",
    nome: "Google Gemini 1.5 Pro",
    modelo: "gemini-1.5-pro",
    descricao: "Contexto de milhões de tokens para absorver integralmente o Dossiê 360 e Diagnóstico com precisão editorial.",
    icone: Sparkles,
    badge: "Google AI Studio",
    badgeVariant: "secondary",
    categoria: "rapidos",
  },

  // 8. GROQ - LLAMA 3.3 70B
  {
    id: "groq_llama33",
    provider: "groq",
    nome: "Groq · Llama 3.3 70B",
    modelo: "llama-3.3-70b-versatile",
    descricao: "Incrível velocidade de geração de código HTML e scripts GSAP limpos com latência em milissegundos.",
    icone: Zap,
    badge: "Groq Cloud (Free)",
    badgeVariant: "secondary",
    categoria: "rapidos",
  },

  // 9. CEREBRAS - LLAMA 3.3 70B
  {
    id: "cerebras_llama33",
    provider: "cerebras",
    nome: "Cerebras · Llama 3.3 70B",
    modelo: "llama-3.3-70b",
    descricao: "Arquitetura CS-3 em wafer-scale para geração em fração de segundos sem filas de espera.",
    icone: Cpu,
    badge: "Cerebras Cloud",
    badgeVariant: "outline",
    categoria: "rapidos",
  },

  // 10. LOVABLE AI GATEWAY
  {
    id: "lovable_gateway",
    provider: "lovable",
    nome: "Lovable AI Gateway",
    modelo: "google/gemini-3-flash-preview",
    descricao: "Conexão direta com o ecossistema e componentes visuais do Lovable.",
    icone: Layers,
    badge: "Lovable Ready",
    badgeVariant: "secondary",
    categoria: "rapidos",
  },
];

interface SeletorAgentesIaProps {
  agenteSelecionadoId: string;
  onSelecionarAgente: (agente: AgenteIaOption) => void;
  apiSettings?: ApiSettingsMap;
}

export function SeletorAgentesIa({
  agenteSelecionadoId,
  onSelecionarAgente,
  apiSettings,
}: SeletorAgentesIaProps) {
  const [categoriaAtiva, setCategoriaAtiva] = useState<"todos" | "openrouter" | "rapidos" | "editorial">("todos");

  const agentesFiltrados = AGENTES_IA_CATALOGO.filter((ag) => {
    if (categoriaAtiva === "todos") return true;
    return ag.categoria === categoriaAtiva;
  });

  const temChaveOpenRouter = Boolean(apiSettings?.openrouter?.key?.trim());

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Bot className="h-4 w-4 text-primary" />
          <span>Agente & Modelo de IA para Criação do Site</span>
        </label>
        <span className="text-[11px] text-muted-foreground">
          OpenRouter Hub · awesome-free-llm-apis · Motores Locomotiva
        </span>
      </div>

      {/* Filtros rápidos de categoria */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Button
          type="button"
          size="sm"
          variant={categoriaAtiva === "todos" ? "default" : "outline"}
          onClick={() => setCategoriaAtiva("todos")}
          className="h-7 text-xs px-2.5 rounded-full"
        >
          Todos ({AGENTES_IA_CATALOGO.length})
        </Button>
        <Button
          type="button"
          size="sm"
          variant={categoriaAtiva === "openrouter" ? "default" : "outline"}
          onClick={() => setCategoriaAtiva("openrouter")}
          className="h-7 text-xs px-2.5 rounded-full flex items-center gap-1"
        >
          <Sparkles className="h-3 w-3 text-amber-500" />
          OpenRouter Hub (Claude, GPT, Kimi, GLM, DeepSeek)
        </Button>
        <Button
          type="button"
          size="sm"
          variant={categoriaAtiva === "rapidos" ? "default" : "outline"}
          onClick={() => setCategoriaAtiva("rapidos")}
          className="h-7 text-xs px-2.5 rounded-full flex items-center gap-1"
        >
          <Zap className="h-3 w-3 text-blue-500" />
          Gratuitos & Rápidos (Groq, Cerebras, Gemini)
        </Button>
        <Button
          type="button"
          size="sm"
          variant={categoriaAtiva === "editorial" ? "default" : "outline"}
          onClick={() => setCategoriaAtiva("editorial")}
          className="h-7 text-xs px-2.5 rounded-full flex items-center gap-1"
        >
          <Palette className="h-3 w-3 text-emerald-500" />
          Anti-IA Bespoke
        </Button>
      </div>

      {/* Caixa de dica educativa do OpenRouter Hub */}
      {categoriaAtiva === "openrouter" && (
        <div className="p-2.5 rounded-md border border-purple-500/20 bg-purple-500/5 text-xs text-foreground flex items-start gap-2">
          <Info className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-purple-700 dark:text-purple-300">
              Hub Multi-Modelos OpenRouter:{" "}
            </span>
            Com uma única chave configurada em Configurações, você acessa Claude 3.5 Sonnet, GPT-4o, Moonshot Kimi, Zhipu GLM e DeepSeek R1 sem pagar assinaturas separadas.
            {!temChaveOpenRouter && (
              <span className="block mt-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                ⚠️ Dica: Configure sua chave OpenRouter na aba Configurações para desbloquear a chamada direta desses modelos.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Grid de Cards dos Agentes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {agentesFiltrados.map((ag) => {
          const selecionado = agenteSelecionadoId === ag.id;
          const Icon = ag.icone;

          return (
            <Card
              key={ag.id}
              onClick={() => onSelecionarAgente(ag)}
              className={`cursor-pointer transition-all border text-left hover:border-primary/60 ${
                selecionado
                  ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary"
                  : "border-border/80 bg-card hover:bg-muted/40"
              }`}
            >
              <CardContent className="p-3.5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-1.5 rounded-md ${
                        selecionado ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold leading-tight line-clamp-1">{ag.nome}</h4>
                      <p className="text-[10px] text-muted-foreground font-mono">{ag.modelo}</p>
                    </div>
                  </div>
                  {selecionado ? (
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  ) : (
                    <Badge variant={ag.badgeVariant || "outline"} className="text-[9px] px-1.5 py-0 h-4">
                      {ag.badge}
                    </Badge>
                  )}
                </div>

                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                  {ag.descricao}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
