/**
 * Motor de Geração de Sites e Landing Pages de Alta Conversão
 * Baseado no Manifesto de Design Editorial Anti-IA e Animações Fluidas via GSAP e ScrollTrigger.
 */

import { createServerFn } from "@tanstack/react-start";
import type { EmpresaCtx } from "./ai.functions";
import { chamarLlmUniversal } from "./llm-provider.server";
import { PROMPT_BLOCO_SKILLS_CLAUDE } from "./skills-claude-prompt";
import { gerarUrlPollinationsFlux } from "./image-generator.server";
import { montarPromptSiteCompleto } from "./site-generator-prompt";

export interface PesquisaWebSiteResult {
  query: string;
  fontes: string[];
  snippets: string[];
  diferenciaisDetectados: string[];
  servicosDetectados: string[];
  resumoLocal: string;
}

export interface GerarSiteInput {
  empresa: EmpresaCtx;
  customKeys?: {
    groq?: string;
    gemini?: string;
    openrouter?: string;
    cerebras?: string;
    lovable?: string;
    ollamaBaseUrl?: string;
    openai?: string;
    anthropic?: string;
    perplexity?: string;
  };
  provedorPreferencial?:
    | "auto"
    | "groq"
    | "gemini"
    | "openrouter"
    | "cerebras"
    | "lovable"
    | "ollama"
    | "bespoke"
    | "openai"
    | "anthropic"
    | "perplexity";
  modeloPreferencial?: string;
  usarAntiIaBespoke?: boolean;
  usarSkillsClaude?: boolean;
  motorScroll?: "gsap_lenis_split" | "scrollcraft_canvas" | "scrollcraft_dimensional";
  skillsAdicionais?: Array<{ id: string; nome: string; prompt: string }>;
  customPromptOverride?: {
    promptSystem?: string;
    promptUser?: string;
  };
  diagnostico?: any;
  dossier360?: any;
  relatorio?: any;
  estiloVisual?: "editorial_clean" | "arquitetonico_minimalista" | "moderno_contemporaneo";
  logoBase64?: string;
  logoNomeArquivo?: string;
  instrucoesDesignMd?: string;
}

export interface GerarSiteOutput {
  html: string;
  pesquisaWeb: PesquisaWebSiteResult;
  provider: string;
  model: string;
  geradoEm: string;
}

export interface RefinarSiteInput {
  empresa: EmpresaCtx;
  siteHtmlAtual: string;
  mensagemUsuario: string;
  historicoChat?: Array<{ role: "user" | "assistant"; content: string }>;
  customKeys?: {
    groq?: string;
    gemini?: string;
    openrouter?: string;
    cerebras?: string;
    lovable?: string;
    ollamaBaseUrl?: string;
    openai?: string;
    anthropic?: string;
    perplexity?: string;
  };
  provedorPreferencial?:
    | "auto"
    | "groq"
    | "gemini"
    | "openrouter"
    | "cerebras"
    | "lovable"
    | "ollama"
    | "bespoke"
    | "openai"
    | "anthropic"
    | "perplexity";
  modeloPreferencial?: string;
  usarAntiIaBespoke?: boolean;
  usarSkillsClaude?: boolean;
  motorScroll?: "gsap_lenis_split" | "scrollcraft_canvas" | "scrollcraft_dimensional";
  skillsAdicionais?: Array<{ id: string; nome: string; prompt: string }>;
  logoBase64?: string;
  logoNomeArquivo?: string;
  instrucoesDesignMd?: string;
}

export interface RefinarSiteOutput {
  html: string;
  respostaAssistente: string;
  provider: string;
  model: string;
  geradoEm: string;
}

/**
 * Realiza pesquisa na web para enriquecer a geração do site com dados reais da empresa e mercado local.
 */
export async function pesquisarContextoParaSite(empresa: EmpresaCtx): Promise<PesquisaWebSiteResult> {
  const query = `"${empresa.nome}" "${empresa.cidade}" ${empresa.areaAtuacao || empresa.segmento}`;
  const snippets: string[] = [];
  const fontes: string[] = [];

  const serpApiKey =
    process.env.SERPAPI_API_KEY?.trim() ||
    "ec62da1cce88a0223fee434841dbaceef4b27c63b8825d53de8d25090ccdbe02";

  if (serpApiKey && serpApiKey.length > 20 && !serpApiKey.includes(":")) {
    try {
      const url = new URL("https://serpapi.com/search.json");
      url.searchParams.set("q", query);
      url.searchParams.set("engine", "google");
      url.searchParams.set("api_key", serpApiKey);
      url.searchParams.set("hl", "pt-br");
      url.searchParams.set("gl", "br");

      const res = await fetch(url.toString(), {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        },
      });

      if (res.ok) {
        const json = (await res.json()) as {
          organic_results?: Array<{ title?: string; link?: string; snippet?: string }>;
          knowledge_graph?: { title?: string; description?: string; type?: string };
        };

        if (json.knowledge_graph?.description) {
          snippets.push(`Descrição oficial: ${json.knowledge_graph.description}`);
        }

        if (json.organic_results && json.organic_results.length > 0) {
          json.organic_results.slice(0, 5).forEach((r) => {
            if (r.snippet) snippets.push(`${r.title}: ${r.snippet}`);
            if (r.link) fontes.push(r.link);
          });
        }
      }
    } catch (err) {
      console.warn("[SiteGenerator] Pesquisa SerpApi falhou:", err);
    }
  }

  // Se não obteve snippets suficientes pelo SerpApi, consulta busca pública complementar
  if (snippets.length === 0) {
    try {
      const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const res = await fetch(ddgUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });
      if (res.ok) {
        const html = await res.text();
        const matches = html.match(/<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/g);
        if (matches) {
          matches.slice(0, 4).forEach((m) => {
            const clean = m.replace(/<[^>]+>/g, "").trim();
            if (clean) snippets.push(clean);
          });
        }
      }
    } catch (err) {
      console.warn("[SiteGenerator] Fallback DuckDuckGo falhou:", err);
    }
  }

  const servicosDetectados = [
    empresa.areaAtuacao || `Especialidade em ${empresa.segmento}`,
    `Atendimento personalizado para ${empresa.cidade} e Serra Gaúcha`,
    "Execução técnica rigorosa com pontualidade",
    "Garantia de procedência e suporte pós-venda",
  ];

  const diferenciaisDetectados = [
    `Localização e atendimento consolidado em ${empresa.cidade}`,
    "Contato direto sem burocracia via WhatsApp",
    "Padrão de qualidade reconhecido na região",
  ];

  return {
    query,
    fontes: fontes.slice(0, 5),
    snippets: snippets.slice(0, 6),
    servicosDetectados,
    diferenciaisDetectados,
    resumoLocal: `Empresa atuante no segmento de ${empresa.segmento} com presença em ${empresa.cidade}/RS.`,
  };
}

/**
 * Retorna imagens fotográficas em alta resolução geradas por IA (FLUX.1) contextualmente
 * mapeadas pelo nicho da empresa e cidade, garantindo links ativos e estética cinematográfica.
 */
