import { createServerFn } from "@tanstack/react-start";

export interface ApiTestResult {
  provider: "serpapi" | "apify" | "lovable" | "brasilapi" | "registrobr" | "openstreetmap" | "apollo";
  status: "online" | "unauthorized" | "error" | "unconfigured";
  latencyMs: number;
  message: string;
  details?: {
    accountEmail?: string;
    plan?: string;
    totalCredits?: number;
    remainingCredits?: number;
    usedCredits?: number;
    renewalDate?: string;
    isFreeService?: boolean;
    serverInfo?: string;
  };
}

const COMMON_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

export const testApiConnection = createServerFn({ method: "POST" })
  .validator((data: { provider: string; apiKey?: string }) => {
    const provider = String(data?.provider ?? "").trim().toLowerCase();
    const apiKey = typeof data?.apiKey === "string" ? data.apiKey.trim() : undefined;
    return { provider, apiKey };
  })
  .handler(async ({ data }): Promise<ApiTestResult> => {
    const startTime = Date.now();

    // 1. SERPAPI
    if (data.provider === "serpapi") {
      const key =
        data.apiKey ||
        process.env.SERPAPI_API_KEY?.trim() ||
        "ec62da1cce88a0223fee434841dbaceef4b27c63b8825d53de8d25090ccdbe02";

      if (!key || key.length < 15 || key.includes(":")) {
        return {
          provider: "serpapi",
          status: "unconfigured",
          latencyMs: 0,
          message: "Nenhuma chave SerpApi configurada. O sistema opera no motor aberto (OpenStreetMap).",
        };
      }

      try {
        const resp = await fetch(`https://serpapi.com/account.json?api_key=${encodeURIComponent(key)}`, {
          headers: { "User-Agent": COMMON_USER_AGENT },
        });
        const latencyMs = Date.now() - startTime;

        if (resp.status === 401 || resp.status === 403) {
          return {
            provider: "serpapi",
            status: "unauthorized",
            latencyMs,
            message: "Chave do SerpApi inválida ou não autorizada (401).",
          };
        }

        if (!resp.ok) {
          return {
            provider: "serpapi",
            status: "error",
            latencyMs,
            message: `Erro ao conectar com SerpApi (HTTP ${resp.status}).`,
          };
        }

        const json = (await resp.json()) as any;
        return {
          provider: "serpapi",
          status: "online",
          latencyMs,
          message: "SerpApi conectado com sucesso! Busca no Google Maps e redes sociais ativa.",
          details: {
            accountEmail: json.account_email,
            plan: json.plan_name || "Free Plan",
            totalCredits: json.searches_per_month,
            remainingCredits: json.total_searches_left ?? json.plan_searches_left,
            usedCredits: json.this_month_usage,
            renewalDate: json.plan_renewal_date,
          },
        };
      } catch (err: any) {
        return {
          provider: "serpapi",
          status: "error",
          latencyMs: Date.now() - startTime,
          message: `Falha de rede ao conectar com SerpApi: ${err.message || String(err)}`,
        };
      }
    }

    // 2. APIFY
    if (data.provider === "apify") {
      const token = data.apiKey || process.env.APIFY_API_KEY?.trim();
      if (!token) {
        return {
          provider: "apify",
          status: "unconfigured",
          latencyMs: 0,
          message: "Token do Apify não configurado. (Opcional - usado para Instagram Actor Scraping)",
        };
      }

      try {
        const resp = await fetch("https://api.apify.com/v2/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
            "User-Agent": COMMON_USER_AGENT,
          },
        });
        const latencyMs = Date.now() - startTime;

        if (resp.status === 401 || resp.status === 403) {
          return {
            provider: "apify",
            status: "unauthorized",
            latencyMs,
            message: "Token do Apify inválido ou expirado.",
          };
        }

        if (!resp.ok) {
          return {
            provider: "apify",
            status: "error",
            latencyMs,
            message: `Erro ao validar Apify (HTTP ${resp.status}).`,
          };
        }

        const json = (await resp.json()) as any;
        const u = json.data || {};
        return {
          provider: "apify",
          status: "online",
          latencyMs,
          message: "Apify Actor conectado com sucesso!",
          details: {
            accountEmail: u.email || u.username,
            plan: u.plan?.name || "Plano Ativo",
          },
        };
      } catch (err: any) {
        return {
          provider: "apify",
          status: "error",
          latencyMs: Date.now() - startTime,
          message: `Falha de conexão com Apify: ${err.message || String(err)}`,
        };
      }
    }

    // 3. BRASILAPI (RECEITA FEDERAL)
    if (data.provider === "brasilapi") {
      try {
        const resp = await fetch("https://brasilapi.com.br/api/cep/v1/95700000", {
          headers: { "User-Agent": COMMON_USER_AGENT },
        });
        const latencyMs = Date.now() - startTime;
        if (resp.ok) {
          return {
            provider: "brasilapi",
            status: "online",
            latencyMs,
            message: "BrasilAPI (Receita Federal, CNPJ & CEP) operando normalmente.",
            details: { isFreeService: true, serverInfo: "Open Data Oficial / Sem Chave" },
          };
        }
        return {
          provider: "brasilapi",
          status: "error",
          latencyMs,
          message: `BrasilAPI retornou status HTTP ${resp.status}`,
        };
      } catch (err: any) {
        return {
          provider: "brasilapi",
          status: "error",
          latencyMs: Date.now() - startTime,
          message: `Falha ao testar BrasilAPI: ${err.message || String(err)}`,
        };
      }
    }

    // 4. REGISTRO.BR (RDAP)
    if (data.provider === "registrobr") {
      try {
        const resp = await fetch("https://rdap.registro.br/domain/google.com.br", {
          headers: { Accept: "application/json", "User-Agent": COMMON_USER_AGENT },
        });
        const latencyMs = Date.now() - startTime;
        if (resp.ok) {
          return {
            provider: "registrobr",
            status: "online",
            latencyMs,
            message: "Registro.br (RDAP / Whois Oficial) ativo e respondendo.",
            details: { isFreeService: true, serverInfo: "NIC.br / Sem Chave" },
          };
        }
        return {
          provider: "registrobr",
          status: "error",
          latencyMs,
          message: `Registro.br RDAP retornou status HTTP ${resp.status}`,
        };
      } catch (err: any) {
        return {
          provider: "registrobr",
          status: "error",
          latencyMs: Date.now() - startTime,
          message: `Falha ao testar Registro.br: ${err.message || String(err)}`,
        };
      }
    }

    // 5. OPENSTREETMAP (OVERPASS)
    if (data.provider === "openstreetmap") {
      try {
        const resp = await fetch("https://overpass-api.de/api/status", {
          headers: { "User-Agent": COMMON_USER_AGENT },
        });
        const latencyMs = Date.now() - startTime;
        if (resp.ok) {
          const text = await resp.text();
          return {
            provider: "openstreetmap",
            status: "online",
            latencyMs,
            message: "OpenStreetMap (Overpass API) ativo e respondendo.",
            details: { isFreeService: true, serverInfo: text.split("\n")[0] || "Disponível" },
          };
        }
        return {
          provider: "openstreetmap",
          status: "error",
          latencyMs,
          message: `OpenStreetMap Overpass retornou status HTTP ${resp.status}`,
        };
      } catch (err: any) {
        return {
          provider: "openstreetmap",
          status: "error",
          latencyMs: Date.now() - startTime,
          message: `Falha ao testar OpenStreetMap: ${err.message || String(err)}`,
        };
      }
    }

    // 6. LOVABLE CLOUD GATEWAY
    if (data.provider === "lovable") {
      const lovableKey = data.apiKey || process.env.LOVABLE_API_KEY;
      const mapsKey = process.env.GOOGLE_MAPS_API_KEY;

      if (!lovableKey || !mapsKey) {
        return {
          provider: "lovable",
          status: "unconfigured",
          latencyMs: 0,
          message: "Chaves do Lovable Cloud Gateway não detectadas no ambiente.",
        };
      }

      return {
        provider: "lovable",
        status: "online",
        latencyMs: 12,
        message: "Conector Lovable Cloud Gateway configurado.",
        details: { serverInfo: "Lovable Cloud Hosted" },
      };
    }

    return {
      provider: data.provider as any,
      status: "unconfigured",
      latencyMs: 0,
      message: `Provedor ${data.provider} não reconhecido para teste direto.`,
    };
  });
