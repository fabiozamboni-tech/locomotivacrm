import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { useServerFn } from "@tanstack/react-start";
import { cn } from "@/lib/utils";
import { testApiConnection, type ApiTestResult } from "@/lib/api-status.functions";
import {
  getApiSettings,
  saveApiSetting,
  saveProvedorIaAtivo,
  saveCotasDiarias,
  type ApiSettingsMap,
  type ProvedorIaTipo,
  type ApiProviderKey,
} from "@/lib/api-settings";
import {
  obterResumoSaldo,
  resetarConsumoHoje,
  type CotasDiariasConfig,
} from "@/lib/ai-quota-guard";
import {
  getComunicacaoSettings,
  saveComunicacaoSettings,
  type ComunicacaoSettings,
  type RespostaAutomaticaItem,
} from "@/lib/comunicacao-settings";
import {
  enviarEmailDireto_ServerFn,
  dispararWhatsApp_ServerFn,
  testarConexaoEvolution_ServerFn,
  type TesteConexaoEvolutionResult,
} from "@/lib/comunicacao.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEFAULT_WEIGHTS, type ScoreWeights } from "@/lib/scoring";
import { toast } from "sonner";
import {
  AlertTriangle,
  Database,
  RotateCcw,
  Key,
  Globe,
  Sparkles,
  Server,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff,
  Mail,
  MessageCircle,
  Sliders,
  Send,
  Plus,
  Trash2,
  Zap,
  Download,
  HardDrive,
  Cloud,
  Clock,
  ExternalLink,
  HelpCircle,
  Copy,
  Check,
  BookOpen,
  Terminal,
} from "lucide-react";

export const Route = createFileRoute("/configuracoes")({
  component: ConfiguracoesPage,
});

const LABELS: Record<keyof ScoreWeights, string> = {
  semSite: "Não possui site",
  siteDesatualizado: "Site com aparência antiga",
  semSSL: "Sem SSL / erros",
  naoResponsivo: "Não responsivo",
  semCTA: "Sem CTA claro",
  contatoDificil: "Contato difícil",
  instagramParado: "Instagram parado (+90d)",
  bioFraca: "Bio fraca no Instagram",
  identidadeInconsistente: "Identidade visual inconsistente",
  atendimentoFraco: "Atendimento fraco",
  semProvaSocial: "Sem prova social",
  presencaGoogleFraca: "Presença no Google fraca",
};

