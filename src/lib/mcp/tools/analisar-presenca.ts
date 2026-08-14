import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "analisar_presenca_digital",
  title: "Analisar presença digital",
  description:
    "Lê o conteúdo público de um site ou perfil de Instagram e devolve um diagnóstico comercial: dados da empresa, pontos fracos, pontos positivos e oportunidades de melhoria.",
  inputSchema: {
    alvo: z
      .string()
      .describe("URL do site (ex: exemplo.com.br) ou perfil do Instagram (ex: @minhaempresa)"),
  },
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async ({ alvo }) => {
    const { normalizarAlvo } = await import("../radar.server");
    const { firecrawlScrape, chatJSON } = await import("../../ai-gateway.server");
    const { url, fonte } = normalizarAlvo(alvo);

    let scrape;
    try {
      scrape = await firecrawlScrape(url);
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: `Não foi possível acessar ${url}: ${(err as Error).message}. Trate como ausência de presença digital funcional.`,
          },
        ],
        isError: true,
      };
    }

    const md = (scrape.markdown ?? "").slice(0, 8000);
    const meta = scrape.metadata ?? {};

    const diag = await chatJSON<{
      nome: string;
      segmento: string;
      cidade: string;
      telefone: string;
      whatsapp: string;
      email: string;
      instagram: string;
      resumo: string;
      pontosPositivos: string[];
      pontosFracos: string[];
      oportunidades: string[];
      prioridadeComercial: string;
    }>([
      {
        role: "system",
        content:
          "Você é auditor de presença digital de uma agência de design/comunicação/web da Serra Gaúcha (RS). Português do Brasil. Nunca invente dados: campos ausentes ficam como string vazia.",
      },
      {
        role: "user",
        content: `Fonte: ${fonte === "instagram" ? "perfil de Instagram" : "site institucional"}
URL: ${url}
Title: ${meta.title ?? ""}
Description: ${meta.description ?? ""}

Conteúdo extraído:
"""
${md || "(sem conteúdo)"}
"""

Devolva JSON: { "nome": "", "segmento": "", "cidade": "", "telefone": "", "whatsapp": "", "email": "", "instagram": "", "resumo": "2-3 frases sobre o estado da presença digital", "pontosPositivos": ["..."], "pontosFracos": ["..."], "oportunidades": ["..."], "prioridadeComercial": "alta|media|baixa" }`,
      },
    ]);

    const linha = (t: string, arr?: string[]) =>
      arr?.length ? `\n${t}\n${arr.map((x) => `- ${x}`).join("\n")}` : "";

    return {
      content: [
        {
          type: "text",
          text: `${diag.nome || meta.title || "Empresa"} — ${diag.segmento || "segmento n/d"} · ${diag.cidade || "cidade n/d"}
Fonte analisada: ${url}
Contatos: tel ${diag.telefone || "n/d"} | whatsapp ${diag.whatsapp || "n/d"} | email ${diag.email || "n/d"} | instagram ${diag.instagram || "n/d"}
Prioridade comercial: ${diag.prioridadeComercial || "n/d"}

${diag.resumo}${linha("Pontos positivos:", diag.pontosPositivos)}${linha("Pontos fracos:", diag.pontosFracos)}${linha("Oportunidades:", diag.oportunidades)}`,
        },
      ],
      structuredContent: { diagnostico: diag, urlAnalisada: url, fonte },
    };
  },
});
