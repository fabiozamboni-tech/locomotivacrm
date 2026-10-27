import React, { useState, useEffect, useRef } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { useStore } from "@/lib/store";
import { getApiSettings } from "@/lib/api-settings";
import {
  gerarSiteCompletoIA_ServerFn,
  refinarSiteComIa_ServerFn,
  type PesquisaWebSiteResult,
} from "@/lib/site-generator.server";
import { exportarSiteComoZip } from "@/lib/site-zip-exporter";
import type { Empresa, SiteVersaoGerada, EstudioChatMessage } from "@/lib/mock-data";
import { toCtx } from "@/lib/ai.functions";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Palette,
  Globe,
  FileText,
  Sparkles,
  Loader2,
  Building2,
  ExternalLink,
  Download,
  Github,
  CheckCircle2,
  Copy,
  Layers,
  Archive,
  ArrowRight,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Upload,
  Image as ImageIcon,
  FileCode,
  Trash2,
  Eye,
  Paperclip,
  PanelLeftClose,
  PanelLeftOpen,
  Send,
  MessageSquare,
  History,
  ShieldCheck,
  Columns,
  Monitor,
  Tablet,
  Smartphone,
  Code2,
  CheckCircle,
  Clock,
  RefreshCw,
  X,
  Info,
  Search,
  Sliders,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import {
  SeletorAgentesIaSelect,
  AGENTES_IA_CATALOGO,
  type AgenteIaOption,
} from "@/components/estudio-criacao/seletor-agentes-ia";
import { ModalComparadorVersoes } from "@/components/estudio-criacao/modal-comparador-versoes";
import { ExportarGithubModal } from "@/components/estudio-criacao/exportar-github-modal";
import { PaletaCoresCard } from "@/components/paleta-cores-card";
import { PainelImagensSite } from "@/components/estudio-criacao/painel-imagens-site";
import { montarPromptSiteCompleto } from "@/lib/site-generator-prompt";
import { loadPromptPadrao, savePromptPadrao } from "@/lib/prompt-padrao-config";
import { ModalPromptPadrao } from "@/components/estudio-criacao/modal-prompt-padrao";
import { ModalRefinarPromptIa } from "@/components/estudio-criacao/modal-refinar-prompt-ia";
import { ModalConteudoSite } from "@/components/estudio-criacao/modal-conteudo-site";
import { GeradorIdentidadeVisual } from "@/components/estudio-criacao/gerador-identidade-visual";
import { checarCotaDiaria, registrarConsumoDiario } from "@/lib/ai-quota-guard";

export const Route = createFileRoute("/estudio-criacao")({
  validateSearch: z.object({
    empresa: z.string().optional().catch(undefined),
    tab: z.enum(["site", "paleta"]).optional().catch(undefined),
  }),
  component: EstudioCriacaoPage,
});

const SUGESTOES_CHAT = [
  "🎨 Ajustar paleta de cores para tons editoriais de linho e verde oliva",
  "👥 Adicionar seção de depoimentos de clientes da região",
  "📱 Destacar botão e mensagem direta para o WhatsApp",
  "✨ Melhorar animação de entrada da Hero com GSAP suave",
  "📊 Incluir tabela comparativa de diferenciais e normas técnicas",
];

