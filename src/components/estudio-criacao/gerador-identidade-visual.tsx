import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Sparkles,
  Download,
  Copy,
  CheckCircle2,
  Trash2,
  Maximize2,
  RefreshCw,
  Briefcase,
  Award,
  PenTool,
} from "lucide-react";
import { gerarUrlPollinationsFlux } from "@/lib/image-generator.server";

export interface LogoGeradoItem {
  id: string;
  url: string;
  estilo: string;
  prompt: string;
  criadoEm: string;
}

export interface MaterialEscritorioItem {
  id: string;
  url: string;
  tipo: string;
  titulo: string;
  prompt: string;
  criadoEm: string;
}

interface GeradorIdentidadeVisualProps {
  empresaId: string;
  empresaNome: string;
  segmento: string;
  cidade: string;
  corPrimariaHex?: string;
  logoAtivoUrl?: string;
  logosSalvos?: LogoGeradoItem[];
  materiaisSalvos?: MaterialEscritorioItem[];
  onSalvarLogos?: (logos: LogoGeradoItem[]) => void;
  onSalvarMateriais?: (materiais: MaterialEscritorioItem[]) => void;
  onDefinirComoLogoOficial?: (logoUrl: string, nomeArquivo?: string) => void;
}

const ESTILOS_LOGO = [
  {
    id: "minimalista",
    nome: "Minimalista & Moderno",
    desc: "Geometria pura, tipografia suíça refinada e alto contraste",
    promptEn: "minimalist modern vector logo design, clean pure geometry, Swiss typographic elegance, high contrast on neutral white background, vector emblem, award winning identity",
  },
  {
    id: "monograma",
    nome: "Monograma / Símbolo Geométrico",
    desc: "Iniciais ou ícone abstrato com proporção áurea",
    promptEn: "golden ratio geometric monogram symbol logo, luxury corporate mark, sharp vector lines, high end minimal branding, isolated on clean background",
  },
  {
    id: "emblema",
    nome: "Emblema & Brasão Nobre",
    desc: "Selo de autenticidade, tradição e alta autoridade",
    promptEn: "prestigious craftsmanship heritage emblem logo, refined circular stamp badge, artisanal authority, luxury bespoke mark on pure background",
  },
  {
    id: "editorial",
    nome: "Tipográfico Editorial Contemporâneo",
    desc: "Serifa sofisticada estilo revista e arquitetura de alto padrão",
    promptEn: "contemporary architectural editorial wordmark logo, bespoke high-fashion serif typography, balanced letterspacing, luxury studio identity",
  },
  {
    id: "artesanal",
    nome: "Ofício & Traço Técnico",
    desc: "Alusão direta à especialidade e precisão dos materiais",
    promptEn: "technical precision craft insignia logo, architectural blueprint lines, master artisan mark, refined industrial vector logo",
  },
];

