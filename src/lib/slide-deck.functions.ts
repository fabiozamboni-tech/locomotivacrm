import { createServerFn } from "@tanstack/react-start";
import type { Empresa, SlideItem, ApresentacaoSlidesData } from "./mock-data";
import type { Dossier360Result } from "./dossier-360.functions";
import type { Relatorio, SecaoRelatorio } from "./relatorio.functions";

/**
 * Gera o slide estratégico de Próximos Passos & Solicitação de Orçamento
 * Posicionado imediatamente antes do slide final de contatos da apresentação.
 * Objetivo: Fazer o cliente/lead dar o próximo passo e solicitar o orçamento de desenvolvimento das soluções.
 */
export function gerarSlideCtaOrcamento(
  empresa: Empresa,
  sugestoesMapeadas?: string[],
): SlideItem {
  const nome = empresa.nome || "sua empresa";
  const cidade = empresa.cidade || "sua cidade";

  const p1 =
    sugestoesMapeadas && sugestoesMapeadas.length > 0
      ? `Priorização das Oportunidades: Estruturamos a execução das melhorias de maior impacto comercial (${sugestoesMapeadas.slice(0, 3).join(", ")}) para estancar a perda de clientes na região.`
      : `Priorização das Oportunidades: Começamos pelas frentes que geram retorno mais rápido para a ${nome} (novo site de alta conversão, autoridade no Google Maps e reestruturação do atendimento).`;

  return {
    id: "slide_cta_orcamento",
    tipo: "proximos_passos",
    titulo: "Próximos Passos: Como Tirar as Sugestões do Papel",
    subtitulo: `Plano de Execução e Orçamento de Desenvolvimento para ${nome}`,
    pontos: [
      p1,
      "Execução Completa sem Pesar na sua Rotina: Toda a criação, programação, design e campanhas ficam 100% sob a responsabilidade da Locomotiva, permitindo que sua equipe foque apenas em atender os clientes e fechar vendas.",
      `Proposta Comercial Clara e Sob Medida: Elaboramos um orçamento transparente, com opções de investimento divididas em etapas e prazos de entrega garantidos por contrato para a ${nome}.`,
      "Decisão Segura e Sem Compromisso: Solicite hoje mesmo a proposta comercial detalhada para recebermos os requisitos da sua empresa e reservarmos o início dos trabalhos ainda neste mês.",
    ],
    destaque: "PRÓXIMO PASSO: Solicite a proposta comercial detalhada e receba as condições sob medida para colocar essas melhorias em prática.",
    autor: "Locomotiva Comunicação",
    tags: ["Próximos Passos", "Orçamento", "Proposta Comercial", cidade],
  };
}

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
        "Site de Alta Conversão: Desenvolvimento completo com animações GSAP, design moderno (padrão 21st.dev), velocidade máxima e botão WhatsApp flutuante.",
        "Otimização de SEO Google & Maps: Cadastro e ranqueamento nas palavras-chave mais buscadas da cidade e região para colocar a empresa no topo.",
        "Gestão Estratégica de Redes Sociais: Linha editorial, design visual profissional e postagens com foco em autoridade e desejo.",
        "Campanhas de Tráfego Pago Segmentado: Anúncios direcionados exatamente para o perfil socioeconômico comprador de " + cidade + ".",
        "Scripts Comerciais & Roteiros de Abordagem: Modelos testados para WhatsApp, direct e propostas que aumentam a conversão do time de vendas.",
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
        "Atendimento Veloz no WhatsApp: Responder leads no canal comercial em menos de 5 minutos (leads atendidos rápido convertem até 7x mais).",
        "Alinhamento da Equipe Comercial: Aplicar os roteiros e scripts estruturados para conduzir o cliente ao fechamento com segurança.",
        "Dados e Preços Atualizados: Manter tabela de serviços, cardápios ou catálogos comerciais claros para resposta rápida.",
        "Coleta Ativa de Avaliações: Enviar o link do Google Maps para cada cliente satisfeito solicitando uma nota 5 estrelas.",
        "Insumos Visuais Reais: Enviar fotos e vídeos do dia a dia, equipe e produtos para abastecer a comunicação autêntica da marca.",
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

    // SLIDE 7: PRÓXIMOS PASSOS & SOLICITAÇÃO DE ORÇAMENTO (ANTES DO ÚLTIMO SLIDE)
    gerarSlideCtaOrcamento(empresa),

    // SLIDE 8: FIM / ENCERRAMENTO & CONTATOS OFICIAIS
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

