import type { Empresa } from "./mock-data";
import { classificarScore } from "./scoring";

export interface InsightBlock {
  resumo: string;
  falhas: string[];
  riscos: string[];
  oportunidades: string[];
  argumentos: string[];
}

export function gerarInsights(e: Empresa): InsightBlock {
  const d = e.diagnostico;
  const falhas: string[] = [];
  const riscos: string[] = [];
  const oportunidades: string[] = [];
  const argumentos: string[] = [];

  if (e.statusSite === "sem_site") {
    falhas.push("Não possui site próprio ativo.");
    riscos.push("Perde credibilidade frente a concorrentes com presença digital.");
    oportunidades.push("Criação de site institucional com foco em conversão.");
    argumentos.push(
      `Empresas do segmento ${e.segmento} em ${e.cidade} que possuem site convertem mais orçamentos qualificados.`,
    );
  }
  if (e.statusSite === "desatualizado") {
    falhas.push("Site com aparência antiga e sinais de baixa manutenção.");
    riscos.push("Transmite descuido e afasta público mais jovem/exigente.");
    oportunidades.push("Redesign com foco em identidade visual e mobile.");
  }
  if (e.statusSite === "sem_ssl") {
    falhas.push("Site sem HTTPS — navegador exibe aviso de 'não seguro'.");
    riscos.push("Queda em ranqueamento no Google e abandono imediato de visitantes.");
  }
  if (e.statusSite === "nao_responsivo" || !d.site.responsivo) {
    falhas.push("Site não adapta a dispositivos móveis.");
    riscos.push("Perde a maioria dos acessos, que hoje vêm do celular.");
  }
  if (!d.atendimento.contatoFacil) {
    falhas.push("Canais de contato pouco visíveis ou incompletos.");
    oportunidades.push("Padronizar WhatsApp Business e ficha do Google Meu Negócio.");
  }
  if (d.instagram.diasDesdeUltimoPost === null) {
    falhas.push("Sem perfil no Instagram identificado.");
    oportunidades.push("Estruturar presença inicial no Instagram com pilares de conteúdo.");
  } else if ((d.instagram.diasDesdeUltimoPost ?? 0) > 90) {
    falhas.push(
      `Instagram parado há ~${d.instagram.diasDesdeUltimoPost} dias.`,
    );
    riscos.push("Público interpreta como negócio inativo ou fechado.");
    oportunidades.push("Retomada com calendário editorial e identidade visual definida.");
  }
  if (!d.instagram.bioForte && d.instagram.diasDesdeUltimoPost !== null) {
    falhas.push("Bio genérica, sem posicionamento claro nem link estratégico.");
  }
  if (!d.atendimento.provaSocial) {
    oportunidades.push("Incluir depoimentos, portfólio e prova social.");
  }
  if (!d.atendimento.clarezaServicos) {
    oportunidades.push("Reescrever comunicação com clareza sobre serviços e diferenciais.");
  }

  const cls = classificarScore(e.score);
  const resumo =
    `${e.nome}, do segmento ${e.segmento} em ${e.cidade}, apresenta ` +
    `${cls.label.toLowerCase()} (score ${e.score}). ` +
    (falhas.length
      ? `Principais gaps identificados: ${falhas.slice(0, 2).join(" ")}`
      : "Presença digital consistente, com poucos gaps evidentes.");

  argumentos.push(
    "Abordagem consultiva, mostrando 2 ou 3 melhorias específicas antes de propor projeto.",
  );
  if (e.statusSite === "sem_site" && e.instagram) {
    argumentos.push(
      "Já existe audiência no Instagram — um site amplifica captação e credibilidade.",
    );
  }

  return {
    resumo,
    falhas: falhas.length ? falhas : ["Sem gaps críticos evidentes na análise atual."],
    riscos: riscos.length ? riscos : ["Risco de estagnação frente a concorrentes que investem em digital."],
    oportunidades: oportunidades.length
      ? oportunidades
      : ["Otimizações finas de conversão e conteúdo."],
    argumentos,
  };
}

export type Tom = "consultivo" | "formal" | "amistoso" | "direto";
export type Canal = "whatsapp" | "email" | "instagram" | "ligacao" | "curta";
export type Foco = "site" | "instagram" | "atendimento" | "geral";

