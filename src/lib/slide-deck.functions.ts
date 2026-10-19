import { createServerFn } from "@tanstack/react-start";
import type { Empresa, SlideItem, ApresentacaoSlidesData } from "./mock-data";
import type { Dossier360Result } from "./dossier-360.functions";
import type { Relatorio } from "./relatorio.functions";

/**
 * Monta automaticamente a apresentação de slides padrão
 * com base nos dados reais coletados da empresa, dossiê psicológico e relatório SEO.
 */
export function gerarApresentacaoPadrao(
  empresa: Empresa,
  dossier?: Dossier360Result | null,
  relatorio?: Relatorio | null,
): ApresentacaoSlidesData {
  const cidade = empresa.cidade || "RS";
  const segmento = empresa.segmento || "Empresa";
  const area = empresa.areaAtuacao || segmento;
  const publico = empresa.publicoAlvo || relatorio?.analisePublicoAlvo?.perfilComprador || "Consumidores e contratantes locais exigentes buscando qualidade e agilidade.";

  const slides: SlideItem[] = [
    // SLIDE 1: CAPA
    {
      id: "slide_capa",
      tipo: "capa",
      titulo: `Plano Estratégico de Presença Digital & Aumento de Vendas`,
      subtitulo: `Diagnóstico Comercial e Proposta de Aceleração para ${empresa.nome}`,
      pontos: [
        `Empresa: ${empresa.nome} (${area})`,
        `Localização: ${cidade}/RS`,
        `Apresentado por: Locomotiva Comunicação`,
        `Foco: Transformar visibilidade digital em clientes recorrentes e faturamento`,
      ],
      destaque: "Estratégia 360 & Tecnologia de Alta Conversão",
      autor: "Locomotiva Comunicação · Serra Gaúcha",
      tags: ["Proposta", "Estratégia 360", cidade],
    },

    // SLIDE 2: MERCADO & PÚBLICO-ALVO
    {
      id: "slide_publico",
      tipo: "mercado",
      titulo: "Quem é o seu Público & Como ele Compra Hoje",
      subtitulo: `Comportamento de Busca e Critérios de Decisão em ${cidade} e Região`,
      pontos: [
        `Perfil Comprador: ${publico}`,
        relatorio?.analisePublicoAlvo?.comoBuscaNaInternet ||
          `Busca ativa no Google Maps por "${segmento} em ${cidade}" antes de ligar ou visitar.`,
        `Critérios de Decisão: ${relatorio?.analisePublicoAlvo?.criteriosDeDecisao?.join(", ") || "Rapidez de resposta, portfólio visual impecável e avaliações positivas de outros clientes."}`,
        `Motivação Principal: ${relatorio?.analisePublicoAlvo?.principaisDoresEInteresses?.join(", ") || "Segurança na contratação, pontualidade e transparência no atendimento."}`,
      ],
      destaque: "Quem não aparece na primeira página do Google ou não passa confiança nas redes é imediatamente descartado em favor do concorrente.",
      tags: ["Público-Alvo", "Google", "Comportamento"],
    },

    // SLIDE 3: DIAGNÓSTICO ATUAL & ONDE SE PERDE VENDAS
    {
      id: "slide_diagnostico",
      tipo: "diagnostico",
      titulo: "Raio-X de Presença: Onde a Marca Está Perdendo Oportunidades",
      subtitulo: "Análise de Visibilidade no Google, Redes Sociais e Atendimento",
      pontos: [
        empresa.site
          ? `Site Atual: Avaliado como ${empresa.statusSite} — necessita de modernização para padrão mobile responsivo e carregamento instantâneo.`
          : `Site Institucional: A empresa NÃO possui site próprio indexado, perdendo até 70% das buscas orgânicas de clientes prontos para comprar.`,
        empresa.instagram
          ? `Instagram (${empresa.instagram}): Status ${empresa.statusInstagram} — potencial inexplorado para posicionamento de autoridade e atração de novos seguidores da região.`
          : `Instagram: Ausência de canal visual ativo para demonstração diária de qualidade e bastidores.`,
        `Google Maps: Concorrentes diretos estão captando pesquisas por estarem com perfis otimizados e mais avaliações locais.`,
        dossier?.inteligenciaPresencaDigital?.projecaoVendas?.cenarioAtualPerdido ||
          `Estimativa de demanda não capturada: centenas de buscas mensais direcionadas a empresas vizinhas.`,
      ],
      destaque: `Score de Oportunidade Atual: ${empresa.score}/100 — Alto potencial de ganho imediato ao estruturar a presença.`,
      tags: ["Diagnóstico", "Dores", "Google Maps"],
    },

    // SLIDE 4: O QUE A LOCOMOTIVA VAI ATENDER (AGÊNCIA)
    {
      id: "slide_responsabilidades_agencia",
      tipo: "responsabilidades_agencia",
      titulo: "O Nosso Papel: O que a Locomotiva Comunicação vai Entregar",
      subtitulo: "Tecnologia, Posicionamento e Estratégia de Captação Contínua",
      pontos: [
        "🌐 Site de Alta Conversão: Desenvolvimento completo com animações GSAP, design moderno (padrão 21st.dev), velocidade máxima e botão WhatsApp flutuante.",
        "🔍 Otimização de SEO Google & Maps: Cadastro e ranqueamento nas palavras-chave mais buscadas da cidade e região para colocar a empresa no topo.",
        "📱 Gestão Estratégica de Redes Sociais: Linha editorial, design visual profissional e postagens com foco em autoridade e desejo.",
        "🎯 Campanhas de Tráfego Pago Segmentado: Anúncios direcionados exatamente para o perfil socioeconômico comprador de " + cidade + ".",
        "💬 Scripts Comerciais & Roteiros de Abordagem: Modelos testados para WhatsApp, direct e propostas que aumentam a conversão do time de vendas.",
      ],
      destaque: "A Locomotiva cuida de 100% da inteligência digital, tecnologia e atração qualificada de novos contatos para o seu negócio.",
      tags: ["Locomotiva", "Escopo da Agência", "Tecnologia & Design"],
    },

    // SLIDE 5: O QUE O LEAD PRECISA ATENDER (CLIENTE)
    {
      id: "slide_responsabilidades_cliente",
      tipo: "responsabilidades_cliente",
      titulo: "O Papel da sua Empresa: O que o Negócio Precisa Atender",
      subtitulo: "Excelência Operacional, Atendimento Ágil e Conversão Interna",
      pontos: [
        "⚡ Atendimento Veloz no WhatsApp: Responder leads no canal comercial em menos de 5 minutos (leads atendidos rápido convertem até 7x mais).",
        "🤝 Alinhamento da Equipe Comercial: Aplicar os roteiros e scripts estruturados para conduzir o cliente ao fechamento com segurança.",
        "📋 Dados e Preços Atualizados: Manter tabela de serviços, cardápios ou catálogos comerciais claros para resposta rápida.",
        "⭐ Coleta Ativa de Avaliações: Enviar o link do Google Maps para cada cliente satisfeito solicitando uma nota 5 estrelas.",
        "📸 Insumos Visuais Reais: Enviar fotos e vídeos do dia a dia, equipe e produtos para abastecer a comunicação autêntica da marca.",
      ],
      destaque: "A agência gera a oportunidade e atrai o cliente pronto para comprar; a equipe interna garante o encanto no atendimento e fecha a venda.",
      tags: ["Cliente", "Atendimento", "Operação Interna"],
    },

    // SLIDE 6: PLANO DE AÇÃO & CRONOGRAMA
    {
      id: "slide_plano_acao",
      tipo: "plano_acao",
      titulo: "Plano de Implementação & Cronograma de Tração",
      subtitulo: "Etapas Claras da Estruturação até a Geração Recorrente de Clientes",
      pontos: [
        "Semana 1 (Setup & Imersão): Alinhamento de briefing, coleta de acessos, otimização do Google Meu Negócio e planejamento editorial.",
        "Semana 2 (Lançamento da Tecnologia): Publicação do novo site de alta conversão, configuração de métricas e identidade visual das redes.",
        "Semana 3 (Ativação dos Canais): Início do fluxo de postagens, testes de anúncios segmentados e ativação dos scripts de vendas.",
        "Semana 4 em diante (Otimização Contínua): Acompanhamento semanal de leads recebidos, refino de campanhas e expansão de faturamento.",
      ],
      destaque: dossier?.inteligenciaPresencaDigital?.projecaoVendas?.estimativaImpactoFaturamento ||
        "Previsão de retorno direto através do aumento na taxa de conversão e captação de clientes de maior ticket médio.",
      tags: ["Cronograma", "Próximos Passos", "ROI"],
    },

    // SLIDE 7: FIM / ENCERRAMENTO & CONTATOS OFICIAIS
    {
      id: "slide_fim",
      tipo: "fim",
      titulo: "Locomotiva Comunicação",
      subtitulo: "Tecnologia, Posicionamento e Estratégia de Captação Contínua",
      pontos: [
        "Telefone / WhatsApp: (54) 9703-9116",
        "E-mail: fabi@locomotiva.live",
        "Website: www.locomotiva.live",
        "Instagram: @locomotivacom",
        "Facebook: /locomotivacom",
      ],
      destaque: "Transforme a presença digital da sua marca em clientes recorrentes e escala de faturamento.",
      autor: "Locomotiva Comunicação",
      tags: ["Encerramento", "Contatos", "Locomotiva"],
    },
  ];

  return {
    titulo: `Apresentação Estratégica — ${empresa.nome}`,
    subtitulo: `Plano de Presença Digital e Aceleração de Vendas`,
    empresaNome: empresa.nome,
    cidade,
    agencia: "Locomotiva Comunicação",
    slides,
    atualizadoEm: new Date().toISOString(),
  };
}

