import { createServerFn } from "@tanstack/react-start";

export interface LookupResult {
  nome: string;
  segmento: string;
  cidade: string;
  bairro?: string;
  endereco: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  site?: string;
  instagram?: string;
  resumo: string;
  fonte: "site" | "instagram";
  urlAnalisada: string;
}

function normalizeUrl(input: string): { url: string; fonte: "site" | "instagram" } {
  let s = input.trim();
  if (!s) throw new Error("URL vazia");

  // Instagram handle: @foo ou foo (sem ponto e sem http)
  const isHandle = /^@?[a-zA-Z0-9._]+$/.test(s) && !s.includes(".");
  if (isHandle) {
    const clean = s.replace(/^@/, "");
    return { url: `https://www.instagram.com/${clean}/`, fonte: "instagram" };
  }

  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  const fonte: "site" | "instagram" = /instagram\.com/i.test(s) ? "instagram" : "site";
  return { url: s, fonte };
}

export const lookupEmpresa = createServerFn({ method: "POST" })
  .inputValidator((data: { input: string }) => {
    const input = String(data?.input ?? "").trim();
    if (!input) throw new Error("Informe um site ou @instagram");
    return { input };
  })
  .handler(async ({ data }): Promise<LookupResult> => {
    const { firecrawlScrape, chatJSON } = await import("./ai-gateway.server");
    const { url, fonte } = normalizeUrl(data.input);

    let scrape;
    try {
      scrape = await firecrawlScrape(url);
    } catch (err) {
      throw new Error(
        `Não foi possível acessar ${url}: ${(err as Error).message}`,
      );
    }

    const md = (scrape.markdown ?? "").slice(0, 8000);
    const meta = scrape.metadata ?? {};

    const sys =
      "Você extrai dados de empresas a partir do conteúdo público de um site ou perfil de Instagram. Foco em PMEs do Rio Grande do Sul (Serra Gaúcha). Português BR. Nunca invente dados; se algum campo não aparecer, deixe string vazia. Nunca use markdown na resposta.";
    const user = `Fonte analisada: ${fonte === "instagram" ? "perfil do Instagram" : "site institucional"}
URL: ${url}
Title: ${meta.title ?? ""}
Description: ${meta.description ?? ""}

Conteúdo extraído:
"""
${md || "(sem conteúdo)"}
"""

Extraia as informações da empresa e devolva JSON com este formato EXATO:
{
  "nome": "nome comercial",
  "segmento": "segmento/atividade principal (ex: Vinícola, Restaurante, Metalurgia)",
  "cidade": "cidade (se possível confirmar RS)",
  "bairro": "",
  "endereco": "endereço completo se aparecer, senão string vazia",
  "telefone": "formato (DDD) 0000-0000 se aparecer",
  "whatsapp": "formato (DDD) 00000-0000 se identificado como WhatsApp",
  "email": "",
  "site": "${fonte === "site" ? url : ""}",
  "instagram": "@handle se aparecer",
  "resumo": "2-3 frases descrevendo o negócio para uso comercial interno"
}

Regras:
- Se não encontrar um campo, use string vazia (nunca null).
- "nome" nunca vazio: se necessário, use o title da página.
- "segmento" nunca vazio: infira do conteúdo.
- "cidade" nunca vazio: infira do conteúdo; se ambíguo, deixe "".`;

    const raw = await chatJSON<Partial<LookupResult>>([
      { role: "system", content: sys },
      { role: "user", content: user },
    ]);

    return {
      nome: (raw.nome || meta.title || "Empresa sem nome").toString().trim(),
      segmento: (raw.segmento || "Outros").toString().trim(),
      cidade: (raw.cidade || "").toString().trim(),
      bairro: raw.bairro?.toString().trim() || undefined,
      endereco: (raw.endereco || "").toString().trim(),
      telefone: raw.telefone?.toString().trim() || undefined,
      whatsapp: raw.whatsapp?.toString().trim() || undefined,
      email: raw.email?.toString().trim() || undefined,
      site: (fonte === "site" ? url : raw.site?.toString().trim()) || undefined,
      instagram: raw.instagram?.toString().trim() || (fonte === "instagram" ? url : undefined),
      resumo: (raw.resumo || "").toString().trim(),
      fonte,
      urlAnalisada: url,
    };
  });

export interface GoogleMapsLookupResult {
  nome: string;
  segmento: string;
  endereco: string;
  cidade: string;
  bairro?: string;
  estado?: string;
  cep?: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  site?: string;
  googleMapsUrl?: string;
  rating?: number;
  totalRatings?: number;
  horario?: string;
  statusFuncionamento?: string;
  resumo?: string;
  placeId?: string;
  lat?: number;
  lng?: number;
  fonte: "google_maps_url" | "google_maps_address";
  inputOriginal: string;
}

