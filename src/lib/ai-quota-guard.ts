/**
 * AI Quota Guard & Rate-Limiter
 * Gerenciador de Cotas Diárias, Bloqueio Preventivo e Fallback Automático para o Locomotiva CRM.
 * Garante que nenhuma chamada externa a APIs pagas ultrapasse os limites diários estabelecidos.
 */

export type CategoriaRecurso = "imagens" | "logos" | "sites" | "pesquisas";

export type ProvedorIaNome =
  | "openai"
  | "anthropic"
  | "perplexity"
  | "recraft"
  | "fal"
  | "firefly"
  | "gemini"
  | "groq"
  | "cerebras"
  | "openrouter"
  | "pollinations"
  | "ollama";

export interface ItemHistoricoConsumo {
  id: string;
  hora: string;
  categoria: CategoriaRecurso;
  provedor: string;
  detalhe: string;
  sucesso: boolean;
  fallback?: boolean;
}

export interface ConsumoDiarioState {
  data: string; // "YYYY-MM-DD"
  categorias: {
    imagens: number;
    logos: number;
    sites: number;
    pesquisas: number;
  };
  porProvedor: Record<string, number>;
  historico: ItemHistoricoConsumo[];
}

export interface CotasDiariasConfig {
  maxImagensDia: number;
  maxLogosDia: number;
  maxSitesDia: number;
  maxPesquisasDia: number;
  limitesPorProvedor: {
    openai?: number;
    anthropic?: number;
    perplexity?: number;
    recraft?: number;
    fal?: number;
    firefly?: number;
    gemini?: number;
    groq?: number;
    cerebras?: number;
    openrouter?: number;
  };
  bloqueioRigido: boolean;
  fallbackParaGratuito: boolean;
}

export const DEFAULT_COTAS_DIARIAS: CotasDiariasConfig = {
  maxImagensDia: 20,
  maxLogosDia: 10,
  maxSitesDia: 5,
  maxPesquisasDia: 30,
  limitesPorProvedor: {
    openai: 30,
    anthropic: 20,
    perplexity: 30,
    recraft: 10,
    fal: 25,
    firefly: 10,
    gemini: 150,
    groq: 100,
    cerebras: 80,
    openrouter: 40,
  },
  bloqueioRigido: true,
  fallbackParaGratuito: true,
};

const STORAGE_KEY_CONSUMO = "locomotiva_ai_quota_v1";

function getHojeIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function getEstadoInicial(data = getHojeIso()): ConsumoDiarioState {
  return {
    data,
    categorias: {
      imagens: 0,
      logos: 0,
      sites: 0,
      pesquisas: 0,
    },
    porProvedor: {
      openai: 0,
      anthropic: 0,
      perplexity: 0,
      recraft: 0,
      fal: 0,
      firefly: 0,
      gemini: 0,
      groq: 0,
      cerebras: 0,
      openrouter: 0,
      pollinations: 0,
      ollama: 0,
    },
    historico: [],
  };
}

/**
 * Obtém o estado de consumo atual. Se o dia virou, reseta automaticamente para 0.
 */
export function getConsumoHoje(): ConsumoDiarioState {
  const hoje = getHojeIso();
  if (typeof window === "undefined") {
    return getEstadoInicial(hoje);
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONSUMO);
    if (!raw) {
      const inicial = getEstadoInicial(hoje);
      localStorage.setItem(STORAGE_KEY_CONSUMO, JSON.stringify(inicial));
      return inicial;
    }

    const parsed: ConsumoDiarioState = JSON.parse(raw);
    if (parsed.data !== hoje) {
      // Dia novo! Reset automático
      const novoDia = getEstadoInicial(hoje);
      localStorage.setItem(STORAGE_KEY_CONSUMO, JSON.stringify(novoDia));
      return novoDia;
    }

    return {
      ...getEstadoInicial(hoje),
      ...parsed,
      categorias: {
        ...getEstadoInicial(hoje).categorias,
        ...(parsed.categorias || {}),
      },
      porProvedor: {
        ...getEstadoInicial(hoje).porProvedor,
        ...(parsed.porProvedor || {}),
      },
      historico: Array.isArray(parsed.historico) ? parsed.historico.slice(0, 50) : [],
    };
  } catch (err) {
    console.warn("[QuotaGuard] Erro ao ler consumo diário:", err);
    return getEstadoInicial(hoje);
  }
}

/**
 * Salva o estado de consumo diário no localStorage.
 */
function salvarConsumo(estado: ConsumoDiarioState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_CONSUMO, JSON.stringify(estado));
  } catch (err) {
    console.error("[QuotaGuard] Erro ao persistir consumo diário:", err);
  }
}

export interface ChecagemCotaResultado {
  permitido: boolean;
  bloqueado: boolean;
  motivo?: string;
  acaoRecomendada: "prosseguir" | "fallback_gratuito" | "bloquear";
  usadoCategoria: number;
  limiteCategoria: number;
  restanteCategoria: number;
  usadoProvedor: number;
  limiteProvedor: number;
  restanteProvedor: number;
}

/**
 * Checa a cota diária antes de disparar uma requisição para a IA.
 */
