import fs from "node:fs/promises";
import path from "node:path";
import { EMPRESAS_INICIAIS, type Empresa } from "./mock-data";
import { DEFAULT_WEIGHTS, type ScoreWeights, calcularScore } from "./scoring";
import {
  DEFAULT_EMAIL_SETTINGS,
  DEFAULT_WHATSAPP_SETTINGS,
  type ComunicacaoSettings,
} from "./comunicacao-settings";
import { type ApiSettingsMap } from "./api-settings";

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

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "crm-database.json");
const DB_TMP_FILE = path.join(DATA_DIR, "crm-database.json.tmp");

let memoryStateCache: CrmDatabaseState | null = null;
let writeQueue = Promise.resolve();

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
  };
}

async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err: any) {
    if (err.code !== "EEXIST") throw err;
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
    };
  } catch (err: any) {
    if (err.code === "ENOENT") {
      const initial = getDefaultState();
      await writeToDisk(initial);
      return initial;
    }
    console.warn("Falha ao ler crm-database.json, usando padrão:", err.message);
    return getDefaultState();
  }
}

async function writeToDisk(state: CrmDatabaseState): Promise<void> {
  await ensureDataDir();
  const serialized = JSON.stringify(state, null, 2);
  await fs.writeFile(DB_TMP_FILE, serialized, "utf-8");
  await fs.rename(DB_TMP_FILE, DB_FILE);
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
// OPERAÇÕES DO BANCO DE DADOS
// -----------------------------------------------------------------------------

export async function getDbState(): Promise<CrmDatabaseState> {
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
  let saved: Empresa = empresa;
  await queueWrite((state) => {
    const existingIndex = state.empresas.findIndex((e) => e.id === empresa.id);
    const scoredEmpresa = {
      ...empresa,
      score: calcularScore(empresa, state.weights).score,
      updatedAt: new Date().toISOString(),
    };
    saved = scoredEmpresa;

    if (existingIndex >= 0) {
      const copy = [...state.empresas];
      copy[existingIndex] = scoredEmpresa;
      return { ...state, empresas: copy };
    } else {
      return { ...state, empresas: [scoredEmpresa, ...state.empresas] };
    }
  });
  return saved;
}

export async function saveAllEmpresas(empresasNovas: Empresa[], merge = true): Promise<Empresa[]> {
  let result: Empresa[] = [];
  await queueWrite((state) => {
    if (!merge) {
      result = empresasNovas.map((e) => ({
        ...e,
        score: calcularScore(e, state.weights).score,
      }));
      return { ...state, empresas: result };
    }

    const map = new Map<string, Empresa>();
    for (const e of state.empresas) {
      map.set(e.id, e);
    }
    for (const n of empresasNovas) {
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
  await queueWrite((state) => ({
    ...state,
    empresasExcluidas: state.empresasExcluidas.filter((ex) => ex.id !== id),
  }));
  return true;
}

export async function clearEmpresasExcluidas(): Promise<void> {
  await queueWrite((state) => ({
    ...state,
    empresasExcluidas: [],
  }));
}

export async function saveInstagramProfiles(novos: InstagramProfile[]): Promise<{ adicionados: number; duplicados: number }> {
  let adicionados = 0;
  let duplicados = 0;

  await queueWrite((state) => {
    const existingHandles = new Set(
      state.instagramProfilesDb.map((p) => p.handle.toLowerCase().replace(/^@/, "")),
    );
    const uniqueNovos: InstagramProfile[] = [];

    for (const p of novos) {
      const clean = p.handle.toLowerCase().replace(/^@/, "");
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
  await queueWrite((state) => ({
    ...state,
    instagramProfilesDb: state.instagramProfilesDb.filter((p) => p.id !== id && p.handle !== id),
  }));
  return true;
}

export async function clearInstagramProfiles(): Promise<void> {
  await queueWrite((state) => ({
    ...state,
    instagramProfilesDb: [],
  }));
}

export async function saveWeights(weights: ScoreWeights): Promise<ScoreWeights> {
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
  partial: Partial<ComunicacaoSettings>,
): Promise<ComunicacaoSettings> {
  let result = {
    email: DEFAULT_EMAIL_SETTINGS,
    whatsapp: DEFAULT_WHATSAPP_SETTINGS,
  };

  await queueWrite((state) => {
    result = {
      email: { ...state.comunicacaoSettings.email, ...(partial.email || {}) },
      whatsapp: { ...state.comunicacaoSettings.whatsapp, ...(partial.whatsapp || {}) },
    };
    return {
      ...state,
      comunicacaoSettings: result,
    };
  });

  return result;
}

export async function resetDatabaseToDefaults(): Promise<CrmDatabaseState> {
  const defaults = getDefaultState();
  await queueWrite(() => defaults);
  return defaults;
}

export async function getDatabaseInfo(): Promise<DatabaseInfo> {
  const state = await getDbState();
  let fileSizeBytes = 0;
  try {
    const stat = await fs.stat(DB_FILE);
    fileSizeBytes = stat.size;
  } catch {
    fileSizeBytes = 0;
  }

  const hasSupabase = Boolean(
    (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL) &&
    (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
  );

  return {
    mode: hasSupabase ? "supabase" : "server_persistent",
    isSupabaseConfigured: hasSupabase,
    totalEmpresas: state.empresas.length,
    totalExcluidas: state.empresasExcluidas.length,
    totalInstagram: state.instagramProfilesDb.length,
    lastSaved: state.lastUpdated,
    storagePath: DB_FILE,
    fileSizeBytes,
  };
}
