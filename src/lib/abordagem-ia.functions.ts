import { createServerFn } from "@tanstack/react-start";
import { chamarLlmUniversal } from "./llm-provider.server";
import {
  type CanalAbordagemTipo,
  type TomAbordagemId,
  TONS_ABORDAGEM,
  gerarTextoProntoPorTom,
} from "./abordagem-tons";
import type { ProvedorIaTipo } from "./api-settings";
import type { EmpresaCtx } from "./ai.functions";

export interface GerarAbordagemAmigavelInput {
  empresa: EmpresaCtx;
  canal: CanalAbordagemTipo;
  tom: TomAbordagemId;
  provedor?: ProvedorIaTipo;
  instrucaoCustomizada?: string;
  customKeys?: {
    groq?: string;
    gemini?: string;
    openrouter?: string;
    cerebras?: string;
    lovable?: string;
    ollamaBaseUrl?: string;
  };
}

export interface GerarAbordagemAmigavelOutput {
  texto: string;
  assunto?: string;
  ganchoAbertura: string;
  dicaEnvio: string;
  provedorUtilizado: string;
  modeloUtilizado: string;
}

export const gerarAbordagemAmigavelIA_ServerFn = createServerFn({ method: "POST" })
  .inputValidator((data: GerarAbordagemAmigavelInput) => data)
  .handler(async ({ data }): Promise<GerarAbordagemAmigavelOutput> => {
    const { empresa, canal, tom, provedor = "auto", instrucaoCustomizada, customKeys } = data;
    const tomInfo = TONS_ABORDAGEM.find((t) => t.id === tom) || TONS_ABORDAGEM[0];
    const agencia = "Locomotiva Comunicação";

    const promptSystem = `Você é o estrategista chefe e diretor de relacionamento da ${agencia}, agência líder de comunicação e tecnologia na Serra Gaúcha / RS.

Sua tarefa é redigir uma mensagem de PRIMEIRO CONTATO com um potencial cliente (${empresa.nome}, em ${empresa.cidade}/RS, do segmento de ${empresa.segmento}).

⚠️ REGRA INEGOCIÁVEL — PRIMEIRO CONTATO HUMANIZADO & NUNCA FRIO:
1. NUNCA comece como um vendedor chato apontando defeitos de cara (ex: "vi que seu site está ruim", "você está perdendo clientes"). Isso soa arrogante e gera bloqueio imediato no WhatsApp.
2. SEMPRE comece com EMPATIA SINCERA, calor humano, reconhecendo o bom trabalho, tradição, qualidade dos produtos ou reputação deles na cidade.
3. Não use clichês corporativos vazios (NUNCA use "espero que este e-mail o encontre bem" ou "venho por meio desta"). Escreva como uma pessoa real e respeitosa conversando com outro empresário sério.
4. O objetivo do 1º contato NÃO é fechar um contrato na primeira mensagem! O único objetivo é quebrar o gelo e conseguir uma resposta amigável (um "Olá, tudo bem? Pode mandar sim" ou um convite para um áudio ou café).
5. O tom DEVE ser: "${tomInfo.nome}" (${tomInfo.subtitulo}). ${tomInfo.descricao}.
6. Canal alvo: ${canal.toUpperCase()}.
   - Se WhatsApp: texto conciso (máximo 5 a 8 linhas), que pareça digitado no celular, com emojis discretos e convite leve para áudio de 1 minuto.
   - Se Instagram Direct: curto, elogiando posts ou produtos reais, propondo migrar com simpatia para o WhatsApp.
   - Se E-mail: assunto acolhedor e instigante, corpo estruturado e direto, com link para diagnóstico sem arrogância.
   - Se Ligação/Áudio: roteiro com fala espontânea e sorriso na voz.
   - Se Proposta: texto com visão de parceria e ganho mútuo.`;

    const promptUser = `Dados da Empresa:
- Nome: ${empresa.nome}
- Cidade: ${empresa.cidade} / RS
- Segmento / Área: ${empresa.areaAtuacao || empresa.segmento}
- Público-Alvo: ${empresa.publicoAlvo || "Consumidores e contratantes locais"}
- Presença Atual: ${empresa.site ? "Possui site (" + empresa.statusSite + ")" : "Não tem site próprio indexado"} · Instagram: ${empresa.instagram || "Sem arroba informado"} (${empresa.statusInstagram})
- Tom Escolhido: ${tomInfo.nome} (${tom})
- Canal: ${canal}
${instrucaoCustomizada ? `- Instrução Adicional do Usuário: "${instrucaoCustomizada}"` : ""}

Escreva o texto completo da abordagem, exatamente pronto para envio, no idioma Português do Brasil.
Se for e-mail, inclua "ASSUNTO: [assunto]" na primeira linha.`;

    try {
      const res = await chamarLlmUniversal(
        [
          { role: "system", content: promptSystem },
          { role: "user", content: promptUser },
        ],
        {
          provedorPreferencial: provedor,
          temperature: 0.7,
          customKeys,
        },
      );

      let texto = res.text.trim();
      let assunto: string | undefined = undefined;

      // Se for e-mail e tiver linha de assunto, extrai
      if (canal === "email") {
        const matchAssunto = texto.match(/^ASSUNTO:\s*(.+)$/im);
        if (matchAssunto) {
          assunto = matchAssunto[1].trim();
          texto = texto.replace(/^ASSUNTO:\s*.+$/im, "").trim();
        }
      }

      // Gancho de abertura é a primeira linha significativa
      const linhas = texto.split("\n").filter((l) => l.trim().length > 0);
      const ganchoAbertura = linhas[0]?.slice(0, 80) || `Abordagem amigável para ${empresa.nome}`;

      return {
        texto,
        assunto,
        ganchoAbertura,
        dicaEnvio: tomInfo.canalRecomendado + " · " + tomInfo.subtitulo,
        provedorUtilizado: `${res.provider} (${res.model})`,
        modeloUtilizado: res.model,
      };
    } catch (err) {
      console.warn("[AbordagemIA] Falha no LLM, usando texto pronto determinístico:", err);
      const fallback = gerarTextoProntoPorTom(empresa, canal, tom, agencia);
      return {
        texto: fallback.texto,
        assunto: fallback.assunto,
        ganchoAbertura: fallback.ganchoAbertura,
        dicaEnvio: fallback.dicaEnvio,
        provedorUtilizado: "Modelo Determinístico Inteligente Locomotiva (Offline)",
        modeloUtilizado: "Templates Humanizados Prontos",
      };
    }
  });
