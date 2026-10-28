import fs from "node:fs/promises";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../integrations/supabase/types";
import { EMPRESAS_INICIAIS, type Empresa } from "./mock-data";
import { DEFAULT_WEIGHTS, type ScoreWeights, calcularScore } from "./scoring";
import {
  DEFAULT_EMAIL_SETTINGS,
  DEFAULT_WHATSAPP_SETTINGS,
  type ComunicacaoSettings,
} from "./comunicacao-settings";
import { type ApiSettingsMap } from "./api-settings";
import {
  type PromptPadraoConfig,
  type PromptPadraoHistoricoItem,
  getDefaultPromptPadraoConfig,
} from "./prompt-padrao-config";
import {
  type PromptConteudoConfig,
  type PromptConteudoHistoricoItem,
  getDefaultPromptConteudoConfig,
} from "./prompt-conteudo-config";

export interface EmpresaExcluida {
  id: string;
  nome: string;
  razaoSocial?: string;
  cnpj?: string;
  cidade?: string;
  estado?: string;
  segmento?: string;
  site?: string;
  telefone?: string;
  placeId?: string;
  origem?: string;
  excluidoEm: string;
}

export interface InstagramProfile {
  id: string;
  nome: string;
  handle: string;
  instagramUrl: string;
  bio?: string;
  segmento?: string;
  cidade: string;
  estado?: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  site?: string;
  seguidores?: string;
  salvoEm: string;
  origemBusca?: string;
}

export interface CrmDatabaseState {
  version: number;
  lastUpdated: string;
  empresas: Empresa[];
  empresasExcluidas: EmpresaExcluida[];
  instagramProfilesDb: InstagramProfile[];
  weights: ScoreWeights;
  comunicacaoSettings: ComunicacaoSettings;
  apiSettings?: Partial<ApiSettingsMap>;
  promptPadraoConfig?: PromptPadraoConfig;
  promptConteudoConfig?: PromptConteudoConfig;
}

export interface DatabaseInfo {
  mode: "server_persistent" | "supabase";
  isSupabaseConfigured: boolean;
  totalEmpresas: number;
  totalExcluidas: number;
  totalInstagram: number;
  lastSaved: string;
  storagePath: string;
  fileSizeBytes: number;
}

const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.NETLIFY ||
  process.env.DENO_DEPLOYMENT_ID
);

const DATA_DIR = isServerless ? path.join("/tmp", ".data") : path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "crm-database.json");
const DB_TMP_FILE = path.join(DATA_DIR, "crm-database.json.tmp");

let memoryStateCache: CrmDatabaseState | null = null;
let writeQueue = Promise.resolve();
let _cachedSupabase: SupabaseClient<Database> | null | undefined = undefined;

export function getSupabaseClient(): SupabaseClient<Database> | null {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return null;
  }

  if (_cachedSupabase !== undefined) {
    return _cachedSupabase;
  }

  try {
    _cachedSupabase = createClient<Database>(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return _cachedSupabase;
  } catch (err: any) {
    console.warn("[ServerDB] Falha ao inicializar Supabase client:", err.message);
    _cachedSupabase = null;
    return null;
  }
}

function getDefaultState(): CrmDatabaseState {
  return {
    version: 1,
    lastUpdated: new Date().toISOString(),
    empresas: EMPRESAS_INICIAIS.map((e) => ({
      ...e,
      score: calcularScore(e, DEFAULT_WEIGHTS).score,
    })),
    empresasExcluidas: [],
    instagramProfilesDb: [],
    weights: DEFAULT_WEIGHTS,
    comunicacaoSettings: {
      email: DEFAULT_EMAIL_SETTINGS,
      whatsapp: DEFAULT_WHATSAPP_SETTINGS,
    },
    promptPadraoConfig: getDefaultPromptPadraoConfig(),
    promptConteudoConfig: getDefaultPromptConteudoConfig(),
  };
}

