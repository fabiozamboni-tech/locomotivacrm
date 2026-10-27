import { PROMPT_BLOCO_SKILLS_CLAUDE } from "./skills-claude-prompt";

export interface CustomSkill {
  id: string;
  nome: string;
  descricao: string;
  prompt: string;
  ativa: boolean;
  categoria?: "design" | "copywriting" | "ux" | "seo" | "codigo" | "geral";
  criadaEm: string;
  sistema?: boolean;
}

export const PROMPT_SKILL_PADRAO = `[CONTEXTO]
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

export const SKILLS_INICIAIS_PADRAO: CustomSkill[] = [
  {
    id: "skill-padrao",
    nome: "Skill Padrão",
    descricao: "Diretrizes mestre de design, one-page, motion, regras técnicas, conteúdo e imagens FLUX.",
    prompt: PROMPT_SKILL_PADRAO,
    ativa: true,
    categoria: "geral",
    criadaEm: "2026-10-27T00:00:00.000Z",
    sistema: true,
  },
  {
    id: "claude-frontend-design",
    nome: "Claude Frontend Design (Anthropic)",
    descricao: "Grounding no nicho real, fuga dos 3 vícios estéticos de IA, tipografia rigorosa e movimento orquestrado.",
    prompt: PROMPT_BLOCO_SKILLS_CLAUDE.trim(),
    ativa: false,
    categoria: "design",
    criadaEm: "2026-10-20T00:00:00.000Z",
    sistema: true,
  },
  {
    id: "ux-conversao",
    nome: "UX & Arquitetura de Conversão",
    descricao: "Hierarquia visual F-pattern, micro-conversões, provas sociais contextualizadas e CTAs magnéticos.",
    prompt: `[DIRETRIZES DE UX E ARQUITETURA DE CONVERSÃO]
- Posicione chamadas para ação (CTAs) em 3 momentos críticos: no topo da Hero (abertura rápida), logo após os serviços com prova social (confiança técnica) e no rodapé/seção final de fechamento.
- Destaque micro-provas de autoridade: anos de atuação na região, projetos executados com sucesso e garantia formal de qualidade.
- Reduza a fricção de contato: o botão principal para WhatsApp deve ter mensagem pré-configurada contextualizada com a especialidade do lead.
- Foco em benefícios tangíveis: títulos e cabeçalhos devem destacar o resultado concreto e a segurança que o cliente obtém, e não apenas nomenclaturas técnicas abstratas.`,
    ativa: false,
    categoria: "ux",
    criadaEm: "2026-10-20T00:00:00.000Z",
    sistema: true,
  },
  {
    id: "seo-local-rs",
    nome: "SEO Local & Autoridade Regional",
    descricao: "Otimização de semântica HTML e menções estratégicas à cidade, bairros e região da Serra Gaúcha.",
    prompt: `[DIRETRIZES DE SEO LOCAL E AUTORIDADE REGIONAL]
- Incorpore organicamente nos cabeçalhos (h2/h3) e parágrafos a cidade de atuação e cidades circunvizinhas para rankeamento orgânico local.
- Estruture o HTML com semântica estrita (<header>, <main>, <section>, <article>, <aside>, <footer>) e metatags estruturadas (schema.org LocalBusiness simulado se oportuno).
- Destaque atendimento ágil no endereço físico, facilidade de estacionamento/visita e compromisso com o desenvolvimento da região.`,
    ativa: false,
    categoria: "seo",
    criadaEm: "2026-10-20T00:00:00.000Z",
    sistema: true,
  },
  {
    id: "motion-gsap-smooth",
    nome: "Motion Design & Stagger Cinematográfico",
    descricao: "Animações refinadas com GSAP ScrollTrigger e SplitType sem sobrecarregar o usuário.",
    prompt: `[DIRETRIZES DE MOTION DESIGN E STAGGER CINEMATOGRÁFICO]
