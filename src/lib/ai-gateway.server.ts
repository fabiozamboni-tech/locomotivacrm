// Helpers para chamar o Lovable AI Gateway (OpenAI-compat) e o Firecrawl.
// Server-only: só é importado dentro de `.handler()` de server functions.

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const FIRECRAWL_URL = "https://connector-gateway.lovable.dev/firecrawl/v2/scrape";

type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

export async function chatText(
  messages: ChatMsg[],
  opts: { model?: string; temperature?: number } = {},
): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY ausente");
  const res = await fetch(AI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: opts.model ?? "google/gemini-3-flash-preview",
      messages,
      temperature: opts.temperature ?? 0.7,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    if (res.status === 429) throw new Error("Limite de uso da IA atingido. Tente novamente em alguns instantes.");
    if (res.status === 402) throw new Error("Créditos de IA esgotados. Adicione créditos no workspace.");
    throw new Error(`Falha na IA (${res.status}): ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content?.trim() ?? "";
}

export async function chatJSON<T = unknown>(
  messages: ChatMsg[],
  opts: { model?: string; temperature?: number } = {},
): Promise<T> {
  // Reforça JSON no prompt do sistema
  const withJson = [
    ...messages,
    { role: "system" as const, content: "Responda APENAS um JSON válido, sem markdown, sem cercas de código." },
  ];
  const raw = await chatText(withJson, { temperature: 0.4, ...opts });
  const cleaned = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // tenta extrair primeiro bloco { ... }
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]) as T;
    throw new Error("Resposta da IA não pôde ser interpretada como JSON.");
  }
}

export interface FirecrawlScrape {
  markdown?: string;
  html?: string;
  links?: string[];
  metadata?: {
    title?: string;
    description?: string;
    language?: string;
    sourceURL?: string;
    statusCode?: number;
    ogImage?: string;
  };
}

export async function firecrawlScrape(url: string): Promise<FirecrawlScrape> {
  const lovable = process.env.LOVABLE_API_KEY;
  const fc = process.env.FIRECRAWL_API_KEY;
  if (!lovable || !fc) throw new Error("Firecrawl connector não configurado");

  const res = await fetch(FIRECRAWL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovable}`,
      "X-Connection-Api-Key": fc,
    },
    body: JSON.stringify({
      url,
      formats: ["markdown", "links"],
      onlyMainContent: true,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Firecrawl falhou (${res.status}): ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as { data?: FirecrawlScrape } & FirecrawlScrape;
  const data = json.data ?? json;
  return {
    markdown: data.markdown,
    links: data.links,
    metadata: data.metadata,
  };
}

// -------- ChatGPT (Responses API, streaming obrigatório) --------
const RESPONSES_URL = "https://ai.gateway.lovable.dev/v1/responses";

/**
 * Chama um modelo OpenAI via Responses API do gateway com structured output
 * estrito. O streaming é obrigatório (runs longos), mas consumimos o SSE aqui
 * no servidor e devolvemos apenas o JSON final.
 */
export async function openaiJSON<T = unknown>(
  args: {
    input: Array<{ role: "system" | "user"; content: string }>;
    schemaName: string;
    schema: Record<string, unknown>;
    model?: string;
    reasoning?: "low" | "medium" | "high" | false;
  },
): Promise<T> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY ausente");

  const res = await fetch(RESPONSES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: args.model ?? "openai/gpt-5.5",
      input: args.input.map((m) => ({
        role: m.role,
        content: [{ type: "input_text", text: m.content }],
      })),
      stream: true,
      store: false,
      ...(args.reasoning === false ? {} : { reasoning: { effort: args.reasoning ?? "low", summary: "auto" } }),
      text: {
        format: {
          type: "json_schema",
          name: args.schemaName,
          strict: true,
          schema: args.schema,
        },
      },
    }),
  });

  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("Limite de uso da IA atingido. Tente novamente em alguns instantes.");
    if (res.status === 402) throw new Error("Créditos de IA esgotados. Adicione créditos no workspace.");
    throw new Error(`Falha na IA (${res.status}): ${body.slice(0, 300)}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      let evt: any;
      try {
        evt = JSON.parse(payload);
      } catch {
        continue;
      }
      if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
        text += evt.delta;
      } else if (evt.type === "response.completed" && typeof evt.response?.output_text === "string") {
        if (!text) text = evt.response.output_text;
      } else if (evt.type === "response.failed" || evt.type === "error") {
        throw new Error(evt.response?.error?.message ?? evt.message ?? "Falha na IA");
      }
    }
  }

  const cleaned = text.trim();
  if (!cleaned) throw new Error("A IA não devolveu conteúdo. Tente novamente.");
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]) as T;
    throw new Error("Resposta da IA não pôde ser interpretada como JSON.");
  }
}
