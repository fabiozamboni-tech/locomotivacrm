import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CIDADES_RS_FOCO, SEGMENTOS } from "@/lib/mock-data";
import { DEFAULT_WEIGHTS, type ScoreWeights } from "@/lib/scoring";
import { toast } from "sonner";

export const Route = createFileRoute("/configuracoes")({
  component: ConfiguracoesPage,
});

const LABELS: Record<keyof ScoreWeights, string> = {
  semSite: "Não possui site",
  siteDesatualizado: "Site com aparência antiga",
  semSSL: "Sem SSL / erros",
  naoResponsivo: "Não responsivo",
  semCTA: "Sem CTA claro",
  contatoDificil: "Contato difícil",
  instagramParado: "Instagram parado (+90d)",
  bioFraca: "Bio fraca no Instagram",
  identidadeInconsistente: "Identidade visual inconsistente",
  atendimentoFraco: "Atendimento fraco",
  semProvaSocial: "Sem prova social",
  presencaGoogleFraca: "Presença no Google fraca",
};

function ConfiguracoesPage() {
  const { weights, setWeights } = useStore();

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 space-y-5 max-w-[1200px]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pesos do score, cidades e segmentos prioritários, templates e regras.
        </p>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-base">Pesos do score de oportunidade</CardTitle></CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            {(Object.keys(weights) as (keyof ScoreWeights)[]).map((k) => (
              <div key={k} className="flex items-center gap-3 rounded-md border border-border/60 p-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{LABELS[k]}</div>
                  <div className="text-xs text-muted-foreground">Peso aplicado quando o critério é verdadeiro</div>
                </div>
                <Input
                  type="number"
                  min={0}
                  max={50}
                  className="w-20 text-right"
                  value={weights[k]}
                  onChange={(e) => setWeights({ ...weights, [k]: Number(e.target.value) || 0 })}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => { setWeights(DEFAULT_WEIGHTS); toast.success("Pesos restaurados"); }}>
              Restaurar padrões
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-base">Cidades prioritárias</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {CIDADES_RS_FOCO.map((c) => <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>)}
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-base">Segmentos prioritários</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-1.5">
            {SEGMENTOS.map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-base">Template padrão de abordagem</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            defaultValue={"Olá, [nome]! Fiz uma análise da presença digital da [empresa] aqui em [cidade]. Notei 2 ou 3 ajustes rápidos que podem gerar mais contatos. Posso te enviar um resumo curto?"}
            rows={5}
          />
          <p className="text-xs text-muted-foreground mt-2">Este template alimenta o módulo de abordagens. Variáveis aceitas: [nome], [empresa], [cidade].</p>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-2"><CardTitle className="text-base">Integrações futuras</CardTitle></CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-3">
          {["Google Places API", "Instagram Graph (oficial)", "WhatsApp Business API"].map((i) => (
            <div key={i} className="rounded-md border border-dashed border-border/60 p-4 text-sm">
              <div className="font-medium">{i}</div>
              <div className="text-xs text-muted-foreground mt-1">Configuração disponível quando a chave for provida.</div>
              <Badge variant="outline" className="text-[10px] mt-2">Em breve</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
