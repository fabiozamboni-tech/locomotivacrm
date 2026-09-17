import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Upload,
  Download,
  FileDown,
  MapPin,
  Search,
  Plus,
  ExternalLink,
  Loader2,
  UserPlus,
  Globe,
  Instagram,
  Sparkles,
  AtSign,
  Facebook,
  Users,
  TrendingUp,
  Building2,
  Compass,
  FileText,
  Linkedin,
  Calendar,
  Clock,
  Filter,
  MessageSquare,
  Mail,
  Phone,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  searchPlaces,
  type PlaceResult,
  type GooglePlacesConnectorMode,
} from "@/lib/places.functions";
import { lookupEmpresa, type LookupResult } from "@/lib/lookup.functions";
import {
  searchSerpApi,
  searchApollo,
  searchOverpass,
  lookupBrasilApiCnpj,
  type UnifiedProspectResult,
} from "@/lib/prospecting.functions";
import {
  WhatsAppContactModal,
  type ContactableEmpresa,
} from "@/components/whatsapp-contact-modal";
import { empresaFromRaw, CIDADES_RS_FOCO, SEGMENTOS } from "@/lib/mock-data";
import {
  PAISES,
  REGIOES,
  estadosDoPais,
  nomePais,
  nomeEstado,
  carregarCidades,
  type CidadeInfo,
} from "@/lib/geo";
import { Combobox, TrendIcon, type ComboboxOption } from "@/components/combobox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export const Route = createFileRoute("/importar")({
  component: ImportarPage,
});

/** Formata população */
function fmtPop(n?: number): string {
  if (!n) return "";
  if (n >= 1_000_000)
    return `${(n / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} mi hab.`;
  if (n >= 1_000)
    return `${(n / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} mil hab.`;
  return `${n.toLocaleString("pt-BR")} hab.`;
}

/** PIB em mil R$ (IBGE) */
function fmtPib(milReais?: number): string {
  if (!milReais) return "";
  const reais = milReais * 1000;
  if (reais >= 1e9)
    return `PIB R$ ${(reais / 1e9).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} bi`;
  if (reais >= 1e6)
    return `PIB R$ ${(reais / 1e6).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} mi`;
  return `PIB R$ ${reais.toLocaleString("pt-BR")}`;
}

function detalheCidade(c: CidadeInfo): string {
  return [fmtPop(c.populacao), c.setor, fmtPib(c.pib)].filter(Boolean).join(" · ");
}

const FORCA_LABEL = ["economia local fraca", "economia local média", "economia local forte"];

function socialDoSite(
  url?: string,
): { rede: "instagram" | "facebook"; handle: string; url: string } | null {
  if (!url) return null;
  const m = url.match(/(?:https?:\/\/)?(?:www\.)?(instagram|facebook)\.com\/([A-Za-z0-9._-]+)/i);
  if (!m) return null;
  const rede = m[1].toLowerCase() as "instagram" | "facebook";
  const handle = m[2].replace(/\/$/, "");
  if (!handle || ["p", "pages", "profile.php", "reel", "explore"].includes(handle)) return null;
  return { rede, handle, url };
}

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const CSV_EXAMPLE = `nome,segmento,cidade,telefone,whatsapp,email,site,instagram
Padaria do Vale,Padaria artesanal,Bento Gonçalves,(54) 3055-0011,(54) 99988-7766,,,@padariadovale
Metalúrgica Serrana,Metalurgia,Caxias do Sul,(54) 3221-9999,,contato@metalserrana.ind.br,metalserrana.ind.br,`;

const OPCOES_TEMPO_CRIACAO = [
  { value: "todos", label: "Qualquer data / Todas" },
  { value: "7", label: "Últimos 7 dias", dias: 7 },
  { value: "15", label: "Últimos 15 dias", dias: 15 },
  { value: "30", label: "Últimos 30 dias (1 mês)", dias: 30 },
  { value: "60", label: "Últimos 60 dias (2 meses)", dias: 60 },
  { value: "90", label: "Últimos 90 dias (3 meses)", dias: 90 },
  { value: "180", label: "Últimos 6 meses", dias: 180 },
  { value: "365", label: "Últimos 12 meses (1 ano)", dias: 365 },
  { value: "730", label: "Últimos 24 meses (2 anos)", dias: 730 },
];

interface ProspectItemProps {
  id: string;
  nome: string;
  razaoSocial?: string;
  cnpj?: string;
  segmento?: string;
  cidade?: string;
  estado?: string;
  endereco?: string;
  bairro?: string;
  cep?: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  site?: string;
  instagram?: string;
  linkedin?: string;
  googleMapsUri?: string;
  rating?: number;
  totalRatings?: number;
  dataInicioAtividade?: string;
  diasDesdeAbertura?: number;
  detalhesExtras?: string;
  isImported: boolean;
  onImport: () => void;
  onOpenWhatsApp: (empresa: ContactableEmpresa) => void;
}

