import { useState, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wand2, Sparkles, Copy, Check, MessageSquare, Globe, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useServerFn } from "@tanstack/react-start";
import { gerarPrompt, type TipoPrompt } from "@/lib/generators";
import { gerarPromptIA, toCtx } from "@/lib/ai.functions";
import { gerarSiteCompletoIA_ServerFn, type PesquisaWebSiteResult } from "@/lib/site-generator.server";
import { getApiSettings } from "@/lib/api-settings";
import { SitePreviewModal } from "@/components/site-preview-modal";
import type { Empresa } from "@/lib/mock-data";

export const PROMPT_TIPOS: { value: TipoPrompt; label: string; desc: string }[] = [
  { value: "site_novo", label: "Site novo", desc: "Briefing completo para criação de site de alta conversão" },
  { value: "site_redesign", label: "Redesign de site", desc: "Considera problemas e gargalos do site atual" },
  { value: "ig_estrategia", label: "Estratégia Instagram", desc: "Posicionamento de autoridade e pilares editoriais" },
  { value: "ig_posts", label: "Ideias de posts", desc: "Calendário inicial de 30 dias focado em vendas" },
];

interface PromptsModalProps {
  empresa: Empresa | null | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PromptsModal({ empresa, open, onOpenChange }: PromptsModalProps) {
  const navigate = useNavigate();
  const { addHistorico, updateEmpresa } = useStore();
  const [tipo, setTipo] = useState<TipoPrompt>("site_novo");
  const [iaTexto, setIaTexto] = useState<Record<string, string>>({});
  const [loadingIA, setLoadingIA] = useState(false);
  const [copied, setCopied] = useState(false);

  // Geração de site ao vivo diretamente do modal
  const gerarSiteFn = useServerFn(gerarSiteCompletoIA_ServerFn);
  const [gerandoSite, setGerandoSite] = useState(false);
  const [siteHtml, setSiteHtml] = useState<string>(empresa?.siteGeradoHtml ?? "");
  const [pesquisaWeb, setPesquisaWeb] = useState<PesquisaWebSiteResult | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const textoBase = useMemo(
    () => (empresa ? gerarPrompt(empresa, tipo) : ""),
    [empresa, tipo],
  );
  const iaKey = `${empresa?.id ?? ""}:${tipo}`;
  const texto = iaTexto[iaKey] ?? textoBase;
  const isIA = !!iaTexto[iaKey];

  if (!empresa) return null;

  const tipoLabel = PROMPT_TIPOS.find((t) => t.value === tipo)?.label ?? tipo;

  const gerarIA = async () => {
    setLoadingIA(true);
    try {
      const r = await gerarPromptIA({ data: { empresa: toCtx(empresa), tipo } });
      setIaTexto((s) => ({ ...s, [iaKey]: r }));
      toast.success("Prompt gerado com IA para a Locomotiva Comunicação!");
    } catch (e: any) {
      toast.error(e.message || "Falha ao gerar prompt.");
    } finally {
      setLoadingIA(false);
    }
  };

  const copiar = async () => {
    await navigator.clipboard.writeText(texto);
    setCopied(true);
    toast.success("Prompt copiado para a área de transferência!");
    setTimeout(() => setCopied(false), 1500);
  };

  const salvarHistorico = () => {
    const preview = texto.slice(0, 220).replace(/\s+/g, " ").trim();
    addHistorico(empresa.id, {
      data: new Date().toISOString().slice(0, 10),
      tipo: "nota",
      texto: `Prompt IA · ${tipoLabel}${isIA ? " (gerado com IA)" : " (template)"}: ${preview}${texto.length > 220 ? "…" : ""}`,
    });
    toast.success("Prompt registrado no histórico da empresa!");
  };

  const dispararGeradorSite = async () => {
    setGerandoSite(true);
    toast.info("Pesquisando na web e gerando site no padrão 21st.dev...");
    try {
      const apiSettings = getApiSettings();
      const customKeys = {
        groq: apiSettings.groq.key,
        gemini: apiSettings.gemini.key,
        openrouter: apiSettings.openrouter.key,
        lovable: apiSettings.lovable.key,
        ollamaBaseUrl: apiSettings.ollama.baseUrl,
      };

      const res = await gerarSiteFn({
        data: {
          empresa: toCtx(empresa),
          customKeys,
        },
      });

      setSiteHtml(res.html);
      setPesquisaWeb(res.pesquisaWeb);
      updateEmpresa(empresa.id, {
        siteGeradoHtml: res.html,
        siteGeradoData: new Date().toISOString(),
      });
      setPreviewOpen(true);
      toast.success("Site gerado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar site.");
    } finally {
      setGerandoSite(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden">
          <DialogHeader className="p-5 pb-3 border-b bg-gradient-to-br from-primary/5 to-transparent flex-row items-center justify-between">
            <div className="min-w-0 pr-4">
              <DialogTitle className="text-xl truncate flex items-center gap-2">
                <Wand2 className="size-4 text-primary" /> Prompts & Gerador IA · {empresa.nome}
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs">
                {empresa.segmento} · {empresa.areaAtuacao || "Área Especializada"} · {empresa.cidade}/RS
              </DialogDescription>
            </div>

            {/* BOTÃO DE DESTAQUE: GERAR SITE COMPLETO */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="gap-1.5 text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-sm"
                onClick={dispararGeradorSite}
                disabled={gerandoSite}
              >
                <Globe className="size-3.5" />
                <span>{gerandoSite ? "Gerando Site..." : "🎨 Gerar Site Completo"}</span>
              </Button>
            </div>
          </DialogHeader>

          {/* BANNER INFORMATIVO */}
          <div className="px-5 py-2.5 bg-blue-500/5 border-b border-border/50 flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-blue-500" />
              Deseja criar a landing page funcional com animações 21st.dev?
            </span>
            <Button
              size="sm"
              variant="link"
              className="h-auto p-0 text-xs text-blue-600 dark:text-blue-400 gap-1 font-semibold"
              onClick={() => {
                onOpenChange(false);
                navigate({ to: "/analise-cliente", search: { empresa: empresa.id, tab: "site" } });
              }}
            >
              Abrir no Estúdio Completo <ExternalLink className="size-3" />
            </Button>
          </div>

          <Tabs value={tipo} onValueChange={(v) => setTipo(v as TipoPrompt)} className="w-full">
            <TabsList className="rounded-none w-full justify-start px-5 h-10 border-b bg-transparent flex-wrap gap-1">
              {PROMPT_TIPOS.map((t) => (
                <TabsTrigger key={t.value} value={t.value} className="text-xs">
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {PROMPT_TIPOS.map((t) => (
              <TabsContent key={t.value} value={t.value} className="m-0 p-5 space-y-3">
                <p className="text-xs text-muted-foreground">{t.desc}</p>
                <Textarea
                  value={texto}
                  readOnly
                  rows={13}
                  className="font-mono text-xs leading-relaxed"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" onClick={gerarIA} disabled={loadingIA} className="gap-1.5 text-xs">
                    <Sparkles className="size-3.5" />
                    {loadingIA ? "Gerando..." : isIA ? "Regenerar com IA" : "Gerar com IA"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={copiar} className="gap-1.5 text-xs">
                    {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                    {copied ? "Copiado" : "Copiar Prompt"}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={salvarHistorico} className="gap-1.5 text-xs">
                    <MessageSquare className="size-3.5" /> Salvar no Histórico
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* PREVIEW DO SITE GERADO SE DISPARADO PELO MODAL */}
      {previewOpen && siteHtml && (
        <SitePreviewModal
          empresa={empresa}
          html={siteHtml}
          pesquisaWeb={pesquisaWeb}
          providerUsed="21st.dev Engine"
          open={previewOpen}
          onOpenChange={setPreviewOpen}
        />
      )}
    </>
  );
}
