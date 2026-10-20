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
  type ApiSettingsMap,
  type ProvedorIaTipo,
  type ApiProviderKey,
} from "@/lib/api-settings";
import {
  getComunicacaoSettings,
  saveComunicacaoSettings,
  type ComunicacaoSettings,
  type RespostaAutomaticaItem,
} from "@/lib/comunicacao-settings";
import {
  enviarEmailDireto_ServerFn,
  dispararWhatsApp_ServerFn,
} from "@/lib/comunicacao.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
    setComunicacao(getComunicacaoSettings());
    testSingleApi("serpapi", cur.serpapi.key);
    testSingleApi("brasilapi");
    testSingleApi("registrobr");
    testSingleApi("openstreetmap");
    if (cur.apify.key) testSingleApi("apify", cur.apify.key);
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
    const updated = saveApiSetting(provider, { key: settings[provider]?.key });
    setSettings(updated);
    toast.success(`Chave da API ${provider.toUpperCase()} salva com sucesso!`);
    testSingleApi(provider, settings[provider]?.key);
  };

  const handleSaveProvedorAtivo = (val: ProvedorIaTipo) => {
    const updated = saveProvedorIaAtivo(val);
    setSettings(updated);
    toast.success(`Motor de IA prioritário definido como: ${val.toUpperCase()}`);
  };

  const testSingleApi = async (provider: string, apiKey?: string) => {
    setTesting((prev) => ({ ...prev, [provider]: true }));
    try {
      const res = await testConn({
        data: {
          provider,
          apiKey: apiKey ?? (settings[provider as ApiProviderKey] as any)?.key,
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
    const providers = ["serpapi", "groq", "gemini", "cerebras", "openrouter", "apify", "brasilapi", "registrobr", "openstreetmap", "lovable"];
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
        {/* ABA 2: WHATSAPP & AUTOMAÇÕES */}
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
                    <CardTitle className="text-base font-bold">Canal WhatsApp & Respostas Automáticas</CardTitle>
                    <CardDescription className="text-xs">
                      Configure o número oficial da Locomotiva Comunicação, gateways e respostas rápidas.
                    </CardDescription>
                  </div>
                </div>

                <Button onClick={handleAddResposta} size="sm" variant="outline" className="text-xs gap-1 h-8">
                  <Plus className="h-3 w-3" /> Adicionar Resposta Rápida
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-2">
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                    Número da Locomotiva (com DDD):
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

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                    Tipo de Integração / Gateway:
                  </label>
                  <Select
                    value={comunicacao.whatsapp.gatewayTipo}
                    onValueChange={(v: any) =>
                      setComunicacao((prev) => ({
                        ...prev,
                        whatsapp: { ...prev.whatsapp, gatewayTipo: v },
                      }))
                    }
                  >
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="web_link">WhatsApp Web / Desktop Oficial</SelectItem>
                      <SelectItem value="zapi">Z-API Gateway</SelectItem>
                      <SelectItem value="evolution_api">Evolution API</SelectItem>
                      <SelectItem value="custom_webhook">Webhook Customizado (HTTP POST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                    URL da API / Webhook (se aplicável):
                  </label>
                  <Input
                    value={comunicacao.whatsapp.apiUrl ?? ""}
                    onChange={(e) =>
                      setComunicacao((prev) => ({
                        ...prev,
                        whatsapp: { ...prev.whatsapp, apiUrl: e.target.value },
                      }))
                    }
                    placeholder="https://api.gateway.com/send-message"
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              {/* Lista de Respostas Automáticas / Scripts */}
              <div className="space-y-3 pt-2">
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

              <div className="flex items-center justify-between gap-3 pt-3 border-t flex-wrap">
                <Button onClick={handleSaveWhatsAppSettings} className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
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
        </TabsContent>

        {/* ------------------------------------------------------------------- */}
        {/* ABA 3: APIS DE PESQUISA & ENRIQUECIMENTO */}
        {/* ------------------------------------------------------------------- */}
        <TabsContent value="apis" className="space-y-5 mt-0">
          
          {/* 1. SELETOR DE MOTOR DE IA PRIORITÁRIO */}
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
                  <SelectTrigger className="w-full sm:w-[320px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">⚡ Automático (Melhor Rota + Fallback Dinâmico)</SelectItem>
                    <SelectItem value="groq">Groq (Llama 3.3 70B · 14.400 req/dia grátis)</SelectItem>
                    <SelectItem value="gemini">Google Gemini (Gemini 2.0 Flash · 1M Contexto)</SelectItem>
                    <SelectItem value="openrouter">OpenRouter Free (:free models)</SelectItem>
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

          {/* 2. PROVEDORES DE IA GRATUITOS (awesome-free-llm-apis) */}
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
                        Gemini 3.8 Flash · 15 RPM · 1.500 req/dia (Sem Cartão)
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

                {/* OPENROUTER FREE */}
                <div className="p-3.5 rounded-lg border border-border/60 bg-card hover:border-border transition-colors space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-foreground">OpenRouter</span>
                      <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-600 border-purple-500/30">
                        openrouter/free · Modelos Gratuitos (Zero Custo)
                      </Badge>
                      <a
                        href="https://openrouter.ai/keys"
                        target="_blank"
                        rel="noopener"
                        className="text-[11px] text-blue-500 hover:underline flex items-center gap-0.5 ml-1"
                      >
                        Obter Chave <ExternalLink className="size-3" />
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
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showKeys["openrouter"] ? "text" : "password"}
                        value={settings.openrouter.key || ""}
                        onChange={(e) => handleKeyChange("openrouter", e.target.value)}
                        placeholder="sk-or-v1-... (Chave OpenRouter)"
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
                      onClick={() => testSingleApi("openrouter", settings.openrouter.key)}
                      disabled={testing["openrouter"]}
                      className="text-xs h-9 px-3"
                    >
                      Testar
                    </Button>
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
