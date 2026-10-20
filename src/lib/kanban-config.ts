import type { CrmStage } from "./mock-data";

export interface KanbanColumnConfig {
  id: string;
  titulo: string;
  cor: "slate" | "sky" | "indigo" | "violet" | "purple" | "amber" | "orange" | "emerald" | "teal" | "rose" | "red" | "zinc" | string;
  oculto: boolean;
  sistema?: boolean; // colunas nativas do sistema
}

export const DEFAULT_KANBAN_COLUMNS: KanbanColumnConfig[] = [
  { id: "identificado", titulo: "Identificado", cor: "slate", oculto: false, sistema: true },
  { id: "analisado", titulo: "Analisado", cor: "sky", oculto: false, sistema: true },
  { id: "contato_preparado", titulo: "Contato preparado", cor: "indigo", oculto: false, sistema: true },
  { id: "primeiro_contato", titulo: "Primeiro contato", cor: "violet", oculto: false, sistema: true },
  { id: "aguardando_retorno", titulo: "Aguardando retorno", cor: "amber", oculto: false, sistema: true },
  { id: "em_negociacao", titulo: "Em negociação", cor: "orange", oculto: false, sistema: true },
  { id: "convertido", titulo: "Convertido", cor: "emerald", oculto: false, sistema: true },
  { id: "perdido", titulo: "Perdido", cor: "rose", oculto: false, sistema: true },
  { id: "sem_fit", titulo: "Sem fit", cor: "zinc", oculto: false, sistema: true },
  { id: "excluidos", titulo: "Excluídos", cor: "red", oculto: true, sistema: true },
];

export interface ColorPreset {
  key: string;
  label: string;
  bgClass: string;
  borderClass: string;
  accentClass: string;
  badgeClass: string;
  textClass: string;
}

export const KANBAN_COLORS_PRESETS: ColorPreset[] = [
  { key: "slate", label: "Cinza", bgClass: "bg-slate-500", borderClass: "border-slate-500/30", accentClass: "from-slate-500/40 to-slate-500/0 border-slate-500/30", badgeClass: "bg-slate-500/10 text-slate-600 border-slate-500/30", textClass: "text-slate-600 dark:text-slate-400" },
  { key: "sky", label: "Azul Claro", bgClass: "bg-sky-500", borderClass: "border-sky-500/30", accentClass: "from-sky-500/40 to-sky-500/0 border-sky-500/30", badgeClass: "bg-sky-500/10 text-sky-600 border-sky-500/30", textClass: "text-sky-600 dark:text-sky-400" },
  { key: "indigo", label: "Índigo", bgClass: "bg-indigo-500", borderClass: "border-indigo-500/30", accentClass: "from-indigo-500/40 to-indigo-500/0 border-indigo-500/30", badgeClass: "bg-indigo-500/10 text-indigo-600 border-indigo-500/30", textClass: "text-indigo-600 dark:text-indigo-400" },
  { key: "violet", label: "Violeta", bgClass: "bg-violet-500", borderClass: "border-violet-500/30", accentClass: "from-violet-500/40 to-violet-500/0 border-violet-500/30", badgeClass: "bg-violet-500/10 text-violet-600 border-violet-500/30", textClass: "text-violet-600 dark:text-violet-400" },
  { key: "purple", label: "Roxo", bgClass: "bg-purple-500", borderClass: "border-purple-500/30", accentClass: "from-purple-500/40 to-purple-500/0 border-purple-500/30", badgeClass: "bg-purple-500/10 text-purple-600 border-purple-500/30", textClass: "text-purple-600 dark:text-purple-400" },
  { key: "amber", label: "Âmbar", bgClass: "bg-amber-500", borderClass: "border-amber-500/30", accentClass: "from-amber-500/40 to-amber-500/0 border-amber-500/30", badgeClass: "bg-amber-500/10 text-amber-600 border-amber-500/30", textClass: "text-amber-600 dark:text-amber-400" },
  { key: "orange", label: "Laranja", bgClass: "bg-orange-500", borderClass: "border-orange-500/30", accentClass: "from-orange-500/40 to-orange-500/0 border-orange-500/30", badgeClass: "bg-orange-500/10 text-orange-600 border-orange-500/30", textClass: "text-orange-600 dark:text-orange-400" },
  { key: "emerald", label: "Verde Esmeralda", bgClass: "bg-emerald-500", borderClass: "border-emerald-500/30", accentClass: "from-emerald-500/40 to-emerald-500/0 border-emerald-500/30", badgeClass: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30", textClass: "text-emerald-600 dark:text-emerald-400" },
  { key: "teal", label: "Verde Água (Teal)", bgClass: "bg-teal-500", borderClass: "border-teal-500/30", accentClass: "from-teal-500/40 to-teal-500/0 border-teal-500/30", badgeClass: "bg-teal-500/10 text-teal-600 border-teal-500/30", textClass: "text-teal-600 dark:text-teal-400" },
  { key: "rose", label: "Rosa", bgClass: "bg-rose-500", borderClass: "border-rose-500/30", accentClass: "from-rose-500/40 to-rose-500/0 border-rose-500/30", badgeClass: "bg-rose-500/10 text-rose-600 border-rose-500/30", textClass: "text-rose-600 dark:text-rose-400" },
  { key: "red", label: "Vermelho", bgClass: "bg-red-500", borderClass: "border-red-500/30", accentClass: "from-red-500/40 to-red-500/0 border-red-500/30", badgeClass: "bg-red-500/10 text-red-600 border-red-500/30", textClass: "text-red-600 dark:text-red-400" },
  { key: "zinc", label: "Neutro (Zinc)", bgClass: "bg-zinc-500", borderClass: "border-zinc-500/30", accentClass: "from-zinc-500/40 to-zinc-500/0 border-zinc-500/30", badgeClass: "bg-zinc-500/10 text-zinc-600 border-zinc-500/30", textClass: "text-zinc-600 dark:text-zinc-400" },
];

export function getKanbanColorPreset(cor?: string): ColorPreset {
  return KANBAN_COLORS_PRESETS.find((c) => c.key === cor) || KANBAN_COLORS_PRESETS[0];
}

export const LS_KANBAN_COLUMNS = "radar.kanban.columns.v1";

export function loadKanbanColumnsLocal(): KanbanColumnConfig[] {
  if (typeof window === "undefined") return DEFAULT_KANBAN_COLUMNS;
  try {
    const raw = window.localStorage.getItem(LS_KANBAN_COLUMNS);
    if (!raw) return DEFAULT_KANBAN_COLUMNS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_KANBAN_COLUMNS;

    // Garante que a coluna "excluidos" existe (requisito: oculta por padrão)
    const hasExcluidos = parsed.some((c: any) => c.id === "excluidos");
    if (!hasExcluidos) {
      parsed.push({ id: "excluidos", titulo: "Excluídos", cor: "red", oculto: true, sistema: true });
    }
    return parsed;
  } catch {
    return DEFAULT_KANBAN_COLUMNS;
  }
}

export function saveKanbanColumnsLocal(cols: KanbanColumnConfig[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KANBAN_COLUMNS, JSON.stringify(cols));
  } catch {
    // noop
  }
}
