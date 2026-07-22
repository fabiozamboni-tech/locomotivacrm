import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, Download, FileDown, MapPin, Search, Plus, ExternalLink, Loader2, UserPlus, Globe, Instagram, Sparkles } from "lucide-react";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { searchPlaces, type PlaceResult } from "@/lib/places.functions";
import { lookupEmpresa, type LookupResult } from "@/lib/lookup.functions";
import { empresaFromRaw } from "@/lib/mock-data";
import { CIDADES_RS_FOCO, SEGMENTOS } from "@/lib/mock-data";

export const Route = createFileRoute("/importar")({
  component: ImportarPage,
});

const CSV_EXAMPLE = `nome,segmento,cidade,telefone,whatsapp,email,site,instagram
Padaria do Vale,Padaria artesanal,Bento Gonçalves,(54) 3055-0011,(54) 99988-7766,,,@padariadovale
Metalúrgica Serrana,Metalurgia,Caxias do Sul,(54) 3221-9999,,contato@metalserrana.ind.br,metalserrana.ind.br,`;

function ImportarPage() {
  const { empresas, addEmpresa } = useStore();
  const [csv, setCsv] = useState(CSV_EXAMPLE);

  const search = useServerFn(searchPlaces);
  const lookup = useServerFn(lookupEmpresa);
  const [segmento, setSegmento] = useState("Restaurantes");
  const [cidade, setCidade] = useState("Bento Gonçalves");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [imported, setImported] = useState<Set<string>>(new Set());

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
    const query = `${segmento} em ${cidade}, RS`.trim();
    setLoading(true);
    try {
      const res = await search({ data: { query } });
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
    for (const p of results) {
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
    setImported(new Set(results.map((r) => r.placeId)));
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
          <div className="grid md:grid-cols-[1fr_1fr_auto] gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Segmento / termo</label>
              <Input
                value={segmento}
                onChange={(e) => setSegmento(e.target.value)}
                placeholder="Ex: vinícolas, pousadas, metalurgia"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Cidade (RS)</label>
              <Input
                list="cidades-rs"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="Ex: Bento Gonçalves"
              />
              <datalist id="cidades-rs">
                {CIDADES_RS_FOCO.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="flex items-end">
              <Button onClick={buscar} disabled={loading} className="w-full md:w-auto">
                {loading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Search className="h-4 w-4 mr-1.5" />}
                Buscar
              </Button>
            </div>
          </div>

          {results.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {results.length} resultado(s) · fonte: Google Places API (New)
              </div>
              <Button size="sm" variant="outline" onClick={importarTodas}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Adicionar todas
              </Button>
            </div>
          )}

          <div className="space-y-2">
            {results.map((p) => {
              const done = imported.has(p.placeId);
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
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            ⚠️ Compliance: dados vindos de fonte pública (Google Places). Antes de qualquer
            abordagem, revise a base legal LGPD aplicável (legítimo interesse comercial B2B) e
            respeite pedidos de "não contatar".
          </p>
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
