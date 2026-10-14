import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Rocket,
  Target,
  Globe,
  Search,
  Instagram,
  Zap,
  MessageSquare,
  Clock,
  Users2,
  ListChecks,
  Star,
  Camera,
  CheckCircle2,
  Copy,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import type { Empresa } from "@/lib/mock-data";

interface MatrizResponsabilidadesProps {
  empresa: Empresa;
  nomeAgencia?: string;
}

export function MatrizResponsabilidades({
  empresa,
  nomeAgencia = "Locomotiva Comunicação",
}: MatrizResponsabilidadesProps) {
  const cidade = empresa.cidade || "Serra Gaúcha";
  const segmento = empresa.segmento || "Empresa";
  const area = empresa.areaAtuacao || segmento;

  const pilaresAgencia = [
    {
      icon: Globe,
      titulo: "Site de Alta Conversão (21st.dev + GSAP)",
      desc: `Desenvolvimento de landing page moderna e responsiva com animações fluidas GSAP, carregamento ultrarrápido e botão fixo de WhatsApp direcionado.`,
      entregavel: "Site publicado, seguro (HTTPS) e adaptado para celulares.",
      corIcon: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    },
    {
      icon: Search,
      titulo: "Otimização de SEO Google & Google Maps",
      desc: `Ranqueamento nas palavras-chave mais buscadas em ${cidade} para que a empresa apareça na frente dos concorrentes nas buscas locais.`,
      entregavel: "Perfil do Google Meu Negócio otimizado e indexação no topo.",
      corIcon: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    {
      icon: Instagram,
      titulo: "Gestão Estratégica de Redes Sociais",
      desc: `Criação de identidade visual profissional, linha editorial de autoridade e conteúdos que geram desejo e confiança no público da região.`,
      entregavel: "Calendário mensal de postagens, reels e stories planejados.",
      corIcon: "text-pink-500 bg-pink-500/10 border-pink-500/20",
    },
    {
      icon: Zap,
      titulo: "Tráfego Pago & Campanhas Segmentadas",
      desc: `Anúncios patrocinados com foco cirúrgico no público comprador de ${cidade} com perfil econômico adequado para contratar o serviço.`,
      entregavel: "Campanhas rodando com métricas claras de custo por lead.",
      corIcon: "text-violet-500 bg-violet-500/10 border-violet-500/20",
    },
    {
      icon: MessageSquare,
      titulo: "Scripts Comerciais & Roteiros de Vendas",
      desc: `Modelos de mensagens persuasivas para WhatsApp, quebra de objeções e roteiros de primeiro contato estruturados pela agência.`,
      entregavel: "Guia prático de abordagem e cadência para a equipe comercial.",
      corIcon: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
  ];

  const pilaresCliente = [
    {
      icon: Clock,
      titulo: "Velocidade no Atendimento WhatsApp",
      desc: `Responder mensagens em menos de 5 minutos no horário comercial. Leads atendidos rapidamente têm probabilidade até 7x maior de fechar negócio.`,
      impacto: "Evita que o interessado pesquise e feche com o concorrente.",
      corIcon: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      icon: Users2,
      titulo: "Alinhamento da Equipe de Recepção / Vendas",
      desc: `Capacitar quem atende o WhatsApp e telefone para aplicar os scripts comerciais, fazer perguntas de diagnóstico e registrar os contatos.`,
      impacto: "Aumenta diretamente a taxa de conversão de contatos em vendas.",
      corIcon: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    },
    {
      icon: ListChecks,
      titulo: "Tabela de Preços & Catálogo Atualizados",
      desc: `Manter cardápio, tabela de serviços, fotos de opções e prazos de entrega organizados para envio instantâneo ao interessado.`,
      impacto: "Gera segurança imediata e acelera o ciclo de decisão do cliente.",
      corIcon: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    },
    {
      icon: Star,
      titulo: "Coleta Ativa de Avaliações no Google (5 Estrelas)",
      desc: `Pedir ativamente uma nota e breve depoimento no Google Maps para cada cliente que sair satisfeito, compartilhando o link direto.`,
      impacto: "Constrói prova social inabalável que atrai novos compradores.",
      corIcon: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    {
      icon: Camera,
      titulo: "Envio de Fotos e Vídeos Reais do Negócio",
      desc: `Compartilhar com a agência registros autênticos de bastidores, instalações físicas, entregas de pedidos e fotos de clientes reais.`,
      impacto: "Humaniza a marca e comprova a excelência real da empresa.",
      corIcon: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    },
  ];

  const handleCopiarResumo = () => {
    const texto = `📋 *MATRIZ DE ALINHAMENTO COMERCIAL — ${empresa.nome.toUpperCase()}*
📍 ${cidade}/RS · Segmento: ${area}

🚀 *O QUE A ${nomeAgencia.toUpperCase()} ENTREGA (GERAÇÃO DE OPORTUNIDADES):*
1. Site de Alta Conversão com animações GSAP e botão WhatsApp integrado.
2. Otimização de SEO Google e Maps para ranqueamento regional no topo.
3. Gestão visual e estratégica de Redes Sociais com linha editorial.
4. Tráfego Pago focado no público comprador de ${cidade}.
5. Scripts de abordagem e cadência de vendas para WhatsApp e direct.

🎯 *O QUE O LEAD DEVE ATENDER NO PRÓPRIO NEGÓCIO (CONVERSÃO EM VENDAS):*
1. Atendimento rápido no WhatsApp (responder em até 5 minutos).
2. Time de recepção e vendas alinhado para aplicar os scripts comerciais.
3. Informações de preços, catálogos e horários sempre atualizados.
4. Pedir ativamente avaliações 5 estrelas no Google Maps aos clientes atendidos.
5. Envio de fotos e vídeos reais do espaço e produtos para a comunicação.

💡 *RESULTADO DA SINERGIA:*
A agência gera a demanda e traz o cliente qualificado; o atendimento interno encanta e fecha a venda com alta rentabilidade.`;

    navigator.clipboard.writeText(texto);
    toast.success("Matriz de responsabilidades copiada para a área de transferência!");
  };

  return (
    <div className="space-y-6">
      {/* CABEÇALHO DA MATRIZ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-background to-secondary/30">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
              Alinhamento de Escopo & Resultados
            </Badge>
            <span className="text-xs text-muted-foreground">{empresa.nome} · {cidade}</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            Matriz de Responsabilidades: Agência vs. Empresa
          </h2>
          <p className="text-xs text-muted-foreground max-w-2xl">
            A garantia de aumento no faturamento depende de uma divisão clara: a <strong>{nomeAgencia}</strong> atrai e qualifica a demanda de mercado, enquanto a <strong>sua empresa</strong> garante a velocidade de atendimento e o fechamento da venda.
          </p>
        </div>

        <Button
          onClick={handleCopiarResumo}
          variant="outline"
          size="sm"
          className="gap-1.5 shrink-0 text-xs shadow-sm"
        >
          <Copy className="h-3.5 w-3.5" />
          Copiar Matriz p/ WhatsApp
        </Button>
      </div>

      {/* GRADE COM AS DUAS COLUNAS PRINCIPAIS */}
      <div className="grid md:grid-cols-2 gap-6 items-start">
        {/* COLUNA ESQUERDA: O QUE A LOCOMOTIVA VAI ATENDER */}
        <Card className="border-blue-500/30 bg-card shadow-sm hover:border-blue-500/50 transition-colors">
          <CardHeader className="border-b border-border/60 pb-4 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                  <Rocket className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <span>O que a {nomeAgencia} vai atender</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    Inteligência de Mercado, Tecnologia & Geração de Demanda
                  </CardDescription>
                </div>
              </div>
              <Badge className="bg-blue-600 text-white text-[10px]">Escopo da Agência</Badge>
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Estes são os entregáveis e serviços sob responsabilidade técnica e estratégica da nossa agência para posicionar <strong>{empresa.nome}</strong> no topo em {cidade}:
            </p>

            <div className="space-y-3">
              {pilaresAgencia.map((pilar, idx) => {
                const Icon = pilar.icon;
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg border border-border/80 bg-muted/30 hover:bg-muted/60 transition-colors space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-md border ${pilar.corIcon}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <h4 className="text-xs font-semibold text-foreground">{pilar.titulo}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed pl-8">
                      {pilar.desc}
                    </p>
                    <div className="pl-8 pt-1 flex items-center gap-1.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                      <CheckCircle2 className="h-3 w-3 shrink-0" />
                      <span>{pilar.entregavel}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-500/5 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong>Compromisso de Entrega:</strong> Entregar uma estrutura digital sem cara de amador, transformando pesquisas anônimas no Google em contatos reais no WhatsApp da sua empresa.
              </span>
            </div>
          </CardContent>
        </Card>

        {/* COLUNA DIREITA: O QUE O LEAD PRECISA ATENDER NO NEGÓCIO DELE */}
        <Card className="border-emerald-500/30 bg-card shadow-sm hover:border-emerald-500/50 transition-colors">
          <CardHeader className="border-b border-border/60 pb-4 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-500/20">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <span>O que o Lead precisa atender no negócio</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    Operação Interna, Agilidade no Atendimento & Vendas
                  </CardDescription>
                </div>
              </div>
              <Badge className="bg-emerald-600 text-white text-[10px]">Ação do Cliente</Badge>
            </div>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Para que os leads gerados pela agência resultem em vendas no caixa, a empresa e seu time de vendas precisam assegurar estes 5 pontos operacionais:
            </p>

            <div className="space-y-3">
              {pilaresCliente.map((pilar, idx) => {
                const Icon = pilar.icon;
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg border border-border/80 bg-muted/30 hover:bg-muted/60 transition-colors space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-md border ${pilar.corIcon}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <h4 className="text-xs font-semibold text-foreground">{pilar.titulo}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed pl-8">
                      {pilar.desc}
                    </p>
                    <div className="pl-8 pt-1 flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="h-3 w-3 shrink-0" />
                      <span>{pilar.impacto}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
              <Zap className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>A Regra de Ouro da Conversão:</strong> Propaganda nenhuma salva atendimento demorado. Quanto mais rápido seu time responde no WhatsApp, menor é o custo de aquisição de cada cliente.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CARD INFERIOR: SINERGIA E RESULTADOS */}
      <Card className="border-primary/30 bg-gradient-to-r from-primary/5 via-background to-primary/5">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Como a Sinergia se Converte em Mais Faturamento
              </h3>
              <p className="text-xs text-muted-foreground max-w-3xl">
                Quando a <strong>{nomeAgencia}</strong> entrega tecnologia e tráfego qualificado e a <strong>{empresa.nome}</strong> responde com agilidade e roteiro de fechamento, a taxa de conversão sobe em média de <strong>15% para até 40%</strong>, multiplicando o faturamento sem necessidade de baixar preços.
              </p>
            </div>

            <Button
              onClick={handleCopiarResumo}
              className="gap-2 text-xs font-semibold shrink-0 bg-primary text-primary-foreground hover:opacity-90"
            >
              <span>Usar esta Matriz na Proposta</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
