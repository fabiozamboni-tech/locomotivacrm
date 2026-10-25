import { useState, useRef, useMemo, useEffect } from "react";
import type { Empresa } from "@/lib/mock-data";
import {
  executarAnaliseIACadastro,
  toSafeString,
} from "@/lib/cadastro-ia.functions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  Building2,
  MapPin,
  FileCheck2,
  Phone,
  ShieldCheck,
  RefreshCw,
  Search,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface AnaliseTodasIaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresasAtivas: Empresa[];
  empresasFiltradas: Empresa[];
  onAtualizarEmpresa: (id: string, patch: Partial<Empresa>) => void;
}

interface ItemResultado {
  id: string;
  nome: string;
  cidade: string;
  status: "pendente" | "processando" | "sucesso" | "erro";
  cnpj?: string;
  whatsapp?: string;
  telefone?: string;
  segmento?: string;
  mensagemErro?: string;
}

export function AnaliseTodasIaModal({
  open,
  onOpenChange,
  empresasAtivas,
  empresasFiltradas,
  onAtualizarEmpresa,
}: AnaliseTodasIaModalProps) {
  const [escopo, setEscopo] = useState<"incompletas" | "filtradas" | "todas">("incompletas");
  const [executando, setExecutando] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [progressoIdx, setProgressoIdx] = useState(0);
  const [empresaAtualNome, setEmpresaAtualNome] = useState("");
  const [etapaAtualDesc, setEtapaAtualDesc] = useState("");
  const [resultados, setResultados] = useState<ItemResultado[]>([]);

  const cancelRef = useRef(false);

  // Identifica empresas com cadastro pendente/incompleto (sem CNPJ, público-alvo ou área de atuação)
  const empresasIncompletas = useMemo(() => {
    return empresasAtivas.filter((e) => {
      const semCnpj = !e.cnpj || cleanDigitsOnly(e.cnpj).length !== 14;
      const semPublico = !e.publicoAlvo || e.publicoAlvo.trim().length < 15;
      const semAtuacao = !e.areaAtuacao || e.areaAtuacao.trim().length < 10;
      const semBuscas = !e.buscasPartida || e.buscasPartida.trim().length < 5;
      return semCnpj || semPublico || semAtuacao || semBuscas;
    });
  }, [empresasAtivas]);

  function cleanDigitsOnly(val?: string): string {
    return (val || "").replace(/\D/g, "");
  }

  // Lista selecionada conforme o escopo
  const listaAlvo = useMemo(() => {
    if (escopo === "incompletas") return empresasIncompletas;
    if (escopo === "filtradas") return empresasFiltradas;
    return empresasAtivas;
  }, [escopo, empresasIncompletas, empresasFiltradas, empresasAtivas]);

  // Reseta estado quando o modal fecha ou abre
  useEffect(() => {
    if (!open) {
      if (executando) {
        cancelRef.current = true;
      }
      setExecutando(false);
      setPausado(false);
      setProgressoIdx(0);
      setEmpresaAtualNome("");
      setEtapaAtualDesc("");
      setResultados([]);
    }
  }, [open]);

  const totalAlvo = listaAlvo.length;
  const concluidasCount = resultados.filter((r) => r.status === "sucesso").length;
  const errosCount = resultados.filter((r) => r.status === "erro").length;
  const percentual = totalAlvo > 0 ? Math.round((progressoIdx / totalAlvo) * 100) : 0;

  const handleIniciar = async () => {
    if (listaAlvo.length === 0) {
      toast.warning("Nenhuma empresa encontrada no escopo selecionado.");
      return;
    }

    setExecutando(true);
    setPausado(false);
    cancelRef.current = false;
    setProgressoIdx(0);

    const initialResultados: ItemResultado[] = listaAlvo.map((e) => ({
      id: e.id,
      nome: e.nome,
      cidade: e.cidade,
      status: "pendente",
    }));
    setResultados(initialResultados);

    // Processa a fila de empresas com controle sequencial cuidadoso
    for (let i = 0; i < listaAlvo.length; i++) {
      if (cancelRef.current) {
        toast.info("Processamento em lote interrompido.");
        break;
      }

      const emp = listaAlvo[i];
      setProgressoIdx(i + 1);
      setEmpresaAtualNome(emp.nome);
      setEtapaAtualDesc("Consultando Google Maps, Receita Federal & Inteligência Artificial...");

      // Atualiza status do item para 'processando'
      setResultados((prev) =>
        prev.map((r, idx) => (idx === i ? { ...r, status: "processando" } : r))
      );

      try {
        const { patch, resultado } = await executarAnaliseIACadastro(emp);

        // Atualiza a empresa no Store e persiste no banco
        onAtualizarEmpresa(emp.id, patch);

        setResultados((prev) =>
          prev.map((r, idx) =>
            idx === i
              ? {
                  ...r,
                  status: "sucesso",
                  cnpj: patch.cnpj || resultado.cnpj,
                  whatsapp: patch.whatsapp || resultado.whatsapp,
                  telefone: patch.telefone || resultado.telefone,
                  segmento: patch.segmento || resultado.segmentoRefinado,
                }
              : r
          )
        );
      } catch (err: any) {
        console.error(`Erro ao analisar empresa ${emp.nome}:`, err);
        setResultados((prev) =>
          prev.map((r, idx) =>
            idx === i
              ? {
                  ...r,
                  status: "erro",
                  mensagemErro: err.message || "Falha na análise",
                }
              : r
          )
        );
      }

      // Pequena pausa respiratória para não sobrecarregar limites de chamadas simultâneas
      await new Promise((resolve) => setTimeout(resolve, 600));
    }

    setExecutando(false);
    setEtapaAtualDesc("");
    setEmpresaAtualNome("");
    toast.success("Processamento em lote concluído!");
  };

  const handleCancelar = () => {
    cancelRef.current = true;
    setExecutando(false);
    toast.info("A análise em lote será finalizada após a empresa atual.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-lg shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight">
                Análise por IA de Todas as Empresas
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Executa a mesma inteligência do cadastro: Google Maps, CNPJ na Receita Federal, telefones, site, público-alvo regional e buscas estratégicas.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 py-2 pr-1">
          {!executando && progressoIdx === 0 && (
            <div className="space-y-4">
              <div className="p-4 bg-muted/40 border border-border/60 rounded-xl space-y-3">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Selecione o escopo da análise em lote:
                </Label>

                <RadioGroup
                  value={escopo}
                  onValueChange={(v) => setEscopo(v as any)}
                  className="space-y-2.5"
                >
                  <div className="flex items-start space-x-3 p-3 rounded-lg border border-border/60 hover:bg-accent/40 transition cursor-pointer">
                    <RadioGroupItem value="incompletas" id="escopo-incompletas" className="mt-0.5" />
                    <label htmlFor="escopo-incompletas" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Apenas empresas com cadastro incompleto</span>
                        <Badge variant="secondary" className="text-xs font-mono">
                          {empresasIncompletas.length} empresas
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Filtra empresas que ainda não possuem CNPJ validado, público-alvo ou termos estratégicos. (Recomendado)
                      </p>
                    </label>
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded-lg border border-border/60 hover:bg-accent/40 transition cursor-pointer">
                    <RadioGroupItem value="filtradas" id="escopo-filtradas" className="mt-0.5" />
                    <label htmlFor="escopo-filtradas" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Empresas do filtro atual da tabela</span>
                        <Badge variant="secondary" className="text-xs font-mono">
                          {empresasFiltradas.length} empresas
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Aplica a análise apenas às empresas atualmente visíveis pelos filtros de cidade, segmento ou funil.
                      </p>
                    </label>
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded-lg border border-border/60 hover:bg-accent/40 transition cursor-pointer">
                    <RadioGroupItem value="todas" id="escopo-todas" className="mt-0.5" />
                    <label htmlFor="escopo-todas" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Todas as empresas ativas do CRM</span>
                        <Badge variant="secondary" className="text-xs font-mono">
                          {empresasAtivas.length} empresas
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Varre e atualiza todas as empresas ativas da base de dados do CRM.
                      </p>
                    </label>
                  </div>
                </RadioGroup>
              </div>

              <div className="p-3.5 bg-violet-500/10 border border-violet-500/20 rounded-xl flex items-start gap-3">
                <ShieldCheck className="h-4 w-4 text-violet-600 mt-0.5 shrink-0" />
                <div className="text-xs text-violet-950 dark:text-violet-200 space-y-1">
                  <p className="font-semibold">O que será preenchido em cada empresa:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                    <li>CNPJ oficial e dados da Receita Federal (Razão Social, CNAE)</li>
                    <li>Telefone fixo e WhatsApp com DDD regional classificados</li>
                    <li>Segmento refinado e Descrição do que a empresa faz (Área de Atuação)</li>
                    <li>Público-alvo detalhado e 5 a 7 buscas reais de clientes no Google</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {(executando || progressoIdx > 0) && (
            <div className="space-y-4">
              {/* Card de Progresso */}
              <div className="p-4 bg-muted/40 border border-border/60 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-muted-foreground">
                    Progresso Geral da Análise
                  </span>
                  <span className="font-mono font-semibold">
                    {progressoIdx} de {totalAlvo} ({percentual}%)
                  </span>
                </div>
                <Progress value={percentual} className="h-2.5" />

                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {concluidasCount} concluídas
                    </span>
                    {errosCount > 0 && (
                      <span className="text-rose-600 font-medium flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" /> {errosCount} com erro
                      </span>
                    )}
                  </div>
                  {executando && (
                    <Badge variant="outline" className="text-[11px] gap-1 animate-pulse border-violet-500/30 text-violet-600">
                      <Loader2 className="h-3 w-3 animate-spin" /> Em execução
                    </Badge>
                  )}
                  {!executando && progressoIdx >= totalAlvo && (
                    <Badge variant="default" className="text-[11px] bg-emerald-600 text-white gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Finalizado
                    </Badge>
                  )}
                </div>
              </div>

              {/* Empresa Atual */}
              {executando && empresaAtualNome && (
                <div className="p-3.5 bg-gradient-to-r from-violet-500/10 via-indigo-500/10 to-transparent border border-violet-500/30 rounded-xl flex items-center justify-between gap-3 animate-fade-in">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Loader2 className="h-4 w-4 animate-spin text-violet-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate text-foreground">
                        {empresaAtualNome}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {etapaAtualDesc}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Feed de Resultados Concluídos */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Empresas Processadas:
                </Label>
                <div className="max-h-56 overflow-y-auto space-y-1.5 border border-border/60 rounded-xl p-2 bg-background/50">
                  {resultados.map((item) => (
                    <div
                      key={item.id}
                      className="p-2 rounded-lg border border-border/40 bg-card/60 hover:bg-accent/30 text-xs flex items-center justify-between gap-2 transition"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {item.status === "sucesso" && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        )}
                        {item.status === "processando" && (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-500 shrink-0" />
                        )}
                        {item.status === "pendente" && (
                          <div className="size-2 rounded-full bg-muted-foreground/30 shrink-0 ml-1 mr-0.5" />
                        )}
                        {item.status === "erro" && (
                          <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium truncate">{item.nome}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{item.cidade}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {item.cnpj && (
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-mono text-emerald-600 border-emerald-500/30">
                            CNPJ ✓
                          </Badge>
                        )}
                        {item.whatsapp && (
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-emerald-600 border-emerald-500/30">
                            Whats ✓
                          </Badge>
                        )}
                        {item.status === "sucesso" && (
                          <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                            Enriquecida
                          </Badge>
                        )}
                        {item.status === "erro" && (
                          <Badge variant="destructive" className="text-[10px] h-5 px-1.5">
                            Falhou
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4 flex items-center justify-between sm:justify-between w-full">
          <div>
            {executando && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelar}
                className="text-xs text-rose-600 border-rose-500/30 hover:bg-rose-500/10"
              >
                <Pause className="h-3.5 w-3.5 mr-1" />
                Interromper
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!executando && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs"
              >
                {progressoIdx > 0 ? "Concluir e Fechar" : "Cancelar"}
              </Button>
            )}

            {!executando && (
              <Button
                size="sm"
                onClick={handleIniciar}
                disabled={listaAlvo.length === 0}
                className="text-xs gap-1.5 bg-gradient-to-r from-violet-600 via-indigo-600 to-primary text-white hover:opacity-90 shadow-sm"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {progressoIdx > 0 ? "Reiniciar Análise" : `Iniciar Análise (${listaAlvo.length} empresas)`}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
