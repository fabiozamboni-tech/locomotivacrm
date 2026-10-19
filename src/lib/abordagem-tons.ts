import type { EmpresaCtx } from "./ai.functions";

export type TomAbordagemId =
  | "amigavel_elogio"
  | "consultivo_parceiro"
  | "descontraido_curioso"
  | "valorizacao_marca"
  | "direto_gentil";

export interface TomAbordagemItem {
  id: TomAbordagemId;
  nome: string;
  subtitulo: string;
  descricao: string;
  icone: string;
  tagline: string;
  canalRecomendado: string;
  badgeCls: string;
}

export const TONS_ABORDAGEM: TomAbordagemItem[] = [
  {
    id: "amigavel_elogio",
    nome: "Amigável & Elogio Genuíno",
    subtitulo: "Rapport caloroso e valorização da qualidade do cliente",
    descricao: "Começa elogiando sinceramente o trabalho ou reputação da empresa na cidade. Quebra a barreira defensiva logo na primeira linha.",
    icone: "Sparkles",
    tagline: "Recomendado para 1º Contato",
    canalRecomendado: "WhatsApp & Instagram Direct",
    badgeCls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  },
  {
    id: "consultivo_parceiro",
    nome: "Consultivo & Parceiro Regional",
    subtitulo: "Troca de ideias entre empreendedores da mesma região",
    descricao: "Postura de parceiro estratégico que identificou oportunidades de mercado na região e quer compartilhar insights sem forçar venda.",
    icone: "Users",
    tagline: "Alta Autoridade",
    canalRecomendado: "WhatsApp, E-mail & Reunião",
    badgeCls: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  },
  {
    id: "descontraido_curioso",
    nome: "Descontraído & Curioso",
    subtitulo: "Linguagem leve e natural, zero jargões corporativos",
    descricao: "Tom de conversa informal como um conhecido puxando assunto. Gera alta taxa de resposta por parecer 100% humano.",
    icone: "MessageCircle",
    tagline: "Conversão Rápida",
    canalRecomendado: "WhatsApp & Direct",
    badgeCls: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  },
  {
    id: "valorizacao_marca",
    nome: "Valorização & Padrão de Excelência",
    subtitulo: "Apelo ao orgulho da empresa e fim da briga por preço",
    descricao: "Reconhece o esforço em construir um negócio de qualidade e propõe alinhar a vitrine digital para que o cliente pague o valor justo.",
    icone: "Target",
    tagline: "Ticket Alto / B2B",
    canalRecomendado: "E-mail, Proposta & WhatsApp",
    badgeCls: "bg-purple-500/10 text-purple-600 border-purple-500/30",
  },
  {
    id: "direto_gentil",
    nome: "Direto ao Ponto & Gentil",
    subtitulo: "Objetivo, educado e focado no tempo escasso do decisor",
    descricao: "Vai direto à oportunidade de novos clientes, mas com máxima cordialidade e consideração pela rotina corrida do empresário.",
    icone: "Zap",
    tagline: "Decisores Ocupados",
    canalRecomendado: "WhatsApp & Ligação Rápida",
    badgeCls: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30",
  },
];

export type CanalAbordagemTipo = "whatsapp" | "instagram" | "email" | "ligacaoReuniao" | "propostaValor360";

/**
 * Gera textos prontos e amigáveis para primeiro contato baseados no tom selecionado
 */
