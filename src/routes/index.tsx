import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Globe,
  Instagram,
  PhoneCall,
  Flame,
  TrendingUp,
  MapPin,
  CheckCircle2,
  MessageCircle,
} from "lucide-react";
import { ScoreBadge, SiteBadge, InstagramBadge } from "@/components/badges";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { classificarScore } from "@/lib/scoring";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
  accent = "primary",
}: {
  icon: typeof Building2;
  label: string;
  value: number | string;
  hint?: string;
  accent?: "primary" | "rose" | "amber" | "emerald" | "sky";
}) {
  const accentMap = {
    primary: "text-primary bg-primary/10",
    rose: "text-rose-500 bg-rose-500/10",
    amber: "text-amber-500 bg-amber-500/10",
    emerald: "text-emerald-500 bg-emerald-500/10",
    sky: "text-sky-500 bg-sky-500/10",
  } as const;
  return (
    <Card className="border-border/60">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">
              {label}
            </p>
            <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
            {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
          </div>
          <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${accentMap[accent]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardPage() {
  const { empresas } = useStore();

  const semSite = empresas.filter((e) => e.statusSite === "sem_site").length;
  const siteDesatualizado = empresas.filter(
    (e) => e.statusSite === "desatualizado" || e.statusSite === "nao_responsivo" || e.statusSite === "sem_ssl",
  ).length;
  const igParado = empresas.filter(
    (e) => e.statusInstagram === "parado" || e.statusInstagram === "sem_perfil",
  ).length;
  const altoPot = empresas.filter((e) => e.score >= 70).length;
  const contatadas = empresas.filter((e) =>
    ["primeiro_contato", "aguardando_retorno", "em_negociacao", "convertido"].includes(e.crmStage),
  ).length;
  const comRetorno = empresas.filter((e) =>
    ["em_negociacao", "convertido"].includes(e.crmStage),
  ).length;
  const convertidas = empresas.filter((e) => e.crmStage === "convertido").length;

  const porCidade = Object.entries(
    empresas.reduce<Record<string, number>>((acc, e) => {
      acc[e.cidade] = (acc[e.cidade] ?? 0) + (e.score >= 45 ? 1 : 0);
      return acc;
    }, {}),
  )
    .map(([cidade, oportunidades]) => ({ cidade, oportunidades }))
    .sort((a, b) => b.oportunidades - a.oportunidades)
    .slice(0, 8);

  const recentes = [...empresas]
    .filter((e) => e.score >= 45)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 space-y-6 max-w-[1600px]">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
            Radar · Rio Grande do Sul
          </p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1">
            Panorama de oportunidades
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Empresas com baixa maturidade digital identificadas na Serra Gaúcha e região.
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 border-primary/40 text-primary">
          <MapPin className="h-3 w-3" /> Foco: Serra Gaúcha
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Kpi icon={Building2} label="Empresas mapeadas" value={empresas.length} accent="primary" />
        <Kpi icon={Globe} label="Sem site próprio" value={semSite} accent="rose" hint="Oportunidade direta" />
        <Kpi
          icon={Globe}
          label="Site com problemas"
          value={siteDesatualizado}
          accent="amber"
          hint="Desatualizado, sem SSL ou não responsivo"
        />
        <Kpi icon={Instagram} label="Instagram parado" value={igParado} accent="rose" hint=">90 dias sem post" />
        <Kpi icon={Flame} label="Alto potencial" value={altoPot} accent="rose" hint="Score ≥ 70" />
        <Kpi icon={PhoneCall} label="Já contatadas" value={contatadas} accent="sky" />
        <Kpi icon={MessageCircle} label="Com retorno" value={comRetorno} accent="amber" />
        <Kpi icon={CheckCircle2} label="Convertidas" value={convertidas} accent="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-base">Cidades com mais oportunidades</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Empresas com score ≥ 45 por município
              </p>
            </div>
            <Badge variant="secondary" className="text-xs">Top 8</Badge>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={porCidade} layout="vertical" margin={{ left: 16, right: 24 }}>
                <CartesianGrid horizontal={false} strokeOpacity={0.1} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="cidade"
                  type="category"
                  width={130}
                  tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "var(--color-muted)", opacity: 0.3 }}
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="oportunidades" radius={[0, 6, 6, 0]}>
                  {porCidade.map((_, i) => (
                    <Cell key={i} fill="var(--color-primary)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Oportunidades recentes
            </CardTitle>
            <p className="text-xs text-muted-foreground">Maior score, análise recente</p>
          </CardHeader>
          <CardContent className="space-y-2 pt-2">
            {recentes.map((e) => {
              const cls = classificarScore(e.score);
              return (
                <Link
                  key={e.id}
                  to={"/empresas/$id" as never}
                  params={{ id: e.id } as never}
                  className="flex items-center gap-3 rounded-md border border-border/60 p-3 hover:bg-accent/40 transition"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{e.nome}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {e.segmento} · {e.cidade}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <ScoreBadge score={e.score} size="sm" />
                    <div className={`text-[10px] mt-1 ${cls.cor}`}>{cls.label}</div>
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Últimas análises</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground border-b border-border/60">
                  <th className="py-2 pr-3 font-medium">Empresa</th>
                  <th className="py-2 pr-3 font-medium">Cidade</th>
                  <th className="py-2 pr-3 font-medium">Site</th>
                  <th className="py-2 pr-3 font-medium">Instagram</th>
                  <th className="py-2 pr-3 font-medium text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {[...empresas]
                  .sort(
                    (a, b) =>
                      new Date(b.ultimaAnalise).getTime() - new Date(a.ultimaAnalise).getTime(),
                  )
                  .slice(0, 8)
                  .map((e) => (
                    <tr key={e.id} className="border-b border-border/40 last:border-0">
                      <td className="py-2.5 pr-3">
                        <Link
                          to={"/empresas/$id" as never}
                          params={{ id: e.id } as never}
                          className="font-medium hover:text-primary"
                        >
                          {e.nome}
                        </Link>
                        <div className="text-xs text-muted-foreground">{e.segmento}</div>
                      </td>
                      <td className="py-2.5 pr-3 text-muted-foreground">{e.cidade}</td>
                      <td className="py-2.5 pr-3"><SiteBadge status={e.statusSite} /></td>
                      <td className="py-2.5 pr-3"><InstagramBadge status={e.statusInstagram} /></td>
                      <td className="py-2.5 pr-3 text-right"><ScoreBadge score={e.score} /></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
