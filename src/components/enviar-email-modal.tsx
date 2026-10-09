import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Mail, Send, Check, ExternalLink, Sparkles, Settings2, ShieldCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { getComunicacaoSettings } from "@/lib/comunicacao-settings";
import { enviarEmailDireto_ServerFn } from "@/lib/comunicacao.functions";
import type { Empresa } from "@/lib/mock-data";
import { Link } from "@tanstack/react-router";

interface EnviarEmailModalProps {
  empresa: Empresa | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assuntoPadrao?: string;
  corpoPadrao?: string;
  onSuccess?: () => void;
}

export function EnviarEmailModal({
  empresa,
  open,
  onOpenChange,
  assuntoPadrao = "",
  corpoPadrao = "",
  onSuccess,
}: EnviarEmailModalProps) {
  const [destinatario, setDestinatario] = useState("");
  const [assunto, setAssunto] = useState("");
  const [corpo, setCorpo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [incluirCabecalhoAssinatura, setIncluirCabecalhoAssinatura] = useState(true);

  const config = getComunicacaoSettings().email;
  const smtpConfigurado = !!(config.host && config.user && config.pass);

  useEffect(() => {
    if (empresa) {
      setDestinatario(empresa.email || "");
      setAssunto(
        assuntoPadrao ||
          `Oportunidades de Otimização & Crescimento — ${empresa.nome} (${empresa.cidade})`,
      );
      setCorpo(
        corpoPadrao ||
          `Olá, equipe da ${empresa.nome}!\n\nAnalisamos a presença digital e processos da ${empresa.nome} em ${empresa.cidade} e mapeamos oportunidades práticas para estancar gargalos de captação e aumentar a lucratividade com Comunicação 360 e Sistemas.\n\nPreparamos uma Micro-Auditoria de 2 minutos que pode ser acessada neste link:\nhttps://locomotivacrm.com.br/auditoria/${empresa.id}\n\nFicamos à disposição para apresentar esse diagnóstico em uma conversa de 10 minutos.\n\nAtenciosamente,\nLocomotiva Comunicação`,
      );
    }
  }, [empresa, assuntoPadrao, corpoPadrao, open]);

  if (!empresa) return null;

  const handleEnviar = async () => {
    if (!destinatario.trim() || !destinatario.includes("@")) {
      toast.error("Informe um endereço de e-mail válido para o envio.");
      return;
    }

    if (!assunto.trim() || !corpo.trim()) {
      toast.error("Preencha o assunto e a mensagem.");
      return;
    }

    setEnviando(true);
    try {
      const res = await enviarEmailDireto_ServerFn({
        data: {
          para: destinatario.trim(),
          assunto: assunto.trim(),
          corpoTexto: corpo,
          config: incluirCabecalhoAssinatura ? config : undefined,
        },
      });

      if (res.sucesso) {
        if (res.modo === "smtp_real") {
          toast.success("E-mail disparado com sucesso via SMTP da Locomotiva Comunicação!");
        } else {
          toast.info("SMTP não configurado. Abrindo no cliente de e-mail padrão...");
          const mailto = `mailto:${destinatario}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
          window.open(mailto, "_blank");
        }
        onSuccess?.();
        onOpenChange(false);
      } else {
        toast.error(res.erro || "Falha no envio do e-mail.");
      }
    } catch (err: any) {
      toast.error(`Erro ao processar envio: ${err.message || "Erro desconhecido"}`);
    } finally {
      setEnviando(false);
    }
  };

  const handleAbrirClienteLocal = () => {
    const mailto = `mailto:${destinatario}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
    window.open(mailto, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg">
                  Disparo de E-mail Executivo — {empresa.nome}
                </DialogTitle>
                <DialogDescription>
                  Envio direto pelo servidor SMTP configurado ou pelo seu cliente de e-mail padrão.
                </DialogDescription>
              </div>
            </div>

            <Badge
              variant={smtpConfigurado ? "default" : "outline"}
              className={`text-xs ${smtpConfigurado ? "bg-emerald-600 text-white" : "text-amber-600 border-amber-500/30"}`}
            >
              {smtpConfigurado ? (
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> SMTP Ativo
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Modo Simulação / Mailto
                </span>
              )}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {!smtpConfigurado && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2">
              <span>
                💡 Configure o servidor SMTP e senha de app em <strong>Configurações &gt; E-mail</strong> para envio 100% automático.
              </span>
              <Button asChild variant="outline" size="sm" className="h-7 text-xs shrink-0">
                <Link to="/configuracoes" onClick={() => onOpenChange(false)}>
                  <Settings2 className="h-3 w-3 mr-1" /> Configurar SMTP
                </Link>
              </Button>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                E-mail de Destino:
              </label>
              <Input
                type="email"
                value={destinatario}
                onChange={(e) => setDestinatario(e.target.value)}
                placeholder="Ex: contato@empresa.com.br, diretor@empresa.com.br"
                className="text-sm font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Assunto:
              </label>
              <Input
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                placeholder="Assunto claro e profissional"
                className="text-sm font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Mensagem:
                </label>
                <label className="text-xs text-muted-foreground flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={incluirCabecalhoAssinatura}
                    onChange={(e) => setIncluirCabecalhoAssinatura(e.target.checked)}
                    className="rounded text-primary"
                  />
                  <span>Aplicar Topo & Assinatura da Locomotiva</span>
                </label>
              </div>
              <Textarea
                value={corpo}
                onChange={(e) => setCorpo(e.target.value)}
                rows={10}
                className="text-xs md:text-sm font-sans leading-relaxed"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAbrirClienteLocal}
              className="text-xs gap-1.5"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Abrir no Outlook / Gmail
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleEnviar}
                disabled={enviando}
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1.5 shadow"
              >
                <Send className={`h-3.5 w-3.5 ${enviando ? "animate-spin" : ""}`} />
                {enviando ? "Disparando E-mail..." : smtpConfigurado ? "Disparar via SMTP" : "Enviar E-mail"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
