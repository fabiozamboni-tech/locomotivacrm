import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { EMPRESAS_INICIAIS, type CrmStage, type Empresa } from "./mock-data";
import { DEFAULT_WEIGHTS, calcularScore, type ScoreWeights } from "./scoring";

interface StoreValue {
  empresas: Empresa[];
  weights: ScoreWeights;
  setWeights: (w: ScoreWeights) => void;
  updateEmpresa: (id: string, patch: Partial<Empresa>) => void;
  setStage: (id: string, stage: CrmStage) => void;
  addHistorico: (id: string, item: Empresa["historico"][number]) => void;
  addEmpresa: (e: Empresa) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const StoreCtx = createContext<StoreValue | null>(null);

function recalcAll(list: Empresa[], w: ScoreWeights): Empresa[] {
  return list.map((e) => ({ ...e, score: calcularScore(e, w).score }));
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [weights, setWeights] = useState<ScoreWeights>(DEFAULT_WEIGHTS);
  const [empresas, setEmpresas] = useState<Empresa[]>(() =>
    recalcAll(EMPRESAS_INICIAIS, DEFAULT_WEIGHTS),
  );
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    setEmpresas((prev) => recalcAll(prev, weights));
  }, [weights]);

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