async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err: any) {
    if (err.code !== "EEXIST") {
      console.warn("[ServerDB] Aviso ao criar diretório de dados:", err.message);
    }
  }
}

async function readFromDisk(): Promise<CrmDatabaseState> {
  try {
    await ensureDataDir();
    const raw = await fs.readFile(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<CrmDatabaseState>;
    const defaultState = getDefaultState();

    return {
      version: parsed.version || 1,
      lastUpdated: parsed.lastUpdated || new Date().toISOString(),
      empresas: Array.isArray(parsed.empresas) && parsed.empresas.length > 0
        ? parsed.empresas
        : defaultState.empresas,
      empresasExcluidas: Array.isArray(parsed.empresasExcluidas) ? parsed.empresasExcluidas : [],
      instagramProfilesDb: Array.isArray(parsed.instagramProfilesDb) ? parsed.instagramProfilesDb : [],
      weights: parsed.weights ? { ...DEFAULT_WEIGHTS, ...parsed.weights } : DEFAULT_WEIGHTS,
      comunicacaoSettings: parsed.comunicacaoSettings
        ? {
            email: { ...DEFAULT_EMAIL_SETTINGS, ...parsed.comunicacaoSettings.email },
            whatsapp: { ...DEFAULT_WHATSAPP_SETTINGS, ...parsed.comunicacaoSettings.whatsapp },
          }
        : defaultState.comunicacaoSettings,
      apiSettings: parsed.apiSettings,
      promptPadraoConfig: parsed.promptPadraoConfig || defaultState.promptPadraoConfig,
      promptConteudoConfig: parsed.promptConteudoConfig || defaultState.promptConteudoConfig,
    };
  } catch (err: any) {
    if (err.code === "ENOENT") {
      const initial = getDefaultState();
      await writeToDisk(initial);
      return initial;
    }
    console.warn("[ServerDB] Falha ao ler crm-database.json, usando padrão:", err.message);
    return getDefaultState();
  }
}

async function writeToDisk(state: CrmDatabaseState): Promise<void> {
  try {
    await ensureDataDir();
    const serialized = JSON.stringify(state, null, 2);
    await fs.writeFile(DB_TMP_FILE, serialized, "utf-8");
    await fs.rename(DB_TMP_FILE, DB_FILE);
  } catch (err: any) {
    console.warn("[ServerDB] Aviso ao gravar em disco (ambiente serverless efêmero):", err.message);
  }
  memoryStateCache = state;
}

function queueWrite(mutator: (state: CrmDatabaseState) => CrmDatabaseState | Promise<CrmDatabaseState>): Promise<CrmDatabaseState> {
  const op = writeQueue.then(async () => {
    const current = memoryStateCache || (await readFromDisk());
    const updated = await mutator(current);
    updated.lastUpdated = new Date().toISOString();
    await writeToDisk(updated);
    return updated;
  });

  writeQueue = op.then(() => {}).catch(() => {});
  return op;
}

// -----------------------------------------------------------------------------
// OPERAÇÕES DO BANCO DE DADOS (SUPABASE POSTGRESQL + DISK FALLBACK)
// -----------------------------------------------------------------------------

export async function getDbState(): Promise<CrmDatabaseState> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const [empresasRes, configRes, excluidasRes, instagramRes] = await Promise.all([
        supabase.from("crm_empresas").select("*").order("updated_at", { ascending: false }),
        supabase.from("crm_configuracoes").select("*").eq("id", "global").maybeSingle(),
        supabase.from("crm_empresas_excluidas").select("*").order("excluido_em", { ascending: false }),
        supabase.from("crm_instagram_profiles").select("*").order("salvo_em", { ascending: false }),
      ]);

      if (!empresasRes.error) {
        const defaultState = getDefaultState();
        const config = configRes.data;

        const weights: ScoreWeights =
          (config?.weights as unknown as ScoreWeights) || defaultState.weights;
        const comunicacaoSettings: ComunicacaoSettings =
          (config?.comunicacao_settings as unknown as ComunicacaoSettings) || defaultState.comunicacaoSettings;
        const apiSettings = (config?.api_settings as unknown as Partial<ApiSettingsMap>) || undefined;
        const promptPadraoConfig: PromptPadraoConfig =
          ((config?.api_settings as any)?.promptPadraoConfig as PromptPadraoConfig) ||
          (config as any)?.prompt_padrao_config ||
          defaultState.promptPadraoConfig ||
          getDefaultPromptPadraoConfig();
        const promptConteudoConfig: PromptConteudoConfig =
          ((config?.api_settings as any)?.promptConteudoConfig as PromptConteudoConfig) ||
          (config as any)?.prompt_conteudo_config ||
          defaultState.promptConteudoConfig ||
          getDefaultPromptConteudoConfig();

        const empresas: Empresa[] = (empresasRes.data || []).map((row) => {
          const raw = (row.dados && typeof row.dados === "object" ? row.dados : {}) as Partial<Empresa>;
          return {
            ...raw,
            id: row.id,
            nome: row.nome || raw.nome || "Sem nome",
            segmento: (row.segmento || raw.segmento || "") as any,
            cidade: row.cidade || raw.cidade || "",
            crmStage: (row.crm_stage as any) || raw.crmStage || "identificado",
            score: typeof row.score === "number" && row.score > 0
              ? row.score
              : calcularScore(raw as Empresa, weights).score,
            ultimaAnalise: raw.ultimaAnalise || row.updated_at || new Date().toISOString(),
          } as Empresa;
        });

        const empresasExcluidas: EmpresaExcluida[] = (excluidasRes.data || []).map((row) => {
          const raw = (row.dados && typeof row.dados === "object" ? row.dados : {}) as Partial<EmpresaExcluida>;
          return {
            ...raw,
            id: row.id,
            nome: row.nome || raw.nome || "",
            cnpj: row.cnpj || raw.cnpj,
            placeId: row.place_id || raw.placeId,
            excluidoEm: row.excluido_em || raw.excluidoEm || new Date().toISOString(),
          } as EmpresaExcluida;
        });

        const instagramProfilesDb: InstagramProfile[] = (instagramRes.data || []).map((row) => {
          const raw = (row.dados && typeof row.dados === "object" ? row.dados : {}) as Partial<InstagramProfile>;
          return {
            ...raw,
            id: row.id,
            handle: row.handle || raw.handle || "",
            nome: row.nome || raw.nome || "",
            salvoEm: row.salvo_em || raw.salvoEm || new Date().toISOString(),
          } as InstagramProfile;
        });

        const state: CrmDatabaseState = {
          version: 1,
          lastUpdated: config?.updated_at || new Date().toISOString(),
          empresas,
          empresasExcluidas,
          instagramProfilesDb,
          weights,
          comunicacaoSettings,
          apiSettings,
          promptPadraoConfig,
          promptConteudoConfig,
        };

        memoryStateCache = state;
        void writeToDisk(state);
        return state;
      } else {
        console.warn("[ServerDB] Resposta com erro ao buscar crm_empresas no Supabase:", empresasRes.error.message);
      }
    } catch (err: any) {
      console.warn("[ServerDB] Exceção ao ler do Supabase, utilizando fallback de disco:", err.message);
    }
  }

  if (!memoryStateCache) {
    memoryStateCache = await readFromDisk();
  }
  return memoryStateCache;
}

