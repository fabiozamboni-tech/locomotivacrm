import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { useServerFn } from "@tanstack/react-start";
import { testApiConnection, type ApiTestResult } from "@/lib/api-status.functions";
import { getApiSettings, saveApiSetting, type ApiSettingsMap } from "@/lib/api-settings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CIDADES_RS_FOCO, SEGMENTOS } from "@/lib/mock-data";
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

  const [settings, setSettings] = useState<ApiSettingsMap>(getApiSettings());
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, ApiTestResult>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [testingAll, setTestingAll] = useState(false);

  useEffect(() => {
    const cur = getApiSettings();
    setSettings(cur);
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
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [provider]: {
          provider: provider as any,
          status: "error",
          latencyMs: 0,
          message: err.message || "Erro ao testar API",
        },
      }));
    } finally {
      setTesting((prev) => ({ ...prev, [provider]: false }));
    }
  };

  const testAllApis = async () => {
    setTestingAll(true);
    try {
      const providers = ["serpapi", "apify", "brasilapi", "registrobr", "openstreetmap"];
      for (const p of providers) {
        await testSingleApi(p, settings[p as keyof ApiSettingsMap]?.key);
      }
      toast.success("Diagnóstico de todas as APIs concluído!");
    } finally {
      setTestingAll(false);
    }
  };

  const renderStatusBadge = (provider: string) => {
    const isTesting = testing[provider];
    const res = testResults[provider];

    if (isTesting) {
      return (
        <Badge variant="outline" className="bg-muted text-muted-foreground animate-pulse text-[11px] gap-1">
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
          Testando...
        </Badge>
      );
    }

    if (!res) {
      return (
        <Badge variant="outline" className="text-[11px] text-muted-foreground">
          Não testada
        </Badge>
      );
    }

    if (res.status === "online") {
      return (
        <Badge
          variant="outline"
          className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[11px] gap-1"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
          Ativa & Operando ({res.latencyMs}ms)
        </Badge>
      );
    }

    if (res.status === "unconfigured") {
      return (
        <Badge
          variant="outline"
          className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[11px] gap-1"
        >
          <AlertCircle className="h-3 w-3" />
          Motor Aberto / Sem Chave
        </Badge>
      );
    }

    return (
      <Badge
        variant="outline"
        className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 text-[11px] gap-1"
      >
        <XCircle className="h-3 w-3" />
        {res.status === "unauthorized" ? "Chave Inválida (401)" : "Erro Conexão"}
      </Badge>
    );
  };

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 space-y-6 max-w-[1200px]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações do Sistema</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie chaves de APIs, status de conexão em tempo real, pesos de score e regras da plataforma.
        </p>
      </div>

      {/* =================================================================== */}
      {/* SEÇÃO 1: CENTRAL DE APIS & CONEXÕES ATIVAS */}
      {/* =================================================================== */}
      <Card className="border-border/60">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Key className="h-4 w-4 text-primary" />
                Central de Cadastro e Status de APIs
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Cadastre e teste suas chaves de API. O status em tempo real mostra latência, cotas e conectividade.
              </CardDescription>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={testAllApis}
              disabled={testingAll}
              className="text-xs h-8"
            >
              {testingAll ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin text-primary" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-primary" />
              )}
              Testar Todas as APIs
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* SERPAPI */}
          <div className="rounded-lg border border-border/60 p-4 space-y-3 bg-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold flex items-center gap-2">
                    SerpApi (Google Maps, Instagram, LinkedIn, TikTok, Facebook)
                    <Badge variant="secondary" className="text-[10px]">Oficial</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Motor principal de scraping com dados reais e filtros avançados.
                  </div>
                </div>
              </div>

              <div>{renderStatusBadge("serpapi")}</div>
            </div>

            {testResults.serpapi?.details && testResults.serpapi.status === "online" && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-md bg-emerald-500/5 border border-emerald-500/20 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[10px]">Conta:</span>
                  <span className="font-semibold text-foreground truncate block">
                    {testResults.serpapi.details.accountEmail}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Plano:</span>
                  <span className="font-semibold text-foreground">
                    {testResults.serpapi.details.plan}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Cota Restante:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {testResults.serpapi.details.remainingCredits} buscas
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[10px]">Consumo no Mês:</span>
                  <span className="font-semibold text-foreground">
                    {testResults.serpapi.details.usedCredits ?? 0} buscas
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type={showKeys.serpapi ? "text" : "password"}
                  placeholder="Chave SerpApi..."
                  value={settings.serpapi.key}
                  onChange={(e) => handleKeyChange("serpapi", e.target.value)}
                  className="pr-10 text-xs font-mono h-9"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey("serpapi")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKeys.serpapi ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => testSingleApi("serpapi", settings.serpapi.key)}
                  disabled={testing.serpapi}
                  className="text-xs h-9"
                >
                  {testing.serpapi ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Testar"}
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSaveKey("serpapi")}
                  className="text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Salvar Chave
                </Button>
              </div>
            </div>
          </div>

          {/* APIFY */}
          <div className="rounded-lg border border-border/60 p-4 space-y-3 bg-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold flex items-center gap-2">
                    Apify (Instagram Actor Scraper)
                    <Badge variant="secondary" className="text-[10px]">Opcional</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Scraping avançado com extração de posts e métricas.
                  </div>
                </div>
              </div>

              <div>{renderStatusBadge("apify")}</div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type={showKeys.apify ? "text" : "password"}
                  placeholder="Token Apify (apify_api_...)"
                  value={settings.apify.key}
                  onChange={(e) => handleKeyChange("apify", e.target.value)}
                  className="pr-10 text-xs font-mono h-9"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey("apify")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKeys.apify ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => testSingleApi("apify", settings.apify.key)}
                  disabled={testing.apify || !settings.apify.key}
                  className="text-xs h-9"
                >
                  {testing.apify ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Testar"}
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSaveKey("apify")}
                  className="text-xs h-9"
                >
                  Salvar Token
                </Button>
              </div>
            </div>
          </div>

          {/* OPEN DATA PROVIDERS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {/* BrasilAPI */}
            <div className="rounded-lg border border-border/60 p-3.5 bg-muted/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Database className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-xs">BrasilAPI / Receita</span>
                </div>
                {renderStatusBadge("brasilapi")}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Dados oficiais da Receita Federal (CNPJ, QSA, Abertura).
              </p>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-emerald-600 font-medium">100% Gratuito</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => testSingleApi("brasilapi")}
                  disabled={testing.brasilapi}
                  className="h-6 text-[10px] px-2"
                >
                  Testar
                </Button>
              </div>
            </div>

            {/* Registro.br */}
            <div className="rounded-lg border border-border/60 p-3.5 bg-muted/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-orange-500" />
                  <span className="font-semibold text-xs">Registro.br RDAP</span>
                </div>
                {renderStatusBadge("registrobr")}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Diretório Whois oficial para expiração de domínios .br.
              </p>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-orange-600 font-medium">100% Gratuito</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => testSingleApi("registrobr")}
                  disabled={testing.registrobr}
                  className="h-6 text-[10px] px-2"
                >
                  Testar
                </Button>
              </div>
            </div>

            {/* OpenStreetMap */}
            <div className="rounded-lg border border-border/60 p-3.5 bg-muted/10 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Server className="h-4 w-4 text-blue-500" />
                  <span className="font-semibold text-xs">OpenStreetMap</span>
                </div>
                {renderStatusBadge("openstreetmap")}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Motor Overpass aberto e global para geolocalização.
              </p>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-blue-600 font-medium">100% Gratuito</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => testSingleApi("openstreetmap")}
                  disabled={testing.openstreetmap}
                  className="h-6 text-[10px] px-2"
                >
                  Testar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* =================================================================== */}
      {/* SEÇÃO 2: BASE DE DADOS */}
      {/* =================================================================== */}
      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4 text-amber-500" /> Base de dados da plataforma
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            A plataforma inicia vazia. Popule com dados reais via Google Places (Importação),
            Firecrawl (Analisar site com IA), CSV ou cadastro manual. Atualmente há{" "}
            <span className="font-semibold text-foreground">{empresas.length}</span> empresa(s) na base.
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                if (!confirm("Isso apagará TODAS as empresas da base local. Continuar?")) return;
                resetPlataforma();
                toast.success("Plataforma zerada");
              }}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Zerar plataforma
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                carregarDemo();
                toast.success("Dados de demonstração carregados");
              }}
            >
              <AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> Carregar dados de demonstração
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Os dados de demonstração são fictícios e servem apenas para exploração da interface. Não representam empresas reais.
          </p>
        </CardContent>
      </Card>

      {/* =================================================================== */}
      {/* SEÇÃO 3: PESOS DO SCORE DE OPORTUNIDADE */}
      {/* =================================================================== */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Pesos do score de oportunidade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            {(Object.keys(weights) as (keyof ScoreWeights)[]).map((k) => (
              <div key={k} className="flex items-center gap-3 rounded-md border border-border/60 p-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{LABELS[k]}</div>
                  <div className="text-xs text-muted-foreground">Peso aplicado quando o critério é verdadeiro</div>
                </div>
                <Input
                  type="number"
                  min={0}
                  max={50}
                  className="w-20 text-right"
                  value={weights[k]}
                  onChange={(e) => setWeights({ ...weights, [k]: Number(e.target.value) || 0 })}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => { setWeights(DEFAULT_WEIGHTS); toast.success("Pesos restaurados"); }}>
              Restaurar padrões
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* =================================================================== */}
      {/* SEÇÃO 4: CIDADES & SEGMENTOS */}
      {/* =================================================================== */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-base">Cidades prioritárias</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {CIDADES_RS_FOCO.map((c) => <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>)}
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-base">Segmentos prioritários</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {SEGMENTOS.map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
          </CardContent>
        </Card>
      </div>

      {/* =================================================================== */}
      {/* SEÇÃO 5: TEMPLATE DE ABORDAGEM */}
      {/* =================================================================== */}
      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-base">Template padrão de abordagem</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            defaultValue={"Olá, [nome]! Fiz uma análise da presença digital da [empresa] aqui em [cidade]. Notei 2 ou 3 ajustes rápidos que podem gerar mais contatos. Posso te enviar um resumo curto?"}
            rows={5}
          />
          <p className="text-xs text-muted-foreground mt-2">Este template alimenta o módulo de abordagens. Variáveis aceitas: [nome], [empresa], [cidade].</p>
        </CardContent>
      </Card>
    </div>
  );
}
