import { createFileRoute, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Printer,
  Copy,
  Send,
  Globe,
  Instagram,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Zap,
  Package,
  BarChart3,
  MessageSquare,
  Sparkles,
  Phone,
  Building2,
  MapPin,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { whatsappUrl } from "@/lib/links";

export const Route = createFileRoute("/auditoria/$id")({
  component: MicroAuditoriaPublicaPage,
});

function MicroAuditoriaPublicaPage() {
  const { id } = useParams({ from: "/auditoria/$id" });
  const { empresas } = useStore();

  const empresa = empresas.find((e) => e.id === id) || {
    id,
    nome: "Empresa em Análise",
    segmento: "Comércio & Serviços",
    cidade: "Serra Gaúcha",
    endereco: "Região Central",
    score: 48,
    statusSite: "sem_site" as const,
    statusInstagram: "parado" as const,
    telefone: "(54) 99999-9999",
    whatsapp: "(54) 99999-9999",
    diagnostico: {
      site: {
        responsivo: false,
        ssl: false,
        velocidade: "media" as const,
        cta: false,
        formulario: false,
        whatsappBtn: true,
        seoBasico: false,
        presencaGoogle: true,
        identidadeConsistente: false,
        qualidadePercebida: 4,
      },
      instagram: {
        diasDesdeUltimoPost: 60,
        frequencia: "baixa" as const,
        qualidadeVisual: 5,
        consistenciaMarca: 4,
        engajamentoAparente: "baixo" as const,
        bioForte: false,
      },
      atendimento: {
        contatoFacil: false,
        multiplosCanais: false,
        respostaRapida: false,
        provaSocial: false,
        clarezaServicos: true,
      },
    },
    historico: [],
    origem: "manual" as const,
    tags: [],
    crmStage: "identificado" as const,
    ultimaAnalise: new Date().toISOString(),
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link da Micro-Auditoria copiado para envio ao cliente!");
  };

  const waAgenciaUrl = whatsappUrl("54999999999");

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8 print:p-0 print:max-w-none">
      {/* BARRA SUPERIOR DE AÇÕES (Oculta na impressão) */}
      <div className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/40 print:hidden flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            Relatório Executivo Confidencial
          </Badge>
          <span className="text-xs text-muted-foreground">
            Elaborado para <strong>{empresa.nome}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => window.print()} className="text-xs">
            <Printer className="h-3.5 w-3.5 mr-1.5" />
            Imprimir / Salvar PDF
          </Button>
          <Button size="sm" variant="outline" onClick={copyShareLink} className="text-xs">
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            Copiar Link
          </Button>
        </div>
      </div>

      {/* CABEÇALHO DO RELATÓRIO */}
      <div className="rounded-xl border border-border/60 bg-gradient-to-br from-card via-card to-muted/20 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-primary tracking-wider uppercase">
              Auditoria de Maturidade Digital & Comunicação 360
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {empresa.nome}
            </h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" /> {empresa.segmento}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {empresa.cidade}/RS
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> {new Date().toLocaleDateString("pt-BR")}
              </span>
            </div>
          </div>

          {/* Medidor de Score */}
          <div className="flex items-center gap-4 bg-muted/50 p-4 rounded-xl border border-border/60">
            <div className="text-center">
              <div className="text-3xl font-extrabold text-foreground">{empresa.score}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">de 100 pontos</div>
            </div>
            <div className="h-10 w-px bg-border" />
            <div className="text-xs space-y-0.5">
              <div className="font-semibold text-foreground">Nível de Presença:</div>
              <Badge
                variant="outline"
                className={
                  empresa.score >= 70
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                    : empresa.score >= 50
                    ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                    : "bg-rose-500/10 text-rose-600 border-rose-500/30"
                }
              >
                {empresa.score >= 70 ? "Consistente" : empresa.score >= 50 ? "Intermediário" : "Crítico / Urgente"}
              </Badge>
            </div>
          </div>
        </div>

        {/* RESUMO EXECUTIVO */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-background border border-border/50 space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium">Presença Web & Site</span>
            <div className="flex items-center gap-1.5 font-semibold text-sm">
              {empresa.site ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Ativo
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-rose-500" /> Sem Site Ativo
                </>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {empresa.site ? "Possui canal institucional identificado." : "Perda de buscas qualificadas no Google."}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-background border border-border/50 space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium">Redes Sociais & Instagram</span>
            <div className="flex items-center gap-1.5 font-semibold text-sm">
              {empresa.diagnostico.instagram.diasDesdeUltimoPost !== null && empresa.diagnostico.instagram.diasDesdeUltimoPost < 30 ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Ativo
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> Desatualizado
                </>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {empresa.diagnostico.instagram.diasDesdeUltimoPost
                ? `Último post há ~${empresa.diagnostico.instagram.diasDesdeUltimoPost} dias.`
                : "Sem canal estruturado para atração de leads."}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-background border border-border/50 space-y-1">
            <span className="text-[11px] text-muted-foreground font-medium">Atendimento & Conversão</span>
            <div className="flex items-center gap-1.5 font-semibold text-sm">
              {empresa.diagnostico.atendimento.contatoFacil ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Rápido
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-rose-500" /> Gargalo de Contato
                </>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Demora para responder orçamentos reduz a taxa de fechamento.
            </p>
          </div>
        </div>
      </div>

      {/* SEÇÃO 1: IMPACTO FINANCEIRO & CUSTO DA INAÇÃO */}
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-6 space-y-4">
        <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
          <DollarSign className="h-5 w-5" />
          <h2 className="text-base font-bold">Diagnóstico Financeiro: O Custo da Inação</h2>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Estima-se que a <strong>{empresa.nome}</strong> deixe de faturar entre <strong>R$ 8.000 e R$ 25.000 mensais</strong> em novos clientes e orçamentos não convertidos devido à ausência de um canal web de alta conversão, materiais de apresentação despadronizados e atendimento sem automação.
        </p>
        <div className="grid sm:grid-cols-2 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-lg bg-background/80 border border-border/60">
            <strong className="text-foreground block mb-1">📉 Gargalo de Captação:</strong>
            <span className="text-muted-foreground">
              Clientes que procuram por {empresa.segmento} em {empresa.cidade} encontram concorrentes posicionados e compram deles por facilidade de contato.
            </span>
          </div>
          <div className="p-3 rounded-lg bg-background/80 border border-border/60">
            <strong className="text-foreground block mb-1">⏱️ Gargalo de Processo:</strong>
            <span className="text-muted-foreground">
              Processos manuais para envio de tabelas, orçamentos e agendamentos tomam tempo precioso dos gestores.
            </span>
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: PRESCRIÇÃO DE COMUNICAÇÃO 360 & SISTEMAS */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">
            Plano Estratégico de Evolução: Comunicação 360 & Sistemas
          </h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Soluções integradas 'chave na mão' recomendadas para posicionar a {empresa.nome} como líder do setor em {empresa.cidade}:
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Branding & Embalagens */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Package className="h-4 w-4 text-amber-500" />
                Branding, Impressos & Embalagens
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>
                Identidade visual premium, catálogo de produtos de alto impacto e design de embalagens que valorizam a experiência física e elevam o ticket médio.
              </p>
              <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 pt-1">
                💰 Impacto: Permite cobrar 20% a 40% a mais pelo produto.
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Site de Alta Conversão & Vídeos */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-500" />
                Site de Conversão & Vídeos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>
                Portal responsivo de alta velocidade com botão de WhatsApp direto, otimização no Google (SEO local) e vídeos institucionais cinematográficos.
              </p>
              <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 pt-1">
                💰 Impacto: Converte visitantes em orçamentos 24h por dia.
              </div>
            </CardContent>
          </Card>

          {/* Card 3: CRM Comercial & Automação */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-500" />
                Sistemas de Gestão & CRM
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>
                Implantação de funil de vendas automatizado, catálogo digital de pedidos e triagem inteligente no WhatsApp sem trabalho técnico para a equipe.
              </p>
              <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 pt-1">
                💰 Impacto: Aumenta o fechamento de propostas em até 40%.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SEÇÃO 3: PRÓXIMO PASSO & AGENDAMENTO */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 sm:p-8 text-center space-y-4">
        <Badge variant="secondary" className="bg-primary/20 text-primary">
          Próximo Passo Recomendado
        </Badge>
        <h3 className="text-xl font-bold text-foreground">
          Agende uma Apresentação Executiva de 15 Minutos
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Nossa equipe apresenta a simulação visual personalizada de como a marca, o site e o sistema de vendas da <strong>{empresa.nome}</strong> funcionarão na prática. Sem compromisso comercial.
        </p>

        <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
          <Button
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md"
            onClick={() => window.open(waAgenciaUrl, "_blank", "noopener")}
          >
            <Send className="h-4 w-4 mr-2" />
            Falar pelo WhatsApp com um Especialista
          </Button>
        </div>
      </div>
    </div>
  );
}
