import type { Empresa } from "./mock-data";
import type { Canal, Tom } from "./generators";

export type PilarDMAM = "dores" | "medos" | "ambicoes" | "maturidade" | "matriz_completa";

export interface ItemDMAM {
  pilar: "dores" | "medos" | "ambicoes" | "maturidade";
  titulo: string;
  rotulo: string;
  diretiva: string;
  diagnostico: string;
  solucaoProposta: string;
  texto: string;
  assuntoEmail?: string;
  explicacaoConsultiva: string;
}

export interface MatrizDMAMResult {
  empresaNome: string;
  segmento: string;
  cidade: string;
  dores: ItemDMAM;
  medos: ItemDMAM;
  ambicoes: ItemDMAM;
  maturidade: ItemDMAM;
  mensagemIntegradaCompleta: string;
}

export const PILARES_INFO = [
  {
    id: "dores" as const,
    nome: "Dores",
    subtitulo: "O problema imediato",
    diretiva: "Mostre como sua solução resolve o problema rápido.",
    icone: "AlertCircle",
    cor: "text-amber-500",
    badgeCor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  },
  {
    id: "medos" as const,
    nome: "Medos",
    subtitulo: "O risco de não mudar",
    diretiva: "Mostre como sua solução traz segurança e estabilidade.",
    icone: "ShieldAlert",
    cor: "text-rose-500",
    badgeCor: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
  },
  {
    id: "ambicoes" as const,
    nome: "Ambições",
    subtitulo: "Onde eles querem chegar",
    diretiva: "Mostre como sua solução acelera o crescimento.",
    icone: "TrendingUp",
    cor: "text-emerald-500",
    badgeCor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  {
    id: "maturidade" as const,
    nome: "Maturidade",
    subtitulo: "A capacidade de implementação",
    diretiva: "Adapte o suporte e o onboarding à realidade deles.",
    icone: "Gauge",
    cor: "text-blue-500",
    badgeCor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  },
] as const;

/**
 * Gerador local de contingência (fallback offline) para o framework DMAM.
 */
export function gerarItemDMAM(
  empresa: Empresa,
  pilar: "dores" | "medos" | "ambicoes" | "maturidade",
  canal: Canal = "whatsapp",
  tom: Tom = "consultivo",
  nomeAgencia = "Locomotiva Comunicação",
): ItemDMAM {
  const nome = empresa.nome;
  const cidade = empresa.cidade;
  const segmento = empresa.segmento;
  const contato = "[Nome do contato]";

  if (pilar === "dores") {
    const semSite = empresa.statusSite === "sem_site";
    const diag = semSite
      ? `A ${nome} não possui canal próprio de conversão em ${cidade}, dependendo apenas de indicação ou redes sociais.`
      : `O site da ${nome} possui gargalos que dificultam o contato imediato de clientes qualificados.`;
    const sol = "Implementação rápida de presença digital otimizada com botão de contato direto em menos de 15 dias.";

    let texto = "";
    if (canal === "whatsapp" || canal === "curta") {
      texto = `Olá, ${contato}! Tudo bem?\n\nIdentifiquei uma oportunidade rápida para a ${nome} aqui em ${cidade}: muitos clientes buscam por ${segmento} no Google e acabam não encontrando um canal direto para fechar com vocês.\n\nDesenvolvemos uma estrutura pronta e ágil que resolve isso em poucos dias, colocando um canal de captação funcionando no ar. Posso te mandar uma prévia de 2 minutos sem compromisso?\n\nUm abraço,\n${nomeAgencia}`;
    } else if (canal === "email") {
      texto = `Assunto: Resolução rápida para captação de clientes na ${nome}\n\nOlá, ${contato},\n\nAnalisando o mercado de ${segmento} em ${cidade}, notei um ponto crítico que pode estar custando orçamentos diários para a ${nome}: a jornada de contato de quem procura seus serviços no digital.\n\nNossa equipe estruturou um modelo de implementação rápida que resolve esse problema sem burocracia, entregando um canal profissional e integrado para captação imediata.\n\nSe fizer sentido, posso te apresentar um diagnóstico prático de 2 minutos sobre como aplicar isso rápido na sua rotina.\n\nAtenciosamente,\n${nomeAgencia}`;
    } else if (canal === "instagram") {
      texto = `Oi, ${contato}! Parabéns pelo trabalho da ${nome} aqui em ${cidade}.\n\nNotei que muitos potenciais clientes que chegam no perfil de vocês sentem falta de um canal rápido para solicitar orçamento.\n\nCriamos soluções ágeis que resolvem esse gargalo rapidamente. Posso te mandar uma sugestão prática por aqui?`;
    } else {
      texto = `1. Apresentação: "Oi, ${contato}, aqui é da ${nomeAgencia}, tudo bem?"\n2. Dor imediata: "Liguei porque notei que a ${nome} tem uma demanda forte em ${cidade}, mas está perdendo contatos por falta de um canal digital rápido."\n3. Solução ágil: "Nós temos uma solução que entra no ar em poucos dias e já começa a captar contatos qualificados."\n4. Chamada leve: "Consigo te mostrar um exemplo de 3 minutos hoje à tarde?"`;
    }

    return {
      pilar: "dores",
      titulo: "⚡ Dores: Resolução Imediata do Problema",
      rotulo: "Problema Imediato ➔ Solução Rápida",
      diretiva: "Mostre como sua solução resolve o problema rápido.",
      diagnostico: diag,
      solucaoProposta: sol,
      texto,
      assuntoEmail: `Resolução rápida para captação de clientes na ${nome}`,
      explicacaoConsultiva: "Foca no problema urgente (perda de vendas agora) e remove o atrito com uma entrega rápida e descomplicada.",
    };
  }

  if (pilar === "medos") {
    const diag = `Risco iminente de perder market share e posicionamento para concorrentes de ${segmento} que estão se digitalizando na região de ${cidade}.`;
    const sol = "Construção de uma base digital sólida e protegida, com segurança, SSL e autoridade inquestionável.";

    let texto = "";
    if (canal === "whatsapp" || canal === "curta") {
      texto = `Olá, ${contato}! Tudo bem?\n\nTenho acompanhado a movimentação de ${segmento} em ${cidade} e cada vez mais empresas estão investindo forte em presença digital para blindar sua base de clientes.\n\nPara a ${nome} não correr o risco de ficar para trás ou perder espaço na mente do consumidor, estruturamos uma solução com total estabilidade e segurança jurídica e técnica.\n\nPodemos conversar 5 minutos para eu te mostrar como proteger seu posicionamento?\n\nAbraço,\n${nomeAgencia}`;
    } else if (canal === "email") {
      texto = `Assunto: Protegendo a autoridade e o posicionamento da ${nome} em ${cidade}\n\nPrezado(a) ${contato},\n\nO mercado de ${segmento} está passando por uma profissionalização acelerada na nossa região. Empresas que adiam sua modernização digital enfrentam um risco silencioso: a perda gradual de clientes para marcas que transmitem mais segurança online.\n\nA proposta da ${nomeAgencia} é trazer segurança absoluta e estabilidade para a ${nome}, com infraestrutura blindada, conformidade e presença sólida.\n\nGostaria de compartilhar uma análise comparativa do seu setor para você avaliar os riscos e oportunidades.\n\nAtenciosamente,\n${nomeAgencia}`;
    } else if (canal === "instagram") {
      texto = `Oi, ${contato}! Uma observação rápida sobre a ${nome}: marcas consolidadas em ${cidade} têm sofrido com concorrentes novos ocupando o topo das buscas.\n\nTrabalhamos com estratégias de blindagem digital para garantir que vocês continuem sendo a referência no setor. Topa trocar uma ideia rápida?`;
    } else {
      texto = `1. Abertura: "Olá, ${contato}, falo da ${nomeAgencia}."\n2. Risco/Medo: "Estou entrando em contato porque o setor de ${segmento} na região está se digitalizando muito rápido, e não queremos que a ${nome} perca clientes consolidados."\n3. Segurança: "Nosso foco é trazer estabilidade e segurança para que vocês mantenham a liderança de mercado."\n4. Fechamento: "Podemos alinhar uma conversa rápida de 10 minutos esta semana?"`;
    }

    return {
      pilar: "medos",
      titulo: "🛡️ Medos: Risco de Não Mudar & Segurança",
      rotulo: "Risco de Não Mudar ➔ Segurança e Estabilidade",
      diretiva: "Mostre como sua solução traz segurança e estabilidade.",
      diagnostico: diag,
      solucaoProposta: sol,
      texto,
      assuntoEmail: `Protegendo a autoridade e o posicionamento da ${nome} em ${cidade}`,
      explicacaoConsultiva: "Evidencia o custo da inação (ficar para trás) e apresenta sua agência como um porto seguro que blinda o negócio.",
    };
  }

  if (pilar === "ambicoes") {
    const diag = `Potencial claro da ${nome} para expandir faturamento, atrair clientes de maior ticket médio e se tornar a marca número 1 de ${segmento} em ${cidade} e região.`;
    const sol = "Alavancagem digital de alta performance com design premium, posicionamento de autoridade e escala comercial.";

    let texto = "";
    if (canal === "whatsapp" || canal === "curta") {
      texto = `Olá, ${contato}! Tudo bem?\n\nAcompanho a qualidade da ${nome} e vejo um potencial enorme para vocês darem o próximo salto de crescimento em ${cidade} e além.\n\nCom uma estrutura digital de alto nível, é possível atrair clientes com ticket médio bem mais alto e acelerar suas metas de faturamento.\n\nTopa uma conversa rápida de 10 minutos para eu te apresentar nosso plano de aceleração digital desenhado para empresas com a ambição da ${nome}?\n\nUm abraço,\n${nomeAgencia}`;
    } else if (canal === "email") {
      texto = `Assunto: Plano de aceleração digital e crescimento para a ${nome}\n\nOlá, ${contato},\n\nA ${nome} possui forte potencial de mercado para expandir sua participação em ${cidade} e em escala regional.\n\nA ${nomeAgencia} atua na estruturação de canais comerciais e digitais de alta conversão — integrando comunicação 360, design premium e captação qualificada.\n\nEstruturamos um diagnóstico direcionado aos gargalos de captação e aos objetivos de expansão da ${nome}.\n\nQual o melhor dia para conversarmos por 15 minutos?\n\nAtenciosamente,\n${nomeAgencia}`;
    } else if (canal === "instagram") {
      texto = `Oi, ${contato}! Analisando o posicionamento da ${nome}, identificamos oportunidades concretas para acelerar a captação de clientes de maior ticket médio.\n\nPosso compartilhar o resumo do diagnóstico com você?`;
    } else {
      texto = `1. Conexão com ambição: "Oi, ${contato}, falo da ${nomeAgencia}. Mapeamos o mercado de ${segmento} em ${cidade} e identificamos alavancas de crescimento para a ${nome}."\n2. Crescimento acelerado: "Nosso foco é estruturar a comunicação e os canais de venda para acelerar o faturamento."\n3. Convite executivo: "Você teria disponibilidade na quinta-feira para uma breve apresentação?"`;
    }

    return {
      pilar: "ambicoes",
      titulo: "🚀 Ambições: Aceleração de Crescimento",
      rotulo: "Onde Querem Chegar ➔ Aceleração do Crescimento",
      diretiva: "Mostre como sua solução acelera o crescimento.",
      diagnostico: diag,
      solucaoProposta: sol,
      texto,
      assuntoEmail: `Plano de aceleração digital e crescimento para a ${nome}`,
      explicacaoConsultiva: "Apela para a visão de futuro, metas audaciosas, aumento de faturamento e conquista de liderança de mercado.",
    };
  }

  // Pilar: Maturidade
  const diag = `Equipe da ${nome} precisa de uma solução sem atritos técnicos, com acompanhamento próximo e implementação 'chave na mão' que respeite o tempo dos sócios.`;
  const sol = "Onboarding guiado passo a passo, suporte humanizado dedicado e execução 100% gerenciada pela agência.";

  let texto = "";
  if (canal === "whatsapp" || canal === "curta") {
    texto = `Olá, ${contato}! Tudo bem?\n\nSabemos que a rotina operacional da ${nome} em ${cidade} exige foco total e não permite perda de tempo com implementações complexas.\n\nPor isso, na ${nomeAgencia} operamos no modelo 'chave na mão': assumimos toda a estruturação técnica, suporte e implementação, permitindo que sua equipe foque exclusivamente no atendimento às novas demandas.\n\nPodemos agendar 10 minutos para demonstrar como adaptamos esse onboarding à sua rotina?\n\nUm abraço,\n${nomeAgencia}`;
  } else if (canal === "email") {
    texto = `Assunto: Implementação digital sob medida e suporte dedicado para a ${nome}\n\nOlá, ${contato},\n\nUm dos principais desafios em empresas do setor de ${segmento} em ${cidade} é a sobrecarga da equipe ao tentar implementar novas tecnologias e estratégias de comunicação.\n\nNa ${nomeAgencia}, adaptamos o processo de implantação e suporte à realidade operacional da ${nome}, assumindo o desenvolvimento e entregando os canais prontos para gerar resultado imediato.\n\nFico à disposição para apresentar nosso modelo de suporte e implementação.\n\nAtenciosamente,\n${nomeAgencia}`;
  } else if (canal === "instagram") {
    texto = `Oi, ${contato}! Sabemos o quanto a operação da ${nome} exige tempo. Desenvolvemos projetos com implementação 100% gerenciada para não sobrecarregar sua equipe interna.\n\nPosso te mostrar como funciona nosso fluxo de trabalho?`;
  } else {
    texto = `1. Empatia operacional: "Olá, ${contato}, falo da ${nomeAgencia}."\n2. Onboarding adaptado: "Cuidamos de 100% da implementação técnica para que sua equipe não tenha sobrecarga operacional."\n3. Próximo passo simples: "Podemos agendar 5 minutos só para você conhecer como facilitamos todo o processo?"`;
  }

  return {
    pilar: "maturidade",
    titulo: "🎯 Maturidade: Suporte & Onboarding Sob Medida",
    rotulo: "Capacidade de Implementação ➔ Suporte e Onboarding Adaptado",
    diretiva: "Adapte o suporte e o onboarding à realidade deles.",
    diagnostico: diag,
    solucaoProposta: sol,
    texto,
    assuntoEmail: `Implementação digital sob medida e suporte dedicado para a ${nome}`,
    explicacaoConsultiva: "Reduz a objeção de 'não temos tempo/equipe para isso', garantindo suporte completo e onboarding adaptado à capacidade da empresa.",
  };
}

/**
 * Gera a matriz completa com os 4 pilares + abordagem master integrada.
 */
export function gerarMatrizDMAM(
  empresa: Empresa,
  canal: Canal = "whatsapp",
  tom: Tom = "consultivo",
  nomeAgencia = "Locomotiva Comunicação",
): MatrizDMAMResult {
  const dores = gerarItemDMAM(empresa, "dores", canal, tom, nomeAgencia);
  const medos = gerarItemDMAM(empresa, "medos", canal, tom, nomeAgencia);
  const ambicoes = gerarItemDMAM(empresa, "ambicoes", canal, tom, nomeAgencia);
  const maturidade = gerarItemDMAM(empresa, "maturidade", canal, tom, nomeAgencia);

  const nome = empresa.nome;
  const cidade = empresa.cidade;
  const contato = "[Nome do contato]";

  const mensagemIntegradaCompleta =
    canal === "email"
      ? `Assunto: Diagnóstico Estratégico e Plano de Evolução Digital — ${nome} (${cidade})\n\nPrezado(a) ${contato},\n\nAnalisamos a presença digital da ${nome} e estruturamos um plano consultivo focado em 4 pilares estratégicos:\n\n1. RESOLUÇÃO IMEDIATA (Dores): Destravamos canais de contato direto para estancar a perda de orçamentos e captar novos clientes já nas primeiras semanas.\n\n2. SEGURANÇA & ESTABILIDADE (Medos): Blindamos seu posicionamento frente aos concorrentes da região, garantindo conformidade, segurança e presença digital ininterrupta.\n\n3. ACELERAÇÃO DE RESULTADOS (Ambições): Criamos um ecossistema premium para elevar o ticket médio e posicionar a ${nome} como referência absoluta no setor.\n\n4. SUPORTE ADAPTADO (Maturidade): Cuidamos de 100% da implementação técnica, com onboarding guiado e suporte humanizado, sem sobrecarregar sua equipe.\n\nPodemos agendar uma breve conversa de 15 minutos para apresentar os detalhes desta proposta personalizada para a ${nome}?\n\nAtenciosamente,\n${nomeAgencia}`
      : `Olá, ${contato}! Tudo bem?\n\nFizemos um diagnóstico estratégico da ${nome} aqui em ${cidade} e identificamos como podemos acelerar seus resultados através de um método estruturado:\n\n⚡ Resolver o gargalo imediato de captação de clientes em poucos dias;\n🛡️ Blindar a autoridade da sua marca contra a concorrência na região;\n🚀 Elevar o ticket médio com posicionamento premium;\n🎯 E o melhor: nós cuidamos de 100% da parte técnica, com suporte dedicado à sua rotina.\n\nPosso te enviar uma demonstração prática de 3 minutos sobre como aplicar isso na ${nome}?\n\nUm abraço,\n${nomeAgencia}`;

  return {
    empresaNome: empresa.nome,
    segmento: empresa.segmento,
    cidade: empresa.cidade,
    dores,
    medos,
    ambicoes,
    maturidade,
    mensagemIntegradaCompleta,
  };
}
