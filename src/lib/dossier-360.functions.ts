import { createServerFn } from "@tanstack/react-start";
import type { EmpresaCtx } from "./ai.functions";

export interface SistemaGestaoItem {
  id: string;
  nome: string;
  categoria: "crm" | "erp_pedidos" | "agendamento" | "portal_cliente" | "automacao_whats" | "dashboard_bi" | "financeiro";
  icone: string;
  beneficioGestao: string;
  impactoLucro: string;
  aplicabilidade: "essencial" | "alta" | "recomendada";
  exemploPratico: string;
}

export interface TratamentoSintomaItem {
  sintomaIdentificado: string;
  solucao360OuSistema: string;
  comoTratar: string;
  comoGeraMaisLucro: string;
}

export interface Dossier360Result {
  empresaNome: string;
  segmento: string;
  cidade: string;
  pesquisaWebRealizada: {
    termoBuscado: string;
    fontesEncontradas: string[];
    resumoMercadoLocal: string;
  };
  dimensaoPsicologica: {
    doresAtuais: string[];
    medosERiscos: string[];
    desejosEAmbicoes: string[];
    frustracoesPassadas: string[];
  };
  dimensaoOperacional: {
    gargalosProcesso: string[];
    impactoFinanceiroCustoInacao: string;
    nivelMaturidade: "iniciante" | "intermediaria" | "madura_consolidada";
    justificativaMaturidade: string;
    sistemasGestaoRecomendados: SistemaGestaoItem[];
  };
  dimensaoEstrategica: {
    metasCrescimento: string[];
    culturaOrganizacional: string;
    tomRecomendadoAbordagem: string;
  };
  prescricaoTratamentoLucro: {
    itensTratamento: TratamentoSintomaItem[];
    resumoFinanceiroLucratividade: string;
  };
  abordagensPorCanal: {
    whatsapp: {
      titulo: string;
      texto: string;
      ganchoAbertura: string;
      focoPrincipal: string;
    };
    email: {
      titulo: string;
      assunto: string;
      texto: string;
      focoPrincipal: string;
    };
    instagram: {
      titulo: string;
      texto: string;
      ganchoAbertura: string;
    };
    ligacaoReuniao: {
      titulo: string;
      falaAbertura: string;
      perguntaChaveDiagnostico: string;
      roteiroPassos: string[];
    };
    propostaValor360: {
      titulo: string;
      resumoExecutivo: string;
      textoCompleto: string;
    };
  };
}

/**
 * Realiza pesquisa em tempo real no Google via SerpApi sobre a empresa e seu setor.
 */
async function pesquisarContextoWeb(empresa: EmpresaCtx): Promise<{ snippets: string[]; fontes: string[]; resumoMercado: string }> {
  const serpApiKey =
    process.env.SERPAPI_API_KEY?.trim() ||
    "ec62da1cce88a0223fee434841dbaceef4b27c63b8825d53de8d25090ccdbe02";

  const snippets: string[] = [];
  const fontes: string[] = [];

  if (serpApiKey && serpApiKey.length > 20 && !serpApiKey.includes(":")) {
    try {
      const q = `"${empresa.nome}" "${empresa.cidade}" ${empresa.segmento}`;
      const url = new URL("https://serpapi.com/search.json");
      url.searchParams.set("q", q);
      url.searchParams.set("engine", "google");
      url.searchParams.set("api_key", serpApiKey);
      url.searchParams.set("hl", "pt-br");
      url.searchParams.set("gl", "br");

      const res = await fetch(url.toString(), {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        },
      });

      if (res.ok) {
        const json = (await res.json()) as {
          organic_results?: Array<{ title?: string; link?: string; snippet?: string }>;
          knowledge_graph?: { title?: string; description?: string; type?: string };
        };

        if (json.knowledge_graph?.description) {
          snippets.push(`Knowledge Graph: ${json.knowledge_graph.description}`);
        }

        if (json.organic_results && json.organic_results.length > 0) {
          json.organic_results.slice(0, 5).forEach((item) => {
            if (item.snippet) snippets.push(`${item.title}: ${item.snippet}`);
            if (item.link) fontes.push(item.link);
          });
        }
      }
    } catch (err) {
      console.warn("Falha na pesquisa web em tempo real (SerpApi):", err);
    }
  }

  return {
    snippets,
    fontes,
    resumoMercado: `Empresa do segmento ${empresa.segmento} localizada em ${empresa.cidade}/RS com mercado consumidor local e regional em expansão.`,
  };
}