export async function getEmpresas(): Promise<Empresa[]> {
  const state = await getDbState();
  return state.empresas;
}

export async function saveEmpresa(empresa: Empresa): Promise<Empresa> {
  const currentState = memoryStateCache || (await getDbState());
  const now = new Date().toISOString();
  const scoredEmpresa: Empresa = {
    ...empresa,
    score: calcularScore(empresa, currentState.weights).score,
    ultimaAnalise: empresa.ultimaAnalise || now,
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.from("crm_empresas").upsert(
        {
          id: scoredEmpresa.id,
          nome: scoredEmpresa.nome,
          segmento: scoredEmpresa.segmento || null,
          cidade: scoredEmpresa.cidade || null,
          crm_stage: scoredEmpresa.crmStage || "identificado",
          score: scoredEmpresa.score || 0,
          dados: scoredEmpresa as any,
          updated_at: now,
        },
        { onConflict: "id" }
      );
      if (error) {
        console.warn("[ServerDB] Erro ao salvar empresa no Supabase:", error.message);
      }
    } catch (err: any) {
      console.warn("[ServerDB] Exceção ao salvar empresa no Supabase:", err.message);
    }
  }

  await queueWrite((state) => {
    const existingIndex = state.empresas.findIndex((e) => e.id === empresa.id);
    if (existingIndex >= 0) {
      const copy = [...state.empresas];
      copy[existingIndex] = scoredEmpresa;
      return { ...state, empresas: copy };
    } else {
      return { ...state, empresas: [scoredEmpresa, ...state.empresas] };
    }
  });

  return scoredEmpresa;
}

