import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Globe,
  Instagram,
  MapPin,
  Sparkles,
  GripVertical,
  Flame,
  SlidersHorizontal,
  EyeOff,
  CheckCheck,
} from "lucide-react";
import { TimingRadarCard } from "@/components/timing-radar-card";
import { CopilotoObjecoesModal } from "@/components/copiloto-objecoes-modal";
import { CadenciaModal } from "@/components/cadencia-modal";
import { EnviarEmailModal } from "@/components/enviar-email-modal";
import { EnviarWhatsAppModal } from "@/components/enviar-whatsapp-modal";
import { PromptsModal } from "@/components/prompts-modal";
import { GerenciarColunasModal } from "@/components/crm/gerenciar-colunas-modal";
import { type KanbanColumnConfig, getKanbanColorPreset } from "@/lib/kanban-config";
import { EmpresaLogo } from "@/components/empresa-logo";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useStore } from "@/lib/store";
import {
  CRM_STAGE_LABEL,
  CRM_STAGES_ORDER,
  ScoreBadge,
  SiteBadge,
  InstagramBadge,
} from "@/components/badges";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { instagramUrl, siteUrl, googleMapsUrl } from "@/lib/links";
import type { Empresa, CrmStage } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/crm")({
  component: CrmPage,
  head: () => ({
    meta: [
      { title: "Funil CRM · Radar de Presença Digital" },
      {
        name: "description",
        content:
          "Kanban de prospecção com cards enxutos, links diretos e histórico de abordagens por empresa.",
      },
    ],
  }),
});