export function gerarAbordagem(
  e: Empresa,
  canal: Canal,
  tom: Tom,
  foco: Foco,
): string {
  const nome = e.nome;
  const cidade = e.cidade;
  const primeiroNome = "[Nome do contato]";
  const agencia = "[Nome da sua agência]";

  const abertura: Record<Tom, string> = {
    consultivo: `Olá, ${primeiroNome}! Tudo bem?`,
    formal: `Prezado(a) ${primeiroNome}, boa tarde.`,
    amistoso: `Oi, ${primeiroNome}! Espero que esteja bem 😊`,
    direto: `Oi, ${primeiroNome}.`,
  };

  const gancho: Record<Foco, string> = {
    site:
      e.statusSite === "sem_site"
        ? `Vi que a ${nome} atende em ${cidade} mas ainda não tem um site próprio ativo.`
        : `Dei uma olhada no site da ${nome} e notei alguns pontos que estão custando conversões.`,
    instagram:
      e.diagnostico.instagram.diasDesdeUltimoPost === null
        ? `Reparei que a ${nome} ainda não tem uma presença estruturada no Instagram.`
        : `Passei no Instagram da ${nome} e percebi que dá para transformá-lo em um canal muito mais forte de captação.`,
    atendimento: `Analisei rapidamente os canais de contato da ${nome} e vi oportunidades claras para melhorar a jornada de quem chega até vocês.`,
    geral: `Fiz uma análise rápida da presença digital da ${nome} aqui em ${cidade} e trouxe alguns pontos que podem virar oportunidade de crescimento.`,
  };

  const corpo: Record<Foco, string> = {
    site:
      "Poderia te mandar um diagnóstico curto (2 minutos de leitura) mostrando o que está impactando visitantes e o que ajustaríamos primeiro. Sem compromisso — só para você ter em mãos.",
    instagram:
      "Montei um pequeno resumo com 3 ajustes de posicionamento e pauta que costumam destravar engajamento e mensagens. Posso te enviar por aqui?",
    atendimento:
      "Consegui mapear alguns atritos no fluxo de contato e ideias simples para captar mais gente pelos canais que vocês já têm. Posso compartilhar?",
    geral:
      "Posso te enviar esse diagnóstico completo (site, Instagram e atendimento) para você usar mesmo que não seja com a gente. Tudo bem?",
  };

  const fechamento: Record<Tom, string> = {
    consultivo: `Um abraço, ${agencia}.`,
    formal: `Fico à disposição.\nAtenciosamente,\n${agencia}.`,
    amistoso: `Qualquer coisa é só chamar por aqui! — ${agencia}`,
    direto: `— ${agencia}`,
  };

  if (canal === "email") {
    return [
      `Assunto: Diagnóstico rápido da presença digital da ${nome}`,
      "",
      abertura[tom],
      "",
      `${gancho[foco]} ${corpo[foco]}`,
      "",
      fechamento[tom],
    ].join("\n");
  }
  if (canal === "curta") {
    return `${abertura[tom]} ${gancho[foco]} Posso te enviar um mini-diagnóstico?`;
  }
  if (canal === "ligacao") {
    return [
      `ROTEIRO DE LIGAÇÃO — ${nome} (${cidade})`,
      "",
      `1. Apresentação: "${abertura[tom]} Aqui é da ${agencia}, agência de design e comunicação."`,
      `2. Motivo: "${gancho[foco]}"`,
      `3. Valor: "${corpo[foco]}"`,
      `4. Convite: "Faz sentido eu te enviar esse resumo por WhatsApp ou e-mail?"`,
      `5. Fechamento: confirmar canal e horário do follow-up.`,
    ].join("\n");
  }
  // whatsapp / instagram
  return [abertura[tom], "", `${gancho[foco]} ${corpo[foco]}`, "", fechamento[tom]].join(
    "\n",
  );
}

export type TipoPrompt = "site_novo" | "site_redesign" | "ig_estrategia" | "ig_posts";

