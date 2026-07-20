import { Link, useRouterState } from "@tanstack/react-router";
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
} from "lucide-react";
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

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/empresas", label: "Empresas", icon: Building2 },
  { to: "/crm", label: "Funil CRM", icon: Kanban },
  { to: "/abordagem", label: "Abordagens", icon: MessageSquareText },
  { to: "/prompts", label: "Prompts IA", icon: Wand2 },
  { to: "/importar", label: "Importar / Exportar", icon: Upload },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
  { to: "/compliance", label: "Compliance & LGPD", icon: ShieldCheck },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { theme, toggleTheme, empresas } = useStore();
  const [openSearch, setOpenSearch] = useState(false);

  if (pathname === "/login") return <>{children}</>;

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border/60 bg-sidebar text-sidebar-foreground">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-sidebar-border/60">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Radar className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold leading-tight truncate">Radar</div>
            <div className="text-[11px] text-muted-foreground leading-tight">Presença Digital · RS</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
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
          <button
            onClick={() => setOpenSearch(true)}
            className="flex-1 flex items-center gap-2 rounded-md border border-input bg-muted/40 px-3 h-9 text-sm text-muted-foreground max-w-md hover:bg-muted/70 transition"
          >
            <Search className="h-4 w-4" />
            Buscar empresa, cidade, segmento…
            <span className="ml-auto text-[10px] rounded border px-1.5 py-0.5">⌘K</span>
          </button>
          <Badge variant="outline" className="hidden lg:inline-flex gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {empresas.length} empresas mapeadas
          </Badge>
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Alternar tema">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </header>

        <main className="flex-1 min-w-0">{children}</main>
      </div>

      <CommandDialog open={openSearch} onOpenChange={setOpenSearch}>
        <CommandInput placeholder="Buscar empresas, cidades, segmentos..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado.</CommandEmpty>
          <CommandGroup heading="Empresas">
            {empresas.slice(0, 20).map((e) => (
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