- A Hero deve possuir uma entrada orquestrada única: revelação sutil do título com SplitType + fade suave dos elementos secundários com delay escalonado.
- Os cards de serviços devem utilizar transições hover de alta sofisticação (deslocamento leve de -4px no eixo Y, sombra difusa e realce de borda translúcida).
- As animações ao rolar a página (ScrollTrigger) devem ser disparadas apenas uma vez ('once: true') para garantir rolagem fluida a 60fps sem repetições cansativas.`,
    ativa: false,
    categoria: "design",
    criadaEm: "2026-10-20T00:00:00.000Z",
    sistema: true,
  },
  {
    id: "scrollcraft-canvas-harsh",
    nome: "ScrollCraft Canvas Scrubbing (singhharsh1708/scrollcraft)",
    descricao: "Arquitetura cinematográfica estilo Apple: pinned stage em <canvas>, animação scrubbed sincronizada ao scroll e 100 no Lighthouse.",
    prompt: `[DIRETRIZES DE ARQUITETURA SCROLLCRAFT - CANVAS SCRUBBED TIMELINE (singhharsh1708/scrollcraft)]
- Implemente uma experiência de rolagem imersiva estilo lançamentos de produtos da Apple utilizando um estágio fixado (<div class="pinned-stage sticky top-0 h-screen w-full">) contendo um elemento <canvas id="hero-canvas"> responsivo.
- O canvas deve reagir à rolagem através do GSAP ScrollTrigger com 'scrub: 1' ou 'scrub: true', interpolando a rotação, escala e iluminação de partículas, wireframes arquitetônicos ou sequências de frames 60fps conforme o usuário rola a página.
- Narrativa em Camadas Flutuantes (Stepped Narrative Overlays): conforme o scroll avança no container fixado (ex: altura de 300vh a 400vh), cards de texto e métricas de autoridade devem surgir com fade e deslizar suavemente sobre o canvas, sincronizados em momentos-chave da rolagem:
  * Etapa 1 (0-30%): Abertura do conceito e nome da empresa com tipografia imponente.
  * Etapa 2 (30-65%): Destaque da precisão técnica, acabamento de materiais e diferenciais de qualidade.
  * Etapa 3 (65-100%): Chamada final de ação (CTA) com botão magnético direto para WhatsApp.
- Eficiência e Zero-Overhead: Mantenha o código ultra leve, sem dependências volumosas, com exportação HTML/CSS/JS pura e garantia de pontuação 100 no Google Lighthouse (Performance, Acessibilidade e SEO).
- Responsividade Dual-Frame: Adapte o desenho do canvas e os overlays tanto para visualização horizontal (Desktop) quanto vertical (Mobile), mantendo o ponto focal e a proporção adequados em qualquer tamanho de tela.`,
    ativa: false,
    categoria: "codigo",
    criadaEm: "2026-10-22T00:00:00.000Z",
    sistema: true,
  },
  {
    id: "scroll-craft-dimensional",
    nome: "Scroll-Craft Dimensional Scrollytelling (nateherkai/scroll-craft)",
    descricao: "Scrollytelling de alto padrão com camadas dimensionais independentes (fundo, sujeito, primeiro plano com oclusão), curva de sentimento e signature move.",
    prompt: `[DIRETRIZES DE SCROLLYTELLING DIMENSIONAL (nateherkai/scroll-craft)]
- Camadas Dimensionais com Oclusão Real: Estruture a Hero e seções principais em 3 planos de profundidade independentes:
  1. Plano de Fundo (z-0 / background plane): textura de material nobre (linho, granito sutil, malha arquitetônica) com parallax lento.
  2. Plano do Sujeito (z-10 / subject plane): a imagem principal ou produto comercial em destaque com perspectiva nítida.
  3. Plano de Primeiro Plano (z-20 / foreground plane): tipografia editorial e elementos gráficos que passam SOBRE ou POR TRÁS do sujeito (efeito de oclusão dimensional cinematográfico).
