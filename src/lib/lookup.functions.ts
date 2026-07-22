import { createServerFn } from "@tanstack/react-start";

export interface LookupResult {
  nome: string;
  segmento: string;
  cidade: string;
  bairro?: string;
  endereco: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  site?: string;
  instagram?: string;
  resumo: string;
  fonte: "site" | "instagram";
  urlAnalisada: string;
}

function normalizeUrl(input: string): { url: string; fonte: "site" | "instagram" } {
  let s = input.trim();
  if (!s) throw new Error("URL vazia");

  // Instagram handle: @foo ou foo (sem ponto e sem http)
  const isHandle = /^@?[a-zA-Z0-9._]+$/.test(s) && !s.includes(".");
  if (isHandle) {
    const clean = s.replace(/^@/, "");
    return { url: `https://www.instagram.com/${clean}/`, fonte: "instagram" };
  }

  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  const fonte: "site" | "instagram" = /instagram\.com/i.test(s) ? "instagram" : "site";
  return { url: s, fonte };
}

export const lookupEmpresa = createServerFn({ method: "POST" })
  .inputValidator((data: { input: string }) => {
    const input = String(data?.input ?? "").trim();
    if (!input) throw new Error("Informe um site ou @instagram");
    return { input };
  })
  .handler(async ({ data }): Promise<LookupResult> => {
    const { firecrawlScrape, chatJSON } = await import("./ai-gateway.server");
    const { url, fonte } = normalizeUrl(data.input);

    let scrape;
    try {
      scrape = await firecrawlScrape(url);
    } catch (err) {
      throw new Error(
        `Não foi possível acessar ${url}: ${(err as Error).message}`,
      );
    }

    const md = (scrape.markdown ?? "").slice(0, 8000);
    const meta = scrape.metadata ?? {};

    const sys =
      "Você extrai dados de empresas a partir do conteúdo público de um site ou perfil de Instagram. Foco em PMEs do Rio Grande do Sul (Serra Gaúcha). Português BR. Nunca invente dados; se algum campo não aparecer, deixe string vazia. Nunca use markdown na resposta.";
    const user = `Fonte analisada: ${fonte === "instagram" ? "perfil do Instagram" : "site institucional"}
URL: ${url}
Title: ${meta.title ?? ""}
Description: ${meta.description ?? ""}

Conteúdo extraído:
"""
${md || "(sem conteúdo)"}
"""

Extraia as informações da empresa e devolva JSON com este formato EXATO:
{
  "nome": "nome comercial",
  "segmento": "segmento/atividade principal (ex: Vinícola, Restaurante, Metalurgia)",
  "cidade": "cidade (se possível confirmar RS)",
  "bairro": "",
  "endereco": "endereço completo se aparecer, senão string vazia",
  "telefone": "formato (DDD) 0000-0000 se aparecer",
  "whatsapp": "formato (DDD) 00000-0000 se identificado como WhatsApp",
  "email": "",
  "site": "${fonte === "site" ? url : ""}",
  "instagram": "@handle se aparecer",
  "resumo": "2-3 frases descrevendo o negócio para uso comercial interno"
}

Regras:
- Se não encontrar um campo, use string vazia (nunca null).
- "nome" nunca vazio: se necessário, use o title da página.
- "segmento" nunca vazio: infira do conteúdo.
- "cidade" nunca vazio: infira do conteúdo; se ambíguo, deixe "".`;

    const raw = await chatJSON<Partial<LookupResult>>([
      { role: "system", content: sys },
      { role: "user", content: user },
    ]);

    return {
      nome: (raw.nome || meta.title || "Empresa sem nome").toString().trim(),
      segmento: (raw.segmento || "Outros").toString().trim(),
      cidade: (raw.cidade || "").toString().trim(),
      bairro: raw.bairro?.toString().trim() || undefined,
      endereco: (raw.endereco || "").toString().trim(),
      telefone: raw.telefone?.toString().trim() || undefined,
      whatsapp: raw.whatsapp?.toString().trim() || undefined,
      email: raw.email?.toString().trim() || undefined,
      site: (fonte === "site" ? url : raw.site?.toString().trim()) || undefined,
      instagram: raw.instagram?.toString().trim() || (fonte === "instagram" ? url : undefined),
      resumo: (raw.resumo || "").toString().trim(),
      fonte,
      urlAnalisada: url,
    };
  });
