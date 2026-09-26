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
    id: "gargalo_vendas",
    titulo: "📊 Diagnóstico de Gargalo & Perda para Concorrentes",
    descricao: "Abordagem consultiva mostrando clientes perdidos nas buscas locais",
    gerar: (e: ContactableEmpresa) =>
      `Olá! Tudo bem? Me chamo [Seu Nome]. Estive analisando o fluxo de busca de clientes para o setor de ${e.segmento || "serviços"} em ${e.cidade || "sua região"} e notei que a ${e.nome} está perdendo vendas prontas para concorrentes por falta de um canal rápido de conversão e atendimento digital.\n\nPreparamos um diagnóstico rápido de 2 minutos apontando exatamente onde está esse gargalo de faturamento. Posso compartilhar com você por aqui?`,
  },
  {
    id: "erros_conversao",
    titulo: "🔍 Auditoria de Conversão & Otimização de ROI",
    descricao: "Foco nos erros técnicos e falhas que impedem o visitante de fechar negócio",
    gerar: (e: ContactableEmpresa) =>
      `Olá! Falo com o responsável comercial ou gestor da ${e.nome}? Estive analisando a presença digital de vocês e identifiquei 2 falhas críticas que fazem clientes desistirem da compra antes mesmo de entrar em contato.\n\nNosso foco não é 'site bonito', e sim gerar vendas previsíveis e retorno sobre investimento para ${e.segmento || "sua empresa"}. Gostaria de ver esse diagnóstico sem compromisso?`,
  },
  {
    id: "trafego_resultado",
    titulo: "📈 Captação de Clientes & Vendas Previsíveis",
    descricao: "Foco em orçamentos qualificados e geração direta de receita",
    gerar: (e: ContactableEmpresa) =>
      `Olá, equipe da ${e.nome}! Tudo bem? Analisando o mercado de ${e.cidade || "sua cidade"}, vimos que há uma demanda diária de pessoas buscando por ${e.segmento || "seus serviços"}, mas que hoje acabam comprando de outras empresas por falta de posicionamento estratégico.\n\nTrabalhamos com geração direta de orçamentos e receita no seu WhatsApp. Quando vocês teriam 5 minutos esta semana para avaliarmos os números da sua região?`,
  },
  {
    id: "contato_decisor",
    titulo: "💼 Abordagem Direta ao Sócio / Diretor",
    descricao: "Contato executivo focado em redução de custos de aquisição e eficiência",
    gerar: (e: ContactableEmpresa) =>
      `Olá! Gostaria de falar com o sócio ou diretor responsável pela estratégia de crescimento da ${e.nome}. Identificamos oportunidades claras no funil de captação de vocês em ${e.cidade || "sua região"} para aumentar o fechamento de novos clientes sem desperdício de verba. Quem seria a pessoa indicada para conversarmos?`,
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
