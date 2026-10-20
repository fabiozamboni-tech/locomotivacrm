import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Monitor,
  Tablet,
  Smartphone,
  Maximize2,
  Code2,
  Columns,
  Download,
  Github,
  CheckCircle,
  Copy,
  Clock,
  Sparkles,
  FileCode,
  ArrowRightLeft,
  Archive,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Empresa, SiteVersaoGerada } from "@/lib/mock-data";

interface ComparadorVersoesSitesProps {
  empresa: Empresa;
  siteHtmlAtivo: string;
  versoes: SiteVersaoGerada[];
  onSelecionarVersaoAtiva: (versao: SiteVersaoGerada) => void;
  onBaixarHtml: () => void;
  onBaixarZip: () => void;
  onAbrirModalGithub: () => void;
  onAbrirTelaCheia: () => void;
}

export function ComparadorVersoesSites({
  empresa,
  siteHtmlAtivo,
  versoes,
  onSelecionarVersaoAtiva,
  onBaixarHtml,
  onBaixarZip,
  onAbrirModalGithub,
  onAbrirTelaCheia,
}: ComparadorVersoesSitesProps) {
  const [modoVisualizacao, setModoVisualizacao] = useState<"preview" | "codigo" | "comparador">("preview");
  const [dispositivo, setDispositivo] = useState<"desktop" | "tablet" | "mobile">("desktop");

  // Índices para o comparador lado a lado
  const [indexVersaoA, setIndexVersaoA] = useState(0);
  const [indexVersaoB, setIndexVersaoB] = useState(Math.min(1, Math.max(0, versoes.length - 1)));

  const copyCode = () => {
    navigator.clipboard.writeText(siteHtmlAtivo);
    toast.success("Código HTML copiado para a área de transferência!");
  };

  const versaoA = versoes[indexVersaoA] || { html: siteHtmlAtivo, provedor: "Ativo", modelo: "Atual", data: new Date().toISOString() };
  const versaoB = versoes[indexVersaoB] || versaoA;

  return (
    <div className="space-y-4">
      {/* BARRA DE CONTROLE SUPERIOR */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-border/80 bg-card">
        {/* MODOS DE VISUALIZAÇÃO */}
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
          <Button
            size="sm"
            variant={modoVisualizacao === "preview" ? "default" : "ghost"}
            onClick={() => setModoVisualizacao("preview")}
            className="h-7 px-3 text-xs gap-1.5"
          >
            <Monitor className="h-3.5 w-3.5" />
            <span>Visualização</span>
          </Button>
          <Button
            size="sm"
            variant={modoVisualizacao === "comparador" ? "default" : "ghost"}
            onClick={() => setModoVisualizacao("comparador")}
            className="h-7 px-3 text-xs gap-1.5"
            disabled={versoes.length < 2}
            title={versoes.length < 2 ? "Gere pelo menos 2 versões para comparar lado a lado" : ""}
          >
            <Columns className="h-3.5 w-3.5" />
            <span>Comparar Versões</span>
            {versoes.length >= 2 && (
              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 ml-1">
                {versoes.length}
              </Badge>
            )}
          </Button>
          <Button
            size="sm"
            variant={modoVisualizacao === "codigo" ? "default" : "ghost"}
            onClick={() => setModoVisualizacao("codigo")}
            className="h-7 px-3 text-xs gap-1.5"
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>Código HTML</span>
          </Button>
        </div>

        {/* CONTROLES DE DISPOSITIVO (SE ESTIVER NO MODO PREVIEW) */}
        {modoVisualizacao === "preview" && (
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
            <Button
              size="sm"
              variant={dispositivo === "desktop" ? "default" : "ghost"}
              onClick={() => setDispositivo("desktop")}
              className="h-7 px-2.5 text-xs gap-1"
            >
              <Monitor className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Desktop</span>
            </Button>
            <Button
              size="sm"
              variant={dispositivo === "tablet" ? "default" : "ghost"}
              onClick={() => setDispositivo("tablet")}
              className="h-7 px-2.5 text-xs gap-1"
            >
              <Tablet className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Tablet</span>
            </Button>
            <Button
              size="sm"
              variant={dispositivo === "mobile" ? "default" : "ghost"}
              onClick={() => setDispositivo("mobile")}
              className="h-7 px-2.5 text-xs gap-1"
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Mobile</span>
            </Button>
          </div>
        )}

        {/* AÇÕES DE EXPORTAÇÃO */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onAbrirTelaCheia}
            className="h-8 text-xs gap-1.5"
            title="Abrir em Tela Cheia"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Tela Cheia</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onBaixarHtml}
            className="h-8 text-xs gap-1.5"
            title="Baixar arquivo HTML puro"
          >
            <Download className="h-3.5 w-3.5" />
            <span>HTML</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onBaixarZip}
            className="h-8 text-xs gap-1.5 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
            title="Baixar Pacote ZIP Completo com README e configurações"
          >
            <Archive className="h-3.5 w-3.5" />
            <span>Baixar ZIP</span>
          </Button>

          <Button
            size="sm"
            onClick={onAbrirModalGithub}
            className="h-8 text-xs gap-1.5 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
          >
            <Github className="h-3.5 w-3.5" />
            <span>Criar no GitHub</span>
          </Button>
        </div>
      </div>

      {/* ÁREA DE VISUALIZAÇÃO PRINCIPAL */}
      {modoVisualizacao === "preview" ? (
        <div className="flex justify-center bg-stone-950 p-4 sm:p-6 rounded-2xl border border-stone-800 shadow-xl overflow-hidden">
          <div
            style={{
              width: dispositivo === "desktop" ? "100%" : dispositivo === "tablet" ? "768px" : "375px",
              height: "640px",
              transition: "width 0.3s ease",
            }}
            className="rounded-xl overflow-hidden border border-stone-800 bg-white"
          >
            <iframe
              title="Site Preview GSAP"
              srcDoc={siteHtmlAtivo}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          </div>
        </div>
      ) : modoVisualizacao === "comparador" ? (
        /* MODO COMPARADOR LADO A LADO */
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SELETOR VERSÃO A */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/60 border text-xs">
              <span className="font-semibold flex items-center gap-1.5">
                <Badge variant="outline" className="text-[10px]">Lado A</Badge>
                <span>Versão:</span>
              </span>
              <select
                value={indexVersaoA}
                onChange={(e) => setIndexVersaoA(Number(e.target.value))}
                className="bg-background border rounded px-2 py-1 text-xs font-medium"
              >
                {versoes.map((v, i) => (
                  <option key={v.id || i} value={i}>
                    {v.provedor} · {v.modelo} ({format(new Date(v.data), "dd/MM HH:mm")})
                  </option>
                ))}
              </select>
            </div>

            {/* SELETOR VERSÃO B */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/60 border text-xs">
              <span className="font-semibold flex items-center gap-1.5">
                <Badge variant="outline" className="text-[10px]">Lado B</Badge>
                <span>Versão:</span>
              </span>
              <select
                value={indexVersaoB}
                onChange={(e) => setIndexVersaoB(Number(e.target.value))}
                className="bg-background border rounded px-2 py-1 text-xs font-medium"
              >
                {versoes.map((v, i) => (
                  <option key={v.id || i} value={i}>
                    {v.provedor} · {v.modelo} ({format(new Date(v.data), "dd/MM HH:mm")})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* IFRAME LADO A */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span className="font-semibold">{versaoA.provedor} · {versaoA.modelo}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSelecionarVersaoAtiva(versaoA)}
                  className="h-6 text-[10px] gap-1"
                >
                  <CheckCircle className="h-3 w-3 text-emerald-500" />
                  Definir como Oficial
                </Button>
              </div>
              <div className="h-[580px] rounded-xl overflow-hidden border border-border bg-white shadow-md">
                <iframe
                  title="Comparador Versão A"
                  srcDoc={versaoA.html}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-popups"
                />
              </div>
            </div>

            {/* IFRAME LADO B */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span className="font-semibold">{versaoB.provedor} · {versaoB.modelo}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSelecionarVersaoAtiva(versaoB)}
                  className="h-6 text-[10px] gap-1"
                >
                  <CheckCircle className="h-3 w-3 text-emerald-500" />
                  Definir como Oficial
                </Button>
              </div>
              <div className="h-[580px] rounded-xl overflow-hidden border border-border bg-white shadow-md">
                <iframe
                  title="Comparador Versão B"
                  srcDoc={versaoB.html}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-popups"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* MODO CÓDIGO HTML */
        <Card className="border-border">
          <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-mono flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              <span>index.html ({siteHtmlAtivo.length.toLocaleString()} caracteres)</span>
            </CardTitle>
            <Button size="sm" variant="outline" onClick={copyCode} className="h-7 text-xs gap-1">
              <Copy className="h-3.5 w-3.5" />
              Copiar Código
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <pre className="p-4 text-[11px] font-mono text-muted-foreground bg-muted/20 overflow-x-auto max-h-[560px] leading-relaxed">
              <code>{siteHtmlAtivo}</code>
            </pre>
          </CardContent>
        </Card>
      )}

      {/* HISTÓRICO DE VERSÕES SALVAS */}
      {versoes.length > 0 && (
        <Card className="border-border/80">
          <CardHeader className="py-3 px-4 border-b">
            <CardTitle className="text-xs font-semibold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-primary" />
                <span>Histórico de Versões Geradas para Esta Empresa ({versoes.length})</span>
              </div>
              <span className="text-[11px] text-muted-foreground font-normal">
                Clique para restaurar ou alternar
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {versoes.map((v, i) => {
                const isActive = siteHtmlAtivo === v.html;
                return (
                  <div
                    key={v.id || i}
                    onClick={() => onSelecionarVersaoAtiva(v)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      isActive
                        ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary"
                        : "border-border/80 hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold leading-tight line-clamp-1">{v.provedor}</span>
                          {isActive && (
                            <Badge variant="default" className="text-[9px] px-1 py-0 h-4">
                              Oficial
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{v.modelo}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {format(new Date(v.data), "dd/MM HH:mm")}
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-border/50 text-[10px] text-muted-foreground">
                      <span>{v.html ? `${(v.html.length / 1024).toFixed(1)} KB` : "Vazia"}</span>
                      <span className="text-primary font-medium hover:underline flex items-center gap-0.5">
                        {isActive ? "Versão Ativa" : "Ativar Versão ➔"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