/**
 * Server Function: Executa a pesquisa web em tempo real e gera o Dossiê Estratégico 360 + Abordagens focadas em Lucro.
 */
export const gerarDossierEAbordagens360_IA = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      empresa: EmpresaCtx;
      canalPreferencial?: "whatsapp" | "email" | "instagram" | "ligacao" | "curta";
      nomeAgencia?: string;
      focoCustomizado?: string;
    }) => data,
  )
  .handler(async ({ data }): Promise<Dossier360Result> => {
    const { chatJSON } = await import("./ai-gateway.server");
    const agencia = data.nomeAgencia?.trim() || "nossa agência";
    const canal = data.canalPreferencial || "whatsapp";

    // 1. Pesquisa web em tempo real
    const webInfo = await pesquisarContextoWeb(data.empresa);

    const sys = `Você é o Diretor Comercial & Estrategista Chefe de uma agência de alto nível especializada em COMUNICAÇÃO 360 & SISTEMAS DE GESTÃO na Serra Gaúcha (RS).
O escopo completo da agência contempla:
- Identidade Visual & Branding Premium (Logotipo, manuais, posicionamento de autoridade);
- Material Impresso & Papelaria Corporativa de Alto Padrão (Catálogos, pastas, cartões, folders);
- Design de Embalagens, Rótulos e Pontos de Venda (Valorização do produto físico para elevar ticket médio);
- Presença Digital, Redes Sociais & Criação de Conteúdo Estratégico (Instagram, LinkedIn, Facebook);
- Produção de Vídeos Institucionais, Comerciais e Reels cinematográficos;
- Sites de Alta Conversão, Lojas Virtuais e Landing Pages responsivas com SEO;
- Sistemas Customizados & Automação de Gestão (CRM de Vendas, Catálogo Digital de Pedidos B2B, Sistema de Agendamentos 24/7, Portais do Cliente e Automação de WhatsApp).

OBJETIVO DA SUA ANÁLISE B2B:
Você NUNCA escreve abordagens genéricas. Você mapeia com profundidade o lado humano (psicológico) e a lógica de negócios da empresa-alvo, apontando os problemas reais, como tratá-los com o ecossistema 360 e como isso gera MAIS LUCROS, REDUÇÃO DE CUSTOS e RETORNO FINANCEIRO (ROI) para o cliente.`;

    const user = `Analise detalhadamente a empresa abaixo com os dados cadastrais e resultados de pesquisa na internet:

DADOS DA EMPRESA:
- Nome: ${data.empresa.nome}
- Segmento: ${data.empresa.segmento}
- Cidade: ${data.empresa.cidade}${data.empresa.bairro ? ` · ${data.empresa.bairro}` : ""}/RS
- Site: ${data.empresa.site || "Não possui / desatualizado"} (Status: ${data.empresa.statusSite})
- Instagram: ${data.empresa.instagram || "Não localizado"} (Status: ${data.empresa.statusInstagram})
- Telefone/WhatsApp: ${data.empresa.whatsapp || data.empresa.telefone || "Não informado"}
- Score Digital: ${data.empresa.score}/100
- Observações internas: ${data.empresa.observacoes || "Nenhuma"}

DADOS COLETADOS DA PESQUISA WEB EM TEMPO REAL:
${webInfo.snippets.length > 0 ? webInfo.snippets.join("\n") : "Sem registros orgânicos adicionais encontrados."}

Assine as abordagens como "${agencia}". Se citar o decisor, use "[Nome do contato]".

Gere um dossiê JSON estruturado e completo com este formato EXATO:
{
  "empresaNome": "${data.empresa.nome}",
  "segmento": "${data.empresa.segmento}",
  "cidade": "${data.empresa.cidade}",
  "pesquisaWebRealizada": {
    "termoBuscado": "${data.empresa.nome} ${data.empresa.cidade}",
    "fontesEncontradas": ${JSON.stringify(webInfo.fontes.slice(0, 4))},
    "resumoMercadoLocal": "2 frases sobre a realidade do mercado de ${data.empresa.segmento} na região de ${data.empresa.cidade}"
  },
  "dimensaoPsicologica": {
    "doresAtuais": [
      "Dor diária 1 específica desta empresa/segmento",
      "Dor diária 2 (ex: perda de orçamentos ou comunicação fragmentada)",
      "Dor diária 3 (ex: dependência de indicação ou processos manuais)"
    ],
    "medosERiscos": [
      "Risco 1 de não mudar (ex: concorrentes locais ocupando a mente do consumidor)",
      "Risco 2 (ex: passar imagem antiquada ou amadora frente a clientes exigentes)",
      "Risco 3 (ex: perder relevância e ser forçado a competir por preço baixo)"
    ],
    "desejosEAmbicoes": [
      "Ambição 1 (ex: ser a marca referência e primeira lembrada no setor)",
      "Ambição 2 (ex: atrair clientes com ticket médio 30% a 50% superior)",
      "Ambição 3 (ex: expandir vendas para cidades vizinhas ou canais digitais)"
    ],
    "frustracoesPassadas": [
      "Frustração 1 (ex: já contratou 'posts bonitinhos' de agências que não trouxeram vendas)",
      "Frustração 2 (ex: softwares complexos que a equipe não conseguiu usar)"
    ]
  },
  "dimensaoOperacional": {
    "gargalosProcesso": [
      "Gargalo 1 no fluxo de apresentação da marca e captação de clientes",
      "Gargalo 2 no atendimento e fechamento de propostas"
    ],
    "impactoFinanceiroCustoInacao": "Estimativa em texto de quanto a empresa perde mensalmente em clientes e vendas por adiar a modernização (ex: R$ 5.000 a R$ 20.000/mês)",
    "nivelMaturidade": "iniciante" | "intermediaria" | "madura_consolidada",
    "justificativaMaturidade": "1-2 frases justificando o nível e como a agência deve conduzir a implementação",
    "sistemasGestaoRecomendados": [
      {
        "id": "crm_vendas",
        "nome": "CRM Comercial & Gestão de Funil",
        "categoria": "crm",
        "icone": "BarChart3",
        "beneficioGestao": "Centraliza todos os contatos do WhatsApp e formulários em um pipeline visual organizado.",
        "impactoLucro": "Estanca o esquecimento de follow-ups e aumenta a taxa de fechamento de orçamentos em até 40%.",
        "aplicabilidade": "essencial",
        "exemploPratico": "Cada cliente que chama recebe resposta e acompanhamento estruturado sem sumir do radar."
      },
      {
        "id": "catalogo_pedidos_b2b",
        "nome": "Catálogo Digital & Gestão de Pedidos",
        "categoria": "erp_pedidos",
        "icone": "Package",
        "beneficioGestao": "Substitui envio manual de PDFs por um catálogo interativo online com carrinho e emissão direta.",
        "impactoLucro": "Reduz 80% do tempo gasto enviando tabelas de preço e agiliza a recompra de clientes recorrentes.",
        "aplicabilidade": "alta",
        "exemploPratico": "Representantes e clientes finais montam pedidos pelo celular 24 horas por dia."
      },
      {
        "id": "automacao_whats",
        "nome": "Automação de Atendimento & Triagem WhatsApp",
        "categoria": "automacao_whats",
        "icone": "MessageSquare",
        "beneficioGestao": "Triagem automática que qualifica o lead e entrega o cliente pronto para o comercial fechar.",
        "impactoLucro": "Elimina demora no atendimento que faz o cliente comprar do concorrente em minutos.",
        "aplicabilidade": "alta",
        "exemploPratico": "Respostas instantâneas mesmo fora do horário comercial com direcionamento inteligente."
      }
    ]
  },
  "dimensaoEstrategica": {
    "metasCrescimento": [
      "Meta 1 de escala e valorização de marca",
      "Meta 2 de eficiência operacional e aumento de margem líquida"
    ],
    "culturaOrganizacional": "Análise do perfil da liderança (ex: tradicional focada em qualidade de produto que valoriza relações sólidas e processos sem risco)",
    "tomRecomendadoAbordagem": "Consultivo, executivo e embasado em retorno financeiro, sem jargões técnicos excessivos."
  },
  "prescricaoTratamentoLucro": {
    "itensTratamento": [
      {
        "sintomaIdentificado": "Comunicação visual desatualizada e ausência de canal digital ágil",
        "solucao360OuSistema": "Identidade Visual 360 + Site de Alta Conversão com Botão Direto",
        "comoTratar": "Modernizar o branding mantendo a tradição e colocar no ar uma presença web com arquitetura de conversão.",
        "comoGeraMaisLucro": "Eleva a percepção de valor permitindo cobrar preços mais altos e converte visitantes em clientes sem desperdício de tráfego."
      },
      {
        "sintomaIdentificado": "Perda de tempo em atendimento manual e falta de controle de orçamentos",
        "solucao360OuSistema": "CRM de Vendas + Automação de WhatsApp",
        "comoTratar": "Implantar um fluxo simples de gestão onde nenhum lead é esquecido e as mensagens são respondidas em segundos.",
        "comoGeraMaisLucro": "Aumenta o índice de conversão de 15% para 35% nos orçamentos emitidos."
      },
      {
        "sintomaIdentificado": "Material impresso e embalagens sem destaque frente à concorrência",
        "solucao360OuSistema": "Design de Embalagens & Rótulos Premium + Material Impresso de Impacto",
        "comoTratar": "Desenvolver embalagens atraentes e catálogos sofisticados que valorizam a experiência física do produto.",
        "comoGeraMaisLucro": "Gera diferenciação no ponto de venda e atrai consumidores dispostos a pagar mais pela experiência."
      }
    ],
    "resumoFinanceiroLucratividade": "A combinação do ecossistema 360 com sistemas de gestão reduz custos de equipe e estanca perdas, transformando a comunicação de custo em motor de lucro direto."
  },
  "abordagensPorCanal": {
    "whatsapp": {
      "titulo": "Mensagem Estratégica para WhatsApp (Direta & Consultiva)",
      "ganchoAbertura": "Identifiquei uma oportunidade de captação de clientes em ${data.empresa.cidade}",
      "focoPrincipal": "Tratamento de gargalo imediato + aumento de lucratividade",
      "texto": "Texto completo e pronto da mensagem para WhatsApp, no máximo 7 linhas, humana, instigante e sem clichês."
    },
    "email": {
      "titulo": "E-mail Executivo para Decisores",
      "assunto": "Assunto instigante sobre faturamento e posicionamento da ${data.empresa.nome}",
      "focoPrincipal": "Diagnóstico do custo da inação + solução 360",
      "texto": "Texto completo e estruturado para e-mail corporativo, com quebras de parágrafo limpas e call-to-action de 15 minutos."
    },
    "instagram": {
      "titulo": "Direct de Instagram (Observacional & Autêntico)",
      "ganchoAbertura": "Elogio ao trabalho + observação estratégica de conversão",
      "texto": "Texto completo para direct, 4-6 linhas, sem parecer spam."
    },
    "ligacaoReuniao": {
      "titulo": "Roteiro de Ligação / Reunião de Fechamento",
      "falaAbertura": "Fala inicial para o telefone abrindo a conversa em 30 segundos",
      "perguntaChaveDiagnostico": "Pergunta cirúrgica que faz o cliente admitir a dor operacional",
      "roteiroPassos": [
        "1. Gancho contextualizado sobre ${data.empresa.cidade}",
        "2. Identificação do sintoma e custo da inação",
        "3. Apresentação da solução 360 integrada",
        "4. Fechamento para demonstração de 15 minutos"
      ]
    },
    "propostaValor360": {
      "titulo": "Proposta de Valor & Pitch Executivo 360",
      "resumoExecutivo": "Resumo em 3 frases de como a agência transforma a empresa em líder do setor",
      "textoCompleto": "Texto completo da proposta de valor integrando Branding, Impressos, Digital, Vídeos, Site e Sistemas de Gestão."
    }
  }
}`;

    try {
      return await chatJSON<Dossier360Result>([
        { role: "system", content: sys },
        { role: "user", content: user },
      ]);
    } catch (err) {
      console.warn("Falha na geração com IA do Dossiê 360, usando fallback analítico:", err);
      return gerarDossierFallback(data.empresa, agencia);
    }
  });

