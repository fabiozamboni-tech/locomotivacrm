import React, { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AGENTES_IA_CATALOGO,
  getAgenteById,
  type AgenteIaOption,
} from "@/components/estudio-criacao/seletor-agentes-ia";
import {
  Bot,
  ChevronDown,
  Check,
  Zap,
  Globe,
  Palette,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const LS_KEY_AGENTE_ATIVO = "locomotiva_agente_ia_ativo";
export const AGENTE_IA_PADRAO_ID = "gemini_20_flash";

/**
 * Hook para sincronizar o agente de IA ativo com o localStorage do CRM.
 */
export function useAgenteIaAtivo(agenteInicialId?: string) {
  const [agenteId, setAgenteId] = useState<string>(() => {
    if (agenteInicialId) return agenteInicialId;
    if (typeof window !== "undefined") {
      const salvo = localStorage.getItem(LS_KEY_AGENTE_ATIVO);
      if (salvo && AGENTES_IA_CATALOGO.some((a) => a.id === salvo)) {
        return salvo;
      }
    }
    return AGENTE_IA_PADRAO_ID;
  });

  const agente = getAgenteById(agenteId);

  const selecionarAgente = (novoAgente: AgenteIaOption) => {
    setAgenteId(novoAgente.id);
    if (typeof window !== "undefined") {
      localStorage.setItem(LS_KEY_AGENTE_ATIVO, novoAgente.id);
    }
  };

  return {
    agenteId,
    agente,
    setAgenteId,
    selecionarAgente,
  };
}

export interface SeletorRapidoAgenteIaProps {
  agenteId?: string;
  onSelecionarAgente: (agente: AgenteIaOption) => void;
  className?: string;
  labelPre?: string;
  alinhamento?: "start" | "end" | "center";
}

/**
 * Seletor Rápido Discreto de Agentes de IA.
 * Renderiza uma pílula compacta e elegante nos cabeçalhos das telas do CRM,
 * permitindo alternar instantaneamente entre Gemini 2.0, Groq, DeepSeek R1,
 * Claude 3.5, GPT-4o e Anti-IA Bespoke.
 */
export function SeletorRapidoAgenteIa({
  agenteId,
  onSelecionarAgente,
  className,
  labelPre,
  alinhamento = "end",
}: SeletorRapidoAgenteIaProps) {
  const agenteAtual = getAgenteById(agenteId || AGENTE_IA_PADRAO_ID);
  const IconAtual = agenteAtual.icone || Bot;

  const rapidos = AGENTES_IA_CATALOGO.filter((a) => a.categoria === "rapidos");
  const openrouter = AGENTES_IA_CATALOGO.filter((a) => a.categoria === "openrouter");
  const editorial = AGENTES_IA_CATALOGO.filter((a) => a.categoria === "editorial");
  const diretos = AGENTES_IA_CATALOGO.filter((a) => a.categoria === "direto");

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      {labelPre && (
        <span className="text-[11px] font-medium text-muted-foreground hidden sm:inline">
          {labelPre}
        </span>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2.5 text-xs font-medium gap-1.5 rounded-lg border-border/70 bg-background/90 hover:bg-accent/60 shadow-xs transition-all max-w-[280px]"
            title={`Agente ativo: ${agenteAtual.nome} (${agenteAtual.modelo})`}
          >
            <IconAtual className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="font-semibold truncate max-w-[130px] sm:max-w-[160px]">
              {agenteAtual.nome}
            </span>
            <Badge
              variant={agenteAtual.badgeVariant || "outline"}
              className="text-[9px] px-1 py-0 h-4 font-normal shrink-0 hidden md:inline-flex"
            >
              {agenteAtual.badge.replace("OpenRouter · ", "").replace("Google AI Studio", "Gemini")}
            </Badge>
            <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0 opacity-60" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align={alinhamento}
          className="w-80 max-h-[460px] overflow-y-auto p-1.5 shadow-lg border-border/80"
        >
          {/* GRUPO 1: GRATUITOS & RÁPIDOS */}
          <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-1 flex items-center gap-1.5">
            <Zap className="h-3 w-3 text-amber-500" />
            Gratuitos & Rápidos (Zero Custo)
          </DropdownMenuLabel>
          <DropdownMenuGroup>
            {rapidos.map((ag) => {
              const Icon = ag.icone;
              const ativo = ag.id === agenteAtual.id;
              return (
                <DropdownMenuItem
                  key={ag.id}
                  onClick={() => onSelecionarAgente(ag)}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-md cursor-pointer text-xs group",
                    ativo && "bg-primary/10 text-primary font-semibold"
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Icon className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <div className="truncate">
                      <div className="leading-tight truncate">{ag.nome}</div>
                      <div className="text-[10px] text-muted-foreground font-mono truncate">
                        {ag.modelo}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 font-normal">
                      {ag.badge.replace("Google AI Studio", "Google")}
                    </Badge>
                    {ativo && <Check className="h-3.5 w-3.5 text-primary" />}
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="my-1" />

          {/* GRUPO 2: OPENROUTER HUB */}
          <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-1 flex items-center gap-1.5">
            <Globe className="h-3 w-3 text-purple-500" />
            OpenRouter Hub (1 Chave para Todos)
          </DropdownMenuLabel>
          <DropdownMenuGroup>
            {openrouter.map((ag) => {
              const Icon = ag.icone;
              const ativo = ag.id === agenteAtual.id;
              return (
                <DropdownMenuItem
                  key={ag.id}
                  onClick={() => onSelecionarAgente(ag)}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-md cursor-pointer text-xs group",
                    ativo && "bg-primary/10 text-primary font-semibold"
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Icon className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                    <div className="truncate">
                      <div className="leading-tight truncate">{ag.nome}</div>
                      <div className="text-[10px] text-muted-foreground font-mono truncate">
                        {ag.modelo}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 font-normal">
                      {ag.badge.replace("OpenRouter · ", "")}
                    </Badge>
                    {ativo && <Check className="h-3.5 w-3.5 text-primary" />}
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>

          <DropdownMenuSeparator className="my-1" />

          {/* GRUPO 3: EDITORIAL BESPOKE ANTI-IA */}
          <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-1 flex items-center gap-1.5">
            <Palette className="h-3 w-3 text-emerald-500" />
            Motor Editorial Anti-IA Bespoke
          </DropdownMenuLabel>
          <DropdownMenuGroup>
            {editorial.map((ag) => {
              const Icon = ag.icone;
              const ativo = ag.id === agenteAtual.id;
              return (
                <DropdownMenuItem
                  key={ag.id}
                  onClick={() => onSelecionarAgente(ag)}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-md cursor-pointer text-xs group",
                    ativo && "bg-primary/10 text-primary font-semibold"
                  )}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Icon className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <div className="truncate">
                      <div className="leading-tight truncate">{ag.nome}</div>
                      <div className="text-[10px] text-muted-foreground font-mono truncate">
                        {ag.modelo}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <Badge variant="default" className="text-[9px] px-1 py-0 h-3.5 font-normal">
                      {ag.badge}
                    </Badge>
                    {ativo && <Check className="h-3.5 w-3.5 text-primary" />}
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>

          {diretos.length > 0 && (
            <>
              <DropdownMenuSeparator className="my-1" />
              {/* GRUPO 4: APIS DIRETAS NATIVAS */}
              <DropdownMenuLabel className="text-[10px] uppercase font-bold text-muted-foreground px-2 py-1 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-violet-500" />
                APIs Nativas Diretas
              </DropdownMenuLabel>
              <DropdownMenuGroup>
                {diretos.map((ag) => {
                  const Icon = ag.icone;
                  const ativo = ag.id === agenteAtual.id;
                  return (
                    <DropdownMenuItem
                      key={ag.id}
                      onClick={() => onSelecionarAgente(ag)}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-md cursor-pointer text-xs group",
                        ativo && "bg-primary/10 text-primary font-semibold"
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Icon className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                        <div className="truncate">
                          <div className="leading-tight truncate">{ag.nome}</div>
                          <div className="text-[10px] text-muted-foreground font-mono truncate">
                            {ag.modelo}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 font-normal">
                          {ag.badge}
                        </Badge>
                        {ativo && <Check className="h-3.5 w-3.5 text-primary" />}
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuGroup>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
