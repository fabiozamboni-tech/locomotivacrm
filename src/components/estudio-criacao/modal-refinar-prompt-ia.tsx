import { useState, useEffect } from "react";
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
  RotateCcw,
  Send,
  Cpu,
  FileCode,
  CheckCircle2,
  Sliders,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

interface ModalRefinarPromptIaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresaNome: string;
  agenteNome: string;
  modeloNome: string;
  initialPromptFinal: string;
  initialPromptSystem: string;
  initialPromptUser: string;
  onConfirmarEGerar: (promptCustomizado: {
    promptSystem: string;
    promptUser: string;
  }) => void;
  gerando: boolean;
}

export function ModalRefinarPromptIa({
  open,
  onOpenChange,
  empresaNome,
  agenteNome,
  modeloNome,
  initialPromptFinal,
  initialPromptSystem,
  initialPromptUser,
  onConfirmarEGerar,
  gerando,
}: ModalRefinarPromptIaProps) {
  const [promptFinal, setPromptFinal] = useState(
    initialPromptFinal ||
      `=== PROMPT DO SISTEMA (PROMPT PADRÃO) ===\n\n${initialPromptSystem}\n\n=== PROMPT DO USUÁRIO (CONTEÚDO & BRIEFING) ===\n\n${initialPromptUser}`
  );

  useEffect(() => {
    if (open) {
      setPromptFinal(
        initialPromptFinal ||
          `=== PROMPT DO SISTEMA (PROMPT PADRÃO) ===\n\n${initialPromptSystem}\n\n=== PROMPT DO USUÁRIO (CONTEÚDO & BRIEFING) ===\n\n${initialPromptUser}`
      );
    }
  }, [open, initialPromptFinal, initialPromptSystem, initialPromptUser]);

  const handleRestaurarPadrao = () => {
    const padrao =
      initialPromptFinal ||
      `=== PROMPT DO SISTEMA (PROMPT PADRÃO) ===\n\n${initialPromptSystem}\n\n=== PROMPT DO USUÁRIO (CONTEÚDO & BRIEFING) ===\n\n${initialPromptUser}`;
    setPromptFinal(padrao);
    toast.info("Prompt restaurado para a junção padrão.");
  };

  const handleCopiar = () => {
    navigator.clipboard.writeText(promptFinal);
    toast.success("Prompt final copiado para a área de transferência!");
  };

  const handleDispararGeracao = () => {
    // Se o usuário editou, divide respeitando os marcadores ou envia como override
    const marker = "=== PROMPT DO USUÁRIO (CONTEÚDO & BRIEFING) ===";
    if (promptFinal.includes(marker)) {
      const parts = promptFinal.split(marker);
      const sys = parts[0]
        .replace("=== PROMPT DO SISTEMA (PROMPT PADRÃO) ===", "")
        .trim();
      const usr = parts[1].trim();
      onConfirmarEGerar({
        promptSystem: sys || initialPromptSystem,
        promptUser: usr || initialPromptUser,
      });
    } else {
      // Se alterou tudo sem marcador, envia o texto como promptUser com promptSystem padrão
      onConfirmarEGerar({
        promptSystem: initialPromptSystem,
        promptUser: promptFinal.trim(),
      });
    }
    onOpenChange(false);
  };

  const defaultCombined =
    initialPromptFinal ||
    `=== PROMPT DO SISTEMA (PROMPT PADRÃO) ===\n\n${initialPromptSystem}\n\n=== PROMPT DO USUÁRIO (CONTEÚDO & BRIEFING) ===\n\n${initialPromptUser}`;
  const foiEditado = promptFinal.trim() !== defaultCombined.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-5 pb-3 border-b border-border/80 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span>Prompt Final de Geração do Site</span>
                </DialogTitle>
                <Badge variant="outline" className="text-xs font-semibold text-primary border-primary/30">
                  {empresaNome}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Este é o prompt final consolidado que será enviado à IA. Ele une diretamente as diretrizes do seu <strong>Prompt Padrão</strong> com a <strong>Estrutura de Seções e Conteúdo</strong> definidos para este lead.
              </DialogDescription>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap shrink-0">
              <Badge variant="outline" className="text-[10px] gap-1 border-primary/30 text-primary">
                <Cpu className="h-3 w-3" />
                <span>{agenteNome}</span>
              </Badge>
              <Badge variant="secondary" className="text-[10px] gap-1">
                <Sliders className="h-3 w-3" />
                <span>Prompt Padrão</span>
              </Badge>
              <Badge variant="secondary" className="text-[10px] gap-1 border-amber-500/30 text-amber-600 dark:text-amber-400">
                <FileText className="h-3 w-3" />
                <span>Conteúdo</span>
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden p-5 flex flex-col min-h-0 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Texto final consolidado para envio:</span>
              {foiEditado && (
                <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30 bg-amber-500/10">
                  Modificado manualmente
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px]">{promptFinal.length} caracteres</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRestaurarPadrao}
                className="h-6 px-2 text-[10px] gap-1"
                title="Restaurar junção original"
              >
                <RotateCcw className="h-2.5 w-2.5" />
                <span>Restaurar</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopiar}
                className="h-6 px-2 text-[10px] gap-1"
                title="Copiar prompt final"
              >
                <Copy className="h-2.5 w-2.5" />
                <span>Copiar</span>
              </Button>
            </div>
          </div>

          <Textarea
            value={promptFinal}
            onChange={(e) => setPromptFinal(e.target.value)}
            className="flex-1 font-mono text-xs leading-relaxed resize-none p-3.5 bg-background border border-border/80 focus-visible:ring-1 focus-visible:ring-primary rounded-md min-h-[400px] h-[58vh]"
            placeholder="Prompt final que será enviado à IA..."
          />
        </div>

        <div className="p-4 border-t border-border/80 bg-muted/20 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-8"
          >
            Cancelar
          </Button>

          <Button
            size="sm"
            onClick={handleDispararGeracao}
            disabled={gerando}
            className="text-xs h-8 gap-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-primary text-white font-semibold shadow-xs hover:opacity-90"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Gerar Site com este Prompt</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
