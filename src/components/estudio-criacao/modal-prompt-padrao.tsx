import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sliders, Copy, RotateCcw, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PROMPT_PADRAO_BASE } from "@/lib/prompt-padrao-config";

interface ModalPromptPadraoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promptAtual: string;
  versaoAtual?: number;
  onSalvar: (novoPrompt: string, motivo?: string) => Promise<void> | void;
}

export function ModalPromptPadrao({
  open,
  onOpenChange,
  promptAtual,
  versaoAtual,
  onSalvar,
}: ModalPromptPadraoProps) {
  const [texto, setTexto] = useState(promptAtual || PROMPT_PADRAO_BASE);
  const [motivo, setMotivo] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (open) {
      setTexto(promptAtual || PROMPT_PADRAO_BASE);
      setMotivo("");
    }
  }, [open, promptAtual]);

  const handleRestaurar = () => {
    setTexto(PROMPT_PADRAO_BASE);
    toast.info("Prompt restaurado para o padrão mestre do sistema.");
  };

  const handleCopiar = () => {
    navigator.clipboard.writeText(texto);
    toast.success("Prompt copiado para a área de transferência!");
  };

  const handleSalvar = async () => {
    if (!texto.trim()) {
      toast.error("O prompt padrão não pode ficar vazio.");
      return;
    }
    try {
      setSalvando(true);
      await onSalvar(texto.trim(), motivo.trim() || undefined);
      toast.success("Prompt Padrão salvo com sucesso no banco de dados e adicionado ao histórico!");
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Erro ao salvar prompt: " + (err?.message || "Erro desconhecido"));
    } finally {
      setSalvando(false);
    }
  };

  const foiModificado = texto.trim() !== PROMPT_PADRAO_BASE.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-5 pb-3 border-b border-border/80 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-primary" />
                  <span>Prompt Padrão (Engenharia, Design & Regras de Código)</span>
                </DialogTitle>
                {versaoAtual && (
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]">
                    v{versaoAtual} (Banco)
                  </Badge>
                )}
                {foiModificado ? (
                  <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30 bg-amber-500/10">
                    Customizado
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px]">
                    Padrão Mestre
                  </Badge>
                )}
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Define o papel da IA, regras de layout One-Page, motion design, boas práticas técnicas, proibições e diretrizes de imagens.
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRestaurar}
                disabled={salvando}
                className="h-8 text-xs gap-1"
                title="Restaurar prompt padrão de fábrica"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Restaurar</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopiar}
                className="h-8 text-xs gap-1"
                title="Copiar prompt completo"
              >
                <Copy className="h-3 w-3" />
                <span>Copiar</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden p-5 flex flex-col min-h-0 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Você pode editar e salvar qualquer regra abaixo livremente:</span>
            <span className="font-mono text-[11px]">{texto.length.toLocaleString()} caracteres</span>
          </div>

          <Textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="flex-1 font-mono text-xs leading-relaxed resize-none p-3.5 bg-background border border-border/80 focus-visible:ring-1 focus-visible:ring-primary rounded-md min-h-[340px] h-[48vh]"
            placeholder="Insira as regras do prompt padrão..."
          />

          <div className="pt-1">
            <Input
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Motivo da alteração no histórico (opcional, ex: Ajuste de tipografia e hero)..."
              className="text-xs h-8 bg-muted/20"
            />
          </div>
        </div>

        <div className="p-4 border-t border-border/80 bg-muted/20 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={salvando}
            className="text-xs h-8"
          >
            Cancelar
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleSalvar}
            disabled={salvando}
            className="text-xs h-8 gap-1.5 font-medium bg-gradient-to-r from-blue-600 via-indigo-600 to-primary text-white"
          >
            {salvando ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span>{salvando ? "Salvando no Banco..." : "Salvar no Banco de Dados"}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
