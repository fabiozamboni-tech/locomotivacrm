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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Sparkles,
  Copy,
  RotateCcw,
  Send,
  ShieldCheck,
  Cpu,
  Layers,
  FileCode,
} from "lucide-react";
import { toast } from "sonner";

interface ModalRefinarPromptIaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresaNome: string;
  agenteNome: string;
  modeloNome: string;
  usarAntiIaBespoke: boolean;
  skillsAtivasCount: number;
  motorScroll?: "nenhum" | "gsap_lenis_split" | "scrollcraft_canvas" | "scrollcraft_dimensional";
  conteudoSite?: string;
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
  usarAntiIaBespoke,
  skillsAtivasCount,
  motorScroll,
  conteudoSite,
  initialPromptSystem,
  initialPromptUser,
  onConfirmarEGerar,
  gerando,
}: ModalRefinarPromptIaProps) {
  const [tabAtiva, setTabAtiva] = useState<"system" | "user" | "conteudo" | "unificado">("system");
  const [promptSystem, setPromptSystem] = useState(initialPromptSystem);
  const [promptUser, setPromptUser] = useState(initialPromptUser);

  // Sincroniza sempre que os prompts iniciais mudarem ou a modal for aberta
  useEffect(() => {
    if (open) {
      setPromptSystem(initialPromptSystem);
      setPromptUser(initialPromptUser);
    }
  }, [open, initialPromptSystem, initialPromptUser]);

  const handleRestaurarPadrao = () => {
    setPromptSystem(initialPromptSystem);
    setPromptUser(initialPromptUser);
    toast.info("Prompt restaurado para o formato padrão do sistema.");
  };

  const promptUnificado = `=== PROMPT DO SISTEMA (SYSTEM INSTRUCTIONS) ===\n\n${promptSystem}\n\n=== PROMPT DO USUÁRIO (NICHO & ESPECIFICAÇÕES) ===\n\n${promptUser}`;

  const handleCopiar = (texto: string) => {
    navigator.clipboard.writeText(texto);
    toast.success("Prompt copiado para a área de transferência!");
  };

  const handleDispararGeracao = () => {
    onConfirmarEGerar({
      promptSystem: promptSystem.trim(),
      promptUser: promptUser.trim(),
    });
    onOpenChange(false);
  };

  const foiEditado =
    promptSystem !== initialPromptSystem || promptUser !== initialPromptUser;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-5 pb-3 border-b border-border/80 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>Prompt de Geração do Site</span>
                </DialogTitle>
                <span className="text-sm font-semibold text-primary">· {empresaNome}</span>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Revise e refine manualmente todas as instruções antes de enviar para o LLM. Todas as regras Anti-IA Bespoke, Skills e diagnósticos estão consolidados.
              </DialogDescription>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap shrink-0">
              <Badge variant="outline" className="text-[10px] gap-1 border-primary/30 text-primary">
                <Cpu className="h-2.5 w-2.5" />
                {agenteNome} ({modeloNome})
              </Badge>
              <Badge
                variant={usarAntiIaBespoke ? "default" : "outline"}
                className="text-[10px] gap-1"
              >
                <ShieldCheck className="h-2.5 w-2.5" />
                {usarAntiIaBespoke ? "Anti-IA Ativo" : "Geração Livre"}
              </Badge>
              <Badge variant="secondary" className="text-[10px] gap-1">
                <Layers className="h-2.5 w-2.5" />
                {skillsAtivasCount} Skill{skillsAtivasCount === 1 ? "" : "s"}
              </Badge>
              {motorScroll && (
                <Badge variant="outline" className="text-[10px] gap-1 border-blue-500/30 text-blue-600 bg-blue-500/5">
                  {motorScroll === "scrollcraft_canvas"
                    ? "ScrollCraft (Apple Canvas)"
                    : motorScroll === "scrollcraft_dimensional"
                    ? "Scroll-Craft Dimensional"
                    : motorScroll === "gsap_lenis_split"
                    ? "GSAP Editorial"
                    : "Nenhum (Rolagem Nativa)"}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <Tabs value={tabAtiva} onValueChange={(v) => setTabAtiva(v as any)} className="w-full">
            <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
              <TabsList className="grid grid-cols-4 h-8 w-[490px]">
                <TabsTrigger value="system" className="text-xs">
                  Prompt do Sistema
                </TabsTrigger>
                <TabsTrigger value="user" className="text-xs">
                  Prompt do Usuário
                </TabsTrigger>
                <TabsTrigger value="conteudo" className="text-xs flex items-center gap-1">
                  <span>Conteúdo & Copy</span>
                  {conteudoSite && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  )}
                </TabsTrigger>
                <TabsTrigger value="unificado" className="text-xs">
                  Visão Geral
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                {foiEditado && (
                  <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30 bg-amber-500/10">
                    Modificado pelo usuário
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRestaurarPadrao}
                  className="h-7 text-xs gap-1"
                  title="Restaurar prompt original montado pelo sistema"
                >
                  <RotateCcw className="h-3 w-3" />
                  Restaurar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleCopiar(
                      tabAtiva === "system"
                        ? promptSystem
                        : tabAtiva === "user"
                          ? promptUser
                          : tabAtiva === "conteudo"
                            ? (conteudoSite || "Nenhum conteúdo salvo no botão Conteúdo ainda.")
                            : promptUnificado,
                    )
                  }
                  className="h-7 text-xs gap-1"
                  title="Copiar conteúdo atual"
                >
                  <Copy className="h-3 w-3" />
                  Copiar
                </Button>
              </div>
            </div>

            {/* TAB: PROMPT DO SISTEMA */}
            <TabsContent value="system" className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Define o papel do arquiteto frontend, regras Anti-IA, habilidades ativas, GSAP, SplitType e Tailwind CSS.
                </span>
                <span className="font-mono text-[11px]">{promptSystem.length} caracteres</span>
              </div>
              <Textarea
                value={promptSystem}
                onChange={(e) => setPromptSystem(e.target.value)}
                rows={16}
                className="w-full font-mono text-xs leading-relaxed bg-background/90 p-3 rounded-lg border border-border resize-y"
                placeholder="Insira as instruções do sistema..."
              />
            </TabsContent>

            {/* TAB: PROMPT DO USUÁRIO */}
            <TabsContent value="user" className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Contém os dados reais da empresa, diagnóstico, relatório, personas do Dossiê 360 e pesquisa web.
                </span>
                <span className="font-mono text-[11px]">{promptUser.length} caracteres</span>
              </div>
              <Textarea
                value={promptUser}
                onChange={(e) => setPromptUser(e.target.value)}
                rows={16}
                className="w-full font-mono text-xs leading-relaxed bg-background/90 p-3 rounded-lg border border-border resize-y"
                placeholder="Insira as especificações do nicho e dados do cliente..."
              />
            </TabsContent>

            {/* TAB: CONTEÚDO E COPY DO SITE (BOTÃO CONTEÚDO) */}
            <TabsContent value="conteudo" className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Estrutura de seções e copys persuasivas geradas e salvas no botão &quot;Conteúdo&quot;.
                </span>
                <span className="font-mono text-[11px]">
                  {conteudoSite ? `${conteudoSite.length} caracteres` : "Sem conteúdo salvo"}
                </span>
              </div>
              {conteudoSite ? (
                <div className="space-y-2">
                  <div className="p-2.5 rounded-md border border-amber-500/30 bg-amber-500/10 text-xs text-amber-800 dark:text-amber-300">
                    <p className="font-semibold flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Este conteúdo está injetado diretamente no Prompt do Usuário!</span>
                    </p>
                    <p className="text-[11px] mt-0.5 opacity-90">
                      A IA geradora utilizará obrigatoriamente estes textos, títulos, especialidades e CTAs ao gerar o código da página.
                    </p>
                  </div>
                  <pre className="w-full max-h-[360px] overflow-auto font-mono text-xs leading-relaxed bg-background/90 p-3.5 rounded-lg border border-border resize-y whitespace-pre-wrap select-text">
                    {conteudoSite}
                  </pre>
                </div>
              ) : (
                <div className="p-8 text-center rounded-lg border border-dashed border-border flex flex-col items-center justify-center">
                  <p className="text-xs font-medium text-foreground">Nenhuma copy customizada definida ainda.</p>
                  <p className="text-[11px] text-muted-foreground max-w-sm mt-1">
                    Você pode utilizar o botão &quot;Conteúdo&quot; no painel principal para gerar e salvar a arquitetura de seções e as copys com base na Análise do Cliente.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* TAB: VISÃO UNIFICADA */}
            <TabsContent value="unificado" className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Visualização consolidada de todo o conteúdo que será processado pela IA.
                </span>
                <span className="font-mono text-[11px]">
                  {promptUnificado.length} caracteres totais
                </span>
              </div>
              <pre className="w-full max-h-[420px] overflow-auto font-mono text-xs leading-relaxed bg-muted/40 p-3 rounded-lg border border-border/80 whitespace-pre-wrap select-text">
                {promptUnificado}
              </pre>
            </TabsContent>
          </Tabs>
        </div>

        <div className="p-4 border-t border-border/80 bg-muted/20 flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <FileCode className="h-3.5 w-3.5 text-primary" />
            <span>
              Você pode alterar o texto à vontade. O site será criado com suas edições exatas.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleDispararGeracao}
              disabled={gerando}
              className="h-8 text-xs gap-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-primary text-white shadow-xs"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Gerar Site com este Prompt</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
