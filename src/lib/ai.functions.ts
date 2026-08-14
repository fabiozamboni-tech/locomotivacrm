import { createServerFn } from "@tanstack/react-start";
import type { Empresa } from "./mock-data";

// Payload mínimo enviado do cliente (evita enviar objeto Empresa inteiro).
export interface EmpresaCtx {
  nome: string;
  segmento: string;
  cidade: string;
  bairro?: string;
  site?: string;
  instagram?: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  statusSite: string;
  statusInstagram: string;
  score: number;
  observacoes?: string;
}

export function toCtx(e: Empresa): EmpresaCtx {
  return {
    nome: e.nome,
    segmento: e.segmento,
    cidade: e.cidade,
    bairro: e.bairro,
    site: e.site,
    instagram: e.instagram,
    telefone: e.telefone,
    whatsapp: e.whatsapp,
    email: e.email,
    statusSite: e.statusSite,
    statusInstagram: e.statusInstagram,
    score: e.score,
    observacoes: e.observacoes,
  };
}

function ctxTxt(e: EmpresaCtx): string {
  return [
    `Empresa: ${e.nome}`,
    `Segmento: ${e.segmento}`,
    `Cidade: ${e.cidade}${e.bairro ? " · " + e.bairro : ""}/RS`,
    e.site ? `Site: ${e.site}` : "Site: (não possui / não localizado)",
    e.instagram ? `Instagram: ${e.instagram}` : "Instagram: (não localizado)",
    `Status site: ${e.statusSite}`,
    `Status Instagram: ${e.statusInstagram}`,
    `Score interno: ${e.score}/100`,
    e.telefone ? `Telefone: ${e.telefone}` : "",
    e.whatsapp ? `WhatsApp: ${e.whatsapp}` : "",
    e.observacoes ? `Observações internas: ${e.observacoes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

// -------- INSIGHTS --------
export interface AiInsights {
  resumo: string;
  falhas: string[];
  riscos: string[];
  oportunidades: string[];
  argumentos: string[];
}

export const gerarInsightsIA = createServerFn({ method: "POST" })
  .inputValidator((data: { empresa: EmpresaCtx; contextoExtra?: string }) => data)
  .handler(async ({ data }): Promise<AiInsights> => {
    const { chatJSON } = await import("./ai-gateway.server");
    const sys =
      "Você é consultor sênior de marketing digital de uma agência da Serra Gaúcha (RS). Analisa empresas locais com baixa maturidade digital para prospecção consultiva B2B. Tom objetivo, comercial, específico da região. Nada de bullet genérico.";
    const user = `Analise a empresa abaixo e produza insights de prospecção.

${ctxTxt(data.empresa)}
${data.contextoExtra ? `\nContexto adicional coletado do site:\n${data.contextoExtra.slice(0, 4000)}` : ""}

Retorne JSON com:
{
  "resumo": "3-4 frases da situação digital atual",
  "falhas": ["3-6 falhas objetivas identificadas"],
  "riscos": ["3-5 riscos para o negócio dela"],
  "oportunidades": ["3-6 oportunidades de melhoria acionáveis"],
  "argumentos": ["3-5 argumentos consultivos para primeira abordagem"]
}`;
    return await chatJSON<AiInsights>([
      { role: "system", content: sys },
      { role: "user", content: user },
    ]);
  });

// -------- ABORDAGEM --------
export const gerarAbordagemIA = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      empresa: EmpresaCtx;
      canal: "whatsapp" | "email" | "instagram" | "ligacao" | "curta";
      tom: "consultivo" | "formal" | "amistoso" | "direto";
      foco: "site" | "instagram" | "atendimento" | "geral";
      nomeAgencia?: string;
    }) => data,
  )
  .handler(async ({ data }): Promise<string> => {
    const { chatText } = await import("./ai-gateway.server");
    const canalTxt: Record<string, string> = {
      whatsapp: "mensagem de WhatsApp curta e humana",
      email: "e-mail com assunto na primeira linha (formato 'Assunto: ...')",
      instagram: "direct de Instagram, tom coloquial",
      ligacao: "roteiro numerado para ligação (5 passos)",
      curta: "mensagem muito curta (2-3 frases, direta para abrir conversa)",
    };
    const focoTxt: Record<string, string> = {
      site: "foco em site / presença web",
      instagram: "foco em Instagram / conteúdo",
      atendimento: "foco em atendimento e comunicação",
      geral: "diagnóstico geral (site + Instagram + atendimento)",
    };
    const agencia = data.nomeAgencia?.trim() || "[Nome da sua agência]";
    const sys = `Você escreve primeiras abordagens comerciais consultivas para uma agência de design, comunicação e desenvolvimento web da Serra Gaúcha (RS). Nunca soa agressivo, nunca promete resultados irreais, nunca usa 'oferta imperdível'. Escreve como humano. Português do Brasil.`;
    const user = `Gere uma ${canalTxt[data.canal]}, com tom ${data.tom}, ${focoTxt[data.foco]}, para a empresa abaixo. Use o nome da empresa e a cidade. Personalize com 1 detalhe específico do contexto. Assine como "${agencia}". Se citar o contato, use "[Nome do contato]".

${ctxTxt(data.empresa)}

Devolva APENAS o texto da mensagem, sem explicações, sem markdown.`;
    return await chatText([
      { role: "system", content: sys },
      { role: "user", content: user },
    ]);
  });

// -------- PROMPT (briefing) --------
export const gerarPromptIA = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      empresa: EmpresaCtx;
      tipo: "site_novo" | "site_redesign" | "ig_estrategia" | "ig_posts";
    }) => data,
  )
  .handler(async ({ data }): Promise<string> => {
    const { chatText } = await import("./ai-gateway.server");
    const tipoTxt: Record<string, string> = {
      site_novo: "briefing COMPLETO para criação de um site novo (contexto, objetivos, público, arquitetura, seções, requisitos técnicos, SEO local, identidade)",
      site_redesign: "briefing COMPLETO de REDESIGN de site (diagnóstico do atual, problemas, diretrizes, arquitetura nova, prioridades)",
      ig_estrategia: "estratégia inicial de Instagram (posicionamento, público, pilares editoriais, tom, bio, frequência, métricas)",
      ig_posts: "calendário editorial de 30 dias para Instagram (semana a semana, com posts, reels e carrosséis específicos ao segmento e cidade)",
    };
    const sys = "Você produz briefings profissionais em markdown, prontos para colar em ferramentas de IA de produção (Lovable, ChatGPT, Claude). Estruturado, específico, sem enrolação.";
    const user = `Gere ${tipoTxt[data.tipo]} para a empresa abaixo. Considere que ela está na Serra Gaúcha (RS) e o público inclui moradores locais + turistas quando aplicável.

${ctxTxt(data.empresa)}

Devolva markdown pronto para copiar.`;
    return await chatText([
      { role: "system", content: sys },
      { role: "user", content: user },
    ]);
  });

// -------- ANÁLISE REAL DE SITE (Firecrawl + IA) --------
export interface SiteAnaliseIA {
  possuiSite: boolean;
  statusSite: "sem_site" | "desatualizado" | "sem_ssl" | "nao_responsivo" | "ok";
  responsivo: boolean;
  ssl: boolean;
  cta: boolean;
  formulario: boolean;
  whatsappBtn: boolean;
  seoBasico: boolean;
  identidadeConsistente: boolean;
  qualidadePercebida: number; // 0-10
  velocidade: "boa" | "media" | "ruim" | "na";
  resumo: string;
  pontosPositivos: string[];
  pontosFracos: string[];
  oportunidades: string[];
  metaTitle?: string;
  metaDescription?: string;
}

export const analisarSiteIA = createServerFn({ method: "POST" })
  .inputValidator((data: { url: string; empresa: EmpresaCtx }) => {
    const url = String(data?.url ?? "").trim();
    if (!url) throw new Error("URL vazia");
    return { url, empresa: data.empresa };
  })
  .handler(async ({ data }): Promise<SiteAnaliseIA> => {
    const { firecrawlScrape, chatJSON } = await import("./ai-gateway.server");
    let normalized = data.url;
    if (!/^https?:\/\//i.test(normalized)) normalized = "https://" + normalized;

    let scrape;
    try {
      scrape = await firecrawlScrape(normalized);
    } catch (err) {
      // site quebrado / inacessível
      return {
        possuiSite: false,
        statusSite: "sem_site",
        responsivo: false,
        ssl: normalized.startsWith("https://"),
        cta: false,
        formulario: false,
        whatsappBtn: false,
        seoBasico: false,
        identidadeConsistente: false,
        qualidadePercebida: 0,
        velocidade: "na",
        resumo: `Não foi possível acessar o site (${(err as Error).message}). Trate como ausência de site funcional.`,
        pontosPositivos: [],
        pontosFracos: ["Site inacessível ou fora do ar durante a análise."],
        oportunidades: ["Verificar hospedagem/domínio; considerar reconstrução."],
      };
    }

    const md = (scrape.markdown ?? "").slice(0, 8000);
    const meta = scrape.metadata ?? {};
    const links = (scrape.links ?? []).slice(0, 30);

    const sys = "Você é auditor de sites para uma agência de design/comunicação/web da Serra Gaúcha (RS). Analisa sites de PMEs locais com rigor comercial. Português BR. Nunca invente dados que não estão no conteúdo.";
    const user = `Analise o conteúdo real do site da empresa "${data.empresa.nome}" (${data.empresa.segmento}, ${data.empresa.cidade}/RS).

URL analisada: ${normalized}
HTTPS: ${normalized.startsWith("https://") ? "sim" : "não"}
Title: ${meta.title ?? "(sem title)"}
Meta description: ${meta.description ?? "(sem description)"}

Conteúdo em markdown (extraído com Firecrawl):
"""
${md || "(sem conteúdo extraível)"}
"""

Alguns links internos: ${links.join(", ") || "(nenhum)"}

Devolva JSON com este formato exato:
{
  "possuiSite": true,
  "statusSite": "ok" | "desatualizado" | "sem_ssl" | "nao_responsivo" | "sem_site",
  "responsivo": true,
  "ssl": true,
  "cta": true,
  "formulario": true,
  "whatsappBtn": true,
  "seoBasico": true,
  "identidadeConsistente": true,
  "qualidadePercebida": 7,
  "velocidade": "boa" | "media" | "ruim" | "na",
  "resumo": "2-3 frases sobre o estado do site",
  "pontosPositivos": ["..."],
  "pontosFracos": ["..."],
  "oportunidades": ["3-5 melhorias concretas"],
  "metaTitle": "${meta.title ?? ""}",
  "metaDescription": "${meta.description ?? ""}"
}

Regras:
- responsivo/velocidade: se não der para inferir do conteúdo, deixe respectivamente false e "na".
- ssl: baseie-se na URL (https).
- qualidadePercebida: 0-10 considerando estrutura, clareza, CTA, atualização aparente.
- statusSite="desatualizado" se linguagem, contatos ou eventos citados parecerem antigos.`;

    return await chatJSON<SiteAnaliseIA>([
      { role: "system", content: sys },
      { role: "user", content: user },
    ]);
  });

// -------- ESTIMATIVA DE VALOR (orçamento) --------
export interface OpcaoOrcamento {
  tipo: "site_estatico" | "site_crm" | "loja_virtual";
  titulo: string;
  minimo: number;
  maximo: number;
  recomendado: number;
  prazo: string;
  escopo: string[];
  aplicavel: boolean;
  justificativa: string;
}

export interface OrcamentoIA {
  porteEstimado: string;
  referenciaMercado: string;
  moeda: string;
  opcoes: OpcaoOrcamento[];
  mensalidadeSugerida?: { minimo: number; maximo: number; descricao: string };
  potencialInvestimento: {
    nivel: "alto" | "medio" | "baixo";
    resumo: string;
    sinais: string[];
    riscos: string[];
  };
  observacoes: string;
}

export const estimarValorIA = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { empresa: EmpresaCtx; contextoExtra?: string; porteManual?: string }) => data,
  )
  .handler(async ({ data }): Promise<OrcamentoIA> => {
    const { chatJSON } = await import("./ai-gateway.server");
    const sys =
      "Você é gestor comercial de uma agência de design, comunicação e desenvolvimento web da Serra Gaúcha (RS). Estima orçamentos realistas em reais (BRL) para PMEs brasileiras, usando a média de mercado praticada por agências regionais no Rio Grande do Sul. Seja conservador e coerente com o porte e a cidade da empresa. Nunca invente dados privados — use apenas o que é público/inferível.";
    const user = `Estime o valor de um projeto de site para a empresa abaixo e avalie o potencial de investimento dela.

${ctxTxt(data.empresa)}
${data.porteManual ? `Porte informado pelo comercial: ${data.porteManual}` : ""}
${data.contextoExtra ? `\nContexto público coletado:\n${data.contextoExtra.slice(0, 4000)}` : ""}

Considere: porte/tamanho aparente da empresa, segmento, cidade e região (poder económico local e média de preços praticada ali), maturidade digital atual (score ${data.empresa.score}/100) e necessidade real de e-commerce.

Devolva JSON EXATO:
{
  "porteEstimado": "microempresa | pequena | média | grande (com 1 frase de justificação)",
  "referenciaMercado": "1-2 frases sobre a média de preços de sites para empresas deste porte nesta cidade/região",
  "moeda": "BRL",
  "opcoes": [
    {
      "tipo": "site_estatico",
      "titulo": "Site institucional (sem CRM)",
      "minimo": 0, "maximo": 0, "recomendado": 0,
      "prazo": "ex: 3 a 5 semanas",
      "escopo": ["4-6 itens de escopo"],
      "aplicavel": true,
      "justificativa": "1 frase"
    },
    {
      "tipo": "site_crm",
      "titulo": "Site com CRM/área de gestão",
      "minimo": 0, "maximo": 0, "recomendado": 0,
      "prazo": "...", "escopo": ["..."], "aplicavel": true, "justificativa": "..."
    },
    {
      "tipo": "loja_virtual",
      "titulo": "Loja virtual (e-commerce)",
      "minimo": 0, "maximo": 0, "recomendado": 0,
      "prazo": "...", "escopo": ["..."],
      "aplicavel": false,
      "justificativa": "Marque aplicavel=true APENAS se o segmento vender produtos passíveis de venda online"
    }
  ],
  "mensalidadeSugerida": { "minimo": 0, "maximo": 0, "descricao": "manutenção/hospedagem ou gestão mensal" },
  "potencialInvestimento": {
    "nivel": "alto" | "medio" | "baixo",
    "resumo": "3-4 frases sobre a capacidade e a disposição da empresa para investir",
    "sinais": ["3-5 sinais públicos observados"],
    "riscos": ["2-4 riscos ou objeções esperadas"]
  },
  "observacoes": "1-2 frases de ressalva (estimativa, sujeita a levantamento)"
}

Regras: valores numéricos inteiros em reais, sem texto; minimo < recomendado < maximo; nunca retorne null.`;
    return await chatJSON<OrcamentoIA>([
      { role: "system", content: sys },
      { role: "user", content: user },
    ]);
  });
