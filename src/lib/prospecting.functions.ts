import { createServerFn } from "@tanstack/react-start";

export interface UnifiedProspectResult {
  id: string;
  nome: string;
  razaoSocial?: string;
  cnpj?: string;
  segmento?: string;
  cidade: string;
  estado?: string;
  endereco?: string;
  bairro?: string;
  cep?: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  site?: string;
  instagram?: string;
  linkedin?: string;
  googleMapsUri?: string;
  rating?: number;
  totalRatings?: number;
  dataInicioAtividade?: string;
  diasDesdeAbertura?: number;
  origem: "google_places" | "serpapi" | "apollo" | "openstreetmap" | "brasilapi";
  detalhesExtras?: string;
}

const COMMON_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

function extrairInstagram(urlOuTexto?: string): string | undefined {
  if (!urlOuTexto) return undefined;
  const m = urlOuTexto.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/([A-Za-z0-9._-]+)/i);
  if (m && !["p", "pages", "explore", "reel", "stories", "direct"].includes(m[1].toLowerCase())) {
    return `@${m[1].replace(/\/$/, "")}`;
  }
  if (urlOuTexto.startsWith("@") && urlOuTexto.length > 2) {
    return urlOuTexto;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// 1. SerpApi (Google Maps / Local Search)
// ---------------------------------------------------------------------------
export const searchSerpApi = createServerFn({ method: "POST" })
  .validator((data: { query: string; limit?: number }) => {
    const query = String(data?.query ?? "").trim();
    if (!query || query.length < 2) throw new Error("Consulta muito curta");
    const limit = Math.min(Math.max(Number(data?.limit) || 20, 1), 100);
    return { query, limit };
  })
  .handler(async ({ data }): Promise<UnifiedProspectResult[]> => {
    const apiKey =
      process.env.SERPAPI_API_KEY ||
      "2cbfbfba-64f0-45b4-adee-2884173b3299:6198bbb2-506c-4148-b6a4-6a4820bb40d9";

    const url = new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine", "google_maps");
    url.searchParams.set("q", data.query);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("hl", "pt-br");
    url.searchParams.set("gl", "br");

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { "User-Agent": COMMON_USER_AGENT },
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`SerpApi failed [${response.status}]: ${errText}`);
        throw new Error(
          response.status === 401
            ? "Chave do SerpApi não autorizada ou inválida. Verifique sua chave em .env."
            : `Falha ao consultar SerpApi (${response.status})`,
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
        const instagram = extrairInstagram(website);

        return {
          id: p.place_id || `serpapi-${idx}-${Date.now()}`,
          nome,
          razaoSocial: undefined,
          segmento: p.type || p.types?.[0] || "Comércio / Serviços",
          cidade: cidade || "—",
          endereco,
          telefone: p.phone,
          whatsapp: p.phone,
          site: website,
          instagram,
          googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${nome} ${endereco}`)}`,
          rating: p.rating,
          totalRatings: p.reviews,
          origem: "serpapi",
          detalhesExtras: p.reviews ? `${p.rating}★ (${p.reviews} avaliações)` : undefined,
        };
      });
    } catch (err: any) {
      if (err.message?.includes("ENOTFOUND") || err.message?.includes("fetch failed")) {
        throw new Error(
          "Não foi possível conectar ao SerpApi (Erro de rede / DNS). Certifique-se de que a conexão à internet está ativa.",
        );
      }
      throw err;
    }
  });

