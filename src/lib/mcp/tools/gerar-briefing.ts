import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "gerar_briefing",
  title: "Gerar briefing / prompt de produção",
  description:
    "Gera um briefing completo em markdown para produção: site novo, redesign de site, estratégia de Instagram ou calendário de posts, adaptado à empresa e à Serra Gaúcha.",
  inputSchema: {
    nome: z.string().describe("Nome da empresa"),
    segmento: z.string().optional(),
    cidade: z.string().optional(),
    site: z.string().optional(),
    instagram: z.string().optional(),
    observacoes: z.string().optional().describe("Diagnóstico ou contexto adicional"),
    tipo: z
      .enum(["site_novo", "site_redesign", "ig_estrategia", "ig_posts"])
      .describe("Tipo de briefing desejado"),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async (input) => {
    const { empresaTxt } = await import("../radar.server");
    const { chatText } = await import("../../ai-gateway.server");

    const tipoTxt: Record<string, string> = {
      site_novo:
        "briefing COMPLETO para criação de um site novo (contexto, objetivos, público, arquitetura, seções, requisitos técnicos, SEO local, identidade)",
      site_redesign:
        "briefing COMPLETO de REDESIGN de site (diagnóstico do atual, problemas, diretrizes, arquitetura nova, prioridades)",
      ig_estrategia:
        "estratégia inicial de Instagram (posicionamento, público, pilares editoriais, tom, bio, frequência, métricas)",
      ig_posts:
        "calendário editorial de 30 dias para Instagram (semana a semana, com posts, reels e carrosséis específicos ao segmento e cidade)",
    };

    const texto = await chatText([
      {
        role: "system",
        content:
          "Você produz briefings profissionais em markdown, prontos para colar em ferramentas de IA de produção. Estruturado, específico, sem enrolação. Português do Brasil.",
      },
      {
        role: "user",
        content: `Gere ${tipoTxt[input.tipo]} para a empresa abaixo. Considere que ela está na Serra Gaúcha (RS) e o público inclui moradores locais + turistas quando aplicável.

${empresaTxt(input)}

Devolva markdown pronto para copiar.`,
      },
    ]);

    return { content: [{ type: "text", text: texto }] };
  },
});
