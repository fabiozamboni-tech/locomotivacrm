export interface ApiConfig {
  key: string;
  enabled: boolean;
}

export interface ApiSettingsMap {
  serpapi: ApiConfig;
  apify: ApiConfig;
  lovable: ApiConfig;
  apollo: ApiConfig;
}

const STORAGE_KEY = "locomotiva_api_keys_v1";

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
};

export function getApiSettings(): ApiSettingsMap {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
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
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveApiSetting(provider: keyof ApiSettingsMap, config: Partial<ApiConfig>): ApiSettingsMap {
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
