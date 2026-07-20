import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { gerarPrompt, type TipoPrompt } from "@/lib/generators";
import { Copy, Wand2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/prompts")({
  validateSearch: z.object({ empresa: z.string().optional() }),
  component: PromptsPage,
});

const TIPOS: { value: TipoPrompt; label: string; desc: string }[] = [
  { value: "site_novo", label: "Site novo", desc: "Briefing completo para criação de site" },
  { value: "site_redesign", label: "Redesign de site", desc: "Considera problemas do site atual" },
  { value: "ig_estrategia", label: "Estratégia Instagram", desc: "Posicionamento e pilares editoriais" },
  { value: "ig_posts", label: "Ideias de posts", desc: "Calendário inicial de 30 dias" },
];

function PromptsPage() {
  const { empresa: empresaId } = useSearch({ from: "/prompts" });
  const { empresas } = useStore();
  const [selected, setSelected] = useState<string>(empresaId ?? empresas[0]?.id ?? "");
  const [tipo, setTipo] = useState<TipoPrompt>("site_novo");
  const empresa = empresas.find((e) => e.id === selected);
  const texto = useMemo(() => (empresa ? gerarPrompt(empresa, tipo) : ""), [empresa, tipo]);

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 space-y-5 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Prompts para produção com IA</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Briefings estruturados, prontos para copiar direto em ferramentas de IA.
        </p>
      </div>

      <div className="grid lg:grid-cols-[340px_1fr] gap-5">
        <Card className="border-border/60 h-fit">
          <CardHeader className="pb-2"><CardTitle className="text-base">Empresa base</CardTitle></CardHeader>
          <CardContent>
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {empresas.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.nome} · {e.cidade}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <div>
          <Tabs value={tipo} onValueChange={(v) => setTipo(v as TipoPrompt)}>
            <TabsList className="flex flex-wrap h-auto">
              {TIPOS.map((t) => (
                <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
              ))}
            </TabsList>
            {TIPOS.map((t) => (
              <TabsContent key={t.value} value={t.value} className="mt-4">
                <Card className="border-border/60">
                  <CardHeader className="flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2"><Wand2 className="h-4 w-4 text-primary" />{t.label}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">{t.desc}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(texto);
                        toast.success("Prompt copiado");
                      }}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1.5" /> Copiar
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <Textarea value={texto} readOnly rows={22} className="font-mono text-xs" />
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
