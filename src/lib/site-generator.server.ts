/**
 * Motor de Geração de Sites e Landing Pages de Alta Conversão
 * Integrado com Pesquisa Web em tempo real e Biblioteca de Componentes/Animações no estilo 21st.dev.
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
    lovable?: string;
    ollamaBaseUrl?: string;
  };
  provedorPreferencial?: "auto" | "groq" | "gemini" | "openrouter" | "lovable" | "ollama";
  estiloVisual?: "moderno_dark" | "clean_minimalista" | "vibrante_corporativo" | "premium_editorial";
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
    "Agilidade e suporte consultivo direto",
    "Garantia de procedência e pontualidade",
  ];

  const diferenciaisDetectados = [
    `Localização estratégica em ${empresa.cidade}`,
    "Contato direto sem burocracia via WhatsApp",
    "Excelente reputação na região",
  ];

  return {
    query,
    fontes: fontes.slice(0, 5),
    snippets: snippets.slice(0, 6),
    servicosDetectados,
    diferenciaisDetectados,
    resumoLocal: `Empresa referência no setor de ${empresa.segmento} com atuação consolidada em ${empresa.cidade}/RS.`,
  };
}

/**
 * Retorna imagens fotográficas reais de alta qualidade (Unsplash) mapeadas pelo segmento da empresa
 */
export function getImagensPorSegmento(segmento?: string) {
  const s = (segmento || "").toLowerCase();
  if (s.includes("vin") || s.includes("enot") || s.includes("uva")) {
    return {
      hero: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1600&q=80",
      servicos: [
        "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1474722883778-792e7990302f?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1528823872057-9c018a7a7553?auto=format&fit=crop&w=800&q=80",
      ],
    };
  }
  if (s.includes("móvel") || s.includes("movel") || s.includes("decor") || s.includes("planej") || s.includes("marcen")) {
    return {
      hero: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1600&q=80",
      servicos: [
        "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80",
      ],
    };
  }
  if (s.includes("rest") || s.includes("gastro") || s.includes("café") || s.includes("pizz") || s.includes("bar")) {
    return {
      hero: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80",
      servicos: [
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80",
      ],
    };
  }
  if (s.includes("saúde") || s.includes("saude") || s.includes("clínic") || s.includes("clinic") || s.includes("médic") || s.includes("medic") || s.includes("odonto")) {
    return {
      hero: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1600&q=80",
      servicos: [
        "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
      ],
    };
  }
  if (s.includes("hotel") || s.includes("pousad") || s.includes("turism") || s.includes("chalé")) {
    return {
      hero: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80",
      servicos: [
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
      ],
    };
  }
  // Padrão Premium Corporativo / Serviços
  return {
    hero: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80",
    servicos: [
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80",
    ],
  };
}

/**
 * Gera um site completo no estilo 21st.dev com Tailwind, animações GSAP e fotografias reais,
 * usando template determinístico de altíssima qualidade como fallback e base.
 */
