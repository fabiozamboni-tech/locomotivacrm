import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, Download, FileDown } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/importar")({
  component: ImportarPage,
});

const CSV_EXAMPLE = `nome,segmento,cidade,telefone,whatsapp,email,site,instagram
Padaria do Vale,Padaria artesanal,Bento Gonçalves,(54) 3055-0011,(54) 99988-7766,,,@padariadovale
Metalúrgica Serrana,Metalurgia,Caxias do Sul,(54) 3221-9999,,contato@metalserrana.ind.br,metalserrana.ind.br,`;

function ImportarPage() {
  const { empresas } = useStore();
  const [csv, setCsv] = useState(CSV_EXAMPLE);

  const exportarEmpresas = () => {
    const header = "nome;segmento;cidade;telefone;whatsapp;email;site;instagram;score;statusSite;statusInstagram;etapaCRM";
    const rows = empresas.map((e) =>
      [e.nome, e.segmento, e.cidade, e.telefone ?? "", e.whatsapp ?? "", e.email ?? "", e.site ?? "", e.instagram ?? "", e.score, e.statusSite, e.statusInstagram, e.crmStage]
        .map((c) => String(c).replace(/;/g, ","))
        .join(";"),
    );
    downloadFile("radar-empresas.csv", [header, ...rows].join("\n"), "text/csv");
    toast.success("CSV exportado");
  };

  return (
    <div className="px-4 md:px-8 py-6 md:py-8 space-y-5 max-w-[1200px]">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Importação e exportação</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Entradas via CSV, exportações de empresas, diagnósticos, abordagens e prompts.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Upload className="h-4 w-4 text-primary" />Importar CSV</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Cole abaixo um CSV com as colunas: nome, segmento, cidade, telefone, whatsapp, email, site, instagram.
              A importação simulada valida cabeçalhos e adiciona registros à base atual.
            </p>
            <Textarea rows={10} value={csv} onChange={(e) => setCsv(e.target.value)} className="font-mono text-xs" />
            <Button
              onClick={() => {
                const [head, ...rest] = csv.trim().split(/\r?\n/);
                if (!head?.toLowerCase().includes("nome"))
                  return toast.error("Cabeçalho inválido");
                toast.success(`${rest.length} linha(s) validada(s). Importação simulada.`);
              }}
            >
              Validar e importar
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Download className="h-4 w-4 text-primary" />Exportações</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <ExportRow title="Empresas (CSV completo)" desc="Base atual com score e etapa CRM" onClick={exportarEmpresas} />
            <ExportRow
              title="Diagnóstico (PDF simulado)"
              desc="Relatório por empresa"
              onClick={() => {
                downloadFile("diagnostico-simulado.txt", "Diagnóstico simulado — implementar geração de PDF.", "text/plain");
                toast.success("Arquivo gerado (mock)");
              }}
            />
            <ExportRow
              title="Abordagens geradas"
              desc="Exporta últimas mensagens produzidas"
              onClick={() => {
                downloadFile("abordagens.txt", "Abordagens simuladas — módulo pronto para produção.", "text/plain");
                toast.success("Arquivo gerado (mock)");
              }}
            />
            <ExportRow
              title="Prompts de IA"
              desc="Briefings de site, redesign e Instagram"
              onClick={() => {
                downloadFile("prompts.txt", "Prompts simulados — implementação futura conecta com módulo de prompts.", "text/plain");
                toast.success("Arquivo gerado (mock)");
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ExportRow({ title, desc, onClick }: { title: string; desc: string; onClick: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
      <div className="min-w-0">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <Button size="sm" variant="outline" onClick={onClick}><FileDown className="h-3.5 w-3.5 mr-1.5" />Baixar</Button>
    </div>
  );
}

function downloadFile(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