/**
 * Identificadores dos 4 pilares de diagnóstico solicitados: site, comunicação, redes sociais e branding
 */
export type DiagnosticoPilarKey = "site" | "comunicacao" | "redes" | "branding";

export interface DiagnosticoPilarMeta {
  key: DiagnosticoPilarKey;
  nome: string;
  badge: string;
  icone: "Globe" | "MessageCircle" | "Instagram" | "Palette";
  descricaoCurta: string;
}

export const DIAGNOSTICO_PILARES_INFO: Record<DiagnosticoPilarKey, DiagnosticoPilarMeta> = {
  site: {
    key: "site",
    nome: "Site Oficial & Google",
    badge: "Web & Google Maps",
    icone: "Globe",
    descricaoCurta: "Indexação, conversão mobile, velocidade e captação orgânica.",
  },
  comunicacao: {
    key: "comunicacao",
    nome: "Comunicação & Atendimento",
    badge: "WhatsApp Comercial",
    icone: "MessageCircle",
    descricaoCurta: "Velocidade de retorno, scripts de abordagem e quebra de objeções.",
  },
  redes: {
    key: "redes",
    nome: "Redes Sociais & Conteúdo",
    badge: "Instagram & Autoridade",
    icone: "Instagram",
    descricaoCurta: "Linha editorial, posicionamento de autoridade e atração regional.",
  },
  branding: {
    key: "branding",
    nome: "Branding & Valor Percebido",
    badge: "Identidade & Marca",
    icone: "Palette",
    descricaoCurta: "Diferenciação visual de mercado e sustentação de ticket mais alto.",
  },
};

/**
 * Identifica o pilar correspondente a uma seção do relatório
 */
export function mapearPilarSecao(secao: SecaoRelatorio): DiagnosticoPilarKey | null {
  const p = (secao.pilar || "").toLowerCase();
  const t = (secao.titulo || "").toLowerCase();
  if (p === "site" || t.includes("site") || t.includes("web") || t.includes("google")) return "site";
  if (p === "comunicacao" || t.includes("comunicação") || t.includes("comunicacao") || t.includes("atendimento") || t.includes("whatsapp")) return "comunicacao";
  if (p === "redes" || t.includes("rede") || t.includes("instagram") || t.includes("social")) return "redes";
  if (p === "branding" || t.includes("brand") || t.includes("marca") || t.includes("identidade") || t.includes("visual")) return "branding";
  return null;
}

/**
 * Cria um SlideItem formatado e resumido a partir do diagnóstico de um pilar específico
 */
