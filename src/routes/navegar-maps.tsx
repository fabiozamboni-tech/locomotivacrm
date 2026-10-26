import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  MapPin,
  Search,
  Sparkles,
  Maximize2,
  Minimize2,
  Layers,
  Building2,
  Phone,
  Globe,
  ExternalLink,
  Check,
  Loader2,
  Star,
  X,
  Compass,
  MessageCircle,
  Copy,
  ChevronRight,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import {
  buscarEmpresasRegiaoMaps_ServerFn,
  geocodificarLocalizacao_ServerFn,
  CIDADES_RS_COORDENADAS,
  type MapPlaceResult,
} from "@/lib/maps-browser.functions";
import { gerarDadosCadastroIA_ServerFn } from "@/lib/cadastro-ia.functions";
import { empresaFromRaw, type Empresa } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/navegar-maps")({
  component: NavegarMapsPage,
});

const CIDADES_RAPIDAS = [
  "Caxias do Sul",
  "Bento Gonçalves",
  "Farroupilha",
  "Garibaldi",
  "Carlos Barbosa",
  "Flores da Cunha",
  "Gramado",
  "Canela",
  "Porto Alegre",
];

const SEGMENTOS_RAPIDOS = [
  "Todas",
  "Indústrias",
  "Vinícolas",
  "Comércio",
  "Gastronomia",
  "Saúde & Estética",
  "Tecnologia",
  "Serviços",
];

