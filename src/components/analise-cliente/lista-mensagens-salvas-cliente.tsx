import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { MensagemAbordagemSalva } from "@/lib/mock-data";
import {
  History,
  RotateCcw,
  Copy,
  Trash2,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Mail,
  Instagram,
  FileText,
  Phone,
  Clock,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ListaMensagensSalvasClienteProps {
  mensagens: MensagemAbordagemSalva[];
  canalAtivo: string;
  onRestaurarMensagem: (msg: MensagemAbordagemSalva) => void;
  onExcluirMensagem: (msgId: string) => void;
  empresaNome: string;
}

export function ListaMensagensSalvasCliente({
  mensagens,
  canalAtivo,
  onRestaurarMensagem,
  onExcluirMensagem,
  empresaNome,
}: ListaMensagensSalvasClienteProps) {
  const [aberto, setAberto] = useState(true);
  const [apenasCanalAtivo, setApenasCanalAtivo] = useState(false);
  const [mensagemExpandidaId, setMensagemExpandidaId] = useState<string | null>(null);

  const mensagensFiltradas = apenasCanalAtivo
    ? mensagens.filter((m) => m.canal === canalAtivo)
    : mensagens;

  const handleCopiar = (texto: string) => {
    navigator.clipboard.writeText(texto);
    toast.success("Mensagem copiada para a área de transferência!");
  };

  const getCanalBadge = (canal: string) => {
    switch (canal) {
      case "whatsapp":
        return (
          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1">
            <MessageCircle className="h-3 w-3" /> WhatsApp
          </Badge>
        );
      case "email":
        return (
          <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/30 gap-1">
            <Mail className="h-3 w-3" /> E-mail
          </Badge>
        );
      case "instagram":
        return (
          <Badge variant="outline" className="text-[10px] bg-pink-500/10 text-pink-600 border-pink-500/30 gap-1">
            <Instagram className="h-3 w-3" /> Instagram
          </Badge>
        );
      case "ligacaoReuniao":
        return (
          <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-600 border-purple-500/30 gap-1">
            <Phone className="h-3 w-3" /> Ligação / Áudio
          </Badge>
        );
      case "propostaValor360":
        return (
          <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30 gap-1">
            <FileText className="h-3 w-3" /> Proposta 360
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px]">
            {canal}
          </Badge>
        );
    }
  };

  const formatarData = (dataIso: string) => {
    try {
      return format(new Date(dataIso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dataIso;
    }
  };

  if (!mensagens || mensagens.length === 0) {
    return (
      <div className="p-3.5 rounded-xl border border-dashed border-border/80 bg-muted/10 text-center space-y-1">
        <p className="text-xs text-muted-foreground font-medium">
          Nenhuma mensagem personalizada salva ainda para <strong>{empresaNome}</strong>.
        </p>
        <p className="text-[11px] text-muted-foreground">
          Ao editar o texto acima e clicar em <strong>Salvar no Dossiê / Salvar Mensagem</strong>, uma cópia com timestamp será arquivada aqui automaticamente para este cliente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 border border-border/80 rounded-xl bg-card p-3.5 shadow-xs">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary shrink-0" />
          <h4 className="text-xs font-bold text-foreground">
            Mensagens Salvas Deste Cliente ({mensagens.length})
          </h4>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setApenasCanalAtivo((v) => !v)}
            className="h-6 text-[10px] px-2 text-muted-foreground hover:text-foreground"
          >
            {apenasCanalAtivo ? "Mostrar todos os canais" : `Filtrar apenas ${canalAtivo}`}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setAberto((v) => !v)}
            className="h-6 w-6 p-0"
            title={aberto ? "Recolher mensagens salvas" : "Expandir mensagens salvas"}
          >
            {aberto ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {aberto && (
        <div className="space-y-2 pt-1 max-h-[340px] overflow-y-auto pr-1">
          {mensagensFiltradas.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              Nenhuma mensagem salva para o canal {canalAtivo}.
            </p>
          ) : (
            mensagensFiltradas.map((msg) => {
              const expandida = mensagemExpandidaId === msg.id;
              return (
                <Card
                  key={msg.id}
                  className="border-border/70 bg-muted/20 hover:bg-muted/40 transition-colors text-left"
                >
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getCanalBadge(msg.canal)}
                        {msg.tomNome && (
                          <span className="text-[11px] font-semibold text-foreground/80">
                            {msg.tomNome}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                          <Clock className="h-3 w-3" />
                          {formatarData(msg.salvoEm)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onRestaurarMensagem(msg)}
                          className="h-6 text-[10px] px-2 gap-1 text-primary hover:bg-primary/10"
                          title="Carregar este texto de volta no editor"
                        >
                          <RotateCcw className="h-2.5 w-2.5" /> Restaurar no Editor
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopiar(msg.texto)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                          title="Copiar texto"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onExcluirMensagem(msg.id)}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                          title="Excluir mensagem salva"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div
                      onClick={() => setMensagemExpandidaId(expandida ? null : msg.id)}
                      className="cursor-pointer text-[11px] font-mono leading-relaxed bg-background/80 p-2.5 rounded-md border text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {expandida ? (
                        <div className="whitespace-pre-wrap">{msg.texto}</div>
                      ) : (
                        <div className="line-clamp-2">{msg.texto}</div>
                      )}
                      <div className="text-[9px] text-muted-foreground/60 text-right mt-1 font-sans">
                        {expandida ? "Clique para recolher" : "Clique para ver texto completo"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
