import { useState, useMemo, useRef } from "react";
import {
  Sparkles,
  Upload,
  Image as ImageIcon,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Eye,
  Sliders,
  AlertCircle,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { gerarImagemSite_ServerFn } from "@/lib/image-generator.server";
import type { Empresa } from "@/lib/mock-data";

interface PainelImagensSiteProps {
  siteHtml: string;
  onAtualizarHtml: (novoHtml: string, descricao: string) => void;
  empresa: Empresa;
}

interface ImagemDetectada {
  id: string;
  indice: number;
  src: string;
  alt: string;
  tipoEstimado: "hero" | "destaque" | "servico" | "logo" | "geral";
  larguraEstimada?: number;
  alturaEstimada?: number;
}

export function PainelImagensSite({
  siteHtml,
  onAtualizarHtml,
  empresa,
}: PainelImagensSiteProps) {
  const [modalGerarOpen, setModalGerarOpen] = useState(false);
  const [imagemSelecionada, setImagemSelecionada] = useState<ImagemDetectada | null>(null);
  const [promptEdicao, setPromptEdicao] = useState("");
  const [estiloVisual, setEstiloVisual] = useState<"arquitetura" | "estudio" | "editorial" | "lifestyle">("arquitetura");
  const [provedorEscolhido, setProvedorEscolhido] = useState<"auto" | "pollinations" | "gemini">("auto");
  const [gerandoImagem, setGerandoImagem] = useState(false);
  const [modalPreviewOpen, setModalPreviewOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const [regerandoTodas, setRegerandoTodas] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [indiceParaUpload, setIndiceParaUpload] = useState<number | null>(null);

  const serverGerarImagem = useServerFn(gerarImagemSite_ServerFn);

  // Extrai todas as tags <img> do código HTML
  const imagensDetectadas = useMemo<ImagemDetectada[]>(() => {
    if (!siteHtml || typeof window === "undefined") return [];

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(siteHtml, "text/html");
      const imgNodes = Array.from(doc.querySelectorAll("img"));

      return imgNodes.map((img, idx) => {
        const src = img.getAttribute("src") || "";
        const alt = img.getAttribute("alt") || `Imagem ${idx + 1}`;
        const className = img.getAttribute("class") || "";

        const isLogo =
          (empresa.estudioLogoAnexo?.dataUrl && src === empresa.estudioLogoAnexo.dataUrl) ||
          alt.toLowerCase().includes("logo") ||
          className.toLowerCase().includes("logo") ||
          src.toLowerCase().includes("logo");

        let tipo: "hero" | "destaque" | "servico" | "logo" | "geral" = "geral";
        if (isLogo) {
          tipo = "logo";
        } else if (idx === 0 || className.includes("hero") || alt.toLowerCase().includes("hero") || alt.toLowerCase().includes("capa")) {
          tipo = "hero";
        } else if (idx === 1 || className.includes("destaque") || alt.toLowerCase().includes("destaque") || alt.toLowerCase().includes("sobre")) {
          tipo = "destaque";
        } else if (alt.toLowerCase().includes("serviç") || alt.toLowerCase().includes("servic") || alt.toLowerCase().includes("projeto")) {
          tipo = "servico";
        }

        return {
          id: `img-${idx}-${src.slice(-15).replace(/[^a-zA-Z0-9]/g, "")}`,
          indice: idx,
          src,
          alt,
          tipoEstimado: tipo,
        };
      });
    } catch {
      return [];
    }
  }, [siteHtml, empresa.estudioLogoAnexo?.dataUrl]);

  // Substitui a URL de uma imagem específica no código HTML
  const aplicarNovaImagemNoHtml = (indice: number, novaUrl: string, novoAlt?: string) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(siteHtml, "text/html");
      const imgNodes = Array.from(doc.querySelectorAll("img"));

      if (imgNodes[indice]) {
        imgNodes[indice].setAttribute("src", novaUrl);
        if (novoAlt) {
          imgNodes[indice].setAttribute("alt", novoAlt);
        }
        const novoHtml = "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
        onAtualizarHtml(novoHtml, `Substituição da imagem #${indice + 1} (${imgNodes[indice].getAttribute("alt") || "foto"})`);
      }
    } catch (err: any) {
      toast.error("Erro ao aplicar nova imagem no HTML: " + err.message);
    }
  };

  // Abre modal para gerar imagem com IA
  const handleAbrirModalGerar = (img: ImagemDetectada) => {
    setImagemSelecionada(img);
    // Sugestão de prompt com base no nicho, cidade e alt da foto
    const sugestao = img.alt && !img.alt.includes("Imagem")
      ? `${img.alt} para ${empresa.segmento || "empresa"} em ${empresa.cidade || "Serra Gaúcha"}`
      : `${empresa.segmento || "empresa"} de alto padrão em ${empresa.cidade || "Serra Gaúcha"}`;
    setPromptEdicao(sugestao);
    setModalGerarOpen(true);
  };

  // Dispara a geração de imagem por IA
  const handleConfirmarGeracaoIa = async () => {
    if (!imagemSelecionada || !promptEdicao.trim()) return;

    setGerandoImagem(true);
    try {
      const estiloModificador =
        estiloVisual === "arquitetura"
          ? "architectural photography, luxury high end interior and exterior, 8k, cinematic daylight"
          : estiloVisual === "estudio"
          ? "commercial studio lighting, crisp sharp focus, product and craftsmanship presentation, pristine finish"
          : estiloVisual === "editorial"
          ? "magazine editorial photography, warm natural sunlight, sophisticated authentic composition"
          : "lifestyle authentic photography in Serra Gaucha Brazil, warm ambient lighting";

      const promptCompleto = `${promptEdicao.trim()}, ${estiloModificador}`;

      const res = await serverGerarImagem({
        data: {
          prompt: promptCompleto,
          tipo: imagemSelecionada.tipoEstimado === "hero" ? "hero" : imagemSelecionada.tipoEstimado === "servico" ? "servico" : "destaque",
          formato: imagemSelecionada.tipoEstimado === "hero" ? "16:9" : "4:3",
          nicho: empresa.segmento,
          cidade: empresa.cidade,
          empresaNome: empresa.nome,
          provedorPreferencial: provedorEscolhido,
        },
      });

      if (res && res.sucesso && res.url) {
        aplicarNovaImagemNoHtml(imagemSelecionada.indice, res.url, promptEdicao.trim());
        toast.success(
          res.provedor === "google_imagen_3"
            ? "Nova imagem gerada com Google Imagen 3 e aplicada com sucesso!"
            : "Nova imagem fotográfica gerada via FLUX.1 e aplicada com sucesso!"
        );
        setModalGerarOpen(false);
      } else {
        toast.error("Não foi possível gerar a imagem: " + (res?.erro || "tente novamente."));
      }
    } catch (err: any) {
      toast.error("Erro na geração da imagem: " + (err.message || "tente novamente."));
    } finally {
      setGerandoImagem(false);
    }
  };

  // Upload de foto real da empresa
  const handleIniciarUpload = (indice: number) => {
    setIndiceParaUpload(indice);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleArquivoSelecionado = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || indiceParaUpload === null) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem válida (JPG, PNG, WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      aplicarNovaImagemNoHtml(indiceParaUpload, dataUrl, file.name.replace(/\.[^/.]+$/, ""));
      toast.success(`Foto real "${file.name}" aplicada no site com sucesso!`);
      setIndiceParaUpload(null);
    };
    reader.readAsDataURL(file);
  };

  // Copiar link da imagem
  const handleCopiarLink = async (id: string, url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiadoId(id);
    toast.success("Link da imagem copiado!");
    setTimeout(() => setCopiadoId(null), 2000);
  };

  // Regerar todas as imagens do site de uma só vez
  const handleRegerarTodasImagens = async () => {
    if (imagensDetectadas.length === 0) return;

    setRegerandoTodas(true);
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(siteHtml, "text/html");
      const imgNodes = Array.from(doc.querySelectorAll("img"));

      let count = 0;
      for (let i = 0; i < imgNodes.length; i++) {
        const img = imgNodes[i];
        const alt = img.getAttribute("alt") || "";
        const isLogo =
          (empresa.estudioLogoAnexo?.dataUrl && img.getAttribute("src") === empresa.estudioLogoAnexo.dataUrl) ||
          alt.toLowerCase().includes("logo");

        // Não substitui o logo oficial do cliente
        if (isLogo) continue;

        const isHero = i === 0 || alt.toLowerCase().includes("hero");
        const seed = Math.floor(Math.random() * 900000) + 100000;
        const width = isHero ? 1600 : 800;
        const height = isHero ? 900 : 600;

        const termoIngles = encodeURIComponent(
          `${alt || empresa.segmento || "business"} in ${empresa.cidade || "Serra Gaucha"} architectural photography 8k cinematic lighting`
        );
        const novaUrl = `https://image.pollinations.ai/prompt/${termoIngles}?width=${width}&height=${height}&model=flux&nologo=true&seed=${seed}`;

        img.setAttribute("src", novaUrl);
        count++;
      }

      const novoHtml = "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
      onAtualizarHtml(novoHtml, `Regeneração de ${count} imagens com IA (FLUX.1)`);
      toast.success(`${count} imagens do site foram regeradas com novas fotos por IA!`);
    } catch (err: any) {
      toast.error("Erro ao regerar imagens: " + err.message);
    } finally {
      setRegerandoTodas(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-3">
      {/* Input oculto para upload de foto real */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleArquivoSelecionado}
      />

      {/* HEADER DE INFORMAÇÕES & AÇÕES */}
      <div className="p-3 bg-muted/40 border rounded-lg space-y-2 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-semibold text-foreground">
              Galeria de Imagens do Site ({imagensDetectadas.length})
            </span>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleRegerarTodasImagens}
            disabled={regerandoTodas || imagensDetectadas.length === 0}
            className="h-7 text-[11px] gap-1 px-2 border-emerald-500/30 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
            title="Gera novas sementes para todas as imagens fotográficas do site"
          >
            <RefreshCw className={`h-3 w-3 ${regerandoTodas ? "animate-spin" : ""}`} />
            <span>Regerar Todas</span>
          </Button>
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Cada foto do site pode ser gerada com modelos de IA (<strong>FLUX.1</strong> ou <strong>Google Imagen 3</strong>) ou substituída por fotos reais da empresa.
        </p>
      </div>

      {/* LISTA DE IMAGENS DETECTADAS */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[200px]">
        {imagensDetectadas.length === 0 ? (
          <div className="p-6 text-center border border-dashed rounded-lg bg-muted/10 space-y-2">
            <ImageIcon className="h-8 w-8 text-muted-foreground/60 mx-auto" />
            <p className="text-xs font-medium text-foreground">Nenhuma imagem detectada no site</p>
            <p className="text-[11px] text-muted-foreground">
              Gere o site primeiro para visualizar e editar as imagens fotográficas de capa, serviços e destaques.
            </p>
          </div>
        ) : (
          imagensDetectadas.map((img) => {
            const isLogo = img.tipoEstimado === "logo";
            return (
              <Card key={img.id} className="border border-border/80 overflow-hidden shadow-xs hover:border-primary/40 transition-colors">
                <CardContent className="p-2.5 space-y-2">
                  <div className="flex items-start gap-2.5">
                    {/* THUMBNAIL DA IMAGEM */}
                    <div
                      onClick={() => {
                        setPreviewSrc(img.src);
                        setModalPreviewOpen(true);
                      }}
                      className="w-20 h-16 rounded border bg-muted/30 shrink-0 overflow-hidden relative cursor-pointer group"
                    >
                      <img
                        src={img.src}
                        alt={img.alt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          // Fallback se a imagem falhar
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80";
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Eye className="h-4 w-4 text-white" />
                      </div>
                    </div>

                    {/* METADADOS & TAGS */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge
                          variant={isLogo ? "secondary" : "default"}
                          className={`text-[9px] px-1.5 py-0 h-4 font-semibold uppercase ${
                            img.tipoEstimado === "hero"
                              ? "bg-purple-500/10 text-purple-700 border-purple-500/20"
                              : img.tipoEstimado === "destaque"
                              ? "bg-blue-500/10 text-blue-700 border-blue-500/20"
                              : img.tipoEstimado === "servico"
                              ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                              : isLogo
                              ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {img.tipoEstimado === "hero"
                            ? "Capa / Hero"
                            : img.tipoEstimado === "destaque"
                            ? "Quem Somos"
                            : img.tipoEstimado === "servico"
                            ? "Serviço"
                            : isLogo
                            ? "Logo da Marca"
                            : "Imagem"}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground font-mono">#{img.indice + 1}</span>
                      </div>

                      <p className="text-xs font-medium text-foreground line-clamp-1" title={img.alt}>
                        {img.alt || "Sem descrição"}
                      </p>

                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground truncate">
                        {img.src.includes("pollinations") ? (
                          <span className="text-emerald-600 font-medium">✨ Gerada por IA (FLUX.1)</span>
                        ) : img.src.includes("base64") ? (
                          <span className="text-blue-600 font-medium">📁 Foto Local / Base64</span>
                        ) : img.src.includes("unsplash") ? (
                          <span>Fototeca Unsplash</span>
                        ) : (
                          <span>Imagem Externa</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AÇÕES DA IMAGEM */}
                  <div className="flex items-center gap-1.5 pt-1 border-t border-border/60">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAbrirModalGerar(img)}
                      className="h-6 text-[10px] gap-1 px-2 text-primary hover:bg-primary/10 border-primary/20 flex-1"
                    >
                      <Wand2 className="h-3 w-3" />
                      <span>Gerar com IA</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleIniciarUpload(img.indice)}
                      className="h-6 text-[10px] gap-1 px-2 text-muted-foreground hover:text-foreground"
                      title="Substituir por foto real tirada pela empresa"
                    >
                      <Upload className="h-3 w-3" />
                      <span>Foto Real</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopiarLink(img.id, img.src)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                      title="Copiar URL da imagem"
                    >
                      {copiadoId === img.id ? (
                        <Check className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* MODAL DE GERAÇÃO DE IMAGEM COM IA */}
      <Dialog open={modalGerarOpen} onOpenChange={setModalGerarOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-5 w-5 text-emerald-500" />
              <span>Gerar Imagem com IA para o Site</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Especifique como deseja a foto. O sistema montará o prompt fotográfico em inglês de alta fidelidade para o modelo de difusão.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            {/* DESCRIÇÃO DO ELEMENTO */}
            <div className="space-y-1">
              <label className="font-semibold text-foreground text-xs">Descrição da Imagem (em português ou inglês):</label>
              <Textarea
                rows={3}
                value={promptEdicao}
                onChange={(e) => setPromptEdicao(e.target.value)}
                placeholder="Ex: Cozinha moderna com bancada de quartzo calacatta e iluminação embutida..."
                className="text-xs"
              />
            </div>

            {/* ESTILO VISUAL */}
            <div className="space-y-1">
              <label className="font-semibold text-foreground text-xs">Estilo Fotográfico:</label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: "arquitetura", nome: "Arquitetônico / Interiores", desc: "Luz natural, 8k, ângulos amplos" },
                  { id: "estudio", nome: "Estúdio / Comercial", desc: "Foco nítido, fundo limpo, detalhes" },
                  { id: "editorial", nome: "Editorial / Revista", desc: "Revista de design, luz suave" },
                  { id: "lifestyle", nome: "Ambiente Regional", desc: "Serra Gaúcha, calor humano" },
                ].map((estilo) => (
                  <button
                    key={estilo.id}
                    type="button"
                    onClick={() => setEstiloVisual(estilo.id as any)}
                    className={`p-2 rounded border text-left transition-all ${
                      estiloVisual === estilo.id
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    <p className="text-[11px] leading-tight text-foreground">{estilo.nome}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{estilo.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* PROVEDOR DE IA */}
            <div className="space-y-1 pt-1">
              <label className="font-semibold text-foreground text-xs">Modelo Gerador:</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setProvedorEscolhido("auto")}
                  className={`flex-1 p-2 rounded border text-left text-[11px] ${
                    provedorEscolhido === "auto"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 font-semibold"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  <p className="font-semibold">FLUX.1 (Pollinations)</p>
                  <p className="text-[10px] text-muted-foreground">Rápido, gratuito, fotorrealista</p>
                </button>

                <button
                  type="button"
                  onClick={() => setProvedorEscolhido("gemini")}
                  className={`flex-1 p-2 rounded border text-left text-[11px] ${
                    provedorEscolhido === "gemini"
                      ? "border-blue-500 bg-blue-500/10 text-blue-700 font-semibold"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  <p className="font-semibold">Google Imagen 3</p>
                  <p className="text-[10px] text-muted-foreground">Via Gemini API (se configurada)</p>
                </button>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalGerarOpen(false)}
              disabled={gerandoImagem}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmarGeracaoIa}
              disabled={gerandoImagem || !promptEdicao.trim()}
              className="gap-1.5"
            >
              {gerandoImagem ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Gerando Imagem com IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Gerar e Aplicar no Site</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE PREVIEW DA IMAGEM EM TELA CHEIA */}
      <Dialog open={modalPreviewOpen} onOpenChange={setModalPreviewOpen}>
        <DialogContent className="sm:max-w-[700px] p-2 bg-black/90 border-zinc-800">
          <div className="relative max-h-[80vh] flex items-center justify-center overflow-hidden rounded">
            {previewSrc && (
              <img
                src={previewSrc}
                alt="Visualização"
                className="max-h-[75vh] w-auto max-w-full object-contain rounded"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
