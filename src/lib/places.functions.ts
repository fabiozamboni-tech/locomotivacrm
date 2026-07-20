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

export const searchPlaces = createServerFn({ method: "POST" })
  .inputValidator((data: { query: string; regionCode?: string }) => {
    const query = String(data?.query ?? "").trim();
    if (!query || query.length < 2) throw new Error("Consulta muito curta");
    if (query.length > 200) throw new Error("Consulta muito longa");
    return { query, regionCode: data?.regionCode ?? "BR" };
  })
  .handler(async ({ data }): Promise<PlaceResult[]> => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) {
      throw new Error("Google Maps connector não configurado");
    }

    const url = "https://connector-gateway.lovable.dev/google_maps/places/v1/places:searchText";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
        "Content-Type": "application/json",
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: data.query,
        regionCode: data.regionCode,
        languageCode: "pt-BR",
        maxResultCount: 20,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`Places searchText failed [${response.status}]: ${body}`);
      throw new Error(`Falha ao consultar Google Places (${response.status})`);
    }

    const json = (await response.json()) as {
      places?: Array<{
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
      }>;
    };

    return (json.places ?? []).map((p) => ({
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
  });