function CrmPage() {
  const {
    empresas,
    setStage,
    kanbanColumns,
    adicionarColunaKanban,
    editarColunaKanban,
    excluirColunaKanban,
    toggleOcultarColunaKanban,
    restaurarColunasPadrao,
  } = useStore();
  const navigate = useNavigate();
  const [promptsId, setPromptsId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const [openGerenciarColunas, setOpenGerenciarColunas] = useState(false);

  // Módulos Estratégicos
  const [showRadar, setShowRadar] = useState(false);
  const [cadenciaEmpresaId, setCadenciaEmpresaId] = useState<string | null>(null);
  const [copilotoEmpresaId, setCopilotoEmpresaId] = useState<string | null>(null);
  const [emailEmpresaId, setEmailEmpresaId] = useState<string | null>(null);
  const [whatsEmpresaId, setWhatsEmpresaId] = useState<string | null>(null);

  const promptsEmpresa = useMemo(
    () => empresas.find((e) => e.id === promptsId) ?? null,
    [empresas, promptsId],
  );
  const draggingEmpresa = useMemo(
    () => empresas.find((e) => e.id === draggingId) ?? null,
    [empresas, draggingId],
  );
  const cadenciaEmpresa = useMemo(
    () => empresas.find((e) => e.id === cadenciaEmpresaId) ?? null,
    [empresas, cadenciaEmpresaId],
  );
  const copilotoEmpresa = useMemo(
    () => empresas.find((e) => e.id === copilotoEmpresaId) ?? null,
    [empresas, copilotoEmpresaId],
  );
  const emailEmpresa = useMemo(
    () => empresas.find((e) => e.id === emailEmpresaId) ?? null,
    [empresas, emailEmpresaId],
  );
  const whatsEmpresa = useMemo(
    () => empresas.find((e) => e.id === whatsEmpresaId) ?? null,
    [empresas, whatsEmpresaId],
  );

  const colunasVisiveis = useMemo(
    () => (kanbanColumns || []).filter((c) => !c.oculto),
    [kanbanColumns],
  );
  const colunasOcultasCount = useMemo(
    () => (kanbanColumns || []).filter((c) => c.oculto).length,
    [kanbanColumns],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Empresa[]>();
    (kanbanColumns || []).forEach((c) => map.set(c.id, []));
    empresas.forEach((e) => {
      const list = map.get(e.crmStage);
      if (list) {
        list.push(e);
      } else {
        if (!map.has(e.crmStage)) {
          map.set(e.crmStage, []);
        }
        map.get(e.crmStage)?.push(e);
      }
    });
    return map;
  }, [empresas, kanbanColumns]);

  const cardCountByStage = useMemo(() => {
    const counts: Record<string, number> = {};
    empresas.forEach((e) => {
      counts[e.crmStage] = (counts[e.crmStage] || 0) + 1;
    });
    return counts;
  }, [empresas]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const handleDragStart = (ev: DragStartEvent) => {
    setDraggingId(String(ev.active.id));
  };
  const handleDragEnd = (ev: DragEndEvent) => {
    const id = String(ev.active.id);
    const over = ev.over?.id ? String(ev.over.id) : null;
    setDraggingId(null);
    setOverStage(null);
    if (!over) return;
    const stage = over as CrmStage;
    const validColumn = (kanbanColumns || []).some((c) => c.id === stage);
    if (!validColumn && !CRM_STAGES_ORDER.includes(stage)) return;
    const empresa = empresas.find((e) => e.id === id);
    if (empresa && empresa.crmStage !== stage) setStage(id, stage);
  };

  const totalAtivas = useMemo(
    () => empresas.filter((e) => e.crmStage !== "excluidos").length,
    [empresas],
  );

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 space-y-5 max-w-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Funil de prospecção</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kanban comercial — arraste os cards entre etapas ou acesse a Análise do Cliente.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
          {/* Botão Gerenciar Colunas */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpenGerenciarColunas(true)}
            className="h-8 text-xs gap-1.5"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Gerenciar Colunas
            {colunasOcultasCount > 0 && (
              <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-0.5 font-normal">
                {colunasOcultasCount} oculta{colunasOcultasCount > 1 ? "s" : ""}
              </Badge>
            )}
          </Button>

          {/* Toggle do Radar de Timing Perfeito (Módulo 4) */}
          <Button
            variant={showRadar ? "default" : "outline"}
            size="sm"
            onClick={() => setShowRadar(!showRadar)}
            className="h-8 text-xs gap-1.5 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
          >
            <Flame className="h-3.5 w-3.5" />
            {showRadar ? "Ocultar Radar de Timing" : "🔥 Radar de Timing & Sinais de Compra"}
          </Button>

          <span className="inline-flex items-center gap-1 ml-2">
            <span className="size-2 rounded-full bg-primary" /> {totalAtivas} empresas ativas
          </span>
        </div>
      </div>

      {/* Módulo 4: Radar de Timing Perfeito & Sinais de Compra */}
      {showRadar && (
        <TimingRadarCard
          onSelectEmpresa={(id) => navigate({ to: "/analise-cliente", search: { empresa: id } })}
          onOpenCadencia={(id) => setCadenciaEmpresaId(id)}
        />
      )}

      {empresas.length === 0 ? (
        <Card className="p-10 text-center border-dashed">
          <p className="text-sm text-muted-foreground">
            Nenhuma empresa no funil ainda. Adicione via <Link to="/importar" className="text-primary underline">Importar</Link>.
          </p>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={(ev) => setOverStage(ev.over?.id ? String(ev.over.id) : null)}
          onDragCancel={() => {
            setDraggingId(null);
            setOverStage(null);
          }}
        >
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:-mx-8 md:px-8">
            {colunasVisiveis.map((col) => {
              const items = grouped.get(col.id) ?? [];
              return (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  items={items}
                  isOver={overStage === col.id}
                  onPrompts={setPromptsId}
                  onChangeStage={setStage}
                  onToggleOcultar={() => toggleOcultarColunaKanban(col.id)}
                  allColumns={kanbanColumns}
                />
              );
            })}
          </div>
          <DragOverlay>
            {draggingEmpresa ? (
              <div className="w-[284px] rotate-2 opacity-95">
                <KanbanCard
                  empresa={draggingEmpresa}
                  onPrompts={() => {}}
                  onChangeStage={() => {}}
                  columns={kanbanColumns}
                  overlay
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <GerenciarColunasModal
        open={openGerenciarColunas}
        onOpenChange={setOpenGerenciarColunas}
        columns={kanbanColumns}
        cardCountByStage={cardCountByStage}
        onAddColumn={adicionarColunaKanban}
        onEditColumn={editarColunaKanban}
        onDeleteColumn={excluirColunaKanban}
        onToggleHide={toggleOcultarColunaKanban}
        onResetDefault={restaurarColunasPadrao}
      />

      <PromptsModal
        empresa={promptsEmpresa}
        open={!!promptsEmpresa}
        onOpenChange={(o) => !o && setPromptsId(null)}
      />

      {/* Modais Globais de Cadência e Copiloto */}
      <CadenciaModal
        empresa={cadenciaEmpresa || undefined}
        open={!!cadenciaEmpresa}
        onOpenChange={(o) => !o && setCadenciaEmpresaId(null)}
      />
      <CopilotoObjecoesModal
        empresa={copilotoEmpresa || undefined}
        open={!!copilotoEmpresa}
        onOpenChange={(o) => !o && setCopilotoEmpresaId(null)}
      />

      {/* Modais de Disparo Direto de E-mail e WhatsApp */}
      <EnviarEmailModal
        empresa={emailEmpresa || undefined}
        open={!!emailEmpresa}
        onOpenChange={(o) => !o && setEmailEmpresaId(null)}
      />
      <EnviarWhatsAppModal
        empresa={whatsEmpresa || undefined}
        open={!!whatsEmpresa}
        onOpenChange={(o) => !o && setWhatsEmpresaId(null)}
      />
    </div>
  );
}

function KanbanColumn({
  column,
  items,
  isOver,
  onPrompts,
  onChangeStage,
  onToggleOcultar,
  allColumns,
}: {
  column: KanbanColumnConfig;
  items: Empresa[];
  isOver: boolean;
  onPrompts: (id: string) => void;
  onChangeStage: (id: string, s: CrmStage) => void;
  onToggleOcultar: () => void;
  allColumns: KanbanColumnConfig[];
}) {
  const { setNodeRef } = useDroppable({ id: column.id });
  const preset = getKanbanColorPreset(column.cor);

  return (
    <div className="w-[300px] shrink-0">
      <div
        className={cn(
          "rounded-t-lg border-t border-x bg-gradient-to-b px-3 py-2.5 flex items-center justify-between group/col",
          preset.accentClass,
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={cn("size-2 rounded-full shrink-0", preset.bgClass)} />
          <span className="text-[11px] font-semibold uppercase tracking-wider truncate" title={column.titulo}>
            {column.titulo}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onToggleOcultar}
            title="Ocultar esta coluna do Kanban"
            className="opacity-0 group-hover/col:opacity-100 transition-opacity p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground"
          >
            <EyeOff className="size-3" />
          </button>
          <Badge variant="secondary" className="text-[10px] h-5 px-1.5 tabular-nums">
            {items.length}
          </Badge>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "rounded-b-lg border-b border-x border-border/60 bg-muted/20 p-2 space-y-2 min-h-[140px] transition-colors",
          isOver && "bg-primary/10 border-primary/50",
        )}
      >
        {items.map((e) => (
          <KanbanCard
            key={e.id}
            empresa={e}
            onPrompts={() => onPrompts(e.id)}
            onChangeStage={(s) => onChangeStage(e.id, s)}
            columns={allColumns}
          />
        ))}
        {items.length === 0 && (
          <div className="text-xs text-muted-foreground/70 border border-dashed border-border/50 rounded-md p-4 text-center">
            {isOver ? "Solte aqui" : "Vazio"}
          </div>
        )}
      </div>
    </div>
  );
}

function KanbanCard({
  empresa,
  onPrompts,
  onChangeStage,
  columns,
  overlay,
}: {
  empresa: Empresa;
  onPrompts?: () => void;
  onChangeStage: (s: CrmStage) => void;
  columns?: KanbanColumnConfig[];
  overlay?: boolean;
}) {
  const site = siteUrl(empresa.site);
  const ig = instagramUrl(empresa.instagram);
  const maps = googleMapsUrl(`${empresa.nome} ${empresa.cidade}`);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: empresa.id,
    disabled: overlay,
  });

  return (
    <Card
      ref={overlay ? undefined : setNodeRef}
      className={cn(
        "group p-3 border-border/60 hover:border-primary/40 hover:shadow-md transition-all bg-card",
        isDragging && !overlay && "opacity-40",
        overlay && "shadow-2xl border-primary/50 ring-2 ring-primary/30",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          {...(overlay ? {} : attributes)}
          {...(overlay ? {} : listeners)}
          title="Arraste para mover"
          className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-primary -ml-1 mt-0.5"
          onClick={(e) => e.preventDefault()}
        >
          <GripVertical className="size-4" />
        </button>
        <EmpresaLogo site={empresa.site} nome={empresa.nome} size="xs" />
        <Link
          to="/analise-cliente"
          search={{ empresa: empresa.id }}
          className="text-sm font-semibold leading-tight text-left hover:text-primary line-clamp-2 flex-1"
        >
          {empresa.nome}
        </Link>
        <ScoreBadge score={empresa.score} size="sm" />
      </div>
      <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
        <MapPin className="size-3 shrink-0" />
        <span className="truncate">{empresa.segmento} · {empresa.cidade}</span>
      </div>

      <div className="flex flex-wrap gap-1 mt-2">
        <SiteBadge status={empresa.statusSite} />
        <InstagramBadge status={empresa.statusInstagram} />
        {empresa.whatsappStatus === "enviado" && (
          <span
            className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400"
            title={
              empresa.whatsappUltimoEnvio
                ? `WhatsApp enviado em ${new Date(empresa.whatsappUltimoEnvio).toLocaleDateString("pt-BR")} às ${new Date(empresa.whatsappUltimoEnvio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
                : "WhatsApp enviado"
            }
          >
            <CheckCheck className="size-2.5" /> WhatsApp Enviado
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 mt-3">
        <IconLink href={site} title="Site" disabled={!site}>
          <Globe className="size-3.5" />
        </IconLink>
        <IconLink href={ig} title="Instagram" disabled={!ig}>
          <Instagram className="size-3.5" />
        </IconLink>
        <IconLink href={maps} title="Google Maps">
          <MapPin className="size-3.5" />
        </IconLink>
        <div className="flex-1" />
        <Button
          size="sm"
          variant="secondary"
          className="h-7 px-2.5 text-[11px] gap-1"
          asChild
        >
          <Link to="/analise-cliente" search={{ empresa: empresa.id }}>
            <Sparkles className="size-3" /> Análise do Cliente
          </Link>
        </Button>
      </div>

      <Select
        value={empresa.crmStage}
        onValueChange={(v) => onChangeStage(v as CrmStage)}
      >
        <SelectTrigger className="mt-2 h-7 text-[11px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(columns && columns.length > 0
            ? columns
            : CRM_STAGES_ORDER.map((s) => ({ id: s, titulo: CRM_STAGE_LABEL[s] || s }))
          ).map((c) => (
            <SelectItem key={c.id} value={c.id} className="text-xs">
              {c.titulo}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Card>
  );
}


function IconLink({
  href,
  title,
  disabled,
  children,
}: {
  href?: string;
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  if (!href || disabled) {
    return (
      <span
        title={`${title} indisponível`}
        className="inline-flex size-7 items-center justify-center rounded-md border border-border/40 text-muted-foreground/40 cursor-not-allowed"
      >
        {children}
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      className="inline-flex size-7 items-center justify-center rounded-md border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
    >
      {children}
    </a>
  );
}