function ConfiguracoesPage() {
  const {
    weights,
    setWeights,
    resetPlataforma,
    carregarDemo,
    empresas,
    empresasExcluidas,
    instagramProfilesDb,
    dbSyncStatus,
    lastSyncTime,
    databaseInfo,
    syncNow,
    kanbanColumns,
  } = useStore();
  const testConn = useServerFn(testApiConnection);

  const [sincronizandoManual, setSincronizandoManual] = useState(false);

  const handleForcarSincronizacao = async () => {
    try {
      setSincronizandoManual(true);
      await syncNow();
      toast.success("Banco de Dados sincronizado com sucesso!");
    } catch {
      toast.error("Erro ao sincronizar com o banco de dados.");
    } finally {
      setSincronizandoManual(false);
    }
  };

  const exportarBackupJson = () => {
    const backup = {
      versao: 1,
      exportadoEm: new Date().toISOString(),
      origem: "Locomotiva CRM - Central de Comunicação 360",
      totalEmpresas: empresas.length,
      totalExcluidas: empresasExcluidas.length,
      totalInstagram: instagramProfilesDb.length,
      empresas,
      empresasExcluidas,
      instagramProfilesDb,
      pesosScore: weights,
      configuracoesComunicacao: comunicacao,
      chavesApi: settings,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `locomotiva-crm-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup completo em JSON exportado com sucesso!");
  };

  // APIs
  const [settings, setSettings] = useState<ApiSettingsMap>(getApiSettings());
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, ApiTestResult>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [testingAll, setTestingAll] = useState(false);

  // Cotas Diárias & Rate-Limiter
  const [cotasEdicao, setCotasEdicao] = useState<CotasDiariasConfig>(() => settings.cotasDiarias);
  const [resumoCotas, setResumoCotas] = useState(() => obterResumoSaldo(settings.cotasDiarias));

  // E-mail e WhatsApp
  const [comunicacao, setComunicacao] = useState<ComunicacaoSettings>(getComunicacaoSettings());
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [testEmailPara, setTestEmailPara] = useState("");
  const [testandoEmail, setTestandoEmail] = useState(false);
  const [testWhatsNumero, setTestWhatsNumero] = useState("");
  const [testandoWhats, setTestandoWhats] = useState(false);

  useEffect(() => {
    const cur = getApiSettings();
    setSettings(cur);
    setCotasEdicao(cur.cotasDiarias);
    setResumoCotas(obterResumoSaldo(cur.cotasDiarias));
    setComunicacao(getComunicacaoSettings());
    testSingleApi("serpapi", cur.serpapi.key);
    testSingleApi("brasilapi");
    testSingleApi("registrobr");
    testSingleApi("openstreetmap");
    if (cur.apify.key) testSingleApi("apify", cur.apify.key);
    if (cur.openai?.key) testSingleApi("openai", cur.openai.key);
    if (cur.anthropic?.key) testSingleApi("anthropic", cur.anthropic.key);
    if (cur.perplexity?.key) testSingleApi("perplexity", cur.perplexity.key);
    if (cur.recraft?.key) testSingleApi("recraft", cur.recraft.key);
    if (cur.fal?.key) testSingleApi("fal", cur.fal.key);
  }, []);

  const toggleShowKey = (provider: string) => {
    setShowKeys((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  const handleKeyChange = (provider: ApiProviderKey, newKey: string) => {
    setSettings((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        key: newKey,
      },
    }));
  };

  const handleSaveKey = (provider: ApiProviderKey) => {
    const updated = saveApiSetting(provider, {
      key: settings[provider]?.key,
      model: settings[provider]?.model,
    });
    setSettings(updated);
    toast.success(`Chave da API ${provider.toUpperCase()} salva com sucesso!`);
    testSingleApi(provider, settings[provider]?.key, settings[provider]?.model);
  };

  const handleOpenRouterModelChange = (newModel: string) => {
    const updated = saveApiSetting("openrouter", {
      key: settings.openrouter.key,
      model: newModel,
    });
    setSettings(updated);
    toast.success(`Modelo padrão do OpenRouter atualizado para: ${newModel}`);
    if (settings.openrouter.key) {
      testSingleApi("openrouter", settings.openrouter.key, newModel);
    }
  };

  const handleSaveProvedorAtivo = (val: ProvedorIaTipo) => {
    const updated = saveProvedorIaAtivo(val);
    setSettings(updated);
    toast.success(`Motor de IA prioritário definido como: ${val.toUpperCase()}`);
  };

  const handleSaveCotas = () => {
    const updated = saveCotasDiarias(cotasEdicao);
    setSettings(updated);
    setResumoCotas(obterResumoSaldo(updated.cotasDiarias));
    toast.success("Limites diários e políticas de bloqueio salvas com sucesso!");
  };

  const handleResetarContadores = () => {
    resetarConsumoHoje();
    setResumoCotas(obterResumoSaldo(settings.cotasDiarias));
    toast.success("Contadores de consumo diário resetados para 0 hoje!");
  };

  const testSingleApi = async (provider: string, apiKey?: string, model?: string) => {
    setTesting((prev) => ({ ...prev, [provider]: true }));
    try {
      const conf = (settings as any)[provider];
      const res = await testConn({
        data: {
          provider,
          apiKey: apiKey ?? conf?.key,
          model: model ?? conf?.model,
        },
      });
      setTestResults((prev) => ({ ...prev, [provider]: res }));
    } catch (e: any) {
      setTestResults((prev) => ({
        ...prev,
        [provider]: {
          provider: provider as any,
          status: "error",
          latencyMs: 0,
          message: e.message || "Falha na requisição",
        },
      }));
    } finally {
      setTesting((prev) => ({ ...prev, [provider]: false }));
    }
  };

  const testAllApis = async () => {
    setTestingAll(true);
    const providers = [
      "serpapi",
      "groq",
      "gemini",
      "cerebras",
      "openrouter",
      "openai",
      "anthropic",
      "perplexity",
      "recraft",
      "fal",
      "apify",
      "brasilapi",
      "registrobr",
      "openstreetmap",
      "lovable",
    ];
    for (const p of providers) {
      const conf = (settings as any)[p];
      await testSingleApi(p, typeof conf === "object" ? conf?.key : undefined);
    }
    setTestingAll(false);
    toast.success("Diagnóstico de todas as APIs finalizado!");
  };

  // Salvar configurações de E-mail
  const handleSaveEmailSettings = () => {
    const updated = saveComunicacaoSettings({ email: comunicacao.email });
    setComunicacao(updated);
    toast.success("Configurações de E-mail / SMTP salvas com sucesso!");
  };

  // Testar envio de E-mail
  const handleTestarEnvioEmail = async () => {
    if (!testEmailPara.trim() || !testEmailPara.includes("@")) {
      toast.error("Informe um e-mail de destino válido para o teste.");
      return;
    }
    setTestandoEmail(true);
    try {
      const res = await enviarEmailDireto_ServerFn({
        data: {
          para: testEmailPara.trim(),
          assunto: "Teste de Conexão SMTP — Locomotiva Comunicação",
          corpoTexto: "Olá!\n\nEste é um e-mail de verificação disparado pelo CRM da Locomotiva Comunicação. O servidor SMTP e as assinaturas corporativas estão operando normalmente!",
          config: comunicacao.email,
        },
      });
      if (res.sucesso) {
        toast.success(res.detalhes || "E-mail de teste enviado com sucesso!");
      } else {
        toast.error(res.erro || "Falha ao enviar e-mail de teste.");
      }
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setTestandoEmail(false);
    }
  };

  const [modalGuiaEvolutionOpen, setModalGuiaEvolutionOpen] = useState(false);
  const [testandoConexaoEvolution, setTestandoConexaoEvolution] = useState(false);
  const [resultadoConexaoEvolution, setResultadoConexaoEvolution] = useState<TesteConexaoEvolutionResult | null>(null);

  // Testar conexão da Evolution API
  const handleTestarConexaoEvolution = async () => {
    if (!comunicacao.whatsapp.evolutionUrl || !comunicacao.whatsapp.evolutionInstance) {
      toast.error("Informe a URL da Evolution API e o Nome da Instância.");
      return;
    }
    setTestandoConexaoEvolution(true);
    try {
      const res = await testarConexaoEvolution_ServerFn({
        data: {
          evolutionUrl: comunicacao.whatsapp.evolutionUrl,
          evolutionInstance: comunicacao.whatsapp.evolutionInstance,
          evolutionApiKey: comunicacao.whatsapp.evolutionApiKey,
        },
      });
      setResultadoConexaoEvolution(res);
      if (res.conectado) {
        toast.success(res.detalhes);
      } else if (res.state === "connecting") {
        toast.info(res.detalhes);
      } else {
        toast.warning(res.detalhes);
      }
    } catch (err: any) {
      toast.error(`Falha no teste: ${err.message}`);
    } finally {
      setTestandoConexaoEvolution(false);
    }
  };

  // Salvar configurações de WhatsApp
  const handleSaveWhatsAppSettings = () => {
    const updated = saveComunicacaoSettings({ whatsapp: comunicacao.whatsapp });
    setComunicacao(updated);
    toast.success("Configurações de WhatsApp e Respostas Automáticas salvas!");
  };

  // Testar disparo de WhatsApp
  const handleTestarDisparoWhats = async () => {
    const num = testWhatsNumero.replace(/\D/g, "");
    if (num.length < 10) {
      toast.error("Informe um número de WhatsApp válido com DDD.");
      return;
    }
    setTestandoWhats(true);
    try {
      const res = await dispararWhatsApp_ServerFn({
        data: {
          numero: num,
          mensagem: "Olá! Este é um teste de comunicação da Locomotiva Comunicação. Canal configurado e pronto para prospecção!",
          gatewayTipo: comunicacao.whatsapp.gatewayTipo,
          evolutionUrl: comunicacao.whatsapp.evolutionUrl,
          evolutionInstance: comunicacao.whatsapp.evolutionInstance,
          evolutionApiKey: comunicacao.whatsapp.evolutionApiKey,
          evolutionFallbackNativo: comunicacao.whatsapp.evolutionFallbackNativo,
          apiUrl: comunicacao.whatsapp.apiUrl,
          apiKey: comunicacao.whatsapp.apiKey,
        },
      });
      if (res.sucesso) {
        toast.success(res.detalhes || "Mensagem de teste enviada com sucesso!");
        if (res.directUrl) window.open(res.directUrl, "_blank");
      } else {
        toast.error(res.erro || "Falha no envio.");
        if (res.directUrl) window.open(res.directUrl, "_blank");
      }
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setTestandoWhats(false);
    }
  };

  // Gerenciamento de Respostas Automáticas
  const handleAddResposta = () => {
    const nova: RespostaAutomaticaItem = {
      id: `resp_${Date.now()}`,
      titulo: "Novo Script Rápido",
      gatilho: "Gatilho de Venda",
      texto: "Texto da resposta automática da Locomotiva Comunicação...",
    };
    const updatedResps = [...comunicacao.whatsapp.respostasAutomaticas, nova];
    setComunicacao((prev) => ({
      ...prev,
      whatsapp: { ...prev.whatsapp, respostasAutomaticas: updatedResps },
    }));
  };

  const handleUpdateResposta = (id: string, campo: keyof RespostaAutomaticaItem, val: string) => {
    const updatedResps = comunicacao.whatsapp.respostasAutomaticas.map((r) =>
      r.id === id ? { ...r, [campo]: val } : r,
    );
    setComunicacao((prev) => ({
      ...prev,
      whatsapp: { ...prev.whatsapp, respostasAutomaticas: updatedResps },
    }));
  };

  const handleDeleteResposta = (id: string) => {
    const updatedResps = comunicacao.whatsapp.respostasAutomaticas.filter((r) => r.id !== id);
    setComunicacao((prev) => ({
      ...prev,
      whatsapp: { ...prev.whatsapp, respostasAutomaticas: updatedResps },
    }));
    toast.info("Script removido da lista.");
  };

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações do Sistema</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerenciamento de APIs, servidor de E-mail (SMTP), canal de WhatsApp e critérios de prospecção da <strong>Locomotiva Comunicação</strong>.
        </p>
      </div>

      <Tabs defaultValue="email" className="space-y-4">
        <TabsList className="bg-muted/60 p-1 border border-border/60 rounded-lg flex-wrap h-auto gap-1">
          <TabsTrigger value="email" className="text-xs py-1.5 px-3 flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 text-blue-500" />
            E-mail & SMTP
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="text-xs py-1.5 px-3 flex items-center gap-1.5">
            <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />
            WhatsApp & Automações
          </TabsTrigger>
          <TabsTrigger value="apis" className="text-xs py-1.5 px-3 flex items-center gap-1.5">
            <Server className="h-3.5 w-3.5 text-indigo-500" />
            APIs de Pesquisa & Enriquecimento
          </TabsTrigger>
          <TabsTrigger value="scoring" className="text-xs py-1.5 px-3 flex items-center gap-1.5">
            <Sliders className="h-3.5 w-3.5 text-amber-500" />
            Critérios de Score
          </TabsTrigger>
          <TabsTrigger value="database" className="text-xs py-1.5 px-3 flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-emerald-500" />
            Banco de Dados & Nuvem
          </TabsTrigger>
        </TabsList>

        {/* ------------------------------------------------------------------- */}
        {/* ABA 1: E-MAIL & SMTP */}
        {/* ------------------------------------------------------------------- */}
        <TabsContent value="email" className="space-y-4 mt-0">
          <Card className="border-blue-500/20 bg-gradient-to-br from-card to-blue-500/5 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold">Servidor SMTP & Assinaturas Corporativas</CardTitle>
                  <CardDescription className="text-xs">
                    Configure o servidor para envio direto de e-mails executivos sem abrir cliente externo.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-2">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                    Host SMTP:
                  </label>
                  <Input
                    value={comunicacao.email.host}
                    onChange={(e) =>
                      setComunicacao((prev) => ({
                        ...prev,
                        email: { ...prev.email, host: e.target.value },
                      }))
                    }
                    placeholder="smtp.gmail.com ou smtp.locomotiva.com.br"
                    className="text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                    Porta SMTP:
                  </label>
                  <Input
                    type="number"
                    value={comunicacao.email.port}
                    onChange={(e) =>
                      setComunicacao((prev) => ({
                        ...prev,
                        email: { ...prev.email, port: Number(e.target.value) || 587 },
                      }))
                    }
                    placeholder="587 ou 465"
                    className="text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                    Usuário / E-mail de Login:
                  </label>
                  <Input
                    value={comunicacao.email.user}
                    onChange={(e) =>
                      setComunicacao((prev) => ({
                        ...prev,
                        email: { ...prev.email, user: e.target.value },
                      }))
                    }
                    placeholder="seuemail@empresa.com.br"
                    className="text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                    Senha / App Password:
                  </label>
                  <div className="relative">
                    <Input
                      type={showSmtpPass ? "text" : "password"}
                      value={comunicacao.email.pass}
                      onChange={(e) =>
                        setComunicacao((prev) => ({
                          ...prev,
                          email: { ...prev.email, pass: e.target.value },
                        }))
                      }
                      placeholder="••••••••••••"
                      className="text-xs font-mono pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSmtpPass(!showSmtpPass)}
                      className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                    >
                      {showSmtpPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                    Nome do Remetente:
                  </label>
                  <Input
                    value={comunicacao.email.fromName}
                    onChange={(e) =>
                      setComunicacao((prev) => ({
                        ...prev,
                        email: { ...prev.email, fromName: e.target.value },
                      }))
                    }
                    placeholder="Locomotiva Comunicação"
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                    E-mail do Remetente (From):
                  </label>
                  <Input
                    value={comunicacao.email.fromEmail}
                    onChange={(e) =>
                      setComunicacao((prev) => ({
                        ...prev,
                        email: { ...prev.email, fromEmail: e.target.value },
                      }))
                    }
                    placeholder="contato@locomotivacomunicacao.com.br"
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              {/* Template do Topo e Assinatura */}
              <div className="grid md:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                    HTML do Topo / Cabeçalho do E-mail:
                  </label>
                  <Textarea
                    value={comunicacao.email.headerHtml}
                    onChange={(e) =>
                      setComunicacao((prev) => ({
                        ...prev,
                        email: { ...prev.email, headerHtml: e.target.value },
                      }))
                    }
                    rows={4}
                    className="text-xs font-mono leading-relaxed"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                    HTML da Assinatura Padrão:
                  </label>
                  <Textarea
                    value={comunicacao.email.signatureHtml}
                    onChange={(e) =>
                      setComunicacao((prev) => ({
                        ...prev,
                        email: { ...prev.email, signatureHtml: e.target.value },
                      }))
                    }
                    rows={4}
                    className="text-xs font-mono leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t flex-wrap">
                <Button onClick={handleSaveEmailSettings} className="gap-1.5 text-xs">
                  Salvar Configurações de E-mail
                </Button>

                {/* Teste de Envio */}
                <div className="flex items-center gap-2">
                  <Input
                    type="email"
                    value={testEmailPara}
                    onChange={(e) => setTestEmailPara(e.target.value)}
                    placeholder="E-mail para receber teste"
                    className="text-xs w-64 h-8"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestarEnvioEmail}
                    disabled={testandoEmail}
                    className="text-xs h-8 gap-1"
                  >
                    <Send className={`h-3 w-3 ${testandoEmail ? "animate-spin" : ""}`} />
                    {testandoEmail ? "Enviando..." : "Testar SMTP"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------------- */}
        {/* ABA 2: WHATSAPP & AUTOMAÇÕES (NATIVO & EVOLUTION API) */}
        {/* ------------------------------------------------------------------- */}
        <TabsContent value="whatsapp" className="space-y-4 mt-0">
          <Card className="border-emerald-500/20 bg-gradient-to-br from-card to-emerald-500/5 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold">Canal WhatsApp & Gateways de Envio</CardTitle>
                    <CardDescription className="text-xs">
                      Escolha entre o WhatsApp Web Oficial (Nativo) e a Evolution API para disparos automáticos.
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setModalGuiaEvolutionOpen(true)}
                    size="sm"
                    variant="outline"
                    className="text-xs gap-1.5 h-8 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                  >
                    <BookOpen className="h-3.5 w-3.5" /> Guia de Hospedagem Grátis da Evolution
                  </Button>

                  <Button onClick={handleAddResposta} size="sm" variant="outline" className="text-xs gap-1 h-8">
                    <Plus className="h-3 w-3" /> Novo Script
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-5 pt-2">
              {/* Número da Locomotiva */}
              <div className="max-w-md">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                  Número Oficial da Locomotiva (com DDD):
                </label>
                <Input
                  value={comunicacao.whatsapp.numeroAgencia}
                  onChange={(e) =>
                    setComunicacao((prev) => ({
                      ...prev,
                      whatsapp: { ...prev.whatsapp, numeroAgencia: e.target.value },
                    }))
                  }
                  placeholder="Ex: 54999990000"
                  className="text-xs font-mono"
                />
              </div>

              {/* SELETOR EM 2 CARDS DE GATEWAY */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Selecione o Método Ativo de Envio de WhatsApp:
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* CARD 1: WHATSAPP WEB / DESKTOP (NATIVO) */}
                  <div
                    onClick={() =>
                      setComunicacao((prev) => ({
                        ...prev,
                        whatsapp: { ...prev.whatsapp, gatewayTipo: "web_link" },
                      }))
                    }
                    className={cn(
                      "p-4 rounded-xl border bg-card hover:border-primary/50 transition-all cursor-pointer space-y-3 relative shadow-xs",
                      comunicacao.whatsapp.gatewayTipo === "web_link" &&
                        "border-primary ring-2 ring-primary/20 bg-primary/5"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600">
                          <Globe className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-foreground">1. WhatsApp Web / Desktop (Nativo)</h4>
                          <p className="text-[11px] text-muted-foreground leading-tight">
                            Abre a conversa oficial com 1 clique e mensagem pronta
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/30">
                        Padrão · Custo Zero
                      </Badge>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1 bg-muted/40 p-2.5 rounded-lg border border-border/50">
                      <p>• <strong>Sem chaves de API nem servidores:</strong> utiliza seu WhatsApp normal no navegador ou app desktop.</p>
                      <p>• <strong>Risco Zero de bloqueio:</strong> você revisa a mensagem antes de apertar enter.</p>
                    </div>

                    {/* Opções Avançadas do Modo Nativo */}
                    <div className="space-y-2 pt-1 border-t border-border/40" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs font-medium text-foreground cursor-pointer" htmlFor="auto-move-kanban">
                          Mover card no Kanban após clicar em disparar:
                        </label>
                        <Switch
                          id="auto-move-kanban"
                          checked={comunicacao.whatsapp.nativoAutoMoverKanban}
                          onCheckedChange={(checked) =>
                            setComunicacao((prev) => ({
                              ...prev,
                              whatsapp: { ...prev.whatsapp, nativoAutoMoverKanban: checked },
                            }))
                          }
                        />
                      </div>

                      {comunicacao.whatsapp.nativoAutoMoverKanban && (
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <span className="text-[11px] text-muted-foreground">Etapa destino no Kanban:</span>
                          <Select
                            value={comunicacao.whatsapp.nativoKanbanStageDestino || "primeiro_contato"}
                            onValueChange={(val: any) =>
                              setComunicacao((prev) => ({
                                ...prev,
                                whatsapp: { ...prev.whatsapp, nativoKanbanStageDestino: val },
                              }))
                            }
                          >
                            <SelectTrigger className="h-7 text-xs w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {kanbanColumns.map((col) => (
                                <SelectItem key={col.id} value={col.id} className="text-xs">
                                  {col.titulo}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <label className="text-xs font-medium text-foreground cursor-pointer" htmlFor="prefix-lead">
                          Prefixar identificador [Lead: Nome] na mensagem:
                        </label>
                        <Switch
                          id="prefix-lead"
                          checked={comunicacao.whatsapp.nativoIncluirIdentificadorLead}
                          onCheckedChange={(checked) =>
                            setComunicacao((prev) => ({
                              ...prev,
                              whatsapp: { ...prev.whatsapp, nativoIncluirIdentificadorLead: checked },
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: EVOLUTION API (v2) */}
                  <div
                    onClick={() =>
                      setComunicacao((prev) => ({
                        ...prev,
                        whatsapp: { ...prev.whatsapp, gatewayTipo: "evolution_api" },
                      }))
                    }
                    className={cn(
                      "p-4 rounded-xl border bg-card hover:border-emerald-500/50 transition-all cursor-pointer space-y-3 relative shadow-xs",
                      comunicacao.whatsapp.gatewayTipo === "evolution_api" &&
                        "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/5"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600">
                          <Server className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-foreground">2. Evolution API (v2)</h4>
                          <p className="text-[11px] text-muted-foreground leading-tight">
                            Disparo 100% automatizado em segundo plano pelo CRM
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                        Disparo em 2º Plano
                      </Badge>
                    </div>

                    {/* Inputs da Evolution */}
                    <div className="space-y-2.5 pt-1" onClick={(e) => e.stopPropagation()}>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-0.5">
                          URL da Evolution API (VPS ou Nuvem Grátis):
                        </label>
                        <Input
                          value={comunicacao.whatsapp.evolutionUrl || ""}
                          onChange={(e) =>
                            setComunicacao((prev) => ({
                              ...prev,
                              whatsapp: { ...prev.whatsapp, evolutionUrl: e.target.value },
                            }))
                          }
                          placeholder="https://sua-evolution.up.railway.app ou http://IP_ORACLE:8080"
                          className="h-8 text-xs font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground block mb-0.5">
                            Nome da Instância:
                          </label>
                          <Input
                            value={comunicacao.whatsapp.evolutionInstance || ""}
                            onChange={(e) =>
                              setComunicacao((prev) => ({
                                ...prev,
                                whatsapp: { ...prev.whatsapp, evolutionInstance: e.target.value },
                              }))
                            }
                            placeholder="locomotiva-crm"
                            className="h-8 text-xs font-mono"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-muted-foreground block mb-0.5">
                            API Key (Global ou da Instância):
                          </label>
                          <Input
                            type="password"
                            value={comunicacao.whatsapp.evolutionApiKey || ""}
                            onChange={(e) =>
                              setComunicacao((prev) => ({
                                ...prev,
                                whatsapp: { ...prev.whatsapp, evolutionApiKey: e.target.value },
                              }))
                            }
                            placeholder="Chave secreta da API"
                            className="h-8 text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
                        <label className="text-xs font-medium text-foreground cursor-pointer" htmlFor="fallback-evolution">
                          Fallback automático para WhatsApp Web se a Evolution falhar:
                        </label>
                        <Switch
                          id="fallback-evolution"
                          checked={comunicacao.whatsapp.evolutionFallbackNativo !== false}
                          onCheckedChange={(checked) =>
                            setComunicacao((prev) => ({
                              ...prev,
                              whatsapp: { ...prev.whatsapp, evolutionFallbackNativo: checked },
                            }))
                          }
                        />
                      </div>

                      {/* Botão de Teste de Conexão com a Evolution */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleTestarConexaoEvolution}
                          disabled={testandoConexaoEvolution}
                          className="h-7 text-xs gap-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                        >
                          <RefreshCw className={`h-3 w-3 ${testandoConexaoEvolution ? "animate-spin" : ""}`} />
                          {testandoConexaoEvolution ? "Checando status..." : "Testar Conexão / Status da Instância"}
                        </Button>

                        {resultadoConexaoEvolution && (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] gap-1",
                              resultadoConexaoEvolution.conectado
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                : resultadoConexaoEvolution.state === "connecting"
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                                : "bg-rose-500/10 text-rose-600 border-rose-500/30"
                            )}
                          >
                            {resultadoConexaoEvolution.conectado ? "🟢 Sessão Ativa" : resultadoConexaoEvolution.state === "connecting" ? "🟡 Conectando..." : "🔴 Desconectado"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista de Respostas Automáticas / Scripts */}
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Respostas Rápidas & Gatilhos Comerciais ({comunicacao.whatsapp.respostasAutomaticas.length})
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  {comunicacao.whatsapp.respostasAutomaticas.map((resp) => (
                    <div key={resp.id} className="p-3 rounded-lg border bg-card space-y-2 relative shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <Input
                          value={resp.titulo}
                          onChange={(e) => handleUpdateResposta(resp.id, "titulo", e.target.value)}
                          placeholder="Título do script"
                          className="h-7 text-xs font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteResposta(resp.id)}
                          className="text-muted-foreground hover:text-red-500 p-1"
                          title="Remover script"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <Input
                        value={resp.gatilho}
                        onChange={(e) => handleUpdateResposta(resp.id, "gatilho", e.target.value)}
                        placeholder="Gatilho (ex: Objeção de Preço, Primeiro Contato)"
                        className="h-6 text-[11px] font-mono text-muted-foreground"
                      />

                      <Textarea
                        value={resp.texto}
                        onChange={(e) => handleUpdateResposta(resp.id, "texto", e.target.value)}
                        rows={3}
                        className="text-xs leading-relaxed font-sans"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Botão de Salvar & Teste de Disparo */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t flex-wrap">
                <Button onClick={handleSaveWhatsAppSettings} className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                  Salvar Configurações de WhatsApp
                </Button>

                {/* Teste de Disparo */}
                <div className="flex items-center gap-2">
                  <Input
                    value={testWhatsNumero}
                    onChange={(e) => setTestWhatsNumero(e.target.value)}
                    placeholder="WhatsApp para teste (DDD+número)"
                    className="text-xs w-56 h-8 font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestarDisparoWhats}
                    disabled={testandoWhats}
                    className="text-xs h-8 gap-1"
                  >
                    <Send className={`h-3 w-3 ${testandoWhats ? "animate-spin" : ""}`} />
                    {testandoWhats ? "Disparando..." : "Testar Disparo"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MODAL / GUIA DE HOSPEDAGEM GRATUITA DA EVOLUTION API */}
          <Dialog open={modalGuiaEvolutionOpen} onOpenChange={setModalGuiaEvolutionOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                    <Server className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg">
                      Como Hospedar a Evolution API 100% Grátis na Nuvem
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                      Sem instalar nada no seu computador e com disponibilidade 24 horas por dia.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <Tabs defaultValue="oracle" className="space-y-4 pt-2">
                <TabsList className="grid grid-cols-3 h-9 w-full">
                  <TabsTrigger value="oracle" className="text-xs gap-1.5">
                    ⭐ Oracle Cloud (VPS Grátis)
                  </TabsTrigger>
                  <TabsTrigger value="koyeb" className="text-xs gap-1.5">
                    🚀 Koyeb (Zero Linux)
                  </TabsTrigger>
                  <TabsTrigger value="docker" className="text-xs gap-1.5">
                    🐳 Docker Compose Pronto
                  </TabsTrigger>
                </TabsList>

                {/* ABA 1: ORACLE CLOUD */}
                <TabsContent value="oracle" className="space-y-3 m-0 text-xs">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-900 dark:text-amber-200 space-y-1">
                    <strong className="font-semibold block">Por que é a melhor opção?</strong>
                    <p className="text-[11px] leading-relaxed">
                      O programa <strong>Always Free da Oracle Cloud</strong> é vitalício (não expira). Você ganha uma máquina com até <strong>4 núcleos ARM e 24 GB de Memória RAM com IP público fixo</strong>. A Evolution API usa apenas 1 GB de RAM, rodando 365 dias por ano sem custo.
                    </p>
                  </div>

                  <ol className="list-decimal pl-4 space-y-2 text-muted-foreground leading-relaxed">
                    <li>
                      Crie sua conta em{" "}
                      <a href="https://www.oracle.com/cloud/free/" target="_blank" rel="noreferrer" className="text-primary font-semibold underline inline-flex items-center gap-0.5">
                        oracle.com/cloud/free <ExternalLink className="h-3 w-3" />
                      </a>.
                    </li>
                    <li>
                      Acesse o painel e crie uma <strong>Instância de Computação</strong> (Compute Instance) selecionando o sistema <strong>Ubuntu 22.04 LTS</strong> e forma <strong>VM.Standard.A1.Flex</strong>.
                    </li>
                    <li>
                      Acesse a máquina por SSH e instale o Docker com um único comando:
                      <div className="p-2 bg-slate-950 text-slate-100 font-mono text-[11px] rounded mt-1 flex items-center justify-between">
                        <code>curl -fsSL https://get.docker.com | bash</code>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-[10px] text-slate-300 hover:text-white"
                          onClick={() => {
                            navigator.clipboard.writeText("curl -fsSL https://get.docker.com | bash");
                            toast.success("Comando copiado!");
                          }}
                        >
                          <Copy className="h-3 w-3 mr-1" /> Copiar
                        </Button>
                      </div>
                    </li>
                    <li>
                      Copie o arquivo <code>docker-compose.yml</code> da aba ao lado, cole na máquina e execute:
                      <div className="p-2 bg-slate-950 text-slate-100 font-mono text-[11px] rounded mt-1 flex items-center justify-between">
                        <code>docker compose up -d</code>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-[10px] text-slate-300 hover:text-white"
                          onClick={() => {
                            navigator.clipboard.writeText("docker compose up -d");
                            toast.success("Comando copiado!");
                          }}
                        >
                          <Copy className="h-3 w-3 mr-1" /> Copiar
                        </Button>
                      </div>
                    </li>
                    <li>
                      Abra a porta 8080 nas regras de segurança da Oracle e cole <code>http://IP_DA_ORACLE:8080</code> no campo URL acima!
                    </li>
                  </ol>
                </TabsContent>

                {/* ABA 2: KOYEB (ZERO LINUX) */}
                <TabsContent value="koyeb" className="space-y-3 m-0 text-xs">
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-900 dark:text-blue-200 space-y-1">
                    <strong className="font-semibold block">Ideal para quem não quer mexer em terminal</strong>
                    <p className="text-[11px] leading-relaxed">
                      O <strong>Koyeb.com</strong> possui um plano gratuito permanente para rodar containers Docker com domínio HTTPS e certificado SSL automático.
                    </p>
                  </div>

                  <ol className="list-decimal pl-4 space-y-2 text-muted-foreground leading-relaxed">
                    <li>
                      Crie um banco de dados PostgreSQL gratuito no{" "}
                      <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-primary font-semibold underline inline-flex items-center gap-0.5">
                        supabase.com <ExternalLink className="h-3 w-3" />
                      </a> e copie a Connection String (URI).
                    </li>
                    <li>
                      Acesse{" "}
                      <a href="https://www.koyeb.com" target="_blank" rel="noreferrer" className="text-primary font-semibold underline inline-flex items-center gap-0.5">
                        koyeb.com <ExternalLink className="h-3 w-3" />
                      </a> e crie um novo App com a imagem pública do Docker Hub:
                      <div className="p-2 bg-slate-950 text-slate-100 font-mono text-[11px] rounded mt-1">
                        <code>atendai/evolution-api:v2.1.2</code>
                      </div>
                    </li>
                    <li>
                      Defina as variáveis de ambiente no painel do Koyeb:
                      <ul className="list-disc pl-4 mt-1 space-y-0.5 font-mono text-[11px]">
                        <li><code>AUTHENTICATION_API_KEY=sua_chave_locomotiva_2026</code></li>
                        <li><code>DATABASE_ENABLED=true</code></li>
                        <li><code>DATABASE_PROVIDER=postgresql</code></li>
                        <li><code>DATABASE_CONNECTION_URI=sua_uri_do_supabase</code></li>
                      </ul>
                    </li>
                    <li>
                      Clique em <strong>Deploy</strong>. O Koyeb gerará um endereço seguro como <code>https://locomotiva-evolution.koyeb.app</code>. Cole no CRM!
                    </li>
                  </ol>
                </TabsContent>

                {/* ABA 3: DOCKER COMPOSE */}
                <TabsContent value="docker" className="space-y-3 m-0 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Arquivo pronto com Evolution API + PostgreSQL para qualquer VPS Linux:</span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
                      onClick={() => {
                        const dockerCompose = `version: '3.7'
services:
  evolution-api:
    image: atendai/evolution-api:v2.1.2
    restart: always
    ports:
      - "8080:8080"
    environment:
      - SERVER_URL=http://localhost:8080
      - AUTHENTICATION_API_KEY=locomotiva_crm_secret_key_2026
      - DATABASE_ENABLED=true
      - DATABASE_PROVIDER=postgresql
      - DATABASE_CONNECTION_URI=postgresql://postgres:postgres_pass_2026@postgres:5432/evolution
    volumes:
      - evolution_instances:/evolution/instances
    depends_on:
      - postgres
  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres_pass_2026
      - POSTGRES_DB=evolution
    volumes:
      - postgres_data:/var/lib/postgresql/data
volumes:
  evolution_instances:
  postgres_data:`;
                        navigator.clipboard.writeText(dockerCompose);
                        toast.success("docker-compose.yml copiado!");
                      }}
                    >
                      <Copy className="h-3 w-3" /> Copiar docker-compose.yml
                    </Button>
                  </div>

                  <pre className="p-3 bg-slate-950 text-slate-100 font-mono text-[11px] rounded-lg overflow-x-auto leading-relaxed border border-slate-800">
{`version: '3.7'
services:
  evolution-api:
    image: atendai/evolution-api:v2.1.2
    restart: always
    ports:
      - "8080:8080"
    environment:
      - SERVER_URL=http://localhost:8080
      - AUTHENTICATION_API_KEY=locomotiva_crm_secret_key_2026
      - DATABASE_ENABLED=true
      - DATABASE_PROVIDER=postgresql
      - DATABASE_CONNECTION_URI=postgresql://postgres:postgres_pass_2026@postgres:5432/evolution
    volumes:
      - evolution_instances:/evolution/instances
    depends_on:
      - postgres
  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres_pass_2026
      - POSTGRES_DB=evolution
    volumes:
      - postgres_data:/var/lib/postgresql/data
volumes:
  evolution_instances:
  postgres_data:`}
                  </pre>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ------------------------------------------------------------------- */}
        {/* ABA 3: APIS DE PESQUISA & ENRIQUECIMENTO */}
        {/* ------------------------------------------------------------------- */}
        <TabsContent value="apis" className="space-y-5 mt-0">
          
          {/* 1. GESTÃO DE COTAS DIÁRIAS & BLOQUEIO PREVENTIVO */}
          <Card className="border-border/60 bg-gradient-to-br from-card via-card to-emerald-500/5 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      Gestão de Cotas Diárias & Proteção de Orçamento
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Defina limites de segurança diários para geração de imagens, logotipos, sites e pesquisas. O sistema bloqueia chamadas externas ao atingir a cota para evitar surpresas na fatura.
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Proteção Anti-Cobrança Ativa
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetarContadores}
                    className="text-xs h-7 text-muted-foreground hover:text-foreground gap-1"
                    title="Zerar contadores de hoje para testes"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Resetar Hoje
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-1">
              {/* Grid dos 4 recursos com barra de progresso e inputs */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                
                {/* 1. IMAGENS */}
                <div className="p-3.5 rounded-lg border border-border/70 bg-card space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      🖼️ Imagens
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {resumoCotas.imagens.usado} / {cotasEdicao.maxImagensDia} hoje
                    </Badge>
                  </div>
                  <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all",
                        resumoCotas.imagens.porcentagem >= 100
                          ? "bg-red-500"
                          : resumoCotas.imagens.porcentagem >= 75
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      )}
                      style={{ width: `${Math.min(100, resumoCotas.imagens.porcentagem)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Limite diário:</span>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min="1"
                        max="500"
                        value={cotasEdicao.maxImagensDia}
                        onChange={(e) =>
                          setCotasEdicao((prev) => ({
                            ...prev,
                            maxImagensDia: Math.max(1, Number(e.target.value) || 20),
                          }))
                        }
                        className="h-6 w-16 text-xs text-right font-mono"
                      />
                      <span>/dia</span>
                    </div>
                  </div>
                </div>

                {/* 2. LOGOTIPOS */}
                <div className="p-3.5 rounded-lg border border-border/70 bg-card space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      🎨 Logotipos SVG
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {resumoCotas.logos.usado} / {cotasEdicao.maxLogosDia} hoje
                    </Badge>
                  </div>
                  <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all",
                        resumoCotas.logos.porcentagem >= 100
                          ? "bg-red-500"
                          : resumoCotas.logos.porcentagem >= 75
                          ? "bg-amber-500"
                          : "bg-purple-500"
                      )}
                      style={{ width: `${Math.min(100, resumoCotas.logos.porcentagem)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Limite diário:</span>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min="1"
                        max="200"
                        value={cotasEdicao.maxLogosDia}
                        onChange={(e) =>
                          setCotasEdicao((prev) => ({
                            ...prev,
                            maxLogosDia: Math.max(1, Number(e.target.value) || 10),
                          }))
                        }
                        className="h-6 w-16 text-xs text-right font-mono"
                      />
                      <span>/dia</span>
                    </div>
                  </div>
                </div>

                {/* 3. PROJETOS DE SITES */}
                <div className="p-3.5 rounded-lg border border-border/70 bg-card space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      🌐 Sites & Páginas
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {resumoCotas.sites.usado} / {cotasEdicao.maxSitesDia} hoje
                    </Badge>
                  </div>
                  <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all",
                        resumoCotas.sites.porcentagem >= 100
                          ? "bg-red-500"
                          : resumoCotas.sites.porcentagem >= 75
                          ? "bg-amber-500"
                          : "bg-blue-500"
                      )}
                      style={{ width: `${Math.min(100, resumoCotas.sites.porcentagem)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Limite diário:</span>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={cotasEdicao.maxSitesDia}
                        onChange={(e) =>
                          setCotasEdicao((prev) => ({
                            ...prev,
                            maxSitesDia: Math.max(1, Number(e.target.value) || 5),
                          }))
                        }
                        className="h-6 w-16 text-xs text-right font-mono"
                      />
                      <span>/dia</span>
                    </div>
                  </div>
                </div>

                {/* 4. PESQUISAS WEB */}
                <div className="p-3.5 rounded-lg border border-border/70 bg-card space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                      🔍 Pesquisas Web
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {resumoCotas.pesquisas.usado} / {cotasEdicao.maxPesquisasDia} hoje
                    </Badge>
                  </div>
                  <div className="w-full bg-muted/60 h-2 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all",
                        resumoCotas.pesquisas.porcentagem >= 100
                          ? "bg-red-500"
                          : resumoCotas.pesquisas.porcentagem >= 75
                          ? "bg-amber-500"
                          : "bg-indigo-500"
                      )}
                      style={{ width: `${Math.min(100, resumoCotas.pesquisas.porcentagem)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Limite diário:</span>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min="1"
                        max="500"
                        value={cotasEdicao.maxPesquisasDia}
                        onChange={(e) =>
                          setCotasEdicao((prev) => ({
                            ...prev,
                            maxPesquisasDia: Math.max(1, Number(e.target.value) || 30),
                          }))
                        }
                        className="h-6 w-16 text-xs text-right font-mono"
                      />
                      <span>/dia</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Switches de Políticas */}
              <div className="p-3 rounded-lg bg-background/60 border border-border/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-foreground">
                    <input
                      type="checkbox"
                      checked={cotasEdicao.bloqueioRigido}
                      onChange={(e) => setCotasEdicao((prev) => ({ ...prev, bloqueioRigido: e.target.checked }))}
                      className="rounded border-border h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Bloqueio Rígido Ativo (Trava requisições pagas ao bater a cota para proteger seu cartão)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-muted-foreground ml-6">
                    <input
                      type="checkbox"
                      checked={cotasEdicao.fallbackParaGratuito}
                      onChange={(e) => setCotasEdicao((prev) => ({ ...prev, fallbackParaGratuito: e.target.checked }))}
                      className="rounded border-border h-4 w-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Fallback Automático para Motores Gratuitos (Se a cota paga esgotar, comuta para Pollinations/Groq sem travar)</span>
                  </label>
                </div>

                <Button onClick={handleSaveCotas} className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
                  Salvar Limites de Cotas
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 2. SELETOR DE MOTOR DE IA PRIORITÁRIO */}
          <Card className="border-border/60 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-500" />
                    Motor de Inteligência Artificial Prioritário
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Roteamento universal com fallback automático — se o provedor preferencial atingir limites ou oscilar, o CRM aciona a próxima rota sem travar.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 text-xs">
                  Zero Quedas & Alta Velocidade
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Select
                  value={settings.provedorIaAtivo}
                  onValueChange={(v) => handleSaveProvedorAtivo(v as ProvedorIaTipo)}
                >
                  <SelectTrigger className="w-full sm:w-[360px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">⚡ Automático (Melhor Rota + Fallback Dinâmico)</SelectItem>
                    <SelectItem value="anthropic">Anthropic Claude (Claude 3.5 Sonnet · Elite UI/UX)</SelectItem>
                    <SelectItem value="openai">OpenAI ChatGPT (GPT-4o · Lógica & Multimodal)</SelectItem>
                    <SelectItem value="perplexity">Perplexity AI (Sonar · Pesquisa Web ao Vivo)</SelectItem>
                    <SelectItem value="gemini">Google Gemini (Gemini 2.0 Flash · 1.500 req/dia grátis)</SelectItem>
                    <SelectItem value="groq">Groq (Llama 3.3 70B · 14.400 req/dia grátis)</SelectItem>
                    <SelectItem value="openrouter">OpenRouter Hub (Claude, GPT-4o, Kimi, GLM, DeepSeek)</SelectItem>
                    <SelectItem value="cerebras">Cerebras AI (Wafer-Scale Ultra Veloz)</SelectItem>
                    <SelectItem value="lovable">Lovable AI Gateway</SelectItem>
                    <SelectItem value="ollama">Ollama Local (Offline / Privado)</SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground">
                  Provedor atualmente selecionado para geração de sites completos, diagnósticos e abordagens comerciais.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. PROVEDORES PREMIUM COM CHAVES PRÓPRIAS (BYOK - Bring Your Own Key) */}
          <Card className="border-border/60 bg-gradient-to-br from-card via-card to-purple-500/5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Key className="h-4 w-4 text-purple-500" />
                    Provedores de IA Premium com Chave Própria (BYOK)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Conecte suas chaves de API caso assine planos da OpenAI, Anthropic, Perplexity, Recraft, fal.ai ou Adobe Firefly. Seus dados nunca são compartilhados.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30">
                  Alta Fidelidade & Qualidade Máxima
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3.5">

                {/* ANTHROPIC CLAUDE */}
                <div className="p-3.5 rounded-lg border border-border/60 bg-card hover:border-border transition-colors space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-foreground">Anthropic Claude</span>
                      <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">
                        Claude 3.5 Sonnet · Elite UI/UX & Código GSAP
                      </Badge>
                      <a
                        href="https://console.anthropic.com/settings/keys"
                        target="_blank"
                        rel="noopener"
                        className="text-[11px] text-blue-500 hover:underline flex items-center gap-0.5 ml-1"
                      >
                        Obter Chave Claude <ExternalLink className="size-3" />
                      </a>
                    </div>
                    {testing["anthropic"] ? (
                      <Badge variant="outline" className="text-xs gap-1 border-blue-500/30 text-blue-500">
                        <Loader2 className="h-3 w-3 animate-spin" /> Testando...
                      </Badge>
                    ) : testResults["anthropic"] ? (
                      <Badge
                        variant="outline"
                        className={`text-xs gap-1 ${
                          testResults["anthropic"].status === "online"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                            : "bg-red-500/10 text-red-600 border-red-500/30"
                        }`}
                      >
                        {testResults["anthropic"].status === "online" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {testResults["anthropic"].status === "online" ? `Ativa (${testResults["anthropic"].latencyMs}ms)` : testResults["anthropic"].message}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showKeys["anthropic"] ? "text" : "password"}
                        value={settings.anthropic?.key || ""}
                        onChange={(e) => handleKeyChange("anthropic", e.target.value)}
                        placeholder="sk-ant-... (Chave do console Anthropic)"
                        className="text-xs font-mono pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowKey("anthropic")}
                        className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {showKeys["anthropic"] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <Button size="sm" onClick={() => handleSaveKey("anthropic")} className="text-xs h-9 px-3">
                      Salvar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testSingleApi("anthropic", settings.anthropic?.key, settings.anthropic?.model)}
                      disabled={testing["anthropic"]}
                      className="text-xs h-9 px-3"
                    >
                      Testar
                    </Button>
                  </div>
                </div>

                {/* OPENAI (CHATGPT + DALL-E 3) */}
                <div className="p-3.5 rounded-lg border border-border/60 bg-card hover:border-border transition-colors space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-foreground">OpenAI (ChatGPT & DALL-E 3)</span>
                      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                        GPT-4o + DALL-E 3 Imagens
                      </Badge>
                      <a
                        href="https://platform.openai.com/api-keys"
                        target="_blank"
                        rel="noopener"
                        className="text-[11px] text-blue-500 hover:underline flex items-center gap-0.5 ml-1"
                      >
                        Obter Chave OpenAI <ExternalLink className="size-3" />
                      </a>
                    </div>
                    {testing["openai"] ? (
                      <Badge variant="outline" className="text-xs gap-1 border-blue-500/30 text-blue-500">
                        <Loader2 className="h-3 w-3 animate-spin" /> Testando...
                      </Badge>
                    ) : testResults["openai"] ? (
                      <Badge
                        variant="outline"
                        className={`text-xs gap-1 ${
                          testResults["openai"].status === "online"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                            : "bg-red-500/10 text-red-600 border-red-500/30"
                        }`}
                      >
                        {testResults["openai"].status === "online" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {testResults["openai"].status === "online" ? `Ativa (${testResults["openai"].latencyMs}ms)` : testResults["openai"].message}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showKeys["openai"] ? "text" : "password"}
                        value={settings.openai?.key || ""}
                        onChange={(e) => handleKeyChange("openai", e.target.value)}
                        placeholder="sk-... (Chave OpenAI API)"
                        className="text-xs font-mono pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowKey("openai")}
                        className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {showKeys["openai"] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <Button size="sm" onClick={() => handleSaveKey("openai")} className="text-xs h-9 px-3">
                      Salvar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testSingleApi("openai", settings.openai?.key, settings.openai?.model)}
                      disabled={testing["openai"]}
                      className="text-xs h-9 px-3"
                    >
                      Testar
                    </Button>
                  </div>
                </div>

                {/* PERPLEXITY API */}
                <div className="p-3.5 rounded-lg border border-border/60 bg-card hover:border-border transition-colors space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-foreground">Perplexity API</span>
                      <Badge variant="outline" className="text-[10px] bg-cyan-500/10 text-cyan-600 border-cyan-500/30">
                        Sonar · Pesquisa Web ao Vivo & Concorrentes Reais
                      </Badge>
                      <a
                        href="https://www.perplexity.ai/settings/api"
                        target="_blank"
                        rel="noopener"
                        className="text-[11px] text-blue-500 hover:underline flex items-center gap-0.5 ml-1"
                      >
                        Obter Chave Perplexity <ExternalLink className="size-3" />
                      </a>
                    </div>
                    {testing["perplexity"] ? (
                      <Badge variant="outline" className="text-xs gap-1 border-blue-500/30 text-blue-500">
                        <Loader2 className="h-3 w-3 animate-spin" /> Testando...
                      </Badge>
                    ) : testResults["perplexity"] ? (
                      <Badge
                        variant="outline"
                        className={`text-xs gap-1 ${
                          testResults["perplexity"].status === "online"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                            : "bg-red-500/10 text-red-600 border-red-500/30"
                        }`}
                      >
                        {testResults["perplexity"].status === "online" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {testResults["perplexity"].status === "online" ? `Ativa (${testResults["perplexity"].latencyMs}ms)` : testResults["perplexity"].message}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showKeys["perplexity"] ? "text" : "password"}
                        value={settings.perplexity?.key || ""}
                        onChange={(e) => handleKeyChange("perplexity", e.target.value)}
                        placeholder="pplx-... (Chave Perplexity API)"
                        className="text-xs font-mono pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowKey("perplexity")}
                        className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {showKeys["perplexity"] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <Button size="sm" onClick={() => handleSaveKey("perplexity")} className="text-xs h-9 px-3">
                      Salvar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testSingleApi("perplexity", settings.perplexity?.key, settings.perplexity?.model)}
                      disabled={testing["perplexity"]}
                      className="text-xs h-9 px-3"
                    >
                      Testar
                    </Button>
                  </div>
                </div>

                {/* RECRAFT.AI (LOGOTIPOS VETORIAIS SVG NATIVOS) */}
                <div className="p-3.5 rounded-lg border border-border/60 bg-card hover:border-border transition-colors space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-foreground">Recraft.ai</span>
                      <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-600 border-rose-500/30">
                        Top 1 Mundial para Logotipos Vetoriais SVG & Ícones
                      </Badge>
                      <a
                        href="https://www.recraft.ai/profile"
                        target="_blank"
                        rel="noopener"
                        className="text-[11px] text-blue-500 hover:underline flex items-center gap-0.5 ml-1"
                      >
                        Obter Chave Recraft <ExternalLink className="size-3" />
                      </a>
                    </div>
                    {testing["recraft"] ? (
                      <Badge variant="outline" className="text-xs gap-1 border-blue-500/30 text-blue-500">
                        <Loader2 className="h-3 w-3 animate-spin" /> Testando...
                      </Badge>
                    ) : testResults["recraft"] ? (
                      <Badge
                        variant="outline"
                        className={`text-xs gap-1 ${
                          testResults["recraft"].status === "online"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                            : "bg-red-500/10 text-red-600 border-red-500/30"
                        }`}
                      >
                        {testResults["recraft"].status === "online" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {testResults["recraft"].status === "online" ? `Ativa (${testResults["recraft"].latencyMs}ms)` : testResults["recraft"].message}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showKeys["recraft"] ? "text" : "password"}
                        value={settings.recraft?.key || ""}
                        onChange={(e) => handleKeyChange("recraft", e.target.value)}
                        placeholder="Chave de API Recraft.ai (recraft-...)"
                        className="text-xs font-mono pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowKey("recraft")}
                        className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {showKeys["recraft"] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <Button size="sm" onClick={() => handleSaveKey("recraft")} className="text-xs h-9 px-3">
                      Salvar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testSingleApi("recraft", settings.recraft?.key)}
                      disabled={testing["recraft"]}
                      className="text-xs h-9 px-3"
                    >
                      Testar
                    </Button>
                  </div>
                </div>

                {/* FAL.AI (FLUX.1 DEV/PRO) */}
                <div className="p-3.5 rounded-lg border border-border/60 bg-card hover:border-border transition-colors space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-foreground">fal.ai</span>
                      <Badge variant="outline" className="text-[10px] bg-indigo-500/10 text-indigo-600 border-indigo-500/30">
                        FLUX.1 Sub-segundo · Ultra Rápido & Baixo Custo (~$0.003/img)
                      </Badge>
                      <a
                        href="https://fal.ai/dashboard/keys"
                        target="_blank"
                        rel="noopener"
                        className="text-[11px] text-blue-500 hover:underline flex items-center gap-0.5 ml-1"
                      >
                        Obter Chave fal.ai <ExternalLink className="size-3" />
                      </a>
                    </div>
                    {testing["fal"] ? (
                      <Badge variant="outline" className="text-xs gap-1 border-blue-500/30 text-blue-500">
                        <Loader2 className="h-3 w-3 animate-spin" /> Testando...
                      </Badge>
                    ) : testResults["fal"] ? (
                      <Badge
                        variant="outline"
                        className={`text-xs gap-1 ${
                          testResults["fal"].status === "online"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                            : "bg-red-500/10 text-red-600 border-red-500/30"
                        }`}
                      >
                        {testResults["fal"].status === "online" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {testResults["fal"].status === "online" ? `Ativa (${testResults["fal"].latencyMs}ms)` : testResults["fal"].message}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showKeys["fal"] ? "text" : "password"}
                        value={settings.fal?.key || ""}
                        onChange={(e) => handleKeyChange("fal", e.target.value)}
                        placeholder="Chave fal.ai (fal_key-...)"
                        className="text-xs font-mono pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowKey("fal")}
                        className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {showKeys["fal"] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <Button size="sm" onClick={() => handleSaveKey("fal")} className="text-xs h-9 px-3">
                      Salvar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testSingleApi("fal", settings.fal?.key)}
                      disabled={testing["fal"]}
                      className="text-xs h-9 px-3"
                    >
                      Testar
                    </Button>
                  </div>
                </div>

                {/* ADOBE FIREFLY SERVICES */}
                <div className="p-3.5 rounded-lg border border-border/60 bg-card hover:border-border transition-colors space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-foreground">Adobe Firefly</span>
                      <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-600 border-red-500/30">
                        Firefly Services API · Imagens Comerciais Licenciadas
                      </Badge>
                      <a
                        href="https://developer.adobe.com/firefly-services/"
                        target="_blank"
                        rel="noopener"
                        className="text-[11px] text-blue-500 hover:underline flex items-center gap-0.5 ml-1"
                      >
                        Adobe Console <ExternalLink className="size-3" />
                      </a>
                    </div>
                    {testing["firefly"] ? (
                      <Badge variant="outline" className="text-xs gap-1 border-blue-500/30 text-blue-500">
                        <Loader2 className="h-3 w-3 animate-spin" /> Testando...
                      </Badge>
                    ) : testResults["firefly"] ? (
                      <Badge
                        variant="outline"
                        className={`text-xs gap-1 ${
                          testResults["firefly"].status === "online"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                            : "bg-red-500/10 text-red-600 border-red-500/30"
                        }`}
                      >
                        {testResults["firefly"].status === "online" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {testResults["firefly"].status === "online" ? `Ativa (${testResults["firefly"].latencyMs}ms)` : testResults["firefly"].message}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showKeys["firefly"] ? "text" : "password"}
                        value={settings.firefly?.key || ""}
                        onChange={(e) => handleKeyChange("firefly", e.target.value)}
                        placeholder="Client ID / API Key do Adobe Developer Console"
                        className="text-xs font-mono pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowKey("firefly")}
                        className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {showKeys["firefly"] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <Button size="sm" onClick={() => handleSaveKey("firefly")} className="text-xs h-9 px-3">
                      Salvar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testSingleApi("firefly", settings.firefly?.key)}
                      disabled={testing["firefly"]}
                      className="text-xs h-9 px-3"
                    >
                      Testar
                    </Button>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* 4. PROVEDORES DE IA GRATUITOS (awesome-free-llm-apis) */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Provedores de IA Gratuitos (Catálogo awesome-free-llm-apis)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    APIs com camada gratuita permanente sem necessidade de cartão de crédito para geração de sites e texto.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testAllApis}
                  disabled={testingAll}
                  className="gap-1.5 text-xs"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${testingAll ? "animate-spin" : ""}`} />
                  Testar Todas as APIs
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3.5">
                
                {/* GROQ */}
                <div className="p-3.5 rounded-lg border border-border/60 bg-card hover:border-border transition-colors space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-foreground">Groq Cloud</span>
                      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                        Llama 3.1 8B Instant · 30 RPM · 14.400 req/dia Grátis (Sem Cartão)
                      </Badge>
                      <a
                        href="https://console.groq.com/keys"
                        target="_blank"
                        rel="noopener"
                        className="text-[11px] text-blue-500 hover:underline flex items-center gap-0.5 ml-1"
                      >
                        Obter Chave Grátis <ExternalLink className="size-3" />
                      </a>
                    </div>
                    {testing["groq"] ? (
                      <Badge variant="outline" className="text-xs gap-1 border-blue-500/30 text-blue-500">
                        <Loader2 className="h-3 w-3 animate-spin" /> Testando...
                      </Badge>
                    ) : testResults["groq"] ? (
                      <Badge
                        variant="outline"
                        className={`text-xs gap-1 ${
                          testResults["groq"].status === "online"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                            : "bg-red-500/10 text-red-600 border-red-500/30"
                        }`}
                      >
                        {testResults["groq"].status === "online" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {testResults["groq"].status === "online" ? `Ativa (${testResults["groq"].latencyMs}ms)` : testResults["groq"].message}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showKeys["groq"] ? "text" : "password"}
                        value={settings.groq.key || ""}
                        onChange={(e) => handleKeyChange("groq", e.target.value)}
                        placeholder="gsk_... (Chave gratuita do Groq Console)"
                        className="text-xs font-mono pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowKey("groq")}
                        className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {showKeys["groq"] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <Button size="sm" onClick={() => handleSaveKey("groq")} className="text-xs h-9 px-3">
                      Salvar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testSingleApi("groq", settings.groq.key)}
                      disabled={testing["groq"]}
                      className="text-xs h-9 px-3"
                    >
                      Testar
                    </Button>
                  </div>
                </div>

                {/* GOOGLE GEMINI */}
                <div className="p-3.5 rounded-lg border border-border/60 bg-card hover:border-border transition-colors space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-foreground">Google Gemini</span>
                      <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/30">
                        Gemini 1.5 Flash · 15 RPM · 1.500 req/dia (Sem Cartão)
                      </Badge>
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener"
                        className="text-[11px] text-blue-500 hover:underline flex items-center gap-0.5 ml-1"
                      >
                        Obter Chave Grátis <ExternalLink className="size-3" />
                      </a>
                    </div>
                    {testing["gemini"] ? (
                      <Badge variant="outline" className="text-xs gap-1 border-blue-500/30 text-blue-500">
                        <Loader2 className="h-3 w-3 animate-spin" /> Testando...
                      </Badge>
                    ) : testResults["gemini"] ? (
                      <Badge
                        variant="outline"
                        className={`text-xs gap-1 ${
                          testResults["gemini"].status === "online"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                            : "bg-red-500/10 text-red-600 border-red-500/30"
                        }`}
                      >
                        {testResults["gemini"].status === "online" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {testResults["gemini"].status === "online" ? `Ativa (${testResults["gemini"].latencyMs}ms)` : testResults["gemini"].message}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showKeys["gemini"] ? "text" : "password"}
                        value={settings.gemini.key || ""}
                        onChange={(e) => handleKeyChange("gemini", e.target.value)}
                        placeholder="AIzaSy... (Chave gratuita do Google AI Studio)"
                        className="text-xs font-mono pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowKey("gemini")}
                        className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {showKeys["gemini"] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <Button size="sm" onClick={() => handleSaveKey("gemini")} className="text-xs h-9 px-3">
                      Salvar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testSingleApi("gemini", settings.gemini.key)}
                      disabled={testing["gemini"]}
                      className="text-xs h-9 px-3"
                    >
                      Testar
                    </Button>
                  </div>
                </div>

                {/* OPENROUTER HUB (Claude, GPT-4o, Kimi, GLM, DeepSeek, Gemini) */}
                <div className="p-4 rounded-lg border border-purple-500/30 bg-purple-500/5 hover:border-purple-500/50 transition-colors space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                        OpenRouter Hub
                      </span>
                      <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/30 font-semibold">
                        1 Chave = Claude + GPT-4o + Kimi + GLM + DeepSeek + Gemini
                      </Badge>
                      <a
                        href="https://openrouter.ai/keys"
                        target="_blank"
                        rel="noopener"
                        className="text-[11px] text-blue-500 hover:underline flex items-center gap-0.5 ml-1"
                      >
                        Obter Chave OpenRouter <ExternalLink className="size-3" />
                      </a>
                    </div>
                    {testing["openrouter"] ? (
                      <Badge variant="outline" className="text-xs gap-1 border-blue-500/30 text-blue-500">
                        <Loader2 className="h-3 w-3 animate-spin" /> Testando...
                      </Badge>
                    ) : testResults["openrouter"] ? (
                      <Badge
                        variant="outline"
                        className={`text-xs gap-1 ${
                          testResults["openrouter"].status === "online"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                            : "bg-red-500/10 text-red-600 border-red-500/30"
                        }`}
                      >
                        {testResults["openrouter"].status === "online" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {testResults["openrouter"].status === "online" ? `Ativa (${testResults["openrouter"].latencyMs}ms)` : testResults["openrouter"].message}
                      </Badge>
                    ) : null}
                  </div>

                  {/* Campo de Chave API */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showKeys["openrouter"] ? "text" : "password"}
                        value={settings.openrouter.key || ""}
                        onChange={(e) => handleKeyChange("openrouter", e.target.value)}
                        placeholder="sk-or-v1-... (Chave Unificada OpenRouter)"
                        className="text-xs font-mono pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowKey("openrouter")}
                        className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {showKeys["openrouter"] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <Button size="sm" onClick={() => handleSaveKey("openrouter")} className="text-xs h-9 px-3">
                      Salvar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testSingleApi("openrouter", settings.openrouter.key, settings.openrouter.model)}
                      disabled={testing["openrouter"]}
                      className="text-xs h-9 px-3"
                    >
                      Testar
                    </Button>
                  </div>

                  {/* Seletor do Modelo Padrão do OpenRouter */}
                  <div className="grid sm:grid-cols-2 gap-3 pt-1 border-t border-purple-500/10 items-center">
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                        Modelo Padrão Ativo no OpenRouter:
                      </label>
                      <Select
                        value={settings.openrouter.model || "openrouter/free"}
                        onValueChange={(val) => handleOpenRouterModelChange(val)}
                      >
                        <SelectTrigger className="w-full text-xs h-8 font-mono">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="openrouter/free">openrouter/free (Gratuito · Zero Custo)</SelectItem>
                          <SelectItem value="anthropic/claude-3.5-sonnet">Anthropic Claude 3.5 Sonnet (Elite UI/UX & Código)</SelectItem>
                          <SelectItem value="openai/gpt-4o">OpenAI GPT-4o (Flagship Multimodal & Lógica)</SelectItem>
                          <SelectItem value="moonshotai/moonshot-v1-8k">Moonshot Kimi (Contexto & Nuances)</SelectItem>
                          <SelectItem value="thudm/glm-4-9b-chat">Zhipu GLM-4 (Alta Performance Global)</SelectItem>
                          <SelectItem value="deepseek/deepseek-r1:free">DeepSeek R1 Free (Raciocínio Analítico Livre)</SelectItem>
                          <SelectItem value="google/gemini-1.5-pro">Google Gemini 1.5 Pro (Janela de 1M Contexto)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="p-2.5 rounded-md bg-background/80 border border-border/60 text-[11px] text-muted-foreground leading-relaxed">
                      <span className="font-semibold text-foreground">💡 Hub Multi-Modelos:</span> Com 1 única chave no OpenRouter, você alterna entre Claude, GPT, Kimi, GLM e Gemini sem pagar mensalidades fixas separadas em cada plataforma. O consumo é sob demanda (centavos por uso).
                    </div>
                  </div>
                </div>

                {/* CEREBRAS (awesome-free-llm-apis: Ultra Veloz Wafer-Scale) */}
                <div className="p-3.5 rounded-lg border border-border/60 bg-card hover:border-border transition-colors space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-foreground">Cerebras AI</span>
                      <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-600 border-rose-500/30">
                        Llama 3.3 70B · Wafer-Scale Ultra Veloz
                      </Badge>
                      <a
                        href="https://cloud.cerebras.ai"
                        target="_blank"
                        rel="noopener"
                        className="text-[11px] text-blue-500 hover:underline flex items-center gap-0.5 ml-1"
                      >
                        Obter Chave Grátis <ExternalLink className="size-3" />
                      </a>
                    </div>
                    {testing["cerebras"] ? (
                      <Badge variant="outline" className="text-xs gap-1 border-blue-500/30 text-blue-500">
                        <Loader2 className="h-3 w-3 animate-spin" /> Testando...
                      </Badge>
                    ) : testResults["cerebras"] ? (
                      <Badge
                        variant="outline"
                        className={`text-xs gap-1 ${
                          testResults["cerebras"].status === "online"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                            : "bg-red-500/10 text-red-600 border-red-500/30"
                        }`}
                      >
                        {testResults["cerebras"].status === "online" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {testResults["cerebras"].status === "online" ? `Ativa (${testResults["cerebras"].latencyMs}ms)` : testResults["cerebras"].message}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showKeys["cerebras"] ? "text" : "password"}
                        value={settings.cerebras?.key || ""}
                        onChange={(e) => handleKeyChange("cerebras", e.target.value)}
                        placeholder="csk-... (Chave Cerebras Cloud)"
                        className="text-xs font-mono pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowKey("cerebras")}
                        className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {showKeys["cerebras"] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <Button size="sm" onClick={() => handleSaveKey("cerebras")} className="text-xs h-9 px-3">
                      Salvar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testSingleApi("cerebras", settings.cerebras?.key)}
                      disabled={testing["cerebras"]}
                      className="text-xs h-9 px-3"
                    >
                      Testar
                    </Button>
                  </div>
                </div>

                {/* OLLAMA LOCAL */}
                <div className="p-3.5 rounded-lg border border-border/60 bg-card hover:border-border transition-colors space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-foreground">Ollama Local</span>
                      <Badge variant="outline" className="text-[10px] bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30">
                        100% Offline · Privado · Ilimitado
                      </Badge>
                    </div>
                    {testing["ollama"] ? (
                      <Badge variant="outline" className="text-xs gap-1 border-blue-500/30 text-blue-500">
                        <Loader2 className="h-3 w-3 animate-spin" /> Testando...
                      </Badge>
                    ) : testResults["ollama"] ? (
                      <Badge
                        variant="outline"
                        className={`text-xs gap-1 ${
                          testResults["ollama"].status === "online"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                        }`}
                      >
                        {testResults["ollama"].status === "online" ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                        {testResults["ollama"].status === "online" ? "Servidor Local Ativo" : "Offline"}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={settings.ollama.baseUrl || "http://localhost:11434/v1"}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          ollama: { ...prev.ollama, baseUrl: e.target.value },
                        }))
                      }
                      placeholder="http://localhost:11434/v1"
                      className="text-xs font-mono"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        saveApiSetting("ollama", { baseUrl: settings.ollama.baseUrl });
                        toast.success("URL do Ollama salva!");
                      }}
                      className="text-xs h-9 px-3"
                    >
                      Salvar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testSingleApi("ollama", settings.ollama.baseUrl)}
                      disabled={testing["ollama"]}
                      className="text-xs h-9 px-3"
                    >
                      Testar
                    </Button>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* 3. APIS DE BUSCA E PROSPECÇÃO */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                APIs de Pesquisa Web & Prospecção Externa
              </CardTitle>
              <CardDescription className="text-xs">
                Motores de busca no Google, Maps, redes sociais e validação cadastral de CNPJ.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              
              {/* SERPAPI */}
              <div className="p-3.5 rounded-lg border border-border/60 bg-card space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs uppercase tracking-wider text-foreground">SerpApi</span>
                    <span className="text-xs text-muted-foreground">(Google Search & Maps em tempo real)</span>
                  </div>
                  {testResults["serpapi"] && (
                    <Badge
                      variant="outline"
                      className={`text-xs gap-1 ${
                        testResults["serpapi"].status === "online"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                          : "bg-red-500/10 text-red-600 border-red-500/30"
                      }`}
                    >
                      {testResults["serpapi"].status === "online" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {testResults["serpapi"].status === "online" ? "Ativa & Operante" : testResults["serpapi"].message}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showKeys["serpapi"] ? "text" : "password"}
                      value={settings.serpapi.key || ""}
                      onChange={(e) => handleKeyChange("serpapi", e.target.value)}
                      placeholder="Chave SerpApi"
                      className="text-xs font-mono pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey("serpapi")}
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      {showKeys["serpapi"] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <Button size="sm" onClick={() => handleSaveKey("serpapi")} className="text-xs h-9 px-3">
                    Salvar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testSingleApi("serpapi", settings.serpapi.key)}
                    disabled={testing["serpapi"]}
                    className="text-xs h-9 px-3"
                  >
                    Testar
                  </Button>
                </div>
              </div>

              {/* APIFY */}
              <div className="p-3.5 rounded-lg border border-border/60 bg-card space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs uppercase tracking-wider text-foreground">Apify</span>
                    <span className="text-xs text-muted-foreground">(Minerador de Instagram e perfis digitais)</span>
                  </div>
                  {testResults["apify"] && (
                    <Badge
                      variant="outline"
                      className={`text-xs gap-1 ${
                        testResults["apify"].status === "online"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                      }`}
                    >
                      {testResults["apify"].status === "online" ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                      {testResults["apify"].status === "online" ? "Ativa" : "Não configurada"}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showKeys["apify"] ? "text" : "password"}
                      value={settings.apify.key || ""}
                      onChange={(e) => handleKeyChange("apify", e.target.value)}
                      placeholder="Chave Apify (opcional)"
                      className="text-xs font-mono pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowKey("apify")}
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      {showKeys["apify"] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <Button size="sm" onClick={() => handleSaveKey("apify")} className="text-xs h-9 px-3">
                    Salvar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testSingleApi("apify", settings.apify.key)}
                    disabled={testing["apify"]}
                    className="text-xs h-9 px-3"
                  >
                    Testar
                  </Button>
                </div>
              </div>

              {/* SERVIÇOS PÚBLICOS E ABERTOS */}
              <div className="p-3.5 rounded-lg border border-border/40 bg-muted/20 space-y-2">
                <span className="font-bold text-xs uppercase tracking-wider text-foreground block">
                  Serviços Públicos Integrados (Sem Necessidade de Chave)
                </span>
                <div className="grid sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded bg-card border flex items-center justify-between">
                    <span>BrasilAPI (CNPJ)</span>
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Operante</Badge>
                  </div>
                  <div className="p-2 rounded bg-card border flex items-center justify-between">
                    <span>Registro.br (Domínios)</span>
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Operante</Badge>
                  </div>
                  <div className="p-2 rounded bg-card border flex items-center justify-between">
                    <span>OpenStreetMap (GPS)</span>
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Operante</Badge>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------------- */}
        {/* ABA 4: CRITÉRIOS DE SCORE & BANCO */}
        {/* ------------------------------------------------------------------- */}
        <TabsContent value="scoring" className="space-y-4 mt-0">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Critérios de Pontuação do Score Digital</CardTitle>
                  <CardDescription className="text-xs">
                    Ajuste o peso de cada falha na presença digital para classificar os leads.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWeights(DEFAULT_WEIGHTS)}
                  className="gap-1 text-xs"
                >
                  <RotateCcw className="h-3 w-3" /> Restaurar Padrão
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(weights).map(([k, val]) => (
                  <div key={k} className="p-2.5 rounded-md border flex items-center justify-between gap-2 text-xs">
                    <span className="text-muted-foreground">{LABELS[k as keyof ScoreWeights] || k}</span>
                    <Input
                      type="number"
                      value={val}
                      onChange={(e) =>
                        setWeights({
                          ...weights,
                          [k]: Number(e.target.value) || 0,
                        })
                      }
                      className="w-16 h-7 text-xs font-mono text-right"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-destructive flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" /> Zona de Gestão de Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <p className="text-muted-foreground">
                Total de empresas cadastradas no CRM: <strong>{empresas.length}</strong>
              </p>
              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    carregarDemo();
                    toast.success("Dados de demonstração carregados com sucesso!");
                  }}
                  className="text-xs"
                >
                  Recarregar Empresas Demo
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm("Tem certeza que deseja zerar a base de empresas?")) {
                      resetPlataforma();
                      toast.success("Base de dados limpa com sucesso!");
                    }
                  }}
                  className="text-xs"
                >
                  Limpar Todas as Empresas
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------------- */}
        {/* ABA 5: BANCO DE DADOS & NUVEM */}
        {/* ------------------------------------------------------------------- */}
        <TabsContent value="database" className="space-y-4 mt-0">
          <Card className="border-emerald-500/20 bg-gradient-to-br from-card to-emerald-500/5 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold">Banco de Dados Centralizado & Persistência</CardTitle>
                    <CardDescription className="text-xs">
                      Todos os dados do CRM, funil de vendas, notas e abordagens são persistidos automaticamente no backend.
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleForcarSincronizacao}
                    disabled={sincronizandoManual || dbSyncStatus === "syncing"}
                    className="gap-1.5 text-xs h-9 border-emerald-500/30 hover:bg-emerald-500/10"
                  >
                    <RefreshCw className={cn("h-3.5 w-3.5", (sincronizandoManual || dbSyncStatus === "syncing") && "animate-spin")} />
                    Sincronizar Agora
                  </Button>
                  <Button
                    size="sm"
                    onClick={exportarBackupJson}
                    className="gap-1.5 text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Exportar Backup JSON
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg border bg-background/60">
                  <div className="text-[11px] text-muted-foreground font-medium">Motor de Banco Ativo</div>
                  <div className="flex items-center gap-1.5 mt-1 font-semibold text-xs text-foreground">
                    <HardDrive className="h-4 w-4 text-emerald-500" />
                    {databaseInfo?.mode === "supabase" ? "Supabase PostgreSQL" : "Servidor Persistente"}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {databaseInfo?.mode === "supabase" ? "Nuvem Lovable / Supabase" : "Gravação Atômica em Disco"}
                  </div>
                </div>

                <div className="p-3 rounded-lg border bg-background/60">
                  <div className="text-[11px] text-muted-foreground font-medium">Status de Sincronização</div>
                  <div className="flex items-center gap-1.5 mt-1 font-semibold text-xs text-emerald-500">
                    <CheckCircle2 className="h-4 w-4" />
                    {dbSyncStatus === "syncing" ? "Gravando alterações..." : "Conectado & Operacional"}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {lastSyncTime ? `Último sync: ${lastSyncTime.toLocaleTimeString()}` : "Sincronizado na inicialização"}
                  </div>
                </div>

                <div className="p-3 rounded-lg border bg-background/60">
                  <div className="text-[11px] text-muted-foreground font-medium">Empresas & Leads</div>
                  <div className="text-base font-bold text-foreground mt-0.5">
                    {empresas.length} empresas
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    + {instagramProfilesDb.length} perfis de Instagram
                  </div>
                </div>

                <div className="p-3 rounded-lg border bg-background/60">
                  <div className="text-[11px] text-muted-foreground font-medium">Blacklist & Exclusões</div>
                  <div className="text-base font-bold text-foreground mt-0.5">
                    {empresasExcluidas.length} excluídas
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Filtro anti-duplicidade ativo
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <Cloud className="h-4 w-4 text-primary" />
                  <span>Esquema Relacional PostgreSQL / Supabase</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  O esquema completo do banco de dados relacional está disponível no repositório em{" "}
                  <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-[11px]">supabase/schema.sql</code>.
                  Ele define as tabelas <code className="font-mono text-[11px]">empresas</code>,{" "}
                  <code className="font-mono text-[11px]">empresas_excluidas</code>,{" "}
                  <code className="font-mono text-[11px]">instagram_profiles</code>,{" "}
                  <code className="font-mono text-[11px]">comunicacao_settings</code> e{" "}
                  <code className="font-mono text-[11px]">score_weights</code> com Row Level Security (RLS) habilitado.
                </p>
                <div className="text-[11px] text-muted-foreground pt-1 flex items-center gap-2">
                  <span className="font-semibold text-foreground">Arquivo de armazenamento local:</span>
                  <code className="bg-background border px-2 py-0.5 rounded font-mono text-[10px] truncate max-w-md">
                    {databaseInfo?.storagePath || ".data/crm-database.json"}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
