import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  obterPaletaTheColorAPI_ServerFn,
  type TheColorPaletteResult,
  type TheColorPaletteItem,
} from "@/lib/public-apis.functions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Palette,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Sliders,
  Eye,
  CheckCircle2,
  FileCode2,
} from "lucide-react";

interface PaletaCoresCardProps {
  corInicial?: string;
  nomeEmpresa?: string;
  segmento?: string;
  onSelecionarCor?: (corHex: string) => void;
}

const PRESETS_SEGMENTOS: { nome: string; hex: string; desc: string }[] = [
  { nome: "Vinho & Vinícola", hex: "722F37", desc: "Tinto bordô nobre e elegante" },
  { nome: "Gastronomia", hex: "E65100", desc: "Laranja vibrante estimulante de apetite" },
  { nome: "Móveis & Arquitetura", hex: "334155", desc: "Ardósia sofisticada e minimalista" },
  { nome: "Saúde & Estética", hex: "0284C7", desc: "Azul confiança e higiene médica" },
  { nome: "Hotel & Enoturismo", hex: "0D9488", desc: "Verde esmeralda sereno e natureza" },
  { nome: "Luxo & Alta Renda", hex: "B45309", desc: "Dourado âmbar sofisticado" },
  { nome: "Tecnologia & B2B", hex: "4F46E5", desc: "Índigo moderno e inovador" },
];

