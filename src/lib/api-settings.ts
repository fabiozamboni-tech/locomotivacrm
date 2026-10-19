export interface ApiConfig {
  key: string;
  enabled: boolean;
  model?: string;
  baseUrl?: string;
}

export type ProvedorIaTipo = "auto" | "groq" | "gemini" | "openrouter" | "cerebras" | "lovable" | "ollama";

export type ApiProviderKey =
  | "serpapi"
  | "apify"
  | "lovable"
  | "apollo"
  | "groq"
  | "gemini"
  | "openrouter"
  | "cerebras"
  | "ollama";

export interface ApiSettingsMap {
  serpapi: ApiConfig;
  apify: ApiConfig;
  lovable: ApiConfig;
  apollo: ApiConfig;
  // Provedores gratuitos de LLM (awesome-free-llm-apis)
  groq: ApiConfig;
  gemini: ApiConfig;
  openrouter: ApiConfig;
  cerebras: ApiConfig;
  ollama: ApiConfig;
  provedorIaAtivo: ProvedorIaTipo;
}

const STORAGE_KEY = "locomotiva_api_keys_v2";
const LEGACY_STORAGE_KEY = "locomotiva_api_keys_v1";

const DEFAULT_SETTINGS: ApiSettingsMap = {
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
    model: "llama-3.3-70b-versatile",
  },
  gemini: {
    key: "",
    enabled: true,
    model: "gemini-2.0-flash",
  },
  openrouter: {
    key: "",
    enabled: true,
    model: "meta-llama/llama-3.3-70b-instruct:free",
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
  provedorIaAtivo: "auto",
};

export function getApiSettings(): ApiSettingsMap {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
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
      },
      gemini: {
        ...DEFAULT_SETTINGS.gemini,
        ...(parsed.gemini || {}),
      },
      openrouter: {
        ...DEFAULT_SETTINGS.openrouter,
        ...(parsed.openrouter || {}),
      },
      cerebras: {
        ...DEFAULT_SETTINGS.cerebras,
        ...(parsed.cerebras || {}),
      },
      ollama: {
        ...DEFAULT_SETTINGS.ollama,
        ...(parsed.ollama || {}),
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveApiSetting(
  provider: keyof Omit<ApiSettingsMap, "provedorIaAtivo">,
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
