import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "gerar_abordagem",
  title: "Gerar abordagem comercial",
  description:
    "Gera o texto de primeira abordagem comercial consultiva para uma empresa, no canal, tom e foco escolhidos (WhatsApp, e-mail, direct, roteiro de ligação ou mensagem curta).",
  inputSchema: {
    nome: z.string().describe("Nome da empresa"),
    segmento: z.string().optional().describe("Segmento / atividade da empresa"),
    cidade: z.string().optional().describe("Cidade da empresa (RS)"),
    site: z.string().optional().describe("Site da empresa, se houver"),
    instagram: z.string().optional().describe("Instagram da empresa, se houver"),
    observacoes: z.string().optional().describe("Contexto adicional ou gaps já identificados"),
    canal: z
      .enum(["whatsapp", "email", "instagram", "ligacao", "curta"])
      .describe("Canal da abordagem"),
    tom: z.enum(["consultivo", "formal", "amistoso", "direto"]).optional(),
    foco: z.enum(["site", "instagram", "atendimento", "geral"]).optional(),
    nomeAgencia: z.string().optional().describe("Nome da agência para assinar a mensagem"),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async (input) => {
    const { empresaTxt } = await import("../radar.server");
    const { chatText } = await import("../../ai-gateway.server");

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

    const texto = await chatText([
      {
        role: "system",
        content:
          "Você escreve primeiras abordagens comerciais consultivas para uma agência de design, comunicação e desenvolvimento web da Serra Gaúcha (RS). Nunca soa agressivo, nunca promete resultados irreais. Escreve como humano. Português do Brasil.",
      },
      {
        role: "user",
        content: `Gere uma ${canalTxt[input.canal]}, com tom ${input.tom ?? "consultivo"}, ${focoTxt[input.foco ?? "geral"]}, para a empresa abaixo. Use o nome da empresa e a cidade. Assine como "${input.nomeAgencia?.trim() || "[Nome da sua agência]"}". Se citar o contato, use "[Nome do contato]".

${empresaTxt(input)}

Devolva APENAS o texto da mensagem, sem explicações, sem markdown.`,
      },
    ]);

    return { content: [{ type: "text", text: texto }] };
  },
});