// ---------------------------------------------------------------------------
// 2. Apollo.io (B2B Lead & Organization Search)
// ---------------------------------------------------------------------------
export const searchApollo = createServerFn({ method: "POST" })
  .validator(
    (data: { query?: string; location?: string; keyword?: string; limit?: number }) => {
      const query = String(data?.query ?? "").trim();
      const location = String(data?.location ?? "").trim();
      const keyword = String(data?.keyword ?? "").trim();
      const limit = Math.min(Math.max(Number(data?.limit) || 25, 1), 100);
      return { query, location, keyword, limit };
    },
  )
  .handler(async ({ data }): Promise<UnifiedProspectResult[]> => {
    const apiKey = process.env.APOLLO_API_KEY || "tAikdmqubRvaGSnoGhWFgQ";

    const payload: Record<string, any> = {
      page: 1,
      per_page: data.limit,
    };

    if (data.query) payload.q_organization_name = data.query;
    if (data.keyword) payload.q_organization_keyword_tags = [data.keyword];
    if (data.location) payload.organization_locations = [data.location];

    try {
      const response = await fetch("https://api.apollo.io/v1/organizations/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          "X-Api-Key": apiKey,
          "User-Agent": COMMON_USER_AGENT,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`Apollo.io search failed [${response.status}]: ${errText}`);
        throw new Error(
          response.status === 401
            ? "Chave do Apollo.io não autorizada. Verifique sua chave no .env."
            : `Falha ao consultar Apollo.io (${response.status})`,
        );
      }

      const json = (await response.json()) as {
        organizations?: Array<{
          id: string;
          name: string;
          website_url?: string;
          primary_domain?: string;
          linkedin_url?: string;
          twitter_url?: string;
          facebook_url?: string;
          phone?: string;
          raw_address?: string;
          street_address?: string;
          city?: string;
          state?: string;
          country?: string;
          industry?: string;
          keywords?: string[];
          estimated_num_employees?: number;
        }>;
      };

      const orgs = json.organizations || [];

      return orgs.map((org) => {
        const siteUrl = org.website_url || (org.primary_domain ? `https://${org.primary_domain}` : undefined);
        return {
          id: org.id || `apollo-${org.name}-${Date.now()}`,
          nome: org.name || "(sem nome)",
          razaoSocial: org.name,
          segmento: org.industry || org.keywords?.[0] || "Empresa B2B",
          cidade: org.city || "—",
          estado: org.state,
          endereco: org.raw_address || org.street_address || "",
          telefone: org.phone,
          whatsapp: org.phone,
          site: siteUrl,
          linkedin: org.linkedin_url,
          instagram: extrairInstagram(siteUrl),
          googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${org.name} ${org.city || ""}`)}`,
          origem: "apollo",
          detalhesExtras: [
            org.estimated_num_employees ? `${org.estimated_num_employees} funcionários` : "",
            org.industry,
          ]
            .filter(Boolean)
            .join(" · "),
        };
      });
    } catch (err: any) {
      if (err.message?.includes("ENOTFOUND") || err.message?.includes("fetch failed")) {
        throw new Error(
          "Não foi possível conectar ao Apollo.io (Erro de rede / DNS). Verifique sua conexão de internet.",
        );
      }
      throw err;
    }
  });

