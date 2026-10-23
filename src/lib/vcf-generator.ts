/**
 * Utilitário de Geração e Download de Cartão de Contato vCard (.vcf)
 * Permite que o consultor comercial baixe o contato com 1 clique para salvar
 * no celular ou no desktop antes de disparar a mensagem de WhatsApp.
 */

export interface VCardContatoInput {
  nome: string;
  telefone?: string;
  whatsapp?: string;
  cidade?: string;
  segmento?: string;
  email?: string;
  site?: string;
  endereco?: string;
  cnpj?: string;
}

export function gerarVCardConteudo(contato: VCardContatoInput): string {
  const telPrincipal = contato.whatsapp || contato.telefone || "";
  const telSecundario = contato.telefone && contato.telefone !== contato.whatsapp ? contato.telefone : "";

  const linhas = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${contato.nome} (Locomotiva CRM)`,
    `ORG:${contato.nome}`,
    contato.segmento ? `TITLE:${contato.segmento}` : "",
    telPrincipal ? `TEL;TYPE=CELL,VOICE:${telPrincipal}` : "",
    telSecundario ? `TEL;TYPE=WORK,VOICE:${telSecundario}` : "",
    contato.email ? `EMAIL;TYPE=WORK:${contato.email}` : "",
    contato.site ? `URL:${contato.site.startsWith("http") ? contato.site : `https://${contato.site}`}` : "",
    contato.cidade || contato.endereco ? `ADR;TYPE=WORK:;;${contato.endereco || ""};${contato.cidade || ""};RS;;Brasil` : "",
    contato.cnpj ? `NOTE:CNPJ: ${contato.cnpj} | Prospectado via Locomotiva CRM` : "NOTE:Prospectado via Locomotiva CRM",
    "END:VCARD",
  ].filter(Boolean);

  return linhas.join("\r\n");
}

export function downloadVCardContato(contato: VCardContatoInput) {
  if (typeof window === "undefined") return;

  const vcfString = gerarVCardConteudo(contato);
  const blob = new Blob([vcfString], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const safeName = contato.nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);

  const link = document.createElement("a");
  link.href = url;
  link.download = `contato-${safeName || "empresa"}.vcf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
