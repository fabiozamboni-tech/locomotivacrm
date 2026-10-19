import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Printer,
  Save,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Presentation,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  CheckCircle2,
  Edit3,
  RotateCcw,
  FileDown,
  Download,
  Loader2,
  Phone,
  Mail,
  Globe,
  Instagram,
  Facebook,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Empresa, SlideItem, ApresentacaoSlidesData } from "@/lib/mock-data";
import { gerarApresentacaoPadrao } from "@/lib/slide-deck.functions";
import type { Dossier360Result } from "@/lib/dossier-360.functions";
import type { Relatorio } from "@/lib/relatorio.functions";
import { exportarApresentacaoPDF, exportarApresentacaoPPTX } from "@/lib/slide-deck-exporter";
import { SLIDE_TEMPLATE_ASSETS } from "@/lib/slide-templates-assets";

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
  const [exportandoPDF, setExportandoPDF] = useState(false);
  const [exportandoPPTX, setExportandoPPTX] = useState(false);

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

    setDeck((prev) => {
      // Se o último slide for "fim", insere antes do fim
      const slides = [...prev.slides];
      const ultimoSlide = slides[slides.length - 1];
      if (ultimoSlide && ultimoSlide.tipo === "fim") {
        slides.splice(slides.length - 1, 0, novoSlide);
      } else {
        slides.push(novoSlide);
      }
      return {
        ...prev,
        slides,
        atualizadoEm: new Date().toISOString(),
      };
    });
    setSlideAtivoIndex(Math.max(0, deck.slides.length - 1));
    toast.success("Novo slide adicionado!");
  };

  const handleExcluirSlide = (index: number) => {
    if (deck.slides.length <= 1) {
      toast.error("A apresentação deve ter pelo menos um slide.");
      return;
    }
    setDeck((prev) => {
      const novos = prev.slides.filter((_, i) => i !== index);
      return { ...prev, slides: novos, atualizadoEm: new Date().toISOString() };
    });
    setSlideAtivoIndex((prev) => Math.min(prev, deck.slides.length - 2));
    toast.info("Slide removido.");
  };

  const handleMoverSlide = (index: number, direcao: "cima" | "baixo") => {
    const novoIndex = direcao === "cima" ? index - 1 : index + 1;
    if (novoIndex < 0 || novoIndex >= deck.slides.length) return;

    setDeck((prev) => {
      const slides = [...prev.slides];
      const [removido] = slides.splice(index, 1);
      slides.splice(novoIndex, 0, removido);
      return { ...prev, slides, atualizadoEm: new Date().toISOString() };
    });
    setSlideAtivoIndex(novoIndex);
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

  const handleBaixarPDF = async () => {
    try {
      setExportandoPDF(true);
      await exportarApresentacaoPDF(deck, empresa);
      toast.success("Apresentação em PDF baixada com sucesso!");
    } catch (err: any) {
      console.error("Erro ao gerar PDF:", err);
      toast.error("Falha ao exportar PDF: " + (err?.message || "Erro desconhecido"));
    } finally {
      setExportandoPDF(false);
    }
  };

  const handleBaixarPPTX = async () => {
    try {
      setExportandoPPTX(true);
      await exportarApresentacaoPPTX(deck, empresa);
      toast.success("Apresentação em PowerPoint (.pptx) baixada com sucesso!");
    } catch (err: any) {
      console.error("Erro ao gerar PPTX:", err);
      toast.error("Falha ao exportar PPTX: " + (err?.message || "Erro desconhecido"));
    } finally {
      setExportandoPPTX(false);
    }
  };

  const handleImprimirPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* BARRA SUPERIOR DE CONTROLES (OCULTA NA IMPRESSÃO) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl border border-border/80 bg-card shadow-sm print:hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-[#d22d67]/10 text-[#d22d67] border-[#d22d67]/30">
              Apresentação Comercial Locomotiva
            </Badge>
            <span className="text-xs text-muted-foreground">{deck.slides.length} slides</span>
          </div>
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Presentation className="h-5 w-5 text-[#d22d67]" />
            <span>Deck de Apresentação Estratégica</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            Personalize os slides da proposta e exporte nos formatos oficiais para apresentação presencial ou envio no WhatsApp.
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
            className="gap-1.5 text-xs border-[#d22d67]/30 text-[#d22d67] hover:bg-[#d22d67]/10"
          >
            <Save className="h-3.5 w-3.5" />
            Salvar
          </Button>

          {/* BOTÃO BAIXAR EM PDF */}
          <Button
            onClick={handleBaixarPDF}
            disabled={exportandoPDF}
            size="sm"
            className="gap-1.5 text-xs bg-[#d22d67] hover:bg-[#b81d54] text-white shadow-sm"
          >
            {exportandoPDF ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileDown className="h-3.5 w-3.5" />
            )}
            Baixar em PDF
          </Button>

          {/* BOTÃO BAIXAR EM PPTX */}
          <Button
            onClick={handleBaixarPPTX}
            disabled={exportandoPPTX}
            size="sm"
            className="gap-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-sm dark:bg-slate-100 dark:text-slate-900"
          >
            {exportandoPPTX ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            Baixar em PPTX
          </Button>

          {/* BOTÃO IMPRIMIR NAVEGADOR */}
          <Button
            onClick={handleImprimirPDF}
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            title="Visualização e impressão direta pelo navegador"
          >
            <Printer className="h-3.5 w-3.5" />
            Imprimir
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
                  Slides ({deck.slides.length})
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
                const isCapa = s.tipo === "capa" || idx === 0;
                const isFim = s.tipo === "fim" || idx === deck.slides.length - 1;
                return (
                  <div
                    key={s.id || idx}
                    onClick={() => setSlideAtivoIndex(idx)}
                    className={`group p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                      ativo
                        ? "border-[#d22d67] bg-[#d22d67]/5 shadow-xs"
                        : "border-transparent hover:border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-[#d22d67]/10 text-[#d22d67] text-[9px] flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        {isCapa ? "Capa" : isFim ? "Encerramento" : `Slide ${idx + 1}`}
                      </span>
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoverSlide(idx, "cima");
                          }}
                          disabled={idx === 0}
                          className="p-1 hover:text-[#d22d67] disabled:opacity-30"
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
                          className="p-1 hover:text-[#d22d67] disabled:opacity-30"
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
                    <p className={`text-xs font-semibold line-clamp-1 ${ativo ? "text-[#d22d67]" : "text-foreground"}`}>
                      {s.titulo}
                    </p>
                    <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                      {isCapa ? empresa.nome : s.subtitulo || `${s.pontos.length} tópicos`}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* COLUNA DIREITA: EDITOR E PREVIEW DO SLIDE ATIVO */}
          <div className="space-y-6">
            {/* PREVIEW DO SLIDE ATIVO COM LAYOUT OFICIAL */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold">
                  Pré-visualização do Slide {slideAtivoIndex + 1} de {deck.slides.length}
                </span>
                <span className="text-[11px]">Padrão Visual Locomotiva (A4 Paisagem)</span>
              </div>

              <div className="rounded-xl overflow-hidden shadow-lg border border-border/80 bg-white">
                <SlideCardVisual
                  slide={slideAtual}
                  numero={slideAtivoIndex + 1}
                  total={deck.slides.length}
                  empresa={empresa}
                  deckTitulo={deck.titulo}
                />
              </div>
            </div>

            {/* FORMULÁRIO DE EDIÇÃO DO SLIDE */}
            <Card className="border-border/80">
              <CardHeader className="pb-3 border-b border-border/60">
                <CardTitle className="text-sm font-semibold flex items-center justify-between">
                  <span>Editar Conteúdo do Slide {slideAtivoIndex + 1}</span>
                  <Badge variant="outline" className="text-[10px] font-normal uppercase">
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

                {slideAtual.tipo !== "capa" && slideAtual.tipo !== "fim" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Frase de Destaque / Conclusão (Opcional)</label>
                    <Input
                      value={slideAtual.destaque || ""}
                      onChange={(e) => handleAtualizarSlideAtual({ destaque: e.target.value })}
                      placeholder="Ex: O cliente que não te encontra no Google fecha com seu concorrente."
                      className="text-xs h-9 bg-muted/30"
                    />
                  </div>
                )}

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

          <div className="max-w-5xl mx-auto shadow-2xl rounded-2xl overflow-hidden border border-border bg-white">
            <SlideCardVisual
              slide={slideAtual}
              numero={slideAtivoIndex + 1}
              total={deck.slides.length}
              empresa={empresa}
              deckTitulo={deck.titulo}
              isFullscreen
            />
          </div>
        </div>
      )}

      {/* ÁREA DE IMPRESSÃO / EXPORTAÇÃO EM PDF (FORMATO A4 PAISAGEM COM TEMPLATES OFICIAIS) */}
      <div className="hidden print:block space-y-0 print:space-y-0">
        {deck.slides.map((s, idx) => {
          const numeroPagina = idx + 1;
          const isCapa = s.tipo === "capa" || idx === 0;
          const isFim = s.tipo === "fim" || idx === deck.slides.length - 1;

          if (isCapa) {
            return (
              <div
                key={s.id || idx}
                className="w-full h-screen relative bg-white text-slate-900 overflow-hidden"
                style={{
                  pageBreakAfter: "always",
                  breakAfter: "page",
                  backgroundImage: `url(${SLIDE_TEMPLATE_ASSETS.capaBgBase64})`,
                  backgroundSize: "100% 100%",
                  backgroundRepeat: "no-repeat",
                }}
              >
                {/* TÍTULO, CLIENTE E DATA NA POSIÇÃO EXATA DA CAPA */}
                <div className="absolute top-[34%] left-[10.5%] max-w-[75%] space-y-3">
                  <h1 className="text-3xl font-extrabold uppercase text-slate-900 tracking-tight leading-tight">
                    {s.titulo || deck.titulo}
                  </h1>
                  <h2 className="text-xl font-medium uppercase text-slate-700 tracking-wide pt-1">
                    {empresa.nome}
                  </h2>
                  <p className="text-xs font-normal uppercase text-slate-500 tracking-wider pt-6">
                    {format(new Date(), "dd 'DE' MMMM 'DE' yyyy", { locale: ptBR }).toUpperCase()}
                  </p>
                </div>
              </div>
            );
          }

          if (isFim) {
            return (
              <div
                key={s.id || idx}
                className="w-full h-screen relative bg-white text-slate-900 overflow-hidden"
                style={{
                  pageBreakAfter: "always",
                  breakAfter: "page",
                  backgroundImage: `url(${SLIDE_TEMPLATE_ASSETS.fimBgBase64})`,
                  backgroundSize: "100% 100%",
                  backgroundRepeat: "no-repeat",
                }}
              />
            );
          }

          return (
            <div
              key={s.id || idx}
              className="w-full h-screen relative bg-white text-slate-900 overflow-hidden p-12"
              style={{
                pageBreakAfter: "always",
                breakAfter: "page",
                backgroundImage: `url(${SLIDE_TEMPLATE_ASSETS.internoBgBase64})`,
                backgroundSize: "100% 100%",
                backgroundRepeat: "no-repeat",
              }}
            >
              {/* HEADER TOPO ESQUERDO: TITULO EM NEGRITO - CLIENTE */}
              <div className="absolute top-[7.2%] left-[7.6%] text-xs tracking-wide">
                <span className="font-bold text-slate-800">{deck.titulo.toUpperCase()}</span>
                <span className="text-slate-500 font-normal"> - {empresa.nome.toUpperCase()}</span>
              </div>

              {/* NÚMERO DA PÁGINA NO BADGE ROSA NO CANTO INFERIOR ESQUERDO */}
              <div className="absolute bottom-[3.2%] left-0 w-11 h-7 bg-[#d22d67] flex items-center justify-center font-bold text-white text-xs">
                {numeroPagina}
              </div>

              {/* CORPO DO SLIDE */}
              <div className="pt-14 px-4 flex flex-col justify-between h-[84%]">
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
                    {s.titulo}
                  </h1>
                  {s.subtitulo && (
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">{s.subtitulo}</p>
                  )}
                </div>

                <div className="space-y-3.5 my-auto py-2">
                  {s.pontos.map((p, pI) => (
                    <div key={pI} className="flex items-start gap-3">
                      <div className="h-4 w-4 rounded-full bg-pink-50 text-[#d22d67] border border-pink-200 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        ✓
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed font-normal">{p}</p>
                    </div>
                  ))}
                </div>

                {s.destaque && (
                  <div className="p-3.5 rounded-xl bg-pink-50/70 border border-pink-200 text-pink-900 font-semibold text-xs leading-relaxed">
                    💡 {s.destaque}
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

/**
 * Componente Visual de Card de Slide (Proporção 842:595 / A4 Paisagem) com os templates oficiais da Locomotiva
 */
function SlideCardVisual({
  slide,
  numero,
  total,
  empresa,
  deckTitulo = "Apresentação Estratégica",
  isFullscreen = false,
}: {
  slide: SlideItem;
  numero: number;
  total: number;
  empresa: Empresa;
  deckTitulo?: string;
  isFullscreen?: boolean;
}) {
  const isCapa = slide.tipo === "capa" || numero === 1;
  const isFim = slide.tipo === "fim" || numero === total;

  const dataExtenso = format(new Date(), "dd 'DE' MMMM 'DE' yyyy", { locale: ptBR }).toUpperCase();

  // 1. SLIDE DE CAPA
  if (isCapa) {
    return (
      <div
        className="w-full relative bg-white text-slate-900 select-none overflow-hidden aspect-[842/595] shadow-xs"
        style={{
          backgroundImage: `url(${SLIDE_TEMPLATE_ASSETS.capaBgBase64})`,
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute top-[32%] sm:top-[34%] left-[10.5%] max-w-[75%] space-y-2 sm:space-y-3">
          <h1
            className={`font-extrabold uppercase text-slate-900 tracking-tight leading-tight ${
              isFullscreen ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"
            }`}
          >
            {slide.titulo || deckTitulo}
          </h1>
          <h2
            className={`font-medium uppercase text-slate-700 tracking-wide pt-1 ${
              isFullscreen ? "text-base sm:text-lg" : "text-sm sm:text-base"
            }`}
          >
            {empresa.nome}
          </h2>
          <p
            className={`font-normal uppercase text-slate-500 tracking-wider pt-4 sm:pt-6 ${
              isFullscreen ? "text-xs" : "text-[11px]"
            }`}
          >
            {dataExtenso}
          </p>
        </div>
      </div>
    );
  }

  // 2. SLIDE FINAL (FIM)
  if (isFim) {
    return (
      <div
        className="w-full relative bg-white text-slate-900 select-none overflow-hidden aspect-[842/595] shadow-xs"
        style={{
          backgroundImage: `url(${SLIDE_TEMPLATE_ASSETS.fimBgBase64})`,
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Camada acessível invisível ou informativa sobre contatos */}
        <div className="sr-only">
          <h3>Locomotiva Comunicação</h3>
          <p>Telefone: 54 9703-9116</p>
          <p>E-mail: fabi@locomotiva.live</p>
          <p>Website: www.locomotiva.live</p>
          <p>Instagram: @locomotivacom</p>
          <p>Facebook: /locomotivacom</p>
        </div>
      </div>
    );
  }

  // 3. SLIDES INTERNOS (Páginas 2 até N-1)
  return (
    <div
      className="w-full relative bg-white text-slate-900 select-none overflow-hidden aspect-[842/595] shadow-xs"
      style={{
        backgroundImage: `url(${SLIDE_TEMPLATE_ASSETS.internoBgBase64})`,
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* HEADER NO TOPO ESQUERDO: TITULO EM NEGRITO - CLIENTE */}
      <div className="absolute top-[6.5%] sm:top-[7.2%] left-[7.6%] text-[10px] sm:text-xs tracking-wide">
        <span className="font-bold text-slate-800">{deckTitulo.toUpperCase()}</span>
        <span className="text-slate-500 font-normal"> - {empresa.nome.toUpperCase()}</span>
      </div>

      {/* BADGE ROSA COM O NÚMERO DA PÁGINA NO CANTO INFERIOR ESQUERDO */}
      <div className="absolute bottom-[3.2%] left-0 w-8 sm:w-11 h-5 sm:h-7 bg-[#d22d67] flex items-center justify-center font-bold text-white text-[10px] sm:text-xs">
        {numero}
      </div>

      {/* CORPO DO SLIDE */}
      <div className="absolute top-[17%] left-[7.6%] right-[7.6%] bottom-[12%] flex flex-col justify-between">
        <div>
          <h2
            className={`font-extrabold text-slate-900 tracking-tight leading-tight ${
              isFullscreen ? "text-xl sm:text-2xl" : "text-lg sm:text-xl"
            }`}
          >
            {slide.titulo}
          </h2>
          {slide.subtitulo && (
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 font-medium">
              {slide.subtitulo}
            </p>
          )}
        </div>

        {/* LISTA DE PONTOS / BULLETS */}
        <div className="space-y-2.5 my-auto py-1.5">
          {slide.pontos.map((ponto, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <div className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full bg-pink-50 text-[#d22d67] border border-pink-200 flex items-center justify-center font-bold text-[9px] sm:text-[10px] shrink-0 mt-0.5">
                ✓
              </div>
              <p
                className={`text-slate-800 leading-relaxed font-normal ${
                  isFullscreen ? "text-xs sm:text-sm" : "text-[11px] sm:text-xs"
                }`}
              >
                {ponto}
              </p>
            </div>
          ))}
        </div>

        {/* BOX DE DESTAQUE */}
        {slide.destaque && (
          <div className="p-2.5 sm:p-3 rounded-lg bg-pink-50/70 border border-pink-200 text-pink-900 font-semibold text-[11px] sm:text-xs leading-relaxed">
            💡 {slide.destaque}
          </div>
        )}
      </div>
    </div>
  );
}
