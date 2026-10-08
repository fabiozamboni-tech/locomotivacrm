import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  Copy,
  Send,
  Check,
  Mail,
  MessageCircle,
  ExternalLink,
  Flame,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { gerarCadenciaCompleta, type PassoCadencia } from "@/lib/cadencia";
import { whatsappUrl } from "@/lib/links";
import type { Empresa } from "@/lib/mock-data";

interface CadenciaModalProps {
  empresa: Empresa | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nomeDecisorPadrao?: string;
  nomeAgencia?: string;
}

export function CadenciaModal({
  empresa,
  open,
  onOpenChange,
  nomeDecisorPadrao = "Gestor(a)",
  nomeAgencia = "nossa agência",
}: CadenciaModalProps) {
  const [nomeDecisor, setNomeDecisor] = useState(nomeDecisorPadrao);
  const [copiadoDia, setCopiadoDia] = useState<number | null>(null);

  if (!empresa) return null;

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://locomotivacrm.com.br";
  const linkAuditoria = `${baseUrl}/auditoria/${empresa.id}`;

  const cadencia = useMemo(() => {
    return gerarCadenciaCompleta(
      {
        id: empresa.id,
        nome: empresa.nome,
        cidade: empresa.cidade,
        segmento: empresa.segmento,
        whatsapp: empresa.whatsapp,
        site: empresa.site,
      },
      nomeDecisor || "Gestor(a)",
      nomeAgencia,
      linkAuditoria,
    );
  }, [empresa, nomeDecisor, nomeAgencia, linkAuditoria]);

  const copiarMensagem = (dia: number, texto: string) => {
    navigator.clipboard.writeText(texto);
    setCopiadoDia(dia);
    toast.success(`Mensagem do dia ${dia} copiada!`);
    setTimeout(() => setCopiadoDia(null), 2500);
  };

  const getWaLink = (texto: string) => {
    const base = whatsappUrl(empresa.whatsapp);
    if (!base) return undefined;
    return `${base}?text=${encodeURIComponent(texto)}`;
  };

  const getMailLink = (assunto: string, corpo: string) => {
    if (!empresa.email) return undefined;
    return `mailto:${empresa.email}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                Régua de Cadência Multicanal (D+0 a D+8) — {empresa.nome}
              </DialogTitle>
              <DialogDescription>
                Sequência estratégica de 4 toques programados para maximizar a taxa de resposta e conversão em reuniões.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Configuração rápida do Decisor */}
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-muted/40 border">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Nome do Decisor no Texto:
            </div>
            <Input
              value={nomeDecisor}
              onChange={(e) => setNomeDecisor(e.target.value)}
              placeholder="Ex: Carlos, Mariana, Dr. Roberto..."
              className="max-w-xs h-8 text-sm"
            />
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 ml-auto">
              <span>Link da Auditoria:</span>
              <a
                href={`/auditoria/${empresa.id}`}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline font-mono inline-flex items-center gap-1"
              >
                /auditoria/{empresa.id}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Passos da Cadência */}
          <div className="space-y-4">
            {cadencia.passos.map((passo) => {
              const waUrl = getWaLink(passo.mensagem);
              const mailUrl = passo.assuntoEmail ? getMailLink(passo.assuntoEmail, passo.mensagem) : undefined;

              return (
                <div
                  key={passo.dia}
                  className="p-4 rounded-xl border bg-card hover:border-primary/40 transition-all space-y-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="font-bold text-xs bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {passo.rotuloDia}
                        </Badge>
                        <h4 className="font-semibold text-sm">{passo.titulo}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground">{passo.objetivo}</p>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="outline" className="border-amber-500/30 text-amber-600 dark:text-amber-400">
                        ⚡ {passo.gatilhoPsicologico}
                      </Badge>
                    </div>
                  </div>

                  {passo.assuntoEmail && (
                    <div className="p-2 rounded bg-muted/60 text-xs font-mono border">
                      <span className="text-muted-foreground font-semibold">Assunto do E-mail: </span>
                      {passo.assuntoEmail}
                    </div>
                  )}

                  <div className="p-3 bg-muted/30 rounded-lg text-sm font-sans whitespace-pre-line leading-relaxed border">
                    {passo.mensagem}
                  </div>

                  <div className="flex items-center justify-between gap-2 flex-wrap pt-1 text-xs">
                    <div className="text-muted-foreground italic flex items-center gap-1">
                      <span>💡 Dica:</span> {passo.dicaExecucao}
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copiarMensagem(passo.dia, passo.mensagem)}
                        className="gap-1.5 text-xs h-8"
                      >
                        {copiadoDia === passo.dia ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            Copiar Texto
                          </>
                        )}
                      </Button>

                      {passo.canal === "whatsapp" && waUrl && (
                        <Button
                          asChild
                          size="sm"
                          className="gap-1.5 text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <a href={waUrl} target="_blank" rel="noreferrer">
                            <Send className="h-3.5 w-3.5" />
                            Disparar no WhatsApp
                          </a>
                        </Button>
                      )}

                      {passo.canal === "email" && (
                        <Button
                          asChild
                          variant="secondary"
                          size="sm"
                          className="gap-1.5 text-xs h-8"
                        >
                          <a href={mailUrl || `mailto:${empresa.email || ""}`} target="_blank" rel="noreferrer">
                            <Mail className="h-3.5 w-3.5" />
                            Abrir no E-mail
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
