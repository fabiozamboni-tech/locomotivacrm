import { FileText } from "lucide-react";
import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { LocomotivaLogo } from "@/components/locomotiva-logo";
import {
  LayoutDashboard,
  Building2,
  Kanban,
  MessageSquareText,
  Wand2,
  Upload,
  Settings,
  ShieldCheck,
  Radar,
  Moon,
  Sun,
  Search,
  LogOut,
  Database,
  Sparkles,
  Palette,
} from "lucide-react";
import { lockSite } from "@/lib/gate.functions";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, type ReactNode } from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/empresas", label: "Empresas", icon: Building2 },
  { to: "/crm", label: "Funil CRM", icon: Kanban },
  { to: "/analise-cliente", label: "Análise do cliente", icon: Sparkles },
  { to: "/estudio-criacao", label: "Estúdio de Criação", icon: Palette },
  { to: "/importar", label: "Importar / Exportar", icon: Upload },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
  { to: "/compliance", label: "Compliance & LGPD", icon: ShieldCheck },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const router = useRouter();
  const lock = useServerFn(lockSite);
  const { theme, toggleTheme, empresas, empresasAtivas, dbSyncStatus, syncNow, databaseInfo } = useStore();
  const ativas = empresasAtivas || empresas.filter((e) => e.crmStage !== "excluidos");
  const [openSearch, setOpenSearch] = useState(false);

  if (pathname === "/login" || pathname === "/unlock") return <>{children}</>;

  async function handleLock() {
    await lock();
    await router.invalidate();
    await router.navigate({ to: "/unlock" });
  }

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border/60 bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-sidebar-border/60">
          <LocomotivaLogo size="md" showText subtitulo="Presença Digital · RS" />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to as "/"}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{n.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border/60 p-3 text-[11px] text-muted-foreground">
          <div className="rounded-md bg-sidebar-accent/40 p-3">
            <div className="font-medium text-sidebar-accent-foreground mb-1">Foco atual</div>
            Rio Grande do Sul · Serra Gaúcha
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/60 bg-background/80 backdrop-blur px-4 md:px-6 h-14">
          <div className="md:hidden flex items-center shrink-0">
            <LocomotivaLogo size="sm" />
          </div>
          <button
            onClick={() => setOpenSearch(true)}
            className="flex-1 flex items-center gap-2 rounded-md border border-input bg-muted/40 px-3 h-9 text-sm text-muted-foreground max-w-md hover:bg-muted/70 transition"
          >
            <Search className="h-4 w-4" />
            Buscar empresa, cidade, segmento…
            <span className="ml-auto text-[10px] rounded border px-1.5 py-0.5">⌘K</span>
          </button>
          <button
            onClick={() => void syncNow()}
            title={
              databaseInfo?.mode === "supabase"
                ? "Banco de Dados: Supabase PostgreSQL (Ativo e Sincronizado)"
                : "Banco de Dados: Servidor Persistente (Ativo e Sincronizado). Clique para sincronizar."
            }
            className={cn(
              "hidden sm:inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors",
              dbSyncStatus === "syncing"
                ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                : dbSyncStatus === "error"
                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20",
            )}
          >
            <Database className={cn("h-3.5 w-3.5", dbSyncStatus === "syncing" && "animate-spin")} />
            <span className="font-medium">
              {dbSyncStatus === "syncing"
                ? "Sincronizando..."
                : databaseInfo?.mode === "supabase"
                  ? "Nuvem Conectada"
                  : "Banco Conectado"}
            </span>
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                dbSyncStatus === "syncing"
                  ? "bg-amber-400 animate-pulse"
                  : dbSyncStatus === "error"
                    ? "bg-destructive"
                    : "bg-emerald-400",
              )}
            />
          </button>
          <Badge variant="outline" className="hidden lg:inline-flex gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {ativas.length} empresas mapeadas
          </Badge>
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Alternar tema">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLock} aria-label="Sair" title="Sair">
            <LogOut className="h-4 w-4" />
          </Button>
        </header>

        <main className="flex-1 min-w-0">{children}</main>
      </div>

      <CommandDialog open={openSearch} onOpenChange={setOpenSearch}>
        <CommandInput placeholder="Buscar empresas, cidades, segmentos..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado.</CommandEmpty>
          <CommandGroup heading="Empresas">
            {ativas.slice(0, 20).map((e) => (
              <CommandItem
                key={e.id}
                value={`${e.nome} ${e.cidade} ${e.segmento}`}
                onSelect={() => {
                  setOpenSearch(false);
                  window.location.href = `/empresas/${e.id}`;
                }}
              >
                <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="flex-1">{e.nome}</span>
                <span className="text-xs text-muted-foreground">{e.cidade}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
