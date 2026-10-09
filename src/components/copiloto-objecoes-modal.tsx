import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Copy,
  Send,
  Check,
  BrainCircuit,
} from "lucide-react";
import { toast } from "sonner";
import { toCtx } from "@/lib/ai.functions";
import {
  OBTACOES_COMUNS,
  gerarRespostasObjecao_IA,
  type CopilotoObjecaoResult,
} from "@/lib/objecoes-copilot.functions";
import { whatsappUrl } from "@/lib/links";
import type { Empresa } from "@/lib/mock-data";

interface CopilotoObjecoesModalProps {
  empresa: Empresa | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nomeAgencia?: string;
}

export function CopilotoObjecoesModal({
  empresa,
  open,
  onOpenChange,
  nomeAgencia = "Locomotiva Comunicação",
}: CopilotoObjecoesModalProps) {
  const [objecaoTexto, setObjecaoTexto] = useState<string>(
    "Achei o valor elevado para o momento da nossa empresa.",
  );
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<CopilotoObjecaoResult | null>(null);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  if (!empresa) return null;

  const handleSelectPredefinida = (id: string) => {
    const item = OBTACOES_COMUNS.find((o) => o.id === id);
    if (item) {
      setObjecaoTexto(item.exemplo);
    }
  };

  const handleGerarRespostas = async () => {
    if (!objecaoTexto.trim()) {
      toast.error("Informe a objeção recebida do cliente.");
      return;
    }
    setLoading(true);
    try {
      const res = await gerarRespostasObjecao_IA({
        data: {
          empresa: toCtx(empresa),
          objecao: objecaoTexto.trim(),
          canal: "whatsapp",
          nomeAgencia,
        },
      });
      setResultado(res);
      toast.success("Respostas estratégicas geradas pelo Copiloto de IA!");
    } catch (err) {
      toast.error("Erro ao gerar respostas com IA. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const copiarTexto = (id: string, texto: string) => {
    navigator.clipboard.writeText(texto);
    setCopiadoId(id);
    toast.success("Resposta copiada para a área de transferência!");
    setTimeout(() => setCopiadoId(null), 2500);
  };

  const waUrl = (texto: string) => {
    const base = whatsappUrl(empresa.whatsapp);
    if (!base) return undefined;
    return `${base}?text=${encodeURIComponent(texto)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                Copiloto de Quebra de Objeções — {empresa.nome}
              </DialogTitle>
              <DialogDescription>
                A IA analisa a objeção do cliente e gera 3 respostas inteligentes sob medida (ROI, Solução 360 e Baixa Fricção).
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Objeções Prontas */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
              Escolher Objeção Típica ou Digitar Abaixo:
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {OBTACOES_COMUNS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => handleSelectPredefinida(o.id)}
                  className="text-xs px-2.5 py-1 rounded-full border bg-muted/50 hover:bg-primary/10 hover:border-primary transition-colors text-left"
                >
                  {o.label}
                </button>
              ))}
            </div>
            <Textarea
              value={objecaoTexto}
              onChange={(e) => setObjecaoTexto(e.target.value)}
              placeholder="Ex: 'Já tenho uma agência que cuida disso', 'Achei caro', 'Me manda por e-mail'..."
              rows={2}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleGerarRespostas}
              disabled={loading}
              className="gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow"
            >
              <Sparkles className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Copiloto Analisando..." : "Gerar Respostas Estratégicas"}
            </Button>
          </div>

          {resultado && (
            <div className="space-y-4 pt-4 border-t">
              {/* Diagnóstico da IA sobre a objeção */}
              {resultado.analiseIA && (
                <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-950 dark:text-amber-200">
                  <span className="font-semibold block mb-0.5">🧠 Análise Psicológica da IA:</span>
                  {resultado.analiseIA}
                </div>
              )}

              {/* Opções de Resposta */}
              <div className="space-y-3">
                {resultado.opcoes.map((opcao, index) => {
                  const sendUrl = waUrl(opcao.texto);
                  return (
                    <div
                      key={opcao.id || index}
                      className="p-4 rounded-xl border bg-card/70 hover:border-primary/40 transition-all space-y-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
                            Opção {index + 1}: {opcao.angulo}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-medium">
                            Gatilho: {opcao.gatilho}
                          </span>
                        </div>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          🎯 Meta: {opcao.proximoPasso}
                        </span>
                      </div>

                      <div className="p-3 bg-muted/40 rounded-lg text-sm whitespace-pre-line leading-relaxed font-sans border border-border/50">
                        {opcao.texto}
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copiarTexto(opcao.id, opcao.texto)}
                          className="gap-1.5 text-xs h-8"
                        >
                          {copiadoId === opcao.id ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                              Copiado!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              Copiar Resposta
                            </>
                          )}
                        </Button>

                        {sendUrl && (
                          <Button
                            asChild
                            size="sm"
                            className="gap-1.5 text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <a href={sendUrl} target="_blank" rel="noreferrer">
                              <Send className="h-3.5 w-3.5" />
                              Enviar no WhatsApp
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
