import React from "react";
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
}

export const AGENTES_IA_CATALOGO: AgenteIaOption[] = [
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
  },
  {
    id: "groq_llama33",
    provider: "groq",
    nome: "Groq · Llama 3.3 70B",
    modelo: "llama-3.3-70b-versatile",
    descricao: "Incrível velocidade de geração de código HTML e scripts GSAP limpos com latência mínima.",
    icone: Zap,
    badge: "Ultra Rápido (Free)",
    badgeVariant: "secondary",
  },
  {
    id: "gemini_15_pro",
    provider: "gemini",
    nome: "Google Gemini 1.5 Pro",
    modelo: "gemini-1.5-pro",
    descricao: "Contexto amplo para absorver integralmente o Dossiê 360 e Diagnóstico, gerando copy de alta persuasão.",
    icone: Sparkles,
    badge: "Copywriting de Elite",
    badgeVariant: "secondary",
  },
  {
    id: "openrouter_deepseek_r1",
    provider: "openrouter",
    nome: "OpenRouter · DeepSeek R1",
    modelo: "deepseek/deepseek-r1:free",
    descricao: "Raciocínio analítico avançado do catálogo awesome-free-llm-apis com foco em estrutura robusta.",
    icone: Globe,
    badge: "Catálogo Livre",
    badgeVariant: "outline",
  },
  {
    id: "cerebras_llama33",
    provider: "cerebras",
    nome: "Cerebras · Llama 3.3 70B",
    modelo: "llama-3.3-70b",
    descricao: "Arquitetura CS-3 em wafer-scale para geração em fração de segundos.",
    icone: Cpu,
    badge: "Super Concorrência",
    badgeVariant: "outline",
  },
  {
    id: "lovable_gateway",
    provider: "lovable",
    nome: "Lovable AI Gateway",
    modelo: "google/gemini-3-flash-preview",
    descricao: "Conexão direta com o ecossistema e componentes visuais do Lovable.",
    icone: Layers,
    badge: "Lovable Ready",
    badgeVariant: "secondary",
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
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Bot className="h-4 w-4 text-primary" />
          <span>Agente & Modelo de IA para Criação do Site</span>
        </label>
        <span className="text-[11px] text-muted-foreground">
          awesome-free-llm-apis & Motores Locomotiva
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {AGENTES_IA_CATALOGO.map((ag) => {
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
