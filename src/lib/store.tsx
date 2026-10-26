import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from "react";
import { EMPRESAS_INICIAIS, EMPRESAS_DEMO, type CrmStage, type Empresa } from "./mock-data";
import { DEFAULT_WEIGHTS, calcularScore, type ScoreWeights } from "./scoring";
import {
  type KanbanColumnConfig,
  DEFAULT_KANBAN_COLUMNS,
  loadKanbanColumnsLocal,
  saveKanbanColumnsLocal,
  LS_KANBAN_COLUMNS,
} from "./kanban-config";
import { toast } from "sonner";
import {
  getDatabaseState_ServerFn,
  saveEmpresa_ServerFn,
  saveAllEmpresas_ServerFn,
  deleteEmpresa_ServerFn,
  saveEmpresaExcluida_ServerFn,
  deleteEmpresaExcluida_ServerFn,
  clearEmpresasExcluidas_ServerFn,
  saveInstagramProfiles_ServerFn,
  deleteInstagramProfile_ServerFn,
  clearInstagramProfiles_ServerFn,
  saveWeights_ServerFn,
  getDatabaseInfo_ServerFn,
  resetDatabase_ServerFn,
} from "./database.functions";
import type { DatabaseInfo } from "./server-db";

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

export type DbSyncStatus = "idle" | "syncing" | "synced" | "error";

interface StoreValue {
  empresas: Empresa[];
  empresasAtivas: Empresa[];
  empresasExcluidas: EmpresaExcluida[];
  instagramProfilesDb: InstagramProfile[];
  weights: ScoreWeights;
  setWeights: (w: ScoreWeights) => void;
  updateEmpresa: (id: string, patch: Partial<Empresa>) => void;
  setStage: (id: string, stage: CrmStage) => void;
  addHistorico: (id: string, item: Empresa["historico"][number]) => void;
  addEmpresa: (e: Empresa) => void;
  salvarInstagramProfiles: (novos: InstagramProfile[]) => { adicionados: number; duplicados: number };
  removerInstagramProfile: (id: string) => void;
  limparInstagramProfilesDb: () => void;
  excluirEmpresa: (item: {
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
  }) => void;
  restaurarEmpresaExcluida: (id: string) => void;
  limparExcluidos: () => void;
  isEmpresaExcluida: (item: {
    nome?: string;
    razaoSocial?: string;
    cnpj?: string;
    site?: string;
    placeId?: string;
    cidade?: string;
  }) => boolean;
  resetPlataforma: () => void;
  carregarDemo: () => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  // Colunas do Kanban
  kanbanColumns: KanbanColumnConfig[];
  setKanbanColumns: (cols: KanbanColumnConfig[]) => void;
  adicionarColunaKanban: (col: { titulo: string; cor?: string; oculto?: boolean }) => void;
  editarColunaKanban: (id: string, patch: Partial<KanbanColumnConfig>) => void;
  excluirColunaKanban: (id: string) => void;
  toggleOcultarColunaKanban: (id: string) => void;
  restaurarColunasPadrao: () => void;
  // Ações de Exclusão e Restauração de Empresas
  moverEmpresaParaExcluidos: (id: string) => void;
  restaurarEmpresaDeExcluidos: (id: string, stageDestino?: CrmStage) => void;
  excluirEmpresaDefinitivamente: (id: string) => void;
  reordenarEmpresas: (novasEmpresas: Empresa[]) => void;
  // Sincronização com o Banco de Dados
  dbSyncStatus: DbSyncStatus;
  lastSyncTime: Date | null;
  databaseInfo: DatabaseInfo | null;
  syncNow: () => Promise<void>;
}

const StoreCtx = createContext<StoreValue | null>(null);
const LS_KEY = "radar.empresas.v1";
const LS_WEIGHTS = "radar.weights.v1";
const LS_EXCLUIDOS = "radar.excluidos.v1";
const LS_INSTAGRAM_DB = "radar.instagram.db.v1";
const LS_THEME = "radar.theme.v1";

function cleanDigits(str?: string): string {
  if (!str) return "";
  return str.replace(/\D/g, "");
}

