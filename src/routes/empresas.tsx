import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { CIDADES_RS_FOCO, SEGMENTOS, type Empresa, type CrmStage } from "@/lib/mock-data";
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
import {
  ScoreBadge,
  SiteBadge,
  InstagramBadge,
  CRM_STAGE_LABEL,
  CRM_STAGES_ORDER,
  getCrmStageLabel,
} from "@/components/badges";
import {
  Globe,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Sparkles,
  Wand2,
  Zap,
  ArrowUpRight,
} from "lucide-react";
import {
  siteUrl,
  instagramUrl,
  whatsappUrl,
  telUrl,
  mailUrl,
  googleMapsUrl,
  origemLink,
} from "@/lib/links";
import { PromptsModal } from "@/components/prompts-modal";
import { EmpresaCadastroModal } from "@/components/empresa-cadastro-modal";
import { EmpresaLogo } from "@/components/empresa-logo";
import { toast } from "sonner";
import { Edit3, Building2, Trash2, RotateCcw } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const {
    empresas,
    setStage,
    kanbanColumns,
    moverEmpresaParaExcluidos,
    restaurarEmpresaDeExcluidos,
    excluirEmpresaDefinitivamente,
  } = useStore();
  const [f, setF] = useState<Filtros>(INITIAL);
  const [aba, setAba] = useState<"ativas" | "excluidas">("ativas");
  const [promptEmpresa, setPromptEmpresa] = useState<Empresa | null>(null);
  const [empresaCadastro, setEmpresaCadastro] = useState<Empresa | null>(null);

  const empresasAtivas = useMemo(
    () => empresas.filter((e) => e.crmStage !== "excluidos"),
    [empresas],
  );
  const empresasExcluidas = useMemo(
    () => empresas.filter((e) => e.crmStage === "excluidos"),
    [empresas],
  );

  const listaBase = aba === "ativas" ? empresasAtivas : empresasExcluidas;
  const filtradas = useMemo(() => filtrar(listaBase, f), [listaBase, f]);
  const set = <K extends keyof Filtros>(k: K, v: Filtros[K]) => setF((p) => ({ ...p, [k]: v }));

  const handleChangeStage = (empresaId: string, novoStage: CrmStage) => {
    setStage(empresaId, novoStage);
    toast.success(`Etapa alterada para "${getCrmStageLabel(novoStage)}"`);
  };

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 space-y-5 max-w-[1600px]">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestão de Empresas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtradas.length} de {listaBase.length} {aba === "ativas" ? "empresas ativas" : "empresas excluídas"} · filtros, etapas do funil e ações rápidas.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Tabs value={aba} onValueChange={(v) => setAba(v as "ativas" | "excluidas")}>
            <TabsList className="grid grid-cols-2 h-9 w-[300px]">
              <TabsTrigger value="ativas" className="text-xs gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Ativas ({empresasAtivas.length})
              </TabsTrigger>
              <TabsTrigger value="excluidas" className="text-xs gap-1.5 data-[state=active]:text-rose-600">
                <Trash2 className="h-3.5 w-3.5" />
                Excluídas ({empresasExcluidas.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" onClick={() => setF(INITIAL)} className="h-9 text-xs">
            Limpar filtros
          </Button>
        </div>
      </div>

      {aba === "excluidas" && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
          <span>
            Estas empresas estão na etapa <strong>Excluídos</strong> e ficam ocultas no Kanban principal. Você pode restaurá-las para a lista ativa a qualquer momento ou excluí-las definitivamente.
          </span>
        </div>
      )}

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
              <label key={k} className="flex items-center gap-2 text-sm cursor-pointer">
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

      <Card className="border-border/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="py-2.5 px-4 font-medium">Empresa</th>
                <th className="py-2.5 px-2 font-medium">Cidade</th>
                <th className="py-2.5 px-2 font-medium">Etapa Kanban</th>
                <th className="py-2.5 px-2 font-medium">Contatos</th>
                <th className="py-2.5 px-2 font-medium">Site</th>
                <th className="py-2.5 px-2 font-medium">Instagram</th>
                <th className="py-2.5 px-2 font-medium">Score</th>
                <th className="py-2.5 px-4 font-medium text-right">Ações Estratégicas</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((e) => (
                <tr key={e.id} className="border-t border-border/50 hover:bg-accent/30 transition">
                  {/* Nome da Empresa */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <EmpresaLogo site={e.site} nome={e.nome} size="sm" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEmpresaCadastro(e)}
                            className="font-medium text-left hover:text-primary transition-colors flex items-center gap-1 group cursor-pointer truncate"
                            title="Clique para abrir e editar o cadastro da empresa"
                          >
                            <span className="group-hover:underline truncate">{e.nome}</span>
                            <Edit3 className="h-3 w-3 text-muted-foreground opacity-60 group-hover:opacity-100 shrink-0" />
                          </button>
                          <Link
                            to={"/empresas/$id" as never}
                            params={{ id: e.id } as never}
                            className="text-muted-foreground hover:text-foreground p-0.5 rounded hover:bg-muted shrink-0"
                            title="Abrir página completa com auditoria"
                          >
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <span className="truncate">{e.segmento}</span>
                          {e.areaAtuacao && (
                            <span className="text-[11px] text-primary/80 font-normal truncate max-w-[200px]" title={e.areaAtuacao}>
                              · {e.areaAtuacao}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Cidade */}
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-1 text-muted-foreground text-xs">
                      <MapPin className="h-3 w-3" /> {e.cidade}
                    </div>
                  </td>

                  {/* COMBO DA ETAPA KANBAN */}
                  <td className="py-3 px-2">
                    <Select
                      value={e.crmStage}
                      onValueChange={(v) => handleChangeStage(e.id, v as CrmStage)}
                    >
                      <SelectTrigger className="h-7 text-xs w-[160px] bg-card">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(kanbanColumns && kanbanColumns.length > 0
                          ? kanbanColumns
                          : CRM_STAGES_ORDER.map((stage) => ({ id: stage, titulo: getCrmStageLabel(stage) }))
                        ).map((col) => (
                          <SelectItem key={col.id} value={col.id} className="text-xs">
                            {col.titulo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>

                  {/* Contatos */}
                  <td className="py-3 px-2">
                    <div className="flex gap-1.5 text-muted-foreground">
                      {e.telefone && (
                        <a href={telUrl(e.telefone)} title={`Ligar para ${e.telefone}`} className="hover:text-primary p-1 rounded hover:bg-muted">
                          <Phone className="h-3.5 w-3.5" aria-label="telefone" />
                        </a>
                      )}
                      {e.whatsapp && (
                        <a href={whatsappUrl(e.whatsapp)} target="_blank" rel="noopener noreferrer" title={`WhatsApp ${e.whatsapp}`} className="text-emerald-500 hover:opacity-80 p-1 rounded hover:bg-muted">
                          <MessageCircle className="h-3.5 w-3.5" aria-label="whatsapp" />
                        </a>
                      )}
                      {e.email && (
                        <a href={mailUrl(e.email)} title={e.email} className="hover:text-primary p-1 rounded hover:bg-muted">
                          <Mail className="h-3.5 w-3.5" aria-label="email" />
                        </a>
                      )}
                      {e.site && (
                        <a href={siteUrl(e.site)} target="_blank" rel="noopener noreferrer" title={e.site} className="hover:text-primary p-1 rounded hover:bg-muted">
                          <Globe className="h-3.5 w-3.5" aria-label="site" />
                        </a>
                      )}
                      {e.instagram && (
                        <a href={instagramUrl(e.instagram)} target="_blank" rel="noopener noreferrer" title={e.instagram} className="hover:text-primary p-1 rounded hover:bg-muted">
                          <Instagram className="h-3.5 w-3.5" aria-label="instagram" />
                        </a>
                      )}
                      <a
                        href={googleMapsUrl(`${e.nome} ${e.cidade}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Ver no Google Maps"
                        className="hover:text-primary p-1 rounded hover:bg-muted"
                      >
                        <MapPin className="h-3.5 w-3.5" aria-label="google maps" />
                      </a>
                    </div>
                  </td>

                  {/* Badges de Site e Instagram */}
                  <td className="py-3 px-2"><SiteBadge status={e.statusSite} /></td>
                  <td className="py-3 px-2"><InstagramBadge status={e.statusInstagram} /></td>

                  {/* Score */}
                  <td className="py-3 px-2"><ScoreBadge score={e.score} size="sm" /></td>

                  {/* AÇÕES ESTRATÉGICAS: CADASTRO, ABORDAGEM & PROMPTS IA */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {aba === "ativas" ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEmpresaCadastro(e)}
                            className="h-7 text-xs px-2 gap-1 text-blue-600 border-blue-500/30 hover:bg-blue-500/10"
                            title="Abrir e Editar Cadastro da Empresa"
                          >
                            <Building2 className="h-3 w-3 text-blue-500" />
                            Cadastro
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPromptEmpresa(e)}
                            className="h-7 text-xs px-2 gap-1"
                            title="Gerar Prompts e Briefings com IA"
                          >
                            <Wand2 className="h-3 w-3 text-primary" />
                            Prompts
                          </Button>

                          <Button
                            asChild
                            size="sm"
                            className="h-7 text-xs px-2.5 gap-1 bg-gradient-to-r from-emerald-600 to-primary text-white"
                            title="Abrir Central de Abordagens e Dossiê 360"
                          >
                            <Link to="/analise-cliente" search={{ empresa: e.id, tab: "dossier" }}>
                              <Zap className="h-3 w-3" />
                              Analisar
                            </Link>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              moverEmpresaParaExcluidos(e.id);
                              toast.success(`"${e.nome}" movida para a lista de excluídos e coluna Excluídos do Kanban.`);
                            }}
                            className="h-7 text-xs px-2 gap-1 text-rose-600 border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-600"
                            title="Excluir da lista ativa e mover para a coluna Excluídos do Kanban"
                          >
                            <Trash2 className="h-3 w-3 text-rose-500" />
                            Excluir
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              restaurarEmpresaDeExcluidos(e.id, "identificado");
                              toast.success(`"${e.nome}" restaurada para empresas ativas!`);
                            }}
                            className="h-7 text-xs px-2.5 gap-1 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                            title="Restaurar para a lista de empresas ativas"
                          >
                            <RotateCcw className="h-3 w-3 text-emerald-500" />
                            Restaurar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Atenção: Excluir definitivamente removerá "${e.nome}" permanentemente. Confirmar?`)) {
                                excluirEmpresaDefinitivamente(e.id);
                                toast.success(`"${e.nome}" excluída definitivamente.`);
                              }
                            }}
                            className="h-7 text-xs px-2 gap-1 bg-rose-600 hover:bg-rose-700 text-white"
                            title="Excluir permanentemente do banco de dados"
                          >
                            <Trash2 className="h-3 w-3" />
                            Excluir Definitivo
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-muted-foreground text-sm">
                    {aba === "excluidas"
                      ? "Nenhuma empresa na lista de excluídas."
                      : "Nenhuma empresa corresponde aos filtros aplicados."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal de Cadastro Completo & Inteligência de Busca */}
      <EmpresaCadastroModal
        empresa={empresaCadastro}
        open={Boolean(empresaCadastro)}
        onOpenChange={(o) => !o && setEmpresaCadastro(null)}
      />

      {/* Modal de Prompts transferido para a tela de empresas */}
      <PromptsModal
        empresa={promptEmpresa}
        open={!!promptEmpresa}
        onOpenChange={(o) => !o && setPromptEmpresa(null)}
      />
    </div>
  );
}
