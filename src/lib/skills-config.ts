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
];

export const LS_ESTUDIO_SKILLS = "radar.estudio.skills.v2";

export function loadSkillsLocais(): CustomSkill[] {
  if (typeof window === "undefined") return SKILLS_INICIAIS_PADRAO;
  try {
    const raw = window.localStorage.getItem(LS_ESTUDIO_SKILLS);
    if (!raw) return SKILLS_INICIAIS_PADRAO;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Garante que a skill Claude sempre exista
      const hasClaude = parsed.some((s) => s.id === "claude-frontend-design");
      if (!hasClaude) {
        return [SKILLS_INICIAIS_PADRAO[0], ...parsed];
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