export function NavegarMapsPage() {
  const navigate = useNavigate();
  const { empresas, addEmpresa } = useStore();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersLayerRef = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const isInitialLoadRef = useRef(true);

  const [isMounted, setIsMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapType, setMapType] = useState<"roadmap" | "satellite">("roadmap");

  const [currentCidade, setCurrentCidade] = useState<string>("Caxias do Sul");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [segmentoAtivo, setSegmentoAtivo] = useState<string>("Todas");

  const [centerCoord, setCenterCoord] = useState<{ lat: number; lng: number }>({
    lat: -29.1678,
    lng: -51.1794,
  });
  const [zoomLevel, setZoomLevel] = useState<number>(14);

  const [places, setPlaces] = useState<MapPlaceResult[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<MapPlaceResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasMoved, setHasMoved] = useState<boolean>(false);
  const [analyzingPlaceId, setAnalyzingPlaceId] = useState<string | null>(null);
  const [analysisStep, setAnalysisStep] = useState<string>("");

  // Cria um mapa rápido de IDs e nomes já cadastrados no CRM para atualizar instantaneamente os pins
  const crmEmpresasIds = useMemo(() => new Set(empresas.map((e) => e.id)), [empresas]);
  const crmEmpresasNomes = useMemo(
    () => new Set(empresas.map((e) => e.nome.trim().toLowerCase())),
    [empresas]
  );

  // Efeito de montagem segura no cliente (SSR guard)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Injeta Leaflet CSS dinamicamente
  useEffect(() => {
    if (typeof document === "undefined") return;
    const existing = document.getElementById("leaflet-css");
    if (!existing) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
      link.crossOrigin = "";
      document.head.appendChild(link);
    }
  }, []);

  // Atalho de teclado ESC para sair da tela cheia
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // Função centralizada para carregar empresas da área
  const fetchPlacesInRegion = useCallback(
    async (lat: number, lng: number, zoom: number, queryCustom?: string, segCustom?: string) => {
      try {
        setIsLoading(true);
        setHasMoved(false);

        let boundsObj = undefined;
        if (mapInstanceRef.current) {
          const b = mapInstanceRef.current.getBounds();
          boundsObj = {
            south: b.getSouth(),
            west: b.getWest(),
            north: b.getNorth(),
            east: b.getEast(),
          };
        }

        const effectiveSegmento = (segCustom ?? segmentoAtivo) === "Todas" ? "" : (segCustom ?? segmentoAtivo);
        const effectiveQuery = queryCustom ?? searchTerm;

        const res = await buscarEmpresasRegiaoMaps_ServerFn({
          data: {
            lat,
            lng,
            zoom,
            query: effectiveQuery || undefined,
            segmento: effectiveSegmento || undefined,
            cidade: currentCidade,
            bounds: boundsObj,
          },
        });

        if (res && Array.isArray(res.places)) {
          setPlaces(res.places);
          if (res.places.length === 0) {
            toast.info("Nenhuma empresa encontrada com estes termos nesta área. Tente ampliar o zoom ou alterar o filtro.");
          }
        }
      } catch (err: any) {
        console.error("Erro ao buscar empresas da região:", err);
        toast.error("Falha ao buscar empresas no Google Maps. Tente novamente.");
      } finally {
        setIsLoading(false);
      }
    },
    [searchTerm, segmentoAtivo, currentCidade]
  );

  // Inicializa o mapa com Leaflet
  useEffect(() => {
    if (!isMounted || !mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    let isCancelled = false;

    async function initMap() {
      try {
        const L = (await import("leaflet")).default;
        if (isCancelled || !mapContainerRef.current) return;

        // Corrige caminhos padrão dos ícones do Leaflet
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });

        const initialCoord = CIDADES_RS_COORDENADAS["Caxias do Sul"] || {
          lat: -29.1678,
          lng: -51.1794,
          zoom: 14,
        };

        const map = L.map(mapContainerRef.current, {
          center: [initialCoord.lat, initialCoord.lng],
          zoom: initialCoord.zoom,
          zoomControl: false,
        });

        L.control.zoom({ position: "bottomright" }).addTo(map);

        // Camada do Google Maps Roadmap
        const tileLayer = L.tileLayer(
          "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
          {
            maxZoom: 20,
            attribution: "&copy; Google Maps",
          }
        ).addTo(map);

        tileLayerRef.current = tileLayer;
        markersLayerRef.current = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;

        // Ouvinte de movimentação do mapa
        map.on("moveend", () => {
          if (isInitialLoadRef.current) {
            isInitialLoadRef.current = false;
            return;
          }
          const c = map.getCenter();
          setCenterCoord({ lat: c.lat, lng: c.lng });
          setZoomLevel(map.getZoom());
          setHasMoved(true);
        });

        // Carga inicial de empresas em Caxias do Sul
        fetchPlacesInRegion(initialCoord.lat, initialCoord.lng, initialCoord.zoom);
      } catch (err) {
        console.error("Erro ao inicializar Leaflet:", err);
      }
    }

    initMap();

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isMounted, fetchPlacesInRegion]);

  // Alterna camadas de mapa (Roadmap vs Satélite com Ruas)
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const url =
      mapType === "satellite"
        ? "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
        : "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}";
    tileLayerRef.current.setUrl(url);
  }, [mapType]);

  // Atualiza marcadores no mapa sempre que `places` ou `empresas` mudarem
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    let isCancelled = false;

    async function renderMarkers() {
      const L = (await import("leaflet")).default;
      if (isCancelled || !markersLayerRef.current) return;

      markersLayerRef.current.clearLayers();

      for (const place of places) {
        const jaCadastrada =
          place.jaNoCrm ||
          (place.crmId && crmEmpresasIds.has(place.crmId)) ||
          crmEmpresasNomes.has(place.title.trim().toLowerCase());

        const isSelected = selectedPlace?.id === place.id;

        // Ícone HTML personalizado estilo Google Maps
        const iconHtml = jaCadastrada
          ? `
            <div class="relative group cursor-pointer transition-transform duration-200 ${
              isSelected ? "scale-125 z-50" : "hover:scale-110"
            }">
              <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-lg border-2 border-white bg-emerald-600 text-white font-semibold text-[11px] whitespace-nowrap">
                <span class="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                <span>${place.title.slice(0, 18)}${place.title.length > 18 ? "…" : ""}</span>
                <span class="bg-emerald-700/80 px-1 py-0.2 rounded text-[9px] uppercase font-bold tracking-wider">CRM</span>
              </div>
              <div class="w-2 h-2 bg-emerald-600 rotate-45 mx-auto -mt-1 shadow-md border-r-2 border-b-2 border-white"></div>
            </div>
          `
          : `
            <div class="relative group cursor-pointer transition-transform duration-200 ${
              isSelected ? "scale-125 z-50" : "hover:scale-110"
            }">
              <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-lg border-2 border-white bg-blue-600 text-white font-medium text-[11px] whitespace-nowrap hover:bg-blue-700">
                <span>📍</span>
                <span>${place.title.slice(0, 18)}${place.title.length > 18 ? "…" : ""}</span>
                ${
                  place.rating
                    ? `<span class="bg-blue-700/90 px-1 py-0.2 rounded text-[10px] text-amber-300 font-bold">★ ${place.rating.toFixed(1)}</span>`
                    : ""
                }
              </div>
              <div class="w-2 h-2 bg-blue-600 rotate-45 mx-auto -mt-1 shadow-md border-r-2 border-b-2 border-white"></div>
            </div>
          `;

        const customIcon = L.divIcon({
          className: "custom-leaflet-div-icon",
          html: iconHtml,
          iconSize: [120, 32],
          iconAnchor: [60, 32],
        });

        const marker = L.marker([place.latitude, place.longitude], {
          icon: customIcon,
          title: place.title,
        });

        marker.on("click", () => {
          setSelectedPlace(place);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.panTo([place.latitude, place.longitude]);
          }
        });

        markersLayerRef.current.addLayer(marker);
      }
    }

    renderMarkers();

    return () => {
      isCancelled = true;
    };
  }, [places, selectedPlace, crmEmpresasIds, crmEmpresasNomes]);

  // Redimensionamento do mapa em tela cheia
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const timeout = setTimeout(() => {
      mapInstanceRef.current.invalidateSize();
    }, 150);
    return () => clearTimeout(timeout);
  }, [isFullscreen]);

  // Ação de seleção de cidade rápida
  const handleSelectCidade = (cidade: string) => {
    setCurrentCidade(cidade);
    const coord = CIDADES_RS_COORDENADAS[cidade];
    if (coord && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([coord.lat, coord.lng], coord.zoom, { duration: 1.2 });
      setCenterCoord({ lat: coord.lat, lng: coord.lng });
      setZoomLevel(coord.zoom);
      fetchPlacesInRegion(coord.lat, coord.lng, coord.zoom, searchTerm, segmentoAtivo);
    }
  };

  // Ação de busca por texto livre ou endereço
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    try {
      setIsLoading(true);
      // Tenta geocodificar caso pareça ser uma cidade ou endereço
      const geo = await geocodificarLocalizacao_ServerFn({ data: { query: searchTerm } });
      if (geo && mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([geo.lat, geo.lng], geo.zoom, { duration: 1.2 });
        setCenterCoord({ lat: geo.lat, lng: geo.lng });
        setZoomLevel(geo.zoom);
        fetchPlacesInRegion(geo.lat, geo.lng, geo.zoom, searchTerm);
      } else {
        // Se for um termo comercial, busca no centro atual
        fetchPlacesInRegion(centerCoord.lat, centerCoord.lng, zoomLevel, searchTerm);
      }
    } catch {
      fetchPlacesInRegion(centerCoord.lat, centerCoord.lng, zoomLevel, searchTerm);
    }
  };

  // Ação de adicionar empresa com enriquecimento completo por IA
  const handleAdicionarComIA = async (place: MapPlaceResult) => {
    try {
      setAnalyzingPlaceId(place.id);
      setAnalysisStep("Iniciando análise com IA...");

      toast.info(`Analisando "${place.title}" com Inteligência Artificial e Google Places...`, {
        duration: 4000,
      });

      setAnalysisStep("Consultando Google Places e dados cadastrais...");
      const aiResult = await gerarDadosCadastroIA_ServerFn({
        data: {
          nome: place.title,
          cidade: place.cidade,
          segmento: place.category || place.segmentoSugerido,
          site: place.website,
          telefone: place.phone,
          endereco: place.address,
          bairro: place.bairro,
        },
      });

      setAnalysisStep("Formatando ficha estratégica para o CRM...");

      const baseEmpresa = empresaFromRaw({
        nome: place.title,
        segmento: aiResult.segmentoRefinado || place.category || "Comércio & Serviços",
        cidade: place.cidade,
        bairro: aiResult.bairro || place.bairro,
        endereco: aiResult.endereco || place.address,
        telefone: aiResult.telefone || place.phone,
        whatsapp: aiResult.whatsapp || place.phone,
        email: aiResult.email,
        site: aiResult.site || place.website,
        instagram: aiResult.instagram,
        origem: "google_maps",
        externalId: place.placeId,
        observacoes: `Empresa adicionada via "Navegar no Maps". Nota Google: ${place.rating ?? "N/D"}★ (${place.reviews ?? 0} avaliações). Categoria: ${place.category ?? "Geral"}.`,
      });

      const novaEmpresa: Empresa = {
        ...baseEmpresa,
        cnpj: aiResult.cnpj || undefined,
        razaoSocial: aiResult.razaoSocial || undefined,
        areaAtuacao: aiResult.areaAtuacao,
        publicoAlvo: aiResult.publicoAlvo,
        buscasPartida: aiResult.buscasPartida,
        buscaGoogleMaps: aiResult.buscaGoogleMaps,
        termosEncontrados: aiResult.termosEncontrados,
        tags: [
          "Google Maps",
          place.category || "Navegar no Maps",
          ...(place.rating ? [`${place.rating.toFixed(1)}★ Maps`] : []),
        ],
      };

      // Adiciona na store (sincronização automática com Supabase PostgreSQL)
      addEmpresa(novaEmpresa);

      // Atualiza o card selecionado para refletir o status imediatamente
      setSelectedPlace({
        ...place,
        jaNoCrm: true,
        crmId: novaEmpresa.id,
        crmStage: "identificado",
      });

      // Atualiza também na lista de places
      setPlaces((prev) =>
        prev.map((p) =>
          p.id === place.id
            ? { ...p, jaNoCrm: true, crmId: novaEmpresa.id, crmStage: "identificado" }
            : p
        )
      );

      toast.success(`"${place.title}" cadastrada no CRM com sucesso!`, {
        description: `Dados enriquecidos: CNPJ ${aiResult.cnpj || "Identificado"}, WhatsApp ${aiResult.whatsapp || "Registrado"}, Segmento: ${aiResult.segmentoRefinado || "Definido"}.`,
        action: {
          label: "Ver no CRM",
          onClick: () => navigate({ to: "/empresas/$id", params: { id: novaEmpresa.id } }),
        },
      });
    } catch (err: any) {
      console.error("Erro ao enriquecer empresa com IA:", err);
      toast.error("Ocorreu um erro ao enriquecer a empresa com IA. Tente novamente.");
    } finally {
      setAnalyzingPlaceId(null);
      setAnalysisStep("");
    }
  };

  const isSelectedPlaceInCrm =
    selectedPlace &&
    (selectedPlace.jaNoCrm ||
      (selectedPlace.crmId && crmEmpresasIds.has(selectedPlace.crmId)) ||
      crmEmpresasNomes.has(selectedPlace.title.trim().toLowerCase()));

  return (
    <div
      ref={fullscreenContainerRef}
      className={cn(
        "flex flex-col bg-background transition-all duration-300",
        isFullscreen
          ? "fixed inset-0 z-50 h-screen w-screen"
          : "h-[calc(100vh-3.5rem)] w-full overflow-hidden"
      )}
    >
      {/* Barra Superior de Controles e Filtros */}
      <header className="shrink-0 z-20 border-b border-border/70 bg-card/95 backdrop-blur px-4 py-2.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Título e Ícone */}
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-foreground">
                  Navegar no Maps
                </h1>
                <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                  Google Maps Explorer
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                Explore qualquer região do RS e do Brasil e adicione empresas com análise de IA em 1 clique
              </p>
            </div>
          </div>

          {/* Campo de Busca Rápida */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por segmento, empresa ou cidade (ex: Vinícolas em Bento)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9 text-xs bg-muted/40"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <Button type="submit" size="sm" className="h-9 text-xs px-3 gap-1 shrink-0">
              <Search className="h-3.5 w-3.5" />
              Buscar
            </Button>
          </form>

          {/* Controles de Mapa e Tela Inteira */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Alternador de Camada: Roadmap vs Satélite */}
            <div className="flex rounded-md border border-input bg-muted/40 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setMapType("roadmap")}
                className={cn(
                  "px-2.5 py-1 rounded font-medium transition-colors",
                  mapType === "roadmap"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Mapa
              </button>
              <button
                type="button"
                onClick={() => setMapType("satellite")}
                className={cn(
                  "px-2.5 py-1 rounded font-medium transition-colors",
                  mapType === "satellite"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Satélite
              </button>
            </div>

            {/* Botão de Tela Inteira */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? "Sair da Tela Cheia (ESC)" : "Abrir mapa em Tela Inteira"}
              className={cn(
                "h-9 gap-1.5 text-xs",
                isFullscreen && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Sair Tela Cheia</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Tela Inteira</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Linha de Cidades e Segmentos Rápidos */}
        <div className="mt-2.5 pt-2 border-t border-border/50 flex flex-wrap items-center gap-2 text-xs overflow-x-auto pb-0.5 scrollbar-none">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0 mr-1">
            Cidades RS:
          </span>
          {CIDADES_RAPIDAS.map((cidade) => (
            <button
              key={cidade}
              type="button"
              onClick={() => handleSelectCidade(cidade)}
              className={cn(
                "px-2 py-0.5 rounded-full border text-[11px] transition-colors shrink-0",
                currentCidade === cidade
                  ? "bg-primary text-primary-foreground border-primary font-medium"
                  : "bg-muted/30 border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {cidade}
            </button>
          ))}

          <div className="h-3 w-px bg-border mx-1 shrink-0" />

          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0 mr-1">
            Segmentos:
          </span>
          {SEGMENTOS_RAPIDOS.map((seg) => (
            <button
              key={seg}
              type="button"
              onClick={() => {
                setSegmentoAtivo(seg);
                fetchPlacesInRegion(centerCoord.lat, centerCoord.lng, zoomLevel, searchTerm, seg);
              }}
              className={cn(
                "px-2 py-0.5 rounded-full border text-[11px] transition-colors shrink-0",
                segmentoAtivo === seg
                  ? "bg-blue-600 text-white border-blue-600 font-medium"
                  : "bg-muted/30 border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {seg}
            </button>
          ))}
        </div>
      </header>

      {/* Área Principal do Mapa e Painéis Flutuantes */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* Contêiner do Mapa Leaflet */}
        <div ref={mapContainerRef} className="w-full h-full z-0 cursor-grab active:cursor-grabbing" />

        {/* Botão Flutuante Central: "Buscar nesta área" */}
        {hasMoved && !isLoading && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 animate-in fade-in slide-in-from-top-3 duration-200">
            <Button
              type="button"
              size="sm"
              onClick={() => fetchPlacesInRegion(centerCoord.lat, centerCoord.lng, zoomLevel)}
              className="h-9 px-4 rounded-full shadow-xl bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-xs flex items-center gap-2 border-2 border-background"
            >
              <Compass className="h-4 w-4 animate-spin-slow" />
              <span>Buscar empresas nesta área</span>
            </Button>
          </div>
        )}

        {/* Indicador de Carregamento Flutuante */}
        {isLoading && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
            <div className="flex items-center gap-2 bg-card/90 backdrop-blur px-4 py-2 rounded-full shadow-lg border border-border text-xs font-medium text-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Carregando empresas no Google Maps...</span>
            </div>
          </div>
        )}

        {/* Contador Flutuante de Empresas no Canto Inferior Esquerdo */}
        <div className="absolute bottom-6 left-4 z-20 pointer-events-none">
          <div className="bg-card/90 backdrop-blur border border-border/80 shadow-md px-3 py-1.5 rounded-lg text-xs flex items-center gap-3 pointer-events-auto">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span className="text-muted-foreground">
                <strong className="text-foreground">{places.filter((p) => !p.jaNoCrm).length}</strong> novas oportunidades
              </span>
            </div>
            <div className="h-3 w-px bg-border"></div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-muted-foreground">
                <strong className="text-foreground">{places.filter((p) => p.jaNoCrm).length}</strong> no seu CRM
              </span>
            </div>
          </div>
        </div>

        {/* Painel Lateral Estilo Google Maps (Place Sheet) */}
        {selectedPlace && (
          <aside className="absolute top-3 left-3 bottom-3 z-30 w-full max-w-[400px] bg-card/95 backdrop-blur-md rounded-xl shadow-2xl border border-border flex flex-col overflow-hidden animate-in fade-in slide-in-from-left-4 duration-300">
            {/* Cabeçalho do Card */}
            <div className="relative p-5 border-b border-border/70 bg-gradient-to-br from-card to-muted/40">
              <button
                type="button"
                onClick={() => setSelectedPlace(null)}
                aria-label="Fechar detalhes"
                className="absolute top-3 right-3 p-1.5 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-start gap-3 pr-6">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold leading-tight text-foreground">
                    {selectedPlace.title}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedPlace.category || selectedPlace.segmentoSugerido || "Comércio & Serviços"}
                  </p>
                </div>
              </div>

              {/* Avaliação em Estrelas e Status no CRM */}
              <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                {selectedPlace.rating ? (
                  <div className="flex items-center gap-1 text-xs">
                    <div className="flex items-center text-amber-500">
                      <Star className="h-3.5 w-3.5 fill-amber-500" />
                      <span className="font-bold ml-1 text-foreground">
                        {selectedPlace.rating.toFixed(1)}
                      </span>
                    </div>
                    {selectedPlace.reviews && (
                      <span className="text-muted-foreground">
                        ({selectedPlace.reviews} avaliações no Google)
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Empresa local identificada</span>
                )}

                {isSelectedPlaceInCrm ? (
                  <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] gap-1">
                    <Check className="h-3 w-3" /> No CRM
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-500/30 bg-blue-500/10">
                    Nova Oportunidade
                  </Badge>
                )}
              </div>
            </div>

            {/* Corpo dos Dados da Empresa (Endereço, Contato, Links) */}
            <div className="flex-1 p-5 space-y-4 overflow-y-auto text-xs">
              {/* Endereço */}
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold text-foreground block">Endereço:</span>
                  <span className="text-muted-foreground block">{selectedPlace.address}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedPlace.address);
                      toast.success("Endereço copiado para a área de transferência!");
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline mt-1 font-medium"
                  >
                    <Copy className="h-3 w-3" /> Copiar endereço
                  </button>
                </div>
              </div>

              {/* Telefone */}
              {selectedPlace.phone && (
                <div className="flex items-start gap-2.5">
                  <Phone className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-semibold text-foreground block">Telefone:</span>
                    <a
                      href={`tel:${selectedPlace.phone}`}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {selectedPlace.phone}
                    </a>
                  </div>
                </div>
              )}

              {/* Website */}
              {selectedPlace.website && (
                <div className="flex items-start gap-2.5">
                  <Globe className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-semibold text-foreground block">Website:</span>
                    <a
                      href={selectedPlace.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-1 truncate max-w-[280px]"
                    >
                      <span className="truncate">{selectedPlace.website}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </div>
                </div>
              )}

              {/* Botão Oficial do Google Maps */}
              {selectedPlace.googleMapsUri && (
                <div className="pt-1">
                  <a
                    href={selectedPlace.googleMapsUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-input bg-muted/40 hover:bg-muted py-2 text-xs font-medium text-foreground transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Abrir no Google Maps Oficial
                  </a>
                </div>
              )}

              {/* Detalhes de Análise em Andamento */}
              {analyzingPlaceId === selectedPlace.id && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{analysisStep || "Processando análise com IA..."}</span>
                  </div>
                  <div className="space-y-1 text-[11px] text-muted-foreground pl-6">
                    <div>✓ Extraindo dados do Google Places</div>
                    <div>✓ Consultando Receita Federal e CNPJ</div>
                    <div>✓ Mapeando canais de contato e WhatsApp</div>
                    <div>✓ Sintetizando estratégia de abordagem</div>
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé de Ações do Card */}
            <div className="p-4 border-t border-border/70 bg-card/90 flex flex-col gap-2">
              {isSelectedPlaceInCrm ? (
                <Button
                  type="button"
                  onClick={() => {
                    if (selectedPlace.crmId) {
                      navigate({ to: "/empresas/$id", params: { id: selectedPlace.crmId } });
                    } else {
                      navigate({ to: "/empresas" });
                    }
                  }}
                  className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-10"
                >
                  <Check className="h-4 w-4" />
                  Ver Ficha no CRM
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={analyzingPlaceId === selectedPlace.id}
                  onClick={() => handleAdicionarComIA(selectedPlace)}
                  className="w-full gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs h-11 shadow-lg shadow-blue-500/20"
                >
                  {analyzingPlaceId === selectedPlace.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analisando e Cadastrando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-amber-300" />
                      Adicionar à Lista de Empresas (com Análise por IA)
                    </>
                  )}
                </Button>
              )}

              {/* Botão de WhatsApp se houver telefone */}
              {selectedPlace.phone && (
                <a
                  href={`https://wa.me/55${selectedPlace.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Abrir WhatsApp da Empresa
                </a>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