export function getImagensPorSegmento(segmento?: string, cidade?: string, empresaNome?: string) {
  const s = (segmento || "").toLowerCase();
  const cid = cidade || "Serra Gaúcha";

  // Vidraçaria, vidros temperados, esquadrias e fachadas
  if (s.includes("vidr") || s.includes("esquadr") || s.includes("fachad") || s.includes("box") || s.includes("espelho")) {
    return {
      hero: gerarUrlPollinationsFlux(`modern architectural glass facade and minimalist frameless tempered glass balustrade in ${cid} brazil architectural photography 8k cinematic lighting`, 1600, 900),
      destaque: gerarUrlPollinationsFlux(`artisan glazier workshop precision glass craftsmanship and custom aluminum frames in ${cid}`, 1200, 800),
      servicos: [
        gerarUrlPollinationsFlux(`crystal clear tempered glass shower enclosure bathroom luxury interior design`, 800, 600),
        gerarUrlPollinationsFlux(`minimalist glass and aluminum sliding doors modern living room terrace`, 800, 600),
        gerarUrlPollinationsFlux(`commercial building glass curtain wall facade architecture reflection`, 800, 600),
      ],
    };
  }

  // Vinícolas, vinhos e enoturismo
  if (s.includes("vin") || s.includes("enot") || s.includes("uva")) {
    return {
      hero: gerarUrlPollinationsFlux(`scenic rolling vineyard hills with grapevines in ${cid} serra gaucha brazil sunset cinematic lighting 8k`, 1600, 900),
      destaque: gerarUrlPollinationsFlux(`rustic modern wine cellar with oak aging barrels and sommelier tasting table in ${cid}`, 1200, 800),
      servicos: [
        gerarUrlPollinationsFlux(`fine wine bottle and crystal glass on rustic stone table vineyard background`, 800, 600),
        gerarUrlPollinationsFlux(`guided vineyard tour and enotourism experience serra gaucha`, 800, 600),
        gerarUrlPollinationsFlux(`harvesting premium grapes vineyard agricultural craftsmanship`, 800, 600),
      ],
    };
  }

  // Marmoraria e pedras decorativas
  if (s.includes("marm") || s.includes("granit") || s.includes("pedra") || s.includes("quartzo")) {
    return {
      hero: gerarUrlPollinationsFlux(`luxurious modern kitchen with exotic brazilian granite waterfall island countertop in ${cid} architectural photography 8k cinematic lighting`, 1600, 900),
      destaque: gerarUrlPollinationsFlux(`artisan stone cutter precision polishing natural marble slab in workshop atmospheric lighting`, 1200, 800),
      servicos: [
        gerarUrlPollinationsFlux(`custom luxury calacatta marble bathroom vanity countertop interior design`, 800, 600),
        gerarUrlPollinationsFlux(`exterior granite facade cladding modern commercial building architectural detail`, 800, 600),
        gerarUrlPollinationsFlux(`quartzite tabletop architectural macro texture natural stone veins`, 800, 600),
      ],
    };
  }

  // Móveis planejados, marcenaria e design de interiores
  if (s.includes("móvel") || s.includes("movel") || s.includes("decor") || s.includes("planej") || s.includes("marcen")) {
    return {
      hero: gerarUrlPollinationsFlux(`bespoke luxury custom furniture cabinetry modern open concept apartment interior design ${cid} architectural photography 8k`, 1600, 900),
      destaque: gerarUrlPollinationsFlux(`master woodworker artisan workshop precision custom joinery woodworking tools`, 1200, 800),
      servicos: [
        gerarUrlPollinationsFlux(`custom gourmet kitchen cabinets with integrated warm led lighting`, 800, 600),
        gerarUrlPollinationsFlux(`luxury master bedroom suite walk in closet custom joinery`, 800, 600),
        gerarUrlPollinationsFlux(`executive home office library woodwork solid timber desk`, 800, 600),
      ],
    };
  }

  // Gastronomia, restaurantes, cafés e bares
  if (s.includes("rest") || s.includes("gastro") || s.includes("café") || s.includes("pizz") || s.includes("bar")) {
    return {
      hero: gerarUrlPollinationsFlux(`ambient gourmet fine dining restaurant dining room moody warm lighting modern rustic aesthetic ${cid}`, 1600, 900),
      destaque: gerarUrlPollinationsFlux(`chef plating culinary dish in restaurant kitchen artisanal presentation`, 1200, 800),
      servicos: [
        gerarUrlPollinationsFlux(`exquisite culinary dish fine dining presentation fresh local ingredients`, 800, 600),
        gerarUrlPollinationsFlux(`handcrafted artisanal pizza wood fired oven golden crust`, 800, 600),
        gerarUrlPollinationsFlux(`specialty coffee espresso brewing latte art cozy cafe bar`, 800, 600),
      ],
    };
  }

  // Saúde, clínicas médicas e odontologia
  if (s.includes("saúde") || s.includes("saude") || s.includes("clínic") || s.includes("clinic") || s.includes("médic") || s.includes("medic") || s.includes("odonto")) {
    return {
      hero: gerarUrlPollinationsFlux(`state of the art medical clinic interior bright minimalist reception gentle natural daylight ${cid}`, 1600, 900),
      destaque: gerarUrlPollinationsFlux(`friendly doctor physician consulting with patient in modern consultation room`, 1200, 800),
      servicos: [
        gerarUrlPollinationsFlux(`modern dental examination treatment suite high tech equipment`, 800, 600),
        gerarUrlPollinationsFlux(`wellness and rehabilitation private therapy room peaceful ambience`, 800, 600),
        gerarUrlPollinationsFlux(`advanced medical diagnostic tools precision healthcare`, 800, 600),
      ],
    };
  }

  // Hotelaria, pousadas e turismo
  if (s.includes("hotel") || s.includes("pousad") || s.includes("turism") || s.includes("chalé")) {
    return {
      hero: gerarUrlPollinationsFlux(`luxury boutique hotel chalet panoramic mountain view terrace serra gaucha brazil morning mist 8k`, 1600, 900),
      destaque: gerarUrlPollinationsFlux(`cozy hotel fireplace lounge rustic stone and wood warm atmosphere`, 1200, 800),
      servicos: [
        gerarUrlPollinationsFlux(`deluxe hotel bedroom suite king bed crisp white linens scenic view`, 800, 600),
        gerarUrlPollinationsFlux(`gourmet breakfast buffet spread fresh bread fruit cheeses`, 800, 600),
        gerarUrlPollinationsFlux(`outdoor spa hot tub overlooking serene nature forest`, 800, 600),
      ],
    };
  }

  // Advocacia e consultoria jurídica
  if (s.includes("advoc") || s.includes("juríd") || s.includes("jurid") || s.includes("lei")) {
    return {
      hero: gerarUrlPollinationsFlux(`prestigious modern law firm boardroom solid oak table panoramic window warm lighting ${cid} 8k`, 1600, 900),
      destaque: gerarUrlPollinationsFlux(`lawyer attorney consulting with client across executive wooden desk`, 1200, 800),
      servicos: [
        gerarUrlPollinationsFlux(`legal documents and leather bound law books on mahogany desk`, 800, 600),
        gerarUrlPollinationsFlux(`corporate contract negotiation professional conference room`, 800, 600),
        gerarUrlPollinationsFlux(`private law library classic and contemporary architecture`, 800, 600),
      ],
    };
  }

  // Padrão Premium Corporativo / Serviços
  return {
    hero: gerarUrlPollinationsFlux(`modern prestigious commercial headquarters architecture glass facade in ${cid} brazil 8k cinematic lighting`, 1600, 900),
    destaque: gerarUrlPollinationsFlux(`dedicated professional team collaboration in modern sunlit office space`, 1200, 800),
    servicos: [
      gerarUrlPollinationsFlux(`strategic consulting and project execution presentation board`, 800, 600),
      gerarUrlPollinationsFlux(`client service and consultation welcoming reception area`, 800, 600),
      gerarUrlPollinationsFlux(`high quality commercial delivery and customer satisfaction`, 800, 600),
    ],
  };
}

/**
 * Pós-processador obrigatório: Varre o HTML gerado e garante que todas as tags <img>
 * possuam URLs generativas ativas (FLUX.1) sem links quebrados, com atributo onerror resiliente.
 */
