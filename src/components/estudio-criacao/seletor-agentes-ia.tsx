import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  provider:
    | "groq"
    | "gemini"
    | "openrouter"
    | "cerebras"
    | "lovable"
    | "ollama"
    | "bespoke"
    | "openai"
    | "anthropic";
  nome: string;
  modelo: string;
  descricao: string;
  icone: React.ElementType;
  badge: string;
  badgeVariant?: "default" | "secondary" | "outline";
  destaque?: boolean;
  categoria: "openrouter" | "rapidos" | "editorial" | "direto";
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

  // 7. OPENROUTER - QWEN 2.5 72B
  {
    id: "openrouter_qwen25",
    provider: "openrouter",
    nome: "OpenRouter · Qwen 2.5 72B",
    modelo: "qwen/qwen-2.5-72b-instruct",
    descricao: "Poderoso raciocínio e síntese com excepcional domínio do português do Brasil para propostas e copywriting.",
    icone: Globe,
    badge: "OpenRouter · Qwen 2.5",
    badgeVariant: "secondary",
    categoria: "openrouter",
  },

  // 8. GOOGLE GEMINI 2.0 FLASH (GRÁTIS)
  {
    id: "gemini_20_flash",
    provider: "gemini",
    nome: "Google Gemini 2.0 Flash",
    modelo: "gemini-2.0-flash",
    descricao: "Alta inteligência com latência veloz e cota gratuita permanente no Google AI Studio (até 15 RPM).",
    icone: Sparkles,
    badge: "Google AI Studio (Free)",
    badgeVariant: "default",
    destaque: true,
    categoria: "rapidos",
  },

  // 9. GOOGLE GEMINI 1.5 PRO
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

  // 10. GROQ - LLAMA 3.3 70B
  {
    id: "groq_llama33",
    provider: "groq",
    nome: "Groq · Llama 3.3 70B",
    modelo: "llama-3.3-70b-versatile",
    descricao: "Incrível velocidade de geração de código HTML e scripts GSAP limpos com latência em milissegundos.",
    icone: Zap,
    badge: "Groq Cloud (Free)",
    badgeVariant: "secondary",
    destaque: true,
    categoria: "rapidos",
  },

  // 11. GROQ - LLAMA 3.1 8B INSTANT
  {
    id: "groq_llama31_instant",
    provider: "groq",
    nome: "Groq · Llama 3.1 8B Instant",
    modelo: "llama-3.1-8b-instant",
    descricao: "Velocidade sub-segundo (~800 tokens/s). Excelente para mensagens instantâneas de WhatsApp e respostas imediatas.",
    icone: Zap,
    badge: "Groq Sub-Segundo",
    badgeVariant: "outline",
    categoria: "rapidos",
  },

  // 12. CEREBRAS - LLAMA 3.3 70B
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

  // 13. ANTHROPIC CLAUDE 3.5 SONNET (DIRETO)
  {
    id: "direct_claude_35",
    provider: "anthropic",
    nome: "Anthropic Claude 3.5 Sonnet (Nativo)",
    modelo: "claude-3-5-sonnet-20241022",
    descricao: "Conexão nativa direta via API oficial da Anthropic. Máxima excelência em UI/UX, código frontend e argumentação comercial.",
    icone: Sparkles,
    badge: "Anthropic API",
    badgeVariant: "default",
    destaque: true,
    categoria: "direto",
  },

  // 14. OPENAI GPT-4o (DIRETO)
  {
    id: "direct_openai_gpt4o",
    provider: "openai",
    nome: "OpenAI GPT-4o (Nativo)",
    modelo: "gpt-4o",
    descricao: "Conexão nativa direta via API oficial da OpenAI. Precisão analítica, visão multimodal e estruturação de dados.",
    icone: Bot,
    badge: "OpenAI API",
    badgeVariant: "secondary",
    categoria: "direto",
  },

  // 15. LOVABLE AI GATEWAY
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

