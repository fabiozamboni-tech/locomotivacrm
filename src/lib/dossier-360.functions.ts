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

export interface AbordagemPsicologicaItem {
  id: "dor" | "medo_risco" | "ambicao" | "frustracao";
  titulo: string;
  gatilho: string;
  foco: string;
  mensagem: string;
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
  abordagensPsicologicas: AbordagemPsicologicaItem[];
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
    const agencia = data.nomeAgencia?.trim() || "Locomotiva Comunicação";
    const canal = data.canalPreferencial || "whatsapp";

    // 1. Pesquisa web em tempo real
    const webInfo = await pesquisarContextoWeb(data.empresa);

    const sys = `Você é o Diretor Comercial & Estrategista Chefe da LOCOMOTIVA COMUNICAÇÃO (agência de Comunicação 360 & Sistemas de Gestão na Serra Gaúcha/RS).
O escopo completo da Locomotiva Comunicação contempla:
- Identidade Visual & Branding Premium (Logotipo, manuais, posicionamento de autoridade);
- Material Impresso & Papelaria Corporativa de Alto Padrão (Catálogos, pastas, cartões, folders);
- Design de Embalagens, Rótulos e Pontos de Venda (Valorização do produto físico para elevar ticket médio);
- Presença Digital, Redes Sociais & Criação de Conteúdo Estratégico (Instagram, LinkedIn, Facebook);
- Produção de Vídeos Institucionais, Comerciais e Reels cinematográficos;
- Sites de Alta Conversão, Lojas Virtuais e Landing Pages responsivas com SEO;
- Sistemas Customizados & Automação de Gestão (CRM de Vendas, Catálogo Digital de Pedidos B2B, Sistema de Agendamentos 24/7, Portais do Cliente e Automação de WhatsApp).

DIRETRIZ CRÍTICA DE TOM DE VOZ (NÃO SEJA PUXA-SACO):
- NUNCA use bajulações, elogios vazios ou adulação excessiva (evite frases como 'sua empresa incrível', 'vocês são referência máxima absoluta', 'parabéns pelo trabalho maravilhoso').
- Seja estritamente CONSULTIVO, DIRETO, ANALÍTICO, PROFISSIONAL e SEGURO.
- Aponte os gargalos técnicos e de vendas com clareza, mostre o cálculo do custo da inação e apresente a solução da Locomotiva Comunicação como um investimento lógico de alto retorno financeiro (ROI).`;

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
  "abordagensPsicologicas": [
    {
      "id": "dor",
      "titulo": "1. Abordagem Direta: Foco na Dor Imediata",
      "gatilho": "Dor Imediata & Alívio Rápido",
      "foco": "Estancar a perda diária de orçamentos",
      "mensagem": "Texto completo e direto de WhatsApp (sem puxa-saquismo) apontando o problema e convidando para ver a auditoria de 2 minutos."
    },
    {
      "id": "medo_risco",
      "titulo": "2. Abordagem Financeira: Foco no Custo da Inação",
      "gatilho": "Risco Financeiro & Perda para Concorrentes",
      "foco": "Quanto a empresa deixa na mesa todo mês",
      "mensagem": "Texto executivo e pragmático mostrando o custo financeiro de adiar a modernização frente aos concorrentes da região."
    },
    {
      "id": "ambicao",
      "titulo": "3. Abordagem de Escala: Foco em Ambição & Liderança",
      "gatilho": "Crescimento de Margem & Ticket Médio",
      "foco": "Posicionamento premium para atrair clientes de maior valor",
      "mensagem": "Texto focado em expansão, autoridade e aumento de margem de lucro com Comunicação 360."
    },
    {
      "id": "frustracao",
      "titulo": "4. Abordagem de Segurança: Foco em Solução Chave na Mão",
      "gatilho": "Zero Sobrecarga & Execução Garantida",
      "foco": "Eliminar o trauma de projetos que dão trabalho ou não vendem",
      "mensagem": "Texto que quebra a desconfiança mostrando que a Locomotiva Comunicação assume todo o peso operacional e técnico."
    }
  ],
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
      "assunto": "Diagnóstico & Oportunidade de Lucro — ${data.empresa.nome}",
      "focoPrincipal": "Demonstração de autoridade técnica e ROI",
      "texto": "E-mail profissional, direto ao ponto, estruturado com tópicos e link para micro-auditoria."
    },
    "instagram": {
      "titulo": "Direct de Instagram Direto",
      "ganchoAbertura": "Ponto de atenção no fluxo de atendimento da ${data.empresa.nome}",
      "texto": "Mensagem curta de Direct para o perfil do Instagram com objetivo de migrar para o WhatsApp do decisor."
    },
    "ligacaoReuniao": {
      "titulo": "Roteiro Consultivo de Reunião / Ligação",
      "falaAbertura": "Fala inicial de 30 segundos para capturar a atenção do sócio/gestor.",
      "perguntaChaveDiagnostico": "Pergunta cirúrgica que faz o decisor admitir o gargalo de vendas atual.",
      "roteiroPassos": [
        "1. Validação do cenário atual e volume de propostas perdidas",
        "2. Apresentação do custo financeiro da inação",
        "3. Demonstração da solução integrada 360 + Sistemas",
        "4. Proposta de fechamento com onboarding guiado"
      ]
    },
    "propostaValor360": {
      "titulo": "Pitch de Proposta de Valor Integrada 360",
      "resumoExecutivo": "Visão geral de como a Locomotiva Comunicação integra marca, materiais, canais digitais e sistemas em um único contrato chave na mão.",
      "textoCompleto": "Texto completo de proposta consultiva pronta para apresentação."
    }
  }
}`;

    try {
      const parsed = await chatJSON<Dossier360Result>([
        { role: "system", content: sys },
        { role: "user", content: user },
      ]);
      return parsed;
    } catch (err) {
      console.warn("Falha no LLM para Dossiê 360, usando gerador determinístico inteligente:", err);
      return gerarFallbackDossier(data.empresa, webInfo, agencia);
    }
  });

function gerarFallbackDossier(
  empresa: EmpresaCtx,
  webInfo: { snippets: string[]; fontes: string[]; resumoMercado: string },
  agencia: string,
): Dossier360Result {
  const nome = empresa.nome;
  const cid = empresa.cidade;
  const seg = empresa.segmento;
  const auditLink = `https://locomotivacrm.com.br/auditoria/${empresa.id}`;

  return {
    empresaNome: nome,
    segmento: seg,
    cidade: cid,
    pesquisaWebRealizada: {
      termoBuscado: `${nome} ${cid} ${seg}`,
      fontesEncontradas: webInfo.fontes.slice(0, 3),
      resumoMercadoLocal: `Segmento de ${seg} em ${cid} com demanda ativa por atendimento ágil e presença profissional consistente.`,
    },
    dimensaoPsicologica: {
      doresAtuais: [
        `Gargalo na conversão de novos clientes em ${cid} por falta de canais digitais ágeis.`,
        "Equipe perde tempo em atendimentos repetitivos e orçamentos que não fecham.",
        "Comunicação visual e materiais não refletem o verdadeiro padrão de qualidade da empresa.",
      ],
      medosERiscos: [
        `Concorrentes de ${cid} e região ocuparem o mercado consumidor com marketing mais moderno.`,
        "Passar percepção de amadorismo e ser pressionado a conceder descontos excessivos.",
        "Gastar tempo e dinheiro com ações isoladas que não geram aumento de faturamento.",
      ],
      desejosEAmbicoes: [
        `Tornar-se a marca de maior autoridade e preferência em ${seg} na região.`,
        "Elevar o ticket médio e fechar orçamentos de maior margem de lucro com facilidade.",
        "Processos comerciais organizados e rodando no piloto automático com sistemas.",
      ],
      frustracoesPassadas: [
        "Experiências anteriores com prestadores que entregaram apenas posts sem impacto financeiro.",
        "Softwares engessados que exigiram esforço e acabaram abandonados pela equipe.",
      ],
    },
    abordagensPsicologicas: [
      {
        id: "dor",
        titulo: "1. Abordagem Direta: Foco na Dor Imediata",
        gatilho: "Dor Imediata & Alívio Rápido",
        foco: "Estancar perda diária de orçamentos",
        mensagem: `Olá, [Nome do contato]! Tudo bem?\n\nMe chamo [Seu Nome], da ${agencia}.\n\nAcompanho o setor de ${seg} em ${cid} e notei um gargalo na apresentação e canais da ${nome} que pode estar custando clientes prontos para comprar todos os dias.\n\nPreparamos uma análise de 2 minutos sobre isso (${auditLink}). Posso te apresentar os principais pontos em uma conversa rápida de 10 minutos?\n\nUm abraço,\n${agencia}`,
      },
      {
        id: "medo_risco",
        titulo: "2. Abordagem Financeira: Foco no Custo da Inação",
        gatilho: "Risco Financeiro & Perda para Concorrentes",
        foco: "Cálculo de perda mensal por adiar modernização",
        mensagem: `Olá, [Nome do contato]!\n\nAnalisando o mercado de ${seg} em ${cid}, calculamos que empresas do seu porte deixam entre R$ 5.000 e R$ 15.000 na mesa todo mês por falta de canais de captação e CRM comercial ágil.\n\nA ${agencia} estruturou um plano para estancar esse vazamento de receita na ${nome}.\n\nVocê teria 10 minutos nesta quinta-feira para avaliarmos esses números juntos?\n\nAtenciosamente,\n${agencia}`,
      },
      {
        id: "ambicao",
        titulo: "3. Abordagem de Escala: Foco em Ambição & Liderança",
        gatilho: "Crescimento de Margem & Autoridade",
        foco: "Posicionamento premium para ticket médio superior",
        mensagem: `Olá, [Nome do contato]!\n\nAcompanhando o potencial da ${nome} em ${cid}, vemos uma oportunidade clara de posicionar a marca no topo do segmento de ${seg}, permitindo atrair clientes de maior ticket e elevar a margem de lucro.\n\nTrabalhamos com o modelo Comunicação 360 + Sistemas de Gestão chave na mão.\n\nPodemos agendar uma call rápida de 10 minutos para conhecer os cases de expansão que aplicamos na região?`,
      },
      {
        id: "frustracao",
        titulo: "4. Abordagem de Segurança: Foco em Solução Chave na Mão",
        gatilho: "Zero Sobrecarga & Execução Garantida",
        foco: "Sem trabalho técnico para a equipe do cliente",
        mensagem: `Olá, [Nome do contato]!\n\nSabemos que muitos empresários de ${cid} já se frustraram com agências que só vendem 'postzinhos' sem retorno, ou ferramentas complexas que ninguém usa.\n\nNa ${agencia}, nosso modelo é 100% focado em retorno financeiro: cuidamos de toda a parte técnica, design e automações para que você só receba os orçamentos prontos.\n\nConseguiu dar uma olhada na micro-auditoria que geramos para a ${nome} (${auditLink})?`,
      },
    ],
    dimensaoOperacional: {
      gargalosProcesso: [
        "Falta de catálogo digital interativo para fechamento ágil de pedidos.",
        "Tempo de resposta demorado no WhatsApp que afasta compradores decididos.",
        "Ausência de CRM comercial para organizar follow-ups e orçamentos pendentes.",
      ],
      impactoFinanceiroCustoInacao: "Perda estimada de R$ 5.000 a R$ 18.000 mensais em orçamentos não convertidos.",
      nivelMaturidade: "intermediaria",
      justificativaMaturidade: "A empresa possui boa reputação local, necessitando apenas da esteira de automação e modernização de marca para multiplicar o faturamento.",
      sistemasGestaoRecomendados: [
        {
          id: "crm_vendas",
          nome: "CRM Comercial & Pipeline de Vendas",
          categoria: "crm",
          icone: "BarChart3",
          beneficioGestao: "Controle visual de todas as negociações em andamento com lembretes automáticos de retorno.",
          impactoLucro: "Aumenta o fechamento de propostas em até 35% ao eliminar o esquecimento de clientes.",
          aplicabilidade: "essencial",
          exemploPratico: "A equipe visualiza em segundos quem pediu orçamento e precisa de contato hoje.",
        },
        {
          id: "catalogo_pedidos_b2b",
          nome: "Catálogo B2B & Central de Pedidos Online",
          categoria: "erp_pedidos",
          icone: "Package",
          beneficioGestao: "Apresentação visual interativa de produtos com emissão automática de pedidos.",
          impactoLucro: "Reduz o tempo de atendimento em 70% e estimula recompra recorrente.",
          aplicabilidade: "alta",
          exemploPratico: "Clientes e vendedores montam orçamentos diretamente pelo celular 24h por dia.",
        },
        {
          id: "automacao_whats",
          nome: "Automação de Atendimento & Triagem WhatsApp",
          categoria: "automacao_whats",
          icone: "MessageSquare",
          beneficioGestao: "Triagem instantânea dos contatos com qualificação automática antes do atendente humano.",
          impactoLucro: "Garante resposta em menos de 1 minuto, impedindo o lead de pesquisar concorrentes.",
          aplicabilidade: "alta",
          exemploPratico: "Responde dúvidas frequentes e direciona o cliente pronto para fechar a compra.",
        },
      ],
    },
    dimensaoEstrategica: {
      metasCrescimento: [
        `Dominar as buscas e preferência de compra no setor de ${seg} em ${cid}.`,
        "Aumentar o volume de vendas mantendo uma operação enxuta e eficiente.",
      ],
      culturaOrganizacional: "Gestão orientada a resultados práticos e eficiência operacional, que valoriza parcerias sérias e transparentes.",
      tomRecomendadoAbordagem: "Consultivo, executivo e embasado em retorno financeiro, sem formalismos vazios.",
    },
    prescricaoTratamentoLucro: {
      itensTratamento: [
        {
          sintomaIdentificado: "Canais digitais com baixa conversão e ausência de site moderno",
          solucao360OuSistema: "Site de Alta Conversão + Identidade 360",
          comoTratar: "Desenvolver uma página veloz com pontos claros de conversão e identidade marcante.",
          comoGeraMaisLucro: "Transforma cliques em mensagens no WhatsApp comercial, gerando fluxo constante de leads.",
        },
        {
          sintomaIdentificado: "Desorganização no fluxo de propostas e atendimento",
          solucao360OuSistema: "CRM Comercial + Automação de WhatsApp",
          comoTratar: "Implementar funil de vendas integrado com respostas automáticas e régua de acompanhamento.",
          comoGeraMaisLucro: "Recupera até 40% das propostas que seriam esquecidas pela rotina corrida.",
        },
        {
          sintomaIdentificado: "Material impresso e embalagens sem diferenciação competitiva",
          solucao360OuSistema: "Embalagens & Papelaria Corporativa de Alto Padrão",
          comoTratar: "Desenvolver catálogos e embalagens com acabamento superior que transmitem segurança.",
          comoGeraMaisLucro: "Permite praticar preços mais altos ao elevar a percepção de valor dos produtos.",
        },
      ],
      resumoFinanceiroLucratividade: "A implementação coordenada do ecossistema 360 estanca gargalos de captação e processos, convertendo mais vendas sem necessidade de aumentar a equipe.",
    },
    abordagensPorCanal: {
      whatsapp: {
        titulo: "Mensagem Estratégica para WhatsApp (Direta & Consultiva)",
        ganchoAbertura: `Oportunidade de otimização em ${cid}`,
        focoPrincipal: "Estancar gargalos e acelerar orçamentos",
        texto: `Olá, [Nome do contato]! Tudo bem?\n\nMe chamo [Seu Nome], da ${agencia}.\n\nAcompanho o mercado de ${seg} em ${cid} e estive analisando os canais da ${nome}. Notei alguns gargalos de captação que estão fazendo a empresa perder orçamentos para concorrentes da região.\n\nPreparamos uma análise de 2 minutos sobre como estancar essas perdas e automatizar o atendimento.\n\nPosso compartilhar o diagnóstico com você por aqui?\n\nUm abraço,\n${agencia}`,
      },
      email: {
        titulo: "E-mail Executivo para Decisores",
        assunto: `Micro-Auditoria & Oportunidades de Lucro — ${nome} (${cid})`,
        focoPrincipal: "Diagnóstico técnico e retorno financeiro",
        texto: `Olá, [Nome do contato],\n\nNossa equipe da ${agencia} realizou um mapeamento de mercado focado no segmento de ${seg} em ${cid}.\n\nIdentificamos que a ${nome} possui um excelente potencial, mas vem perdendo oportunidades de vendas devido a gargalos na presença digital e no fluxo de atendimento.\n\nEstruturamos um relatório executivo de 2 minutos com:\n1. Principais pontos de atrito identificados na marca e canais;\n2. Estimativa de faturamento que deixa de entrar mensalmente;\n3. Como resolver esses gargalos com Comunicação 360 e Sistemas de Gestão.\n\n👉 Você pode acessar o diagnóstico completo neste link:\n${auditLink}\n\nFicamos à disposição para uma rápida conversa de 10 minutos caso queira entender como aplicar essas soluções na prática.\n\nAtenciosamente,\n${agencia}\nlocomotivacomunicacao.com.br`,
      },
      instagram: {
        titulo: "Direct de Instagram Direto",
        ganchoAbertura: `Ponto de atenção nos canais da ${nome}`,
        texto: `Olá, pessoal da ${nome}! Tudo bem?\n\nMe chamo [Seu Nome], da ${agencia}.\n\nEstive analisando o perfil de vocês e notei um detalhe no fluxo de atendimento que pode estar travando o contato de clientes que chegam por aqui.\n\nPreparamos uma análise rápida sobre isso. Qual o melhor WhatsApp ou e-mail do responsável para eu enviar o link?\n\nUm abraço!`,
      },
      ligacaoReuniao: {
        titulo: "Roteiro Consultivo de Reunião / Ligação",
        falaAbertura: `Olá, [Nome do contato]! Me chamo [Seu Nome], da ${agencia}. Estou ligando rapidamente porque acompanho o mercado de ${seg} aqui em ${cid} e identifiquei 2 gargalos na presença da ${nome} que estão fazendo clientes prontos irem para a concorrência.`,
        perguntaChaveDiagnostico: "Hoje, quando um cliente pede um orçamento pelo WhatsApp ou site, quanto tempo em média a sua equipe leva para responder e enviar a proposta final?",
        roteiroPassos: [
          "1. Abertura: Confirmar se o tempo de resposta e follow-up hoje é um desafio.",
          "2. Apresentação do Custo da Inação: Mostrar que cada hora de demora reduz 50% a chance de fechar a venda.",
          "3. Solução 360 + Sistemas: Apresentar a Locomotiva Comunicação cuidando da marca, site, catálogo e CRM.",
          "4. Fechamento: Convidar para demonstração prática guiada de 15 minutos sem compromisso.",
        ],
      },
      propostaValor360: {
        titulo: "Pitch de Proposta de Valor Integrada Locomotiva 360",
        resumoExecutivo: "Ecossistema completo que unifica design premium, produção de materiais, canais digitais de alta conversão e sistemas de gestão operacional em uma única mensalidade chave na mão.",
        textoCompleto: `PROPOSTA DE VALOR INTEGRADA — LOCOMOTIVA COMUNICAÇÃO\n\nPara: ${nome} (${cid}/RS)\nSegmento: ${seg}\n\n1. O PROBLEMA CENTRAL:\nEmpresas em crescimento sofrem ao contratar fornecedores fragmentados (um faz o post, outro o site, outro o sistema), gerando retrabalho, perda de padrão e custos elevados sem aumento real de vendas.\n\n2. A SOLUÇÃO LOCOMOTIVA 360:\nA Locomotiva Comunicação assume toda a esteira de marketing e processos da ${nome}:\n- Branding & Identidade Visual de Alto Impacto\n- Materiais Impressos, Catálogos e Embalagens Comerciais\n- Sites de Alta Conversão & Redes Sociais Estratégicas\n- CRM Comercial & Automação de WhatsApp para Vendas\n\n3. RESULTADO ESPERADO:\n- Aumento de 30% a 50% na taxa de conversão de orçamentos;\n- Economia de mais de 20 horas mensais da equipe com automação de atendimento;\n- Posicionamento líder incontestável no mercado de ${cid}.\n\nEntre em contato conosco para iniciarmos a implantação: locomotivacomunicacao.com.br`,
      },
    },
  };
}
