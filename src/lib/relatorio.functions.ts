import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const EmpresaInput = z.object({
  nome: z.string(),
  segmento: z.string(),
  areaAtuacao: z.string().optional(),
  cidade: z.string(),
  site: z.string().optional(),
  instagram: z.string().optional(),
  statusSite: z.string(),
  statusInstagram: z.string(),
  score: z.number(),
  observacoes: z.string().optional(),
});

export interface SeoTermo {
  termo: string;
  fonte: "google_autocomplete";
}
export interface PresencaBusca {
  consulta: string;
  posicao: number | null; // posição no Google Maps (1-20) ou null se não aparece
  concorrentes: Array<{ nome: string; nota?: number; avaliacoes?: number; temSite: boolean }>;
  fonte: "google_places" | "serper";
}
export interface DadosSeo {
  termos: SeoTermo[];
  presenca: PresencaBusca | null;
  organico: { posicao: number | null; top: Array<{ titulo: string; link: string }> } | null;
  avisos: string[];
  sementes: string[];
  consulta: string;
}

export interface AjustesBusca {
  sementes?: string[];
  consulta?: string;
  termos?: string[];
}

export function sementesPadrao(segmento: string, cidade: string, areaAtuacao?: string) {
  const seg = segmento.toLowerCase();
  const list = [`${seg} ${cidade}`, `${seg} em ${cidade}`, `melhor ${seg} ${cidade}`, `${seg} perto de mim`];
  if (areaAtuacao) {
    const limpo = areaAtuacao.split(/[,\-–\.]/)[0].trim().toLowerCase();
    if (limpo && limpo.length > 3 && limpo !== seg) {
      list.unshift(`${limpo} em ${cidade}`);
    }
  }
  return list;
}

async function autocomplete(q: string): Promise<string[]> {
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=pt-BR&gl=br&q=${encodeURIComponent(q)}`;
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!r.ok) return [];
    const j = (await r.json()) as [string, string[]];
    return Array.isArray(j?.[1]) ? j[1] : [];
  } catch {
    return [];
  }
}

function norm(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function coletarSeo(e: z.infer<typeof EmpresaInput>, aj: AjustesBusca = {}): Promise<DadosSeo> {
  const avisos: string[] = [];
  const limpa = (a?: string[]) => (a ?? []).map((x) => x.trim()).filter(Boolean);
  const sementes = limpa(aj.sementes).length ? limpa(aj.sementes) : sementesPadrao(e.segmento, e.cidade);
  const manuais = limpa(aj.termos);
  const listas = manuais.length ? [manuais] : await Promise.all(sementes.map(autocomplete));
  const vistos = new Set<string>();
  const termos: SeoTermo[] = [];
  for (const l of listas) for (const t of l) {
    const k = t.toLowerCase();
    if (!vistos.has(k)) { vistos.add(k); termos.push({ termo: t, fonte: "google_autocomplete" }); }
  }
  if (!termos.length) avisos.push("Google Autocomplete não retornou sugestões para este segmento/cidade.");

  // Presença no Google Maps (Places)
  let presenca: PresencaBusca | null = null;
  const LK = process.env.LOVABLE_API_KEY;
  const GK = process.env.GOOGLE_MAPS_API_KEY;
  const consulta = aj.consulta?.trim() || `${e.segmento} em ${e.cidade}`;
  if (LK && GK) {
    try {
      const r = await fetch("https://connector-gateway.lovable.dev/google_maps/places/v1/places:searchText", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LK}`,
          "X-Connection-Api-Key": GK,
          "Content-Type": "application/json",
          "X-Goog-FieldMask": "places.displayName,places.rating,places.userRatingCount,places.websiteUri",
        },
        body: JSON.stringify({ textQuery: consulta, languageCode: "pt-BR", regionCode: "BR", maxResultCount: 20 }),
      });
      if (r.ok) {
        const j = (await r.json()) as { places?: Array<{ displayName?: { text?: string }; rating?: number; userRatingCount?: number; websiteUri?: string }> };
        const places = j.places ?? [];
        const alvo = norm(e.nome);
        const idx = places.findIndex((p) => {
          const n = norm(p.displayName?.text ?? "");
          return n && (n.includes(alvo) || alvo.includes(n));
        });
        presenca = {
          consulta,
          posicao: idx >= 0 ? idx + 1 : null,
          concorrentes: places.slice(0, 5).map((p) => ({
            nome: p.displayName?.text ?? "",
            nota: p.rating,
            avaliacoes: p.userRatingCount,
            temSite: !!p.websiteUri,
          })),
          fonte: "google_places",
        };
      } else avisos.push(`Google Places respondeu ${r.status}.`);
    } catch {
      avisos.push("Falha ao consultar o Google Places.");
    }
  }

  // Ranking orgânico (Serper.dev, opcional)
  let organico: DadosSeo["organico"] = null;
  const SK = process.env.SERPER_API_KEY;
  if (SK) {
    try {
      const r = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: { "X-API-KEY": SK, "Content-Type": "application/json" },
        body: JSON.stringify({ q: consulta, gl: "br", hl: "pt-br", num: 10 }),
      });
      if (r.ok) {
        const j = (await r.json()) as { organic?: Array<{ title: string; link: string }> };
        const org = j.organic ?? [];
        const dom = e.site ? e.site.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] : "";
        const pos = dom ? org.findIndex((o) => o.link.includes(dom)) : -1;
        organico = { posicao: pos >= 0 ? pos + 1 : null, top: org.slice(0, 5).map((o) => ({ titulo: o.title, link: o.link })) };
      }
    } catch { /* noop */ }
  } else {
    avisos.push("Ranking orgânico do Google indisponível (configure SERPER_API_KEY — plano grátis de 2.500 buscas).");
  }

  return { termos: manuais.length ? termos : termos.slice(0, 15), presenca, organico, avisos, sementes, consulta };
}

