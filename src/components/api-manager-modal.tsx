import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { testApiConnection, type ApiTestResult } from "@/lib/api-status.functions";
import { getApiSettings, saveApiSetting, type ApiSettingsMap } from "@/lib/api-settings";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Key,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff,
  Globe,
  Database,
  Building2,
  Sparkles,
  ShieldCheck,
  Server,
  Zap,
} from "lucide-react";

interface ApiManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApiManagerModal({ open, onOpenChange }: ApiManagerModalProps) {
  const testConn = useServerFn(testApiConnection);
  const [settings, setSettings] = useState<ApiSettingsMap>(getApiSettings());
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, ApiTestResult>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [testingAll, setTestingAll] = useState(false);

  // Carrega configurações salvas ao abrir o modal
  useEffect(() => {
    if (open) {
      const current = getApiSettings();
      setSettings(current);
      // Roda teste inicial automático para SerpApi, BrasilAPI, Registro.br e OSM
      runInitialTests(current);
    }
  }, [open]);

  const runInitialTests = async (cur: ApiSettingsMap) => {
    testSingleApi("serpapi", cur.serpapi.key);
    testSingleApi("brasilapi");
    testSingleApi("registrobr");
    testSingleApi("openstreetmap");
    if (cur.apify.key) testSingleApi("apify", cur.apify.key);
  };

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
      const providers = ["serpapi", "apify", "brasilapi", "registrobr", "openstreetmap", "lovable"];
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

    if (res.status === "unauthorized") {
      return (
        <Badge
          variant="outline"
          className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 text-[11px] gap-1"
        >
          <XCircle className="h-3 w-3" />
          Chave Inválida (401)
        </Badge>
      );
    }

    return (
      <Badge
        variant="outline"
        className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 text-[11px] gap-1"
      >
        <XCircle className="h-3 w-3" />
        Erro de Conexão
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="p-5 pb-4 border-b border-border/60 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                Central de Cadastro e Status de APIs
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Cadastre, valide e monitore em tempo real o status de conexão de todas as APIs do ecossistema de prospecção.
              </DialogDescription>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={testAllApis}
              disabled={testingAll}
              className="text-xs h-8 shrink-0 bg-background"
            >
              {testingAll ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin text-primary" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-primary" />
              )}
              Testar Todas as APIs
            </Button>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-4">
          {/* 1. SERPAPI */}
          <Card className="border-border/60 hover:border-border transition-all">
            <CardHeader className="p-4 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      SerpApi — Google Maps & Redes Sociais
                      <Badge variant="secondary" className="text-[10px] font-normal">
                        Oficial
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Alimenta buscas do Google Maps, Instagram, LinkedIn, TikTok, Facebook e Outscraper.
                    </CardDescription>
                  </div>
                </div>

                <div>{renderStatusBadge("serpapi")}</div>
              </div>
            </CardHeader>

            <CardContent className="p-4 pt-0 space-y-3">
              {testResults.serpapi?.details && testResults.serpapi.status === "online" && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Conta Conectada:</span>
                    <span className="font-semibold text-foreground truncate block">
                      {testResults.serpapi.details.accountEmail || "Ativa"}
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
                    <span className="text-muted-foreground block text-[10px]">Uso no Mês:</span>
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
                    placeholder="Chave SerpApi (ex: ec62da1cce88...)"
                    value={settings.serpapi.key}
                    onChange={(e) => handleKeyChange("serpapi", e.target.value)}
                    className="pr-10 text-xs font-mono h-9"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey("serpapi")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    title={showKeys.serpapi ? "Ocultar chave" : "Mostrar chave"}
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
            </CardContent>
          </Card>

          {/* 2. APIFY */}
          <Card className="border-border/60 hover:border-border transition-all">
            <CardHeader className="p-4 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      Apify Actor — Instagram & Web Scraping
                      <Badge variant="secondary" className="text-[10px] font-normal">
                        Opcional
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Scraping profundo de perfis de Instagram com contagem de seguidores e posts.
                    </CardDescription>
                  </div>
                </div>

                <div>{renderStatusBadge("apify")}</div>
              </div>
            </CardHeader>

            <CardContent className="p-4 pt-0 space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showKeys.apify ? "text" : "password"}
                    placeholder="Token de Acesso Apify (apify_api_...)"
                    value={settings.apify.key}
                    onChange={(e) => handleKeyChange("apify", e.target.value)}
                    className="pr-10 text-xs font-mono h-9"
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowKey("apify")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    title={showKeys.apify ? "Ocultar token" : "Mostrar token"}
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
            </CardContent>
          </Card>

          {/* 3. SERVIÇOS PÚBLICOS & OPEN DATA (SEMPRE ATIVOS) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {/* BrasilAPI */}
            <Card className="border-border/60 bg-muted/10">
              <CardHeader className="p-3.5 pb-2">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-xs text-foreground">BrasilAPI / Receita</span>
                  </div>
                  {renderStatusBadge("brasilapi")}
                </div>
              </CardHeader>
              <CardContent className="p-3.5 pt-0 space-y-2">
                <p className="text-[11px] text-muted-foreground">
                  Dados fiscais oficiais de CNPJs, QSA societário e endereço da Receita Federal.
                </p>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-emerald-600 font-medium">100% Gratuito / Sem Chave</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => testSingleApi("brasilapi")}
                    disabled={testing.brasilapi}
                    className="h-6 text-[10px] px-2"
                  >
                    Re-testar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Registro.br */}
            <Card className="border-border/60 bg-muted/10">
              <CardHeader className="p-3.5 pb-2">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-orange-500" />
                    <span className="font-semibold text-xs text-foreground">Registro.br RDAP</span>
                  </div>
                  {renderStatusBadge("registrobr")}
                </div>
              </CardHeader>
              <CardContent className="p-3.5 pt-0 space-y-2">
                <p className="text-[11px] text-muted-foreground">
                  Diretório Whois oficial para checagem de titularidade e expiração de domínios .br.
                </p>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-orange-600 font-medium">100% Gratuito / Sem Chave</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => testSingleApi("registrobr")}
                    disabled={testing.registrobr}
                    className="h-6 text-[10px] px-2"
                  >
                    Re-testar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* OpenStreetMap */}
            <Card className="border-border/60 bg-muted/10">
              <CardHeader className="p-3.5 pb-2">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-blue-500" />
                    <span className="font-semibold text-xs text-foreground">OpenStreetMap</span>
                  </div>
                  {renderStatusBadge("openstreetmap")}
                </div>
              </CardHeader>
              <CardContent className="p-3.5 pt-0 space-y-2">
                <p className="text-[11px] text-muted-foreground">
                  Motor Overpass aberto e global para geolocalização de comércios e estabelecimentos.
                </p>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-blue-600 font-medium">100% Gratuito / Sem Chave</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => testSingleApi("openstreetmap")}
                    disabled={testing.openstreetmap}
                    className="h-6 text-[10px] px-2"
                  >
                    Re-testar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
