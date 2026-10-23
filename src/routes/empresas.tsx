import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { CIDADES_RS_FOCO, SEGMENTOS, type Empresa, type CrmStage } from "@/lib/mock-data";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ScoreBadge,
  SiteBadge,
  InstagramBadge,
  CRM_STAGES_ORDER,
  getCrmStageLabel,
} from "@/components/badges";
import {
  Globe,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Zap,
  ArrowUpRight,
  GripVertical,
  Edit3,
  Building2,
  Trash2,
  RotateCcw,
  Copy,
} from "lucide-react";
import {
  siteUrl,
  instagramUrl,
  whatsappUrl,
  telUrl,
  mailUrl,
  googleMapsUrl,
} from "@/lib/links";
import { EmpresaCadastroModal } from "@/components/empresa-cadastro-modal";
import { EmpresaLogo } from "@/components/empresa-logo";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { getKanbanColorPreset, type KanbanColumnConfig } from "@/lib/kanban-config";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export const Route = createFileRoute("/empresas")({
  component: EmpresasPage,
});

type Filtros = {
  q: string;
  cidade: string;
  etapaKanban: string;
  segmento: string;
  scoreMin: number;
  soSemSite: boolean;
  soSiteProblema: boolean;
  soIgParado: boolean;
  comTelefone: boolean;
  comWhats: boolean;
  comEmail: boolean;
};

const INITIAL: Filtros = {
  q: "",
  cidade: "todas",
  etapaKanban: "todas",
  segmento: "todos",
  scoreMin: 0,
  soSemSite: false,
  soSiteProblema: false,
  soIgParado: false,
  comTelefone: false,
  comWhats: false,
  comEmail: false,
};

function filtrar(list: Empresa[], f: Filtros): Empresa[] {
  return list.filter((e) => {
    if (f.q && !`${e.nome} ${e.segmento} ${e.cidade}`.toLowerCase().includes(f.q.toLowerCase()))
      return false;
    if (f.cidade !== "todas" && e.cidade !== f.cidade) return false;
    if (f.etapaKanban !== "todas" && e.crmStage !== f.etapaKanban) return false;
    if (f.segmento !== "todos" && e.segmento !== f.segmento) return false;
    if (e.score < f.scoreMin) return false;
    if (f.soSemSite && e.statusSite !== "sem_site") return false;
    if (
      f.soSiteProblema &&
      !["desatualizado", "sem_ssl", "nao_responsivo"].includes(e.statusSite)
    )
      return false;
    if (f.soIgParado && !["parado", "sem_perfil"].includes(e.statusInstagram)) return false;
    if (f.comTelefone && !e.telefone) return false;
    if (f.comWhats && !e.whatsapp) return false;
    if (f.comEmail && !e.email) return false;
    return true;
  });
}

interface SortableRowProps {
  empresa: Empresa;
  aba: "ativas" | "excluidas";
  kanbanColumns: KanbanColumnConfig[];
  onChangeStage: (empresaId: string, novoStage: CrmStage) => void;
  onEditCadastro: (empresa: Empresa) => void;
  onMoverExcluidos: (id: string, nome: string) => void;
  onRestaurar: (id: string, nome: string) => void;
  onExcluirDefinitivo: (id: string, nome: string) => void;
  isDragDisabled?: boolean;
}

