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
import { Badge } from "@/components/ui/badge";
import { Linkedin, Copy, Sparkles, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export interface ContactableLinkedInProfile {
  nome: string;
  cargo?: string;
  empresa?: string;
  linkedinUrl?: string;
  cidade?: string;
  segmento?: string;
  email?: string;
}

interface LinkedInMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  perfil: ContactableLinkedInProfile | null;
}

const LINKEDIN_TEMPLATES = [
  {
    id: "founder_gargalo",
    titulo: "💼 Abordagem para Founder / Sócio (Gargalo de Aquisição)",
    descricao: "Foco em ROI, previsibilidade comercial e oportunidades de mercado",
    gerar: (p: ContactableLinkedInProfile) =>
      `Olá, ${p.nome.split(" ")[0]}! Tudo bem?\n\nAcompanho sua trajetória e a atuação da ${p.empresa || "sua empresa"} no mercado de ${p.segmento || "destaque"}. Estive analisando o ecossistema comercial na região de ${p.cidade || "atuação"} e identifiquei um gargalo frequente que faz empresas consolidadas perderem contratos para concorrentes menores por falta de um funil digital de alta conversão.\n\nPreparamos um diagnóstico executivo de 3 minutos apontando onde estão esses pontos cegos de receita. Seria interessante conversarmos brevemente esta semana?`,
  },
  {
    id: "marketing_conversao",
    titulo: "🎯 Head de Marketing / Vendas (Otimização de Pipeline)",
    descricao: "Foco técnico em custo por lead (CPA), taxa de conversão e fechamento",
    gerar: (p: ContactableLinkedInProfile) =>
      `Olá, ${p.nome.split(" ")[0]}! Como vai?\n\nVi seu trabalho à frente de ${p.cargo || "Marketing/Crescimento"} na ${p.empresa || "sua empresa"}. Fizemos uma auditoria rápida na jornada de conversão e identificamos 2 oportunidades claras para aumentar a taxa de geração de oportunidades comerciais sem precisar inflacionar o orçamento de mídia.\n\nNosso foco é exclusivamente geração de resultados mensuráveis. Gostaria de dar uma olhada nesse estudo sem compromisso?`,
  },
  {
    id: "autoridade_b2b",
    titulo: "🏢 Posicionamento Estratégico B2B & Autoridade",
    descricao: "Para empresas que precisam de presença corporativa forte para fechar contas maiores",
    gerar: (p: ContactableLinkedInProfile) =>
      `Olá, ${p.nome.split(" ")[0]}! Parabéns pelos resultados com a ${p.empresa || "empresa"}.\n\nTrabalhamos ajudando organizações do setor de ${p.segmento || "B2B"} a transformarem sua presença institucional em um canal ativo de prospecção e fechamento de novos clientes corporativos.\n\nQuando você teria 5 minutos para avaliarmos o potencial de escala para o seu modelo de negócio?`,
  },
  {
    id: "nota_conexao",
    titulo: "⚡ Nota Curta de Conexão (Limite de 300 caracteres)",
    descricao: "Mensagem concisa e objetiva para enviar junto com o pedido de conexão",
    gerar: (p: ContactableLinkedInProfile) =>
      `Olá ${p.nome.split(" ")[0]}, acompanho seu trabalho na ${p.empresa || "sua empresa"}. Notei algumas oportunidades interessantes de crescimento comercial no setor de ${p.segmento || "atuação"} em ${p.cidade || "sua região"} e gostaria de conectar para trocarmos experiências. Um abraço!`,
  },
];

export function LinkedInMessageModal({
  open,
  onOpenChange,
  perfil,
}: LinkedInMessageModalProps) {
  const [templateAtivo, setTemplateAtivo] = useState("founder_gargalo");
  const [mensagem, setMensagem] = useState("");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (perfil) {
      const tmpl = LINKEDIN_TEMPLATES.find((t) => t.id === templateAtivo) || LINKEDIN_TEMPLATES[0];
      setMensagem(tmpl.gerar(perfil));
    }
  }, [perfil, templateAtivo]);

  if (!perfil) return null;

  const selecionarTemplate = (tmplId: string) => {
    setTemplateAtivo(tmplId);
    const tmpl = LINKEDIN_TEMPLATES.find((t) => t.id === tmplId);
    if (tmpl && perfil) {
      setMensagem(tmpl.gerar(perfil));
    }
  };

  const copiarMensagem = async () => {
    try {
      await navigator.clipboard.writeText(mensagem);
      setCopiado(true);
      toast.success("Mensagem copiada para a área de transferência!");
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      toast.error("Não foi possível copiar automaticamente.");
    }
  };

  const abrirLinkedIn = () => {
    if (!perfil.linkedinUrl) {
      toast.error("URL do LinkedIn não informada");
      return;
    }
    copiarMensagem();
    window.open(perfil.linkedinUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-2xl max-h-[90vh] flex flex-col p-6">
        <DialogHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-sky-600/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              <Linkedin className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base flex items-center gap-2">
                Abordagem Consultiva no LinkedIn
                <Badge variant="secondary" className="text-[10px] font-normal">
                  InMail & Conexão IA
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Mensagens orientadas a tomadores de decisão, focadas em diagnósticos de erro e ROI.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-3 overflow-y-auto flex-1 pr-1">
          {/* Card com resumo do perfil e decisor */}
          <div className="rounded-lg border border-border/60 bg-muted/30 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5 min-w-0">
              <div className="font-semibold text-foreground flex items-center gap-1.5 flex-wrap">
                <span>{perfil.nome}</span>
                {perfil.cargo && (
                  <Badge variant="outline" className="text-[10px] font-normal bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30">
                    {perfil.cargo}
                  </Badge>
                )}
              </div>
              <div className="text-muted-foreground truncate">
                {[perfil.empresa, perfil.cidade, perfil.segmento].filter(Boolean).join(" · ")}
              </div>
            </div>

            {perfil.linkedinUrl && (
              <a
                href={perfil.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline font-medium shrink-0"
              >
                <span>Ver Perfil LinkedIn</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          {/* Seleção de Templates */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-sky-600" />
              Selecione o Modelo de Abordagem:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {LINKEDIN_TEMPLATES.map((tmpl) => {
                const ativo = templateAtivo === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => selecionarTemplate(tmpl.id)}
                    className={`text-left p-2.5 rounded-lg border transition-all text-xs cursor-pointer ${
                      ativo
                        ? "border-sky-500/80 bg-sky-500/10 text-foreground font-medium shadow-xs ring-1 ring-sky-500/30"
                        : "border-border/60 bg-card hover:bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    <div className="font-semibold text-foreground truncate">{tmpl.titulo}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                      {tmpl.descricao}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editor de Texto da Mensagem */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">Mensagem Personalizada:</span>
              <span className="text-muted-foreground text-[11px]">
                {mensagem.length} caracteres
              </span>
            </div>
            <Textarea
              rows={6}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Digite ou edite o texto da mensagem..."
              className="font-sans text-xs leading-relaxed"
            />
          </div>
        </div>

        <DialogFooter className="pt-3 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copiarMensagem}
            className="w-full sm:w-auto text-xs"
          >
            {copiado ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Copiar Texto
              </>
            )}
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto text-xs text-muted-foreground"
            >
              Fechar
            </Button>
            {perfil.linkedinUrl && (
              <Button
                type="button"
                size="sm"
                onClick={abrirLinkedIn}
                className="w-full sm:w-auto text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-xs"
              >
                <Linkedin className="h-3.5 w-3.5 mr-1.5" />
                Copiar & Abrir LinkedIn
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
