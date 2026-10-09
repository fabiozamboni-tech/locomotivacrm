import { createFileRoute, useSearch, Link } from "@tanstack/react-router";
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
import { consultarQsaDecisores, type DecisoresResult, type SocioDecisor } from "@/lib/qsa-decisores.functions";
import { CopilotoObjecoesModal } from "@/components/copiloto-objecoes-modal";
import { CadenciaModal } from "@/components/cadencia-modal";
import { EnviarEmailModal } from "@/components/enviar-email-modal";
import { EnviarWhatsAppModal } from "@/components/enviar-whatsapp-modal";
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
  Users,
  Building,
  UserCheck,
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
  const [nomeAgencia, setNomeAgencia] = useState("Locomotiva Comunicação");
  const [textoEditado, setTextoEditado] = useState("");

  // Modais e Decisores
  const [openCopilotoObjecoes, setOpenCopilotoObjecoes] = useState(false);
  const [openCadenciaModal, setOpenCadenciaModal] = useState(false);
  const [openEmailModal, setOpenEmailModal] = useState(false);
  const [openWhatsModal, setOpenWhatsModal] = useState(false);
  const [decisoresData, setDecisoresData] = useState<DecisoresResult | null>(null);
  const [loadingQSA, setLoadingQSA] = useState(false);
  const [nomeDecisorSelecionado, setNomeDecisorSelecionado] = useState("");

  const empresa = empresas.find((e) => e.id === selected);

  // Executa a busca de sócios e administradores (QSA)
  const buscarDecisoresQSA = async () => {
    if (!empresa) return;
    setLoadingQSA(true);
    try {
      const res = await consultarQsaDecisores({
        data: {
          cnpj: empresa.cnpj,
          nomeEmpresa: empresa.nome,
          cidade: empresa.cidade,
        },
      });
      setDecisoresData(res);
      if (res.decisorPrincipal?.nome) {
        setNomeDecisorSelecionado(res.decisorPrincipal.nome);
      }
      toast.success(`Sócios e administradores de ${empresa.nome} identificados!`);
    } catch (e) {
      toast.error("Não foi possível obter dados de sócios da Receita Federal.");
    } finally {
      setLoadingQSA(false);
    }
  };

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
      toast.success(`Dossiê 360 e abordagens gerados para ${empresa.nome}!`);
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

  // Carrega automaticamente o dossiê ao trocar de empresa se ainda não houver
  useEffect(() => {
    if (empresa && !dossier) {
      executarPesquisaEDossier();
    }
    if (empresa) {
      buscarDecisoresQSA();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  // Injetar o nome do decisor no texto de abordagem
  const aplicarDecisorAoTexto = (nome: string) => {
    setNomeDecisorSelecionado(nome);
    setTextoEditado((prev) => {
      let mod = prev;
      if (mod.includes("[Nome do contato]")) {
        mod = mod.replaceAll("[Nome do contato]", nome);
      } else if (mod.includes("[Nome do Decisor]")) {
        mod = mod.replaceAll("[Nome do Decisor]", nome);
      } else if (mod.startsWith("Olá") || mod.startsWith("Oi")) {
        mod = mod.replace(/^(Olá|Oi)[^!,\n]*/i, `$1, ${nome}`);
      }
      return mod;
    });
    toast.success(`Nome "${nome}" aplicado ao texto de abordagem!`);
  };

  const waNumero = empresa?.whatsapp || empresa?.telefone;
  const waFinal = waSendUrl(waNumero, textoEditado);

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 space-y-6 max-w-[1480px]">
      {/* CABEÇALHO COM BOTÕES DE AÇÃO ESTRATÉGICA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight">Inteligência de Vendas B2B · Locomotiva Comunicação</h1>
            <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-medium">
              Pesquisa em Tempo Real + IA
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Mapeamento corporativo, fatores psicológicos dos decisores, diagnóstico operacional, <strong>Sistemas de Gestão</strong> e prescrição de <strong>Comunicação 360</strong> com foco em geração de lucros.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Disparo de E-mail Direto */}
          {empresa?.email && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenEmailModal(true)}
              className="text-xs h-9 gap-1.5 border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-500/10"
            >
              <Mail className="h-4 w-4 text-blue-500" />
              📧 Disparar E-mail
            </Button>
          )}

          {/* Disparo de WhatsApp Direto */}
          {empresa?.whatsapp && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenWhatsModal(true)}
              className="text-xs h-9 gap-1.5 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
            >
              <MessageCircle className="h-4 w-4 text-emerald-500" />
              💬 WhatsApp Direto
            </Button>
          )}

          {/* Módulo 5: Copiloto de Objeções */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpenCopilotoObjecoes(true)}
            className="text-xs h-9 gap-1.5 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
          >
            <BrainCircuit className="h-4 w-4 text-amber-500" />
            Copiloto Objeções
          </Button>

          {/* Módulo 3: Cadência Multicanal */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpenCadenciaModal(true)}
            className="text-xs h-9 gap-1.5 border-indigo-500/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/10"
          >
            <Calendar className="h-4 w-4 text-indigo-500" />
            Cadência D+0 a D+8
          </Button>

          {/* Módulo 1: Link Micro-Auditoria */}
          {empresa && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="text-xs h-9 gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
            >
              <a href={`/auditoria/${empresa.id}`} target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
                Micro-Auditoria
              </a>
            </Button>
          )}

          {/* Botão de Pesquisa ao Vivo com IA */}
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
            {loadingIA ? "Pesquisando Web & Gerando Dossiê..." : "🔍 Pesquisar Web & Gerar Dossiê"}
          </Button>
        </div>
      </div>

      {/* SELEÇÃO E RESUMO DA EMPRESA */}
      <div className="grid md:grid-cols-[340px_1fr] gap-4 items-center">
        <div className="space-y-1.5">
          <label className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
            Empresa-Alvo para Prospecção
          </label>
          <Select value={selected} onValueChange={(v) => { setSelected(v); setDossier(null); setDecisoresData(null); }}>
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

      {/* MÓDULO 2: DESCOBERTA DE DECISORES (QSA RECEITA FEDERAL + LINKEDIN) */}
      {empresa && (
        <Card className="border-indigo-500/20 bg-gradient-to-r from-card via-indigo-500/5 to-card shadow-sm">
          <CardHeader className="py-2.5 px-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-500" />
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  Sócios & Decisores Identificados (QSA / Receita Federal)
                  {loadingQSA && <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />}
                </CardTitle>
              </div>

              <div className="text-[11px] text-muted-foreground">
                Clique no sócio para personalizar a abordagem ou pesquise seu LinkedIn
              </div>
            </div>
          </CardHeader>

          <CardContent className="px-4 pb-3 pt-0">
            {decisoresData && decisoresData.decisores.length > 0 ? (
              <div className="flex items-center gap-2 flex-wrap">
                {decisoresData.decisores.map((decisor, idx) => {
                  const isSelected = nomeDecisorSelecionado === decisor.nome;
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 p-1.5 px-2.5 rounded-lg border text-xs transition-all ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-500/10 text-indigo-900 dark:text-indigo-200 font-medium"
                          : "border-border/60 bg-card hover:border-indigo-500/40"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => aplicarDecisorAoTexto(decisor.nome)}
                        className="flex items-center gap-1.5 text-left"
                      >
                        <UserCheck className={`h-3.5 w-3.5 ${isSelected ? "text-indigo-600" : "text-muted-foreground"}`} />
                        <span>{decisor.nome}</span>
                        <span className="text-[10px] text-muted-foreground">({decisor.cargo})</span>
                      </button>

                      <a
                        href={decisor.linkedinSearchUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground hover:text-blue-600 p-0.5 rounded hover:bg-muted"
                        title="Buscar perfil no LinkedIn"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs text-muted-foreground py-1">
                <span>Nenhum sócio carregado automaticamente ainda.</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={buscarDecisoresQSA}
                  disabled={loadingQSA}
                  className="h-7 text-xs text-indigo-600 hover:text-indigo-700"
                >
                  Consultar Sócios via BrasilAPI
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* NAVEGAÇÃO DE ABAS PRINCIPAIS */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
        <TabsList className="bg-muted/60 p-1 border border-border/60 rounded-lg flex-wrap h-auto gap-1">
          <TabsTrigger value="abordagens" className="text-xs py-1.5 px-3 flex items-center gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            Central de Abordagens por Canal
          </TabsTrigger>
          <TabsTrigger value="dossier" className="text-xs py-1.5 px-3 flex items-center gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <BrainCircuit className="h-3.5 w-3.5 text-purple-500" />
            Dossiê Psicológico & Abordagens Derivadas
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
                    Locomotiva 360 Integrada
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
                    Texto Estratégico de Abordagem ({CANAIS.find((c) => c.value === canal)?.label})
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Gerado com base no perfil corporativo e nas dores reais da empresa pela Locomotiva Comunicação.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(textoEditado);
                      toast.success("Mensagem copiada para a área de transferência!");
                    }}
                    className="h-8 text-xs gap-1.5"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copiar
                  </Button>

                  {empresa?.email && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOpenEmailModal(true)}
                      className="h-8 text-xs gap-1.5 text-blue-600 border-blue-500/30 hover:bg-blue-500/10"
                    >
                      <Mail className="h-3.5 w-3.5 text-blue-500" />
                      Enviar E-mail
                    </Button>
                  )}

                  {waFinal && (
                    <Button
                      asChild
                      size="sm"
                      className="h-8 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <a href={waFinal} target="_blank" rel="noreferrer">
                        <Send className="h-3.5 w-3.5" />
                        Disparar no WhatsApp
                      </a>
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-4 flex-1 flex flex-col">
                <Textarea
                  value={textoEditado}
                  onChange={(e) => setTextoEditado(e.target.value)}
                  rows={13}
                  className="font-mono text-xs md:text-sm leading-relaxed flex-1 min-h-[280px]"
                />

                <div className="flex items-center justify-between text-xs text-muted-foreground flex-wrap gap-2 pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <span>💡 <strong>Tom Consultivo:</strong> Diagnóstico direto e cálculo financeiro do custo da inação, sem bajulação vazia.</span>
                  </div>
                  <span>{textoEditado.length} caracteres</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ------------------------------------------------------------------- */}
        {/* ABA 2: DOSSIÊ 3 DIMENSÕES + ABORDAGENS DERIVADAS */}
        {/* ------------------------------------------------------------------- */}
        <TabsContent value="dossier" className="space-y-5 mt-0">
          {dossier ? (
            <div className="space-y-5">
              {/* DIMENSÃO 1: FATORES PSICOLÓGICOS E EMOCIONAIS */}
              <Card className="border-purple-500/20 bg-purple-500/5 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="h-5 w-5 text-purple-600" />
                    <div>
                      <CardTitle className="text-base font-bold text-foreground">
                        Dimensão 1: Fatores Psicológicos & Emocionais dos Decisores
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Compreensão profunda das tensões emocionais, riscos percebidos e ambições de crescimento.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Dores Atuais */}
                  <div className="p-3.5 rounded-lg border border-purple-200 dark:border-purple-900 bg-card space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                      <Flame className="h-4 w-4 text-red-500" />
                      Dores Atuais Imediatas
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4 leading-relaxed">
                      {dossier.dimensaoPsicologica.doresAtuais.map((d: string, i: number) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Medos & Riscos */}
                  <div className="p-3.5 rounded-lg border border-purple-200 dark:border-purple-900 bg-card space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                      <ShieldAlert className="h-4 w-4 text-amber-500" />
                      Medos & Riscos de Não Mudar
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4 leading-relaxed">
                      {dossier.dimensaoPsicologica.medosERiscos.map((m: string, i: number) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Desejos & Ambições */}
                  <div className="p-3.5 rounded-lg border border-purple-200 dark:border-purple-900 bg-card space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                      Desejos & Ambições Futuras
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4 leading-relaxed">
                      {dossier.dimensaoPsicologica.desejosEAmbicoes.map((a: string, i: number) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Frustrações Passadas */}
                  <div className="p-3.5 rounded-lg border border-purple-200 dark:border-purple-900 bg-card space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                      <AlertCircle className="h-4 w-4 text-blue-500" />
                      Frustrações Anteriores
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4 leading-relaxed">
                      {dossier.dimensaoPsicologica.frustracoesPassadas.map((f: string, i: number) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* ABORDAGENS PRONTAS DERIVADAS DO DOSSIÊ PSICOLÓGICO */}
              {dossier.abordagensPsicologicas && dossier.abordagensPsicologicas.length > 0 && (
                <Card className="border-purple-500/30 bg-gradient-to-r from-purple-500/5 via-card to-purple-500/5 shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-amber-500" />
                      <div>
                        <CardTitle className="text-base font-bold">
                          Abordagens Estratégicas Derivadas do Dossiê Psicológico
                        </CardTitle>
                        <CardDescription className="text-xs">
                          4 ângulos comerciais prontos baseados nas tensões emocionais e operacionais diagnosticadas pela Locomotiva Comunicação.
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4">
                    {dossier.abordagensPsicologicas.map((ab) => (
                      <div
                        key={ab.id}
                        className="p-4 rounded-xl border bg-card space-y-3 shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="font-semibold text-xs text-foreground">{ab.titulo}</span>
                            <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-600 border-purple-500/30">
                              {ab.gatilho}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground font-medium">🎯 Foco: {ab.foco}</p>
                          <div className="p-3 bg-muted/30 rounded-lg text-xs font-sans whitespace-pre-line leading-relaxed border">
                            {ab.mensagem}
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-1.5 pt-2 border-t flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(ab.mensagem);
                              toast.success("Abordagem copiada!");
                            }}
                            className="h-7 text-xs px-2 gap-1"
                          >
                            <Copy className="h-3 w-3" /> Copiar
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setTextoEditado(ab.mensagem);
                              setActiveTab("abordagens");
                              toast.success("Abordagem carregada no Editor Principal!");
                            }}
                            className="h-7 text-xs px-2 gap-1"
                          >
                            <ArrowRight className="h-3 w-3" /> Usar no Editor
                          </Button>
                          {waSendUrl(empresa?.whatsapp, ab.mensagem) && (
                            <Button
                              asChild
                              size="sm"
                              className="h-7 text-xs px-2 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <a href={waSendUrl(empresa?.whatsapp, ab.mensagem)} target="_blank" rel="noreferrer">
                                <Send className="h-3 w-3" /> WhatsApp
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* DIMENSÃO 2: CENÁRIO OPERACIONAL E FINANCEIRO */}
              <Card className="border-blue-500/20 bg-blue-500/5 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <div>
                      <CardTitle className="text-base font-bold text-foreground">
                        Dimensão 2: Cenário Operacional & Impacto Financeiro
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Gargalos diários de processos e o custo financeiro da inação.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg border border-blue-200 dark:border-blue-900 bg-card space-y-2">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                      Gargalos de Processo & Vendas
                    </span>
                    <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4 leading-relaxed">
                      {dossier.dimensaoOperacional.gargalosProcesso.map((g: string, i: number) => (
                        <li key={i}>{g}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 space-y-2">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                      💰 Custo da Inação (Perda Estimada)
                    </span>
                    <p className="text-xs text-foreground font-medium leading-relaxed">
                      {dossier.dimensaoOperacional.impactoFinanceiroCustoInacao}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg border border-blue-200 dark:border-blue-900 bg-card space-y-2">
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                      Maturidade & Capacidade de Implementação
                    </span>
                    <Badge variant="outline" className="mb-1 text-xs">{dossier.dimensaoOperacional.nivelMaturidade}</Badge>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {dossier.dimensaoOperacional.justificativaMaturidade}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* DIMENSÃO 3: ALINHAMENTO ESTRATÉGICO */}
              <Card className="border-border/60 shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Gauge className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-base font-bold text-foreground">
                        Dimensão 3: Alinhamento Estratégico & Cultura do Negócio
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Adequação da linguagem ao perfil regional e corporativo.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border bg-muted/30 space-y-1.5">
                    <span className="text-xs font-semibold text-foreground block">Metas de Crescimento:</span>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4 leading-relaxed">
                      {dossier.dimensaoEstrategica.metasCrescimento.map((meta: string, i: number) => (
                        <li key={i}>{meta}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg border bg-muted/30 space-y-1.5">
                    <span className="text-xs font-semibold text-foreground block">Perfil de Cultura Organizacional:</span>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {dossier.dimensaoEstrategica.culturaOrganizacional}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="p-8 text-center border rounded-lg bg-muted/20">
              <Bot className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Nenhum dossiê gerado ainda.</p>
              <p className="text-xs text-muted-foreground mt-1">Clique em "Pesquisar Web & Gerar Dossiê" para mapear os 3 eixos psicológicos e operacionais.</p>
            </div>
          )}
        </TabsContent>

        {/* ------------------------------------------------------------------- */}
        {/* ABA 3: SISTEMAS DE GESTÃO & AUTOMAÇÃO */}
        {/* ------------------------------------------------------------------- */}
        <TabsContent value="sistemas" className="space-y-4 mt-0">
          <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-blue-600" />
              <h2 className="text-base font-semibold text-foreground">
                Sistemas de Gestão & Automação Recomendados pela Locomotiva Comunicação
              </h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Além de comunicação e design, a Locomotiva entrega softwares e ferramentas para organizar as vendas, atendimento e rotina da empresa, tornando a parceria indispensável.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {dossier?.dimensaoOperacional.sistemasGestaoRecomendados.map((sis, idx) => (
              <Card key={idx} className="border-border/60 shadow-sm flex flex-col justify-between">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/30">
                      {sis.categoria}
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-bold text-foreground">
                    {sis.nome}
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {sis.beneficioGestao}
                  </CardDescription>
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

      {/* MODAIS ESTRATÉGICOS (MÓDULOS 3 E 5) */}
      <CopilotoObjecoesModal
        empresa={empresa}
        open={openCopilotoObjecoes}
        onOpenChange={setOpenCopilotoObjecoes}
        nomeAgencia={nomeAgencia}
      />

      <CadenciaModal
        empresa={empresa}
        open={openCadenciaModal}
        onOpenChange={setOpenCadenciaModal}
        nomeDecisorPadrao={nomeDecisorSelecionado || "Gestor(a)"}
        nomeAgencia={nomeAgencia}
      />

      {/* MODAIS DE ENVIO DIRETO DE E-MAIL E WHATSAPP */}
      <EnviarEmailModal
        empresa={empresa}
        open={openEmailModal}
        onOpenChange={setOpenEmailModal}
        corpoPadrao={textoEditado}
      />

      <EnviarWhatsAppModal
        empresa={empresa}
        open={openWhatsModal}
        onOpenChange={setOpenWhatsModal}
        mensagemPadrao={textoEditado}
      />
    </div>
  );
}
