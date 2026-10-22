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
  motorScroll?: "gsap_lenis_split" | "scrollcraft_canvas" | "scrollcraft_dimensional";
  skillsAdicionais?: Array<{ id: string; nome: string; prompt: string }>;
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
    usarSkillsClaude = true,
    motorScroll = "gsap_lenis_split",
    skillsAdicionais = [],
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

  // 2. Bloco de Skills Adicionais
  let skillsAdicionaisTexto = "";
  if (skillsAdicionais && skillsAdicionais.length > 0) {
    const blocos = skillsAdicionais.map(
      (s) => `[SKILL DE DESIGN/ENGENHARIA: ${s.nome.toUpperCase()}]\n${s.prompt.trim()}`,
    );
    skillsAdicionaisTexto = `\n[SKILLS ADICIONAIS SELECIONADAS PELO USUÁRIO]\n${blocos.join("\n\n")}\n`;
  }

  // 3. Montagem do System Prompt
  const promptSystem = `[Contexto do Sistema]Atue como um Desenvolvedor Frontend Sênior e UI/UX Designer de Elite. Sua missão é criar a estrutura, o layout e o código de um site profissional completo para o nicho que será especificado.
${usarSkillsClaude ? PROMPT_BLOCO_SKILLS_CLAUDE : ""}
${skillsAdicionaisTexto}
${
  usarAntiIaBespoke
    ? `Você deve ignorar completamente os vieses automáticos de geração por IA e seguir rigorosamente as diretrizes humanas abaixo:

[Regras de Design - Anti-IA Bespoke Obrigatórias]
Proibições Absolutas:
- Não utilize fundos pretos ou roxos com luzes neon artificiais.
- Não utilize gradientes genéricos em botões.
- Não utilize grids repetitivos em loop (como o padrão de 3 cards idênticos lado a lado).
- Evite ilustrações 3D genéricas ou ícones flutuantes sem propósito funcional.
- PROIBIÇÃO ABSOLUTA DE MARQUEE: É terminantemente proibido utilizar qualquer efeito de marquee (faixas de textos infinitos correndo em loop horizontal contínuo, tickers automáticos de logos ou palavras-chave deslizantes). Marquees são extremamente clichês e o maior vício estético de sites gerados por IA. Use grids editoriais limpos, assimetria inteligente ou carrosséis com controle humano.

Arquitetura Visual: Priorize o minimalismo premium, design editorial ou contemporâneo. Use "respiro" (whitespace) generoso e assimetria inteligente no grid para dar ritmo visual ao site.
Paleta de Cores e Tipografia: Use uma combinação contida de no máximo 3 cores. Defina uma hierarquia tipográfica marcante (ex: uma fonte com forte personalidade para títulos e uma sans-serif extremamente limpa para o corpo).`
    : `[Regras de Design Moderno]
Crie um design moderno de alto padrão visual, com layout limpo, 100% responsivo e harmônico utilizando Tailwind CSS.`
}

[Estrutura e Elementos Obrigatórios - Formato ONE-PAGE (Landing Page Cinematográfica Completa)]
É OBRIGATÓRIO gerar o site no formato ONE-PAGE (Landing Page contínua e imersiva), contendo TODAS as informações, especialidades e dados levantados em uma única página rica, com navegação fluida por âncoras no cabeçalho (#home, #sobre, #solucoes, #portfolio, #diferenciais, #contato):
1. Home / Hero de Alto Impacto (Títulos com SplitType TextGenerateEffect, iluminação Spotlight do Aceternity UI, Badge minimalista shadcn/ui, Proposta de Valor contundente e CTA direto para WhatsApp).
2. Quem Somos / Sobre a Empresa (História autêntica, valores, autoridade técnica, fotos da oficina/atendimento e compromisso com ${empresa.cidade} e região).
3. Especialidades / Catálogo de Soluções (Detalhamento minucioso de cada serviço prestado, com cards refinados estilo shadcn/ui, benefícios técnicos e diferenciais práticos).
4. Portfólio & Casos de Sucesso (Galeria de projetos fotográficos de alto padrão gerados via FLUX.1 retratando aplicações reais).
5. Diferenciais, Normas Técnicas & Garantias (Certificação de materiais, cumprimento rigoroso de prazos, equipe qualificada e garantias pós-entrega).
6. Contato, Localização & Orçamento (Formulário moderno de orçamento rápido, endereço na cidade e link direto para WhatsApp).
Navegação: Cabeçalho sticky translúcido com links por âncoras (#) para todas as seções e menu mobile responsivo. Rodapé institucional completo replicando os links e informações da empresa.

[Diretriz Obrigatória de Conteúdo - Diagnóstico & Relatório do Cliente]
Você DEVE utilizar obrigatoriamente as informações levantadas no Diagnóstico & Relatório do Cliente e no Dossiê 360 para redigir o conteúdo. Resolva os problemas diagnosticados no material anterior (falta de clareza, lentidão, ausência de CTAs ou pouca prova social) e converta as dores e objeções do público em argumentos de alta credibilidade e conversão.

[Experiência Scroll-Driven e Arquitetura de Movimento Obrigatória]
${
  motorScroll === "scrollcraft_canvas"
    ? `MOTOR SELECIONADO: SCROLLCRAFT CANVAS SCRUBBED TIMELINE (singhharsh1708/scrollcraft)
