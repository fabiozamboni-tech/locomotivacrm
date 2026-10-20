import { createServerFn } from "@tanstack/react-start";

export interface BrasilApiCnpjResult {
  sucesso: boolean;
  cnpj: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  situacaoCadastral?: string;
  dataAbertura?: string;
  cnaeCodigo?: number;
  cnaeDescricao?: string;
  capitalSocial?: number;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  telefone?: string;
  email?: string;
  qsa?: Array<{
    nomeSocio: string;
    qualificacaoSocio: string;
    faixaEtaria?: string;
  }>;
  mensagemErro?: string;
}

export interface BrasilApiCepResult {
  sucesso: boolean;
  cep: string;
  rua?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  latitude?: number;
  longitude?: number;
  mensagemErro?: string;
}

export interface TheColorPaletteItem {
  hex: string;
  nome: string;
  rgb: { r: number; g: number; b: number };
  contrasteHex: string; // "#FFFFFF" ou "#000000" para leitura perfeita
}

export interface TheColorPaletteResult {
  sucesso: boolean;
  modo: string;
  corOrigemHex: string;
  cores: TheColorPaletteItem[];
}

export interface FeriadoNacionalItem {
  data: string; // YYYY-MM-DD
  nome: string;
  tipo: string;
  diasRestantes?: number;
  sugestaoAcao?: string;
}

/**
 * 1. Consulta CNPJ oficial da Receita Federal via BrasilAPI
 */
export const consultarCnpjBrasilAPI_ServerFn = createServerFn({ method: "POST" })
  .inputValidator((data: { cnpj: string }) => data)
  .handler(async ({ data }): Promise<BrasilApiCnpjResult> => {
    const rawCnpj = (data.cnpj || "").replace(/\D/g, "");
    if (rawCnpj.length !== 14) {
      return {
        sucesso: false,
        cnpj: data.cnpj,
        mensagemErro: "CNPJ inválido. Digite os 14 dígitos numéricos.",
      };
    }

    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${rawCnpj}`, {
        headers: { "User-Agent": "LocomotivaCRM/1.0" },
      });

      if (!res.ok) {
        return {
          sucesso: false,
          cnpj: data.cnpj,
          mensagemErro: `Não foi possível localizar o CNPJ (HTTP ${res.status}).`,
        };
      }

      const info: any = await res.json();
      return {
        sucesso: true,
        cnpj: rawCnpj,
        razaoSocial: info.razao_social || "",
        nomeFantasia: info.nome_fantasia || info.razao_social || "",
        situacaoCadastral: info.descricao_situacao_cadastral || "ATIVA",
        dataAbertura: info.data_inicio_atividade || "",
        cnaeCodigo: info.cnae_fiscal,
        cnaeDescricao: info.cnae_fiscal_descricao || "",
        capitalSocial: info.capital_social,
        cep: info.cep ? info.cep.replace(/\D/g, "") : "",
        logradouro: info.logradouro || "",
        numero: info.numero || "",
        complemento: info.complemento || "",
        bairro: info.bairro || "",
        municipio: info.municipio || "",
        uf: info.uf || "",
        telefone: info.ddd_telefone_1 || info.ddd_telefone_2 || "",
        email: info.email || "",
        qsa: Array.isArray(info.qsa)
          ? info.qsa.map((s: any) => ({
              nomeSocio: s.nome_socio || "",
              qualificacaoSocio: s.qualificacao_socio || "",
              faixaEtaria: s.faixa_etaria || "",
            }))
          : [],
      };
    } catch (err: any) {
      return {
        sucesso: false,
        cnpj: data.cnpj,
        mensagemErro: err.message || "Erro de conexão com o serviço da Receita Federal.",
      };
    }
  });

/**
 * 2. Consulta CEP e geolocalização via BrasilAPI
 */
export const consultarCepBrasilAPI_ServerFn = createServerFn({ method: "POST" })
  .inputValidator((data: { cep: string }) => data)
  .handler(async ({ data }): Promise<BrasilApiCepResult> => {
    const rawCep = (data.cep || "").replace(/\D/g, "");
    if (rawCep.length !== 8) {
      return {
        sucesso: false,
        cep: data.cep,
        mensagemErro: "CEP inválido. Digite 8 dígitos numéricos.",
      };
    }

    try {
      const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${rawCep}`, {
        headers: { "User-Agent": "LocomotivaCRM/1.0" },
      });

      if (!res.ok) {
        return {
          sucesso: false,
          cep: data.cep,
          mensagemErro: `CEP não localizado (HTTP ${res.status}).`,
        };
      }

      const info: any = await res.json();
      return {
        sucesso: true,
        cep: rawCep,
        rua: info.street || "",
        bairro: info.neighborhood || "",
        cidade: info.city || "",
        estado: info.state || "",
        latitude: info.location?.coordinates?.latitude,
        longitude: info.location?.coordinates?.longitude,
      };
    } catch (err: any) {
      return {
        sucesso: false,
        cep: data.cep,
        mensagemErro: err.message || "Falha ao consultar CEP.",
      };
    }
  });

