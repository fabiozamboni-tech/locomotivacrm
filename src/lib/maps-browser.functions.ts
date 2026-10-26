import { createServerFn } from "@tanstack/react-start";
import { getDbState } from "./server-db";

const DEFAULT_SERPAPI_KEY = "ec62da1cce88a0223fee434841dbaceef4b27c63b8825d53de8d25090ccdbe02";

function getSerpApiKey(): string {
  const envKey = process.env.SERPAPI_API_KEY?.trim();
  if (envKey && envKey.length > 20 && !envKey.includes(":")) {
    return envKey;
  }
  return DEFAULT_SERPAPI_KEY;
}

function cleanDigits(str?: string): string {
  if (!str) return "";
  return str.replace(/\D/g, "");
}

function cleanDomain(url?: string): string {
  if (!url) return "";
  try {
    const withoutProto = url.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
    return withoutProto.split("/")[0].split("?")[0].trim().toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

function normalizeText(str?: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface MapPlaceResult {
  id: string;
  title: string;
  category?: string;
  segmentoSugerido?: string;
  address: string;
  cidade: string;
  bairro?: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviews?: number;
  placeId?: string;
  latitude: number;
  longitude: number;
  thumbnail?: string;
  googleMapsUri?: string;
  source: "serpapi" | "osm" | "crm";
  jaNoCrm: boolean;
  crmId?: string;
  crmStage?: string;
  crmScore?: number;
}

export interface BuscarEmpresasRegiaoInput {
  lat: number;
  lng: number;
  zoom: number;
  query?: string;
  segmento?: string;
  cidade?: string;
  bounds?: {
    south: number;
    west: number;
    north: number;
    east: number;
  };
}

export interface BuscarEmpresasRegiaoResult {
  places: MapPlaceResult[];
  total: number;
  totalNoCrm: number;
  totalNovas: number;
  centro: { lat: number; lng: number };
  cidadeIdentificada?: string;
  fonte: "serpapi" | "osm" | "crm_misto";
}

// Cidades de referência da Serra Gaúcha e RS com coordenadas
export const CIDADES_RS_COORDENADAS: Record<string, { lat: number; lng: number; zoom: number }> = {
  "Bento Gonçalves": { lat: -29.1711, lng: -51.5186, zoom: 14 },
  "Caxias do Sul": { lat: -29.1678, lng: -51.1794, zoom: 14 },
  "Farroupilha": { lat: -29.2238, lng: -51.3473, zoom: 14 },
  "Garibaldi": { lat: -29.2564, lng: -51.5342, zoom: 14 },
  "Carlos Barbosa": { lat: -29.2975, lng: -51.5039, zoom: 14 },
  "Flores da Cunha": { lat: -29.0286, lng: -51.1839, zoom: 14 },
  "Gramado": { lat: -29.3746, lng: -50.8764, zoom: 14 },
  "Canela": { lat: -29.3644, lng: -50.8122, zoom: 14 },
  "Nova Prata": { lat: -28.7836, lng: -51.6094, zoom: 14 },
  "Veranópolis": { lat: -28.9358, lng: -51.5492, zoom: 14 },
  "Porto Alegre": { lat: -30.0346, lng: -51.2177, zoom: 13 },
  "Novo Hamburgo": { lat: -29.6789, lng: -51.1306, zoom: 14 },
  "São Leopoldo": { lat: -29.7601, lng: -51.1472, zoom: 14 },
  "Passo Fundo": { lat: -28.2628, lng: -52.4067, zoom: 14 },
  "Santa Maria": { lat: -29.6842, lng: -53.8069, zoom: 14 },
};

export const buscarEmpresasRegiaoMaps_ServerFn = createServerFn({ method: "POST" })
  .validator((data: BuscarEmpresasRegiaoInput) => data)
  .handler(async ({ data }): Promise<BuscarEmpresasRegiaoResult> => {
    const lat = Number(data.lat) || -29.1678;
    const lng = Number(data.lng) || -51.1794;
    const zoom = Math.min(Math.max(Number(data.zoom) || 14, 10), 19);

    // 1. Busca empresas já cadastradas no CRM para cruzamento
    const crmState = await getDbState().catch(() => null);
    const crmEmpresas = crmState?.empresas || [];

    const crmPorTelefone = new Map<string, (typeof crmEmpresas)[0]>();
    const crmPorDominio = new Map<string, (typeof crmEmpresas)[0]>();
    const crmPorNome = new Map<string, (typeof crmEmpresas)[0]>();

    for (const emp of crmEmpresas) {
      if (emp.telefone) {
        const dig = cleanDigits(emp.telefone);
        if (dig.length >= 8) crmPorTelefone.set(dig.slice(-8), emp);
      }
      if (emp.whatsapp) {
        const digW = cleanDigits(emp.whatsapp);
        if (digW.length >= 8) crmPorTelefone.set(digW.slice(-8), emp);
      }
      if (emp.site) {
        const dom = cleanDomain(emp.site);
        if (dom && dom.length > 4) crmPorDominio.set(dom, emp);
      }
      const normNome = normalizeText(emp.nome);
      if (normNome.length > 3) {
        crmPorNome.set(normNome, emp);
      }
    }

    // 2. Monta consulta no Google Maps
    const termo = data.query?.trim() || data.segmento?.trim() || "empresas";
    const apiKey = getSerpApiKey();
    const placesMap = new Map<string, MapPlaceResult>();

    let fonte: "serpapi" | "osm" | "crm_misto" = "serpapi";

    // 3. Consulta ao SerpApi (Google Maps Engine com parâmetro ll)
    if (apiKey && apiKey.length > 20) {
      try {
        const serpUrl = new URL("https://serpapi.com/search.json");
        serpUrl.searchParams.set("engine", "google_maps");
        serpUrl.searchParams.set("q", termo);
        serpUrl.searchParams.set("ll", `@${lat.toFixed(6)},${lng.toFixed(6)},${zoom}z`);
        serpUrl.searchParams.set("api_key", apiKey);
        serpUrl.searchParams.set("hl", "pt-br");
        serpUrl.searchParams.set("gl", "br");

        const resp = await fetch(serpUrl.toString(), {
          headers: { "User-Agent": "LocomotivaCRM/1.0" },
        });

        if (resp.ok) {
          const json = await resp.json();
          const results = Array.isArray(json.local_results) ? json.local_results : [];

          for (const item of results) {
            const gpsLat = Number(item.gps_coordinates?.latitude);
            const gpsLng = Number(item.gps_coordinates?.longitude);

            if (!gpsLat || !gpsLng) continue;

            const title = String(item.title || "").trim();
            if (!title) continue;

            const rawAddr = String(item.address || "").trim();
            const phone = item.phone ? String(item.phone).trim() : undefined;
            const website = item.website ? String(item.website).trim() : undefined;
            const category = item.type ? String(item.type).trim() : undefined;

            // Extrai cidade do endereço
            let cidade = data.cidade || "";
            if (!cidade && rawAddr) {
              const parts = rawAddr.split(/[-–,]/).map((s) => s.trim());
              for (const part of parts) {
                for (const c of Object.keys(CIDADES_RS_COORDENADAS)) {
                  if (part.toLowerCase().includes(c.toLowerCase())) {
                    cidade = c;
                    break;
                  }
                }
                if (cidade) break;
              }
            }
            if (!cidade) cidade = "Serra Gaúcha";

            // Verifica se já está no CRM
            let jaNoCrm = false;
            let crmEmpresaEncontrada = null;

            if (phone) {
              const dig = cleanDigits(phone);
              if (dig.length >= 8 && crmPorTelefone.has(dig.slice(-8))) {
                jaNoCrm = true;
                crmEmpresaEncontrada = crmPorTelefone.get(dig.slice(-8));
              }
            }
            if (!jaNoCrm && website) {
              const dom = cleanDomain(website);
              if (dom && crmPorDominio.has(dom)) {
                jaNoCrm = true;
                crmEmpresaEncontrada = crmPorDominio.get(dom);
              }
            }
            if (!jaNoCrm) {
              const norm = normalizeText(title);
              if (norm && crmPorNome.has(norm)) {
                jaNoCrm = true;
                crmEmpresaEncontrada = crmPorNome.get(norm);
              }
            }

            const placeId = item.place_id || `place_${gpsLat.toFixed(4)}_${gpsLng.toFixed(4)}`;
            const googleMapsUri =
              item.link ||
              (item.place_id ? `https://www.google.com/maps/place/?q=place_id:${item.place_id}` : undefined) ||
              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${title} ${rawAddr}`)}`;

            placesMap.set(placeId, {
              id: placeId,
              title,
              category,
              segmentoSugerido: category || data.segmento || "Comércio & Serviços",
              address: rawAddr || `${title}, ${cidade} - RS`,
              cidade,
              phone,
              website,
              rating: typeof item.rating === "number" ? item.rating : undefined,
              reviews: typeof item.reviews === "number" ? item.reviews : undefined,
              placeId: item.place_id,
              latitude: gpsLat,
              longitude: gpsLng,
              thumbnail: item.thumbnail,
              googleMapsUri,
              source: "serpapi",
              jaNoCrm,
              crmId: crmEmpresaEncontrada?.id,
              crmStage: crmEmpresaEncontrada?.crmStage,
              crmScore: crmEmpresaEncontrada?.score,
            });
          }
        }
      } catch (err: any) {
        console.warn("[MapsBrowser] Falha ao consultar SerpApi Google Maps:", err.message);
      }
    }

    // 4. Contingência via Overpass API caso o SerpApi retorne poucos resultados
    if (placesMap.size < 5 && data.bounds) {
      try {
        const { south, west, north, east } = data.bounds;
        const bbox = `${south},${west},${north},${east}`;
        const queryOverpass = `[out:json][timeout:12];(node["shop"](${bbox});node["amenity"~"restaurant|cafe|bar|bank|pharmacy|hospital"](${bbox});node["office"](${bbox}););out center 35;`;

        const respOsm = await fetch("https://overpass-api.de/api/interpreter", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `data=${encodeURIComponent(queryOverpass)}`,
        });

        if (respOsm.ok) {
          const osmJson = await respOsm.json();
          fonte = placesMap.size > 0 ? "crm_misto" : "osm";

          for (const el of osmJson.elements || []) {
            const elLat = el.lat || el.center?.lat;
            const elLng = el.lon || el.center?.lon;
            const tags = el.tags || {};
            const title = tags.name?.trim();

            if (!elLat || !elLng || !title) continue;

            const id = `osm_${el.id}`;
            if (placesMap.has(id)) continue;

            const category = tags.shop || tags.amenity || tags.office || "Comércio";
            const phone = tags.phone || tags["contact:phone"];
            const website = tags.website || tags["contact:website"];
            const rawAddr = [tags["addr:street"], tags["addr:housenumber"], tags["addr:suburb"], tags["addr:city"]]
              .filter(Boolean)
              .join(", ");

            placesMap.set(id, {
              id,
              title,
              category,
              segmentoSugerido: category,
              address: rawAddr || `${title}, ${data.cidade || "RS"}`,
              cidade: tags["addr:city"] || data.cidade || "RS",
              bairro: tags["addr:suburb"],
              phone,
              website,
              latitude: elLat,
              longitude: elLng,
              googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${title} ${elLat},${elLng}`)}`,
              source: "osm",
              jaNoCrm: false,
            });
          }
        }
      } catch (osmErr: any) {
        console.warn("[MapsBrowser] Falha ao consultar OpenStreetMap Overpass:", osmErr.message);
      }
    }

    // 5. Inclui empresas do CRM que estejam na área geográfica consultada
    for (const crmEmp of crmEmpresas) {
      if (crmEmp.crmStage === "excluidos") continue;

      // Se a empresa do CRM tiver a cidade focada ou estiver nos resultados
      const cidadeAlvo = data.cidade || "";
      const coincideCidade =
        cidadeAlvo &&
        crmEmp.cidade &&
        crmEmp.cidade.toLowerCase().includes(cidadeAlvo.toLowerCase());

      // Se já foi adicionada pelo place_id ou telefone, pula
      const jaAdicionada = Array.from(placesMap.values()).some(
        (p) => p.crmId === crmEmp.id || p.title.toLowerCase() === crmEmp.nome.toLowerCase()
      );

      if (!jaAdicionada && coincideCidade) {
        // Gera pequena dispersão em torno do centro da cidade para não sobrepor se não tiver GPS
        const baseCoord = CIDADES_RS_COORDENADAS[crmEmp.cidade] || { lat, lng };
        const hash = Math.abs(
          crmEmp.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
        );
        const offsetLat = ((hash % 100) - 50) * 0.0003;
        const offsetLng = (((hash >> 2) % 100) - 50) * 0.0003;

        placesMap.set(crmEmp.id, {
          id: crmEmp.id,
          title: crmEmp.nome,
          category: crmEmp.segmento || "Empresa CRM",
          segmentoSugerido: crmEmp.segmento,
          address: crmEmp.endereco || `${crmEmp.nome}, ${crmEmp.cidade}`,
          cidade: crmEmp.cidade,
          bairro: crmEmp.bairro,
          phone: crmEmp.telefone || crmEmp.whatsapp,
          website: crmEmp.site,
          rating: 5.0,
          latitude: baseCoord.lat + offsetLat,
          longitude: baseCoord.lng + offsetLng,
          googleMapsUri: crmEmp.buscaGoogleMaps
            ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(crmEmp.buscaGoogleMaps)}`
            : undefined,
          source: "crm",
          jaNoCrm: true,
          crmId: crmEmp.id,
          crmStage: crmEmp.crmStage,
          crmScore: crmEmp.score,
        });
      }
    }

    const allPlaces = Array.from(placesMap.values());
    const totalNoCrm = allPlaces.filter((p) => p.jaNoCrm).length;
    const totalNovas = allPlaces.length - totalNoCrm;

    return {
      places: allPlaces,
      total: allPlaces.length,
      totalNoCrm,
      totalNovas,
      centro: { lat, lng },
      cidadeIdentificada: data.cidade,
      fonte,
    };
  });

export const geocodificarLocalizacao_ServerFn = createServerFn({ method: "POST" })
  .validator((data: { query: string }) => data)
  .handler(async ({ data }): Promise<{ lat: number; lng: number; displayName: string; zoom: number } | null> => {
    const q = data.query?.trim();
    if (!q || q.length < 2) return null;

    // 1. Checa dicionário local de cidades conhecidas
    for (const [nome, coord] of Object.entries(CIDADES_RS_COORDENADAS)) {
      if (nome.toLowerCase() === q.toLowerCase() || q.toLowerCase().includes(nome.toLowerCase())) {
        return {
          lat: coord.lat,
          lng: coord.lng,
          displayName: `${nome}, Rio Grande do Sul, Brasil`,
          zoom: coord.zoom,
        };
      }
    }

    // 2. Consulta Nominatim OpenStreetMap
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${q}, Brasil`)}&format=json&limit=1`;
      const resp = await fetch(url, {
        headers: { "User-Agent": "LocomotivaCRM-MapsNavigator/1.0" },
      });
      if (resp.ok) {
        const results = await resp.json();
        if (Array.isArray(results) && results.length > 0) {
          return {
            lat: Number(results[0].lat),
            lng: Number(results[0].lon),
            displayName: results[0].display_name,
            zoom: 14,
          };
        }
      }
    } catch (err: any) {
      console.warn("[MapsBrowser] Falha ao geocodificar localidade:", err.message);
    }

    return null;
  });

export const identificarEmpresaPorCoordenada_ServerFn = createServerFn({ method: "POST" })
  .validator((data: { lat: number; lng: number }) => data)
  .handler(async ({ data }): Promise<MapPlaceResult | null> => {
    const lat = Number(data.lat);
    const lng = Number(data.lng);
    if (!lat || !lng) return null;

    // 1. Consulta empresas já no CRM para ver se o clique foi próximo a alguma empresa cadastrada
    const crmState = await getDbState().catch(() => null);
    const crmEmpresas = crmState?.empresas || [];

    // 2. Tenta SerpApi Google Maps na coordenada exata
    const apiKey = getSerpApiKey();
    if (apiKey && apiKey.length > 20) {
      try {
        const serpUrl = new URL("https://serpapi.com/search.json");
        serpUrl.searchParams.set("engine", "google_maps");
        serpUrl.searchParams.set("q", "estabelecimentos");
        serpUrl.searchParams.set("ll", `@${lat.toFixed(6)},${lng.toFixed(6)},18z`);
        serpUrl.searchParams.set("api_key", apiKey);
        serpUrl.searchParams.set("hl", "pt-br");
        serpUrl.searchParams.set("gl", "br");

        const resp = await fetch(serpUrl.toString(), {
          headers: { "User-Agent": "LocomotivaCRM/1.0" },
        });

        if (resp.ok) {
          const json = await resp.json();
          const results = Array.isArray(json.local_results) ? json.local_results : [];
          if (results.length > 0) {
            const item = results[0];
            const title = String(item.title || "").trim();
            const rawAddr = String(item.address || "").trim();
            const phone = item.phone ? String(item.phone).trim() : undefined;
            const website = item.website ? String(item.website).trim() : undefined;
            const category = item.type ? String(item.type).trim() : undefined;
            const gpsLat = Number(item.gps_coordinates?.latitude) || lat;
            const gpsLng = Number(item.gps_coordinates?.longitude) || lng;

            let cidade = "Serra Gaúcha";
            for (const c of Object.keys(CIDADES_RS_COORDENADAS)) {
              if (rawAddr.toLowerCase().includes(c.toLowerCase())) {
                cidade = c;
                break;
              }
            }

            const normTitle = normalizeText(title);
            const empCrm = crmEmpresas.find(
              (e) =>
                normalizeText(e.nome) === normTitle ||
                (phone && e.telefone && cleanDigits(e.telefone).slice(-8) === cleanDigits(phone).slice(-8))
            );

            const placeId = item.place_id || `place_${gpsLat.toFixed(4)}_${gpsLng.toFixed(4)}`;
            const googleMapsUri =
              item.link ||
              (item.place_id ? `https://www.google.com/maps/place/?q=place_id:${item.place_id}` : undefined) ||
              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${title} ${rawAddr}`)}`;

            return {
              id: placeId,
              title,
              category,
              segmentoSugerido: category || "Comércio & Serviços",
              address: rawAddr || `${title}, ${cidade}`,
              cidade,
              phone,
              website,
              rating: typeof item.rating === "number" ? item.rating : undefined,
              reviews: typeof item.reviews === "number" ? item.reviews : undefined,
              placeId: item.place_id,
              latitude: gpsLat,
              longitude: gpsLng,
              thumbnail: item.thumbnail,
              googleMapsUri,
              source: "serpapi",
              jaNoCrm: Boolean(empCrm),
              crmId: empCrm?.id,
              crmStage: empCrm?.crmStage,
              crmScore: empCrm?.score,
            };
          }
        }
      } catch (err: any) {
        console.warn("[MapsBrowser] Erro ao identificar por coordenada via SerpApi:", err.message);
      }
    }

    // 3. Fallback: Reverse geocoding via Nominatim OpenStreetMap
    try {
      const nomUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
      const resp = await fetch(nomUrl, {
        headers: { "User-Agent": "LocomotivaCRM/1.0" },
      });
      if (resp.ok) {
        const data = await resp.json();
        const addr = data.address || {};
        const title =
          data.name ||
          addr.shop ||
          addr.amenity ||
          addr.commercial ||
          addr.industrial ||
          addr.road ||
          "Local no Google Maps";
        const cidade = addr.city || addr.town || addr.municipality || "Serra Gaúcha";
        const rawAddr = data.display_name || `${title}, ${cidade}`;

        const placeId = `osm_rev_${lat.toFixed(5)}_${lng.toFixed(5)}`;
        const googleMapsUri = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${title} ${rawAddr}`)}`;

        return {
          id: placeId,
          title,
          category: addr.shop || addr.amenity || "Comércio Local",
          segmentoSugerido: addr.shop || addr.amenity || "Comércio & Serviços",
          address: rawAddr,
          cidade,
          bairro: addr.suburb || addr.neighbourhood,
          latitude: lat,
          longitude: lng,
          googleMapsUri,
          source: "osm",
          jaNoCrm: false,
        };
      }
    } catch (osmErr: any) {
      console.warn("[MapsBrowser] Erro ao fazer reverse geocoding via OSM:", osmErr.message);
    }

    return null;
  });
