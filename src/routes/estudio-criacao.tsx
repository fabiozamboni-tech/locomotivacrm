import React, { useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { useStore } from "@/lib/store";
import { getApiSettings } from "@/lib/api-settings";
import {
  gerarSiteCompletoIA_ServerFn,
  type PesquisaWebSiteResult,
} from "@/lib/site-generator.server";
import { exportarSiteComoZip } from "@/lib/site-zip-exporter";
import type { Empresa, SiteVersaoGerada } from "@/lib/mock-data";
import { toCtx } from "@/lib/ai.functions";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import {
  Palette,
  Globe,
  FileText,
  Sparkles,
  Loader2,
  Building2,
  Search,
  ExternalLink,
  Download,
  Github,
  CheckCircle2,
  Copy,
  Layers,
  Archive,
  ArrowRight,
  Info,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { toast } from "sonner";

import {
  SeletorAgentesIa,
  AGENTES_IA_CATALOGO,
  type AgenteIaOption,
} from "@/components/estudio-criacao/seletor-agentes-ia";
import { ComparadorVersoesSites } from "@/components/estudio-criacao/comparador-versoes-sites";
import { ExportarGithubModal } from "@/components/estudio-criacao/exportar-github-modal";
import { PaletaCoresCard } from "@/components/paleta-cores-card";

export const Route = createFileRoute("/estudio-criacao")({
  validateSearch: z.object({
    empresa: z.string().optional(),
    tab: z.enum(["site", "paleta", "prompts"]).optional(),
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

function EstudioCriacaoPage() {
  const search = Route.useSearch() as { empresa?: string; tab?: "site" | "paleta" | "prompts" };
  const navigate = useNavigate();
  const { empresas, updateEmpresa, addHistorico } = useStore();

  const gerarSiteFn = useServerFn(gerarSiteCompletoIA_ServerFn);

  // Empresa ativa
  const empresaId = search.empresa || empresas[0]?.id || "";
  const empresa = empresas.find((e) => e.id === empresaId) || empresas[0];

  // Sub-aba ativa
  const [abaAtiva, setAbaAtiva] = useState<"site" | "paleta" | "prompts">(search.tab || "site");

  // Agente de IA selecionado
  const [agenteSelecionado, setAgenteSelecionado] = useState<AgenteIaOption>(AGENTES_IA_CATALOGO[0]);

  // Estados de geração
  const [gerandoSite, setGerandoSite] = useState(false);
  const [siteHtml, setSiteHtml] = useState<string>(empresa?.siteGeradoHtml || "");
  const [versoes, setVersoes] = useState<SiteVersaoGerada[]>(empresa?.siteVersoes || []);

  // Modais
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [modalGithubOpen, setModalGithubOpen] = useState(false);

  // Aba de Prompts Textuais
  const [tipoPrompt, setTipoPrompt] = useState("anti_ia_master");

  // Sincroniza ao trocar de empresa
  useEffect(() => {
    if (empresa) {
      setSiteHtml(empresa.siteGeradoHtml || "");
      setVersoes(empresa.siteVersoes || []);
    }
  }, [empresa?.id, empresa?.siteGeradoHtml, empresa?.siteVersoes]);

  const handleTrocarEmpresa = (novaId: string) => {
    navigate({
      search: {
        empresa: novaId,
        tab: abaAtiva,
      } as never,
    });
  };

  const handleGerarSite = async () => {
    if (!empresa) {
      toast.error("Selecione uma empresa primeiro.");
      return;
    }

    try {
      setGerandoSite(true);
      toast.info(
        `Iniciando pesquisa e criação com ${agenteSelecionado.nome} (${agenteSelecionado.modelo})...`,
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
          customKeys,
          diagnostico: empresa.diagnostico,
          dossier360: empresa.dossier360,
          relatorio: empresa.relatorioLead,
        },
      });

      const novoHtml = res.html;
      setSiteHtml(novoHtml);

      // Registra a nova versão no histórico
      const novaVersao: SiteVersaoGerada = {
        id: `versao_${Date.now()}`,
        data: res.geradoEm || new Date().toISOString(),
        provedor: agenteSelecionado.nome,
        modelo: agenteSelecionado.modelo,
        html: novoHtml,
        pesquisaWeb: res.pesquisaWeb,
        ativa: true,
      };

      const novasVersoes = [novaVersao, ...(versoes || [])];
      setVersoes(novasVersoes);

      // Atualiza no banco de dados / store
      updateEmpresa(empresa.id, {
        siteGeradoHtml: novoHtml,
        siteGeradoData: res.geradoEm,
        siteVersoes: novasVersoes,
        analiseAtualizadaEm: new Date().toISOString(),
      });

      addHistorico(empresa.id, {
        data: new Date().toISOString(),
        tipo: "nota",
        texto: `Nova versão de site gerada com ${agenteSelecionado.nome} (${agenteSelecionado.modelo}) no Estúdio de Criação.`,
      });

      toast.success(
        `Site gerado com sucesso por ${agenteSelecionado.nome} e salvo no banco de dados!`,
      );
    } catch (err: any) {
      console.error("Erro ao gerar site:", err);
      toast.error(err?.message || "Falha na geração do site.");
    } finally {
      setGerandoSite(false);
    }
  };

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

    toast.success(`Versão criada por ${versao.provedor} definida como o site oficial da empresa!`);
  };

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

  const copyText = (texto: string, label: string) => {
    navigator.clipboard.writeText(texto);
    toast.success(`${label} copiado!`);
  };

  // Gerador de briefing textual
  const gerarPromptCompleto = (tipo: string): string => {
    if (!empresa) return "";

    const basePromptAntiIa = `[Contexto do Sistema]Atue como um Desenvolvedor Frontend Sênior e UI/UX Designer de Elite. Sua missão é criar a estrutura, o layout e o código de um site profissional para o nicho que será especificado. Você deve ignorar completamente os vieses automáticos de geração por IA e seguir rigorosamente as diretrizes humanas abaixo:
[Regras de Design - Anti-IA]
Proibições Absolutas: Não utilize fundos pretos ou roxos com luzes neon artificiais. Não utilize gradientes genéricos em botões. Não utilize grids repetitivos em loop (como o padrão de 3 cards idênticos lado a lado). Evite ilustrações 3D genéricas ou ícones flutuantes sem propósito funcional.
Arquitetura Visual: Priorize o minimalismo premium, design editorial ou contemporâneo. Use "respiro" (whitespace) generoso e assimetria inteligente no grid para dar ritmo visual ao site.
Paleta de Cores e Tipografia: Use uma combinação contida de no máximo 3 cores. Defina uma hierarquia tipográfica marcante (ex: uma fonte com forte personalidade para títulos e uma sans-serif extremamente limpa para o corpo).
[Estrutura e Elementos Obrigatórios]
Hero Section de Alto Impacto: Deve conter uma imagem ou elemento visual grande em tela cheia (ou grande angular), um título forte e direto, e um CTA (Botão de Chamada para Ação) principal de destaque claro.
Efeito Parallax: Implemente um efeito parallax refinado nas imagens principais e de transição de seção, garantindo fluidez sem quebrar a performance da página.
[Animações e Interatividade]
GSAP Integrado: Toda a camada de animação deve ser controlada via GSAP (GreenSock Animation Platform - https://gsap.com/).
Animações na Hero: Crie uma animação de entrada (intro) sofisticada para os elementos da Hero Section (título, imagem e CTA surgindo de forma coordenada ao carregar a página).
Animações de Scroll (ScrollTrigger): Use o plugin ScrollTrigger do GSAP (https://gsap.com/docs/v3/Plugins/ScrollTrigger/) para orquestrar elementos que surgem, deslizam ou modificam sua opacidade de forma suave à medida que o usuário rola a página (evite animações bruscas ou genéricas do CSS puro).
[Texto e Conteúdo]
Tom de Voz Humano: Escreva copies diretas, focadas em benefícios reais. Está proibido o uso de jargões clichês de IA (ex: "revolucionário", "a solução definitiva", "no mundo dinâmico de hoje"). Não use excesso de emojis ou exclamações.
[Especificação do Nicho]Agora, aplique todas as regras acima para criar o site do seguinte nicho:
- Empresa: ${empresa.nome}
- Nicho / Atuação: ${empresa.segmento} (${empresa.areaAtuacao || "Geral"})
- Cidade: ${empresa.cidade}/RS (Serra Gaúcha)
- Telefone / WhatsApp: ${empresa.whatsapp || empresa.telefone || "A definir"}
- Endereço: ${empresa.endereco || `${empresa.cidade}/RS`}
- Diferenciais locais: Atendimento próximo, cumprimento de prazos e excelência de execução.`;

    if (tipo === "anti_ia_master") return basePromptAntiIa;

    if (tipo === "copy_vendas") {
      return `Atue como um Copywriter Humano Sênior especializado em conversão para negócios locais no Rio Grande do Sul.
Escreva a copy completa da página de vendas para:
Empresa: ${empresa.nome} (${empresa.segmento} em ${empresa.cidade}/RS)

DIRETRIZES:
1. NUNCA use jargões de IA como "no mundo dinâmico de hoje", "revolucionário", "a solução que você esperava".
2. Foque nas dores reais do cliente de ${empresa.cidade}: medo de atraso na obra/serviço, medo de acabamento mal feito, dificuldade de conseguir assistência.
3. Mostre autoridade com naturalidade e convide diretamente para conversa consultiva no WhatsApp.`;
    }

    if (tipo === "google_ads") {
      return `Crie 5 variações de anúncios de alta conversão para o Google Ads (Rede de Pesquisa) para a empresa:
Empresa: ${empresa.nome} (${empresa.segmento} em ${empresa.cidade})
Público: Pessoas pesquisando ativamente por ${empresa.segmento} em ${empresa.cidade} e cidades vizinhas da Serra Gaúcha.
Regras: Títulos de até 30 caracteres com a palavra-chave local e descrições diretas com CTA para orçamento.`;
    }

    return basePromptAntiIa;
  };

  if (!empresa) {
    return (
      <div className="p-8 text-center space-y-4">
        <Building2 className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="text-lg font-bold">Nenhuma empresa encontrada no sistema</h2>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Cadastre ou importe empresas para utilizar o Estúdio de Criação de Sites e Identidade Visual.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* CABEÇALHO DO ESTÚDIO DE CRIAÇÃO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
              Estúdio de Criação Locomotiva
            </Badge>
            <Badge variant="outline" className="text-xs">
              GSAP Anti-IA & Multi-Agentes
            </Badge>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2.5">
            <Palette className="h-6 w-6 text-primary" />
            <span>Estúdio de Criação</span>
          </h1>
          <p className="text-xs text-muted-foreground max-w-2xl">
            Crie landing pages de alto padrão com animações GSAP fluidas, paletas cromáticas harmônicas e briefings persuasivos sem vícios de IA.
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

      {/* SUB-ABAS DO ESTÚDIO DE CRIAÇÃO */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <Button
          variant={abaAtiva === "site" ? "default" : "outline"}
          size="sm"
          onClick={() => setAbaAtiva("site")}
          className="text-xs gap-1.5"
        >
          <Globe className="h-3.5 w-3.5 text-emerald-500" />
          <span>Criação de Sites (GSAP Anti-IA)</span>
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

      {/* CONTEÚDO DA ABA 1: CRIAÇÃO DE SITES */}
      {abaAtiva === "site" && (
        <div className="space-y-6">
          {/* CONTEXTO DA EMPRESA SELECIONADA */}
          <div className="p-4 rounded-xl border border-border/80 bg-card/60 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold">{empresa.nome}</h3>
                <Badge variant="outline" className="text-[10px]">
                  {empresa.cidade}/RS
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {empresa.segmento}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {empresa.diagnostico?.site?.responsivo === false
                  ? "⚠️ Diagnóstico detectou que o site antigo não é mobile-friendly."
                  : "✓ Pronto para criação de site com carregamento veloz, parallax e CTA direto para WhatsApp."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleGerarSite}
                disabled={gerandoSite}
                size="sm"
                className="text-xs gap-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-primary text-white hover:opacity-90 shadow-sm"
              >
                {gerandoSite ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                <span>
                  {gerandoSite
                    ? "Pesquisando & Criando Site..."
                    : `Criar Site com ${agenteSelecionado.nome}`}
                </span>
              </Button>
            </div>
          </div>

          {/* SELETOR DE AGENTES E MODELOS DE IA */}
          <SeletorAgentesIa
            agenteSelecionadoId={agenteSelecionado.id}
            onSelecionarAgente={setAgenteSelecionado}
          />

          {/* VISUALIZAÇÃO, COMPARADOR E EXPORTAÇÃO */}
          {siteHtml ? (
            <ComparadorVersoesSites
              empresa={empresa}
              siteHtmlAtivo={siteHtml}
              versoes={versoes}
              onSelecionarVersaoAtiva={handleSelecionarVersaoAtiva}
              onBaixarHtml={handleBaixarHtml}
              onBaixarZip={handleBaixarZip}
              onAbrirModalGithub={() => setModalGithubOpen(true)}
              onAbrirTelaCheia={() => setFullscreenOpen(true)}
            />
          ) : (
            <Card className="border-border">
              <CardContent className="p-12 text-center space-y-4">
                <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <Globe className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold">Nenhum site foi gerado para esta empresa ainda</h3>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Escolha um dos agentes de IA acima ou use o motor editorial nativo para gerar uma landing page completa com animações GSAP.
                  </p>
                </div>
                <Button onClick={handleGerarSite} disabled={gerandoSite} size="sm" className="gap-1.5">
                  {gerandoSite ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  <span>Gerar Primeira Versão do Site</span>
                </Button>
              </CardContent>
            </Card>
          )}
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
            <CardContent className="p-4 space-y-3">
              <Textarea
                rows={14}
                readOnly
                value={gerarPromptCompleto(tipoPrompt)}
                className="text-xs font-mono leading-relaxed bg-muted/20"
              />
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-muted-foreground">
                  Injeta automaticamente as diretrizes anti-IA e o contexto de {empresa.cidade}/RS.
                </span>
                <Button
                  size="sm"
                  onClick={() => copyText(gerarPromptCompleto(tipoPrompt), "Briefing")}
                  className="text-xs gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copiar Briefing</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL DE EXPORTAÇÃO PARA GITHUB */}
      {siteHtml && (
        <ExportarGithubModal
          open={modalGithubOpen}
          onOpenChange={setModalGithubOpen}
          empresa={empresa}
          htmlContent={siteHtml}
          onSuccess={(repoUrl) => {
            // Salva a url do repo no histórico da empresa se desejar
            addHistorico(empresa.id, {
              data: new Date().toISOString(),
              tipo: "nota",
              texto: `Repositório criado no GitHub: ${repoUrl}`,
            });
          }}
        />
      )}

      {/* MODAL DE TELA CHEIA */}
      <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
        <DialogContent className="max-w-[96vw] w-[96vw] h-[94vh] p-2 flex flex-col">
          <DialogHeader className="px-4 py-2 flex flex-row items-center justify-between border-b">
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Globe className="h-4 w-4 text-emerald-500" />
              <span>{empresa.nome} · Pré-visualização em Tela Cheia</span>
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleBaixarHtml} className="h-7 text-xs gap-1">
                <Download className="h-3 w-3" /> Baixar HTML
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 w-full h-full rounded-b-xl overflow-hidden bg-white">
            <iframe
              title="Tela Cheia"
              srcDoc={siteHtml}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
