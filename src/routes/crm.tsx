import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { CRM_STAGE_LABEL, CRM_STAGES_ORDER, ScoreBadge } from "@/components/badges";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/crm")({
  component: CrmPage,
});

function CrmPage() {
  const { empresas, setStage } = useStore();

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 space-y-5 max-w-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Funil de prospecção</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Arraste alterando a etapa via menu. Card mostra score e cidade para priorização.
        </p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4">
        {CRM_STAGES_ORDER.map((stage) => {
          const items = empresas.filter((e) => e.crmStage === stage);
          return (
            <div key={stage} className="w-72 shrink-0">
              <div className="flex items-center justify-between px-1 mb-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {CRM_STAGE_LABEL[stage]}
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">{items.length}</span>
              </div>
              <div className="space-y-2 min-h-[100px]">
                {items.map((e) => (
                  <Card key={e.id} className="p-3 border-border/60">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={"/empresas/$id" as never}
                        params={{ id: e.id } as never}
                        className="text-sm font-medium leading-tight hover:text-primary"
                      >
                        {e.nome}
                      </Link>
                      <ScoreBadge score={e.score} size="sm" />
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      {e.segmento} · {e.cidade}
                    </div>
                    <select
                      value={e.crmStage}
                      onChange={(ev) => setStage(e.id, ev.target.value as never)}
                      className="mt-2 w-full text-[11px] bg-muted/40 border border-border/60 rounded px-2 py-1"
                    >
                      {CRM_STAGES_ORDER.map((s) => (
                        <option key={s} value={s}>{CRM_STAGE_LABEL[s]}</option>
                      ))}
                    </select>
                  </Card>
                ))}
                {items.length === 0 && (
                  <div className="text-xs text-muted-foreground border border-dashed border-border/60 rounded-md p-4 text-center">
                    Vazio
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
