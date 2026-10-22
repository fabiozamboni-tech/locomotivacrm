import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  Check,
  Shield,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import {
  type CustomSkill,
  saveSkillsLocais,
} from "@/lib/skills-config";

interface ModalGerenciarSkillsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skills: CustomSkill[];
  onSkillsChange: (novasSkills: CustomSkill[]) => void;
}

export function ModalGerenciarSkills({
  open,
  onOpenChange,
  skills,
  onSkillsChange,
}: ModalGerenciarSkillsProps) {
  const [modoCriacao, setModoCriacao] = useState(false);
  const [editandoSkillId, setEditandoSkillId] = useState<string | null>(null);

  // Formulário de Skill
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState<CustomSkill["categoria"]>("design");
  const [prompt, setPrompt] = useState("");

  // Expandir prompt de uma skill para visualização
  const [expandedSkillId, setExpandedSkillId] = useState<string | null>(null);

  const resetForm = () => {
    setNome("");
    setDescricao("");
    setCategoria("design");
    setPrompt("");
    setModoCriacao(false);
    setEditandoSkillId(null);
  };

  const handleIniciarCriacao = () => {
    resetForm();
    setModoCriacao(true);
  };

  const handleIniciarEdicao = (skill: CustomSkill) => {
    setEditandoSkillId(skill.id);
    setNome(skill.nome);
    setDescricao(skill.descricao);
    setCategoria(skill.categoria || "design");
    setPrompt(skill.prompt);
    setModoCriacao(true);
  };

  const handleSalvarSkill = () => {
    if (!nome.trim()) {
      toast.error("Informe o nome da skill.");
      return;
    }
    if (!prompt.trim()) {
      toast.error("Informe as instruções/diretrizes de prompt para esta skill.");
      return;
    }

    if (editandoSkillId) {
      const atualizadas = skills.map((s) =>
        s.id === editandoSkillId
          ? {
              ...s,
              nome: nome.trim(),
              descricao: descricao.trim(),
              categoria,
              prompt: prompt.trim(),
            }
          : s,
      );
      onSkillsChange(atualizadas);
      saveSkillsLocais(atualizadas);
      toast.success(`Skill "${nome}" atualizada com sucesso!`);
    } else {
      const nova: CustomSkill = {
        id: `skill_${Date.now()}`,
        nome: nome.trim(),
        descricao: descricao.trim() || "Diretrizes personalizadas de engenharia de prompt.",
        categoria,
        prompt: prompt.trim(),
        ativa: true,
        criadaEm: new Date().toISOString(),
        sistema: false,
      };
      const atualizadas = [...skills, nova];
      onSkillsChange(atualizadas);
      saveSkillsLocais(atualizadas);
      toast.success(`Nova skill "${nome}" incorporada com sucesso!`);
    }

    resetForm();
  };

  const handleExcluirSkill = (id: string, nomeSkill: string) => {
    if (confirm(`Tem certeza que deseja excluir a skill "${nomeSkill}"?`)) {
      const atualizadas = skills.filter((s) => s.id !== id);
      onSkillsChange(atualizadas);
      saveSkillsLocais(atualizadas);
      toast.info(`Skill "${nomeSkill}" removida.`);
    }
  };

  const handleToggleAtiva = (id: string, ativa: boolean) => {
    const atualizadas = skills.map((s) => (s.id === id ? { ...s, ativa } : s));
    onSkillsChange(atualizadas);
    saveSkillsLocais(atualizadas);
  };

  const ativasCount = skills.filter((s) => s.ativa).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-5 pb-3 border-b border-border/80 bg-muted/20">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Gestão de Skills de IA para Criação de Sites</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Incorpore novas habilidades, diretrizes oficiais da Anthropic e regras customizadas no prompt das IAs.
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className="text-xs border-primary/30 text-primary gap-1">
                <Check className="h-3 w-3" />
                {ativasCount} ativa{ativasCount === 1 ? "" : "s"}
              </Badge>
              {!modoCriacao && (
                <Button size="sm" onClick={handleIniciarCriacao} className="h-8 text-xs gap-1.5 shadow-xs">
                  <Plus className="h-3.5 w-3.5" />
                  Nova Skill
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* MODO FORMULÁRIO (NOVA SKILL OU EDIÇÃO) */}
          {modoCriacao && (
            <div className="bg-muted/30 border border-primary/30 rounded-xl p-4 space-y-3.5 animate-in fade-in-50 duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5" />
                  {editandoSkillId ? "Editar Skill" : "Criar Nova Skill de IA"}
                </span>
                <Button size="sm" variant="ghost" onClick={resetForm} className="h-6 text-xs text-muted-foreground">
                  Cancelar
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-foreground">Nome da Skill</label>
                  <Input
                    placeholder="Ex: Copywriting B2B, Minimalismo Suíço, Arquitetura Tailwind..."
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Categoria</label>
                  <Select value={categoria} onValueChange={(val: any) => setCategoria(val)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="design" className="text-xs">Design & Estética</SelectItem>
                      <SelectItem value="ux" className="text-xs">UX & Conversão</SelectItem>
                      <SelectItem value="copywriting" className="text-xs">Copywriting & Voz</SelectItem>
                      <SelectItem value="seo" className="text-xs">SEO & Semântica</SelectItem>
                      <SelectItem value="codigo" className="text-xs">Engenharia & Código</SelectItem>
                      <SelectItem value="geral" className="text-xs">Geral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Descrição Curta</label>
                <Input
                  placeholder="Resumo do impacto desta skill no resultado do site..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">
                    Diretrizes & Instruções de Prompt (serão incorporadas ao prompt base)
                  </label>
                  <span className="text-[10px] text-muted-foreground">
                    {prompt.length} caracteres
                  </span>
                </div>
                <Textarea
                  placeholder="Descreva as instruções que o LLM deve seguir com rigor quando esta skill estiver ativada..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={5}
                  className="text-xs font-mono leading-relaxed bg-background"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={resetForm} className="h-8 text-xs">
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSalvarSkill} className="h-8 text-xs gap-1.5 shadow-xs">
                  <Check className="h-3.5 w-3.5" />
                  {editandoSkillId ? "Atualizar Skill" : "Adicionar Skill"}
                </Button>
              </div>
            </div>
          )}

          {/* LISTA DE SKILLS */}
          <div className="space-y-2.5">
            {skills.map((s) => {
              const isExpanded = expandedSkillId === s.id;
              return (
                <div
                  key={s.id}
                  className={`border rounded-xl p-3.5 transition-all ${
                    s.ativa
                      ? "border-primary/40 bg-card shadow-xs"
                      : "border-border/60 bg-muted/20 opacity-75"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <Checkbox
                        id={`check-${s.id}`}
                        checked={s.ativa}
                        onCheckedChange={(checked) => handleToggleAtiva(s.id, checked === true)}
                        className="mt-1"
                      />
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <label
                            htmlFor={`check-${s.id}`}
                            className="font-bold text-xs text-foreground hover:text-primary transition-colors cursor-pointer"
                          >
                            {s.nome}
                          </label>
                          {s.sistema && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 gap-0.5">
                              <Shield className="h-2.5 w-2.5" /> Oficial
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 uppercase">
                            {s.categoria || "design"}
                          </Badge>
                          <Badge
                            variant={s.ativa ? "default" : "outline"}
                            className="text-[9px] px-1.5 py-0 h-4 font-normal ml-auto sm:ml-0"
                          >
                            {s.ativa ? "Ativada no Prompt" : "Desativada"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-snug">
                          {s.descricao}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setExpandedSkillId(isExpanded ? null : s.id)}
                        className="h-7 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                        title={isExpanded ? "Ocultar prompt" : "Ver diretrizes de prompt"}
                      >
                        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        <span className="hidden sm:inline">{isExpanded ? "Ocultar" : "Diretrizes"}</span>
                      </Button>

                      {!s.sistema && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleIniciarEdicao(s)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                            title="Editar skill"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleExcluirSkill(s.id, s.nome)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            title="Excluir skill"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* PROMPT EXPANDIDO */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-border/60 bg-muted/30 p-2.5 rounded-lg text-xs font-mono leading-relaxed text-foreground whitespace-pre-wrap select-text">
                      {s.prompt}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-border/80 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {ativasCount} de {skills.length} skills selecionadas serão incorporadas ao prompt da IA.
          </span>
          <Button size="sm" onClick={() => onOpenChange(false)} className="h-8 text-xs">
            Concluído
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