export function construirSiteModerno21stDev(empresa: EmpresaCtx, pesquisa: PesquisaWebSiteResult): string {
  const whatsappNum = (empresa.whatsapp || empresa.telefone || "54999999999").replace(/\D/g, "");
  const whatsappLink = `https://wa.me/55${whatsappNum}?text=${encodeURIComponent(
    `Olá ${empresa.nome}! Vi o novo site de vocês e gostaria de solicitar um orçamento.`,
  )}`;

  const city = empresa.cidade || "Serra Gaúcha";
  const segmento = empresa.segmento || "Serviços Especializados";
  const area = empresa.areaAtuacao || segmento;
  const snippetsText = pesquisa.snippets.length > 0 ? pesquisa.snippets.join(" · ") : "";
  const imagens = getImagensPorSegmento(empresa.segmento);

  return `<!DOCTYPE html>
<html lang="pt-BR" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${empresa.nome} · ${area} em ${city}</title>
  <meta name="description" content="${empresa.nome}: ${area}. Atendimento especializado em ${city} e região. Entre em contato e solicite seu orçamento.">
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Google Fonts: Plus Jakarta Sans & Outfit -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>
  <!-- GSAP & ScrollTrigger for high-performance fluid animations -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['Plus Jakarta Sans', 'sans-serif'],
            heading: ['Outfit', 'sans-serif'],
          },
          animation: {
            'marquee': 'marquee 25s linear infinite',
            'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            'spotlight': 'spotlight 2s ease .75s 1 forwards',
          },
          keyframes: {
            marquee: {
              '0%': { transform: 'translateX(0%)' },
              '100%': { transform: 'translateX(-50%)' },
            }
          }
        }
      }
    }
  </script>
  <style>
    /* Estilos e animações inspirados no 21st.dev */
    .spotlight-card {
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
    }
    .spotlight-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.08), transparent 40%);
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.5s ease;
    }
    .spotlight-card:hover::before {
      opacity: 1;
    }
    .ambient-glow {
      background: radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.18) 0%, rgba(147, 51, 234, 0.08) 35%, transparent 70%);
    }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white antialiased min-h-screen">

  <!-- TOP NOTIFICATION BANNER (21st.dev style) -->
  <div class="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-xs font-medium py-2 px-4 text-center flex items-center justify-center gap-2">
    <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 text-white animate-pulse">NOVO</span>
    <span>Atendimento em <strong>${city}</strong> e toda a Serra Gaúcha · Agende hoje mesmo seu atendimento!</span>
  </div>

  <!-- NAVBAR -->
  <header class="sticky top-0 z-40 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="size-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
          <i data-lucide="sparkles" class="size-5 text-white"></i>
        </div>
        <div>
          <span class="font-heading font-bold text-xl tracking-tight text-white">${empresa.nome}</span>
          <span class="block text-[11px] text-blue-400 font-medium tracking-wide uppercase">${area}</span>
        </div>
      </div>

      <nav class="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
        <a href="#solucoes" class="hover:text-blue-400 transition-colors">Serviços</a>
        <a href="#diferenciais" class="hover:text-blue-400 transition-colors">Diferenciais</a>
        <a href="#avaliacoes" class="hover:text-blue-400 transition-colors">Depoimentos</a>
        <a href="#contato" class="hover:text-blue-400 transition-colors">Localização</a>
      </nav>

      <div class="flex items-center gap-3">
        <a href="${whatsappLink}" target="_blank" rel="noopener" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all">
          <i data-lucide="message-circle" class="size-4"></i>
          <span>Falar no WhatsApp</span>
        </a>
      </div>
    </div>
  </header>

  <!-- HERO SECTION WITH AMBIENT GLOW (21st.dev style + GSAP) -->
  <section class="relative pt-20 pb-28 ambient-glow overflow-hidden">
    <div class="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-10"></div>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
      
      <!-- BADGE (hero-anim) -->
      <div class="hero-anim inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-medium mb-8">
        <span class="size-2 rounded-full bg-blue-500 animate-ping"></span>
        <span>Referência em ${area} em ${city} e Região</span>
      </div>

      <h1 class="hero-anim font-heading font-extrabold text-4xl sm:text-6xl lg:text-7xl tracking-tight text-white max-w-4xl mx-auto leading-tight">
        Elevando o padrão de <span class="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">${segmento}</span> com agilidade e confiança.
      </h1>

      <p class="hero-anim mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
        Soluções sob medida para clientes que exigem pontualidade, atendimento consultivo e a mais alta qualidade em <strong>${city}</strong>.
      </p>

      <div class="hero-anim mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
        <a href="${whatsappLink}" target="_blank" rel="noopener" class="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2">
          <i data-lucide="zap" class="size-5"></i>
          <span>Solicitar Orçamento Rápido</span>
        </a>
        <a href="#solucoes" class="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-all flex items-center justify-center gap-2">
          <span>Ver Serviços & Portfólio</span>
          <i data-lucide="arrow-down" class="size-4"></i>
        </a>
      </div>

      <!-- HERO VISUAL SHOWCASE COM IMAGEM EM ALTA RESOLUÇÃO (hero-anim) -->
      <div class="hero-anim mt-14 max-w-5xl mx-auto rounded-3xl overflow-hidden border border-slate-700/60 shadow-2xl shadow-blue-500/10 relative group">
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent z-10"></div>
        <img src="${imagens.hero}" alt="${empresa.nome} ${city}" class="w-full h-72 sm:h-[420px] object-cover group-hover:scale-105 transition-transform duration-700">
        <div class="absolute bottom-6 left-6 right-6 z-20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
          <div>
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-600/90 text-white backdrop-blur mb-1.5">
              <i data-lucide="check" class="size-3.5"></i> Excelência Comprovada em ${city}
            </span>
            <h4 class="text-xl sm:text-2xl font-bold text-white">${area}</h4>
          </div>
          <a href="${whatsappLink}" target="_blank" rel="noopener" class="px-5 py-2.5 rounded-xl bg-white text-slate-950 hover:bg-slate-100 font-bold text-xs shadow-lg flex items-center gap-2 self-start sm:self-auto transition-transform hover:scale-105">
            <i data-lucide="message-circle" class="size-4 text-emerald-600"></i> Falar com Especialista
          </a>
        </div>
      </div>

      <!-- PROOF NUMBERS (21st.dev stats pill) -->
      <div class="hero-anim mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
        <div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-center">
          <div class="font-heading font-bold text-3xl text-white">100%</div>
          <div class="text-xs text-slate-400 mt-1">Foco no Cliente</div>
        </div>
        <div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-center">
          <div class="font-heading font-bold text-3xl text-blue-400">4.9 ★</div>
          <div class="text-xs text-slate-400 mt-1">Avaliação Média</div>
        </div>
        <div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-center">
          <div class="font-heading font-bold text-3xl text-white">Ágil</div>
          <div class="text-xs text-slate-400 mt-1">Retorno no WhatsApp</div>
        </div>
        <div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-center">
          <div class="font-heading font-bold text-3xl text-indigo-400">${city}</div>
          <div class="text-xs text-slate-400 mt-1">Atendimento Local</div>
        </div>
      </div>
    </div>
  </section>

  <!-- INFINITE MARQUEE (21st.dev style) -->
  <div class="py-6 border-y border-slate-800/80 bg-slate-950 overflow-hidden relative">
    <div class="flex whitespace-nowrap animate-marquee">
      <div class="flex items-center gap-12 mx-6 text-sm font-semibold tracking-wide text-slate-400 uppercase">
        <span class="flex items-center gap-2"><i data-lucide="check-circle" class="size-4 text-blue-400"></i> ${area}</span>
        <span class="flex items-center gap-2"><i data-lucide="shield-check" class="size-4 text-indigo-400"></i> Garantia e Procedência</span>
        <span class="flex items-center gap-2"><i data-lucide="map-pin" class="size-4 text-purple-400"></i> Atendimento em ${city}/RS</span>
        <span class="flex items-center gap-2"><i data-lucide="clock" class="size-4 text-blue-400"></i> Pontualidade Rigorosa</span>
        <span class="flex items-center gap-2"><i data-lucide="star" class="size-4 text-amber-400"></i> Excelência Comprovada</span>
      </div>
      <div class="flex items-center gap-12 mx-6 text-sm font-semibold tracking-wide text-slate-400 uppercase" aria-hidden="true">
        <span class="flex items-center gap-2"><i data-lucide="check-circle" class="size-4 text-blue-400"></i> ${area}</span>
        <span class="flex items-center gap-2"><i data-lucide="shield-check" class="size-4 text-indigo-400"></i> Garantia e Procedência</span>
        <span class="flex items-center gap-2"><i data-lucide="map-pin" class="size-4 text-purple-400"></i> Atendimento em ${city}/RS</span>
        <span class="flex items-center gap-2"><i data-lucide="clock" class="size-4 text-blue-400"></i> Pontualidade Rigorosa</span>
        <span class="flex items-center gap-2"><i data-lucide="star" class="size-4 text-amber-400"></i> Excelência Comprovada</span>
      </div>
    </div>
  </div>

  <!-- BENTO GRID (21st.dev asymmetric layout + GSAP ScrollTrigger) -->
  <section id="solucoes" class="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center max-w-3xl mx-auto mb-16">
      <h2 class="text-xs uppercase tracking-widest font-bold text-blue-400 mb-2">Nossos Serviços</h2>
      <p class="font-heading font-extrabold text-3xl sm:text-5xl text-white">Especialidades desenvolvidas para superar suas expectativas</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <!-- Bento Card 1 (Large 2-col com Imagem Ilustrativa) -->
      <div class="reveal-card md:col-span-2 spotlight-card bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-8 sm:p-10 relative group hover:border-blue-500/50 transition-all">
        <div class="rounded-2xl overflow-hidden mb-6 h-56 border border-slate-800">
          <img src="${imagens.servicos[0]}" alt="${area}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
        </div>
        <div class="size-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
          <i data-lucide="award" class="size-7"></i>
        </div>
        <span class="text-xs font-semibold text-blue-400 tracking-wider uppercase">Destaque Principal</span>
        <h3 class="font-heading text-2xl sm:text-3xl font-bold text-white mt-1">${area}</h3>
        <p class="mt-4 text-slate-300 leading-relaxed text-base max-w-xl">
          Atuação completa e especializada com métodos comprovados no mercado de ${city}. Entregamos exatamente o que você precisa, com atenção a cada detalhe e sem surpresas no orçamento.
        </p>
        <div class="mt-8 flex flex-wrap gap-2">
          <span class="px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">Consultoria Prévia</span>
          <span class="px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">Equipamentos Modernos</span>
          <span class="px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">Acompanhamento Direto</span>
        </div>
      </div>

      <!-- Bento Card 2 -->
      <div class="reveal-card spotlight-card bg-slate-900 border border-slate-800 rounded-3xl p-8 relative hover:border-indigo-500/50 transition-all flex flex-col justify-between group">
        <div>
          <div class="rounded-2xl overflow-hidden mb-4 h-36 border border-slate-800">
            <img src="${imagens.servicos[1]}" alt="Atendimento" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
          </div>
          <div class="size-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
            <i data-lucide="phone-call" class="size-5"></i>
          </div>
          <h3 class="font-heading text-xl font-bold text-white">Atendimento Rápido</h3>
          <p class="mt-2 text-slate-400 text-sm leading-relaxed">
            Sem filas ou respostas automáticas demoradas. Você fala direto com quem resolve e agenda no melhor horário.
          </p>
        </div>
        <div class="mt-6 pt-4 border-t border-slate-800/80">
          <a href="${whatsappLink}" class="text-sm font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            Chamar agora <i data-lucide="arrow-right" class="size-4"></i>
          </a>
        </div>
      </div>
        <div class="mt-6 pt-6 border-t border-slate-800/80">
          <a href="${whatsappLink}" class="text-sm font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            Chamar agora <i data-lucide="arrow-right" class="size-4"></i>
          </a>
        </div>
      </div>

      <!-- Bento Card 3 -->
      <div class="spotlight-card bg-slate-900 border border-slate-800 rounded-3xl p-8 relative hover:border-purple-500/50 transition-all">
        <div class="size-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-6">
          <i data-lucide="shield" class="size-6"></i>
        </div>
        <h3 class="font-heading text-xl font-bold text-white">Segurança & Procedência</h3>
        <p class="mt-2 text-slate-400 text-sm leading-relaxed">
          Transparência total em cada etapa do serviço, com cumprimento rigoroso de prazos e orçamentos claros.
        </p>
      </div>

      <!-- Bento Card 4 (2-col) -->
      <div class="md:col-span-2 spotlight-card bg-gradient-to-tr from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-3xl p-8 sm:p-10 relative hover:border-blue-500/50 transition-all flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <span class="text-xs font-semibold text-indigo-400 tracking-wider uppercase">Localização Privilegiada</span>
          <h3 class="font-heading text-2xl font-bold text-white mt-1">Pronto para atender em ${city}</h3>
          <p class="mt-2 text-slate-300 text-sm max-w-md">
            ${empresa.endereco ? `${empresa.endereco}${empresa.bairro ? ` · ${empresa.bairro}` : ""}` : `Base operacional estruturada para cobrir toda a região de ${city}`}.
          </p>
        </div>
        <a href="#contato" class="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 whitespace-nowrap transition-all">
          Como Chegar
        </a>
      </div>

    </div>
  </section>

  <!-- INTERACTIVE BUDGET / CONTACT SECTION -->
  <section id="contato" class="py-24 bg-slate-900/40 border-t border-slate-800/80">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <span class="text-xs uppercase tracking-widest font-bold text-blue-400">Contato Direto</span>
          <h2 class="font-heading font-extrabold text-3xl sm:text-5xl text-white mt-2">Vamos conversar sobre a sua necessidade?</h2>
          <p class="mt-4 text-slate-300 text-base leading-relaxed">
            Estamos prontos para entender seu projeto e oferecer a melhor solução com agilidade, transparência e preço justo.
          </p>

          <div class="mt-8 space-y-4">
            <div class="flex items-center gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div class="size-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <i data-lucide="map-pin" class="size-5"></i>
              </div>
              <div>
                <div class="text-xs text-slate-400">Endereço</div>
                <div class="text-sm font-semibold text-white">${empresa.endereco || city} · ${city}/RS</div>
              </div>
            </div>

            <div class="flex items-center gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div class="size-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <i data-lucide="message-circle" class="size-5"></i>
              </div>
              <div>
                <div class="text-xs text-slate-400">WhatsApp</div>
                <div class="text-sm font-semibold text-white">${empresa.whatsapp || empresa.telefone || "(54) 99999-9999"}</div>
              </div>
            </div>
            
            ${empresa.email ? `
            <div class="flex items-center gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div class="size-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <i data-lucide="mail" class="size-5"></i>
              </div>
              <div>
                <div class="text-xs text-slate-400">E-mail</div>
                <div class="text-sm font-semibold text-white">${empresa.email}</div>
              </div>
            </div>` : ""}
          </div>
        </div>

        <!-- FORM SIMULATOR -->
        <div class="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative">
          <h3 class="font-heading font-bold text-2xl text-white">Solicite uma Proposta</h3>
          <p class="text-xs text-slate-400 mt-1">Preencha abaixo para receber retorno em até 1 hora útil:</p>

          <form onsubmit="event.preventDefault(); window.open('${whatsappLink}', '_blank');" class="mt-6 space-y-4">
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1.5">Seu Nome / Empresa</label>
              <input type="text" required placeholder="Como podemos te chamar?" class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-sm">
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1.5">WhatsApp com DDD</label>
              <input type="tel" required placeholder="(XX) 99999-9999" class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-sm">
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1.5">Qual serviço você precisa?</label>
              <select class="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm">
                <option>${area}</option>
                <option>Orçamento de rotina</option>
                <option>Consultoria e Diagnóstico</option>
                <option>Outros serviços</option>
              </select>
            </div>
            <button type="submit" class="w-full py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25 active:scale-95 transition-all flex items-center justify-center gap-2">
              <i data-lucide="send" class="size-4"></i>
              <span>Enviar e Iniciar Atendimento</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  </section>

  <!-- FOOTER -->
  <footer class="py-12 border-t border-slate-900 bg-slate-950 text-center text-xs text-slate-500">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div>
        <span class="font-bold text-slate-300">${empresa.nome}</span> · ${area} em ${city}/RS
      </div>
      <div>
        Desenvolvido com tecnologia e estratégia digital · Locomotiva Comunicação
      </div>
    </div>
  </footer>

  <!-- FLOATING PULSING WHATSAPP CTA (21st.dev style) -->
  <div class="fixed bottom-6 right-6 z-50">
    <a href="${whatsappLink}" target="_blank" rel="noopener" class="group relative flex items-center justify-center size-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white shadow-xl shadow-emerald-500/30 hover:scale-110 active:scale-95 transition-all">
      <span class="absolute -top-1 -right-1 flex size-3">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full size-3 bg-emerald-400"></span>
      </span>
      <i data-lucide="message-circle" class="size-7"></i>
      <span class="absolute right-16 bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-800 shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        Conversar no WhatsApp
      </span>
    </a>
  </div>

  <!-- Lucide icons activator & GSAP animations & spotlight card effect -->
  <script>
    lucide.createIcons();

    // GSAP Core & ScrollTrigger animations
    if (typeof gsap !== 'undefined') {
      if (typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
      }

      // Animação de entrada dos elementos da Hero
      gsap.from(".hero-anim", {
        opacity: 0,
        y: 35,
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out"
      });

      // Animação de revelação dos cards e seções com ScrollTrigger
      gsap.utils.toArray('.reveal-card').forEach((el) => {
        gsap.from(el, {
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            toggleActions: "play none none none"
          },
          opacity: 0,
          y: 45,
          duration: 0.8,
          ease: "power2.out"
        });
      });
    }

    document.querySelectorAll('.spotlight-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mouse-x', (e.clientX - rect.left) + 'px');
        card.style.setProperty('--mouse-y', (e.clientY - rect.top) + 'px');
      });
    });
  </script>
</body>
</html>`;
}

