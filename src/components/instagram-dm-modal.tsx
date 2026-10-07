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
import { Instagram, Send, Copy, Sparkles, Check, MessageCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export interface ContactableInstagramProfile {
  nome: string;
  handle: string; // e.g. "@vinicola" or "vinicola"
  instagramUrl?: string;
  cidade?: string;
  segmento?: string;
  site?: string;
  bio?: string;
}

interface InstagramDmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  perfil: ContactableInstagramProfile | null;
}

const INSTAGRAM_TEMPLATES = [
  {
    id: "dmam_dores",
    titulo: "⚡ Dores: O Problema Imediato ➔ Solução Rápida",
    descricao: "Mostre como sua solução resolve o gargalo de conversão rápido",
    gerar: (p: ContactableInstagramProfile) =>
      `Oi, equipe da ${p.nome}! 👋\n\nNotamos que vocês têm um perfil de qualidade, mas quem chega aqui em busca de ${p.segmento || "seus serviços"} não encontra um canal ágil e rápido para fechar negócio.\n\nEstruturamos uma solução rápida que resolve isso em poucos dias para captar contatos no ar. Posso te mandar uma demonstração de 2 minutos por aqui?`,
  },
  {
    id: "dmam_medos",
    titulo: "🛡️ Medos: O Risco de Não Mudar ➔ Segurança & Estabilidade",
    descricao: "Mostre como sua solução traz segurança contra o avanço da concorrência",
    gerar: (p: ContactableInstagramProfile) =>
      `Olá! Tudo bem? 🛡️ Observando o mercado de ${p.segmento || "empresas"} em ${p.cidade || "sua região"}, vemos concorrentes se posicionando forte para captar a atenção dos seus clientes.\n\nPara a ${p.nome} não correr o risco de perder espaço, criamos estratégias de blindagem digital que trazem estabilidade e segurança. Topam trocar uma ideia rápida?`,
  },
  {
    id: "dmam_ambicoes",
    titulo: "🚀 Ambições: Onde Querem Chegar ➔ Aceleração do Crescimento",
    descricao: "Mostre como sua solução acelera o crescimento e atrai clientes premium",
    gerar: (p: ContactableInstagramProfile) =>
      `Oi, ${p.nome}! 🚀 Parabéns pelo posicionamento. Vemos um potencial enorme para vocês acelerarem o crescimento e atraírem clientes de maior ticket médio.\n\nDesenvolvemos um plano de aceleração sob medida para marcas com a ambição de vocês. Posso te enviar um resumo da metodologia?`,
  },
  {
    id: "dmam_maturidade",
    titulo: "🎯 Maturidade: Capacidade de Implementação ➔ Suporte Sob Medida",
    descricao: "Adapte o onboarding e suporte à rotina da equipe sem atrito técnico",
    gerar: (p: ContactableInstagramProfile) =>
      `Oi, ${p.nome}! 👋 Sabemos o quanto a operação da empresa é corrida. Por isso, nosso modelo é 100% chave na mão: cuidamos de toda a implementação com suporte dedicado, sem exigir tempo da sua equipe.\n\nPosso te mostrar como nosso suporte se adapta à sua realidade?`,
  },
  {
    id: "gargalo_bio_conversao",
    titulo: "📊 Diagnóstico de Gargalo no Perfil",
    descricao: "Diagnóstico apontando perda de vendas na bio para concorrentes",
    gerar: (p: ContactableInstagramProfile) =>
      `Olá, equipe da ${p.nome}! 👋\n\nEstive analisando o perfil de vocês e notei um gargalo crítico: vocês produzem um ótimo conteúdo, mas o fluxo da bio não direciona o visitante para fechar negócio e acaba fazendo a ${p.nome} perder vendas para concorrentes de ${p.cidade || "sua região"} que já têm canais diretos de conversão.\n\nPreparamos um diagnóstico rápido de 2 minutos mostrando como corrigir esse vazamento de faturamento. Posso te enviar por aqui?`,
  },
  {
    id: "perda_concorrentes",
    titulo: "🔍 Auditoria de Conversão & Retorno Financeiro",
    descricao: "Foco nos erros que encarecem a captação e deixam dinheiro na mesa",
    gerar: (p: ContactableInstagramProfile) =>
      `Oi ${p.nome}! Tudo bem? 🎯\n\nFizemos uma análise comparativa do setor de ${p.segmento || "empresas"} em ${p.cidade || "sua cidade"} e encontramos 2 falhas na jornada digital que fazem clientes interessados desistirem antes de chamar no WhatsApp.\n\nNosso foco não é vender 'site bonito', e sim estruturar processos que geram retorno sobre investimento real. Gostariam de ver esses 2 pontos sem nenhum compromisso?`,
  },
];


