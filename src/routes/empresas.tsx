import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { CIDADES_RS_FOCO, SEGMENTOS, type Empresa } from "@/lib/mock-data";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScoreBadge, SiteBadge, InstagramBadge } from "@/components/badges";
import { Globe, Instagram, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import {
  siteUrl,
  instagramUrl,
  whatsappUrl,
  telUrl,
  mailUrl,
  googleMapsUrl,
  origemLink,
} from "@/lib/links";

export const Route = createFileRoute("/empresas")({
  component: EmpresasPage,
});

type Filtros = {
  q: string;
  cidade: string;
  segmento: string;
  scoreMin: number;
  soSemSite: boolean;
  soSiteProblema: boolean;
  soIgParado: boolean;
  comTelefone: boolean;
  comWhats: boolean;
  comEmail: boolean;
};

const INITIAL: Filtros = {
  q: "",
  cidade: "todas",
  segmento: "todos",
  scoreMin: 0,
  soSemSite: false,
  soSiteProblema: false,
  soIgParado: false,
  comTelefone: false,
  comWhats: false,
  comEmail: false,
};

function filtrar(list: Empresa[], f: Filtros): Empresa[] {
  return list.filter((e) => {
    if (f.q && !`${e.nome} ${e.segmento} ${e.cidade}`.toLowerCase().includes(f.q.toLowerCase()))
      return false;
    if (f.cidade !== "todas" && e.cidade !== f.cidade) return false;
    if (f.segmento !== "todos" && e.segmento !== f.segmento) return false;
    if (e.score < f.scoreMin) return false;
    if (f.soSemSite && e.statusSite !== "sem_site") return false;
    if (
      f.soSiteProblema &&
      !["desatualizado", "sem_ssl", "nao_responsivo"].includes(e.statusSite)
    )
      return false;
    if (f.soIgParado && !["parado", "sem_perfil"].includes(e.statusInstagram)) return false;
    if (f.comTelefone && !e.telefone) return false;
    if (f.comWhats && !e.whatsapp) return false;
    if (f.comEmail && !e.email) return false;
    return true;
  });
}

function EmpresasPage() {
  const { empresas } = useStore();
  const [f, setF] = useState<Filtros>(INITIAL);
  const filtradas = useMemo(() => filtrar(empresas, f), [empresas, f]);
  const set = <K extends keyof Filtros>(k: K, v: Filtros[K]) => setF((p) => ({ ...p, [k]: v }));

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 space-y-5 max-w-[1600px]">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Empresas identificadas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtradas.length} de {empresas.length} empresas · filtros e priorização por score.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setF(INITIAL)}>
            Limpar filtros
          </Button>
        </div>
      </div>

      <Card className="border-border/60">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Input
              placeholder="Buscar empresa, segmento, cidade…"
              value={f.q}
              onChange={(e) => set("q", e.target.value)}
              className="md:col-span-2"
            />
            <Select value={f.cidade} onValueChange={(v) => set("cidade", v)}>
              <SelectTrigger><SelectValue placeholder="Cidade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as cidades</SelectItem>
                {CIDADES_RS_FOCO.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={f.segmento} onValueChange={(v) => set("segmento", v)}>
              <SelectTrigger><SelectValue placeholder="Segmento" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os segmentos</SelectItem>
                {SEGMENTOS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {[
              ["soSemSite", "Sem site"],
              ["soSiteProblema", "Site com problemas"],
              ["soIgParado", "Instagram parado"],
              ["comTelefone", "Com telefone"],
              ["comWhats", "Com WhatsApp"],
              ["comEmail", "Com e-mail"],
            ].map(([k, label]) => (
              <label key={k} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={f[k as keyof Filtros] as boolean}
                  onCheckedChange={(v) => set(k as keyof Filtros, !!v as never)}
                />
                {label}
              </label>
            ))}
            <div className="flex items-center gap-2 text-sm ml-auto">
              <span className="text-muted-foreground">Score mínimo</span>
              <Input
                type="number"
                min={0}
                max={100}
                value={f.scoreMin}
                onChange={(e) => set("scoreMin", Number(e.target.value) || 0)}
                className="w-20 h-8"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="py-2.5 px-4 font-medium">Empresa</th>
                <th className="py-2.5 px-2 font-medium">Cidade</th>
                <th className="py-2.5 px-2 font-medium">Contatos</th>
                <th className="py-2.5 px-2 font-medium">Site</th>
                <th className="py-2.5 px-2 font-medium">Instagram</th>
                <th className="py-2.5 px-2 font-medium">Origem</th>
                <th className="py-2.5 px-4 font-medium text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((e) => (
                <tr key={e.id} className="border-t border-border/50 hover:bg-accent/30 transition">
                  <td className="py-3 px-4">
                    <Link
                      to={"/empresas/$id" as never}
                      params={{ id: e.id } as never}
                      className="font-medium hover:text-primary"
                    >
                      {e.nome}
                    </Link>
                    <div className="text-xs text-muted-foreground">{e.segmento}</div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {e.cidade}
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex gap-1.5 text-muted-foreground">
                      {e.telefone && <Phone className="h-3.5 w-3.5" aria-label="telefone" />}
                      {e.whatsapp && <MessageCircle className="h-3.5 w-3.5 text-emerald-500" aria-label="whatsapp" />}
                      {e.email && <Mail className="h-3.5 w-3.5" aria-label="email" />}
                      {e.site && <Globe className="h-3.5 w-3.5" aria-label="site" />}
                      {e.instagram && <Instagram className="h-3.5 w-3.5" aria-label="instagram" />}
                    </div>
                  </td>
                  <td className="py-3 px-2"><SiteBadge status={e.statusSite} /></td>
                  <td className="py-3 px-2"><InstagramBadge status={e.statusInstagram} /></td>
                  <td className="py-3 px-2">
                    <Badge variant="secondary" className="text-[10px] font-normal">
                      {e.origem.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right"><ScoreBadge score={e.score} /></td>
                </tr>
              ))}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-muted-foreground text-sm">
                    Nenhuma empresa corresponde aos filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