export function checarCotaDiaria(params: {
  categoria: CategoriaRecurso;
  provedor: string;
  cotas?: CotasDiariasConfig;
}): ChecagemCotaResultado {
  const { categoria, provedor, cotas = DEFAULT_COTAS_DIARIAS } = params;
  const consumo = getConsumoHoje();

  // Limite da categoria
  const limiteCategoria =
    categoria === "imagens"
      ? cotas.maxImagensDia
      : categoria === "logos"
      ? cotas.maxLogosDia
      : categoria === "sites"
      ? cotas.maxSitesDia
      : cotas.maxPesquisasDia;

  const usadoCategoria = consumo.categorias[categoria] || 0;
  const restanteCategoria = Math.max(0, limiteCategoria - usadoCategoria);

  // Limite específico do provedor (se configurado)
  const limiteProvedor = (cotas.limitesPorProvedor as any)?.[provedor] ?? 9999;
  const usadoProvedor = consumo.porProvedor[provedor] || 0;
  const restanteProvedor = Math.max(0, limiteProvedor - usadoProvedor);

  // Motores 100% gratuitos (Pollinations, Groq, Cerebras, Ollama) nunca bloqueiam
  const isMotorGratuito =
    provedor === "pollinations" ||
    provedor === "ollama" ||
    (provedor === "groq" && usadoProvedor < 100) ||
    (provedor === "cerebras" && usadoProvedor < 80);

  const bateuCategoria = usadoCategoria >= limiteCategoria;
  const bateuProvedor = usadoProvedor >= limiteProvedor;

  if (!isMotorGratuito && (bateuCategoria || bateuProvedor)) {
    const motivo = bateuProvedor
      ? `Limite diário do provedor ${provedor.toUpperCase()} (${limiteProvedor}/dia) foi atingido.`
      : `Limite diário para ${categoria} (${limiteCategoria}/dia) foi atingido hoje.`;

    if (cotas.fallbackParaGratuito) {
      return {
        permitido: true,
        bloqueado: false,
        motivo: `${motivo} Alternando automaticamente para o motor gratuito.`,
        acaoRecomendada: "fallback_gratuito",
        usadoCategoria,
        limiteCategoria,
        restanteCategoria,
        usadoProvedor,
        limiteProvedor,
        restanteProvedor,
      };
    }

    if (cotas.bloqueioRigido) {
      return {
        permitido: false,
        bloqueado: true,
        motivo: `${motivo} Novas gerações estarão disponíveis após a meia-noite.`,
        acaoRecomendada: "bloquear",
        usadoCategoria,
        limiteCategoria,
        restanteCategoria,
        usadoProvedor,
        limiteProvedor,
        restanteProvedor,
      };
    }
  }

  return {
    permitido: true,
    bloqueado: false,
    acaoRecomendada: "prosseguir",
    usadoCategoria,
    limiteCategoria,
    restanteCategoria,
    usadoProvedor,
    limiteProvedor,
    restanteProvedor,
  };
}

/**
 * Registra o consumo após uma tentativa de geração.
 */
export function registrarConsumoDiario(params: {
  categoria: CategoriaRecurso;
  provedor: string;
  detalhe: string;
  sucesso: boolean;
  fallback?: boolean;
}): ConsumoDiarioState {
  const { categoria, provedor, detalhe, sucesso, fallback } = params;
  const estado = getConsumoHoje();

  if (sucesso) {
    estado.categorias[categoria] = (estado.categorias[categoria] || 0) + 1;
    estado.porProvedor[provedor] = (estado.porProvedor[provedor] || 0) + 1;
  }

  const novoItem: ItemHistoricoConsumo = {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    hora: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    categoria,
    provedor,
    detalhe,
    sucesso,
    fallback,
  };

  estado.historico = [novoItem, ...estado.historico].slice(0, 30);
  salvarConsumo(estado);
  return estado;
}

/**
 * Reseta os contadores do dia atual (útil para testes na agência).
 */
export function resetarConsumoHoje(): ConsumoDiarioState {
  const limpo = getEstadoInicial(getHojeIso());
  salvarConsumo(limpo);
  return limpo;
}

/**
 * Resumo formatado para os componentes de UI exibirem badges e alertas de saldo.
 */
export function obterResumoSaldo(cotas = DEFAULT_COTAS_DIARIAS) {
  const consumo = getConsumoHoje();

  return {
    data: consumo.data,
    imagens: {
      usado: consumo.categorias.imagens,
      limite: cotas.maxImagensDia,
      restante: Math.max(0, cotas.maxImagensDia - consumo.categorias.imagens),
      porcentagem: Math.min(100, Math.round((consumo.categorias.imagens / cotas.maxImagensDia) * 100)),
    },
    logos: {
      usado: consumo.categorias.logos,
      limite: cotas.maxLogosDia,
      restante: Math.max(0, cotas.maxLogosDia - consumo.categorias.logos),
      porcentagem: Math.min(100, Math.round((consumo.categorias.logos / cotas.maxLogosDia) * 100)),
    },
    sites: {
      usado: consumo.categorias.sites,
      limite: cotas.maxSitesDia,
      restante: Math.max(0, cotas.maxSitesDia - consumo.categorias.sites),
      porcentagem: Math.min(100, Math.round((consumo.categorias.sites / cotas.maxSitesDia) * 100)),
    },
    pesquisas: {
      usado: consumo.categorias.pesquisas,
      limite: cotas.maxPesquisasDia,
      restante: Math.max(0, cotas.maxPesquisasDia - consumo.categorias.pesquisas),
      porcentagem: Math.min(100, Math.round((consumo.categorias.pesquisas / cotas.maxPesquisasDia) * 100)),
    },
    historico: consumo.historico,
    porProvedor: consumo.porProvedor,
  };
}
