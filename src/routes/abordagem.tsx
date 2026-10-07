import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toCtx } from "@/lib/ai.functions";
import {
  gerarDossierEAbordagens360_IA,
  type Dossier360Result,
  type SistemaGestaoItem,
  type TratamentoSintomaItem,
} from "@/lib/dossier-360.functions";
import { whatsappUrl } from "@/lib/links";
import {
  Copy,
  RefreshCw,
  MessageCircle,
  Mail,
  Instagram,
  Phone,
  Type,
  Sparkles,
  Send,
  Check,
  AlertCircle,
  ShieldAlert,
  TrendingUp,
  Gauge,
  Layers,
  Bot,
  Zap,
  Flame,
  Search,
  ExternalLink,
  Package,
  BarChart3,
  Globe,
  Video,
  FileText,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  BrainCircuit,
  Settings2,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

function waSendUrl(numero: string | undefined, texto: string): string | undefined {
  const base = whatsappUrl(numero);
  if (!base) return undefined;
  return `${base}?text=${encodeURIComponent(texto)}`;
}

export const Route = createFileRoute("/abordagem")({
  validateSearch: z.object({ empresa: z.string().optional() }),
  component: AbordagemPage,
});

type CanalTipo = "whatsapp" | "email" | "instagram" | "ligacaoReuniao" | "propostaValor360";

const CANAIS: { value: CanalTipo; label: string; icon: typeof Mail }[] = [
  { value: "whatsapp", label: "WhatsApp Estratégico", icon: MessageCircle },
  { value: "email", label: "E-mail Executivo", icon: Mail },
  { value: "instagram", label: "Direct Instagram", icon: Instagram },
  { value: "ligacaoReuniao", label: "Roteiro de Reunião", icon: Phone },
  { value: "propostaValor360", label: "Pitch de Proposta 360", icon: FileText },
];

function AbordagemPage() {
  const { empresa: empresaId } = useSearch({ from: "/abordagem" });
  const { empresas } = useStore();
  const [selected, setSelected] = useState<string>(empresaId ?? empresas[0]?.id ?? "");
  const [canal, setCanal] = useState<CanalTipo>("whatsapp");
  const [activeTab, setActiveTab] = useState<"dossier" | "sistemas" | "prescricao" | "abordagens">("abordagens");
  const [dossier, setDossier] = useState<Dossier360Result | null>(null);
  const [loadingIA, setLoadingIA] = useState(false);
  const [nomeAgencia, setNomeAgencia] = useState("nossa agência de Comunicação 360 & Tecnologia");
  const [textoEditado, setTextoEditado] = useState("");

  const empresa = empresas.find((e) => e.id === selected);

  // Executa a análise com IA e pesquisa web em tempo real
  const executarPesquisaEDossier = async () => {
    if (!empresa) return;
    setLoadingIA(true);
    try {
      const res = await gerarDossierEAbordagens360_IA({
        data: {
          empresa: toCtx(empresa),
          canalPreferencial: canal === "propostaValor360" ? "email" : (canal as any),
          nomeAgencia,
        },
      });
      setDossier(res);
      // Preenche o editor com o texto do canal selecionado
      if (res.abordagensPorCanal[canal]) {
        const item = res.abordagensPorCanal[canal];
        if ("texto" in item) {
          setTextoEditado(canal === "email" && "assunto" in item ? `Assunto: ${item.assunto}\n\n${item.texto}` : item.texto);
        } else if ("textoCompleto" in item) {
          setTextoEditado(item.textoCompleto);
        } else if ("falaAbertura" in item) {
          setTextoEditado(`Fala de Abertura:\n${item.falaAbertura}\n\nPergunta-Chave de Diagnóstico:\n${item.perguntaChaveDiagnostico}\n\nPassos da Reunião:\n${item.roteiroPassos.join("\n")}`);
        }
      }
      toast.success(`Pesquisa e Dossiê 360 gerados com sucesso para ${empresa.nome}!`);
    } catch (e) {
      toast.error((e as Error).message || "Falha na análise com IA");
    } finally {
      setLoadingIA(false);
    }
  };

  // Atualiza o texto do editor quando troca de canal ou quando o dossiê carrega
  useEffect(() => {
    if (dossier?.abordagensPorCanal[canal]) {
      const item = dossier.abordagensPorCanal[canal];
      if ("texto" in item) {
        setTextoEditado(canal === "email" && "assunto" in item ? `Assunto: ${item.assunto}\n\n${item.texto}` : item.texto);
      } else if ("textoCompleto" in item) {
        setTextoEditado(item.textoCompleto);
      } else if ("falaAbertura" in item) {
        setTextoEditado(`Fala de Abertura:\n${item.falaAbertura}\n\nPergunta-Chave de Diagnóstico:\n${item.perguntaChaveDiagnostico}\n\nPassos da Reunião:\n${item.roteiroPassos.join("\n")}`);
      }
    }
  }, [canal, dossier]);

  // Carrega automaticamente o dossiê determinístico ao trocar de empresa se ainda não houver
  useEffect(() => {
    if (empresa && !dossier) {
      executarPesquisaEDossier();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const waNumero = empresa?.whatsapp || empresa?.telefone;
  const waFinal = waSendUrl(waNumero, textoEditado);

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 space-y-6 max-w-[1480px]">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight">Inteligência de Vendas B2B & Comunicação 360</h1>
            <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-medium">
              Pesquisa em Tempo Real + IA
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Mapeamento corporativo, fatores psicológicos dos decisores, diagnóstico operacional, <strong>Sistemas de Gestão</strong> e prescrição de <strong>Comunicação 360</strong> com foco em geração de lucros.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            onClick={executarPesquisaEDossier}
            disabled={!empresa || loadingIA}
            className="bg-gradient-to-r from-emerald-600 via-primary to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white shadow-sm text-xs h-9 font-medium"
          >
            {loadingIA ? (
              <Bot className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            {loadingIA ? "Pesquisando Web & Gerando Dossiê..." : "🔍 Pesquisar Web & Gerar Dossiê com IA"}
          </Button>
        </div>
      </div>

      {/* SELEÇÃO E RESUMO DA EMPRESA */}
      <div className="grid md:grid-cols-[380px_1fr] gap-4 items-center">
        <div className="space-y-1.5">
          <label className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
            Empresa-Alvo para Prospecção
          </label>
          <Select value={selected} onValueChange={(v) => { setSelected(v); setDossier(null); }}>
            <SelectTrigger className="text-xs h-9 bg-card">
              <SelectValue placeholder="Selecione uma empresa" />
            </SelectTrigger>
            <SelectContent>
              {empresas.map((e) => (
                <SelectItem key={e.id} value={e.id} className="text-xs">
                  {e.nome} · {e.cidade} ({e.segmento})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {empresa && (
          <div className="flex items-center gap-3 p-2.5 rounded-lg border border-border/60 bg-muted/30 text-xs flex-wrap">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{empresa.nome}</span>
              <Badge variant="outline" className="text-[10px]">{empresa.segmento}</Badge>
              <Badge variant="secondary" className="text-[10px]">{empresa.cidade}/RS</Badge>
            </div>
            <div className="h-3 w-px bg-border/80 hidden sm:block" />
            <div className="text-muted-foreground flex items-center gap-2 text-[11px]">
              <span>Site: <strong>{empresa.site || "Não possui"}</strong></span>
              <span>•</span>
              <span>Instagram: <strong>{empresa.instagram || "Não localizado"}</strong></span>
              <span>•</span>
              <span>Score: <strong>{empresa.score}/100</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* NAVEGAÇÃO DE ABAS PRINCIPAIS */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
        <TabsList className="bg-muted/60 p-1 border border-border/60 rounded-lg flex-wrap h-auto gap-1">
          <TabsTrigger value="abordagens" className="text-xs py-1.5 px-3 flex items-center gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            Central de Abordagens por Canal
          </TabsTrigger>
          <TabsTrigger value="dossier" className="text-xs py-1.5 px-3 flex items-center gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <BrainCircuit className="h-3.5 w-3.5 text-purple-500" />
            Dossiê Psicológico & Operacional (3 Dimensões)
          </TabsTrigger>
          <TabsTrigger value="sistemas" className="text-xs py-1.5 px-3 flex items-center gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Settings2 className="h-3.5 w-3.5 text-blue-500" />
            Sistemas de Gestão & Automação Operacional
          </TabsTrigger>
          <TabsTrigger value="prescricao" className="text-xs py-1.5 px-3 flex items-center gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
            Prescrição 360 & Geração de Lucro
          </TabsTrigger>
        </TabsList>

        {/* ------------------------------------------------------------------- */}
        {/* ABA 1: CENTRAL DE ABORDAGENS POR CANAL */}
        {/* ------------------------------------------------------------------- */}
        <TabsContent value="abordagens" className="space-y-4 mt-0">
          <div className="grid lg:grid-cols-[300px_1fr] gap-5">
            {/* Seletor Lateral de Canais */}
            <Card className="border-border/60 h-fit space-y-3">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  Canais de Abordagem
                </CardTitle>
                <CardDescription className="text-xs">
                  Selecione o formato de comunicação desejado.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {CANAIS.map((c) => {
                  const Icon = c.icon;
                  const active = canal === c.value;
                  return (
                    <button
                      key={c.value}
                      onClick={() => setCanal(c.value)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-md border text-left text-xs transition ${
                        active
                          ? "border-primary bg-primary/10 text-primary font-medium shadow-sm"
                          : "border-border/60 hover:bg-accent text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{c.label}</span>
                      </div>
                      {active && <Check className="h-3.5 w-3.5 text-primary" />}
                    </button>
                  );
                })}

                <div className="pt-3 border-t border-border/50 text-[11px] text-muted-foreground space-y-1.5">
                  <div className="font-semibold text-foreground flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Posicionamento 360 Integrado
                  </div>
                  <p className="leading-relaxed">
                    A abordagem prescreve soluções integradas (Branding, Embalagens, Digital, Vídeos, Sites e Sistemas de Gestão) focadas em gerar lucro.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Painel do Editor da Mensagem */}
            <Card className="border-border/60 shadow-sm flex flex-col justify-between">
              <CardHeader className="pb-3 border-b border-border/50 flex-row items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    {dossier?.abordagensPorCanal[canal]?.titulo || `Mensagem para ${CANAIS.find((c) => c.value === canal)?.label}`}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {dossier?.dimensaoEstrategica.tomRecomendadoAbordagem
                      ? `Tom recomendado: ${dossier.dimensaoEstrategica.tomRecomendadoAbordagem}`
                      : "Personalizada com base no diagnóstico do negócio."}
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(textoEditado);
                      toast.success("Mensagem copiada para a área de transferência!");
                    }}
                    className="text-xs"
                  >
                    <Copy className="h-3.5 w-3.5 mr-1.5" />
                    Copiar
                  </Button>
                  <Button
                    size="sm"
                    disabled={!waFinal}
                    title={waFinal ? "Abrir WhatsApp com esta mensagem" : "Empresa sem WhatsApp cadastrado"}
                    onClick={() => waFinal && window.open(waFinal, "_blank", "noopener")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                  >
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    Enviar no WhatsApp
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-4 flex-1 flex flex-col">
                <Textarea
                  value={textoEditado}
                  onChange={(e) => setTextoEditado(e.target.value)}
                  rows={14}
                  className="font-mono text-xs sm:text-sm leading-relaxed flex-1"
                  placeholder="A mensagem gerada com IA aparecerá aqui..."
                />

                {/* Box de Insights Psicológicos de Apoio */}
                {dossier && (
                  <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <BrainCircuit className="h-3.5 w-3.5 text-purple-500" />
                        Gatilhos Emocionais Aplicados Nesta Abordagem:
                      </span>
                      <Badge variant="outline" className="text-[10px]">
                        Custo da Inação: {dossier.dimensaoOperacional.impactoFinanceiroCustoInacao}
                      </Badge>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                      <div>
                        <strong className="text-foreground">⚡ Dor Imediata Tratada:</strong>{" "}
                        {dossier.dimensaoPsicologica.doresAtuais[0] || "Gargalo de conversão e atendimento"}
                      </div>
                      <div>
                        <strong className="text-foreground">🛡️ Medo Neutralizado:</strong>{" "}
                        {dossier.dimensaoPsicologica.medosERiscos[0] || "Perda de fatia de mercado para concorrentes"}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ------------------------------------------------------------------- */}
        {/* ABA 2: DOSSIÊ PSICOLÓGICO & OPERACIONAL (3 DIMENSÕES) */}
        {/* ------------------------------------------------------------------- */}
        <TabsContent value="dossier" className="space-y-4 mt-0">
          {!dossier ? (
            <Card className="border-border/60 p-8 text-center space-y-3">
              <Bot className="h-10 w-10 mx-auto text-muted-foreground animate-pulse" />
              <div className="text-sm font-semibold">Nenhum dossiê gerado ainda para esta empresa</div>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Clique no botão <strong>"Pesquisar Web & Gerar Dossiê com IA"</strong> acima para varrer a internet, analisar a empresa e montar o raio-x corporativo completo.
              </p>
              <Button size="sm" onClick={executarPesquisaEDossier} disabled={loadingIA}>
                Iniciar Pesquisa & Dossiê
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Resumo da Pesquisa em Tempo Real */}
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Pesquisa Web & Setor em Tempo Real (SerpApi)
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    Termo: <code>{dossier.pesquisaWebRealizada.termoBuscado}</code>
                  </span>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {dossier.pesquisaWebRealizada.resumoMercadoLocal}
                </p>
                {dossier.pesquisaWebRealizada.fontesEncontradas.length > 0 && (
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1">
                    <span>Fontes consultadas:</span>
                    {dossier.pesquisaWebRealizada.fontesEncontradas.map((f, idx) => (
                      <a
                        key={idx}
                        href={f}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        Fonte {idx + 1}
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* 3 Dimensões em Grid */}
              <div className="grid lg:grid-cols-3 gap-4">
                {/* DIMENSÃO 1: FATORES PSICOLÓGICOS */}
                <Card className="border-border/60 border-t-4 border-t-purple-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-purple-700 dark:text-purple-400">
                      <BrainCircuit className="h-4 w-4" />
                      1. Fatores Psicológicos & Emocionais
                    </CardTitle>
                    <CardDescription className="text-xs">O lado humano do decisor B2B</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    <div>
                      <div className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 text-[11px]">
                        <AlertCircle className="h-3.5 w-3.5" /> Dores Diárias Atuais:
                      </div>
                      <ul className="list-disc list-inside text-muted-foreground text-[11px] space-y-1 mt-1">
                        {dossier.dimensaoPsicologica.doresAtuais.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div className="font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 text-[11px]">
                        <ShieldAlert className="h-3.5 w-3.5" /> Medos & Riscos da Inação:
                      </div>
                      <ul className="list-disc list-inside text-muted-foreground text-[11px] space-y-1 mt-1">
                        {dossier.dimensaoPsicologica.medosERiscos.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-[11px]">
                        <TrendingUp className="h-3.5 w-3.5" /> Desejos & Ambições:
                      </div>
                      <ul className="list-disc list-inside text-muted-foreground text-[11px] space-y-1 mt-1">
                        {dossier.dimensaoPsicologica.desejosEAmbicoes.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div className="font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1 text-[11px]">
                        <AlertCircle className="h-3.5 w-3.5" /> Frustrações Passadas com Agências:
                      </div>
                      <ul className="list-disc list-inside text-muted-foreground text-[11px] space-y-1 mt-1">
                        {dossier.dimensaoPsicologica.frustracoesPassadas.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                {/* DIMENSÃO 2: DIAGNÓSTICO OPERACIONAL & FINANCEIRO */}
                <Card className="border-border/60 border-t-4 border-t-blue-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
                      <Settings2 className="h-4 w-4" />
                      2. Diagnóstico Operacional & Financeiro
                    </CardTitle>
                    <CardDescription className="text-xs">A lógica e viabilidade do negócio</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    <div>
                      <div className="font-semibold text-foreground text-[11px]">Gargalos de Processo & Vendas:</div>
                      <ul className="list-disc list-inside text-muted-foreground text-[11px] space-y-1 mt-1">
                        {dossier.dimensaoOperacional.gargalosProcesso.map((g, i) => (
                          <li key={i}>{g}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-md border border-rose-500/20 bg-rose-500/5 p-2.5 space-y-1">
                      <div className="font-semibold text-rose-700 dark:text-rose-400 text-[11px]">
                        Impacto Financeiro (Custo da Inação):
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {dossier.dimensaoOperacional.impactoFinanceiroCustoInacao}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-foreground">Nível de Maturidade:</span>
                        <Badge variant="outline" className="capitalize text-[10px]">
                          {dossier.dimensaoOperacional.nivelMaturidade.replace("_", " ")}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        {dossier.dimensaoOperacional.justificativaMaturidade}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* DIMENSÃO 3: ALINHAMENTO ESTRATÉGICO */}
                <Card className="border-border/60 border-t-4 border-t-emerald-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                      <TrendingUp className="h-4 w-4" />
                      3. Alinhamento Estratégico & Futuro
                    </CardTitle>
                    <CardDescription className="text-xs">Objetivos de longo prazo</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    <div>
                      <div className="font-semibold text-foreground text-[11px]">Metas de Crescimento & Expansão:</div>
                      <ul className="list-disc list-inside text-muted-foreground text-[11px] space-y-1 mt-1">
                        {dossier.dimensaoEstrategica.metasCrescimento.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <div className="font-semibold text-foreground text-[11px]">Cultura Organizacional & Decisores:</div>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        {dossier.dimensaoEstrategica.culturaOrganizacional}
                      </p>
                    </div>

                    <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-2.5 space-y-1">
                      <div className="font-semibold text-emerald-700 dark:text-emerald-400 text-[11px]">
                        Tom Ideal da Abordagem:
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {dossier.dimensaoEstrategica.tomRecomendadoAbordagem}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ------------------------------------------------------------------- */}
        {/* ABA 3: SISTEMAS DE GESTÃO & AUTOMAÇÃO OPERACIONAL */}
        {/* ------------------------------------------------------------------- */}
        <TabsContent value="sistemas" className="space-y-4 mt-0">
          <div className="rounded-lg border border-border/60 bg-card p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-blue-500" />
              <h2 className="text-base font-semibold text-foreground">
                Sistemas de Gestão Recomendados para {empresa?.nome || "a Empresa"}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Além de cuidar de toda a comunicação visual e digital, nossa agência implanta sistemas práticos para organizar a operação, automatizar atendimentos e aumentar a conversão de vendas.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {dossier?.dimensaoOperacional.sistemasGestaoRecomendados.map((sis, i) => (
              <Card key={i} className="border-border/60 flex flex-col justify-between shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      {sis.nome}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={`text-[10px] capitalize ${
                        sis.aplicabilidade === "essencial"
                          ? "bg-rose-500/10 text-rose-600 border-rose-500/30"
                          : "bg-blue-500/10 text-blue-600 border-blue-500/30"
                      }`}
                    >
                      {sis.aplicabilidade}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-xs flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div>
                      <span className="text-[11px] font-semibold text-foreground block">Benefício de Gestão:</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        {sis.beneficioGestao}
                      </p>
                    </div>

                    <div className="rounded bg-emerald-500/5 border border-emerald-500/20 p-2">
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 block">
                        Impacto Direto no Lucro:
                      </span>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        {sis.impactoLucro}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase text-muted-foreground font-semibold block">Exemplo de Uso:</span>
                      <p className="text-[11px] text-muted-foreground italic mt-0.5">
                        "{sis.exemploPratico}"
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setTextoEditado((prev) => `${prev}\n\n[Inclusão do Sistema: ${sis.nome} - ${sis.beneficioGestao}]`);
                      setActiveTab("abordagens");
                      toast.success(`Sistema ${sis.nome} adicionado ao rascunho de abordagem!`);
                    }}
                    className="w-full text-xs mt-2"
                  >
                    + Incluir na Abordagem
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ------------------------------------------------------------------- */}
        {/* ABA 4: PRESCRIÇÃO 360 & GERAÇÃO DE LUCRO */}
        {/* ------------------------------------------------------------------- */}
        <TabsContent value="prescricao" className="space-y-4 mt-0">
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              <h2 className="text-base font-semibold text-foreground">
                Prescrição de Comunicação 360 & Tratamento para Gerar Lucro
              </h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {dossier?.prescricaoTratamentoLucro.resumoFinanceiroLucratividade ||
                "Mapeamento de como tratar cada sintoma identificado na empresa através do mix de Comunicação 360 e Sistemas para maximizar margem e receita."}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {dossier?.prescricaoTratamentoLucro.itensTratamento.map((item, idx) => (
              <Card key={idx} className="border-border/60 shadow-sm flex flex-col justify-between">
                <CardHeader className="pb-2">
                  <Badge variant="outline" className="w-fit text-[10px] mb-1 bg-amber-500/10 text-amber-600 border-amber-500/30">
                    Sintoma #{idx + 1}
                  </Badge>
                  <CardTitle className="text-xs font-semibold leading-snug">
                    {item.sintomaIdentificado}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="rounded bg-primary/5 border border-primary/20 p-2.5">
                      <span className="text-[11px] font-semibold text-primary block">
                        Solução 360 / Sistema Recomendado:
                      </span>
                      <span className="text-[11px] text-foreground font-medium block mt-0.5">
                        {item.solucao360OuSistema}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-foreground block">Como Tratar:</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        {item.comoTratar}
                      </p>
                    </div>

                    <div className="rounded bg-emerald-500/5 border border-emerald-500/20 p-2.5">
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 block">
                        💰 Como Gera Mais Lucro:
                      </span>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                        {item.comoGeraMaisLucro}
                      </p>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setTextoEditado((prev) => `${prev}\n\n[Solução: ${item.solucao360OuSistema} - ${item.comoGeraMaisLucro}]`);
                      setActiveTab("abordagens");
                      toast.success(`Tratamento adicionado à mensagem de abordagem!`);
                    }}
                    className="w-full text-xs mt-2"
                  >
                    + Adicionar à Abordagem
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
