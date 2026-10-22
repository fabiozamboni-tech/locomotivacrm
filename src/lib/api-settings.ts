import { DEFAULT_COTAS_DIARIAS, type CotasDiariasConfig } from "./ai-quota-guard";

export interface ApiConfig {
  key: string;
  enabled: boolean;
  model?: string;
  baseUrl?: string;
  clientId?: string;
  clientSecret?: string;
  webhookUrl?: string;
}

export type ProvedorIaTipo =
  | "auto"
  | "openai"
  | "anthropic"
  | "perplexity"
  | "gemini"
  | "groq"
  | "cerebras"
  | "openrouter"
  | "lovable"
  | "ollama";

export type ApiProviderKey =
  | "serpapi"
  | "apify"
  | "lovable"
  | "apollo"
  | "groq"
  | "gemini"
  | "openrouter"
  | "cerebras"
  | "ollama"
  | "openai"
  | "anthropic"
  | "perplexity"
  | "recraft"
  | "fal"
  | "firefly"
  | "manus";

export interface ApiSettingsMap {
  serpapi: ApiConfig;
  apify: ApiConfig;
  lovable: ApiConfig;
  apollo: ApiConfig;
  // Provedores de IA Gratuitos (awesome-free-llm-apis)
  groq: ApiConfig;
  gemini: ApiConfig;
  openrouter: ApiConfig;
  cerebras: ApiConfig;
  ollama: ApiConfig;
  // Novos Provedores Premium (BYOK - Bring Your Own Key)
  openai: ApiConfig;
  anthropic: ApiConfig;
  perplexity: ApiConfig;
  recraft: ApiConfig;
  fal: ApiConfig;
  firefly: ApiConfig;
  manus: ApiConfig;
  // Roteamento e Cotas
  provedorIaAtivo: ProvedorIaTipo;
  cotasDiarias: CotasDiariasConfig;
  github?: {
    token: string;
    defaultOwner?: string;
  };
}

const STORAGE_KEY = "locomotiva_api_keys_v3";
const PREV_STORAGE_KEY = "locomotiva_api_keys_v2";
const LEGACY_STORAGE_KEY = "locomotiva_api_keys_v1";

export const DEFAULT_SETTINGS: ApiSettingsMap = {
  serpapi: {
    key: "ec62da1cce88a0223fee434841dbaceef4b27c63b8825d53de8d25090ccdbe02",
    enabled: true,
  },
  apify: {
    key: "",
    enabled: true,
  },
  lovable: {
    key: "",
    enabled: false,
  },
  apollo: {
    key: "",
    enabled: false,
  },
  // Provedores de IA Gratuitos
  groq: {
    key: "",
    enabled: true,
    model: "llama-3.1-8b-instant",
  },
  gemini: {
    key: "",
    enabled: true,
    model: "gemini-1.5-flash",
  },
  openrouter: {
    key: "",
    enabled: true,
    model: "openrouter/free",
  },
  cerebras: {
    key: "",
    enabled: true,
    model: "llama-3.3-70b",
  },
  ollama: {
    key: "",
    enabled: false,
    baseUrl: "http://localhost:11434/v1",
    model: "llama3.3",
  },
  // Provedores Pagos / BYOK
  openai: {
    key: "",
    enabled: false,
    model: "gpt-4o",
  },
  anthropic: {
    key: "",
    enabled: false,
    model: "claude-3-5-sonnet-20241022",
  },
  perplexity: {
    key: "",
    enabled: false,
    model: "sonar",
  },
  recraft: {
    key: "",
    enabled: false,
    model: "recraftv4_1_vector",
  },
  fal: {
    key: "",
    enabled: false,
    model: "fal-ai/flux/dev",
  },
  firefly: {
    key: "",
    enabled: false,
    clientId: "",
    clientSecret: "",
  },
  manus: {
    key: "",
    enabled: false,
    webhookUrl: "",
  },
  provedorIaAtivo: "auto",
  cotasDiarias: DEFAULT_COTAS_DIARIAS,
  github: {
    token: "",
    defaultOwner: "",
  },
};

