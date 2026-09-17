import { createServerFn } from "@tanstack/react-start";

export interface PlaceResult {
  placeId: string;
  nome: string;
  endereco: string;
  cidade: string;
  telefone?: string;
  site?: string;
  googleMapsUri?: string;
  segmento?: string;
  rating?: number;
  totalRatings?: number;
  lat?: number;
  lng?: number;
  businessStatus?: string;
}

const FIELD_MASK = [
  "nextPageToken",
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.addressComponents",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.primaryTypeDisplayName",
  "places.types",
  "places.rating",
  "places.userRatingCount",
  "places.location",
  "places.businessStatus",
].join(",");


function extractCidade(components?: Array<{ longText?: string; types?: string[] }>): string {
  if (!components) return "";
  const city = components.find(
    (c) =>
      c.types?.includes("administrative_area_level_2") ||
      c.types?.includes("locality"),
  );
  return city?.longText ?? "";
}

export type GooglePlacesConnectorMode = "auto" | "lovable" | "serpapi";

export const searchPlaces = createServerFn({ method: "POST" })
  .validator((data: { query: string; regionCode?: string; limit?: number; modo?: GooglePlacesConnectorMode }) => {
    const query = String(data?.query ?? "").trim();
    if (!query || query.length < 2) throw new Error("Consulta muito curta");
    if (query.length > 200) throw new Error("Consulta muito longa");
    const limit = Math.min(Math.max(Number(data?.limit) || 20, 1), 100);
    const modo: GooglePlacesConnectorMode = data?.modo || "auto";
    return { query, regionCode: data?.regionCode ?? "BR", limit, modo };
  })
  .handler(async ({ data }): Promise<PlaceResult[]> => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    const modo = data.modo || "auto";

    type RawPlace = {
      id: string;
      displayName?: { text?: string };
      formattedAddress?: string;
      addressComponents?: Array<{ longText?: string; types?: string[] }>;
      nationalPhoneNumber?: string;
      internationalPhoneNumber?: string;
      websiteUri?: string;
      googleMapsUri?: string;
      primaryTypeDisplayName?: { text?: string };
      types?: string[];
      rating?: number;
      userRatingCount?: number;
      location?: { latitude?: number; longitude?: number };
      businessStatus?: string;
    };

    // 1. Se o modo for "lovable" ou "auto", tenta Lovable Cloud Gateway se configurado
    if (modo === "lovable" || (modo === "auto" && LOVABLE_API_KEY && GOOGLE_MAPS_API_KEY)) {
      if (modo === "lovable" && (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY)) {
        throw new Error(
          "As variáveis do Lovable Cloud Gateway (LOVABLE_API_KEY) não estão presentes neste ambiente. Use o modo 'Motor Direto (SerpApi)' ou 'Automático'.",
        );
      }

      const url = "https://connector-gateway.lovable.dev/google_maps/places/v1/places:searchText";
      const coletados: RawPlace[] = [];
      let pageToken: string | undefined;

      try {
        while (coletados.length < data.limit) {
          const response = await fetch(url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY || ""}`,
              "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY || "",
              "Content-Type": "application/json",
              "X-Goog-FieldMask": FIELD_MASK,
            },
            body: JSON.stringify({
              textQuery: data.query,
              regionCode: data.regionCode,
              languageCode: "pt-BR",
              maxResultCount: Math.min(20, data.limit - coletados.length),
              ...(pageToken ? { pageToken } : {}),
            }),
          });

          if (!response.ok) {
            const body = await response.text();
            console.warn(`Places searchText failed [${response.status}]: ${body}`);
            if (modo === "lovable") {
              throw new Error(`Falha no conector Lovable Places (${response.status}): ${body}`);
            }
            break;
          }

          const json = (await response.json()) as { places?: RawPlace[]; nextPageToken?: string };
          coletados.push(...(json.places ?? []));
          pageToken = json.nextPageToken;
          if (!pageToken || !(json.places ?? []).length) break;
        }

        if (coletados.length > 0) {
          return coletados.slice(0, data.limit).map((p) => ({
            placeId: p.id,
            nome: p.displayName?.text ?? "(sem nome)",
            endereco: p.formattedAddress ?? "",
            cidade: extractCidade(p.addressComponents),
            telefone: p.nationalPhoneNumber ?? p.internationalPhoneNumber,
            site: p.websiteUri,
            googleMapsUri: p.googleMapsUri,
            segmento: p.primaryTypeDisplayName?.text,
            rating: p.rating,
            totalRatings: p.userRatingCount,
            lat: p.location?.latitude,
            lng: p.location?.longitude,
            businessStatus: p.businessStatus,
          }));
        }
      } catch (err) {
        if (modo === "lovable") throw err;
        console.warn("Erro no conector Lovable Places, usando motor Google Maps via SerpApi:", err);
      }
    }

    // 2. Fallback para ambiente local usando motor Google Maps via SerpApi (Dados 100% Reais do Google Maps)
    const serpApiKey =
      process.env.SERPAPI_API_KEY ||
      "2cbfbfba-64f0-45b4-adee-2884173b3299:6198bbb2-506c-4148-b6a4-6a4820bb40d9";

    const serpUrl = new URL("https://serpapi.com/search.json");
    serpUrl.searchParams.set("engine", "google_maps");
    serpUrl.searchParams.set("q", data.query);
    serpUrl.searchParams.set("api_key", serpApiKey);
    serpUrl.searchParams.set("hl", "pt-br");
    serpUrl.searchParams.set("gl", data.regionCode?.toLowerCase() || "br");

    try {
      const response = await fetch(serpUrl.toString(), {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        },
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`Google Maps via SerpApi falhou [${response.status}]: ${errText}`);
        throw new Error(
          response.status === 401
            ? "Chave do SerpApi não autorizada. Verifique sua chave no arquivo .env."
            : `Falha ao buscar locais no Google Maps (${response.status})`,
        );
      }

      const json = (await response.json()) as {
        local_results?: Array<{
          place_id?: string;
          title?: string;
          address?: string;
          phone?: string;
          website?: string;
          type?: string;
          types?: string[];
          rating?: number;
          reviews?: number;
          gps_coordinates?: { latitude?: number; longitude?: number };
          links?: { website?: string };
        }>;
        places_results?: Array<any>;
      };

      const items = json.local_results || json.places_results || [];

      return items.slice(0, data.limit).map((p, idx) => {
        const nome = p.title || "(sem nome)";
        const endereco = p.address || "";
        let cidade = "";
        const partes = (endereco || "").split("-").map((s: string) => s.trim());
        if (partes.length >= 2) {
          cidade = partes[partes.length - 2].replace(/,\s*[A-Z]{2}$/i, "").trim();
        }

        const website = p.website || p.links?.website;

        return {
          placeId: p.place_id || `google-place-${idx}-${Date.now()}`,
          nome,
          endereco,
          cidade: cidade || "—",
          telefone: p.phone,
          site: website,
          googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${nome} ${endereco}`)}`,
          segmento: p.type || p.types?.[0] || "Comércio / Serviços",
          rating: p.rating,
          totalRatings: p.reviews,
          lat: p.gps_coordinates?.latitude,
          lng: p.gps_coordinates?.longitude,
        };
      });
    } catch (err: any) {
      if (err.message?.includes("ENOTFOUND") || err.message?.includes("fetch failed")) {
        throw new Error(
          "Não foi possível conectar ao Google Maps (Erro de rede / DNS). Certifique-se de que a conexão com a internet está ativa.",
        );
      }
      throw err;
    }
  });

