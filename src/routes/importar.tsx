import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, Download, FileDown, MapPin, Search, Plus, ExternalLink, Loader2, UserPlus, Globe, Instagram, Sparkles, AtSign, Facebook, Users, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { searchPlaces, type PlaceResult } from "@/lib/places.functions";
import { lookupEmpresa, type LookupResult } from "@/lib/lookup.functions";
import { empresaFromRaw } from "@/lib/mock-data";
import { CIDADES_RS_FOCO, SEGMENTOS } from "@/lib/mock-data";
import { PAISES, REGIOES, estadosDoPais, nomePais, nomeEstado, carregarCidades, type CidadeInfo } from "@/lib/geo";
import { Combobox, TrendIcon, type ComboboxOption } from "@/components/combobox";
import { useEffect, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/importar")({
  component: ImportarPage,
});

/** Formata população: 1.388.794 → "1,39 mi hab." */
function fmtPop(n?: number): string {
  if (!n) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} mi hab.`;
  if (n >= 1_000) return `${(n / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} mil hab.`;
  return `${n.toLocaleString("pt-BR")} hab.`;
}

/** PIB vem em mil R$ (IBGE). */
function fmtPib(milReais?: number): string {
  if (!milReais) return "";
  const reais = milReais * 1000;
  if (reais >= 1e9) return `PIB R$ ${(reais / 1e9).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} bi`;
  if (reais >= 1e6) return `PIB R$ ${(reais / 1e6).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} mi`;
  return `PIB R$ ${reais.toLocaleString("pt-BR")}`;
}

function detalheCidade(c: CidadeInfo): string {
  return [fmtPop(c.populacao), c.setor, fmtPib(c.pib)].filter(Boolean).join(" · ");
}

const FORCA_LABEL = ["economia local fraca", "economia local média", "economia local forte"];

/** Extrai @handle de Instagram/Facebook a partir de uma URL, quando aplicável. */
function socialDoSite(url?: string): { rede: "instagram" | "facebook"; handle: string; url: string } | null {
  if (!url) return null;
  const m = url.match(/(?:https?:\/\/)?(?:www\.)?(instagram|facebook)\.com\/([A-Za-z0-9._-]+)/i);
  if (!m) return null;
  const rede = m[1].toLowerCase() as "instagram" | "facebook";
  const handle = m[2].replace(/\/$/, "");
  if (!handle || ["p", "pages", "profile.php", "reel", "explore"].includes(handle)) return null;
  return { rede, handle, url };
}


const CSV_EXAMPLE = `nome,segmento,cidade,telefone,whatsapp,email,site,instagram
Padaria do Vale,Padaria artesanal,Bento Gonçalves,(54) 3055-0011,(54) 99988-7766,,,@padariadovale
Metalúrgica Serrana,Metalurgia,Caxias do Sul,(54) 3221-9999,,contato@metalserrana.ind.br,metalserrana.ind.br,`;

function ImportarPage() {
  const { empresas, addEmpresa } = useStore();
  const [csv, setCsv] = useState(CSV_EXAMPLE);

  const search = useServerFn(searchPlaces);
  const lookup = useServerFn(lookupEmpresa);
  const [segmento, setSegmento] = useState("Restaurantes");
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
  const [limite, setLimite] = useState("20");
  const [filtroSite, setFiltroSite] = useState<"todos" | "com" | "sem">("todos");

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
  const paisesOptions: ComboboxOption[] = paisesFiltrados.map((p) => ({ value: p.code, label: p.nome }));
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

  const localizacao = [cidade, estado ? nomeEstado(pais, estado) : "", nomePais(pais)]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ");
  const termo = segmento.trim() || "empresas";
  const queryPreview = [termo, localizacao].filter(Boolean).join(" em ");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [imported, setImported] = useState<Set<string>>(new Set());
  const resultsFiltrados = useMemo(
    () =>
      results.filter((p) =>
        filtroSite === "com" ? !!p.site : filtroSite === "sem" ? !p.site : true,
      ),
    [results, filtroSite],
  );


  // Lookup por site / instagram
  const [lookupInput, setLookupInput] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);

  // Cadastro manual
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
  const setF = (k: keyof typeof emptyForm, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

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

  const buscar = async () => {
    const query = queryPreview;
    if (!query) {
      toast.error("Informe ao menos o segmento ou a cidade");
      return;
    }
    setLoading(true);
    try {
      const res = await search({ data: { query, regionCode: pais || "BR", limit: Number(limite) } });
      setResults(res);
      toast.success(`${res.length} resultado(s) do Google Places`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha na busca");
    } finally {
      setLoading(false);
    }
  };

  const importar = (p: PlaceResult) => {
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

  const importarTodas = () => {
    let count = 0;
    for (const p of resultsFiltrados) {
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
    setImported((s) => new Set([...s, ...resultsFiltrados.map((r) => r.placeId)]));

    toast.success(`${count} empresa(s) adicionada(s)`);
  };

  const exportarEmpresas = () => {
    const header = "nome;segmento;cidade;telefone;whatsapp;email;site;instagram;score;statusSite;statusInstagram;etapaCRM";
    const rows = empresas.map((e) =>
      [e.nome, e.segmento, e.cidade, e.telefone ?? "", e.whatsapp ?? "", e.email ?? "", e.site ?? "", e.instagram ?? "", e.score, e.statusSite, e.statusInstagram, e.crmStage]
        .map((c) => String(c).replace(/;/g, ","))
        .join(";"),
    );
    downloadFile("radar-empresas.csv", [header, ...rows].join("\n"), "text/csv");
    toast.success("CSV exportado");
  };

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 space-y-5 max-w-[1200px]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Descobrir, importar e exportar</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Prospecção via Google Places, importação CSV e exportações do pipeline.
        </p>
      </div>

      {/* Google Places */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Descoberta via Google Places
            <Badge variant="secondary" className="ml-2 text-[10px] font-normal">dados reais</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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
            <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
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

          <div className="flex flex-wrap items-end gap-3">
            <Button onClick={buscar} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Search className="h-4 w-4 mr-1.5" />}
              Buscar
            </Button>
            <div>
              <label className="text-xs text-muted-foreground block">Resultados</label>
              <Select value={limite} onValueChange={setLimite}>
                <SelectTrigger className="w-[110px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["20", "30", "40", "50", "100"].map((n) => (
                    <SelectItem key={n} value={n}>{n} empresas</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block">Site</label>
              <Select value={filtroSite} onValueChange={(v) => setFiltroSite(v as typeof filtroSite)}>
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
            <span className="text-xs text-muted-foreground truncate">
              Consulta: <span className="font-mono">{queryPreview || "—"}</span>
            </span>
          </div>

          {results.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {resultsFiltrados.length} de {results.length} resultado(s) · fonte: Google Places API (New)
              </div>
              <Button size="sm" variant="outline" onClick={importarTodas}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Adicionar todas
              </Button>
            </div>
          )}

          <div className="space-y-2">
            {resultsFiltrados.map((p) => {
              const done = imported.has(p.placeId);
              const social = socialDoSite(p.site);
              return (
                <div
                  key={p.placeId}
                  className="rounded-md border border-border/60 p-3 flex flex-col md:flex-row md:items-center gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-medium truncate">{p.nome}</div>
                      {p.segmento && (
                        <Badge variant="outline" className="text-[10px] font-normal">{p.segmento}</Badge>
                      )}
                      {typeof p.rating === "number" && (
                        <Badge variant="secondary" className="text-[10px] font-normal">
                          ★ {p.rating.toFixed(1)} ({p.totalRatings ?? 0})
                        </Badge>
                      )}
                      {p.businessStatus && p.businessStatus !== "OPERATIONAL" && (
                        <Badge variant="destructive" className="text-[10px] font-normal">{p.businessStatus}</Badge>
                      )}
                      {!p.site && (
                        <Badge className="text-[10px] font-normal bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/15">
                          sem site
                        </Badge>
                      )}
                      {social && (
                        <a
                          href={social.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-border/60 px-1.5 py-0.5 text-[10px] hover:underline"
                        >
                          {social.rede === "instagram" ? (
                            <Instagram className="h-3 w-3 text-pink-500" />
                          ) : (
                            <Facebook className="h-3 w-3 text-sky-500" />
                          )}
                          <AtSign className="h-2.5 w-2.5" />
                          {social.handle}
                        </a>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{p.endereco}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap mt-0.5">
                      {p.telefone && <span>📞 {p.telefone}</span>}
                      {p.site && (
                        <a href={p.site} target="_blank" rel="noreferrer" className="hover:underline inline-flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" />{p.site.replace(/^https?:\/\//, "")}
                        </a>
                      )}
                      {p.googleMapsUri && (
                        <a href={p.googleMapsUri} target="_blank" rel="noreferrer" className="hover:underline inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />Google Maps
                        </a>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={done ? "secondary" : "default"}
                    disabled={done}
                    onClick={() => importar(p)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    {done ? "Adicionada" : "Adicionar"}
                  </Button>
                </div>
              );
            })}
            {!loading && results.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border/60 rounded-md">
                Escolha segmento + cidade e clique em Buscar para trazer empresas reais do Google.
              </div>
            )}
            {!loading && results.length > 0 && resultsFiltrados.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border/60 rounded-md">
                Nenhum resultado com este filtro de site.
              </div>
            )}
          </div>


          <p className="text-[11px] text-muted-foreground leading-relaxed">
            ⚠️ Compliance: dados vindos de fonte pública (Google Places). Antes de qualquer
            abordagem, revise a base legal LGPD aplicável (legítimo interesse comercial B2B) e
            respeite pedidos de "não contatar".
          </p>
        </CardContent>
      </Card>

      {/* Lookup por site / Instagram */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Buscar empresa a partir de site ou Instagram
            <Badge variant="secondary" className="ml-2 text-[10px] font-normal">IA + Firecrawl</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Cole a URL do site ou o @perfil do Instagram. O sistema lê o conteúdo público
            e extrai automaticamente nome, segmento, cidade, contatos e um resumo do negócio.
          </p>
          <div className="grid md:grid-cols-[1fr_auto] gap-2">
            <Input
              value={lookupInput}
              onChange={(e) => setLookupInput(e.target.value)}
              placeholder="ex.: https://vinicola.com.br  ou  @minhaempresa"
              onKeyDown={(e) => e.key === "Enter" && !lookupLoading && buscarLookup()}
            />
            <Button onClick={buscarLookup} disabled={lookupLoading}>
              {lookupLoading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Search className="h-4 w-4 mr-1.5" />}
              Buscar
            </Button>
          </div>

          {lookupResult && (
            <div className="rounded-md border border-border/60 p-4 space-y-3 bg-muted/30">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="font-medium">{lookupResult.nome}</div>
                    <Badge variant="outline" className="text-[10px] font-normal">{lookupResult.segmento}</Badge>
                    <Badge variant="secondary" className="text-[10px] font-normal inline-flex items-center gap-1">
                      {lookupResult.fonte === "instagram" ? <Instagram className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                      {lookupResult.fonte}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {[lookupResult.cidade, lookupResult.bairro].filter(Boolean).join(" · ") || "—"}
                  </div>
                </div>
                <Button size="sm" onClick={importarLookup}>
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Adicionar ao radar
                </Button>
              </div>

              {lookupResult.resumo && (
                <p className="text-xs leading-relaxed">{lookupResult.resumo}</p>
              )}

              <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-xs">
                {lookupResult.endereco && <div><span className="text-muted-foreground">Endereço:</span> {lookupResult.endereco}</div>}
                {lookupResult.telefone && <div><span className="text-muted-foreground">Telefone:</span> {lookupResult.telefone}</div>}
                {lookupResult.whatsapp && <div><span className="text-muted-foreground">WhatsApp:</span> {lookupResult.whatsapp}</div>}
                {lookupResult.email && <div><span className="text-muted-foreground">E-mail:</span> {lookupResult.email}</div>}
                {lookupResult.site && (
                  <div className="truncate">
                    <span className="text-muted-foreground">Site:</span>{" "}
                    <a href={lookupResult.site} target="_blank" rel="noreferrer" className="hover:underline inline-flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />{lookupResult.site.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
                {lookupResult.instagram && (
                  <div className="truncate">
                    <span className="text-muted-foreground">Instagram:</span>{" "}
                    <a
                      href={/^https?:/i.test(lookupResult.instagram) ? lookupResult.instagram : `https://instagram.com/${lookupResult.instagram.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      {lookupResult.instagram}
                    </a>
                  </div>
                )}
              </div>
              <div className="text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                Fonte: <a href={lookupResult.urlAnalisada} target="_blank" rel="noreferrer" className="hover:underline">{lookupResult.urlAnalisada}</a>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cadastro manual */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            Cadastro manual de empresa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Adicione uma empresa preenchendo o formulário. Ideal para indicações, contatos de
            eventos ou empresas que você já conhece.
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            <Field label="Nome da empresa *" value={form.nome} onChange={(v) => setF("nome", v)} placeholder="Ex.: Vinícola Val de Serra" />
            <Field label="Segmento" value={form.segmento} onChange={(v) => setF("segmento", v)} placeholder="Ex.: Vinícola" list="segmentos-list" />
            <datalist id="segmentos-list">
              {SEGMENTOS.map((s) => <option key={s} value={s} />)}
            </datalist>
            <Field label="Cidade *" value={form.cidade} onChange={(v) => setF("cidade", v)} placeholder="Ex.: Bento Gonçalves" list="cidades-rs-manual" />
            <datalist id="cidades-rs-manual">
              {CIDADES_RS_FOCO.map((c) => <option key={c} value={c} />)}
            </datalist>
            <Field label="Bairro" value={form.bairro} onChange={(v) => setF("bairro", v)} />
            <Field label="Endereço" value={form.endereco} onChange={(v) => setF("endereco", v)} placeholder="Rua, número · cidade/RS" />
            <Field label="Telefone" value={form.telefone} onChange={(v) => setF("telefone", v)} placeholder="(54) 3000-0000" />
            <Field label="WhatsApp" value={form.whatsapp} onChange={(v) => setF("whatsapp", v)} placeholder="(54) 99000-0000" />
            <Field label="E-mail" value={form.email} onChange={(v) => setF("email", v)} placeholder="contato@empresa.com.br" />
            <Field label="Site" value={form.site} onChange={(v) => setF("site", v)} placeholder="empresa.com.br" />
            <Field label="Instagram" value={form.instagram} onChange={(v) => setF("instagram", v)} placeholder="@empresa" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Observações internas</label>
            <Textarea
              rows={3}
              value={form.observacoes}
              onChange={(e) => setF("observacoes", e.target.value)}
              placeholder="Origem da indicação, contexto, decisor conhecido..."
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={salvarManual}>
              <Plus className="h-4 w-4 mr-1.5" />
              Adicionar empresa
            </Button>
            <Button variant="ghost" onClick={() => setForm(emptyForm)}>
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>


      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Upload className="h-4 w-4 text-primary" />Importar CSV</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Cole abaixo um CSV com as colunas: nome, segmento, cidade, telefone, whatsapp, email, site, instagram.
            </p>
            <Textarea rows={8} value={csv} onChange={(e) => setCsv(e.target.value)} className="font-mono text-xs" />
            <Button
              onClick={() => {
                const [head, ...rest] = csv.trim().split(/\r?\n/);
                if (!head?.toLowerCase().includes("nome"))
                  return toast.error("Cabeçalho inválido");
                toast.success(`${rest.length} linha(s) validada(s). Importação simulada.`);
              }}
            >
              Validar e importar
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Download className="h-4 w-4 text-primary" />Exportações</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <ExportRow title="Empresas (CSV completo)" desc="Base atual com score e etapa CRM" onClick={exportarEmpresas} />
            <ExportRow
              title="Diagnóstico (PDF simulado)"
              desc="Relatório por empresa"
              onClick={() => {
                downloadFile("diagnostico-simulado.txt", "Diagnóstico simulado — implementar geração de PDF.", "text/plain");
                toast.success("Arquivo gerado (mock)");
              }}
            />
            <ExportRow
              title="Abordagens geradas"
              desc="Exporta últimas mensagens produzidas"
              onClick={() => {
                downloadFile("abordagens.txt", "Abordagens simuladas — módulo pronto para produção.", "text/plain");
                toast.success("Arquivo gerado (mock)");
              }}
            />
            <ExportRow
              title="Prompts de IA"
              desc="Briefings de site, redesign e Instagram"
              onClick={() => {
                downloadFile("prompts.txt", "Prompts simulados — implementação futura conecta com módulo de prompts.", "text/plain");
                toast.success("Arquivo gerado (mock)");
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ExportRow({ title, desc, onClick }: { title: string; desc: string; onClick: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
      <div className="min-w-0">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Button size="sm" variant="outline" onClick={onClick}><FileDown className="h-3.5 w-3.5 mr-1.5" />Baixar</Button>
    </div>
  );
}

function downloadFile(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  list,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  list?: string;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        list={list}
      />
    </div>
  );
}