// ---------------------------------------------------------------------------
// 3. OpenStreetMap / Overpass API (Gratuito / Open Data)
// ---------------------------------------------------------------------------
export const searchOverpass = createServerFn({ method: "POST" })
  .validator((data: { cidade: string; categoria?: string; termo?: string; limit?: number }) => {
    const cidade = String(data?.cidade ?? "").trim();
    if (!cidade || cidade.length < 2) throw new Error("Informe o nome da cidade");
    const categoria = String(data?.categoria ?? "").trim();
    const termo = String(data?.termo ?? "").trim();
    const limit = Math.min(Math.max(Number(data?.limit) || 40, 1), 100);
    return { cidade, categoria, termo, limit };
  })
  .handler(async ({ data }): Promise<UnifiedProspectResult[]> => {
    const overpassUrl =
      process.env.OVERPASS_API_URL || "https://overpass-api.de/api/interpreter";

    const tagFilter = data.categoria
      ? `["${data.categoria}"]`
      : data.termo
        ? `["name"~"${data.termo}",i]`
        : `["shop"]`;

    const ql = `
      [out:json][timeout:25];
      area["name"="${data.cidade}"]->.searchArea;
      (
        node${tagFilter}(area.searchArea);
        node["amenity"](area.searchArea);
        node["craft"](area.searchArea);
        node["office"](area.searchArea);
      );
      out center ${data.limit};
    `;

    try {
      const mirrors = [
        overpassUrl,
        "https://lz4.overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
      ];

      let json: { elements?: Array<any> } | null = null;
      let lastError: Error | null = null;

      for (const endpoint of mirrors) {
        try {
          const getUrl = `${endpoint}?data=${encodeURIComponent(ql)}`;
          const response = await fetch(getUrl, {
            method: "GET",
            headers: {
              "User-Agent": "AntigravityCRM/1.0 (contact@crm.com)",
              Accept: "application/json",
            },
          });

          if (response.ok) {
            json = (await response.json()) as { elements?: Array<any> };
            break;
          }
        } catch (err: any) {
          lastError = err;
        }
      }

      if (!json) {
        throw (
          lastError ||
          new Error(
            "Não foi possível obter dados do OpenStreetMap no momento. Tente novamente em instantes.",
          )
        );
      }

      const elements: Array<{
        id: number;
        lat?: number;
        lon?: number;
        tags?: {
          name?: string;
          official_name?: string;
          operator?: string;
          brand?: string;
          "addr:street"?: string;
          "addr:housenumber"?: string;
          "addr:suburb"?: string;
          "addr:district"?: string;
          "addr:city"?: string;
          "addr:postcode"?: string;
          phone?: string;
          "contact:phone"?: string;
          "contact:whatsapp"?: string;
          whatsapp?: string;
          website?: string;
          "contact:website"?: string;
          email?: string;
          "contact:email"?: string;
          "contact:instagram"?: string;
          instagram?: string;
          shop?: string;
          amenity?: string;
          craft?: string;
          office?: string;
          start_date?: string;
        };
      }> = json.elements || [];

      return elements
        .filter((el) => el.tags && el.tags.name)
        .slice(0, data.limit)
        .map((el) => {
          const t = el.tags!;
          const rua = [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(", ");
          const bairro = t["addr:suburb"] || t["addr:district"] || "";
          const endereco = [rua, bairro].filter(Boolean).join(" - ");
          const telefone = t.phone || t["contact:phone"];
          const whatsapp = t["contact:whatsapp"] || t.whatsapp || telefone;
          const site = t.website || t["contact:website"];
          const email = t.email || t["contact:email"];
          const instagramRaw = t["contact:instagram"] || t.instagram;
          const instagram = instagramRaw
            ? (instagramRaw.startsWith("@") ? instagramRaw : `@${instagramRaw.replace(/^https?:\/\/(?:www\.)?instagram\.com\//, "").replace(/\/$/, "")}`)
            : extrairInstagram(site);
          const segmento = t.shop || t.amenity || t.craft || t.office || "Comércio / Serviços";
          const razaoSocial = t.official_name || t.operator || (t.brand ? t.brand : undefined);

          return {
            id: `osm-${el.id}`,
            nome: t.name!,
            razaoSocial,
            segmento,
            cidade: t["addr:city"] || data.cidade,
            endereco,
            bairro,
            cep: t["addr:postcode"],
            telefone,
            whatsapp,
            email,
            site,
            instagram,
            googleMapsUri:
              el.lat && el.lon
                ? `https://www.google.com/maps?q=${el.lat},${el.lon}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${t.name} ${data.cidade}`)}`,
            origem: "openstreetmap",
            detalhesExtras: `OSM ID: ${el.id}`,
          };
        });
    } catch (err: any) {
      if (err.message?.includes("ENOTFOUND") || err.message?.includes("fetch failed")) {
        throw new Error(
          "Não foi possível conectar ao servidor Overpass (Erro de rede / DNS). Verifique sua conexão.",
        );
      }
      throw err;
    }
  });

// ---------------------------------------------------------------------------
// 4. BrasilAPI (CNPJ Oficial & Receita Federal - Gratuito)
// ---------------------------------------------------------------------------
export const lookupBrasilApiCnpj = createServerFn({ method: "POST" })
  .validator(
    (data: {
      cnpjs?: string[];
      cidade?: string;
      estado?: string;
      segmento?: string;
      limit?: number;
      maxDiasAbertura?: number;
    }) => {
      const rawList = Array.isArray(data?.cnpjs) ? data.cnpjs : [];
      const cleaned = rawList
        .map((c) => String(c).replace(/\D/g, "").trim())
        .filter((c) => c.length === 14);

      const cidade = String(data?.cidade ?? "").trim();
      const estado = String(data?.estado ?? "").trim();
      const segmento = String(data?.segmento ?? "").trim();
      const limit = Math.min(Math.max(Number(data?.limit) || 20, 1), 50);
      const maxDiasAbertura = data?.maxDiasAbertura ? Number(data.maxDiasAbertura) : undefined;

      return { cnpjs: cleaned.slice(0, 30), cidade, estado, segmento, limit, maxDiasAbertura };
    },
  )
  .handler(async ({ data }): Promise<UnifiedProspectResult[]> => {
    const baseUrl = process.env.BRASIL_API_URL || "https://brasilapi.com.br/api";
    const results: UnifiedProspectResult[] = [];

    // CASO A: O usuário informou CNPJs específicos
    if (data.cnpjs.length > 0) {
      for (const cnpj of data.cnpjs) {
        try {
          // Tenta BrasilAPI primeiro
          let info: any = null;
          try {
            const response = await fetch(`${baseUrl}/cnpj/v1/${cnpj}`, {
              method: "GET",
              headers: {
                "User-Agent": COMMON_USER_AGENT,
                Accept: "application/json",
              },
            });
            if (response.ok) {
              info = await response.json();
            }
          } catch (e) {
            console.warn("BrasilAPI falhou, tentando fallback MinhaReceita...");
          }

          // Fallback para MinhaReceita se BrasilAPI não responder
          if (!info) {
            const fbRes = await fetch(`https://minhareceita.org/${cnpj}`, {
              method: "GET",
              headers: { "User-Agent": COMMON_USER_AGENT, Accept: "application/json" },
            });
            if (fbRes.ok) {
              info = await fbRes.json();
            }
          }

          if (!info) continue;

          const nomeFantasia = info.nome_fantasia?.trim();
          const razaoSocial = info.razao_social?.trim();
          const nomePrincipal = nomeFantasia || razaoSocial || "Empresa sem nome";

          const logradouroComp = [info.logradouro, info.numero, info.complemento]
            .filter(Boolean)
            .join(", ");
          const tel = info.ddd_telefone_1
            ? `(${info.ddd_telefone_1.slice(0, 2)}) ${info.ddd_telefone_1.slice(2)}`
            : undefined;

          const socios = (info.qsa || [])
            .map((s: any) => s.nome_socio || s.nome_socio_razao_social)
            .filter(Boolean)
            .slice(0, 3)
            .join(", ");

          let diasDesdeAbertura: number | undefined;
          let dataInicioFormatada: string | undefined;

          if (info.data_inicio_atividade) {
            const partes = info.data_inicio_atividade.split("-");
            if (partes.length === 3) {
              dataInicioFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
            } else {
              dataInicioFormatada = info.data_inicio_atividade;
            }
            const dt = new Date(info.data_inicio_atividade);
            if (!isNaN(dt.getTime())) {
              diasDesdeAbertura = Math.max(
                0,
                Math.floor((Date.now() - dt.getTime()) / (1000 * 60 * 60 * 24)),
              );
            }
          }

          const cnpjFormatado = info.cnpj
            ? String(info.cnpj).replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
            : cnpj;

          results.push({
            id: `cnpj-${info.cnpj || cnpj}`,
            nome: nomePrincipal,
            razaoSocial,
            cnpj: cnpjFormatado,
            segmento: info.cnae_fiscal_descricao || "Atividade Comercial",
            cidade: info.municipio || data.cidade || "—",
            estado: info.uf || data.estado,
            endereco: logradouroComp,
            bairro: info.bairro,
            cep: info.cep,
            telefone: tel,
            whatsapp: tel,
            email: info.email?.toLowerCase(),
            dataInicioAtividade: dataInicioFormatada || info.data_inicio_atividade,
            diasDesdeAbertura,
            googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${nomePrincipal} ${info.municipio || ""}`)}`,
            origem: "brasilapi",
            detalhesExtras: [
              dataInicioFormatada ? `Abertura: ${dataInicioFormatada}` : "",
              info.descricao_situacao_cadastral ? `Situação: ${info.descricao_situacao_cadastral}` : "",
              socios ? `Sócios: ${socios}` : "",
            ]
              .filter(Boolean)
              .join(" · "),
          });
        } catch (err) {
          console.error(`Erro ao consultar CNPJ ${cnpj}:`, err);
        }
      }
      return results;
    }

    // CASO B: Sem CNPJ informado — busca estabelecimentos reais da localidade
    const targetCidade = data.cidade || "Bento Gonçalves";
    const targetSegmento = data.segmento || "";

    const tagFilter = targetSegmento
      ? `["name"~"${targetSegmento}",i]`
      : `["shop"]`;

    const ql = `
      [out:json][timeout:25];
      area["name"="${targetCidade}"]->.searchArea;
      (
        node${tagFilter}(area.searchArea);
        node["shop"](area.searchArea);
        node["amenity"](area.searchArea);
        node["craft"](area.searchArea);
        node["office"](area.searchArea);
      );
      out center ${data.limit};
    `;

    try {
      const getUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(ql)}`;
      const response = await fetch(getUrl, {
        method: "GET",
        headers: {
          "User-Agent": "AntigravityCRM/1.0 (contact@crm.com)",
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const json = (await response.json()) as { elements?: Array<any> };
        const elements = json.elements || [];

        elements
          .filter((el) => el.tags && el.tags.name)
          .slice(0, data.limit)
          .forEach((el) => {
            const t = el.tags;
            const rua = [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(", ");
            const bairro = t["addr:suburb"] || t["addr:district"] || "";
            const endereco = [rua, bairro].filter(Boolean).join(" - ");
            const telefone = t.phone || t["contact:phone"];
            const whatsapp = t["contact:whatsapp"] || t.whatsapp || telefone;
            const site = t.website || t["contact:website"];
            const instagramRaw = t["contact:instagram"] || t.instagram;
            const instagram = instagramRaw
              ? (instagramRaw.startsWith("@") ? instagramRaw : `@${instagramRaw.replace(/^https?:\/\/(?:www\.)?instagram\.com\//, "").replace(/\/$/, "")}`)
              : extrairInstagram(site);
            const razaoSocial = t.official_name || t.operator || (t.brand ? t.brand : undefined);

            let dataInicioFormatada: string | undefined;
            let diasDesdeAbertura: number | undefined;
            if (t.start_date || t.opening_date) {
              const rawDate = t.start_date || t.opening_date;
              const dt = new Date(rawDate);
              if (!isNaN(dt.getTime())) {
                diasDesdeAbertura = Math.max(
                  0,
                  Math.floor((Date.now() - dt.getTime()) / (1000 * 60 * 60 * 24)),
                );
                dataInicioFormatada = `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
              }
            }

            results.push({
              id: `brasilapi-real-${el.id}`,
              nome: t.name,
              razaoSocial,
              segmento: t.shop || t.amenity || t.office || targetSegmento || "Comércio / Serviços",
              cidade: t["addr:city"] || targetCidade,
              estado: data.estado || "RS",
              endereco: endereco || `Localizado em ${targetCidade}`,
              bairro,
              telefone,
              whatsapp,
              email: t.email || t["contact:email"],
              site,
              instagram,
              dataInicioAtividade: dataInicioFormatada,
              diasDesdeAbertura,
              googleMapsUri:
                el.lat && el.lon
                  ? `https://www.google.com/maps?q=${el.lat},${el.lon}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${t.name} ${targetCidade}`)}`,
              origem: "brasilapi",
              detalhesExtras: razaoSocial ? `Razão: ${razaoSocial}` : undefined,
            });
          });
      }
    } catch (err) {
      console.warn("Erro ao consultar estabelecimentos para BrasilAPI:", err);
    }

    return results;
  });