function parseAddressComponents(rawAddress: string) {
  const addr = (rawAddress || "").trim();
  let cidade = "";
  let bairro = "";
  let estado = "";
  let cep = "";

  // Busca CEP brasileiro (ex: 95700-000 ou 95700000)
  const cepMatch = addr.match(/\b\d{5}-?\d{3}\b/);
  if (cepMatch) {
    cep = cepMatch[0];
  }

  // Busca Estado / UF (ex: - RS, , RS, RS)
  const estadoMatch = addr.match(/[-,\s]\s*([A-Z]{2})(?:,\s*Brasil|\s+Brasil|\s*,\s*\d{5}|$)/i);
  if (estadoMatch) {
    estado = estadoMatch[1].toUpperCase();
  }

  // Decomposição de endereço brasileiro padrão:
  // "R. Olavo Bilac, 450 - Imigrante, Bento Gonçalves - RS, 95702-000"
  const dashParts = addr.split(" - ").map((p) => p.trim());
  if (dashParts.length >= 3) {
    bairro = dashParts[1];
    const cityChunk = dashParts[2].split(",")[0].trim();
    cidade = cityChunk.replace(/\s+[A-Z]{2}$/i, "").trim();
  } else if (dashParts.length === 2) {
    const cityChunk = dashParts[1].split(",")[0].trim();
    cidade = cityChunk.replace(/\s+[A-Z]{2}$/i, "").trim();
  } else {
    const commaParts = addr.split(",").map((p) => p.trim());
    if (commaParts.length >= 3) {
      cidade = commaParts[commaParts.length - 2].replace(/\s+[A-Z]{2}$/i, "").trim();
    }
  }

  return { cidade, bairro, estado, cep };
}

