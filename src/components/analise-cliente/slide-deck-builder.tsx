import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Printer,
  Save,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Presentation,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  CheckCircle2,
  Rocket,
  Target,
  Edit3,
  Layers,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import type { Empresa, SlideItem, ApresentacaoSlidesData } from "@/lib/mock-data";
import { gerarApresentacaoPadrao } from "@/lib/slide-deck.functions";
import type { Dossier360Result } from "@/lib/dossier-360.functions";
import type { Relatorio } from "@/lib/relatorio.functions";

interface SlideDeckBuilderProps {
  empresa: Empresa;
  dossier?: Dossier360Result | null;
  relatorio?: Relatorio | null;
  onSave?: (deck: ApresentacaoSlidesData) => void;
}

export function SlideDeckBuilder({
  empresa,
  dossier,
  relatorio,
  onSave,
}: SlideDeckBuilderProps) {
  // Carrega slides já salvos ou gera a versão padrão inicial
  const [deck, setDeck] = useState<ApresentacaoSlidesData>(() => {
    if (empresa.apresentacaoSlides && empresa.apresentacaoSlides.slides?.length) {
      return empresa.apresentacaoSlides;
    }
    return gerarApresentacaoPadrao(empresa, dossier, relatorio);
  });

  const [slideAtivoIndex, setSlideAtivoIndex] = useState(0);
  const [modoVisualizacao, setModoVisualizacao] = useState<"editor" | "apresentacao">("editor");
  const [novoTopicoTexto, setNovoTopicoTexto] = useState("");

  // Atualiza se a empresa mudar
  useEffect(() => {
    if (empresa.apresentacaoSlides && empresa.apresentacaoSlides.slides?.length) {
      setDeck(empresa.apresentacaoSlides);
    } else {
      setDeck(gerarApresentacaoPadrao(empresa, dossier, relatorio));
    }
    setSlideAtivoIndex(0);
  }, [empresa.id]);

  const slideAtual = deck.slides[slideAtivoIndex] || deck.slides[0];

  // Ações de edição de slide
  const handleAtualizarSlideAtual = (patch: Partial<SlideItem>) => {
    setDeck((prev) => {
      const novos = [...prev.slides];
      novos[slideAtivoIndex] = {
        ...novos[slideAtivoIndex],
        ...patch,
      };
      return { ...prev, slides: novos, atualizadoEm: new Date().toISOString() };
    });
  };

  const handleAdicionarTopico = () => {
    if (!novoTopicoTexto.trim()) return;
    const pontos = [...(slideAtual.pontos || []), novoTopicoTexto.trim()];
    handleAtualizarSlideAtual({ pontos });
    setNovoTopicoTexto("");
  };

  const handleRemoverTopico = (index: number) => {
    const pontos = slideAtual.pontos.filter((_, i) => i !== index);
    handleAtualizarSlideAtual({ pontos });
  };

  const handleEditarTopico = (index: number, novoTexto: string) => {
    const pontos = [...slideAtual.pontos];
    pontos[index] = novoTexto;
    handleAtualizarSlideAtual({ pontos });
  };

  const handleAdicionarSlide = () => {
    const novoSlide: SlideItem = {
      id: `slide_${Date.now()}`,
      tipo: "personalizado",
      titulo: "Novo Slide de Estratégia",
      subtitulo: `Planejamento para ${empresa.nome} em ${empresa.cidade}`,
      pontos: [
        "Descreva aqui a proposta de valor ou diferencial comercial.",
        "Apresente métricas tangíveis ou passos práticos de execução.",
        "Destaque o impacto esperado na rentabilidade da empresa.",
      ],
      destaque: "Diferencial exclusivo Locomotiva Comunicação",
      tags: ["Customizado", empresa.cidade],
    };

    setDeck((prev) => ({
      ...prev,
      slides: [...prev.slides, novoSlide],
      atualizadoEm: new Date().toISOString(),
    }));
    setSlideAtivoIndex(deck.slides.length);
    toast.success("Novo slide adicionado! Você já pode editá-lo.");
  };

  const handleExcluirSlide = (index: number) => {
    if (deck.slides.length <= 1) {
      toast.error("A apresentação deve ter pelo menos 1 slide.");
      return;
    }
    const filtrados = deck.slides.filter((_, i) => i !== index);
    setDeck((prev) => ({
      ...prev,
      slides: filtrados,
      atualizadoEm: new Date().toISOString(),
    }));
    setSlideAtivoIndex(Math.max(0, index - 1));
    toast.info("Slide removido.");
  };

  const handleMoverSlide = (index: number, direcao: "cima" | "baixo") => {
    const destino = direcao === "cima" ? index - 1 : index + 1;
    if (destino < 0 || destino >= deck.slides.length) return;

    const novos = [...deck.slides];
    const temp = novos[index];
    novos[index] = novos[destino];
    novos[destino] = temp;

    setDeck((prev) => ({ ...prev, slides: novos }));
    setSlideAtivoIndex(destino);
  };

  const handleRegenerarPadrao = () => {
    const padrao = gerarApresentacaoPadrao(empresa, dossier, relatorio);
    setDeck(padrao);
    setSlideAtivoIndex(0);
    toast.info("Slides restaurados com base na última análise.");
  };

  const handleSalvarDeck = () => {
    if (onSave) {
      onSave(deck);
    }
    toast.success("Apresentação de slides salva com sucesso no banco de dados!");
  };

  const handleImprimirPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* BARRA SUPERIOR DE CONTROLES (OCULTA NA IMPRESSÃO) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/80 bg-card shadow-sm print:hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30">
              Apresentação Comercial em Slides
            </Badge>
            <span className="text-xs text-muted-foreground">{deck.slides.length} slides</span>
          </div>
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Presentation className="h-5 w-5 text-indigo-600" />
            <span>Deck de Apresentação para o Lead (PDF)</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Personalize os slides antes de exportar o PDF para apresentar pessoalmente ou enviar no WhatsApp do cliente.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {modoVisualizacao === "editor" ? (
            <Button
              onClick={() => setModoVisualizacao("apresentacao")}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Modo Apresentação
            </Button>
          ) : (
            <Button
              onClick={() => setModoVisualizacao("editor")}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Voltar ao Editor
            </Button>
          )}

          <Button
            onClick={handleRegenerarPadrao}
            variant="ghost"
            size="sm"
            title="Restaura os textos originais a partir da análise"
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restaurar
          </Button>

          <Button
            onClick={handleSalvarDeck}
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
          >
            <Save className="h-3.5 w-3.5" />
            Salvar Apresentação
          </Button>

          <Button
            onClick={handleImprimirPDF}
            size="sm"
            className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
          >
            <Printer className="h-3.5 w-3.5" />
            Exportar PDF / Imprimir
          </Button>
        </div>
      </div>

      {/* ÁREA DE TRABALHO: MODO EDITOR OU MODO APRESENTAÇÃO */}
      {modoVisualizacao === "editor" ? (
        <div className="grid lg:grid-cols-[300px_1fr] gap-6 items-start print:hidden">
          {/* COLUNA ESQUERDA: LISTA DE SLIDES */}
          <Card className="border-border/80">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Slides da Apresentação
                </CardTitle>
                <Button
                  onClick={handleAdicionarSlide}
                  size="sm"
                  variant="outline"
                  className="h-7 px-2 text-[11px] gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Novo Slide
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-2 space-y-1.5 max-h-[650px] overflow-y-auto">
              {deck.slides.map((s, idx) => {
                const ativo = idx === slideAtivoIndex;
                return (
                  <div
                    key={s.id || idx}
                    onClick={() => setSlideAtivoIndex(idx)}
                    className={`group p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      ativo
                        ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 shadow-xs"
                        : "border-transparent hover:border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Slide {idx + 1}
                      </span>
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoverSlide(idx, "cima");
                          }}
                          disabled={idx === 0}
                          className="p-1 hover:text-indigo-600 disabled:opacity-30"
                          title="Subir slide"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoverSlide(idx, "baixo");
                          }}
                          disabled={idx === deck.slides.length - 1}
                          className="p-1 hover:text-indigo-600 disabled:opacity-30"
                          title="Descer slide"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExcluirSlide(idx);
                          }}
                          className="p-1 hover:text-destructive"
                          title="Excluir slide"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <p className={`text-xs font-semibold line-clamp-1 ${ativo ? "text-indigo-600 dark:text-indigo-400" : "text-foreground"}`}>
                      {s.titulo}
                    </p>
                    <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                      {s.subtitulo || `${s.pontos.length} tópicos`}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* COLUNA DIREITA: EDITOR E PREVIEW DO SLIDE ATIVO */}
          <div className="space-y-6">
            {/* PREVIEW DO SLIDE ATIVO */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold">Pré-visualização do Slide {slideAtivoIndex + 1} de {deck.slides.length}</span>
                <span className="text-[11px]">Formato de Apresentação Widescreen 16:9</span>
              </div>
              <SlideCardVisual slide={slideAtual} numero={slideAtivoIndex + 1} total={deck.slides.length} empresa={empresa} />
            </div>

            {/* FORMULÁRIO DE EDIÇÃO DO SLIDE */}
            <Card className="border-border/80">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span>Editar Conteúdo do Slide {slideAtivoIndex + 1}</span>
                  <Badge variant="outline" className="text-[10px] font-normal">
                    {slideAtual.tipo}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Título do Slide</label>
                    <Input
                      value={slideAtual.titulo}
                      onChange={(e) => handleAtualizarSlideAtual({ titulo: e.target.value })}
                      className="text-xs h-9 font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Subtítulo Contextual</label>
                    <Input
                      value={slideAtual.subtitulo || ""}
                      onChange={(e) => handleAtualizarSlideAtual({ subtitulo: e.target.value })}
                      placeholder="Ex: Oportunidade e Estratégia Regional"
                      className="text-xs h-9"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Frase de Destaque / Conclusão (Opcional)</label>
                  <Input
                    value={slideAtual.destaque || ""}
                    onChange={(e) => handleAtualizarSlideAtual({ destaque: e.target.value })}
                    placeholder="Ex: O cliente que não te encontra no Google fecha com seu concorrente."
                    className="text-xs h-9 bg-muted/30"
                  />
                </div>

                {/* LISTA DE TÓPICOS DO SLIDE */}
                <div className="space-y-2 pt-2 border-t">
                  <label className="text-xs font-medium flex items-center justify-between">
                    <span>Tópicos & Argumentos do Slide</span>
                    <span className="text-[10px] text-muted-foreground">{slideAtual.pontos.length} tópicos</span>
                  </label>

                  <div className="space-y-2">
                    {slideAtual.pontos.map((ponto, pIdx) => (
                      <div key={pIdx} className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-muted-foreground w-4 text-center shrink-0">
                          {pIdx + 1}.
                        </span>
                        <Input
                          value={ponto}
                          onChange={(e) => handleEditarTopico(pIdx, e.target.value)}
                          className="text-xs h-8 flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoverTopico(pIdx)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive shrink-0"
                          title="Remover tópico"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* ADICIONAR NOVO TÓPICO */}
                  <div className="flex gap-2 pt-2">
                    <Input
                      value={novoTopicoTexto}
                      onChange={(e) => setNovoTopicoTexto(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAdicionarTopico();
                        }
                      }}
                      placeholder="Adicionar novo tópico ou argumento..."
                      className="text-xs h-8 flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAdicionarTopico}
                      className="h-8 text-xs gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Adicionar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* MODO APRESENTAÇÃO EM TELA CHEIA (SLIDESHOW) */
        <div className="space-y-4 print:hidden">
          <div className="flex items-center justify-between px-2">
            <Button
              onClick={() => setSlideAtivoIndex((p) => Math.max(0, p - 1))}
              disabled={slideAtivoIndex === 0}
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
            >
              <ChevronLeft className="h-4 w-4" />
              Slide Anterior
            </Button>

            <span className="text-xs font-semibold text-muted-foreground">
              Slide {slideAtivoIndex + 1} de {deck.slides.length}
            </span>

            <Button
              onClick={() => setSlideAtivoIndex((p) => Math.min(deck.slides.length - 1, p + 1))}
              disabled={slideAtivoIndex === deck.slides.length - 1}
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
            >
              Próximo Slide
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="max-w-5xl mx-auto shadow-2xl rounded-2xl overflow-hidden border border-border">
            <SlideCardVisual
              slide={slideAtual}
              numero={slideAtivoIndex + 1}
              total={deck.slides.length}
              empresa={empresa}
              isFullscreen
            />
          </div>
        </div>
      )}

      {/* ÁREA DE IMPRESSÃO / EXPORTAÇÃO EM PDF (FORMATO 16:9 / A4 PAISAGEM) */}
      <div className="hidden print:block space-y-0 print:space-y-0">
        {deck.slides.map((s, idx) => (
          <div
            key={s.id || idx}
            className="w-full h-screen p-12 flex flex-col justify-between bg-white text-slate-900 border-b border-slate-200"
            style={{ pageBreakAfter: "always", breakAfter: "page" }}
          >
            {/* TOPO DO SLIDE NO PDF */}
            <div className="flex items-center justify-between border-b pb-4 border-slate-200">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                  L
                </div>
                <div>
                  <span className="text-sm font-bold tracking-tight text-slate-900">Locomotiva Comunicação</span>
                  <span className="block text-[10px] text-slate-500 uppercase tracking-widest">Tecnologia & Estratégia 360</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-700">{empresa.nome}</span>
                <span className="block text-[10px] text-slate-400">{empresa.cidade}/RS</span>
              </div>
            </div>

            {/* CORPO DO SLIDE NO PDF */}
            <div className="py-8 space-y-6 flex-1 flex flex-col justify-center">
              <div>
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block mb-1">
                  Slide {idx + 1} · {s.tipo.toUpperCase().replace("_", " ")}
                </span>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  {s.titulo}
                </h1>
                {s.subtitulo && (
                  <p className="text-base text-slate-600 mt-1 font-medium">{s.subtitulo}</p>
                )}
              </div>

              <div className="space-y-3.5 my-auto">
                {s.pontos.map((p, pI) => (
                  <div key={pI} className="flex items-start gap-3">
                    <div className="h-5 w-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      ✓
                    </div>
                    <p className="text-sm text-slate-800 leading-relaxed font-normal">{p}</p>
                  </div>
                ))}
              </div>

              {s.destaque && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold text-xs leading-relaxed">
                  💡 {s.destaque}
                </div>
              )}
            </div>

            {/* RODAPÉ DO SLIDE NO PDF */}
            <div className="flex items-center justify-between border-t pt-4 border-slate-200 text-[10px] text-slate-400">
              <span>Proposta Comercial e Diagnóstico de Presença Digital</span>
              <span>Slide {idx + 1} de {deck.slides.length}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Componente Visual de Card de Slide (16:9) na Tela
 */
function SlideCardVisual({
  slide,
  numero,
  total,
  empresa,
  isFullscreen = false,
}: {
  slide: SlideItem;
  numero: number;
  total: number;
  empresa: Empresa;
  isFullscreen?: boolean;
}) {
  return (
    <div
      className={`w-full rounded-xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/30 shadow-md p-6 sm:p-8 flex flex-col justify-between transition-all ${
        isFullscreen ? "min-h-[500px]" : "min-h-[420px]"
      }`}
    >
      {/* CABEÇALHO DO SLIDE */}
      <div className="flex items-center justify-between border-b pb-4 border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            L
          </div>
          <div>
            <span className="text-xs font-bold text-foreground">Locomotiva Comunicação</span>
            <span className="block text-[9px] text-muted-foreground uppercase tracking-widest">
              Tecnologia & Estratégia 360
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] font-medium bg-background">
            {empresa.nome} · {empresa.cidade}
          </Badge>
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
            {numero}/{total}
          </span>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL DO SLIDE */}
      <div className="py-6 space-y-4 my-auto">
        <div>
          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block mb-1">
            {slide.tipo.replace("_", " ")}
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight leading-snug">
            {slide.titulo}
          </h2>
          {slide.subtitulo && (
            <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">
              {slide.subtitulo}
            </p>
          )}
        </div>

        <div className="space-y-2.5 pt-2">
          {slide.pontos.map((ponto, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-normal">
                {ponto}
              </p>
            </div>
          ))}
        </div>

        {slide.destaque && (
          <div className="p-3.5 rounded-lg border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 text-xs text-indigo-950 dark:text-indigo-200 font-semibold leading-relaxed">
            💡 {slide.destaque}
          </div>
        )}
      </div>

      {/* RODAPÉ DO SLIDE */}
      <div className="flex items-center justify-between border-t pt-3 border-border/60 text-[10px] text-muted-foreground">
        <span>Diagnóstico Estratégico de Presença Digital & Vendas</span>
        <span>Locomotiva Comunicação · Serra Gaúcha / RS</span>
      </div>
    </div>
  );
}
