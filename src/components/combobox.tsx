import * as React from "react";
import { Check, ChevronsUpDown, ArrowUp, ArrowRight, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export function TrendIcon({ trend, className }: { trend?: number; className?: string }) {
  if (trend === undefined || trend === null) return null;
  if (trend >= 2)
    return <ArrowUp className={cn("mr-1.5 h-3.5 w-3.5 shrink-0 text-emerald-500", className)} />;
  if (trend === 1)
    return <ArrowRight className={cn("mr-1.5 h-3.5 w-3.5 shrink-0 text-amber-500", className)} />;
  return <ArrowDown className={cn("mr-1.5 h-3.5 w-3.5 shrink-0 text-rose-500", className)} />;
}


export interface ComboboxOption {
  value: string;
  label: string;
  group?: string;
  /** Texto auxiliar mostrado à direita do rótulo (ex: habitantes, PIB). */
  detail?: string;
  /** Força económica: 0 = fraca, 1 = média, 2 = forte. Mostra seta visual. */
  trend?: number;
}


interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  /** Permite usar o texto digitado como valor (campo livre). */
  allowCustom?: boolean;
  disabled?: boolean;
  className?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Selecionar…",
  searchPlaceholder = "Pesquisar…",
  emptyText = "Nenhum resultado",
  allowCustom = false,
  disabled,
  className,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const selected = options.find((o) => o.value === value);
  const label = selected?.label ?? value;

  const grouped = React.useMemo(() => {
    const map = new Map<string, ComboboxOption[]>();
    for (const o of options) {
      const key = o.group ?? "";
      const list = map.get(key);
      if (list) list.push(o);
      else map.set(key, [o]);
    }
    return [...map.entries()];
  }, [options]);

  const select = (v: string) => {
    onChange(v);
    setOpen(false);
    setQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn("w-full justify-between font-normal", !label && "text-muted-foreground", className)}
        >
          <span className="truncate">{label || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} value={query} onValueChange={setQuery} />
          <CommandList className="max-h-72">
            <CommandEmpty>
              {allowCustom && query.trim() ? (
                <button
                  type="button"
                  className="w-full px-2 py-1.5 text-left text-sm hover:underline"
                  onClick={() => select(query.trim())}
                >
                  Usar “{query.trim()}”
                </button>
              ) : (
                emptyText
              )}
            </CommandEmpty>
            {allowCustom && query.trim() && !options.some((o) => o.label.toLowerCase() === query.trim().toLowerCase()) && (
              <CommandGroup heading="Digitado">
                <CommandItem value={`__custom_${query}`} onSelect={() => select(query.trim())}>
                  Usar “{query.trim()}”
                </CommandItem>
              </CommandGroup>
            )}
            {grouped.map(([group, list]) => (
              <CommandGroup key={group || "geral"} heading={group || undefined}>
                {list.map((o) => (
                  <CommandItem key={o.value} value={`${o.label} ${o.value}`} onSelect={() => select(o.value)}>
                    <Check className={cn("mr-2 h-4 w-4 shrink-0", value === o.value ? "opacity-100" : "opacity-0")} />
                    <TrendIcon trend={o.trend} />
                    <span className="truncate">{o.label}</span>
                    {o.detail && (
                      <span className="ml-auto pl-2 text-[11px] text-muted-foreground whitespace-nowrap">
                        {o.detail}
                      </span>
                    )}
                  </CommandItem>
                ))}

              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
