/**
 * Motor de Geração e Gerenciamento de Imagens por IA para Sites
 * Suporta Google Imagen 3 (via Google AI Studio / Gemini API) e FLUX.1 (via Pollinations.ai)
 */

import { createServerFn } from "@tanstack/react-start";
import { chamarLlmUniversal } from "./llm-provider.server";

export interface GerarImagemInput {
  prompt: string;
  tipo?: "hero" | "destaque" | "servico" | "livre";
  formato?: "16:9" | "4:3" | "1:1";
  nicho?: string;
  cidade?: string;
  empresaNome?: string;
  provedorPreferencial?: "auto" | "gemini" | "pollinations";
  customGeminiKey?: string;
}

export interface GerarImagemOutput {
  sucesso: boolean;
  url: string;
  provedor: "google_imagen_3" | "pollinations_flux" | "fallback";
  promptEmIngles: string;
  erro?: string;
}

/**
 * Converte e enriquece termos em português para prompts fotográficos cinematográficos em inglês
 */
export function montarPromptFotografico(params: {
  promptUsuario: string;
  tipo?: string;
  nicho?: string;
  cidade?: string;
  empresaNome?: string;
}): string {
  const { promptUsuario, tipo, nicho, cidade, empresaNome } = params;
  const pLower = promptUsuario.trim().toLowerCase();

  // Se já for em inglês ou longo, utiliza diretamente com termos fotográficos
  let basePrompt = promptUsuario.trim();

  // Mapeamentos frequentes de nichos e elementos para fotografia comercial em inglês
  const traducoes: Record<string, string> = {
    marmoraria: "luxury marble and exotic granite slabs showroom, polished stone craftsmanship",
    mármore: "luxurious exotic marble countertop, elegant veins texture, waterfall edge",
    granito: "high end polished granite architecture, durable natural stone texture",
    vidraçaria: "modern architectural glass facade, minimalist tempered glass balcony railings",
    vidro: "crystal clear architectural glass, reflections of daylight, elegant interior",
    marcenaria: "bespoke custom woodwork cabinetry, high end interior design, warm ambient light",
    móveis: "luxury custom furniture, designer living room interior, Scandinavian modern aesthetic",
    advocacia: "prestigious modern law office library, solid oak furniture, warm editorial lighting",
    médico: "state of the art medical clinic, clean minimalist healthcare interior, gentle daylight",
    clínica: "premium wellness clinic interior, welcoming reception, aesthetic architecture",
    odontologia: "modern high tech dental studio, spotless bright interior, aesthetic design",
    restaurante: "gourmet dining room, moody warm atmosphere, fine dining cuisine presentation",
    vinícola: "rolling vineyard landscape in Serra Gaucha, wooden wine barrels in rustic modern cellar",
    vinho: "elegant wine bottle and glass on stone table, vineyard sunset view",
    hotelaria: "boutique hotel suite, king size bed with crisp white linens, scenic mountain view",
    fachada: "striking modern architectural building facade, premium exterior materials, dusk lighting",
    equipe: "professional dedicated team collaboration in modern studio, confident warm expressions",
    atendimento: "friendly professional client consultation in elegant modern boardroom",
  };

  // Detecta termos-chave
  const termosEncontrados: string[] = [];
  for (const [pt, en] of Object.entries(traducoes)) {
    if (pLower.includes(pt)) {
      termosEncontrados.push(en);
    }
  }

  const nichoTermo = nicho ? (traducoes[nicho.toLowerCase()] || nicho) : "";
  const contextoLocal = cidade ? `in ${cidade} Serra Gaucha Brazil` : "in modern Brazilian architecture";

  let modifierTipo = "";
  if (tipo === "hero") {
    modifierTipo = "wide panoramic shot, architectural interior photography, cinematic lighting, 8k resolution, photorealistic, architectural digest style";
  } else if (tipo === "destaque") {
    modifierTipo = "editorial medium shot, artisanal craftsmanship and premium quality, soft natural daylight, shallow depth of field";
  } else if (tipo === "servico") {
    modifierTipo = "detailed focus, commercial product presentation, immaculate finish, crisp sharp details, studio lighting";
  } else {
    modifierTipo = "high resolution commercial photography, award winning composition, natural lighting, highly detailed";
  }

  // Monta a descrição em inglês
  let promptIngles = "";
  if (termosEncontrados.length > 0) {
    promptIngles = `${termosEncontrados.join(", ")} for ${nichoTermo || "premium commercial business"} ${contextoLocal}, ${modifierTipo}`;
  } else if (pLower.length > 0) {
    promptIngles = `${basePrompt}, professional commercial photography for ${nicho || "business"} ${contextoLocal}, ${modifierTipo}`;
  } else {
    promptIngles = `modern high end ${nicho || "commercial"} architecture and services ${contextoLocal}, ${modifierTipo}`;
  }

  // Remove caracteres especiais que podem corromper a query string
  return promptIngles.replace(/["'\n\r\t]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Gera URL direta do Pollinations.ai com suporte a FLUX, FLUX-Realism, FLUX-3D e Turbo
 */
export function gerarUrlPollinationsFlux(
  prompt: string,
  width = 1200,
  height = 800,
  opcoes?: {
    model?: "flux" | "flux-realism" | "flux-3d" | "turbo";
    enhance?: boolean;
    seed?: number;
  },
): string {
  const cleanPrompt = encodeURIComponent(prompt.slice(0, 450));
  const seed = opcoes?.seed ?? (Math.floor(Math.random() * 900000) + 100000);
  const model = opcoes?.model || "flux";
  const enhanceParam = opcoes?.enhance ? "&enhance=true" : "";
  return `https://image.pollinations.ai/prompt/${cleanPrompt}?width=${width}&height=${height}&model=${model}&nologo=true&seed=${seed}${enhanceParam}`;
}

/**
 * Server Function: Gera ou orquestra a criação de imagem por IA
 */
export const gerarImagemSite_ServerFn = createServerFn({ method: "POST" })
  .inputValidator((data: GerarImagemInput) => data)
  .handler(async ({ data }): Promise<GerarImagemOutput> => {
    const promptIngles = montarPromptFotografico({
      promptUsuario: data.prompt,
      tipo: data.tipo,
      nicho: data.nicho,
      cidade: data.cidade,
      empresaNome: data.empresaNome,
    });

    let width = 1200;
    let height = 800;
    let aspectRatioGoogle = "16:9";

    if (data.tipo === "hero" || data.formato === "16:9") {
      width = 1600;
      height = 900;
      aspectRatioGoogle = "16:9";
    } else if (data.tipo === "servico" || data.formato === "4:3") {
      width = 800;
      height = 600;
      aspectRatioGoogle = "4:3";
    } else if (data.formato === "1:1") {
      width = 800;
      height = 800;
      aspectRatioGoogle = "1:1";
    }

    // 1. TENTA GOOGLE IMAGEN 3 SE HOUVER CHAVE DISPONÍVEL OU PROVEDOR SELECIONADO
    const geminiKey =
      data.customGeminiKey ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY;

    if (data.provedorPreferencial === "gemini" || (data.provedorPreferencial !== "pollinations" && geminiKey)) {
      try {
        if (geminiKey) {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${geminiKey}`;
          const res = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              instances: [
                {
                  prompt: promptIngles,
                },
              ],
              parameters: {
                sampleCount: 1,
                aspectRatio: aspectRatioGoogle,
                personGeneration: "ALLOW_ADULT",
                safetySetting: "BLOCK_MEDIUM_AND_ABOVE",
              },
            }),
          });

          if (res.ok) {
            const json = await res.json();
            const prediction = json?.predictions?.[0];
            if (prediction?.bytesBase64Encoded) {
              const mime = prediction.mimeType || "image/jpeg";
              return {
                sucesso: true,
                url: `data:${mime};base64,${prediction.bytesBase64Encoded}`,
                provedor: "google_imagen_3",
                promptEmIngles: promptIngles,
              };
            }
          }
        }
      } catch (err) {
        console.warn("[Imagem IA] Falha no Google Imagen 3, usando fallback FLUX:", err);
      }
    }

    // 2. FALLBACK IMEDIATO: POLLINATIONS.AI (FLUX.1)
    // Gera URL pública sem custo e com cache CDN
    const fluxUrl = gerarUrlPollinationsFlux(promptIngles, width, height);

    return {
      sucesso: true,
      url: fluxUrl,
      provedor: "pollinations_flux",
      promptEmIngles: promptIngles,
    };
  });

export interface GerarLogoSvgInput {
  empresaNome: string;
  segmento: string;
  cidade: string;
  estilo?: "horizontal_navbar" | "monograma_icone" | "emblema_selo" | "minimalista_moderno";
  corPrimariaHex?: string;
  corSecundariaHex?: string;
  customKeys?: {
    groq?: string;
    gemini?: string;
    openrouter?: string;
    cerebras?: string;
    lovable?: string;
    ollamaBaseUrl?: string;
  };
  provedorPreferencial?: "auto" | "groq" | "gemini" | "openrouter" | "cerebras" | "lovable" | "ollama";
  modeloPreferencial?: string;
}

export interface GerarLogoSvgOutput {
  sucesso: boolean;
  svgCode: string;
  dataUrl: string;
  titulo: string;
  provider: string;
  model: string;
  erro?: string;
}

/**
 * Server Function: Gera logotipos vetoriais SVG puros através de LLMs (Groq, Gemini, etc.)
 */
export const gerarLogoVetorialSvg_ServerFn = createServerFn({ method: "POST" })
  .inputValidator((data: GerarLogoSvgInput) => data)
  .handler(async ({ data }): Promise<GerarLogoSvgOutput> => {
    const estilo = data.estilo || "horizontal_navbar";
    const corPrimaria = data.corPrimariaHex || "#722F37";
    const corSecundaria = data.corSecundariaHex || "#18181B";

    let orientacaoViewBox = 'viewBox="0 0 360 90" width="100%" height="100%"';
    let orientacaoInstrucao = `Composição horizontal para cabeçalho de site (navbar).
Coloque à esquerda um ícone ou símbolo geométrico refinado da marca (tamanho aproximado 50x50px), e à direita o nome da empresa "${data.empresaNome}" com tipografia elegante e espaçamento harmônico, seguido de um subtítulo sutil com a especialidade "${data.segmento}".`;

    if (estilo === "monograma_icone") {
      orientacaoViewBox = 'viewBox="0 0 180 180" width="100%" height="100%"';
      orientacaoInstrucao = `Composição quadrada para ícone de marca / avatar / monograma.
Crie um símbolo geométrico centralizado ou monograma com as iniciais de "${data.empresaNome}", proporção áurea, linhas vetoriais perfeitas e sem texto longo.`;
    } else if (estilo === "emblema_selo") {
      orientacaoViewBox = 'viewBox="0 0 200 200" width="100%" height="100%"';
      orientacaoInstrucao = `Composição circular de selo / brasão / emblema nobre.
Crie uma insígnia circular ou geométrica com bordas duplas finas, o ícone do nicho centralizado e o nome da empresa "${data.empresaNome}" e cidade "${data.cidade}" dispostos com precisão artesanal.`;
    }

    const promptSystem = `Você é um Designer Sênior de Identidade Visual e Especialista em Código SVG Vetorial.
Sua missão é criar o código SVG completo e profissional de um logotipo vetorial moderno de alto padrão para a empresa fornecida.

REGRAS ESTRITAS DE RETORNO:
1. Retorne EXCLUSIVAMENTE o código SVG puro iniciando em <svg e terminando em </svg>. Não inclua blocos markdown (sem cercas de código), sem explicações, comentários fora da tag ou texto antes/depois.
2. Atributos da tag raiz: <svg xmlns="http://www.w3.org/2000/svg" ${orientacaoViewBox} fill="none">
3. Fundo transparente: NUNCA crie um <rect> de fundo opaco cobrindo todo o SVG. O fundo DEVE ser 100% transparente para funcionar em qualquer fundo de site.
4. Cores do projeto:
   - Cor primária da marca: ${corPrimaria} (use em elementos de destaque, formas geométricas, ícone ou iniciais).
   - Cor do texto e linhas escuras: ${corSecundaria} (ou tom escuro de alto contraste #18181B).
   - Pode usar variações com opacidade (ex: fill="${corPrimaria}" fill-opacity="0.15" para áreas sutis).
5. Tipografia limpa e segura:
   - Use <text> com font-family="Outfit, Plus Jakarta Sans, system-ui, -apple-system, sans-serif".
   - Ajuste font-size, font-weight (700 para nome principal, 500 para subtítulo) e letter-spacing ("0.05em" ou "0.1em").
6. Formas vetoriais ricas:
   - Use <path>, <circle>, <rect>, <polygon>, <g> com curvas bem calculadas e traçados limpos.
   - Proibido o uso de tags <image>, scripts externos ou filtros excessivos que degradem performance.`;

    const promptUser = `Crie o logotipo vetorial SVG para:
- Nome da Empresa: ${data.empresaNome}
- Segmento: ${data.segmento}
- Cidade: ${data.cidade}/RS (Serra Gaúcha)
- Estilo: ${estilo}
- Instrução de Composição: ${orientacaoInstrucao}
- Cor Primária: ${corPrimaria}

Gere o código SVG puro agora.`;

    try {
      const llmRes = await chamarLlmUniversal(
        [
          { role: "system", content: promptSystem },
          { role: "user", content: promptUser },
        ],
        {
          provedorPreferencial: data.provedorPreferencial || "auto",
          model: data.modeloPreferencial,
          customKeys: data.customKeys,
          temperature: 0.3,
          maxTokens: 3000,
        },
      );

      let svgRaw = llmRes.text.trim();
      svgRaw = svgRaw.replace(/^```(?:xml|svg|html)?\s*/i, "").replace(/\s*```$/i, "").trim();

      // Garante que o início seja <svg
      const svgMatch = svgRaw.match(/<svg[\s\S]*<\/svg>/i);
      if (svgMatch) {
        svgRaw = svgMatch[0];
      }

      if (!svgRaw.startsWith("<svg") || !svgRaw.endsWith("</svg>")) {
        throw new Error("Resposta da IA não contém um bloco SVG válido.");
      }

      const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svgRaw, "utf-8").toString("base64")}`;

      return {
        sucesso: true,
        svgCode: svgRaw,
        dataUrl,
        titulo: `${data.empresaNome} - ${estilo}`,
        provider: llmRes.provider,
        model: llmRes.model,
      };
    } catch (err: any) {
      console.warn("[Logo SVG] Falha ao gerar SVG via LLM, gerando fallback vetorial geométrico:", err?.message);

      // Fallback vetorial paramétrico resiliente
      const iniciais = data.empresaNome
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase() || "")
        .join("");

      let svgFallback = "";
      if (estilo === "monograma_icone") {
        svgFallback = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180" width="100%" height="100%" fill="none">
  <rect x="20" y="20" width="140" height="140" rx="36" fill="${corPrimaria}" fill-opacity="0.1" stroke="${corPrimaria}" stroke-width="4"/>
  <circle cx="90" cy="90" r="48" fill="${corPrimaria}" fill-opacity="0.15"/>
  <text x="90" y="106" font-family="Outfit, Plus Jakarta Sans, sans-serif" font-size="44" font-weight="800" fill="${corPrimaria}" text-anchor="middle" letter-spacing="2">${iniciais}</text>
</svg>`;
      } else {
        svgFallback = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 90" width="100%" height="100%" fill="none">
  <g transform="translate(15, 15)">
    <rect x="0" y="0" width="60" height="60" rx="14" fill="${corPrimaria}" fill-opacity="0.12" stroke="${corPrimaria}" stroke-width="3"/>
    <path d="M18 42 L30 18 L42 42 Z" stroke="${corPrimaria}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <circle cx="30" cy="28" r="5" fill="${corPrimaria}"/>
  </g>
  <text x="90" y="44" font-family="Outfit, Plus Jakarta Sans, sans-serif" font-size="24" font-weight="800" fill="${corSecundaria}" letter-spacing="0.5">${data.empresaNome}</text>
  <text x="92" y="64" font-family="Plus Jakarta Sans, sans-serif" font-size="11" font-weight="600" fill="#71717A" letter-spacing="2">${data.segmento.toUpperCase()} · ${data.cidade.toUpperCase()}</text>
</svg>`;
      }

      const dataUrlFallback = `data:image/svg+xml;base64,${Buffer.from(svgFallback, "utf-8").toString("base64")}`;

      return {
        sucesso: true,
        svgCode: svgFallback,
        dataUrl: dataUrlFallback,
        titulo: `${data.empresaNome} (Vetorial Resiliente)`,
        provider: "motor_vetorial_locomotiva",
        model: "svg_geometric_engine",
      };
    }
  });
