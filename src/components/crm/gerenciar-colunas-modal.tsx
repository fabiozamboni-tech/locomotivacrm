import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Eye,
  EyeOff,
  RotateCcw,
  SlidersHorizontal,
  Lock,
} from "lucide-react";
import {
  type KanbanColumnConfig,
  KANBAN_COLORS_PRESETS,
  getKanbanColorPreset,
} from "@/lib/kanban-config";
import { toast } from "sonner";

interface GerenciarColunasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: KanbanColumnConfig[];
  onAddColumn: (col: { titulo: string; cor?: string; oculto?: boolean }) => void;
  onEditColumn: (id: string, patch: Partial<KanbanColumnConfig>) => void;
  onDeleteColumn: (id: string) => void;
  onToggleHide: (id: string) => void;
  onResetDefault: () => void;
  cardCountByStage?: Record<string, number>;
}

export function GerenciarColunasModal({
  open,
  onOpenChange,
  columns,
  onAddColumn,
  onEditColumn,
  onDeleteColumn,
  onToggleHide,
  onResetDefault,
  cardCountByStage = {},
}: GerenciarColunasModalProps) {
  // Estado para adicionar nova coluna
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novaCor, setNovaCor] = useState("violet");
  const [novoOculto, setNovoOculto] = useState(false);
  const [mostrandoFormNovo, setMostrandoFormNovo] = useState(false);

  // Estado para edição inline de coluna
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [editCor, setEditCor] = useState("");

  const handleSalvarNovo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoTitulo.trim()) {
      toast.error("Informe um título para a coluna.");
      return;
    }
    onAddColumn({
      titulo: novoTitulo.trim(),
      cor: novaCor,
      oculto: novoOculto,
    });
    setNovoTitulo("");
    setNovoOculto(false);
    setMostrandoFormNovo(false);
    toast.success(`Coluna "${novoTitulo.trim()}" adicionada com sucesso!`);
  };

  const handleIniciarEdicao = (col: KanbanColumnConfig) => {
    setEditingId(col.id);
    setEditTitulo(col.titulo);
    setEditCor(col.cor);
  };

  const handleSalvarEdicao = (id: string) => {
    if (!editTitulo.trim()) {
      toast.error("O título não pode ficar vazio.");
      return;
    }
    onEditColumn(id, {
      titulo: editTitulo.trim(),
      cor: editCor,
    });
    setEditingId(null);
    toast.success("Coluna atualizada!");
  };

  const handleConfirmarExclusao = (col: KanbanColumnConfig) => {
    if (col.id === "excluidos") {
      toast.error("A coluna Excluídos é reservada do sistema e não pode ser excluída.");
      return;
    }
    const count = cardCountByStage[col.id] || 0;
    const msg =
      count > 0
        ? `Excluir a coluna "${col.titulo}"? Os ${count} cards desta etapa serão movidos para "Identificado".`
        : `Deseja realmente excluir a coluna "${col.titulo}"?`;

    if (window.confirm(msg)) {
      onDeleteColumn(col.id);
      toast.success(`Coluna "${col.titulo}" excluída.`);
    }
  };

  const colunasOcultasCount = columns.filter((c) => c.oculto).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between gap-2">
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-primary" />
                Personalizar Colunas do Kanban
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Inclua novas etapas, edite títulos e cores, oculte ou exclua colunas do seu funil comercial.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMostrandoFormNovo(!mostrandoFormNovo)}
                className="h-8 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
              >
                <Plus className="h-3.5 w-3.5" />
                Nova Coluna
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* FORMULÁRIO DE ADIÇÃO DE NOVA COLUNA */}
        {mostrandoFormNovo && (
          <form
            onSubmit={handleSalvarNovo}
            className="p-3.5 rounded-lg border border-primary/30 bg-primary/5 space-y-3 shrink-0 mt-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5 text-primary" />
                Adicionar Nova Coluna
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setMostrandoFormNovo(false)}
                className="h-6 w-6 p-0 text-muted-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Título da Coluna</label>
                <Input
                  placeholder="Ex: Demonstração Agendada"
                  value={novoTitulo}
                  onChange={(e) => setNovoTitulo(e.target.value)}
                  className="h-8 text-xs"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Cor do Destaque</label>
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  {KANBAN_COLORS_PRESETS.map((preset) => (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => setNovaCor(preset.key)}
                      title={preset.label}
                      className={`size-6 rounded-full ${preset.bgClass} flex items-center justify-center transition-transform ${
                        novaCor === preset.key
                          ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                          : "opacity-80 hover:opacity-100"
                      }`}
                    >
                      {novaCor === preset.key && <Check className="h-3 w-3 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground">
                <Checkbox
                  checked={novoOculto}
                  onCheckedChange={(c) => setNovoOculto(Boolean(c))}
                />
                <span>Iniciar como coluna oculta</span>
              </label>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setMostrandoFormNovo(false)}
                  className="h-7 text-xs"
                >
                  Cancelar
                </Button>
                <Button type="submit" size="sm" className="h-7 text-xs gap-1 bg-primary text-white">
                  <Check className="h-3 w-3" />
                  Salvar Coluna
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* LISTA DE COLUNAS CONFIGURADAS */}
        <div className="overflow-y-auto space-y-2 py-3 flex-1 pr-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1 mb-1">
            <span>
              Total de <strong>{columns.length}</strong> etapas ({colunasOcultasCount} oculta{colunasOcultasCount !== 1 ? "s" : ""})
            </span>
            <span className="text-[11px]">Dica: colunas ocultas não poluem o quadro principal</span>
          </div>

          {columns.map((col, idx) => {
            const isEditing = editingId === col.id;
            const preset = getKanbanColorPreset(col.cor);
            const cardCount = cardCountByStage[col.id] || 0;
            const isExcluidos = col.id === "excluidos";

            return (
              <div
                key={col.id}
                className={`flex items-center justify-between gap-3 p-2.5 rounded-lg border transition-all ${
                  col.oculto
                    ? "bg-muted/30 border-dashed border-border/70 opacity-75"
                    : "bg-card border-border/80 hover:border-border"
                }`}
              >
                {/* IDENTIFICADOR E TÍTULO OU MODO DE EDIÇÃO */}
                {isEditing ? (
                  <div className="flex items-center gap-2 flex-1 flex-wrap">
                    <Input
                      value={editTitulo}
                      onChange={(e) => setEditTitulo(e.target.value)}
                      className="h-8 text-xs max-w-[200px]"
                      autoFocus
                    />
                    <div className="flex items-center gap-1">
                      {KANBAN_COLORS_PRESETS.map((p) => (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => setEditCor(p.key)}
                          title={p.label}
                          className={`size-5 rounded-full ${p.bgClass} flex items-center justify-center ${
                            editCor === p.key ? "ring-2 ring-primary ring-offset-1" : "opacity-70"
                          }`}
                        >
                          {editCor === p.key && <Check className="h-2.5 w-2.5 text-white" />}
                        </button>
                      ))}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleSalvarEdicao(col.id)}
                      className="h-7 px-2 text-xs gap-1"
                    >
                      <Check className="h-3 w-3" /> Salvar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingId(null)}
                      className="h-7 px-2 text-xs"
                    >
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[11px] font-bold text-muted-foreground w-4 text-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className={`size-3 rounded-full ${preset.bgClass} shrink-0`} />

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-xs text-foreground">{col.titulo}</span>
                      {isExcluidos && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-red-400 text-red-600 bg-red-500/10">
                          Lixeira / Excluídos
                        </Badge>
                      )}
                      {col.oculto && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-amber-300 text-amber-600 bg-amber-500/10 gap-0.5">
                          <EyeOff className="h-2.5 w-2.5" /> Oculta
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.2 rounded-full">
                        {cardCount} {cardCount === 1 ? "empresa" : "empresas"}
                      </span>
                    </div>
                  </div>
                )}

                {/* BOTÕES DE CONTROLE: OCULTAR / EDITAR / EXCLUIR */}
                {!isEditing && (
                  <div className="flex items-center gap-1 shrink-0">
                    {/* BOTÃO OCULTAR / EXIBIR */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onToggleHide(col.id);
                        toast.info(
                          col.oculto
                            ? `Coluna "${col.titulo}" agora está visível no Kanban.`
                            : `Coluna "${col.titulo}" agora está oculta do Kanban.`,
                        );
                      }}
                      className={`h-7 px-2 text-xs gap-1 ${
                        col.oculto
                          ? "text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      title={col.oculto ? "Exibir esta coluna no Kanban" : "Ocultar esta coluna do Kanban"}
                    >
                      {col.oculto ? <Eye className="h-3.5 w-3.5 text-amber-500" /> : <EyeOff className="h-3.5 w-3.5" />}
                      <span className="hidden sm:inline">{col.oculto ? "Exibir" : "Ocultar"}</span>
                    </Button>

                    {/* BOTÃO EDITAR */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleIniciarEdicao(col)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      title="Editar título e cor"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>

                    {/* BOTÃO EXCLUIR (BLOQUEADO APENAS PARA EXCLUÍDOS QUE É DO SISTEMA) */}
                    {isExcluidos ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled
                        className="h-7 w-7 p-0 text-muted-foreground/30"
                        title="A coluna Excluídos é nativa do sistema e não pode ser excluída (use 'Ocultar')"
                      >
                        <Lock className="h-3 w-3" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleConfirmarExclusao(col)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Excluir coluna"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* RODAPÉ DO MODAL */}
        <DialogFooter className="pt-3 border-t border-border/60 flex flex-row items-center justify-between sm:justify-between w-full">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.confirm("Deseja restaurar as colunas originais do sistema?")) {
                onResetDefault();
                toast.success("Colunas padrão restauradas!");
              }
            }}
            className="text-xs text-muted-foreground gap-1.5 hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restaurar Padrão
          </Button>

          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            size="sm"
            className="text-xs"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
