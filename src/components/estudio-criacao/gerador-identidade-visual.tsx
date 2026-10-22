import React, { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
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
  Code2,
  Layers,
  Wand2,
  ShieldCheck,
  Check,
} from "lucide-react";
import {
  gerarUrlPollinationsFlux,
  gerarLogoVetorialSvg_ServerFn,
} from "@/lib/image-generator.server";
import { getApiSettings } from "@/lib/api-settings";
import {
  checarCotaDiaria,
  registrarConsumoDiario,
  obterResumoSaldo,
} from "@/lib/ai-quota-guard";

export interface LogoGeradoItem {
  id: string;
  url: string;
  estilo: string;
  prompt: string;
  criadoEm: string;
  tipoFormato?: "svg_vetorial" | "imagem_flux";
  svgCode?: string;
  modeloUsado?: string;
}

export interface MaterialEscritorioItem {
  id: string;
  url: string;
  tipo: string;
  titulo: string;
  prompt: string;
  criadoEm: string;
  modeloUsado?: string;
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

const ESTILOS_LOGO_SVG = [
  {
    id: "horizontal_navbar",
    nome: "Horizontal para Navbar (Ícone + Nome)",
    desc: "Composição proporcional (360x90px) com símbolo geométrico e tipografia balanceada",
  },
  {
    id: "monograma_icone",
    nome: "Monograma Quadrado / Avatar",
    desc: "Símbolo centralizado (180x180px) com as iniciais estilizadas em proporção áurea",
  },
  {
    id: "emblema_selo",
    nome: "Emblema / Selo Circular",
    desc: "Insígnia circular de autenticidade (200x200px) com detalhes artesanais",
  },
];

const ESTILOS_LOGO_FLUX = [
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

const MODELOS_POLLINATIONS = [
  { id: "flux", nome: "FLUX.1 Padrão (Alta Fidelidade)" },
  { id: "flux-realism", nome: "FLUX Realism (Fotografia Ultra Realista)" },
  { id: "flux-3d", nome: "FLUX 3D (Render 3D & Mockups)" },
  { id: "turbo", nome: "SDXL Turbo (Instantâneo < 1s)" },
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

  // Server Fn para geração de SVG com LLM
  const gerarLogoSvgFn = useServerFn(gerarLogoVetorialSvg_ServerFn);

  // Modo de criação de logo: "svg" (LLM Vetorial) vs "flux" (Difusão de Imagem)
  const [modoLogo, setModoLogo] = useState<"svg" | "flux">("svg");

  // Motor para Logos SVG: "svg_llm" ou "recraft"
  const [motorLogo, setMotorLogo] = useState<"svg_llm" | "recraft">("svg_llm");

  // Saldo e Cotas Diárias em Tempo Real
  const [resumoSaldo, setResumoSaldo] = useState(() => obterResumoSaldo());

  // Estado para Logos SVG
  const [estiloLogoSvg, setEstiloLogoSvg] = useState<any>(ESTILOS_LOGO_SVG[0].id);

  // Estado para Logos FLUX
  const [estiloLogoFlux, setEstiloLogoFlux] = useState<any>(ESTILOS_LOGO_FLUX[0].id);
  const [modeloFluxLogo, setModeloFluxLogo] = useState<"flux" | "flux-realism" | "flux-3d" | "turbo">("flux");
  const [enhanceLogo, setEnhanceLogo] = useState(true);

  // Estado Geral de Logos
  const [fundoEscuro, setFundoEscuro] = useState(false);
  const [gerandoLogo, setGerandoLogo] = useState(false);
  const [logos, setLogos] = useState<LogoGeradoItem[]>(logosSalvos);

  // Estado para Material de Escritório
  const [tipoMaterialSelecionado, setTipoMaterialSelecionado] = useState(TIPOS_MATERIAL_ESCRITORIO[0].id);
  const [modeloMaterial, setModeloMaterial] = useState<"flux" | "flux-realism" | "flux-3d" | "turbo">("flux-3d");
  const [enhanceMaterial, setEnhanceMaterial] = useState(true);
  const [gerandoMaterial, setGerandoMaterial] = useState(false);
  const [materiais, setMateriais] = useState<MaterialEscritorioItem[]>(materiaisSalvos);

  // Modal de Zoom de Imagem
  const [imagemModal, setImagemModal] = useState<{ url: string; titulo: string; svgCode?: string } | null>(null);

  // Sincroniza se as props mudarem
  React.useEffect(() => {
    setLogos(logosSalvos);
  }, [logosSalvos]);

  React.useEffect(() => {
    setMateriais(materiaisSalvos);
  }, [materiaisSalvos]);

  // 1. GERAÇÃO DE LOGOTIPO VETORIAL SVG PURO VIA LLM OU RECRAFT.AI
  const handleGerarLogoSvg = async () => {
    const apiSettings = getApiSettings();

    // Checagem de Cota Diária antes da requisição
    const provedorAlvo =
      motorLogo === "recraft"
        ? "recraft"
        : apiSettings.provedorIaAtivo === "auto"
        ? "groq"
        : apiSettings.provedorIaAtivo;

    const checagem = checarCotaDiaria({
      categoria: "logos",
      provedor: provedorAlvo,
      cotas: apiSettings.cotasDiarias,
    });

    if (checagem.bloqueado) {
      toast.error(
        checagem.motivo ||
          "Limite diário de logotipos atingido. Novas gerações estarão disponíveis após a meia-noite.",
      );
      return;
    }

    let motorFinal = motorLogo;
    if (checagem.acaoRecomendada === "fallback_gratuito") {
      toast.warning(checagem.motivo);
      motorFinal = "svg_llm";
    }

    setGerandoLogo(true);
    try {
      const customKeys = {
        groq: apiSettings.groq.key,
        gemini: apiSettings.gemini.key,
        openrouter: apiSettings.openrouter.key,
        cerebras: apiSettings.cerebras.key,
        lovable: apiSettings.lovable.key,
        ollamaBaseUrl: apiSettings.ollama.baseUrl,
        recraft: apiSettings.recraft?.key,
        openai: apiSettings.openai?.key,
        fal: apiSettings.fal?.key,
        firefly: apiSettings.firefly?.key,
      };

      toast.info(`Criando logotipo vetorial SVG para ${empresaNome}...`);

      const res = await gerarLogoSvgFn({
        data: {
          empresaNome,
          segmento,
          cidade,
          estilo: estiloLogoSvg,
          corPrimariaHex,
          motor: motorFinal,
          customKeys,
        },
      });

      if (res.sucesso && res.svgCode) {
        const estiloObj = ESTILOS_LOGO_SVG.find((e) => e.id === estiloLogoSvg);
        const novoLogo: LogoGeradoItem = {
          id: `svg_logo_${Date.now()}`,
          url: res.dataUrl,
          estilo: `SVG: ${estiloObj?.nome || "Vetorial"}`,
          prompt: `Logo vetorial SVG puro gerado com IA (${res.provider} / ${res.model})`,
          criadoEm: new Date().toISOString(),
          tipoFormato: "svg_vetorial",
          svgCode: res.svgCode,
          modeloUsado: `${res.provider} (${res.model})`,
        };

        const atualizados = [novoLogo, ...logos];
        setLogos(atualizados);
        onSalvarLogos?.(atualizados);

        // Registra consumo no Quota Guard
        registrarConsumoDiario({
          categoria: "logos",
          provedor: res.provider || motorFinal,
          detalhe: `${empresaNome} (${estiloLogoSvg})`,
          sucesso: true,
          fallback: motorFinal !== motorLogo,
        });
        setResumoSaldo(obterResumoSaldo(apiSettings.cotasDiarias));

        toast.success(`Logotipo vetorial SVG gerado com sucesso!`);
      } else {
        toast.error("Não foi possível gerar o código SVG do logotipo.");
      }
    } catch (err: any) {
      console.error("Erro ao gerar SVG:", err);
      toast.error(err?.message || "Falha ao gerar logo vetorial.");
    } finally {
      setGerandoLogo(false);
    }
  };

  // 2. GERAÇÃO DE LOGOTIPO COM FLUX.1 (DIFUSÃO / IMAGEM)
  const handleGerarLogosFlux = () => {
    const apiSettings = getApiSettings();

    // Checagem de Cota Diária
    const checagem = checarCotaDiaria({
      categoria: "logos",
      provedor: "pollinations",
      cotas: apiSettings.cotasDiarias,
    });

    if (checagem.bloqueado) {
      toast.error(checagem.motivo || "Limite diário de logotipos atingido.");
      return;
    }

    setGerandoLogo(true);
    try {
      const estiloObj = ESTILOS_LOGO_FLUX.find((e) => e.id === estiloLogoFlux) || ESTILOS_LOGO_FLUX[0];
      const novosItens: LogoGeradoItem[] = [];

      // Gera 2 variações do estilo selecionado
      for (let i = 1; i <= 2; i++) {
        const seedExtra = Math.floor(Math.random() * 999999);
        const promptMontado = `${estiloObj.promptEn} for company named "${empresaNome}", niche ${segmento} in ${cidade} Brazil, brand color accent ${corPrimariaHex}, variation ${i}, seed ${seedExtra}`;
        const url = gerarUrlPollinationsFlux(promptMontado, 800, 800, {
          model: modeloFluxLogo,
          enhance: enhanceLogo,
          seed: seedExtra,
        });

        novosItens.push({
          id: `logo_${Date.now()}_${i}`,
          url,
          estilo: `${estiloObj.nome} (${modeloFluxLogo.toUpperCase()})`,
          prompt: promptMontado,
          criadoEm: new Date().toISOString(),
          tipoFormato: "imagem_flux",
          modeloUsado: modeloFluxLogo,
        });
      }

      const listaAtualizada = [...novosItens, ...logos];
      setLogos(listaAtualizada);
      onSalvarLogos?.(listaAtualizada);

      // Registra consumo
      registrarConsumoDiario({
        categoria: "logos",
        provedor: "pollinations",
        detalhe: `${empresaNome} (FLUX ${modeloFluxLogo})`,
        sucesso: true,
      });
      setResumoSaldo(obterResumoSaldo(apiSettings.cotasDiarias));

      toast.success(`2 opções de logotipo conceituais geradas com ${modeloFluxLogo.toUpperCase()}!`);
    } catch {
      toast.error("Erro ao gerar opções de logotipo.");
    } finally {
      setGerandoLogo(false);
    }
  };

  // 3. GERAÇÃO DE MATERIAL DE ESCRITÓRIO COM IA (FLUX-3D / FLUX-REALISM)
  const handleGerarMaterial = () => {
    const apiSettings = getApiSettings();

    // Checagem de Cota Diária
    const checagem = checarCotaDiaria({
      categoria: "imagens",
      provedor: "pollinations",
      cotas: apiSettings.cotasDiarias,
    });

    if (checagem.bloqueado) {
      toast.error(checagem.motivo || "Limite diário de imagens atingido.");
      return;
    }

    setGerandoMaterial(true);
    try {
      const materialObj =
        TIPOS_MATERIAL_ESCRITORIO.find((m) => m.id === tipoMaterialSelecionado) ||
        TIPOS_MATERIAL_ESCRITORIO[0];

      const promptFinal = materialObj.promptEn(empresaNome, segmento, cidade, corPrimariaHex);
      const url = gerarUrlPollinationsFlux(promptFinal, 1200, 800, {
        model: modeloMaterial,
        enhance: enhanceMaterial,
      });

      const novoItem: MaterialEscritorioItem = {
        id: `mat_${Date.now()}`,
        url,
        tipo: materialObj.id,
        titulo: `${materialObj.titulo} (${modeloMaterial.toUpperCase()})`,
        prompt: promptFinal,
        criadoEm: new Date().toISOString(),
        modeloUsado: modeloMaterial,
      };

      const listaAtualizada = [novoItem, ...materiais];
      setMateriais(listaAtualizada);
      onSalvarMateriais?.(listaAtualizada);

      // Registra consumo
      registrarConsumoDiario({
        categoria: "imagens",
        provedor: "pollinations",
        detalhe: `${empresaNome} (${materialObj.id})`,
        sucesso: true,
      });
      setResumoSaldo(obterResumoSaldo(apiSettings.cotasDiarias));

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

  const handleDownload = async (url: string, nomeArquivo: string, svgCode?: string) => {
    if (svgCode) {
      const blob = new Blob([svgCode], { type: "image/svg+xml;charset=utf-8" });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${nomeArquivo}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      toast.success(`Download de ${nomeArquivo}.svg concluído!`);
      return;
    }

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

  const handleCopiarSvgCode = (svgCode: string) => {
    navigator.clipboard.writeText(svgCode);
    toast.success("Código SVG copiado para a área de transferência!");
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
              <div className="flex items-center gap-1.5">
                <Badge variant="secondary" className="text-[10px] font-mono">
                  FLUX.1 + Realism + 3D
                </Badge>
                <Badge variant="outline" className="text-[10px] font-mono text-emerald-600 border-emerald-500/30 bg-emerald-500/5">
                  🎨 Cota hoje: {resumoSaldo.logos.usado} / {resumoSaldo.logos.limite} logos
                </Badge>
              </div>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Crie logotipos vetoriais sem perda de qualidade, marcas conceituais e mockups de papelaria corporativa
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
            {/* SELETOR DE MODO DO LOGO: SVG VETORIAL VS FLUX IMAGEM */}
            <div className="flex items-center gap-2 pb-1 border-b border-border/60">
              <span className="text-xs font-semibold text-muted-foreground">Tecnologia de Geração:</span>
              <div className="inline-flex rounded-lg p-0.5 bg-muted/60 border border-border/80">
                <button
                  type="button"
                  onClick={() => setModoLogo("svg")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                    modoLogo === "svg"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Code2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Logotipo Vetorial SVG (Recomendado)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModoLogo("flux")}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                    modoLogo === "flux"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span>Conceito Visual FLUX.1 (Imagens)</span>
                </button>
              </div>
            </div>

            {/* CONTROLES CONFORME O MODO SELECIONADO */}
            {modoLogo === "svg" ? (
              <div className="flex flex-wrap items-center gap-3 bg-emerald-500/5 p-3 rounded-lg border border-emerald-500/20">
                <div className="flex-1 min-w-[240px] space-y-1">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Code2 className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Formato da Composição Vetorial SVG:</span>
                  </label>
                  <Select
                    value={estiloLogoSvg}
                    onValueChange={setEstiloLogoSvg}
                  >
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTILOS_LOGO_SVG.map((est) => (
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

                <div className="w-[200px] space-y-1">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Motor Vetorial:</span>
                  </label>
                  <Select
                    value={motorLogo}
                    onValueChange={(v: any) => setMotorLogo(v)}
                  >
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="svg_llm" className="text-xs">
                        LLM Vetorial (Groq/Gemini Grátis)
                      </SelectItem>
                      <SelectItem value="recraft" className="text-xs">
                        Recraft.ai (Chave Própria)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <Button
                    size="sm"
                    onClick={handleGerarLogoSvg}
                    disabled={gerandoLogo}
                    className="h-8 text-xs gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs"
                  >
                    <Wand2 className={`h-3.5 w-3.5 ${gerandoLogo ? "animate-spin" : ""}`} />
                    <span>{gerandoLogo ? "Criando Código SVG..." : "Gerar Logo Vetorial com IA"}</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setFundoEscuro(!fundoEscuro)}
                    className="h-8 text-xs"
                    title="Alternar contraste de fundo"
                  >
                    {fundoEscuro ? "☀️ Fundo Claro" : "🌙 Fundo Escuro"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3 bg-muted/20 p-3 rounded-lg border border-border/70">
                <div className="flex-1 min-w-[220px] space-y-1">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    <span>Estilo Conceitual:</span>
                  </label>
                  <Select
                    value={estiloLogoFlux}
                    onValueChange={setEstiloLogoFlux}
                  >
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTILOS_LOGO_FLUX.map((est) => (
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

                <div className="w-[180px] space-y-1">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-blue-500" />
                    <span>Modelo de IA:</span>
                  </label>
                  <Select
                    value={modeloFluxLogo}
                    onValueChange={(val: any) => setModeloFluxLogo(val)}
                  >
                    <SelectTrigger className="h-8 text-xs bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MODELOS_POLLINATIONS.map((mod) => (
                        <SelectItem key={mod.id} value={mod.id} className="text-xs">
                          {mod.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-muted-foreground mr-1">
                    <Checkbox
                      checked={enhanceLogo}
                      onCheckedChange={(c) => setEnhanceLogo(c === true)}
                      className="h-3.5 w-3.5"
                    />
                    <span>Enhance com IA</span>
                  </label>

                  <Button
                    size="sm"
                    onClick={handleGerarLogosFlux}
                    disabled={gerandoLogo}
                    className="h-8 text-xs gap-1.5 bg-primary text-primary-foreground shadow-xs"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${gerandoLogo ? "animate-spin" : ""}`} />
                    <span>{gerandoLogo ? "Criando Conceitos..." : "Gerar Opções FLUX"}</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setFundoEscuro(!fundoEscuro)}
                    className="h-8 text-xs"
                    title="Alternar contraste de fundo"
                  >
                    {fundoEscuro ? "☀️ Fundo Claro" : "🌙 Fundo Escuro"}
                  </Button>
                </div>
              </div>
            )}

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
                    className="h-7 w-auto max-w-[100px] object-contain rounded bg-white p-0.5 border"
                  />
                </div>
              </div>
            )}

            {/* GRID DE LOGOS GERADOS */}
            {logos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 pt-1">
                {logos.map((item) => {
                  const ehAtivo = logoAtivoUrl === item.url;
                  const ehSvg = item.tipoFormato === "svg_vetorial" || !!item.svgCode;

                  return (
                    <div
                      key={item.id}
                      className={`group relative rounded-xl border transition-all overflow-hidden flex flex-col justify-between ${
                        ehAtivo
                          ? "border-primary ring-2 ring-primary/20 shadow-md"
                          : "border-border/70 hover:border-border hover:shadow-sm"
                      } ${fundoEscuro ? "bg-stone-900 text-white" : "bg-white text-stone-900"}`}
                    >
                      {/* IMAGEM OU SVG DO LOGO */}
                      <div className="aspect-square p-4 flex items-center justify-center relative overflow-hidden">
                        {ehSvg && item.svgCode ? (
                          <div
                            className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:max-h-full [&>svg]:object-contain"
                            dangerouslySetInnerHTML={{ __html: item.svgCode }}
                          />
                        ) : (
                          <img
                            src={item.url}
                            alt={`${empresaNome} - ${item.estilo}`}
                            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            setImagemModal({
                              url: item.url,
                              titulo: `${empresaNome} - ${item.estilo}`,
                              svgCode: item.svgCode,
                            })
                          }
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
                          <div className="flex items-center gap-1 shrink-0">
                            {ehSvg && (
                              <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 border-emerald-500/40 text-emerald-600 bg-emerald-500/5">
                                SVG
                              </Badge>
                            )}
                            {ehAtivo && (
                              <Badge variant="default" className="text-[8px] px-1.5 py-0 h-3.5 bg-emerald-600 text-white">
                                Oficial
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 pt-1">
                          {onDefinirComoLogoOficial && (
                            <Button
                              size="sm"
                              variant={ehAtivo ? "secondary" : "default"}
                              onClick={() =>
                                onDefinirComoLogoOficial(
                                  item.url,
                                  `logo-${empresaNome.toLowerCase().replace(/\s+/g, "-")}.${ehSvg ? "svg" : "png"}`,
                                )
                              }
                              className="h-7 text-[11px] flex-1 gap-1 px-2"
                              title="Usar este logo no site e cabeçalho"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              <span>{ehAtivo ? "Ativo" : "Definir Oficial"}</span>
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleDownload(
                                item.url,
                                `logo-${empresaNome.toLowerCase().replace(/\s+/g, "-")}`,
                                item.svgCode,
                              )
                            }
                            className="h-7 w-7 p-0 shrink-0"
                            title={ehSvg ? "Baixar arquivo .SVG vetorial" : "Baixar em Alta Resolução"}
                          >
                            <Download className="h-3 w-3" />
                          </Button>

                          {ehSvg && item.svgCode ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCopiarSvgCode(item.svgCode!)}
                              className="h-7 w-7 p-0 shrink-0 text-emerald-600 hover:text-emerald-700"
                              title="Copiar código SVG puro"
                            >
                              <Code2 className="h-3 w-3" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCopiarUrl(item.url)}
                              className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-foreground"
                              title="Copiar URL direta"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}

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
                  Selecione a tecnologia desejada no topo (SVG Vetorial puro ou FLUX.1) e clique para gerar marcas conceituais de alto impacto para {empresaNome}.
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
              <div className="flex-1 min-w-[240px] space-y-1">
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

              <div className="w-[180px] space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-blue-500" />
                  <span>Modelo de IA:</span>
                </label>
                <Select
                  value={modeloMaterial}
                  onValueChange={(val: any) => setModeloMaterial(val)}
                >
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODELOS_POLLINATIONS.map((mod) => (
                      <SelectItem key={mod.id} value={mod.id} className="text-xs">
                        {mod.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 pt-5">
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-muted-foreground mr-1">
                  <Checkbox
                    checked={enhanceMaterial}
                    onCheckedChange={(c) => setEnhanceMaterial(c === true)}
                    className="h-3.5 w-3.5"
                  />
                  <span>Enhance com IA</span>
                </label>

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
            <div className="flex items-center justify-center p-4 min-h-[400px]">
              {imagemModal.svgCode ? (
                <div
                  className="w-full max-h-[75vh] flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-[70vh] bg-stone-900/50 p-6 rounded-lg"
                  dangerouslySetInnerHTML={{ __html: imagemModal.svgCode }}
                />
              ) : (
                <img
                  src={imagemModal.url}
                  alt={imagemModal.titulo}
                  className="max-h-[75vh] w-auto max-w-full object-contain rounded-md"
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
