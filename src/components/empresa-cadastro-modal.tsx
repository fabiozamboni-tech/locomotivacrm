import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useStore } from "@/lib/store";
import type { Empresa, CrmStage } from "@/lib/mock-data";
import { CRM_STAGES_ORDER, CRM_STAGE_LABEL } from "@/components/badges";
import {
  gerarDadosCadastroIA_ServerFn,
  sugerirPublicoAlvoIA_ServerFn,
} from "@/lib/cadastro-ia.functions";
import {
  consultarCnpjBrasilAPI_ServerFn,
  consultarCepBrasilAPI_ServerFn,
  type BrasilApiCnpjResult,
} from "@/lib/public-apis.functions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Building2,
  Sparkles,
  MapPin,
  Phone,
  Mail,
  Globe,
  Instagram,
  Search,
  FileText,
  Loader2,
  CheckCircle2,
  Save,
  MessageSquareText,
  Share2,
  Users,
  Landmark,
  ChevronDown,
  ChevronUp,
  SearchCode,
  Check,
} from "lucide-react";

interface EmpresaCadastroModalProps {
  empresa: Empresa | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (empresa: Empresa) => void;
}

const SEGMENTOS_SUGERIDOS = [
  "Vinícola & Enoturismo",
  "Móveis Planejados & Decoração",
  "Restaurante & Gastronomia",
  "Hotel & Pousada",
  "Clínica & Saúde",
  "Indústria Metalmecânica",
  "Comércio Varejista",
  "Serviços Corporativos",
  "Construção & Engenharia",
  "Agronegócio",
  "Educação & Cursos",
  "Tecnologia & Software",
  "Outro",
];

