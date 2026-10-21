/**
 * Motor de Geração e Gerenciamento de Imagens por IA para Sites
 * Suporta Google Imagen 3 (via Google AI Studio / Gemini API) e FLUX.1 (via Pollinations.ai)
 */

import { createServerFn } from "@tanstack/react-start";

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
 * Gera URL direta do Pollinations.ai (FLUX.1) para renderização sob demanda
 */
export function gerarUrlPollinationsFlux(prompt: string, width = 1200, height = 800): string {
  const cleanPrompt = encodeURIComponent(prompt.slice(0, 400));
  const seed = Math.floor(Math.random() * 900000) + 100000;
  return `https://image.pollinations.ai/prompt/${cleanPrompt}?width=${width}&height=${height}&model=flux&nologo=true&seed=${seed}`;
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
