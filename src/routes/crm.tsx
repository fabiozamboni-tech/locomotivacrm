import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Globe,
  Instagram,
  MapPin,
  MessageSquare,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  ArrowUpRight,
} from "lucide-react";
import { useStore } from "@/lib/store";
import {
  CRM_STAGE_LABEL,
  CRM_STAGES_ORDER,
  ScoreBadge,
  SiteBadge,
  InstagramBadge,
} from "@/components/badges";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { instagramUrl, siteUrl, googleMapsUrl } from "@/lib/links";
import { gerarAbordagem, type Canal, type Tom, type Foco } from "@/lib/generators";
import type { Empresa, CrmStage } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/crm")({
  component: CrmPage,
  head: () => ({
    meta: [
      { title: "Funil CRM · Radar de Presença Digital" },
      {
        name: "description",
        content:
          "Kanban de prospecção com cards enxutos, links diretos e histórico de abordagens por empresa.",
      },
    ],
  }),
});

const STAGE_ACCENT: Record<CrmStage, string> = {
  identificado: "from-slate-500/40 to-slate-500/0 border-slate-500/30",
  analisado: "from-sky-500/40 to-sky-500/0 border-sky-500/30",
  contato_preparado: "from-indigo-500/40 to-indigo-500/0 border-indigo-500/30",
  primeiro_contato: "from-violet-500/40 to-violet-500/0 border-violet-500/30",
  aguardando_retorno: "from-amber-500/40 to-amber-500/0 border-amber-500/30",
  em_negociacao: "from-orange-500/40 to-orange-500/0 border-orange-500/30",
  convertido: "from-emerald-500/40 to-emerald-500/0 border-emerald-500/30",
  perdido: "from-rose-500/40 to-rose-500/0 border-rose-500/30",
  sem_fit: "from-zinc-500/40 to-zinc-500/0 border-zinc-500/30",
};