export function limparUsernameInstagram(handleOrUrl?: string): string {
  if (!handleOrUrl) return "";
  let clean = handleOrUrl.trim();
  clean = clean.replace(/^https?:\/\/(?:www\.)?instagram\.com\//i, "");
  clean = clean.replace(/^@/, "");
  clean = clean.split("/")[0].split("?")[0].trim();
  return clean;
}

export function InstagramDmModal({
  open,
  onOpenChange,
  perfil,
}: InstagramDmModalProps) {
  const [templateAtivo, setTemplateAtivo] = useState("site_proposta");
  const [handleEditavel, setHandleEditavel] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (perfil) {
      const handle = perfil.handle.startsWith("@") ? perfil.handle : `@${perfil.handle}`;
      setHandleEditavel(handle);
      const tmpl = INSTAGRAM_TEMPLATES.find((t) => t.id === templateAtivo) || INSTAGRAM_TEMPLATES[0];
      setMensagem(tmpl.gerar(perfil));
    }
  }, [perfil, templateAtivo]);

  if (!perfil) return null;

  const selecionarTemplate = (tmplId: string) => {
    setTemplateAtivo(tmplId);
    const tmpl = INSTAGRAM_TEMPLATES.find((t) => t.id === tmplId);
    if (tmpl && perfil) {
      setMensagem(tmpl.gerar(perfil));
    }
  };

  const usernameLimpo = limparUsernameInstagram(handleEditavel || perfil.handle);

  const handleCopiar = async () => {
    try {
      await navigator.clipboard.writeText(mensagem);
      setCopiado(true);
      toast.success("Mensagem copiada para a área de transferência!");
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error("Falha ao copiar mensagem");
    }
  };

  const handleAbrirDm = () => {
    if (!usernameLimpo) {
      toast.error("Nome de usuário do Instagram inválido");
      return;
    }
    // Copia a mensagem automaticamente antes de abrir a DM
    navigator.clipboard.writeText(mensagem).catch(() => {});

    // Abre o link direto de DM no Instagram
    // https://ig.me/m/username é o link oficial de Direct Message do Instagram
    const igDirectUrl = `https://ig.me/m/${usernameLimpo}`;
    window.open(igDirectUrl, "_blank");

    toast.success(`Abrindo Direct de @${usernameLimpo}!`, {
      description: "A mensagem foi copiada para sua área de transferência para você colar na conversa.",
    });

    onOpenChange(false);
  };

  const handleAbrirPerfil = () => {
    if (!usernameLimpo) return;
    window.open(`https://instagram.com/${usernameLimpo}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white">
              <Instagram className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg flex items-center gap-2">
                Primeiro Contato via Direct do Instagram
              </DialogTitle>
              <DialogDescription className="text-xs">
                Mensagens persuasivas geradas por IA para prospecção no Instagram.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Resumo do Perfil */}
        <div className="bg-muted/40 border border-border/60 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <span className="font-semibold text-sm text-foreground">{perfil.nome}</span>
              {perfil.cidade && (
                <span className="text-xs text-muted-foreground ml-2">({perfil.cidade})</span>
              )}
            </div>
            {perfil.segmento && (
              <Badge variant="outline" className="text-[10px] font-normal">
                {perfil.segmento}
              </Badge>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-2 pt-1">
            <div>
              <label className="text-[11px] text-muted-foreground block mb-0.5">
                Usuário / @Perfil
              </label>
              <div className="flex items-center gap-1.5">
                <Input
                  value={handleEditavel}
                  onChange={(e) => setHandleEditavel(e.target.value)}
                  placeholder="@perfil"
                  className="text-xs font-mono h-8"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAbrirPerfil}
                  className="h-8 px-2 text-xs"
                  title="Abrir perfil no Instagram"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground block mb-0.5">Site Atual</label>
              <div className="text-xs text-muted-foreground truncate pt-1.5">
                {perfil.site ? (
                  <a
                    href={perfil.site.startsWith("http") ? perfil.site : `https://${perfil.site}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>{perfil.site}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30">
                    sem site cadastrado
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Seleção de Modelos IA */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-pink-500" />
            Selecione o Modelo de Abordagem:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {INSTAGRAM_TEMPLATES.map((tmpl) => {
              const active = tmpl.id === templateAtivo;
              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => selecionarTemplate(tmpl.id)}
                  className={`text-left p-2.5 rounded-lg border text-xs transition-all ${
                    active
                      ? "border-pink-500/80 bg-pink-500/10 text-foreground shadow-xs font-medium"
                      : "border-border/60 bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <div className="font-semibold text-foreground flex items-center justify-between">
                    <span>{tmpl.titulo}</span>
                    {active && <Check className="h-3.5 w-3.5 text-pink-500" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-tight">
                    {tmpl.descricao}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pré-visualização e Edição da Mensagem */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-foreground">
              Mensagem do Direct (Você pode editar livremente):
            </label>
            <span className="text-[10px] text-muted-foreground">
              {mensagem.length} caracteres
            </span>
          </div>
          <Textarea
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            rows={5}
            className="text-xs font-sans leading-relaxed resize-y"
            placeholder="Digite ou personalize a mensagem aqui..."
          />
        </div>

        <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-border/60">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopiar}
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
              className="text-xs flex-1 sm:flex-initial"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAbrirDm}
              className="text-xs bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 hover:from-purple-700 hover:via-pink-700 hover:to-amber-700 text-white shadow-xs flex-1 sm:flex-initial"
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              Abrir DM no Instagram
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
