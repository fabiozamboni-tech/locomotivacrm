import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Columns,
  CheckCircle,
  ExternalLink,
  Sparkles,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { format } from "date-fns";
import type { SiteVersaoGerada } from "@/lib/mock-data";

interface ModalComparadorVersoesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versoes: SiteVersaoGerada[];
  siteHtmlAtivo: string;
  onSelecionarVersaoAtiva: (versao: SiteVersaoGerada) => void;
}

export function ModalComparadorVersoes({
  open,
  onOpenChange,
  versoes,
  siteHtmlAtivo,
  onSelecionarVersaoAtiva,
}: ModalComparadorVersoesProps) {
  const [indexVersaoA, setIndexVersaoA] = useState(0);
  const [indexVersaoB, setIndexVersaoB] = useState(
    Math.min(1, Math.max(0, versoes.length - 1)),
  );

  if (versoes.length === 0) return null;

  const versaoA =
    versoes[indexVersaoA] ||
    versoes[0] || {
      html: siteHtmlAtivo,
      provedor: "Versão Atual",
      modelo: "",
      data: new Date().toISOString(),
    };
  const versaoB =
    versoes[indexVersaoB] ||
    versoes[1] ||
    versaoA;

  const isVersaoAOficial = siteHtmlAtivo === versaoA.html;
  const isVersaoBOficial = siteHtmlAtivo === versaoB.html;

  const handleAbrirNovaAba = (html: string) => {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[96vw] w-[96vw] max-h-[94vh] h-[94vh] flex flex-col p-4 sm:p-6 overflow-hidden">
        <DialogHeader className="pb-3 border-b shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                <Columns className="h-5 w-5 text-primary" />
                <span>Comparador de Versões de Sites (Lado a Lado)</span>
                <Badge variant="outline" className="text-xs">
                  {versoes.length} {versoes.length === 1 ? "versão" : "versões salvas"}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Compare as copies, tipografia, seções e animações GSAP de duas versões geradas e defina a oficial.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* CONTROLES SUPERIORES DOS DOIS LADOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2 shrink-0">
          {/* LADO A */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Badge variant="default" className="text-[10px] px-1.5 py-0">
                Lado A
              </Badge>
              <Select
                value={String(indexVersaoA)}
                onValueChange={(val) => setIndexVersaoA(Number(val))}
              >
                <SelectTrigger className="h-8 text-xs bg-background font-medium flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {versoes.map((v, i) => (
                    <SelectItem key={v.id || i} value={String(i)} className="text-xs">
                      {v.provedor} · {v.modelo} (
                      {v.data ? format(new Date(v.data), "dd/MM HH:mm") : "Salvo"})
                      {siteHtmlAtivo === v.html ? " ★ Oficial" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleAbrirNovaAba(versaoA.html)}
                className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground"
                title="Abrir Lado A em nova aba"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
              {isVersaoAOficial ? (
                <Badge variant="default" className="text-[11px] gap-1 bg-emerald-600 hover:bg-emerald-600">
                  <CheckCircle className="h-3 w-3" /> Site Oficial Ativo
                </Badge>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSelecionarVersaoAtiva(versaoA)}
                  className="h-7 text-xs gap-1 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Definir como Oficial
                </Button>
              )}
            </div>
          </div>

          {/* LADO B */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Lado B
              </Badge>
              <Select
                value={String(indexVersaoB)}
                onValueChange={(val) => setIndexVersaoB(Number(val))}
              >
                <SelectTrigger className="h-8 text-xs bg-background font-medium flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {versoes.map((v, i) => (
                    <SelectItem key={v.id || i} value={String(i)} className="text-xs">
                      {v.provedor} · {v.modelo} (
                      {v.data ? format(new Date(v.data), "dd/MM HH:mm") : "Salvo"})
                      {siteHtmlAtivo === v.html ? " ★ Oficial" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleAbrirNovaAba(versaoB.html)}
                className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground"
                title="Abrir Lado B em nova aba"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
              {isVersaoBOficial ? (
                <Badge variant="default" className="text-[11px] gap-1 bg-emerald-600 hover:bg-emerald-600">
                  <CheckCircle className="h-3 w-3" /> Site Oficial Ativo
                </Badge>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSelecionarVersaoAtiva(versaoB)}
                  className="h-7 text-xs gap-1 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  Definir como Oficial
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ÁREA DOS DOIS IFRAMES LADO A LADO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0 pt-1">
          {/* QUADRO A */}
          <div className="rounded-xl overflow-hidden border border-border bg-white shadow-sm flex flex-col h-full">
            <iframe
              title="Comparador Versão A"
              srcDoc={versaoA.html}
              className="w-full flex-1 border-0"
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          </div>

          {/* QUADRO B */}
          <div className="rounded-xl overflow-hidden border border-border bg-white shadow-sm flex flex-col h-full">
            <iframe
              title="Comparador Versão B"
              srcDoc={versaoB.html}
              className="w-full flex-1 border-0"
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
