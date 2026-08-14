import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { Radar, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { unlockSite } from "@/lib/gate.functions";

export const Route = createFileRoute("/unlock")({
  validateSearch: z.object({
    next: z.string().optional().catch(undefined),
  }),
  component: UnlockPage,
  head: () => ({
    meta: [
      { title: "Acesso restrito · Radar de Presença Digital" },
      { name: "description", content: "Área de acesso interno da agência." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

function UnlockPage() {
  const { next } = Route.useSearch();
  const unlock = useServerFn(unlockSite);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { ok } = await unlock({ data: { password } });
      if (ok) {
        const destination = next?.startsWith("/") && !next.startsWith("//") ? next : "/";
        window.location.assign(destination);
      } else {
        setError("Palavra-passe incorreta. Tente novamente.");
      }
    } catch {
      setError("Não foi possível iniciar a sessão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background text-foreground">
      <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-primary/15 via-background to-background border-r border-border/60">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Radar className="h-5 w-5" />
          </div>
          <span className="font-semibold">Radar de Presença Digital</span>
        </div>
        <div className="space-y-3 max-w-md">
          <h2 className="text-3xl font-bold leading-tight">Área interna protegida.</h2>
          <p className="text-muted-foreground text-sm">
            Inteligência comercial e diagnóstico de presença digital para a Serra Gaúcha. Uso restrito à equipa da agência.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          Acesso partilhado · revisão humana · LGPD.
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-sm p-6 border-border/60">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Entrar no Radar</h1>
              <p className="text-xs text-muted-foreground">Introduza a palavra-passe da equipa.</p>
            </div>
          </div>
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Palavra-passe</label>
              <Input
                type="password"
                autoComplete="current-password"
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
              />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading || !password}>
              {loading ? "A validar..." : "Entrar"}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">
              Acesso interno · a palavra-passe é partilhada pela agência.
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}