export function gerarSlideDiagnosticoPilar(
  pilar: DiagnosticoPilarKey,
  empresa: Empresa,
  secao?: SecaoRelatorio | null,
  relatorio?: Relatorio | null,
): SlideItem {
  const cidade = empresa.cidade || "Região";
  const nomeEmpresa = empresa.nome || "Cliente";

  switch (pilar) {
    case "site": {
      const pontos: string[] = [];
      if (secao && secao.dores?.length) {
        pontos.push(
          empresa.site
            ? `Site Atual (${empresa.statusSite}): ${secao.dores[0]}`
            : `Ausência de Site Próprio: ${secao.dores[0]}`,
        );
        if (secao.dores[1]) pontos.push(`Gargalo Comercial: ${secao.dores[1]}`);
        if (secao.solucao?.[0]) pontos.push(`Aceleração Proposta: ${secao.solucao[0]}`);
        if (secao.impactoVendas) pontos.push(`Impacto em Vendas: ${secao.impactoVendas}`);
      } else {
        pontos.push(
          empresa.site
            ? `Site Atual: Avaliado como ${empresa.statusSite} — necessita de modernização para padrão mobile responsivo e carregamento instantâneo.`
            : `Site Institucional: A empresa NÃO possui site próprio indexado, perdendo até 70% das buscas orgânicas de clientes prontos para comprar.`,
        );
        pontos.push(
          `Comportamento no Google: Consumidores em ${cidade} pesquisam ativamente por serviços no Google antes de entrar em contato.`,
        );
        pontos.push(
          `Solução Locomotiva: Novo site de alta conversão, responsivo, com botão WhatsApp flutuante e carregamento ultra-rápido.`,
        );
        pontos.push(
          `Impacto Esperado: Captação orgânica contínua de novos contatos qualificados e elevação do faturamento comercial.`,
        );
      }
      return {
        id: "slide_diagnostico_site",
        tipo: "diagnostico",
        titulo: secao?.titulo || "Diagnóstico: Site Oficial & Presença no Google",
        subtitulo: `Análise de Indexação, Conversão Mobile e Velocidade para ${nomeEmpresa}`,
        pontos: pontos.slice(0, 4),
        destaque:
          secao?.impactoVendas ||
          "Um site moderno transmite autoridade imediata e converte visitantes em clientes reais no WhatsApp.",
        tags: ["Diagnóstico", "Site", cidade],
      };
    }

    case "comunicacao": {
      const pontos: string[] = [];
      if (secao && secao.dores?.length) {
        pontos.push(`Ponto de Atenção: ${secao.dores[0]}`);
        if (secao.dores[1]) pontos.push(`Risco de Vendas: ${secao.dores[1]}`);
        if (secao.solucao?.[0]) pontos.push(`Solução Proposta: ${secao.solucao[0]}`);
        if (secao.impactoVendas) pontos.push(`Impacto Comercial: ${secao.impactoVendas}`);
      } else {
        pontos.push(
          "Atendimento Comercial: Necessidade de padronização nos roteiros de primeiro contato para aumentar a conversão.",
        );
        pontos.push(
          "Velocidade de Resposta: Leads atendidos em menos de 5 minutos convertem até 7 vezes mais no WhatsApp.",
        );
        pontos.push(
          "Solução Locomotiva: Roteiros humanizados de abordagem, scripts para quebra de objeções e matriz de alinhamento.",
        );
        pontos.push(
          "Impacto Esperado: Redução drástica da perda de orçamentos e aumento na retenção de clientes recorrentes.",
        );
      }
      return {
        id: "slide_diagnostico_comunicacao",
        tipo: "diagnostico",
        titulo: secao?.titulo || "Diagnóstico: Comunicação & Atendimento WhatsApp",
        subtitulo: `Análise de Tempo de Resposta e Estrutura Comercial para ${nomeEmpresa}`,
        pontos: pontos.slice(0, 4),
        destaque:
          secao?.impactoVendas ||
          "Velocidade e cordialidade no primeiro contato são os fatores que mais aumentam o fechamento de propostas.",
        tags: ["Diagnóstico", "Comunicação", "WhatsApp"],
      };
    }

    case "redes": {
      const pontos: string[] = [];
      if (secao && secao.dores?.length) {
        pontos.push(`Cenário Atual: ${secao.dores[0]}`);
        if (secao.dores[1]) pontos.push(`Oportunidade: ${secao.dores[1]}`);
        if (secao.solucao?.[0]) pontos.push(`Solução Proposta: ${secao.solucao[0]}`);
        if (secao.impactoVendas) pontos.push(`Impacto Comercial: ${secao.impactoVendas}`);
      } else {
        pontos.push(
          empresa.instagram
            ? `Instagram (@${empresa.instagram}): Status avaliado como "${empresa.statusInstagram}" — potencial inexplorado de atração.`
            : "Instagram: Ausência de canal visual ativo para demonstração diária de produtos, autoridade e bastidores.",
        );
        pontos.push(
          "Validação do Consumidor: O público moderno consulta as redes para conferir trabalhos recentes e avaliações antes de decidir.",
        );
        pontos.push(
          "Solução Locomotiva: Linha editorial com foco em autoridade, fotos reais de alta qualidade e anúncios locais segmentados.",
        );
        pontos.push(
          "Impacto Esperado: Marca mantida no topo da mente do consumidor na hora da decisão de compra.",
        );
      }
      return {
        id: "slide_diagnostico_redes",
        tipo: "diagnostico",
        titulo: secao?.titulo || "Diagnóstico: Posicionamento & Redes Sociais",
        subtitulo: `Análise de Linha Editorial, Autoridade e Prova Social para ${nomeEmpresa}`,
        pontos: pontos.slice(0, 4),
        destaque:
          secao?.impactoVendas ||
          "Redes sociais ativas constroem reputação sólida e mantêm a empresa como primeira opção de compra.",
        tags: ["Diagnóstico", "Redes Sociais", "Instagram"],
      };
    }

    case "branding": {
      const pontos: string[] = [];
      if (secao && secao.dores?.length) {
        pontos.push(`Diagnóstico de Marca: ${secao.dores[0]}`);
        if (secao.dores[1]) pontos.push(`Risco de Comoditização: ${secao.dores[1]}`);
        if (secao.solucao?.[0]) pontos.push(`Solução Proposta: ${secao.solucao[0]}`);
        if (secao.impactoVendas) pontos.push(`Impacto Comercial: ${secao.impactoVendas}`);
      } else {
        pontos.push(
          "Identidade Visual: A imagem da empresa é o primeiro fator que define se o serviço parece de alto padrão ou comum.",
        );
        pontos.push(
          "Guerra de Preços: Negócios sem marca diferenciada são forçados a disputar por preço menor e margem reduzida.",
        );
        pontos.push(
          "Solução Locomotiva: Padronização visual corporativa, paleta cromática de autoridade e apresentação de alto impacto.",
        );
        pontos.push(
          "Impacto Esperado: Elevação do valor percebido, permitindo cobrar preços superiores com menor atrito comercial.",
        );
      }
      return {
        id: "slide_diagnostico_branding",
        tipo: "diagnostico",
        titulo: secao?.titulo || "Diagnóstico: Branding & Percepção de Valor",
        subtitulo: `Análise de Diferenciação de Marca e Margem Comercial para ${nomeEmpresa}`,
        pontos: pontos.slice(0, 4),
        destaque:
          secao?.impactoVendas ||
          "Quem investe em branding não disputa clientes por menor preço; é escolhido pela autoridade e excelência.",
        tags: ["Diagnóstico", "Branding", "Autoridade"],
      };
    }
  }
}

