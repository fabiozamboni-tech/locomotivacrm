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
  palavrasChave?: string[];
  diagnosticoResumo?: string;
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

/**
 * Sanitiza vícios comuns de IA: remove emojis e substitui travessões artificiais (—).
 */
export function limparViciosDeIa(str: string): string {
  if (!str) return str;
  return str
    // Substitui travessões por vírgula ou pontuação natural
    .replace(/\s*—\s*/g, ", ")
    .replace(/\s*--\s*/g, ", ")
    // Remove emojis e pictogramas Unicode
    .replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}]/gu,
      "",
    )
    .replace(/ +/g, " ")
    .trim();
}

export const gerarAbordagemAmigavelIA_ServerFn = createServerFn({ method: "POST" })
  .inputValidator((data: GerarAbordagemAmigavelInput) => data)
  .handler(async ({ data }): Promise<GerarAbordagemAmigavelOutput> => {
    const { empresa, canal, tom, provedor = "auto", instrucaoCustomizada, customKeys } = data;
    const tomInfo = TONS_ABORDAGEM.find((t) => t.id === tom) || TONS_ABORDAGEM[0];
    const agencia = "Locomotiva Comunicação";

    const termosDiagnostico =
      data.palavrasChave && data.palavrasChave.length > 0
        ? data.palavrasChave.join(", ")
        : empresa.termosEncontrados || empresa.buscasPartida || `${empresa.segmento} em ${empresa.cidade}`;

    const promptSystem = `Você é um consultor e estrategista da ${agencia}, agência de comunicação e tecnologia da Serra Gaúcha (RS).
Sua missão é redigir uma mensagem de PRIMEIRO CONTATO com um potencial cliente (${empresa.nome}, em ${empresa.cidade}/RS, do segmento de ${empresa.segmento}).

DIRETRIZES RÍGIDAS DE REDAÇÃO E TOM DE VOZ (PROMPT BASE ANTI-VÍCIO DE I.A.):

1. ZERO PUXA-SAQUISMO E ZERO ELOGIOS FORÇADOS:
   - Você NÃO conhece o trabalho da empresa a fundo e nunca comprou deles.
   - É expressamente proibido tecer elogios exagerados ou bajulações (PROIBIDO dizer "admiro seu trabalho impecável", "fiquei encantado com a qualidade", "vocês são os melhores da cidade", "trabalho incrível e perfeito").
   - Mantenha uma postura honesta, profissional, sóbria e cordial: mencione apenas que acompanha o mercado local e identificou a atuação da empresa no segmento em que ela atua.

2. PROIBIÇÃO ABSOLUTA DE VÍCIOS DE I.A. (SEM EMOJIS E SEM TRAVESSÕES):
   - PROIBIDO O USO DE QUALQUER EMOJI OU EMOTICON: Não utilize nenhum emoji no texto (zero emojis, nada de 👋, 🚀, 💡, 😊, ✨, 🔥, etc.).
   - PROIBIDO O USO DE TRAVESSÕES: Não use travessões ("—" ou "--") no meio ou no fim de frases. Utilize pontuação humana natural: vírgula, ponto final ou quebra de linha.
   - PROIBIDO O USO DE JARGÕES CORPORATIVOS VAZIOS: Banidas expressões artificiais como "espero que esta mensagem o encontre bem", "venho por meio desta", "alavancar", "no mundo dinâmico de hoje", "revolucionário", "potencializar".
   - Não utilize listas com marcadores artificiais nem formatação excessiva em negrito em todas as palavras.

3. CONEXÃO COM AS PALAVRAS-CHAVE DA ABA DIAGNÓSTICO:
   - Cite com naturalidade 1 ou 2 termos reais de busca no Google que os clientes locais utilizam para encontrar o serviço na cidade.
   - Mostre que foi realizado um levantamento sobre como o público local pesquisa na internet por esses serviços na região.

4. OBJETIVO ÚNICO: ABRIR CANAL E ENVIAR O PDF DO LEVANTAMENTO:
   - Não tente vender nada na primeira mensagem, não mencione preços e não force reuniões de uma hora.
   - O intuito exclusivo é abrir um canal amigável de conversa e pedir autorização para enviar o documento em PDF gerado na apresentação de slides (Levantamento sobre a presença digital e comunicação da empresa na região).
   - Fechamento leve e educado pedindo permissão para o envio do arquivo. Exemplo: "Reunimos esses dados em um documento resumido em PDF com esse levantamento. Posso te enviar por aqui para você dar uma olhada quando tiver um momento?"

5. ESPECIFICAÇÃO DO CANAL: ${canal.toUpperCase()}
   - Se WhatsApp: texto conciso (máximo 6 a 9 linhas bem espaçadas), fácil de ler no celular, parágrafos curtos, sem emojis e sem travessões.
   - Se E-mail: assunto claro e instigante sem sensacionalismo, corpo estruturado em 3 parágrafos objetivos, propondo o envio do PDF.
   - Se Instagram Direct: mensagem curta e educada de 3 a 5 linhas propondo compartilhar o PDF pelo WhatsApp.
   - Se Ligação / Roteiro de Reunião: fala natural, objetiva e respeitosa ao telefone.
   - Se Proposta: visão consultiva e alinhada às necessidades do cliente.

FORMATO DE RESPOSTA:
Retorne APENAS o texto pronto para envio. Se for e-mail, inclua "ASSUNTO: [assunto]" na primeira linha. Sem introduções nem explicações adicionais.`;

    const promptUser = `Dados da Empresa:
- Nome da Empresa: ${empresa.nome}
- Cidade: ${empresa.cidade} / RS (Serra Gaúcha)
- Segmento: ${empresa.areaAtuacao || empresa.segmento}
- Palavras-Chave de Busca no Google (da aba Diagnóstico): ${termosDiagnostico}
- Situação Atual da Presença: ${empresa.site ? "Possui site (" + empresa.statusSite + ")" : "Sem site próprio indexado"} · Instagram: ${empresa.instagram || "Sem arroba informado"} (${empresa.statusInstagram})
- Tom Escolhido: ${tomInfo.nome} (${tom})
- Canal Alvo: ${canal}
${data.diagnosticoResumo ? `- Resumo do Diagnóstico: "${data.diagnosticoResumo}"` : ""}
${instrucaoCustomizada ? `- Instrução Específica do Usuário: "${instrucaoCustomizada}"` : ""}

Escreva agora o texto de primeiro contato aplicando rigorosamente todas as regras: humanizado, sem bajulação, sem emojis, sem travessões, citando as buscas reais e propondo o envio do PDF do levantamento.`;

    try {
      const res = await chamarLlmUniversal(
        [
          { role: "system", content: promptSystem },
          { role: "user", content: promptUser },
        ],
        {
          provedorPreferencial: provedor,
          temperature: 0.6,
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

      // Sanitização de segurança: remove eventuais emojis e travessões residuais
      texto = limparViciosDeIa(texto);
      if (assunto) {
        assunto = limparViciosDeIa(assunto);
      }

      // Gancho de abertura é a primeira linha significativa
      const linhas = texto.split("\n").filter((l) => l.trim().length > 0);
      const ganchoAbertura = linhas[0]?.slice(0, 80) || `Abordagem de primeiro contato para ${empresa.nome}`;

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
        texto: limparViciosDeIa(fallback.texto),
        assunto: fallback.assunto ? limparViciosDeIa(fallback.assunto) : undefined,
        ganchoAbertura: fallback.ganchoAbertura,
        dicaEnvio: fallback.dicaEnvio,
        provedorUtilizado: "Modelo Determinístico Inteligente Locomotiva (Offline)",
        modeloUtilizado: "Templates Humanizados Prontos",
      };
    }
  });
