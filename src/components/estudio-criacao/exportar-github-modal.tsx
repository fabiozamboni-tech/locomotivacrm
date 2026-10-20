import React, { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Github,
  CheckCircle2,
  ExternalLink,
  Copy,
  Loader2,
  Lock,
  Globe,
  Sparkles,
  Terminal,
} from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  criarRepositorioGithub_ServerFn,
  type CriarRepositorioGithubOutput,
} from "@/lib/github-export.server";
import { getApiSettings, saveGithubConfig } from "@/lib/api-settings";
import type { Empresa } from "@/lib/mock-data";

interface ExportarGithubModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empresa: Empresa;
  htmlContent: string;
  onSuccess?: (repoUrl: string) => void;
}

export function ExportarGithubModal({
  open,
  onOpenChange,
  empresa,
  htmlContent,
  onSuccess,
}: ExportarGithubModalProps) {
  const criarRepoFn = useServerFn(criarRepositorioGithub_ServerFn);

  const [token, setToken] = useState("");
  const [repoName, setRepoName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<CriarRepositorioGithubOutput | null>(null);

  useEffect(() => {
    if (open) {
      const settings = getApiSettings();
      setToken(settings.github?.token || "");
      const slug = empresa.nome
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      setRepoName(`site-${slug}`);
      setResultado(null);
    }
  }, [open, empresa.nome]);

  const handleCriar = async () => {
    if (!token.trim()) {
      toast.error("Informe seu Token de Acesso Pessoal do GitHub.");
      return;
    }
    if (!repoName.trim()) {
      toast.error("Informe o nome do repositório.");
      return;
    }

    try {
      setLoading(true);
      // Salva token nas configurações locais para uso futuro
      saveGithubConfig({ token: token.trim() });

      const res = await criarRepoFn({
        data: {
          token: token.trim(),
          repoName: repoName.trim(),
          isPrivate,
          empresaNome: empresa.nome,
          segmento: empresa.segmento,
          cidade: empresa.cidade,
          htmlContent,
        },
      });

      if (res.sucesso) {
        setResultado(res);
        toast.success(res.mensagem);
        if (onSuccess && res.repoUrl) {
          onSuccess(res.repoUrl);
        }
      } else {
        toast.error(res.mensagem || "Erro ao criar repositório no GitHub.");
      }
    } catch (err: any) {
      toast.error(err.message || "Falha na requisição para o GitHub.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado para a área de transferência!`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Github className="h-5 w-5" />
            <span>Exportar Site para Repositório no GitHub</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Crie um repositório Git com o código da landing page, pronto para editar no Lovable e clonar no Antigravity.
          </DialogDescription>
        </DialogHeader>

        {!resultado ? (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold flex items-center justify-between">
                <span>Personal Access Token do GitHub</span>
                <span className="text-[10px] text-muted-foreground font-normal">Permissão: repo</span>
              </label>
              <Input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="ghp_..."
                className="text-xs font-mono h-9"
              />
              <p className="text-[10px] text-muted-foreground">
                Seu token é salvo localmente no navegador e usado apenas para criar os arquivos do site.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold">Nome do Repositório</label>
              <div className="flex items-center gap-1.5">
                <Input
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="site-empresa"
                  className="text-xs font-mono h-9"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
              <div className="space-y-0.5">
                <span className="text-xs font-medium flex items-center gap-1.5">
                  {isPrivate ? <Lock className="h-3.5 w-3.5 text-amber-500" /> : <Globe className="h-3.5 w-3.5 text-emerald-500" />}
                  <span>{isPrivate ? "Repositório Privado" : "Repositório Público"}</span>
                </span>
                <p className="text-[11px] text-muted-foreground">
                  {isPrivate ? "Apenas você e colaboradores autorizados têm acesso." : "Visível na comunidade e fácil de importar em ferramentas."}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPrivate(!isPrivate)}
                className="text-xs h-7"
              >
                Mudar para {isPrivate ? "Público" : "Privado"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-3">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="h-5 w-5" />
                <span>Repositório Criado com Sucesso!</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Todos os arquivos (<code className="font-mono text-[11px]">index.html</code>, <code className="font-mono text-[11px]">README.md</code>, <code className="font-mono text-[11px]">package.json</code>) foram commitados.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-lg border bg-card text-xs">
                <div className="flex items-center gap-2 truncate">
                  <Github className="h-4 w-4 shrink-0" />
                  <span className="font-mono truncate">{resultado.repoUrl}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(resultado.repoUrl || "", "Link")}
                    className="h-7 w-7 p-0"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(resultado.repoUrl, "_blank")}
                    className="h-7 text-xs gap-1"
                  >
                    <ExternalLink className="h-3 w-3" /> Ver no GitHub
                  </Button>
                </div>
              </div>

              {/* OPÇÃO LOVABLE */}
              <div className="p-3 rounded-lg border border-border bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-xs">
                    <Sparkles className="h-4 w-4 text-pink-500" />
                    <span>Continuar Edição no Lovable</span>
                  </div>
                  <Badge variant="outline" className="text-[10px]">1-Clique</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Importe este repositório no Lovable para continuar aprimorando com o agente do Lovable.
                </p>
                <Button
                  size="sm"
                  onClick={() => window.open("https://lovable.dev", "_blank")}
                  className="w-full text-xs gap-1.5 bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:opacity-90 h-8"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Abrir Lovable.dev (Importar Repositório)
                </Button>
              </div>

              {/* OPÇÃO ANTIGRAVITY */}
              <div className="p-3 rounded-lg border border-border bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-xs">
                    <Terminal className="h-4 w-4 text-blue-500" />
                    <span>Clonar no Antigravity / Terminal</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(`git clone ${resultado.cloneUrl}`, "Comando Git")}
                    className="h-6 text-[10px] gap-1 px-2"
                  >
                    <Copy className="h-3 w-3" /> Copiar Comando
                  </Button>
                </div>
                <div className="p-2 rounded bg-muted/60 font-mono text-[11px] text-muted-foreground break-all select-all">
                  git clone {resultado.cloneUrl}
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {!resultado ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleCriar}
                disabled={loading}
                className="text-xs gap-1.5 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Github className="h-3.5 w-3.5" />}
                {loading ? "Criando Repositório..." : "Criar no GitHub"}
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs w-full"
            >
              Concluído
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
