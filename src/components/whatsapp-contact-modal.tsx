import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Copy, Sparkles, Phone, Check } from "lucide-react";
import { toast } from "sonner";

export interface ContactableEmpresa {
  nome: string;
  razaoSocial?: string;
  cidade?: string;
  segmento?: string;
  telefone?: string;
  whatsapp?: string;
  site?: string;
}

interface WhatsAppContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresa: ContactableEmpresa | null;
}

const TEMPLATES = [
  {
    id: "site",
    titulo: "🌐 Criação / Redesign de Site",
    descricao: "Para oferecer desenvolvimento ou melhoria de site profissional",
    gerar: (e: ContactableEmpresa) =>
      `Olá! Tudo bem? Me chamo [Seu Nome]. Notei a presença da ${e.nome} em ${e.cidade || "sua região"} e gostaria de apresentar uma proposta rápida e sem compromisso para criar/modernizar o site da sua empresa e ampliar sua captação de clientes. Podemos conversar?`,
  },
  {
    id: "trafego",
    titulo: "🚀 Tráfego Pago & Anúncios",
    descricao: "Captação de novos clientes via Google Ads e Meta Ads",
    gerar: (e: ContactableEmpresa) =>
      `Olá, equipe da ${e.nome}! Tudo bem? Trabalhamos com geração de novos clientes e vendas através de anúncios segmentados no Google e Instagram para o setor de ${e.segmento || "empresas"} em ${e.cidade || "sua cidade"}. Gostariam de receber um diagnóstico gratuito sobre o potencial de captação na sua região?`,
  },
  {
    id: "redes",
    titulo: "📸 Gestão de Instagram & Redes",
    descricao: "Posicionamento digital e produção de conteúdo",
    gerar: (e: ContactableEmpresa) =>
      `Olá! Estive acompanhando o trabalho da ${e.nome} e identificamos excelentes oportunidades para potencializar o alcance, engajamento e vendas através do Instagram e mídias sociais. Quando teriam 5 minutos para conversarmos esta semana?`,
  },
  {
    id: "comercial",
    titulo: "💼 Apresentação Comercial Geral",
    descricao: "Primeiro contato direto com tomador de decisão",
    gerar: (e: ContactableEmpresa) =>
      `Olá! Gostaria de falar com o responsável comercial ou de marketing da ${e.nome}. Temos soluções sob medida para otimizar os processos e atrair novas oportunidades de negócio para a empresa. Como posso falar com ele?`,
  },
];

export function limparNumeroWhatsApp(telefone?: string): string {
  if (!telefone) return "";
  let digits = telefone.replace(/\D/g, "");
  // Se não começar com código do país (55), adiciona 55 se tiver 10 ou 11 dígitos
  if (digits.length === 10 || digits.length === 11) {
    digits = `55${digits}`;
  }
  return digits;
}

export function WhatsAppContactModal({
  open,
  onOpenChange,
  empresa,
}: WhatsAppContactModalProps) {
  const [templateAtivo, setTemplateAtivo] = useState("site");
  const [telefoneEditavel, setTelefoneEditavel] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (empresa) {
      const tel = empresa.whatsapp || empresa.telefone || "";
      setTelefoneEditavel(tel);
      const tmpl = TEMPLATES.find((t) => t.id === templateAtivo) || TEMPLATES[0];
      setMensagem(tmpl.gerar(empresa));
    }
  }, [empresa, templateAtivo]);

  if (!empresa) return null;

  const selecionarTemplate = (tmplId: string) => {
    setTemplateAtivo(tmplId);
    const tmpl = TEMPLATES.find((t) => t.id === tmplId);
    if (tmpl && empresa) {
      setMensagem(tmpl.gerar(empresa));
    }
  };

  const copiarMensagem = () => {
    navigator.clipboard.writeText(mensagem);
    setCopiado(true);
    toast.success("Mensagem copiada para a área de transferência!");
    setTimeout(() => setCopiado(false), 2000);
  };

  const enviarWhatsApp = () => {
    const rawNumber = limparNumeroWhatsApp(telefoneEditavel);
    if (!rawNumber || rawNumber.length < 8) {
      toast.error("Número de telefone/WhatsApp inválido ou incompleto.");
      return;
    }
    const url = `https://wa.me/${rawNumber}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, "_blank");
    toast.success(`Abrindo WhatsApp para ${empresa.nome}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <MessageSquare className="h-5 w-5" />
            <DialogTitle className="text-base font-semibold text-foreground">
              Iniciar Primeiro Contato via WhatsApp
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Escolha uma abordagem estratégica para <strong>{empresa.nome}</strong> ou personalize o texto antes de enviar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Informações da Empresa */}
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-semibold text-foreground">{empresa.nome}</span>
              {empresa.segmento && (
                <Badge variant="outline" className="text-[10px]">
                  {empresa.segmento}
                </Badge>
              )}
            </div>
            {empresa.razaoSocial && empresa.razaoSocial !== empresa.nome && (
              <div className="text-muted-foreground font-mono text-[11px]">
                Razão: {empresa.razaoSocial}
              </div>
            )}
            <div className="text-muted-foreground flex items-center gap-3 flex-wrap">
              {empresa.cidade && <span>📍 {empresa.cidade}</span>}
              {empresa.site && <span>🌐 {empresa.site.replace(/^https?:\/\//, "")}</span>}
            </div>
          </div>

          {/* Telefone / WhatsApp */}
          <div>
            <label className="text-xs font-medium text-foreground block mb-1 flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-emerald-500" />
              Número do WhatsApp / Telefone:
            </label>
            <Input
              value={telefoneEditavel}
              onChange={(e) => setTelefoneEditavel(e.target.value)}
              placeholder="ex: (54) 99988-7766 ou 5554999887766"
              className="text-xs font-mono"
            />
          </div>

          {/* Seletor de Templates */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Modelos de Mensagem para Primeiro Contato:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TEMPLATES.map((tmpl) => {
                const ativo = templateAtivo === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => selecionarTemplate(tmpl.id)}
                    className={`text-left p-2.5 rounded-lg border text-xs transition-all cursor-pointer ${
                      ativo
                        ? "border-emerald-500 bg-emerald-500/10 text-foreground font-medium shadow-sm ring-1 ring-emerald-500/30"
                        : "border-border/60 bg-card hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    <div className="font-semibold text-[11px] text-foreground mb-0.5">
                      {tmpl.titulo}
                    </div>
                    <div className="text-[10px] text-muted-foreground line-clamp-1">
                      {tmpl.descricao}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Edição do Texto da Mensagem */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">
                Mensagem a ser enviada (editável):
              </label>
              <button
                type="button"
                onClick={copiarMensagem}
                className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
              >
                {copiado ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                {copiado ? "Copiado!" : "Copiar texto"}
              </button>
            </div>
            <Textarea
              rows={4}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              className="text-xs leading-relaxed"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={enviarWhatsApp}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            Abrir WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