/**
 * 3. Geração de paletas de cores harmônicas e contraste via The Color API
 */
export const obterPaletaTheColorAPI_ServerFn = createServerFn({ method: "POST" })
  .inputValidator((data: { hex: string; modo?: "analogic" | "monochrome" | "complement" | "triad" | "quad"; count?: number }) => data)
  .handler(async ({ data }): Promise<TheColorPaletteResult> => {
    const cleanHex = (data.hex || "D22D67").replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
    const modo = data.modo || "analogic";
    const count = data.count || 5;

    try {
      const res = await fetch(`https://www.thecolorapi.com/scheme?hex=${cleanHex}&mode=${modo}&count=${count}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json: any = await res.json();
      const cores: TheColorPaletteItem[] = (json.colors || []).map((c: any) => {
        const hex = c.hex?.value || `#${cleanHex}`;
        const r = c.rgb?.r ?? 0;
        const g = c.rgb?.g ?? 0;
        const b = c.rgb?.b ?? 0;
        // Fórmula de luminância padrão WCAG
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        const contrasteHex = luminance > 0.55 ? "#0F172A" : "#FFFFFF";

        return {
          hex,
          nome: c.name?.value || "Cor",
          rgb: { r, g, b },
          contrasteHex,
        };
      });

      return {
        sucesso: true,
        modo,
        corOrigemHex: `#${cleanHex}`,
        cores,
      };
    } catch (err) {
      // Fallback determinístico elegante se offline
      return {
        sucesso: false,
        modo,
        corOrigemHex: `#${cleanHex}`,
        cores: [
          { hex: `#${cleanHex}`, nome: "Cor Primária", rgb: { r: 210, g: 45, b: 103 }, contrasteHex: "#FFFFFF" },
          { hex: "#1E293B", nome: "Slate Escuro", rgb: { r: 30, g: 41, b: 59 }, contrasteHex: "#FFFFFF" },
          { hex: "#64748B", nome: "Slate Médio", rgb: { r: 100, g: 116, b: 139 }, contrasteHex: "#FFFFFF" },
          { hex: "#F1F5F9", nome: "Slate Claro", rgb: { r: 241, g: 245, b: 249 }, contrasteHex: "#0F172A" },
          { hex: "#FDF2F6", nome: "Fundo Suave", rgb: { r: 253, g: 242, b: 246 }, contrasteHex: "#0F172A" },
        ],
      };
    }
  });

/**
 * 4. Consulta de feriados nacionais brasileiros via BrasilAPI
 */
