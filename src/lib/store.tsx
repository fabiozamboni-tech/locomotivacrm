import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { EMPRESAS_INICIAIS, EMPRESAS_DEMO, type CrmStage, type Empresa } from "./mock-data";
import { DEFAULT_WEIGHTS, calcularScore, type ScoreWeights } from "./scoring";

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

interface StoreValue {
  empresas: Empresa[];
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
}

const StoreCtx = createContext<StoreValue | null>(null);
const LS_KEY = "radar.empresas.v1";
const LS_WEIGHTS = "radar.weights.v1";
const LS_EXCLUIDOS = "radar.excluidos.v1";
const LS_INSTAGRAM_DB = "radar.instagram.db.v1";

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

function loadEmpresas(): Empresa[] {
  if (typeof window === "undefined") return EMPRESAS_INICIAIS;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return EMPRESAS_INICIAIS;
    return JSON.parse(raw) as Empresa[];
  } catch {
    return EMPRESAS_INICIAIS;
  }
}

function loadExcluidos(): EmpresaExcluida[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_EXCLUIDOS);
    if (!raw) return [];
    return JSON.parse(raw) as EmpresaExcluida[];
  } catch {
    return [];
  }
}

function loadInstagramDb(): InstagramProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_INSTAGRAM_DB);
    if (!raw) return [];
    return JSON.parse(raw) as InstagramProfile[];
  } catch {
    return [];
  }
}

function loadWeights(): ScoreWeights {
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
  const [weights, setWeights] = useState<ScoreWeights>(DEFAULT_WEIGHTS);
  const [empresas, setEmpresas] = useState<Empresa[]>(EMPRESAS_INICIAIS);
  const [empresasExcluidas, setEmpresasExcluidas] = useState<EmpresaExcluida[]>([]);
  const [instagramProfilesDb, setInstagramProfilesDb] = useState<InstagramProfile[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [hydrated, setHydrated] = useState(false);

  // Hidratação client-side (evita mismatch SSR)
  useEffect(() => {
    const w = loadWeights();
    setWeights(w);
    setEmpresas(recalcAll(loadEmpresas(), w));
    setEmpresasExcluidas(loadExcluidos());
    setInstagramProfilesDb(loadInstagramDb());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setEmpresas((prev) => recalcAll(prev, weights));
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
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
  }, [theme]);

  const isEmpresaExcluida = (item: {
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
      // 1. Match por CNPJ
      if (itemCnpj && ex.cnpj && itemCnpj === cleanDigits(ex.cnpj)) {
        return true;
      }
      // 2. Match por Place ID
      if (itemPlaceId && ex.placeId && itemPlaceId === ex.placeId.trim()) {
        return true;
      }
      // 3. Match por Domínio do Site (se não for domínio genérico)
      if (
        itemDomain &&
        ex.site &&
        !GENERIC_DOMAINS.has(itemDomain) &&
        itemDomain === cleanDomain(ex.site)
      ) {
        return true;
      }
      // 4. Match por Nome + Cidade (ou Razão Social)
      const exNome = cleanText(ex.nome);
      const exRazao = cleanText(ex.razaoSocial);
      const exCidade = cleanText(ex.cidade);

      const matchNome =
        (itemNome && (itemNome === exNome || (exRazao && itemNome === exRazao))) ||
        (itemRazao && (itemRazao === exNome || (exRazao && itemRazao === exRazao)));

      if (matchNome) {
        if (itemCidade && exCidade) {
          return itemCidade === exCidade;
        }
        return true;
      }

      return false;
    });
  };

  const excluirEmpresa = (item: {
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
      return [novo, ...prev];
    });
  };

  const restaurarEmpresaExcluida = (id: string) => {
    setEmpresasExcluidas((prev) => prev.filter((e) => e.id !== id));
  };

  const limparExcluidos = () => {
    setEmpresasExcluidas([]);
    try { window.localStorage.removeItem(LS_EXCLUIDOS); } catch { /* noop */ }
  };

  const salvarInstagramProfiles = (
    novos: InstagramProfile[],
  ): { adicionados: number; duplicados: number } => {
    let adicionados = 0;
    let duplicados = 0;

    setInstagramProfilesDb((prev) => {
      const existingHandles = new Set(prev.map((p) => p.handle.toLowerCase().replace(/^@/, "")));
      const uniqueNovos: InstagramProfile[] = [];

      for (const p of novos) {
        const cleanHandle = p.handle.toLowerCase().replace(/^@/, "");
        if (existingHandles.has(cleanHandle)) {
          duplicados++;
        } else {
          existingHandles.add(cleanHandle);
          uniqueNovos.push({
            ...p,
            salvoEm: p.salvoEm || new Date().toISOString(),
          });
          adicionados++;
        }
      }

      return [...uniqueNovos, ...prev];
    });

    return { adicionados, duplicados };
  };

  const removerInstagramProfile = (id: string) => {
    setInstagramProfilesDb((prev) => prev.filter((p) => p.id !== id && p.handle !== id));
  };

  const limparInstagramProfilesDb = () => {
    setInstagramProfilesDb([]);
    try { window.localStorage.removeItem(LS_INSTAGRAM_DB); } catch { /* noop */ }
  };

  const value = useMemo<StoreValue>(
    () => ({
      empresas,
      empresasExcluidas,
      instagramProfilesDb,
      weights,
      setWeights,
      theme,
      toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
      updateEmpresa: (id, patch) =>
        setEmpresas((prev) =>
          prev.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        ),
      setStage: (id, stage) =>
        setEmpresas((prev) =>
          prev.map((e) => (e.id === id ? { ...e, crmStage: stage } : e)),
        ),
      addHistorico: (id, item) =>
        setEmpresas((prev) =>
          prev.map((e) =>
            e.id === id ? { ...e, historico: [item, ...e.historico] } : e,
          ),
        ),
      addEmpresa: (e) => setEmpresas((prev) => [{ ...e, score: calcularScore(e, weights).score }, ...prev]),
      salvarInstagramProfiles,
      removerInstagramProfile,
      limparInstagramProfilesDb,
      excluirEmpresa,
      restaurarEmpresaExcluida,
      limparExcluidos,
      isEmpresaExcluida,
      resetPlataforma: () => {
        setEmpresas([]);
        try { window.localStorage.removeItem(LS_KEY); } catch { /* noop */ }
      },
      carregarDemo: () => setEmpresas(recalcAll(EMPRESAS_DEMO, weights)),
    }),
    [empresas, empresasExcluidas, instagramProfilesDb, weights, theme],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const s = useContext(StoreCtx);
  if (!s) throw new Error("useStore must be used within StoreProvider");
  return s;
}
