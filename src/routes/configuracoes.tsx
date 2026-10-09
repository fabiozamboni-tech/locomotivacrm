import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { useServerFn } from "@tanstack/react-start";
import { testApiConnection, type ApiTestResult } from "@/lib/api-status.functions";
import { getApiSettings, saveApiSetting, type ApiSettingsMap } from "@/lib/api-settings";
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
  const { weights, setWeights, resetPlataforma, carregarDemo, empresas } = useStore();
  const testConn = useServerFn(testApiConnection);

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

  const handleKeyChange = (provider: keyof ApiSettingsMap, newKey: string) => {
    setSettings((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        key: newKey,
      },
    }));
  };

  const handleSaveKey = (provider: keyof ApiSettingsMap) => {
    const updated = saveApiSetting(provider, { key: settings[provider].key });
    setSettings(updated);
    toast.success(`Chave da API ${provider.toUpperCase()} salva com sucesso!`);
    testSingleApi(provider, settings[provider].key);
  };

  const testSingleApi = async (provider: string, apiKey?: string) => {
    setTesting((prev) => ({ ...prev, [provider]: true }));
    try {
      const res = await testConn({
        data: {
          provider,
          apiKey: apiKey ?? settings[provider as keyof ApiSettingsMap]?.key,
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
    const providers = Object.keys(settings);
    for (const p of providers) {
      await testSingleApi(p, settings[p as keyof ApiSettingsMap].key);
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
            Critérios de Score & Banco
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
        <TabsContent value="apis" className="space-y-4 mt-0">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Server className="h-4 w-4 text-primary" />
                    APIs de Enriquecimento de Dados & IA
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Configure e monitore as integrações para prospecção automatizada de empresas.
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
              <div className="grid gap-3">
                {Object.entries(settings).map(([provider, conf]) => {
                  const result = testResults[provider];
                  const isTesting = testing[provider];

                  return (
                    <div
                      key={provider}
                      className="p-3.5 rounded-lg border border-border/60 bg-card hover:border-border transition-colors space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs uppercase tracking-wider text-foreground">
                            {conf.label}
                          </span>
                          <span className="text-xs text-muted-foreground">({conf.description})</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isTesting ? (
                            <Badge variant="outline" className="text-xs gap-1 border-blue-500/30 text-blue-500">
                              <Loader2 className="h-3 w-3 animate-spin" /> Testando...
                            </Badge>
                          ) : result ? (
                            <Badge
                              variant="outline"
                              className={`text-xs gap-1 ${
                                result.status === "online"
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                  : result.status === "unconfigured"
                                    ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                                    : "bg-red-500/10 text-red-600 border-red-500/30"
                              }`}
                            >
                              {result.status === "online" ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : (
                                <XCircle className="h-3 w-3" />
                              )}
                              {result.status === "online" ? "Ativa & Operante" : result.message}
                            </Badge>
                          ) : null}
                        </div>
                      </div>

                      {conf.requiresKey && (
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Input
                              type={showKeys[provider] ? "text" : "password"}
                              value={conf.key || ""}
                              onChange={(e) => handleKeyChange(provider as any, e.target.value)}
                              placeholder={`Chave da API ${conf.label}`}
                              className="text-xs font-mono pr-8"
                            />
                            <button
                              type="button"
                              onClick={() => toggleShowKey(provider)}
                              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                            >
                              {showKeys[provider] ? (
                                <EyeOff className="h-3.5 w-3.5" />
                              ) : (
                                <Eye className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleSaveKey(provider as any)}
                            className="text-xs h-9 px-3"
                          >
                            Salvar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => testSingleApi(provider, conf.key)}
                            disabled={isTesting}
                            className="text-xs h-9 px-3"
                          >
                            Testar
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
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
      </Tabs>
    </div>
  );
}
