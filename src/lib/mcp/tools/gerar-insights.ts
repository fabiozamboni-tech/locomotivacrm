import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "gerar_insights",
  title: "Gerar insights de prospecção",
  description:
    "Produz insights comerciais sobre uma empresa: resumo da situação digital, falhas, riscos para o negócio, oportunidades e argumentos de venda consultiva.",
  inputSchema: {
    nome: z.string().describe("Nome da empresa"),
    segmento: z.string().optional(),
    cidade: z.string().optional(),
    site: z.string().optional(),
    instagram: z.string().optional(),
    observacoes: z.string().optional().describe("Contexto coletado do site/perfil"),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async (input) => {
    const { empresaTxt } = await import("../radar.server");
    const { chatJSON } = await import("../../ai-gateway.server");

    const insights = await chatJSON<{
      resumo: string;
      falhas: string[];
      riscos: string[];
      oportunidades: string[];
      argumentos: string[];
    }>([
      {
        role: "system",
        content:
          "Você é consultor sênior de marketing digital de uma agência da Serra Gaúcha (RS). Analisa empresas locais com baixa maturidade digital para prospecção consultiva B2B. Tom objetivo e específico da região.",
      },
      {
        role: "user",
        content: `Analise a empresa abaixo e produza insights de prospecção.

${empresaTxt(input)}

Retorne JSON: { "resumo": "3-4 frases", "falhas": ["..."], "riscos": ["..."], "oportunidades": ["..."], "argumentos": ["..."] }`,
      },
    ]);

    const bloco = (t: string, arr?: string[]) =>
      arr?.length ? `\n\n${t}\n${arr.map((x) => `- ${x}`).join("\n")}` : "";

    return {
      content: [
        {
          type: "text",
          text: `${insights.resumo}${bloco("Falhas identificadas:", insights.falhas)}${bloco("Riscos:", insights.riscos)}${bloco("Oportunidades:", insights.oportunidades)}${bloco("Argumentos consultivos:", insights.argumentos)}`,
        },
      ],
      structuredContent: { insights },
    };
  },
});