export function getAgenteById(id?: string): AgenteIaOption {
  if (!id) return AGENTES_IA_CATALOGO[0];
  return AGENTES_IA_CATALOGO.find((ag) => ag.id === id) || AGENTES_IA_CATALOGO[0];
}

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
  const [categoriaAtiva, setCategoriaAtiva] = useState<"todos" | "openrouter" | "rapidos" | "editorial" | "direto">("todos");

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
        <Button
          type="button"
          size="sm"
          variant={categoriaAtiva === "direto" ? "default" : "outline"}
          onClick={() => setCategoriaAtiva("direto")}
          className="h-7 text-xs px-2.5 rounded-full flex items-center gap-1"
        >
          <Bot className="h-3 w-3 text-violet-500" />
          APIs Diretas (Claude / OpenAI)
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

interface SeletorAgentesIaSelectProps {
  agenteSelecionadoId: string;
  onSelecionarAgente: (agente: AgenteIaOption) => void;
  className?: string;
}

export function SeletorAgentesIaSelect({
  agenteSelecionadoId,
  onSelecionarAgente,
  className,
}: SeletorAgentesIaSelectProps) {
  const agenteAtual =
    AGENTES_IA_CATALOGO.find((ag) => ag.id === agenteSelecionadoId) ||
    AGENTES_IA_CATALOGO[0];

  const handleValueChange = (id: string) => {
    const ag = AGENTES_IA_CATALOGO.find((a) => a.id === id);
    if (ag) onSelecionarAgente(ag);
  };

  const IconAtual = agenteAtual.icone;

  return (
    <div className={`space-y-1.5 ${className || ""}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Bot className="h-3.5 w-3.5 text-primary" />
          <span>Modelo de IA</span>
        </label>
        <span className="text-[10px] text-muted-foreground font-mono">
          {agenteAtual.modelo}
        </span>
      </div>

      <Select value={agenteSelecionadoId} onValueChange={handleValueChange}>
        <SelectTrigger className="w-full text-xs h-9 bg-background font-medium">
          <div className="flex items-center gap-2 truncate">
            <IconAtual className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate">{agenteAtual.nome}</span>
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-80">
          <div className="p-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b">
            Hub OpenRouter (1 Chave para Todos)
          </div>
          {AGENTES_IA_CATALOGO.filter((ag) => ag.categoria === "openrouter").map((ag) => {
            const Icon = ag.icone;
            return (
              <SelectItem key={ag.id} value={ag.id} className="text-xs py-2">
                <div className="flex items-center justify-between gap-2 w-full">
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="font-medium">{ag.nome}</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 font-normal">
                    {ag.badge.replace("OpenRouter · ", "")}
                  </Badge>
                </div>
              </SelectItem>
            );
          })}

          <div className="p-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b mt-1">
            Gratuitos & Rápidos (Groq, Cerebras, Gemini)
          </div>
          {AGENTES_IA_CATALOGO.filter((ag) => ag.categoria === "rapidos").map((ag) => {
            const Icon = ag.icone;
            return (
              <SelectItem key={ag.id} value={ag.id} className="text-xs py-2">
                <div className="flex items-center justify-between gap-2 w-full">
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span className="font-medium">{ag.nome}</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 font-normal">
                    {ag.badge}
                  </Badge>
                </div>
              </SelectItem>
            );
          })}

          <div className="p-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b mt-1">
            Motor Editorial Nativo
          </div>
          {AGENTES_IA_CATALOGO.filter((ag) => ag.categoria === "editorial").map((ag) => {
            const Icon = ag.icone;
            return (
              <SelectItem key={ag.id} value={ag.id} className="text-xs py-2">
                <div className="flex items-center justify-between gap-2 w-full">
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span className="font-medium">{ag.nome}</span>
                  </div>
                  <Badge variant="default" className="text-[9px] px-1 py-0 h-3.5 font-normal">
                    {ag.badge}
                  </Badge>
                </div>
              </SelectItem>
            );
          })}

          <div className="p-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b mt-1">
            APIs Diretas (Nativas)
          </div>
          {AGENTES_IA_CATALOGO.filter((ag) => ag.categoria === "direto").map((ag) => {
            const Icon = ag.icone;
            return (
              <SelectItem key={ag.id} value={ag.id} className="text-xs py-2">
                <div className="flex items-center justify-between gap-2 w-full">
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                    <span className="font-medium">{ag.nome}</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 font-normal">
                    {ag.badge}
                  </Badge>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
