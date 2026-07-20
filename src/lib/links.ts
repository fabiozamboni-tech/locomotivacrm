// Helpers para gerar links externos consistentes

export function siteUrl(site?: string): string | undefined {
  if (!site) return undefined;
  const s = site.trim();
  if (!s) return undefined;
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}

export function instagramUrl(handle?: string): string | undefined {
  if (!handle) return undefined;
  const s = handle.trim();
  if (!s) return undefined;
  if (/^https?:\/\//i.test(s)) return s;
  const clean = s.replace(/^@/, "").replace(/^instagram\.com\//i, "");
  return `https://instagram.com/${clean}`;
}

export function whatsappUrl(numero?: string): string | undefined {
  if (!numero) return undefined;
  const digits = numero.replace(/\D/g, "");
  if (!digits) return undefined;
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${withCountry}`;
}

export function telUrl(numero?: string): string | undefined {
  if (!numero) return undefined;
  const digits = numero.replace(/\D/g, "");
  return digits ? `tel:+${digits.startsWith("55") ? digits : `55${digits}`}` : undefined;
}

export function mailUrl(email?: string): string | undefined {
  if (!email) return undefined;
  const s = email.trim();
  return s ? `mailto:${s}` : undefined;
}

export function googleMapsUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function googleSearchUrl(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

export const ORIGEM_LABEL: Record<string, string> = {
  google_places: "Google Places",
  diretorio_publico: "Diretório público",
  manual: "Inserção manual",
  csv: "Importação CSV",
  enriquecimento: "Enriquecimento",
};

export function origemLink(
  origem: string,
  nome: string,
  cidade: string,
): { href?: string; label: string } {
  const label = ORIGEM_LABEL[origem] ?? origem.replace("_", " ");
  const q = `${nome} ${cidade}`;
  if (origem === "google_places") return { href: googleMapsUrl(q), label };
  if (origem === "diretorio_publico") return { href: googleSearchUrl(q), label };
  return { label };
}
