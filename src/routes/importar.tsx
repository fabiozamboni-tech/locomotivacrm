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
  Ban,
  EyeOff,
  RotateCcw,
  Trash2,
  Database,
  RefreshCw,
  MessageCircle,
  Key,
  Star,
  Copy,
  Navigation,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  searchPlaces,
  type PlaceResult,
  type GooglePlacesConnectorMode,
} from "@/lib/places.functions";
import {
  lookupEmpresa,
  type LookupResult,
  lookupGoogleMapsAddress,
  type GoogleMapsLookupResult,
} from "@/lib/lookup.functions";
import {
  searchSerpApi,
  searchApollo,
  searchOverpass,
  lookupBrasilApiCnpj,
  searchInstagramProfiles,
  searchLinkedInLeads,
  searchTikTokProfiles,
  searchEconodataSpeedio,
  lookupRegistroBrWhois,
  searchOutscraperMaps,
  searchFacebookPages,
  type UnifiedProspectResult,
} from "@/lib/prospecting.functions";
import {
  WhatsAppContactModal,
  type ContactableEmpresa,
} from "@/components/whatsapp-contact-modal";
import {
  InstagramDmModal,
  type ContactableInstagramProfile,
} from "@/components/instagram-dm-modal";
import {
  LinkedInMessageModal,
  type ContactableLinkedInProfile,
} from "@/components/linkedin-message-modal";
import { ApiManagerModal } from "@/components/api-manager-modal";
import type { InstagramProfile } from "@/lib/store";
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
  onExclude?: () => void;
  onOpenWhatsApp: (empresa: ContactableEmpresa) => void;
  onOpenInstagramDm?: (perfil: ContactableInstagramProfile) => void;
  onOpenLinkedIn?: (perfil: ContactableLinkedInProfile) => void;
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
  onExclude,
  onOpenWhatsApp,
  onOpenInstagramDm,
  onOpenLinkedIn,
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

          {/* Instagram Link & Direct DM Button */}
          {instagramUrl && (
            <div className="inline-flex items-center gap-1.5">
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

              {onOpenInstagramDm && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenInstagramDm({
                      nome,
                      handle: (instagramHandle || "").replace(/^@/, ""),
                      instagramUrl: instagramUrl,
                      cidade,
                      segmento,
                      site,
                      bio: detalhesExtras,
                    })
                  }
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-gradient-to-r from-pink-600 via-rose-600 to-amber-600 hover:opacity-90 text-white transition-opacity cursor-pointer shadow-xs"
                  title="Abrir gerador de DM com IA e enviar mensagem no Instagram"
                >
                  <MessageCircle className="h-3 w-3" />
                  <span>Enviar DM</span>
                </button>
              )}
            </div>
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

          {/* LinkedIn Link & Direct Message Button */}
          {linkedin && (
            <div className="inline-flex items-center gap-1.5">
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

              {onOpenLinkedIn && (
                <button
                  type="button"
                  onClick={() =>
                    onOpenLinkedIn({
                      nome,
                      cargo: segmento || "Decisor",
                      empresa: razaoSocial || nome,
                      linkedinUrl: linkedin,
                      cidade,
                      segmento,
                      email,
                    })
                  }
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-600 hover:bg-sky-700 text-white transition-colors cursor-pointer shadow-xs"
                  title="Abrir gerador de mensagem consultiva e InMail no LinkedIn"
                >
                  <MessageSquare className="h-3 w-3" />
                  <span>Abordar</span>
                </button>
              )}
            </div>
          )}

          {/* Detalhes Extras */}
          {detalhesExtras && (
            <span className="text-[11px] text-muted-foreground italic">
              {detalhesExtras}
            </span>
          )}
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex md:flex-col items-center justify-end gap-2 shrink-0">
        <Button
          size="sm"
          variant={isImported ? "secondary" : "default"}
          disabled={isImported}
          onClick={onImport}
          className="w-full md:w-auto shadow-xs"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          {isImported ? "Adicionada" : "Adicionar"}
        </Button>
        {onExclude && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onExclude}
            className="w-full md:w-auto text-xs text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 px-2.5 h-8 border border-transparent hover:border-rose-500/20"
            title="Excluir este resultado e nunca mais exibir nas buscas das APIs"
          >
            <EyeOff className="h-3.5 w-3.5 mr-1.5 text-rose-500" />
            <span>Excluir</span>
          </Button>
        )}
      </div>
    </div>
  );
}

