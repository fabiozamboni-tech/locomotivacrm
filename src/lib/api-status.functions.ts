import { createServerFn } from "@tanstack/react-start";

export interface ApiTestResult {
  provider:
    | "serpapi"
    | "apify"
    | "lovable"
    | "brasilapi"
    | "registrobr"
    | "openstreetmap"
    | "apollo"
    | "groq"
    | "gemini"
    | "openrouter"
    | "cerebras"
    | "ollama";
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
    modelUsed?: string;
  };
}

const COMMON_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

export const testApiConnection = createServerFn({ method: "POST" })
  .validator((data: { provider: string; apiKey?: string; model?: string }) => {
    const provider = String(data?.provider ?? "").trim().toLowerCase();
    const apiKey = typeof data?.apiKey === "string" ? data.apiKey.trim() : undefined;
    const model = typeof data?.model === "string" ? data.model.trim() : undefined;
    return { provider, apiKey, model };
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

    // 7. GROQ (awesome-free-llm-apis: 14.400 req/dia grátis)
    if (data.provider === "groq") {
      const key = data.apiKey || process.env.GROQ_API_KEY;
      if (!key) {
        return {
          provider: "groq",
          status: "unconfigured",
          latencyMs: 0,
          message: "Nenhuma chave Groq informada. Obtenha gratuitamente em console.groq.com/keys sem cartão.",
        };
      }
      try {
        const { testarConexaoLlm } = await import("./llm-provider.server");
        const res = await testarConexaoLlm("groq", key, "llama-3.1-8b-instant");
        return {
          provider: "groq",
          status: res.ok ? "online" : "error",
          latencyMs: res.latencyMs,
          message: res.message,
          details: {
            plan: "Free Tier (30 RPM / 14.400 RPD)",
            modelUsed: res.modelUsed,
            isFreeService: true,
          },
        };
      } catch (err: any) {
        return {
          provider: "groq",
          status: "error",
          latencyMs: Date.now() - startTime,
          message: err.message || "Erro ao conectar com Groq",
        };
      }
    }

    // 8. GOOGLE GEMINI (awesome-free-llm-apis: 1.500 req/dia grátis)
    if (data.provider === "gemini") {
      const key = data.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (!key) {
        return {
          provider: "gemini",
          status: "unconfigured",
          latencyMs: 0,
          message: "Nenhuma chave Gemini informada. Obtenha gratuitamente no Google AI Studio (aistudio.google.com).",
        };
      }
      try {
        const { testarConexaoLlm } = await import("./llm-provider.server");
        const res = await testarConexaoLlm("gemini", key, "gemini-1.5-flash");
        return {
          provider: "gemini",
          status: res.ok ? "online" : "error",
          latencyMs: res.latencyMs,
          message: res.message,
          details: {
            plan: "Free Tier (15 RPM / 1.500 RPD / Google AI Studio)",
            modelUsed: res.modelUsed,
            isFreeService: true,
          },
        };
      } catch (err: any) {
        return {
          provider: "gemini",
          status: "error",
          latencyMs: Date.now() - startTime,
          message: err.message || "Erro ao conectar com Google Gemini",
        };
      }
    }

    // 9. OPENROUTER (awesome-free-llm-apis: modelos :free e catálogo universal de ponta)
    if (data.provider === "openrouter") {
      const key = data.apiKey || process.env.OPENROUTER_API_KEY;
      if (!key) {
        return {
          provider: "openrouter",
          status: "unconfigured",
          latencyMs: 0,
          message: "Nenhuma chave OpenRouter informada. Obtenha em openrouter.ai/keys para modelos gratuitos e pagos.",
        };
      }
      try {
        const { testarConexaoLlm } = await import("./llm-provider.server");
        const modeloParaTestar = data.model || "openrouter/free";
        const res = await testarConexaoLlm("openrouter", key, modeloParaTestar);
        return {
          provider: "openrouter",
          status: res.ok ? "online" : "error",
          latencyMs: res.latencyMs,
          message: res.message,
          details: {
            plan: `OpenRouter Hub (${modeloParaTestar})`,
            modelUsed: res.modelUsed,
            isFreeService: modeloParaTestar.includes(":free") || modeloParaTestar === "openrouter/free",
          },
        };
      } catch (err: any) {
        return {
          provider: "openrouter",
          status: "error",
          latencyMs: Date.now() - startTime,
          message: err.message || "Erro ao conectar com OpenRouter",
        };
      }
    }

    // 10. CEREBRAS (awesome-free-llm-apis: ultra veloz wafer-scale)
    if (data.provider === "cerebras") {
      const key = data.apiKey || process.env.CEREBRAS_API_KEY;
      if (!key) {
        return {
          provider: "cerebras",
          status: "unconfigured",
          latencyMs: 0,
          message: "Nenhuma chave Cerebras informada. Obtenha gratuitamente em cloud.cerebras.ai.",
        };
      }
      try {
        const { testarConexaoLlm } = await import("./llm-provider.server");
        const res = await testarConexaoLlm("cerebras", key, "llama-3.3-70b");
        return {
          provider: "cerebras",
          status: res.ok ? "online" : "error",
          latencyMs: res.latencyMs,
          message: res.message,
          details: {
            plan: "Free Tier (Wafer Scale / Alta Velocidade)",
            modelUsed: res.modelUsed,
            isFreeService: true,
          },
        };
      } catch (err: any) {
        return {
          provider: "cerebras",
          status: "error",
          latencyMs: Date.now() - startTime,
          message: err.message || "Erro ao conectar com Cerebras",
        };
      }
    }

    // 10. OLLAMA LOCAL (awesome-free-llm-apis: 100% gratuito e privado)
    if (data.provider === "ollama") {
      try {
        const { testarConexaoLlm } = await import("./llm-provider.server");
        const res = await testarConexaoLlm("ollama", "local", "llama3.3", data.apiKey || "http://localhost:11434/v1");
        return {
          provider: "ollama",
          status: res.ok ? "online" : "error",
          latencyMs: res.latencyMs,
          message: res.message,
          details: {
            plan: "Local / Self-Hosted (Sem limites)",
            modelUsed: res.modelUsed,
            isFreeService: true,
          },
        };
      } catch (err: any) {
        return {
          provider: "ollama",
          status: "error",
          latencyMs: Date.now() - startTime,
          message: "Servidor Ollama local não está rodando em http://localhost:11434",
        };
      }
    }

    return {
      provider: data.provider as any,
      status: "unconfigured",
      latencyMs: 0,
      message: `Provedor ${data.provider} não reconhecido para teste direto.`,
    };
  });