export const obterFeriadosNacionais_ServerFn = createServerFn({ method: "POST" })
  .inputValidator((data: { ano?: number }) => data)
  .handler(async ({ data }): Promise<{ sucesso: boolean; ano: number; feriados: FeriadoNacionalItem[] }> => {
    const ano = data.ano || new Date().getFullYear();

    try {
      const res = await fetch(`https://brasilapi.com.br/api/feriados/v1/${ano}`, {
        headers: { "User-Agent": "LocomotivaCRM/1.0" },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const list: any = await res.json();
      const hoje = new Date();

      const feriados: FeriadoNacionalItem[] = (Array.isArray(list) ? list : []).map((f: any) => {
        const dataF = new Date(`${f.date}T00:00:00`);
        const diffMs = dataF.getTime() - hoje.getTime();
        const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        let sugestaoAcao = "Planejar comunicação e horário especial de atendimento.";
        const nomeLower = (f.name || "").toLowerCase();
        if (nomeLower.includes("carnaval")) sugestaoAcao = "Campanha festiva e comunicação de expediente.";
        else if (nomeLower.includes("páscoa") || nomeLower.includes("paixão")) sugestaoAcao = "Campanha temática para comércio, turismo e restaurantes.";
        else if (nomeLower.includes("tiradentes") || nomeLower.includes("trabalho")) sugestaoAcao = "Feriado prolongado: ações para turismo e lazer.";
        else if (nomeLower.includes("independência") || nomeLower.includes("farroupilha")) sugestaoAcao = "Semana Farroupilha / Orgulho Gaúcho: campanha de valorização da tradição.";
        else if (nomeLower.includes("aparecida") || nomeLower.includes("criança")) sugestaoAcao = "Dia das Crianças: foco em presentes e gastronomia familiar.";
        else if (nomeLower.includes("finados") || nomeLower.includes("república")) sugestaoAcao = "Preparação para Black Friday e promoções de fim de ano.";
        else if (nomeLower.includes("natal")) sugestaoAcao = "Campanha magna de Natal, gratidão aos clientes e presentes.";

        return {
          data: f.date,
          nome: f.name,
          tipo: f.type,
          diasRestantes,
          sugestaoAcao,
        };
      });

      return { sucesso: true, ano, feriados };
    } catch {
      return {
        sucesso: false,
        ano,
        feriados: [
          { data: `${ano}-01-01`, nome: "Confraternização Universal", tipo: "national", sugestaoAcao: "Votos de Feliz Ano Novo." },
          { data: `${ano}-04-21`, nome: "Tiradentes", tipo: "national", sugestaoAcao: "Feriado nacional prolongado." },
          { data: `${ano}-05-01`, nome: "Dia do Trabalho", tipo: "national", sugestaoAcao: "Valorização da equipe e parceiros." },
          { data: `${ano}-09-07`, nome: "Independência do Brasil", tipo: "national", sugestaoAcao: "Semana da Pátria." },
          { data: `${ano}-09-20`, nome: "Revolução Farroupilha (RS)", tipo: "state", sugestaoAcao: "Semana Farroupilha: tradição e comércio regional." },
          { data: `${ano}-10-12`, nome: "Nossa Senhora Aparecida / Crianças", tipo: "national", sugestaoAcao: "Campanha especial do comércio." },
          { data: `${ano}-11-15`, nome: "Proclamação da República", tipo: "national", sugestaoAcao: "Preparação para a Black Friday." },
          { data: `${ano}-12-25`, nome: "Natal", tipo: "national", sugestaoAcao: "Campanha principal de fechamento de ano." },
        ],
      };
    }
  });

/**
 * 5. Utilitários Client-side para Logotipos, Favicons e QR Code
 */

/**
 * Extrai o domínio limpo a partir de uma URL ou string de site (ex: "https://www.locomotiva.live/contato" -> "locomotiva.live")
 */
export function extrairDominio(urlOuTexto: string): string | null {
  if (!urlOuTexto) return null;
  let str = urlOuTexto.trim().toLowerCase();
  str = str.replace(/^(https?:\/\/)?(www\.)?/, "");
  str = str.split("/")[0].split("?")[0].split("#")[0];
  if (str.includes(".") && !str.includes(" ")) {
    return str;
  }
  return null;
}

/**
 * Retorna a URL do logotipo da empresa via Clearbit Logo API
 */
export function obterLogoUrl(siteOuDominio: string): string | null {
  const domain = extrairDominio(siteOuDominio);
  if (!domain) return null;
  return `https://logo.clearbit.com/${domain}`;
}

/**
 * Retorna a URL do Favicon de alta resolução via Google Favicon Service
 */
export function obterFaviconUrl(siteOuDominio: string, tamanho = 128): string | null {
  const domain = extrairDominio(siteOuDominio);
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=${tamanho}`;
}

/**
 * Retorna a URL de QR Code dinâmico via QR Server API
 */
export function obterQrCodeUrl(conteudo: string, tamanho = 220): string {
  const encoded = encodeURIComponent(conteudo.trim());
  return `https://api.qrserver.com/v1/create-qr-code/?size=${tamanho}x${tamanho}&data=${encoded}&margin=1`;
}
