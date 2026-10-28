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
  FileText,
  Sparkles,
  Save,
  Copy,
  AlertTriangle,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  Layers,
  Eye,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { gerarConteudoSiteIA_ServerFn } from "@/lib/site-generator.server";
import { toCtx } from "@/lib/ai.functions";
import { getApiSettings } from "@/lib/api-settings";
import type { Empresa } from "@/lib/mock-data";
import { useNavigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";

interface ModalConteudoSiteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresa: Empresa;
  onSalvarConteudo: (conteudo: string) => void;
}

export function ModalConteudoSite({
  open,
  onOpenChange,
  empresa,
  onSalvarConteudo,
}: ModalConteudoSiteProps) {
  const navigate = useNavigate();
  const { promptConteudoConfig } = useStore();
  const gerarConteudoFn = useServerFn(gerarConteudoSiteIA_ServerFn);

  const [conteudo, setConteudo] = useState<string>(empresa.siteConteudoCustomizado || "");
  const [gerando, setGerando] = useState(false);
  const [tabAtiva, setTabAtiva] = useState<"editor" | "preview">("editor");

  // Sincroniza sempre que a empresa ou modal abrir
  useEffect(() => {
    if (open) {
      setConteudo(empresa.siteConteudoCustomizado || "");
    }
  }, [open, empresa.id, empresa.siteConteudoCustomizado]);

  // Checa se o lead possui Análise do Cliente realizada (Diagnóstico e Dossiê 360)
  const temAnalise = Boolean(
    empresa.dossier360 ||
      empresa.analiseAtualizadaEm ||
      empresa.relatorioLead ||
      (empresa.diagnostico && Object.keys(empresa.diagnostico).length > 0)
  );

  const handleGerarComIA = async () => {
    try {
      setGerando(true);
      toast.info("Gerando estrutura de seções e copys por IA...");

      const apiSettings = getApiSettings();
      const customKeys = {
        groq: apiSettings.groq.key,
        gemini: apiSettings.gemini.key,
        openrouter: apiSettings.openrouter.key,
        cerebras: apiSettings.cerebras.key,
        lovable: apiSettings.lovable.key,
        ollamaBaseUrl: apiSettings.ollama.baseUrl,
        openai: apiSettings.openai?.key,
        anthropic: apiSettings.anthropic?.key,
        perplexity: apiSettings.perplexity?.key,
      };

      const res = await gerarConteudoFn({
        data: {
          empresa: toCtx(empresa),
          diagnostico: empresa.diagnostico,
          dossier360: empresa.dossier360,
          relatorio: empresa.relatorioLead,
          customKeys,
          promptBaseOverride: promptConteudoConfig?.promptAtual,
        },
      });

      if (res.conteudoFormatado) {
        setConteudo(res.conteudoFormatado);
        toast.success("Estrutura e copys geradas com sucesso pela IA!");
      }
    } catch (err: any) {
      console.error("Erro ao gerar conteúdo por IA:", err);
      toast.error(`Falha ao gerar conteúdo: ${err?.message || "Erro desconhecido"}`);
    } finally {
      setGerando(false);
    }
  };

  const handleSalvar = () => {
    onSalvarConteudo(conteudo.trim());
    toast.success("Estrutura e conteúdo do site salvos com sucesso!");
    onOpenChange(false);
  };

  const handleCopiar = () => {
    if (!conteudo) {
      toast.error("Nenhum conteúdo para copiar.");
      return;
    }
    navigator.clipboard.writeText(conteudo);
    toast.success("Conteúdo copiado para a área de transferência!");
  };

  const handleIrParaAnalise = () => {
    onOpenChange(false);
    navigate({
      to: "/analise-cliente",
      search: { empresa: empresa.id } as never,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden">
        {/* CABEÇALHO */}
        <DialogHeader className="p-5 pb-3 border-b border-border/80 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-amber-500" />
                  <span>Estrutura de Seções & Conteúdo do Site (Copywriting)</span>
                </DialogTitle>
                <Badge variant="outline" className="text-xs font-normal border-amber-500/40 text-amber-600 dark:text-amber-400">
                  {empresa.nome}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground">
                Planeje a arquitetura de seções e as copys completas para cada bloco da Landing Page, baseadas nos dados do lead e na Análise do Cliente.
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] text-muted-foreground font-mono hidden sm:inline-flex items-center gap-1">
                <span>Instruções IA v{promptConteudoConfig?.historico?.[0]?.versao || 1}</span>
              </Badge>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGerarComIA}
                disabled={gerando}
                className="h-8 text-xs gap-1.5 border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-medium"
              >
                {gerando ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                <span>{conteudo ? "Regerar com IA" : "Gerar com IA"}</span>
              </Button>
            </div>
          </div>

          {/* ALERTA: ANÁLISE DO CLIENTE NÃO REALIZADA */}
          {!temAnalise && (
            <div className="mt-3 p-3 rounded-md border border-amber-500/40 bg-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-300">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold">Análise do Cliente ainda não foi realizada para este lead.</p>
                  <p className="text-[11px] text-muted-foreground dark:text-amber-300/80">
                    Para que a IA formule seções e argumentos precisos que resolvam dores reais e quebrem as objeções comerciais do cliente, faça a análise antes de gerar o site.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleIrParaAnalise}
                className="h-7 text-xs gap-1 shrink-0 border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20"
              >
                <span>Fazer Análise do Cliente</span>
                <ExternalLink className="h-3 w-3" />
              </Button>
            </div>
          )}
        </DialogHeader>

        {/* CORPO DO MODAL */}
        <div className="flex-1 overflow-hidden p-5 flex flex-col min-h-0 space-y-3">
          <Tabs
            value={tabAtiva}
            onValueChange={(v) => setTabAtiva(v as "editor" | "preview")}
            className="flex-1 flex flex-col min-h-0"
          >
            <div className="flex items-center justify-between mb-2">
              <TabsList className="h-8 p-0.5 bg-muted/60">
                <TabsTrigger value="editor" className="text-xs gap-1.5 h-7">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Editor & Estrutura</span>
                </TabsTrigger>
                <TabsTrigger value="preview" className="text-xs gap-1.5 h-7">
                  <Eye className="h-3.5 w-3.5" />
                  <span>Pré-visualização</span>
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {empresa.siteConteudoGeradoEm && (
                  <span className="text-[11px]">
                    Salvo em: {new Date(empresa.siteConteudoGeradoEm).toLocaleDateString("pt-BR")}
                  </span>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopiar}
                  disabled={!conteudo}
                  className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                >
                  <Copy className="h-3 w-3" />
                  <span>Copiar</span>
                </Button>
              </div>
            </div>

            <TabsContent value="editor" className="flex-1 mt-0 min-h-0 flex flex-col">
              <Textarea
                value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
                placeholder="Clique em 'Gerar com IA' acima para criar automaticamente a arquitetura de seções e as copys personalizadas com base na Análise do Cliente, ou digite livremente aqui o conteúdo..."
                className="flex-1 font-mono text-xs leading-relaxed resize-none p-3.5 bg-background border border-border/80 focus-visible:ring-1 focus-visible:ring-amber-500 rounded-md"
              />
              <p className="text-[11px] text-muted-foreground mt-1.5">
                💡 Este texto será enviado diretamente para a IA geradora do site através da diretriz de conteúdo, garantindo fidelidade total à estrutura e aos textos salvos.
              </p>
            </TabsContent>

            <TabsContent value="preview" className="flex-1 mt-0 min-h-0 overflow-y-auto p-4 rounded-md border border-border/80 bg-card">
              {conteudo ? (
                <div className="prose prose-sm dark:prose-invert max-w-none space-y-3 whitespace-pre-wrap font-sans text-xs leading-relaxed">
                  {conteudo}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                  <FileText className="h-10 w-10 text-muted-foreground/40 mb-2" />
                  <p className="text-sm font-medium">Nenhum conteúdo gerado ainda.</p>
                  <p className="text-xs text-muted-foreground/80 max-w-md mt-1">
                    Clique no botão &quot;Gerar com IA&quot; no topo para criar a arquitetura de seções e os textos completos do site com base nos dados do lead e na Análise do Cliente.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* RODAPÉ */}
        <div className="p-4 border-t border-border/80 bg-muted/20 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-8"
          >
            Cancelar
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleSalvar}
              disabled={gerando}
              className="text-xs h-8 gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Salvar Alterações</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