/**
 * Insere ou atualiza um slide no deck da apresentação, posicionando-o de forma coerente antes do encerramento
 */
export function adicionarSlideAoDeck(
  deck: ApresentacaoSlidesData,
  novoSlide: SlideItem,
): { deckAtualizado: ApresentacaoSlidesData; substituido: boolean; novoIndice: number } {
  const slides = [...deck.slides];
  const indiceExistente = slides.findIndex((s) => s.id === novoSlide.id);

  if (indiceExistente >= 0) {
    slides[indiceExistente] = novoSlide;
    return {
      deckAtualizado: {
        ...deck,
        slides,
        atualizadoEm: new Date().toISOString(),
      },
      substituido: true,
      novoIndice: indiceExistente,
    };
  }

  // Localiza posições chave (slide "fim" e slide "cta_orcamento")
  const indiceFim = slides.findIndex((s) => s.tipo === "fim");
  const indiceCta = slides.findIndex(
    (s) => s.id === "slide_cta_orcamento" || s.tipo === "proximos_passos" || s.tipo === "cta_orcamento",
  );

  let novoIndice = slides.length;

  if (novoSlide.id === "slide_cta_orcamento" || novoSlide.tipo === "proximos_passos" || novoSlide.tipo === "cta_orcamento") {
    // Slide de CTA sempre fica antes do slide "fim"
    if (indiceFim >= 0) {
      slides.splice(indiceFim, 0, novoSlide);
      novoIndice = indiceFim;
    } else {
      slides.push(novoSlide);
      novoIndice = slides.length - 1;
    }
  } else if (indiceCta >= 0) {
    // Qualquer outro slide (ex: diagnóstico) vai antes do slide de CTA
    slides.splice(indiceCta, 0, novoSlide);
    novoIndice = indiceCta;
  } else if (indiceFim >= 0) {
    // Se não tem slide de CTA, vai antes do fim
    slides.splice(indiceFim, 0, novoSlide);
    novoIndice = indiceFim;
  } else {
    slides.push(novoSlide);
    novoIndice = slides.length - 1;
  }

  return {
    deckAtualizado: {
      ...deck,
      slides,
      atualizadoEm: new Date().toISOString(),
    },
    substituido: false,
    novoIndice,
  };
}

