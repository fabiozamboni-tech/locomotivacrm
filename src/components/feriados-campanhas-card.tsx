import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  obterFeriadosNacionais_ServerFn,
  type FeriadoNacionalItem,
} from "@/lib/public-apis.functions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Sparkles, RefreshCw, Clock, ArrowRight, Lightbulb } from "lucide-react";
import { toast } from "sonner";

interface FeriadosCampanhasCardProps {
  ano?: number;
  className?: string;
  onAplicarNoTema?: (nomeFeriado: string, acao: string) => void;
}

export function FeriadosCampanhasCard({
  ano = new Date().getFullYear(),
  className,
  onAplicarNoTema,
}: FeriadosCampanhasCardProps) {
  const obterFeriados = useServerFn(obterFeriadosNacionais_ServerFn);
  const [feriados, setFeriados] = useState<FeriadoNacionalItem[]>([]);
  const [carregando, setCarregando] = useState(false);

  const carregar = async () => {
    setCarregando(true);
    try {
      const res = await obterFeriados({ data: { ano } });
      if (res?.feriados) {
        // Ordena pelos próximos feriados ou data cronológica
        const hoje = new Date().toISOString().split("T")[0];
        const futuros = res.feriados.filter((f) => f.data >= hoje);
        const passados = res.feriados.filter((f) => f.data < hoje);
        setFeriados([...futuros, ...passados]);
      }
    } catch {
      toast.error("Erro ao obter feriados nacionais.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [ano]);

  const proximosFeriados = feriados.filter((f) => (f.diasRestantes ?? 0) >= 0).slice(0, 5);

  return (
    <Card className={`border-border/80 shadow-xs ${className || ""}`}>
      <CardHeader className="pb-3 border-b bg-muted/10">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>Planejamento de Campanhas & Feriados Nacionais {ano}</span>
              </CardTitle>
              <Badge variant="secondary" className="text-[10px] font-mono">
                BrasilAPI Feriados
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Mapeamento de datas comemorativas e sazonais para posts no Instagram, e-mails promocionais e horários especiais.
            </CardDescription>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={carregar}
            disabled={carregando}
            className="h-7 w-7 p-0"
            title="Atualizar datas"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${carregando ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {proximosFeriados.map((f, idx) => {
            const dataParts = f.data.split("-");
            const dataFormatada = `${dataParts[2]}/${dataParts[1]}`;

            return (
              <div
                key={idx}
                className="p-3 rounded-lg border border-border/70 bg-card hover:border-primary/40 transition-colors flex flex-col justify-between space-y-2 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div>
                    <span className="text-[10px] font-bold text-primary font-mono">
                      {dataFormatada}
                    </span>
                    <h5 className="text-xs font-semibold leading-tight">{f.nome}</h5>
                  </div>
                  <Badge
                    variant={f.diasRestantes !== undefined && f.diasRestantes <= 15 ? "default" : "outline"}
                    className="text-[10px] shrink-0"
                  >
                    {f.diasRestantes === 0
                      ? "Hoje!"
                      : f.diasRestantes === 1
                      ? "Amanhã"
                      : `em ${f.diasRestantes} dias`}
                  </Badge>
                </div>

                <div className="text-[11px] text-muted-foreground flex items-start gap-1.5 bg-muted/40 p-2 rounded">
                  <Lightbulb className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                  <span className="leading-snug">{f.sugestaoAcao}</span>
                </div>

                {onAplicarNoTema && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onAplicarNoTema(f.nome, f.sugestaoAcao || "")}
                    className="h-6 text-[10px] p-0 text-primary justify-start hover:bg-transparent hover:underline"
                  >
                    Planejar ação para esta data <ArrowRight className="h-2.5 w-2.5 ml-1" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
