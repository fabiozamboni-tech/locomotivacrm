import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { gerarAbordagem, type Canal, type Foco, type Tom } from "@/lib/generators";
import {
  gerarAbordagemIA,
  gerarVariacoesAbordagemIA,
  toCtx,
  type VariacaoAbordagem,
} from "@/lib/ai.functions";
import { whatsappUrl } from "@/lib/links";
import {
  Copy,
  RefreshCw,
  MessageCircle,
  Mail,
  Instagram,
  Phone,
  Type,
  Sparkles,
  Wand2,
  Send,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

type Elegancia = "sutil" | "elegante" | "equilibrado" | "direto";

function waSendUrl(numero: string | undefined, texto: string): string | undefined {
  const base = whatsappUrl(numero);
  if (!base) return undefined;
  return `${base}?text=${encodeURIComponent(texto)}`;
}

export const Route = createFileRoute("/abordagem")({
  validateSearch: z.object({ empresa: z.string().optional() }),
  component: AbordagemPage,
});

const CANAIS: { value: Canal; label: string; icon: typeof Mail }[] = [
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { value: "email", label: "E-mail", icon: Mail },
  { value: "instagram", label: "Direct / Instagram", icon: Instagram },
  { value: "ligacao", label: "Ligação (roteiro)", icon: Phone },
  { value: "curta", label: "Mensagem curta", icon: Type },
];

function AbordagemPage() {
  const { empresa: empresaId } = useSearch({ from: "/abordagem" });
  const { empresas } = useStore();
  const [selected, setSelected] = useState<string>(empresaId ?? empresas[0]?.id ?? "");
  const [canal, setCanal] = useState<Canal>("whatsapp");
  const [tom, setTom] = useState<Tom>("consultivo");
  const [foco, setFoco] = useState<Foco>("geral");
  const [seed, setSeed] = useState(0);

  const empresa = empresas.find((e) => e.id === selected);
  const texto = useMemo(
    () => (empresa ? gerarAbordagem(empresa, canal, tom, foco) : ""),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [empresa, canal, tom, foco, seed],
  );
  const [editado, setEditado] = useState(texto);
  const [loadingIA, setLoadingIA] = useState(false);
  const finalTxt = editado || texto;

  const regen = () => {
    setSeed((s) => s + 1);
    setEditado("");
    toast.success("Mensagem regenerada");
  };

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 space-y-5 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gerador de abordagens</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Textos consultivos personalizados por empresa, canal, tom e foco.
        </p>
      </div>

      <div className="grid lg:grid-cols-[340px_1fr] gap-5">
        <Card className="border-border/60 h-fit">
          <CardHeader className="pb-2"><CardTitle className="text-base">Configuração</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Empresa</Label>
              <Select value={selected} onValueChange={(v) => { setSelected(v); setEditado(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {empresas.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.nome} · {e.cidade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Canal</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {CANAIS.map((c) => {
                  const Icon = c.icon;
                  const active = canal === c.value;
                  return (
                    <button
                      key={c.value}
                      onClick={() => { setCanal(c.value); setEditado(""); }}
                      className={`flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs transition ${
                        active ? "border-primary bg-primary/10 text-primary" : "border-border/60 hover:bg-accent"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />{c.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label>Tom</Label>
              <Select value={tom} onValueChange={(v) => { setTom(v as Tom); setEditado(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultivo">Consultivo</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="amistoso">Amistoso</SelectItem>
                  <SelectItem value="direto">Direto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Foco</Label>
              <Select value={foco} onValueChange={(v) => { setFoco(v as Foco); setEditado(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="geral">Diagnóstico geral</SelectItem>
                  <SelectItem value="site">Site</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="atendimento">Atendimento & comunicação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {empresa && (
              <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-xs space-y-1">
                <div className="font-medium">{empresa.nome}</div>
                <div className="text-muted-foreground">{empresa.segmento} · {empresa.cidade}</div>
                <Badge variant="secondary" className="text-[10px]">Score {empresa.score}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Mensagem gerada</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={regen}>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Regenerar
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={!empresa || loadingIA}
                onClick={async () => {
                  if (!empresa) return;
                  setLoadingIA(true);
                  try {
                    const r = await gerarAbordagemIA({ data: { empresa: toCtx(empresa), canal, tom, foco } });
                    setEditado(r);
                    toast.success("Mensagem gerada com IA");
                  } catch (e) {
                    toast.error((e as Error).message);
                  } finally {
                    setLoadingIA(false);
                  }
                }}
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" /> {loadingIA ? "Gerando..." : "Gerar com IA"}
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(finalTxt);
                  toast.success("Mensagem copiada");
                }}
              >
                <Copy className="h-3.5 w-3.5 mr-1.5" /> Copiar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={finalTxt}
              onChange={(e) => setEditado(e.target.value)}
              rows={16}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Personalize antes de enviar. Sempre revise humanamente — evite tom agressivo, mantenha coerência com a identidade da agência.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5 font-medium">{children}</div>;
}
