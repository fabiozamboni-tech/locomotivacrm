import { useState } from "react";
import { obterQrCodeUrl } from "@/lib/public-apis.functions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  QrCode,
  Download,
  Copy,
  ExternalLink,
  MessageCircle,
  Globe,
  Share2,
} from "lucide-react";

interface QrCodeCardProps {
  nomeEmpresa?: string;
  whatsapp?: string;
  site?: string;
  className?: string;
}

export function QrCodeCard({
  nomeEmpresa,
  whatsapp,
  site,
  className,
}: QrCodeCardProps) {
  const [modo, setModo] = useState<"whatsapp" | "site" | "custom">(
    whatsapp ? "whatsapp" : site ? "site" : "custom",
  );

  const cleanWhats = (whatsapp || "").replace(/\D/g, "");
  const formattedWhats = cleanWhats.length >= 10 && !cleanWhats.startsWith("55")
    ? `55${cleanWhats}`
    : cleanWhats;

  const urlWhatsPadrao = formattedWhats
    ? `https://wa.me/${formattedWhats}?text=${encodeURIComponent(
        `Olá! Estou entrando em contato referente à presença digital de ${nomeEmpresa || "sua empresa"}.`,
      )}`
    : "";

  const [linkCustom, setLinkCustom] = useState(
    site?.startsWith("http") ? site : site ? `https://${site}` : "",
  );

  const urlFinal =
    modo === "whatsapp"
      ? urlWhatsPadrao || "https://wa.me/"
      : modo === "site"
      ? site?.startsWith("http")
        ? site
        : `https://${site || "locomotiva.live"}`
      : linkCustom || "https://locomotiva.live";

  const qrUrl = obterQrCodeUrl(urlFinal, 300);

  const handleCopiarLink = () => {
    navigator.clipboard.writeText(urlFinal);
    toast.success("Link do QR Code copiado para a área de transferência!");
  };

  const handleBaixarPng = async () => {
    try {
      const res = await fetch(qrUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `qrcode-${String(nomeEmpresa || "lead").toLowerCase().replace(/\s+/g, "-")}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      toast.success("QR Code baixado em alta resolução PNG!");
    } catch {
      window.open(qrUrl, "_blank");
    }
  };

  return (
    <Card className={`border-border/80 shadow-xs ${className || ""}`}>
      <CardHeader className="pb-3 border-b bg-muted/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <QrCode className="h-4 w-4 text-primary" />
                <span>QR Code Dinâmico para Propostas & Slides</span>
              </CardTitle>
              <Badge variant="secondary" className="text-[10px] font-mono">
                QR Server API
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Acesso instantâneo via celular para apresentações em slides, propostas em PDF ou balcão.
            </CardDescription>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopiarLink}
              className="h-7 text-xs gap-1"
            >
              <Copy className="h-3 w-3" />
              Copiar Link
            </Button>
            <Button
              size="sm"
              onClick={handleBaixarPng}
              className="h-7 text-xs gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Download className="h-3 w-3" />
              Baixar PNG
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* SELETOR DE MODO */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Tabs
            value={modo}
            onValueChange={(v: any) => setModo(v)}
            className="w-full sm:w-auto"
          >
            <TabsList className="h-8 p-1">
              {whatsapp && (
                <TabsTrigger value="whatsapp" className="text-xs h-6 px-2.5 gap-1.5">
                  <MessageCircle className="h-3 w-3 text-emerald-500" />
                  WhatsApp Direto
                </TabsTrigger>
              )}
              {site && (
                <TabsTrigger value="site" className="text-xs h-6 px-2.5 gap-1.5">
                  <Globe className="h-3 w-3 text-blue-500" />
                  Site da Empresa
                </TabsTrigger>
              )}
              <TabsTrigger value="custom" className="text-xs h-6 px-2.5 gap-1.5">
                <Share2 className="h-3 w-3 text-purple-500" />
                Link Personalizado
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {modo === "custom" && (
            <div className="w-full sm:w-72">
              <Input
                placeholder="https://sua-proposta.com ou texto livre"
                value={linkCustom}
                onChange={(e) => setLinkCustom(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
          )}
        </div>

        {/* CONTAINER COM QR CODE E METADADOS */}
        <div className="flex flex-col sm:flex-row items-center gap-4 p-3 rounded-xl border border-border/60 bg-muted/20">
          <div className="p-2.5 rounded-lg bg-white border border-border shadow-xs shrink-0 flex items-center justify-center">
            <img
              src={qrUrl}
              alt="QR Code"
              className="w-32 h-32 object-contain"
              loading="lazy"
            />
          </div>

          <div className="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
              <Badge variant="outline" className="text-[11px] font-semibold bg-background">
                {modo === "whatsapp"
                  ? "Conversa no WhatsApp"
                  : modo === "site"
                  ? "Acesso ao Site Oficial"
                  : "Link de Compartilhamento"}
              </Badge>
              <span className="text-[10px] text-muted-foreground">300x300 px</span>
            </div>

            <p className="text-xs text-muted-foreground break-all font-mono bg-background/80 p-2 rounded border border-border/40 select-all">
              {urlFinal}
            </p>

            <p className="text-[11px] text-muted-foreground">
              Ideal para ser posicionado no <strong>Slide de Ação Final (slide fim)</strong> da apresentação
              ou enviado em propostas comerciais impressas.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