- Implemente uma experiência de rolagem imersiva estilo Apple (ex: AirPods / Pro Display) com um estágio fixado (<div class="pinned-stage sticky top-0 h-screen w-full overflow-hidden">) e um elemento <canvas id="hero-canvas" class="w-full h-full object-cover"> responsivo.
- GSAP ScrollTrigger Pinned Timeline: Sincronize a rotação, escala e transição gráfica do canvas com o scroll do usuário (ScrollTrigger.create({ trigger: ".pinned-container", pin: true, start: "top top", end: "+=250%", scrub: 1, onUpdate: (self) => renderCanvas(self.progress) })).
- Overlays Narrativos em Etapas (Stepped Narrative): Cards flutuantes com sombras suaves e backdrop blur surgindo em 3 momentos sequenciais:
  * 0% - 30%: Apresentação do nome e proposta de valor em ${empresa.cidade}.
  * 30% - 65%: Destaque dos materiais nobres, precisão milimétrica e acabamento artesanal.
  * 65% - 100%: Conclusão com métricas de autoridade e CTA magnético para WhatsApp.
- 100 no Google Lighthouse: Código limpo, zero bibliotecas pesadas, renderização a 60fps via requestAnimationFrame, e adaptação perfeita para desktop e telas verticais de smartphones.`
    : motorScroll === "scrollcraft_dimensional"
    ? `MOTOR SELECIONADO: SCROLL-CRAFT DIMENSIONAL SCROLLYTELLING (nateherkai/scroll-craft)
- Camadas Dimensionais com Oclusão Real: Estruture a Hero e seções principais em 3 planos de profundidade independentes:
  1. Plano de Fundo (z-0): textura de material nobre (linho rústico, granito acetinado ou malha arquitetônica) com parallax lento.
  2. Plano do Sujeito (z-10): o produto ou serviço principal em grande angular com sombras dinâmicas e perspectiva realista.
  3. Plano de Primeiro Plano (z-20): tipografia monumental com efeito de oclusão (o texto cruza visualmente por trás ou sobre o elemento físico).