/**
 * Server Function para sugerir ou refinar um slide via IA sob demanda
 */
export const sugerirSlideIA_ServerFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      empresaNome: string;
      segmento: string;
      cidade: string;
      instrucao: string;
      tipo?: SlideItem["tipo"];
    }) => data,
  )
  .handler(async ({ data }): Promise<{ slide: SlideItem }> => {
    try {
      const { chatJSON } = await import("./ai-gateway.server");
      const sys =
        "Você é um Diretor de Apresentações Comerciais da LOCOMOTIVA COMUNICAÇÃO. Crie um slide persuasivo, direto e impactante para apresentar a um empresário lead.";
      const user = `Empresa: ${data.empresaNome} (${data.segmento} em ${data.cidade})
Instrução do usuário para o novo slide: "${data.instrucao}"
Tipo sugerido: ${data.tipo || "personalizado"}

Retorne EXATAMENTE este formato JSON:
{
  "titulo": "Título curto e impactante do slide (máx 60 caracteres)",
  "subtitulo": "Subtítulo explicativo contextual (máx 90 caracteres)",
  "pontos": ["Item 1 detalhado e direto", "Item 2 detalhado", "Item 3 detalhado", "Item 4 opcional"],
  "destaque": "Uma frase marcante ou estatística em negrito resumindo a mensagem do slide",
  "tags": ["Tag1", "Tag2"]
}`;

      const res = await chatJSON<{
        titulo: string;
        subtitulo?: string;
        pontos: string[];
        destaque?: string;
        tags?: string[];
      }>([
        { role: "system", content: sys },
        { role: "user", content: user },
      ]);

      if (res && res.titulo && res.pontos?.length) {
        return {
          slide: {
            id: `slide_custom_${Date.now()}`,
            tipo: data.tipo || "personalizado",
            titulo: res.titulo,
            subtitulo: res.subtitulo,
            pontos: res.pontos,
            destaque: res.destaque,
            tags: res.tags || ["Customizado"],
          },
        };
      }
    } catch (err: any) {
      console.warn("Falha na geração de slide via IA:", err.message);
    }

    // Fallback determinístico
    return {
      slide: {
        id: `slide_custom_${Date.now()}`,
        tipo: data.tipo || "personalizado",
        titulo: data.instrucao.slice(0, 50) || "Diferencial Competitivo",
        subtitulo: `Estratégia sob medida para ${data.empresaNome} em ${data.cidade}`,
        pontos: [
          `Foco em resultados mensuráveis no segmento de ${data.segmento}.`,
          "Alinhamento estratégico contínuo com a Locomotiva Comunicação.",
          "Otimização da jornada do cliente desde o primeiro clique até o fechamento.",
        ],
        destaque: "Transformando presença digital em vendas previsíveis.",
        tags: ["Estratégia", data.cidade],
      },
    };
  });
