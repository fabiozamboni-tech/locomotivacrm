import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { EMPRESAS_INICIAIS, EMPRESAS_DEMO, type CrmStage, type Empresa } from "./mock-data";
import { DEFAULT_WEIGHTS, calcularScore, type ScoreWeights } from "./scoring";

interface StoreValue {
  empresas: Empresa[];
  weights: ScoreWeights;
  setWeights: (w: ScoreWeights) => void;
  updateEmpresa: (id: string, patch: Partial<Empresa>) => void;
  setStage: (id: string, stage: CrmStage) => void;
  addHistorico: (id: string, item: Empresa["historico"][number]) => void;
  addEmpresa: (e: Empresa) => void;
  resetPlataforma: () => void;
  carregarDemo: () => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const StoreCtx = createContext<StoreValue | null>(null);
const LS_KEY = "radar.empresas.v1";
const LS_WEIGHTS = "radar.weights.v1";

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
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [hydrated, setHydrated] = useState(false);

  // Hidratação client-side (evita mismatch SSR)
  useEffect(() => {
    const w = loadWeights();
    setWeights(w);
    setEmpresas(recalcAll(loadEmpresas(), w));
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
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
  }, [theme]);

  const value = useMemo<StoreValue>(
    () => ({
      empresas,
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
      resetPlataforma: () => {
        setEmpresas([]);
        try { window.localStorage.removeItem(LS_KEY); } catch { /* noop */ }
      },
      carregarDemo: () => setEmpresas(recalcAll(EMPRESAS_DEMO, weights)),
    }),
    [empresas, weights, theme],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const s = useContext(StoreCtx);
  if (!s) throw new Error("useStore must be used within StoreProvider");
  return s;
}
