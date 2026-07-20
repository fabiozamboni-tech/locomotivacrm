import { Badge } from "@/components/ui/badge";
import type { CrmStage, StatusInstagram, StatusSite } from "@/lib/mock-data";
import { classificarScore } from "@/lib/scoring";
import { cn } from "@/lib/utils";

export function ScoreBadge({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const cls = classificarScore(score);
  const bg =
    cls.nivel === "quente"
      ? "bg-rose-500/15 text-rose-500 border-rose-500/30"
      : cls.nivel === "morno"
        ? "bg-amber-500/15 text-amber-500 border-amber-500/30"
        : cls.nivel === "frio"
          ? "bg-sky-500/15 text-sky-500 border-sky-500/30"
          : "bg-emerald-500/15 text-emerald-500 border-emerald-500/30";
  const s =
    size === "lg"
      ? "text-2xl font-bold px-3 py-1"
      : size === "sm"
        ? "text-xs px-1.5 py-0.5"
        : "text-sm px-2 py-0.5 font-semibold";
  return (
    <span className={cn("inline-flex items-center rounded-md border font-mono tabular-nums", bg, s)}>
      {score}
    </span>
  );
}

const SITE_LABELS: Record<StatusSite, { label: string; cls: string }> = {
  sem_site: { label: "Sem site", cls: "bg-rose-500/15 text-rose-500 border-rose-500/30" },
  desatualizado: { label: "Desatualizado", cls: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
  sem_ssl: { label: "Sem SSL", cls: "bg-orange-500/15 text-orange-500 border-orange-500/30" },
  nao_responsivo: { label: "Não responsivo", cls: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
  ok: { label: "OK", cls: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
};

const IG_LABELS: Record<StatusInstagram, { label: string; cls: string }> = {
  sem_perfil: { label: "Sem perfil", cls: "bg-rose-500/15 text-rose-500 border-rose-500/30" },
  parado: { label: "Parado", cls: "bg-rose-500/15 text-rose-500 border-rose-500/30" },
  irregular: { label: "Irregular", cls: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
  ativo: { label: "Ativo", cls: "bg-sky-500/15 text-sky-500 border-sky-500/30" },
  consistente: { label: "Consistente", cls: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
};

export function SiteBadge({ status }: { status: StatusSite }) {
  const s = SITE_LABELS[status];
  return <Badge variant="outline" className={cn("font-normal", s.cls)}>{s.label}</Badge>;
}

export function InstagramBadge({ status }: { status: StatusInstagram }) {
  const s = IG_LABELS[status];
  return <Badge variant="outline" className={cn("font-normal", s.cls)}>{s.label}</Badge>;
}

export const CRM_STAGE_LABEL: Record<CrmStage, string> = {
  identificado: "Identificado",
  analisado: "Analisado",
  contato_preparado: "Contato preparado",
  primeiro_contato: "Primeiro contato",
  aguardando_retorno: "Aguardando retorno",
  em_negociacao: "Em negociação",
  convertido: "Convertido",
  perdido: "Perdido",
  sem_fit: "Sem fit",
};

export const CRM_STAGES_ORDER: CrmStage[] = [
  "identificado",
  "analisado",
  "contato_preparado",
  "primeiro_contato",
  "aguardando_retorno",
  "em_negociacao",
  "convertido",
  "perdido",
  "sem_fit",
];
