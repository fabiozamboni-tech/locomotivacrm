// Helpers server-only usados pelas ferramentas MCP.
// Nenhum acesso a dados de utilizador: apenas Google Places, Firecrawl e IA.

export interface PlaceLite {
  nome: string;
  segmento?: string;
  cidade: string;
  endereco: string;
  telefone?: string;
  site?: string;
  googleMapsUri?: string;
  rating?: number;
  totalRatings?: number;
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
  "places.rating",
  "places.userRatingCount",
].join(",");

function cidadeDe(components?: Array<{ longText?: string; types?: string[] }>): string {
  if (!components) return "";
  const c = components.find(
    (x) =>
      x.types?.includes("administrative_area_level_2") || x.types?.includes("locality"),
  );
  return c?.longText ?? "";
}

export async function buscarPlaces(query: string, max = 10): Promise<PlaceLite[]> {
  const lovable = process.env.LOVABLE_API_KEY;
  const maps = process.env.GOOGLE_MAPS_API_KEY;
  if (!lovable || !maps) throw new Error("Google Maps connector não configurado");

  const res = await fetch(
    "https://connector-gateway.lovable.dev/google_maps/places/v1/places:searchText",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovable}`,
        "X-Connection-Api-Key": maps,
        "Content-Type": "application/json",
        "X-Goog-FieldMask": FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: query,
        regionCode: "BR",
        languageCode: "pt-BR",
        maxResultCount: Math.min(Math.max(max, 1), 20),
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`Falha ao consultar Google Places (${res.status})`);
  }
  const json = (await res.json()) as {
    places?: Array<{
      displayName?: { text?: string };
      formattedAddress?: string;
      addressComponents?: Array<{ longText?: string; types?: string[] }>;
      nationalPhoneNumber?: string;
      internationalPhoneNumber?: string;
      websiteUri?: string;
      googleMapsUri?: string;
      primaryTypeDisplayName?: { text?: string };
      rating?: number;
      userRatingCount?: number;
    }>;
  };
  return (json.places ?? []).map((p) => ({
    nome: p.displayName?.text ?? "(sem nome)",
    segmento: p.primaryTypeDisplayName?.text,
    cidade: cidadeDe(p.addressComponents),
    endereco: p.formattedAddress ?? "",
    telefone: p.nationalPhoneNumber ?? p.internationalPhoneNumber,
    site: p.websiteUri,
    googleMapsUri: p.googleMapsUri,
    rating: p.rating,
    totalRatings: p.userRatingCount,
  }));
}

export interface EmpresaBrief {
  nome: string;
  segmento?: string;
  cidade?: string;
  site?: string;
  instagram?: string;
  observacoes?: string;
}

export function empresaTxt(e: EmpresaBrief): string {
  return [
    `Empresa: ${e.nome}`,
    `Segmento: ${e.segmento || "(não informado)"}`,
    `Cidade: ${e.cidade || "(não informada)"}/RS`,
    e.site ? `Site: ${e.site}` : "Site: (não possui / não localizado)",
    e.instagram ? `Instagram: ${e.instagram}` : "Instagram: (não localizado)",
    e.observacoes ? `Observações: ${e.observacoes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function normalizarAlvo(input: string): { url: string; fonte: "site" | "instagram" } {
  let s = input.trim();
  if (!s) throw new Error("URL vazia");
  const isHandle = /^@?[a-zA-Z0-9._]+$/.test(s) && !s.includes(".");
  if (isHandle) {
    return { url: `https://www.instagram.com/${s.replace(/^@/, "")}/`, fonte: "instagram" };
  }
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  return { url: s, fonte: /instagram\.com/i.test(s) ? "instagram" : "site" };
}
