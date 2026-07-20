import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Ban, FileText, UserCheck, Eye } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/compliance")({
  component: CompliancePage,
});

function CompliancePage() {
  const { empresas, updateEmpresa } = useStore();
  const naoContatar = empresas.filter((e) => e.naoContatar);

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 space-y-5 max-w-[1200px]">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-500/15 text-emerald-500">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Compliance & LGPD</h1>
          <p className="text-sm text-muted-foreground">Uso responsável dos dados, base legal e controles internos.</p>
        </div>
      </div>

      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="p-5 text-sm space-y-2">
          <div className="font-semibold">Uso interno comercial</div>
          <p className="text-muted-foreground">
            Esta plataforma é destinada exclusivamente ao uso interno da agência para prospecção comercial ativa.
            Os dados aqui reunidos vêm de fontes públicas (Google Places, diretórios, sites institucionais),
            de importação manual ou de importações CSV realizadas pela equipe.
          </p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <PrincipioCard
          icon={FileText}
          titulo="Base legal aplicável (LGPD)"
          texto="Legítimo interesse (art. 7º, IX) para atividade de prospecção B2B a partir de dados manifestamente públicos, com garantia dos direitos do titular, mecanismo de oposição e revisão humana antes de qualquer contato."
        />
        <PrincipioCard
          icon={UserCheck}
          titulo="Revisão humana"
          texto="Diagnósticos, scores e mensagens são apoios à decisão. Toda abordagem deve ser revisada por um responsável comercial antes do envio, ajustando tom, canal e pertinência."
        />
        <PrincipioCard
          icon={Eye}
          titulo="Transparência"
          texto="Ao contatar uma empresa, identificar a agência, esclarecer o motivo do contato e disponibilizar caminho para não receber novas comunicações."
        />
        <PrincipioCard
          icon={Ban}
          titulo="Direito de oposição"
          texto="Qualquer registro pode ser marcado como “Não contatar”. Esta marcação bloqueia futuras abordagens e mantém histórico do pedido."
        />
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Registros marcados como “Não contatar”</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{naoContatar.length} registro(s)</p>
          </div>
        </CardHeader>
        <CardContent>
          {naoContatar.length === 0 ? (
            <div className="text-sm text-muted-foreground border border-dashed border-border/60 rounded-md p-6 text-center">
              Nenhum registro marcado. Você pode marcar qualquer empresa na página de detalhe.
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {naoContatar.map((e) => (
                <li key={e.id} className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-sm font-medium">{e.nome}</div>
                    <div className="text-xs text-muted-foreground">{e.cidade} · {e.segmento}</div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { updateEmpresa(e.id, { naoContatar: false }); toast.success("Marcação removida"); }}
                  >
                    Reativar
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4">
            <Badge variant="outline" className="text-[10px]">v1 · política editorial ajustável em Configurações</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PrincipioCard({ icon: Icon, titulo, texto }: { icon: typeof ShieldCheck; titulo: string; texto: string }) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-5 space-y-2">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <div className="font-semibold text-sm">{titulo}</div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{texto}</p>
      </CardContent>
    </Card>
  );
}
