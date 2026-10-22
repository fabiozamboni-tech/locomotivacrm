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

export const SKILLS_INICIAIS_PADRAO: CustomSkill[] = [
  {
    id: "claude-frontend-design",
    nome: "Claude Frontend Design (Anthropic)",
    descricao: "Grounding no nicho real, fuga dos 3 vícios estéticos de IA, tipografia rigorosa e movimento orquestrado.",
    prompt: PROMPT_BLOCO_SKILLS_CLAUDE.trim(),
    ativa: true,
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

export const LS_ESTUDIO_SKILLS = "radar.estudio.skills.v2";

export function loadSkillsLocais(): CustomSkill[] {
  if (typeof window === "undefined") return SKILLS_INICIAIS_PADRAO;
  try {
    const raw = window.localStorage.getItem(LS_ESTUDIO_SKILLS);
    if (!raw) return SKILLS_INICIAIS_PADRAO;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Garante que todas as skills do sistema iniciais estejam presentes mesmo se o usuário tiver salvo antes
      const existingIds = new Set(parsed.map((s: any) => s.id));
      const missingSystem = SKILLS_INICIAIS_PADRAO.filter((s) => s.sistema && !existingIds.has(s.id));
      if (missingSystem.length > 0) {
        return [...parsed, ...missingSystem];
      }
      return parsed;
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