export const lookupGoogleMapsAddress = createServerFn({ method: "POST" })
  .inputValidator((data: { input: string }) => {
    const input = String(data?.input ?? "").trim();
    if (!input || input.length < 3) {
      throw new Error("Informe o link do Google Maps ou o endereço da empresa.");
    }
    return { input };
  })
  .handler(async ({ data }): Promise<GoogleMapsLookupResult> => {
    let input = data.input.trim();
    const isUrl = /^https?:\/\//i.test(input) || /maps\.app\.goo\.gl|google\.com\/maps|goo\.gl\/maps/i.test(input);
    const fonte: "google_maps_url" | "google_maps_address" = isUrl ? "google_maps_url" : "google_maps_address";

    let resolvedUrl = isUrl ? (input.startsWith("http") ? input : `https://${input}`) : "";
    let extractedQuery = input;

    // 1. Se for uma URL (incluindo links encurtados maps.app.goo.gl), resolve o redirecionamento
    if (isUrl) {
      try {
        const resp = await fetch(resolvedUrl, {
          method: "GET",
          redirect: "follow",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
          },
        });
        resolvedUrl = resp.url || resolvedUrl;

        // Extrai o nome do local do path: /maps/place/Nome+Do+Local/
        const placeMatch = resolvedUrl.match(/\/maps\/place\/([^/@?]+)/i);
        if (placeMatch && placeMatch[1]) {
          extractedQuery = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
        } else {
          try {
            const u = new URL(resolvedUrl);
            const q = u.searchParams.get("q") || u.searchParams.get("query");
            if (q) extractedQuery = q;
          } catch {
            // URL parse fallback
          }
        }
      } catch (err) {
        console.warn("Não foi possível resolver URL encurtada do Google Maps:", err);
      }
    }

    // 2. Consulta via SerpApi (Google Maps Engine)
    const serpApiKey =
      process.env.SERPAPI_API_KEY?.trim() ||
      "ec62da1cce88a0223fee434841dbaceef4b27c63b8825d53de8d25090ccdbe02";

    if (serpApiKey && serpApiKey.length > 20 && !serpApiKey.includes(":")) {
      try {
        const serpUrl = new URL("https://serpapi.com/search.json");
        serpUrl.searchParams.set("engine", "google_maps");
        serpUrl.searchParams.set("q", extractedQuery);
        serpUrl.searchParams.set("api_key", serpApiKey);
        serpUrl.searchParams.set("hl", "pt-br");
        serpUrl.searchParams.set("gl", "br");

        const serpRes = await fetch(serpUrl.toString(), {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
          },
        });

        if (serpRes.ok) {
          const json = (await serpRes.json()) as {
            place_results?: {
              title?: string;
              address?: string;
              phone?: string;
              website?: string;
              type?: string;
              types?: string[];
              rating?: number;
              reviews?: number;
              hours?: Array<{ [day: string]: string }> | string;
              open_state?: string;
              description?: string;
              link?: string;
              place_id?: string;
              data_id?: string;
              gps_coordinates?: { latitude?: number; longitude?: number };
            };
            local_results?: Array<{
              title?: string;
              address?: string;
              phone?: string;
              website?: string;
              type?: string;
              types?: string[];
              rating?: number;
              reviews?: number;
              open_state?: string;
              place_id?: string;
              links?: { website?: string };
              gps_coordinates?: { latitude?: number; longitude?: number };
            }>;
          };

          const place = json.place_results || json.local_results?.[0];
          if (place && (place.title || place.address)) {
            const rawAddr = place.address || "";
            const parsed = parseAddressComponents(rawAddr);
            const nome = place.title || extractedQuery;
            const segmento = place.type || (place.types && place.types[0]) || "Comércio / Serviços";
            const phone = place.phone;
            const isWhatsapp = phone && /(\b9\d{4}-?\d{4}\b|\(?[1-9]{2}\)?\s*9)/.test(phone);

            return {
              nome,
              segmento,
              endereco: rawAddr || extractedQuery,
              cidade: parsed.cidade || "—",
              bairro: parsed.bairro || undefined,
              estado: parsed.estado || undefined,
              cep: parsed.cep || undefined,
              telefone: phone || undefined,
              whatsapp: isWhatsapp ? phone : undefined,
              site: place.website || (place as any).links?.website || undefined,
              googleMapsUrl:
                (place as any).link ||
                (place.place_id ? `https://www.google.com/maps/place/?q=place_id:${place.place_id}` : undefined) ||
                (resolvedUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${nome} ${rawAddr}`)}`),
              rating: place.rating,
              totalRatings: place.reviews,
              statusFuncionamento: place.open_state,
              resumo: (place as any).description || `Estabelecimento comercial localizado em ${parsed.cidade || "região local"}.`,
              placeId: place.place_id || (place as any).data_id,
              lat: place.gps_coordinates?.latitude,
              lng: place.gps_coordinates?.longitude,
              fonte,
              inputOriginal: input,
            };
          }
        }
      } catch (serpErr) {
        console.warn("Falha no SerpApi Google Maps lookup, tentando fallbacks:", serpErr);
      }
    }

    // 3. Fallback: OpenStreetMap Nominatim Geocoding
    try {
      const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(extractedQuery)}&format=json&addressdetails=1&limit=1`;
      const nomRes = await fetch(nomUrl, {
        headers: { "User-Agent": "LocomotivaCRM/1.0 (contato@locomotivacrm.com.br)" },
      });

      if (nomRes.ok) {
        const nomData = (await nomRes.json()) as Array<{
          display_name?: string;
          name?: string;
          type?: string;
          class?: string;
          lat?: string;
          lon?: string;
          place_id?: number;
          address?: {
            road?: string;
            house_number?: string;
            suburb?: string;
            city?: string;
            town?: string;
            municipality?: string;
            state?: string;
            postcode?: string;
            country?: string;
          };
        }>;

        if (nomData && nomData.length > 0) {
          const item = nomData[0];
          const a = item.address || {};
          const rua = [a.road, a.house_number].filter(Boolean).join(", ");
          const cid = a.city || a.town || a.municipality || "";
          const parsed = parseAddressComponents(item.display_name || "");

          const nomeLimpo = item.name || extractedQuery.replace(/,\s*[A-Z]{2}$/i, "");
          const enderecoCompleto = rua
            ? `${rua}${a.suburb ? ` - ${a.suburb}` : ""}, ${cid || parsed.cidade}${a.state ? ` - ${a.state}` : ""}`
            : item.display_name || extractedQuery;

          return {
            nome: nomeLimpo,
            segmento: item.type || item.class || "Comércio / Serviços",
            endereco: enderecoCompleto,
            cidade: cid || parsed.cidade || "—",
            bairro: a.suburb || parsed.bairro,
            estado: a.state || parsed.estado,
            cep: a.postcode || parsed.cep,
            googleMapsUrl:
              resolvedUrl ||
              (item.lat && item.lon
                ? `https://www.google.com/maps?q=${item.lat},${item.lon}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(extractedQuery)}`),
            lat: item.lat ? parseFloat(item.lat) : undefined,
            lng: item.lon ? parseFloat(item.lon) : undefined,
            placeId: item.place_id ? `osm-${item.place_id}` : undefined,
            resumo: `Endereço localizado via geocodificação em ${cid || "região informada"}.`,
            fonte,
            inputOriginal: input,
          };
        }
      }
    } catch (nomErr) {
      console.warn("Fallback Nominatim falhou:", nomErr);
    }

    // 4. Fallback com parsing sintático do endereço
    const parsedFallback = parseAddressComponents(extractedQuery);
    return {
      nome: extractedQuery.split(",")[0].trim() || "Empresa / Estabelecimento",
      segmento: "Comércio / Serviços",
      endereco: extractedQuery,
      cidade: parsedFallback.cidade || "—",
      bairro: parsedFallback.bairro,
      estado: parsedFallback.estado,
      cep: parsedFallback.cep,
      googleMapsUrl:
        resolvedUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(extractedQuery)}`,
      resumo: `Endereço cadastrado a partir de busca no Google Maps.`,
      fonte,
      inputOriginal: input,
    };
  });