function CrmPage() {
  const { empresas, setStage } = useStore();
  const [openId, setOpenId] = useState<string | null>(null);
  const openEmpresa = useMemo(
    () => empresas.find((e) => e.id === openId) ?? null,
    [empresas, openId],
  );

  const grouped = useMemo(() => {
    const map = new Map<CrmStage, Empresa[]>();
    CRM_STAGES_ORDER.forEach((s) => map.set(s, []));
    empresas.forEach((e) => map.get(e.crmStage)?.push(e));
    return map;
  }, [empresas]);

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 space-y-5 max-w-full">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Funil de prospecção</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kanban comercial — cards com contatos diretos e modal de abordagem por empresa.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="size-2 rounded-full bg-primary" /> {empresas.length} empresas no funil
          </span>
        </div>
      </div>

      {empresas.length === 0 ? (
        <Card className="p-10 text-center border-dashed">
          <p className="text-sm text-muted-foreground">
            Nenhuma empresa no funil ainda. Adicione via <Link to="/importar" className="text-primary underline">Importar</Link>.
          </p>
        </Card>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:-mx-8 md:px-8">
          {CRM_STAGES_ORDER.map((stage) => {
            const items = grouped.get(stage) ?? [];
            return (
              <div key={stage} className="w-[300px] shrink-0">
                <div
                  className={cn(
                    "rounded-t-lg border-t border-x bg-gradient-to-b px-3 py-2.5",
                    STAGE_ACCENT[stage],
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-semibold uppercase tracking-wider">
                      {CRM_STAGE_LABEL[stage]}
                    </div>
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 tabular-nums">
                      {items.length}
                    </Badge>
                  </div>
                </div>
                <div className="rounded-b-lg border-b border-x border-border/60 bg-muted/20 p-2 space-y-2 min-h-[140px]">
                  {items.map((e) => (
                    <KanbanCard
                      key={e.id}
                      empresa={e}
                      onOpen={() => setOpenId(e.id)}
                      onChangeStage={(s) => setStage(e.id, s)}
                    />
                  ))}
                  {items.length === 0 && (
                    <div className="text-xs text-muted-foreground/70 border border-dashed border-border/50 rounded-md p-4 text-center">
                      Vazio
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <EmpresaModal
        empresa={openEmpresa}
        open={!!openEmpresa}
        onOpenChange={(o) => !o && setOpenId(null)}
      />
    </div>
  );
}

function KanbanCard({
  empresa,
  onOpen,
  onChangeStage,
}: {
  empresa: Empresa;
  onOpen: () => void;
  onChangeStage: (s: CrmStage) => void;
}) {
  const site = siteUrl(empresa.site);
  const ig = instagramUrl(empresa.instagram);
  const maps = googleMapsUrl(`${empresa.nome} ${empresa.cidade}`);

  return (
    <Card className="group p-3 border-border/60 hover:border-primary/40 hover:shadow-md transition-all bg-card">
      <div className="flex items-start justify-between gap-2">
        <button
          onClick={onOpen}
          className="text-sm font-semibold leading-tight text-left hover:text-primary line-clamp-2 flex-1"
        >
          {empresa.nome}
        </button>
        <ScoreBadge score={empresa.score} size="sm" />
      </div>
      <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
        <MapPin className="size-3 shrink-0" />
        <span className="truncate">{empresa.segmento} · {empresa.cidade}</span>
      </div>

      <div className="flex flex-wrap gap-1 mt-2">
        <SiteBadge status={empresa.statusSite} />
        <InstagramBadge status={empresa.statusInstagram} />
      </div>

      <div className="flex items-center gap-1 mt-3">
        <IconLink href={site} title="Site" disabled={!site}>
          <Globe className="size-3.5" />
        </IconLink>
        <IconLink href={ig} title="Instagram" disabled={!ig}>
          <Instagram className="size-3.5" />
        </IconLink>
        <IconLink href={maps} title="Google Maps">
          <MapPin className="size-3.5" />
        </IconLink>
        <div className="flex-1" />
        <Button
          size="sm"
          variant="secondary"
          className="h-7 px-2 text-[11px] gap-1"
          onClick={onOpen}
        >
          <Sparkles className="size-3" /> Abordar
        </Button>
      </div>

      <Select
        value={empresa.crmStage}
        onValueChange={(v) => onChangeStage(v as CrmStage)}
      >
        <SelectTrigger className="mt-2 h-7 text-[11px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CRM_STAGES_ORDER.map((s) => (
            <SelectItem key={s} value={s} className="text-xs">
              {CRM_STAGE_LABEL[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Card>
  );
}

function IconLink({
  href,
  title,
  disabled,
  children,
}: {
  href?: string;
  title: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  if (!href || disabled) {
    return (
      <span
        title={`${title} indisponível`}
        className="inline-flex size-7 items-center justify-center rounded-md border border-border/40 text-muted-foreground/40 cursor-not-allowed"
      >
        {children}
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      className="inline-flex size-7 items-center justify-center rounded-md border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors"
    >
      {children}
    </a>
  );
}

const CANAIS: { value: Canal; label: string }[] = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "E-mail" },
  { value: "instagram", label: "Instagram DM" },
  { value: "curta", label: "Mensagem curta" },
  { value: "ligacao", label: "Roteiro de ligação" },
];
const TONS: { value: Tom; label: string }[] = [
  { value: "consultivo", label: "Consultivo" },
  { value: "amistoso", label: "Amistoso" },
  { value: "formal", label: "Formal" },
  { value: "direto", label: "Direto" },
];
const FOCOS: { value: Foco; label: string }[] = [
  { value: "geral", label: "Geral" },
  { value: "site", label: "Site" },
  { value: "instagram", label: "Instagram" },
  { value: "atendimento", label: "Atendimento" },
];

function EmpresaModal({
  empresa,
  open,
  onOpenChange,
}: {
  empresa: Empresa | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { addHistorico } = useStore();
  const [canal, setCanal] = useState<Canal>("whatsapp");
  const [tom, setTom] = useState<Tom>("consultivo");
  const [foco, setFoco] = useState<Foco>("geral");
  const [copied, setCopied] = useState(false);

  const texto = useMemo(
    () => (empresa ? gerarAbordagem(empresa, canal, tom, foco) : ""),
    [empresa, canal, tom, foco],
  );

  if (!empresa) return null;

  const copy = async () => {
    await navigator.clipboard.writeText(texto);
    setCopied(true);
    toast.success("Mensagem copiada");
    setTimeout(() => setCopied(false), 1500);
  };

  const registrar = () => {
    addHistorico(empresa.id, {
      data: new Date().toISOString().slice(0, 10),
      tipo: canal === "email" ? "email" : canal === "ligacao" ? "ligacao" : "whatsapp",
      texto: `Abordagem ${CANAIS.find((c) => c.value === canal)?.label} (${tom}, foco ${foco}) preparada.`,
    });
    toast.success("Registrado no histórico");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-5 pb-3 border-b bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle className="text-xl truncate">{empresa.nome}</DialogTitle>
              <DialogDescription className="mt-1">
                {empresa.segmento} · {empresa.cidade} · {CRM_STAGE_LABEL[empresa.crmStage]}
              </DialogDescription>
              <div className="flex flex-wrap gap-1.5 mt-3">
                <SiteBadge status={empresa.statusSite} />
                <InstagramBadge status={empresa.statusInstagram} />
                <ScoreBadge score={empresa.score} size="sm" />
              </div>
            </div>
            <Link
              to="/empresas/$id"
              params={{ id: empresa.id }}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
              onClick={() => onOpenChange(false)}
            >
              Ver perfil <ArrowUpRight className="size-3" />
            </Link>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            <ContactChip href={siteUrl(empresa.site)} icon={<Globe className="size-3" />}>
              {empresa.site || "sem site"}
            </ContactChip>
            <ContactChip href={instagramUrl(empresa.instagram)} icon={<Instagram className="size-3" />}>
              {empresa.instagram || "sem instagram"}
            </ContactChip>
            <ContactChip
              href={googleMapsUrl(`${empresa.nome} ${empresa.cidade}`)}
              icon={<MapPin className="size-3" />}
            >
              Google Maps
            </ContactChip>
          </div>
        </DialogHeader>

        <Tabs defaultValue="abordagem" className="w-full">
          <TabsList className="rounded-none w-full justify-start px-5 h-10 border-b bg-transparent">
            <TabsTrigger value="abordagem" className="gap-1.5">
              <Sparkles className="size-3.5" /> Abordagem
            </TabsTrigger>
            <TabsTrigger value="historico" className="gap-1.5">
              <MessageSquare className="size-3.5" /> Histórico
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                {empresa.historico.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="abordagem" className="m-0 p-5 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <PromptSelect label="Canal" value={canal} onValueChange={(v) => setCanal(v as Canal)} options={CANAIS} />
              <PromptSelect label="Tom" value={tom} onValueChange={(v) => setTom(v as Tom)} options={TONS} />
              <PromptSelect label="Foco" value={foco} onValueChange={(v) => setFoco(v as Foco)} options={FOCOS} />
            </div>

            <div className="relative rounded-lg border bg-muted/30">
              <ScrollArea className="max-h-[300px]">
                <pre className="p-4 text-sm whitespace-pre-wrap font-sans leading-relaxed">
                  {texto}
                </pre>
              </ScrollArea>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={copy} size="sm" className="gap-1.5">
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
              <Button onClick={registrar} size="sm" variant="secondary" className="gap-1.5">
                <MessageSquare className="size-3.5" /> Registrar no histórico
              </Button>
              <div className="flex-1" />
              <Link
                to="/abordagem"
                onClick={() => onOpenChange(false)}
                className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
              >
                Abrir gerador completo <ExternalLink className="size-3" />
              </Link>
            </div>

            <PromptSugestoes empresa={empresa} onPick={setFoco} />
          </TabsContent>

          <TabsContent value="historico" className="m-0 p-5">
            {empresa.historico.length === 0 ? (
              <div className="text-sm text-muted-foreground border border-dashed rounded-lg p-8 text-center">
                Nenhuma abordagem registrada ainda. Prepare uma na aba <b>Abordagem</b>.
              </div>
            ) : (
              <ScrollArea className="max-h-[400px]">
                <ol className="relative border-l border-border/60 ml-2 space-y-4">
                  {empresa.historico.map((h, i) => (
                    <li key={i} className="ml-4">
                      <span className="absolute -left-1.5 mt-1.5 size-3 rounded-full bg-primary border-2 border-background" />
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="tabular-nums">{h.data}</span>
                        <Separator orientation="vertical" className="h-3" />
                        <Badge variant="outline" className="text-[10px] py-0 h-4 capitalize">
                          {h.tipo}
                        </Badge>
                      </div>
                      <p className="text-sm mt-1 leading-relaxed">{h.texto}</p>
                    </li>
                  ))}
                </ol>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function ContactChip({
  href,
  icon,
  children,
}: {
  href?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const cls =
    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] max-w-[220px] truncate";
  if (!href) {
    return (
      <span className={cn(cls, "border-border/40 text-muted-foreground/60 bg-muted/30")}>
        {icon}
        <span className="truncate">{children}</span>
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(cls, "border-border/60 hover:border-primary/50 hover:text-primary transition-colors")}
    >
      {icon}
      <span className="truncate">{children}</span>
    </a>
  );
}

function PromptSelect<T extends string>({
  label,
  value,
  onValueChange,
  options,
}: {
  label: string;
  value: T;
  onValueChange: (v: string) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
        {label}
      </label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value} className="text-xs">
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function PromptSugestoes({
  empresa,
  onPick,
}: {
  empresa: Empresa;
  onPick: (f: Foco) => void;
}) {
  const sugestoes: { foco: Foco; titulo: string; motivo: string }[] = [];
  if (empresa.statusSite === "sem_site" || empresa.statusSite === "desatualizado") {
    sugestoes.push({
      foco: "site",
      titulo: "Falar sobre o site",
      motivo:
        empresa.statusSite === "sem_site"
          ? "Empresa sem site próprio — abertura natural."
          : "Site com sinais de desatualização.",
    });
  }
  if (empresa.statusInstagram === "parado" || empresa.statusInstagram === "sem_perfil") {
    sugestoes.push({
      foco: "instagram",
      titulo: "Falar sobre o Instagram",
      motivo: "Presença social fraca — dor comum e fácil de abordar.",
    });
  }
  if (!empresa.diagnostico.atendimento.contatoFacil) {
    sugestoes.push({
      foco: "atendimento",
      titulo: "Falar sobre atendimento",
      motivo: "Canais de contato pouco claros no site.",
    });
  }
  if (sugestoes.length === 0) {
    sugestoes.push({
      foco: "geral",
      titulo: "Diagnóstico geral",
      motivo: "Sem gaps críticos — proponha auditoria consultiva.",
    });
  }

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold">
        <Sparkles className="size-3.5 text-primary" /> Sugestões de foco
      </div>
      <div className="grid gap-1.5">
        {sugestoes.map((s) => (
          <button
            key={s.foco + s.titulo}
            onClick={() => onPick(s.foco)}
            className="text-left rounded-md border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-colors p-2"
          >
            <div className="text-xs font-medium">{s.titulo}</div>
            <div className="text-[11px] text-muted-foreground">{s.motivo}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
