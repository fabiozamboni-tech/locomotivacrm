import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Radar } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("comercial@agencia.com");

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
          <h2 className="text-3xl font-bold leading-tight">Inteligência de prospecção para a Serra Gaúcha.</h2>
          <p className="text-muted-foreground text-sm">
            Diagnóstico automático de presença digital, score de oportunidade e abordagens comerciais consultivas — de Caxias a Gramado.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">Uso interno · dados públicos · revisão humana.</div>
      </div>
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-sm p-6 border-border/60">
          <div className="mb-6">
            <h1 className="text-xl font-bold">Entrar no Radar</h1>
            <p className="text-sm text-muted-foreground mt-1">Acesso comercial e estratégico da agência.</p>
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); navigate({ to: "/" }); }}
            className="space-y-3"
          >
            <div>
              <label className="text-xs text-muted-foreground">E-mail</label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Senha</label>
              <Input type="password" defaultValue="demo" />
            </div>
            <Button type="submit" className="w-full">Entrar</Button>
            <p className="text-[11px] text-muted-foreground text-center">
              Demonstração — qualquer credencial acessa a área comercial.
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}
