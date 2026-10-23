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
import {
  MessageCircle,
  Send,
  Check,
  ExternalLink,
  Sparkles,
  Settings2,
  Zap,
  Download,
  Server,
  Globe,
  CheckCheck,
} from "lucide-react";
import { toast } from "sonner";
import { getComunicacaoSettings, type RespostaAutomaticaItem } from "@/lib/comunicacao-settings";
import { dispararWhatsApp_ServerFn } from "@/lib/comunicacao.functions";
import { downloadVCardContato } from "@/lib/vcf-generator";
import { useStore } from "@/lib/store";
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
  const { updateEmpresa, addHistorico, setStage } = useStore();
  const [numero, setNumero] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);

  const config = getComunicacaoSettings().whatsapp;
  const respostas = config.respostasAutomaticas || [];

  useEffect(() => {
    if (empresa) {
      setNumero(empresa.whatsapp || empresa.telefone || "");
      let textoInicial =
        mensagemPadrao ||
        `Olá! Tudo bem?\n\nMe chamo Fábio, da Locomotiva Comunicação.\n\nAcompanhamos o setor de ${empresa.segmento} em ${empresa.cidade} e identificamos oportunidades valiosas na presença digital da ${empresa.nome}.\n\nPreparamos uma Micro-Auditoria de 2 minutos sobre isso. Posso compartilhar o link com você?\n\nUm abraço!`;

      if (config.nativoIncluirIdentificadorLead && !textoInicial.includes(`[Lead: ${empresa.nome}]`)) {
        textoInicial = `[Lead: ${empresa.nome}]\n${textoInicial}`;
      }

      setMensagem(textoInicial);
    }
  }, [empresa, mensagemPadrao, open, config.nativoIncluirIdentificadorLead]);

  if (!empresa) return null;

  const aplicarRespostaRapida = (resp: RespostaAutomaticaItem) => {
    let txt = resp.texto;
    txt = txt.replaceAll("[LinkAuditoria]", `https://locomotivacrm.com.br/auditoria/${empresa.id}`);
    txt = txt.replaceAll("[Empresa]", empresa.nome);
    txt = txt.replaceAll("[Cidade]", empresa.cidade);
    setMensagem(txt);
    toast.success(`Modelo "${resp.titulo}" aplicado!`);
  };

  const handleBaixarVCard = () => {
    downloadVCardContato({
      nome: empresa.nome,
      telefone: empresa.telefone,
      whatsapp: empresa.whatsapp,
      cidade: empresa.cidade,
      segmento: empresa.segmento,
      email: empresa.email,
      site: empresa.site,
      cnpj: empresa.cnpj,
      endereco: empresa.endereco,
    });
    toast.success(`Cartão de contato (.vcf) de "${empresa.nome}" baixado!`);
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
          empresaId: empresa.id,
          empresaNome: empresa.nome,
          gatewayTipo: config.gatewayTipo,
          evolutionUrl: config.evolutionUrl,
          evolutionInstance: config.evolutionInstance,
          evolutionApiKey: config.evolutionApiKey,
          evolutionFallbackNativo: config.evolutionFallbackNativo,
          apiUrl: config.apiUrl,
          apiKey: config.apiKey,
        },
      });

      const modoEnvio = config.gatewayTipo === "evolution_api" && res.modo === "evolution_api" && res.sucesso ? "evolution" : "nativo";

      // 1. Atualiza dados da empresa
      updateEmpresa(empresa.id, {
        whatsappStatus: "enviado",
        whatsappUltimoEnvio: new Date().toISOString(),
        whatsappUltimaMensagem: mensagem.trim(),
        whatsappModoEnvio: modoEnvio,
      });

      // 2. Se configurado, move etapa do kanban
      if (
        config.nativoAutoMoverKanban &&
        (empresa.crmStage === "identificado" || empresa.crmStage === "analisado" || empresa.crmStage === "contato_preparado")
      ) {
        setStage(empresa.id, config.nativoKanbanStageDestino || "primeiro_contato");
      }

      // 3. Registra na timeline do cliente
      addHistorico(empresa.id, {
        data: new Date().toISOString().slice(0, 10),
        tipo: "whatsapp",
        texto: `WhatsApp disparado via ${
          modoEnvio === "evolution"
            ? `Evolution API (Instância: ${config.evolutionInstance})`
            : "WhatsApp Web Oficial"
        }.\nMensagem: "${mensagem.slice(0, 160)}${mensagem.length > 160 ? "..." : ""}"`,
      });

      if (res.sucesso) {
        if (res.modo === "evolution_api") {
          toast.success(res.detalhes || "Mensagem enviada com sucesso em segundo plano via Evolution API!");
        } else {
          toast.success("Abrindo WhatsApp Web / Desktop...");
          if (res.directUrl) {
            window.open(res.directUrl, "_blank");
          }
        }
        onSuccess?.();
        onOpenChange(false);
      } else {
        if (res.fallbackAcionado && res.directUrl) {
          toast.warning(res.erro || "Falha na Evolution API. Abrindo contingência via WhatsApp Web!");
          window.open(res.directUrl, "_blank");
          onSuccess?.();
          onOpenChange(false);
        } else {
          toast.error(res.erro || "Falha no disparo.");
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
                  Envio ágil com histórico automático no CRM e suporte à Evolution API.
                </DialogDescription>
              </div>
            </div>

            {config.gatewayTipo === "evolution_api" ? (
              <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1.5 py-1 px-2.5">
                <Server className="h-3 w-3" /> Evolution API Ativa
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30 gap-1.5 py-1 px-2.5">
                <Globe className="h-3 w-3" /> WhatsApp Web Oficial
              </Badge>
            )}
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
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1">
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

              <div className="pt-5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleBaixarVCard}
                  className="h-9 text-xs gap-1.5 border-dashed text-muted-foreground hover:text-foreground"
                  title="Baixa um arquivo .vcf com o nome, telefone e empresa para salvar na agenda do celular"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-600" /> Baixar Contato (.vcf)
                </Button>
              </div>
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
                <Settings2 className="h-3.5 w-3.5 mr-1" /> Configurar Gateway / Scripts
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
                {enviando
                  ? "Disparando..."
                  : config.gatewayTipo === "evolution_api"
                  ? "Disparar via Evolution API"
                  : "Abrir no WhatsApp Web"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
