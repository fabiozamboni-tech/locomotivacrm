export const PROMPT_PADRAO_BASE = `[CONTEXTO]
Atue como um Desenvolvedor Frontend Sênior e UI/UX Designer de Elite. Sua missão é criar a estrutura, o layout e o código de um site profissional completo para o nicho que será especificado.

[REGRAS DE DESIGN]
- É OBRIGATÓRIO gerar o site no formato ONE-PAGE, contendo TODAS as informações, especialidades e dados levantados em uma única página rica, com navegação fluida por âncoras no cabeçalho
- Hero de Alto Impacto (Títulos com SplitType TextGenerateEffect, iluminação Spotlight do Aceternity UI, Badge minimalista shadcn/ui, Proposta de Valor contundente e CTA e imagem de impacto conforme o negócio do cliente).
- Inclua botão de WhatsApp funcional flutuante com link wa.me/55...
- Defina uma hierarquia tipográfica marcante
- Posicione chamadas para ação (CTAs) em 3 momentos críticos: no topo da Hero (abertura rápida), logo após os serviços com prova social (confiança técnica) e no rodapé/seção final de fechamento.
- Destaque micro-provas de autoridade: anos de atuação, projetos executados com sucesso e garantia formal de qualidade.
- Reduza a fricção de contato: o botão principal para WhatsApp deve ter mensagem pré-configurada contextualizada com a especialidade do lead.
- Foco em benefícios tangíveis: títulos e cabeçalhos devem destacar o resultado concreto e a segurança que o cliente obtém, e não apenas nomenclaturas técnicas abstratas.
- Enraizamento no Nicho Real (Grounding): Não use templates genéricos. O visual, paleta e texturas devem emanar diretamente dos materiais, público e essência da empresa.
- Tipografia Rigorosa: Máximo de 2 famílias tipográficas com escala harmônica;
- Estrutura como Informação: Linhas, divisórias e números devem codificar dados reais, não apenas decorar (ex: não use marcadores 01/02/03 a menos que o conteúdo seja uma sequência real de etapas).

[ITENS PROIBIDOS]
- Não utilize fundos pretos ou roxos com luzes neon artificiais.
- Não utilize gradientes genéricos em botões.
- Não utilize marquee. Terminantemente proibido utilizar qualquer efeito de marquee (faixas de textos infinitos correndo em loop horizontal contínuo, tickers automáticos de logos ou palavras-chave deslizantes).
- Fundo creme (#F4F1EA) automático com terracota (#D97757).
- Fundo preto escuro com luz neon verde-ácido ou vermilion.
- Broadsheet denso com zero-border-radius mecânico.


[DIRETRIZES DE MOTION DESIGN E STAGGER CINEMATOGRÁFICO]
- A Hero deve possuir uma entrada orquestrada única: revelação sutil do título com SplitType + fade suave dos elementos secundários com delay escalonado.
- Os cards de serviços devem utilizar transições hover de alta sofisticação (deslocamento leve de -4px no eixo Y, sombra difusa e realce de borda translúcida).
- As animações ao rolar a página (ScrollTrigger) devem ser disparadas apenas uma vez ('once: true') para garantir rolagem fluida a 60fps sem repetições cansativas.
- O canvas deve reagir à rolagem através do GSAP ScrollTrigger com 'scrub: 1' ou 'scrub: true', interpolando a rotação, escala e iluminação de partículas, wireframes arquitetônicos ou sequências de frames 60fps conforme o usuário rola a página.
- Narrativa em Camadas Flutuantes (Stepped Narrative Overlays): conforme o scroll avança no container fixado, cards de texto e métricas de autoridade devem surgir com fade e deslizar suavemente sobre o canvas, sincronizados em momentos-chave da rolagem:
- Responsividade Dual-Frame: Adapte o desenho do canvas e os overlays tanto para visualização horizontal (Desktop) quanto vertical (Mobile), mantendo o ponto focal e a proporção adequados em qualquer tamanho de tela.
- Camadas Dimensionais com Oclusão Real: Estruture a Hero e seções principais em 3 planos de profundidade independentes:
  1. Plano de Fundo (z-0 / background plane): textura de material nobre com parallax lento.
  2. Plano do Sujeito (z-10 / subject plane): a imagem principal ou produto comercial em destaque com perspectiva nítida.
  3. Plano de Primeiro Plano (z-20 / foreground plane): tipografia editorial e elementos gráficos que passam SOBRE ou POR TRÁS do sujeito (efeito de oclusão dimensional cinematográfico).


[REGRAS TÉCNICO]
- Usar GSAP + ScrollTrigger + Lenis Integrados: A rolagem DEVE ser cinematográfica (60fps smooth scroll) via Lenis sincronizado com GSAP ScrollTrigger
- Usar SplitType com Aceternity TextGenerateEffect: Utilize SplitType para dividir os títulos principais em caracteres/palavras e aplicar animação com blur e stagger de entrada suave.
- Usar Aceternity UI Components:
- USAR shadcn/ui Design Tokens:
- USAR Tailwind CSS Obrigatório: Utilize Tailwind CSS extensivamente para construir um design visual de altíssimo nível estético, elegante, harmônico e 100% responsivo.
- USAR React se Necessário: Se for necessário para deixar o site ainda mais bonito, fluido e dinâmico, utilize React ou JavaScript moderno para implementar componentes interativos reativos de alta conversão.
- Carregue Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
- Carregue Lenis via CDN no <head>: <script src="https://unpkg.com/lenis@1.1.18/dist/lenis.min.js"></script>
- Carregue SplitType via CDN no <head>: <script src="https://unpkg.com/split-type"></script>
- Carregue GSAP e ScrollTrigger via CDN no <head>:
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
- Carregue Lucide Icons via CDN: <script src="https://unpkg.com/lucide@latest"></script>
- Se utilizar React para componentes dinâmicos, carregue no <head>:
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  E implemente os componentes dinâmicos em <script type="text/babel">.
- Use Google Fonts


[DIRETRIZ DE CONTEÚDO]
- Você DEVE utilizar obrigatoriamente as informações levantadas no Diagnóstico & Relatório do Cliente e no Dossiê 360 para redigir o conteúdo. 
- Resolva os problemas diagnosticados no material anterior (falta de clareza, lentidão, ausência de CTAs ou pouca prova social) e converta as dores e objeções do público em argumentos de alta credibilidade e conversão.
-Tom de Voz Humano: Copies diretas, focadas em benefícios reais para o cliente. Proibido o uso de jargões clichês de IA (ex: "revolucionário", "a solução definitiva", "no mundo dinâmico de hoje"). Não use excesso de emojis ou exclamações.



[DIRETRIZES DE IMAGENS FOTOGRÁFICAS GERADAS POR IA]
- IMAGENS 100% REAIS, ATIVAS E SEM LINKS QUEBRADOS
- NUNCA utilize IDs ou links aleatórios do Unsplash (ex: photo-1517...) porque eles não existem e causam erros 404 de imagem quebrada.
- Todas as imagens fotográficas do site DEVEM utilizar o gerador de imagens por IA 
- O prompt para criação da imagem DEVE ser escrito em inglês fotográfico rico e cinematográfico especificando o nicho, e estilo de iluminação natural/arquitetônica (ex: 'luxurious modern showroom, architectural photography 8k, cinematic lighting').`;