export function gerarPrompt(e: Empresa, tipo: TipoPrompt): string {
  const base = `Empresa: ${e.nome}\nSegmento: ${e.segmento}\nCidade: ${e.cidade}/RS${
    e.bairro ? " · " + e.bairro : ""
  }`;

  if (tipo === "site_novo") {
    return [
      "# Briefing para criação de site — Radar de Presença Digital",
      "",
      base,
      "",
      "## Contexto",
      "A empresa ainda não possui site próprio ativo. O objetivo é criar uma presença digital institucional com foco em captação de clientes locais e credibilidade.",
      "",
      "## Objetivos do site",
      "- Transmitir credibilidade e profissionalismo",
      "- Facilitar contato (WhatsApp, telefone, formulário)",
      "- Apresentar serviços/produtos com clareza",
      "- Aparecer em buscas locais no Google",
      "",
      "## Estrutura sugerida",
      "1. Home com hero + proposta de valor",
      "2. Sobre / Nossa história",
      "3. Serviços ou Produtos",
      "4. Prova social (depoimentos, portfólio)",
      "5. Contato com WhatsApp integrado",
      "",
      "## Requisitos técnicos",
      "- Responsivo (mobile-first)",
      "- HTTPS e desempenho otimizado",
      "- SEO local para " + e.cidade,
      "- Google Meu Negócio conectado",
      "",
      "## Tom e identidade",
      `Público local da ${e.cidade} e região. Tom acolhedor, profissional, alinhado ao segmento de ${e.segmento}.`,
    ].join("\n");
  }
  if (tipo === "site_redesign") {
    return [
      "# Briefing de redesign de site",
      "",
      base,
      "",
      "## Diagnóstico do site atual",
      `- Status: ${e.statusSite}`,
      `- Responsivo: ${e.diagnostico.site.responsivo ? "sim" : "não"}`,
      `- SSL: ${e.diagnostico.site.ssl ? "sim" : "não"}`,
      `- CTA claro: ${e.diagnostico.site.cta ? "sim" : "não"}`,
      `- Qualidade percebida: ${e.diagnostico.site.qualidadePercebida}/10`,
      "",
      "## Problemas a resolver",
      "- Identidade visual defasada",
      "- Ausência de fluxo claro de conversão",
      "- Conteúdo desatualizado",
      "",
      "## Diretrizes do redesign",
      "- Manter reconhecimento da marca, modernizando o visual",
      "- Estrutura mobile-first",
      "- Blocos claros de proposta de valor + prova social + CTA",
      "- Integração com WhatsApp e Google Meu Negócio",
    ].join("\n");
  }
  if (tipo === "ig_estrategia") {
    return [
      "# Estratégia de Instagram",
      "",
      base,
      "",
      "## Posicionamento",
      `Marca ${e.segmento.toLowerCase()} da Serra Gaúcha com foco em audiência local + turistas.`,
      "",
      "## Pilares editoriais (4)",
      "1. Bastidores e processo",
      "2. Produto / serviço em destaque",
      "3. Prova social e clientes",
      "4. Território, cultura local e Serra Gaúcha",
      "",
      "## Frequência sugerida",
      "- 3 posts/semana + 4 stories/semana + 1 reels/semana",
      "",
      "## Bio",
      `Reescrever bio com: proposta de valor em 1 linha, cidade (${e.cidade}), CTA claro e link estratégico.`,
      "",
      "## Métricas iniciais",
      "Alcance, salvamentos, mensagens diretas geradas, cliques no link.",
    ].join("\n");
  }
  // ig_posts
  return [
    "# Ideias de posts / carrosséis / reels — 30 dias",
    "",
    base,
    "",
    "## Semana 1 — Apresentação da marca",
    "- Carrossel: quem somos + o que fazemos + para quem",
    "- Reels: bastidores do dia a dia",
    "- Post estático: nossa história em 1 imagem",
    "",
    "## Semana 2 — Autoridade",
    "- Carrossel: 5 erros comuns no segmento",
    "- Reels: mito ou verdade",
    "- Post: dado ou curiosidade da região",
    "",
    "## Semana 3 — Prova social",
    "- Depoimento em carrossel",
    "- Reels: antes/depois ou case",
    "- Post: agradecimento a cliente",
    "",
    "## Semana 4 — Conversão",
    "- Carrossel: como contratar / como visitar",
    "- Reels: convite para conhecer",
    "- Post: oferta ou novidade",
  ].join("\n");
}