const TIPOS_MATERIAL_ESCRITORIO = [
  {
    id: "kit_completo",
    titulo: "Kit Completo de Papelaria Corporativa",
    desc: "Cartão de visita, papel timbrado A4, pasta com aba, envelope e caneta nobre",
    promptEn: (nome: string, seg: string, cid: string, cor: string) =>
      `luxury corporate stationery branding mockup for ${nome} ${seg} in ${cid}, business card letterhead A4 presentation folder corporate envelope and premium pen, color palette accent ${cor}, clean photorealistic studio photography, soft lighting, 8k resolution`,
  },
  {
    id: "cartao_visita",
    titulo: "Cartões de Visita Premium (Frente & Verso)",
    desc: "Textura tátil de alta gramatura, cantos vivos e relevo seco",
    promptEn: (nome: string, seg: string, cid: string, cor: string) =>
      `close up photorealistic luxury business cards mockup for ${nome} ${seg}, heavy linen paper texture, blind deboss foil stamp, accent color ${cor}, architectural digest style desk background, sharp focus, studio lighting`,
  },
  {
    id: "pasta_timbrado",
    titulo: "Pasta Executiva & Papel Timbrado",
    desc: "Apresentação impecável para orçamentos e propostas comerciais",
    promptEn: (nome: string, seg: string, cid: string, cor: string) =>
      `executive presentation folder with inside pocket and embossed letterhead document mockup for ${nome} in ${cid}, corporate branding ${seg}, subtle gold or foil accent ${cor}, top view commercial photography`,
  },
  {
    id: "cracha_equipe",
    titulo: "Crachás de Identificação & Cordão",
    desc: "Identificação profissional para equipe de campo e atendimento",
    promptEn: (nome: string, seg: string, cid: string, cor: string) =>
      `modern corporate ID badge card and branded fabric lanyard mockup for ${nome} team, frosted acrylic badge, color accents ${cor}, professional clean look on solid stone surface`,
  },
  {
    id: "caneca_brindes",
    titulo: "Caneca Cerâmica & Brindes Corporativos",
    desc: "Caneca fosca de café e moleskine de capa dura para clientes",
    promptEn: (nome: string, seg: string, cid: string, cor: string) =>
      `matte ceramic coffee mug and luxury leather notebook journal branded with logo of ${nome} in ${cid}, subtle brand accent ${cor}, warm natural lighting, cozy modern office desk setting`,
  },
  {
    id: "uniformes",
    titulo: "Camisas Pólo & Uniforme Corporativo",
    desc: "Bordado minimalista e tecido premium para atendimento",
    promptEn: (nome: string, seg: string, cid: string, cor: string) =>
      `premium cotton pique polo shirt mockup with subtle embroidered logo on chest for ${nome} ${seg}, clean folded apparel presentation on wooden surface, luxury workwear, crisp focus`,
  },
];

