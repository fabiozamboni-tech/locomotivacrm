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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { PROMPT_BLOCO_SKILLS_CLAUDE } from "@/lib/skills-claude-prompt";

export const Route = createFileRoute("/estudio-criacao")({
  validateSearch: z.object({
    empresa: z.string().optional().catch(undefined),
    tab: z.enum(["site", "paleta", "prompts"]).optional().catch(undefined),
  }),
  component: EstudioCriacaoPage,
});

const TIPOS_PROMPTS = [
  { value: "anti_ia_master", label: "Prompt Base Anti-IA (GSAP Master)" },
  { value: "site_geral", label: "Briefing de Arquitetura & UX" },
  { value: "copy_vendas", label: "Copywriting de Conversão (Sem Clichês)" },
  { value: "google_ads", label: "Campanha Google Ads (Busca Local)" },
  { value: "redes_sociais", label: "Linha Editorial Redes Sociais" },
];

const SUGESTOES_CHAT = [
  "🎨 Ajustar paleta de cores para tons editoriais de linho e verde oliva",
  "👥 Adicionar seção de depoimentos de clientes da região",
  "📱 Destacar botão e mensagem direta para o WhatsApp",
  "✨ Melhorar animação de entrada da Hero com GSAP suave",
  "📊 Incluir tabela comparativa de diferenciais e normas técnicas",
];

