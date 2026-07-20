import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  ScoreBadge,
  SiteBadge,
  InstagramBadge,
  CRM_STAGE_LABEL,
  CRM_STAGES_ORDER,
} from "@/components/badges";
import { calcularScore, classificarScore } from "@/lib/scoring";
import { gerarInsights } from "@/lib/generators";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Globe,
  Instagram,
  Mail,
  Phone,
  MessageCircle,
  MapPin,
  AlertTriangle,
  Lightbulb,
  Target,
  Sparkles,
  Ban,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  siteUrl,
  instagramUrl,
  whatsappUrl,
  telUrl,
  mailUrl,
  googleMapsUrl,
  origemLink,
} from "@/lib/links";

export const Route = createFileRoute("/empresas/$id")({
  component: EmpresaDetalhe,
});

function Row({
  ok,
  label,
  hint,
}: {
  ok: boolean | "na";
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border/40 last:border-0">
      <div className="mt-0.5">
        {ok === true ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ) : ok === false ? (
          <XCircle className="h-4 w-4 text-rose-500" />
        ) : (
          <span className="h-4 w-4 inline-block rounded-full border border-muted" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm">{label}</div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </div>
    </div>
  );
}

function EmpresaDetalhe() {
  const { id } = useParams({ from: "/empresas/$id" });
  const { empresas, weights, setStage, addHistorico, updateEmpresa } = useStore();
  const empresa = empresas.find((e) => e.id === id);
  const [nota, setNota] = useState("");

  const detalhes = useMemo(() => (empresa ? calcularScore(empresa, weights) : null), [empresa, weights]);
  const insights = useMemo(() => (empresa ? gerarInsights(empresa) : null), [empresa]);

  if (!empresa || !detalhes || !insights) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">Empresa não encontrada.</p>
        <Link to="/empresas" className="text-primary text-sm mt-2 inline-block">
          Voltar para empresas
        </Link>
      </div>
    );
  }

  const cls = classificarScore(empresa.score);
  const criteriosAplicados = detalhes.detalhes.filter((d) => d.aplicado);

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 space-y-5 max-w-[1600px]">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/empresas"
            className="grid h-8 w-8 place-items-center rounded-md border border-border/60 hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate">
                {empresa.nome}
              </h1>
              {empresa.naoContatar && (
                <Badge variant="destructive" className="gap-1"><Ban className="h-3 w-3" /> Não contatar</Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
              <span>{empresa.segmento}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{empresa.cidade}{empresa.bairro ? ` · ${empresa.bairro}` : ""}</span>
              <span>Origem: {empresa.origem.replace("_", " ")}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className={`text-xs ${cls.cor} font-medium`}>{cls.label}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Score</div>
          </div>
          <ScoreBadge score={empresa.score} size="lg" />
          <Select value={empresa.crmStage} onValueChange={(v) => { setStage(empresa.id, v as never); toast.success("Etapa atualizada"); }}>
            <SelectTrigger className="w-[190px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CRM_STAGES_ORDER.map((s) => (
                <SelectItem key={s} value={s}>{CRM_STAGE_LABEL[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="visao">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="visao">Visão geral</TabsTrigger>
          <TabsTrigger value="presenca">Presença digital</TabsTrigger>
          <TabsTrigger value="instagram">Instagram</TabsTrigger>
          <TabsTrigger value="atendimento">Atendimento</TabsTrigger>
          <TabsTrigger value="oportunidades">Oportunidades</TabsTrigger>
          <TabsTrigger value="score">Score</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="visao" className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 border-border/60">
            <CardHeader className="pb-2"><CardTitle className="text-base">Resumo executivo</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed">{insights.resumo}</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <InfoLine icon={Phone} label="Telefone" value={empresa.telefone} />
                <InfoLine icon={MessageCircle} label="WhatsApp" value={empresa.whatsapp} accent="emerald" />
                <InfoLine icon={Mail} label="E-mail" value={empresa.email} />
                <InfoLine icon={Globe} label="Site" value={empresa.site} />
                <InfoLine icon={Instagram} label="Instagram" value={empresa.instagram} />
                <InfoLine icon={MapPin} label="Endereço" value={empresa.endereco} />
              </div>
              <Separator />
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Observações internas</div>
                <Textarea
                  value={empresa.observacoes ?? ""}
                  placeholder="Anotações estratégicas sobre esta empresa..."
                  onChange={(e) => updateEmpresa(empresa.id, { observacoes: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />Ação sugerida</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
                {empresa.score >= 70
                  ? "Prioridade alta: preparar abordagem consultiva imediata."
                  : empresa.score >= 45
                    ? "Oportunidade moderada: incluir na próxima leva de contatos."
                    : "Baixa prioridade: reservar para nutrição futura."}
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Etapa no CRM</div>
                <Badge variant="secondary">{CRM_STAGE_LABEL[empresa.crmStage]}</Badge>
              </div>
              {empresa.ultimoContato && (
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Clock className="h-3 w-3" /> Último contato: {format(parseISO(empresa.ultimoContato), "dd MMM yyyy", { locale: ptBR })}
                </div>
              )}
              <Separator />
              <Link
                to={"/abordagem" as never}
                search={{ empresa: empresa.id } as never}
                className="block w-full"
              >
                <Button className="w-full" size="sm">Gerar abordagem comercial</Button>
              </Link>
              <Link
                to={"/prompts" as never}
                search={{ empresa: empresa.id } as never}
                className="block w-full"
              >
                <Button className="w-full" size="sm" variant="outline">Gerar prompts de produção</Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="presenca" className="mt-4">
          <Card className="border-border/60"><CardContent className="p-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="h-4 w-4 text-primary" />
                  <div className="font-semibold text-sm">Site</div>
                  <SiteBadge status={empresa.statusSite} />
                </div>
                <Row ok={empresa.statusSite !== "sem_site"} label="Possui site próprio" />
                <Row ok={empresa.diagnostico.site.responsivo} label="Layout responsivo (mobile)" />
                <Row ok={empresa.diagnostico.site.ssl} label="Conexão segura (HTTPS)" />
                <Row ok={empresa.diagnostico.site.cta} label="CTA claro na página inicial" />
                <Row ok={empresa.diagnostico.site.formulario} label="Formulário de contato" />
                <Row ok={empresa.diagnostico.site.whatsappBtn} label="Botão de WhatsApp integrado" />
                <Row ok={empresa.diagnostico.site.seoBasico} label="SEO básico visível (title, meta)" />
                <Row ok={empresa.diagnostico.site.presencaGoogle} label="Presença no Google Meu Negócio" />
                <Row ok={empresa.diagnostico.site.identidadeConsistente} label="Identidade visual consistente" />
              </div>
              <div>
                <div className="font-semibold text-sm mb-3">Qualidade percebida</div>
                <div className="rounded-lg border border-border/60 p-4 space-y-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Nota geral do site</div>
                    <div className="text-3xl font-bold tabular-nums">
                      {empresa.diagnostico.site.qualidadePercebida}<span className="text-muted-foreground text-lg">/10</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Velocidade percebida</div>
                    <div className="text-sm font-medium capitalize">{empresa.diagnostico.site.velocidade}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Proposta clara?</div>
                    <div className="text-sm font-medium">{empresa.diagnostico.site.cta ? "Sim" : "Não"}</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="instagram" className="mt-4">
          <Card className="border-border/60"><CardContent className="p-5 grid md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Instagram className="h-4 w-4 text-primary" />
                <div className="font-semibold text-sm">Perfil</div>
                <InstagramBadge status={empresa.statusInstagram} />
              </div>
              <Row ok={empresa.statusInstagram !== "sem_perfil"} label="Perfil identificado" hint={empresa.instagram} />
              <Row
                ok={
                  empresa.diagnostico.instagram.diasDesdeUltimoPost !== null &&
                  (empresa.diagnostico.instagram.diasDesdeUltimoPost ?? 0) <= 30
                }
                label="Atividade recente (últimos 30 dias)"
                hint={
                  empresa.diagnostico.instagram.diasDesdeUltimoPost === null
                    ? "Sem perfil"
                    : `Último post há ~${empresa.diagnostico.instagram.diasDesdeUltimoPost} dias`
                }
              />
              <Row ok={empresa.diagnostico.instagram.bioForte} label="Bio com proposta clara" />
              <Row ok={empresa.diagnostico.instagram.consistenciaMarca >= 6} label="Identidade visual consistente" />
            </div>
            <div>
              <div className="font-semibold text-sm mb-3">Indicadores</div>
              <div className="grid grid-cols-2 gap-3">
                <MiniStat label="Frequência" value={empresa.diagnostico.instagram.frequencia} />
                <MiniStat label="Engajamento" value={empresa.diagnostico.instagram.engajamentoAparente} />
                <MiniStat label="Qualidade visual" value={`${empresa.diagnostico.instagram.qualidadeVisual}/10`} />
                <MiniStat label="Consistência" value={`${empresa.diagnostico.instagram.consistenciaMarca}/10`} />
              </div>
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="atendimento" className="mt-4">
          <Card className="border-border/60"><CardContent className="p-5">
            <div className="font-semibold text-sm mb-3">Atendimento e comunicação</div>
            <Row ok={empresa.diagnostico.atendimento.contatoFacil} label="Contato fácil de encontrar" />
            <Row ok={empresa.diagnostico.atendimento.multiplosCanais} label="Múltiplos canais disponíveis" />
            <Row ok={empresa.diagnostico.atendimento.respostaRapida} label="Sinais de resposta rápida" />
            <Row ok={empresa.diagnostico.atendimento.provaSocial} label="Prova social visível (depoimentos, avaliações)" />
            <Row ok={empresa.diagnostico.atendimento.clarezaServicos} label="Clareza sobre serviços/produtos" />
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="oportunidades" className="mt-4 grid md:grid-cols-2 gap-4">
          <Card className="border-border/60">
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" />Falhas identificadas</CardTitle></CardHeader>
            <CardContent><ul className="space-y-2 text-sm">{insights.falhas.map((x, i) => <li key={i} className="flex gap-2"><span className="text-amber-500 mt-0.5">•</span>{x}</li>)}</ul></CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><XCircle className="h-4 w-4 text-rose-500" />Riscos para o negócio</CardTitle></CardHeader>
            <CardContent><ul className="space-y-2 text-sm">{insights.riscos.map((x, i) => <li key={i} className="flex gap-2"><span className="text-rose-500 mt-0.5">•</span>{x}</li>)}</ul></CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Lightbulb className="h-4 w-4 text-primary" />Oportunidades de melhoria</CardTitle></CardHeader>
            <CardContent><ul className="space-y-2 text-sm">{insights.oportunidades.map((x, i) => <li key={i} className="flex gap-2"><span className="text-primary mt-0.5">•</span>{x}</li>)}</ul></CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4 text-emerald-500" />Argumentos consultivos</CardTitle></CardHeader>
            <CardContent><ul className="space-y-2 text-sm">{insights.argumentos.map((x, i) => <li key={i} className="flex gap-2"><span className="text-emerald-500 mt-0.5">•</span>{x}</li>)}</ul></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="score" className="mt-4">
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Composição do score</CardTitle>
              <p className="text-xs text-muted-foreground">Pesos configuráveis em Configurações · Score.</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {detalhes.detalhes.map((d, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 rounded-md border p-3 ${d.aplicado ? "border-rose-500/30 bg-rose-500/5" : "border-border/50 opacity-70"}`}
                  >
                    <div className="mt-0.5">
                      {d.aplicado ? (
                        <XCircle className="h-4 w-4 text-rose-500" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="text-sm font-medium">{d.criterio}</div>
                        <Badge variant="outline" className="text-[10px]">+{d.peso} pts</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{d.explicacao}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                Total aplicado: {criteriosAplicados.reduce((a, b) => a + b.peso, 0)} pts · score final normalizado para 0–100.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico" className="mt-4">
          <Card className="border-border/60">
            <CardHeader className="pb-2"><CardTitle className="text-base">Registrar interação</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Ex.: enviei WhatsApp com diagnóstico curto. Aguardando retorno."
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  disabled={!nota.trim()}
                  onClick={() => {
                    addHistorico(empresa.id, {
                      data: new Date().toISOString(),
                      tipo: "nota",
                      texto: nota.trim(),
                    });
                    updateEmpresa(empresa.id, { ultimoContato: new Date().toISOString() });
                    setNota("");
                    toast.success("Interação registrada");
                  }}
                >
                  Adicionar ao histórico
                </Button>
              </div>
              <Separator />
              <div className="space-y-3">
                {empresa.historico.map((h, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground">
                        {format(parseISO(h.data), "dd MMM yyyy · HH:mm", { locale: ptBR })} · {h.tipo}
                      </div>
                      <div className="text-sm">{h.texto}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InfoLine({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Globe;
  label: string;
  value?: string;
  accent?: "emerald";
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className={`h-4 w-4 mt-0.5 ${accent === "emerald" ? "text-emerald-500" : "text-muted-foreground"}`} />
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-sm truncate">{value || <span className="text-muted-foreground italic">não informado</span>}</div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 p-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-medium capitalize mt-0.5">{value}</div>
    </div>
  );
}
