import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { gerarRelatorioLead, type Pilar, type Relatorio, type DadosSeo } from "@/lib/relatorio.functions";
import { whatsappUrl } from "@/lib/links";
import { FileText, Loader2, Printer, Copy, MessageCircle, Mail } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/relatorio")({
  validateSearch: z.object({ empresa: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Relatório de Diagnóstico para Lead — Radar de Presença Digital" },
      { name: "description", content: "Gere um diagnóstico completo com dados reais de busca para enviar ao lead." },
      { property: "og:title", content: "Relatório de Diagnóstico para Lead" },
      { property: "og:description", content: "Diagnóstico de site, comunicação, redes sociais e branding com dados reais." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RelatorioPage,
});

const OPCOES: { value: Pilar; label: string }[] = [
  { value: "site", label: "Site" },
  { value: "comunicacao", label: "Comunicação" },
  { value: "redes", label: "Redes sociais" },
  { value: "branding", label: "Branding" },
];

function RelatorioPage() {
  const { empresa: empresaId } = useSearch({ from: "/relatorio" });
  const { empresas, addHistorico } = useStore();
  const [sel, setSel] = useState(empresaId ?? empresas[0]?.id ?? "");
  const [pilares, setPilares] = useState<Pilar[]>(["site", "comunicacao", "redes", "branding"]);
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<{ relatorio: Relatorio; seo: DadosSeo; geradoEm: string } | null>(null);
  const gerar = useServerFn(gerarRelatorioLead);
  const empresa = empresas.find((e) => e.id === sel);

  async function onGerar() {
    if (!empresa) return;
    setLoading(true);
    setRes(null);
    try {
      const r = await gerar({
        data: {
          empresa: {
            nome: empresa.nome, segmento: empresa.segmento, cidade: empresa.cidade,
            site: empresa.site, instagram: empresa.instagram, statusSite: empresa.statusSite,
            statusInstagram: empresa.statusInstagram, score: empresa.score, observacoes: empresa.observacoes,
          },
          pilares,
          agencia: "Locomotiva Comunicação",
        },
      });
      setRes(r);
      addHistorico(empresa.id, {
        data: new Date().toISOString(),
        tipo: "nota",
        texto: `Relatório de diagnóstico gerado (${pilares.join(", ")}).`,
      });
      toast.success("Relatório gerado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao gerar relatório");
    } finally {
      setLoading(false);
    }
  }

  const copy = (t: string) => { navigator.clipboard.writeText(t); toast.success("Copiado"); };
  const fone = empresa?.whatsapp || empresa?.telefone;

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <h1 className="text-2xl font-semibold flex items-center gap-2"><FileText className="h-6 w-6" /> Relatório para o lead</h1>
        <p className="text-sm text-muted-foreground">Diagnóstico com dados reais de busca do Google, dores e soluções, pronto para enviar.</p>
      </div>

      <Card className="print:hidden">
        <CardContent className="pt-6 grid gap-4 md:grid-cols-[1fr_auto_auto] items-end">
          <div className="space-y-1">
            <label className="text-sm font-medium">Empresa</label>
            <Select value={sel} onValueChange={setSel}>
              <SelectTrigger><SelectValue placeholder="Escolha uma empresa" /></SelectTrigger>
              <SelectContent>
                {empresas.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome} — {e.cidade}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-4">
            {OPCOES.map((o) => (
              <label key={o.value} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={pilares.includes(o.value)}
                  onCheckedChange={(c) => setPilares((p) => (c ? [...p, o.value] : p.filter((x) => x !== o.value)))}
                />
                {o.label}
              </label>
            ))}
          </div>
          <Button onClick={onGerar} disabled={!empresa || !pilares.length || loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            {loading ? "Gerando…" : "Gerar relatório"}
          </Button>
        </CardContent>
      </Card>

      {!empresas.length && <p className="text-sm text-muted-foreground">Nenhuma empresa cadastrada ainda. Importe empresas primeiro.</p>}

      {res && empresa && (
        <>
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4" /> Imprimir / Salvar PDF</Button>
            <Button variant="outline" onClick={() => copy(res.relatorio.whatsapp)}><Copy className="h-4 w-4" /> Copiar resumo WhatsApp</Button>
            {fone && (
              <Button variant="outline" asChild>
                <a href={`${whatsappUrl(fone)}?text=${encodeURIComponent(res.relatorio.whatsapp)}`} target="_blank" rel="noreferrer"><MessageCircle className="h-4 w-4" /> Enviar no WhatsApp</a>
              </Button>
            )}
            <Button variant="outline" asChild>
              <a href={`mailto:${empresa.email ?? ""}?subject=${encodeURIComponent(res.relatorio.emailAssunto)}&body=${encodeURIComponent(res.relatorio.emailCorpo)}`}>
                <Mail className="h-4 w-4" /> Enviar por e-mail
              </a>
            </Button>
          </div>

          <article className="rounded-lg border bg-card text-card-foreground p-8 space-y-6 print:border-0 print:p-0">
            <header className="border-b pb-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Diagnóstico de presença digital · Locomotiva Comunicação</p>
              <h2 className="text-2xl font-semibold mt-1">{res.relatorio.titulo}</h2>
              <p className="text-sm text-muted-foreground">{empresa.nome} · {empresa.cidade} · {new Date(res.geradoEm).toLocaleDateString("pt-BR")}</p>
            </header>

            <section><h3 className="font-semibold mb-1">Resumo executivo</h3><p className="text-sm leading-relaxed">{res.relatorio.resumoExecutivo}</p></section>
            <section><h3 className="font-semibold mb-1">O seu mercado hoje</h3><p className="text-sm leading-relaxed">{res.relatorio.contextoMercado}</p></section>

            <SeoBloco seo={res.seo} />

            {res.relatorio.secoes.map((s, i) => (
              <section key={i} className="space-y-2 break-inside-avoid">
                <h3 className="text-lg font-semibold">{s.titulo}</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div><p className="text-sm font-medium text-destructive mb-1">Onde a marca está perdendo</p>
                    <ul className="list-disc pl-5 text-sm space-y-1">{s.dores.map((d, j) => <li key={j}>{d}</li>)}</ul></div>
                  <div><p className="text-sm font-medium text-primary mb-1">O que propomos</p>
                    <ul className="list-disc pl-5 text-sm space-y-1">{s.solucao.map((d, j) => <li key={j}>{d}</li>)}</ul></div>
                </div>
                <p className="text-sm rounded-md bg-muted p-3"><strong>Impacto nas vendas:</strong> {s.impactoVendas}</p>
              </section>
            ))}

            <section><h3 className="font-semibold mb-1">Plano de ação</h3>
              <ol className="list-decimal pl-5 text-sm space-y-1">{res.relatorio.planoAcao.map((p, i) => <li key={i}>{p}</li>)}</ol></section>
            <section className="border-t pt-4"><p className="text-sm font-medium">{res.relatorio.proximoPasso}</p></section>
          </article>
        </>
      )}
    </div>
  );
}

function SeoBloco({ seo }: { seo: DadosSeo }) {
  return (
    <Card className="break-inside-avoid">
      <CardHeader><CardTitle className="text-base">O que seus clientes procuram no Google</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        {seo.termos.length > 0 && (
          <div>
            <p className="text-muted-foreground mb-1">Buscas reais sugeridas pelo Google:</p>
            <div className="flex flex-wrap gap-1.5">{seo.termos.map((t) => <span key={t.termo} className="rounded-full bg-muted px-2.5 py-0.5 text-xs">{t.termo}</span>)}</div>
          </div>
        )}
        {seo.presenca && (
          <div>
            <p><strong>Google Maps — “{seo.presenca.consulta}”:</strong>{" "}
              {seo.presenca.posicao ? `sua empresa aparece na posição ${seo.presenca.posicao}.` : "sua empresa não aparece entre os 20 primeiros resultados."}</p>
            <ul className="mt-1 text-xs text-muted-foreground space-y-0.5">
              {seo.presenca.concorrentes.map((c, i) => (
                <li key={i}>{i + 1}. {c.nome} — nota {c.nota ?? "–"} ({c.avaliacoes ?? 0} avaliações) · {c.temSite ? "com site" : "sem site"}</li>
              ))}
            </ul>
          </div>
        )}
        {seo.organico && (
          <p><strong>Google (resultados orgânicos):</strong> {seo.organico.posicao ? `posição ${seo.organico.posicao}` : "não aparece na primeira página"}.</p>
        )}
        {seo.avisos.length > 0 && <p className="text-xs text-muted-foreground print:hidden">{seo.avisos.join(" ")}</p>}
      </CardContent>
    </Card>
  );
}
