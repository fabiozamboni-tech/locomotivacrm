import { useState, useEffect } from "react";
import { extrairDominio, obterLogoUrl, obterFaviconUrl } from "@/lib/public-apis.functions";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmpresaLogoProps {
  site?: string | null;
  nome: string;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
}

const SIZE_CLASSES = {
  xs: "w-5 h-5 text-[10px]",
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-12 h-12 text-base",
};

export function EmpresaLogo({
  site,
  nome,
  className,
  size = "md",
}: EmpresaLogoProps) {
  const [fase, setFase] = useState<"logo" | "favicon" | "fallback">("logo");
  const dominio = site ? extrairDominio(site) : null;

  useEffect(() => {
    setFase("logo");
  }, [site]);

  const logoUrl = dominio ? obterLogoUrl(dominio) : null;
  const faviconUrl = dominio ? obterFaviconUrl(dominio, 128) : null;

  const iniciais = (nome || "E")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join("");

  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  if (dominio && fase === "logo" && logoUrl) {
    return (
      <div
        className={cn(
          "relative shrink-0 rounded-md bg-white p-1 border border-border/60 shadow-2xs overflow-hidden flex items-center justify-center",
          sizeClass,
          className,
        )}
      >
        <img
          src={logoUrl}
          alt={`Logo ${nome}`}
          className="w-full h-full object-contain"
          onError={() => setFase("favicon")}
          loading="lazy"
        />
      </div>
    );
  }

  if (dominio && fase === "favicon" && faviconUrl) {
    return (
      <div
        className={cn(
          "relative shrink-0 rounded-md bg-muted/40 p-1 border border-border/60 shadow-2xs overflow-hidden flex items-center justify-center",
          sizeClass,
          className,
        )}
      >
        <img
          src={faviconUrl}
          alt={`Favicon ${nome}`}
          className="w-full h-full object-contain"
          onError={() => setFase("fallback")}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative shrink-0 rounded-md bg-gradient-to-br from-primary/10 via-primary/5 to-muted border border-primary/20 text-primary font-bold flex items-center justify-center select-none shadow-2xs",
        sizeClass,
        className,
      )}
      title={nome}
    >
      {iniciais ? (
        <span>{iniciais}</span>
      ) : (
        <Building2 className="w-1/2 h-1/2 opacity-70" />
      )}
    </div>
  );
}
