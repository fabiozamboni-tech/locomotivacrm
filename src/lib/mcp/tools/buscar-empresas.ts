import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "buscar_empresas",
  title: "Buscar empresas (Google Places)",
  description:
    "Busca empresas reais no Google Places por termo livre (ex: 'vinícolas em Bento Gonçalves RS'). Retorna nome, segmento, cidade, endereço, telefone, site, link do Google Maps e avaliação.",
  inputSchema: {
    consulta: z
      .string()
      .describe("Termo de busca, ex: 'restaurantes em Gramado RS' ou 'metalúrgicas Caxias do Sul'"),
    limite: z.number().int().optional().describe("Máximo de resultados (1-20, padrão 10)"),
  },
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async ({ consulta, limite }) => {
    const { buscarPlaces } = await import("../radar.server");
    const results = await buscarPlaces(consulta, limite ?? 10);
    return {
      content: [
        {
          type: "text",
          text: results.length
            ? results
                .map(
                  (r) =>
                    `• ${r.nome} — ${r.segmento ?? "segmento n/d"} · ${r.cidade}\n  ${r.endereco}\n  tel: ${r.telefone ?? "n/d"} | site: ${r.site ?? "sem site"}\n  maps: ${r.googleMapsUri ?? "n/d"}${r.rating ? ` | ${r.rating}★ (${r.totalRatings ?? 0})` : ""}`,
                )
                .join("\n")
            : "Nenhuma empresa encontrada para esta consulta.",
        },
      ],
      structuredContent: { empresas: results },
    };
  },
});