function EstudioCriacaoPage() {
  const search = Route.useSearch() as { empresa?: string; tab?: "site" | "paleta" };
  const navigate = useNavigate();
  const { empresas, empresasAtivas: storeEmpresasAtivas, updateEmpresa, addHistorico, isEmpresaExcluida } = useStore();

  const empresasAtivas = React.useMemo(
    () =>
      empresas.filter(
        (e) =>
          !isEmpresaExcluida(e) &&
          e.crmStage !== "excluidos" &&
          e.crmStage !== "perdido" &&
          e.crmStage !== "sem_fit",
      ),
    [empresas, isEmpresaExcluida],
  );

  const gerarSiteFn = useServerFn(gerarSiteCompletoIA_ServerFn);
  const refinarSiteFn = useServerFn(refinarSiteComIa_ServerFn);

  // Estados de busca e filtros para a tela inicial de seleção de leads
  const [buscaLead, setBuscaLead] = useState("");
  const [filtroSite, setFiltroSite] = useState<"todos" | "com_site" | "sem_site">("todos");

  // Empresa ativa (apenas se 'empresa' estiver na URL)
  const empresaId = search.empresa;
  const empresa = empresaId
    ? empresasAtivas.find((e) => e.id === empresaId) || empresas.find((e) => e.id === empresaId)
    : undefined;

  // Sub-aba ativa superior
  const [abaAtiva, setAbaAtiva] = useState<"site" | "paleta">(search.tab || "site");

  // Barra lateral retrátil (duas colunas)
  const [painelEsquerdoAberto, setPainelEsquerdoAberto] = useState(true);

  // Sub-aba dentro do painel esquerdo: Chat, Imagens por IA ou Histórico
  const [abaPainelEsquerdo, setAbaPainelEsquerdo] = useState<"chat" | "imagens" | "historico">("chat");

  // Prompt Padrão configurável
  const [promptPadrao, setPromptPadrao] = useState<string>(() => loadPromptPadrao());
  const [modalPromptPadraoOpen, setModalPromptPadraoOpen] = useState(false);

  // Cor primária ativa selecionada na paleta cromática
  const [corPrimariaHex, setCorPrimariaHex] = useState<string>("#722F37");

  // Modais de prompt e conteúdo
  const [modalPromptOpen, setModalPromptOpen] = useState(false);
  const [modalConteudoOpen, setModalConteudoOpen] = useState(false);

  // Agente de IA selecionado
  const [agenteSelecionado, setAgenteSelecionado] = useState<AgenteIaOption>(AGENTES_IA_CATALOGO[0]);

  // Estados de geração e refinamento
  const [gerandoSite, setGerandoSite] = useState(false);
  const [refinandoSite, setRefinandoSite] = useState(false);
  const [siteHtml, setSiteHtml] = useState<string>(empresa?.siteGeradoHtml || "");
  const [versoes, setVersoes] = useState<SiteVersaoGerada[]>(empresa?.siteVersoes || []);

  // Chat interativo
  const [chatMensagens, setChatMensagens] = useState<EstudioChatMessage[]>(
    empresa?.estudioChatMensagens || [],
  );
  const [chatInput, setChatInput] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Dispositivo de visualização
  const [dispositivo, setDispositivo] = useState<"desktop" | "tablet" | "mobile">("desktop");

  // Anexos opcionais de Logo e Arquivo Markdown de Diretrizes de Design
  const [logoAnexo, setLogoAnexo] = useState<{
    nome: string;
    dataUrl: string;
    tipo?: string;
    tamanho?: number;
  } | null>(empresa?.estudioLogoAnexo || null);

  const [designMdAnexo, setDesignMdAnexo] = useState<{
    nome: string;
    conteudo: string;
    tamanho?: number;
  } | null>(empresa?.estudioDesignMdAnexo || null);

  // Modais
  const [modalComparadorOpen, setModalComparadorOpen] = useState(false);
  const [modalCodigoOpen, setModalCodigoOpen] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [modalGithubOpen, setModalGithubOpen] = useState(false);
  const [mdModalOpen, setMdModalOpen] = useState(false);

  // Sincroniza ao trocar de empresa
  useEffect(() => {
    if (empresa) {
      setSiteHtml(empresa.siteGeradoHtml || "");
      setVersoes(empresa.siteVersoes || []);
      setLogoAnexo(empresa.estudioLogoAnexo || null);
      setDesignMdAnexo(empresa.estudioDesignMdAnexo || null);
      setChatMensagens(empresa.estudioChatMensagens || []);
    }
  }, [
    empresa?.id,
    empresa?.siteGeradoHtml,
    empresa?.siteVersoes,
    empresa?.estudioLogoAnexo,
    empresa?.estudioDesignMdAnexo,
    empresa?.estudioChatMensagens,
    empresa?.siteConteudoCustomizado,
  ]);

  // Auto-scroll do chat ao receber nova mensagem
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMensagens, refinandoSite]);

  const handleUploadLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !empresa) return;

    if (!file.type.startsWith("image/") && !file.name.endsWith(".svg")) {
      toast.error("Por favor, selecione um arquivo de imagem válido (PNG, JPG, SVG, WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const anexo = {
        nome: file.name,
        dataUrl,
        tipo: file.type || "image/png",
        tamanho: file.size,
      };
      setLogoAnexo(anexo);
      updateEmpresa(empresa.id, {
        estudioLogoAnexo: anexo,
      });
      toast.success(`Logo "${file.name}" anexado com sucesso!`);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoverLogo = () => {
    if (!empresa) return;
    setLogoAnexo(null);
    updateEmpresa(empresa.id, {
      estudioLogoAnexo: undefined,
    });
    toast.info("Logo removido dos anexos.");
  };

  const handleUploadDesignMd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !empresa) return;

    if (!file.name.endsWith(".md") && !file.name.endsWith(".markdown") && !file.name.endsWith(".txt")) {
      toast.error("Por favor, selecione um arquivo de texto com extensão .md, .markdown ou .txt.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const conteudo = event.target?.result as string;
      const anexo = {
        nome: file.name,
        conteudo,
        tamanho: file.size,
      };
      setDesignMdAnexo(anexo);
      updateEmpresa(empresa.id, {
        estudioDesignMdAnexo: anexo,
      });
      toast.success(`Diretrizes "${file.name}" anexadas com sucesso!`);
    };
    reader.readAsText(file);
  };

  const handleRemoverDesignMd = () => {
    if (!empresa) return;
    setDesignMdAnexo(null);
    updateEmpresa(empresa.id, {
      estudioDesignMdAnexo: undefined,
    });
    toast.info("Diretrizes de design (.md) removidas.");
  };

  const promptMontado = React.useMemo(() => {
    if (!empresa) return { promptSystem: "", promptUser: "", promptFinal: "" };
    return montarPromptSiteCompleto({
      empresa: toCtx(empresa),
      diagnostico: empresa.diagnostico,
      dossier360: empresa.dossier360,
      relatorio: empresa.relatorioLead,
      promptPadrao,
      siteConteudoCustomizado: empresa.siteConteudoCustomizado,
      logoBase64: logoAnexo?.dataUrl,
      logoNomeArquivo: logoAnexo?.nome,
      instrucoesDesignMd: designMdAnexo?.conteudo,
    });
  }, [
    empresa,
    promptPadrao,
    logoAnexo,
    designMdAnexo,
    empresa?.siteConteudoCustomizado,
  ]);

  // 1. GERAR NOVO SITE COMPLETO (DO ZERO OU COM PROMPT CUSTOMIZADO)
  const handleGerarSite = async (customPromptOverride?: { promptSystem: string; promptUser: string }) => {
    if (!empresa) {
      toast.error("Selecione uma empresa primeiro.");
      return;
    }

    const apiSettings = getApiSettings();

    // Checagem de Cota Diária antes de iniciar geração
    const checagem = checarCotaDiaria({
      categoria: "sites",
      provedor: agenteSelecionado.provider,
      cotas: apiSettings.cotasDiarias,
    });

    if (checagem.bloqueado) {
      toast.error(
        checagem.motivo ||
          "Limite diário de geração de sites atingido. O sistema bloqueou a chamada para proteger seu orçamento.",
      );
      return;
    }

    if (checagem.acaoRecomendada === "fallback_gratuito") {
      toast.warning(checagem.motivo);
    }

    try {
      setGerandoSite(true);
      toast.info(`Iniciando criação com ${agenteSelecionado.nome} (${agenteSelecionado.modelo})...`);

      const customKeys = {
        groq: apiSettings.groq.key,
        gemini: apiSettings.gemini.key,
        openrouter: apiSettings.openrouter.key,
        cerebras: apiSettings.cerebras.key,
        lovable: apiSettings.lovable.key,
        ollamaBaseUrl: apiSettings.ollama.baseUrl,
        openai: apiSettings.openai?.key,
        anthropic: apiSettings.anthropic?.key,
        perplexity: apiSettings.perplexity?.key,
      };

      const res = await gerarSiteFn({
        data: {
          empresa: toCtx(empresa),
          provedorPreferencial: agenteSelecionado.provider,
          modeloPreferencial: agenteSelecionado.modelo,
          promptPadrao,
          siteConteudoCustomizado: empresa.siteConteudoCustomizado,
          customPromptOverride,
          customKeys,
          diagnostico: empresa.diagnostico,
          dossier360: empresa.dossier360,
          relatorio: empresa.relatorioLead,
          logoBase64: logoAnexo?.dataUrl,
          logoNomeArquivo: logoAnexo?.nome,
          instrucoesDesignMd: designMdAnexo?.conteudo,
        },
      });

      const novoHtml = res.html;
      setSiteHtml(novoHtml);

      // Registra o consumo diário no Quota Guard
      registrarConsumoDiario({
        categoria: "sites",
        provedor: agenteSelecionado.provider,
        detalhe: `${empresa.nome} (Landing Page One-Page)`,
        sucesso: true,
        fallback: checagem.acaoRecomendada === "fallback_gratuito",
      });

      // Registra a nova versão no histórico
      const novaVersaoId = `versao_${Date.now()}`;
      const novaVersao: SiteVersaoGerada = {
        id: novaVersaoId,
        data: res.geradoEm || new Date().toISOString(),
        provedor: agenteSelecionado.nome,
        modelo: agenteSelecionado.modelo,
        html: novoHtml,
        pesquisaWeb: res.pesquisaWeb,
        ativa: true,
      };

      const novasVersoes = [novaVersao, ...(versoes || []).map((v) => ({ ...v, ativa: false }))];
      setVersoes(novasVersoes);

      // Registra mensagem de boas-vindas no chat
      const mensagemBoasVindas: EstudioChatMessage = {
        id: `msg_init_${Date.now()}`,
        data: new Date().toISOString(),
        role: "assistant",
        texto: `Site completo gerado com sucesso por ${agenteSelecionado.nome} (${agenteSelecionado.modelo}) com Prompt Padrão configurado. Você pode agora me enviar instruções neste chat para alterar cores, textos, seções ou animações!`,
        modelo: agenteSelecionado.nome,
        versaoGeradaId: novaVersaoId,
      };

      const novoChat = [...chatMensagens, mensagemBoasVindas];
      setChatMensagens(novoChat);

      // Atualiza na store
      updateEmpresa(empresa.id, {
        siteGeradoHtml: novoHtml,
        siteGeradoData: res.geradoEm,
        siteVersoes: novasVersoes,
        estudioChatMensagens: novoChat,
        analiseAtualizadaEm: new Date().toISOString(),
      });

      addHistorico(empresa.id, {
        data: new Date().toISOString(),
        tipo: "nota",
        texto: `Nova versão de site gerada com ${agenteSelecionado.nome} no Estúdio de Criação.`,
      });

      toast.success(`Site gerado com sucesso por ${agenteSelecionado.nome}!`);
    } catch (err: any) {
      console.error("Erro ao gerar site:", err);
      toast.error(err?.message || "Falha na geração do site.");
    } finally {
      setGerandoSite(false);
    }
  };

  // 2. REFINAR SITE VIA CHAT INTERATIVO
  const handleEnviarComandoChat = async (textoComando?: string) => {
    const mensagem = (textoComando || chatInput).trim();
    if (!mensagem || !empresa) return;
    if (!siteHtml) {
      toast.error("Gere uma primeira versão do site antes de solicitar alterações no chat.");
      return;
    }

    const msgUsuario: EstudioChatMessage = {
      id: `msg_user_${Date.now()}`,
      data: new Date().toISOString(),
      role: "user",
      texto: mensagem,
    };

    const novasMensagens = [...chatMensagens, msgUsuario];
    setChatMensagens(novasMensagens);
    setChatInput("");
    setRefinandoSite(true);

    try {
      toast.info(`Aplicando alteração com ${agenteSelecionado.nome}...`);

      const apiSettings = getApiSettings();
      const customKeys = {
        groq: apiSettings.groq.key,
        gemini: apiSettings.gemini.key,
        openrouter: apiSettings.openrouter.key,
        cerebras: apiSettings.cerebras.key,
        lovable: apiSettings.lovable.key,
        ollamaBaseUrl: apiSettings.ollama.baseUrl,
      };

      const historicoChatLlm = novasMensagens.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.texto,
      }));

      const res = await refinarSiteFn({
        data: {
          empresa: toCtx(empresa),
          siteHtmlAtual: siteHtml,
          mensagemUsuario: mensagem,
          historicoChat: historicoChatLlm,
          customKeys,
          provedorPreferencial: agenteSelecionado.provider,
          modeloPreferencial: agenteSelecionado.modelo,
          promptPadrao,
          logoBase64: logoAnexo?.dataUrl,
          logoNomeArquivo: logoAnexo?.nome,
          instrucoesDesignMd: designMdAnexo?.conteudo,
        },
      });

      const novoHtml = res.html;
      setSiteHtml(novoHtml);

      const novaVersaoId = `versao_${Date.now()}`;
      const novaVersao: SiteVersaoGerada = {
        id: novaVersaoId,
        data: res.geradoEm || new Date().toISOString(),
        provedor: agenteSelecionado.nome,
        modelo: agenteSelecionado.modelo,
        html: novoHtml,
        ativa: true,
      };

      const novasVersoes = [novaVersao, ...(versoes || []).map((v) => ({ ...v, ativa: false }))];
      setVersoes(novasVersoes);

      const msgAssistente: EstudioChatMessage = {
        id: `msg_asst_${Date.now()}`,
        data: new Date().toISOString(),
        role: "assistant",
        texto: res.respostaAssistente,
        modelo: `${agenteSelecionado.nome} (${agenteSelecionado.modelo})`,
        versaoGeradaId: novaVersaoId,
      };

      const chatAtualizado = [...novasMensagens, msgAssistente];
      setChatMensagens(chatAtualizado);

      updateEmpresa(empresa.id, {
        siteGeradoHtml: novoHtml,
        siteGeradoData: res.geradoEm,
        siteVersoes: novasVersoes,
        estudioChatMensagens: chatAtualizado,
        analiseAtualizadaEm: new Date().toISOString(),
      });

      addHistorico(empresa.id, {
        data: new Date().toISOString(),
        tipo: "nota",
        texto: `Site refinado via Chat com ${agenteSelecionado.nome}: "${mensagem.slice(0, 50)}..."`,
      });

      toast.success("Alterações aplicadas com sucesso ao site!");
    } catch (err: any) {
      console.error("Erro ao refinar site:", err);
      toast.error(err?.message || "Falha ao aplicar alteração no site.");
    } finally {
      setRefinandoSite(false);
    }
  };

  // 3. APAGAR UMA VERSÃO INDIVIDUAL DO HISTÓRICO
  const handleApagarVersao = (versaoId: string) => {
    if (!empresa) return;
    const versaoApagada = (versoes || []).find((v) => v.id === versaoId);
    const novasVersoes = (versoes || []).filter((v) => v.id !== versaoId);
    setVersoes(novasVersoes);

    let novoHtml = siteHtml;
    let novaData = empresa.siteGeradoData;

    // Se a versão apagada era a oficial/ativa na tela
    if (versaoApagada && versaoApagada.html === siteHtml) {
      if (novasVersoes.length > 0) {
        novoHtml = novasVersoes[0].html;
        novaData = novasVersoes[0].data;
        novasVersoes[0].ativa = true;
        toast.info(`Versão apagada. Ativando versão anterior gerada por ${novasVersoes[0].provedor}.`);
      } else {
        novoHtml = "";
        novaData = undefined;
        toast.info("Todas as versões foram apagadas.");
      }
    }

    setSiteHtml(novoHtml);

    updateEmpresa(empresa.id, {
      siteGeradoHtml: novoHtml,
      siteGeradoData: novaData,
      siteVersoes: novasVersoes,
      analiseAtualizadaEm: new Date().toISOString(),
    });

    addHistorico(empresa.id, {
      data: new Date().toISOString(),
      tipo: "nota",
      texto: `Versão de site (${versaoApagada?.provedor || "IA"}) foi excluída.`,
    });

    toast.success("Versão excluída com sucesso!");
  };

  // 4. LIMPAR TODOS OS SITES GERADOS
  const handleLimparTodosSites = () => {
    if (!empresa) return;
    if (!confirm("Tem certeza que deseja apagar todos os sites gerados para esta empresa e reiniciar?")) {
      return;
    }
    setSiteHtml("");
    setVersoes([]);
    setChatMensagens([]);

    updateEmpresa(empresa.id, {
      siteGeradoHtml: "",
      siteGeradoData: undefined,
      siteVersoes: [],
      estudioChatMensagens: [],
      analiseAtualizadaEm: new Date().toISOString(),
    });

    addHistorico(empresa.id, {
      data: new Date().toISOString(),
      tipo: "nota",
      texto: "Todos os sites gerados e histórico de versões foram apagados.",
    });

    toast.success("Histórico de sites gerados limpo com sucesso!");
  };

  // 4.1 ATUALIZAR HTML VIA GALERIA DE IMAGENS POR IA
  const handleAtualizarHtmlComImagem = (novoHtml: string, descricao: string) => {
    if (!empresa) return;

    setSiteHtml(novoHtml);

    const novaVersaoId = `versao_${Date.now()}`;
    const novaVersao: SiteVersaoGerada = {
      id: novaVersaoId,
      data: new Date().toISOString(),
      provedor: "Galeria de Imagens FLUX.1",
      modelo: "FLUX.1 Pollinations",
      html: novoHtml,
      ativa: true,
    };

    const novasVersoes = [novaVersao, ...(versoes || []).map((v) => ({ ...v, ativa: false }))];
    setVersoes(novasVersoes);

    updateEmpresa(empresa.id, {
      siteGeradoHtml: novoHtml,
      siteGeradoData: new Date().toISOString(),
      siteVersoes: novasVersoes,
      analiseAtualizadaEm: new Date().toISOString(),
    });

    addHistorico(empresa.id, {
      data: new Date().toISOString(),
      tipo: "nota",
      texto: `Imagem aplicada ao site via Galeria IA: "${descricao.slice(0, 50)}..."`,
    });

    toast.success("Imagem substituída e nova versão do site salva!");
  };

  // 5. RESTAURAR/ATIVAR UMA VERSÃO ESPECÍFICA DO HISTÓRICO
  const handleSelecionarVersaoAtiva = (versao: SiteVersaoGerada) => {
    if (!empresa) return;
    setSiteHtml(versao.html);

    const novasVersoes = (versoes || []).map((v) => ({
      ...v,
      ativa: v.id === versao.id,
    }));
    setVersoes(novasVersoes);

    updateEmpresa(empresa.id, {
      siteGeradoHtml: versao.html,
      siteGeradoData: versao.data,
      siteVersoes: novasVersoes,
    });

    toast.success(`Versão gerada em ${format(new Date(versao.data), "dd/MM/yyyy HH:mm")} ativada na tela.`);
  };

  // 6. DOWNLOAD E EXPORTAÇÕES
  const handleBaixarHtml = () => {
    if (!siteHtml || !empresa) return;
    const blob = new Blob([siteHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `site-${String(empresa.nome || "empresa").toLowerCase().replace(/[^a-z0-9]/g, "-")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Arquivo HTML baixado com sucesso!");
  };

  const handleBaixarZip = async () => {
    if (!siteHtml || !empresa) return;
    try {
      toast.info("Compactando projeto em arquivo ZIP com manuais e configs...");
      await exportarSiteComoZip({
        empresaNome: empresa.nome,
        segmento: empresa.segmento,
        cidade: empresa.cidade,
        htmlContent: siteHtml,
      });
      toast.success("Pacote ZIP baixado com sucesso!");
    } catch (err: any) {
      toast.error("Falha ao gerar ZIP: " + (err?.message || "Erro desconhecido"));
    }
  };

  const handleAbrirNovaAba = () => {
    if (!siteHtml) {
      toast.error("Nenhum conteúdo de site disponível para visualização.");
      return;
    }
    const blob = new Blob([siteHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    toast.success("Site aberto em uma nova aba do navegador!");
  };

  const copyCode = () => {
    navigator.clipboard.writeText(siteHtml);
    toast.success("Código HTML copiado para a área de transferência!");
  };

  // Filtros da tela de seleção de leads
  const leadsFiltrados = React.useMemo(() => {
    return empresasAtivas.filter((lead) => {
      if (buscaLead.trim()) {
        const termo = buscaLead.toLowerCase();
        const nomeMatch = lead.nome.toLowerCase().includes(termo);
        const cidadeMatch = (lead.cidade || "").toLowerCase().includes(termo);
        const segmentoMatch = (lead.segmento || "").toLowerCase().includes(termo);
        if (!nomeMatch && !cidadeMatch && !segmentoMatch) return false;
      }

      const temSite = Boolean(
        lead.siteGeradoHtml || (lead.siteVersoes && lead.siteVersoes.length > 0)
      );

      if (filtroSite === "com_site") return temSite;
      if (filtroSite === "sem_site") return !temSite;
      return true;
    });
  }, [empresasAtivas, buscaLead, filtroSite]);

  const totalComSite = React.useMemo(
    () =>
      empresasAtivas.filter(
        (e) => Boolean(e.siteGeradoHtml || (e.siteVersoes && e.siteVersoes.length > 0))
      ).length,
    [empresasAtivas]
  );
  const totalSemSite = empresasAtivas.length - totalComSite;

  // =========================================================================
  // TELA DE SELEÇÃO INICIAL DE LEADS (QUANDO NENHUMA EMPRESA ESTIVER SELECIONADA)
  // =========================================================================
  if (!empresa) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto min-h-screen">
        {/* CABEÇALHO */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-[11px] gap-1 font-semibold text-primary border-primary/30">
                <Sparkles className="h-3 w-3" />
                Estúdio de Criação
              </Badge>
              <Badge variant="secondary" className="text-[10px] text-muted-foreground">
                Seleção de Lead
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
              <Palette className="h-7 w-7 text-primary shrink-0" />
              <span>Escolha a Empresa para Criar o Site</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Selecione um cliente para abrir o estúdio de criação, estruturar o conteúdo e gerar a landing page com IA.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/empresas" })}
            className="text-xs gap-1.5 self-start md:self-auto"
          >
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Gerenciar Empresas</span>
          </Button>
        </div>

        {/* BARRA DE FILTROS & BUSCA */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border shadow-xs">
          {/* Campo de Busca por Nome */}
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={buscaLead}
              onChange={(e) => setBuscaLead(e.target.value)}
              placeholder="Buscar empresa por nome, cidade ou segmento..."
              className="pl-9 pr-8 text-xs h-9 bg-background"
            />
            {buscaLead && (
              <button
                type="button"
                onClick={() => setBuscaLead("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filtros por Status de Site Criado */}
          <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-lg shrink-0">
            <Button
              type="button"
              variant={filtroSite === "todos" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFiltroSite("todos")}
              className="text-xs h-7 px-3"
            >
              Todos ({empresasAtivas.length})
            </Button>
            <Button
              type="button"
              variant={filtroSite === "com_site" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFiltroSite("com_site")}
              className="text-xs h-7 px-3 gap-1"
            >
              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              <span>Com Site ({totalComSite})</span>
            </Button>
            <Button
              type="button"
              variant={filtroSite === "sem_site" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFiltroSite("sem_site")}
              className="text-xs h-7 px-3"
            >
              Sem Site ({totalSemSite})
            </Button>
          </div>
        </div>

        {/* LISTAGEM DE LEADS */}
        {leadsFiltrados.length === 0 ? (
          <div className="p-12 text-center space-y-3 bg-card rounded-xl border border-dashed">
            <Building2 className="h-10 w-10 text-muted-foreground/60 mx-auto" />
            <h3 className="text-base font-bold text-foreground">Nenhuma empresa encontrada</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Nenhum lead corresponde aos critérios de busca ou filtros aplicados. Tente alterar o texto de busca ou o filtro de status.
            </p>
            {buscaLead && (
              <Button size="sm" variant="outline" onClick={() => setBuscaLead("")} className="text-xs">
                Limpar busca
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {leadsFiltrados.map((lead) => {
              const temSite = Boolean(
                lead.siteGeradoHtml || (lead.siteVersoes && lead.siteVersoes.length > 0)
              );
              const qtdVersoes = lead.siteVersoes?.length || (lead.siteGeradoHtml ? 1 : 0);

              return (
                <div
                  key={lead.id}
                  onClick={() =>
                    navigate({
                      search: {
                        empresa: lead.id,
                        tab: "site",
                      } as never,
                    })
                  }
                  className="group relative flex flex-col justify-between p-4 rounded-xl border border-border/80 bg-card hover:bg-accent/40 hover:border-primary/40 transition-all cursor-pointer shadow-xs hover:shadow-md"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {lead.nome}
                      </h3>
                      {temSite ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] shrink-0 font-medium gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Site Criado</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground text-[10px] shrink-0 font-normal">
                          Sem Site
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="truncate">{lead.cidade || "Sem cidade"}</span>
                      {lead.segmento && (
                        <>
                          <span>•</span>
                          <span className="truncate">{lead.segmento}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/50 text-xs">
                    <span className="text-[11px] text-muted-foreground">
                      {temSite ? `${qtdVersoes} versão(ões)` : "Pronto para criar"}
                    </span>
                    <span className="text-primary font-semibold text-xs flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Abrir Estúdio
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // TELA DO ESTÚDIO DE CRIAÇÃO (COM EMPRESA SELECIONADA)
  // =========================================================================
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-[1700px] mx-auto min-h-screen flex flex-col">
      {/* CABEÇALHO SUPERIOR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[11px] gap-1 font-semibold text-primary border-primary/30">
              <Sparkles className="h-3 w-3" />
              Estúdio de Criação Profissional
            </Badge>
            <Badge variant="secondary" className="text-[10px] text-muted-foreground">
              Multi-IAs · Prompt Padrão · One-Page
            </Badge>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
              <Palette className="h-6 w-6 text-primary shrink-0" />
              <span>Estúdio de Criação</span>
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-muted-foreground/40 font-light text-xl">/</span>
              <span className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-primary via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                {empresa.nome}
              </span>
              <Badge variant="outline" className="text-xs font-normal border-primary/30 text-muted-foreground">
                {empresa.cidade} · {empresa.segmento}
              </Badge>
              {versoes.length > 0 && (
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-medium gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Site Ativo ({versoes.length} versão{versoes.length === 1 ? "" : "ões"})
                </Badge>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Criação e refinamento de sites profissionais com IA, controle de prompt mestre, copys contextuais e chat interativo.
          </p>
        </div>

        {/* BOTÃO PARA ESCOLHER OUTRA EMPRESA */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate({
                search: {
                  empresa: undefined,
                  tab: abaAtiva,
                } as never,
              })
            }
            className="text-xs gap-1.5 border-border hover:bg-muted font-medium h-9"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Escolher Outra Empresa</span>
          </Button>
        </div>
      </div>

      {/* SUB-ABAS GERAIS DO MÓDULO */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={abaAtiva === "site" ? "default" : "outline"}
            size="sm"
            onClick={() => setAbaAtiva("site")}
            className="text-xs gap-1.5"
          >
            <Globe className="h-3.5 w-3.5 text-emerald-500" />
            <span>Criação de Sites (GSAP)</span>
          </Button>
          <Button
            variant={abaAtiva === "paleta" ? "default" : "outline"}
            size="sm"
            onClick={() => setAbaAtiva("paleta")}
            className="text-xs gap-1.5"
          >
            <Palette className="h-3.5 w-3.5 text-pink-500" />
            <span>Identidade Visual & Paleta Cromática</span>
          </Button>
        </div>

        {/* ATALHO PARA MOSTRAR A BARRA LATERAL SE ESTIVER OCULTA */}
        {abaAtiva === "site" && !painelEsquerdoAberto && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPainelEsquerdoAberto(true)}
            className="text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/5"
          >
            <PanelLeftOpen className="h-3.5 w-3.5" />
            <span>Abrir Painel do Estúdio & Chat</span>
          </Button>
        )}
      </div>

      {/* CONTEÚDO PRINCIPAL: CRIAÇÃO DE SITES EM 2 COLUNAS */}
      {abaAtiva === "site" && (
        <div className="flex flex-col lg:flex-row gap-4 items-start w-full flex-1">
          {/* ========================================== */}
          {/* COLUNA ESQUERDA: PAINEL DE CONTROLE & CHAT */}
          {/* ========================================== */}
          {painelEsquerdoAberto && (
            <aside className="w-full lg:w-[420px] xl:w-[450px] shrink-0 space-y-3.5 bg-card border border-border/80 rounded-xl p-3.5 shadow-xs flex flex-col max-h-[calc(100vh-180px)] overflow-hidden">
              {/* TOPO DA BARRA LATERAL COM BOTÃO RECOLHER */}
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-primary/10 text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Painel de Criação
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPainelEsquerdoAberto(false)}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  title="Esconder barra lateral do chat"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              </div>

              {/* SELETORES E CONFIGURAÇÃO COMPACTA */}
              <div className="space-y-2.5 bg-muted/20 p-2.5 rounded-lg border border-border/60">
                {/* 1. SELETOR COMPACTO DE IA */}
                <SeletorAgentesIaSelect
                  agenteSelecionadoId={agenteSelecionado.id}
                  onSelecionarAgente={setAgenteSelecionado}
                />

                {/* 2. UPLOADS COMPACTOS (LOGO & DIRETRIZES .MD) */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  {/* Upload de Logo */}
                  <div className="border border-border/80 rounded-md p-2 bg-background flex flex-col justify-between text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[11px] flex items-center gap-1 text-foreground">
                        <ImageIcon className="h-3 w-3 text-primary" /> Logo
                      </span>
                      {logoAnexo && (
                        <button
                          type="button"
                          onClick={handleRemoverLogo}
                          className="text-[10px] text-destructive hover:underline"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                    {logoAnexo ? (
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <img src={logoAnexo.dataUrl} alt={logoAnexo.nome} className="h-5 w-auto max-w-[60px] object-contain" />
                        <span className="text-[10px] truncate text-muted-foreground">{logoAnexo.nome}</span>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                          onChange={handleUploadLogo}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 hover:text-foreground">
                          <Upload className="h-2.5 w-2.5" /> Anexar Logo
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Upload de Markdown */}
                  <div className="border border-border/80 rounded-md p-2 bg-background flex flex-col justify-between text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[11px] flex items-center gap-1 text-foreground">
                        <FileCode className="h-3 w-3 text-blue-500" /> Diretrizes
                      </span>
                      {designMdAnexo && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setMdModalOpen(true)}
                            className="text-[10px] text-blue-600 hover:underline"
                          >
                            Ver
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoverDesignMd}
                            className="text-[10px] text-destructive hover:underline"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                    {designMdAnexo ? (
                      <span className="text-[10px] truncate text-muted-foreground pt-0.5">
                        {designMdAnexo.nome}
                      </span>
                    ) : (
                      <div className="relative">
                        <input
                          type="file"
                          accept=".md,.markdown,.txt"
                          onChange={handleUploadDesignMd}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 hover:text-foreground">
                          <Upload className="h-2.5 w-2.5" /> Anexar .MD
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* BOTÕES DE GERAÇÃO E CONTROLE DE PROMPTS */}
                <div className="space-y-2 pt-1">
                  <Button
                    onClick={() => handleGerarSite()}
                    disabled={gerandoSite || refinandoSite}
                    size="sm"
                    className="w-full text-xs h-9 gap-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-primary text-white hover:opacity-90 shadow-xs font-semibold"
                  >
                    {gerandoSite ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    <span>
                      {gerandoSite
                        ? "Pesquisando & Criando Site..."
                        : `Gerar Novo Site (${agenteSelecionado.nome})`}
                    </span>
                  </Button>

                  {/* 3 BOTÕES ALINHADOS: PROMPT PADRÃO, CONTEÚDO, VISUALIZAR E REFINAR */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setModalPromptPadraoOpen(true)}
                      disabled={gerandoSite || refinandoSite}
                      className="text-[11px] h-8 px-1 gap-1 border-primary/30 text-primary hover:bg-primary/5 font-medium truncate"
                      title="Editar o Prompt Padrão mestre utilizado na geração"
                    >
                      <Sliders className="h-3 w-3 shrink-0" />
                      <span className="truncate">Prompt Padrão</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setModalConteudoOpen(true)}
                      disabled={gerandoSite || refinandoSite}
                      className="text-[11px] h-8 px-1 gap-1 border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-medium truncate relative"
                      title="Definir estrutura de seções e copys do site"
                    >
                      <FileText className="h-3 w-3 shrink-0" />
                      <span className="truncate">Conteúdo</span>
                      {empresa?.siteConteudoCustomizado && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 ml-0.5 shrink-0" title="Conteúdo customizado salvo" />
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setModalPromptOpen(true)}
                      disabled={gerandoSite || refinandoSite}
                      className="text-[11px] h-8 px-1 gap-1 border-indigo-500/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 font-medium truncate"
                      title="Visualizar e refinar o prompt final completo enviado à IA"
                    >
                      <Eye className="h-3 w-3 shrink-0" />
                      <span className="truncate">Visualizar & Refinar</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* ABAS DO PAINEL ESQUERDO: CHAT VS IMAGENS IA VS HISTÓRICO */}
              <Tabs
                value={abaPainelEsquerdo}
                onValueChange={(v) => setAbaPainelEsquerdo(v as "chat" | "imagens" | "historico")}
                className="flex-1 flex flex-col min-h-0"
              >
                <TabsList className="grid grid-cols-3 h-8 p-0.5 bg-muted/60 shrink-0">
                  <TabsTrigger value="chat" className="text-xs gap-1 h-7 px-1">
                    <MessageSquare className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">Chat IA</span>
                  </TabsTrigger>
                  <TabsTrigger value="imagens" className="text-xs gap-1 h-7 px-1">
                    <ImageIcon className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">Imagens IA</span>
                  </TabsTrigger>
                  <TabsTrigger value="historico" className="text-xs gap-1 h-7 px-1">
                    <History className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">Versões ({versoes.length})</span>
                  </TabsTrigger>
                </TabsList>

                {/* ================================= */}
                {/* ABA 1: CHAT INTERATIVO COM A IA */}
                {/* ================================= */}
                <TabsContent value="chat" className="flex-1 flex flex-col min-h-0 pt-2 space-y-2 mt-0">
                  {/* ÁREA DE ROLAGEM DAS MENSAGENS */}
                  <div
                    ref={chatScrollRef}
                    className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[220px] max-h-[360px] text-xs"
                  >
                    {chatMensagens.length === 0 ? (
                      <div className="p-4 text-center space-y-2 text-muted-foreground border border-dashed rounded-lg bg-muted/10">
                        <MessageSquare className="h-6 w-6 text-muted-foreground/60 mx-auto" />
                        <p className="text-xs font-semibold text-foreground">Chat de Refinamento com IA</p>
                        <p className="text-[11px] leading-relaxed">
                          Gere o primeiro site ou envie um comando abaixo para solicitar alterações específicas no design, nas cores ou nos textos.
                        </p>
                      </div>
                    ) : (
                      chatMensagens.map((msg) => {
                        const isUser = msg.role === "user";
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                          >
                            <div className="flex items-center gap-1.5 mb-1 px-1">
                              <span className="text-[10px] text-muted-foreground">
                                {isUser ? "Você" : msg.modelo || "Assistente de Criação"}
                              </span>
                              <span className="text-[9px] text-muted-foreground/60">
                                {msg.data ? format(new Date(msg.data), "HH:mm") : ""}
                              </span>
                            </div>
                            <div
                              className={`p-2.5 rounded-xl max-w-[92%] leading-relaxed ${
                                isUser
                                  ? "bg-primary text-primary-foreground rounded-tr-xs"
                                  : "bg-muted border border-border text-foreground rounded-tl-xs"
                              }`}
                            >
                              <p className="whitespace-pre-wrap text-xs">{msg.texto}</p>
                            </div>
                          </div>
                        );
                      })
                    )}

                    {refinandoSite && (
                      <div className="flex items-start gap-2 p-2 bg-muted/50 rounded-lg border text-xs text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0 mt-0.5" />
                        <span>{agenteSelecionado.nome} está processando sua instrução e aplicando as alterações no código...</span>
                      </div>
                    )}
                  </div>

                  {/* SUGESTÕES RÁPIDAS DE COMANDOS */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 shrink-0 scrollbar-none">
                    {SUGESTOES_CHAT.map((sug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleEnviarComandoChat(sug.replace(/^[^\s]+\s*/, ""))}
                        disabled={refinandoSite || gerandoSite}
                        className="text-[10px] whitespace-nowrap px-2 py-1 bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground rounded-md border border-border/60 transition-colors shrink-0"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>

                  {/* CAMPO DE ENVIO DO CHAT */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleEnviarComandoChat();
                    }}
                    className="flex items-center gap-1.5 shrink-0 pt-1 border-t border-border/50"
                  >
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ex: Mude a cor do botão para verde escuro..."
                      disabled={refinandoSite || gerandoSite}
                      className="text-xs h-9 font-normal flex-1"
                    />
                    <Button
                      type="submit"
                      disabled={!chatInput.trim() || refinandoSite || gerandoSite}
                      size="sm"
                      className="h-9 px-3 gap-1"
                    >
                      {refinandoSite ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </form>
                </TabsContent>

                {/* ================================= */}
                {/* ABA 2: GALERIA DE IMAGENS POR IA  */}
                {/* ================================= */}
                <TabsContent value="imagens" className="flex-1 flex flex-col min-h-0 pt-2 space-y-2 mt-0">
                  <PainelImagensSite
                    siteHtml={siteHtml}
                    onAtualizarHtml={handleAtualizarHtmlComImagem}
                    empresa={empresa}
                  />
                </TabsContent>

                {/* ================================= */}
                {/* ABA 3: HISTÓRICO DE VERSÕES       */}
                {/* ================================= */}
                <TabsContent value="historico" className="flex-1 flex flex-col min-h-0 pt-2 space-y-2 mt-0">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      {versoes.length} versão{versoes.length === 1 ? "" : "ões"} gerada{versoes.length === 1 ? "" : "s"}
                    </span>
                    {versoes.length > 0 && (
                      <button
                        type="button"
                        onClick={handleLimparTodosSites}
                        className="text-[10px] text-destructive hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        Limpar Tudo
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[360px] text-xs">
                    {versoes.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground border border-dashed rounded-lg bg-muted/10">
                        Nenhuma versão anterior gravada.
                      </div>
                    ) : (
                      versoes.map((v, i) => (
                        <div
                          key={v.id}
                          className={`p-2.5 rounded-lg border transition-all text-xs flex flex-col gap-1.5 ${
                            v.html === siteHtml
                              ? "border-primary bg-primary/5 shadow-xs"
                              : "border-border bg-card hover:bg-muted/30"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-foreground truncate">
                              #{versoes.length - i} · {v.provedor}
                            </span>
                            {v.html === siteHtml && (
                              <Badge className="text-[9px] px-1.5 py-0 h-4 bg-primary text-primary-foreground">
                                Atual
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                            <span>{v.modelo}</span>
                            <span>{v.data ? format(new Date(v.data), "dd/MM HH:mm") : ""}</span>
                          </div>

                          <div className="flex items-center gap-1.5 pt-1 border-t border-border/50 justify-end">
                            {v.html !== siteHtml && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSelecionarVersaoAtiva(v)}
                                className="h-6 text-[10px] px-2"
                              >
                                Restaurar
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleApagarVersao(v.id)}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                              title="Excluir esta versão"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </aside>
          )}

          {/* ========================================== */}
          {/* COLUNA DIREITA: VISUALIZADOR DO SITE (PREVIEW) */}
          {/* ========================================== */}
          <main className="flex-1 w-full min-w-0 space-y-3 flex flex-col">
            {/* BARRA DE FERRAMENTAS DO PREVIEW */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-card border border-border/80 rounded-xl p-2.5 shadow-xs">
              <div className="flex items-center gap-2">
                {/* Seletor de Dispositivo */}
                <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/60">
                  <Button
                    size="sm"
                    variant={dispositivo === "desktop" ? "default" : "ghost"}
                    onClick={() => setDispositivo("desktop")}
                    className="h-7 px-2.5 text-xs gap-1"
                    title="Desktop (100% largura)"
                  >
                    <Monitor className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Desktop</span>
                  </Button>
                  <Button
                    size="sm"
                    variant={dispositivo === "tablet" ? "default" : "ghost"}
                    onClick={() => setDispositivo("tablet")}
                    className="h-7 px-2.5 text-xs gap-1"
                    title="Tablet (768px)"
                  >
                    <Tablet className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Tablet</span>
                  </Button>
                  <Button
                    size="sm"
                    variant={dispositivo === "mobile" ? "default" : "ghost"}
                    onClick={() => setDispositivo("mobile")}
                    className="h-7 px-2.5 text-xs gap-1"
                    title="Mobile (375px)"
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Mobile</span>
                  </Button>
                </div>

                {/* Status da Versão Atual */}
                {siteHtml && (
                  <Badge variant="outline" className="text-[11px] gap-1 font-normal border-border text-muted-foreground hidden sm:flex">
                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                    <span>{siteHtml.length.toLocaleString()} caracteres</span>
                  </Badge>
                )}
              </div>

              {/* Botões de Ação do Preview */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {versoes.length > 1 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setModalComparadorOpen(true)}
                    className="h-7 text-xs gap-1"
                    title="Comparar versões lado a lado"
                  >
                    <Columns className="h-3.5 w-3.5 text-blue-500" />
                    <span className="hidden md:inline">Comparar Versões</span>
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setModalCodigoOpen(true)}
                  disabled={!siteHtml}
                  className="h-7 text-xs gap-1"
                  title="Ver código-fonte HTML completo"
                >
                  <Code2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Ver Código</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAbrirNovaAba}
                  disabled={!siteHtml}
                  className="h-7 text-xs gap-1"
                  title="Abrir site em uma nova aba completa"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Nova Aba</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setFullscreenOpen(true)}
                  disabled={!siteHtml}
                  className="h-7 text-xs gap-1"
                  title="Visualizar em tela cheia"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBaixarHtml}
                  disabled={!siteHtml}
                  className="h-7 text-xs gap-1"
                  title="Baixar arquivo index.html"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Baixar HTML</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBaixarZip}
                  disabled={!siteHtml}
                  className="h-7 text-xs gap-1 bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                  title="Baixar projeto compactado em ZIP com instruções e index.html"
                >
                  <Archive className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Baixar ZIP</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setModalGithubOpen(true)}
                  disabled={!siteHtml}
                  className="h-7 text-xs gap-1"
                  title="Exportar código para repositório GitHub"
                >
                  <Github className="h-3.5 w-3.5" />
                  <span className="hidden lg:inline">GitHub</span>
                </Button>
              </div>
            </div>

            {/* CONTAINER DO IFRAME RESPONSIVO */}
            <div className="flex-1 bg-muted/40 rounded-xl border border-border/80 p-2 sm:p-4 flex items-center justify-center min-h-[580px] overflow-hidden">
              {!siteHtml ? (
                <div className="text-center p-8 max-w-md space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
                    <Globe className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-foreground">Nenhum site gerado ainda</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Selecione um agente de IA no painel ao lado e clique em{" "}
                      <strong className="text-foreground">"Gerar Novo Site"</strong> para criar a primeira versão
                      cinematográfica da landing page.
                    </p>
                  </div>
                  <Button
                    onClick={() => handleGerarSite()}
                    disabled={gerandoSite}
                    size="sm"
                    className="text-xs gap-1.5 bg-gradient-to-r from-blue-600 to-primary text-white"
                  >
                    {gerandoSite ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    <span>Gerar Agora com {agenteSelecionado.nome}</span>
                  </Button>
                </div>
              ) : (
                <div
                  className={`transition-all duration-300 h-full flex flex-col bg-background rounded-lg shadow-lg border border-border overflow-hidden ${
                    dispositivo === "mobile"
                      ? "w-[375px] max-w-full"
                      : dispositivo === "tablet"
                      ? "w-[768px] max-w-full"
                      : "w-full"
                  }`}
                  style={{ minHeight: "680px", height: "calc(100vh - 270px)" }}
                >
                  {/* BARRA SUPERIOR SIMULADA DE NAVEGADOR */}
                  <div className="h-7 bg-muted/80 border-b border-border/60 px-3 flex items-center justify-between gap-2 shrink-0 select-none">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
                    </div>
                    <div className="flex-1 max-w-xs mx-auto bg-background/80 rounded px-2 py-0.5 text-[10px] text-muted-foreground truncate text-center border border-border/40 font-mono">
                      https://{String(empresa.nome || "site").toLowerCase().replace(/[^a-z0-9]/g, "")}.com.br
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {dispositivo === "desktop" ? "100%" : dispositivo === "tablet" ? "768px" : "375px"}
                    </div>
                  </div>

                  {/* IFRAME COM O CÓDIGO HTML GERADO */}
                  <iframe
                    title={`Preview - ${empresa.nome}`}
                    srcDoc={siteHtml}
                    className="w-full flex-1 border-0 bg-white"
                    sandbox="allow-scripts allow-same-origin allow-popups"
                  />
                </div>
              )}
            </div>
          </main>
        </div>
      )}

      {/* CONTEÚDO DA ABA 2: IDENTIDADE VISUAL E PALETA CROMÁTICA */}
      {abaAtiva === "paleta" && (
        <div className="space-y-6">
          <PaletaCoresCard
            nomeEmpresa={empresa.nome}
            segmento={empresa.segmento}
            onSelecionarCor={(hex) => setCorPrimariaHex(hex)}
          />

          <GeradorIdentidadeVisual
            empresaId={empresa.id}
            empresaNome={empresa.nome}
            segmento={empresa.segmento}
            cidade={empresa.cidade}
            corPrimariaHex={corPrimariaHex}
            logoAtivoUrl={logoAnexo?.dataUrl}
            logosSalvos={empresa.estudioLogosGerados || []}
            materiaisSalvos={empresa.estudioMaterialEscritorioGerados || []}
            onSalvarLogos={(novosLogos) => {
              updateEmpresa(empresa.id, { estudioLogosGerados: novosLogos });
            }}
            onSalvarMateriais={(novosMateriais) => {
              updateEmpresa(empresa.id, { estudioMaterialEscritorioGerados: novosMateriais });
            }}
            onDefinirComoLogoOficial={(logoUrl, nomeArquivo) => {
              const anexo = {
                nome: nomeArquivo || `logo-${empresa.nome.toLowerCase().replace(/\s+/g, "-")}.png`,
                dataUrl: logoUrl,
                tipo: "image/png",
              };
              setLogoAnexo(anexo);
              updateEmpresa(empresa.id, { estudioLogoAnexo: anexo });
              toast.success(`Logo definido como a marca oficial de ${empresa.nome} no Estúdio!`);
            }}
          />
        </div>
      )}

      {/* MODAL DE COMPARAÇÃO DE VERSÕES (LADO A LADO) */}
      <ModalComparadorVersoes
        open={modalComparadorOpen}
        onOpenChange={setModalComparadorOpen}
        versoes={versoes}
        siteHtmlAtivo={siteHtml}
        onSelecionarVersaoAtiva={(v) => {
          handleSelecionarVersaoAtiva(v);
          setModalComparadorOpen(false);
        }}
      />

      {/* MODAL DE VISUALIZAÇÃO DE CÓDIGO HTML */}
      <Dialog open={modalCodigoOpen} onOpenChange={setModalCodigoOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-6">
          <DialogHeader className="pb-3 border-b flex flex-row items-center justify-between">
            <DialogTitle className="text-sm font-mono flex items-center gap-2">
              <Code2 className="h-4 w-4 text-primary" />
              <span>index.html ({siteHtml.length.toLocaleString()} caracteres)</span>
            </DialogTitle>
            <Button size="sm" variant="outline" onClick={copyCode} className="h-7 text-xs gap-1">
              <Copy className="h-3.5 w-3.5" />
              Copiar
            </Button>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-muted/20 rounded-lg p-4 font-mono text-[11px] text-muted-foreground">
            <pre>
              <code>{siteHtml}</code>
            </pre>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE TELA CHEIA */}
      <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
        <DialogContent className="max-w-[100vw] w-screen h-screen max-h-screen p-0 border-0 rounded-none bg-stone-950 flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 bg-stone-900 border-b border-stone-800 text-white text-xs">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <span className="font-semibold">{empresa.nome} · Visualização em Tela Cheia</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleAbrirNovaAba}
                className="h-7 text-xs text-stone-300 hover:text-white"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1" /> Nova Aba
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setFullscreenOpen(false)}
                className="h-7 text-xs text-stone-300 hover:text-white"
              >
                <Minimize2 className="h-3.5 w-3.5 mr-1" /> Sair da Tela Cheia
              </Button>
            </div>
          </div>
          <iframe
            title="Tela Cheia"
            srcDoc={siteHtml}
            className="w-full flex-1 border-0 bg-white"
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        </DialogContent>
      </Dialog>

      {/* MODAL DE EXPORTAÇÃO PARA GITHUB */}
      <ExportarGithubModal
        open={modalGithubOpen}
        onOpenChange={setModalGithubOpen}
        empresa={empresa}
        htmlContent={siteHtml}
      />

      {/* MODAL PARA VISUALIZAR DIRETRIZES DE DESIGN (.MD) */}
      <Dialog open={mdModalOpen} onOpenChange={setMdModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-6">
          <DialogHeader className="pb-3 border-b">
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <FileCode className="h-4 w-4 text-blue-500" />
              <span>Diretrizes de Design Anexadas: {designMdAnexo?.nome}</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Estas instruções são respeitadas com prioridade máxima pelo motor de IA.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-muted/20 rounded-lg p-4 font-mono text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {designMdAnexo?.conteudo}
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE PROMPT PADRÃO MESTRE */}
      <ModalPromptPadrao
        open={modalPromptPadraoOpen}
        onOpenChange={setModalPromptPadraoOpen}
        promptAtual={promptPadrao}
        onSalvar={(novoPrompt) => {
          setPromptPadrao(novoPrompt);
          savePromptPadrao(novoPrompt);
        }}
      />

      {/* MODAL DE CONTEÚDO E ESTRUTURA DO SITE */}
      <ModalConteudoSite
        open={modalConteudoOpen}
        onOpenChange={setModalConteudoOpen}
        empresa={empresa}
        onSalvarConteudo={(novoConteudo) => {
          updateEmpresa(empresa.id, {
            siteConteudoCustomizado: novoConteudo,
            siteConteudoGeradoEm: new Date().toISOString(),
          });
        }}
      />

      {/* MODAL PARA VISUALIZAR & REFINAR PROMPT FINAL DA IA */}
      <ModalRefinarPromptIa
        open={modalPromptOpen}
        onOpenChange={setModalPromptOpen}
        empresaNome={empresa.nome}
        agenteNome={agenteSelecionado.nome}
        modeloNome={agenteSelecionado.modelo}
        initialPromptFinal={promptMontado.promptFinal}
        initialPromptSystem={promptMontado.promptSystem}
        initialPromptUser={promptMontado.promptUser}
        onConfirmarEGerar={(customizado) => handleGerarSite(customizado)}
        gerando={gerandoSite}
      />
    </div>
  );
}