export const PILARES = ["site", "comunicacao", "redes", "branding"] as const;
export type Pilar = (typeof PILARES)[number];

export interface SecaoRelatorio {
  pilar: string;
  titulo: string;
  dores: string[];
  solucao: string[];
  impactoVendas: string;
}
export interface Relatorio {
  titulo: string;
  resumoExecutivo: string;
  contextoMercado: string;
  secoes: SecaoRelatorio[];
  planoAcao: string[];
  proximoPasso: string;
  whatsapp: string;
  emailAssunto: string;
  emailCorpo: string;
}

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["titulo", "resumoExecutivo", "contextoMercado", "secoes", "planoAcao", "proximoPasso", "whatsapp", "emailAssunto", "emailCorpo"],
  properties: {
    titulo: { type: "string" },
    resumoExecutivo: { type: "string" },
    contextoMercado: { type: "string" },
    secoes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["pilar", "titulo", "dores", "solucao", "impactoVendas"],
        properties: {
          pilar: { type: "string" },
          titulo: { type: "string" },
          dores: { type: "array", items: { type: "string" } },
          solucao: { type: "array", items: { type: "string" } },
          impactoVendas: { type: "string" },
        },
      },
    },
    planoAcao: { type: "array", items: { type: "string" } },
    proximoPasso: { type: "string" },
    whatsapp: { type: "string" },
    emailAssunto: { type: "string" },
    emailCorpo: { type: "string" },
  },
};

const NOMES: Record<Pilar, string> = {
  site: "Site",
  comunicacao: "Comunicação",
  redes: "Redes sociais",
  branding: "Branding",
};

export const gerarRelatorioLead = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ empresa: EmpresaInput, pilares: z.array(z.enum(PILARES)).min(1), agencia: z.string().default("Locomotiva Comunicação"),
      ajustes: z.object({ sementes: z.array(z.string()).optional(), consulta: z.string().optional(), termos: z.array(z.string()).optional() }).optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { openaiJSON } = await import("./ai-gateway.server");
    const seo = await coletarSeo(data.empresa, data.ajustes);
    const e = data.empresa;
    const dadosReais = [
      seo.termos.length ? `Buscas reais no Google (Autocomplete): ${seo.termos.map((t) => `"${t.termo}"`).join(", ")}` : "",
      seo.presenca
        ? `Google Maps para "${seo.presenca.consulta}": empresa ${seo.presenca.posicao ? `aparece na posição ${seo.presenca.posicao}` : "NÃO aparece entre os 20 primeiros"}. Concorrentes no topo: ${seo.presenca.concorrentes.map((c) => `${c.nome} (nota ${c.nota ?? "-"}, ${c.avaliacoes ?? 0} avaliações, ${c.temSite ? "com site" : "sem site"})`).join("; ")}`
        : "",
      seo.organico
        ? `Google orgânico: ${seo.organico.posicao ? `posição ${seo.organico.posicao}` : "não aparece no top 10"}. Top: ${seo.organico.top.map((t) => t.titulo).join("; ")}`
        : "",
    ].filter(Boolean).join("\n");

    const rel = await openaiJSON<Relatorio>({
      schemaName: "relatorio_lead",
      schema: SCHEMA,
      reasoning: "medium",
      input: [
        {
          role: "system",
          content:
            `Você é estrategista sênior da agência ${data.agencia}. Escreva em português do Brasil um diagnóstico consultivo, claro e elegante, para ENVIAR AO EMPRESÁRIO (lead). ` +
            "Use apenas os dados fornecidos como fatos; números de mercado gerais devem ser citados como referência de mercado, nunca inventados como dados da empresa. " +
            "Para cada pilar solicitado gere uma seção com dores concretas (3-5), solução proposta (3-5) e como isso converte em aumento de vendas. " +
            "Tom: respeitoso, sem jargão técnico, focado em faturamento e reputação. 'whatsapp' deve ser um resumo executivo curto com *negritos* e marcadores, pronto para enviar. 'emailCorpo' em texto simples.",
        },
        {
          role: "user",
          content:
            `Empresa: ${e.nome}\nSegmento: ${e.segmento}\nCidade: ${e.cidade}\nSite: ${e.site ?? "não possui"} (status: ${e.statusSite})\nInstagram: ${e.instagram ?? "não localizado"} (status: ${e.statusInstagram})\nScore de oportunidade: ${e.score}/100\n${e.observacoes ? "Observações: " + e.observacoes + "\n" : ""}` +
            `\nDADOS REAIS COLETADOS:\n${dadosReais || "(nenhum)"}\n\nPilares a incluir (nesta ordem): ${data.pilares.map((p) => NOMES[p]).join(", ")}.`,
        },
      ],
    });
    return { relatorio: rel, seo, geradoEm: new Date().toISOString() };
  });
