import { cn } from "@/lib/utils";

interface LocomotivaLogoProps {
  className?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  subtitulo?: string;
}

const SIZES = {
  xs: "h-6 w-6",
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-11 w-11",
  xl: "h-14 w-14",
};

export function LocomotivaLogo({
  className,
  size = "md",
  showText = false,
  subtitulo = "Presença Digital · RS",
}: LocomotivaLogoProps) {
  const sizeClass = SIZES[size] || SIZES.md;

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "relative shrink-0 rounded-full overflow-hidden shadow-xs border border-primary/20 bg-[#d91b5c] flex items-center justify-center p-0.5",
          sizeClass
        )}
      >
        <img
          src="/logo.png"
          alt="Locomotiva CRM"
          className="w-full h-full object-contain rounded-full"
        />
      </div>
      {showText && (
        <div className="min-w-0 leading-tight">
          <div className="text-sm font-bold tracking-tight text-foreground truncate flex items-center gap-1">
            <span>Locomotiva</span>
            <span className="text-primary font-black">CRM</span>
          </div>
          {subtitulo && (
            <div className="text-[11px] text-muted-foreground truncate font-medium">
              {subtitulo}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