- Curva de Sentimento Intencional (Feeling Curve): O scroll deve conduzir o visitante através de uma jornada emocional deliberada:
  * Ato 1: Curiosidade inicial através de tipografia contrastante e respiro generoso.
  * Ato 2: Tensão técnica e rigor construtivo (detalhamento minucioso dos serviços e normas).
  * Ato 3: Revelação do resultado prático com fotos autênticas e depoimentos regionais.
  * Ato 4: Resolução clara com canal de contato desimpedido.
- Signature Move Obrigatório: O site DEVE possuir um movimento espacial característico inesquecível (ex: transição de escala de card enquanto texto se afasta em profundidade, ou revelação de corte transversal da obra).
- Proibições Rígidas Anti-Clichê:
  * PROIBIDO o uso de 3D clay / bonequinhos low-poly sem textura real.
  * PROIBIDO o uso de diorama flutuante em caixas isométricas genéricas.
  * PROIBIDO o uso de grids repetitivos de features lado a lado.
  * Priorize materiais táteis reais: veios de mármore, reflexos de vidro lapidado, texturas de madeira nobre e acabamentos de metal escovado condizentes com o nicho do lead.`,
    ativa: false,
    categoria: "design",
    criadaEm: "2026-10-22T00:00:00.000Z",
    sistema: true,
  },
];

export const LS_ESTUDIO_SKILLS = "radar.estudio.skills.v3";

export function loadSkillsLocais(): CustomSkill[] {
  if (typeof window === "undefined") return SKILLS_INICIAIS_PADRAO;
  try {
    const raw = window.localStorage.getItem(LS_ESTUDIO_SKILLS);
    if (!raw) {
      // Migração suave de versões anteriores: se tiver cache antigo, garante Skill Padrão no topo e única ativa
      const legacyRaw = window.localStorage.getItem("radar.estudio.skills.v2");
      if (!legacyRaw) {
        saveSkillsLocais(SKILLS_INICIAIS_PADRAO);
        return SKILLS_INICIAIS_PADRAO;
      }
    }
    const rawToParse = raw || window.localStorage.getItem("radar.estudio.skills.v2");
    if (!rawToParse) return SKILLS_INICIAIS_PADRAO;
    const parsed = JSON.parse(rawToParse);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Procura a skill-padrao
      const temSkillPadrao = parsed.some((s: any) => s.id === "skill-padrao");
      let list = parsed;
      if (!temSkillPadrao) {
        // Insere a Skill Padrão no índice 0
        const skillPadraoObj = SKILLS_INICIAIS_PADRAO[0];
        // Desativa outras skills do sistema legadas para que apenas a Skill Padrão venha pré-selecionada
        list = [
          skillPadraoObj,
          ...parsed.map((s: any) => (s.sistema ? { ...s, ativa: false } : s)),
        ];
      } else {
        // Garante que a skill-padrao seja a primeira da lista
        const index = list.findIndex((s: any) => s.id === "skill-padrao");
        if (index > 0) {
          const [sp] = list.splice(index, 1);
          list = [sp, ...list];
        }
      }
      saveSkillsLocais(list);
      return list;
    }
    return SKILLS_INICIAIS_PADRAO;
  } catch {
    return SKILLS_INICIAIS_PADRAO;
  }
}

export function saveSkillsLocais(skills: CustomSkill[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_ESTUDIO_SKILLS, JSON.stringify(skills));
  } catch (err) {
    console.warn("Falha ao salvar skills no localStorage:", err);
  }
}

export function gerarBlocoSkillsPrompt(skills: CustomSkill[]): string {
  const ativas = skills.filter((s) => s.ativa);
  if (ativas.length === 0) return "";

  const blocos = ativas.map((s) => {
    return `[SKILL DE DESIGN/ENGENHARIA: ${s.nome.toUpperCase()}]\n${s.prompt.trim()}`;
  });

  return `\n[DIRETRIZES E SKILLS SELECIONADAS PELO USUÁRIO]\n${blocos.join("\n\n")}\n`;
}