export function garantirImagensValidasNoHtml(html: string, empresa: EmpresaCtx): string {
  if (!html) return html;

  const seg = empresa.segmento || "Serviços";
  const cid = empresa.cidade || "Serra Gaúcha";
  const backupFallback = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80";

  let imgCounter = 0;

  return html.replace(/<img\b([^>]*?)>/gi, (match, atributos) => {
    imgCounter++;

    // Extrai o src atual
    const srcMatch = atributos.match(/\bsrc\s*=\s*(["'])(.*?)\1/i);
    const src = srcMatch ? srcMatch[2].trim() : "";

    // Extrai o alt atual
    const altMatch = atributos.match(/\balt\s*=\s*(["'])(.*?)\1/i);
    const alt = altMatch ? altMatch[2].trim() : "";

    // Verifica se é logo (se for logo oficial ou dataUrl de logo, não substitui)
    const isLogo =
      src.toLowerCase().includes("logo") ||
      alt.toLowerCase().includes("logo") ||
      atributos.toLowerCase().includes("logo") ||
      src.startsWith("data:image/");

    if (isLogo) {
      return match;
    }

    // Verifica se a URL é inválida, vazia, quebrada, placeholder ou relativa
    const ehInvalida =
      !src ||
      src === "#" ||
      src === "/" ||
      src.startsWith("images/") ||
      src.startsWith("img/") ||
      src.startsWith("./") ||
      src.startsWith("../") ||
      src.includes("via.placeholder") ||
      src.includes("placeholder.com") ||
      src.includes("example.com") ||
      (src.includes("unsplash.com") && !src.includes("?auto=format"));

    let novoSrc = src;

    if (ehInvalida) {
      let largura = 800;
      let altura = 600;
      let promptIngles = "";

      if (imgCounter === 1 || alt.toLowerCase().includes("hero") || alt.toLowerCase().includes("capa")) {
        largura = 1600;
        altura = 900;
        promptIngles = `luxurious modern ${seg} in ${cid} brazil architectural photography 8k cinematic lighting photorealistic`;
      } else if (imgCounter === 2 || alt.toLowerCase().includes("destaque") || alt.toLowerCase().includes("sobre")) {
        largura = 1200;
        altura = 800;
        promptIngles = `artisan craftsmanship professional workshop and consultation in ${seg} in ${cid}`;
      } else {
        largura = 800;
        altura = 600;
        promptIngles = `${alt || seg} high quality detail commercial presentation in ${cid}`;
      }

      novoSrc = gerarUrlPollinationsFlux(promptIngles, largura, altura);
    }

    let novosAtributos = atributos;

    if (srcMatch) {
      novosAtributos = novosAtributos.replace(/\bsrc\s*=\s*(["'])(.*?)\1/i, `src="${novoSrc}"`);
    } else {
      novosAtributos += ` src="${novoSrc}"`;
    }

    if (!novosAtributos.includes("onerror=")) {
      novosAtributos += ` onerror="this.onerror=null; this.src='${backupFallback}';"`;
    }

    if (!novosAtributos.includes("loading=")) {
      novosAtributos += ` loading="lazy"`;
    }

    if (!novosAtributos.includes("decoding=")) {
      novosAtributos += ` decoding="async"`;
    }

    return `<img${novosAtributos}>`;
  });
}

/**
 * Gera um site profissional 100% conforme as diretrizes estritas do Manifesto Anti-IA:
 * - Fundo limpo e acolhedor (warm linen/off-white), zero fundos pretos/roxos com neon
 * - Paleta contida de 3 cores (carvão escuro, linho claro, detalhe terracota/verde-oliva)
 * - Hero section de alto impacto em grande angular com título forte e CTA claro
 * - Animações GSAP e ScrollTrigger coordenadas (intro fluida na Hero e parallax nas imagens)
 * - Grid assimétrico com respiro generoso (sem o clichê de 3 cards idênticos)
 * - Copy humanizado e direto, sem jargões de IA
 */
export function construirSiteEditorialAntiIa(
  empresa: EmpresaCtx,
  pesquisa: PesquisaWebSiteResult,
  opcoes?: {
    logoBase64?: string;
    instrucoesDesignMd?: string;
    diagnostico?: any;
    relatorio?: any;
    motorScroll?: "gsap_lenis_split" | "scrollcraft_canvas" | "scrollcraft_dimensional";
  },
): string {
  const motor = opcoes?.motorScroll || "gsap_lenis_split";
  const whatsappNum = (empresa.whatsapp || empresa.telefone || "54999999999").replace(/\D/g, "");
  const whatsappLink = `https://wa.me/55${whatsappNum}?text=${encodeURIComponent(
    `Olá ${empresa.nome}! Conheci o trabalho de vocês e gostaria de solicitar um orçamento para o meu projeto.`,
  )}`;

  const city = empresa.cidade || "Serra Gaúcha";
  const segmento = empresa.segmento || "Serviços Especializados";
  const area = empresa.areaAtuacao || segmento;
  const imagens = getImagensPorSegmento(empresa.segmento, empresa.cidade, empresa.nome);

  const htmlTemplate = `<!DOCTYPE html>
<html lang="pt-BR" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${empresa.nome} · ${area} em ${city}</title>
  <meta name="description" content="${empresa.nome}: projetos e soluções em ${area} com acabamento impecável, pontualidade e atendimento consultivo em ${city}/RS.">
  
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Google Fonts: Outfit (Títulos) & Plus Jakarta Sans (Corpo) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>
  
  <!-- Lenis Smooth Scroll -->
  <script src="https://unpkg.com/lenis@1.1.18/dist/lenis.min.js"></script>

  <!-- SplitType (~3kb) para TextGenerateEffect cinematográfico -->
  <script src="https://unpkg.com/split-type"></script>

  <!-- GSAP & ScrollTrigger -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>

  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Plus Jakarta Sans', 'sans-serif'],
            heading: ['Outfit', 'sans-serif'],
          },
          colors: {
            canvas: '#FAF8F5',
            ink: '#18181B',
            accent: '#B45309', // Tom terracota/âmbar refinado
            stoneBorder: '#E7E5E4'
          }
        }
      }
    }
  </script>

  <style>
    html.lenis, html.lenis body {
      height: auto;
    }
    .lenis.lenis-smooth {
      scroll-behavior: auto !important;
    }
    .lenis.lenis-smooth [data-lenis-prevent] {
      overscroll-behavior: contain;
    }
    .lenis.lenis-stopped {
      overflow: hidden;
    }
    .lenis.lenis-smooth iframe {
      pointer-events: none;
    }
    body {
      background-color: #FAF8F5;
      color: #18181B;
      font-feature-settings: "cv02", "cv03", "cv04", "cv11";
    }
    .parallax-wrap {
      overflow: hidden;
    }
    .parallax-img {
      will-change: transform;
    }
    .char {
      display: inline-block;
      will-change: transform, opacity, filter;
    }
  </style>
</head>
<body class="selection:bg-stone-800 selection:text-white antialiased min-h-screen flex flex-col justify-between">

  <!-- BARRA DE LOCALIZAÇÃO EDITORIAL -->
  <div class="border-b border-stone-200/80 bg-[#F4F1EA] text-stone-700 text-xs py-2 px-4 sm:px-8 flex items-center justify-between">
    <div class="flex items-center gap-2">
      <span class="inline-block size-2 rounded-full bg-emerald-600"></span>
      <span class="font-medium text-[11px] sm:text-xs">Atendimento presencial e projetos em <strong>${city}</strong> e toda a Serra Gaúcha</span>
    </div>
    <div class="hidden sm:flex items-center gap-4 text-[11px] text-stone-600">
      <span>Segunda a Sexta · 08h às 18h</span>
    </div>
  </div>

  <!-- NAVEGAÇÃO MULTI-PÁGINAS -->
  <header class="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-stone-200/80">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
      <a href="#home" class="flex items-center gap-3">
        ${
          opcoes?.logoBase64
            ? `<img src="${opcoes.logoBase64}" alt="${empresa.nome}" class="h-10 sm:h-12 w-auto max-w-[180px] object-contain" />`
            : `<div class="flex flex-col">
                <span class="font-heading font-extrabold text-xl sm:text-2xl tracking-tight text-ink uppercase">${empresa.nome}</span>
                <span class="text-[10px] sm:text-[11px] tracking-widest uppercase text-stone-500 font-semibold">${area}</span>
              </div>`
        }
      </a>

      <!-- MENU DESKTOP COMPLETO (TODAS AS PÁGINAS) -->
      <nav class="hidden lg:flex items-center gap-7 text-xs font-semibold uppercase tracking-wider text-stone-600">
        <a href="#home" class="hover:text-ink transition-colors">Início</a>
        <a href="#sobre" class="hover:text-ink transition-colors">Quem Somos</a>
        <a href="#solucoes" class="hover:text-ink transition-colors">Especialidades</a>
        <a href="#projetos" class="hover:text-ink transition-colors">Portfólio</a>
        <a href="#diferenciais" class="hover:text-ink transition-colors">Diferenciais</a>
        <a href="#contato" class="hover:text-ink transition-colors">Contato</a>
      </nav>

      <div class="flex items-center gap-3">
        <a href="${whatsappLink}" target="_blank" rel="noopener" class="hidden sm:inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-none border border-ink bg-ink text-white hover:bg-stone-800 text-xs font-semibold uppercase tracking-wider transition-all">
          <i data-lucide="message-circle" class="size-4"></i>
          <span>Solicitar Orçamento</span>
        </a>
        <button id="mobile-nav-toggle" class="lg:hidden p-2 text-ink hover:bg-stone-200/60 rounded" aria-label="Abrir Menu">
          <i data-lucide="menu" class="size-6"></i>
        </button>
      </div>
    </div>

    <!-- MENU MOBILE RETRÁTIL -->
    <div id="mobile-nav-menu" class="hidden lg:hidden bg-[#FAF8F5] border-b border-stone-300 px-6 py-4 space-y-2 text-xs font-semibold uppercase tracking-wider text-stone-700 shadow-lg">
      <a href="#home" class="block py-2 hover:text-ink border-b border-stone-200">Início</a>
      <a href="#sobre" class="block py-2 hover:text-ink border-b border-stone-200">Quem Somos</a>
      <a href="#solucoes" class="block py-2 hover:text-ink border-b border-stone-200">Especialidades</a>
      <a href="#projetos" class="block py-2 hover:text-ink border-b border-stone-200">Portfólio</a>
      <a href="#diferenciais" class="block py-2 hover:text-ink border-b border-stone-200">Diferenciais & Garantias</a>
      <a href="#contato" class="block py-2 hover:text-ink">Contato & Orçamento</a>
      <div class="pt-2">
        <a href="${whatsappLink}" target="_blank" rel="noopener" class="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-ink text-white text-xs font-semibold uppercase">
          <i data-lucide="message-circle" class="size-4"></i> Orçamento no WhatsApp
        </a>
      </div>
    </div>
  </header>

  ${
    motor === "scrollcraft_canvas"
      ? `<!-- HERO SECTION: SCROLLCRAFT CANVAS SCRUBBED STAGE (singhharsh1708/scrollcraft) -->
  <section id="home" class="relative">
    <div id="scrollcraft-pinned-container" class="relative h-[260vh] w-full">
      <div class="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center bg-stone-950">
        <!-- Canvas reativo e scrubbed 60fps -->
        <canvas id="hero-canvas" class="absolute inset-0 w-full h-full object-cover opacity-85"></canvas>
        <div class="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent pointer-events-none"></div>

        <!-- Overlays Narrativos em Etapas (Stepped Narrative Overlays) -->
        <div class="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white space-y-6">
          <div id="step-card-1" class="step-card space-y-4">
            <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-stone-500/60 bg-stone-900/80 backdrop-blur-md text-[11px] font-semibold text-stone-200 uppercase tracking-widest shadow-lg">
              <span class="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>ScrollCraft Engine · ${area} · ${city}/RS</span>
            </div>
            <h1 class="split-title font-heading font-extrabold text-3xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.1] text-white">
              Precisão milimétrica e acabamento nobre para projetos singulares.
            </h1>
            <p class="text-sm sm:text-lg text-stone-300 max-w-2xl mx-auto font-normal leading-relaxed">
              Role a página para explorar a estrutura e o detalhamento técnico em <strong>${city}</strong>.
            </p>
            <div class="pt-2">
              <span class="text-xs text-stone-400 font-mono tracking-wider animate-bounce block">Role para baixo ⬇</span>
            </div>
          </div>

          <div id="step-card-2" class="step-card hidden opacity-0 space-y-4">
            <span class="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">Rigor Construtivo & Norma Técnica</span>
            <h2 class="font-heading font-extrabold text-2xl sm:text-4xl lg:text-5xl tracking-tight text-white">
              Materiais nobres com procedência garantida e entrega pontual.
            </h2>
            <p class="text-sm sm:text-base text-stone-300 max-w-xl mx-auto">
              Cada etapa é supervisionada por quem entende do ofício e respeita seu investimento.
            </p>
          </div>

          <div id="step-card-3" class="step-card hidden opacity-0 space-y-4">
            <span class="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">Atendimento Consultivo Direto</span>
            <h2 class="font-heading font-extrabold text-2xl sm:text-4xl lg:text-5xl tracking-tight text-white">
              Pronto para dar início ao seu projeto?
            </h2>
            <div class="pt-2">
              <a href="${whatsappLink}" target="_blank" rel="noopener" class="px-8 py-4 bg-white text-ink text-xs font-bold uppercase tracking-widest hover:bg-stone-200 transition-all inline-flex items-center gap-2 shadow-xl">
                <span>Falar no WhatsApp com o Especialista</span>
                <i data-lucide="arrow-right" class="size-4 text-ink"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>`
      : motor === "scrollcraft_dimensional"
      ? `<!-- HERO SECTION: SCROLL-CRAFT DIMENSIONAL SCROLLYTELLING (nateherkai/scroll-craft) -->
  <section id="home" class="relative pt-12 pb-24 sm:pt-20 sm:pb-32 overflow-hidden bg-gradient-to-b from-[#FAF8F5] to-[#F4F1EA]">
    <!-- Plano 1: Fundo Atmosférico com malha sutil (z-0) -->
    <div class="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(#18181b_1px,transparent_1px)] [background-size:24px_24px] z-0"></div>
    <div class="pointer-events-none absolute -top-40 right-10 opacity-25 blur-3xl w-[500px] h-[500px] bg-amber-500/30 rounded-full animate-pulse z-0"></div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <!-- Plano 3: Primeiro Plano com Oclusão Dimensional (z-20) -->
        <div class="lg:col-span-7 z-20 space-y-6">
          <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-stone-300 bg-white/80 backdrop-blur-md text-[11px] font-semibold text-stone-700 uppercase tracking-widest shadow-xs">
            <span class="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Dimensional Scrollytelling · ${area} · ${city}/RS</span>
          </div>
          <h1 class="split-title font-heading font-extrabold text-3xl sm:text-5xl lg:text-6xl text-ink tracking-tight leading-[1.08]">
            Arquitetura e acabamento com profundidade tangível.
          </h1>
          <p class="text-base sm:text-lg text-stone-600 font-normal leading-relaxed max-w-xl">
            Conhecimento técnico que se traduz em acabamentos refinados, segurança e valorização do seu imóvel em <strong>${city}</strong>.
          </p>
          <div class="flex flex-wrap items-center gap-4 pt-2">
            <a href="${whatsappLink}" target="_blank" rel="noopener" class="px-7 py-3.5 bg-ink text-white text-xs font-bold uppercase tracking-wider hover:bg-stone-800 transition-all inline-flex items-center gap-2 shadow-sm">
              <span>Iniciar Atendimento no WhatsApp</span>
              <i data-lucide="arrow-right" class="size-4"></i>
            </a>
            <a href="#solucoes" class="px-7 py-3.5 border border-stone-300 text-stone-800 text-xs font-semibold uppercase tracking-wider hover:bg-stone-100 transition-colors">
              Explorar Soluções
            </a>
          </div>
        </div>

        <!-- Plano 2: Sujeito Principal com Perspectiva e Sombra Espacial (z-10) -->
        <div class="lg:col-span-5 z-10 relative">
          <div class="dimensional-subject parallax-wrap relative aspect-[4/5] rounded-lg overflow-hidden border border-stone-300 shadow-2xl transition-transform duration-700">
            <img
              src="${imagens.hero}"
              alt="${empresa.nome} em ${city}"
              class="parallax-img w-full h-full object-cover scale-105"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
              <span class="text-[10px] font-mono uppercase tracking-widest text-amber-300 font-semibold">Signature Craft Move</span>
              <p class="text-sm font-bold">${empresa.nome} · Excelência Construtiva</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>`
      : `<!-- HERO SECTION DE ALTO IMPACTO (DESIGN EDITORIAL + ACETERNITY SPOTLIGHT + SPLIT-TYPE) -->
  <section id="home" class="relative pt-12 pb-20 sm:pt-16 sm:pb-28 overflow-hidden">
    <!-- Aceternity Spotlight Glow Effect -->
    <div class="pointer-events-none absolute -top-40 left-0 md:left-60 md:-top-20 opacity-30 blur-3xl w-[600px] h-[600px] bg-gradient-to-tr from-amber-500/25 via-orange-400/20 to-transparent rounded-full animate-pulse"></div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      
      <!-- CABEÇALHO DO HERO -->
      <div class="max-w-3xl mb-10 sm:mb-14">
        <!-- shadcn/ui Badge Minimalista -->
        <div class="hero-item inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-stone-300 bg-white/70 backdrop-blur-sm text-[11px] font-semibold text-stone-700 uppercase tracking-widest shadow-sm mb-5">
          <span class="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Excelência em ${area} · ${city}/RS</span>
        </div>
        <h1 class="hero-item split-title font-heading font-extrabold text-3xl sm:text-5xl lg:text-6xl text-ink tracking-tight leading-[1.1]">
          Qualidade que valoriza o seu espaço com precisão e durabilidade.
        </h1>
        <p class="hero-item mt-5 text-base sm:text-lg text-stone-600 font-normal leading-relaxed max-w-2xl">
          Atendemos clientes exigentes que buscam pontualidade na entrega, orientação técnica clara e acabamento sem concessões em <strong>${city}</strong>.
        </p>
        <div class="hero-item mt-8 flex flex-wrap items-center gap-4">
          <a href="${whatsappLink}" target="_blank" rel="noopener" class="px-7 py-3.5 bg-ink text-white text-xs font-bold uppercase tracking-wider hover:bg-stone-800 transition-colors inline-flex items-center gap-2">
            <span>Iniciar Atendimento no WhatsApp</span>
            <i data-lucide="arrow-right" class="size-4"></i>
          </a>
          <a href="#solucoes" class="px-7 py-3.5 border border-stone-300 text-stone-800 text-xs font-semibold uppercase tracking-wider hover:bg-stone-100 transition-colors">
            Conhecer Soluções
          </a>
        </div>
      </div>

      <!-- IMAGEM AMPLA DA HERO COM PARALLAX SUAVE -->
      <div class="hero-item parallax-wrap relative aspect-[16/9] max-h-[560px] w-full rounded-sm overflow-hidden border border-stone-200 shadow-md">
        <img
          src="${imagens.hero}"
          alt="${empresa.nome} em ${city}"
          class="parallax-img hero-img w-full h-full object-cover"
        />
        <div class="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-stone-950/80 via-stone-950/30 to-transparent text-white flex flex-col sm:flex-row items-start sm:items-end justify-between gap-2">
          <div>
            <p class="text-xs uppercase tracking-widest font-semibold text-stone-300">Padrão de Execução</p>
            <p class="text-sm sm:text-base font-bold">${empresa.nome} · Compromisso com o resultado final</p>
          </div>
          <span class="text-xs text-stone-300 font-medium">${city} e Região</span>
        </div>
      </div>

    </div>
  </section>`
  }

  <!-- SEÇÃO DE DIFERENCIAIS ASSIMÉTRICOS (SEM GRIDS REPETITIVOS 3X3) -->
  <section id="diferenciais" class="py-20 sm:py-28 bg-[#F4F1EA] border-y border-stone-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        
        <!-- COLUNA ESQUERDA: DESTAQUE PRINCIPAL (7 COLUNAS) -->
        <div class="lg:col-span-7 space-y-6 reveal-block">
          <span class="text-xs font-bold uppercase tracking-widest text-stone-500">Por que escolher a nossa equipe</span>
          <h2 class="font-heading font-extrabold text-2xl sm:text-4xl text-ink tracking-tight leading-snug">
            Projetos pensados para quem não abre mão de segurança e pontualidade.
          </h2>
          <p class="text-sm sm:text-base text-stone-600 leading-relaxed font-normal">
            No mercado de ${segmento}, pequenos detalhes fazem toda a diferença. Nossa equipe atua de ponta a ponta: desde a medição e especificação correta até a entrega final com garantia documentada.
          </p>

          <div class="parallax-wrap relative aspect-[4/3] rounded-sm overflow-hidden border border-stone-300/80 mt-6 shadow-sm">
            <img src="${imagens.destaque}" alt="Acabamento ${empresa.nome}" class="parallax-img w-full h-full object-cover" />
          </div>
        </div>

        <!-- COLUNA DIREITA: CARDS VERTICAIS ASSIMÉTRICOS (5 COLUNAS) -->
        <div class="lg:col-span-5 space-y-6 pt-4 lg:pt-12">
          
          <div class="p-6 sm:p-8 bg-white border border-stone-200 rounded-sm shadow-xs reveal-block">
            <span class="text-xs font-mono font-bold text-stone-400">01</span>
            <h3 class="font-heading font-bold text-lg text-ink mt-2">Atendimento Direto e Consultivo</h3>
            <p class="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
              Você fala diretamente com quem entende do assunto. Sem intermediários ou respostas automáticas vazias: alinhamento claro das expectativas e prazos reais.
            </p>
          </div>

          <div class="p-6 sm:p-8 bg-white border border-stone-200 rounded-sm shadow-xs reveal-block">
            <span class="text-xs font-mono font-bold text-stone-400">02</span>
            <h3 class="font-heading font-bold text-lg text-ink mt-2">Materiais de Procedência e Norma Técnica</h3>
            <p class="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
              Trabalhamos exclusivamente com fornecedores homologados para garantir que cada peça instalada mantenha a integridade estrutural e estética ao longo dos anos.
            </p>
          </div>

          <div class="p-6 sm:p-8 bg-white border border-stone-200 rounded-sm shadow-xs reveal-block">
            <span class="text-xs font-mono font-bold text-stone-400">03</span>
            <h3 class="font-heading font-bold text-lg text-ink mt-2">Cumprimento Rigoroso do Cronograma</h3>
            <p class="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
              Respeitamos seu tempo e sua obra. Data marcada é data cumprida, com comunicação ativa sobre cada etapa do processo.
            </p>
          </div>

        </div>

      </div>

    </div>
  </section>

  <!-- SEÇÃO DE ESPECIALIDADES E PRODUTOS (LAYOUT EDITORIAL) -->
  <section id="solucoes" class="py-20 sm:py-28 bg-[#FAF8F5]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <div class="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
        <div>
          <span class="text-xs font-bold uppercase tracking-widest text-stone-500">Nossas Soluções</span>
          <h2 class="font-heading font-extrabold text-2xl sm:text-4xl text-ink tracking-tight mt-2">
            Especialidades Desenvolvidas sob Medida
          </h2>
        </div>
        <a href="${whatsappLink}" target="_blank" rel="noopener" class="text-xs font-bold uppercase tracking-wider text-ink border-b-2 border-ink pb-1 hover:text-stone-600 transition-colors self-start md:self-auto">
          Consultar Catálogo Completo no WhatsApp ➔
        </a>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <div class="bg-white border border-stone-200 overflow-hidden reveal-block group">
          <div class="aspect-[4/3] overflow-hidden">
            <img src="${imagens.servicos[0]}" alt="Serviço 1" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
          </div>
          <div class="p-6">
            <h3 class="font-heading font-bold text-lg text-ink">${pesquisa.servicosDetectados[0] || "Projetos Sob Medida"}</h3>
            <p class="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
              Desenvolvimento técnico personalizado conforme a necessidade específica de cada cliente ou planta arquitetônica.
            </p>
          </div>
        </div>

        <div class="bg-white border border-stone-200 overflow-hidden reveal-block group">
          <div class="aspect-[4/3] overflow-hidden">
            <img src="${imagens.servicos[1]}" alt="Serviço 2" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
          </div>
          <div class="p-6">
            <h3 class="font-heading font-bold text-lg text-ink">${pesquisa.servicosDetectados[1] || "Instalação Especializada"}</h3>
            <p class="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
              Mão de obra qualificada e ferramentas adequadas para assegurar alinhamento impecável e funcionamento suave.
            </p>
          </div>
        </div>

        <div class="bg-white border border-stone-200 overflow-hidden reveal-block group">
          <div class="aspect-[4/3] overflow-hidden">
            <img src="${imagens.servicos[2]}" alt="Serviço 3" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
          </div>
          <div class="p-6">
            <h3 class="font-heading font-bold text-lg text-ink">${pesquisa.servicosDetectados[2] || "Manutenção e Suporte"}</h3>
            <p class="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
              Acompanhamento contínuo e reposição ágil de componentes para preservar seu investimento em perfeito estado.
            </p>
          </div>
        </div>

      </div>

    </div>
  </section>

  <!-- SEÇÃO DE PORTFÓLIO E CASOS DE SUCESSO (#projetos) -->
  <section id="projetos" class="py-20 sm:py-28 bg-[#F4F1EA] border-t border-stone-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <span class="text-xs font-bold uppercase tracking-widest text-stone-500">Portfólio & Casos de Sucesso</span>
          <h2 class="font-heading font-extrabold text-2xl sm:text-4xl text-ink tracking-tight mt-2">
            Projetos Executados com Precisão Técnica
          </h2>
          <p class="text-xs sm:text-sm text-stone-600 mt-2 max-w-2xl">
            Cada trabalho realizado em ${city} reflete nosso compromisso com o acabamento refinado e a durabilidade dos materiais.
          </p>
        </div>
        <a href="${whatsappLink}" target="_blank" rel="noopener" class="text-xs font-bold uppercase tracking-wider text-ink border-b-2 border-ink pb-1 hover:text-stone-600 transition-colors self-start md:self-auto">
          Solicitar Portfólio em PDF ➔
        </a>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div class="bg-white border border-stone-200 overflow-hidden reveal-block group shadow-xs">
          <div class="aspect-[16/10] overflow-hidden">
            <img src="${imagens.hero}" alt="Projeto Residencial ${empresa.nome}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
          </div>
          <div class="p-6">
            <span class="text-[10px] font-mono uppercase tracking-widest font-bold text-stone-400">Projeto Residencial · Alto Padrão</span>
            <h3 class="font-heading font-bold text-lg text-ink mt-1">Execução sob medida com acabamento contemporâneo</h3>
            <p class="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
              Integração harmoniosa de materiais nobres com medição precisa e alinhamento milimétrico, garantindo conforto e sofisticação.
            </p>
          </div>
        </div>

        <div class="bg-white border border-stone-200 overflow-hidden reveal-block group shadow-xs">
          <div class="aspect-[16/10] overflow-hidden">
            <img src="${imagens.destaque}" alt="Projeto Comercial ${empresa.nome}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
          </div>
          <div class="p-6">
            <span class="text-[10px] font-mono uppercase tracking-widest font-bold text-stone-400">Projeto Corporativo & Comercial</span>
            <h3 class="font-heading font-bold text-lg text-ink mt-1">Ambientes com segurança estrutural e presença de marca</h3>
            <p class="text-xs sm:text-sm text-stone-600 mt-2 leading-relaxed">
              Desenvolvimento estrutural em estrita conformidade com normas técnicas, priorizando luminosidade natural e durabilidade.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- SEÇÃO SOBRE A EMPRESA E QUEM SOMOS (#sobre) -->
  <section id="sobre" class="py-20 sm:py-28 bg-[#FAF8F5] border-t border-stone-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div class="lg:col-span-6 space-y-6 reveal-block">
          <span class="text-xs font-bold uppercase tracking-widest text-stone-500">História e Valores</span>
          <h2 class="font-heading font-extrabold text-2xl sm:text-4xl text-ink tracking-tight leading-snug">
            Uma trajetória construída com seriedade e respeito em ${city}
          </h2>
          <p class="text-sm sm:text-base text-stone-600 leading-relaxed font-normal">
            Fundada com a proposta de elevar os padrões de ${segmento} na Serra Gaúcha, a <strong>${empresa.nome}</strong> consolidou-se como referência por aliar conhecimento técnico e compromisso humano no atendimento.
          </p>
          <div class="space-y-3 pt-2">
            <div class="flex items-start gap-3">
              <i data-lucide="check" class="size-5 text-emerald-600 shrink-0 mt-0.5"></i>
              <p class="text-xs sm:text-sm text-stone-700">Equipe própria capacitada com foco em acabamento primoroso e limpeza no local da obra.</p>
            </div>
            <div class="flex items-start gap-3">
              <i data-lucide="check" class="size-5 text-emerald-600 shrink-0 mt-0.5"></i>
              <p class="text-xs sm:text-sm text-stone-700">Garantia formal documentada para cada serviço executado.</p>
            </div>
            <div class="flex items-start gap-3">
              <i data-lucide="check" class="size-5 text-emerald-600 shrink-0 mt-0.5"></i>
              <p class="text-xs sm:text-sm text-stone-700">Atendimento consultivo e próximo, orientando a melhor escolha para a sua necessidade.</p>
            </div>
          </div>
        </div>

        <div class="lg:col-span-6">
          <div class="parallax-wrap relative aspect-[4/3] rounded-sm overflow-hidden border border-stone-300 shadow-sm reveal-block">
            <img src="${imagens.servicos[0]}" alt="Equipe ${empresa.nome}" class="parallax-img w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- BANNER DE TRANSIÇÃO COM PARALLAX (FULL WIDTH EDITORIAL) -->
  <section class="relative py-28 sm:py-36 parallax-wrap overflow-hidden bg-stone-900 text-white">
    <img
      src="${imagens.hero}"
      alt="Ambiente ${empresa.nome}"
      class="parallax-img absolute inset-0 w-full h-[130%] object-cover opacity-30 -top-[15%]"
    />
    <div class="relative z-10 max-w-4xl mx-auto px-4 text-center space-y-6">
      <span class="text-xs font-bold uppercase tracking-widest text-stone-300">Compromisso e Confiança</span>
      <h2 class="font-heading font-extrabold text-2xl sm:text-4xl lg:text-5xl tracking-tight leading-tight">
        Pronto para transformar sua ideia em um projeto concreto e seguro?
      </h2>
      <p class="text-sm sm:text-base text-stone-300 max-w-xl mx-auto font-normal leading-relaxed">
        Envie as medidas aproximadas ou a descrição da sua necessidade e receba uma proposta técnica detalhada sem compromisso.
      </p>
      <div class="pt-4">
        <a href="${whatsappLink}" target="_blank" rel="noopener" class="px-8 py-4 bg-white text-ink text-xs font-bold uppercase tracking-widest hover:bg-stone-200 transition-colors inline-flex items-center gap-2">
          <i data-lucide="message-circle" class="size-4"></i>
          <span>Falar com o Responsável Técnico</span>
        </a>
      </div>
    </div>
  </section>

  <!-- SEÇÃO DE CONTATO E LOCALIZAÇÃO -->
  <section id="contato" class="py-20 sm:py-28 bg-[#FAF8F5] border-t border-stone-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        <div class="lg:col-span-5 space-y-6">
          <span class="text-xs font-bold uppercase tracking-widest text-stone-500">Canais de Contato</span>
          <h2 class="font-heading font-extrabold text-2xl sm:text-3xl text-ink tracking-tight">
            Venha conversar ou agende uma visita técnica
          </h2>
          <p class="text-sm text-stone-600 leading-relaxed font-normal">
            Estamos sediados em ${city} e atendemos toda a região da Serra Gaúcha. Teremos prazer em entender seu projeto em detalhes.
          </p>

          <div class="space-y-4 pt-2 text-sm text-stone-700">
            <div class="flex items-start gap-3">
              <i data-lucide="map-pin" class="size-5 text-stone-800 shrink-0 mt-0.5"></i>
              <div>
                <p class="font-semibold text-ink">${empresa.endereco || `${city}/RS`}</p>
                <p class="text-xs text-stone-500">Atendimento em toda a microrregião</p>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <i data-lucide="phone" class="size-5 text-stone-800 shrink-0 mt-0.5"></i>
              <div>
                <p class="font-semibold text-ink">${empresa.telefone || empresa.whatsapp || "(54) 99999-9999"}</p>
                <p class="text-xs text-stone-500">Atendimento telefônico e comercial</p>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <i data-lucide="mail" class="size-5 text-stone-800 shrink-0 mt-0.5"></i>
              <div>
                <p class="font-semibold text-ink">${empresa.email || `contato@${String(empresa.nome || "empresa").toLowerCase().replace(/\s+/g, "")}.com.br`}</p>
                <p class="text-xs text-stone-500">Envio de plantas e especificações</p>
              </div>
            </div>
          </div>
        </div>

        <!-- FORMULÁRIO DIRETO DE SOLICITAÇÃO -->
        <div class="lg:col-span-7 bg-white p-8 sm:p-10 border border-stone-200 shadow-sm rounded-sm">
          <h3 class="font-heading font-bold text-xl text-ink mb-2">Solicitar Orçamento de Projeto</h3>
          <p class="text-xs text-stone-500 mb-6">Preencha os campos abaixo para iniciar seu atendimento prioritário.</p>

          <form onsubmit="event.preventDefault(); window.open('${whatsappLink}', '_blank');" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">Seu Nome</label>
                <input type="text" required placeholder="Como podemos te chamar?" class="w-full px-4 py-3 border border-stone-300 rounded-none text-xs focus:outline-none focus:border-ink bg-[#FAF8F5]">
              </div>
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">Telefone / WhatsApp</label>
                <input type="tel" required placeholder="(XX) 99999-9999" class="w-full px-4 py-3 border border-stone-300 rounded-none text-xs focus:outline-none focus:border-ink bg-[#FAF8F5]">
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">Tipo de Projeto</label>
              <select class="w-full px-4 py-3 border border-stone-300 rounded-none text-xs focus:outline-none focus:border-ink bg-[#FAF8F5]">
                <option>${area}</option>
                <option>Projeto Residencial</option>
                <option>Projeto Corporativo / Comercial</option>
                <option>Manutenção ou Reforma</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-1">Descreva brevemente sua necessidade</label>
              <textarea rows="3" placeholder="Ex: Preciso de orçamento para instalação em obra nova em ${city}..." class="w-full px-4 py-3 border border-stone-300 rounded-none text-xs focus:outline-none focus:border-ink bg-[#FAF8F5]"></textarea>
            </div>

            <button type="submit" class="w-full py-4 bg-ink text-white text-xs font-bold uppercase tracking-wider hover:bg-stone-800 transition-colors flex items-center justify-center gap-2">
              <i data-lucide="send" class="size-4"></i>
              <span>Enviar e Abrir no WhatsApp</span>
            </button>
          </form>
        </div>

      </div>

    </div>
  </section>

  <!-- RODAPÉ EDITORIAL COM NAVEGAÇÃO COMPLETA -->
  <footer class="py-12 border-t border-stone-200 bg-[#F4F1EA] text-xs text-stone-500">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-stone-300/80">
        <div>
          ${
            opcoes?.logoBase64
              ? `<img src="${opcoes.logoBase64}" alt="${empresa.nome}" class="h-8 w-auto object-contain mb-2" />`
              : `<span class="font-heading font-bold text-base text-stone-900">${empresa.nome}</span>`
          }
          <p class="text-xs text-stone-600">${area} · ${city}/RS</p>
        </div>
        <nav class="flex flex-wrap items-center gap-6 text-[11px] font-semibold uppercase tracking-wider text-stone-600">
          <a href="#home" class="hover:text-ink transition-colors">Início</a>
          <a href="#sobre" class="hover:text-ink transition-colors">Quem Somos</a>
          <a href="#solucoes" class="hover:text-ink transition-colors">Especialidades</a>
          <a href="#projetos" class="hover:text-ink transition-colors">Portfólio</a>
          <a href="#diferenciais" class="hover:text-ink transition-colors">Diferenciais</a>
          <a href="#contato" class="hover:text-ink transition-colors">Contato</a>
        </nav>
      </div>
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
        <div>
          © ${new Date().getFullYear()} ${empresa.nome}. Todos os direitos reservados.
        </div>
        <div>
          Padrão editorial e tecnologia · Locomotiva Comunicação
        </div>
      </div>
    </div>
  </footer>

  <!-- BOTÃO FLUTUANTE DE WHATSAPP DISCRETO E EFICAZ -->
  <div class="fixed bottom-6 right-6 z-50">
    <a href="${whatsappLink}" target="_blank" rel="noopener" class="group relative flex items-center justify-center size-13 rounded-full bg-[#18181B] hover:bg-stone-800 text-white shadow-xl hover:scale-105 active:scale-95 transition-all p-3.5 border border-stone-700" title="Conversar no WhatsApp">
      <i data-lucide="message-circle" class="size-6 text-white"></i>
      <span class="absolute right-16 bg-white text-stone-900 text-xs font-semibold px-3 py-1.5 border border-stone-300 shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Orçamento no WhatsApp
      </span>
    </a>
  </div>

  <!-- ATIVAÇÃO DO LUCIDE ICONS, MENU MOBILE E ANIMAÇÕES GSAP -->
  <script>
    lucide.createIcons();

    // Toggle menu mobile responsivo
    const navBtn = document.getElementById('mobile-nav-toggle');
    const navMenu = document.getElementById('mobile-nav-menu');
    if (navBtn && navMenu) {
      navBtn.addEventListener('click', () => {
        navMenu.classList.toggle('hidden');
      });
      navMenu.querySelectorAll('a').forEach((l) => {
        l.addEventListener('click', () => navMenu.classList.add('hidden'));
      });
    }

    // 1. Lenis Smooth Scroll Cinemático
    let lenis;
    if (typeof Lenis !== 'undefined') {
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });

      if (typeof ScrollTrigger !== 'undefined' && typeof gsap !== 'undefined') {
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time) => {
          lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
      }
    }

    if (typeof gsap !== 'undefined') {
      if (typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
      }

      // 2. Aceternity TextGenerateEffect via SplitType
      if (typeof SplitType !== 'undefined') {
        try {
          const split = new SplitType('.split-title', { types: 'words, chars' });
          if (split.chars && split.chars.length > 0) {
            gsap.from(split.chars, {
              opacity: 0,
              y: 20,
              filter: 'blur(8px)',
              stagger: 0.015,
              duration: 0.85,
              ease: 'power3.out'
            });
          }
        } catch (e) {
          console.warn('SplitType error', e);
        }
      }

      // Animação de entrada coordenada dos itens do Hero
      const heroTl = gsap.timeline();
      heroTl.from(".hero-item:not(.split-title)", {
        opacity: 0,
        y: 28,
        duration: 0.85,
        stagger: 0.12,
        ease: "power3.out"
      });

      // Efeito Parallax refinado nas imagens
      gsap.utils.toArray('.parallax-wrap').forEach((wrap) => {
        const img = wrap.querySelector('.parallax-img');
        if (img) {
          gsap.to(img, {
            yPercent: 12,
            ease: "none",
            scrollTrigger: {
              trigger: wrap,
              start: "top bottom",
              end: "bottom top",
              scrub: 1.2
            }
          });
        }
      });

      // Revelação suave dos blocos editoriais ao rolar
      gsap.utils.toArray('.reveal-block').forEach((el) => {
        gsap.from(el, {
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            toggleActions: "play none none none"
          },
          opacity: 0,
          y: 35,
          duration: 0.8,
          ease: "power2.out"
        });
      });
      // 3. Suporte a Canvas Scrubbing (ScrollCraft singhharsh1708)
      const heroCanvas = document.getElementById('hero-canvas');
      if (heroCanvas && typeof ScrollTrigger !== 'undefined') {
        const ctx = heroCanvas.getContext('2d');
        function resizeCanvas() {
          heroCanvas.width = window.innerWidth * (window.devicePixelRatio || 1);
          heroCanvas.height = window.innerHeight * (window.devicePixelRatio || 1);
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        function drawCanvas(progress) {
          if (!ctx) return;
          const w = heroCanvas.width;
          const h = heroCanvas.height;
          ctx.clearRect(0, 0, w, h);
          const grad = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, Math.max(w, h) / 1.2);
          grad.addColorStop(0, '#27272a');
          grad.addColorStop(1, '#09090b');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, w, h);

          ctx.save();
          ctx.translate(w / 2, h / 2);
          ctx.rotate(progress * Math.PI * 0.7);
          const s = 1 + progress * 0.5;
          ctx.scale(s, s);
          ctx.strokeStyle = 'rgba(217, 119, 6, 0.5)';
          ctx.lineWidth = 2 * (window.devicePixelRatio || 1);
          ctx.beginPath();
          ctx.arc(0, 0, 160 * (window.devicePixelRatio || 1), 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
          ctx.strokeRect(-110 * (window.devicePixelRatio || 1), -110 * (window.devicePixelRatio || 1), 220 * (window.devicePixelRatio || 1), 220 * (window.devicePixelRatio || 1));
          ctx.restore();
        }
        drawCanvas(0);

        ScrollTrigger.create({
          trigger: '#scrollcraft-pinned-container',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
          onUpdate: (self) => {
            const p = self.progress;
            drawCanvas(p);
            const s1 = document.getElementById('step-card-1');
            const s2 = document.getElementById('step-card-2');
            const s3 = document.getElementById('step-card-3');
            if (s1 && s2 && s3) {
              if (p < 0.33) {
                s1.classList.remove('hidden'); s1.style.opacity = String(1 - (p / 0.33) * 0.5);
                s2.classList.add('hidden'); s3.classList.add('hidden');
              } else if (p < 0.68) {
                s1.classList.add('hidden');
                s2.classList.remove('hidden'); s2.style.opacity = '1';
                s3.classList.add('hidden');
              } else {
                s1.classList.add('hidden'); s2.classList.add('hidden');
                s3.classList.remove('hidden'); s3.style.opacity = '1';
              }
            }
          }
        });
      }
    }
  </script>
</body>
</html>`;

  return garantirImagensValidasNoHtml(htmlTemplate, empresa);
}

/**
 * Server Function: Executa a pesquisa web em tempo real e gera a landing page moderna
 * com base no Prompt Base Anti-IA e dados enriquecidos do Diagnóstico e Dossiê 360.
 */
export const gerarSiteCompletoIA_ServerFn = createServerFn({ method: "POST" })
  .inputValidator((data: GerarSiteInput) => data)
  .handler(async ({ data }): Promise<GerarSiteOutput> => {
    // 1. Pesquisa web aprofundada sobre a empresa e ramo
    const pesquisa = await pesquisarContextoParaSite(data.empresa);

    // 2. Monta o Prompt Base Obrigatório com Diretrizes Anti-IA e Skills ou utiliza o customPromptOverride
    let promptSystem = "";
    let promptUser = "";

    if (
      data.customPromptOverride?.promptSystem?.trim() &&
      data.customPromptOverride?.promptUser?.trim()
    ) {
      promptSystem = data.customPromptOverride.promptSystem;
      promptUser = data.customPromptOverride.promptUser;
    } else {
      const montado = montarPromptSiteCompleto({
        empresa: data.empresa,
        diagnostico: data.diagnostico,
        dossier360: data.dossier360,
        relatorio: data.relatorio,
        usarAntiIaBespoke: data.usarAntiIaBespoke,
        usarSkillsClaude: data.usarSkillsClaude,
        motorScroll: data.motorScroll,
        skillsAdicionais: data.skillsAdicionais,
        logoBase64: data.logoBase64,
        logoNomeArquivo: data.logoNomeArquivo,
        instrucoesDesignMd: data.instrucoesDesignMd,
        pesquisaSnippets: pesquisa.snippets,
        diferenciaisDetectados: pesquisa.diferenciaisDetectados,
      });
      promptSystem = montado.promptSystem;
      promptUser = montado.promptUser;
    }

    let generatedHtml = "";
    let providerUsed = "motor_editorial_locomotiva";
    let modelUsed = "bespoke_anti_ia";

    // Se o provedor não for 'bespoke' (que usa diretamente o motor editorial), consulta os LLMs
    if (data.provedorPreferencial !== "bespoke") {
      try {
        const llmRes = await chamarLlmUniversal(
          [
            { role: "system", content: promptSystem },
            { role: "user", content: promptUser },
          ],
          {
            provedorPreferencial: data.provedorPreferencial,
            model: data.modeloPreferencial,
            customKeys: data.customKeys,
            temperature: 0.5,
            maxTokens: 8192,
          },
        );

        let raw = llmRes.text.trim();
        // Limpa cercas markdown
        raw = raw.replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/i, "").trim();

        if (raw.includes("<!DOCTYPE html") || raw.includes("<html")) {
          generatedHtml = raw;
          providerUsed = llmRes.provider;
          modelUsed = llmRes.model;
        }
      } catch (err: any) {
        console.warn("[SiteGenerator] Geração por LLM falhou ou sem chave, aplicando motor editorial Anti-IA:", err?.message);
      }
    }

    // Se a IA falhar ou se o usuário escolher o motor editorial nativo, gera o site editorial
    if (!generatedHtml) {
      generatedHtml = construirSiteEditorialAntiIa(data.empresa, pesquisa, {
        logoBase64: data.logoBase64,
        instrucoesDesignMd: data.instrucoesDesignMd,
        diagnostico: data.diagnostico,
        relatorio: data.relatorio,
        motorScroll: data.motorScroll,
      });
    }

    // Pós-processador de segurança: Garante 100% de imagens ativas e válidas com URLs geradas por IA (FLUX.1)
    generatedHtml = garantirImagensValidasNoHtml(generatedHtml, data.empresa);

    return {
      html: generatedHtml,
      pesquisaWeb: pesquisa,
      provider: providerUsed,
      model: modelUsed,
      geradoEm: new Date().toISOString(),
    };
  });

/**
 * Refina o código do site aplicando comandos pontuais via Chat Interativo
 */
export const refinarSiteComIa_ServerFn = createServerFn({ method: "POST" })
  .validator((d: RefinarSiteInput) => d)
  .handler(async ({ data }): Promise<RefinarSiteOutput> => {
    const usarAntiIa = data.usarAntiIaBespoke !== false;
    const usarSkillsClaude = data.usarSkillsClaude !== false;

    const promptSystem = `[Contexto do Sistema]Atue como um Desenvolvedor Frontend Sênior e UI/UX Designer de Elite.
Sua missão é atualizar e refinar o código HTML5 de um site profissional completo existente com base nas instruções pontuais enviadas pelo usuário no chat.

DIRETRIZES FUNDAMENTAIS DE EDIÇÃO:
1. Aplique com precisão a alteração solicitada pelo usuário no código HTML atual.
2. Mantenha toda a estrutura restante do site ONE-PAGE intacta (todas as seções com âncoras #, navbar translúcida, rodapé, imagens, botões de WhatsApp e formulários).
3. Mantenha os scripts essenciais no <head>: Tailwind CSS via CDN, Lenis Smooth Scroll, SplitType, GSAP e ScrollTrigger, React (se houver) e Lucide Icons.
4. Mantenha as animações GSAP e efeitos visuais (Spotlight, SplitType TextGenerateEffect) existentes funcionando perfeitamente sem quebrar referências de classe ou IDs.
${
  usarSkillsClaude
    ? PROMPT_BLOCO_SKILLS_CLAUDE
    : ""
}
${
  data.skillsAdicionais && data.skillsAdicionais.length > 0
    ? `\n[SKILLS ADICIONAIS DO USUÁRIO]:\n${data.skillsAdicionais.map((s) => `[SKILL: ${s.nome.toUpperCase()}]\n${s.prompt.trim()}`).join("\n\n")}\n`
    : ""
}
${
  usarAntiIa
    ? `
[DIRETRIZES OBRIGATÓRIAS ANTI-IA BESPOKE ATIVADAS]
- Proibição absoluta de fundos pretos ou roxos com luzes neon artificiais.
- Proibição absoluta de gradientes genéricos em botões.
- Proibição absoluta de letreiros em marquee (tickers em loop contínuo).
- Proibição de grids repetitivos em loop 3x3.
- Mantenha o design editorial minimalista, paleta contida em até 3 cores, respiro generoso e tom de voz humano sem clichês de IA.
`
    : `
[DIRETRIZES DE DESIGN MODERNO]
- Mantenha alto padrão visual, harmonia estética, responsividade total e fluidez com Tailwind CSS.
`
}
${
  data.logoBase64
    ? `\n[LOGO OFICIAL]: Use a imagem do logo fornecida (<img src="${data.logoBase64}" alt="${data.empresa.nome}" class="h-10 sm:h-12 w-auto object-contain" />) no cabeçalho e rodapé.`
    : ""
}
${
  data.instrucoesDesignMd
    ? `\n[DIRETRIZES ADICIONAIS DE DESIGN (.MD)]:\n${data.instrucoesDesignMd}`
    : ""
}

[DIRETRIZES DE IMAGENS FOTOGRÁFICAS GERADAS POR IA]:
- Se adicionar ou alterar blocos com imagens fotográficas, utilize sempre o formato generativo por IA (FLUX.1):
  https://image.pollinations.ai/prompt/{PROMPT_EM_INGLES_DESCRITIVO_DO_NICHO}?width={LARGURA}&height={ALTURA}&model=flux&nologo=true
- Nunca invente links ou IDs fictícios do Unsplash que resultam em erros 404.

FORMATO DE RESPOSTA OBRIGATÓRIO:
Inicie sua resposta com uma linha resumindo a alteração feita em português no formato:
RESUMO: [Breve explicação amigável do que foi alterado]
Em seguida, forneça o código HTML5 completo e atualizado dentro de um bloco de código markdown:
\`\`\`html
<!DOCTYPE html>
... (código completo)
</html>
\`\`\``;

    const historicoMensagens = (data.historicoChat || []).slice(-6).map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    const promptUser = `CÓDIGO HTML ATUAL DO SITE DA EMPRESA (${data.empresa.nome} · ${data.empresa.cidade}/RS):
\`\`\`html
${data.siteHtmlAtual}
\`\`\`

INSTRUÇÃO DE ALTERAÇÃO DO USUÁRIO NO CHAT:
"${data.mensagemUsuario}"

Aplique esta alteração no código HTML mantendo todo o restante do site funcionando perfeitamente.`;

    let generatedHtml = "";
    let respostaTexto = "";
    let providerUsed: string = data.provedorPreferencial || "auto";
    let modelUsed = data.modeloPreferencial || "default";

    try {
      const llmRes = await chamarLlmUniversal(
        [
          { role: "system", content: promptSystem },
          ...historicoMensagens,
          { role: "user", content: promptUser },
        ],
        {
          provedorPreferencial: data.provedorPreferencial === "bespoke" ? "auto" : data.provedorPreferencial,
          model: data.modeloPreferencial,
          customKeys: data.customKeys,
          temperature: 0.4,
          maxTokens: 8192,
        },
      );

      const raw = llmRes.text.trim();
      providerUsed = llmRes.provider;
      modelUsed = llmRes.model;

      // Extrai resumo amigável
      const matchResumo = raw.match(/RESUMO:\s*([^\n\r]+)/i);
      if (matchResumo && matchResumo[1]) {
        respostaTexto = matchResumo[1].trim();
      }

      // Extrai o bloco de código HTML
      const matchHtml = raw.match(/```(?:html)?\s*([\s\S]*?)```/i);
      if (matchHtml && matchHtml[1] && (matchHtml[1].includes("<!DOCTYPE") || matchHtml[1].includes("<html"))) {
        generatedHtml = matchHtml[1].trim();
      } else if (raw.includes("<!DOCTYPE html") || raw.includes("<html")) {
        const startIdx = raw.indexOf("<!DOCTYPE html") !== -1 ? raw.indexOf("<!DOCTYPE html") : raw.indexOf("<html");
        const endIdx = raw.lastIndexOf("</html>") !== -1 ? raw.lastIndexOf("</html>") + 7 : raw.length;
        generatedHtml = raw.slice(startIdx, endIdx).trim();
      }

      if (!respostaTexto) {
        respostaTexto = `Alteração aplicada com sucesso ao site via ${llmRes.provider} (${llmRes.model})!`;
      }
    } catch (err: any) {
      console.error("[RefinarSite] Erro ao chamar LLM para refinar site:", err);
      throw new Error(`Falha ao refinar o site com IA: ${err?.message || "Erro desconhecido"}`);
    }

    if (!generatedHtml || (!generatedHtml.includes("<!DOCTYPE") && !generatedHtml.includes("<html"))) {
      throw new Error("O modelo de IA não retornou um código HTML válido para a alteração solicitada. Tente reformular o pedido.");
    }

    // Pós-processador de segurança: Garante 100% de imagens ativas e válidas com URLs geradas por IA (FLUX.1)
    generatedHtml = garantirImagensValidasNoHtml(generatedHtml, data.empresa);

    return {
      html: generatedHtml,
      respostaAssistente: respostaTexto,
      provider: providerUsed,
      model: modelUsed,
      geradoEm: new Date().toISOString(),
    };
  });