export interface PromptPadraoHistoricoItem {
  id: string;
  versao: number;
  data: string;
  prompt: string;
  autor?: string;
  motivo?: string;
  caracteres: number;
}

export interface PromptPadraoConfig {
  promptAtual: string;
  historico: PromptPadraoHistoricoItem[];
  atualizadoEm: string;
}

export function getDefaultPromptPadraoConfig(): PromptPadraoConfig {
  const agora = new Date().toISOString();
  return {
    promptAtual: PROMPT_PADRAO_BASE,
    atualizadoEm: agora,
    historico: [
      {
        id: "v1_padrao_mestre",
        versao: 1,
        data: agora,
        prompt: PROMPT_PADRAO_BASE,
        autor: "Sistema (Padrão Mestre)",
        motivo: "Versão inicial padrão de fábrica",
        caracteres: PROMPT_PADRAO_BASE.length,
      },
    ],
  };
}

export const LS_PROMPT_PADRAO = "radar.estudio.prompt_padrao.v1";
export const LS_PROMPT_PADRAO_CONFIG = "radar.estudio.prompt_padrao_config.v1";

export function loadPromptPadrao(empresaCustomizado?: string): string {
  if (empresaCustomizado && empresaCustomizado.trim().length > 0) {
    return empresaCustomizado.trim();
  }
  if (typeof window === "undefined") return PROMPT_PADRAO_BASE;
  try {
    const configRaw = window.localStorage.getItem(LS_PROMPT_PADRAO_CONFIG);
    if (configRaw) {
      const parsed = JSON.parse(configRaw) as Partial<PromptPadraoConfig>;
      if (parsed?.promptAtual && parsed.promptAtual.trim().length > 0) {
        return parsed.promptAtual.trim();
      }
    }
    const salvo = window.localStorage.getItem(LS_PROMPT_PADRAO);
    if (salvo && salvo.trim().length > 0) return salvo.trim();
  } catch {
    // fallback
  }
  return PROMPT_PADRAO_BASE;
}

export function savePromptPadrao(prompt: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_PROMPT_PADRAO, prompt);
  } catch (err) {
    console.warn("Falha ao salvar prompt padrão no localStorage:", err);
  }
}
