import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  redirect,
  isRedirect,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { StoreProvider } from "@/lib/store";
import { AppShell } from "@/components/app-shell";
import { Toaster } from "@/components/ui/sonner";
import { isUnlocked } from "@/lib/gate.functions";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  // Se o erro for um redirecionamento do TanStack Router, re-lança para que o router conclua a navegação
  if (isRedirect(error)) {
    throw error;
  }

  console.error("[TanStack Root Error]", error);
  const router = useRouter();
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);

  useEffect(() => {
    reportLovableError(error as Error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  const mensagemErro =
    error instanceof Response
      ? `Resposta HTTP ${error.status}: ${error.statusText || error.url || "Falha na comunicação com o servidor"}`
      : error instanceof Error
        ? error.message
        : String(error);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-lg text-center w-full">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Algo não carregou
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tente novamente ou volte ao dashboard.
        </p>

        {mensagemErro && mensagemErro !== "undefined" && (
          <div className="mt-4 p-3 bg-muted/40 border border-border/80 rounded-lg text-left text-xs font-mono text-muted-foreground">
            <p className="font-semibold text-rose-500 mb-1">{mensagemErro}</p>
            {error instanceof Error && error.stack && (
              <div>
                <button
                  type="button"
                  onClick={() => setMostrarDetalhes(!mostrarDetalhes)}
                  className="text-[10px] text-primary hover:underline mt-1"
                >
                  {mostrarDetalhes ? "Ocultar stack trace" : "Ver detalhes técnicos"}
                </button>
                {mostrarDetalhes && (
                  <pre className="text-[10px] mt-2 max-h-40 overflow-auto whitespace-pre-wrap opacity-75">
                    {error.stack}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Recarregar página
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: async ({ location }) => {
    if (location.pathname === "/unlock") return {};
    try {
      const { unlocked } = await isUnlocked();
      if (!unlocked) {
        const next = `${location.pathname}${location.searchStr}${location.hash}`;
        throw redirect({ to: "/unlock", search: { next } });
      }
    } catch (err: any) {
      if (isRedirect(err)) throw err;
      console.warn("[Root beforeLoad] Verificação de bloqueio falhou, liberando acesso:", err);
    }
    return {};
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Locomotiva CRM · Radar de Presença Digital" },
      {
        name: "description",
        content:
          "Plataforma de inteligência comercial, CRM e diagnóstico de presença digital da Locomotiva Comunicação para empresas do Rio Grande do Sul e Serra Gaúcha.",
      },
      { name: "author", content: "Locomotiva Comunicação" },
      { property: "og:title", content: "Locomotiva CRM · Radar de Presença Digital" },
      {
        property: "og:description",
        content:
          "Plataforma de inteligência comercial, CRM e diagnóstico de presença digital da Locomotiva Comunicação para empresas do Rio Grande do Sul e Serra Gaúcha.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Locomotiva CRM · Radar de Presença Digital" },
      { name: "twitter:description", content: "Plataforma de inteligência comercial, CRM e diagnóstico de presença digital da Locomotiva Comunicação para empresas do Rio Grande do Sul e Serra Gaúcha." },
      { property: "og:image", content: "/logo.png" },
      { name: "twitter:image", content: "/logo.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/logo.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <AppShell>
          <Outlet />
        </AppShell>
        <Toaster richColors position="top-right" />
      </StoreProvider>
    </QueryClientProvider>
  );
}
