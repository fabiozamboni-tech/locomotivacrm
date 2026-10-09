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
import { MessageCircle, Send, Check, ExternalLink, Sparkles, Settings2, Zap } from "lucide-react";
import { toast } from "sonner";
import { getComunicacaoSettings, type RespostaAutomaticaItem } from "@/lib/comunicacao-settings";
import { dispararWhatsApp_ServerFn } from "@/lib/comunicacao.functions";
import type { Empresa } from "@/lib/mock-data";
import { Link } from "@tanstack/react-router";

interface EnviarWhatsAppModalProps {
  empresa: Empresa | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mensagemPadrao?: string;
  onSuccess?: () => void;
}

export function EnviarWhatsAppModal({
  empresa,
  open,
  onOpenChange,
  mensagemPadrao = "",
  onSuccess,
}: EnviarWhatsAppModalProps) {
  const [numero, setNumero] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);

  const config = getComunicacaoSettings().whatsapp;
  const respostas = config.respostasAutomaticas || [];

  useEffect(() => {
    if (empresa) {
      setNumero(empresa.whatsapp || empresa.telefone || "");
      setMensagem(
        mensagemPadrao ||
          `Olá! Tudo bem?\n\nMe chamo [Seu Nome], da Locomotiva Comunicação.\n\nAcompanhamos o setor de ${empresa.segmento} em ${empresa.cidade} e identificamos gargalos de captação na presença digital da ${empresa.nome} que estão fazendo orçamentos irem para concorrentes.\n\nPreparamos uma Micro-Auditoria de 2 minutos sobre isso. Posso compartilhar o link com você?\n\nUm abraço!`,
      );
    }
  }, [empresa, mensagemPadrao, open]);

  if (!empresa) return null;

  const aplicarRespostaRapida = (resp: RespostaAutomaticaItem) => {
    let txt = resp.texto;
    txt = txt.replaceAll("[LinkAuditoria]", `https://locomotivacrm.com.br/auditoria/${empresa.id}`);
    txt = txt.replaceAll("[Empresa]", empresa.nome);
    txt = txt.replaceAll("[Cidade]", empresa.cidade);
    setMensagem(txt);
    toast.success(`Modelo "${resp.titulo}" aplicado!`);
  };

  const handleDisparar = async () => {
    const rawNumber = numero.replace(/\D/g, "");
    if (rawNumber.length < 10) {
      toast.error("Informe um número de WhatsApp válido com DDD.");
      return;
    }

    if (!mensagem.trim()) {
      toast.error("Preencha o texto da mensagem.");
      return;
    }

    setEnviando(true);
    try {
      const res = await dispararWhatsApp_ServerFn({
        data: {
          numero: rawNumber,
          mensagem: mensagem.trim(),
          gatewayTipo: config.gatewayTipo,
          apiUrl: config.apiUrl,
          apiKey: config.apiKey,
        },
      });

      if (res.sucesso) {
        if (res.modo === "gateway_api") {
          toast.success(res.detalhes || "Mensagem enviada com sucesso pelo Gateway WhatsApp!");
        } else {
          toast.success("Abrindo WhatsApp Web / Desktop...");
          if (res.directUrl) {
            window.open(res.directUrl, "_blank");
          }
        }
        onSuccess?.();
        onOpenChange(false);
      } else {
        toast.error(res.erro || "Falha no disparo.");
        if (res.directUrl) {
          window.open(res.directUrl, "_blank");
        }
      }
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg">
                  Disparo de WhatsApp — {empresa.nome}
                </DialogTitle>
                <DialogDescription>
                  Envio ágil com suporte a respostas automáticas da Locomotiva Comunicação.
                </DialogDescription>
              </div>
            </div>

            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
              {config.gatewayTipo === "web_link" ? "WhatsApp Web Oficial" : `Gateway ${config.gatewayTipo.toUpperCase()}`}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Seletor de Respostas Rápidas / Gatilhos */}
          {respostas.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5 flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                Respostas Automáticas & Scripts Cadastrados:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {respostas.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => aplicarRespostaRapida(r)}
                    className="text-xs px-2.5 py-1 rounded-full border bg-muted/40 hover:bg-emerald-500/10 hover:border-emerald-500/40 text-foreground transition-all text-left"
                  >
                    ⚡ {r.titulo}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Número do WhatsApp (com DDD):
              </label>
              <Input
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="Ex: 54999998888"
                className="text-sm font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1">
                Mensagem:
              </label>
              <Textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                rows={9}
                className="text-xs md:text-sm font-sans leading-relaxed"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t">
            <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground">
              <Link to="/configuracoes" onClick={() => onOpenChange(false)}>
                <Settings2 className="h-3.5 w-3.5 mr-1" /> Configurar Gateway / Respostas
              </Link>
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
                onClick={handleDisparar}
                disabled={enviando}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow"
              >
                <Send className={`h-3.5 w-3.5 ${enviando ? "animate-spin" : ""}`} />
                {enviando ? "Disparando..." : "Disparar no WhatsApp"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