export async function saveAllEmpresas(empresasNovas: Empresa[], merge = true): Promise<Empresa[]> {
  const currentState = memoryStateCache || (await getDbState());
  const now = new Date().toISOString();
  const scoredNovas = empresasNovas.map((e) => ({
    ...e,
    score: calcularScore(e, currentState.weights).score,
    ultimaAnalise: e.ultimaAnalise || now,
  }));

  const supabase = getSupabaseClient();
  if (supabase && scoredNovas.length > 0) {
    try {
      if (!merge) {
        await supabase.from("crm_empresas").delete().neq("id", "___keep_none___");
      }
      const records = scoredNovas.map((e) => ({
        id: e.id,
        nome: e.nome,
        segmento: e.segmento || null,
        cidade: e.cidade || null,
        crm_stage: e.crmStage || "identificado",
        score: e.score || 0,
        dados: e as any,
        updated_at: now,
      }));

      // Lote de até 100 para evitar limites de payload
      for (let i = 0; i < records.length; i += 100) {
        const batch = records.slice(i, i + 100);
        const { error } = await supabase.from("crm_empresas").upsert(batch, { onConflict: "id" });
        if (error) {
          console.warn("[ServerDB] Erro ao salvar lote no Supabase:", error.message);
        }
      }
    } catch (err: any) {
      console.warn("[ServerDB] Exceção ao salvar lote no Supabase:", err.message);
    }
  }

  let result: Empresa[] = [];
  await queueWrite((state) => {
    if (!merge) {
      result = scoredNovas;
      return { ...state, empresas: result };
    }

    const map = new Map<string, Empresa>();
    for (const e of state.empresas) {
      map.set(e.id, e);
    }
    for (const n of scoredNovas) {
      const existing = map.get(n.id);
      map.set(n.id, {
        ...(existing || {}),
        ...n,
        score: calcularScore(n, state.weights).score,
      });
    }

    result = Array.from(map.values());
    return { ...state, empresas: result };
  });

  return result;
}

export async function deleteEmpresa(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.from("crm_empresas").delete().eq("id", id);
      if (error) {
        console.warn("[ServerDB] Erro ao deletar empresa no Supabase:", error.message);
      }
    } catch (err: any) {
      console.warn("[ServerDB] Exceção ao deletar empresa no Supabase:", err.message);
    }
  }

  let found = false;
  await queueWrite((state) => {
    const filtered = state.empresas.filter((e) => {
      if (e.id === id) {
        found = true;
        return false;
      }
      return true;
    });
    return { ...state, empresas: filtered };
  });
  return found;
}

