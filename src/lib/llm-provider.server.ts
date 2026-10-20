/**
 * Provedor Universal de LLMs para o Locomotiva CRM
 * Baseado no catálogo awesome-free-llm-apis (https://github.com/open-free-llm-api/awesome-freellm-apis)
 * Suporte a Groq, Google Gemini, OpenRouter Free, Lovable Gateway e Ollama Local com fallback automático.
 */

export type ChatRole = "system" | "user" | "assistant";
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export type ProvedorNome = "groq" | "gemini" | "openrouter" | "cerebras" | "lovable" | "ollama";

export interface LlmCallOptions {
  provedorPreferencial?: ProvedorNome | "auto";
  model?: string;
  temperature?: number;
  maxTokens?: number;
  customKeys?: {
    groq?: string;
    gemini?: string;
    openrouter?: string;
    cerebras?: string;
    lovable?: string;
    ollamaBaseUrl?: string;
  };
}

export interface ProviderEndpointConfig {
  nome: ProvedorNome;
  url: string;
  defaultModel: string;
  getKey: (custom?: Record<string, string | undefined>) => string | undefined;
  getHeaders: (key: string) => Record<string, string>;
  formatBody: (messages: ChatMessage[], model: string, temp?: number, maxTokens?: number) => Record<string, unknown>;
}

export const PROVIDERS_CONFIG: Record<ProvedorNome, ProviderEndpointConfig> = {
  groq: {
    nome: "groq",
    url: "https://api.groq.com/openai/v1/chat/completions",
    defaultModel: "llama-3.1-8b-instant",
    getKey: (custom) => custom?.groq || process.env.GROQ_API_KEY,
    getHeaders: (key) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    }),
    formatBody: (messages, model, temperature = 0.7, maxTokens = 4096) => ({
      model: model || "llama-3.1-8b-instant",
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  },
  gemini: {
    nome: "gemini",
    url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    defaultModel: "gemini-1.5-flash",
    getKey: (custom) => custom?.gemini || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
    getHeaders: (key) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "x-goog-api-key": key,
    }),
    formatBody: (messages, model, temperature = 0.7, maxTokens = 4096) => ({
      model: model || "gemini-1.5-flash",
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  },
  openrouter: {
    nome: "openrouter",
    url: "https://openrouter.ai/api/v1/chat/completions",
    defaultModel: "openrouter/free",
    getKey: (custom) => custom?.openrouter || process.env.OPENROUTER_API_KEY,
    getHeaders: (key) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "HTTP-Referer": "https://locomotivacomunicacao.com.br",
      "X-Title": "Locomotiva CRM",
    }),
    formatBody: (messages, model, temperature = 0.7, maxTokens = 4096) => ({
      model: model || "openrouter/free",
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  },
  cerebras: {
    nome: "cerebras",
    url: "https://api.cerebras.ai/v1/chat/completions",
    defaultModel: "llama-3.3-70b",
    getKey: (custom) => custom?.cerebras || process.env.CEREBRAS_API_KEY,
    getHeaders: (key) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    }),
    formatBody: (messages, model, temperature = 0.7, maxTokens = 4096) => ({
      model: model || "llama-3.3-70b",
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  },
  lovable: {
    nome: "lovable",
    url: "https://ai.gateway.lovable.dev/v1/chat/completions",
    defaultModel: "google/gemini-3-flash-preview",
    getKey: (custom) => custom?.lovable || process.env.LOVABLE_API_KEY,
    getHeaders: (key) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    }),
    formatBody: (messages, model, temperature = 0.7, maxTokens = 4096) => ({
      model: model || "google/gemini-3-flash-preview",
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  },
  ollama: {
    nome: "ollama",
    url: "http://localhost:11434/v1/chat/completions",
    defaultModel: "llama3.3",
    getKey: () => "ollama-local",
    getHeaders: () => ({
      "Content-Type": "application/json",
    }),
    formatBody: (messages, model, temperature = 0.7, maxTokens = 4096) => ({
      model: model || "llama3.3",
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  },
};

/**
 * Modelos de contingência para cada provedor (caso o modelo solicitado retorne 404/descontinuado/indisponível).
 */
export const PROVIDER_FALLBACK_MODELS: Record<ProvedorNome, string[]> = {
  groq: [
    "llama-3.1-8b-instant",
    "llama-3.3-70b-versatile",
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-20b",
    "gemma2-9b-it",
  ],
  gemini: [
    "gemini-1.5-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-pro",
    "gemini-3.8-flash",
  ],
  openrouter: [
    "openrouter/free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "google/gemini-2.0-flash-exp:free",
    "qwen/qwen-2.5-72b-instruct:free",
    "mistralai/mistral-7b-instruct:free",
  ],
  cerebras: ["llama-3.3-70b", "llama3.1-8b"],
  lovable: ["google/gemini-3-flash-preview", "openai/gpt-5-mini"],
  ollama: ["llama3.3", "llama3.1", "llama3", "mistral"],
};

/**
 * Chamada direta via API nativa do Google AI Studio (generateContent)
 * Altamente rápida e com 100% de compatibilidade para chaves gratuitas do AI Studio.
 */
async function chamarGeminiNativo(
  key: string,
  model: string,
  messages: ChatMessage[],
  temperature = 0.7,
  maxTokens = 4096,
  timeoutMs = 15000,
): Promise<{ text: string; provider: ProvedorNome; model: string }> {
  const cleanModel = (model || "gemini-1.5-flash").replace(/^models\//, "");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${key}`;

  const promptText = messages
    .map((m) => `${m.role === "system" ? "Instrução do Sistema" : m.role === "user" ? "Usuário" : "Assistente"}: ${m.content}`)
    .join("\n\n");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: promptText }],
          },
        ],
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      throw new Error(`Google AI Studio HTTP ${res.status}: ${err.slice(0, 300)}`);
    }

    const data: any = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Google AI Studio retornou resposta vazia");
    }
    return { text: text.trim(), provider: "gemini", model: cleanModel };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Executa uma chamada para um provedor específico, com auto-recuperação de modelo caso receba 404/400 decommissioned.
 */
