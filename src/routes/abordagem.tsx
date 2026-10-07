import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { gerarAbordagem, type Canal, type Foco, type Tom } from "@/lib/generators";
import {
  gerarAbordagemIA,
  gerarVariacoesAbordagemIA,
  gerarMatrizDMAM_IA,
  toCtx,
  type VariacaoAbordagem,
} from "@/lib/ai.functions";
import {
  gerarMatrizDMAM,
  gerarItemDMAM,
  PILARES_INFO,
  type PilarDMAM,
  type ItemDMAM,
  type MatrizDMAMResult,
} from "@/lib/dmam-framework";
import { whatsappUrl } from "@/lib/links";
import {
  Copy,
  RefreshCw,
  MessageCircle,
  Mail,
  Instagram,
  Phone,
  Type,
  Sparkles,
  Wand2,
  Send,
  Check,
  AlertCircle,
  ShieldAlert,
  TrendingUp,
  Gauge,
  Layers,
  Bot,
  Zap,
  Flame,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

type Elegancia = "sutil" | "elegante" | "equilibrado" | "direto";

function waSendUrl(numero: string | undefined, texto: string): string | undefined {
  const base = whatsappUrl(numero);
  if (!base) return undefined;
  return `${base}?text=${encodeURIComponent(texto)}`;
}

export const Route = createFileRoute("/abordagem")({
  validateSearch: z.object({ empresa: z.string().optional() }),
  component: AbordagemPage,
});

const CANAIS: { value: Canal; label: string; icon: typeof Mail }[] = [
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { value: "email", label: "E-mail", icon: Mail },
  { value: "instagram", label: "Direct / Instagram", icon: Instagram },
  { value: "ligacao", label: "Ligação (roteiro)", icon: Phone },
  { value: "curta", label: "Mensagem curta", icon: Type },
];

function AbordagemPage() {
  const { empresa: empresaId } = useSearch({ from: "/abordagem" });
  const { empresas } = useStore();
  const [selected, setSelected] = useState<string>(empresaId ?? empresas[0]?.id ?? "");
  const [modo, setModo] = useState<"dmam" | "classico">("dmam");
  const [pilarAtivo, setPilarAtivo] = useState<"todos" | "dores" | "medos" | "ambicoes" | "maturidade" | "integrada">("todos");
  const [canal, setCanal] = useState<Canal>("whatsapp");
  const [tom, setTom] = useState<Tom>("consultivo");
  const [foco, setFoco] = useState<Foco>("geral");
  const [seed, setSeed] = useState(0);
  const [elegancia, setElegancia] = useState<Elegancia>("elegante");
  const [qtd, setQtd] = useState(5);
  const [variacoes, setVariacoes] = useState<VariacaoAbordagem[]>([]);
  const [loadingVar, setLoadingVar] = useState(false);
  const [loadingDMAM, setLoadingDMAM] = useState(false);

  const empresa = empresas.find((e) => e.id === selected);

  // Matriz DMAM inicial determinística
  const matrizInicial = useMemo(() => {
    if (!empresa) return null;
    return gerarMatrizDMAM(empresa, canal, tom);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresa, canal, tom, seed]);

  const [matrizDMAM, setMatrizDMAM] = useState<MatrizDMAMResult | null>(matrizInicial);

  useEffect(() => {
    if (matrizInicial) {
      setMatrizDMAM(matrizInicial);
    }
  }, [matrizInicial]);

  const textoClassico = useMemo(
    () => (empresa ? gerarAbordagem(empresa, canal, tom, foco) : ""),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [empresa, canal, tom, foco, seed],
  );

  const [editado, setEditado] = useState("");
  const [loadingIA, setLoadingIA] = useState(false);

  // Texto base do editor: se estiver no modo DMAM e tiver matriz, usa a integrada ou dores
  const textoPadrao = useMemo(() => {
    if (modo === "dmam" && matrizDMAM) {
      if (pilarAtivo === "dores") return matrizDMAM.dores.texto;
      if (pilarAtivo === "medos") return matrizDMAM.medos.texto;
      if (pilarAtivo === "ambicoes") return matrizDMAM.ambicoes.texto;
      if (pilarAtivo === "maturidade") return matrizDMAM.maturidade.texto;
      if (pilarAtivo === "integrada") return matrizDMAM.mensagemIntegradaCompleta;
      return matrizDMAM.mensagemIntegradaCompleta;
    }
    return textoClassico;
  }, [modo, matrizDMAM, pilarAtivo, textoClassico]);

  const finalTxt = editado || textoPadrao;
  const waNumero = empresa?.whatsapp || empresa?.telefone;
  const waFinal = waSendUrl(waNumero, finalTxt);

  const gerarDMAM_comIA = async () => {
    if (!empresa) return;
    setLoadingDMAM(true);
    try {
      const res = await gerarMatrizDMAM_IA({
        data: { empresa: toCtx(empresa), canal, tom },
      });
      setMatrizDMAM(res);
      setEditado(res.mensagemIntegradaCompleta);
      toast.success("Abordagens nos 4 Pilares (DMAM) geradas com IA com sucesso!");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoadingDMAM(false);
    }
  };

  const gerarOpcoes = async () => {
    if (!empresa) return;
    setLoadingVar(true);
    try {
      const r = await gerarVariacoesAbordagemIA({
        data: { empresa: toCtx(empresa), canal, foco, elegancia, quantidade: qtd },
      });
      setVariacoes(r);
      toast.success(`${r.length} opções geradas com ChatGPT`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoadingVar(false);
    }
  };

  const regen = () => {
    setSeed((s) => s + 1);
    setEditado("");
    toast.success("Mensagens regeneradas");
  };


  return (
    <div className="px-4 md:px-8 py-6 md:py-8 space-y-6 max-w-[1440px]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Gerador de Abordagens Consultivas</h1>
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
              Metodologia DMAM + IA
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Gere abordagens altamente persuasivas e personalizadas com base em <strong>Dores</strong>, <strong>Medos</strong>, <strong>Ambições</strong> e <strong>Maturidade</strong>.
          </p>
        </div>

        {/* Seletor de Modo de Abordagem */}
        <div className="flex items-center bg-muted/60 p-1 rounded-lg border border-border/60">
          <button
            type="button"
            onClick={() => setModo("dmam")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              modo === "dmam"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Flame className="h-3.5 w-3.5 text-amber-500" />
            Framework DMAM (4 Pilares)
          </button>
          <button
            type="button"
            onClick={() => setModo("classico")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              modo === "classico"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-blue-500" />
            Modo Clássico (Tom & Foco)
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[360px_1fr] gap-6">
        {/* COLUNA ESQUERDA: CONFIGURAÇÃO */}
        <Card className="border-border/60 h-fit space-y-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Configuração da Abordagem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            {/* Empresa Selecionada */}
            <div>
              <Label>Empresa-Alvo</Label>
              <Select value={selected} onValueChange={(v) => { setSelected(v); setEditado(""); }}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Selecione uma empresa" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((e) => (
                    <SelectItem key={e.id} value={e.id} className="text-xs">
                      {e.nome} · {e.cidade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Canal de Envio */}
            <div>
              <Label>Canal de Comunicação</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {CANAIS.map((c) => {
                  const Icon = c.icon;
                  const active = canal === c.value;
                  return (
                    <button
                      key={c.value}
                      onClick={() => { setCanal(c.value); setEditado(""); }}
                      className={`flex items-center gap-1.5 rounded-md border px-2.5 py-2 text-xs transition ${
                        active ? "border-primary bg-primary/10 text-primary font-medium" : "border-border/60 hover:bg-accent text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span>{c.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tom de Comunicação */}
            <div>
              <Label>Tom do Texto</Label>
              <Select value={tom} onValueChange={(v) => { setTom(v as Tom); setEditado(""); }}>
                <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultivo" className="text-xs">Consultivo (Especialista e Aconselhador)</SelectItem>
                  <SelectItem value="formal" className="text-xs">Formal (Corporativo e Executivo)</SelectItem>
                  <SelectItem value="amistoso" className="text-xs">Amistoso (Próximo e Caloroso)</SelectItem>
                  <SelectItem value="direto" className="text-xs">Direto (Curto e Objetivo)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {modo === "classico" ? (
              <>
                <div>
                  <Label>Foco Principal</Label>
                  <Select value={foco} onValueChange={(v) => { setFoco(v as Foco); setEditado(""); }}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="geral">Diagnóstico Geral</SelectItem>
                      <SelectItem value="site">Presença Web & Site</SelectItem>
                      <SelectItem value="instagram">Instagram & Conteúdo</SelectItem>
                      <SelectItem value="atendimento">Atendimento & Conversão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Elegância & Sutileza</Label>
                  <Select value={elegancia} onValueChange={(v) => setElegancia(v as Elegancia)}>
                    <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sutil">Muito Sutil (Sem vender diretamente)</SelectItem>
                      <SelectItem value="elegante">Elegante e Sofisticado</SelectItem>
                      <SelectItem value="equilibrado">Equilibrado</SelectItem>
                      <SelectItem value="direto">Direto e Respeitoso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full text-xs" disabled={!empresa || loadingVar} onClick={gerarOpcoes}>
                  <Wand2 className="h-3.5 w-3.5 mr-1.5" />
                  {loadingVar ? "Escrevendo opções com IA..." : "Gerar Múltiplas Variações com IA"}
                </Button>
              </>
            ) : (
              <div className="space-y-3 pt-1 border-t border-border/50">
                <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] space-y-1.5">
                  <div className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <Flame className="h-3.5 w-3.5" /> Framework DMAM Ativo
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Gera abordagens sob 4 ângulos psicológicos complementares:
                  </p>
                  <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                    <li><strong className="text-foreground">Dores:</strong> Problema imediato ➔ Solução rápida</li>
                    <li><strong className="text-foreground">Medos:</strong> Risco de não mudar ➔ Segurança/Estabilidade</li>
                    <li><strong className="text-foreground">Ambições:</strong> Onde querem chegar ➔ Aceleração</li>
                    <li><strong className="text-foreground">Maturidade:</strong> Capacidade ➔ Onboarding sob medida</li>
                  </ul>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-amber-600 to-primary hover:from-amber-700 hover:to-primary/90 text-white text-xs font-medium"
                  disabled={!empresa || loadingDMAM}
                  onClick={gerarDMAM_comIA}
                >
                  <Bot className="h-4 w-4 mr-1.5 animate-pulse" />
                  {loadingDMAM ? "IA estruturando os 4 pilares..." : "🤖 Gerar 4 Pilares com IA"}
                </Button>
              </div>
            )}

            {empresa && (
              <div className="rounded-md border border-border/60 bg-muted/30 p-3 space-y-1">
                <div className="font-semibold text-foreground text-xs">{empresa.nome}</div>
                <div className="text-muted-foreground text-[11px]">
                  {empresa.segmento} · {empresa.cidade}/RS
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Badge variant="outline" className="text-[10px]">
                    Score: {empresa.score}/100
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">
                    Site: {empresa.statusSite}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* COLUNA DIREITA: CONTEÚDO GERADO & EDITOR */}
        <div className="space-y-5">
          {/* Card Principal de Visualização & Edição */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex-row items-center justify-between pb-3 flex-wrap gap-2">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Mensagem Pronta para Envio
                </CardTitle>
                <CardDescription className="text-xs">
                  Texto formatado para {CANAIS.find((c) => c.value === canal)?.label}.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={regen} className="text-xs">
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Regenerar
                </Button>
                {modo === "classico" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={!empresa || loadingIA}
                    onClick={async () => {
                      if (!empresa) return;
                      setLoadingIA(true);
                      try {
                        const r = await gerarAbordagemIA({ data: { empresa: toCtx(empresa), canal, tom, foco } });
                        setEditado(r);
                        toast.success("Mensagem gerada com IA");
                      } catch (e) {
                        toast.error((e as Error).message);
                      } finally {
                        setLoadingIA(false);
                      }
                    }}
                    className="text-xs"
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" /> {loadingIA ? "Gerando..." : "Gerar com IA"}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!waFinal}
                  title={waFinal ? "Abrir WhatsApp com esta mensagem" : "Empresa sem WhatsApp/telefone"}
                  onClick={() => waFinal && window.open(waFinal, "_blank", "noopener")}
                  className="text-xs text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                >
                  <Send className="h-3.5 w-3.5 mr-1.5" /> Enviar WhatsApp
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(finalTxt);
                    toast.success("Mensagem copiada para a área de transferência!");
                  }}
                  className="text-xs"
                >
                  <Copy className="h-3.5 w-3.5 mr-1.5" /> Copiar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={finalTxt}
                onChange={(e) => setEditado(e.target.value)}
                rows={12}
                className="font-mono text-xs sm:text-sm leading-relaxed"
                placeholder="A mensagem gerada aparecerá aqui..."
              />
              <p className="text-[11px] text-muted-foreground">
                💡 <strong>Dica de Fechamento:</strong> Sempre revise antes de disparar. Mantenha tom consultivo, mencione o nome do interlocutor e foque em abrir diálogo.
              </p>
            </CardContent>
          </Card>

          {/* MATRIZ DMAM: CARDS DOS 4 PILARES */}
          {modo === "dmam" && matrizDMAM && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Flame className="h-4 w-4 text-amber-500" />
                    Matriz Estratégica DMAM ({empresa?.nome || "Empresa"})
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Escolha um dos 4 ângulos consultivos abaixo ou a mensagem integrada completa para aplicar no editor:
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditado(matrizDMAM.mensagemIntegradaCompleta);
                    setPilarAtivo("integrada");
                    toast.success("Mensagem Integrada (4 Pilares) aplicada no editor!");
                  }}
                  className="text-xs border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                >
                  <Layers className="h-3.5 w-3.5 mr-1.5" />
                  Usar Narrativa Integrada Completa
                </Button>
              </div>

              {/* Grid com os 4 Pilares */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* 1. DORES */}
                <Card className="border-border/60 border-t-4 border-t-amber-500 flex flex-col justify-between shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                        <AlertCircle className="h-4 w-4" />
                        Dores: O Problema Imediato
                      </CardTitle>
                      <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">
                        Solução Rápida
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      🎯 <em>{matrizDMAM.dores.diretiva}</em>
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3 flex-1 flex flex-col justify-between text-xs">
                    <div className="space-y-2">
                      <div className="rounded bg-muted/40 p-2 text-[11px] text-muted-foreground">
                        <strong>Diagnóstico:</strong> {matrizDMAM.dores.diagnostico}
                      </div>
                      <div className="rounded-md border border-border/60 bg-background/80 p-3 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                        {matrizDMAM.dores.texto}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditado(matrizDMAM.dores.texto);
                          setPilarAtivo("dores");
                          toast.success("Abordagem focada em Dores aplicada no editor!");
                        }}
                        className="text-xs"
                      >
                        <Check className="h-3.5 w-3.5 mr-1" /> Usar esta
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(matrizDMAM.dores.texto);
                          toast.success("Texto copiado!");
                        }}
                        className="text-xs"
                      >
                        <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* 2. MEDOS */}
                <Card className="border-border/60 border-t-4 border-t-rose-500 flex flex-col justify-between shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
                        <ShieldAlert className="h-4 w-4" />
                        Medos: Risco de Não Mudar
                      </CardTitle>
                      <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-600 border-rose-500/30">
                        Segurança & Estabilidade
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      🎯 <em>{matrizDMAM.medos.diretiva}</em>
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3 flex-1 flex flex-col justify-between text-xs">
                    <div className="space-y-2">
                      <div className="rounded bg-muted/40 p-2 text-[11px] text-muted-foreground">
                        <strong>Diagnóstico:</strong> {matrizDMAM.medos.diagnostico}
                      </div>
                      <div className="rounded-md border border-border/60 bg-background/80 p-3 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                        {matrizDMAM.medos.texto}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditado(matrizDMAM.medos.texto);
                          setPilarAtivo("medos");
                          toast.success("Abordagem focada em Medos aplicada no editor!");
                        }}
                        className="text-xs"
                      >
                        <Check className="h-3.5 w-3.5 mr-1" /> Usar esta
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(matrizDMAM.medos.texto);
                          toast.success("Texto copiado!");
                        }}
                        className="text-xs"
                      >
                        <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* 3. AMBIÇÕES */}
                <Card className="border-border/60 border-t-4 border-t-emerald-500 flex flex-col justify-between shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                        <TrendingUp className="h-4 w-4" />
                        Ambições: Onde Querem Chegar
                      </CardTitle>
                      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                        Aceleração do Crescimento
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      🎯 <em>{matrizDMAM.ambicoes.diretiva}</em>
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3 flex-1 flex flex-col justify-between text-xs">
                    <div className="space-y-2">
                      <div className="rounded bg-muted/40 p-2 text-[11px] text-muted-foreground">
                        <strong>Diagnóstico:</strong> {matrizDMAM.ambicoes.diagnostico}
                      </div>
                      <div className="rounded-md border border-border/60 bg-background/80 p-3 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                        {matrizDMAM.ambicoes.texto}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditado(matrizDMAM.ambicoes.texto);
                          setPilarAtivo("ambicoes");
                          toast.success("Abordagem focada em Ambições aplicada no editor!");
                        }}
                        className="text-xs"
                      >
                        <Check className="h-3.5 w-3.5 mr-1" /> Usar esta
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(matrizDMAM.ambicoes.texto);
                          toast.success("Texto copiado!");
                        }}
                        className="text-xs"
                      >
                        <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* 4. MATURIDADE */}
                <Card className="border-border/60 border-t-4 border-t-blue-500 flex flex-col justify-between shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm flex items-center gap-1.5 text-blue-700 dark:text-blue-400">
                        <Gauge className="h-4 w-4" />
                        Maturidade: Capacidade de Implementação
                      </CardTitle>
                      <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/30">
                        Suporte & Onboarding Sob Medida
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground font-medium">
                      🎯 <em>{matrizDMAM.maturidade.diretiva}</em>
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3 flex-1 flex flex-col justify-between text-xs">
                    <div className="space-y-2">
                      <div className="rounded bg-muted/40 p-2 text-[11px] text-muted-foreground">
                        <strong>Diagnóstico:</strong> {matrizDMAM.maturidade.diagnostico}
                      </div>
                      <div className="rounded-md border border-border/60 bg-background/80 p-3 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                        {matrizDMAM.maturidade.texto}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setEditado(matrizDMAM.maturidade.texto);
                          setPilarAtivo("maturidade");
                          toast.success("Abordagem focada em Maturidade aplicada no editor!");
                        }}
                        className="text-xs"
                      >
                        <Check className="h-3.5 w-3.5 mr-1" /> Usar esta
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(matrizDMAM.maturidade.texto);
                          toast.success("Texto copiado!");
                        }}
                        className="text-xs"
                      >
                        <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* MODO CLÁSSICO: VARIAÇÕES DE ABORDAGEM */}
          {modo === "classico" && variacoes.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold tracking-tight">
                Opções geradas com ChatGPT ({variacoes.length})
              </h2>
              <div className="grid md:grid-cols-2 gap-3">
                {variacoes.map((v, i) => {
                  const wa = waSendUrl(waNumero, v.texto);
                  return (
                    <Card key={i} className="border-border/60 flex flex-col">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px]">{i + 1}</Badge>
                          {v.estilo}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">{v.resumo}</p>
                        {v.assunto && (
                          <p className="text-xs mt-1">
                            <span className="text-muted-foreground">Assunto: </span>
                            {v.assunto}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent className="flex-1 flex flex-col gap-2">
                        <p className="text-sm whitespace-pre-wrap rounded-md border border-border/60 bg-muted/30 p-3 flex-1">
                          {v.texto}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setEditado(v.assunto ? `Assunto: ${v.assunto}\n\n${v.texto}` : v.texto);
                              toast.success("Opção aplicada no editor");
                            }}
                          >
                            <Check className="h-3.5 w-3.5 mr-1.5" /> Usar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(v.texto);
                              toast.success("Texto copiado");
                            }}
                          >
                            <Copy className="h-3.5 w-3.5 mr-1.5" /> Copiar
                          </Button>
                          <Button
                            size="sm"
                            disabled={!wa}
                            title={wa ? "Abrir WhatsApp com esta mensagem" : "Empresa sem WhatsApp/telefone"}
                            onClick={() => wa && window.open(wa, "_blank", "noopener")}
                          >
                            <Send className="h-3.5 w-3.5 mr-1.5" /> Enviar no WhatsApp
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5 font-medium">{children}</div>;
}