export async function saveEmpresaExcluida(item: EmpresaExcluida): Promise<EmpresaExcluida> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from("crm_empresas_excluidas").upsert(
        {
          id: item.id,
          nome: item.nome,
          cnpj: item.cnpj || null,
          place_id: item.placeId || null,
          dados: item as any,
          excluido_em: item.excluidoEm || new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    } catch (err: any) {
      console.warn("[ServerDB] Erro ao salvar excluída no Supabase:", err.message);
    }
  }

  await queueWrite((state) => {
    const filtered = state.empresasExcluidas.filter((ex) => ex.id !== item.id);
    return {
      ...state,
      empresasExcluidas: [item, ...filtered],
    };
  });
  return item;
}

export async function deleteEmpresaExcluida(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from("crm_empresas_excluidas").delete().eq("id", id);
    } catch (err: any) {
      console.warn("[ServerDB] Erro ao deletar excluída no Supabase:", err.message);
    }
  }

  await queueWrite((state) => ({
    ...state,
    empresasExcluidas: state.empresasExcluidas.filter((ex) => ex.id !== id),
  }));
  return true;
}

export async function clearEmpresasExcluidas(): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from("crm_empresas_excluidas").delete().neq("id", "___keep_none___");
    } catch (err: any) {
      console.warn("[ServerDB] Erro ao limpar excluídas no Supabase:", err.message);
    }
  }

  await queueWrite((state) => ({
    ...state,
    empresasExcluidas: [],
  }));
}

export async function saveInstagramProfiles(
  novos: InstagramProfile[]
): Promise<{ adicionados: number; duplicados: number }> {
  let adicionados = 0;
  let duplicados = 0;

  const supabase = getSupabaseClient();
  if (supabase && novos.length > 0) {
    try {
      const records = novos.map((p) => ({
        id: p.id,
        handle: String(p.handle || "").toLowerCase().replace(/^@/, ""),
        nome: p.nome || null,
        dados: p as any,
        salvo_em: p.salvoEm || new Date().toISOString(),
      }));
      await supabase.from("crm_instagram_profiles").upsert(records, { onConflict: "handle" });
    } catch (err: any) {
      console.warn("[ServerDB] Erro ao salvar perfis instagram no Supabase:", err.message);
    }
  }

  await queueWrite((state) => {
    const existingHandles = new Set(
      state.instagramProfilesDb.map((p) => String(p.handle || "").toLowerCase().replace(/^@/, ""))
    );
    const uniqueNovos: InstagramProfile[] = [];

    for (const p of novos) {
      const clean = String(p.handle || "").toLowerCase().replace(/^@/, "");
      if (existingHandles.has(clean)) {
        duplicados++;
      } else {
        existingHandles.add(clean);
        uniqueNovos.push({
          ...p,
          salvoEm: p.salvoEm || new Date().toISOString(),
        });
        adicionados++;
      }
    }

    return {
      ...state,
      instagramProfilesDb: [...uniqueNovos, ...state.instagramProfilesDb],
    };
  });

  return { adicionados, duplicados };
}

export async function deleteInstagramProfile(id: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from("crm_instagram_profiles").delete().or(`id.eq.${id},handle.eq.${id}`);
    } catch (err: any) {
      console.warn("[ServerDB] Erro ao deletar perfil instagram no Supabase:", err.message);
    }
  }

  await queueWrite((state) => ({
    ...state,
    instagramProfilesDb: state.instagramProfilesDb.filter((p) => p.id !== id && p.handle !== id),
  }));
  return true;
}

export async function clearInstagramProfiles(): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from("crm_instagram_profiles").delete().neq("id", "___keep_none___");
    } catch (err: any) {
      console.warn("[ServerDB] Erro ao limpar perfis instagram no Supabase:", err.message);
    }
  }

  await queueWrite((state) => ({
    ...state,
    instagramProfilesDb: [],
  }));
}

export async function saveWeights(weights: ScoreWeights): Promise<ScoreWeights> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from("crm_configuracoes").upsert(
        {
          id: "global",
          weights: weights as any,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    } catch (err: any) {
      console.warn("[ServerDB] Erro ao salvar pesos no Supabase:", err.message);
    }
  }

  await queueWrite((state) => {
    const recomputedEmpresas = state.empresas.map((e) => ({
      ...e,
      score: calcularScore(e, weights).score,
    }));
    return {
      ...state,
      weights,
      empresas: recomputedEmpresas,
    };
  });
  return weights;
}