export function PaletaCoresCard({
  corInicial = "722F37",
  nomeEmpresa,
  segmento,
  onSelecionarCor,
}: PaletaCoresCardProps) {
  const obterPaleta = useServerFn(obterPaletaTheColorAPI_ServerFn);
  const [hexInput, setHexInput] = useState(corInicial.replace("#", ""));
  const [modoHarmonia, setModoHarmonia] = useState<"analogic" | "monochrome" | "complement" | "triad">("analogic");
  const [paleta, setPaleta] = useState<TheColorPaletteResult | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [copiadoHex, setCopiadoHex] = useState<string | null>(null);

  const carregarPaleta = async (cor: string, modo = modoHarmonia) => {
    setCarregando(true);
    try {
      const res = await obterPaleta({
        data: {
          hex: cor.replace("#", ""),
          modo,
          count: 5,
        },
      });
      setPaleta(res);
    } catch {
      toast.error("Erro ao gerar paleta com a The Color API.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarPaleta(hexInput, modoHarmonia);
  }, []);

  const handleCopiarHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiadoHex(hex);
    toast.success(`Cor ${hex} copiada para a área de transferência!`);
    setTimeout(() => setCopiadoHex(null), 2000);
  };

  const handleCopiarCss = () => {
    if (!paleta?.cores) return;
    const cssVars = `:root {\n${paleta.cores
      .map((c, i) => `  --color-${i + 1}: ${c.hex}; /* ${c.nome} */`)
      .join("\n")}\n}`;
    navigator.clipboard.writeText(cssVars);
    toast.success("Variáveis CSS da paleta copiadas com sucesso!");
  };

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="pb-3 border-b bg-muted/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Palette className="h-4 w-4 text-primary" />
                <span>Identidade Visual & Paleta Cromática Harmônica</span>
              </CardTitle>
              <Badge variant="secondary" className="text-[10px] font-mono">
                The Color API
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Gere harmonias de cores baseadas na teoria cromática para sites, posts e branding
              {nomeEmpresa ? ` de ${nomeEmpresa}` : ""}.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopiarCss}
              className="h-7 text-xs gap-1.5"
            >
              <FileCode2 className="h-3.5 w-3.5" />
              Copiar CSS
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* CONTROLES DA PALETA */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-muted-foreground">Cor Base:</label>
            <div className="flex items-center gap-1.5 border border-border rounded-md px-2 py-1 bg-background h-8">
              <input
                type="color"
                value={`#${hexInput.padEnd(6, "0").slice(0, 6)}`}
                onChange={(e) => {
                  const val = e.target.value.replace("#", "");
                  setHexInput(val);
                  carregarPaleta(val);
                }}
                className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent"
              />
              <span className="text-xs font-mono font-bold text-muted-foreground">#</span>
              <Input
                value={hexInput}
                onChange={(e) => setHexInput(e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6))}
                onBlur={() => carregarPaleta(hexInput)}
                className="w-20 h-6 p-0 border-0 text-xs font-mono font-bold focus-visible:ring-0"
                placeholder="HEX"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-muted-foreground">Harmonia:</label>
            <Select
              value={modoHarmonia}
              onValueChange={(val: any) => {
                setModoHarmonia(val);
                carregarPaleta(hexInput, val);
              }}
            >
              <SelectTrigger className="h-8 text-xs w-[140px] bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="analogic" className="text-xs">
                  Análoga (Suave)
                </SelectItem>
                <SelectItem value="complement" className="text-xs">
                  Complementar (Contraste)
                </SelectItem>
                <SelectItem value="triad" className="text-xs">
                  Tríade (Equilíbrio)
                </SelectItem>
                <SelectItem value="monochrome" className="text-xs">
                  Monocromática (Elegante)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => carregarPaleta(hexInput)}
            disabled={carregando}
            className="h-8 text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${carregando ? "animate-spin" : ""}`} />
            Recalcular
          </Button>
        </div>

        {/* PRESETS DE SEGMENTO RÁPIDO */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium text-muted-foreground">
            Paletas Sugeridas para Negócios Regionais:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS_SEGMENTOS.map((p) => (
              <button
                key={p.hex}
                type="button"
                onClick={() => {
                  setHexInput(p.hex);
                  carregarPaleta(p.hex);
                }}
                className={`text-[11px] px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-all ${
                  String(hexInput || "").toLowerCase() === String(p.hex || "").toLowerCase()
                    ? "border-primary bg-primary/10 font-semibold"
                    : "border-border/70 hover:border-border hover:bg-muted/50"
                }`}
                title={p.desc}
              >
                <span
                  className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                  style={{ backgroundColor: `#${p.hex}` }}
                />
                <span>{p.nome}</span>
              </button>
            ))}
          </div>
        </div>

        {/* EXIBIÇÃO VISUAL DOS 5 TONS DA PALETA */}
        {paleta?.cores && paleta.cores.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 rounded-xl overflow-hidden p-1 bg-muted/20 border border-border/60">
              {paleta.cores.map((c, idx) => (
                <div
                  key={idx}
                  className="group relative rounded-lg p-3 flex flex-col justify-between min-h-[110px] transition-all hover:scale-[1.02] shadow-2xs cursor-pointer"
                  style={{ backgroundColor: c.hex, color: c.contrasteHex }}
                  onClick={() => handleCopiarHex(c.hex)}
                  title="Clique para copiar o código HEX"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                      {idx === 0 ? "Base" : `Tom ${idx + 1}`}
                    </span>
                    {copiadoHex === c.hex ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100" />
                    )}
                  </div>

                  <div className="space-y-0.5 mt-4">
                    <p className="text-xs font-bold leading-tight truncate">{c.nome}</p>
                    <p className="text-[11px] font-mono font-semibold opacity-90">{c.hex}</p>
                    <p className="text-[9px] opacity-75">
                      rgb({c.rgb.r}, {c.rgb.g}, {c.rgb.b})
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* PREVIEW DE ELEMENTOS DE UI COM A PALETA */}
            <div className="p-3 rounded-lg border border-border/60 bg-background space-y-2">
              <p className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                Demonstração de Contraste e Acessibilidade WCAG no Site:
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  style={{
                    backgroundColor: paleta.cores[0]?.hex,
                    color: paleta.cores[0]?.contrasteHex,
                  }}
                  className="px-3 py-1.5 rounded-md text-xs font-semibold shadow-xs transition hover:opacity-95"
                >
                  Botão de Ação Primária
                </button>

                <button
                  type="button"
                  style={{
                    backgroundColor: paleta.cores[1]?.hex || paleta.cores[0]?.hex,
                    color: paleta.cores[1]?.contrasteHex || "#FFFFFF",
                  }}
                  className="px-3 py-1.5 rounded-md text-xs font-medium shadow-xs"
                >
                  Destaque Secundário
                </button>

                <div
                  style={{
                    backgroundColor: paleta.cores[4]?.hex || "#F8FAFC",
                    borderColor: paleta.cores[2]?.hex || "#E2E8F0",
                    color: paleta.cores[4]?.contrasteHex || "#0F172A",
                  }}
                  className="px-3 py-1.5 rounded-md text-xs border font-medium"
                >
                  Card de Conteúdo
                </div>

                {onSelecionarCor && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onSelecionarCor(paleta.cores[0]?.hex)}
                    className="text-xs h-7 ml-auto gap-1 text-primary"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Usar Cor Base no Projeto
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