export function getApiSettings(): ApiSettingsMap {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem(PREV_STORAGE_KEY) ||
      localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);

    // Migração de modelos depreciados/decommissioned para versões ativas
    const groqModel =
      !parsed.groq?.model ||
      parsed.groq.model === "llama3-8b-8192" ||
      parsed.groq.model === "llama-3.3-70b-versatile" ||
      parsed.groq.model === "mixtral-8x7b-32768" ||
      parsed.groq.model.includes("8192")
        ? "llama-3.1-8b-instant"
        : parsed.groq.model;

    const geminiModel =
      !parsed.gemini?.model ||
      parsed.gemini.model === "gemini-2.0-flash" ||
      parsed.gemini.model === "gemini-3.8-flash"
        ? "gemini-1.5-flash"
        : parsed.gemini.model;

    const openrouterModel =
      !parsed.openrouter?.model ||
      parsed.openrouter.model === "meta-llama/llama-3.3-70b-instruct:free"
        ? "openrouter/free"
        : parsed.openrouter.model;

    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      serpapi: {
        ...DEFAULT_SETTINGS.serpapi,
        ...(parsed.serpapi || {}),
        key: parsed.serpapi?.key || DEFAULT_SETTINGS.serpapi.key,
      },
      groq: {
        ...DEFAULT_SETTINGS.groq,
        ...(parsed.groq || {}),
        model: groqModel,
      },
      gemini: {
        ...DEFAULT_SETTINGS.gemini,
        ...(parsed.gemini || {}),
        model: geminiModel,
      },
      openrouter: {
        ...DEFAULT_SETTINGS.openrouter,
        ...(parsed.openrouter || {}),
        model: openrouterModel,
      },
      cerebras: {
        ...DEFAULT_SETTINGS.cerebras,
        ...(parsed.cerebras || {}),
      },
      ollama: {
        ...DEFAULT_SETTINGS.ollama,
        ...(parsed.ollama || {}),
      },
      openai: {
        ...DEFAULT_SETTINGS.openai,
        ...(parsed.openai || {}),
      },
      anthropic: {
        ...DEFAULT_SETTINGS.anthropic,
        ...(parsed.anthropic || {}),
      },
      perplexity: {
        ...DEFAULT_SETTINGS.perplexity,
        ...(parsed.perplexity || {}),
      },
      recraft: {
        ...DEFAULT_SETTINGS.recraft,
        ...(parsed.recraft || {}),
      },
      fal: {
        ...DEFAULT_SETTINGS.fal,
        ...(parsed.fal || {}),
      },
      firefly: {
        ...DEFAULT_SETTINGS.firefly,
        ...(parsed.firefly || {}),
      },
      manus: {
        ...DEFAULT_SETTINGS.manus,
        ...(parsed.manus || {}),
      },
      cotasDiarias: {
        ...DEFAULT_SETTINGS.cotasDiarias,
        ...(parsed.cotasDiarias || {}),
        limitesPorProvedor: {
          ...DEFAULT_SETTINGS.cotasDiarias.limitesPorProvedor,
          ...(parsed.cotasDiarias?.limitesPorProvedor || {}),
        },
      },
      github: {
        token: parsed.github?.token || DEFAULT_SETTINGS.github?.token || "",
        defaultOwner: parsed.github?.defaultOwner || DEFAULT_SETTINGS.github?.defaultOwner || "fabiozamboni-tech",
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveGithubConfig(config: { token?: string; defaultOwner?: string }): ApiSettingsMap {
  const current = getApiSettings();
  const updated: ApiSettingsMap = {
    ...current,
    github: {
      token: config.token ?? current.github?.token ?? "",
      defaultOwner: config.defaultOwner ?? current.github?.defaultOwner ?? "fabiozamboni-tech",
    },
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error("Erro ao salvar configuracao do GitHub no localStorage:", err);
    }
  }

  return updated;
}

export function saveApiSetting(
  provider: keyof Omit<ApiSettingsMap, "provedorIaAtivo" | "cotasDiarias" | "github">,
  config: Partial<ApiConfig>,
): ApiSettingsMap {
  const current = getApiSettings();
  const updated: ApiSettingsMap = {
    ...current,
    [provider]: {
      ...current[provider],
      ...config,
    },
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error("Erro ao salvar chave de API no localStorage:", err);
    }
  }

  return updated;
}

export function saveProvedorIaAtivo(provedor: ProvedorIaTipo): ApiSettingsMap {
  const current = getApiSettings();
  const updated: ApiSettingsMap = {
    ...current,
    provedorIaAtivo: provedor,
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error("Erro ao salvar provedor IA ativo:", err);
    }
  }

  return updated;
}

export function saveCotasDiarias(novasCotas: Partial<CotasDiariasConfig>): ApiSettingsMap {
  const current = getApiSettings();
  const updated: ApiSettingsMap = {
    ...current,
    cotasDiarias: {
      ...current.cotasDiarias,
      ...novasCotas,
      limitesPorProvedor: {
        ...current.cotasDiarias.limitesPorProvedor,
        ...(novasCotas.limitesPorProvedor || {}),
      },
    },
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error("Erro ao salvar cotas diárias no localStorage:", err);
    }
  }

  return updated;
}