function ProspectItemCard({
  nome,
  razaoSocial,
  cnpj,
  segmento,
  cidade,
  estado,
  endereco,
  bairro,
  cep,
  telefone,
  whatsapp,
  email,
  site,
  instagram,
  linkedin,
  googleMapsUri,
  rating,
  totalRatings,
  dataInicioAtividade,
  diasDesdeAbertura,
  detalhesExtras,
  isImported,
  onImport,
  onOpenWhatsApp,
}: ProspectItemProps) {
  const social = socialDoSite(site);
  const instagramHandle =
    instagram ||
    (social?.rede === "instagram" ? `@${social.handle}` : undefined);
  const instagramUrl = instagramHandle
    ? instagramHandle.startsWith("http")
      ? instagramHandle
      : `https://instagram.com/${instagramHandle.replace("@", "")}`
    : undefined;

  const siteUrl = site ? (site.startsWith("http") ? site : `https://${site}`) : undefined;
  const siteDomain = site ? site.replace(/^https?:\/\//i, "").replace(/\/$/, "") : undefined;

  const gMapsUrl =
    googleMapsUri ||
    (nome
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${nome} ${cidade || ""}`)}`
      : undefined);

  const telContato = whatsapp || telefone;

  const enderecoCompleto = [endereco, bairro, cidade, estado, cep ? `CEP ${cep}` : ""]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="rounded-lg border border-border/60 p-3.5 flex flex-col md:flex-row md:items-start justify-between gap-3.5 bg-card hover:border-border transition-all">
      <div className="min-w-0 flex-1 space-y-1.5">
        {/* Título (Nome Fantasia) & Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-foreground">{nome}</span>

          {segmento && (
            <Badge variant="outline" className="text-[10px] font-normal">
              {segmento}
            </Badge>
          )}

          {cnpj && (
            <Badge
              variant="outline"
              className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/30"
            >
              CNPJ: {cnpj}
            </Badge>
          )}

          {typeof rating === "number" && (
            <Badge variant="secondary" className="text-[10px] font-normal">
              ★ {rating.toFixed(1)} {totalRatings !== undefined ? `(${totalRatings})` : ""}
            </Badge>
          )}

          {dataInicioAtividade && (
            <Badge
              variant="outline"
              className="text-[10px] font-normal flex items-center gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
            >
              <Calendar className="h-2.5 w-2.5" />
              Abertura: {dataInicioAtividade}
              {diasDesdeAbertura !== undefined && (
                <span className="opacity-75">
                  ({diasDesdeAbertura < 30
                    ? `${diasDesdeAbertura}d`
                    : diasDesdeAbertura < 365
                      ? `${Math.floor(diasDesdeAbertura / 30)} meses`
                      : `${(diasDesdeAbertura / 365).toFixed(1)} anos`})
                </span>
              )}
            </Badge>
          )}
        </div>

        {/* Razão Social (se diferente do nome fantasia) */}
        {razaoSocial && razaoSocial.trim().toLowerCase() !== nome.trim().toLowerCase() && (
          <div className="text-xs text-muted-foreground font-mono">
            Razão Social: <span className="text-foreground/80 font-medium">{razaoSocial}</span>
          </div>
        )}

        {/* Endereço */}
        {enderecoCompleto && (
          <div className="text-xs text-muted-foreground truncate">{enderecoCompleto}</div>
        )}

        {/* Linha de Links e Ações de Contato */}
        <div className="flex items-center gap-2.5 flex-wrap pt-1 text-xs">
          {/* Site */}
          {siteUrl ? (
            <a
              href={siteUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{siteDomain}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <Badge
              variant="outline"
              className="text-[10px] font-normal bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
            >
              sem site
            </Badge>
          )}

          {/* WhatsApp / Contato Direto */}
          {telContato && (
            <button
              type="button"
              onClick={() =>
                onOpenWhatsApp({
                  nome,
                  razaoSocial,
                  cidade,
                  segmento,
                  telefone,
                  whatsapp,
                  site,
                })
              }
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-xs"
              title="Iniciar conversa no WhatsApp com modelos de mensagem prontos"
            >
              <MessageSquare className="h-3 w-3" />
              <span>WhatsApp ({telContato})</span>
            </button>
          )}

          {/* Google Maps */}
          {gMapsUrl && (
            <a
              href={gMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
            >
              <MapPin className="h-3.5 w-3.5" />
              <span>Google Maps</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}

          {/* Instagram */}
          {instagramUrl && (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-pink-600 dark:text-pink-400 hover:underline font-medium"
            >
              <Instagram className="h-3.5 w-3.5" />
              <span>{instagramHandle}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}

          {/* E-mail */}
          {email && (
            <a
              href={`mailto:${email}`}
              className="inline-flex items-center gap-1 text-muted-foreground hover:underline"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>{email}</span>
            </a>
          )}

          {/* LinkedIn */}
          {linkedin && (
            <a
              href={linkedin}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline font-medium"
            >
              <Linkedin className="h-3.5 w-3.5" />
              <span>LinkedIn</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}

          {/* Detalhes Extras */}
          {detalhesExtras && (
            <span className="text-[11px] text-muted-foreground italic">
              {detalhesExtras}
            </span>
          )}
        </div>
      </div>

      {/* Botão de Adicionar ao Radar */}
      <div className="flex md:flex-col items-center justify-end gap-2 shrink-0">
        <Button
          size="sm"
          variant={isImported ? "secondary" : "default"}
          disabled={isImported}
          onClick={onImport}
          className="w-full md:w-auto"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          {isImported ? "Adicionada" : "Adicionar"}
        </Button>
      </div>
    </div>
  );
}

function ImportarPage() {
  const { empresas, addEmpresa } = useStore();
  const [activeTab, setActiveTab] = useState("google_places");
  const [imported, setImported] = useState<Set<string>>(new Set());

  // Modal de primeiro contato via WhatsApp
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [whatsAppEmpresa, setWhatsAppEmpresa] = useState<ContactableEmpresa | null>(null);

  const handleOpenWhatsApp = (emp: ContactableEmpresa) => {
    setWhatsAppEmpresa(emp);
    setWhatsAppModalOpen(true);
  };

  // -------------------------------------------------------------------------
  // Server Functions
  // -------------------------------------------------------------------------
  const searchGoogle = useServerFn(searchPlaces);
  const searchSerp = useServerFn(searchSerpApi);
  const searchApo = useServerFn(searchApollo);
  const searchOsm = useServerFn(searchOverpass);
  const lookupCnpj = useServerFn(lookupBrasilApiCnpj);
  const lookup = useServerFn(lookupEmpresa);

  // -------------------------------------------------------------------------
  // Shared Geographic & Segment Filters
  // -------------------------------------------------------------------------
  const [regiao, setRegiao] = useState("South America");
  const [pais, setPais] = useState("BR");
  const RS_CODE = useMemo(
    () => estadosDoPais("BR").find((e) => e.nome.startsWith("Rio Grande do Sul"))?.code ?? "",
    [],
  );
  const [estado, setEstado] = useState(RS_CODE);
  const [cidade, setCidade] = useState("Bento Gonçalves");
  const [cidadesSugeridas, setCidadesSugeridas] = useState<CidadeInfo[]>(
    CIDADES_RS_FOCO.map((nome) => ({ nome })),
  );
  const [segmento, setSegmento] = useState("Restaurantes");
  const [filtroSite, setFiltroSite] = useState<"todos" | "com" | "sem">("todos");
  const [limite, setLimite] = useState("20");

  const paisesFiltrados = useMemo(
    () => (regiao ? PAISES.filter((p) => p.regiao === regiao) : PAISES),
    [regiao],
  );
  const estados = useMemo(() => estadosDoPais(pais), [pais]);

  useEffect(() => {
    let ativo = true;
    if (!estado) {
      setCidadesSugeridas([]);
      return;
    }
    carregarCidades(pais, estado).then((lista) => {
      if (!ativo) return;
      setCidadesSugeridas(lista);
    });
    return () => {
      ativo = false;
    };
  }, [pais, estado]);

  const regioesOptions: ComboboxOption[] = REGIOES.map((r) => ({ value: r.id, label: r.nome }));
  const paisesOptions: ComboboxOption[] = paisesFiltrados.map((p) => ({
    value: p.code,
    label: p.nome,
  }));
  const estadosOptions: ComboboxOption[] = [
    { value: "", label: "Todos os estados" },
    ...estados.map((e) => ({ value: e.code, label: e.nome })),
  ];
  const cidadesOptions: ComboboxOption[] = [
    { value: "", label: "Todas as cidades" },
    ...cidadesSugeridas.map((c) => ({
      value: c.nome,
      label: c.nome,
      detail: detalheCidade(c),
      trend: c.forca,
    })),
  ];
  const segmentosOptions: ComboboxOption[] = [
    { value: "", label: "Todos os segmentos" },
    ...SEGMENTOS.map((s) => ({ value: s, label: s })),
  ];
  const cidadeSelecionada = cidadesSugeridas.find((c) => c.nome === cidade);

  const localizacaoTexto = [cidade, estado ? nomeEstado(pais, estado) : "", nomePais(pais)]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ");
  const termoTexto = segmento.trim() || "empresas";
  const queryPadrao = [termoTexto, localizacaoTexto].filter(Boolean).join(" em ");

  // -------------------------------------------------------------------------
  // 1. Google Places State
  // -------------------------------------------------------------------------
  const [googlePlacesModo, setGooglePlacesModo] = useState<GooglePlacesConnectorMode>("auto");
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [resultsGoogle, setResultsGoogle] = useState<PlaceResult[]>([]);

  const resultsGoogleFiltrados = useMemo(
    () =>
      resultsGoogle.filter((p) =>
        filtroSite === "com" ? !!p.site : filtroSite === "sem" ? !p.site : true,
      ),
    [resultsGoogle, filtroSite],
  );

  const buscarGoogle = async () => {
    if (!queryPadrao) return toast.error("Informe ao menos o segmento ou a cidade");
    setLoadingGoogle(true);
    try {
      const res = await searchGoogle({
        data: {
          query: queryPadrao,
          regionCode: pais || "BR",
          limit: Number(limite),
          modo: googlePlacesModo,
        },
      });
      setResultsGoogle(res);
      toast.success(`${res.length} resultado(s) do Google Places`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha na busca Google Places");
    } finally {
      setLoadingGoogle(false);
    }
  };

  const importarGooglePlace = (p: PlaceResult) => {
    if (imported.has(p.placeId)) return;
    addEmpresa(
      empresaFromRaw({
        nome: p.nome,
        segmento: p.segmento ?? segmento,
        cidade: p.cidade || cidade,
        endereco: p.endereco,
        telefone: p.telefone,
        site: p.site,
        origem: "google_places",
        externalId: p.placeId,
      }),
    );
    setImported((s) => new Set(s).add(p.placeId));
    toast.success(`${p.nome} adicionada ao radar`);
  };

  const importarTodosGoogle = () => {
    let count = 0;
    for (const p of resultsGoogleFiltrados) {
      if (imported.has(p.placeId)) continue;
      addEmpresa(
        empresaFromRaw({
          nome: p.nome,
          segmento: p.segmento ?? segmento,
          cidade: p.cidade || cidade,
          endereco: p.endereco,
          telefone: p.telefone,
          site: p.site,
          origem: "google_places",
          externalId: p.placeId,
        }),
      );
      count++;
    }
    setImported((s) => new Set([...s, ...resultsGoogleFiltrados.map((r) => r.placeId)]));
    toast.success(`${count} empresa(s) adicionada(s)`);
  };

  // -------------------------------------------------------------------------
  // 2. SerpApi State
  // -------------------------------------------------------------------------
  const [serpQueryCustom, setSerpQueryCustom] = useState("");
  const [serpLoading, setSerpLoading] = useState(false);
  const [serpResults, setSerpResults] = useState<UnifiedProspectResult[]>([]);

  const serpResultsFiltrados = useMemo(
    () =>
      serpResults.filter((p) =>
        filtroSite === "com" ? !!p.site : filtroSite === "sem" ? !p.site : true,
      ),
    [serpResults, filtroSite],
  );

  const buscarSerpApi = async () => {
    const q = serpQueryCustom.trim() || queryPadrao;
    if (!q) return toast.error("Informe o termo de busca ou selecione os filtros");
    setSerpLoading(true);
    try {
      const res = await searchSerp({ data: { query: q, limit: Number(limite) } });
      setSerpResults(res);
      toast.success(`${res.length} empresa(s) encontradas via SerpApi`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha na busca SerpApi");
    } finally {
      setSerpLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // 3. Apollo.io State
  // -------------------------------------------------------------------------
  const [apolloQueryCustom, setApolloQueryCustom] = useState("");
  const [apolloLoading, setApolloLoading] = useState(false);
  const [apolloResults, setApolloResults] = useState<UnifiedProspectResult[]>([]);

  const apolloResultsFiltrados = useMemo(
    () =>
      apolloResults.filter((p) =>
        filtroSite === "com" ? !!p.site : filtroSite === "sem" ? !p.site : true,
      ),
    [apolloResults, filtroSite],
  );

  const buscarApollo = async () => {
    setApolloLoading(true);
    try {
      const loc = [cidade, estado ? nomeEstado(pais, estado) : "", nomePais(pais)]
        .filter(Boolean)
        .join(", ");
      const res = await searchApo({
        data: {
          query: apolloQueryCustom.trim() || undefined,
          keyword: segmento.trim() || undefined,
          location: loc || undefined,
          limit: Number(limite),
        },
      });
      setApolloResults(res);
      toast.success(`${res.length} organização(ões) encontrada(s) no Apollo.io`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha na busca Apollo.io");
    } finally {
      setApolloLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // 4. OpenStreetMap / Overpass State
  // -------------------------------------------------------------------------
  const [osmCategoria, setOsmCategoria] = useState("shop");
  const [osmLoading, setOsmLoading] = useState(false);
  const [osmResults, setOsmResults] = useState<UnifiedProspectResult[]>([]);

  const osmResultsFiltrados = useMemo(
    () =>
      osmResults.filter((p) =>
        filtroSite === "com" ? !!p.site : filtroSite === "sem" ? !p.site : true,
      ),
    [osmResults, filtroSite],
  );

  const buscarOsm = async () => {
    if (!cidade.trim()) return toast.error("Selecione uma cidade para a busca no OpenStreetMap");
    setOsmLoading(true);
    try {
      const res = await searchOsm({
        data: {
          cidade: cidade.trim(),
          categoria: osmCategoria || undefined,
          termo: segmento.trim() || undefined,
          limit: Number(limite),
        },
      });
      setOsmResults(res);
      toast.success(`${res.length} estabelecimento(s) encontrados via OpenStreetMap`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha na busca Overpass/OSM");
    } finally {
      setOsmLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // 5. BrasilAPI (CNPJ) State com Filtro de Tempo de Criação
  // -------------------------------------------------------------------------
  const [cnpjInput, setCnpjInput] = useState("");
  const [tempoCriacaoFiltro, setTempoCriacaoFiltro] = useState("todos");
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cnpjResults, setCnpjResults] = useState<UnifiedProspectResult[]>([]);

  const cnpjResultsFiltrados = useMemo(() => {
    let list = cnpjResults;

    // Filtro por tempo de criação / idade da empresa
    if (tempoCriacaoFiltro !== "todos") {
      const maxDias = Number(tempoCriacaoFiltro);
      list = list.filter((p) => {
        if (p.diasDesdeAbertura === undefined) return false;
        return p.diasDesdeAbertura <= maxDias;
      });
    }

    // Filtro por site
    if (filtroSite === "com") {
      list = list.filter((p) => !!p.site);
    } else if (filtroSite === "sem") {
      list = list.filter((p) => !p.site);
    }

    return list;
  }, [cnpjResults, tempoCriacaoFiltro, filtroSite]);

  const consultarBrasilApi = async () => {
    const rawList = cnpjInput
      .split(/[\n,;\s]+/)
      .map((c) => c.trim())
      .filter(Boolean);

    setCnpjLoading(true);
    try {
      const maxDias = tempoCriacaoFiltro !== "todos" ? Number(tempoCriacaoFiltro) : undefined;
      const res = await lookupCnpj({
        data: {
          cnpjs: rawList.length > 0 ? rawList : undefined,
          cidade: cidade.trim() || undefined,
          estado: estado ? nomeEstado(pais, estado) : undefined,
          segmento: segmento.trim() || undefined,
          limit: Number(limite),
          maxDiasAbertura: maxDias,
        },
      });
      setCnpjResults(res);
      toast.success(
        rawList.length > 0
          ? `${res.length} CNPJ(s) consultados na Receita Federal`
          : `${res.length} empresa(s) encontradas na Receita / Município`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao consultar BrasilAPI");
    } finally {
      setCnpjLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // 6. CSV / Manual / Lookup State
  // -------------------------------------------------------------------------
  const [csv, setCsv] = useState(CSV_EXAMPLE);
  const [lookupInput, setLookupInput] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);

  const emptyForm = {
    nome: "",
    segmento: "",
    cidade: "",
    bairro: "",
    endereco: "",
    telefone: "",
    whatsapp: "",
    email: "",
    site: "",
    instagram: "",
    observacoes: "",
  };
  const [form, setForm] = useState(emptyForm);
  const setF = (k: keyof typeof emptyForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const buscarLookup = async () => {
    if (!lookupInput.trim()) return toast.error("Informe um site ou @instagram");
    setLookupLoading(true);
    setLookupResult(null);
    try {
      const res = await lookup({ data: { input: lookupInput.trim() } });
      setLookupResult(res);
      toast.success(`Dados coletados de ${res.fonte === "instagram" ? "Instagram" : "site"}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha na busca");
    } finally {
      setLookupLoading(false);
    }
  };

  const importarLookup = () => {
    if (!lookupResult) return;
    addEmpresa(
      empresaFromRaw({
        nome: lookupResult.nome,
        segmento: lookupResult.segmento,
        cidade: lookupResult.cidade || "—",
        bairro: lookupResult.bairro,
        endereco: lookupResult.endereco,
        telefone: lookupResult.telefone,
        whatsapp: lookupResult.whatsapp,
        email: lookupResult.email,
        site: lookupResult.site,
        instagram: lookupResult.instagram,
        origem: "enriquecimento",
        observacoes: lookupResult.resumo
          ? `Coletado de ${lookupResult.urlAnalisada}\n\n${lookupResult.resumo}`
          : `Coletado de ${lookupResult.urlAnalisada}`,
      }),
    );
    toast.success(`${lookupResult.nome} adicionada ao radar`);
    setLookupResult(null);
    setLookupInput("");
  };

  const salvarManual = () => {
    if (!form.nome.trim()) return toast.error("Nome é obrigatório");
    if (!form.cidade.trim()) return toast.error("Cidade é obrigatória");
    addEmpresa(
      empresaFromRaw({
        nome: form.nome.trim(),
        segmento: form.segmento.trim() || "Outros",
        cidade: form.cidade.trim(),
        bairro: form.bairro.trim() || undefined,
        endereco: form.endereco.trim(),
        telefone: form.telefone.trim() || undefined,
        whatsapp: form.whatsapp.trim() || undefined,
        email: form.email.trim() || undefined,
        site: form.site.trim() || undefined,
        instagram: form.instagram.trim() || undefined,
        observacoes: form.observacoes.trim() || undefined,
        origem: "manual",
      }),
    );
    toast.success(`${form.nome} adicionada ao radar`);
    setForm(emptyForm);
  };

  const importarCsv = () => {
    const lines = csv.trim().split("\n");
    if (lines.length < 2) return toast.error("CSV vazio ou sem cabeçalho");
    const header = lines[0].split(",").map((s) => s.trim().toLowerCase());
    let count = 0;
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(",").map((s) => s.trim());
      if (row.length < 2) continue;
      const getVal = (col: string) => {
        const idx = header.indexOf(col);
        return idx !== -1 ? row[idx] : undefined;
      };
      const nome = getVal("nome");
      if (!nome) continue;
      addEmpresa(
        empresaFromRaw({
          nome,
          segmento: getVal("segmento") || "Outros",
          cidade: getVal("cidade") || "Caxias do Sul",
          endereco: getVal("endereco") || "Endereço não informado",
          telefone: getVal("telefone"),
          whatsapp: getVal("whatsapp"),
          email: getVal("email"),
          site: getVal("site"),
          instagram: getVal("instagram"),
          origem: "csv",
        }),
      );
      count++;
    }
    toast.success(`${count} empresa(s) importada(s) do CSV`);
  };

  const exportarEmpresas = () => {
    const header =
      "nome;segmento;cidade;telefone;whatsapp;email;site;instagram;score;statusSite;statusInstagram;etapaCRM";
    const rows = empresas.map((e) =>
      [
        e.nome,
        e.segmento,
        e.cidade,
        e.telefone ?? "",
        e.whatsapp ?? "",
        e.email ?? "",
        e.site ?? "",
        e.instagram ?? "",
        e.score,
        e.statusSite,
        e.statusInstagram,
        e.crmStage,
      ]
        .map((c) => String(c).replace(/;/g, ","))
        .join(";"),
    );
    downloadFile("radar-empresas.csv", [header, ...rows].join("\n"), "text/csv");
    toast.success("CSV exportado");
  };

  // -------------------------------------------------------------------------
  // Helper para importar da lista unificada
  // -------------------------------------------------------------------------
  const importarUnified = (p: UnifiedProspectResult) => {
    if (imported.has(p.id)) return;
    addEmpresa(
      empresaFromRaw({
        nome: p.nome,
        segmento: p.segmento || "Outros",
        cidade: p.cidade || cidade || "—",
        bairro: p.bairro,
        endereco: p.endereco || "",
        telefone: p.telefone,
        whatsapp: p.whatsapp,
        email: p.email,
        site: p.site,
        instagram: p.instagram,
        origem: p.origem,
        externalId: p.id,
        observacoes: [
          p.razaoSocial ? `Razão Social: ${p.razaoSocial}` : "",
          p.cnpj ? `CNPJ: ${p.cnpj}` : "",
          p.dataInicioAtividade ? `Data Abertura: ${p.dataInicioAtividade}` : "",
          p.detalhesExtras,
        ]
          .filter(Boolean)
          .join("\n"),
      }),
    );
    setImported((s) => new Set(s).add(p.id));
    toast.success(`${p.nome} adicionada ao radar`);
  };

  const importarTodasUnified = (items: UnifiedProspectResult[]) => {
    let count = 0;
    for (const p of items) {
      if (imported.has(p.id)) continue;
      addEmpresa(
        empresaFromRaw({
          nome: p.nome,
          segmento: p.segmento || "Outros",
          cidade: p.cidade || cidade || "—",
          bairro: p.bairro,
          endereco: p.endereco || "",
          telefone: p.telefone,
          whatsapp: p.whatsapp,
          email: p.email,
          site: p.site,
          instagram: p.instagram,
          origem: p.origem,
          externalId: p.id,
          observacoes: [
            p.razaoSocial ? `Razão Social: ${p.razaoSocial}` : "",
            p.cnpj ? `CNPJ: ${p.cnpj}` : "",
            p.dataInicioAtividade ? `Data Abertura: ${p.dataInicioAtividade}` : "",
            p.detalhesExtras,
          ]
            .filter(Boolean)
            .join("\n"),
        }),
      );
      count++;
    }
    setImported((s) => new Set([...s, ...items.map((r) => r.id)]));
    toast.success(`${count} empresa(s) adicionada(s)`);
  };

  // -------------------------------------------------------------------------
  // BARRA DE FILTROS PADRÃO (GLOBAL / REUTILIZÁVEL)
  // -------------------------------------------------------------------------
  const renderSharedFilters = () => (
    <div className="space-y-3 bg-muted/20 border border-border/60 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-primary" />
          Filtros de Localização e Segmento
        </span>
        {queryPadrao && (
          <span className="text-[11px] text-muted-foreground font-mono truncate max-w-[350px]">
            {queryPadrao}
          </span>
        )}
      </div>
      <div className="grid md:grid-cols-5 gap-2">
        <div>
          <label className="text-xs text-muted-foreground">Continente / região</label>
          <Combobox
            options={regioesOptions}
            value={regiao}
            onChange={(v) => {
              setRegiao(v);
              const primeiro = PAISES.find((p) => p.regiao === v);
              setPais(primeiro?.code ?? "");
              setEstado("");
              setCidade("");
            }}
            placeholder="Todos"
            searchPlaceholder="Buscar região…"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">País</label>
          <Combobox
            options={paisesOptions}
            value={pais}
            onChange={(v) => {
              setPais(v);
              setEstado("");
              setCidade("");
            }}
            placeholder="País"
            searchPlaceholder="Buscar país…"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Estado / região</label>
          <Combobox
            options={estadosOptions}
            value={estado}
            onChange={(v) => {
              setEstado(v);
              setCidade("");
            }}
            placeholder={estados.length ? "Todos os estados" : "Sem divisões"}
            searchPlaceholder="Buscar estado…"
            allowCustom
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Cidade</label>
          <Combobox
            options={cidadesOptions}
            value={cidade}
            onChange={setCidade}
            placeholder="Todas as cidades"
            searchPlaceholder="Buscar cidade…"
            emptyText="Digite para usar outra cidade"
            allowCustom
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Segmento / termo</label>
          <Combobox
            options={segmentosOptions}
            value={segmento}
            onChange={setSegmento}
            placeholder="Todos os segmentos"
            searchPlaceholder="Buscar ou digitar…"
            emptyText="Digite um termo livre"
            allowCustom
          />
        </div>
      </div>

      {cidadeSelecionada && (cidadeSelecionada.populacao || cidadeSelecionada.pib) && (
        <div className="rounded-md border border-border/60 bg-muted/40 px-3 py-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <TrendIcon trend={cidadeSelecionada.forca} />
            {cidadeSelecionada.nome}
          </span>
          {cidadeSelecionada.populacao && (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Users className="h-3 w-3" />
              {fmtPop(cidadeSelecionada.populacao)}
            </span>
          )}
          {cidadeSelecionada.setor && (
            <span className="text-muted-foreground">Setor: {cidadeSelecionada.setor}</span>
          )}
          {cidadeSelecionada.pib && (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              {fmtPib(cidadeSelecionada.pib)}
            </span>
          )}
          {cidadeSelecionada.forca !== undefined && (
            <Badge variant="outline" className="text-[10px] font-normal">
              {FORCA_LABEL[cidadeSelecionada.forca] ?? ""}
            </Badge>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 space-y-6 max-w-[1250px]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Centro de Prospecção e Importação</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Capture e enriqueça leads a partir de múltiplas fontes integradas: Google Places, SerpApi, Apollo.io, OpenStreetMap, BrasilAPI ou planilhas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportarEmpresas}>
            <Download className="h-4 w-4 mr-1.5" />
            Exportar CRM ({empresas.length})
          </Button>
        </div>
      </div>

      {/* TABS DE PROVEDORES */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-6 h-auto p-1 bg-muted/60 border border-border/60">
          <TabsTrigger value="google_places" className="flex items-center gap-1.5 py-2 text-xs">
            <MapPin className="h-3.5 w-3.5 text-blue-500" />
            <span>Google Places</span>
          </TabsTrigger>
          <TabsTrigger value="serpapi" className="flex items-center gap-1.5 py-2 text-xs">
            <Globe className="h-3.5 w-3.5 text-emerald-500" />
            <span>SerpApi</span>
          </TabsTrigger>
          <TabsTrigger value="apollo" className="flex items-center gap-1.5 py-2 text-xs">
            <Building2 className="h-3.5 w-3.5 text-purple-500" />
            <span>Apollo.io B2B</span>
          </TabsTrigger>
          <TabsTrigger value="openstreetmap" className="flex items-center gap-1.5 py-2 text-xs">
            <Compass className="h-3.5 w-3.5 text-amber-500" />
            <span>OpenStreetMap</span>
          </TabsTrigger>
          <TabsTrigger value="brasilapi" className="flex items-center gap-1.5 py-2 text-xs">
            <FileText className="h-3.5 w-3.5 text-green-600" />
            <span>BrasilAPI (CNPJ)</span>
          </TabsTrigger>
          <TabsTrigger value="outros" className="flex items-center gap-1.5 py-2 text-xs">
            <Upload className="h-3.5 w-3.5 text-muted-foreground" />
            <span>CSV / Manual</span>
          </TabsTrigger>
        </TabsList>

        {/* ------------------------------------------------------------------- */}
        {/* ABA 1: GOOGLE PLACES */}
        {/* ------------------------------------------------------------------- */}
        <TabsContent value="google_places" className="space-y-4 mt-0">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Descoberta via Google Places API
                <Badge variant="secondary" className="ml-1 text-[10px] font-normal">
                  Dados reais
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Pesquise estabelecimentos cadastrados no Google Maps com filtro regional e demográfico.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderSharedFilters()}

              {/* Seletor de Modo/Provedor do Google Places */}
              <div className="bg-muted/40 rounded-lg p-3.5 border border-border/60 space-y-2">
                <div className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Compass className="h-3.5 w-3.5 text-primary" />
                  Provedor / Modo de Execução do Google Maps:
                </div>
                <RadioGroup
                  value={googlePlacesModo}
                  onValueChange={(v) => setGooglePlacesModo(v as GooglePlacesConnectorMode)}
                  className="grid grid-cols-1 md:grid-cols-3 gap-2.5"
                >
                  <label
                    htmlFor="mode-auto"
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      googlePlacesModo === "auto"
                        ? "border-primary/80 bg-primary/5 text-foreground shadow-xs"
                        : "border-border/60 bg-background/80 text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    <RadioGroupItem value="auto" id="mode-auto" className="mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="font-semibold text-foreground flex items-center gap-1">
                        Automático
                        <Badge variant="outline" className="text-[9px] py-0 px-1 font-normal text-primary">
                          Recomendado
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-tight">
                        Tenta o Gateway Lovable e usa o SerpApi se estiver fora da nuvem Lovable.
                      </p>
                    </div>
                  </label>

                  <label
                    htmlFor="mode-lovable"
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      googlePlacesModo === "lovable"
                        ? "border-primary/80 bg-primary/5 text-foreground shadow-xs"
                        : "border-border/60 bg-background/80 text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    <RadioGroupItem value="lovable" id="mode-lovable" className="mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="font-semibold text-foreground">Lovable Cloud Gateway</div>
                      <p className="text-[11px] text-muted-foreground leading-tight">
                        Usa estritamente a infraestrutura Lovable (requer hospedagem no Lovable).
                      </p>
                    </div>
                  </label>

                  <label
                    htmlFor="mode-serpapi"
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      googlePlacesModo === "serpapi"
                        ? "border-primary/80 bg-primary/5 text-foreground shadow-xs"
                        : "border-border/60 bg-background/80 text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    <RadioGroupItem value="serpapi" id="mode-serpapi" className="mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="font-semibold text-foreground">Motor Direto / SerpApi</div>
                      <p className="text-[11px] text-muted-foreground leading-tight">
                        Funciona em qualquer hospedagem externa (Vercel, VPS, Railway ou Local).
                      </p>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              <div className="flex flex-wrap items-end gap-3 pt-1">
                <Button onClick={buscarGoogle} disabled={loadingGoogle}>
                  {loadingGoogle ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-1.5" />
                  )}
                  Buscar no Google Places
                </Button>
                <div>
                  <label className="text-xs text-muted-foreground block">Resultados</label>
                  <Select value={limite} onValueChange={setLimite}>
                    <SelectTrigger className="w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["10", "20", "30", "50", "100"].map((n) => (
                        <SelectItem key={n} value={n}>
                          {n} empresas
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block">Filtro de Site</label>
                  <Select
                    value={filtroSite}
                    onValueChange={(v) => setFiltroSite(v as typeof filtroSite)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="com">Com site</SelectItem>
                      <SelectItem value="sem">Sem site</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {resultsGoogle.length > 0 && (
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-muted-foreground">
                    {resultsGoogleFiltrados.length} de {resultsGoogle.length} resultado(s) · fonte: Google Places
                  </div>
                  <Button size="sm" variant="outline" onClick={importarTodosGoogle}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Adicionar todas ao Radar
                  </Button>
                </div>
              )}

              <div className="space-y-2.5">
                {resultsGoogleFiltrados.map((p) => {
                  const done = imported.has(p.placeId);
                  return (
                    <ProspectItemCard
                      key={p.placeId}
                      id={p.placeId}
                      nome={p.nome}
                      segmento={p.segmento}
                      cidade={p.cidade || cidade}
                      endereco={p.endereco}
                      telefone={p.telefone}
                      site={p.site}
                      googleMapsUri={p.googleMapsUri}
                      rating={p.rating}
                      totalRatings={p.totalRatings}
                      isImported={done}
                      onImport={() => importarGooglePlace(p)}
                      onOpenWhatsApp={handleOpenWhatsApp}
                    />
                  );
                })}
                {!loadingGoogle && resultsGoogle.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border/60 rounded-md">
                    Escolha os filtros acima e clique em "Buscar no Google Places".
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------------- */}
        {/* ABA 2: SERPAPI */}
        {/* ------------------------------------------------------------------- */}
        <TabsContent value="serpapi" className="space-y-4 mt-0">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-emerald-500" />
                Descoberta via SerpApi (Google Maps Engine)
                <Badge variant="secondary" className="ml-1 text-[10px] font-normal">
                  Chave Conectada
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Busca de empresas no motor Google Maps utilizando a API SerpApi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderSharedFilters()}

              <div className="grid md:grid-cols-[1fr_130px_140px_auto] gap-2 pt-1">
                <div>
                  <label className="text-xs text-muted-foreground">Texto de busca personalizada (opcional)</label>
                  <Input
                    value={serpQueryCustom}
                    onChange={(e) => setSerpQueryCustom(e.target.value)}
                    placeholder={`Padrão: ${queryPadrao || "vinícolas em Bento Gonçalves RS"}`}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Limite</label>
                  <Select value={limite} onValueChange={setLimite}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["10", "20", "30", "50"].map((n) => (
                        <SelectItem key={n} value={n}>
                          {n} resultados
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Filtro de Site</label>
                  <Select
                    value={filtroSite}
                    onValueChange={(v) => setFiltroSite(v as typeof filtroSite)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="com">Com site</SelectItem>
                      <SelectItem value="sem">Sem site</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={buscarSerpApi} disabled={serpLoading}>
                    {serpLoading ? (
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 mr-1.5" />
                    )}
                    Buscar SerpApi
                  </Button>
                </div>
              </div>

              {serpResults.length > 0 && (
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-muted-foreground">
                    {serpResultsFiltrados.length} de {serpResults.length} resultado(s) encontrados
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => importarTodasUnified(serpResultsFiltrados)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Adicionar todas ao Radar
                  </Button>
                </div>
              )}

              <div className="space-y-2.5">
                {serpResultsFiltrados.map((p) => {
                  const done = imported.has(p.id);
                  return (
                    <ProspectItemCard
                      key={p.id}
                      id={p.id}
                      nome={p.nome}
                      razaoSocial={p.razaoSocial}
                      segmento={p.segmento}
                      cidade={p.cidade}
                      endereco={p.endereco}
                      telefone={p.telefone}
                      whatsapp={p.whatsapp}
                      site={p.site}
                      instagram={p.instagram}
                      googleMapsUri={p.googleMapsUri}
                      rating={p.rating}
                      totalRatings={p.totalRatings}
                      detalhesExtras={p.detalhesExtras}
                      isImported={done}
                      onImport={() => importarUnified(p)}
                      onOpenWhatsApp={handleOpenWhatsApp}
                    />
                  );
                })}
                {!serpLoading && serpResults.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border/60 rounded-md">
                    Selecione os filtros ou informe a consulta e clique em "Buscar SerpApi".
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------------- */}
        {/* ABA 3: APOLLO.IO */}
        {/* ------------------------------------------------------------------- */}
        <TabsContent value="apollo" className="space-y-4 mt-0">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-purple-500" />
                Prospecção Corporativa via Apollo.io
                <Badge variant="secondary" className="ml-1 text-[10px] font-normal">
                  Chave Conectada
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Busca de indústrias, empresas B2B e organizações por setor econômico e localização.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderSharedFilters()}

              <div className="grid md:grid-cols-[1fr_130px_140px_auto] gap-2 pt-1">
                <div>
                  <label className="text-xs text-muted-foreground">Nome específico de empresa (opcional)</label>
                  <Input
                    value={apolloQueryCustom}
                    onChange={(e) => setApolloQueryCustom(e.target.value)}
                    placeholder="ex: Randon, Tramontina, Marcopolo..."
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Limite</label>
                  <Select value={limite} onValueChange={setLimite}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["10", "25", "50", "100"].map((n) => (
                        <SelectItem key={n} value={n}>
                          {n} empresas
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Filtro de Site</label>
                  <Select
                    value={filtroSite}
                    onValueChange={(v) => setFiltroSite(v as typeof filtroSite)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="com">Com site</SelectItem>
                      <SelectItem value="sem">Sem site</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={buscarApollo} disabled={apolloLoading}>
                    {apolloLoading ? (
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 mr-1.5" />
                    )}
                    Buscar Apollo.io
                  </Button>
                </div>
              </div>

              {apolloResults.length > 0 && (
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-muted-foreground">
                    {apolloResultsFiltrados.length} de {apolloResults.length} organização(ões) encontrada(s)
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => importarTodasUnified(apolloResultsFiltrados)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Adicionar todas ao Radar
                  </Button>
                </div>
              )}

              <div className="space-y-2.5">
                {apolloResultsFiltrados.map((p) => {
                  const done = imported.has(p.id);
                  return (
                    <ProspectItemCard
                      key={p.id}
                      id={p.id}
                      nome={p.nome}
                      razaoSocial={p.razaoSocial}
                      segmento={p.segmento}
                      cidade={p.cidade}
                      estado={p.estado}
                      endereco={p.endereco}
                      telefone={p.telefone}
                      whatsapp={p.whatsapp}
                      site={p.site}
                      instagram={p.instagram}
                      linkedin={p.linkedin}
                      googleMapsUri={p.googleMapsUri}
                      detalhesExtras={p.detalhesExtras}
                      isImported={done}
                      onImport={() => importarUnified(p)}
                      onOpenWhatsApp={handleOpenWhatsApp}
                    />
                  );
                })}
                {!apolloLoading && apolloResults.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border/60 rounded-md">
                    Selecione os filtros acima e clique em "Buscar Apollo.io".
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------------- */}
        {/* ABA 4: OPENSTREETMAP (OVERPASS) */}
        {/* ------------------------------------------------------------------- */}
        <TabsContent value="openstreetmap" className="space-y-4 mt-0">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Compass className="h-4 w-4 text-amber-500" />
                Busca Aberta via OpenStreetMap (Overpass API)
                <Badge
                  variant="secondary"
                  className="ml-1 text-[10px] font-normal bg-green-500/15 text-green-600 dark:text-green-400"
                >
                  Gratuito / Open Data
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Consulta geoespacial livre no banco global do OpenStreetMap para identificar estabelecimentos e serviços.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderSharedFilters()}

              <div className="grid md:grid-cols-[1fr_130px_140px_auto] gap-2 pt-1">
                <div>
                  <label className="text-xs text-muted-foreground">Categoria OSM</label>
                  <Select value={osmCategoria} onValueChange={setOsmCategoria}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="shop">Comércio Geral (Shop)</SelectItem>
                      <SelectItem value="amenity">Serviços & Alimentação (Amenity)</SelectItem>
                      <SelectItem value="craft">Oficinas & Produção (Craft)</SelectItem>
                      <SelectItem value="office">Escritórios & Empresas (Office)</SelectItem>
                      <SelectItem value="tourism">Turismo & Hospedagem (Tourism)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Limite</label>
                  <Select value={limite} onValueChange={setLimite}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["20", "40", "60", "100"].map((n) => (
                        <SelectItem key={n} value={n}>
                          {n} registros
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Filtro de Site</label>
                  <Select
                    value={filtroSite}
                    onValueChange={(v) => setFiltroSite(v as typeof filtroSite)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="com">Com site</SelectItem>
                      <SelectItem value="sem">Sem site</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={buscarOsm} disabled={osmLoading}>
                    {osmLoading ? (
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 mr-1.5" />
                    )}
                    Buscar no OSM
                  </Button>
                </div>
              </div>

              {osmResults.length > 0 && (
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-muted-foreground">
                    {osmResultsFiltrados.length} de {osmResults.length} estabelecimento(s) encontrados
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => importarTodasUnified(osmResultsFiltrados)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Adicionar todas ao Radar
                  </Button>
                </div>
              )}

              <div className="space-y-2.5">
                {osmResultsFiltrados.map((p) => {
                  const done = imported.has(p.id);
                  return (
                    <ProspectItemCard
                      key={p.id}
                      id={p.id}
                      nome={p.nome}
                      razaoSocial={p.razaoSocial}
                      segmento={p.segmento}
                      cidade={p.cidade}
                      endereco={p.endereco}
                      bairro={p.bairro}
                      cep={p.cep}
                      telefone={p.telefone}
                      whatsapp={p.whatsapp}
                      email={p.email}
                      site={p.site}
                      instagram={p.instagram}
                      googleMapsUri={p.googleMapsUri}
                      detalhesExtras={p.detalhesExtras}
                      isImported={done}
                      onImport={() => importarUnified(p)}
                      onOpenWhatsApp={handleOpenWhatsApp}
                    />
                  );
                })}
                {!osmLoading && osmResults.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border/60 rounded-md">
                    Selecione a cidade acima e clique em "Buscar no OSM".
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------------- */}
        {/* ABA 5: BRASILAPI (CNPJ) COM FILTRO DE IDADE/TEMPO DE CRIAÇÃO */}
        {/* ------------------------------------------------------------------- */}
        <TabsContent value="brasilapi" className="space-y-4 mt-0">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-600" />
                Consulta Oficial de CNPJ via BrasilAPI (Receita Federal)
                <Badge
                  variant="secondary"
                  className="ml-1 text-[10px] font-normal bg-green-500/15 text-green-600 dark:text-green-400"
                >
                  Gratuito / Dados Oficiais
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Puxe automaticamente a Razão Social, Nome Fantasia, CNAE/Atividade, Data de Abertura, Endereço fiscal, Telefone oficial e Quadro Societário (QSA).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderSharedFilters()}

              <div className="grid md:grid-cols-2 gap-4 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-muted-foreground">
                      CNPJs específicos <span className="text-[11px] font-normal text-emerald-600 dark:text-emerald-400">(Opcional)</span>
                    </label>
                    {cnpjInput && (
                      <button
                        type="button"
                        onClick={() => setCnpjInput("")}
                        className="text-[10px] text-muted-foreground hover:underline"
                      >
                        Limpar campo
                      </button>
                    )}
                  </div>
                  <Textarea
                    rows={4}
                    value={cnpjInput}
                    onChange={(e) => setCnpjInput(e.target.value)}
                    placeholder="Deixe em branco para buscar empresas da cidade e segmento selecionados acima. Ou se preferir, digite/cole CNPJs específicos (um por linha)..."
                    className="font-mono text-xs"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    💡 Dica: Deixando vazio, o sistema pesquisará empresas ativas na cidade (<strong>{cidade || "selecionada"}</strong>) com dados oficiais da Receita Federal.
                  </p>
                </div>

                <div className="space-y-3 bg-muted/20 border border-border/60 rounded-lg p-3">
                  <div>
                    <label className="text-xs font-medium text-foreground flex items-center gap-1.5 mb-1">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      Tempo de Abertura / Criação da Empresa
                    </label>
                    <Select value={tempoCriacaoFiltro} onValueChange={setTempoCriacaoFiltro}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPCOES_TEMPO_CRIACAO.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Filtro de Site</label>
                    <Select
                      value={filtroSite}
                      onValueChange={(v) => setFiltroSite(v as typeof filtroSite)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="com">Com site</SelectItem>
                        <SelectItem value="sem">Sem site</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={consultarBrasilApi} disabled={cnpjLoading} className="w-full">
                    {cnpjLoading ? (
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 mr-1.5" />
                    )}
                    {cnpjInput.trim()
                      ? "Consultar CNPJs Informados"
                      : `Buscar Empresas em ${cidade || "Região"} (BrasilAPI)`}
                  </Button>
                </div>
              </div>

              {cnpjResults.length > 0 && (
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-muted-foreground">
                    {cnpjResultsFiltrados.length} de {cnpjResults.length} empresa(s) filtrada(s)
                    {tempoCriacaoFiltro !== "todos" && (
                      <span className="text-primary ml-1">
                        (filtro: {OPCOES_TEMPO_CRIACAO.find((o) => o.value === tempoCriacaoFiltro)?.label})
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => importarTodasUnified(cnpjResultsFiltrados)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Adicionar todas ao Radar
                  </Button>
                </div>
              )}

              <div className="space-y-2.5">
                {cnpjResultsFiltrados.map((p) => {
                  const done = imported.has(p.id);
                  return (
                    <ProspectItemCard
                      key={p.id}
                      id={p.id}
                      nome={p.nome}
                      razaoSocial={p.razaoSocial}
                      cnpj={p.cnpj}
                      segmento={p.segmento}
                      cidade={p.cidade}
                      estado={p.estado}
                      endereco={p.endereco}
                      bairro={p.bairro}
                      cep={p.cep}
                      telefone={p.telefone}
                      whatsapp={p.whatsapp}
                      email={p.email}
                      site={p.site}
                      instagram={p.instagram}
                      googleMapsUri={p.googleMapsUri}
                      dataInicioAtividade={p.dataInicioAtividade}
                      diasDesdeAbertura={p.diasDesdeAbertura}
                      detalhesExtras={p.detalhesExtras}
                      isImported={done}
                      onImport={() => importarUnified(p)}
                      onOpenWhatsApp={handleOpenWhatsApp}
                    />
                  );
                })}
                {!cnpjLoading && cnpjResults.length > 0 && cnpjResultsFiltrados.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border/60 rounded-md">
                    Nenhuma empresa corresponde ao filtro de tempo de criação selecionado ({OPCOES_TEMPO_CRIACAO.find((o) => o.value === tempoCriacaoFiltro)?.label}).
                  </div>
                )}
                {!cnpjLoading && cnpjResults.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border/60 rounded-md">
                    Selecione a localização/segmento acima (ou cole CNPJs específicos) e clique em "Buscar Empresas".
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------------- */}
        {/* ABA 6: CSV, MANUAL & ENRIQUECIMENTO */}
        {/* ------------------------------------------------------------------- */}
        <TabsContent value="outros" className="space-y-4 mt-0">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Importação CSV */}
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Upload className="h-4 w-4 text-primary" />
                  Importar via CSV
                </CardTitle>
                <CardDescription className="text-xs">
                  Cole os dados em formato CSV para adicionar várias empresas em lote.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  rows={6}
                  value={csv}
                  onChange={(e) => setCsv(e.target.value)}
                  className="font-mono text-xs"
                />
                <Button onClick={importarCsv}>
                  <Upload className="h-4 w-4 mr-1.5" />
                  Processar e Importar CSV
                </Button>
              </CardContent>
            </Card>

            {/* Cadastro Manual */}
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-primary" />
                  Cadastro Manual Rápido
                </CardTitle>
                <CardDescription className="text-xs">
                  Insira uma empresa pontualmente no pipeline comercial.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Nome da empresa *"
                    value={form.nome}
                    onChange={(e) => setF("nome", e.target.value)}
                  />
                  <Input
                    placeholder="Segmento (ex: Vinícola)"
                    value={form.segmento}
                    onChange={(e) => setF("segmento", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Cidade *"
                    value={form.cidade}
                    onChange={(e) => setF("cidade", e.target.value)}
                  />
                  <Input
                    placeholder="Telefone / WhatsApp"
                    value={form.telefone}
                    onChange={(e) => setF("telefone", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Site (ex: empresa.com.br)"
                    value={form.site}
                    onChange={(e) => setF("site", e.target.value)}
                  />
                  <Input
                    placeholder="Instagram (@perfil)"
                    value={form.instagram}
                    onChange={(e) => setF("instagram", e.target.value)}
                  />
                </div>
                <Button onClick={salvarManual} className="w-full">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Salvar Empresa no Radar
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Lookup por Site / Instagram */}
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Buscar empresa a partir de Site ou Instagram
                <Badge variant="secondary" className="ml-2 text-[10px] font-normal">
                  IA + Firecrawl
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Cole a URL do site ou o @perfil do Instagram para extrair automaticamente os dados da empresa via IA.
              </p>
              <div className="grid md:grid-cols-[1fr_auto] gap-2">
                <Input
                  value={lookupInput}
                  onChange={(e) => setLookupInput(e.target.value)}
                  placeholder="ex.: https://vinicola.com.br ou @minhaempresa"
                  onKeyDown={(e) => e.key === "Enter" && !lookupLoading && buscarLookup()}
                />
                <Button onClick={buscarLookup} disabled={lookupLoading}>
                  {lookupLoading ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-1.5" />
                  )}
                  Extrair Dados
                </Button>
              </div>

              {lookupResult && (
                <div className="rounded-md border border-border/60 p-4 space-y-3 bg-muted/30">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="font-medium">{lookupResult.nome}</div>
                        <Badge variant="outline" className="text-[10px] font-normal">
                          {lookupResult.segmento}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {[lookupResult.cidade, lookupResult.endereco].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <Button size="sm" onClick={importarLookup}>
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Adicionar ao Radar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL DE PRIMEIRO CONTATO VIA WHATSAPP */}
      <WhatsAppContactModal
        open={whatsAppModalOpen}
        onOpenChange={setWhatsAppModalOpen}
        empresa={whatsAppEmpresa}
      />
    </div>
  );
}