/**
 * Fallback analítico determinístico para o Dossiê 360.
 */
function gerarDossierFallback(empresa: EmpresaCtx, agencia: string): Dossier360Result {
  const nome = empresa.nome;
  const cidade = empresa.cidade;
  const seg = empresa.segmento;
  const contato = "[Nome do contato]";

  return {
    empresaNome: nome,
    segmento: seg,
    cidade,
    pesquisaWebRealizada: {
      termoBuscado: `${nome} ${cidade}`,
      fontesEncontradas: [
        `https://www.google.com/search?q=${encodeURIComponent(`${nome} ${cidade}`)}`,
      ],
      resumoMercadoLocal: `Setor de ${seg} em ${cidade}/RS com forte potencial de valorização de marca e digitalização operacional.`,
    },
    dimensaoPsicologica: {
      doresAtuais: [
        `Falta de padronização entre materiais impressos, embalagens e presença digital da ${nome}.`,
        `Perda de orçamentos e clientes que buscam por ${seg} e não encontram atendimento rápido.`,
        `Dependência de indicações ou processos manuais para captação de clientes.`,
      ],
      medosERiscos: [
        `Risco de perder fatia de mercado para novos concorrentes modernizados em ${cidade} e região.`,
        `Medo de investir em agências que só entregam postagens sem retorno financeiro real.`,
        `Risco de desvalorização do produto e necessidade de competir apenas por preço baixo.`,
      ],
      desejosEAmbicoes: [
        `Tornar a ${nome} a marca número 1 e referência indiscutível em ${seg}.`,
        `Atrair clientes qualificados e dispostos a pagar um ticket médio superior.`,
        `Expandir atuação para todo o estado e canais corporativos com segurança.`,
      ],
      frustracoesPassadas: [
        `Experiências anteriores com soluções amadoras que não geraram leads nem vendas.`,
        `Softwares complicados ou agências que não entenderam a rotina real do negócio.`,
      ],
    },
    dimensaoOperacional: {
      gargalosProcesso: [
        `Fluxo de atendimento que depende de resposta manual sem centralização de leads.`,
        `Apresentação comercial e catálogo que não transmitem todo o valor do produto.`,
      ],
      impactoFinanceiroCustoInacao: `Estimativa de R$ 8.000 a R$ 25.000 mensais em vendas não convertidas por falta de presença 360 integrada.`,
      nivelMaturidade: "intermediaria",
      justificativaMaturidade: `Empresa com produto consolidado e operação ativa, ideal para implantação rápida 'chave na mão' com suporte humanizado.`,
      sistemasGestaoRecomendados: [
        {
          id: "crm_vendas",
          nome: "CRM Comercial & Funil de Vendas",
          categoria: "crm",
          icone: "BarChart3",
          beneficioGestao: "Centraliza todas as oportunidades em um painel visual, organizando o follow-up da equipe.",
          impactoLucro: "Evita que orçamentos sejam esquecidos, aumentando o fechamento de propostas em até 40%.",
          aplicabilidade: "essencial",
          exemploPratico: "Acompanhamento passo a passo de cada cliente desde o primeiro contato até o pós-venda.",
        },
        {
          id: "catalogo_pedidos_b2b",
          nome: "Catálogo Digital & Gestão de Pedidos",
          categoria: "erp_pedidos",
          icone: "Package",
          beneficioGestao: "Catálogo interativo com emissão direta de pedidos pelo smartphone dos clientes e representantes.",
          impactoLucro: "Agiliza o processo de recompra e reduz 70% do tempo gasto enviando tabelas em PDF.",
          aplicabilidade: "alta",
          exemploPratico: "Clientes e parceiros comerciais montam pedidos online 24 horas por dia.",
        },
        {
          id: "automacao_whats",
          nome: "Automação de Atendimento & WhatsApp",
          categoria: "automacao_whats",
          icone: "MessageSquare",
          beneficioGestao: "Triagem automática de dúvidas frequentes e direcionamento qualificado para o comercial.",
          impactoLucro: "Reduz o tempo de espera do cliente de horas para segundos, estancando a perda de leads para concorrentes.",
          aplicabilidade: "alta",
          exemploPratico: "Atendimento imediato e qualificação de clientes fora do horário comercial.",
        },
      ],
    },
    dimensaoEstrategica: {
      metasCrescimento: [
        `Aumentar o faturamento global e a margem de lucro por produto vendido.`,
        `Fortalecer a autoridade institucional em todos os pontos de contato com o cliente.`,
      ],
      culturaOrganizacional: `Liderança focada em solidez e resultados práticos, valorizando soluções completas que não demandem tempo excessivo de gestão.`,
      tomRecomendadoAbordagem: `Consultivo, executivo e embasado em ROI, mostrando clareza de retorno.`,
    },
    prescricaoTratamentoLucro: {
      itensTratamento: [
        {
          sintomaIdentificado: `Comunicação fragmentada e sem canal digital de alta performance`,
          solucao360OuSistema: `Branding 360 + Site de Alta Conversão`,
          comoTratar: `Unificar a identidade visual desde materiais físicos até a presença online, com site focado em fechamento.`,
          comoGeraMaisLucro: `Eleva a autoridade da marca e converte visitantes em orçamentos qualificados no automático.`,
        },
        {
          sintomaIdentificado: `Processo de vendas e orçamentos sem acompanhamento automatizado`,
          solucao360OuSistema: `CRM Comercial + Automação de WhatsApp`,
          comoTratar: `Implantar funil de vendas simples com alertas e respostas rápidas.`,
          comoGeraMaisLucro: `Aumenta o percentual de fechamento de 15% para 35%, gerando receita imediata sobre os contatos que já chegam.`,
        },
        {
          sintomaIdentificado: `Embalagens e materiais impressos que não refletem a excelência do produto`,
          solucao360OuSistema: `Design de Embalagens Premium + Catálogo Impresso/Digital`,
          comoTratar: `Criar embalagens sofisticadas e materiais comerciais que causam impacto visual imediato.`,
          comoGeraMaisLucro: `Permite elevar o ticket médio e posiciona a marca acima dos concorrentes que usam embalagens genéricas.`,
        },
      ],
      resumoFinanceiroLucratividade: `A integração de Comunicação 360 com Sistemas de Gestão transforma a comunicação de um centro de custos para o principal motor de lucro líquido e expansão da ${nome}.`,
    },
    abordagensPorCanal: {
      whatsapp: {
        titulo: "WhatsApp Consultivo de Alto Impacto",
        ganchoAbertura: `Oportunidade de alavancagem comercial para ${nome} em ${cidade}`,
        focoPrincipal: "Solução de gargalos + aumento de conversão e lucro",
        texto: `Olá, ${contato}! Tudo bem?\n\nMe chamo [Seu Nome] e estive analisando o posicionamento da ${nome} aqui em ${cidade}.\n\nIdentificamos uma oportunidade clara para aumentar o faturamento de vocês integrando a comunicação da marca (identidade, embalagens e digital) com um sistema simples de CRM para estancar orçamentos perdidos.\n\nPreparamos um diagnóstico rápido de 3 minutos mostrando como nossos clientes do setor aumentaram a margem de lucro sem burocracia. Posso te enviar por aqui?\n\nUm abraço,\n${agencia}`,
      },
      email: {
        titulo: "E-mail Executivo de Diagnóstico & Lucro",
        assunto: `Diagnóstico Estratégico & Oportunidade de Crescimento — ${nome} (${cidade})`,
        focoPrincipal: "Análise de ROI, Comunicação 360 e Sistemas",
        texto: `Prezado(a) ${contato},\n\nAnalisamos a presença de mercado da ${nome} em ${cidade} e mapeamos pontos estratégicos onde a unificação da comunicação (branding, materiais físicos e digital) combinada com automação de gestão pode destravar novos recordes de faturamento.\n\nNossa agência é especialista em soluções 360 'chave na mão': cuidamos desde o design de embalagens e presença web até a implantação de sistemas de vendas (CRM e catálogo digital) que organizam sua operação e aumentam a margem de lucro.\n\nGostaria de compartilhar uma apresentação executiva de 15 minutos personalizada para a ${nome}.\n\nQual o melhor dia esta semana para conversarmos?\n\nAtenciosamente,\n${agencia}`,
      },
      instagram: {
        titulo: "Direct do Instagram (Estratégico & Amistoso)",
        ganchoAbertura: `Parabéns pelo trabalho + sugestão de conversão 360`,
        texto: `Oi, ${contato}! 👋 Parabéns pelo trabalho da ${nome} em ${cidade}.\n\nIdentificamos que o posicionamento de vocês tem tudo para atrair clientes de ticket bem mais alto se integrado com uma estrutura 360 e atendimento automatizado.\n\nTopa uma conversa rápida para eu te mostrar como ajudamos empresas do setor a multiplicarem o retorno comercial?`,
      },
      ligacaoReuniao: {
        titulo: "Roteiro de Ligação / Reunião Consultiva",
        falaAbertura: `"Olá, ${contato}, aqui é da ${agencia}. Estou ligando porque estudei o setor de ${seg} em ${cidade} e identifiquei um potencial claro de aumento de faturamento para a ${nome}."`,
        perguntaChaveDiagnostico: `"Hoje, quanto vocês estimam que deixam de faturar por falta de um canal 100% integrado que atenda e acompanhe o cliente no mesmo instante?"`,
        roteiroPassos: [
          `1. Conexão imediata com a realidade de ${cidade} e o segmento de ${seg}`,
          `2. Apontar o custo invisível de processos manuais e comunicação fragmentada`,
          `3. Mostrar como a solução 360 (Branding, Web e Sistemas) resolve rápido`,
          `4. Fechamento de compromisso para demonstração executiva de 15 minutos`,
        ],
      },
      propostaValor360: {
        titulo: "Pitch de Proposta de Valor 360",
        resumoExecutivo: `A ${agencia} desenvolve toda a cadeia de comunicação e sistemas para a ${nome}, gerando valor de ponta a ponta sem sobrecarregar a rotina dos sócios.`,
        textoCompleto: `A proposta da ${agencia} para a ${nome} integra:\n\n1. BRANDING & EMBALAGENS: Identidade visual de alto padrão e embalagens sofisticadas para elevar o ticket médio e a autoridade de mercado.\n\n2. PRESENÇA DIGITAL & VÍDEOS: Site de alta conversão, redes sociais estratégicas e vídeos institucionais cinematográficos.\n\n3. SISTEMAS DE GESTÃO & CRM: Implantação de funil de vendas automatizado, catálogo de pedidos e suporte humanizado para sua equipe vender mais em menos tempo.\n\nResultado: Mais lucro líquido, clientes qualificados e tranquilidade operacional para os tomadores de decisão.`,
      },
    },
  };
}
