import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Monitor,
  Tablet,
  Smartphone,
  ExternalLink,
  Download,
  Copy,
  Check,
  Sparkles,
  Search,
  Code2,
  Eye,
  Save,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import type { Empresa } from "@/lib/mock-data";
import type { PesquisaWebSiteResult } from "@/lib/site-generator.server";

interface SitePreviewModalProps {
  empresa: Empresa | null | undefined;
  html: string;
  pesquisaWeb?: PesquisaWebSiteResult | null;
  providerUsed?: string;
  modelUsed?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SitePreviewModal({
  empresa,
  html,
  pesquisaWeb,
  providerUsed,
  modelUsed,
  open,
  onOpenChange,
}: SitePreviewModalProps) {
  const { updateEmpresa, addHistorico } = useStore();
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [viewMode, setViewMode] = useState<"preview" | "code" | "pesquisa">("preview");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!empresa || !html) return null;

  const handleCopiarHtml = async () => {
    await navigator.clipboard.writeText(html);
    setCopied(true);
    toast.success("Código HTML completo copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadHtml = () => {
    const filename = `${empresa.nome.toLowerCase().replace(/[^a-z0-9]/g, "_")}_site_locomotiva.html`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Arquivo ${filename} baixado com sucesso!`);
  };

  const handleAbrirNovaAba = () => {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  const handleSalvarNoCadastro = async () => {
    setSaving(true);
    try {
      updateEmpresa(empresa.id, {
        siteGeradoHtml: html,
        siteGeradoData: new Date().toISOString(),
      });
      addHistorico(empresa.id, {
        data: new Date().toISOString().slice(0, 10),
        tipo: "nota",
        texto: `Site completo gerado com IA e pesquisa web (Padrões 21st.dev) · Provedor: ${providerUsed || "IA"} (${modelUsed || "auto"})`,
      });
      toast.success("Site gerado salvo com sucesso no cadastro da empresa!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar site na empresa");
    } finally {
      setSaving(false);
    }
  };

  const handleCompartilharWhatsApp = () => {
    const telefone = (empresa.whatsapp || empresa.telefone || "").replace(/\D/g, "");
    const msg = `Olá! Aqui é da Locomotiva Comunicação. Desenvolvemos uma demonstração exclusiva e personalizada de como pode ficar o novo site da *${empresa.nome}*, focado em acelerar as vendas e o atendimento em ${empresa.cidade}.\n\nPodemos te apresentar uma rápida prévia sem compromisso?`;
    const url = `https://wa.me/55${telefone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1400px] h-[92vh] p-0 gap-0 overflow-hidden flex flex-col bg-slate-950 border-slate-800 text-slate-100">
        
        {/* HEADER */}
        <DialogHeader className="p-4 px-6 border-b border-slate-800 bg-slate-900/80 flex-row items-center justify-between shrink-0">
          <div className="min-w-0 pr-4">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
                <Sparkles className="size-4" />
              </div>
              <DialogTitle className="text-base font-bold text-white truncate">
                Site Interativo Gerado · {empresa.nome}
              </DialogTitle>
              <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/30">
                21st.dev Design System
              </Badge>
              {providerUsed && (
                <Badge variant="outline" className="text-[10px] bg-slate-800 text-slate-400 border-slate-700 hidden sm:inline-flex">
                  {providerUsed} · {modelUsed}
                </Badge>
              )}
            </div>
            <DialogDescription className="text-xs text-slate-400 mt-0.5 truncate">
              {empresa.segmento} · {empresa.areaAtuacao || "Área Especializada"} · {empresa.cidade}/RS
            </DialogDescription>
          </div>

          {/* VIEW CONTROLS & ACTIONS */}
          <div className="flex items-center gap-2">
            
            {/* View Mode Toggle */}
            <div className="bg-slate-800 p-0.5 rounded-lg border border-slate-700 hidden sm:flex">
              <Button
                size="sm"
                variant={viewMode === "preview" ? "secondary" : "ghost"}
                className="h-7 text-xs px-2.5 gap-1.5"
                onClick={() => setViewMode("preview")}
              >
                <Eye className="size-3.5" /> Preview
              </Button>
              <Button
                size="sm"
                variant={viewMode === "code" ? "secondary" : "ghost"}
                className="h-7 text-xs px-2.5 gap-1.5"
                onClick={() => setViewMode("code")}
              >
                <Code2 className="size-3.5" /> Código
              </Button>
              {pesquisaWeb && (
                <Button
                  size="sm"
                  variant={viewMode === "pesquisa" ? "secondary" : "ghost"}
                  className="h-7 text-xs px-2.5 gap-1.5"
                  onClick={() => setViewMode("pesquisa")}
                >
                  <Search className="size-3.5" /> Pesquisa Web
                </Button>
              )}
            </div>

            {/* Device Switcher (only in preview mode) */}
            {viewMode === "preview" && (
              <div className="bg-slate-800 p-0.5 rounded-lg border border-slate-700 flex">
                <Button
                  size="icon"
                  variant={device === "desktop" ? "secondary" : "ghost"}
                  className="size-7"
                  title="Desktop (100%)"
                  onClick={() => setDevice("desktop")}
                >
                  <Monitor className="size-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant={device === "tablet" ? "secondary" : "ghost"}
                  className="size-7"
                  title="Tablet (768px)"
                  onClick={() => setDevice("tablet")}
                >
                  <Tablet className="size-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant={device === "mobile" ? "secondary" : "ghost"}
                  className="size-7"
                  title="Mobile (375px)"
                  onClick={() => setDevice("mobile")}
                >
                  <Smartphone className="size-3.5" />
                </Button>
              </div>
            )}

            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-slate-700 hover:bg-slate-800 text-slate-300 gap-1"
              onClick={handleAbrirNovaAba}
              title="Abrir em Nova Aba"
            >
              <ExternalLink className="size-3.5" />
              <span className="hidden md:inline">Nova Aba</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-slate-700 hover:bg-slate-800 text-slate-300 gap-1"
              onClick={handleDownloadHtml}
              title="Baixar Arquivo HTML"
            >
              <Download className="size-3.5" />
              <span className="hidden md:inline">Baixar HTML</span>
            </Button>

            <Button
              size="sm"
              className="h-7 text-xs bg-blue-600 hover:bg-blue-500 text-white gap-1"
              onClick={handleSalvarNoCadastro}
              disabled={saving}
            >
              <Save className="size-3.5" />
              <span>{saving ? "Salvando..." : "Salvar no CRM"}</span>
            </Button>

            <Button
              size="sm"
              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white gap-1"
              onClick={handleCompartilharWhatsApp}
              title="Compartilhar Demonstração via WhatsApp"
            >
              <MessageCircle className="size-3.5" />
              <span className="hidden lg:inline">Chamar Lead</span>
            </Button>
          </div>
        </DialogHeader>

        {/* BODY AREA */}
        <div className="flex-1 overflow-hidden relative bg-slate-900/50 flex items-center justify-center">
          
          {/* VIEW: LIVE PREVIEW IFRAME */}
          {viewMode === "preview" && (
            <div
              className={`h-full transition-all duration-300 bg-white overflow-hidden shadow-2xl relative ${
                device === "desktop"
                  ? "w-full"
                  : device === "tablet"
                  ? "w-[768px] border-x border-slate-700 rounded-lg my-2"
                  : "w-[385px] border-x border-slate-700 rounded-2xl my-2"
              }`}
            >
              <iframe
                title="Prévia do Site Gerado"
                srcDoc={html}
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                className="w-full h-full border-0"
              />
            </div>
          )}

          {/* VIEW: SOURCE CODE */}
          {viewMode === "code" && (
            <div className="w-full h-full p-4 overflow-auto flex flex-col">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs text-slate-400">
                <span>Código HTML5 autônomo com Tailwind CSS e animações 21st.dev</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-[11px] gap-1 border-slate-700"
                  onClick={handleCopiarHtml}
                >
                  {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                  {copied ? "Copiado!" : "Copiar Código"}
                </Button>
              </div>
              <textarea
                value={html}
                readOnly
                className="w-full flex-1 p-4 bg-slate-950 font-mono text-xs text-slate-300 rounded-xl border border-slate-800 resize-none focus:outline-none"
              />
            </div>
          )}

          {/* VIEW: PESQUISA WEB */}
          {viewMode === "pesquisa" && pesquisaWeb && (
            <div className="w-full h-full p-6 overflow-auto max-w-4xl space-y-5">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Search className="size-4 text-blue-400" /> Consulta Realizada na Web
                </h3>
                <p className="font-mono text-xs text-blue-300 bg-slate-950 p-3 rounded-lg border border-slate-800 mt-2">
                  {pesquisaWeb.query}
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-2">Dados e Diferenciais Detectados</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase">Serviços Extraídos:</span>
                    <ul className="mt-1 space-y-1 text-xs text-slate-200">
                      {pesquisaWeb.servicosDetectados.map((s, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <Check className="size-3 text-emerald-400 shrink-0" /> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase">Diferenciais de Mercado:</span>
                    <ul className="mt-1 space-y-1 text-xs text-slate-200">
                      {pesquisaWeb.diferenciaisDetectados.map((d, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <Sparkles className="size-3 text-indigo-400 shrink-0" /> {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {pesquisaWeb.snippets.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-white mb-2">Snippets Coletados da Internet</h3>
                  <div className="space-y-2">
                    {pesquisaWeb.snippets.map((snip, idx) => (
                      <div key={idx} className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-300">
                        {snip}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