function SortableEmpresaRow({
  empresa: e,
  aba,
  kanbanColumns,
  onChangeStage,
  onEditCadastro,
  onMoverExcluidos,
  onRestaurar,
  onExcluirDefinitivo,
  isDragDisabled,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: e.id,
    disabled: isDragDisabled,
  });

  const style: React.CSSProperties = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: isDragging ? "relative" : undefined,
    opacity: isDragging ? 0.6 : 1,
  };

  const colAtual = kanbanColumns.find((c) => c.id === e.crmStage);
  const preset = getKanbanColorPreset(colAtual?.cor);

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        "border-t border-border/50 hover:bg-accent/30 transition group",
        isDragging && "bg-accent/50 shadow-md"
      )}
    >
      {/* Nome da Empresa - Fixo na rolagem horizontal */}
      <td className="py-3 px-3 sticky left-0 z-10 bg-card group-hover:bg-accent/40 transition-colors border-r border-border/60 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] min-w-[280px]">
        <div className="flex items-center gap-2">
          {!isDragDisabled && (
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-muted-foreground/40 hover:text-foreground hover:bg-muted rounded transition-colors touch-none"
              title="Arraste para reordenar"
              aria-label="Reordenar empresa"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
          <EmpresaLogo site={e.site} nome={e.nome} size="sm" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onEditCadastro(e)}
                className="font-medium text-left hover:text-primary transition-colors flex items-center gap-1 group/btn cursor-pointer truncate"
                title="Clique para abrir e editar o cadastro da empresa"
              >
                <span className="group-hover/btn:underline truncate">{e.nome}</span>
                <Edit3 className="h-3 w-3 text-muted-foreground opacity-60 group-hover/btn:opacity-100 shrink-0" />
              </button>
              <Link
                to={"/empresas/$id" as never}
                params={{ id: e.id } as never}
                className="text-muted-foreground hover:text-foreground p-0.5 rounded hover:bg-muted shrink-0"
                title="Abrir página completa com auditoria"
              >
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <span className="truncate">{e.segmento}</span>
              {e.areaAtuacao && (
                <span
                  className="text-[11px] text-primary/80 font-normal truncate max-w-[180px]"
                  title={e.areaAtuacao}
                >
                  · {e.areaAtuacao}
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Cidade */}
      <td className="py-3 px-2">
        <div className="flex items-center gap-1 text-muted-foreground text-xs whitespace-nowrap">
          <MapPin className="h-3 w-3" /> {e.cidade}
        </div>
      </td>

      {/* COMBO DA ETAPA KANBAN COM CORES */}
      <td className="py-3 px-2">
        <Select
          value={e.crmStage}
          onValueChange={(v) => onChangeStage(e.id, v as CrmStage)}
        >
          <SelectTrigger
            className={cn(
              "h-7 text-xs w-[170px] font-medium border transition-colors shadow-2xs gap-1.5",
              preset.badgeClass
            )}
          >
            <span className={cn("h-2 w-2 rounded-full shrink-0", preset.bgClass)} />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(kanbanColumns && kanbanColumns.length > 0
              ? kanbanColumns
              : CRM_STAGES_ORDER.map((stage) => ({
                  id: stage,
                  titulo: getCrmStageLabel(stage),
                  cor: "slate",
                }))
            ).map((col) => {
              const colPreset = getKanbanColorPreset(col.cor);
              return (
                <SelectItem key={col.id} value={col.id} className="text-xs">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full shrink-0", colPreset.bgClass)} />
                    <span className={cn("font-medium", colPreset.textClass)}>
                      {col.titulo}
                    </span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </td>

      {/* Telefones de Contato */}
      <td className="py-3 px-2 min-w-[170px]">
        {(() => {
          const hasWhats = !!e.whatsapp;
          const hasTel = !!e.telefone;
          const mesmoNumero = Boolean(
            e.whatsapp &&
            e.telefone &&
            e.whatsapp.replace(/\D/g, "") === e.telefone.replace(/\D/g, "")
          );

          const copiarTel = (tel: string, ev: React.MouseEvent) => {
            ev.preventDefault();
            ev.stopPropagation();
            navigator.clipboard.writeText(tel);
            toast.success(`Telefone ${tel} copiado!`);
          };

          if (!hasWhats && !hasTel) {
            return (
              <span className="text-[11px] text-muted-foreground/50 italic">
                Sem telefone
              </span>
            );
          }

          if (mesmoNumero) {
            return (
              <div className="flex items-center gap-1.5 group/tel">
                <a
                  href={whatsappUrl(e.whatsapp!)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-foreground hover:text-emerald-600 transition-colors"
                  title="WhatsApp e Ligação (mesmo número)"
                >
                  <MessageCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span className="font-mono text-[11px] font-medium">{e.whatsapp}</span>
                </a>
                <button
                  type="button"
                  onClick={(ev) => copiarTel(e.whatsapp!, ev)}
                  className="opacity-0 group-hover/tel:opacity-100 p-0.5 rounded text-muted-foreground hover:text-foreground transition-opacity"
                  title="Copiar telefone"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
            );
          }

          return (
            <div className="flex flex-col gap-1">
              {hasWhats && (
                <div className="flex items-center gap-1.5 group/whats">
                  <a
                    href={whatsappUrl(e.whatsapp!)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-foreground hover:text-emerald-600 transition-colors"
                    title={`Abrir WhatsApp: ${e.whatsapp}`}
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span className="font-mono text-[11px] font-medium">{e.whatsapp}</span>
                  </a>
                  <button
                    type="button"
                    onClick={(ev) => copiarTel(e.whatsapp!, ev)}
                    className="opacity-0 group-hover/whats:opacity-100 p-0.5 rounded text-muted-foreground hover:text-foreground transition-opacity"
                    title="Copiar WhatsApp"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              )}
              {hasTel && (
                <div className="flex items-center gap-1.5 group/fixo">
                  <a
                    href={telUrl(e.telefone!)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                    title={`Ligar: ${e.telefone}`}
                  >
                    <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="font-mono text-[11px]">{e.telefone}</span>
                  </a>
                  <button
                    type="button"
                    onClick={(ev) => copiarTel(e.telefone!, ev)}
                    className="opacity-0 group-hover/fixo:opacity-100 p-0.5 rounded text-muted-foreground hover:text-foreground transition-opacity"
                    title="Copiar telefone fixo"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          );
        })()}
      </td>

      {/* Contatos */}
      <td className="py-3 px-2">
        <div className="flex gap-1.5 text-muted-foreground">
          {e.telefone && (
            <a
              href={telUrl(e.telefone)}
              title={`Ligar para ${e.telefone}`}
              className="hover:text-primary p-1 rounded hover:bg-muted"
            >
              <Phone className="h-3.5 w-3.5" aria-label="telefone" />
            </a>
          )}
          {e.whatsapp && (
            <a
              href={whatsappUrl(e.whatsapp)}
              target="_blank"
              rel="noopener noreferrer"
              title={`WhatsApp ${e.whatsapp}`}
              className="text-emerald-500 hover:opacity-80 p-1 rounded hover:bg-muted"
            >
              <MessageCircle className="h-3.5 w-3.5" aria-label="whatsapp" />
            </a>
          )}
          {e.email && (
            <a
              href={mailUrl(e.email)}
              title={e.email}
              className="hover:text-primary p-1 rounded hover:bg-muted"
            >
              <Mail className="h-3.5 w-3.5" aria-label="email" />
            </a>
          )}
          {e.site && (
            <a
              href={siteUrl(e.site)}
              target="_blank"
              rel="noopener noreferrer"
              title={e.site}
              className="hover:text-primary p-1 rounded hover:bg-muted"
            >
              <Globe className="h-3.5 w-3.5" aria-label="site" />
            </a>
          )}
          {e.instagram && (
            <a
              href={instagramUrl(e.instagram)}
              target="_blank"
              rel="noopener noreferrer"
              title={e.instagram}
              className="hover:text-primary p-1 rounded hover:bg-muted"
            >
              <Instagram className="h-3.5 w-3.5" aria-label="instagram" />
            </a>
          )}
          <a
            href={googleMapsUrl(`${e.nome} ${e.cidade}`)}
            target="_blank"
            rel="noopener noreferrer"
            title="Ver no Google Maps"
            className="hover:text-primary p-1 rounded hover:bg-muted"
          >
            <MapPin className="h-3.5 w-3.5" aria-label="google maps" />
          </a>
        </div>
      </td>

      {/* Badges de Site e Instagram */}
      <td className="py-3 px-2"><SiteBadge status={e.statusSite} /></td>
      <td className="py-3 px-2"><InstagramBadge status={e.statusInstagram} /></td>

      {/* Score */}
      <td className="py-3 px-2"><ScoreBadge score={e.score} size="sm" /></td>

      {/* AÇÕES ESTRATÉGICAS: CADASTRO, ABORDAGEM & EXCLUIR */}
      <td className="py-3 px-4 text-right">
        <div className="flex items-center justify-end gap-1.5">
          {aba === "ativas" ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEditCadastro(e)}
                className="h-7 text-xs px-2 gap-1 text-blue-600 border-blue-500/30 hover:bg-blue-500/10"
                title="Abrir e Editar Cadastro da Empresa"
              >
                <Building2 className="h-3 w-3 text-blue-500" />
                Cadastro
              </Button>

              <Button
                asChild
                size="sm"
                className="h-7 text-xs px-2.5 gap-1 bg-gradient-to-r from-emerald-600 to-primary text-white"
                title="Abrir Central de Abordagens e Dossiê 360"
              >
                <Link to="/analise-cliente" search={{ empresa: e.id, tab: "dossier" }}>
                  <Zap className="h-3 w-3" />
                  Analisar
                </Link>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onMoverExcluidos(e.id, e.nome)}
                className="h-7 text-xs px-2 gap-1 text-rose-600 border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-600"
                title="Excluir da lista ativa e mover para a coluna Excluídos do Kanban"
              >
                <Trash2 className="h-3 w-3 text-rose-500" />
                Excluir
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRestaurar(e.id, e.nome)}
                className="h-7 text-xs px-2.5 gap-1 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                title="Restaurar para a lista de empresas ativas"
              >
                <RotateCcw className="h-3 w-3 text-emerald-500" />
                Restaurar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onExcluirDefinitivo(e.id, e.nome)}
                className="h-7 text-xs px-2 gap-1 bg-rose-600 hover:bg-rose-700 text-white"
                title="Excluir permanentemente do banco de dados"
              >
                <Trash2 className="h-3 w-3" />
                Excluir Definitivo
              </Button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function EmpresasPage() {
  const {
    empresas,
    setStage,
    kanbanColumns,
    moverEmpresaParaExcluidos,
    restaurarEmpresaDeExcluidos,
    excluirEmpresaDefinitivamente,
    reordenarEmpresas,
  } = useStore();
  const [f, setF] = useState<Filtros>(INITIAL);
  const [aba, setAba] = useState<"ativas" | "excluidas">("ativas");
  const [empresaCadastro, setEmpresaCadastro] = useState<Empresa | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const empresasAtivas = useMemo(
    () => empresas.filter((e) => e.crmStage !== "excluidos"),
    [empresas],
  );
  const empresasExcluidas = useMemo(
    () => empresas.filter((e) => e.crmStage === "excluidos"),
    [empresas],
  );

  const listaBase = aba === "ativas" ? empresasAtivas : empresasExcluidas;
  const filtradas = useMemo(() => filtrar(listaBase, f), [listaBase, f]);
  const set = <K extends keyof Filtros>(k: K, v: Filtros[K]) => setF((p) => ({ ...p, [k]: v }));

  const cidadesDisponiveis = useMemo(() => {
    const cidadesSet = new Set<string>();
    CIDADES_RS_FOCO.forEach((c) => cidadesSet.add(c));
    empresas.forEach((e) => {
      if (e.cidade && e.cidade.trim()) {
        cidadesSet.add(e.cidade.trim());
      }
    });
    return Array.from(cidadesSet).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [empresas]);

  const handleChangeStage = (empresaId: string, novoStage: CrmStage) => {
    setStage(empresaId, novoStage);
    toast.success(`Etapa alterada para "${getCrmStageLabel(novoStage)}"`);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = empresas.findIndex((e) => e.id === active.id);
    const newIndex = empresas.findIndex((e) => e.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const novaOrdem = arrayMove(empresas, oldIndex, newIndex);
      reordenarEmpresas(novaOrdem);
      toast.success("Ordem dos clientes atualizada e salva com sucesso!");
    }
  };

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 space-y-5 max-w-[1600px]">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão de Empresas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtradas.length} de {listaBase.length} {aba === "ativas" ? "empresas ativas" : "empresas excluídas"} · filtros, etapas do funil e ações rápidas.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Tabs value={aba} onValueChange={(v) => setAba(v as "ativas" | "excluidas")}>
            <TabsList className="grid grid-cols-2 h-9 w-[300px]">
              <TabsTrigger value="ativas" className="text-xs gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Ativas ({empresasAtivas.length})
              </TabsTrigger>
              <TabsTrigger value="excluidas" className="text-xs gap-1.5 data-[state=active]:text-rose-600">
                <Trash2 className="h-3.5 w-3.5" />
                Excluídas ({empresasExcluidas.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" onClick={() => setF(INITIAL)} className="h-9 text-xs">
            Limpar filtros
          </Button>
        </div>
      </div>

      {aba === "excluidas" && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
          <span>
            Estas empresas estão na etapa <strong>Excluídos</strong> e ficam ocultas no Kanban principal. Você pode restaurá-las para a lista ativa a qualquer momento ou excluí-las definitivamente.
          </span>
        </div>
      )}

      <Card className="border-border/60">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <Input
              placeholder="Buscar empresa, segmento, cidade…"
              value={f.q}
              onChange={(e) => set("q", e.target.value)}
              className="sm:col-span-2 lg:col-span-2"
            />
            <Select value={f.cidade} onValueChange={(v) => set("cidade", v)}>
              <SelectTrigger><SelectValue placeholder="Cidade" /></SelectTrigger>
              <SelectContent className="max-h-80">
                <SelectItem value="todas">Todas as cidades</SelectItem>
                {cidadesDisponiveis.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={f.etapaKanban} onValueChange={(v) => set("etapaKanban", v)}>
              <SelectTrigger><SelectValue placeholder="Etapa Kanban" /></SelectTrigger>
              <SelectContent className="max-h-80">
                <SelectItem value="todas">Todas as etapas</SelectItem>
                {(kanbanColumns && kanbanColumns.length > 0
                  ? kanbanColumns
                  : CRM_STAGES_ORDER.map((s) => ({ id: s, titulo: getCrmStageLabel(s), cor: "slate" }))
                ).map((col) => {
                  const preset = getKanbanColorPreset(col.cor);
                  return (
                    <SelectItem key={col.id} value={col.id} className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className={cn("size-2 rounded-full shrink-0", preset.bgClass)} />
                        <span>{col.titulo}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Select value={f.segmento} onValueChange={(v) => set("segmento", v)}>
              <SelectTrigger><SelectValue placeholder="Segmento" /></SelectTrigger>
              <SelectContent className="max-h-80">
                <SelectItem value="todos">Todos os segmentos</SelectItem>
                {SEGMENTOS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {[
              ["soSemSite", "Sem site"],
              ["soSiteProblema", "Site com problemas"],
              ["soIgParado", "Instagram parado"],
              ["comTelefone", "Com telefone"],
              ["comWhats", "Com WhatsApp"],
              ["comEmail", "Com e-mail"],
            ].map(([k, label]) => (
              <label key={k} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={f[k as keyof Filtros] as boolean}
                  onCheckedChange={(v) => set(k as keyof Filtros, !!v as never)}
                />
                {label}
              </label>
            ))}
            <div className="flex items-center gap-2 text-sm ml-auto">
              <span className="text-muted-foreground">Score mínimo</span>
              <Input
                type="number"
                min={0}
                max={100}
                value={f.scoreMin}
                onChange={(e) => set("scoreMin", Number(e.target.value) || 0)}
                className="w-20 h-8"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 overflow-hidden shadow-sm">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="py-2.5 px-4 font-medium sticky left-0 z-20 bg-muted/95 backdrop-blur-xs border-r border-border/60 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.06)] min-w-[280px]">
                    <div className="flex items-center gap-1.5">
                      <span>Empresa</span>
                      {aba === "ativas" && (
                        <span className="text-[10px] text-muted-foreground font-normal normal-case">
                          (arraste para ordenar)
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="py-2.5 px-2 font-medium">Cidade</th>
                  <th className="py-2.5 px-2 font-medium">Etapa Kanban</th>
                  <th className="py-2.5 px-2 font-medium">Telefones</th>
                  <th className="py-2.5 px-2 font-medium">Canais</th>
                  <th className="py-2.5 px-2 font-medium">Site</th>
                  <th className="py-2.5 px-2 font-medium">Instagram</th>
                  <th className="py-2.5 px-2 font-medium">Score</th>
                  <th className="py-2.5 px-4 font-medium text-right">Ações Estratégicas</th>
                </tr>
              </thead>
              <SortableContext
                items={filtradas.map((e) => e.id)}
                strategy={verticalListSortingStrategy}
              >
                <tbody>
                  {filtradas.map((e) => (
                    <SortableEmpresaRow
                      key={e.id}
                      empresa={e}
                      aba={aba}
                      kanbanColumns={kanbanColumns}
                      onChangeStage={handleChangeStage}
                      onEditCadastro={setEmpresaCadastro}
                      onMoverExcluidos={(id, nome) => {
                        moverEmpresaParaExcluidos(id);
                        toast.success(`"${nome}" movida para a lista de excluídos e coluna Excluídos do Kanban.`);
                      }}
                      onRestaurar={(id, nome) => {
                        restaurarEmpresaDeExcluidos(id, "identificado");
                        toast.success(`"${nome}" restaurada para empresas ativas!`);
                      }}
                      onExcluirDefinitivo={(id, nome) => {
                        if (confirm(`Atenção: Excluir definitivamente removerá "${nome}" permanentemente. Confirmar?`)) {
                          excluirEmpresaDefinitivamente(id);
                          toast.success(`"${nome}" excluída definitivamente.`);
                        }
                      }}
                      isDragDisabled={aba === "excluidas"}
                    />
                  ))}
                  {filtradas.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-muted-foreground text-sm">
                        {aba === "excluidas"
                          ? "Nenhuma empresa na lista de excluídas."
                          : "Nenhuma empresa corresponde aos filtros aplicados."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </SortableContext>
            </table>
          </div>
        </DndContext>
      </Card>

      {/* Modal de Cadastro Completo & Inteligência de Busca */}
      <EmpresaCadastroModal
        empresa={empresaCadastro}
        open={Boolean(empresaCadastro)}
        onOpenChange={(o) => !o && setEmpresaCadastro(null)}
      />
    </div>
  );
}
