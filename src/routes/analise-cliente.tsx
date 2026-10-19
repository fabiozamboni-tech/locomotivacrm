import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toCtx } from "@/lib/ai.functions";
import {
  gerarDossierEAbordagens360_IA,
  type Dossier360Result,
  type SistemaGestaoItem,
  type TratamentoSintomaItem,
  type PlataformaDemandaItem,
  type MetricaVendaConvincente,
  type ArgumentoMatadorVendas,
} from "@/lib/dossier-360.functions";
import {
  gerarRelatorioLead,
  sementesPadrao,
  type Pilar,
  type Relatorio,
  type DadosSeo,
  type AnalisePublicoAlvo,
} from "@/lib/relatorio.functions";
import { sugerirPublicoAlvoIA_ServerFn } from "@/lib/cadastro-ia.functions";
import { consultarQsaDecisores, type DecisoresResult } from "@/lib/qsa-decisores.functions";
import { gerarSiteCompletoIA_ServerFn, type PesquisaWebSiteResult } from "@/lib/site-generator.server";
import { gerarPrompt, type TipoPrompt } from "@/lib/generators";
import { getApiSettings, type ProvedorIaTipo } from "@/lib/api-settings";
import {
  TONS_ABORDAGEM,
  gerarTextoProntoPorTom,
  obterDicaAbordagem,
  formatarTextoAbordagem,
  type TomAbordagemId,
} from "@/lib/abordagem-tons";
import { gerarAbordagemAmigavelIA_ServerFn } from "@/lib/abordagem-ia.functions";
import { MatrizResponsabilidades } from "@/components/analise-cliente/matriz-responsabilidades";
import { SlideDeckBuilder } from "@/components/analise-cliente/slide-deck-builder";
import { CopilotoObjecoesModal } from "@/components/copiloto-objecoes-modal";
import { CadenciaModal } from "@/components/cadencia-modal";
import { EnviarEmailModal } from "@/components/enviar-email-modal";
import { EnviarWhatsAppModal } from "@/components/enviar-whatsapp-modal";
import { SitePreviewModal } from "@/components/site-preview-modal";
import { whatsappUrl } from "@/lib/links";
import {
  Sparkles,
  LayoutDashboard,
  FileText,
  MessageSquareText,
  Globe,
  Presentation,
  CheckCircle2,
  Clock,
  RefreshCw,
  Printer,
  Copy,
  Mail,
  MessageCircle,
  Users,
  Search,
  ExternalLink,
  Code2,
  Download,
  Save,
  Phone,
  Layers,
  Bot,
  Zap,
  TrendingUp,
  ShieldCheck,
  Building2,
  Info,
  Loader2,
  ChevronRight,
  Target,
  Instagram,
  Smile,
  HeartHandshake,
  Coffee,
  Award,
  RotateCcw,
  SlidersHorizontal,
  HelpCircle,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import type { Empresa, ApresentacaoSlidesData } from "@/lib/mock-data";

export const Route = createFileRoute("/analise-cliente")({
  validateSearch: z.object({
    empresa: z.string().optional(),
    tab: z.enum(["visao-geral", "relatorio", "dossier", "site", "slides"]).optional(),
  }),
  head: () => ({
    meta: [
      { title: "Análise do Cliente — Locomotiva Comunicação" },
      { name: "description", content: "Central estratégica de inteligência de prospecção, diagnóstico de presença digital, abordagem 360 e apresentações." },
    ],
  }),
  component: AnaliseClientePage,
});

type TabKey = "visao-geral" | "relatorio" | "dossier" | "site" | "slides";
type CanalTipo = "whatsapp" | "email" | "instagram" | "ligacaoReuniao" | "propostaValor360";

const CANAIS: { value: CanalTipo; label: string; icon: typeof Mail }[] = [
  { value: "whatsapp", label: "WhatsApp Estratégico", icon: MessageCircle },
  { value: "instagram", label: "Direct Instagram", icon: Instagram },
  { value: "email", label: "E-mail Executivo", icon: Mail },
  { value: "ligacaoReuniao", label: "Roteiro de Reunião / Áudio", icon: Phone },
  { value: "propostaValor360", label: "Pitch de Proposta 360", icon: FileText },
];

const PROVEDORES_IA_ABORDAGEM: { value: ProvedorIaTipo; label: string; badge: string; desc: string }[] = [
  { value: "auto", label: "Automático (Melhor Disponível)", badge: "Recomendado", desc: "Prioriza Groq/Cerebras Llama 3.3 e faz fallback inteligente" },
  { value: "groq", label: "Groq (Llama 3.3 70B)", badge: "Ultra Rápido", desc: "Respostas em milissegundos com modelo aberto topo de linha" },
  { value: "cerebras", label: "Cerebras (Llama 3.3 70B)", badge: "Velocidade Máxima", desc: "Hardware wafer-scale de altíssima taxa de tokens/s" },
  { value: "gemini", label: "Google Gemini 2.0 Flash", badge: "Alta Criatividade", desc: "Excelente raciocínio e redação persuasiva contextualizada" },
  { value: "openrouter", label: "OpenRouter (Modelos Free)", badge: "Livre", desc: "Acesso a catálogo variado de modelos gratuitos" },
  { value: "ollama", label: "Ollama (Local / Offline)", badge: "Privado", desc: "Executa modelos em seu servidor local sem enviar dados" },
];

const PILARES_OPCOES: { value: Pilar; label: string }[] = [
  { value: "site", label: "Site" },
  { value: "comunicacao", label: "Comunicação" },
  { value: "redes", label: "Redes sociais" },
  { value: "branding", label: "Branding" },
];

const TIPOS_PROMPTS: { value: TipoPrompt; label: string; desc: string }[] = [
  { value: "site_novo", label: "Site novo", desc: "Briefing completo para criação de site" },
  { value: "site_redesign", label: "Redesign de site", desc: "Considera problemas do site atual" },
  { value: "ig_estrategia", label: "Estratégia Instagram", desc: "Posicionamento e pilares editoriais" },
  { value: "ig_posts", label: "Ideias de posts", desc: "Calendário inicial de 30 dias" },
];

function AnaliseClientePage() {
  const search = useSearch({ from: "/analise-cliente" });
  const navigate = useNavigate();
  const { empresas, updateEmpresa, addHistorico } = useStore();

  const [selEmpresaId, setSelEmpresaId] = useState<string>(
    search.empresa ?? empresas[0]?.id ?? "",
  );
  const [activeTab, setActiveTab] = useState<TabKey>(search.tab ?? "visao-geral");

  const empresa = empresas.find((e) => e.id === selEmpresaId);

  // Sincroniza query params
  const handleTrocaEmpresa = (novoId: string) => {
    setSelEmpresaId(novoId);
    navigate({
      to: "/analise-cliente",
      search: { empresa: novoId, tab: activeTab },
      replace: true,
    });
  };

  const handleTrocaTab = (novaTab: string) => {
    const k = novaTab as TabKey;
    setActiveTab(k);
    navigate({
      to: "/analise-cliente",
      search: { empresa: selEmpresaId, tab: k },
      replace: true,
    });
  };

  // Estados e Carregamento do Dossiê 360 & Abordagens (Persistido)
  const [dossier, setDossier] = useState<Dossier360Result | null>(empresa?.dossier360 ?? null);
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [canal, setCanal] = useState<CanalTipo>("whatsapp");
  const [textoAbordagemEditado, setTextoAbordagemEditado] = useState("");
  const [subTabDossier, setSubTabDossier] = useState<"abordagens" | "dossier" | "demanda" | "sistemas" | "prescricao">("abordagens");
  const [decisoresData, setDecisoresData] = useState<DecisoresResult | null>(null);
  const [loadingQSA, setLoadingQSA] = useState(false);
  const [cnpjInput, setCnpjInput] = useState(empresa?.cnpj ?? "");

  // Estados de Tons de Abordagem Amigáveis & IA (awesome-free-llm-apis)
  const gerarAbordagemIAFn = useServerFn(gerarAbordagemAmigavelIA_ServerFn);
  const [tomAbordagem, setTomAbordagem] = useState<TomAbordagemId>("amigavel_elogio");
  const [provedorIaAbordagem, setProvedorIaAbordagem] = useState<ProvedorIaTipo>("auto");
  const [instrucaoIaAbordagem, setInstrucaoIaAbordagem] = useState("");
  const [gerandoAbordagemIA, setGerandoAbordagemIA] = useState(false);
  const [metaAbordagem, setMetaAbordagem] = useState<{ provedor: string; modelo: string; fallback?: boolean } | null>(null);

  // Modais de apoio
  const [openCopilotoObjecoes, setOpenCopilotoObjecoes] = useState(false);
  const [openCadenciaModal, setOpenCadenciaModal] = useState(false);
  const [openEmailModal, setOpenEmailModal] = useState(false);
  const [openWhatsModal, setOpenWhatsModal] = useState(false);

  // ---------------------------------------------------------------------------
  // ESTADOS E CARREGAMENTO DO RELATÓRIO DO LEAD (PERSISTIDO)
  // ---------------------------------------------------------------------------
  const gerarRelatorioFn = useServerFn(gerarRelatorioLead);
  const sugerirPublicoAlvoFn = useServerFn(sugerirPublicoAlvoIA_ServerFn);
  const [pilares, setPilares] = useState<Pilar[]>(["site", "comunicacao", "redes", "branding"]);
  const [loadingRelatorio, setLoadingRelatorio] = useState(false);
  const [resRelatorio, setResRelatorio] = useState<{
    relatorio: Relatorio;
    seo: DadosSeo;
    geradoEm: string;
  } | null>(
    empresa?.relatorioLead && empresa?.relatorioSeo
      ? {
          relatorio: empresa.relatorioLead,
          seo: empresa.relatorioSeo,
          geradoEm: empresa.relatorioGeradoEm || empresa.analiseAtualizadaEm || "",
        }
      : null,
  );
  const [sementesTxt, setSementesTxt] = useState("");
  const [consultaGoogle, setConsultaGoogle] = useState("");
  const [termosTxt, setTermosTxt] = useState("");
  const [publicoAlvoTxt, setPublicoAlvoTxt] = useState("");
  const [gerandoPublicoAlvo, setGerandoPublicoAlvo] = useState(false);

  // ---------------------------------------------------------------------------
  // ESTADOS DO ESTÚDIO DE SITES & PROMPTS
  // ---------------------------------------------------------------------------
  const gerarSiteFn = useServerFn(gerarSiteCompletoIA_ServerFn);
  const [gerandoSite, setGerandoSite] = useState(false);
  const [siteHtml, setSiteHtml] = useState<string>(empresa?.siteGeradoHtml ?? "");
  const [pesquisaSite, setPesquisaSite] = useState<PesquisaWebSiteResult | null>(null);
  const [provedorSite, setProvedorSite] = useState<ProvedorIaTipo>("auto");
  const [devicePreview, setDevicePreview] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [siteFullscreenOpen, setSiteFullscreenOpen] = useState(false);
  const [tipoPrompt, setTipoPrompt] = useState<TipoPrompt>("site_novo");
  const [subModoSite, setSubModoSite] = useState<"site" | "prompts">("site");

  // ---------------------------------------------------------------------------
  // SINCRONIZAÇÃO QUANDO ALTERNA EMPRESA SELECIONADA
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!empresa) return;

    // Sincroniza Dossiê persistido do banco
    setDossier(empresa.dossier360 ?? null);
    setCnpjInput(empresa.cnpj ?? "");
    setDecisoresData(null);

    // Sincroniza Relatório persistido do banco
    if (empresa.relatorioLead && empresa.relatorioSeo) {
      setResRelatorio({
        relatorio: empresa.relatorioLead,
        seo: empresa.relatorioSeo,
        geradoEm: empresa.relatorioGeradoEm || empresa.analiseAtualizadaEm || "",
      });
    } else {
      setResRelatorio(null);
    }

    setSementesTxt(
      empresa.buscasPartida?.trim() ||
        sementesPadrao(empresa.segmento, empresa.cidade, empresa.areaAtuacao).join("\n"),
    );
    setConsultaGoogle(
      empresa.buscaGoogleMaps?.trim() ||
        (empresa.areaAtuacao
          ? `${empresa.areaAtuacao.split(/[,\-–\.]/)[0].trim()} em ${empresa.cidade}`
          : `${empresa.segmento} em ${empresa.cidade}`),
    );
    setTermosTxt(empresa.termosEncontrados?.trim() || "");
    setPublicoAlvoTxt(empresa.publicoAlvo?.trim() || "");

    // Sincroniza Site persistido do banco
    setSiteHtml(empresa.siteGeradoHtml ?? "");
    setPesquisaSite(null);
  }, [empresa?.id]);

  // Atualiza texto da abordagem quando altera canal, dossiê ou empresa
  useEffect(() => {
    if (!empresa) return;

    if (dossier?.abordagensPorCanal) {
      const item = dossier.abordagensPorCanal[canal];
      if (item) {
        if ("texto" in item && item.texto) {
          setTextoAbordagemEditado(
            canal === "email" && "assunto" in item ? `Assunto: ${item.assunto}\n\n${item.texto}` : item.texto,
          );
          setMetaAbordagem({ provedor: "Dossiê 360", modelo: "Salvo no Banco", fallback: false });
          return;
        } else if ("textoCompleto" in item && item.textoCompleto) {
          setTextoAbordagemEditado(item.textoCompleto);
          setMetaAbordagem({ provedor: "Dossiê 360", modelo: "Salvo no Banco", fallback: false });
          return;
        } else if ("falaAbertura" in item && item.falaAbertura) {
          setTextoAbordagemEditado(
            `Fala de Abertura:\n${item.falaAbertura}\n\nPergunta-Chave de Diagnóstico:\n${item.perguntaChaveDiagnostico}\n\nPassos da Reunião:\n${item.roteiroPassos.join("\n")}`,
          );
          setMetaAbordagem({ provedor: "Dossiê 360", modelo: "Salvo no Banco", fallback: false });
          return;
        }
      }
    }

    // Se ainda não tiver texto no dossiê, preenche com texto pronto humanizado do tom selecionado
    const pronto = gerarTextoProntoPorTom(toCtx(empresa), canal, tomAbordagem, "Locomotiva Comunicação");
    setTextoAbordagemEditado(formatarTextoAbordagem(canal, pronto));
    setMetaAbordagem({ provedor: "Estratégia Pronta", modelo: "Texto Humanizado de Alta Conversão", fallback: false });
  }, [canal, dossier, empresa?.id]);

  // ---------------------------------------------------------------------------
  // HANDLERS DE EXECUÇÃO E GRAVAÇÃO
  // ---------------------------------------------------------------------------

  // 1. Gera Dossiê 360 e Salva no Banco de Dados
  const handleGerarDossier = async () => {
    if (!empresa) return;
    setLoadingDossier(true);
    try {
      const res = await gerarDossierEAbordagens360_IA({
        data: {
          empresa: toCtx(empresa),
          canalPreferencial: canal === "propostaValor360" ? "email" : (canal as any),
          nomeAgencia: "Locomotiva Comunicação",
        },
      });

      setDossier(res);

      // Salva no banco de dados
      updateEmpresa(empresa.id, {
        dossier360: res,
        analiseAtualizadaEm: new Date().toISOString(),
      });

      addHistorico(empresa.id, {
        data: new Date().toISOString(),
        tipo: "nota",
        texto: `Dossiê 360 e abordagens gerados e salvos no banco de dados.`,
      });

      toast.success(`Dossiê 360 salvo com sucesso para ${empresa.nome}!`);
    } catch (err: any) {
      toast.error(err.message || "Falha ao gerar dossiê com IA.");
    } finally {
      setLoadingDossier(false);
    }
  };

  // 1.1 Seleciona Tom de Abordagem e Aplica Texto Pronto
  const handleSelecionarTom = (novoTom: TomAbordagemId) => {
    setTomAbordagem(novoTom);
    if (!empresa) return;
    const pronto = gerarTextoProntoPorTom(toCtx(empresa), canal, novoTom, "Locomotiva Comunicação");
    setTextoAbordagemEditado(formatarTextoAbordagem(canal, pronto));
    setMetaAbordagem({
      provedor: "Estratégia Pronta",
      modelo: "Texto Humanizado de Alta Conversão",
      fallback: false,
    });
    const tomInfo = TONS_ABORDAGEM.find((t) => t.id === novoTom);
    toast.info(`Tom "${tomInfo?.nome}" aplicado ao canal ativo!`);
  };

  // 1.2 Restaura o Texto Pronto do Tom Ativo
  const handleRestaurarTextoPronto = () => {
    if (!empresa) return;
    const pronto = gerarTextoProntoPorTom(toCtx(empresa), canal, tomAbordagem, "Locomotiva Comunicação");
    setTextoAbordagemEditado(formatarTextoAbordagem(canal, pronto));
    setMetaAbordagem({
      provedor: "Estratégia Pronta",
      modelo: "Texto Humanizado de Alta Conversão",
      fallback: false,
    });
    toast.success("Texto pronto do tom restaurado com sucesso!");
  };

  // 1.3 Gera Novo Texto de Abordagem com IA (awesome-free-llm-apis)
  const handleGerarAbordagemComIA = async () => {
    if (!empresa) return;
    setGerandoAbordagemIA(true);
    try {
      const res = await gerarAbordagemIAFn({
        data: {
          empresa: toCtx(empresa),
          canal,
          tom: tomAbordagem,
          provedor: provedorIaAbordagem,
          instrucaoCustomizada: instrucaoIaAbordagem,
        },
      });

      setTextoAbordagemEditado(formatarTextoAbordagem(canal, res));
      const ehFallback = res.provedorUtilizado.toLowerCase().includes("pronto");
      setMetaAbordagem({
        provedor: res.provedorUtilizado,
        modelo: res.modeloUtilizado,
        fallback: ehFallback,
      });

      if (ehFallback) {
        toast.info("Texto pronto estratégico aplicado (nenhuma chave de IA configurada ou ativa).");
      } else {
        toast.success(`Nova abordagem amigável gerada via ${res.provedorUtilizado} (${res.modeloUtilizado})!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao conectar com a IA. Restaurando texto pronto.");
      const pronto = gerarTextoProntoPorTom(toCtx(empresa), canal, tomAbordagem, "Locomotiva Comunicação");
      setTextoAbordagemEditado(formatarTextoAbordagem(canal, pronto));
    } finally {
      setGerandoAbordagemIA(false);
    }
  };

  // 1.4 Salva a Abordagem Ativa no Dossiê 360 e no Banco de Dados
  const handleSalvarAbordagemNoDossier = () => {
    if (!empresa) return;
    const textoLimpo = textoAbordagemEditado.trim();
    if (!textoLimpo) {
      toast.error("O texto da abordagem está vazio.");
      return;
    }

    const tomAtualObj = TONS_ABORDAGEM.find((t) => t.id === tomAbordagem);
    const canalAtualObj = CANAIS.find((c) => c.value === canal);

    const dossierAtual: Dossier360Result = dossier ?? {
      empresaNome: empresa.nome,
      segmento: empresa.segmento,
      cidade: empresa.cidade,
      pesquisaWebRealizada: {
        termoBuscado: `${empresa.nome} ${empresa.cidade}`,
        fontesEncontradas: [],
        resumoMercadoLocal: `Segmento de ${empresa.segmento} em ${empresa.cidade}.`,
      },
      dimensaoPsicologica: {
        doresAtuais: ["Falta de previsibilidade na captação"],
        medosERiscos: ["Dependência excessiva de indicações"],
        desejosEAmbicoes: ["Ser referência de qualidade regional"],
        frustracoesPassadas: ["Agências que não entenderam o negócio"],
      },
      abordagensPsicologicas: [],
      inteligenciaPresencaDigital: {
        resumoDemandaLocal: "Potencial alto para atração de clientes qualificados.",
        porQuePresencaDigitalImporta: "Gera autoridade e quebra objeção de preço.",
        demandasPorPlataforma: [],
        metricasConvincentesVendas: [],
        projecaoVendas: {
          cenarioAtualPerdido: "Leads que buscam e não encontram",
          potencialCapturaMensal: "15 a 30 contatos qualificados",
          estimativaImpactoFaturamento: "Crescimento sustentável",
          roiEstimadoComunicacao: "Multiplicador de 3x a 5x",
        },
        argumentosMatadoresParaAbordagem: [],
      },
      dimensaoOperacional: {
        gargalosProcesso: ["Tempo gasto em atendimento manual"],
        impactoFinanceiroCustoInacao: "Perda de oportunidades diárias",
        nivelMaturidade: "intermediaria",
        justificativaMaturidade: "Possui operação consolidada e bom atendimento.",
        sistemasGestaoRecomendados: [],
      },
      dimensaoEstrategica: {
        metasCrescimento: ["Expandir carteira com clientes de alto padrão"],
        culturaOrganizacional: "Foco em excelência e confiança",
        tomRecomendadoAbordagem: tomAtualObj?.nome || "Amigável & Elogio Genuíno",
      },
      prescricaoTratamentoLucro: {
        itensTratamento: [],
        resumoFinanceiroLucratividade: "Aumento de margem ao atrair clientes que valorizam a qualidade.",
      },
      abordagensPorCanal: {
        whatsapp: { titulo: "WhatsApp Estratégico", texto: "", ganchoAbertura: "", focoPrincipal: "" },
        email: { titulo: "E-mail Executivo", assunto: `Parceria & Oportunidade - ${empresa.nome}`, texto: "", focoPrincipal: "" },
        instagram: { titulo: "Direct Instagram", texto: "", ganchoAbertura: "" },
        ligacaoReuniao: { titulo: "Roteiro de Reunião", falaAbertura: "", perguntaChaveDiagnostico: "", roteiroPassos: [] },
        propostaValor360: { titulo: "Pitch de Proposta 360", resumoExecutivo: "", textoCompleto: "" },
      },
    };

    const novoDossier: Dossier360Result = {
      ...dossierAtual,
      dimensaoEstrategica: {
        ...dossierAtual.dimensaoEstrategica,
        tomRecomendadoAbordagem: tomAtualObj?.nome || dossierAtual.dimensaoEstrategica.tomRecomendadoAbordagem,
      },
      abordagensPorCanal: {
        ...dossierAtual.abordagensPorCanal,
        [canal]:
          canal === "email"
            ? {
                ...dossierAtual.abordagensPorCanal.email,
                texto: textoLimpo,
              }
            : canal === "ligacaoReuniao"
            ? {
                ...dossierAtual.abordagensPorCanal.ligacaoReuniao,
                falaAbertura: textoLimpo,
              }
            : canal === "propostaValor360"
            ? {
                ...dossierAtual.abordagensPorCanal.propostaValor360,
                textoCompleto: textoLimpo,
              }
            : {
                ...dossierAtual.abordagensPorCanal[canal as "whatsapp" | "instagram"],
                texto: textoLimpo,
              },
      },
    };

    setDossier(novoDossier);
    updateEmpresa(empresa.id, {
      dossier360: novoDossier,
      analiseAtualizadaEm: new Date().toISOString(),
    });

    addHistorico(empresa.id, {
      data: new Date().toISOString(),
      tipo: "nota",
      texto: `Roteiro de abordagem para ${canalAtualObj?.label} salvo no dossiê (${tomAtualObj?.nome}).`,
    });

    toast.success(`Abordagem para ${canalAtualObj?.label} salva no Dossiê com sucesso!`);
  };

  // 2. Gera Relatório SEO e Salva no Banco de Dados
  const linhas = (t: string) => t.split("\n").map((x) => x.trim()).filter(Boolean);

  const handleGerarRelatorio = async () => {
    if (!empresa) return;
    setLoadingRelatorio(true);
    try {
      const r = await gerarRelatorioFn({
        data: {
          empresa: {
            nome: empresa.nome,
            segmento: empresa.segmento,
            areaAtuacao: empresa.areaAtuacao,
            publicoAlvo: publicoAlvoTxt || empresa.publicoAlvo,
            cidade: empresa.cidade,
            site: empresa.site,
            instagram: empresa.instagram,
            statusSite: empresa.statusSite,
            statusInstagram: empresa.statusInstagram,
            score: empresa.score,
            observacoes: empresa.observacoes,
          },
          pilares,
          agencia: "Locomotiva Comunicação",
          ajustes: {
            sementes: linhas(sementesTxt),
            consulta: consultaGoogle,
            termos: linhas(termosTxt),
            publicoAlvo: publicoAlvoTxt || empresa.publicoAlvo,
          },
        },
      });

      setResRelatorio(r);
      const novosTermos = r.seo.termos.map((t) => t.termo).join("\n");
      setTermosTxt(novosTermos);
      setSementesTxt(r.seo.sementes.join("\n"));
      setConsultaGoogle(r.seo.consulta);

      // Salva no banco de dados
      updateEmpresa(empresa.id, {
        relatorioLead: r.relatorio,
        relatorioSeo: r.seo,
        relatorioGeradoEm: r.geradoEm,
        buscasPartida: r.seo.sementes.join("\n"),
        termosEncontrados: novosTermos,
        buscaGoogleMaps: r.seo.consulta,
        publicoAlvo: publicoAlvoTxt || undefined,
        analiseAtualizadaEm: new Date().toISOString(),
      });

      addHistorico(empresa.id, {
        data: new Date().toISOString(),
        tipo: "nota",
        texto: `Relatório de diagnóstico SEO gerado e salvo no banco de dados.`,
      });

      toast.success("Relatório de diagnóstico salvo com sucesso no banco de dados!");
    } catch (err: any) {
      toast.error(err.message || "Falha ao gerar relatório.");
    } finally {
      setLoadingRelatorio(false);
    }
  };

  // 3. Gera Site Moderno com GSAP e Imagens e Salva no Banco de Dados
  const handleGerarSite = async () => {
    if (!empresa) return;
    setGerandoSite(true);
    toast.info("Iniciando pesquisa web e gerador de site com GSAP e fotos de alta resolução...");
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
          provedorPreferencial: provedorSite,
          customKeys,
        },
      });

      setSiteHtml(res.html);
      setPesquisaSite(res.pesquisaWeb);

      // Salva no banco de dados
      updateEmpresa(empresa.id, {
        siteGeradoHtml: res.html,
        siteGeradoData: res.geradoEm,
        analiseAtualizadaEm: new Date().toISOString(),
      });

      addHistorico(empresa.id, {
        data: new Date().toISOString(),
        tipo: "nota",
        texto: `Site de alta conversão com animações GSAP e fotos gerado e salvo no banco.`,
      });

      toast.success("Site gerado com animações GSAP e salvo no banco de dados!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar site.");
    } finally {
      setGerandoSite(false);
    }
  };

  // 4. Salvar Apresentação de Slides Editada no Banco de Dados
  const handleSalvarSlides = (deck: ApresentacaoSlidesData) => {
    if (!empresa) return;
    updateEmpresa(empresa.id, {
      apresentacaoSlides: deck,
      analiseAtualizadaEm: new Date().toISOString(),
    });
    addHistorico(empresa.id, {
      data: new Date().toISOString(),
      tipo: "nota",
      texto: `Apresentação de slides comercial atualizada e salva no banco de dados.`,
    });
  };

  // 5. Botão Master: Atualiza Análise Completa de Uma Vez
  const [atualizandoTudo, setAtualizandoTudo] = useState(false);
  const handleAtualizarTudo = async () => {
    if (!empresa) return;
    setAtualizandoTudo(true);
    toast.info("Atualizando Dossiê, Relatório e Diagnóstico com IA...");
    try {
      await Promise.all([handleGerarDossier(), handleGerarRelatorio()]);
      toast.success("Análise completa atualizada e sincronizada com sucesso!");
    } catch {
      toast.error("Ocorreu um erro ao atualizar parte da análise.");
    } finally {
      setAtualizandoTudo(false);
    }
  };

  const copy = (t: string) => {
    navigator.clipboard.writeText(t);
    toast.success("Copiado com sucesso!");
  };

  const fone = empresa?.whatsapp || empresa?.telefone;

  return (
    <div className="space-y-6">
      {/* =========================================================================
          CABEÇALHO UNIFICADO "ANÁLISE DO CLIENTE"
         ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-xl border border-border/80 bg-card shadow-sm print:hidden">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Análise do cliente</h1>
            {empresa?.analiseAtualizadaEm || empresa?.dossier360 || empresa?.relatorioLead ? (
              <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Análise Salva no Banco de Dados
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1">
                <Clock className="h-3 w-3" />
                Análise Pendente de Geração
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Diagnóstico 360, matriz de responsabilidades, roteiros de abordagem, estúdio de sites com GSAP e slides para o lead.
          </p>
        </div>

        {/* SELETOR DE EMPRESA & AÇÃO MASTER */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-64 sm:w-72">
            <Select value={selEmpresaId} onValueChange={handleTrocaEmpresa}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Selecione a empresa..." />
              </SelectTrigger>
              <SelectContent>
                {empresas.map((e) => (
                  <SelectItem key={e.id} value={e.id} className="text-xs">
                    {e.nome} — {e.cidade} ({e.segmento})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleAtualizarTudo}
            disabled={!empresa || atualizandoTudo || loadingDossier || loadingRelatorio}
            size="sm"
            className="gap-1.5 text-xs bg-primary text-primary-foreground hover:opacity-90 shadow-sm"
          >
            {atualizandoTudo ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            {atualizandoTudo ? "Atualizando Análise..." : "Atualizar Análise com IA"}
          </Button>

          {fone && (
            <Button variant="outline" size="sm" asChild className="h-9 text-xs gap-1.5">
              <a href={whatsappUrl(fone)} target="_blank" rel="noreferrer">
                <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                WhatsApp
              </a>
            </Button>
          )}
        </div>
      </div>

      {!empresa && (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Nenhuma empresa cadastrada ou selecionada. Importe empresas para começar.
          </CardContent>
        </Card>
      )}

      {empresa && (
        <Tabs value={activeTab} onValueChange={handleTrocaTab} className="space-y-6">
          {/* BARRA DE NAVEGAÇÃO ENTRE AS 5 ABAS */}
          <TabsList className="bg-muted/60 p-1 border border-border/80 rounded-xl flex-wrap h-auto gap-1 print:hidden">
            <TabsTrigger value="visao-geral" className="text-xs py-2 px-3.5 flex items-center gap-2">
              <LayoutDashboard className="h-3.5 w-3.5 text-blue-500" />
              <span>1. Visão Geral & Matriz de Responsabilidades</span>
            </TabsTrigger>
            <TabsTrigger value="relatorio" className="text-xs py-2 px-3.5 flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-amber-500" />
              <span>2. Diagnóstico & Relatório</span>
            </TabsTrigger>
            <TabsTrigger value="dossier" className="text-xs py-2 px-3.5 flex items-center gap-2">
              <MessageSquareText className="h-3.5 w-3.5 text-indigo-500" />
              <span>3. Dossiê 360 & Abordagens</span>
            </TabsTrigger>
            <TabsTrigger value="site" className="text-xs py-2 px-3.5 flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-emerald-500" />
              <span>4. Estúdio de Sites (GSAP) & Prompts</span>
            </TabsTrigger>
            <TabsTrigger value="slides" className="text-xs py-2 px-3.5 flex items-center gap-2">
              <Presentation className="h-3.5 w-3.5 text-purple-500" />
              <span>5. Apresentação em Slides (PDF)</span>
            </TabsTrigger>
          </TabsList>

          {/* =====================================================================
              ABA 1: VISÃO GERAL & MATRIZ DE RESPONSABILIDADES (SOLICITADA)
             ===================================================================== */}
          <TabsContent value="visao-geral" className="space-y-6 mt-0">
            {/* RESUMO DE OPORTUNIDADE DO CLIENTE */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-border/80">
                <CardContent className="p-4 space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">Score de Oportunidade</span>
                  <div className="text-2xl font-extrabold text-primary">{empresa.score}/100</div>
                  <p className="text-[11px] text-muted-foreground">Potencial de receita com presença digital estruturada</p>
                </CardContent>
              </Card>

              <Card className="border-border/80">
                <CardContent className="p-4 space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">Site Institucional</span>
                  <div className="text-sm font-bold flex items-center gap-1.5 mt-1">
                    <span className={`inline-block size-2 rounded-full ${empresa.site ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                    <span>{empresa.site ? empresa.statusSite : "Sem Site Próprio"}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{empresa.site || "Perdendo tráfego do Google"}</p>
                </CardContent>
              </Card>

              <Card className="border-border/80">
                <CardContent className="p-4 space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">Instagram Comercial</span>
                  <div className="text-sm font-bold flex items-center gap-1.5 mt-1">
                    <span className={`inline-block size-2 rounded-full ${empresa.instagram ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                    <span>{empresa.instagram ? empresa.statusInstagram : "Não localizado"}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{empresa.instagram ? `@${empresa.instagram.replace(/^@/, "")}` : "Sem presença ativa"}</p>
                </CardContent>
              </Card>

              <Card className="border-border/80">
                <CardContent className="p-4 space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase">Atendimento Local</span>
                  <div className="text-sm font-bold text-foreground mt-1">{empresa.cidade}/RS</div>
                  <p className="text-[11px] text-muted-foreground">{empresa.bairro ? `${empresa.bairro} · ` : ""}{empresa.segmento}</p>
                </CardContent>
              </Card>
            </div>

            {/* MATRIZ DE RESPONSABILIDADES: O QUE A AGÊNCIA VAI ATENDER VS O QUE O LEAD DEVE ATENDER */}
            <MatrizResponsabilidades empresa={empresa} nomeAgencia="Locomotiva Comunicação" />
          </TabsContent>

          {/* =====================================================================
              ABA 2: DIAGNÓSTICO & RELATÓRIO DO LEAD (COM PERSISTÊNCIA)
             ===================================================================== */}
          <TabsContent value="relatorio" className="space-y-6 mt-0">
            {/* AJUSTES E PÚBLICO-ALVO */}
            <Card className="print:hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>Parâmetros de Pesquisa & Público-Alvo</span>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleGerarRelatorio}
                      disabled={loadingRelatorio}
                      size="sm"
                      className="text-xs gap-1.5"
                    >
                      {loadingRelatorio ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                      {resRelatorio ? "Regerar Relatório com Ajustes" : "Gerar Relatório com IA"}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                {/* PÚBLICO-ALVO EDITÁVEL */}
                <div className="space-y-2 p-3.5 rounded-lg border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <label className="text-xs font-semibold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-indigo-600" />
                        Público-Alvo dos Clientes que Buscam este Serviço
                      </label>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Identifica quem compra do lead e como busca na internet para orientar os argumentos comerciais.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={gerandoPublicoAlvo}
                      onClick={async () => {
                        setGerandoPublicoAlvo(true);
                        try {
                          const r = await sugerirPublicoAlvoFn({
                            data: {
                              nome: empresa.nome,
                              segmento: empresa.segmento,
                              cidade: empresa.cidade,
                              areaAtuacao: empresa.areaAtuacao,
                              observacoes: empresa.observacoes,
                            },
                          });
                          if (r?.publicoAlvo) {
                            setPublicoAlvoTxt(r.publicoAlvo);
                            toast.success("Público-alvo sugerido!");
                          }
                        } finally {
                          setGerandoPublicoAlvo(false);
                        }
                      }}
                      className="h-7 text-xs gap-1 border-indigo-200 dark:border-indigo-800"
                    >
                      {gerandoPublicoAlvo ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 text-indigo-500" />}
                      Sugerir com IA
                    </Button>
                  </div>
                  <Textarea
                    rows={2}
                    value={publicoAlvoTxt}
                    onChange={(e) => setPublicoAlvoTxt(e.target.value)}
                    placeholder="Quem são os potenciais compradores/clientes que buscam o serviço desta empresa?"
                    className="text-xs bg-background"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-medium">Buscas de Partida (Google Autocomplete)</label>
                    <Textarea rows={4} value={sementesTxt} onChange={(e) => setSementesTxt(e.target.value)} className="text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium">Termos Encontrados</label>
                    <Textarea rows={4} value={termosTxt} onChange={(e) => setTermosTxt(e.target.value)} placeholder="Termos descobertos..." className="text-xs" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-medium">Busca no Google Maps</label>
                    <Input value={consultaGoogle} onChange={(e) => setConsultaGoogle(e.target.value)} className="text-xs h-9" />
                    <p className="text-[11px] text-muted-foreground mt-1">Usada para verificar a posição no Maps e concorrentes.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* RELATÓRIO CARREGADO DO BANCO OU RECÉM-GERADO */}
            {resRelatorio ? (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2 print:hidden">
                  <Button variant="outline" size="sm" onClick={() => window.print()} className="text-xs gap-1.5">
                    <Printer className="h-3.5 w-3.5" /> Imprimir / PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => copy(resRelatorio.relatorio.whatsapp)} className="text-xs gap-1.5">
                    <Copy className="h-3.5 w-3.5" /> Copiar WhatsApp
                  </Button>
                  {fone && (
                    <Button variant="outline" size="sm" asChild className="text-xs gap-1.5">
                      <a href={`${whatsappUrl(fone)}?text=${encodeURIComponent(resRelatorio.relatorio.whatsapp)}`} target="_blank" rel="noreferrer">
                        <MessageCircle className="h-3.5 w-3.5" /> Enviar WhatsApp
                      </a>
                    </Button>
                  )}
                </div>

                <article className="rounded-xl border bg-card text-card-foreground p-6 sm:p-8 space-y-6">
                  <header className="border-b pb-4">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">Diagnóstico de Presença Digital · Locomotiva Comunicação</p>
                    <h2 className="text-2xl font-bold mt-1">{resRelatorio.relatorio.titulo}</h2>
                    <p className="text-xs text-muted-foreground">{empresa.nome} · {empresa.cidade} · Gerado em {new Date(resRelatorio.geradoEm).toLocaleDateString("pt-BR")}</p>
                  </header>

                  <section className="space-y-1">
                    <h3 className="font-bold text-sm">Resumo Executivo</h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">{resRelatorio.relatorio.resumoExecutivo}</p>
                  </section>

                  <section className="space-y-1">
                    <h3 className="font-bold text-sm">O Seu Mercado Hoje</h3>
                    <p className="text-xs leading-relaxed text-muted-foreground">{resRelatorio.relatorio.contextoMercado}</p>
                  </section>

                  {/* BLOCO VISUAL DE PÚBLICO-ALVO */}
                  {resRelatorio.relatorio.analisePublicoAlvo && (
                    <Card className="border-indigo-200 dark:border-indigo-900/50 bg-gradient-to-br from-indigo-50/50 via-background to-muted/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-950 dark:text-indigo-200">
                          <Users className="h-4 w-4 text-indigo-600" />
                          Perfil do Público-Alvo & Comportamento de Busca
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-xs">
                        <div className="grid md:grid-cols-2 gap-3">
                          <div>
                            <p className="font-semibold text-muted-foreground uppercase text-[10px]">Quem são os compradores</p>
                            <p className="leading-relaxed mt-0.5">{resRelatorio.relatorio.analisePublicoAlvo.perfilComprador}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-muted-foreground uppercase text-[10px]">Como buscam na internet</p>
                            <p className="leading-relaxed mt-0.5">{resRelatorio.relatorio.analisePublicoAlvo.comoBuscaNaInternet}</p>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-3 pt-2 border-t">
                          <div>
                            <p className="font-semibold text-destructive text-[10px] uppercase">Principais Dores & O que Valoriza</p>
                            <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground mt-1">
                              {resRelatorio.relatorio.analisePublicoAlvo.principaisDoresEInteresses?.map((d, i) => (
                                <li key={i}><span className="text-foreground">{d}</span></li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="font-semibold text-primary text-[10px] uppercase">Critérios de Decisão de Compra</p>
                            <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground mt-1">
                              {resRelatorio.relatorio.analisePublicoAlvo.criteriosDeDecisao?.map((c, i) => (
                                <li key={i}><span className="text-foreground">{c}</span></li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* BLOCO SEO */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-bold">O que seus clientes procuram no Google</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-xs">
                      {resRelatorio.seo.termos?.length > 0 && (
                        <div>
                          <p className="text-muted-foreground mb-1">Buscas reais sugeridas pelo Google Autocomplete:</p>
                          <div className="flex flex-wrap gap-1">
                            {resRelatorio.seo.termos.map((t) => (
                              <span key={t.termo} className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium">
                                {t.termo}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {resRelatorio.seo.presenca && (
                        <div className="space-y-1">
                          <p>
                            <strong>Google Maps (“{resRelatorio.seo.presenca.consulta}”):</strong>{" "}
                            {resRelatorio.seo.presenca.posicao
                              ? `sua empresa aparece na posição ${resRelatorio.seo.presenca.posicao}.`
                              : "sua empresa não aparece entre os 20 primeiros resultados locais."}
                          </p>
                          <ul className="text-muted-foreground space-y-0.5 pl-2 text-[11px]">
                            {resRelatorio.seo.presenca.concorrentes.slice(0, 3).map((c, i) => (
                              <li key={i}>
                                {i + 1}. {c.nome} — nota {c.nota ?? "-"} ({c.avaliacoes ?? 0} avaliações) · {c.temSite ? "com site" : "sem site"}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* SEÇÕES DOS PILARES */}
                  {resRelatorio.relatorio.secoes.map((s, idx) => (
                    <section key={idx} className="space-y-2 border-t pt-4">
                      <h4 className="font-bold text-base">{s.titulo}</h4>
                      <div className="grid md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="font-semibold text-destructive mb-1">Onde a marca está perdendo</p>
                          <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                            {s.dores.map((d, dIdx) => <li key={dIdx}>{d}</li>)}
                          </ul>
                        </div>
                        <div>
                          <p className="font-semibold text-primary mb-1">O que a Locomotiva propõe</p>
                          <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                            {s.solucao.map((sol, sIdx) => <li key={sIdx}>{sol}</li>)}
                          </ul>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/40 text-xs">
                        <strong>Impacto nas Vendas:</strong> {s.impactoVendas}
                      </div>
                    </section>
                  ))}
                </article>
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center space-y-3">
                  <FileText className="h-10 w-10 text-muted-foreground mx-auto" />
                  <p className="text-sm font-semibold">Nenhum relatório de diagnóstico gerado para esta empresa ainda.</p>
                  <Button onClick={handleGerarRelatorio} disabled={loadingRelatorio} size="sm">
                    {loadingRelatorio ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Sparkles className="h-3.5 w-3.5 mr-1" />}
                    Gerar Diagnóstico com IA
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* =====================================================================
              ABA 3: DOSSIÊ 360 & ABORDAGENS COMERCIAIS AMIGÁVEIS (COM PERSISTÊNCIA)
             ===================================================================== */}
          <TabsContent value="dossier" className="space-y-6 mt-0">
            <Card>
              <CardHeader className="pb-4 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <MessageSquareText className="h-5 w-5 text-indigo-600" />
                      <span>Dossiê 360 & Roteiros de Abordagem Multicanal</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Textos amigáveis e não-frios para primeiro contato, enriquecidos com modelos abertos do repositório de LLMs gratuitas.
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleGerarDossier}
                      disabled={loadingDossier}
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1.5"
                    >
                      {loadingDossier ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                      {dossier ? "Atualizar Diagnóstico 360" : "Gerar Diagnóstico 360"}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-6">
                {/* 1. SELETOR DE TOM DE ABORDAGEM (ANTI-FRIEZA & HUMANIZADO) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Smile className="h-4 w-4 text-emerald-600" />
                      Escolha o Tom da Abordagem (1º Contato Amigável)
                    </label>
                    <span className="text-[11px] text-muted-foreground">
                      Evite abordagens frias apontando defeitos; crie conexão genuína.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                    {TONS_ABORDAGEM.map((t) => {
                      const ativo = tomAbordagem === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleSelecionarTom(t.id)}
                          className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                            ativo
                              ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/40"
                              : "border-border/80 hover:bg-muted/40 hover:border-border"
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold leading-tight flex items-center gap-1.5">
                                {t.id === "amigavel_elogio" && <HeartHandshake className="h-3.5 w-3.5 text-rose-500" />}
                                {t.id === "consultivo_parceiro" && <Users className="h-3.5 w-3.5 text-blue-500" />}
                                {t.id === "descontraido_curioso" && <Coffee className="h-3.5 w-3.5 text-amber-500" />}
                                {t.id === "valorizacao_marca" && <Award className="h-3.5 w-3.5 text-purple-500" />}
                                {t.id === "direto_gentil" && <Zap className="h-3.5 w-3.5 text-emerald-500" />}
                                {t.nome}
                              </span>
                            </div>
                            <Badge
                              variant="secondary"
                              className={`text-[10px] font-semibold px-1.5 py-0 ${
                                ativo ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {t.tagline}
                            </Badge>
                            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-snug">
                              {t.descricao}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. SELETOR DE CANAIS DE ABORDAGEM */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Canal de Envio</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {CANAIS.map((c) => {
                      const Icon = c.icon;
                      const ativo = canal === c.value;
                      return (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setCanal(c.value)}
                          className={`p-2.5 rounded-lg border text-left flex items-center gap-2 text-xs font-semibold transition-all ${
                            ativo
                              ? "border-primary bg-primary/10 text-primary shadow-xs"
                              : "border-border hover:bg-muted/50 text-muted-foreground"
                          }`}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{c.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. BARRA DE IA (awesome-free-llm-apis) & CONTROLES DE REGENERAÇÃO */}
                <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold">Motor de Redação IA (Awesome Free LLMs):</span>
                      <Select
                        value={provedorIaAbordagem}
                        onValueChange={(v) => setProvedorIaAbordagem(v as ProvedorIaTipo)}
                      >
                        <SelectTrigger className="h-8 text-xs w-[240px]">
                          <SelectValue placeholder="Selecione o provedor de IA" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROVEDORES_IA_ABORDAGEM.map((p) => (
                            <SelectItem key={p.value} value={p.value} className="text-xs">
                              <div className="flex items-center justify-between gap-2 w-full">
                                <span>{p.label}</span>
                                <Badge variant="outline" className="text-[9px] px-1 py-0">{p.badge}</Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRestaurarTextoPronto}
                        className="h-8 text-xs gap-1.5"
                        title="Recupera o texto pronto estratégico para este canal e tom"
                      >
                        <RotateCcw className="h-3 w-3" /> Restaurar Texto Pronto
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleGerarAbordagemComIA}
                        disabled={gerandoAbordagemIA}
                        className="h-8 text-xs gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:opacity-90 shadow-xs"
                      >
                        {gerandoAbordagemIA ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5" />
                        )}
                        {gerandoAbordagemIA ? "Criando Variação..." : "Gerar Variação com IA"}
                      </Button>
                    </div>
                  </div>

                  {/* Input de instrução extra opcional */}
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Instrução opcional para a IA (ex: citar post recente no Instagram, citar indicação de um amigo, etc.)..."
                      value={instrucaoIaAbordagem}
                      onChange={(e) => setInstrucaoIaAbordagem(e.target.value)}
                      className="h-8 text-xs bg-background"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !gerandoAbordagemIA) {
                          handleGerarAbordagemComIA();
                        }
                      }}
                    />
                  </div>
                </div>

                {/* 4. EDITOR DE MENSAGEM DO CANAL ATIVO COM AÇÕES E METADADOS */}
                <Card className="border-border/80 shadow-xs">
                  <CardHeader className="pb-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b bg-muted/10">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider">
                          Script Pronto para {CANAIS.find((c) => c.value === canal)?.label}
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px] bg-background">
                          Tom: {TONS_ABORDAGEM.find((t) => t.id === tomAbordagem)?.nome}
                        </Badge>
                        {metaAbordagem && (
                          <Badge variant="secondary" className="text-[10px]">
                            {metaAbordagem.provedor} ({metaAbordagem.modelo})
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Edite livremente as informações antes do disparo ou salve o roteiro no dossiê oficial.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleSalvarAbordagemNoDossier}
                        className="h-7 text-xs gap-1 bg-indigo-600 hover:bg-indigo-500 text-white"
                      >
                        <Save className="h-3 w-3" /> Salvar no Dossiê
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copy(textoAbordagemEditado)}
                        className="h-7 text-xs gap-1"
                      >
                        <Copy className="h-3 w-3" /> Copiar
                      </Button>

                      {canal === "whatsapp" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            if (fone) {
                              setOpenWhatsModal(true);
                            } else {
                              toast.info("A empresa não possui telefone/WhatsApp cadastrado.");
                            }
                          }}
                          className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                          <MessageCircle className="h-3 w-3" /> Disparar WhatsApp
                        </Button>
                      )}

                      {canal === "email" && empresa.email && (
                        <Button
                          size="sm"
                          onClick={() => setOpenEmailModal(true)}
                          className="h-7 text-xs gap-1"
                        >
                          <Mail className="h-3 w-3" /> Enviar E-mail
                        </Button>
                      )}

                      {canal === "instagram" && empresa.instagram && (
                        <a
                          href={empresa.instagram.startsWith("http") ? empresa.instagram : `https://instagram.com/${empresa.instagram.replace(/^@/, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border border-border hover:bg-muted"
                        >
                          <Instagram className="h-3 w-3 text-pink-500" /> Abrir Perfil
                        </a>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 space-y-3">
                    <Textarea
                      rows={10}
                      value={textoAbordagemEditado}
                      onChange={(e) => setTextoAbordagemEditado(e.target.value)}
                      className="text-xs font-mono leading-relaxed resize-y bg-background"
                      placeholder="O texto do roteiro de abordagem aparecerá aqui..."
                    />

                    {/* Dica de Ouro Contextual para o Primeiro Contato */}
                    <div className="flex items-start gap-2.5 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-xs text-amber-900 dark:text-amber-200">
                      <HelpCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                      <div className="space-y-0.5">
                        <strong className="font-semibold">Dica Estratégica para este Canal e Tom:</strong>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {obterDicaAbordagem(canal, tomAbordagem)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 5. DIAGNÓSTICO 360 & SINTOMAS OPERACIONAIS (SE DISPONÍVEL) */}
                {dossier?.prescricaoTratamentoLucro?.itensTratamento && dossier.prescricaoTratamentoLucro.itensTratamento.length > 0 ? (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Sintomas Operacionais & O que Geraria Mais Lucro (Diagnóstico 360)
                      </h4>
                      <Badge variant="outline" className="text-[10px]">
                        Diagnóstico Persistido no Banco
                      </Badge>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {dossier.prescricaoTratamentoLucro.itensTratamento.map((s, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl border border-border/80 bg-card space-y-1.5 text-xs shadow-xs">
                          <p className="font-bold text-destructive flex items-center gap-1.5">
                            <span>⚠️</span> {s.sintomaIdentificado}
                          </p>
                          <p className="text-muted-foreground text-[11px] leading-relaxed">
                            <strong>Tratamento:</strong> {s.comoTratar}
                          </p>
                          <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-medium text-[11px] flex items-center gap-1.5">
                            <span>💡</span>
                            <span><strong>Lucro:</strong> {s.comoGeraMaisLucro}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-border bg-muted/10 text-center space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Deseja mapear também os sintomas operacionais profundos e sistemas de gestão recomendados para a empresa?
                    </p>
                    <Button
                      onClick={handleGerarDossier}
                      disabled={loadingDossier}
                      size="sm"
                      variant="outline"
                      className="text-xs gap-1.5"
                    >
                      {loadingDossier ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      Gerar Diagnóstico Psicológico & Operacional 360 com IA
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* =====================================================================
              ABA 4: ESTÚDIO DE SITES (GSAP + IMAGENS) & PROMPTS IA
             ===================================================================== */}
          <TabsContent value="site" className="space-y-6 mt-0">
            <div className="flex items-center gap-2 border-b pb-3">
              <Button
                variant={subModoSite === "site" ? "default" : "outline"}
                size="sm"
                onClick={() => setSubModoSite("site")}
                className="text-xs gap-1.5"
              >
                <Globe className="h-3.5 w-3.5" />
                Gerador de Site (Demo ao Vivo + GSAP)
              </Button>
              <Button
                variant={subModoSite === "prompts" ? "default" : "outline"}
                size="sm"
                onClick={() => setSubModoSite("prompts")}
                className="text-xs gap-1.5"
              >
                <FileText className="h-3.5 w-3.5" />
                Prompts & Briefings Textuais
              </Button>
            </div>

            {subModoSite === "site" ? (
              <div className="space-y-6">
                {/* CONTROLES DO GERADOR DE SITES */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-border/80 bg-card">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-emerald-500" />
                      Landing Page Interativa com Animações GSAP & Imagens Reais
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Site completo com animações GSAP, ScrollTrigger, fotos contextuais do segmento e botão de WhatsApp.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleGerarSite}
                      disabled={gerandoSite}
                      size="sm"
                      className="text-xs gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90 shadow-sm"
                    >
                      {gerandoSite ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
                      {gerandoSite ? "Pesquisando & Gerando..." : "Gerar Site com GSAP"}
                    </Button>

                    {siteHtml && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSiteFullscreenOpen(true)}
                          className="text-xs gap-1"
                        >
                          <ExternalLink className="h-3.5 w-3.5" /> Tela Cheia
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const blob = new Blob([siteHtml], { type: "text/html" });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.href = url;
                            a.download = `site-${empresa.nome.toLowerCase().replace(/\s+/g, "-")}.html`;
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="text-xs gap-1"
                        >
                          <Download className="h-3.5 w-3.5" /> Baixar HTML
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* PREVIEW DO SITE NO IFRAME */}
                {siteHtml ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-xs text-muted-foreground font-semibold">Visualização Interativa do Site</span>
                      <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                        <Button
                          size="sm"
                          variant={devicePreview === "desktop" ? "default" : "ghost"}
                          onClick={() => setDevicePreview("desktop")}
                          className="h-7 px-2.5 text-xs"
                        >
                          Desktop
                        </Button>
                        <Button
                          size="sm"
                          variant={devicePreview === "tablet" ? "default" : "ghost"}
                          onClick={() => setDevicePreview("tablet")}
                          className="h-7 px-2.5 text-xs"
                        >
                          Tablet
                        </Button>
                        <Button
                          size="sm"
                          variant={devicePreview === "mobile" ? "default" : "ghost"}
                          onClick={() => setDevicePreview("mobile")}
                          className="h-7 px-2.5 text-xs"
                        >
                          Mobile
                        </Button>
                      </div>
                    </div>

                    <div className="flex justify-center bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
                      <div
                        style={{
                          width: devicePreview === "desktop" ? "100%" : devicePreview === "tablet" ? "768px" : "375px",
                          height: "620px",
                          transition: "width 0.3s ease",
                        }}
                        className="rounded-xl overflow-hidden border border-slate-800 bg-background"
                      >
                        <iframe
                          title="Site Preview GSAP"
                          srcDoc={siteHtml}
                          className="w-full h-full border-0"
                          sandbox="allow-scripts allow-same-origin allow-popups"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center space-y-3">
                      <Globe className="h-10 w-10 text-muted-foreground mx-auto" />
                      <p className="text-sm font-semibold">Nenhum site foi gerado para esta empresa ainda.</p>
                      <Button onClick={handleGerarSite} disabled={gerandoSite} size="sm">
                        {gerandoSite ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Globe className="h-3.5 w-3.5 mr-1" />}
                        Gerar Site com Animações GSAP
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              /* PROMPTS TEXTUAIS DE BRIEFING */
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {TIPOS_PROMPTS.map((tp) => (
                    <Button
                      key={tp.value}
                      variant={tipoPrompt === tp.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTipoPrompt(tp.value)}
                      className="text-xs"
                    >
                      {tp.label}
                    </Button>
                  ))}
                </div>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase">
                      Briefing de {TIPOS_PROMPTS.find((t) => t.value === tipoPrompt)?.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-1 space-y-3">
                    <Textarea
                      rows={10}
                      readOnly
                      value={gerarPrompt(empresa, tipoPrompt)}
                      className="text-xs font-mono leading-relaxed"
                    />
                    <Button
                      size="sm"
                      onClick={() => copy(gerarPrompt(empresa, tipoPrompt))}
                      className="text-xs gap-1"
                    >
                      <Copy className="h-3 w-3" /> Copiar Briefing
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* =====================================================================
              ABA 5: APRESENTAÇÃO DE SLIDES COMERCIAL (EXPORTÁVEL EM PDF)
             ===================================================================== */}
          <TabsContent value="slides" className="space-y-6 mt-0">
            <SlideDeckBuilder
              empresa={empresa}
              dossier={dossier}
              relatorio={resRelatorio?.relatorio}
              onSave={handleSalvarSlides}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* MODAIS AUXILIARES */}
      {empresa && (
        <>
          <CopilotoObjecoesModal
            open={openCopilotoObjecoes}
            onOpenChange={setOpenCopilotoObjecoes}
            empresa={empresa}
          />
          <CadenciaModal
            open={openCadenciaModal}
            onOpenChange={setOpenCadenciaModal}
            empresa={empresa}
          />
          <EnviarEmailModal
            open={openEmailModal}
            onOpenChange={setOpenEmailModal}
            empresa={empresa}
            corpoPadrao={textoAbordagemEditado}
          />
          <EnviarWhatsAppModal
            open={openWhatsModal}
            onOpenChange={setOpenWhatsModal}
            empresa={empresa}
            mensagemPadrao={textoAbordagemEditado}
          />
          <SitePreviewModal
            open={siteFullscreenOpen}
            onOpenChange={setSiteFullscreenOpen}
            html={siteHtml}
            empresa={empresa}
            pesquisaWeb={pesquisaSite}
          />
        </>
      )}
    </div>
  );
}