const GENERIC_DOMAINS = new Set([
  "instagram.com",
  "facebook.com",
  "linkedin.com",
  "twitter.com",
  "x.com",
  "wa.me",
  "api.whatsapp.com",
  "linktr.ee",
  "bio.link",
  "google.com",
  "maps.google.com",
  "goo.gl",
  "bit.ly",
]);

function cleanDomain(url?: string): string {
  if (!url) return "";
  try {
    const withoutProto = url.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
    return withoutProto.split("/")[0].split("?")[0].trim().toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

function cleanText(str?: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function recalcAll(list: Empresa[], w: ScoreWeights): Empresa[] {
  return list.map((e) => ({ ...e, score: calcularScore(e, w).score }));
}

function loadEmpresasLocal(): Empresa[] {
  if (typeof window === "undefined") return EMPRESAS_INICIAIS;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return EMPRESAS_INICIAIS;
    return JSON.parse(raw) as Empresa[];
  } catch {
    return EMPRESAS_INICIAIS;
  }
}

function loadExcluidosLocal(): EmpresaExcluida[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_EXCLUIDOS);
    if (!raw) return [];
    return JSON.parse(raw) as EmpresaExcluida[];
  } catch {
    return [];
  }
}

function loadInstagramDbLocal(): InstagramProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_INSTAGRAM_DB);
    if (!raw) return [];
    return JSON.parse(raw) as InstagramProfile[];
  } catch {
    return [];
  }
}