export function EmpresaCadastroModal({
  empresa,
  open,
  onOpenChange,
  onSaved,
}: EmpresaCadastroModalProps) {
  const { updateEmpresa } = useStore();
  const gerarDadosIA = useServerFn(gerarDadosCadastroIA_ServerFn);
  const sugerirPublicoAlvoIA = useServerFn(sugerirPublicoAlvoIA_ServerFn);
  const consultarCnpjBrasilAPI = useServerFn(consultarCnpjBrasilAPI_ServerFn);
  const consultarCepBrasilAPI = useServerFn(consultarCepBrasilAPI_ServerFn);

  const [nome, setNome] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [segmento, setSegmento] = useState("");
  const [areaAtuacao, setAreaAtuacao] = useState("");
  const [publicoAlvo, setPublicoAlvo] = useState("");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cep, setCep] = useState("");
  const [telefone, setTelefone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [site, setSite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [crmStage, setCrmStage] = useState<CrmStage>("identificado");
  const [observacoes, setObservacoes] = useState("");
  const [buscasPartida, setBuscasPartida] = useState("");
  const [termosEncontrados, setTermosEncontrados] = useState("");
  const [buscaGoogleMaps, setBuscaGoogleMaps] = useState("");

  const [gerandoIA, setGerandoIA] = useState(false);
  const [gerandoPublicoAlvo, setGerandoPublicoAlvo] = useState(false);
  const [buscandoCnpj, setBuscandoCnpj] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [dadosReceita, setDadosReceita] = useState<BrasilApiCnpjResult | null>(null);
  const [mostrarQsa, setMostrarQsa] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!empresa) return;
    setNome(empresa.nome || "");
    setRazaoSocial(empresa.razaoSocial || "");
    setCnpj(empresa.cnpj || "");
    setSegmento(empresa.segmento || "");
    setAreaAtuacao(empresa.areaAtuacao || "");
    setPublicoAlvo(empresa.publicoAlvo || "");
    setCidade(empresa.cidade || "");
    setBairro(empresa.bairro || "");
    setEndereco(empresa.endereco || "");
    setCep((empresa as any).cep || "");
    setTelefone(empresa.telefone || "");
    setWhatsapp(empresa.whatsapp || "");
    setEmail(empresa.email || "");
    setSite(empresa.site || "");
    setInstagram(empresa.instagram || "");
    setCrmStage(empresa.crmStage || "identificado");
    setObservacoes(empresa.observacoes || "");
    setBuscasPartida(empresa.buscasPartida || "");
    setTermosEncontrados(empresa.termosEncontrados || "");
    setBuscaGoogleMaps(empresa.buscaGoogleMaps || "");
    setDadosReceita(null);
    setMostrarQsa(false);
  }, [empresa]);

  if (!empresa) return null;

  const handlePreencherComIA = async () => {
    setGerandoIA(true);
    try {
      const res = await gerarDadosIA({
        data: {
          nome,
          segmento,
          cidade,
          bairro,
          endereco,
          site,
          instagram,
          observacoes,
          areaAtuacaoAtual: areaAtuacao,
          publicoAlvoAtual: publicoAlvo,
        },
      });

      if (res) {
        if (res.areaAtuacao) setAreaAtuacao(res.areaAtuacao);
        if (res.publicoAlvo) setPublicoAlvo(res.publicoAlvo);
        if (res.buscasPartida) setBuscasPartida(res.buscasPartida);
        if (res.termosEncontrados) setTermosEncontrados(res.termosEncontrados);
        if (res.buscaGoogleMaps) setBuscaGoogleMaps(res.buscaGoogleMaps);
        if (res.segmentoRefinado && !segmento) setSegmento(res.segmentoRefinado);

        toast.success(
          res.modo === "ia"
            ? "Campos preenchidos com inteligência artificial via ChatGPT!"
            : "Campos gerados com dados em tempo real do Google Autocomplete!",
        );
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao consultar IA.");
    } finally {
      setGerandoIA(false);
    }
  };

  const handleSugerirPublicoAlvo = async () => {
    setGerandoPublicoAlvo(true);
    try {
      const res = await sugerirPublicoAlvoIA({
        data: {
          nome,
          segmento,
          cidade,
          areaAtuacao,
          observacoes,
        },
      });

      if (res?.publicoAlvo) {
        setPublicoAlvo(res.publicoAlvo);
        toast.success("Público-alvo sugerido com inteligência!");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao sugerir público-alvo.");
    } finally {
      setGerandoPublicoAlvo(false);
    }
  };

  const handleBuscarCnpjReceita = async () => {
    const raw = (cnpj || "").replace(/\D/g, "");
    if (raw.length !== 14) {
      toast.warning("Digite os 14 dígitos do CNPJ para buscar na Receita Federal.");
      return;
    }

    setBuscandoCnpj(true);
    try {
      const res = await consultarCnpjBrasilAPI({ data: { cnpj: raw } });
      if (!res.sucesso) {
        toast.error(res.mensagemErro || "CNPJ não encontrado na Receita Federal.");
        return;
      }

      setDadosReceita(res);
      if (res.razaoSocial) setRazaoSocial(res.razaoSocial);
      if (res.nomeFantasia && (!nome || nome === "Nova Empresa" || nome === res.razaoSocial)) {
        setNome(res.nomeFantasia);
      }
      if (res.cnaeDescricao && !segmento) {
        setSegmento(res.cnaeDescricao);
      }
      if (res.municipio) {
        setCidade(res.uf ? `${res.municipio} (${res.uf})` : res.municipio);
      }
      if (res.bairro) setBairro(res.bairro);
      if (res.logradouro) {
        const compl = res.complemento ? ` - ${res.complemento}` : "";
        const num = res.numero ? `, ${res.numero}` : "";
        setEndereco(`${res.logradouro}${num}${compl}`);
      }
      if (res.cep) setCep(res.cep);
      if (res.telefone && !telefone) {
        setTelefone(res.telefone);
        if (!whatsapp) setWhatsapp(res.telefone);
      }
      if (res.email && !email) setEmail(res.email);

      if (!areaAtuacao && res.cnaeDescricao) {
        setAreaAtuacao(`Atividade principal: ${res.cnaeDescricao}.`);
      }

      toast.success(
        `CNPJ validado na Receita Federal! ${res.razaoSocial || ""} (${res.situacaoCadastral || "ATIVA"}).`,
      );
      if (res.qsa && res.qsa.length > 0) {
        setMostrarQsa(true);
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao consultar Receita Federal.");
    } finally {
      setBuscandoCnpj(false);
    }
  };

  const handleBuscarCep = async () => {
    const raw = (cep || "").replace(/\D/g, "");
    if (raw.length !== 8) {
      toast.warning("Digite os 8 dígitos do CEP para busca rápida.");
      return;
    }

    setBuscandoCep(true);
    try {
      const res = await consultarCepBrasilAPI({ data: { cep: raw } });
      if (!res.sucesso) {
        toast.error(res.mensagemErro || "CEP não localizado.");
        return;
      }

      if (res.rua) setEndereco(res.rua);
      if (res.bairro) setBairro(res.bairro);
      if (res.cidade) setCidade(res.estado ? `${res.cidade} (${res.estado})` : res.cidade);
      toast.success("Endereço preenchido automaticamente pelo CEP!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao consultar CEP.");
    } finally {
      setBuscandoCep(false);
    }
  };

  const handleSalvar = () => {
    setSalvando(true);
    try {
      const patch: Partial<Empresa> = {
        nome,
        razaoSocial: razaoSocial || undefined,
        cnpj: cnpj || undefined,
        segmento,
        areaAtuacao: areaAtuacao || undefined,
        publicoAlvo: publicoAlvo || undefined,
        cidade,
        bairro: bairro || undefined,
        endereco,
        cep: cep || undefined,
        telefone: telefone || undefined,
        whatsapp: whatsapp || undefined,
        email: email || undefined,
        site: site || undefined,
        instagram: instagram || undefined,
        crmStage,
        observacoes: observacoes || undefined,
        buscasPartida: buscasPartida || undefined,
        termosEncontrados: termosEncontrados || undefined,
        buscaGoogleMaps: buscaGoogleMaps || undefined,
      };

      updateEmpresa(empresa.id, patch);
      toast.success("Cadastro da empresa salvo com sucesso no banco de dados!");

      if (onSaved) {
        onSaved({ ...empresa, ...patch });
      }
      onOpenChange(false);
    } catch {
      toast.error("Erro ao salvar cadastro.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <span>{nome || "Cadastro da Empresa"}</span>
                  <Badge variant="outline" className="text-xs font-normal">
                    {cidade}
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Atualize o perfil estratégico, área de atuação e parâmetros de busca para abordagens e relatórios.
                </DialogDescription>
              </div>
            </div>

            <Button
              size="sm"
              onClick={handlePreencherComIA}
              disabled={gerandoIA}
              className="gap-1.5 text-xs bg-gradient-to-r from-violet-600 via-indigo-600 to-primary text-white hover:opacity-90 shadow-sm"
            >
              {gerandoIA ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {gerandoIA ? "Pesquisando com IA..." : "Preencher com IA"}
            </Button>
          </div>
        </DialogHeader>

        <Tabs defaultValue="dados" className="space-y-4 pt-1">
          <TabsList className="bg-muted/60 p-1 border border-border/60 rounded-lg flex-wrap h-auto gap-1">
            <TabsTrigger value="dados" className="text-xs py-1.5 px-3 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-blue-500" />
              Identificação & Área de Atuação
            </TabsTrigger>
            <TabsTrigger value="contato" className="text-xs py-1.5 px-3 flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-emerald-500" />
              Localização & Contato
            </TabsTrigger>
            <TabsTrigger value="busca" className="text-xs py-1.5 px-3 flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5 text-amber-500" />
              Buscas de Partida & Google Maps
            </TabsTrigger>
            <TabsTrigger value="funil" className="text-xs py-1.5 px-3 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-indigo-500" />
              Funil CRM & Observações
            </TabsTrigger>
          </TabsList>

          {/* ABA 1: IDENTIFICAÇÃO E ÁREA DE ATUAÇÃO */}
          <TabsContent value="dados" className="space-y-4 mt-0">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Nome Comercial / Fantasia</Label>
                <Input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome da empresa"
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Razão Social (Opcional)</Label>
                <Input
                  value={razaoSocial}
                  onChange={(e) => setRazaoSocial(e.target.value)}
                  placeholder="Razão Social completa"
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <Landmark className="h-3 w-3 text-primary" />
                    CNPJ (Receita Federal)
                  </Label>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    BrasilAPI v1
                  </span>
                </div>
                <div className="flex gap-1.5">
                  <Input
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    placeholder="00.000.000/0000-00"
                    className="text-xs h-9 font-mono flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleBuscarCnpjReceita();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={buscandoCnpj || !cnpj}
                    onClick={handleBuscarCnpjReceita}
                    className="h-9 px-2.5 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10 shrink-0"
                    title="Consultar dados cadastrais na Receita Federal"
                  >
                    {buscandoCnpj ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <SearchCode className="h-3.5 w-3.5" />
                    )}
                    <span className="hidden sm:inline">Buscar Receita</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Segmento Principal</Label>
                <div className="flex gap-2">
                  <Input
                    value={segmento}
                    onChange={(e) => setSegmento(e.target.value)}
                    placeholder="Ex: Vinícola, Móveis Planejados"
                    className="text-xs h-9 flex-1"
                  />
                  <Select
                    value={segmento}
                    onValueChange={(v) => {
                      if (v !== "Outro") setSegmento(v);
                    }}
                  >
                    <SelectTrigger className="w-[110px] h-9 text-xs">
                      <SelectValue placeholder="Sugerir" />
                    </SelectTrigger>
                    <SelectContent>
                      {SEGMENTOS_SUGERIDOS.map((s) => (
                        <SelectItem key={s} value={s} className="text-xs">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* ÁREA DE ATUAÇÃO ESPECÍFICA (SOLICITADA PELO USUÁRIO) */}
            <div className="space-y-1.5 p-3 rounded-lg border border-primary/20 bg-primary/5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-primary flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Área de Atuação & Especialidade do Negócio
                </Label>
                <span className="text-[10px] text-muted-foreground">
                  Utilizada diretamente para personalizar abordagens e dossiês
                </span>
              </div>
              <Textarea
                rows={3}
                value={areaAtuacao}
                onChange={(e) => setAreaAtuacao(e.target.value)}
                placeholder="Descreva detalhadamente a especialidade, produtos principais ou nicho de clientes atendidos (ex: Fabricação de móveis sob medida de alto padrão para arquitetos e residências de luxo)."
                className="text-xs leading-relaxed bg-background"
              />
              <p className="text-[11px] text-muted-foreground">
                Esta área de atuação orientará a IA a criar abordagens com gancho específico nos serviços reais da empresa, evitando propostas genéricas.
              </p>
            </div>

            {/* PÚBLICO-ALVO DOS CLIENTES (SOLICITADO PELO USUÁRIO) */}
            <div className="space-y-1.5 p-3 rounded-lg border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/20">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  Público-Alvo dos Clientes (Quem busca e compra desta empresa)
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={gerandoPublicoAlvo}
                  onClick={handleSugerirPublicoAlvo}
                  className="h-6 px-2 text-[11px] gap-1 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
                >
                  {gerandoPublicoAlvo ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  Sugerir com IA
                </Button>
              </div>
              <Textarea
                rows={3}
                value={publicoAlvo}
                onChange={(e) => setPublicoAlvo(e.target.value)}
                placeholder="Quem são os potenciais compradores/clientes que buscam o serviço desta empresa? Ex: Proprietários de imóveis de médio e alto padrão na Serra Gaúcha, arquitetos parceiros, noivas, famílias exigentes..."
                className="text-xs leading-relaxed bg-background"
              />
              <p className="text-[11px] text-muted-foreground">
                Esta informação calibra o Relatório para o Lead, direcionando os hábitos de pesquisa, dores de compra e impacto em vendas para atrair esse perfil exato.
              </p>
            </div>
            {/* DADOS OFICIAIS DA RECEITA FEDERAL & QUADRO SOCIETÁRIO (QSA) */}
            {dadosReceita && (
              <div className="p-3.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      Dados Oficiais da Receita Federal ({dadosReceita.situacaoCadastral || "ATIVA"})
                    </span>
                  </div>
                  {dadosReceita.qsa && dadosReceita.qsa.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setMostrarQsa(!mostrarQsa)}
                      className="h-6 text-[11px] gap-1 text-emerald-700 dark:text-emerald-300"
                    >
                      <Users className="h-3 w-3" />
                      {dadosReceita.qsa.length} Sócios/QSA
                      {mostrarQsa ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                  {dadosReceita.cnaeDescricao && (
                    <div className="p-2 rounded bg-background/80 border border-border/50 col-span-2 sm:col-span-1">
                      <span className="text-muted-foreground block text-[10px]">CNAE Principal:</span>
                      <strong className="text-foreground leading-tight block truncate" title={dadosReceita.cnaeDescricao}>
                        {dadosReceita.cnaeDescricao}
                      </strong>
                    </div>
                  )}
                  {dadosReceita.capitalSocial !== undefined && (
                    <div className="p-2 rounded bg-background/80 border border-border/50">
                      <span className="text-muted-foreground block text-[10px]">Capital Social:</span>
                      <strong className="text-foreground">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                          dadosReceita.capitalSocial,
                        )}
                      </strong>
                    </div>
                  )}
                  {dadosReceita.dataAbertura && (
                    <div className="p-2 rounded bg-background/80 border border-border/50">
                      <span className="text-muted-foreground block text-[10px]">Abertura:</span>
                      <strong className="text-foreground">{dadosReceita.dataAbertura}</strong>
                    </div>
                  )}
                </div>

                {mostrarQsa && dadosReceita.qsa && dadosReceita.qsa.length > 0 && (
                  <div className="pt-2 border-t border-emerald-500/20 space-y-1.5">
                    <span className="text-[11px] font-semibold text-emerald-900 dark:text-emerald-200 block">
                      Quadro de Sócios e Administradores (Decisores):
                    </span>
                    <div className="grid sm:grid-cols-2 gap-1.5">
                      {dadosReceita.qsa.map((s, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded bg-background text-[11px] border border-border/60 flex items-center justify-between"
                        >
                          <span className="font-semibold text-foreground truncate">{s.nomeSocio}</span>
                          <Badge variant="outline" className="text-[10px] ml-2 shrink-0">
                            {s.qualificacaoSocio || "Sócio"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* ABA 2: LOCALIZAÇÃO & CONTATO */}
          <TabsContent value="contato" className="space-y-4 mt-0">
            {/* LINHA DE CEP COM BUSCA BRASILAPI */}
            <div className="p-3 rounded-lg border border-border/80 bg-muted/10 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                  Localização por CEP (BrasilAPI v2)
                </Label>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Preenche cidade, bairro e rua com 1 clique
                </span>
              </div>
              <div className="flex gap-2 max-w-sm">
                <Input
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  placeholder="00000-000"
                  className="text-xs h-9 font-mono"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleBuscarCep();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={buscandoCep || !cep}
                  onClick={handleBuscarCep}
                  className="h-9 px-3 text-xs gap-1.5 shrink-0"
                >
                  {buscandoCep ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Search className="h-3.5 w-3.5 text-primary" />
                  )}
                  Buscar CEP
                </Button>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Cidade (RS)</Label>
                <Input
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  placeholder="Cidade"
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Bairro</Label>
                <Input
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  placeholder="Bairro"
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Endereço Completo</Label>
                <Input
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Rua, número"
                  className="text-xs h-9"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Telefone Fixo / Comercial</Label>
                <Input
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(54) 3456-7890"
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">WhatsApp Comercial</Label>
                <Input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="(54) 99999-0000"
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">E-mail Comercial</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@empresa.com.br"
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Site Oficial</Label>
                <Input
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                  placeholder="https://empresa.com.br"
                  className="text-xs h-9"
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs font-medium">Instagram Oficial (@ ou URL)</Label>
                <Input
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@perfil ou https://instagram.com/perfil"
                  className="text-xs h-9"
                />
              </div>
            </div>
          </TabsContent>

          {/* ABA 3: TERMOS DE BUSCA E RELATÓRIO PARA LEADS */}
          <TabsContent value="busca" className="space-y-4 mt-0">
            <div className="p-3 rounded-lg border bg-muted/30 text-xs text-muted-foreground flex items-center justify-between gap-3">
              <div>
                <span className="font-semibold text-foreground">Campos de Inteligência de Busca e SEO</span>
                <p className="mt-0.5">
                  Estes termos são utilizados no gerador do <strong>Relatório para Leads</strong> e alimentam os argumentos de visibilidade nas abordagens.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handlePreencherComIA}
                disabled={gerandoIA}
                className="gap-1 text-xs shrink-0"
              >
                <Sparkles className="h-3 w-3 text-amber-500" />
                Atualizar via IA
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5 text-blue-500" />
                  Buscas de partida (uma por linha)
                </Label>
                <Textarea
                  rows={6}
                  value={buscasPartida}
                  onChange={(e) => setBuscasPartida(e.target.value)}
                  placeholder={`Exemplo:\n${segmento || "móveis"} em ${cidade || "Bento Gonçalves"}\nmelhor ${segmento || "vinícola"} ${cidade || "Caxias do Sul"}\nonde comprar ${segmento || "móveis"}`}
                  className="text-xs font-mono leading-relaxed"
                />
                <p className="text-[11px] text-muted-foreground">
                  Termos que as pessoas digitam no Google para descobrir fornecedores deste nicho.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Termos encontrados (uma por linha)
                </Label>
                <Textarea
                  rows={6}
                  value={termosEncontrados}
                  onChange={(e) => setTermosEncontrados(e.target.value)}
                  placeholder={`Exemplo:\n${segmento || "móveis"} ${cidade || "Bento Gonçalves"}\n${segmento || "marcenaria"} sob medida\n${nome} fotos\n${segmento || "vinhos"} preço`}
                  className="text-xs font-mono leading-relaxed"
                />
                <p className="text-[11px] text-muted-foreground">
                  Palavras-chave de alto valor de conversão associadas a esta empresa e região.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-rose-500" />
                Busca no Google Maps / Google
              </Label>
              <Input
                value={buscaGoogleMaps}
                onChange={(e) => setBuscaGoogleMaps(e.target.value)}
                placeholder={`Exemplo: ${nome} ${segmento} em ${cidade} RS`}
                className="text-xs h-9 font-medium"
              />
              <p className="text-[11px] text-muted-foreground">
                Termo exato utilizado para testar a posição da empresa no Google Maps e comparar com concorrentes no relatório.
              </p>
            </div>
          </TabsContent>

          {/* ABA 4: FUNIL CRM E OBSERVAÇÕES */}
          <TabsContent value="funil" className="space-y-4 mt-0">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Etapa no Funil de Vendas (Kanban CRM)</Label>
              <Select value={crmStage} onValueChange={(v) => setCrmStage(v as CrmStage)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CRM_STAGES_ORDER.map((stage) => (
                    <SelectItem key={stage} value={stage} className="text-xs">
                      {CRM_STAGE_LABEL[stage]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Observações Internas & Contexto Comercial</Label>
              <Textarea
                rows={5}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Anotações sobre decisores, faturamento estimado, conversas prévias, objeções ou prioridades de contato..."
                className="text-xs leading-relaxed"
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="border-t pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="text-xs h-8 gap-1"
            >
              <Link to="/analise-cliente" search={{ empresa: empresa.id, tab: "dossier" }}>
                <MessageSquareText className="h-3.5 w-3.5 text-primary" />
                Dossiê 360
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="text-xs h-8 gap-1"
            >
              <Link to="/analise-cliente" search={{ empresa: empresa.id, tab: "relatorio" }}>
                <FileText className="h-3.5 w-3.5 text-blue-500" />
                Relatório p/ Lead
              </Link>
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-9"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSalvar}
              disabled={salvando}
              className="text-xs h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {salvando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Salvar Cadastro
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
