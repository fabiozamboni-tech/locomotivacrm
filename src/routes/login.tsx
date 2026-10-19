import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { oauthReturnPath } from "@/lib/oauth-return-path";

export const Route = createFileRoute("/login")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" ? s.next : "/",
  }),
  head: () => ({
    meta: [
      { title: "Entrar · Radar de Presença Digital" },
      { name: "description", content: "Entre com sua conta para conectar assistentes de IA ao Radar." },
      { property: "og:title", content: "Entrar · Radar de Presença Digital" },
      { property: "og:description", content: "Entre com sua conta para conectar assistentes de IA ao Radar." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { next } = Route.useSearch();
  const target = oauthReturnPath(next);
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setMsg(error.message);
      window.location.assign(target);
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: new URL(target, window.location.origin).href },
      });
      setBusy(false);
      if (error) return setMsg(error.message);
      setMsg("Conta criada. Confirme pelo link enviado ao seu e-mail.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground">
      <Card className="w-full max-w-sm p-6 border-border/60">
        <h1 className="text-xl font-bold">{mode === "in" ? "Entrar" : "Criar conta"}</h1>
        <p className="text-sm text-muted-foreground mt-1 mb-4">Conta usada para conectar assistentes de IA.</p>
        <form onSubmit={submit} className="space-y-3">
          <Input placeholder="E-mail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input placeholder="Senha" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          {msg && <p role="alert" className="text-sm text-muted-foreground">{msg}</p>}
          <Button type="submit" className="w-full" disabled={busy}>{mode === "in" ? "Entrar" : "Criar conta"}</Button>
          <button type="button" className="w-full text-xs text-muted-foreground underline" onClick={() => setMode(mode === "in" ? "up" : "in")}>
            {mode === "in" ? "Não tem conta? Criar conta" : "Já tem conta? Entrar"}
          </button>
        </form>
      </Card>
    </div>
  );
}