function loadWeightsLocal(): ScoreWeights {
  if (typeof window === "undefined") return DEFAULT_WEIGHTS;
  try {
    const raw = window.localStorage.getItem(LS_WEIGHTS);
    if (!raw) return DEFAULT_WEIGHTS;
    return { ...DEFAULT_WEIGHTS, ...(JSON.parse(raw) as Partial<ScoreWeights>) };
  } catch {
    return DEFAULT_WEIGHTS;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [weights, setWeightsState] = useState<ScoreWeights>(DEFAULT_WEIGHTS);
  const [empresas, setEmpresas] = useState<Empresa[]>(EMPRESAS_INICIAIS);
  const [empresasExcluidas, setEmpresasExcluidas] = useState<EmpresaExcluida[]>([]);
  const [instagramProfilesDb, setInstagramProfilesDb] = useState<InstagramProfile[]>([]);
  const [kanbanColumns, setKanbanColumnsState] = useState<KanbanColumnConfig[]>(DEFAULT_KANBAN_COLUMNS);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = window.localStorage.getItem(LS_THEME);
        if (saved === "light" || saved === "dark") return saved;
      } catch { /* noop */ }
    }
    return "light";
  });
  const [hydrated, setHydrated] = useState(false);
  const [dbSyncStatus, setDbSyncStatus] = useState<DbSyncStatus>("idle");
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null);

  // Sincronização centralizada com o banco
  const syncWithDatabase = useCallback(async () => {
    try {
      setDbSyncStatus("syncing");
      const [dbState, dbInfo] = await Promise.all([
        getDatabaseState_ServerFn(),
        getDatabaseInfo_ServerFn().catch(() => null),
      ]);

      if (dbState) {
        const localEmpresas = loadEmpresasLocal();
        const serverEmpresas = dbState.empresas || [];

        let finalEmpresas = serverEmpresas;

        // Se o banco na nuvem estiver vazio (primeiro acesso) e houver dados locais, migra para a nuvem
        if (serverEmpresas.length === 0 && localEmpresas.length > 0) {
          try {
            finalEmpresas = await saveAllEmpresas_ServerFn({
              data: { empresas: localEmpresas, merge: true },
            });
          } catch (migErr) {
            console.warn("Falha ao migrar empresas locais para a nuvem:", migErr);
            finalEmpresas = localEmpresas;
          }
        }

        const effectiveWeights = dbState.weights || DEFAULT_WEIGHTS;
        setWeightsState(effectiveWeights);
        setEmpresas(recalcAll(finalEmpresas, effectiveWeights));
        setEmpresasExcluidas(dbState.empresasExcluidas || []);
        setInstagramProfilesDb(dbState.instagramProfilesDb || []);

        // Atualiza cache offline do localStorage
        try {
          window.localStorage.setItem(LS_KEY, JSON.stringify(finalEmpresas));
          window.localStorage.setItem(LS_WEIGHTS, JSON.stringify(effectiveWeights));
          window.localStorage.setItem(LS_EXCLUIDOS, JSON.stringify(dbState.empresasExcluidas || []));
          window.localStorage.setItem(LS_INSTAGRAM_DB, JSON.stringify(dbState.instagramProfilesDb || []));
        } catch { /* noop */ }
      }

      if (dbInfo) {
        setDatabaseInfo(dbInfo);
      }

      setDbSyncStatus("synced");
      setLastSyncTime(new Date());
    } catch (err) {
      console.warn("Falha na sincronização com banco de dados, usando cache offline:", err);
      setDbSyncStatus("error");
    }
  }, []);

  // Hidratação inicial client-side (carrega rápido do localStorage e sincroniza em background com o banco)
  useEffect(() => {
    const w = loadWeightsLocal();
    setWeightsState(w);
    setEmpresas(recalcAll(loadEmpresasLocal(), w));
    setEmpresasExcluidas(loadExcluidosLocal());
    setInstagramProfilesDb(loadInstagramDbLocal());
    setKanbanColumnsState(loadKanbanColumnsLocal());
    setHydrated(true);

    // Carrega do banco de dados imediatamente
    syncWithDatabase();
  }, [syncWithDatabase]);

  // Sincronização automática ao focar na janela ou alternar de aba/navegador
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleFocus = () => {
      void syncWithDatabase();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        void syncWithDatabase();
      }
    });

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        void syncWithDatabase();
      }
    }, 30000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, [syncWithDatabase]);

  // Sincroniza com localStorage para resiliência offline contínua
  useEffect(() => {
    if (!hydrated) return;
    try { window.localStorage.setItem(LS_WEIGHTS, JSON.stringify(weights)); } catch { /* noop */ }
  }, [weights, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try { window.localStorage.setItem(LS_KEY, JSON.stringify(empresas)); } catch { /* noop */ }
  }, [empresas, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try { window.localStorage.setItem(LS_EXCLUIDOS, JSON.stringify(empresasExcluidas)); } catch { /* noop */ }
  }, [empresasExcluidas, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try { window.localStorage.setItem(LS_INSTAGRAM_DB, JSON.stringify(instagramProfilesDb)); } catch { /* noop */ }
  }, [instagramProfilesDb, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    saveKanbanColumnsLocal(kanbanColumns);
  }, [kanbanColumns, hydrated]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
    try { window.localStorage.setItem(LS_THEME, theme); } catch { /* noop */ }
  }, [theme]);

  const isEmpresaExcluida = useCallback((item: {
    nome?: string;
    razaoSocial?: string;
    cnpj?: string;
    site?: string;
    placeId?: string;
    cidade?: string;
  }): boolean => {
    if (!item) return false;
    const itemCnpj = cleanDigits(item.cnpj);
    const itemPlaceId = item.placeId?.trim();
    const itemDomain = cleanDomain(item.site);
    const itemNome = cleanText(item.nome);
    const itemRazao = cleanText(item.razaoSocial);
    const itemCidade = cleanText(item.cidade);

    return empresasExcluidas.some((ex) => {
      if (itemCnpj && ex.cnpj && itemCnpj === cleanDigits(ex.cnpj)) return true;
      if (itemPlaceId && ex.placeId && itemPlaceId === ex.placeId.trim()) return true;
      if (
        itemDomain &&
        ex.site &&
        !GENERIC_DOMAINS.has(itemDomain) &&
        itemDomain === cleanDomain(ex.site)
      ) {
        return true;
      }
      const exNome = cleanText(ex.nome);
      const exRazao = cleanText(ex.razaoSocial);
      const exCidade = cleanText(ex.cidade);

      const matchNome =
        (itemNome && (itemNome === exNome || (exRazao && itemNome === exRazao))) ||
        (itemRazao && (itemRazao === exNome || (exRazao && itemRazao === exRazao)));

      if (matchNome) {
        if (itemCidade && exCidade) return itemCidade === exCidade;
        return true;
      }

      return false;
    });
  }, [empresasExcluidas]);

  const excluirEmpresa = useCallback((item: {
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
  }) => {
    const id =
      item.placeId ||
      (item.cnpj ? `cnpj-${cleanDigits(item.cnpj)}` : `ex-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);

    const novo: EmpresaExcluida = {
      id,
      nome: item.nome,
      razaoSocial: item.razaoSocial,
      cnpj: item.cnpj,
      cidade: item.cidade,
      estado: item.estado,
      segmento: item.segmento,
      site: item.site,
      telefone: item.telefone,
      placeId: item.placeId,
      origem: item.origem,
      excluidoEm: new Date().toISOString(),
    };

    setEmpresasExcluidas((prev) => {
      if (
        prev.some(
          (e) =>
            e.id === id ||
            (item.cnpj && e.cnpj && cleanDigits(e.cnpj) === cleanDigits(item.cnpj)) ||
            (item.placeId && e.placeId && e.placeId === item.placeId),
        )
      ) {
        return prev;
      }
      return [novo, ...prev];
    });

    // Despacha gravação assíncrona no banco de dados
    setDbSyncStatus("syncing");
    saveEmpresaExcluida_ServerFn({ data: novo })
      .then(() => {
        setDbSyncStatus("synced");
        setLastSyncTime(new Date());
      })
      .catch((err) => {
        console.error("Erro ao salvar exclusao no banco:", err);
        setDbSyncStatus("error");
      });
  }, []);

  const restaurarEmpresaExcluida = useCallback((id: string) => {
    setEmpresasExcluidas((prev) => prev.filter((e) => e.id !== id));
    deleteEmpresaExcluida_ServerFn({ data: { id } }).catch((err) =>
      console.error("Erro ao restaurar excluida no banco:", err),
    );
  }, []);

  const limparExcluidos = useCallback(() => {
    setEmpresasExcluidas([]);
    try { window.localStorage.removeItem(LS_EXCLUIDOS); } catch { /* noop */ }
    clearEmpresasExcluidas_ServerFn().catch((err) =>
      console.error("Erro ao limpar excluidos no banco:", err),
    );
  }, []);

  const salvarInstagramProfiles = useCallback((
    novos: InstagramProfile[],
  ): { adicionados: number; duplicados: number } => {
    let adicionados = 0;
    let duplicados = 0;
    const uniqueNovos: InstagramProfile[] = [];

    setInstagramProfilesDb((prev) => {
      const existingHandles = new Set(prev.map((p) => String(p.handle || "").toLowerCase().replace(/^@/, "")));

      for (const p of novos) {
        const cleanHandle = String(p.handle || "").toLowerCase().replace(/^@/, "");
        if (existingHandles.has(cleanHandle)) {
          duplicados++;
        } else {
          existingHandles.add(cleanHandle);
          const item = {
            ...p,
            salvoEm: p.salvoEm || new Date().toISOString(),
          };
          uniqueNovos.push(item);
          adicionados++;
        }
      }

      return [...uniqueNovos, ...prev];
    });

    if (uniqueNovos.length > 0) {
      setDbSyncStatus("syncing");
      saveInstagramProfiles_ServerFn({ data: uniqueNovos })
        .then(() => {
          setDbSyncStatus("synced");
          setLastSyncTime(new Date());
        })
        .catch((err) => {
          console.error("Erro ao salvar perfis Instagram no banco:", err);
          setDbSyncStatus("error");
        });
    }

    return { adicionados, duplicados };
  }, []);

  const removerInstagramProfile = useCallback((id: string) => {
    setInstagramProfilesDb((prev) => prev.filter((p) => p.id !== id && p.handle !== id));
    deleteInstagramProfile_ServerFn({ data: { id } }).catch((err) =>
      console.error("Erro ao remover perfil Instagram no banco:", err),
    );
  }, []);

  const limparInstagramProfilesDb = useCallback(() => {
    setInstagramProfilesDb([]);
    try { window.localStorage.removeItem(LS_INSTAGRAM_DB); } catch { /* noop */ }
    clearInstagramProfiles_ServerFn().catch((err) =>
      console.error("Erro ao limpar perfis Instagram no banco:", err),
    );
  }, []);

  const updateEmpresa = useCallback((id: string, patch: Partial<Empresa>) => {
    let updatedEmpresa: Empresa | null = null;
    setEmpresas((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          const updated = {
            ...e,
            ...patch,
            score: calcularScore({ ...e, ...patch }, weights).score,
          };
          updatedEmpresa = updated;
          return updated;
        }
        return e;
      }),
    );

    if (updatedEmpresa) {
      setDbSyncStatus("syncing");
      saveEmpresa_ServerFn({ data: updatedEmpresa })
        .then(() => {
          setDbSyncStatus("synced");
          setLastSyncTime(new Date());
        })
        .catch((err) => {
          console.error("Erro ao salvar empresa no banco:", err);
          setDbSyncStatus("error");
        });
    }
  }, [weights]);

  const setStage = useCallback((id: string, stage: CrmStage) => {
    let updatedEmpresa: Empresa | null = null;
    setEmpresas((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          const updated = { ...e, crmStage: stage };
          updatedEmpresa = updated;
          return updated;
        }
        return e;
      }),
    );

    if (updatedEmpresa) {
      setDbSyncStatus("syncing");
      saveEmpresa_ServerFn({ data: updatedEmpresa })
        .then(() => {
          setDbSyncStatus("synced");
          setLastSyncTime(new Date());
        })
        .catch((err) => {
          console.error("Erro ao atualizar stage no banco:", err);
          setDbSyncStatus("error");
        });
    }
  }, []);

  const addHistorico = useCallback((id: string, item: Empresa["historico"][number]) => {
    let updatedEmpresa: Empresa | null = null;
    setEmpresas((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          const updated = { ...e, historico: [item, ...e.historico] };
          updatedEmpresa = updated;
          return updated;
        }
        return e;
      }),
    );

    if (updatedEmpresa) {
      setDbSyncStatus("syncing");
      saveEmpresa_ServerFn({ data: updatedEmpresa })
        .then(() => {
          setDbSyncStatus("synced");
          setLastSyncTime(new Date());
        })
        .catch((err) => {
          console.error("Erro ao registrar historico no banco:", err);
          setDbSyncStatus("error");
        });
    }
  }, []);

  const addEmpresa = useCallback((e: Empresa) => {
    const scored = { ...e, score: calcularScore(e, weights).score };
    setEmpresas((prev) => [scored, ...prev]);

    setDbSyncStatus("syncing");
    saveEmpresa_ServerFn({ data: scored })
      .then(() => {
        setDbSyncStatus("synced");
        setLastSyncTime(new Date());
      })
      .catch((err) => {
        console.error("Erro ao inserir empresa no banco:", err);
        setDbSyncStatus("error");
      });
  }, [weights]);

  const setWeights = useCallback((w: ScoreWeights) => {
    setWeightsState(w);
    setEmpresas((prev) => recalcAll(prev, w));
    setDbSyncStatus("syncing");
    saveWeights_ServerFn({ data: w })
      .then(() => {
        setDbSyncStatus("synced");
        setLastSyncTime(new Date());
      })
      .catch((err) => {
        console.error("Erro ao salvar pesos no banco:", err);
        setDbSyncStatus("error");
      });
  }, []);

  const resetPlataforma = useCallback(() => {
    setEmpresas([]);
    try { window.localStorage.removeItem(LS_KEY); } catch { /* noop */ }
    resetDatabase_ServerFn()
      .then((defState) => {
        setEmpresas(defState.empresas || []);
        setWeightsState(defState.weights || DEFAULT_WEIGHTS);
        setEmpresasExcluidas([]);
        setInstagramProfilesDb([]);
        setDbSyncStatus("synced");
        setLastSyncTime(new Date());
      })
      .catch((err) => console.error("Erro ao resetar banco:", err));
  }, []);

  const carregarDemo = useCallback(() => {
    const demo = recalcAll(EMPRESAS_DEMO, weights);
    setEmpresas(demo);
    setDbSyncStatus("syncing");
    saveAllEmpresas_ServerFn({ data: { empresas: demo, merge: false } })
      .then(() => {
        setDbSyncStatus("synced");
        setLastSyncTime(new Date());
      })
      .catch((err) => {
        console.error("Erro ao carregar demo no banco:", err);
        setDbSyncStatus("error");
      });
  }, [weights]);

  const setKanbanColumns = useCallback((cols: KanbanColumnConfig[]) => {
    setKanbanColumnsState(cols);
    saveKanbanColumnsLocal(cols);
  }, []);

  const adicionarColunaKanban = useCallback((nova: { titulo: string; cor?: string; oculto?: boolean }) => {
    const slug = nova.titulo
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "_")
      .slice(0, 30);
    const id = `col_${slug || Date.now()}`;
    const col: KanbanColumnConfig = {
      id,
      titulo: nova.titulo.trim(),
      cor: nova.cor || "slate",
      oculto: Boolean(nova.oculto),
      sistema: false,
    };

    setKanbanColumnsState((prev) => {
      const excluidosIndex = prev.findIndex((c) => c.id === "excluidos");
      let next: KanbanColumnConfig[];
      if (excluidosIndex >= 0) {
        next = [...prev.slice(0, excluidosIndex), col, ...prev.slice(excluidosIndex)];
      } else {
        next = [...prev, col];
      }
      saveKanbanColumnsLocal(next);
      return next;
    });
  }, []);

  const editarColunaKanban = useCallback((id: string, patch: Partial<KanbanColumnConfig>) => {
    setKanbanColumnsState((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...patch } : c));
      saveKanbanColumnsLocal(next);
      return next;
    });
  }, []);

  const excluirColunaKanban = useCallback((id: string) => {
    if (id === "excluidos") {
      toast.error("A coluna Excluídos é nativa do sistema e não pode ser removida.");
      return;
    }
    setKanbanColumnsState((prev) => {
      const next = prev.filter((c) => c.id !== id);
      saveKanbanColumnsLocal(next);
      return next;
    });
    // Realoca empresas que estavam nesta coluna para 'identificado'
    setEmpresas((prev) =>
      prev.map((e) => (e.crmStage === id ? { ...e, crmStage: "identificado" } : e)),
    );
  }, []);

  const toggleOcultarColunaKanban = useCallback((id: string) => {
    setKanbanColumnsState((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, oculto: !c.oculto } : c));
      saveKanbanColumnsLocal(next);
      return next;
    });
  }, []);

  const restaurarColunasPadrao = useCallback(() => {
    setKanbanColumnsState(DEFAULT_KANBAN_COLUMNS);
    saveKanbanColumnsLocal(DEFAULT_KANBAN_COLUMNS);
  }, []);

  const moverEmpresaParaExcluidos = useCallback((id: string) => {
    let updatedEmpresa: Empresa | null = null;
    setEmpresas((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          const updated: Empresa = {
            ...e,
            crmStage: "excluidos",
            historico: [
              {
                data: new Date().toISOString(),
                tipo: "nota",
                texto: "Empresa movida para a lista de excluídos e funil correspondente.",
              },
              ...e.historico,
            ],
          };
          updatedEmpresa = updated;
          return updated;
        }
        return e;
      }),
    );

    if (updatedEmpresa) {
      const emp = updatedEmpresa as Empresa;
      setDbSyncStatus("syncing");
      saveEmpresa_ServerFn({ data: emp })
        .then(() => {
          setDbSyncStatus("synced");
          setLastSyncTime(new Date());
        })
        .catch((err) => {
          console.error("Erro ao mover empresa para excluidos no banco:", err);
          setDbSyncStatus("error");
        });

      excluirEmpresa({
        nome: emp.nome,
        cnpj: emp.cnpj,
        cidade: emp.cidade,
        segmento: emp.segmento,
        site: emp.site,
        telefone: emp.telefone,
        origem: emp.origem,
      });
    }
  }, [excluirEmpresa]);

  const restaurarEmpresaDeExcluidos = useCallback((id: string, stageDestino: CrmStage = "identificado") => {
    let updatedEmpresa: Empresa | null = null;
    setEmpresas((prev) =>
      prev.map((e) => {
        if (e.id === id) {
          const updated: Empresa = {
            ...e,
            crmStage: stageDestino,
            historico: [
              {
                data: new Date().toISOString(),
                tipo: "nota",
                texto: `Empresa restaurada para a lista ativa (etapa "${stageDestino}").`,
              },
              ...e.historico,
            ],
          };
          updatedEmpresa = updated;
          return updated;
        }
        return e;
      }),
    );

    if (updatedEmpresa) {
      const emp = updatedEmpresa as Empresa;
      setDbSyncStatus("syncing");
      saveEmpresa_ServerFn({ data: emp })
        .then(() => {
          setDbSyncStatus("synced");
          setLastSyncTime(new Date());
        })
        .catch((err) => {
          console.error("Erro ao restaurar empresa no banco:", err);
          setDbSyncStatus("error");
        });

      // Remove de empresasExcluidas caso exista
      setEmpresasExcluidas((prev) =>
        prev.filter((ex) => {
          if (emp.cnpj && ex.cnpj && cleanDigits(emp.cnpj) === cleanDigits(ex.cnpj)) return false;
          if (cleanText(ex.nome) === cleanText(emp.nome)) return false;
          return true;
        }),
      );
    }
  }, []);

  const excluirEmpresaDefinitivamente = useCallback((id: string) => {
    setEmpresas((prev) => prev.filter((e) => e.id !== id));
    setDbSyncStatus("syncing");
    deleteEmpresa_ServerFn({ data: { id } })
      .then(() => {
        setDbSyncStatus("synced");
        setLastSyncTime(new Date());
      })
      .catch((err) => {
        console.error("Erro ao excluir empresa definitivamente do banco:", err);
        setDbSyncStatus("error");
      });
  }, []);

  const reordenarEmpresas = useCallback((novasEmpresas: Empresa[]) => {
    setEmpresas(novasEmpresas);
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(novasEmpresas));
    } catch {
      /* noop */
    }
    setDbSyncStatus("syncing");
    saveAllEmpresas_ServerFn({ data: { empresas: novasEmpresas, merge: false } })
      .then(() => {
        setDbSyncStatus("synced");
        setLastSyncTime(new Date());
      })
      .catch((err) => {
        console.error("Erro ao persistir nova ordem de empresas no banco:", err);
        setDbSyncStatus("error");
      });
  }, []);

  const empresasAtivas = useMemo(
    () =>
      empresas.filter(
        (e) =>
          e.crmStage !== "excluidos" &&
          e.crmStage !== "perdido" &&
          e.crmStage !== "sem_fit" &&
          !isEmpresaExcluida(e),
      ),
    [empresas, isEmpresaExcluida],
  );

  const value = useMemo<StoreValue>(
    () => ({
      empresas,
      empresasAtivas,
      empresasExcluidas,
      instagramProfilesDb,
      weights,
      setWeights,
      theme,
      toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
      updateEmpresa,
      setStage,
      addHistorico,
      addEmpresa,
      salvarInstagramProfiles,
      removerInstagramProfile,
      limparInstagramProfilesDb,
      excluirEmpresa,
      restaurarEmpresaExcluida,
      limparExcluidos,
      isEmpresaExcluida,
      resetPlataforma,
      carregarDemo,
      kanbanColumns,
      setKanbanColumns,
      adicionarColunaKanban,
      editarColunaKanban,
      excluirColunaKanban,
      toggleOcultarColunaKanban,
      restaurarColunasPadrao,
      moverEmpresaParaExcluidos,
      restaurarEmpresaDeExcluidos,
      excluirEmpresaDefinitivamente,
      reordenarEmpresas,
      dbSyncStatus,
      lastSyncTime,
      databaseInfo,
      syncNow: syncWithDatabase,
    }),
    [
      empresas,
      empresasAtivas,
      empresasExcluidas,
      instagramProfilesDb,
      kanbanColumns,
      weights,
      theme,
      dbSyncStatus,
      lastSyncTime,
      databaseInfo,
      syncWithDatabase,
      updateEmpresa,
      setStage,
      addHistorico,
      addEmpresa,
      salvarInstagramProfiles,
      removerInstagramProfile,
      limparInstagramProfilesDb,
      excluirEmpresa,
      restaurarEmpresaExcluida,
      limparExcluidos,
      isEmpresaExcluida,
      resetPlataforma,
      carregarDemo,
      setWeights,
      setKanbanColumns,
      adicionarColunaKanban,
      editarColunaKanban,
      excluirColunaKanban,
      toggleOcultarColunaKanban,
      restaurarColunasPadrao,
      moverEmpresaParaExcluidos,
      restaurarEmpresaDeExcluidos,
      excluirEmpresaDefinitivamente,
      reordenarEmpresas,
    ],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const s = useContext(StoreCtx);
  if (!s) throw new Error("useStore must be used within StoreProvider");
  return s;
}