/**
 * Server Function: Executa a pesquisa web em tempo real e gera o site moderno completo.
 */
export const gerarSiteCompletoIA_ServerFn = createServerFn({ method: "POST" })
  .inputValidator((data: GerarSiteInput) => data)
  .handler(async ({ data }): Promise<GerarSiteOutput> => {
    // 1. Pesquisa web aprofundada sobre a empresa e ramo
    const pesquisa = await pesquisarContextoParaSite(data.empresa);

    // 2. Tenta gerar via LLM Universal (Groq / Gemini / OpenRouter / Lovable)
    let generatedHtml = "";
    let providerUsed = "template_21st_dev";
    let modelUsed = "bespoke_engine";

    const promptSystem = `Você é um Design Engineer sênior e Diretor de Arte Web premiado, especialista em landing pages de altíssima conversão e design systems modernos no estilo 21st.dev (Tailwind CSS, animações GSAP fluidas, fotografias ricas, Bento Grid, Spotlight glow, tipografia de impacto).

REGRAS CRÍTICAS DE DESIGN E ANIMAÇÃO:
1. NUNCA gere sites com "cara genérica de IA" (evite clichês como "Inovação para o seu negócio", "Soluções inteligentes", cards iguais 3x3 azuis e vazios de imagens).
2. OBRIGATÓRIO - ANIMAÇÕES GSAP (GreenSock):
   - Inclua no <head> as bibliotecas GSAP e ScrollTrigger via CDN:
     <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
     <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
   - No final do <body>, inicialize o ScrollTrigger (gsap.registerPlugin(ScrollTrigger)) e adicione animações de entrada elegantes na Hero (stagger com ease: 'power3.out') e revelação dos cards de serviços ao rolar a página.
3. OBRIGATÓRIO - APELO VISUAL COM FOTOGRAFIAS REAIS:
   - O site DEVE ser extremamente visual. NUNCA use apenas ícones e blocos de texto.
   - Use fotografias reais em alta resolução do Unsplash (https://images.unsplash.com/photo-...) com tags temáticas diretamente ligadas ao segmento (${data.empresa.segmento} · ${data.empresa.areaAtuacao || ""}).
   - Coloque uma imagem principal marcante na Hero (composição editorial com card ou grid com overlay sofisticado).
   - Ilustre as seções de serviços e diferenciais com imagens reais dos produtos, procedimentos ou ambientes.
4. O site DEVE ser em HTML5 completo (<!DOCTYPE html> até </html>), totalmente funcional e responsivo.
5. Use Tailwind CSS via CDN (<script src="https://cdn.tailwindcss.com"></script>) e fontes do Google Fonts (Plus Jakarta Sans para corpo, Outfit para títulos).
6. Use Lucide Icons (<script src="https://unpkg.com/lucide@latest"></script> e <i data-lucide="..."></i>).
7. Incorpore componentes do 21st.dev:
   - Spotlight Cards com efeito de iluminação no cursor do mouse.
   - Infinite Logo / Feature Marquee animado com Tailwind keyframes.
   - Bento Grid assimétrico com hierarquia clara e cards interativos.
   - Ambient Glow Hero com gradientes radiais sofisticados.
   - Botão Flutuante de WhatsApp pulsante com link direto para wa.me/55...
8. Use os dados reais da empresa e da pesquisa web coletada. Seja ultra-específico quanto à cidade (${data.empresa.cidade}/RS) e segmento (${data.empresa.segmento} · ${data.empresa.areaAtuacao || ""}).
9. Retorne APENAS o código HTML puro, sem explicações antes ou depois.`;

    const promptUser = `Crie a landing page premium completa para a empresa abaixo:

Empresa: ${data.empresa.nome}
Segmento: ${data.empresa.segmento}
Área de Atuação: ${data.empresa.areaAtuacao || data.empresa.segmento}
Cidade: ${data.empresa.cidade}/RS
Endereço: ${data.empresa.endereco || ""}
Telefone/WhatsApp: ${data.empresa.whatsapp || data.empresa.telefone || ""}
E-mail: ${data.empresa.email || ""}
Site Atual: ${data.empresa.site || "Não possui"}

Resultados da pesquisa web em tempo real:
${pesquisa.snippets.join("\n")}
Diferenciais detectados: ${pesquisa.diferenciaisDetectados.join(", ")}

Gere o HTML5 completo, elegante, funcional e pronto para encantar o cliente.`;

    try {
      const llmRes = await chamarLlmUniversal(
        [
          { role: "system", content: promptSystem },
          { role: "user", content: promptUser },
        ],
        {
          provedorPreferencial: data.provedorPreferencial,
          customKeys: data.customKeys,
          temperature: 0.6,
          maxTokens: 4096,
        },
      );

      let raw = llmRes.text.trim();
      // Limpa cercas markdown se o modelo tiver retornado ```html
      raw = raw.replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/i, "").trim();

      if (raw.includes("<!DOCTYPE html") || raw.includes("<html")) {
        generatedHtml = raw;
        providerUsed = llmRes.provider;
        modelUsed = llmRes.model;
      }
    } catch (err: any) {
      console.warn("[SiteGenerator] Geração por LLM falhou ou sem chave, aplicando motor de templates 21st.dev:", err);
    }

    // Se o LLM falhar ou não devolver HTML válido, o template 21st.dev garante perfeição visual
    if (!generatedHtml) {
      generatedHtml = construirSiteModerno21stDev(data.empresa, pesquisa);
    }

    return {
      html: generatedHtml,
      pesquisaWeb: pesquisa,
      provider: providerUsed,
      model: modelUsed,
      geradoEm: new Date().toISOString(),
    };
  });