export async function saveComunicacaoSettings(
  partial: Partial<ComunicacaoSettings>
): Promise<ComunicacaoSettings> {
  let result = {
    email: DEFAULT_EMAIL_SETTINGS,
    whatsapp: DEFAULT_WHATSAPP_SETTINGS,
  };

  const currentState = memoryStateCache || (await getDbState());
  result = {
    email: { ...currentState.comunicacaoSettings.email, ...(partial.email || {}) },
    whatsapp: { ...currentState.comunicacaoSettings.whatsapp, ...(partial.whatsapp || {}) },
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from("crm_configuracoes").upsert(
        {
          id: "global",
          comunicacao_settings: result as any,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    } catch (err: any) {
      console.warn("[ServerDB] Erro ao salvar configurações de comunicação no Supabase:", err.message);
    }
  }

  await queueWrite((state) => ({
    ...state,
    comunicacaoSettings: result,
  }));

  return result;
}

export async function savePromptPadraoConfig(
  novoPrompt: string,
  motivo?: string,
  autor = "Configurações"
): Promise<PromptPadraoConfig> {
  const currentState = memoryStateCache || (await getDbState());
  const configAtual = currentState.promptPadraoConfig || getDefaultPromptPadraoConfig();
  const historicoAnterior = configAtual.historico || [];
  const maiorVersao = historicoAnterior.reduce((max, h) => Math.max(max, h.versao || 0), 0);
  const proximaVersao = maiorVersao + 1;
  const agora = new Date().toISOString();

  const novoItem: PromptPadraoHistoricoItem = {
    id: `v${proximaVersao}_${Date.now()}`,
    versao: proximaVersao,
    data: agora,
    prompt: novoPrompt.trim(),
    autor: autor,
    motivo: motivo?.trim() || `Atualização de versão ${proximaVersao}`,
    caracteres: novoPrompt.trim().length,
  };

  const updatedConfig: PromptPadraoConfig = {
    promptAtual: novoPrompt.trim(),
    atualizadoEm: agora,
    historico: [novoItem, ...historicoAnterior],
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const currentApiSettings = (currentState.apiSettings as any) || {};
      await supabase.from("crm_configuracoes").upsert(
        {
          id: "global",
          api_settings: {
            ...currentApiSettings,
            promptPadraoConfig: updatedConfig,
          } as any,
          updated_at: agora,
        },
        { onConflict: "id" }
      );
    } catch (err: any) {
      console.warn("[ServerDB] Erro ao salvar prompt padrao no Supabase:", err.message);
    }
  }

  await queueWrite((state) => ({
    ...state,
    promptPadraoConfig: updatedConfig,
  }));

  return updatedConfig;
}

export async function restaurarVersaoPromptPadrao(
  versaoId: string,
  motivo?: string
): Promise<PromptPadraoConfig> {
  const currentState = memoryStateCache || (await getDbState());
  const configAtual = currentState.promptPadraoConfig || getDefaultPromptPadraoConfig();
  const versaoDesejada = configAtual.historico.find((h) => h.id === versaoId);

  if (!versaoDesejada) {
    throw new Error(`Versão de histórico ${versaoId} não encontrada.`);
  }

  return await savePromptPadraoConfig(
    versaoDesejada.prompt,
    motivo || `Restauração da versão v${versaoDesejada.versao} (${versaoDesejada.motivo || "sem descrição"})`,
    "Restauração de Histórico"
  );
}