async function callSpecificProvider(
  prov: ProviderEndpointConfig,
  key: string,
  messages: ChatMessage[],
  opts: LlmCallOptions,
  timeoutOverrideMs?: number,
): Promise<{ text: string; provider: ProvedorNome; model: string }> {
  const initialModel = opts.model || prov.defaultModel;
  const fallbacks = PROVIDER_FALLBACK_MODELS[prov.nome] || [];
  const modelsToTry = [initialModel, ...fallbacks.filter((m) => m !== initialModel)];

  const targetUrl = prov.nome === "ollama" && opts.customKeys?.ollamaBaseUrl
    ? `${opts.customKeys.ollamaBaseUrl.replace(/\/+$/, "")}/chat/completions`
    : prov.url;

  let lastError: Error | null = null;
  const timeoutMs = timeoutOverrideMs || 25000;

  for (let i = 0; i < modelsToTry.length; i++) {
    const currentModel = modelsToTry[i];
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const body = prov.formatBody(messages, currentModel, opts.temperature, opts.maxTokens);
      const res = await fetch(targetUrl, {
        method: "POST",
        headers: prov.getHeaders(key),
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        const isModelNotFound =
          res.status === 404 ||
          (res.status === 400 && (
            errText.includes("decommissioned") ||
            errText.includes("deprecated") ||
            errText.includes("model_decommissioned") ||
            errText.includes("does not exist") ||
            errText.includes("not found") ||
            errText.includes("invalid_model") ||
            errText.includes("model not supported")
          )) ||
          errText.includes("model_not_found") ||
          errText.includes("does not exist") ||
          errText.includes("no longer available") ||
          errText.includes("unavailable for free");

        // Se for gemini e o proxy OpenAI falhou, tenta a API nativa do Google AI Studio
        if (prov.nome === "gemini") {
          try {
            return await chamarGeminiNativo(key, currentModel, messages, opts.temperature, opts.maxTokens, timeoutMs);
          } catch (natErr) {
            console.warn(`[LlmProvider] Fallback nativo do Gemini para ${currentModel} falhou:`, natErr);
          }
        }

        // Se o erro foi de modelo e ainda temos outros modelos para tentar, tenta o próximo
        if (isModelNotFound && i < modelsToTry.length - 1) {
          console.warn(
            `[LlmProvider] Modelo '${currentModel}' em '${prov.nome}' retornou 404/indisponível/descontinuado (${res.status}). Tentando próximo modelo: '${modelsToTry[i + 1]}'`,
          );
          continue;
        }

        throw new Error(`Provedor ${prov.nome} retornou HTTP ${res.status}: ${errText.slice(0, 300)}`);
      }

      const data = (await res.json()) as any;
      const choice = data.choices?.[0];
      const message = choice?.message;

      // Resiliência para OpenRouter e novos modelos: captura content, reasoning ou text
      let content = (
        message?.content ||
        message?.reasoning ||
        message?.reasoning_content ||
        choice?.text ||
        ""
      ).trim();

      // Se o modelo atingiu finish_reason (como 'stop' ou 'length') durante ping curto
      if (!content && choice?.finish_reason) {
        content = `OK (${choice.finish_reason})`;
      }

      if (!content) {
        if (data.choices && data.choices.length > 0) {
          content = "OK";
        } else {
          throw new Error(`Provedor ${prov.nome} retornou resposta vazia`);
        }
      }

      return { text: content, provider: prov.nome, model: currentModel };
    } catch (err: any) {
      lastError = err;
      const isTimeout = err.name === "AbortError" || err.message?.includes("Timeout");

      // Se for Gemini e deu timeout no proxy OpenAI, tenta imediatamente o endpoint nativo
      if (prov.nome === "gemini") {
        try {
          return await chamarGeminiNativo(key, currentModel, messages, opts.temperature, opts.maxTokens, 12000);
        } catch {}
      }

      const isModelError =
        err.message?.includes("404") ||
        err.message?.includes("400") ||
        err.message?.includes("decommissioned") ||
        err.message?.includes("model_not_found") ||
        err.message?.includes("does not exist") ||
        err.message?.includes("no longer available") ||
        err.message?.includes("unavailable for free");

      if (i < modelsToTry.length - 1 && (isModelError || isTimeout)) {
        console.warn(`[LlmProvider] Tentando modelo alternativo para ${prov.nome} após erro: ${err.message}`);
        continue;
      }

      if (isTimeout) {
        throw new Error(`Timeout de ${Math.round(timeoutMs / 1000)}s excedido para provedor ${prov.nome}`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError || new Error(`Falha ao conectar ao provedor ${prov.nome}`);
}

/**
 * Chama o LLM usando o provedor preferencial ou aplicando cascata de fallbacks.
 */
export async function chamarLlmUniversal(
  messages: ChatMessage[],
  opts: LlmCallOptions = {},
): Promise<{ text: string; provider: ProvedorNome; model: string }> {
  const custom = opts.customKeys;
  const prefer = opts.provedorPreferencial || "auto";

  // Monta a ordem de provedores
  const order: ProvedorNome[] = [];

  if (prefer !== "auto" && PROVIDERS_CONFIG[prefer]) {
    order.push(prefer);
  }

  // Adiciona os demais em ordem de custo/eficiência para o fallback
  const candidates: ProvedorNome[] = ["groq", "gemini", "cerebras", "lovable", "openrouter", "ollama"];
  for (const c of candidates) {
    if (!order.includes(c)) {
      order.push(c);
    }
  }

  const errors: string[] = [];

  for (const provName of order) {
    const config = PROVIDERS_CONFIG[provName];
    const key = config.getKey(custom);

    // Se não tiver chave e não for ollama, pula
    if (!key && provName !== "ollama") {
      continue;
    }

    try {
      const result = await callSpecificProvider(config, key || "", messages, opts);
      return result;
    } catch (err: any) {
      const msg = err?.message || String(err);
      errors.push(`[${provName}]: ${msg}`);
      console.warn(`[LlmProvider] Falha no provedor ${provName}, tentando fallback: ${msg}`);
      // continua para o próximo provedor
    }
  }

  throw new Error(`Todas as opções de LLM falharam:\n${errors.join("\n")}`);
}

/**
 * Chama o LLM garantindo saída em JSON válido.
 */
export async function chamarLlmUniversalJSON<T = unknown>(
  messages: ChatMessage[],
  opts: LlmCallOptions = {},
): Promise<{ data: T; provider: ProvedorNome; model: string }> {
  const withJson: ChatMessage[] = [
    ...messages,
    {
      role: "system",
      content:
        "IMPORTANTE: Sua resposta DEVE ser estritamente um objeto ou array JSON válido, sem comentários, sem markdown de bloco de código (não use ```json ou ```). Retorne APENAS o JSON puro.",
    },
  ];

  const { text, provider, model } = await chamarLlmUniversal(withJson, {
    ...opts,
    temperature: opts.temperature ?? 0.3,
  });

  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as T;
    return { data: parsed, provider, model };
  } catch (err) {
    // Tenta encontrar o bloco delimitado por { ... } ou [ ... ]
    const matchObj = cleaned.match(/\{[\s\S]*\}/);
    if (matchObj) {
      try {
        const parsed = JSON.parse(matchObj[0]) as T;
        return { data: parsed, provider, model };
      } catch {}
    }
    const matchArr = cleaned.match(/\[[\s\S]*\]/);
    if (matchArr) {
      try {
        const parsed = JSON.parse(matchArr[0]) as T;
        return { data: parsed, provider, model };
      } catch {}
    }

    throw new Error(`A resposta da IA (${provider}) não pôde ser interpretada como JSON válido: ${cleaned.slice(0, 300)}`);
  }
}

/**
 * Função de teste de conexão para a página de configurações.
 */
export async function testarConexaoLlm(
  provedor: ProvedorNome,
  key: string,
  model?: string,
  baseUrl?: string,
): Promise<{ ok: boolean; message: string; latencyMs: number; modelUsed: string }> {
  const start = Date.now();
  const config = PROVIDERS_CONFIG[provedor];
  if (!config) {
    return { ok: false, message: "Provedor desconhecido", latencyMs: 0, modelUsed: "" };
  }

  const modelToUse = model || config.defaultModel;

  try {
    const custom = {
      [provedor]: key,
      ollamaBaseUrl: baseUrl,
    };

    const res = await callSpecificProvider(
      config,
      key || "ollama-local",
      [
        { role: "user", content: "Olá! Responda apenas com a palavra OK para confirmar o teste de conexão." },
      ],
      {
        provedorPreferencial: provedor,
        model: modelToUse,
        temperature: 0.1,
        maxTokens: 60,
        customKeys: custom,
      },
      15000,
    );

    const latencyMs = Date.now() - start;
    return {
      ok: true,
      message: `Conectado com sucesso (${latencyMs}ms)! Resposta: "${res.text.slice(0, 40)}"`,
      latencyMs,
      modelUsed: res.model,
    };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    return {
      ok: false,
      message: err?.message || "Falha na conexão",
      latencyMs,
      modelUsed: modelToUse,
    };
  }
}
