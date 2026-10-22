import type { EmpresaCtx } from "./ai.functions";

export type TomAbordagemId =
  | "primeiro_contato_pdf"
  | "amigavel_elogio"
  | "consultivo_parceiro"
  | "descontraido_curioso"
  | "valorizacao_marca"
  | "direto_gentil"
  | "ajuda_desinteressada"
  | "indicacao_comunidade"
  | "demanda_aquecida"
  | "diagnostico_amigo"
  | "humanizado_historias";

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
    id: "primeiro_contato_pdf",
    nome: "1. Primeiro Contato (Levantamento em PDF)",
    subtitulo: "Abertura respeitosa com palavras-chave do diagnóstico e envio de PDF",
    descricao: "Zero bajulação, sem emojis e sem travessões. Cita pesquisas reais da cidade e pede permissão para enviar o levantamento em PDF.",
    icone: "FileText",
    tagline: "Recomendado para 1º Contato",
    canalRecomendado: "WhatsApp & E-mail",
    badgeCls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  },
  {
    id: "amigavel_elogio",
    nome: "2. Amigável & Reconhecimento Local",
    subtitulo: "Rapport caloroso e consideração pela atuação do cliente",
    descricao: "Menciona a atuação da empresa no setor sem bajulação forçada, quebrando a barreira inicial com simpatia e respeito.",
    icone: "Sparkles",
    tagline: "Rapport Acolhedor",
    canalRecomendado: "WhatsApp & Instagram Direct",
    badgeCls: "bg-teal-500/10 text-teal-600 border-teal-500/30",
  },
  {
    id: "consultivo_parceiro",
    nome: "3. Consultivo & Parceiro Regional",
    subtitulo: "Troca de ideias entre empreendedores da mesma região",
    descricao: "Postura de parceiro estratégico que identificou oportunidades de mercado na região e quer compartilhar insights sem forçar venda.",
    icone: "Users",
    tagline: "Alta Autoridade",
    canalRecomendado: "WhatsApp, E-mail & Reunião",
    badgeCls: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  },
  {
    id: "descontraido_curioso",
    nome: "3. Descontraído & Café Rápido",
    subtitulo: "Linguagem leve e natural, zero jargões corporativos",
    descricao: "Tom de conversa informal como um conhecido puxando assunto. Gera alta taxa de resposta por parecer 100% humano.",
    icone: "MessageCircle",
    tagline: "Conversão Rápida",
    canalRecomendado: "WhatsApp & Direct",
    badgeCls: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  },
  {
    id: "valorizacao_marca",
    nome: "4. Valorização & Padrão de Excelência",
    subtitulo: "Apelo ao orgulho da empresa e fim da briga por preço",
    descricao: "Reconhece o esforço em construir um negócio de qualidade e propõe alinhar a vitrine digital para que o cliente pague o valor justo.",
    icone: "Target",
    tagline: "Ticket Alto / B2B",
    canalRecomendado: "E-mail, Proposta & WhatsApp",
    badgeCls: "bg-purple-500/10 text-purple-600 border-purple-500/30",
  },
  {
    id: "direto_gentil",
    nome: "5. Direto ao Ponto & Gentil",
    subtitulo: "Objetivo, educado e focado no tempo escasso do decisor",
    descricao: "Vai direto à oportunidade de novos clientes, mas com máxima cordialidade e consideração pela rotina corrida do empresário.",
    icone: "Zap",
    tagline: "Decisores Ocupados",
    canalRecomendado: "WhatsApp & Ligação Rápida",
    badgeCls: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30",
  },
  {
    id: "ajuda_desinteressada",
    nome: "6. Ajuda Desinteressada & Cortesia",
    subtitulo: "Entrega uma dica prática de imediato sem pedir nada em troca",
    descricao: "Oferece uma melhoria simples e útil nos canais atuais do cliente. Mostra generosidade profissional e gera reciprocidade imediata.",
    icone: "Gift",
    tagline: "Gera Reciprocidade",
    canalRecomendado: "Direct Instagram & WhatsApp",
    badgeCls: "bg-teal-500/10 text-teal-600 border-teal-500/30",
  },
  {
    id: "indicacao_comunidade",
    nome: "7. Indicação & Conexão Local",
    subtitulo: "Abordagem com base na proximidade e força da comunidade",
    descricao: "Cita a presença marcante da empresa no bairro ou cidade. Aproxima os laços como conterrâneo que valoriza o comércio e serviços locais.",
    icone: "MapPin",
    tagline: "Relação Comunitária",
    canalRecomendado: "WhatsApp & Ligação",
    badgeCls: "bg-rose-500/10 text-rose-600 border-rose-500/30",
  },
  {
    id: "demanda_aquecida",
    nome: "8. Demanda Aquecida & Tendência",
    subtitulo: "Compartilha buscas reais e volume de clientes em alta na cidade",
    descricao: "Apresenta dados de pessoas pesquisando ativamente por aquele produto ou serviço na região e mostra como captar esses clientes.",
    icone: "TrendingUp",
    tagline: "Foco em Vendas",
    canalRecomendado: "WhatsApp & E-mail",
    badgeCls: "bg-indigo-500/10 text-indigo-600 border-indigo-500/30",
  },
  {
    id: "diagnostico_amigo",
    nome: "9. Diagnóstico Amigo & Construtivo",
    subtitulo: "Sugestão amigável para não perder contatos no WhatsApp",
    descricao: "Alerta com simpatia sobre um detalhe no perfil ou na busca local que pode estar deixando dinheiro na mesa, como um amigo aconselhando.",
    icone: "CheckCircle",
    tagline: "Anti-Bloqueio",
    canalRecomendado: "WhatsApp & Instagram Direct",
    badgeCls: "bg-cyan-500/10 text-cyan-600 border-cyan-500/30",
  },
  {
    id: "humanizado_historias",
    nome: "10. Humanizado & Histórias Reais",
    subtitulo: "Foco nas pessoas por trás do negócio e atendimento acolhedor",
    descricao: "Destaca o atendimento humanizado que a empresa já tem no presencial e sugere levar esse mesmo carinho para o ambiente digital.",
    icone: "Heart",
    tagline: "Conexão Emocional",
    canalRecomendado: "Instagram Direct & WhatsApp",
    badgeCls: "bg-pink-500/10 text-pink-600 border-pink-500/30",
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

  const termosArray = (empresa.termosEncontrados || empresa.buscasPartida || "")
    .split(/[\n,;]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  const termo1 = termosArray[0] || `${seg} em ${cid}`;
  const termo2 = termosArray[1] || `${seg} na região`;

  // =========================================================================
  // 1. TOM: PRIMEIRO CONTATO (LEVANTAMENTO EM PDF) - RECOMENDADO BASE
  // =========================================================================
  if (tom === "primeiro_contato_pdf") {
    switch (canal) {
      case "whatsapp":
        return {
          ganchoAbertura: `Levantamento de busca por ${termo1} em ${cid}`,
          dicaEnvio: "Envie no horário comercial. Texto sóbrio e sem emojis. Ao receber confirmação, envie o PDF gerado nos slides.",
          texto: `Olá, tudo bem?\n\nMe chamo [Seu Nome], atuo com análise de mercado na ${agencia} aqui na Serra Gaúcha.\n\nEstávamos concluindo um levantamento sobre a procura no Google por '${termo1}' e '${termo2}' em ${cid}, e acompanhando as empresas do setor, identifiquei a atuação da ${nome}.\n\nMapeamos como os clientes da nossa região estão pesquisando esses serviços hoje e reunimos essas observações em um documento resumido em PDF, com dados práticos sobre a presença digital e a demanda do setor.\n\nPosso te enviar o arquivo por aqui para você dar uma olhada quando tiver um momento?\n\nUm abraço,\n[Seu Nome]\n${agencia}`,
        };

      case "instagram":
        return {
          ganchoAbertura: `Levantamento de procura por ${termo1} em ${cid}`,
          dicaEnvio: "Mensagem direta no direct, convidando educadamente para o envio do PDF no WhatsApp.",
          texto: `Olá, tudo bem?\n\nSou o [Seu Nome], da ${agencia} aqui na serra. Concluímos recentemente um levantamento sobre a procura no Google por '${termo1}' em ${cid} e reunimos os dados em um PDF com a análise de presença digital do setor.\n\nQual seria o melhor WhatsApp de vocês para eu te enviar esse material para darem uma olhada?\n\nUm abraço,\n[Seu Nome]`,
        };

      case "email":
        return {
          assunto: `Levantamento de busca local em ${cid}: procura por ${termo1} e presença digital da ${nome}`,
          ganchoAbertura: `Levantamento sobre a busca por ${termo1} em ${cid}`,
          dicaEnvio: "Anexe o PDF da apresentação de slides no e-mail ou proponha o envio.",
          texto: `Olá, tudo bem com você?\n\nMe chamo [Seu Nome] e atuo na área de inteligência de mercado da ${agencia}, aqui na Serra Gaúcha.\n\nNossa equipe concluiu recentemente um estudo sobre o comportamento de busca dos clientes de ${cid} que procuram por '${termo1}' e '${termo2}' no Google. Durante o mapeamento das empresas da região, analisamos a presença digital da ${nome}.\n\nSintetizamos os principais dados em um relatório resumido em PDF, mostrando os termos mais pesquisados e oportunidades claras para melhorar a visibilidade e o canal de atendimento no WhatsApp.\n\nPosso te enviar esse arquivo por aqui ou por WhatsApp para você avaliar com a sua equipe?\n\nAtenciosamente,\n[Seu Nome]\n${agencia} - Serra Gaúcha`,
        };

      case "ligacaoReuniao":
        return {
          ganchoAbertura: `Olá, tudo bem? Me chamo [Seu Nome], da ${agencia}.`,
          dicaEnvio: "Fale com clareza e ritmo pausado ao telefone.",
          texto: `Olá, tudo bem? Meu nome é [Seu Nome], da ${agencia} aqui na região. Estou ligando com brevidade porque concluímos um levantamento sobre a procura por '${termo1}' no Google aqui em ${cid}. Mapeamos como os clientes estão pesquisando e reunimos esses dados em um documento resumido em PDF. Gostaria de confirmar o seu melhor e-mail ou WhatsApp para eu te enviar esse material sem compromisso.`,
        };

      case "propostaValor360":
        return {
          ganchoAbertura: `Levantamento de presença digital e posicionamento estratégico da ${nome}`,
          dicaEnvio: "Apresentação consultiva para envio junto ao PDF oficial.",
          texto: `LEVANTAMENTO ESTRATÉGICO DE PRESENÇA DIGITAL\nEMPRESA: ${nome.toUpperCase()} (${cid}/RS)\n\nEste documento reúne a análise técnica da presença digital e a demanda de busca mapeada para '${termo1}' e '${termo2}' no Google na região da Serra Gaúcha, com recomendações práticas para estruturação do canal comercial e atração de novos clientes.`,
        };
    }
  }
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
  // 3. TOM: DESCONTRAÍDO & CAFÉ RÁPIDO (LEVE / ESPONTÂNEO)
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
  if (tom === "direto_gentil") {
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

  // =========================================================================
  // 6. TOM: AJUDA DESINTERESSADA & CORTESIA
  // =========================================================================
  if (tom === "ajuda_desinteressada") {
    switch (canal) {
      case "whatsapp":
        return {
          ganchoAbertura: `Uma dica simples que notei no perfil da ${nome} em ${cid}`,
          dicaEnvio: "Excelente para criar confiança imediata, pois você ajuda primeiro sem cobrar nada.",
          texto: `Olá, pessoal da ${nome}! Tudo bem? Me chamo [Seu Nome], da ${agencia} aqui da serra.\n\nEstava navegando no Google procurando empresas de ${seg} em ${cid} e notei um detalhe simples no perfil de vocês que pode estar fazendo alguns clientes desistirem antes de chamar no Whats.\n\nComo trabalho com isso todo dia, gravei uma dica prática de 40 segundos mostrando como ajustar isso em 2 minutos, sem custo nenhum.\n\nPosso te mandar aqui? É de coração, só para ajudar mesmo!\n\nAbraço e ótimo trabalho!`,
        };

      case "instagram":
        return {
          ganchoAbertura: `Uma dica rápida sobre o link do perfil de vocês!`,
          dicaEnvio: "Aponte um ajuste real (ex: link direto de WhatsApp ou biografia).",
          texto: `Oi, pessoal da ${nome}! Tudo bem? Adoro o trabalho de vocês!\n\nNotei um detalhe técnico bem simples no link de atendimento aqui do Instagram que às vezes trava o clique de quem tenta chamar pelo celular.\n\nTenho um passo a passo de 1 minuto para corrigir isso bem rápido. Posso te mandar por aqui? Fico feliz em ajudar!\n\nAbraços!`,
        };

      case "email":
        return {
          assunto: `Dica de cortesia para a equipe da ${nome} (${cid})`,
          ganchoAbertura: `Um ajuste simples para não perder orçamentos pelo smartphone`,
          dicaEnvio: "Compartilhe uma vitória rápida logo no primeiro e-mail.",
          texto: `Olá, equipe da ${nome},\n\nTudo bem? Meu nome é [Seu Nome], da ${agencia}.\n\nEstive pesquisando sobre ${seg} em ${cid} e notei uma pequena melhoria no direcionamento de contatos da ${nome} que pode aumentar imediatamente o número de orçamentos recebidos.\n\nPreparamos esse diagnóstico completo e gratuito para vocês:\n👉 ${auditLink}\n\nFiquem à vontade para aplicar internamente. Se precisarem de qualquer ajuda ou quiserem tirar dúvidas, estou 100% à disposição.\n\nUm grande abraço,\n[Seu Nome] · ${agencia}`,
        };

      case "ligacaoReuniao":
        return {
          ganchoAbertura: `Olá, [Nome]! Estou ligando só para te passar uma dica rápida que vi sobre ${cid}.`,
          dicaEnvio: "Não tente vender na ligação. Apenas entregue a dica e se coloque à disposição.",
          texto: `Olá, [Nome]! Tudo bem? Me chamo [Seu Nome], da ${agencia}. Não estou ligando para te vender nada, só queria te avisar de um detalhe rápido que vi no cadastro da ${nome} no Google Maps que pode estar impedindo clientes de ligarem diretamente para vocês. Você prefere que eu te mande o print pelo WhatsApp para você ajustar com a sua equipe?`,
        };

      case "propostaValor360":
        return {
          ganchoAbertura: `Generosidade profissional e parceria contínua sem letras miúdas.`,
          dicaEnvio: "Enfatize suporte próximo e consultoria amiga.",
          texto: `PARCERIA DE SUPORTE E CRESCIMENTO — ${nome.toUpperCase()}\n\nMais do que fornecedores, somos conselheiros de comunicação que cuidam para que cada ponto de contato da ${nome} funcione perfeitamente, gerando confiança e novos clientes todos os dias.`,
        };
    }
  }

  // =========================================================================
  // 7. TOM: INDICAÇÃO & CONEXÃO LOCAL
  // =========================================================================
  if (tom === "indicacao_comunidade") {
    switch (canal) {
      case "whatsapp":
        return {
          ganchoAbertura: `Conexão local aqui em ${cid} — Trabalho da ${nome}`,
          dicaEnvio: "Cite o orgulho da cidade e a importância de fortalecer empresas locais.",
          texto: `Olá, [Nome do contato]! Tudo bem? Me chamo [Seu Nome], sou daqui da região e atuo com comunicação na ${agencia}.\n\nSempre vejo o nome da ${nome} sendo mencionado quando o assunto é ${seg} aqui em ${cid}. Como conterrâneo, fico muito feliz em ver negócios sérios prosperando na nossa cidade.\n\nEstive pensando em algumas ideias locais para fortalecer ainda mais essa presença entre os moradores e condomínios da região.\n\nSe tiver um minutinho livre, adoraria te mandar um áudio rápido para me apresentar e compartilhar essas ideias. Pode ser?\n\nUm abraço fraterno!`,
        };

      case "instagram":
        return {
          ganchoAbertura: `Mais um fã do trabalho de vocês aqui de ${cid}!`,
          dicaEnvio: "Aproxime-se como cliente e vizinho comercial da cidade.",
          texto: `Olá, vizinhos da ${nome}! Tudo bem? 😊\n\nSou daqui de ${cid} também e acompanho a evolução de vocês em ${seg}. Muito bacana ver a empresa crescendo com tanta dedicação!\n\nDepois me passem o WhatsApp de vocês para eu dar um oi e trocar umas ideias com o time comercial.\n\nSucesso sempre por aqui!`,
        };

      case "email":
        return {
          assunto: `Parceria local em ${cid} — Fortalecendo a ${nome}`,
          ganchoAbertura: `Valorizando o comércio e os serviços tradicionais da nossa cidade`,
          dicaEnvio: "Use linguagem respeitosa que ressalte o sentimento de comunidade gaúcha.",
          texto: `Prezados amigos da ${nome},\n\nComo moradores e empreendedores da nossa querida região de ${cid}, acompanhamos com muito orgulho a trajetória de vocês em ${seg}.\n\nSabemos que a melhor indicação é a de quem confia no trabalho local. Por isso, estruturamos uma estratégia comunitária que conecta a ${nome} com quem procura por serviços de excelência na cidade:\n👉 ${auditLink}\n\nSerá uma grande honra tomar um café e estreitar laços com a equipe de vocês.\n\nUm abraço cordial,\n[Seu Nome]\n${agencia} · Valorizando Nossa Terra`,
        };

      case "ligacaoReuniao":
        return {
          ganchoAbertura: `Olá, [Nome]! Sou daqui de ${cid} e liguei para prestigiar o trabalho da ${nome}.`,
          dicaEnvio: "Fale com acolhimento e sotaque regional caloroso.",
          texto: `Olá, [Nome]! Tudo bem? Me chamo [Seu Nome], sou daqui de ${cid} e trabalho na ${agencia}. Liguei rapidinho para parabenizar vocês pelo trabalho em ${seg} e comentar uma ideia bacana para valorizar ainda mais a marca de vocês entre os clientes aqui da nossa cidade. Podemos tomar um café nesta semana para nos conhecermos pessoalmente?`,
        };

      case "propostaValor360":
        return {
          ganchoAbertura: `Fortalecimento da marca regional com raízes profundas na comunidade.`,
          dicaEnvio: "Destaque a identificação cultural com o público da Serra Gaúcha.",
          texto: `ESTRATÉGIA DE LIDERANÇA REGIONAL — ${nome.toUpperCase()}\n\nConsolidação da ${nome} como a principal autoridade e referência afetiva em ${cid}, unindo o orgulho local com o que há de mais moderno em tecnologia e comunicação.`,
        };
    }
  }

  // =========================================================================
  // 8. TOM: DEMANDA AQUECIDA & TENDÊNCIA LOCAL
  // =========================================================================
  if (tom === "demanda_aquecida") {
    switch (canal) {
      case "whatsapp":
        return {
          ganchoAbertura: `Alta procura por ${seg} em ${cid} esta semana`,
          dicaEnvio: "Apresente números concretos de intenção de busca para chamar a atenção comercial.",
          texto: `Oi, [Nome do contato]! Tudo bem?\n\nPassando com um dado fresco que pode te interessar: mapeamos que nas últimas 4 semanas houve um aumento de mais de 35% nas buscas no Google por '${seg}' aqui em ${cid} e arredores.\n\nHoje grande parte dessas pessoas não encontra a ${nome} logo de cara, e nós temos a estrutura pronta para canalizar esses orçamentos diretamente para o seu WhatsApp comercial.\n\nQuer dar uma olhada nos dados que levantamos? Posso te mandar em 1 minuto por aqui.\n\nAbraço e boas vendas!`,
        };

      case "instagram":
        return {
          ganchoAbertura: `Clientes procurando por ${seg} em ${cid}!`,
          dicaEnvio: "Use emojis dinâmicos e mostre senso de oportunidade.",
          texto: `Olá, pessoal da ${nome}! Tudo certo? 🚀\n\nIdentificamos uma procura muito aquecida por ${seg} aqui em ${cid} nos últimos dias, e achamos que vocês deveriam estar recebendo a maioria desses contatos.\n\nQual o melhor Whats para eu mandar os dados desse levantamento para vocês?\n\nAbraços!`,
        };

      case "email":
        return {
          assunto: `Relatório de Demanda: Procura por ${seg} em alta em ${cid}`,
          ganchoAbertura: `Mais de 100 buscas locais mapeadas para o seu segmento neste mês`,
          dicaEnvio: "Excelente para equipes de vendas e diretores comerciais.",
          texto: `Olá, [Nome do contato ou Equipe Comercial],\n\nTudo bem? Nosso núcleo de inteligência de mercado na ${agencia} identificou um volume expressivo de buscas ativas por ${seg} em ${cid}.\n\nElaboramos um comparativo prático mostrando para onde esses clientes estão indo e como posicionar a ${nome} para absorver essa fatia de mercado:\n👉 ${auditLink}\n\nPodemos fazer um alinhamento rápido de 10 minutos para mostrar como captar essa demanda?\n\nAtenciosamente,\n[Seu Nome]\n${agencia} · Inteligência de Mercado`,
        };

      case "ligacaoReuniao":
        return {
          ganchoAbertura: `Olá, [Nome]! Tenho um número importante sobre a busca de ${seg} em ${cid} para te compartilhar.`,
          dicaEnvio: "Vá direto ao ponto sobre o aumento de procura na cidade.",
          texto: `Olá, [Nome]! Me chamo [Seu Nome], da ${agencia}. Estou ligando rapidinho porque fechamos hoje um relatório sobre ${cid} e vimos que a procura por ${seg} está batendo recorde no Google. A ${nome} tem hoje capacidade para atender mais pedidos se esses clientes chegarem no seu Whats? Queria te mostrar como capturar essa demanda em 10 minutos de conversa.`,
        };

      case "propostaValor360":
        return {
          ganchoAbertura: `Captação massiva da demanda reprimida com retorno sobre investimento mensurável.`,
          dicaEnvio: "Apresente projeções de orçamentos e conversão.",
          texto: `ACELERAÇÃO DE VENDAS 360 — ${nome.toUpperCase()}\n\nCaptura ativa da demanda reprimida em ${cid}, posicionando a ${nome} no topo de todos os mecanismos de busca e transformando tráfego em orçamentos fechados de forma contínua.`,
        };
    }
  }

  // =========================================================================
  // 9. TOM: DIAGNÓSTICO AMIGO & CONSTRUTIVO
  // =========================================================================
  if (tom === "diagnostico_amigo") {
    switch (canal) {
      case "whatsapp":
        return {
          ganchoAbertura: `Um detalhe rápido sobre o WhatsApp da ${nome} no Google`,
          dicaEnvio: "Aborde com sinceridade de quem encontrou um obstáculo real e quer ajudar.",
          texto: `Oi, [Nome do contato]! Tudo bem?\n\nFui pesquisar o contato da ${nome} hoje cedo e reparei que o botão de ligação/WhatsApp no Google não está abrindo direto no celular de primeira.\n\nComo vocês têm um trabalho muito bom em ${seg}, fiquei preocupado de vocês estarem perdendo orçamentos por uma bobagem técnica simples de arrumar.\n\nSe você quiser, posso te mandar um print mostrando o que está acontecendo e como resolver rapidinho.\n\nUm abraço e parabéns pelo negócio!`,
        };

      case "instagram":
        return {
          ganchoAbertura: `Aviso amigo sobre o contato de vocês!`,
          dicaEnvio: "Tom de alerta camarada e solícito.",
          texto: `Olá, pessoal da ${nome}! Tudo bem? 😊\n\nTentei achar o contato de vocês no Google para tirar uma dúvida e percebi que o link está direcionando para uma página quebrada. Queria avisar para vocês não perderem vendas!\n\nMe dá um alô no Whats para eu te mandar o print se ajudar!\n\nAbraço!`,
        };

      case "email":
        return {
          assunto: `Aviso importante sobre os canais de contato da ${nome} em ${cid}`,
          ganchoAbertura: `Identificamos uma falha no fluxo de atendimento que pode ser corrigida em minutos`,
          dicaEnvio: "Mostre que a intenção é proteger o faturamento da empresa.",
          texto: `Olá, [Nome do contato],\n\nTudo bem? Durante uma checagem técnica de rotina no mercado de ${seg} em ${cid}, notamos que o canal principal de contato da ${nome} está com uma instabilidade técnica que dificulta o clique do cliente no smartphone.\n\nDocumentamos o diagnóstico completo e a solução passo a passo aqui:\n👉 ${auditLink}\n\nEsperamos que seja útil para a equipe de vocês!\n\nCordialmente,\n[Seu Nome] · ${agencia}`,
        };

      case "ligacaoReuniao":
        return {
          ganchoAbertura: `Olá, [Nome]! Liguei só para te avisar de um detalhe no número de vocês no Google.`,
          dicaEnvio: "Mantenha postura amiga e tranquila.",
          texto: `Olá, [Nome]! Me chamo [Seu Nome], da ${agencia}. Liguei só para te avisar com carinho que o link de WhatsApp da ${nome} no Google Maps está falhando quando alguém clica pelo celular. Achei importante te dar esse toque para vocês não perderem clientes. Você já estava sabendo disso?`,
        };

      case "propostaValor360":
        return {
          ganchoAbertura: `Blindagem técnica e otimização total de canais para conversão máxima.`,
          dicaEnvio: "Apresente auditoria técnica preventiva.",
          texto: `BLINDAGEM E OTIMIZAÇÃO DE CANAIS 360 — ${nome.toUpperCase()}\n\nEliminação de todos os atritos técnicos que fazem o cliente desistir da compra. Garantia de que cada clique vire uma conversa com a sua equipe comercial.`,
        };
    }
  }

  // =========================================================================
  // 10. TOM: HUMANIZADO & HISTÓRIAS REAIS
  // =========================================================================
  switch (canal) {
    case "whatsapp":
      return {
        ganchoAbertura: `A história e o carinho da equipe da ${nome} em ${cid}`,
        dicaEnvio: "Conecte-se com o fator humano, a dedicação da equipe e a confiança dos clientes.",
        texto: `Olá, pessoal da ${nome}! Tudo bem com vocês? ❤️\n\nEstava admirando a trajetória de vocês e é muito bonito ver o carinho e o atendimento humano que vocês oferecem aos clientes de ${seg} aqui em ${cid}.\n\nHoje em dia o mercado anda tão frio e robotizado que empresas com esse toque acolhedor são verdadeiras preciosidades.\n\nNós na ${agencia} adoramos contar essas histórias reais para que mais pessoas da cidade conheçam quem está por trás desse trabalho incrível.\n\nPosso te mandar um áudio de 1 minutinho para trocarmos uma ideia sobre isso? Seria um prazer!\n\nUm abraço afetuoso a toda equipe!`,
      };

    case "instagram":
      return {
        ganchoAbertura: `Adoro ver a energia da equipe de vocês!`,
        dicaEnvio: "Elogie as pessoas da equipe que aparecem nas postagens.",
        texto: `Olá, time da ${nome}! Que energia linda no perfil de vocês! 👏\n\nDá para sentir de longe a paixão e o cuidado com que vocês atendem cada cliente em ${cid}.\n\nQueremos muito somar para que mais pessoas da serra conheçam essa história!\n\nUm grande abraço de todos nós da ${agencia}!`,
      };

    case "email":
      return {
        assunto: `A história da ${nome} inspira quem empreende em ${cid}`,
        ganchoAbertura: `Humanização que gera confiança e fidelidade no setor de ${seg}`,
        dicaEnvio: "Foque em branding humanizado e conexão com as famílias da região.",
        texto: `Olá, fundadores e equipe da ${nome},\n\nEm um mundo onde tudo parece impessoal e automatizado, empresas que mantêm o compromisso com o calor humano e a excelência no atendimento são raras.\n\nAcompanhamos a dedicação com que vocês tratam os clientes de ${seg} em ${cid}. Nossa proposta na ${agencia} é amplificar essa verdade, criando uma comunicação que emociona e gera fidelidade de longo prazo:\n👉 ${auditLink}\n\nSeria um privilégio conhecer melhor a história de vocês em um café descontraído.\n\nCom carinho e respeito,\n[Seu Nome]\n${agencia} · Comunicação Humanizada`,
      };

    case "ligacaoReuniao":
      return {
        ganchoAbertura: `Olá, [Nome]! Liguei porque me encantei com a dedicação da equipe de vocês em ${cid}.`,
        dicaEnvio: "Fale com entusiasmo e admiração sincera pelas pessoas do time.",
        texto: `Olá, [Nome]! Me chamo [Seu Nome], da ${agencia}. Liguei para te dar os parabéns pela forma acolhedora com que vocês atendem as pessoas aqui em ${cid}. Dá para ver que não é só um negócio, é um propósito de vida. Eu queria muito te apresentar uma ideia para valorizar essa história no digital. Topa bater um papo rápido nesta semana?`,
      };

    case "propostaValor360":
      return {
        ganchoAbertura: `Comunicação centrada em pessoas que constrói marcas inesquecíveis.`,
        dicaEnvio: "Foque em autoridade afetiva e retenção de clientes por recomendação.",
        texto: `COMUNICAÇÃO AFETIVA & POSICIONAMENTO 360 — ${nome.toUpperCase()}\n\nPessoas compram de pessoas em quem confiam. Conectamos a autenticidade e o calor humano da ${nome} com uma estrutura digital impecável para encantar e fidelizar os melhores clientes de ${cid}.`,
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