function EstudioCriacaoPage() {
  const search = Route.useSearch() as { empresa?: string; tab?: "site" | "paleta" | "prompts" };
  const navigate = useNavigate();
  const { empresas, updateEmpresa, addHistorico } = useStore();

  const gerarSiteFn = useServerFn(gerarSiteCompletoIA_ServerFn);
  const refinarSiteFn = useServerFn(refinarSiteComIa_ServerFn);

  // Empresa ativa
  const empresaId = search.empresa || empresas[0]?.id || "";
  const empresa = empresas.find((e) => e.id === empresaId) || empresas[0];

  // Sub-aba ativa superior
  const [abaAtiva, setAbaAtiva] = useState<"site" | "paleta" | "prompts">(search.tab || "site");

  // Barra lateral retrátil (duas colunas)
  const [painelEsquerdoAberto, setPainelEsquerdoAberto] = useState(true);

  // Sub-aba dentro do painel esquerdo: Chat de Refinamento ou Histórico
  const [abaPainelEsquerdo, setAbaPainelEsquerdo] = useState<"chat" | "historico">("chat");

  // Diretrizes Anti-IA Bespoke (combo-box global para todas as APIs)
  const [usarAntiIaBespoke, setUsarAntiIaBespoke] = useState<boolean>(
    empresa?.estudioUsarAntiIaBespoke ?? true,
  );

  // Skills Claude (Anthropic Frontend Design)
  const [usarSkillsClaude, setUsarSkillsClaude] = useState<boolean>(
    empresa?.estudioUsarSkillsClaude ?? true,
  );

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

  // Aba de Prompts Textuais
  const [tipoPrompt, setTipoPrompt] = useState("anti_ia_master");

  // Sincroniza ao trocar de empresa
  useEffect(() => {
    if (empresa) {
      setSiteHtml(empresa.siteGeradoHtml || "");
      setVersoes(empresa.siteVersoes || []);
      setLogoAnexo(empresa.estudioLogoAnexo || null);
      setDesignMdAnexo(empresa.estudioDesignMdAnexo || null);
      setChatMensagens(empresa.estudioChatMensagens || []);
      setUsarAntiIaBespoke(empresa.estudioUsarAntiIaBespoke ?? true);
      setUsarSkillsClaude(empresa.estudioUsarSkillsClaude ?? true);
    }
  }, [
    empresa?.id,
    empresa?.siteGeradoHtml,
    empresa?.siteVersoes,
    empresa?.estudioLogoAnexo,
    empresa?.estudioDesignMdAnexo,
    empresa?.estudioChatMensagens,
    empresa?.estudioUsarAntiIaBespoke,
    empresa?.estudioUsarSkillsClaude,
  ]);

  // Auto-scroll do chat ao receber nova mensagem
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMensagens, refinandoSite]);

  const handleTrocarEmpresa = (novaId: string) => {
    navigate({
      search: {
        empresa: novaId,
        tab: abaAtiva,
      } as never,
    });
  };

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

  // 1. GERAR NOVO SITE COMPLETO (DO ZERO)
  const handleGerarSite = async () => {
    if (!empresa) {
      toast.error("Selecione uma empresa primeiro.");
      return;
    }

    try {
      setGerandoSite(true);
      toast.info(
        `Iniciando criação com ${agenteSelecionado.nome} (${agenteSelecionado.modelo})${
          usarAntiIaBespoke ? " com diretrizes Anti-IA ativadas" : ""
        }...`,
      );

      const apiSettings = getApiSettings();
      const customKeys = {
        groq: apiSettings.groq.key,
        gemini: apiSettings.gemini.key,
        openrouter: apiSettings.openrouter.key,
        cerebras: apiSettings.cerebras.key,
        lovable: apiSettings.lovable.key,
        ollamaBaseUrl: apiSettings.ollama.baseUrl,
      };

      const res = await gerarSiteFn({
        data: {
          empresa: toCtx(empresa),
          provedorPreferencial: agenteSelecionado.provider,
          modeloPreferencial: agenteSelecionado.modelo,
          usarAntiIaBespoke,
          usarSkillsClaude,
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
        texto: `Site completo gerado com sucesso por ${agenteSelecionado.nome} (${agenteSelecionado.modelo})${
          usarAntiIaBespoke ? " seguindo as diretrizes Anti-IA Bespoke" : ""
        }${
          usarSkillsClaude ? " e Skills Claude da Anthropic" : ""
        }. Você pode agora me enviar instruções neste chat para alterar cores, textos, seções ou animações!`,
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
        estudioUsarAntiIaBespoke: usarAntiIaBespoke,
        estudioUsarSkillsClaude: usarSkillsClaude,
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
          usarAntiIaBespoke,
          usarSkillsClaude,
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
        estudioUsarAntiIaBespoke: usarAntiIaBespoke,
        estudioUsarSkillsClaude: usarSkillsClaude,
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

  // 5. ATIVAR VERSÃO ESPECÍFICA COMO OFICIAL
  const handleSelecionarVersaoAtiva = (versao: SiteVersaoGerada) => {
    if (!empresa) return;
    setSiteHtml(versao.html);

    const atualizadas = versoes.map((v) => ({
      ...v,
      ativa: v.id === versao.id,
    }));
    setVersoes(atualizadas);

    updateEmpresa(empresa.id, {
      siteGeradoHtml: versao.html,
      siteGeradoData: versao.data,
      siteVersoes: atualizadas,
      analiseAtualizadaEm: new Date().toISOString(),
    });

    toast.success(`Versão criada por ${versao.provedor} definida como o site oficial!`);
  };

  // 6. EXPORTAÇÕES
  const handleBaixarHtml = () => {
    if (!siteHtml || !empresa) return;
    const blob = new Blob([siteHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `site-${empresa.nome.toLowerCase().replace(/[^a-z0-9]/g, "-")}.html`;
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

  const gerarPromptTexto = (tipo: string): string => {
    if (!empresa) return "";

    const diagnosticoSite = empresa.diagnostico?.site || {};
    const relatorioLead = empresa.relatorioLead || {};
    const dossierPersonas = empresa.dossier360?.personas || [];
    const dossierObjecoes = empresa.dossier360?.objecoes || [];

    if (tipo === "anti_ia_master") {
      return `[Contexto do Sistema]
Atue como um Desenvolvedor Frontend Sênior e UI/UX Designer de Elite. Sua missão é criar a estrutura, o layout e o código de um site profissional completo para o nicho que será especificado.
${
  usarSkillsClaude
    ? PROMPT_BLOCO_SKILLS_CLAUDE
    : ""
}
${
  usarAntiIaBespoke
    ? `[Regras de Design - Anti-IA Bespoke Obrigatórias]
Proibições Absolutas:
- Não utilize fundos pretos ou roxos com luzes neon artificiais.
- Não utilize gradientes genéricos em botões.
- Não utilize grids repetitivos em loop (como o padrão de 3 cards idênticos lado a lado).
- Evite ilustrações 3D genéricas ou ícones flutuantes sem propósito funcional.
- PROIBIÇÃO ABSOLUTA DE MARQUEE: É terminantemente proibido utilizar qualquer efeito de marquee.
Arquitetura Visual: Priorize minimalismo premium e design editorial com whitespace generoso.
Paleta de Cores e Tipografia: Combinação contida de no máximo 3 cores e hierarquia tipográfica marcante.`
    : `[Regras de Design Moderno]
Crie um design moderno com Tailwind CSS, 100% responsivo e elegante.`
}

[Estrutura e Elementos Obrigatórios - Site Completo Multi-Páginas]
1. Home / Início (Hero de alto impacto, Proposta de Valor e CTA direto).
2. Quem Somos / Sobre a Empresa (História, fundação e autoridade local).
3. Serviços & Especialidades (Catálogo detalhado de soluções e benefícios).
4. Portfólio / Projetos Realizados (Galeria de casos de sucesso).
5. Diferenciais, Normas Técnicas & Garantias.
6. Contato, Localização & Orçamento (Formulário e link de WhatsApp).

[Animações e Interatividade]
GSAP Integrado: Toda a camada de animação deve ser controlada via GSAP e ScrollTrigger.
Parallax suave nas imagens de transição de seção.

[Texto e Conteúdo]
Tom de voz humano, direto e focado em benefícios reais. Sem jargões de IA.

[Especificação do Nicho]
- Empresa: ${empresa.nome}
- Segmento: ${empresa.segmento}
- Área de Atuação: ${empresa.areaAtuacao || empresa.segmento}
- Cidade: ${empresa.cidade}/RS (Serra Gaúcha)
- Telefone / WhatsApp: ${empresa.whatsapp || empresa.telefone || ""}
- E-mail: ${empresa.email || ""}

[Dados do Diagnóstico do Cliente]
- Velocidade anterior: ${diagnosticoSite.velocidade || "não avaliada"}
- Responsivo: ${diagnosticoSite.responsivo ? "Sim" : "Não"}
- Resumo do Lead: ${relatorioLead.resumo || "Presença digital necessita de autoridade e acabamento nobre."}

Gere o código HTML5 completo do site multi-páginas pronto para produção.`;
    }

    if (tipo === "site_geral") {
      return `[Briefing de Arquitetura & UX Frontend]
Empresa: ${empresa.nome} (${empresa.cidade}/RS)
Setor: ${empresa.segmento}

Objetivo: Estruturar a árvore de páginas e fluxo do usuário (UX) para um site institucional de alto padrão.
1. Mapeamento de Personas e Dores:
${dossierPersonas.map((p: any) => `- ${p.nome || "Persona"}: ${p.perfil || p.dorPrincipal || ""}`).join("\n") || "- Clientes que buscam pontualidade, acabamento impecável e segurança contratual."}
2. Soluções e Portfólio a Evidenciar:
- Destaque para projetos executados na Serra Gaúcha.
- Detalhamento de materiais nobres e garantias técnicas.
3. Fluxo de Conversão:
- CTAs em pontos estratégicos para contato direto via WhatsApp comercial.`;
    }

    if (tipo === "copy_vendas") {
      return `[Copywriting de Conversão e Vendas - Anti-Clichês]
Empresa: ${empresa.nome} (${empresa.cidade}/RS) · Nicho: ${empresa.segmento}

Diretrizes:
- Escreva copies persuasivas e autênticas em português brasileiro.
- PROIBIDO: Usar jargões como "revolucionário", "a solução definitiva", "no mundo dinâmico de hoje", "empresa líder" sem prova documental.
- FOCO: Redigir benefícios tangíveis, materiais utilizados, prazos cumpridos e tranquilidade pós-venda.
- Objeções a contornar:
${dossierObjecoes.map((o: any) => `- ${o.objecao || o.titulo || ""}`).join("\n") || "- Preço vs. valor entregue, cumprimento de prazos de entrega e procedência de matérias-primas."}`;
    }

    if (tipo === "google_ads") {
      return `[Campanha Google Ads - Rede de Pesquisa Local]
Empresa: ${empresa.nome} · Cidade: ${empresa.cidade}/RS
Segmento: ${empresa.segmento}

Palavras-chave prioritárias:
${empresa.termosEncontrados || `${empresa.segmento} em ${empresa.cidade}, projetos ${empresa.segmento}, orçamento ${empresa.segmento}`}

Estrutura de Anúncios Responsivos de Busca (RSA):
- 15 Títulos com foco local, diferenciais de acabamento e pontualidade.
- 4 Descrições ressaltando atendimento presencial em ${empresa.cidade} e Serra Gaúcha.
- Extensões recomendadas: Chamada telefônica, Sitelinks para Portfólio e Especialidades, e Localização física.`;
    }

    if (tipo === "redes_sociais") {
      return `[Linha Editorial para Redes Sociais - Instagram & LinkedIn]
Marca: ${empresa.nome} (${empresa.segmento} em ${empresa.cidade}/RS)

Pilares de Conteúdo:
1. Autoridade Técnica: Bastidores da produção, seleção de materiais e rigor nas normas.
2. Prova Social: Obras e projetos entregues na região com depoimento do cliente.
3. Educação de Valor: Dicas de manutenção, planejamento e tendências estéticas contemporâneas.
4. Conexão Local: Valorização da cultura e raízes da Serra Gaúcha.`;
    }

    return siteHtml;
  };

  if (!empresa) {
    return (
      <div className="p-8 text-center space-y-4">
        <Building2 className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="text-lg font-bold">Nenhuma empresa encontrada</h2>
        <p className="text-xs text-muted-foreground">Cadastre ou importe empresas para acessar o Estúdio de Criação.</p>
        <Button size="sm" onClick={() => navigate({ to: "/empresas" })}>
          Ver Lista de Empresas
        </Button>
      </div>
    );
  }

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
              Multi-IAs · GSAP ScrollTrigger · Anti-IA Bespoke
            </Badge>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2.5">
            <Palette className="h-6 w-6 text-primary" />
            <span>Estúdio de Criação</span>
          </h1>
          <p className="text-xs text-muted-foreground">
            Criação e refinamento de sites profissionais com GSAP, chat de prompts iterativos, paletas cromáticas e briefings.
          </p>
        </div>

        {/* SELETOR DE EMPRESA RÁPIDO */}
        <div className="flex items-center gap-2 bg-card p-2 rounded-xl border shadow-xs min-w-[280px]">
          <Building2 className="h-4 w-4 text-primary shrink-0 ml-1" />
          <div className="flex-1 min-w-0">
            <label className="text-[10px] font-semibold uppercase text-muted-foreground block leading-none">
              Empresa Ativa
            </label>
            <select
              value={empresa.id}
              onChange={(e) => handleTrocarEmpresa(e.target.value)}
              className="w-full bg-transparent text-xs font-bold text-foreground focus:outline-none truncate pt-0.5 cursor-pointer"
            >
              {empresas.map((e) => (
                <option key={e.id} value={e.id} className="bg-popover text-popover-foreground">
                  {e.nome} ({e.cidade} · {e.segmento})
                </option>
              ))}
            </select>
          </div>
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
          <Button
            variant={abaAtiva === "prompts" ? "default" : "outline"}
            size="sm"
            onClick={() => setAbaAtiva("prompts")}
            className="text-xs gap-1.5"
          >
            <FileText className="h-3.5 w-3.5 text-blue-500" />
            <span>Prompts & Briefings Textuais</span>
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

                {/* 2. COMBO-BOX GLOBAL: DIRETRIZES ANTI-IA BESPOKE */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <ShieldCheck className={`h-3.5 w-3.5 ${usarAntiIaBespoke ? "text-emerald-600" : "text-muted-foreground"}`} />
                      <span>Diretrizes Anti-IA Bespoke</span>
                    </label>
                    <Badge
                      variant={usarAntiIaBespoke ? "default" : "outline"}
                      className="text-[9px] px-1.5 py-0 h-4 font-normal"
                    >
                      {usarAntiIaBespoke ? "Ativado" : "Desativado"}
                    </Badge>
                  </div>
                  <Select
                    value={usarAntiIaBespoke ? "ativado" : "desativado"}
                    onValueChange={(val) => {
                      const ativo = val === "ativado";
                      setUsarAntiIaBespoke(ativo);
                      if (empresa) updateEmpresa(empresa.id, { estudioUsarAntiIaBespoke: ativo });
                      toast.info(ativo ? "Diretrizes Anti-IA Bespoke ativadas para todas as IAs." : "Diretrizes Anti-IA desativadas (geração livre).");
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs bg-background font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativado" className="text-xs">
                        🛡️ Ativado — 100% Anti-IA (Sem neon, sem marquee, GSAP clean)
                      </SelectItem>
                      <SelectItem value="desativado" className="text-xs">
                        ⚪ Desativado — Geração Livre (Sem restrições estritas)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 2.1 CHECKBOX: UTILIZAR SKILLS CLAUDE (ANTHROPIC FRONTEND DESIGN) */}
                <div className="flex items-start space-x-2 rounded-md border border-border/70 bg-background/80 p-2">
                  <Checkbox
                    id="usarSkillsClaude"
                    checked={usarSkillsClaude}
                    onCheckedChange={(checked) => {
                      const ativo = checked === true;
                      setUsarSkillsClaude(ativo);
                      if (empresa) updateEmpresa(empresa.id, { estudioUsarSkillsClaude: ativo });
                      toast.info(
                        ativo
                          ? "Skills Claude da Anthropic ativadas (grounding no nicho, sem vícios de IA)."
                          : "Skills Claude desativadas.",
                      );
                    }}
                    className="mt-0.5"
                  />
                  <div className="grid gap-0.5 leading-none">
                    <label
                      htmlFor="usarSkillsClaude"
                      className="text-xs font-semibold text-foreground cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Utilizar Skills Claude</span>
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 font-normal text-muted-foreground">
                        Anthropic
                      </Badge>
                    </label>
                    <p className="text-[10px] text-muted-foreground leading-snug">
                      Diretrizes oficiais de design autoral e anti-clichês da Anthropic no prompt base.
                    </p>
                  </div>
                </div>

                {/* 3. UPLOADS COMPACTOS (LOGO & DIRETRIZES .MD) */}
                <div className="grid grid-cols-2 gap-2 pt-1">
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

                {/* BOTÃO PRINCIPAL DE GERAÇÃO */}
                <Button
                  onClick={handleGerarSite}
                  disabled={gerandoSite || refinandoSite}
                  size="sm"
                  className="w-full text-xs h-9 gap-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-primary text-white hover:opacity-90 shadow-xs"
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
              </div>

              {/* ABAS DO PAINEL ESQUERDO: CHAT VS HISTÓRICO */}
              <Tabs
                value={abaPainelEsquerdo}
                onValueChange={(v) => setAbaPainelEsquerdo(v as "chat" | "historico")}
                className="flex-1 flex flex-col min-h-0"
              >
                <TabsList className="grid grid-cols-2 h-8 p-0.5 bg-muted/60 shrink-0">
                  <TabsTrigger value="chat" className="text-xs gap-1.5 h-7">
                    <MessageSquare className="h-3.5 w-3.5 text-primary" />
                    <span>Chat de Refinamento</span>
                  </TabsTrigger>
                  <TabsTrigger value="historico" className="text-xs gap-1.5 h-7">
                    <History className="h-3.5 w-3.5 text-blue-500" />
                    <span>Versões ({versoes.length})</span>
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
                {/* ABA 2: HISTÓRICO & EXCLUSÃO DE VERSÕES */}
                {/* ================================= */}
                <TabsContent value="historico" className="flex-1 flex flex-col min-h-0 pt-2 space-y-2.5 mt-0">
                  <div className="flex items-center justify-between gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setModalComparadorOpen(true)}
                      disabled={versoes.length < 2}
                      className="text-xs h-7 gap-1 border-primary/30 text-primary hover:bg-primary/5 flex-1"
                    >
                      <Columns className="h-3 w-3" />
                      <span>Comparar Versões em Modal</span>
                    </Button>

                    {versoes.length > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleLimparTodosSites}
                        className="text-xs h-7 text-destructive hover:bg-destructive/10 px-2"
                        title="Apagar todas as versões"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {/* LISTA DAS VERSÕES SALVAS COM BOTÃO DE LIXEIRA */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[380px]">
                    {versoes.length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
                        Nenhuma versão gerada ainda. Clique em "Gerar Novo Site".
                      </div>
                    ) : (
                      versoes.map((v, i) => {
                        const isOficial = siteHtml === v.html;
                        return (
                          <div
                            key={v.id || i}
                            className={`p-2.5 rounded-lg border text-xs transition-all ${
                              isOficial
                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                : "border-border/80 bg-background hover:bg-muted/40"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-foreground text-xs">{v.provedor}</span>
                                  {isOficial && (
                                    <Badge variant="default" className="text-[9px] px-1 py-0 h-4 bg-emerald-600">
                                      Oficial
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{v.modelo}</p>
                              </div>

                              <div className="flex items-center gap-1">
                                <span className="text-[9px] text-muted-foreground">
                                  {v.data ? format(new Date(v.data), "dd/MM HH:mm") : ""}
                                </span>
                                {/* BOTÃO DE LIXEIRA PARA APAGAR VERSÃO */}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApagarVersao(v.id || String(i));
                                  }}
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-1"
                                  title="Apagar esta versão"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-border/40 text-[10px] text-muted-foreground">
                              <span>{v.html ? `${(v.html.length / 1024).toFixed(1)} KB` : "Vazia"}</span>
                              {!isOficial ? (
                                <button
                                  type="button"
                                  onClick={() => handleSelecionarVersaoAtiva(v)}
                                  className="text-primary font-semibold hover:underline"
                                >
                                  Definir como Oficial ➔
                                </button>
                              ) : (
                                <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                                  <CheckCircle2 className="h-3 w-3" /> Versão Ativa
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </aside>
          )}

          {/* ========================================== */}
          {/* COLUNA DIREITA: VISUALIZAÇÃO & TOOLBAR */}
          {/* ========================================== */}
          <main className="flex-1 min-w-0 w-full space-y-3 flex flex-col">
            {/* TOOLBAR SUPERIOR DO SITE */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 rounded-xl border border-border/80 bg-card">
              {/* LADO ESQUERDO: TOGGLE BARRA LATERAL + SELETOR DISPOSITIVO */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPainelEsquerdoAberto(!painelEsquerdoAberto)}
                  className="h-8 text-xs gap-1.5"
                  title={painelEsquerdoAberto ? "Ocultar painel lateral" : "Mostrar painel lateral"}
                >
                  {painelEsquerdoAberto ? (
                    <>
                      <PanelLeftClose className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Recolher</span>
                    </>
                  ) : (
                    <>
                      <PanelLeftOpen className="h-3.5 w-3.5 text-primary" />
                      <span className="font-semibold text-primary">Painel do Estúdio</span>
                    </>
                  )}
                </Button>

                {/* CONTROLES DE DISPOSITIVO */}
                <div className="flex items-center bg-muted p-0.5 rounded-lg border">
                  <Button
                    size="sm"
                    variant={dispositivo === "desktop" ? "default" : "ghost"}
                    onClick={() => setDispositivo("desktop")}
                    className="h-7 px-2 text-xs gap-1"
                    title="Visualização Desktop"
                  >
                    <Monitor className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">Desktop</span>
                  </Button>
                  <Button
                    size="sm"
                    variant={dispositivo === "tablet" ? "default" : "ghost"}
                    onClick={() => setDispositivo("tablet")}
                    className="h-7 px-2 text-xs gap-1"
                    title="Visualização Tablet (768px)"
                  >
                    <Tablet className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">Tablet</span>
                  </Button>
                  <Button
                    size="sm"
                    variant={dispositivo === "mobile" ? "default" : "ghost"}
                    onClick={() => setDispositivo("mobile")}
                    className="h-7 px-2 text-xs gap-1"
                    title="Visualização Mobile (375px)"
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">Mobile</span>
                  </Button>
                </div>
              </div>

              {/* LADO DIREITO: AÇÕES E EXPORTAÇÃO */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* BOTÃO NOVA ABA */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAbrirNovaAba}
                  disabled={!siteHtml}
                  className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground"
                  title="Abrir em Nova Aba do Navegador"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-primary" />
                  <span className="hidden sm:inline">Nova Aba</span>
                </Button>

                {/* BOTÃO COMPARAR VERSÕES EM MODAL */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setModalComparadorOpen(true)}
                  disabled={versoes.length < 2}
                  className="h-8 text-xs gap-1.5"
                  title={versoes.length < 2 ? "Gere pelo menos 2 versões para comparar lado a lado" : "Comparar Versões"}
                >
                  <Columns className="h-3.5 w-3.5 text-primary" />
                  <span className="hidden sm:inline">Comparar</span>
                  {versoes.length >= 2 && (
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                      {versoes.length}
                    </Badge>
                  )}
                </Button>

                {/* CÓDIGO HTML */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setModalCodigoOpen(true)}
                  disabled={!siteHtml}
                  className="h-8 text-xs gap-1"
                  title="Ver Código HTML5"
                >
                  <Code2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Código</span>
                </Button>

                {/* BAIXAR HTML */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBaixarHtml}
                  disabled={!siteHtml}
                  className="h-8 text-xs gap-1"
                  title="Baixar arquivo HTML puro"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">HTML</span>
                </Button>

                {/* BAIXAR ZIP */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBaixarZip}
                  disabled={!siteHtml}
                  className="h-8 text-xs gap-1 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                  title="Baixar ZIP completo com README e configs"
                >
                  <Archive className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">ZIP</span>
                </Button>

                {/* GITHUB */}
                <Button
                  size="sm"
                  onClick={() => setModalGithubOpen(true)}
                  disabled={!siteHtml}
                  className="h-8 text-xs gap-1 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  <Github className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">GitHub</span>
                </Button>

                {/* TELA CHEIA */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setFullscreenOpen(true)}
                  disabled={!siteHtml}
                  className="h-8 w-8 p-0"
                  title="Visualizar em Tela Cheia"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* ÁREA CENTRAL DO IFRAME RESPONSIVO */}
            {siteHtml ? (
              <div className="flex-1 flex justify-center bg-stone-950 p-3 sm:p-5 rounded-xl border border-stone-800 shadow-xl overflow-hidden min-h-[580px]">
                <div
                  style={{
                    width: dispositivo === "desktop" ? "100%" : dispositivo === "tablet" ? "768px" : "375px",
                    height: "100%",
                    minHeight: "560px",
                    transition: "width 0.3s ease",
                  }}
                  className="rounded-lg overflow-hidden border border-stone-800 bg-white"
                >
                  <iframe
                    title="Live Preview do Site GSAP"
                    srcDoc={siteHtml}
                    className="w-full h-full min-h-[560px] border-0"
                    sandbox="allow-scripts allow-same-origin allow-popups"
                  />
                </div>
              </div>
            ) : (
              <Card className="border-border flex-1 flex items-center justify-center min-h-[540px]">
                <CardContent className="p-12 text-center space-y-4 max-w-lg">
                  <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <Globe className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-foreground">Nenhum site gerado para esta empresa ainda</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Selecione o modelo de IA no painel à esquerda, confirme as diretrizes Anti-IA Bespoke e clique em <strong>"Gerar Novo Site"</strong> para criar um projeto completo com animações GSAP e navegação multi-páginas.
                    </p>
                  </div>
                  <Button
                    onClick={handleGerarSite}
                    disabled={gerandoSite}
                    size="sm"
                    className="gap-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-primary text-white"
                  >
                    {gerandoSite ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    <span>Gerar Primeiro Site Agora</span>
                  </Button>
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      )}

      {/* CONTEÚDO DA ABA 2: IDENTIDADE VISUAL E PALETA CROMÁTICA */}
      {abaAtiva === "paleta" && (
        <div className="space-y-4">
          <PaletaCoresCard
            nomeEmpresa={empresa.nome}
            segmento={empresa.segmento}
          />
        </div>
      )}

      {/* CONTEÚDO DA ABA 3: PROMPTS & BRIEFINGS TEXTUAIS */}
      {abaAtiva === "prompts" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
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

          <Card className="border-border">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-xs font-bold uppercase flex items-center justify-between">
                <span>Briefing: {TIPOS_PROMPTS.find((t) => t.value === tipoPrompt)?.label}</span>
                <Badge variant="outline" className="text-[10px] font-normal uppercase">
                  {empresa.nome} ({empresa.cidade})
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Pronto para ser copiado e utilizado em qualquer LLM externa ou ferramenta de desenvolvimento.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="relative">
                <Textarea
                  value={gerarPromptTexto(tipoPrompt)}
                  readOnly
                  rows={16}
                  className="font-mono text-xs leading-relaxed bg-muted/20"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(gerarPromptTexto(tipoPrompt));
                    toast.success("Briefing copiado para a área de transferência!");
                  }}
                  className="absolute top-3 right-3 text-xs gap-1 shadow-xs"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copiar Briefing
                </Button>
              </div>
            </CardContent>
          </Card>
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
    </div>
  );
}
