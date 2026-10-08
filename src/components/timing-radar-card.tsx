import { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Flame,
  Globe,
  ShieldAlert,
  Instagram,
  MessageSquare,
  ArrowUpRight,
  Sparkles,
  Filter,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { detectarSinaisDeCompra, type SinalCompraAlerta } from "@/lib/timing-radar";
import { useStore } from "@/lib/store";
import { Link } from "@tanstack/react-router";

interface TimingRadarCardProps {
  onSelectEmpresa?: (empresaId: string) => void;
  onOpenCadencia?: (empresaId: string) => void;
  maxItems?: number;
}

export function TimingRadarCard({
  onSelectEmpresa,
  onOpenCadencia,
  maxItems,
}: TimingRadarCardProps) {
  const { empresas } = useStore();
  const [filtroUrgencia, setFiltroUrgencia] = useState<"todos" | "critica" | "alta">("todos");

  const todosSinais = useMemo(() => {
    return detectarSinaisDeCompra(empresas);
  }, [empresas]);

  const sinaisFiltrados = useMemo(() => {
    let list = todosSinais;
    if (filtroUrgencia !== "todos") {
      list = list.filter((s) => s.urgencia === filtroUrgencia);
    }
    if (maxItems) {
      list = list.slice(0, maxItems);
    }
    return list;
  }, [todosSinais, filtroUrgencia, maxItems]);

  const contagemCritica = todosSinais.filter((s) => s.urgencia === "critica").length;
  const contagemAlta = todosSinais.filter((s) => s.urgencia === "alta").length;

  const renderIcone = (tipo: SinalCompraAlerta["tipoGatilho"]) => {
    switch (tipo) {
      case "sem_site":
        return <Globe className="h-4 w-4 text-red-500" />;
      case "site_sem_ssl":
        return <ShieldAlert className="h-4 w-4 text-amber-500" />;
      case "instagram_parado":
        return <Instagram className="h-4 w-4 text-purple-500" />;
      case "atendimento_lento":
        return <MessageSquare className="h-4 w-4 text-orange-500" />;
      case "score_critico":
      default:
        return <Flame className="h-4 w-4 text-rose-500" />;
    }
  };

  return (
    <Card className="border-amber-500/20 bg-gradient-to-br from-card to-amber-500/5 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <Flame className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                Radar de Timing Perfeito & Sinais de Compra
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">
                  {todosSinais.length} oportunidades quentes
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Empresas com falhas digitais imediatas ou abandono de canais prontas para serem abordadas agora.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setFiltroUrgencia("todos")}
              className={`px-2 py-1 rounded-md transition-colors ${
                filtroUrgencia === "todos"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Todos ({todosSinais.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroUrgencia("critica")}
              className={`px-2 py-1 rounded-md transition-colors ${
                filtroUrgencia === "critica"
                  ? "bg-red-600 text-white font-semibold"
                  : "bg-red-500/10 text-red-600 hover:bg-red-500/20"
              }`}
            >
              Críticos ({contagemCritica})
            </button>
            <button
              type="button"
              onClick={() => setFiltroUrgencia("alta")}
              className={`px-2 py-1 rounded-md transition-colors ${
                filtroUrgencia === "alta"
                  ? "bg-amber-600 text-white font-semibold"
                  : "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
              }`}
            >
              Alta Urgência ({contagemAlta})
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {sinaisFiltrados.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-xs">
            Nenhum sinal de compra detectado com os filtros atuais.
          </div>
        ) : (
          <div className="space-y-2.5">
            {sinaisFiltrados.map((sinal) => (
              <div
                key={sinal.id}
                className="flex items-start justify-between gap-3 p-3 rounded-lg border bg-card/60 hover:bg-card hover:border-primary/40 transition-all text-xs"
              >
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded bg-muted mt-0.5">
                    {renderIcone(sinal.tipoGatilho)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-bold text-foreground text-sm">
                        {sinal.empresaNome}
                      </span>
                      <span className="text-muted-foreground">
                        • {sinal.segmento} ({sinal.cidade})
                      </span>
                      <Badge
                        variant={sinal.urgencia === "critica" ? "destructive" : "secondary"}
                        className="text-[10px] uppercase tracking-wider py-0 px-1.5"
                      >
                        {sinal.urgencia}
                      </Badge>
                    </div>

                    <div className="font-medium text-foreground mb-0.5">
                      {sinal.titulo}
                    </div>
                    <div className="text-muted-foreground">
                      {sinal.descricao}
                    </div>
                    <div className="mt-1 text-primary font-medium flex items-center gap-1">
                      <span>💡 Recomendação:</span> {sinal.acaoRecomendada}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {onOpenCadencia ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenCadencia(sinal.empresaId)}
                      className="gap-1 text-xs h-7 px-2"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      Cadência
                    </Button>
                  ) : null}

                  {onSelectEmpresa ? (
                    <Button
                      size="sm"
                      onClick={() => onSelectEmpresa(sinal.empresaId)}
                      className="gap-1 text-xs h-7 px-2"
                    >
                      Abordar
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <Button
                      asChild
                      size="sm"
                      className="gap-1 text-xs h-7 px-2"
                    >
                      <Link to="/abordagem" search={{ empresa: sinal.empresaId }}>
                        Abordar
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
