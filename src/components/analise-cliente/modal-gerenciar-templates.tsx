import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  loadAbordagemTemplates,
  saveAbordagemTemplates,
  resolverVariaveisTemplate,
  TAGS_VARIAVEIS_DISPONIVEIS,
  type AbordagemTemplate,
} from "@/lib/abordagem-templates";
import type { EmpresaCtx } from "@/lib/ai.functions";
import {
  FileText,
  Plus,
  Trash2,
  Edit,
  Eye,
  Check,
  Sparkles,
  Info,
  Copy,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

interface ModalGerenciarTemplatesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresaCtx: EmpresaCtx;
  onAplicarTemplate: (textoResolvido: string, template: AbordagemTemplate) => void;
}

export function ModalGerenciarTemplates({
  open,
  onOpenChange,
  empresaCtx,
  onAplicarTemplate,
}: ModalGerenciarTemplatesProps) {
  const [templates, setTemplates] = useState<AbordagemTemplate[]>([]);
  const [templateSelecionadoId, setTemplateSelecionadoId] = useState<string>("");
  const [modoCriacaoOuEdicao, setModoCriacaoOuEdicao] = useState<"lista" | "form">("lista");
  const [editandoId, setEditandoId] = useState<string | null>(null);

  // Form State
  const [formTitulo, setFormTitulo] = useState("");
  const [formDescricao, setFormDescricao] = useState("");
  const [formCanal, setFormCanal] = useState<"whatsapp" | "instagram" | "email" | "todos">("whatsapp");
  const [formConteudo, setFormConteudo] = useState("");

  // Carrega templates ao abrir modal
  useEffect(() => {
    if (open) {
      const list = loadAbordagemTemplates();
      setTemplates(list);
      if (list.length > 0 && !templateSelecionadoId) {
        setTemplateSelecionadoId(list[0].id);
      }
      setModoCriacaoOuEdicao("lista");
    }
  }, [open]);

  const templateAtual = templates.find((t) => t.id === templateSelecionadoId) || templates[0];

  const handleIniciarNovo = () => {
    setEditandoId(null);
    setFormTitulo("");
    setFormDescricao("");
    setFormCanal("whatsapp");
    setFormConteudo(`Oi, [boa tarde/bom dia/boa noite], tudo bem?\n\nMeu nome é Fábio, da Locomotiva Comunicação.\n\nAcompanhamos o mercado [Área de Atuação] de [CIDADE] e identificamos grande procura por [TERMOS DE BUSCA LEVANTADOS] na internet.\n\nReunimos esses dados em um documento resumido em PDF. Posso te enviar por aqui para dar uma olhada?\n\nObrigado e um abraço!`);
    setModoCriacaoOuEdicao("form");
  };

  const handleIniciarEdicao = (tpl: AbordagemTemplate) => {
    setEditandoId(tpl.id);
    setFormTitulo(tpl.titulo);
    setFormDescricao(tpl.descricao || "");
    setFormCanal(tpl.canal);
    setFormConteudo(tpl.conteudo);
    setModoCriacaoOuEdicao("form");
  };

  const handleInserirTagNoCursor = (tag: string) => {
    setFormConteudo((prev) => `${prev} ${tag}`);
    toast.info(`Tag ${tag} adicionada ao texto!`);
  };

  const handleSalvarForm = () => {
    if (!formTitulo.trim()) {
      toast.error("Informe o título do texto padrão.");
      return;
    }
    if (!formConteudo.trim()) {
      toast.error("Informe o conteúdo da mensagem com as tags.");
      return;
    }

    let atualizados: AbordagemTemplate[] = [];

    if (editandoId) {
      atualizados = templates.map((t) =>
        t.id === editandoId
          ? {
              ...t,
              titulo: formTitulo.trim(),
              descricao: formDescricao.trim() || undefined,
              canal: formCanal,
              conteudo: formConteudo.trim(),
            }
          : t,
      );
      toast.success("Texto padrão atualizado com sucesso!");
    } else {
      const novo: AbordagemTemplate = {
        id: `custom_${Date.now()}`,
        titulo: formTitulo.trim(),
        descricao: formDescricao.trim() || undefined,
        canal: formCanal,
        conteudo: formConteudo.trim(),
        criadoEm: new Date().toISOString(),
        isPadrao: false,
      };
      atualizados = [...templates, novo];
      setTemplateSelecionadoId(novo.id);
      toast.success("Novo texto padrão cadastrado com sucesso!");
    }

    setTemplates(atualizados);
    saveAbordagemTemplates(atualizados);
    setModoCriacaoOuEdicao("lista");
  };

  const handleExcluir = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const tpl = templates.find((t) => t.id === id);
    if (tpl?.isPadrao) {
      toast.error("O modelo padrão oficial não pode ser excluído.");
      return;
    }
    const filtrados = templates.filter((t) => t.id !== id);
    setTemplates(filtrados);
    saveAbordagemTemplates(filtrados);
    if (templateSelecionadoId === id && filtrados.length > 0) {
      setTemplateSelecionadoId(filtrados[0].id);
    }
    toast.success("Texto padrão excluído.");
  };

  const handleAplicarNoEditor = (tpl: AbordagemTemplate) => {
    const resolvido = resolverVariaveisTemplate(tpl.conteudo, empresaCtx);
    onAplicarTemplate(resolvido, tpl);
    toast.success(`Texto padrão "${tpl.titulo}" aplicado com as variáveis preenchidas!`);
    onOpenChange(false);
  };

  const textoPreviewAtual = templateAtual
    ? resolverVariaveisTemplate(templateAtual.conteudo, empresaCtx)
    : "";

  const textoPreviewForm = resolverVariaveisTemplate(formConteudo, empresaCtx);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-6">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  Gerenciar Textos Padrão & Templates de Abordagem
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Crie textos com variáveis entre colchetes como <code className="text-primary font-mono">[CIDADE]</code> e <code className="text-primary font-mono">[TERMOS DE BUSCA LEVANTADOS]</code> para o sistema preencher automaticamente.
                </DialogDescription>
              </div>
            </div>

            {modoCriacaoOuEdicao === "lista" ? (
              <Button size="sm" onClick={handleIniciarNovo} className="text-xs gap-1.5 bg-primary">
                <Plus className="h-3.5 w-3.5" /> Novo Texto Padrão
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModoCriacaoOuEdicao("lista")}
                className="text-xs gap-1.5"
              >
                Voltar à Lista
              </Button>
            )}
          </div>
        </DialogHeader>

        {modoCriacaoOuEdicao === "lista" ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-4 overflow-y-auto flex-1 min-h-0">
            {/* COLUNA ESQUERDA: LISTA DE TEMPLATES */}
            <div className="md:col-span-5 space-y-2 overflow-y-auto pr-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                Modelos Salvos ({templates.length})
              </label>

              {templates.map((tpl) => {
                const ativo = tpl.id === templateSelecionadoId;
                return (
                  <Card
                    key={tpl.id}
                    onClick={() => setTemplateSelecionadoId(tpl.id)}
                    className={`cursor-pointer transition-all border text-left hover:border-primary/50 ${
                      ativo ? "border-primary bg-primary/5 ring-1 ring-primary/40 shadow-xs" : "border-border/70"
                    }`}
                  >
                    <CardContent className="p-3 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className="text-xs font-bold truncate leading-tight">{tpl.titulo}</h4>
                          {tpl.isPadrao && (
                            <Badge variant="default" className="text-[9px] px-1 py-0 h-4 shrink-0">
                              Oficial
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {!tpl.isPadrao && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleIniciarEdicao(tpl);
                                }}
                                className="p-1 hover:text-primary text-muted-foreground transition-colors"
                                title="Editar template"
                              >
                                <Edit className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleExcluir(tpl.id, e)}
                                className="p-1 hover:text-destructive text-muted-foreground transition-colors"
                                title="Excluir template"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {tpl.descricao && (
                        <p className="text-[11px] text-muted-foreground line-clamp-1">{tpl.descricao}</p>
                      )}

                      <div className="flex items-center gap-2 pt-1 text-[10px] text-muted-foreground">
                        <Badge variant="outline" className="text-[9px] uppercase px-1 py-0 h-3.5">
                          {tpl.canal}
                        </Badge>
                        <span className="truncate font-mono">{tpl.conteudo.slice(0, 45)}...</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* COLUNA DIREITA: PRÉ-VISUALIZAÇÃO COM DADOS DO CLIENTE */}
            <div className="md:col-span-7 flex flex-col gap-3 min-h-0">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-primary" />
                  <span>Prévia com Dados Reais ({empresaCtx.nome})</span>
                </label>

                {templateAtual && (
                  <Button
                    size="sm"
                    onClick={() => handleAplicarNoEditor(templateAtual)}
                    className="h-7 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    <Check className="h-3 w-3" /> Usar Este Modelo
                  </Button>
                )}
              </div>

              {templateAtual ? (
                <div className="flex-1 flex flex-col gap-2 min-h-0 bg-muted/20 border border-border/80 rounded-xl p-3.5">
                  <div className="flex items-center justify-between text-xs border-b pb-2">
                    <span className="font-bold text-foreground">{templateAtual.titulo}</span>
                    <Badge variant="outline" className="text-[10px] uppercase">
                      Canal: {templateAtual.canal}
                    </Badge>
                  </div>

                  <div className="flex-1 overflow-y-auto whitespace-pre-wrap font-mono text-xs leading-relaxed p-3 bg-background rounded-lg border">
                    {textoPreviewAtual}
                  </div>

                  <div className="p-2.5 rounded-lg border border-primary/20 bg-primary/5 text-xs text-foreground flex items-start gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Todas as variáveis entre colchetes como <strong className="text-foreground">[CIDADE]</strong> ({empresaCtx.cidade}), <strong className="text-foreground">[SERVIÇO]</strong> e <strong className="text-foreground">[TERMOS DE BUSCA]</strong> foram resolvidas dinamicamente para <strong>{empresaCtx.nome}</strong>.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  Nenhum modelo selecionado.
                </div>
              )}
            </div>
          </div>
        ) : (
          /* MODO FORMULÁRIO: CRIAR OU EDITAR TEMPLATE */
          <div className="space-y-4 pt-4 overflow-y-auto flex-1 min-h-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Título do Texto Padrão *</label>
                <Input
                  value={formTitulo}
                  onChange={(e) => setFormTitulo(e.target.value)}
                  placeholder="Ex: Abordagem Padrão Caxias do Sul"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">Canal Recomendado</label>
                <select
                  value={formCanal}
                  onChange={(e) => setFormCanal(e.target.value as any)}
                  className="w-full h-8 text-xs rounded-md border border-input bg-background px-3 py-1 text-foreground shadow-xs cursor-pointer"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="instagram">Instagram Direct</option>
                  <option value="email">E-mail</option>
                  <option value="todos">Todos os Canais</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Descrição Curta (Opcional)</label>
              <Input
                value={formDescricao}
                onChange={(e) => setFormDescricao(e.target.value)}
                placeholder="Ex: Primeiro contato amigável citando termos técnicos de busca"
                className="h-8 text-xs"
              />
            </div>

            {/* BARRA DE BOTÕES DE VARIÁVEIS / TAGS CLICÁVEIS */}
            <div className="space-y-1.5 p-3 rounded-lg border border-border/80 bg-muted/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Clique nas variáveis abaixo para inserir no texto:
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Substituição dinâmica automática
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {TAGS_VARIAVEIS_DISPONIVEIS.map((t) => (
                  <Button
                    key={t.tag}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleInserirTagNoCursor(t.tag)}
                    className="h-6 text-[11px] px-2 rounded-full font-mono hover:border-primary hover:text-primary transition-all gap-1"
                    title={`${t.descricao} (Ex: ${t.exemplo})`}
                  >
                    <span>+</span> {t.tag}
                  </Button>
                ))}
              </div>
            </div>

            {/* GRID EDITOR E PREVIEW LADO A LADO */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-h-[220px]">
              <div className="space-y-1 flex flex-col">
                <label className="text-xs font-bold text-foreground">
                  Corpo da Mensagem com Tags *
                </label>
                <Textarea
                  value={formConteudo}
                  onChange={(e) => setFormConteudo(e.target.value)}
                  rows={9}
                  className="text-xs font-mono leading-relaxed resize-y flex-1"
                  placeholder="Escreva a mensagem aqui usando [boa tarde/bom dia/boa noite], [CIDADE], [TERMOS DE BUSCA LEVANTADOS]..."
                />
              </div>

              <div className="space-y-1 flex flex-col">
                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Prévia em Tempo Real ({empresaCtx.nome})</span>
                </label>
                <div className="p-3 rounded-md border bg-muted/10 font-mono text-xs leading-relaxed flex-1 overflow-y-auto whitespace-pre-wrap">
                  {textoPreviewForm || <span className="text-muted-foreground italic">A prévia com os dados reais aparecerá aqui...</span>}
                </div>
              </div>
            </div>

            {/* BOTÕES DE AÇÃO */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModoCriacaoOuEdicao("lista")}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSalvarForm} className="text-xs gap-1.5 bg-primary">
                <Check className="h-3.5 w-3.5" />
                {editandoId ? "Salvar Alterações" : "Cadastrar Texto Padrão"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