/**
 * Server Function para gerar ou refinar o slide de CTA / Solicitação de Orçamento via IA
 * Utiliza o roteador de IAs disponíveis para criar argumentos de fechamento irresistíveis.
 */
export const gerarSlideCtaOrcamentoIA_ServerFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      empresaNome: string;
      segmento: string;
      cidade: string;
      sugestoes?: string[];
      tom?: string;
    }) => data,
  )
  .handler(async ({ data }): Promise<{ slide: SlideItem }> => {
    try {
      const { chatJSON } = await import("./ai-gateway.server");
      const sys = `Você é o Diretor Comercial Sênior da LOCOMOTIVA COMUNICAÇÃO (agência de inteligência digital e design).
Seu objetivo é escrever o slide comercial decisivo da apresentação, posicionado antes do slide final de contatos.
O propósito deste slide é fazer o empresário/lead querer colocar em prática as sugestões propostas no diagnóstico e solicitar um orçamento detalhado de desenvolvimento com a Locomotiva.

DIRETRIZES FUNDAMENTAIS:
1. NUNCA USE EMOJIS no texto (nenhum emoji como 💡, 🚀, 🌐, etc.), pois o material segue padrão executivo corporativo.
2. Use tom persuasivo, consultivo, encorajador e focado em retorno financeiro e segurança.
3. Mostre que manter o status quo custa caro (perda de clientes para concorrentes) e que avançar com a Locomotiva é simples e sem riscos.
4. O quarto ponto DEVE convidar diretamente a solicitar a proposta/orçamento comercial de desenvolvimento.
5. O destaque inferior deve ser uma chamada direta à ação, começando com "PRÓXIMO PASSO:".`;

      const sugestoesTxt = data.sugestoes?.length
        ? `Melhorias e sugestões mapeadas no diagnóstico: ${data.sugestoes.join(", ")}.`
        : `Melhorias sugeridas: Modernização de site com foco em conversão mobile, autoridade no Google Maps e busca local, presença ativa e profissional no Instagram, automação de WhatsApp para atendimento rápido.`;

      const user = `Empresa: ${data.empresaNome} (${data.segmento} em ${data.cidade})
${sugestoesTxt}

Retorne EXATAMENTE este formato JSON:
{
  "titulo": "Próximos Passos: Da Ideia à Execução das Soluções",
  "subtitulo": "Como tirar as sugestões do papel e solicitar a proposta comercial de desenvolvimento",
  "pontos": [
    "Item 1: Priorização prática das melhorias de maior impacto para ${data.empresaNome}",
    "Item 2: Execução técnica 100% realizada pela equipe da Locomotiva",
    "Item 3: Orçamento transparente sob medida com cronograma claro",
    "Item 4: Convite direto para solicitar o orçamento comercial detalhado"
  ],
  "destaque": "PRÓXIMO PASSO: Solicite a proposta comercial detalhada e descubra as condições para colocar essas melhorias em prática.",
  "tags": ["Próximos Passos", "Orçamento", "Proposta Comercial", "${data.cidade}"]
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
        // Remove qualquer emoji que o modelo possa ter gerado
        const stripEmoji = (s?: string) =>
          (s || "")
            .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}\u{2B50}\u{200D}\u{FE0F}]/gu, "")
            .trim();

        return {
          slide: {
            id: "slide_cta_orcamento",
            tipo: "proximos_passos",
            titulo: stripEmoji(res.titulo),
            subtitulo: stripEmoji(res.subtitulo),
            pontos: res.pontos.map((p) => stripEmoji(p)).filter(Boolean),
            destaque: stripEmoji(res.destaque),
            tags: res.tags || ["Próximos Passos", "Orçamento", data.cidade],
          },
        };
      }
    } catch (err: any) {
      console.warn("Falha ao gerar slide de CTA / Orçamento via IA:", err?.message);
    }

    // Fallback determinístico caso as APIs estejam indisponíveis
    return {
      slide: gerarSlideCtaOrcamento(
        {
          id: "fallback",
          nome: data.empresaNome,
          segmento: data.segmento,
          cidade: data.cidade,
          score: 60,
          statusSite: "ok",
          statusInstagram: "ativo",
        } as Empresa,
        data.sugestoes,
      ),
    };
  });