export function GeradorIdentidadeVisual({
  empresaId,
  empresaNome,
  segmento,
  cidade,
  corPrimariaHex = "#722F37",
  logoAtivoUrl,
  logosSalvos = [],
  materiaisSalvos = [],
  onSalvarLogos,
  onSalvarMateriais,
  onDefinirComoLogoOficial,
}: GeradorIdentidadeVisualProps) {
  const [subAba, setSubAba] = useState<"logos" | "papelaria">("logos");

  // Estado para Logos
  const [estiloLogoSelecionado, setEstiloLogoSelecionado] = useState(ESTILOS_LOGO[0].id);
  const [fundoEscuro, setFundoEscuro] = useState(false);
  const [gerandoLogo, setGerandoLogo] = useState(false);
  const [logos, setLogos] = useState<LogoGeradoItem[]>(logosSalvos);

  // Estado para Material de Escritório
  const [tipoMaterialSelecionado, setTipoMaterialSelecionado] = useState(TIPOS_MATERIAL_ESCRITORIO[0].id);
  const [gerandoMaterial, setGerandoMaterial] = useState(false);
  const [materiais, setMateriais] = useState<MaterialEscritorioItem[]>(materiaisSalvos);

  // Modal de Zoom de Imagem
  const [imagemModal, setImagemModal] = useState<{ url: string; titulo: string } | null>(null);

  // Sincroniza se as props mudarem
  React.useEffect(() => {
    setLogos(logosSalvos);
  }, [logosSalvos]);

  React.useEffect(() => {
    setMateriais(materiaisSalvos);
  }, [materiaisSalvos]);

  // GERAÇÃO DE LOGOTIPO COM IA (FLUX.1)
  const handleGerarLogos = () => {
    setGerandoLogo(true);
    try {
      const estiloObj = ESTILOS_LOGO.find((e) => e.id === estiloLogoSelecionado) || ESTILOS_LOGO[0];
      const novosItens: LogoGeradoItem[] = [];

      // Gera 2 variações do estilo selecionado
      for (let i = 1; i <= 2; i++) {
        const seedExtra = Math.floor(Math.random() * 999999);
        const promptMontado = `${estiloObj.promptEn} for company named "${empresaNome}", niche ${segmento} in ${cidade} Brazil, brand color accent ${corPrimariaHex}, variation ${i}, seed ${seedExtra}`;
        const url = gerarUrlPollinationsFlux(promptMontado, 800, 800);

        novosItens.push({
          id: `logo_${Date.now()}_${i}`,
          url,
          estilo: estiloObj.nome,
          prompt: promptMontado,
          criadoEm: new Date().toISOString(),
        });
      }

      const listaAtualizada = [...novosItens, ...logos];
      setLogos(listaAtualizada);
      onSalvarLogos?.(listaAtualizada);
      toast.success(`2 novas opções de logotipo conceituais geradas para ${empresaNome}!`);
    } catch {
      toast.error("Erro ao gerar opções de logotipo.");
    } finally {
      setGerandoLogo(false);
    }
  };

  // GERAÇÃO DE MATERIAL DE ESCRITÓRIO COM IA (FLUX.1)
  const handleGerarMaterial = () => {
    setGerandoMaterial(true);
    try {
      const materialObj =
        TIPOS_MATERIAL_ESCRITORIO.find((m) => m.id === tipoMaterialSelecionado) ||
        TIPOS_MATERIAL_ESCRITORIO[0];

      const promptFinal = materialObj.promptEn(empresaNome, segmento, cidade, corPrimariaHex);
      const url = gerarUrlPollinationsFlux(promptFinal, 1200, 800);

      const novoItem: MaterialEscritorioItem = {
        id: `mat_${Date.now()}`,
        url,
        tipo: materialObj.id,
        titulo: materialObj.titulo,
        prompt: promptFinal,
        criadoEm: new Date().toISOString(),
      };

      const listaAtualizada = [novoItem, ...materiais];
      setMateriais(listaAtualizada);
      onSalvarMateriais?.(listaAtualizada);
      toast.success(`${materialObj.titulo} gerado com sucesso para ${empresaNome}!`);
    } catch {
      toast.error("Erro ao gerar mockup de papelaria corporativa.");
    } finally {
      setGerandoMaterial(false);
    }
  };

  const handleRemoverLogo = (id: string) => {
    const filtrados = logos.filter((l) => l.id !== id);
    setLogos(filtrados);
    onSalvarLogos?.(filtrados);
    toast.info("Opção de logotipo removida.");
  };

  const handleRemoverMaterial = (id: string) => {
    const filtrados = materiais.filter((m) => m.id !== id);
    setMateriais(filtrados);
    onSalvarMateriais?.(filtrados);
    toast.info("Item de papelaria removido.");
  };

  const handleDownload = async (url: string, nomeArquivo: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${nomeArquivo}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      toast.success(`Download de ${nomeArquivo} iniciado!`);
    } catch {
      window.open(url, "_blank");
    }
  };

  const handleCopiarUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL da imagem copiada para a área de transferência!");
  };

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="pb-3 border-b bg-muted/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <PenTool className="h-4 w-4 text-primary" />
                <span>Gerador de Logotipos & Material de Escritório por IA</span>
              </CardTitle>
              <Badge variant="secondary" className="text-[10px] font-mono">
                FLUX.1 Engine
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Crie identidades visuais completas, marcas registradas e mockups de papelaria corporativa
              para {empresaNome}.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Tabs
              value={subAba}
              onValueChange={(val: any) => setSubAba(val)}
              className="w-auto"
            >
              <TabsList className="h-8 p-0.5 bg-muted">
                <TabsTrigger value="logos" className="text-xs px-3 h-7 gap-1.5">
                  <Award className="h-3.5 w-3.5" />
                  <span>Logotipos</span>
                </TabsTrigger>
                <TabsTrigger value="papelaria" className="text-xs px-3 h-7 gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" />
                  <span>Material de Escritório</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-5">
        {/* ======================================================== */}
        {/* SUB-ABA 1: GERADOR DE LOGOTIPOS */}
        {/* ======================================================== */}
        {subAba === "logos" && (
          <div className="space-y-4">
            {/* CONTROLES DO GERADOR DE LOGOS */}
            <div className="flex flex-wrap items-center gap-3 bg-muted/20 p-3 rounded-lg border border-border/70">
              <div className="flex-1 min-w-[240px] space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span>Estilo do Logotipo:</span>
                </label>
                <Select
                  value={estiloLogoSelecionado}
                  onValueChange={setEstiloLogoSelecionado}
                >
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTILOS_LOGO.map((est) => (
                      <SelectItem key={est.id} value={est.id} className="text-xs">
                        <div className="space-y-0.5">
                          <p className="font-semibold">{est.nome}</p>
                          <p className="text-[10px] text-muted-foreground">{est.desc}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 pt-5">
                <Button
                  size="sm"
                  onClick={handleGerarLogos}
                  disabled={gerandoLogo}
                  className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground shadow-xs"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${gerandoLogo ? "animate-spin" : ""}`} />
                  <span>{gerandoLogo ? "Criando Conceitos..." : "Gerar Opções de Logo"}</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setFundoEscuro(!fundoEscuro)}
                  className="h-8 text-xs"
                  title="Inverter contraste de fundo para testar visibilidade"
                >
                  {fundoEscuro ? "☀️ Fundo Claro" : "🌙 Fundo Escuro"}
                </Button>
              </div>
            </div>

            {/* STATUS DO LOGO ATIVO */}
            {logoAtivoUrl && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    <strong>Logo Oficial Definido:</strong> O site gerado e os cabeçalhos utilizarão este logo como marca oficial.
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <img
                    src={logoAtivoUrl}
                    alt="Logo Ativo"
                    className="h-7 w-auto max-w-[80px] object-contain rounded bg-white p-0.5 border"
                  />
                </div>
              </div>
            )}

            {/* GRID DE LOGOS GERADOS */}
            {logos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 pt-1">
                {logos.map((item) => {
                  const ehAtivo = logoAtivoUrl === item.url;
                  return (
                    <div
                      key={item.id}
                      className={`group relative rounded-xl border transition-all overflow-hidden flex flex-col justify-between ${
                        ehAtivo
                          ? "border-primary ring-2 ring-primary/20 shadow-md"
                          : "border-border/70 hover:border-border hover:shadow-sm"
                      } ${fundoEscuro ? "bg-stone-900" : "bg-white"}`}
                    >
                      {/* IMAGEM DO LOGO */}
                      <div className="aspect-square p-4 flex items-center justify-center relative overflow-hidden">
                        <img
                          src={item.url}
                          alt={`${empresaNome} - ${item.estilo}`}
                          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        <button
                          type="button"
                          onClick={() => setImagemModal({ url: item.url, titulo: `${empresaNome} - ${item.estilo}` })}
                          className="absolute top-2 right-2 p-1.5 rounded-md bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Ampliar logo"
                        >
                          <Maximize2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* RODAPÉ DO CARD COM METADADOS E AÇÕES */}
                      <div className={`p-2.5 border-t ${fundoEscuro ? "border-stone-800 bg-stone-950/70" : "border-stone-100 bg-stone-50/80"} space-y-2`}>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold truncate text-foreground">
                            {item.estilo}
                          </span>
                          {ehAtivo && (
                            <Badge variant="default" className="text-[9px] px-1.5 py-0 h-4 bg-emerald-600 text-white">
                              Oficial
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-1 pt-1">
                          {onDefinirComoLogoOficial && (
                            <Button
                              size="sm"
                              variant={ehAtivo ? "secondary" : "default"}
                              onClick={() => onDefinirComoLogoOficial(item.url, `logo-${empresaNome.toLowerCase().replace(/\s+/g, "-")}.png`)}
                              className="h-7 text-[11px] flex-1 gap-1 px-2"
                              title="Usar este logo no site e cabeçalho"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              <span>{ehAtivo ? "Logo Ativo" : "Definir Oficial"}</span>
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(item.url, `logo-${empresaNome.toLowerCase().replace(/\s+/g, "-")}`)}
                            className="h-7 w-7 p-0 shrink-0"
                            title="Baixar em Alta Resolução"
                          >
                            <Download className="h-3 w-3" />
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopiarUrl(item.url)}
                            className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-foreground"
                            title="Copiar URL direta"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoverLogo(item.id)}
                            className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-destructive"
                            title="Excluir este conceito"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-8 border border-dashed rounded-xl bg-muted/10 space-y-2">
                <PenTool className="h-8 w-8 text-muted-foreground mx-auto opacity-40" />
                <p className="text-xs font-semibold text-foreground">Nenhuma opção de logotipo gerada ainda</p>
                <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
                  Selecione o estilo desejado no topo e clique em <strong>"Gerar Opções de Logo"</strong> para criar marcas conceituais de alto impacto com IA.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* SUB-ABA 2: MATERIAL DE ESCRITÓRIO & PAPELARIA CORPORATIVA */}
        {/* ======================================================== */}
        {subAba === "papelaria" && (
          <div className="space-y-4">
            {/* CONTROLES DO MATERIAL DE ESCRITÓRIO */}
            <div className="flex flex-wrap items-center gap-3 bg-muted/20 p-3 rounded-lg border border-border/70">
              <div className="flex-1 min-w-[260px] space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-primary" />
                  <span>Peça de Escritório & Mockup:</span>
                </label>
                <Select
                  value={tipoMaterialSelecionado}
                  onValueChange={setTipoMaterialSelecionado}
                >
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_MATERIAL_ESCRITORIO.map((mat) => (
                      <SelectItem key={mat.id} value={mat.id} className="text-xs">
                        <div className="space-y-0.5">
                          <p className="font-semibold">{mat.titulo}</p>
                          <p className="text-[10px] text-muted-foreground">{mat.desc}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-5">
                <Button
                  size="sm"
                  onClick={handleGerarMaterial}
                  disabled={gerandoMaterial}
                  className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground shadow-xs"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${gerandoMaterial ? "animate-spin" : ""}`} />
                  <span>{gerandoMaterial ? "Renderizando Mockup..." : "Criar Mockup com IA"}</span>
                </Button>
              </div>
            </div>

            {/* GRID DE MATERIAIS DE ESCRITÓRIO GERADOS */}
            {materiais.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
                {materiais.map((item) => (
                  <div
                    key={item.id}
                    className="group relative rounded-xl border border-border/70 hover:border-border bg-card shadow-2xs hover:shadow-sm transition-all overflow-hidden flex flex-col justify-between"
                  >
                    <div className="aspect-[16/10] bg-muted/30 relative overflow-hidden">
                      <img
                        src={item.url}
                        alt={item.titulo}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <button
                        type="button"
                        onClick={() => setImagemModal({ url: item.url, titulo: item.titulo })}
                        className="absolute top-2 right-2 p-1.5 rounded-md bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Ver em tela cheia"
                      >
                        <Maximize2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="p-3 border-t border-border/60 bg-muted/10 space-y-2">
                      <div>
                        <p className="text-xs font-bold leading-tight truncate text-foreground">
                          {item.titulo}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {empresaNome} · Paleta {corPrimariaHex}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-border/40">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(item.url, `mockup-${item.tipo}-${empresaNome.toLowerCase().replace(/\s+/g, "-")}`)}
                          className="h-7 text-[11px] gap-1 px-2.5"
                        >
                          <Download className="h-3 w-3" />
                          <span>Baixar</span>
                        </Button>

                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopiarUrl(item.url)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            title="Copiar URL"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoverMaterial(item.id)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            title="Excluir mockup"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 border border-dashed rounded-xl bg-muted/10 space-y-2">
                <Briefcase className="h-8 w-8 text-muted-foreground mx-auto opacity-40" />
                <p className="text-xs font-semibold text-foreground">Nenhum material de escritório gerado ainda</p>
                <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
                  Gere apresentações comerciais com kits de papelaria, cartões de visita, crachás e pastas executivas para demonstrar a identidade visual completa ao cliente.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* MODAL DE ZOOM / INSPEÇÃO */}
      <Dialog open={!!imagemModal} onOpenChange={() => setImagemModal(null)}>
        <DialogContent className="max-w-4xl p-4 bg-stone-950 text-white border-stone-800">
          <DialogHeader className="pb-2 border-b border-stone-800">
            <DialogTitle className="text-xs font-mono text-stone-200">
              {imagemModal?.titulo}
            </DialogTitle>
          </DialogHeader>
          {imagemModal && (
            <div className="flex items-center justify-center p-2 min-h-[400px]">
              <img
                src={imagemModal.url}
                alt={imagemModal.titulo}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-md"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
