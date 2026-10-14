import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { useStore } from "@/lib/store";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { gerarPrompt, type TipoPrompt } from "@/lib/generators";
import { gerarPromptIA, toCtx } from "@/lib/ai.functions";
import { gerarSiteCompletoIA_ServerFn, type PesquisaWebSiteResult } from "@/lib/site-generator.server";
import { getApiSettings, type ProvedorIaTipo } from "@/lib/api-settings";
import {
  Copy,
  Wand2,
  Sparkles,
  Globe,
  Monitor,
  Tablet,
  Smartphone,
  ExternalLink,
  Download,
  Save,
  MessageCircle,
  Search,
  Check,
  Code2,
  Layers,
  ArrowRight,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { SitePreviewModal } from "@/components/site-preview-modal";

export const Route = createFileRoute("/prompts")({
  validateSearch: z.object({ empresa: z.string().optional() }),
  component: PromptsPage,
});

const TIPOS: { value: TipoPrompt; label: string; desc: string }[] = [
  { value: "site_novo", label: "Site novo", desc: "Briefing completo para criação de site" },
  { value: "site_redesign", label: "Redesign de site", desc: "Considera problemas do site atual" },
  { value: "ig_estrategia", label: "Estratégia Instagram", desc: "Posicionamento e pilares editoriais" },
  { value: "ig_posts", label: "Ideias de posts", desc: "Calendário inicial de 30 dias" },
];

function PromptsPage() {
  const { empresa: empresaId } = useSearch({ from: "/prompts" });
  const { empresas, updateEmpresa, addHistorico } = useStore();
  const [selected, setSelected] = useState<string>(empresaId ?? empresas[0]?.id ?? "");
  const [modoPrincipal, setModoPrincipal] = useState<"site" | "prompts">("site");
  const [tipo, setTipo] = useState<TipoPrompt>("site_novo");

  const empresa = empresas.find((e) => e.id === selected);

  // Estados dos Prompts Textuais
  const textoBase = useMemo(() => (empresa ? gerarPrompt(empresa, tipo) : ""), [empresa, tipo]);
  const [iaTexto, setIaTexto] = useState<Record<string, string>>({});
  const [loadingIA, setLoadingIA] = useState(false);
  const iaKey = `${selected}:${tipo}`;
  const texto = iaTexto[iaKey] ?? textoBase;

  // Estados do Gerador de Sites Completo
  const gerarSiteFn = useServerFn(gerarSiteCompletoIA_ServerFn);
  const [gerandoSite, setGerandoSite] = useState(false);
  const [siteHtml, setSiteHtml] = useState<string>(empresa?.siteGeradoHtml ?? "");
  const [pesquisaInfo, setPesquisaInfo] = useState<PesquisaWebSiteResult | null>(null);
  const [provedorUsado, setProvedorUsado] = useState<string>("");
  const [modeloUsado, setModeloUsado] = useState<string>("");
  const [provedorSelecionado, setProvedorSelecionado] = useState<ProvedorIaTipo>("auto");
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [copiedCode, setCopiedCode] = useState(false);
  const [savingSite, setSavingSite] = useState(false);
  const [modalFullscreenOpen, setModalFullscreenOpen] = useState(false);

  // Atualiza site exibido quando troca de empresa
  const handleSelectEmpresa = (id: string) => {
    setSelected(id);
    const emp = empresas.find((e) => e.id === id);
    setSiteHtml(emp?.siteGeradoHtml ?? "");
    setPesquisaInfo(null);
  };

  const handleGerarSite = async () => {
    if (!empresa) return;
    setGerandoSite(true);
    toast.info("Iniciando pesquisa web sobre a empresa e mercado local...");
    try {
      const apiSettings = getApiSettings();
      const customKeys = {
        groq: apiSettings.groq.key,
        gemini: apiSettings.gemini.key,
        openrouter: apiSettings.openrouter.key,
        lovable: apiSettings.lovable.key,
        ollamaBaseUrl: apiSettings.ollama.baseUrl,
      };

      const result = await gerarSiteFn({
        data: {
          empresa: toCtx(empresa),
          provedorPreferencial: provedorSelecionado !== "auto" ? (provedorSelecionado as any) : undefined,
          customKeys,
        },
      });

      setSiteHtml(result.html);
      setPesquisaInfo(result.pesquisaWeb);
      setProvedorUsado(result.provider);
      setModeloUsado(result.model);

      // Salva automaticamente no cadastro da empresa
      updateEmpresa(empresa.id, {
        siteGeradoHtml: result.html,
        siteGeradoData: new Date().toISOString(),
      });

      addHistorico(empresa.id, {
        data: new Date().toISOString().slice(0, 10),
        tipo: "nota",
        texto: `Site inovador gerado com IA (${result.provider}) com base em pesquisa web local e animações 21st.dev.`,
      });

      toast.success("Site gerado com sucesso com padrões 21st.dev e dados da internet!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar site.");
    } finally {
      setGerandoSite(false);
    }
  };

  const handleDownloadHtml = () => {
    if (!siteHtml || !empresa) return;
    const filename = `${empresa.nome.toLowerCase().replace(/[^a-z0-9]/g, "_")}_site.html`;
    const blob = new Blob([siteHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Arquivo ${filename} baixado!`);
  };

  const handleCopiarCodigo = async () => {
    if (!siteHtml) return;
    await navigator.clipboard.writeText(siteHtml);
    setCopiedCode(true);
    toast.success("Código HTML copiado!");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSalvarNoCrm = () => {
    if (!empresa || !siteHtml) return;
    setSavingSite(true);
    try {
      updateEmpresa(empresa.id, {
        siteGeradoHtml: siteHtml,
        siteGeradoData: new Date().toISOString(),
      });
      toast.success("Site salvo no banco de dados do CRM!");
    } finally {
      setSavingSite(false);
    }
  };

  const handleEnviarLeadWhatsApp = () => {
    if (!empresa) return;
    const telefone = (empresa.whatsapp || empresa.telefone || "").replace(/\D/g, "");
    const msg = `Olá! Aqui é da Locomotiva Comunicação. Desenvolvemos uma demonstração exclusiva de como pode ficar o novo site da *${empresa.nome}*, com design moderno e foco em aumento de vendas em ${empresa.cidade}.\n\nPodemos te apresentar uma rápida prévia sem compromisso?`;
    const url = `https://wa.me/55${telefone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 space-y-6 max-w-[1600px] mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" /> Estúdio de Sites & Prompts IA
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gere sites completos e interativos com pesquisa web e animações do <strong>21st.dev</strong>, ou copie briefings estruturados.
          </p>
        </div>

        {/* TABS PRINCIPAIS */}
        <div className="flex items-center gap-2">
          <Button
            variant={modoPrincipal === "site" ? "default" : "outline"}
            className="gap-2 text-xs h-9"
            onClick={() => setModoPrincipal("site")}
          >
            <Sparkles className="size-4" />
            <span>🎨 Gerar Site Completo (Demo ao Vivo)</span>
          </Button>
          <Button
            variant={modoPrincipal === "prompts" ? "default" : "outline"}
            className="gap-2 text-xs h-9"
            onClick={() => setModoPrincipal("prompts")}
          >
            <Wand2 className="size-4" />
            <span>📝 Prompts & Briefings</span>
          </Button>
        </div>
      </div>

      {/* SELETOR DE EMPRESA & RESUMO */}
      <div className="grid lg:grid-cols-[340px_1fr] gap-6">
        
        {/* COLUNA ESQUERDA: SELETOR DE EMPRESA & PROVEDOR */}
        <div className="space-y-4">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Layers className="size-4 text-primary" /> Empresa Selecionada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selected} onValueChange={handleSelectEmpresa}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nome} · {e.cidade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {empresa && (
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 space-y-2 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Segmento & Área:</span>
                    <span className="font-medium text-foreground">{empresa.segmento}</span>
                    {empresa.areaAtuacao && (
                      <span className="text-muted-foreground block text-[11px]">{empresa.areaAtuacao}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Localização:</span>
                    <span className="text-foreground">{empresa.cidade}/RS {empresa.bairro ? `· ${empresa.bairro}` : ""}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Status Digital:</span>
                    <Badge variant="outline" className="text-[10px] mt-0.5">
                      {empresa.statusSite === "sem_site" ? "Não possui site" : `Site ${empresa.statusSite}`}
                    </Badge>
                  </div>
                  {empresa.siteGeradoData && (
                    <div className="pt-2 border-t border-border/40 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <Check className="size-3" /> Site gerado em {new Date(empresa.siteGeradoData).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}

              {/* SELETOR DE PROVEDOR DE IA */}
              {modoPrincipal === "site" && (
                <div className="pt-3 border-t border-border/40 space-y-2">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase block">
                    Motor de IA (awesome-free-llm-apis):
                  </label>
                  <Select
                    value={provedorSelecionado}
                    onValueChange={(v) => setProvedorSelecionado(v as ProvedorIaTipo)}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">⚡ Automático (Melhor Rota + Fallback)</SelectItem>
                      <SelectItem value="groq">Groq (Llama 3.3 70B - Ultra Rápido)</SelectItem>
                      <SelectItem value="gemini">Google Gemini (1M Contexto)</SelectItem>
                      <SelectItem value="openrouter">OpenRouter Free (:free models)</SelectItem>
                      <SelectItem value="lovable">Lovable AI Gateway</SelectItem>
                      <SelectItem value="ollama">Ollama Local (Offline)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* CARD DE INSTRUÇÕES DE DESIGN */}
          {modoPrincipal === "site" && (
            <Card className="border-border/60 bg-gradient-to-br from-blue-500/5 to-purple-500/5">
              <CardContent className="p-4 space-y-2 text-xs">
                <div className="font-semibold text-foreground flex items-center gap-1.5 text-xs">
                  <Sparkles className="size-3.5 text-blue-500" /> Padrões 21st.dev Injetados:
                </div>
                <ul className="text-muted-foreground space-y-1 text-[11px] pl-1">
                  <li>• <strong>Spotlight Glow</strong> em cards sob o cursor</li>
                  <li>• <strong>Infinite Marquee</strong> contínuo de credibilidade</li>
                  <li>• <strong>Bento Grid</strong> com hierarquia e micro-interações</li>
                  <li>• <strong>Ambient Mesh</strong> no Hero com tipografia editorial</li>
                  <li>• <strong>WhatsApp Flutuante</strong> com pulso e texto nativo</li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* COLUNA DIREITA: CONTEÚDO PRINCIPAL */}
        <div>
          
          {/* ========================================================
              MODO 1: GERADOR DE SITE COMPLETO (DEMO AO VIVO)
             ======================================================== */}
          {modoPrincipal === "site" && (
            <div className="space-y-4">
              
              {/* BARRA DE AÇÃO PRINCIPAL */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-card border border-border/60 rounded-xl">
                <div>
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <Globe className="size-4 text-blue-500" /> Landing Page Interativa de Alta Conversão
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Pesquisa dados reais na internet para gerar designs sem cara de site genérico de IA.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleGerarSite}
                    disabled={!empresa || gerandoSite}
                    className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20 text-xs font-semibold"
                  >
                    <Sparkles className="size-3.5" />
                    <span>{gerandoSite ? "Pesquisando e Gerando..." : siteHtml ? "Regenerar Novo Design" : "✨ Gerar Site com IA"}</span>
                  </Button>
                </div>
              </div>

              {/* AREA DE PREVIEW DO SITE OU EMPTY STATE */}
              {siteHtml ? (
                <Card className="border-border/60 overflow-hidden shadow-sm">
                  {/* CONTROLES DO PREVIEW */}
                  <div className="p-3 px-4 border-b border-border/60 bg-muted/30 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex bg-muted rounded-lg p-0.5 border border-border/50">
                        <Button
                          size="icon"
                          variant={device === "desktop" ? "secondary" : "ghost"}
                          className="size-7"
                          onClick={() => setDevice("desktop")}
                          title="Desktop"
                        >
                          <Monitor className="size-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant={device === "tablet" ? "secondary" : "ghost"}
                          className="size-7"
                          onClick={() => setDevice("tablet")}
                          title="Tablet (768px)"
                        >
                          <Tablet className="size-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant={device === "mobile" ? "secondary" : "ghost"}
                          className="size-7"
                          onClick={() => setDevice("mobile")}
                          title="Mobile (375px)"
                        >
                          <Smartphone className="size-3.5" />
                        </Button>
                      </div>

                      {provedorUsado && (
                        <Badge variant="outline" className="text-[10px] font-mono hidden sm:inline-flex">
                          {provedorUsado}
                        </Badge>
                      )}
                    </div>

                    {/* BOTÕES DE AÇÃO DO SITE GERADO */}
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={() => setModalFullscreenOpen(true)}
                        title="Abrir em Tela Cheia"
                      >
                        <ExternalLink className="size-3.5" />
                        <span className="hidden sm:inline">Tela Cheia</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={handleCopiarCodigo}
                        title="Copiar Código HTML"
                      >
                        {copiedCode ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                        <span className="hidden sm:inline">{copiedCode ? "Copiado" : "Copiar"}</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={handleDownloadHtml}
                        title="Baixar HTML"
                      >
                        <Download className="size-3.5" />
                        <span className="hidden md:inline">Baixar HTML</span>
                      </Button>

                      <Button
                        size="sm"
                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white gap-1"
                        onClick={handleEnviarLeadWhatsApp}
                        title="Enviar demonstração para o WhatsApp do Lead"
                      >
                        <MessageCircle className="size-3.5" />
                        <span className="hidden sm:inline">Chamar Lead</span>
                      </Button>
                    </div>
                  </div>

                  {/* FRAME DO SITE */}
                  <div className="bg-slate-900 p-2 sm:p-4 flex items-center justify-center min-h-[640px] max-h-[820px] overflow-hidden">
                    <div
                      className={`h-[680px] transition-all duration-300 bg-white shadow-2xl overflow-hidden ${
                        device === "desktop"
                          ? "w-full rounded-lg"
                          : device === "tablet"
                          ? "w-[768px] rounded-xl border-4 border-slate-700"
                          : "w-[385px] rounded-2xl border-4 border-slate-700"
                      }`}
                    >
                      <iframe
                        title="Preview do Site Gerado"
                        srcDoc={siteHtml}
                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                        className="w-full h-full border-0"
                      />
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="border-border/60 border-dashed p-12 text-center space-y-4">
                  <div className="size-16 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto border border-blue-500/20">
                    <Globe className="size-8" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h3 className="font-bold text-base text-foreground">Nenhum site gerado para esta empresa ainda</h3>
                    <p className="text-xs text-muted-foreground">
                      Clique no botão acima para pesquisar automaticamente no Google e SerpApi sobre <strong>{empresa?.nome}</strong> e gerar uma landing page inovadora com animações 21st.dev.
                    </p>
                  </div>
                  <Button
                    onClick={handleGerarSite}
                    disabled={!empresa || gerandoSite}
                    className="gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                  >
                    <Sparkles className="size-3.5" />
                    <span>{gerandoSite ? "Gerando..." : "Gerar Agora com IA"}</span>
                  </Button>
                </Card>
              )}
            </div>
          )}

          {/* ========================================================
              MODO 2: PROMPTS & BRIEFINGS ESTRUTURADOS (TEXTUAIS)
             ======================================================== */}
          {modoPrincipal === "prompts" && (
            <Tabs value={tipo} onValueChange={(v) => setTipo(v as TipoPrompt)}>
              <TabsList className="flex flex-wrap h-auto">
                {TIPOS.map((t) => (
                  <TabsTrigger key={t.value} value={t.value}>
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {TIPOS.map((t) => (
                <TabsContent key={t.value} value={t.value} className="mt-4">
                  <Card className="border-border/60">
                    <CardHeader className="flex-row items-center justify-between pb-2">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Wand2 className="h-4 w-4 text-primary" />
                          {t.label}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={!empresa || loadingIA}
                          onClick={async () => {
                            if (!empresa) return;
                            setLoadingIA(true);
                            try {
                              const r = await gerarPromptIA({ data: { empresa: toCtx(empresa), tipo } });
                              setIaTexto((s) => ({ ...s, [iaKey]: r }));
                              toast.success("Prompt gerado com IA para a Locomotiva Comunicação!");
                            } catch (e) {
                              toast.error((e as Error).message);
                            } finally {
                              setLoadingIA(false);
                            }
                          }}
                        >
                          <Sparkles className="h-3.5 w-3.5 mr-1.5" />{" "}
                          {loadingIA ? "Gerando..." : "Gerar com IA"}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(texto);
                            toast.success("Prompt copiado");
                          }}
                        >
                          <Copy className="h-3.5 w-3.5 mr-1.5" /> Copiar
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Textarea value={texto} readOnly rows={22} className="font-mono text-xs" />
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          )}

        </div>
      </div>

      {/* MODAL FULLSCREEN / PREVIEW EXPANDIDO */}
      {empresa && siteHtml && (
        <SitePreviewModal
          empresa={empresa}
          html={siteHtml}
          pesquisaWeb={pesquisaInfo}
          providerUsed={provedorUsado}
          modelUsed={modeloUsado}
          open={modalFullscreenOpen}
          onOpenChange={setModalFullscreenOpen}
        />
      )}
    </div>
  );
}