export function gerarTextoProntoPorTom(
  empresa: EmpresaCtx,
  canal: CanalAbordagemTipo,
  tom: TomAbordagemId,
  agencia: string = "Locomotiva Comunicação",
): {
  texto: string;
  assunto?: string;
  ganchoAbertura: string;
  dicaEnvio: string;
} {
  const nome = empresa.nome || "Empresa";
  const cid = empresa.cidade || "RS";
  const seg = empresa.segmento || "produtos e serviços";
  const auditLink = `https://locomotivacrm.com.br/auditoria/${empresa.id}`;

  // =========================================================================
  // 1. TOM: AMIGÁVEL & ELOGIO GENUÍNO (CALOROSO / HUMANIZADO)
  // =========================================================================
  if (tom === "amigavel_elogio") {
    switch (canal) {
      case "whatsapp":
        return {
          ganchoAbertura: `Admiro o trabalho da ${nome} aqui em ${cid}`,
          dicaEnvio: "Mande com cordialidade entre 10h e 16h. Se não responder em 48h, mande um áudio amigável de 30 segundos reforçando o elogio.",
          texto: `Olá, pessoal da ${nome}! Tudo bem com vocês? 😊\n\nPassando aqui rapidamente porque admiro muito o trabalho e a dedicação de vocês no segmento de ${seg} aqui em ${cid}.\n\nMe chamo [Seu Nome], da ${agencia}. Estive admirando a qualidade de vocês e me veio uma ideia bem bacana para valorizar ainda mais esse padrão no Google e nas redes, ajudando novos clientes da nossa região a encontrarem a ${nome} com facilidade.\n\nSem compromisso nenhum, só queria compartilhar essas ideias com vocês porque acho o trabalho de vocês incrível. Posso mandar um áudio de 1 minutinho por aqui ou te enviar um resumo?\n\nUm abraço e parabéns pelo negócio!`,
        };

      case "instagram":
        return {
          ganchoAbertura: `Trabalho lindo que vocês fazem em ${cid}!`,
          dicaEnvio: "Curta 2 ou 3 fotos recentes do perfil antes de mandar o direct para gerar notificação amigável prévia.",
          texto: `Olá, pessoal da ${nome}! Tudo bem? ✨\n\nEstava navegando e fiquei encantado com a qualidade do trabalho de vocês em ${seg} aqui na nossa região de ${cid}! Dá para ver o carinho em cada detalhe.\n\nSou o [Seu Nome], aqui da ${agencia}. Tive uma ideia bem legal que pode ajudar a conectar mais pessoas que buscam o serviço de vocês todo dia no Google e no Instagram.\n\nQual o melhor WhatsApp de vocês para eu mandar uma mensagem rápida e trocar uma ideia descontraída?\n\nSucesso sempre por aí!`,
        };

      case "email":
        return {
          assunto: `Parabéns pelo trabalho na ${nome} — Uma ideia bacana para vocês em ${cid}`,
          ganchoAbertura: `Acompanho a trajetória da ${nome} e admiro o capricho no segmento de ${seg}`,
          dicaEnvio: "Evite termos pesados de vendas. Deixe claro que você é um admirador do trabalho local.",
          texto: `Olá, equipe da ${nome}! Tudo bem com vocês?\n\nAcompanho com frequência o mercado de ${seg} aqui em ${cid} e quero dar os parabéns pela seriedade e padrão que vocês entregam aos clientes da região.\n\nSou o [Seu Nome], estrategista de comunicação na ${agencia}. Estive analisando a presença da marca de vocês e notei que o negócio já tem um potencial enorme, faltando apenas alguns detalhes para o Google e as redes sociais refletirem esse mesmo capricho.\n\nPreparamos uma análise rápida e muito respeitosa, destacando oportunidades que podem colocar a ${nome} no topo das buscas da nossa cidade:\n👉 ${auditLink}\n\nSeria um prazer bater um papo rápido de 10 minutos sem nenhum compromisso para me apresentar e trocar umas ideias com vocês.\n\nUm abraço afetuoso e parabéns pelo excelente trabalho!\n\nAtenciosamente,\n[Seu Nome]\n${agencia} · Serra Gaúcha`,
        };

      case "ligacaoReuniao":
        return {
          ganchoAbertura: `Olá! Me chamo [Seu Nome], estou ligando porque sou daqui da região e admiro muito o trabalho da ${nome}.`,
          dicaEnvio: "Fale com um sorriso na voz. Deixe o empresário falar sobre o negócio dele antes de qualquer proposta.",
          texto: `Olá, [Nome do contato ou responsável]! Tudo bem? Me chamo [Seu Nome], da ${agencia} aqui da região.\n\nAntes de tudo, queria dar os parabéns pelo trabalho da ${nome} em ${cid}. Sempre ouço falar muito bem do cuidado de vocês com os clientes de ${seg}.\n\nEstou ligando rapidinho porque estive analisando como as pessoas buscam por serviços como o seu na cidade, e notei que vocês têm um potencial gigante para captar novos clientes todos os dias pelo Google.\n\nEu preparei um diagnóstico simples e muito positivo. Você teria 10 minutos para tomarmos um café ou batermos um papo rápido pelo Meet nesta semana?`,
        };

      case "propostaValor360":
        return {
          ganchoAbertura: `Parceria para colocar a qualidade da ${nome} no lugar de destaque que ela merece.`,
          dicaEnvio: "Apresente presencialmente ou em vídeo com tom de celebração e parceria.",
          texto: `PARCERIA ESTRATÉGICA LOCOMOTIVA 360 — ${nome.toUpperCase()}\n\nNossa missão não é apenas fazer propaganda, mas ser o braço direito de comunicação da ${nome} em ${cid}.\n\nSabemos o quanto vocês prezam pela excelência no dia a dia. Nosso papel é garantir que cada pessoa que pesquisar por ${seg} na região tenha certeza absoluta de que a ${nome} é a melhor escolha.\n\nO que faremos juntos:\n1. Criar um site moderno e acolhedor onde o cliente chama no WhatsApp em um clique;\n2. Posicionar a marca no topo do Google Maps com avaliações de clientes satisfeitos;\n3. Produzir conteúdos e materiais que geram orgulho na equipe e encantam quem compra;\n4. Facilitar o atendimento diário para que vocês fechem mais propostas com menos esforço.\n\nEstamos prontos para caminhar lado a lado com vocês!`,
        };
    }
  }

  // =========================================================================
  // 2. TOM: CONSULTIVO & PARCEIRO REGIONAL (EMPATIA + COOPERAÇÃO)
  // =========================================================================
  if (tom === "consultivo_parceiro") {
    switch (canal) {
      case "whatsapp":
        return {
          ganchoAbertura: `Estudo de mercado sobre ${seg} em ${cid}`,
          dicaEnvio: "Posicione-se como um colega de negócios que tem insights valiosos sobre a cidade.",
          texto: `Oi, [Nome do contato]! Tudo bem por aí?\n\nMe chamo [Seu Nome], atuo com estratégia digital aqui na serra gaúcha com a ${agencia}.\n\nEstava concluindo um levantamento sobre a demanda por ${seg} em ${cid} e identifiquei 2 oportunidades bem interessantes que a ${nome} pode aproveitar para atrair mais orçamentos qualificados direto no WhatsApp.\n\nMontei um resumo bem prático de 2 minutos com essas observações. Se fizer sentido para você, posso te mandar por aqui para você dar uma olhadinha com calma?\n\nUm abraço e boa semana!`,
        };

      case "instagram":
        return {
          ganchoAbertura: `Oportunidade regional para ${nome} em ${cid}`,
          dicaEnvio: "Seja leve e mencione o polo comercial da cidade.",
          texto: `Olá! Como estão as coisas por aí na ${nome}?\n\nSou o [Seu Nome], da ${agencia}. Acompanho o ecossistema de negócios de ${cid} e notei que a procura por ${seg} cresceu bastante na nossa região nos últimos meses.\n\nIdentifiquei alguns pontos simples nos canais que podem ajudar vocês a receberem mais contatos de pessoas prontas para comprar.\n\nQual o melhor WhatsApp de vocês para eu enviar essa análise prática de presente?\n\nAbraços!`,
        };

      case "email":
        return {
          assunto: `Mapeamento de demanda em ${cid} — Oportunidade para a ${nome}`,
          ganchoAbertura: `Compartilhando dados práticos de busca local para o setor de ${seg}`,
          dicaEnvio: "Envie nas terças ou quintas pela manhã para maior taxa de abertura.",
          texto: `Olá, [Nome do contato ou Diretoria da ${nome}],\n\nTudo bem? Espero que esta mensagem encontre você em uma excelente semana.\n\nNossa equipe na ${agencia} desenvolveu recentemente um estudo focado no mercado de ${seg} em ${cid}. Notamos que há uma demanda crescente de clientes pesquisando ativamente por fornecedores locais de confiança.\n\nA ${nome} já possui uma base sólida e boa reputação. Criamos um diagnóstico executivo rápido mostrando como converter esse volume de pesquisas em faturamento previsível:\n\n👉 Acessar Diagnóstico: ${auditLink}\n\nFicaria muito feliz em bater um papo rápido de 10 minutos para trocar experiências sobre o mercado local e apresentar ideias que vocês já podem aplicar.\n\nUm abraço cordial,\n[Seu Nome]\n${agencia} · Parcerias Estratégicas`,
        };

      case "ligacaoReuniao":
        return {
          ganchoAbertura: `Olá! Aqui é o [Seu Nome], da ${agencia}. Estou ligando como parceiro de negócios aqui de ${cid}.`,
          dicaEnvio: "Pergunte como está a demanda da empresa neste mês para abrir diálogo consultivo.",
          texto: `Olá, [Nome do contato]! Tudo bem? Me chamo [Seu Nome], da ${agencia} aqui na serra.\n\nEstou entrando em contato rapidinho porque fizemos um estudo sobre o setor de ${seg} em ${cid} e vimos que vocês têm uma grande oportunidade de captar clientes que hoje pesquisam no Google e acabam caindo em concorrentes vizinhos.\n\nQueria te apresentar 2 ideias muito práticas que podem ajudar vocês a aumentarem a conversão dos orçamentos sem complicação.\n\nVocê teria 10 minutos na quinta ou sexta-feira para batermos esse papo?`,
        };

      case "propostaValor360":
        return {
          ganchoAbertura: `Crescimento conjunto e estruturação estratégica multicanal.`,
          dicaEnvio: "Destaque a segurança de ter uma agência local que entende o sotaque e o mercado gaúcho.",
          texto: `PROPOSTA CONSULTIVA 360 — PARCERIA LOCOMOTIVA & ${nome.toUpperCase()}\n\nNosso objetivo é ser o parceiro que desonera a sua rotina e cuida de ponta a ponta da atração e relacionamento com seus clientes em ${cid}.\n\nAo unificar seu site, Google Maps, catálogo digital e redes sociais sob uma única estratégia, eliminamos o desperdício de tempo e transformamos visitantes curiosos em orçamentos fechados.\n\nEstamos à disposição para alinhar os primeiros passos juntos!`,
        };
    }
  }

  // =========================================================================
  // 3. TOM: DESCONTRAÍDO & CURIOSO (WHATSAPP ÁGIL / ZERO FORMALISMO)
  // =========================================================================
  if (tom === "descontraido_curioso") {
    switch (canal) {
      case "whatsapp":
        return {
          ganchoAbertura: `Pergunta rápida sobre ${seg} em ${cid}`,
          dicaEnvio: "Mensagem curta, que parece digitada na hora no celular. Evite parágrafos longos.",
          texto: `Oi, pessoal da ${nome}! Tudo bem por aí? 👋\n\nUma dúvida rápida: vocês ainda têm agenda/capacidade aberta para atender novos clientes de ${seg} aqui em ${cid} este mês?\n\nEstava dando uma olhada no trabalho de vocês e achei muito bacana! Sou o [Seu Nome], trabalho com captação de clientes na ${agencia} aqui da região, e tive uma sacada bem legal que pode ajudar a conectar mais pessoas prontas para fechar com vocês.\n\nSe tiver 1 minutinho, me dá um alô por aqui para eu te contar! Valeu!`,
        };

      case "instagram":
        return {
          ganchoAbertura: `Muito legal o perfil de vocês!`,
          dicaEnvio: "Tom jovem, animado e direto.",
          texto: `Oi pessoal! Tudo bem? Passando só para elogiar o trabalho de vocês em ${seg}! 👏\n\nSou daqui de ${cid} também e estava pensando em como ajudar mais gente da cidade a conhecer o que vocês fazem.\n\nQuem cuida do comercial de vocês fica por aqui ou tem um Whats direto? Queria mandar uma ideia rápida! Abraço!`,
        };

      case "email":
        return {
          assunto: `Pergunta rápida para a equipe da ${nome} (${cid})`,
          ganchoAbertura: `Uma curiosidade rápida sobre o atendimento de vocês em ${cid}`,
          dicaEnvio: "Texto curto e direto ao ponto.",
          texto: `Oi, [Nome do contato]! Tudo bem?\n\nPassando só para fazer uma pergunta bem direta: vocês têm interesse em receber novos pedidos e orçamentos qualificados de ${seg} aqui em ${cid} neste mês?\n\nIdentifiquei uma oportunidade bacana de posicionamento no Google que pode colocar a ${nome} na frente de dezenas de clientes prontos para fechar.\n\nMontei um link rápido de 1 minuto para você ver:\n👉 ${auditLink}\n\nSe curtir a ideia, me dá um toque por aqui ou no WhatsApp para trocarmos uma ideia rápida!\n\nAbraço,\n[Seu Nome] · ${agencia}`,
        };

      case "ligacaoReuniao":
        return {
          ganchoAbertura: `Oi, [Nome]! Tudo bem? Só uma perguntinha rápida de 30 segundos!`,
          dicaEnvio: "Fale de forma animada e espontânea.",
          texto: `Oi, [Nome]! Tudo bem por aí? Aqui é o [Seu Nome], da ${agencia} em ${cid}. Não quero tomar seu tempo, é só uma pergunta rápida: vocês estão com capacidade para absorver mais clientes de ${seg} agora neste semestre? Porque vi o trabalho de vocês, achei muito bom, e sei exatamente como trazer mais orçamentos para a sua equipe. Topa um áudio rápido no Whats para eu te explicar?`,
        };

      case "propostaValor360":
        return {
          ganchoAbertura: `Marketing leve, inteligente e que traz cliente de verdade.`,
          dicaEnvio: "Foco em simplicidade e agilidade de execução.",
          texto: `PLANO RÁPIDO DE CRESCIMENTO — ${nome.toUpperCase()}\n\nChega de reuniões chatas e planos que nunca saem do papel. A Locomotiva Comunicação entra para fazer acontecer:\n- Botar seu site no ar voando;\n- Fazer o Google Maps tocar seu telefone;\n- Deixar suas redes profissionais e atrativas;\n- Dar ferramentas para sua equipe vender rápido.\n\nVamos nessa?`,
        };
    }
  }

  // =========================================================================
  // 4. TOM: VALORIZAÇÃO DA MARCA & PADRÃO DE EXCELÊNCIA
  // =========================================================================
  if (tom === "valorizacao_marca") {
    switch (canal) {
      case "whatsapp":
        return {
          ganchoAbertura: `O padrão da ${nome} merece uma vitrine digital à altura`,
          dicaEnvio: "Conecte-se com o orgulho do fundador ou sócio pela empresa.",
          texto: `Olá, [Nome do contato]! Tudo bem?\n\nSei o quanto dá trabalho construir e manter uma operação séria em ${seg} com o padrão de qualidade que vocês entregam em ${cid}.\n\nO motivo do meu contato é simples: o serviço de vocês é excelente, e me deu muita vontade de ajudar a presença digital da ${nome} a refletir exatamente esse mesmo nível de autoridade, para que nenhum cliente hesite em pagar o preço justo pelo que vocês fazem.\n\nNa ${agencia}, ajudamos marcas de destaque a se posicionarem como a escolha número um da região.\n\nPodemos conversar 10 minutos para eu te mostrar como valorizar ainda mais a marca de vocês?\n\nUm grande abraço!`,
        };

      case "instagram":
        return {
          ganchoAbertura: `Marca com padrão de excelência em ${cid}`,
          dicaEnvio: "Elogie a apresentação e os diferenciais do produto.",
          texto: `Olá, equipe da ${nome}! Tudo bem? 🌟\n\nAcompanho as postagens de vocês e é visível o quanto vocês prezam pela alta qualidade em ${seg}.\n\nNossa missão na ${agencia} é justamente fazer com que empresas de alto padrão não precisem disputar por preço ou desconto, mas sim sejam reconhecidas pelo seu verdadeiro valor.\n\nSe fizer sentido, adoraria bater um papo rápido com o responsável pelo comercial para compartilhar uma ideia de posicionamento.\n\nParabéns pelo belo trabalho!`,
        };

      case "email":
        return {
          assunto: `Valorização de marca & Posicionamento de autoridade — ${nome} (${cid})`,
          ganchoAbertura: `A qualidade da ${nome} merece liderar a preferência na região`,
          dicaEnvio: "Perfeito para sócios fundadores e diretores de empresas tradicionais.",
          texto: `Olá, [Nome do contato ou Fundadores da ${nome}],\n\nConstruir um negócio respeitado no setor de ${seg} em ${cid} exige anos de consistência, qualidade e confiança.\n\nQuando clientes de maior poder aquisitivo procuram por um serviço como o de vocês, o primeiro lugar onde eles validam a decisão é nos canais digitais. Quando encontram uma vitrine de altíssimo padrão, eles compram pelo valor e pela segurança, sem brigar por descontos.\n\nEstruturamos um estudo detalhado para a ${nome} mostrando como alinhar a identidade visual, o site e a presença local para atrair os clientes mais rentáveis do mercado:\n👉 ${auditLink}\n\nSerá uma honra agendar uma conversa de 15 minutos para apresentar essa visão.\n\nCordialmente,\n[Seu Nome]\n${agencia} · Branding & Estratégia de Alto Padrão`,
        };

      case "ligacaoReuniao":
        return {
          ganchoAbertura: `Olá, [Nome]! Tudo bem? Estou ligando porque vejo a ${nome} como uma referência de qualidade em ${cid}.`,
          dicaEnvio: "Fale com tom respeitoso, calmo e seguro.",
          texto: `Olá, [Nome]! Me chamo [Seu Nome], da ${agencia}. Estou ligando porque acompanho o mercado de ${cid} e vejo a ${nome} como um dos negócios mais sérios em ${seg}. O que nós fazemos na Locomotiva é garantir que essa mesma percepção de alto padrão esteja estampada em todos os pontos de contato com o cliente, para que a empresa possa cobrar o valor justo e atrair o melhor perfil de comprador da região. Você teria 15 minutos nesta semana para trocarmos essa ideia?`,
        };

      case "propostaValor360":
        return {
          ganchoAbertura: `Posicionamento de marca premium e blindagem contra guerra de preços.`,
          dicaEnvio: "Foque em elevação de ticket médio e autoridade no Rio Grande do Sul.",
          texto: `REPOSICIONAMENTO ESTRATÉGICO DE MARCA — ${nome.toUpperCase()}\n\nO cliente moderno decide em 3 segundos se confia ou não em uma empresa. Nosso ecossistema 360 assegura que a ${nome} transmita liderança, sofisticação e solidez em cada detalhe.\n\nEliminamos a necessidade de dar descontos ao criar uma percepção de valor inquestionável em ${cid} e região.`,
        };
    }
  }

  // =========================================================================
  // 5. TOM: DIRETO AO PONTO & GENTIL (EXECUTIVO ÁGIL)
  // =========================================================================
  switch (canal) {
    case "whatsapp":
      return {
        ganchoAbertura: `Oportunidade prática para a ${nome} em ${cid}`,
        dicaEnvio: "Ideal para horários de início de expediente (entre 8h30 e 10h).",
        texto: `Olá, [Nome do contato]! Sei que sua rotina é corrida, então serei bem breve e direto. 😊\n\nSou o [Seu Nome], da ${agencia} aqui da região. Mapeamos que há dezenas de pesquisas mensais no Google em ${cid} buscando por '${seg}' que não estão encontrando a ${nome} nas primeiras posições.\n\nEstruturamos um caminho bem prático para colocar sua empresa no topo dessas buscas e receber esses contatos direto no WhatsApp comercial.\n\nSe você tiver 5 minutos livres nesta semana, me avise por aqui para conversarmos. Abraço e bom trabalho por aí!`,
      };

    case "instagram":
      return {
        ganchoAbertura: `Contato rápido sobre novos clientes em ${cid}`,
        dicaEnvio: "Mensagem objetiva que respeita a caixa de entrada.",
        texto: `Olá, pessoal da ${nome}! Tudo bem?\n\nPassando só para compartilhar que mapeamos uma busca expressiva por ${seg} aqui em ${cid} no Google, e queremos ajudar a direcionar esses orçamentos para vocês.\n\nQual o melhor WhatsApp comercial do responsável para eu enviar os números em 1 minuto?\n\nObrigado!`,
      };

    case "email":
      return {
        assunto: `Demanda de ${seg} em ${cid} — Contato direto ${nome}`,
        ganchoAbertura: `Direto ao ponto: como captar os clientes de ${seg} que buscam no Google em ${cid}`,
        dicaEnvio: "Use bullet points curtos para facilitar a leitura no smartphone.",
        texto: `Olá, [Nome do contato],\n\nSei que seu tempo é valioso, então vou direto ao ponto:\n\nIdentificamos que a ${nome} vem perdendo oportunidades diárias de orçamentos de ${seg} em ${cid} porque seus concorrentes diretos estão ocupando o topo do Google Maps e buscas locais.\n\nMontamos um diagnóstico de 2 minutos mostrando como reverter esse cenário e gerar contatos imediatos no seu WhatsApp:\n👉 ${auditLink}\n\nSe fizer sentido, me avise para agendarmos uma rápida ligação de 10 minutos.\n\nAtenciosamente,\n[Seu Nome]\n${agencia}`,
      };

    case "ligacaoReuniao":
      return {
        ganchoAbertura: `Olá, [Nome]! Prometo ser breve, tenho apenas um dado rápido sobre ${cid} para te passar.`,
        dicaEnvio: "Respeite o tempo do empresário. Se disser que está ocupado, pergunte o melhor horário.",
        texto: `Olá, [Nome]! Me chamo [Seu Nome], da ${agencia}. Prometo ser bem rápido para não atrapalhar seu dia: estamos ajudando empresas de ${seg} aqui em ${cid} a captarem clientes que pesquisam no Google todo dia. Vimos que a ${nome} tem potencial para dobrar os contatos que recebe pelo WhatsApp. Você tem 5 minutos na quinta-feira para eu te mostrar como funciona na prática?`,
      };

    case "propostaValor360":
      return {
        ganchoAbertura: `Velocidade de execução e foco estrito em aumento de orçamentos.`,
        dicaEnvio: "Apresente números e prazo de retorno.",
        texto: `PROPOSTA EXECUTIVA DE RETORNO RÁPIDO — ${nome.toUpperCase()}\n\nSolução enxuta, sem burocracia e com início imediato para colocar a ${nome} no topo das pesquisas locais e estruturar o atendimento digital em até 14 dias úteis.`,
      };
  }
}

/**
 * Retorna a dica prática de envio estratégico para o canal e tom selecionados.
 */
export function obterDicaAbordagem(canal: CanalAbordagemTipo, tom: TomAbordagemId): string {
  const mockEmpresa: EmpresaCtx = {
    nome: "Empresa",
    segmento: "Serviços",
    cidade: "sua cidade",
    statusSite: "sem_site",
    statusInstagram: "inativo",
    score: 50,
  };
  const pronto = gerarTextoProntoPorTom(mockEmpresa, canal, tom, "Locomotiva Comunicação");
  return pronto.dicaEnvio;
}

/**
 * Formata o texto final para exibição no textarea, incluindo linha de Assunto se for e-mail.
 */
export function formatarTextoAbordagem(canal: CanalAbordagemTipo, pronto: { texto: string; assunto?: string }): string {
  if (canal === "email" && pronto.assunto) {
    return `Assunto: ${pronto.assunto}\n\n${pronto.texto}`;
  }
  return pronto.texto;
}
