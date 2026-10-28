export const PROMPT_CONTEUDO_BASE = `Atue como um Diretor de Criação de Elite, Arquiteto de Informação e Copywriter Sênior de Resposta Direta.
Sua missão é desenvolver a ESTRUTURA DE SEÇÕES COMPLETA e as COPYS/TEXTOS PERSUASIVOS DETALHADOS para uma Landing Page ONE-PAGE de alto padrão da empresa especificada.

DIRETRIZES FUNDAMENTAIS:
1. Enraizamento no Nicho Real: Adequar o tom de voz e os termos técnicos ao segmento real da empresa.
2. Grounding na Análise do Cliente: Você DEVE utilizar obrigatoriamente as informações levantadas no Diagnóstico do Cliente e no Dossiê 360 (personas, fraquezas detectadas, objeções no fechamento comercial e diferenciais competitivos) para formular os argumentos.
3. Tom Humano e Confiante: Copies diretas, focadas em benefícios concretos para o cliente. Proibido o uso de jargões clichês de IA (ex: "revolucionário", "a solução definitiva", "no mundo dinâmico de hoje", "transformando o cenário").
4. Formatação: Retorne o resultado em formato Markdown estruturado, dividido claramente em:
   - ## 1. ARQUITETURA E ESTRUTURA DE SEÇÕES RECOMENDADA (lista numerada de seções explicando a função de cada uma na conversão)
   - ## 2. CONTEÚDO E COPYS COMPLETAS DE CADA SEÇÃO (com H1, subtítulo, propostas de valor, catálogo de serviços detalhado com benefícios, superação de objeções, sobre a empresa e CTAs para WhatsApp com mensagem pré-configurada).`;

export interface PromptConteudoHistoricoItem {
  id: string;
  versao: number;
  data: string;
  prompt: string;
  autor?: string;
  motivo?: string;
  caracteres: number;
}

export interface PromptConteudoConfig {
  promptAtual: string;
  historico: PromptConteudoHistoricoItem[];
  atualizadoEm: string;
}

export function getDefaultPromptConteudoConfig(): PromptConteudoConfig {
  const agora = new Date().toISOString();
  return {
    promptAtual: PROMPT_CONTEUDO_BASE,
    atualizadoEm: agora,
    historico: [
      {
        id: "v1_padrao_mestre",
        versao: 1,
        data: agora,
        prompt: PROMPT_CONTEUDO_BASE,
        autor: "Sistema (Padrão Mestre)",
        motivo: "Versão inicial padrão de fábrica",
        caracteres: PROMPT_CONTEUDO_BASE.length,
      },
    ],
  };
}

export const LS_PROMPT_CONTEUDO = "radar.estudio.prompt_conteudo.v1";
export const LS_PROMPT_CONTEUDO_CONFIG = "radar.estudio.prompt_conteudo_config.v1";

export function loadPromptConteudo(): string {
  if (typeof window === "undefined") return PROMPT_CONTEUDO_BASE;
  try {
    const configRaw = window.localStorage.getItem(LS_PROMPT_CONTEUDO_CONFIG);
    if (configRaw) {
      const parsed = JSON.parse(configRaw) as Partial<PromptConteudoConfig>;
      if (parsed?.promptAtual && parsed.promptAtual.trim().length > 0) {
        return parsed.promptAtual.trim();
      }
    }
    const salvo = window.localStorage.getItem(LS_PROMPT_CONTEUDO);
    if (salvo && salvo.trim().length > 0) return salvo.trim();
  } catch {
    // fallback
  }
  return PROMPT_CONTEUDO_BASE;
}

export function savePromptConteudo(prompt: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_PROMPT_CONTEUDO, prompt);
  } catch (err) {
    console.warn("Falha ao salvar prompt de conteúdo no localStorage:", err);
  }
}