- Curva de Sentimento Intencional (Feeling Curve): Conduza o visitante em 4 atos emocionais (Ato 1: Curiosidade inicial -> Ato 2: Tensão técnica e rigor construtivo -> Ato 3: Revelação do resultado prático -> Ato 4: Resolução desimpedida no WhatsApp).
- Signature Move Espacial: Implemente um movimento tridimensional característico e inesquecível ao rolar a página (ex: escala coordenada de profundidade enquanto o card de especificações se fixa e o fundo se desloca em velocidade assimétrica).
- Proibição Rígida Anti-Clichê: Proibido bonecos 3D clay, proibido caixas isométricas flutuantes, proibido grids repetitivos de features.`
    : `- GSAP + ScrollTrigger + Lenis Integrados: A rolagem DEVE ser cinematográfica (60fps smooth scroll) via Lenis sincronizado com GSAP ScrollTrigger:
  <script src="https://unpkg.com/lenis@1.1.18/dist/lenis.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
  Inicialização obrigatória no script:
  const lenis = new Lenis({ duration: 1.2, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
- SplitType (~3kb) com Aceternity TextGenerateEffect: Utilize SplitType para dividir os títulos principais em caracteres/palavras e aplicar animação com blur e stagger de entrada suave:
  <script src="https://unpkg.com/split-type"></script>
  const split = new SplitType('.split-title', { types: 'words, chars' });
  gsap.from(split.chars, { opacity: 0, y: 18, filter: 'blur(8px)', stagger: 0.018, duration: 0.85, ease: 'power3.out' });`
}
- Aceternity UI Components:
  * Spotlight: Luz ambiente suave desfocada na Hero (ex: div com blur-3xl, gradiente translúcido âmbar/esmeralda e animate-pulse).
  * BackgroundBeams / Mesh: Texturas de fundo delicadas (linhas finas ou gradientes sutis) para profundidade e evitar fundos chapados.
- shadcn/ui Design Tokens:
  * Badges minimalistas no topo das seções (ex: inline-flex items-center gap-2 px-3 py-1 rounded-full border border-stone-200 bg-white/80 backdrop-blur-sm text-xs font-medium text-stone-700 shadow-sm).
  * Cards elegantes com bordas sutis (border border-stone-200/80 bg-white/70 backdrop-blur-sm hover:shadow-lg transition-all).
  * Botões com tipografia refinada e cantos calculados.

[Texto e Conteúdo]
Tom de Voz Humano: Copies diretas, focadas em benefícios reais para o cliente. Proibido o uso de jargões clichês de IA (ex: "revolucionário", "a solução definitiva", "no mundo dinâmico de hoje"). Não use excesso de emojis ou exclamações.

[Estilização e Dinamismo Frontend - Tailwind CSS & React]
- Tailwind CSS Obrigatório: Utilize Tailwind CSS extensivamente para construir um design visual de altíssimo nível estético, elegante, harmônico e 100% responsivo, com tipografia editorial refinada, espaçamentos generosos (whitespace), micro-interações, sombras suaves e estados de hover envolventes.
- React se Necessário: Se for necessário para deixar o site ainda mais bonito, fluido e dinâmico, utilize React (carregado via CDN com Babel standalone diretamente no documento HTML) ou JavaScript moderno para implementar componentes interativos reativos de alta conversão (como alternador de abas de soluções, filtros interativos de galeria/portfólio, calculadora/simulador de orçamento instantâneo, comparador antes/depois ou modais contextuais).
${
  logoBase64
    ? `\n[LOGO OFICIAL DA MARCA ANEXADO PELO CLIENTE]\nO cliente forneceu o logo oficial da empresa ('${logoNomeArquivo || "logo"}'). No cabeçalho (navbar/header) e no rodapé (footer), UTILIZE A IMAGEM DO LOGO fornecida através da tag <img src="${logoBase64}" alt="${empresa.nome}" class="h-10 sm:h-12 w-auto object-contain" /> ao invés de usar apenas texto tipográfico simples!`
    : ""
}
${
  instrucoesDesignMd
    ? `\n[DIRETRIZES DE DESIGN E BRANDING ANEXADAS PELO CLIENTE (.MD)]\nO cliente anexou as seguintes instruções e especificações de design que DEVEM ser rigorosamente respeitadas e incorporadas no código, cores, tipografia e layout:\n---\n${instrucoesDesignMd}\n---\n`
    : ""
}
REGRAS DE RETORNO TÉCNICO:
- Retorne APENAS o código HTML5 completo (começando em <!DOCTYPE html> e terminando em </html>), sem blocos de texto ou explicações antes ou depois.
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
- Use Google Fonts com fontes contrastantes (ex: Outfit ou Cinzel para títulos, Plus Jakarta Sans para o corpo).
- No <style>, configure o suporte do Lenis e da animação de caracteres:
  html.lenis, html.lenis body { height: auto; }
  .lenis.lenis-smooth { scroll-behavior: auto !important; }
  .char { display: inline-block; will-change: transform, opacity, filter; }
- DIRETRIZES DE IMAGENS FOTOGRÁFICAS GERADAS POR IA (IMAGENS 100% REAIS, ATIVAS E SEM LINKS QUEBRADOS):
  * NUNCA utilize IDs ou links aleatórios do Unsplash (ex: photo-1517...) porque eles não existem e causam erros 404 de imagem quebrada.
  * Todas as imagens fotográficas do site (Hero/Capa, Destaque/Sobre Nós, Cards de Serviços e Portfólio) DEVEM utilizar o gerador de imagens por IA (FLUX.1) no formato:
    https://image.pollinations.ai/prompt/{PROMPT_EM_INGLES_DESCRITIVO_DO_NICHO}?width={LARGURA}&height={ALTURA}&model=flux&nologo=true
  * O {PROMPT_EM_INGLES_DESCRITIVO_DO_NICHO} DEVE ser escrito em inglês fotográfico rico e cinematográfico especificando o nicho (${empresa.segmento}), a cidade (${empresa.cidade} Serra Gaúcha Brazil) e estilo de iluminação natural/arquitetônica (ex: 'luxurious modern showroom in ${empresa.cidade} brazil, architectural photography 8k, cinematic lighting').
  * Para a Hero/Capa: width=1600&height=900.
  * Para a seção Sobre/Destaque: width=1200&height=800.
  * Para cada Card de Serviço/Produto: width=800&height=600 com foco na especialidade descrita.
  * Em todas as tags <img>, adicione loading="lazy", decoding="async", onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';", a classe "w-full h-full object-cover" e atributo alt em português descrevendo com precisão o que a imagem retrata.
- Inclua botão de WhatsApp funcional com link wa.me/55...`;

  // 4. Montagem do User Prompt
  const promptUser = `[Especificação do Nicho]Agora, aplique todas as regras acima para criar o site completo do seguinte nicho:

EMPRESA E LOCALIZAÇÃO:
- Nome da Empresa: ${empresa.nome}
- Nicho / Segmento: ${empresa.segmento}
- Área de Atuação Detalhada: ${empresa.areaAtuacao || empresa.segmento}
- Cidade: ${empresa.cidade}/RS (Serra Gaúcha)
- Endereço: ${empresa.endereco || ""}
- Telefone / WhatsApp: ${empresa.whatsapp || empresa.telefone || ""}
- E-mail: ${empresa.email || ""}

DADOS DO DIAGNÓSTICO E RELATÓRIO DO CLIENTE:
${diagnosticoItens.length > 0 ? diagnosticoItens.map((d) => `- ${d}`).join("\n") : "- Empresa necessita de presença digital completa e profissional alinhada ao alto padrão dos seus serviços."}
- O novo site deve resolver todas as falhas diagnosticadas com estrutura ONE-PAGE (Landing Page fluida e contínua), carregamento rápido, excelente legibilidade mobile e CTA claro para WhatsApp.

DADOS DO DOSSIÊ 360 DO LEAD:
${dossierPersonas.length > 0 ? `- Perfil do público/persona: ${JSON.stringify(dossierPersonas.slice(0, 2))}.` : `- Público-alvo: Clientes residenciais e comerciais de ${empresa.cidade} e região que buscam confiança e acabamento de alto nível.`}
${dossierObjecoes.length > 0 ? `- Objeções comuns no fechamento comercial: ${JSON.stringify(dossierObjecoes.slice(0, 3))}.` : "- Objeções a contornar nos textos: insegurança com prazo de entrega e qualidade dos materiais."}
${dossierDiferenciais.length > 0 ? `- Diferenciais competitivos: ${JSON.stringify(dossierDiferenciais.slice(0, 3))}.` : `- Diferenciais locais: atendimento próximo, pontualidade e referência em ${empresa.cidade}.`}

PESQUISA WEB LOCAL EM TEMPO REAL:
${pesquisaSnippets.length > 0 ? pesquisaSnippets.slice(0, 4).join("\n") : "- Referência de mercado regional consolidada com atendimento consultivo."}
Diferenciais detectados no mercado: ${diferenciaisDetectados.length > 0 ? diferenciaisDetectados.join(", ") : "Qualidade artesanal, pontualidade e transparência."}
${
  instrucoesDesignMd
    ? `\nINSTRUÇÕES ADICIONAIS DE DESIGN FORNECIDAS PELO USUÁRIO (.MD):\n${instrucoesDesignMd}`
    : ""
}

ESTILIZAÇÃO E DINAMISMO:
- Crie o site no formato ONE-PAGE (Landing Page Cinematográfica) reunindo todas as informações em uma única página rica com navegação suave por âncoras.
${
  motorScroll === "scrollcraft_canvas"
    ? "- MOTOR: ScrollCraft Canvas Scrubbed (singhharsh1708/scrollcraft). Estágio fixado com <canvas id=\"hero-canvas\"> animado e scrubbed via GSAP ScrollTrigger, overlays narrativos em 3 etapas progressivas e máxima pontuação no Lighthouse."
    : motorScroll === "scrollcraft_dimensional"
    ? "- MOTOR: Scroll-Craft Dimensional Scrollytelling (nateherkai/scroll-craft). 3 planos de profundidade independentes (fundo, sujeito, primeiro plano com oclusão), curva de sentimento em 4 atos e signature move espacial."
    : "- MOTOR: Padrão Editorial GSAP + ScrollTrigger + Lenis para rolagem a 60fps, SplitType para o Aceternity TextGenerateEffect nos títulos principais, iluminação Spotlight e tokens visuais minimalistas do shadcn/ui."
}

Gere agora o código HTML5 completo do site ONE-PAGE seguindo rigorosamente todas as regras humanas Anti-IA (sem nenhum marquee), com todas as imagens geradas por FLUX.1.`;

  return { promptSystem, promptUser };
}