export async function savePromptConteudoConfig(
  novoPrompt: string,
  motivo?: string,
  autor = "Configurações"
): Promise<PromptConteudoConfig> {
  const currentState = memoryStateCache || (await getDbState());
  const configAtual = currentState.promptConteudoConfig || getDefaultPromptConteudoConfig();
  const historicoAnterior = configAtual.historico || [];
  const maiorVersao = historicoAnterior.reduce((max, h) => Math.max(max, h.versao || 0), 0);
  const proximaVersao = maiorVersao + 1;
  const agora = new Date().toISOString();

  const novoItem: PromptConteudoHistoricoItem = {
    id: `v${proximaVersao}_${Date.now()}`,
    versao: proximaVersao,
    data: agora,
    prompt: novoPrompt.trim(),
    autor: autor,
    motivo: motivo?.trim() || `Atualização de versão ${proximaVersao}`,
    caracteres: novoPrompt.trim().length,
  };

  const updatedConfig: PromptConteudoConfig = {
    promptAtual: novoPrompt.trim(),
    atualizadoEm: agora,
    historico: [novoItem, ...historicoAnterior],
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const currentApiSettings = (currentState.apiSettings as any) || {};
      await supabase.from("crm_configuracoes").upsert(
        {
          id: "global",
          api_settings: {
            ...currentApiSettings,
            promptConteudoConfig: updatedConfig,
          } as any,
          updated_at: agora,
        },
        { onConflict: "id" }
      );
    } catch (err: any) {
      console.warn("[ServerDB] Erro ao salvar prompt de conteúdo no Supabase:", err.message);
    }
  }

  await queueWrite((state) => ({
    ...state,
    promptConteudoConfig: updatedConfig,
  }));

  return updatedConfig;
}

export async function restaurarVersaoPromptConteudo(
  versaoId: string,
  motivo?: string
): Promise<PromptConteudoConfig> {
  const currentState = memoryStateCache || (await getDbState());
  const configAtual = currentState.promptConteudoConfig || getDefaultPromptConteudoConfig();
  const versaoDesejada = configAtual.historico.find((h) => h.id === versaoId);

  if (!versaoDesejada) {
    throw new Error(`Versão de histórico ${versaoId} não encontrada.`);
  }

  return await savePromptConteudoConfig(
    versaoDesejada.prompt,
    motivo || `Restauração da versão v${versaoDesejada.versao} (${versaoDesejada.motivo || "sem descrição"})`,
    "Restauração de Histórico"
  );
}

export async function resetDatabaseToDefaults(): Promise<CrmDatabaseState> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await Promise.all([
        supabase.from("crm_empresas").delete().neq("id", "___keep_none___"),
        supabase.from("crm_empresas_excluidas").delete().neq("id", "___keep_none___"),
        supabase.from("crm_instagram_profiles").delete().neq("id", "___keep_none___"),
        supabase.from("crm_configuracoes").upsert(
          {
            id: "global",
            weights: DEFAULT_WEIGHTS as any,
            comunicacao_settings: {
              email: DEFAULT_EMAIL_SETTINGS,
              whatsapp: DEFAULT_WHATSAPP_SETTINGS,
            } as any,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        ),
      ]);
    } catch (err: any) {
      console.warn("[ServerDB] Erro ao resetar banco Supabase:", err.message);
    }
  }

  const defaults = getDefaultState();
  await queueWrite(() => defaults);
  return defaults;
}

export async function getDatabaseInfo(): Promise<DatabaseInfo> {
  const supabase = getSupabaseClient();
  const hasSupabase = Boolean(supabase);

  const state = await getDbState();
  let fileSizeBytes = 0;
  try {
    const stat = await fs.stat(DB_FILE);
    fileSizeBytes = stat.size;
  } catch {
    fileSizeBytes = 0;
  }

  return {
    mode: hasSupabase ? "supabase" : "server_persistent",
    isSupabaseConfigured: hasSupabase,
    totalEmpresas: state.empresas.length,
    totalExcluidas: state.empresasExcluidas.length,
    totalInstagram: state.instagramProfilesDb.length,
    lastSaved: state.lastUpdated,
    storagePath: hasSupabase ? "Supabase PostgreSQL (Cloud - Sincronizado)" : DB_FILE,
    fileSizeBytes,
  };
}
