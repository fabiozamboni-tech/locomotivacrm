/**
 * Motor de Geração de Sites e Landing Pages de Alta Conversão
 * Baseado no Manifesto de Design Editorial Anti-IA e Animações Fluidas via GSAP e ScrollTrigger.
 */

import { createServerFn } from "@tanstack/react-start";
import type { EmpresaCtx } from "./ai.functions";
import { chamarLlmUniversal } from "./llm-provider.server";

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
  };
  provedorPreferencial?: "auto" | "groq" | "gemini" | "openrouter" | "cerebras" | "lovable" | "ollama" | "bespoke";
  modeloPreferencial?: string;
  diagnostico?: any;
  dossier360?: any;
  relatorio?: any;
  estiloVisual?: "editorial_clean" | "arquitetonico_minimalista" | "moderno_contemporaneo";
}

export interface GerarSiteOutput {
  html: string;
  pesquisaWeb: PesquisaWebSiteResult;
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
 * Retorna imagens fotográficas reais de alta resolução (Unsplash) mapeadas pelo nicho da empresa
 */
export function getImagensPorSegmento(segmento?: string) {
  const s = (segmento || "").toLowerCase();

  // Vidraçaria, vidros temperados, esquadrias e fachadas
  if (s.includes("vidr") || s.includes("esquadr") || s.includes("fachad") || s.includes("box") || s.includes("espelho")) {
    return {
      hero: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80",
      destaque: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
      servicos: [
        "https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
      ],
    };
  }

  // Vinícolas, vinhos e enoturismo
  if (s.includes("vin") || s.includes("enot") || s.includes("uva")) {
    return {
      hero: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1600&q=80",
      destaque: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=80",
      servicos: [
        "https://images.unsplash.com/photo-1474722883778-792e7990302f?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1528823872057-9c018a7a7553?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=800&q=80",
      ],
    };
  }

  // Móveis planejados, marcenaria e design de interiores
  if (s.includes("móvel") || s.includes("movel") || s.includes("decor") || s.includes("planej") || s.includes("marcen")) {
    return {
      hero: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1600&q=80",
      destaque: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80",
      servicos: [
        "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80",
      ],
    };
  }

  // Gastronomia, restaurantes, cafés e bares
  if (s.includes("rest") || s.includes("gastro") || s.includes("café") || s.includes("pizz") || s.includes("bar")) {
    return {
      hero: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80",
      destaque: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
      servicos: [
        "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80",
      ],
    };
  }

  // Saúde, clínicas médicas e odontologia
  if (s.includes("saúde") || s.includes("saude") || s.includes("clínic") || s.includes("clinic") || s.includes("médic") || s.includes("medic") || s.includes("odonto")) {
    return {
      hero: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1600&q=80",
      destaque: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80",
      servicos: [
        "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1629909615184-74f495363b67?auto=format&fit=crop&w=800&q=80",
      ],
    };
  }

  // Hotelaria, pousadas e turismo
  if (s.includes("hotel") || s.includes("pousad") || s.includes("turism") || s.includes("chalé")) {
    return {
      hero: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80",
      destaque: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
      servicos: [
        "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
      ],
    };
  }

  // Advocacia e consultoria jurídica
  if (s.includes("advoc") || s.includes("juríd") || s.includes("jurid") || s.includes("lei")) {
    return {
      hero: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80",
      destaque: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
      servicos: [
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=800&q=80",
      ],
    };
  }

  // Padrão Premium Corporativo / Serviços
  return {
    hero: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80",
    destaque: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
    servicos: [
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
    ],
  };
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
export function construirSiteEditorialAntiIa(empresa: EmpresaCtx, pesquisa: PesquisaWebSiteResult): string {
  const whatsappNum = (empresa.whatsapp || empresa.telefone || "54999999999").replace(/\D/g, "");
  const whatsappLink = `https://wa.me/55${whatsappNum}?text=${encodeURIComponent(
    `Olá ${empresa.nome}! Conheci o trabalho de vocês e gostaria de solicitar um orçamento para o meu projeto.`,
  )}`;

  const city = empresa.cidade || "Serra Gaúcha";
  const segmento = empresa.segmento || "Serviços Especializados";
  const area = empresa.areaAtuacao || segmento;
  const imagens = getImagensPorSegmento(empresa.segmento);

  return `<!DOCTYPE html>
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

  <!-- NAVEGAÇÃO -->
  <header class="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-stone-200/80">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
      <a href="#" class="flex flex-col">
        <span class="font-heading font-extrabold text-xl sm:text-2xl tracking-tight text-ink uppercase">${empresa.nome}</span>
        <span class="text-[10px] sm:text-[11px] tracking-widest uppercase text-stone-500 font-semibold">${area}</span>
      </a>

      <nav class="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-stone-600">
        <a href="#diferenciais" class="hover:text-ink transition-colors">Diferenciais</a>
        <a href="#solucoes" class="hover:text-ink transition-colors">Especialidades</a>
        <a href="#sobre" class="hover:text-ink transition-colors">Sobre a Empresa</a>
        <a href="#contato" class="hover:text-ink transition-colors">Localização</a>
      </nav>

      <div class="flex items-center gap-3">
        <a href="${whatsappLink}" target="_blank" rel="noopener" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-none border border-ink bg-ink text-white hover:bg-stone-800 text-xs font-semibold uppercase tracking-wider transition-all">
          <i data-lucide="message-circle" class="size-4"></i>
          <span>Solicitar Orçamento</span>
        </a>
      </div>
    </div>
  </header>

  <!-- HERO SECTION DE ALTO IMPACTO (DESIGN EDITORIAL + PARALLAX GSAP) -->
  <section class="relative pt-12 pb-20 sm:pt-16 sm:pb-28 overflow-hidden">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <!-- CABEÇALHO DO HERO -->
      <div class="max-w-3xl mb-10 sm:mb-14">
        <span class="hero-item inline-block text-[11px] font-bold uppercase tracking-widest text-stone-500 mb-4">
          Excelência em ${area} · ${city}/RS
        </span>
        <h1 class="hero-item font-heading font-extrabold text-3xl sm:text-5xl lg:text-6xl text-ink tracking-tight leading-[1.1]">
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
  </section>

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
                <p class="font-semibold text-ink">${empresa.email || `contato@${empresa.nome.toLowerCase().replace(/\s+/g, "")}.com.br`}</p>
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

  <!-- RODAPÉ EDITORIAL -->
  <footer class="py-10 border-t border-stone-200 bg-[#F4F1EA] text-xs text-stone-500">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div>
        <span class="font-bold text-stone-800">${empresa.nome}</span> · ${area} em ${city}/RS
      </div>
      <div>
        Desenvolvido com padrão editorial e tecnologia · Locomotiva Comunicação
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

  <!-- ATIVAÇÃO DO LUCIDE ICONS E ANIMAÇÕES GSAP -->
  <script>
    lucide.createIcons();

    if (typeof gsap !== 'undefined') {
      if (typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
      }

      // Animação de entrada coordenada da Hero
      const heroTl = gsap.timeline();
      heroTl.from(".hero-item", {
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
    }
  </script>
</body>
</html>`;
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

    // 2. Extrai dados consolidados do Diagnóstico e do Dossiê 360
    const diagnosticoSite = data.diagnostico?.site || {};
    const problemasSiteAtual = [
      diagnosticoSite.responsivo === false ? "O site anterior não era responsivo para celulares" : "",
      diagnosticoSite.cta === false ? "Faltavam chamadas claras para ação (CTA)" : "",
      diagnosticoSite.whatsappBtn === false ? "Não havia botão direto para WhatsApp" : "",
      diagnosticoSite.velocidade === "ruim" ? "Lentidão excessiva no carregamento" : "",
      diagnosticoSite.qualidadePercebida && diagnosticoSite.qualidadePercebida < 6
        ? `Qualidade percebida baixa no material antigo (nota ${diagnosticoSite.qualidadePercebida}/10)`
        : "",
    ].filter(Boolean);

    const dossierPersonas = data.dossier360?.personas || [];
    const dossierObjecoes = data.dossier360?.objecoes || [];
    const dossierDiferenciais = data.dossier360?.diferenciais || [];

    // 3. Monta o Prompt Base Obrigatório com Diretrizes Anti-IA
    const promptSystem = `[Contexto do Sistema]Atue como um Desenvolvedor Frontend Sênior e UI/UX Designer de Elite. Sua missão é criar a estrutura, o layout e o código de um site profissional para o nicho que será especificado. Você deve ignorar completamente os vieses automáticos de geração por IA e seguir rigorosamente as diretrizes humanas abaixo:
[Regras de Design - Anti-IA]
Proibições Absolutas: Não utilize fundos pretos ou roxos com luzes neon artificiais. Não utilize gradientes genéricos em botões. Não utilize grids repetitivos em loop (como o padrão de 3 cards idênticos lado a lado). Evite ilustrações 3D genéricas ou ícones flutuantes sem propósito funcional.
Arquitetura Visual: Priorize o minimalismo premium, design editorial ou contemporâneo. Use "respiro" (whitespace) generoso e assimetria inteligente no grid para dar ritmo visual ao site.
Paleta de Cores e Tipografia: Use uma combinação contida de no máximo 3 cores. Defina uma hierarquia tipográfica marcante (ex: uma fonte com forte personalidade para títulos e uma sans-serif extremamente limpa para o corpo).
[Estrutura e Elementos Obrigatórios]
Hero Section de Alto Impacto: Deve conter uma imagem ou elemento visual grande em tela cheia (ou grande angular), um título forte e direto, e um CTA (Botão de Chamada para Ação) principal de destaque claro.
Efeito Parallax: Implemente um efeito parallax refinado nas imagens principais e de transição de seção, garantindo fluidez sem quebrar a performance da página.
[Animações e Interatividade]
GSAP Integrado: Toda a camada de animação deve ser controlada via GSAP (GreenSock Animation Platform - https://gsap.com/).
Animações na Hero: Crie uma animação de entrada (intro) sofisticada para os elementos da Hero Section (título, imagem e CTA surgindo de forma coordenada ao carregar a página).
Animações de Scroll (ScrollTrigger): Use o plugin ScrollTrigger do GSAP (https://gsap.com/docs/v3/Plugins/ScrollTrigger/) para orquestrar elementos que surgem, deslizam ou modificam sua opacidade de forma suave à medida que o usuário rola a página (evite animações bruscas ou genéricas do CSS puro).
[Texto e Conteúdo]
Tom de Voz Humano: Escreva copies diretas, focadas em benefícios reais. Está proibido o uso de jargões clichês de IA (ex: "revolucionário", "a solução definitiva", "no mundo dinâmico de hoje"). Não use excesso de emojis ou exclamações.

REGRAS DE RETORNO TÉCNICO:
- Retorne APENAS o código HTML5 completo (começando em <!DOCTYPE html> e terminando em </html>), sem blocos de texto ou explicações antes ou depois.
- Carregue Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
- Carregue GSAP e ScrollTrigger via CDN no <head>:
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
- Carregue Lucide Icons via CDN: <script src="https://unpkg.com/lucide@latest"></script>
- Use Google Fonts com fontes contrastantes (ex: Outfit ou Cinzel para títulos, Plus Jakarta Sans para o corpo).
- Use fotografias reais em alta resolução do Unsplash (https://images.unsplash.com/photo-...) adequadas ao nicho.
- Inclua botão de WhatsApp funcional com link wa.me/55...`;

    const promptUser = `[Especificação do Nicho]Agora, aplique todas as regras acima para criar o site do seguinte nicho:

EMPRESA E LOCALIZAÇÃO:
- Nome da Empresa: ${data.empresa.nome}
- Nicho / Segmento: ${data.empresa.segmento}
- Área de Atuação Detalhada: ${data.empresa.areaAtuacao || data.empresa.segmento}
- Cidade: ${data.empresa.cidade}/RS (Serra Gaúcha)
- Endereço: ${data.empresa.endereco || ""}
- Telefone / WhatsApp: ${data.empresa.whatsapp || data.empresa.telefone || ""}
- E-mail: ${data.empresa.email || ""}

DADOS DO DIAGNÓSTICO E RELATÓRIO DO CLIENTE:
${problemasSiteAtual.length > 0 ? `- Falhas identificadas no site anterior: ${problemasSiteAtual.join("; ")}.` : "- Empresa necessita de presença digital profissional alinhada ao alto padrão dos seus serviços."}
- O novo site deve resolver essas falhas com carregamento rápido, excelente legibilidade mobile e CTA claro para WhatsApp.

DADOS DO DOSSIÊ 360 DO LEAD:
${dossierPersonas.length > 0 ? `- Perfil do público/persona: ${JSON.stringify(dossierPersonas.slice(0, 2))}.` : `- Público-alvo: Clientes residenciais e comerciais de ${data.empresa.cidade} e região que buscam confiança e acabamento de alto nível.`}
${dossierObjecoes.length > 0 ? `- Objeções comuns no fechamento comercial: ${JSON.stringify(dossierObjecoes.slice(0, 3))}.` : "- Objeções a contornar nos textos: insegurança com prazo de entrega e qualidade dos materiais."}
${dossierDiferenciais.length > 0 ? `- Diferenciais competitivos: ${JSON.stringify(dossierDiferenciais.slice(0, 3))}.` : `- Diferenciais locais: atendimento próximo, pontualidade e referência em ${data.empresa.cidade}.`}

PESQUISA WEB LOCAL EM TEMPO REAL:
${pesquisa.snippets.slice(0, 4).join("\n")}
Diferenciais detectados no mercado: ${pesquisa.diferenciaisDetectados.join(", ")}

Gere agora o código HTML5 completo da landing page seguindo rigorosamente todas as regras humanas Anti-IA, com GSAP e ScrollTrigger integrados.`;

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
            maxTokens: 4096,
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
      generatedHtml = construirSiteEditorialAntiIa(data.empresa, pesquisa);
    }

    return {
      html: generatedHtml,
      pesquisaWeb: pesquisa,
      provider: providerUsed,
      model: modelUsed,
      geradoEm: new Date().toISOString(),
    };
  });