function ImportarPage() {
  const {
    empresas,
    addEmpresa,
    empresasExcluidas,
    excluirEmpresa,
    restaurarEmpresaExcluida,
    limparExcluidos,
    isEmpresaExcluida,
    instagramProfilesDb,
    salvarInstagramProfiles,
    removerInstagramProfile,
    limparInstagramProfilesDb,
  } = useStore();
  const [activeTab, setActiveTab] = useState("google_places");
  const [imported, setImported] = useState<Set<string>>(new Set());
  const [buscaExcluidos, setBuscaExcluidos] = useState("");

  // Modal de primeiro contato via WhatsApp
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [whatsAppEmpresa, setWhatsAppEmpresa] = useState<ContactableEmpresa | null>(null);

  const handleOpenWhatsApp = (emp: ContactableEmpresa) => {
    setWhatsAppEmpresa(emp);
    setWhatsAppModalOpen(true);
  };

  // Modal de primeiro contato via Instagram Direct (DM com IA)
  const [instagramDmModalOpen, setInstagramDmModalOpen] = useState(false);
  const [instagramDmPerfil, setInstagramDmPerfil] = useState<ContactableInstagramProfile | null>(null);

  const handleOpenInstagramDm = (perfil: ContactableInstagramProfile) => {
    setInstagramDmPerfil(perfil);
    setInstagramDmModalOpen(true);
  };

  // Modal de primeiro contato via LinkedIn (InMail / Conexão Consultiva)
  const [linkedInModalOpen, setLinkedInModalOpen] = useState(false);
  const [linkedInPerfil, setLinkedInPerfil] = useState<ContactableLinkedInProfile | null>(null);

  const handleOpenLinkedIn = (perfil: ContactableLinkedInProfile) => {
    setLinkedInPerfil(perfil);
    setLinkedInModalOpen(true);
  };

  // Modal da Central de Cadastro e Status de APIs
  const [apiModalOpen, setApiModalOpen] = useState(false);

  const handleExcluirResultado = (item: {
    nome: string;
    razaoSocial?: string;
    cnpj?: string;
    cidade?: string;
    estado?: string;
    segmento?: string;
    site?: string;
    telefone?: string;
    placeId?: string;
    origem?: string;
  }) => {
    excluirEmpresa(item);
    toast.error(`"${item.nome}" foi excluída e não aparecerá mais nas buscas.`, {
      description: "Você pode gerenciá-la ou restaurá-la a qualquer momento na aba Excluídos.",
      action: {
        label: "Desfazer",
        onClick: () => {
          const id =
            item.placeId ||
            (item.cnpj ? `cnpj-${item.cnpj.replace(/\D/g, "")}` : "");
          if (id) {
            restaurarEmpresaExcluida(id);
          }
        },
      },
    });
  };

  const exportarExcluidos = () => {
    if (empresasExcluidas.length === 0) return toast.info("Nenhuma empresa na lista de excluídos");
    const header = ["Nome", "Razao Social", "CNPJ", "Cidade", "Estado", "Segmento", "Site", "Telefone", "Origem", "Data Exclusao"].join(";");
    const rows = empresasExcluidas.map((e) =>
      [
        `"${e.nome}"`,
        `"${e.razaoSocial || ""}"`,
        `"${e.cnpj || ""}"`,
        `"${e.cidade || ""}"`,
        `"${e.estado || ""}"`,
        `"${e.segmento || ""}"`,
        `"${e.site || ""}"`,
        `"${e.telefone || ""}"`,
        `"${e.origem || ""}"`,
        `"${e.excluidoEm}"`,
      ].join(";"),
    );
    downloadFile(
      `radar-empresas-excluidas-${new Date().toISOString().slice(0, 10)}.csv`,
      [header, ...rows].join("\n"),
      "text/csv;charset=utf-8;",
    );
    toast.success("Lista de excluídos exportada com sucesso");
  };

  const excluidosFiltrados = useMemo(() => {
    if (!buscaExcluidos.trim()) return empresasExcluidas;
    const q = buscaExcluidos.toLowerCase().trim();
    return empresasExcluidas.filter(
      (e) =>
        e.nome.toLowerCase().includes(q) ||
        (e.razaoSocial && e.razaoSocial.toLowerCase().includes(q)) ||
        (e.cnpj && e.cnpj.includes(q)) ||
        (e.cidade && e.cidade.toLowerCase().includes(q)) ||
        (e.segmento && e.segmento.toLowerCase().includes(q)) ||
        (e.site && e.site.toLowerCase().includes(q)),
    );
  }, [empresasExcluidas, buscaExcluidos]);

  // -------------------------------------------------------------------------
  // Server Functions
  // -------------------------------------------------------------------------
  const searchGoogle = useServerFn(searchPlaces);
  const searchSerp = useServerFn(searchSerpApi);
  const searchApo = useServerFn(searchApollo);
  const searchOsm = useServerFn(searchOverpass);
  const lookupCnpj = useServerFn(lookupBrasilApiCnpj);
  const searchInstagram = useServerFn(searchInstagramProfiles);
  const searchLinkedIn = useServerFn(searchLinkedInLeads);
  const searchTikTok = useServerFn(searchTikTokProfiles);
  const searchEconodata = useServerFn(searchEconodataSpeedio);
  const lookupWhois = useServerFn(lookupRegistroBrWhois);
  const searchOutscraper = useServerFn(searchOutscraperMaps);
  const searchFacebook = useServerFn(searchFacebookPages);
  const lookup = useServerFn(lookupEmpresa);
  const lookupMaps = useServerFn(lookupGoogleMapsAddress);

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
      resultsGoogle.filter((p) => {
        if (
          isEmpresaExcluida({
            nome: p.nome,
            placeId: p.placeId,
            site: p.site,
            cidade: p.cidade || cidade,
          })
        ) {
          return false;
        }
        return filtroSite === "com" ? !!p.site : filtroSite === "sem" ? !p.site : true;
      }),
    [resultsGoogle, filtroSite, isEmpresaExcluida, cidade],
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
      serpResults.filter((p) => {
        if (
          isEmpresaExcluida({
            nome: p.nome,
            razaoSocial: p.razaoSocial,
            cnpj: p.cnpj,
            site: p.site,
            placeId: p.placeId,
            cidade: p.cidade || cidade,
          })
        ) {
          return false;
        }
        return filtroSite === "com" ? !!p.site : filtroSite === "sem" ? !p.site : true;
      }),
    [serpResults, filtroSite, isEmpresaExcluida, cidade],
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
      apolloResults.filter((p) => {
        if (
          isEmpresaExcluida({
            nome: p.nome,
            razaoSocial: p.razaoSocial,
            site: p.site,
            cidade: p.cidade || cidade,
          })
        ) {
          return false;
        }
        return filtroSite === "com" ? !!p.site : filtroSite === "sem" ? !p.site : true;
      }),
    [apolloResults, filtroSite, isEmpresaExcluida, cidade],
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
      osmResults.filter((p) => {
        if (
          isEmpresaExcluida({
            nome: p.nome,
            razaoSocial: p.razaoSocial,
            placeId: p.placeId,
            site: p.site,
            cidade: p.cidade || cidade,
          })
        ) {
          return false;
        }
        return filtroSite === "com" ? !!p.site : filtroSite === "sem" ? !p.site : true;
      }),
    [osmResults, filtroSite, isEmpresaExcluida, cidade],
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
    let list = cnpjResults.filter(
      (p) =>
        !isEmpresaExcluida({
          nome: p.nome,
          razaoSocial: p.razaoSocial,
          cnpj: p.cnpj,
          site: p.site,
          cidade: p.cidade || cidade,
        }),
    );

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
  }, [cnpjResults, tempoCriacaoFiltro, filtroSite, isEmpresaExcluida, cidade]);

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
  // 6. Instagram Scraping & Base de Dados Salva (Local/Offline) + Apify
  // -------------------------------------------------------------------------
  const [instagramModo, setInstagramModo] = useState<"database" | "live">("database");
  const [instagramEngine, setInstagramEngine] = useState<"serpapi" | "apify">("serpapi");
  const [apifyToken, setApifyToken] = useState("");
  const [instagramTermoLivre, setInstagramTermoLivre] = useState("");
  const [instagramLoading, setInstagramLoading] = useState(false);
  const [instagramLiveResults, setInstagramLiveResults] = useState<UnifiedProspectResult[]>([]);

  const buscarInstagram = async () => {
    setInstagramLoading(true);
    try {
      const rawResults = await searchInstagram({
        data: {
          segmento: segmento.trim() || undefined,
          cidade: cidade.trim(),
          estado: estado ? nomeEstado(pais, estado) : undefined,
          pais: pais ? nomePais(pais) : undefined,
          termoLivre: instagramTermoLivre.trim() || undefined,
          engine: instagramEngine,
          apifyToken: apifyToken.trim() || undefined,
          limit: parseInt(limite, 10) || 20,
        },
      });

      // Deduplicação contra a base de dados já salva
      const handleSetDb = new Set(
        instagramProfilesDb.map((p) => p.handle.toLowerCase().replace(/^@/, "").trim())
      );

      const novosPerfis: InstagramProfile[] = [];
      const resultadosVivosParaExibir: UnifiedProspectResult[] = [];

      for (const item of rawResults) {
        const handleClean = (item.instagram || "").toLowerCase().replace(/^@/, "").trim();
        const isJaNoBanco = handleClean ? handleSetDb.has(handleClean) : false;

        // Se for novo perfil, salva na base de dados persistente
        if (handleClean && !isJaNoBanco) {
          novosPerfis.push({
            id: `ig-${handleClean}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            handle: handleClean,
            nome: item.nome,
            instagramUrl: `https://instagram.com/${handleClean}`,
            bio: item.detalhesExtras,
            site: item.site,
            email: item.email,
            telefone: item.telefone,
            whatsapp: item.whatsapp,
            cidade: item.cidade || cidade || "—",
            estado: item.estado || (estado ? nomeEstado(pais, estado) : undefined),
            segmento: item.segmento || segmento,
            seguidores: item.totalRatings !== undefined ? String(item.totalRatings) : undefined,
            salvoEm: new Date().toISOString(),
            origemBusca: instagramEngine === "apify" ? "apify_actor" : "instagram_search",
          });
        }

        resultadosVivosParaExibir.push(item);
      }

      setInstagramLiveResults(resultadosVivosParaExibir);

      if (novosPerfis.length > 0) {
        salvarInstagramProfiles(novosPerfis);
        toast.success(
          `Encontrados ${rawResults.length} perfis (${novosPerfis.length} novos adicionados automaticamente à base salva!)`
        );
      } else if (rawResults.length > 0) {
        toast.info(
          `Encontrados ${rawResults.length} perfis (todos já constam na sua base de dados salva)`
        );
      } else {
        toast.info("Nenhum perfil comercial público do Instagram encontrado para os filtros selecionados.");
      }
    } catch (err: any) {
      toast.error(`Erro na busca do Instagram: ${err.message || String(err)}`);
    } finally {
      setInstagramLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // 7. LinkedIn Prospecção de Decisores (Sócios, CEOs, Marketing)
  // -------------------------------------------------------------------------
  const [linkedInCargo, setLinkedInCargo] = useState("Proprietário");
  const [linkedInEmpresa, setLinkedInEmpresa] = useState("");
  const [linkedInLoading, setLinkedInLoading] = useState(false);
  const [linkedInResults, setLinkedInResults] = useState<UnifiedProspectResult[]>([]);

  const linkedInResultsFiltrados = useMemo(() => {
    return linkedInResults.filter((item) => {
      if (isEmpresaExcluida({ nome: item.nome, site: item.site, cidade: item.cidade || cidade })) return false;
      if (filtroSite === "com" && !item.site) return false;
      if (filtroSite === "sem" && item.site) return false;
      return true;
    });
  }, [linkedInResults, filtroSite, isEmpresaExcluida, cidade]);

  const buscarLinkedIn = async () => {
    setLinkedInLoading(true);
    try {
      const res = await searchLinkedIn({
        data: {
          cidade: cidade.trim(),
          estado: estado ? nomeEstado(pais, estado) : undefined,
          segmento: segmento.trim() || undefined,
          cargo: linkedInCargo === "todos" ? undefined : linkedInCargo,
          empresa: linkedInEmpresa.trim() || undefined,
          limit: parseInt(limite, 10) || 20,
        },
      });
      setLinkedInResults(res);
      toast.success(`${res.length} decisor(es) encontrado(s) no LinkedIn`);
    } catch (err: any) {
      toast.error(`Erro na busca do LinkedIn: ${err.message || String(err)}`);
    } finally {
      setLinkedInLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // 8. TikTok Discovery
  // -------------------------------------------------------------------------
  const [tikTokTermoLivre, setTikTokTermoLivre] = useState("");
  const [tikTokLoading, setTikTokLoading] = useState(false);
  const [tikTokResults, setTikTokResults] = useState<UnifiedProspectResult[]>([]);

  const tikTokResultsFiltrados = useMemo(() => {
    return tikTokResults.filter((item) => {
      if (isEmpresaExcluida({ nome: item.nome, site: item.site, cidade: item.cidade || cidade })) return false;
      if (filtroSite === "com" && !item.site) return false;
      if (filtroSite === "sem" && item.site) return false;
      return true;
    });
  }, [tikTokResults, filtroSite, isEmpresaExcluida, cidade]);

  const buscarTikTok = async () => {
    setTikTokLoading(true);
    try {
      const res = await searchTikTok({
        data: {
          cidade: cidade.trim(),
          estado: estado ? nomeEstado(pais, estado) : undefined,
          segmento: segmento.trim() || undefined,
          termoLivre: tikTokTermoLivre.trim() || undefined,
          limit: parseInt(limite, 10) || 20,
        },
      });
      setTikTokResults(res);
      toast.success(`${res.length} perfil(is) de marca encontrados no TikTok`);
    } catch (err: any) {
      toast.error(`Erro na busca do TikTok: ${err.message || String(err)}`);
    } finally {
      setTikTokLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // 9. Speedio / Econodata (CNAE, Porte & Faturamento)
  // -------------------------------------------------------------------------
  const [econodataCnae, setEconodataCnae] = useState("");
  const [econodataPorte, setEconodataPorte] = useState<"todos" | "mei" | "micro" | "pequeno" | "medio_grande">("todos");
  const [econodataFaturamento, setEconodataFaturamento] = useState("");
  const [econodataLoading, setEconodataLoading] = useState(false);
  const [econodataResults, setEconodataResults] = useState<UnifiedProspectResult[]>([]);

  const econodataResultsFiltrados = useMemo(() => {
    return econodataResults.filter((item) => {
      if (isEmpresaExcluida({ nome: item.nome, cnpj: item.cnpj, site: item.site, cidade: item.cidade || cidade })) return false;
      if (filtroSite === "com" && !item.site) return false;
      if (filtroSite === "sem" && item.site) return false;
      return true;
    });
  }, [econodataResults, filtroSite, isEmpresaExcluida, cidade]);

  const buscarEconodata = async () => {
    setEconodataLoading(true);
    try {
      const res = await searchEconodata({
        data: {
          cidade: cidade.trim(),
          estado: estado ? nomeEstado(pais, estado) : undefined,
          segmento: segmento.trim() || undefined,
          cnae: econodataCnae.trim() || undefined,
          porte: econodataPorte,
          faturamentoEstimado: econodataFaturamento.trim() || undefined,
          limit: parseInt(limite, 10) || 20,
        },
      });
      setEconodataResults(res);
      toast.success(`${res.length} empresa(s) encontradas na inteligência B2B Econodata/Speedio`);
    } catch (err: any) {
      toast.error(`Erro na busca Econodata/Speedio: ${err.message || String(err)}`);
    } finally {
      setEconodataLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // 10. Registro.br Whois & Auditoria de Domínios
  // -------------------------------------------------------------------------
  const [registroBrDominio, setRegistroBrDominio] = useState("");
  const [registroBrLoading, setRegistroBrLoading] = useState(false);
  const [registroBrResults, setRegistroBrResults] = useState<UnifiedProspectResult[]>([]);

  const consultarRegistroBr = async () => {
    if (!registroBrDominio.trim()) {
      return toast.error("Informe um domínio para consulta no Registro.br");
    }
    setRegistroBrLoading(true);
    try {
      const res = await lookupWhois({
        data: {
          dominioOuTermo: registroBrDominio.trim(),
          cidade: cidade.trim() || undefined,
        },
      });
      setRegistroBrResults(res);
      toast.success(`Auditoria Whois concluída para ${registroBrDominio}`);
    } catch (err: any) {
      toast.error(err.message || "Erro ao consultar Registro.br");
    } finally {
      setRegistroBrLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // 11. PhantomBuster / Outscraper (Google Maps Deep Extractor)
  // -------------------------------------------------------------------------
  const [outscraperSegmento, setOutscraperSegmento] = useState("");
  const [outscraperLoading, setOutscraperLoading] = useState(false);
  const [outscraperResults, setOutscraperResults] = useState<UnifiedProspectResult[]>([]);

  const outscraperResultsFiltrados = useMemo(() => {
    return outscraperResults.filter((item) => {
      if (isEmpresaExcluida({ nome: item.nome, placeId: item.placeId, site: item.site, cidade: item.cidade || cidade })) return false;
      if (filtroSite === "com" && !item.site) return false;
      if (filtroSite === "sem" && item.site) return false;
      return true;
    });
  }, [outscraperResults, filtroSite, isEmpresaExcluida, cidade]);

  const buscarOutscraper = async () => {
    const seg = outscraperSegmento.trim() || segmento.trim();
    if (!seg) return toast.error("Informe o segmento ou atividade para extração");
    setOutscraperLoading(true);
    try {
      const res = await searchOutscraper({
        data: {
          cidade: cidade.trim(),
          estado: estado ? nomeEstado(pais, estado) : undefined,
          segmento: seg,
          limit: parseInt(limite, 10) || 20,
        },
      });
      setOutscraperResults(res);
      toast.success(`${res.length} estabelecimentos extraídos via Outscraper/PhantomBuster Maps`);
    } catch (err: any) {
      toast.error(`Erro na extração Outscraper: ${err.message || String(err)}`);
    } finally {
      setOutscraperLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // 12. Facebook Páginas Comerciais
  // -------------------------------------------------------------------------
  const [facebookTermoLivre, setFacebookTermoLivre] = useState("");
  const [facebookLoading, setFacebookLoading] = useState(false);
  const [facebookResults, setFacebookResults] = useState<UnifiedProspectResult[]>([]);

  const facebookResultsFiltrados = useMemo(() => {
    return facebookResults.filter((item) => {
      if (isEmpresaExcluida({ nome: item.nome, site: item.site, cidade: item.cidade || cidade })) return false;
      if (filtroSite === "com" && !item.site) return false;
      if (filtroSite === "sem" && item.site) return false;
      return true;
    });
  }, [facebookResults, filtroSite, isEmpresaExcluida, cidade]);

  const buscarFacebook = async () => {
    setFacebookLoading(true);
    try {
      const res = await searchFacebook({
        data: {
          cidade: cidade.trim(),
          estado: estado ? nomeEstado(pais, estado) : undefined,
          segmento: segmento.trim() || undefined,
          termoLivre: facebookTermoLivre.trim() || undefined,
          limit: parseInt(limite, 10) || 20,
        },
      });
      setFacebookResults(res);
      toast.success(`${res.length} página(s) comercial(is) encontrada(s) no Facebook`);
    } catch (err: any) {
      toast.error(`Erro na busca do Facebook: ${err.message || String(err)}`);
    } finally {
      setFacebookLoading(false);
    }
  };

  const instagramResultadosFiltrados = useMemo(() => {
    if (instagramModo === "live") {
      return instagramLiveResults.filter((item) => {
        if (
          isEmpresaExcluida({
            nome: item.nome,
            site: item.site,
            cidade: item.cidade || cidade,
          })
        ) {
          return false;
        }
        if (filtroSite === "com" && !item.site) return false;
        if (filtroSite === "sem" && item.site) return false;
        return true;
      });
    }

    // Modo "database": base salva localmente
    return instagramProfilesDb
      .filter((p) => {
        if (
          isEmpresaExcluida({
            nome: p.nome,
            site: p.site,
            cidade: p.cidade,
          })
        ) {
          return false;
        }

        if (filtroSite === "com" && !p.site) return false;
        if (filtroSite === "sem" && p.site) return false;

        if (cidade && p.cidade && !p.cidade.toLowerCase().includes(cidade.toLowerCase())) {
          return false;
        }

        if (segmento && p.segmento && !p.segmento.toLowerCase().includes(segmento.toLowerCase())) {
          return false;
        }

        if (instagramTermoLivre.trim()) {
          const q = instagramTermoLivre.toLowerCase().trim();
          const match =
            p.nome.toLowerCase().includes(q) ||
            p.handle.toLowerCase().includes(q) ||
            (p.bio && p.bio.toLowerCase().includes(q)) ||
            (p.site && p.site.toLowerCase().includes(q)) ||
            (p.email && p.email.toLowerCase().includes(q)) ||
            (p.telefone && p.telefone.includes(q)) ||
            (p.whatsapp && p.whatsapp.includes(q));
          if (!match) return false;
        }

        return true;
      })
      .map(
        (p): UnifiedProspectResult => ({
          id: p.id,
          nome: p.nome,
          segmento: p.segmento,
          cidade: p.cidade,
          estado: p.estado,
          site: p.site,
          email: p.email,
          telefone: p.telefone,
          whatsapp: p.whatsapp,
          instagram: `@${p.handle.replace(/^@/, "")}`,
          detalhesExtras: p.bio,
          origem: "instagram",
        })
      );
  }, [
    instagramModo,
    instagramLiveResults,
    instagramProfilesDb,
    filtroSite,
    cidade,
    segmento,
    instagramTermoLivre,
    isEmpresaExcluida,
  ]);

  const importarInstagramParaRadar = (p: UnifiedProspectResult) => {
    addEmpresa(
      empresaFromRaw({
        nome: p.nome,
        segmento: p.segmento || segmento || "Outros",
        cidade: p.cidade || cidade || "—",
        endereco: p.cidade ? `${p.cidade}, ${p.estado || ""}` : "Endereço não informado",
        telefone: p.telefone,
        whatsapp: p.whatsapp,
        email: p.email,
        site: p.site,
        instagram: p.instagram,
        observacoes: p.detalhesExtras
          ? `Perfil Instagram: ${p.instagram || ""}\nBio: ${p.detalhesExtras}`
          : `Perfil Instagram: ${p.instagram || ""}`,
        origem: "instagram",
      })
    );
    setImported((prev) => new Set(prev).add(p.id));
    toast.success(`${p.nome} adicionada ao Radar CRM`);
  };

  const importarTodosInstagram = () => {
    let count = 0;
    for (const p of instagramResultadosFiltrados) {
      if (!imported.has(p.id)) {
        importarInstagramParaRadar(p);
        count++;
      }
    }
    if (count > 0) {
      toast.success(`${count} perfis adicionados ao Radar CRM`);
    } else {
      toast.info("Todos os perfis listados já foram adicionados");
    }
  };

  const exportarInstagramCsv = () => {
    if (instagramProfilesDb.length === 0) return toast.info("Nenhum perfil salvo na base do Instagram");
    const header = ["Handle", "Nome", "Segmento", "Cidade", "Estado", "Bio", "Site", "Email", "Telefone", "WhatsApp", "Data Captura"].join(";");
    const rows = instagramProfilesDb.map((p) =>
      [
        `"@${p.handle.replace(/^@/, "")}"`,
        `"${p.nome}"`,
        `"${p.segmento || ""}"`,
        `"${p.cidade || ""}"`,
        `"${p.estado || ""}"`,
        `"${(p.bio || "").replace(/"/g, '""')}"`,
        `"${p.site || ""}"`,
        `"${p.email || ""}"`,
        `"${p.telefone || ""}"`,
        `"${p.whatsapp || ""}"`,
        `"${p.salvoEm}"`,
      ].join(";"),
    );
    downloadFile(
      `radar-instagram-base-${new Date().toISOString().slice(0, 10)}.csv`,
      [header, ...rows].join("\n"),
      "text/csv;charset=utf-8;",
    );
    toast.success("Base de perfis do Instagram exportada com sucesso");
  };

  // -------------------------------------------------------------------------
  // 7. CSV / Manual / Lookup State
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

  // Google Maps Address / Link Lookup State
  const [mapsInput, setMapsInput] = useState("");
  const [mapsLoading, setMapsLoading] = useState(false);
  const [mapsResult, setMapsResult] = useState<GoogleMapsLookupResult | null>(null);

  const buscarMaps = async (customInput?: string) => {
    const query = (customInput ?? mapsInput).trim();
    if (!query) return toast.error("Informe o link do Google Maps ou o endereço da empresa");
    if (customInput) setMapsInput(customInput);
    setMapsLoading(true);
    setMapsResult(null);
    try {
      const res = await lookupMaps({ data: { input: query } });
      setMapsResult(res);
      toast.success(`Dados do Google Maps extraídos para "${res.nome}"`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha na busca do Google Maps");
    } finally {
      setMapsLoading(false);
    }
  };

  const aplicarMapsNoFormulario = () => {
    if (!mapsResult) return;
    setForm({
      nome: mapsResult.nome || "",
      segmento: mapsResult.segmento || "",
      cidade: mapsResult.cidade !== "—" ? mapsResult.cidade : "",
      bairro: mapsResult.bairro || "",
      endereco: mapsResult.endereco || "",
      telefone: mapsResult.telefone || mapsResult.whatsapp || "",
      whatsapp: mapsResult.whatsapp || "",
      email: mapsResult.email || "",
      site: mapsResult.site || "",
      instagram: "",
      observacoes: [
        mapsResult.resumo,
        mapsResult.googleMapsUrl ? `Google Maps: ${mapsResult.googleMapsUrl}` : "",
        mapsResult.rating ? `Avaliação: ⭐ ${mapsResult.rating} (${mapsResult.totalRatings || 0} avaliações)` : "",
        mapsResult.statusFuncionamento ? `Status: ${mapsResult.statusFuncionamento}` : "",
        mapsResult.horario ? `Horários: ${mapsResult.horario}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
    });
    toast.success("Dados preenchidos no formulário manual! Revise e clique em 'Salvar Empresa'.");
  };

  const importarMapsDireto = () => {
    if (!mapsResult) return;
    addEmpresa(
      empresaFromRaw({
        nome: mapsResult.nome,
        segmento: mapsResult.segmento || "Comércio / Serviços",
        cidade: mapsResult.cidade || "—",
        bairro: mapsResult.bairro,
        endereco: mapsResult.endereco,
        telefone: mapsResult.telefone || mapsResult.whatsapp,
        whatsapp: mapsResult.whatsapp,
        email: mapsResult.email,
        site: mapsResult.site,
        origem: "google_maps",
        observacoes: [
          mapsResult.resumo,
          mapsResult.googleMapsUrl ? `Google Maps: ${mapsResult.googleMapsUrl}` : "",
          mapsResult.rating ? `Avaliação: ⭐ ${mapsResult.rating} (${mapsResult.totalRatings || 0} avaliações)` : "",
          mapsResult.statusFuncionamento ? `Status: ${mapsResult.statusFuncionamento}` : "",
          mapsResult.horario ? `Horários: ${mapsResult.horario}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
      }),
    );
    toast.success(`${mapsResult.nome} adicionada ao radar com sucesso!`);
    setMapsResult(null);
    setMapsInput("");
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
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setApiModalOpen(true)}
            className="bg-primary/5 border-primary/30 text-foreground hover:bg-primary/10 text-xs shadow-xs"
          >
            <Key className="h-3.5 w-3.5 mr-1.5 text-primary" />
            <span className="h-2 w-2 rounded-full bg-emerald-500 mr-1 animate-pulse" />
            Gerenciar APIs & Status
          </Button>
          <Button variant="outline" size="sm" onClick={exportarEmpresas} className="text-xs">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Exportar CRM ({empresas.length})
          </Button>
        </div>
      </div>

      {/* TABS DE PROVEDORES E CANAIS DE PROSPECÇÃO */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 h-auto p-1 bg-muted/60 border border-border/60 gap-1">
          <TabsTrigger value="google_places" className="flex items-center gap-1.5 py-1.5 text-xs">
            <MapPin className="h-3.5 w-3.5 text-blue-500" />
            <span>Google Places</span>
          </TabsTrigger>
          <TabsTrigger value="serpapi" className="flex items-center gap-1.5 py-1.5 text-xs">
            <Globe className="h-3.5 w-3.5 text-emerald-500" />
            <span>SerpApi</span>
          </TabsTrigger>
          <TabsTrigger value="outscraper" className="flex items-center gap-1.5 py-1.5 text-xs">
            <MapPin className="h-3.5 w-3.5 text-cyan-500" />
            <span>Outscraper</span>
          </TabsTrigger>
          <TabsTrigger value="instagram" className="flex items-center gap-1.5 py-1.5 text-xs">
            <Instagram className="h-3.5 w-3.5 text-pink-500" />
            <span>Instagram ({instagramProfilesDb.length})</span>
          </TabsTrigger>
          <TabsTrigger value="linkedin" className="flex items-center gap-1.5 py-1.5 text-xs">
            <Linkedin className="h-3.5 w-3.5 text-sky-500" />
            <span>LinkedIn</span>
          </TabsTrigger>
          <TabsTrigger value="tiktok" className="flex items-center gap-1.5 py-1.5 text-xs">
            <AtSign className="h-3.5 w-3.5 text-slate-800 dark:text-slate-200" />
            <span>TikTok</span>
          </TabsTrigger>
          <TabsTrigger value="facebook" className="flex items-center gap-1.5 py-1.5 text-xs">
            <Facebook className="h-3.5 w-3.5 text-blue-600" />
            <span>Facebook</span>
          </TabsTrigger>
          <TabsTrigger value="econodata" className="flex items-center gap-1.5 py-1.5 text-xs">
            <Building2 className="h-3.5 w-3.5 text-indigo-500" />
            <span>Econodata</span>
          </TabsTrigger>
          <TabsTrigger value="brasilapi" className="flex items-center gap-1.5 py-1.5 text-xs">
            <FileText className="h-3.5 w-3.5 text-green-600" />
            <span>BrasilAPI</span>
          </TabsTrigger>
          <TabsTrigger value="registrobr" className="flex items-center gap-1.5 py-1.5 text-xs">
            <Globe className="h-3.5 w-3.5 text-orange-500" />
            <span>Registro.br</span>
          </TabsTrigger>
          <TabsTrigger value="outros" className="flex items-center gap-1.5 py-1.5 text-xs">
            <Upload className="h-3.5 w-3.5 text-muted-foreground" />
            <span>CSV/Manual</span>
          </TabsTrigger>
          <TabsTrigger value="excluidos" className="flex items-center gap-1.5 py-1.5 text-xs">
            <Ban className="h-3.5 w-3.5 text-rose-500" />
            <span>Excluídos ({empresasExcluidas.length})</span>
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
                      onExclude={() =>
                        handleExcluirResultado({
                          nome: p.nome,
                          cidade: p.cidade || cidade,
                          estado: estado ? nomeEstado(pais, estado) : undefined,
                          segmento: p.segmento || segmento,
                          site: p.site,
                          telefone: p.telefone,
                          placeId: p.placeId,
                          origem: "google_places",
                        })
                      }
                      onOpenWhatsApp={handleOpenWhatsApp}
                      onOpenInstagramDm={handleOpenInstagramDm}
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
                Busca Web & Maps via SerpApi
                <Badge variant="secondary" className="ml-1 text-[10px] font-normal">
                  Google Engine
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Varredura ampla no Google Search / Maps com extração de contatos públicos e redes sociais.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderSharedFilters()}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={`Consulta customizada (padrão: ${queryPadrao || "segmento em cidade"})...`}
                    value={serpQueryCustom}
                    onChange={(e) => setSerpQueryCustom(e.target.value)}
                    className="pl-8 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") buscarSerpApi();
                    }}
                  />
                </div>
                <Button onClick={buscarSerpApi} disabled={serpLoading}>
                  {serpLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search className="h-3.5 w-3.5 mr-1.5" />
                      Buscar SerpApi
                    </>
                  )}
                </Button>
              </div>

              {serpResultsFiltrados.length > 0 && (
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-muted-foreground">
                    Exibindo <strong>{serpResultsFiltrados.length}</strong> empresa(s)
                  </div>
                  <Button size="sm" variant="outline" onClick={() => importarTodasUnified(serpResultsFiltrados)}>
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
                      segmento={p.segmento || segmento}
                      cidade={p.cidade || cidade}
                      estado={p.estado}
                      telefone={p.telefone || p.whatsapp}
                      whatsapp={p.whatsapp}
                      email={p.email}
                      site={p.site}
                      instagram={p.instagram}
                      linkedin={p.linkedin}
                      googleMapsUri={p.googleMapsUri}
                      rating={p.rating}
                      totalRatings={p.totalRatings}
                      detalhesExtras={p.detalhesExtras}
                      isImported={done}
                      onImport={() => importarUnified(p)}
                      onExclude={() =>
                        handleExcluirResultado({
                          nome: p.nome,
                          cidade: p.cidade || cidade,
                          estado: p.estado,
                          segmento: p.segmento || segmento,
                          site: p.site,
                          telefone: p.telefone || p.whatsapp,
                          placeId: p.placeId,
                          origem: "serpapi",
                        })
                      }
                      onOpenWhatsApp={handleOpenWhatsApp}
                      onOpenInstagramDm={handleOpenInstagramDm}
                      onOpenLinkedIn={handleOpenLinkedIn}
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
        {/* ABA: PHANTOMBUSTER / OUTSCRAPER (GOOGLE MAPS DEEP EXTRACTOR) */}
        {/* ------------------------------------------------------------------- */}
        <TabsContent value="outscraper" className="space-y-4 mt-0">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-cyan-500" />
                Extração Automatizada de Dados (Outscraper & PhantomBuster Maps)
                <Badge variant="secondary" className="ml-1 text-[10px] font-normal">
                  Google Maps Scraper
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Extração de alto volume com horários, avaliações, categorias completas e múltiplos telefones diretamente do Google Maps.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderSharedFilters()}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={`Atividade ou Nicho específico em ${cidade || "cidade"} (ex: Barbearia, Construtora, Dentista)...`}
                    value={outscraperSegmento}
                    onChange={(e) => setOutscraperSegmento(e.target.value)}
                    className="pl-8 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") buscarOutscraper();
                    }}
                  />
                </div>
                <Button onClick={buscarOutscraper} disabled={outscraperLoading} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                  {outscraperLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Extraindo Maps...
                    </>
                  ) : (
                    <>
                      <Search className="h-3.5 w-3.5 mr-1.5" />
                      Executar Extração Deep Maps
                    </>
                  )}
                </Button>
              </div>

              {outscraperResultsFiltrados.length > 0 && (
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-muted-foreground">
                    Exibindo <strong>{outscraperResultsFiltrados.length}</strong> estabelecimento(s)
                  </div>
                  <Button size="sm" variant="outline" onClick={() => importarTodasUnified(outscraperResultsFiltrados)}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Adicionar todas ao Radar CRM
                  </Button>
                </div>
              )}

              <div className="space-y-2.5">
                {outscraperResultsFiltrados.map((p) => {
                  const done = imported.has(p.id);
                  return (
                    <ProspectItemCard
                      key={p.id}
                      id={p.id}
                      nome={p.nome}
                      segmento={p.segmento || segmento}
                      cidade={p.cidade || cidade}
                      estado={p.estado}
                      endereco={p.endereco}
                      telefone={p.telefone}
                      whatsapp={p.whatsapp}
                      site={p.site}
                      googleMapsUri={p.googleMapsUri}
                      rating={p.rating}
                      totalRatings={p.totalRatings}
                      detalhesExtras={p.detalhesExtras}
                      isImported={done}
                      onImport={() => importarUnified(p)}
                      onExclude={() =>
                        handleExcluirResultado({
                          nome: p.nome,
                          cidade: p.cidade || cidade,
                          estado: p.estado,
                          segmento: p.segmento || segmento,
                          site: p.site,
                          telefone: p.telefone,
                          placeId: p.placeId,
                          origem: "outscraper",
                        })
                      }
                      onOpenWhatsApp={handleOpenWhatsApp}
                      onOpenInstagramDm={handleOpenInstagramDm}
                      onOpenLinkedIn={handleOpenLinkedIn}
                    />
                  );
                })}
                {!outscraperLoading && outscraperResults.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border/60 rounded-md">
                    Selecione a cidade acima e clique em "Executar Extração Deep Maps".
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------------- */}
        {/* ABA 3: INSTAGRAM SCRAPING & BASE DE DADOS + APIFY */}
        {/* ------------------------------------------------------------------- */}
        <TabsContent value="instagram" className="space-y-4 mt-0">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Instagram className="h-4 w-4 text-pink-500" />
                    Descoberta de Perfis no Instagram & Base Salva
                    <Badge variant="secondary" className="ml-1 text-[10px] font-normal">
                      Web Scraping
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-normal bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30"
                    >
                      {instagramProfilesDb.length} salvos no banco
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Pesquise perfis comerciais no Instagram com filtros geográficos e de segmento. Suporte a SerpApi e Apify Actor com deduplicação automática.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtros Geográficos e de Segmento */}
              {renderSharedFilters()}

              {/* Seletor de Modo: Base Salva vs Nova Pesquisa Live */}
              <div className="bg-muted/40 rounded-lg p-3.5 border border-border/60 space-y-3">
                <div className="text-xs font-medium text-foreground flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5 text-pink-500" />
                  Fonte de Dados da Pesquisa:
                </div>
                <RadioGroup
                  value={instagramModo}
                  onValueChange={(v) => setInstagramModo(v as "database" | "live")}
                  className="grid grid-cols-1 md:grid-cols-2 gap-2.5"
                >
                  <label
                    htmlFor="ig-mode-db"
                    className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                      instagramModo === "database"
                        ? "border-pink-500/80 bg-pink-500/5 text-foreground shadow-xs ring-1 ring-pink-500/30"
                        : "border-border/60 bg-background/80 text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    <RadioGroupItem value="database" id="ig-mode-db" className="mt-0.5 text-pink-600" />
                    <div className="space-y-0.5">
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <Database className="h-3.5 w-3.5 text-pink-500" />
                        Pesquisar na Base de Dados Salva (Local/Offline)
                        <Badge variant="outline" className="text-[10px] font-mono ml-1">
                          {instagramProfilesDb.length} perfis
                        </Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Busca instantânea e offline nos perfis comerciais já capturados e salvos no seu armazenamento local.
                      </div>
                    </div>
                  </label>

                  <label
                    htmlFor="ig-mode-live"
                    className={`flex items-start gap-2.5 p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                      instagramModo === "live"
                        ? "border-pink-500/80 bg-pink-500/5 text-foreground shadow-xs ring-1 ring-pink-500/30"
                        : "border-border/60 bg-background/80 text-muted-foreground hover:bg-muted/40"
                    }`}
                  >
                    <RadioGroupItem value="live" id="ig-mode-live" className="mt-0.5 text-pink-600" />
                    <div className="space-y-0.5">
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <RefreshCw className="h-3.5 w-3.5 text-pink-500" />
                        Nova Pesquisa no Instagram (API Live Scraping)
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Executa varredura ao vivo, <strong>ignora perfis já salvos</strong> e completa sua base com novas empresas.
                      </div>
                    </div>
                  </label>
                </RadioGroup>

                {/* Seletor de Motor no modo Live (SerpApi vs Apify) */}
                {instagramModo === "live" && (
                  <div className="pt-2 border-t border-border/40 space-y-2">
                    <div className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-pink-500" />
                      Motor de Scraping:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setInstagramEngine("serpapi")}
                        className={`p-2 rounded-md border text-left cursor-pointer text-xs transition-all ${
                          instagramEngine === "serpapi"
                            ? "border-pink-500 bg-pink-500/10 text-foreground font-semibold shadow-xs"
                            : "border-border/60 bg-background text-muted-foreground hover:bg-muted/40"
                        }`}
                      >
                        <div className="font-medium text-foreground">Google Index (SerpApi)</div>
                        <div className="text-[10px] text-muted-foreground">Rápido, indexado e seguro contra bloqueios.</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setInstagramEngine("apify")}
                        className={`p-2 rounded-md border text-left cursor-pointer text-xs transition-all ${
                          instagramEngine === "apify"
                            ? "border-pink-500 bg-pink-500/10 text-foreground font-semibold shadow-xs"
                            : "border-border/60 bg-background text-muted-foreground hover:bg-muted/40"
                        }`}
                      >
                        <div className="font-medium text-foreground flex items-center justify-between">
                          <span>Apify Instagram Actor</span>
                          <Badge variant="outline" className="text-[9px]">Lovable</Badge>
                        </div>
                        <div className="text-[10px] text-muted-foreground">Scraping com contagem de posts e métricas.</div>
                      </button>
                    </div>

                    {instagramEngine === "apify" && (
                      <Input
                        type="password"
                        placeholder="Token Apify (Opcional se configurado em .env/Lovable)..."
                        value={apifyToken}
                        onChange={(e) => setApifyToken(e.target.value)}
                        className="text-xs font-mono h-8"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Barra de Ações e Filtros adicionais */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={
                      instagramModo === "live"
                        ? "Termo adicional para scraping (ex: @usuario, estética, boutique, café gourmet)..."
                        : "Filtrar por nome, @handle, bio, email, telefone..."
                    }
                    value={instagramTermoLivre}
                    onChange={(e) => setInstagramTermoLivre(e.target.value)}
                    className="pl-8 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && instagramModo === "live") {
                        buscarInstagram();
                      }
                    }}
                  />
                </div>

                {instagramModo === "live" ? (
                  <Button
                    onClick={buscarInstagram}
                    disabled={instagramLoading}
                    className="bg-gradient-to-r from-pink-600 via-rose-600 to-amber-600 hover:opacity-90 text-white font-medium text-xs px-4"
                  >
                    {instagramLoading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        Varrendo Instagram...
                      </>
                    ) : (
                      <>
                        <Search className="h-3.5 w-3.5 mr-1.5" />
                        Buscar Novos Perfis
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportarInstagramCsv}
                      disabled={instagramProfilesDb.length === 0}
                      className="text-xs"
                    >
                      <Download className="h-3.5 w-3.5 mr-1.5" />
                      Exportar CSV ({instagramProfilesDb.length})
                    </Button>
                    {instagramProfilesDb.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm("Deseja realmente limpar todos os perfis salvos na base do Instagram?")) {
                            limparInstagramProfilesDb();
                            toast.success("Base do Instagram limpa");
                          }
                        }}
                        className="text-xs text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
                        title="Limpar todos os perfis salvos"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Informações da Busca e Botão de Ação em Massa */}
              {instagramResultadosFiltrados.length > 0 && (
                <div className="flex items-center justify-between pt-1">
                  <div className="text-xs text-muted-foreground">
                    Exibindo <strong>{instagramResultadosFiltrados.length}</strong> perfil(is){" "}
                    {instagramModo === "live"
                      ? "encontrados nesta pesquisa"
                      : "na sua base de dados salva"}
                  </div>
                  <Button size="sm" variant="outline" onClick={importarTodosInstagram}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Adicionar todas ao Radar CRM
                  </Button>
                </div>
              )}

              {/* Lista de Resultados */}
              <div className="space-y-2.5">
                {instagramResultadosFiltrados.map((p) => {
                  const done = imported.has(p.id);
                  return (
                    <ProspectItemCard
                      key={p.id}
                      id={p.id}
                      nome={p.nome}
                      segmento={p.segmento || segmento}
                      cidade={p.cidade || cidade}
                      estado={p.estado}
                      telefone={p.telefone}
                      whatsapp={p.whatsapp}
                      email={p.email}
                      site={p.site}
                      instagram={p.instagram}
                      detalhesExtras={p.detalhesExtras}
                      isImported={done}
                      onImport={() => importarInstagramParaRadar(p)}
                      onExclude={() =>
                        handleExcluirResultado({
                          nome: p.nome,
                          cidade: p.cidade || cidade,
                          estado: p.estado,
                          segmento: p.segmento || segmento,
                          site: p.site,
                          telefone: p.telefone || p.whatsapp,
                          origem: "instagram",
                        })
                      }
                      onOpenWhatsApp={handleOpenWhatsApp}
                      onOpenInstagramDm={handleOpenInstagramDm}
                    />
                  );
                })}

                {instagramResultadosFiltrados.length === 0 && !instagramLoading && (
                  <div className="text-center py-12 px-4 border border-dashed border-border/60 rounded-lg space-y-3">
                    <Instagram className="h-10 w-10 mx-auto text-pink-500/60" />
                    <div className="text-sm font-semibold text-foreground">
                      {instagramModo === "database"
                        ? instagramProfilesDb.length === 0
                          ? "Sua base de dados do Instagram ainda está vazia"
                          : "Nenhum perfil encontrado para os filtros selecionados"
                        : "Nenhum perfil retornado na pesquisa"}
                    </div>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      {instagramModo === "database"
                        ? instagramProfilesDb.length === 0
                          ? "Selecione a opção 'Nova Pesquisa no Instagram (API Live)' acima para realizar sua primeira varredura e salvar perfis automaticamente."
                          : "Tente ajustar a cidade, o segmento ou o campo de busca livre para encontrar perfis já salvos."
                        : "Clique no botão 'Buscar Novos Perfis' para rastrear perfis comerciais públicos do Instagram de acordo com a cidade e segmento selecionados."}
                    </p>
                    {instagramModo === "database" && instagramProfilesDb.length === 0 && (
                      <Button
                        size="sm"
                        onClick={() => setInstagramModo("live")}
                        className="bg-gradient-to-r from-pink-600 via-rose-600 to-amber-600 hover:opacity-90 text-white text-xs"
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                        Ir para Nova Pesquisa Live
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------------- */}
        {/* ABA: LINKEDIN DECISORES (PROPRIETÁRIOS, CEOS & MARKETING) */}
        {/* ------------------------------------------------------------------- */}
        <TabsContent value="linkedin" className="space-y-4 mt-0">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Linkedin className="h-4 w-4 text-sky-500" />
                Prospecção de Decisores no LinkedIn
                <Badge variant="secondary" className="ml-1 text-[10px] font-normal">
                  C-Level & Sócios
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Busca direcionada de Proprietários, CEOs, Diretores e Gestores de Marketing por setor econômico e localização.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderSharedFilters()}

              <div className="grid md:grid-cols-[1fr_1fr_130px_130px_auto] gap-2 pt-1 items-end">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Cargo / Nível de Decisão</label>
                  <Select
                    value={linkedInCargo}
                    onValueChange={(v) => setLinkedInCargo(v as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Cargos</SelectItem>
                      <SelectItem value="proprietarios">Proprietários / Sócios / Founders</SelectItem>
                      <SelectItem value="ceos_diretores">CEOs / Diretores Executivos</SelectItem>
                      <SelectItem value="marketing_vendas">Marketing & Vendas</SelectItem>
                      <SelectItem value="gerentes">Gerentes Gerais / Operações</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Empresa Específica (Opcional)</label>
                  <Input
                    value={linkedInEmpresa}
                    onChange={(e) => setLinkedInEmpresa(e.target.value)}
                    placeholder="ex: Hospital São Lucas, Vinícola Aurora..."
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Limite</label>
                  <Select value={limite} onValueChange={setLimite}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["10", "20", "40", "60"].map((n) => (
                        <SelectItem key={n} value={n}>
                          {n} decisores
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
                <div>
                  <Button onClick={buscarLinkedIn} disabled={linkedInLoading} className="bg-sky-600 hover:bg-sky-700 text-white">
                    {linkedInLoading ? (
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 mr-1.5" />
                    )}
                    Buscar Decisores
                  </Button>
                </div>
              </div>

              {linkedInResults.length > 0 && (
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-muted-foreground">
                    Exibindo <strong>{linkedInResultsFiltrados.length}</strong> de {linkedInResults.length} decisor(es)
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => importarTodasUnified(linkedInResultsFiltrados)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Adicionar todos ao Radar CRM
                  </Button>
                </div>
              )}

              <div className="space-y-2.5">
                {linkedInResultsFiltrados.map((p) => {
                  const done = imported.has(p.id);
                  return (
                    <ProspectItemCard
                      key={p.id}
                      id={p.id}
                      nome={p.nome}
                      segmento={p.segmento || segmento}
                      cidade={p.cidade || cidade}
                      estado={p.estado}
                      telefone={p.telefone}
                      whatsapp={p.whatsapp}
                      email={p.email}
                      site={p.site}
                      linkedin={p.linkedin}
                      detalhesExtras={p.detalhesExtras}
                      isImported={done}
                      onImport={() => importarUnified(p)}
                      onExclude={() =>
                        handleExcluirResultado({
                          nome: p.nome,
                          cidade: p.cidade || cidade,
                          estado: p.estado,
                          segmento: p.segmento || segmento,
                          site: p.site,
                          telefone: p.telefone,
                          origem: "linkedin",
                        })
                      }
                      onOpenWhatsApp={handleOpenWhatsApp}
                      onOpenInstagramDm={handleOpenInstagramDm}
                      onOpenLinkedIn={handleOpenLinkedIn}
                    />
                  );
                })}
                {!linkedInLoading && linkedInResults.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border/60 rounded-md">
                    Selecione o cargo e a localização e clique em "Buscar Decisores".
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------------- */}
        {/* ABA: TIKTOK DISCOVERY */}
        {/* ------------------------------------------------------------------- */}
        <TabsContent value="tiktok" className="space-y-4 mt-0">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AtSign className="h-4 w-4 text-foreground" />
                Descoberta de Marcas e Perfis no TikTok
                <Badge variant="secondary" className="ml-1 text-[10px] font-normal">
                  Redes Sociais
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Localize perfis comerciais, marcas emergentes e influenciadores corporativos por nicho e região.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderSharedFilters()}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Palavras-chave de busca no TikTok (ex: loja de roupas, estética, café gourmet)..."
                    value={tikTokTermoLivre}
                    onChange={(e) => setTikTokTermoLivre(e.target.value)}
                    className="pl-8 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") buscarTikTok();
                    }}
                  />
                </div>
                <Button onClick={buscarTikTok} disabled={tikTokLoading}>
                  {tikTokLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Rastreando TikTok...
                    </>
                  ) : (
                    <>
                      <Search className="h-3.5 w-3.5 mr-1.5" />
                      Buscar no TikTok
                    </>
                  )}
                </Button>
              </div>

              {tikTokResultsFiltrados.length > 0 && (
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-muted-foreground">
                    Exibindo <strong>{tikTokResultsFiltrados.length}</strong> marca(s) encontrada(s)
                  </div>
                  <Button size="sm" variant="outline" onClick={() => importarTodasUnified(tikTokResultsFiltrados)}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Adicionar todas ao Radar CRM
                  </Button>
                </div>
              )}

              <div className="space-y-2.5">
                {tikTokResultsFiltrados.map((p) => {
                  const done = imported.has(p.id);
                  return (
                    <ProspectItemCard
                      key={p.id}
                      id={p.id}
                      nome={p.nome}
                      segmento={p.segmento || segmento}
                      cidade={p.cidade || cidade}
                      estado={p.estado}
                      telefone={p.telefone}
                      whatsapp={p.whatsapp}
                      site={p.site}
                      detalhesExtras={p.detalhesExtras}
                      isImported={done}
                      onImport={() => importarUnified(p)}
                      onExclude={() =>
                        handleExcluirResultado({
                          nome: p.nome,
                          cidade: p.cidade || cidade,
                          estado: p.estado,
                          segmento: p.segmento || segmento,
                          site: p.site,
                          telefone: p.telefone,
                          origem: "tiktok",
                        })
                      }
                      onOpenWhatsApp={handleOpenWhatsApp}
                      onOpenInstagramDm={handleOpenInstagramDm}
                      onOpenLinkedIn={handleOpenLinkedIn}
                    />
                  );
                })}
                {!tikTokLoading && tikTokResults.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border/60 rounded-md">
                    Selecione a localização ou informe termos de nicho e clique em "Buscar no TikTok".
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------------- */}
        {/* ABA: FACEBOOK PÁGINAS COMERCIAIS */}
        {/* ------------------------------------------------------------------- */}
        <TabsContent value="facebook" className="space-y-4 mt-0">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Facebook className="h-4 w-4 text-blue-600" />
                Páginas Comerciais no Facebook
                <Badge variant="secondary" className="ml-1 text-[10px] font-normal">
                  Rede Social & Negócios
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Encontre empresas, páginas locais e comércios com perfis ativos no ecossistema Facebook.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderSharedFilters()}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Termos específicos para páginas no Facebook (ex: imobiliária, clínica médica, oficina)..."
                    value={facebookTermoLivre}
                    onChange={(e) => setFacebookTermoLivre(e.target.value)}
                    className="pl-8 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") buscarFacebook();
                    }}
                  />
                </div>
                <Button onClick={buscarFacebook} disabled={facebookLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {facebookLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Buscando Páginas...
                    </>
                  ) : (
                    <>
                      <Search className="h-3.5 w-3.5 mr-1.5" />
                      Buscar no Facebook
                    </>
                  )}
                </Button>
              </div>

              {facebookResultsFiltrados.length > 0 && (
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-muted-foreground">
                    Exibindo <strong>{facebookResultsFiltrados.length}</strong> página(s) comercial(is)
                  </div>
                  <Button size="sm" variant="outline" onClick={() => importarTodasUnified(facebookResultsFiltrados)}>
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Adicionar todas ao Radar CRM
                  </Button>
                </div>
              )}

              <div className="space-y-2.5">
                {facebookResultsFiltrados.map((p) => {
                  const done = imported.has(p.id);
                  return (
                    <ProspectItemCard
                      key={p.id}
                      id={p.id}
                      nome={p.nome}
                      segmento={p.segmento || segmento}
                      cidade={p.cidade || cidade}
                      estado={p.estado}
                      telefone={p.telefone}
                      whatsapp={p.whatsapp}
                      site={p.site}
                      detalhesExtras={p.detalhesExtras}
                      isImported={done}
                      onImport={() => importarUnified(p)}
                      onExclude={() =>
                        handleExcluirResultado({
                          nome: p.nome,
                          cidade: p.cidade || cidade,
                          estado: p.estado,
                          segmento: p.segmento || segmento,
                          site: p.site,
                          telefone: p.telefone,
                          origem: "facebook",
                        })
                      }
                      onOpenWhatsApp={handleOpenWhatsApp}
                      onOpenInstagramDm={handleOpenInstagramDm}
                      onOpenLinkedIn={handleOpenLinkedIn}
                    />
                  );
                })}
                {!facebookLoading && facebookResults.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border/60 rounded-md">
                    Selecione a cidade acima e clique em "Buscar no Facebook".
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------------- */}
        {/* ABA: ECONODATA & SPEEDIO (CNAE, PORTE & FATURAMENTO) */}
        {/* ------------------------------------------------------------------- */}
        <TabsContent value="econodata" className="space-y-4 mt-0">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-indigo-500" />
                Inteligência B2B Econodata & Speedio
                <Badge variant="secondary" className="ml-1 text-[10px] font-normal">
                  CNAE & Faturamento
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Filtre empresas ativas por ramo de atividade oficial (CNAE), porte corporativo (MEI, Micro, Pequeno, Médio/Grande) e faturamento estimado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {renderSharedFilters()}

              <div className="grid md:grid-cols-[1fr_160px_160px_auto] gap-2 pt-1 items-end">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">CNAE (Código ou Descrição)</label>
                  <Input
                    value={econodataCnae}
                    onChange={(e) => setEconodataCnae(e.target.value)}
                    placeholder="ex: 6201-5/01, Tecnologia, Construção..."
                    className="text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Porte da Empresa</label>
                  <Select
                    value={econodataPorte}
                    onValueChange={(v) => setEconodataPorte(v as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Portes</SelectItem>
                      <SelectItem value="mei">MEI</SelectItem>
                      <SelectItem value="micro">Microempresa (ME)</SelectItem>
                      <SelectItem value="pequeno">Empresa Pequeno Porte (EPP)</SelectItem>
                      <SelectItem value="medio_grande">Médio e Grande Porte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Faturamento Estimado</label>
                  <Input
                    value={econodataFaturamento}
                    onChange={(e) => setEconodataFaturamento(e.target.value)}
                    placeholder="ex: > 1M, 360k-4.8M..."
                    className="text-xs"
                  />
                </div>
                <div>
                  <Button onClick={buscarEconodata} disabled={econodataLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    {econodataLoading ? (
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 mr-1.5" />
                    )}
                    Buscar Base B2B
                  </Button>
                </div>
              </div>

              {econodataResults.length > 0 && (
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-muted-foreground">
                    Exibindo <strong>{econodataResultsFiltrados.length}</strong> de {econodataResults.length} empresa(s)
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => importarTodasUnified(econodataResultsFiltrados)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Adicionar todas ao Radar CRM
                  </Button>
                </div>
              )}

              <div className="space-y-2.5">
                {econodataResultsFiltrados.map((p) => {
                  const done = imported.has(p.id);
                  return (
                    <ProspectItemCard
                      key={p.id}
                      id={p.id}
                      nome={p.nome}
                      razaoSocial={p.razaoSocial}
                      cnpj={p.cnpj}
                      segmento={p.segmento || segmento}
                      cidade={p.cidade || cidade}
                      estado={p.estado}
                      endereco={p.endereco}
                      telefone={p.telefone}
                      whatsapp={p.whatsapp}
                      email={p.email}
                      site={p.site}
                      detalhesExtras={p.detalhesExtras}
                      isImported={done}
                      onImport={() => importarUnified(p)}
                      onExclude={() =>
                        handleExcluirResultado({
                          nome: p.nome,
                          razaoSocial: p.razaoSocial,
                          cnpj: p.cnpj,
                          cidade: p.cidade || cidade,
                          estado: p.estado,
                          segmento: p.segmento || segmento,
                          site: p.site,
                          telefone: p.telefone,
                          origem: "econodata",
                        })
                      }
                      onOpenWhatsApp={handleOpenWhatsApp}
                      onOpenInstagramDm={handleOpenInstagramDm}
                      onOpenLinkedIn={handleOpenLinkedIn}
                    />
                  );
                })}
                {!econodataLoading && econodataResults.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border/60 rounded-md">
                    Defina a cidade e os filtros de CNAE ou Porte e clique em "Buscar Base B2B".
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
                      onExclude={() =>
                        handleExcluirResultado({
                          nome: p.nome,
                          razaoSocial: p.razaoSocial,
                          cnpj: p.cnpj,
                          cidade: p.cidade || cidade,
                          estado: p.estado || (estado ? nomeEstado(pais, estado) : undefined),
                          segmento: p.segmento || segmento,
                          site: p.site,
                          telefone: p.telefone || p.whatsapp,
                          origem: "brasilapi",
                        })
                      }
                      onOpenWhatsApp={handleOpenWhatsApp}
                      onOpenInstagramDm={handleOpenInstagramDm}
                      onOpenLinkedIn={handleOpenLinkedIn}
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
        {/* ABA: REGISTRO.BR (WHOIS & AUDITORIA DE EXPIRAÇÃO DE DOMÍNIOS) */}
        {/* ------------------------------------------------------------------- */}
        <TabsContent value="registrobr" className="space-y-4 mt-0">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-orange-500" />
                Registro.br — Diretório Whois & Auditoria de Domínios
                <Badge variant="secondary" className="ml-1 text-[10px] font-normal bg-orange-500/10 text-orange-600 dark:text-orange-400">
                  RDAP Oficial .BR
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Verifique status de registro, datas de expiração e contatos técnicos de domínios <code>.br</code> para identificar oportunidades de abordagem (domínios expirando, com problemas de renovação ou disponíveis).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Informe o domínio (ex: minhamarca.com.br, advogados.com.br)..."
                    value={registroBrDominio}
                    onChange={(e) => setRegistroBrDominio(e.target.value)}
                    className="pl-8 text-xs font-mono"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") consultarRegistroBr();
                    }}
                  />
                </div>
                <Button onClick={consultarRegistroBr} disabled={registroBrLoading} className="bg-orange-600 hover:bg-orange-700 text-white">
                  {registroBrLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Consultando Whois...
                    </>
                  ) : (
                    <>
                      <Search className="h-3.5 w-3.5 mr-1.5" />
                      Consultar Whois / RDAP
                    </>
                  )}
                </Button>
              </div>

              {registroBrResults.length > 0 && (
                <div className="space-y-2.5 pt-2">
                  {registroBrResults.map((p) => {
                    const done = imported.has(p.id);
                    return (
                      <ProspectItemCard
                        key={p.id}
                        id={p.id}
                        nome={p.nome}
                        razaoSocial={p.razaoSocial}
                        cnpj={p.cnpj}
                        segmento={p.segmento || "Domínio Web / Registro.br"}
                        cidade={p.cidade || cidade}
                        estado={p.estado}
                        site={p.site}
                        detalhesExtras={p.detalhesExtras}
                        isImported={done}
                        onImport={() => importarUnified(p)}
                        onExclude={() =>
                          handleExcluirResultado({
                            nome: p.nome,
                            razaoSocial: p.razaoSocial,
                            cnpj: p.cnpj,
                            site: p.site,
                            cidade: p.cidade || cidade,
                            origem: "registrobr",
                          })
                        }
                        onOpenWhatsApp={handleOpenWhatsApp}
                        onOpenInstagramDm={handleOpenInstagramDm}
                        onOpenLinkedIn={handleOpenLinkedIn}
                      />
                    );
                  })}
                </div>
              )}

              {!registroBrLoading && registroBrResults.length === 0 && (
                <div className="text-center py-10 px-4 border border-dashed border-border/60 rounded-lg space-y-2">
                  <Globe className="h-8 w-8 mx-auto text-orange-500/60" />
                  <div className="text-sm font-semibold text-foreground">
                    Consulte um domínio nacional (.br)
                  </div>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Digite um domínio nacional acima para checar o status no Registro.br, identificar se está expirado, em processo de liberação ou se os dados de titularidade estão ativos.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------------- */}
        {/* ABA 6: CSV, MANUAL & ENRIQUECIMENTO */}
        {/* ------------------------------------------------------------------- */}
        <TabsContent value="outros" className="space-y-4 mt-0">
          {/* Lookup por Endereço ou Link do Google Maps */}
          <Card className="border-border/60 bg-card shadow-sm border-l-4 border-l-emerald-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-500" />
                  Buscar Dados da Empresa via Endereço ou Link do Google Maps
                  <Badge variant="secondary" className="text-[10px] font-normal bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    Google Maps & SerpApi
                  </Badge>
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Cole a URL compartilhada do Google Maps (ex: <code>https://maps.app.goo.gl/...</code> ou <code>google.com/maps/place/...</code>) ou digite o endereço comercial/nome da empresa para extrair telefone, site, categoria, endereço completo e avaliação.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-[1fr_auto] gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={mapsInput}
                    onChange={(e) => setMapsInput(e.target.value)}
                    placeholder="Cole o link do Google Maps ou digite: ex. Av. Osvaldo Aranha 1075, Bento Gonçalves RS"
                    className="pl-9 text-xs sm:text-sm"
                    onKeyDown={(e) => e.key === "Enter" && !mapsLoading && buscarMaps()}
                  />
                </div>
                <Button
                  onClick={() => buscarMaps()}
                  disabled={mapsLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {mapsLoading ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-1.5" />
                  )}
                  Buscar no Google Maps
                </Button>
              </div>

              {/* Sugestões rápidas de teste */}
              <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground">Exemplos rápidos:</span>
                <button
                  type="button"
                  onClick={() => buscarMaps("Av. Osvaldo Aranha, 1075, Bento Gonçalves - RS")}
                  className="px-2 py-0.5 rounded-md bg-muted hover:bg-muted/80 border border-border/60 text-foreground transition-colors"
                >
                  Av. Osvaldo Aranha 1075 (Bento Gonçalves)
                </button>
                <button
                  type="button"
                  onClick={() => buscarMaps("Vinícola Aurora, Bento Gonçalves RS")}
                  className="px-2 py-0.5 rounded-md bg-muted hover:bg-muted/80 border border-border/60 text-foreground transition-colors"
                >
                  Vinícola Aurora (RS)
                </button>
                <button
                  type="button"
                  onClick={() => buscarMaps("Rua Buarque de Macedo, 200, Garibaldi - RS")}
                  className="px-2 py-0.5 rounded-md bg-muted hover:bg-muted/80 border border-border/60 text-foreground transition-colors"
                >
                  Rua Buarque de Macedo (Garibaldi)
                </button>
              </div>

              {/* Resultado da Busca no Google Maps */}
              {mapsResult && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-base text-foreground">{mapsResult.nome}</span>
                        <Badge
                          variant="outline"
                          className="text-[11px] border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        >
                          {mapsResult.segmento}
                        </Badge>
                        {mapsResult.rating && (
                          <Badge variant="secondary" className="text-[11px] flex items-center gap-1">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            {mapsResult.rating} ({mapsResult.totalRatings || 0} avaliações)
                          </Badge>
                        )}
                        {mapsResult.statusFuncionamento && (
                          <Badge variant="outline" className="text-[10px]">
                            {mapsResult.statusFuncionamento}
                          </Badge>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                        <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>{mapsResult.endereco}</span>
                        {mapsResult.cidade && mapsResult.cidade !== "—" && (
                          <span className="font-medium text-foreground">
                            ({mapsResult.cidade}
                            {mapsResult.estado ? ` - ${mapsResult.estado}` : ""})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={aplicarMapsNoFormulario}
                        className="text-xs border-emerald-500/30 hover:bg-emerald-500/10"
                      >
                        <Copy className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                        Preencher Cadastro Manual
                      </Button>
                      <Button
                        size="sm"
                        onClick={importarMapsDireto}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Adicionar Direto ao Radar
                      </Button>
                    </div>
                  </div>

                  {/* Grid de Detalhes Coletados */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t border-border/50 text-xs">
                    {mapsResult.telefone && (
                      <div className="flex items-center gap-2 p-2 rounded bg-background/60 border border-border/40">
                        <Phone className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <div className="truncate">
                          <span className="text-[10px] text-muted-foreground block">Telefone / Fone</span>
                          <span className="font-medium select-all">{mapsResult.telefone}</span>
                        </div>
                      </div>
                    )}
                    {mapsResult.whatsapp && (
                      <div className="flex items-center gap-2 p-2 rounded bg-background/60 border border-border/40">
                        <MessageCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <div className="truncate">
                          <span className="text-[10px] text-muted-foreground block">WhatsApp</span>
                          <span className="font-medium select-all">{mapsResult.whatsapp}</span>
                        </div>
                      </div>
                    )}
                    {mapsResult.site && (
                      <div className="flex items-center gap-2 p-2 rounded bg-background/60 border border-border/40">
                        <Globe className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <div className="truncate">
                          <span className="text-[10px] text-muted-foreground block">Website</span>
                          <a
                            href={mapsResult.site.startsWith("http") ? mapsResult.site : `https://${mapsResult.site}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-primary hover:underline truncate block"
                          >
                            {mapsResult.site.replace(/^https?:\/\//i, "").replace(/\/$/, "")}
                          </a>
                        </div>
                      </div>
                    )}
                    {mapsResult.googleMapsUrl && (
                      <div className="flex items-center gap-2 p-2 rounded bg-background/60 border border-border/40">
                        <Navigation className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                        <div className="truncate">
                          <span className="text-[10px] text-muted-foreground block">Google Maps</span>
                          <a
                            href={mapsResult.googleMapsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-emerald-600 hover:underline flex items-center gap-1"
                          >
                            Abrir no Maps
                            <ExternalLink className="h-3 w-3 inline" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

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


        {/* ------------------------------------------------------------------- */}
        {/* ABA 7: RESULTADOS EXCLUÍDOS / BLACKLIST */}
        {/* ------------------------------------------------------------------- */}
        <TabsContent value="excluidos" className="space-y-4 mt-0">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Ban className="h-4 w-4 text-rose-500" />
                    Empresas e Resultados Excluídos
                    <Badge variant="secondary" className="ml-1 text-[10px] font-normal bg-rose-500/15 text-rose-600 dark:text-rose-400">
                      {empresasExcluidas.length} {empresasExcluidas.length === 1 ? "registro" : "registros"}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Estes estabelecimentos foram bloqueados e <strong>nunca mais serão exibidos</strong> nos retornos de busca de nenhuma API (Google Places, SerpApi, Apollo, OSM ou BrasilAPI).
                  </CardDescription>
                </div>

                {empresasExcluidas.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={exportarExcluidos}
                      className="text-xs h-8"
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Exportar Lista
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (window.confirm("Deseja realmente limpar toda a lista de excluídos? Todas as empresas voltarão a aparecer nas buscas das APIs.")) {
                          limparExcluidos();
                          toast.success("Lista de excluídos foi limpa com sucesso.");
                        }
                      }}
                      className="text-xs h-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1 text-rose-500" />
                      Limpar Todos
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {empresasExcluidas.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Pesquisar por nome, CNPJ, cidade ou segmento na lista de excluídos..."
                      value={buscaExcluidos}
                      onChange={(e) => setBuscaExcluidos(e.target.value)}
                      className="pl-8 text-xs"
                    />
                  </div>
                </div>
              )}

              {empresasExcluidas.length > 0 ? (
                <div className="space-y-2.5">
                  {excluidosFiltrados.map((ex) => (
                    <div
                      key={ex.id}
                      className="rounded-lg border border-border/60 p-3.5 flex flex-col md:flex-row md:items-start justify-between gap-3.5 bg-card/60 hover:bg-card hover:border-border transition-all"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground line-through opacity-85">
                            {ex.nome}
                          </span>

                          {ex.segmento && (
                            <Badge variant="outline" className="text-[10px] font-normal">
                              {ex.segmento}
                            </Badge>
                          )}

                          {ex.cnpj && (
                            <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                              CNPJ: {ex.cnpj}
                            </Badge>
                          )}

                          {ex.origem && (
                            <Badge variant="secondary" className="text-[10px] font-normal opacity-80">
                              Origem: {ex.origem}
                            </Badge>
                          )}

                          <Badge
                            variant="outline"
                            className="text-[10px] font-normal bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 flex items-center gap-1"
                          >
                            <Ban className="h-2.5 w-2.5" />
                            Excluído em {new Date(ex.excluidoEm).toLocaleDateString("pt-BR")}
                          </Badge>
                        </div>

                        {ex.razaoSocial && ex.razaoSocial.trim().toLowerCase() !== ex.nome.trim().toLowerCase() && (
                          <div className="text-xs text-muted-foreground font-mono">
                            Razão Social: <span className="text-foreground/80">{ex.razaoSocial}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground pt-0.5">
                          {(ex.cidade || ex.estado) && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-primary" />
                              {[ex.cidade, ex.estado].filter(Boolean).join(" - ")}
                            </span>
                          )}

                          {ex.site && (
                            <a
                              href={ex.site.startsWith("http") ? ex.site : `https://${ex.site}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-medium"
                            >
                              <Globe className="h-3 w-3" />
                              <span>{ex.site.replace(/^https?:\/\//i, "").replace(/\/$/, "")}</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          )}

                          {ex.telefone && (
                            <span className="inline-flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {ex.telefone}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            restaurarEmpresaExcluida(ex.id);
                            toast.success(`"${ex.nome}" foi restaurada e voltará a aparecer nas buscas.`);
                          }}
                          className="text-xs h-8 hover:border-primary hover:text-primary"
                          title="Remover da lista de excluídos e permitir que este resultado apareça novamente nas pesquisas"
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1.5 text-primary" />
                          Restaurar / Permitir
                        </Button>
                      </div>
                    </div>
                  ))}

                  {excluidosFiltrados.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border/60 rounded-md">
                      Nenhuma empresa excluída encontrada com o termo "{buscaExcluidos}".
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 px-4 border border-dashed border-border/60 rounded-lg space-y-2">
                  <Ban className="h-8 w-8 mx-auto text-muted-foreground/60" />
                  <div className="text-sm font-semibold text-foreground">
                    Nenhuma empresa excluída
                  </div>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Ao realizar buscas no Google Places, SerpApi, Apollo, OpenStreetMap ou BrasilAPI, você pode clicar no botão <strong>"Excluir"</strong> para bloquear permanentemente qualquer resultado indesejado.
                  </p>
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

      {/* MODAL DE PRIMEIRO CONTATO VIA INSTAGRAM DIRECT (DM COM IA) */}
      <InstagramDmModal
        open={instagramDmModalOpen}
        onOpenChange={setInstagramDmModalOpen}
        perfil={instagramDmPerfil}
      />

      {/* MODAL DE PRIMEIRO CONTATO VIA LINKEDIN (MENSAGEM CONSULTIVA DE ALTO VALOR) */}
      <LinkedInMessageModal
        open={linkedInModalOpen}
        onOpenChange={setLinkedInModalOpen}
        perfil={linkedInPerfil}
      />

      {/* MODAL DE GERENCIAMENTO E STATUS DE APIS */}
      <ApiManagerModal
        open={apiModalOpen}
        onOpenChange={setApiModalOpen}
      />
    </div>
  );
}

