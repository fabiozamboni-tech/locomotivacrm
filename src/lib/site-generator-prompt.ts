import { PROMPT_BLOCO_SKILLS_CLAUDE } from "./skills-claude-prompt";

export interface MontarPromptSiteParams {
  empresa: {
    nome: string;
    segmento: string;
    areaAtuacao?: string;
    cidade: string;
    endereco?: string;
    telefone?: string;
    whatsapp?: string;
    email?: string;
    termosEncontrados?: string;
  };
  diagnostico?: any;
  dossier360?: any;
  relatorio?: any;
  usarAntiIaBespoke?: boolean;
  usarSkillsClaude?: boolean;
  motorScroll?: "nenhum" | "gsap_lenis_split" | "scrollcraft_canvas" | "scrollcraft_dimensional";
  skillsAdicionais?: Array<{ id: string; nome: string; prompt: string }>;
  siteConteudoCustomizado?: string;
  logoBase64?: string;
  logoNomeArquivo?: string;
  instrucoesDesignMd?: string;
  pesquisaSnippets?: string[];
  diferenciaisDetectados?: string[];
}

export function montarPromptSiteCompleto(params: MontarPromptSiteParams): {
  promptSystem: string;
  promptUser: string;
} {
  const {
    empresa,
    diagnostico,
    dossier360,
    relatorio,
    usarAntiIaBespoke = true,
    usarSkillsClaude = false,
    motorScroll = "nenhum",
    skillsAdicionais = [],
    siteConteudoCustomizado,
    logoBase64,
    logoNomeArquivo,
    instrucoesDesignMd,
    pesquisaSnippets = [],
    diferenciaisDetectados = [],
  } = params;

  // 1. Extração de diagnósticos
  const diagnosticoSite = diagnostico?.site || {};
  const diagnosticoAtend = diagnostico?.atendimento || {};
  const diagnosticoInsta = diagnostico?.instagram || {};
  const relatorioLead = relatorio || {};

  const diagnosticoItens: string[] = [];
  if (diagnosticoSite.responsivo === false) {
    diagnosticoItens.push("Site anterior não era responsivo para celulares (gerar layout mobile-first impecável).");
  }
  if (diagnosticoSite.velocidade === "ruim" || diagnosticoSite.velocidade === "media") {
    diagnosticoItens.push(`Velocidade de carregamento anterior classificada como '${diagnosticoSite.velocidade}' (gerar código leve, otimizado e veloz).`);
  }
  if (diagnosticoSite.cta === false) {
    diagnosticoItens.push("Faltavam chamadas claras para ação (incluir CTAs estratégicos e botões visíveis).");
  }
  if (diagnosticoSite.whatsappBtn === false) {
    diagnosticoItens.push("Ausência de botão para WhatsApp (incluir botão flutuante e botões na Hero e seções).");
  }
  if (diagnosticoSite.qualidadePercebida !== undefined && diagnosticoSite.qualidadePercebida < 7) {
    diagnosticoItens.push(`Qualidade percebida anterior baixa (${diagnosticoSite.qualidadePercebida}/10) - transmitir sofisticação, acabamento nobre e autoridade.`);
  }

  if (diagnosticoAtend.clarezaServicos === false) {
    diagnosticoItens.push("Falta de clareza nas especialidades oferecidas (detalhar cada serviço com benefícios concretos).");
  }
  if (diagnosticoAtend.provaSocial === false) {
    diagnosticoItens.push("Carência de provas sociais (destacar projetos executados, credibilidade e depoimentos de clientes da região).");
  }
  if (diagnosticoAtend.contatoFacil === false) {
    diagnosticoItens.push("Canais de contato confusos (prover formulário direto de orçamento e canais rápidos e acessíveis).");
  }

  if (diagnosticoInsta.qualidadeVisual !== undefined) {
    diagnosticoItens.push(`Alinhamento visual da marca: nota ${diagnosticoInsta.qualidadeVisual}/10 (elevar padrão editorial).`);
  }

  if (relatorioLead.resumo) {
    diagnosticoItens.push(`Diagnóstico Estratégico do Lead: ${relatorioLead.resumo}`);
  }
  if (empresa.termosEncontrados) {
    diagnosticoItens.push(`Termos de busca e palavras-chave locais: ${empresa.termosEncontrados.replace(/\n/g, ", ")}`);
  }

  const dossierPersonas = dossier360?.personas || [];
  const dossierObjecoes = dossier360?.objecoes || [];
  const dossierDiferenciais = dossier360?.diferenciais || [];

  // 2. Bloco de Skills Selecionadas pelo Usuário (incluindo Skill Padrão e customizadas)
  const blocosSkills: string[] = [];
  if (skillsAdicionais && skillsAdicionais.length > 0) {
    skillsAdicionais.forEach((s) => {
      blocosSkills.push(`[SKILL: ${s.nome.toUpperCase()}]\n${s.prompt.trim()}`);
    });
  } else if (usarSkillsClaude) {
    blocosSkills.push(PROMPT_BLOCO_SKILLS_CLAUDE.trim());
  }

  // 3. Montagem do System Prompt (sem prompt base hardcoded - estritamente opções do usuário)
  const partesSystem: string[] = [];

  partesSystem.push(`[INSTRUÇÕES DO SISTEMA - DIRETRIZES DEFINIDAS PELO USUÁRIO]
Sua missão é desenvolver o código HTML5 completo, responsivo e profissional de uma Landing Page ONE-PAGE de alto padrão para a empresa especificada a seguir.`);

  if (blocosSkills.length > 0) {
    partesSystem.push(`[SKILLS E DIRETRIZES DE DESIGN ATIVAS PELO USUÁRIO]\n${blocosSkills.join("\n\n")}`);
  }

  // Motor de rolagem definido pelo usuário
  if (motorScroll === "scrollcraft_canvas") {
    partesSystem.push(`[MOTOR DE ROLAGEM SELECIONADO: SCROLLCRAFT CANVAS SCRUBBED TIMELINE (singhharsh1708/scrollcraft)]
- Implemente uma experiência de rolagem imersiva estilo Apple com estágio fixado (<div class="pinned-stage sticky top-0 h-screen w-full overflow-hidden">) e <canvas id="hero-canvas" class="w-full h-full object-cover"> responsivo.
- GSAP ScrollTrigger Pinned Timeline: sincronize a rotação, escala e animação gráfica com o scroll do usuário via 'scrub: 1'.
- Overlays narrativos em 3 etapas progressivas (0-30%, 30-65%, 65-100%) com cards flutuantes, backdrop-blur e CTA para WhatsApp.`);
  } else if (motorScroll === "scrollcraft_dimensional") {
    partesSystem.push(`[MOTOR DE ROLAGEM SELECIONADO: SCROLL-CRAFT DIMENSIONAL SCROLLYTELLING (nateherkai/scroll-craft)]
- Camadas dimensionais com oclusão real: Hero em 3 planos independentes (z-0 fundo nobre com parallax, z-10 sujeito principal com perspectiva, z-20 primeiro plano com tipografia editorial que passa sobre/sob o sujeito).
- Curva de sentimento em 4 atos emocionais (Curiosidade -> Tensão Técnica -> Revelação -> Resolução no WhatsApp).
- Signature move espacial marcante.`);
  } else if (motorScroll === "gsap_lenis_split") {
    partesSystem.push(`[MOTOR DE ROLAGEM SELECIONADO: GSAP + LENIS + SPLITTYPE]
- Rolagem suave a 60fps sincronizada via Lenis e GSAP ScrollTrigger.
- SplitType com TextGenerateEffect nos títulos da Hero.`);
  } else {
    // motorScroll === "nenhum"
    partesSystem.push(`[MOTOR DE ROLAGEM: NENHUM (ROLAGEM NATIVA)]
- Não utilize Lenis, ScrollCraft ou bibliotecas pesadas de terceiros para controle de rolagem.
- Utilize a rolagem nativa suave do navegador através de CSS puro (html { scroll-behavior: smooth; }) e transições CSS leves e rápidas.`);
  }

  // Logo anexado pelo usuário
  if (logoBase64) {
    partesSystem.push(`[LOGO OFICIAL DA MARCA FORNECIDO PELO USUÁRIO]
O cliente anexou o arquivo de logo '${logoNomeArquivo || "logo"}'. No cabeçalho (navbar) e no rodapé (footer), UTILIZE A IMAGEM DO LOGO via <img src="${logoBase64}" alt="${empresa.nome}" class="h-10 sm:h-12 w-auto object-contain" /> em vez de texto tipográfico.`);
  }

  // Diretrizes de design em Markdown anexadas pelo usuário
  if (instrucoesDesignMd) {
    partesSystem.push(`[DIRETRIZES DE DESIGN E BRANDING DO CLIENTE (.MD)]
${instrucoesDesignMd}`);
  }

  partesSystem.push(`[FORMATO OBRIGATÓRIO DE RETORNO]
Retorne APENAS o código HTML5 completo (começando em <!DOCTYPE html> e terminando em </html>), sem blocos de texto ou explicações antes ou depois.`);

  const promptSystem = partesSystem.join("\n\n");

  // 4. Montagem do User Prompt
  const partesUser: string[] = [];

  partesUser.push(`[DADOS DA EMPRESA E LOCALIZAÇÃO]
- Nome da Empresa: ${empresa.nome}
- Nicho / Segmento: ${empresa.segmento}
- Área de Atuação: ${empresa.areaAtuacao || empresa.segmento}
- Cidade: ${empresa.cidade}/RS (Serra Gaúcha)
- Endereço: ${empresa.endereco || "Não informado"}
- Telefone / WhatsApp: ${empresa.whatsapp || empresa.telefone || "Não informado"}
- E-mail: ${empresa.email || "Não informado"}`);

  // ESTRUTURA E COPYS DEFINIDAS NO BOTÃO "CONTEÚDO"
  if (siteConteudoCustomizado && siteConteudoCustomizado.trim().length > 0) {
    partesUser.push(`[ESTRUTURA DE SEÇÕES E CONTEÚDO/COPY DO SITE (DEFINIDOS NO BOTÃO CONTEÚDO)]
ATENÇÃO OBRIGATÓRIA: Utilize estritamente a seguinte estrutura de seções recomendada e as copys/textos redigidos no botão Conteúdo para estruturar a página e compor todas as seções, títulos (H1/H2), parágrafos, listas de serviços, provas sociais e CTAs:
---
${siteConteudoCustomizado.trim()}
---`);
  }

  partesUser.push(`[DADOS DO DIAGNÓSTICO E RELATÓRIO DO CLIENTE]
${diagnosticoItens.length > 0 ? diagnosticoItens.map((d) => `- ${d}`).join("\n") : "- O novo site deve resolver todas as falhas diagnosticadas com estrutura ONE-PAGE fluida, carregamento instantâneo e excelente conversão para WhatsApp."}`);

  partesUser.push(`[DADOS DO DOSSIÊ 360 DO LEAD]
${dossierPersonas.length > 0 ? `- Perfil do público/persona: ${JSON.stringify(dossierPersonas.slice(0, 2))}.` : `- Público-alvo: Clientes residenciais e comerciais de ${empresa.cidade} e região que buscam confiança e alto padrão.`}
${dossierObjecoes.length > 0 ? `- Objeções comuns no fechamento: ${JSON.stringify(dossierObjecoes.slice(0, 3))}.` : "- Objeções a contornar nos textos: segurança técnica, prazos e garantia de acabamento."}
${dossierDiferenciais.length > 0 ? `- Diferenciais competitivos: ${JSON.stringify(dossierDiferenciais.slice(0, 3))}.` : `- Diferenciais locais: atendimento próximo, pontualidade e credibilidade em ${empresa.cidade}.`}`);

  if (pesquisaSnippets.length > 0) {
    partesUser.push(`[PESQUISA WEB LOCAL EM TEMPO REAL]
${pesquisaSnippets.slice(0, 4).join("\n")}
Diferenciais detectados no mercado: ${diferenciaisDetectados.length > 0 ? diferenciaisDetectados.join(", ") : "Qualidade artesanal, pontualidade e transparência."}`);
  }

  if (instrucoesDesignMd) {
    partesUser.push(`[ESPECIFICAÇÕES DE DESIGN FORNECIDAS PELO USUÁRIO (.MD)]
${instrucoesDesignMd}`);
  }

  partesUser.push(`Gere agora o código HTML5 completo do site ONE-PAGE seguindo rigorosamente todas as regras e opções definidas acima.`);

  const promptUser = partesUser.join("\n\n");

  return { promptSystem, promptUser };
}
