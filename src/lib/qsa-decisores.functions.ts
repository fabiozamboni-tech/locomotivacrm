import { createServerFn } from "@tanstack/react-start";

export interface SocioDecisor {
  nome: string;
  cargo: string;
  tipo: "socio_administrador" | "diretor" | "socio" | "presidente" | "outro";
  linkedinSearchUrl: string;
  dataEntrada?: string;
  faixaEtaria?: string;
  principal: boolean;
}

export interface DecisoresResult {
  empresaNome: string;
  cnpj?: string;
  razaoSocial?: string;
  cidade?: string;
  decisores: SocioDecisor[];
  decisorPrincipal?: SocioDecisor;
  capitalSocial?: number;
  situacaoCadastral?: string;
  dataAbertura?: string;
  fonte?: string;
  real: boolean;
  aviso?: string;
}

interface RawSocio {
  nome: string;
  qualificacao?: string;
  dataEntrada?: string;
  faixaEtaria?: string;
}
interface RawEmpresa {
  razaoSocial?: string;
  municipio?: string;
  capitalSocial?: number;
  situacao?: string;
  abertura?: string;
  socios: RawSocio[];
  fonte: string;
}

const UA = { "User-Agent": "LocomotivaCRM/1.0", Accept: "application/json" };

function cleanCnpj(val?: string): string {
  return (val || "").replace(/\D/g, "");
}

function dvCnpj(base12: string): string {
  const calc = (b: string) => {
    const pesos = b.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const s = b.split("").reduce((a, d, i) => a + Number(d) * pesos[i], 0);
    const r = s % 11;
    return r < 2 ? "0" : String(11 - r);
  };
  const d1 = calc(base12);
  return base12 + d1 + calc(base12 + d1);
}

async function getJson(url: string, ms = 8000): Promise<any | null> {
  try {
    const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(ms) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function viaBrasilApi(cnpj: string): Promise<RawEmpresa | null> {
  const j = await getJson(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
  if (!j?.razao_social) return null;
  return {
    razaoSocial: j.razao_social,
    municipio: j.municipio,
    capitalSocial: j.capital_social,
    situacao: j.descricao_situacao_cadastral,
    abertura: j.data_inicio_atividade,
    socios: (j.qsa || []).map((s: any) => ({
      nome: s.nome_socio,
      qualificacao: s.qualificacao_socio,
      dataEntrada: s.data_entrada_sociedade,
      faixaEtaria: s.faixa_etaria,
    })),
    fonte: "BrasilAPI (Receita Federal)",
  };
}

async function viaMinhaReceita(cnpj: string): Promise<RawEmpresa | null> {
  const j = await getJson(`https://minhareceita.org/${cnpj}`);
  if (!j?.razao_social) return null;
  return {
    razaoSocial: j.razao_social,
    municipio: j.municipio,
    capitalSocial: j.capital_social,
    situacao: j.descricao_situacao_cadastral,
    abertura: j.data_inicio_atividade,
    socios: (j.qsa || []).map((s: any) => ({
      nome: s.nome_socio,
      qualificacao: s.qualificacao_socio,
      dataEntrada: s.data_entrada_sociedade,
      faixaEtaria: s.faixa_etaria,
    })),
    fonte: "Minha Receita (Receita Federal)",
  };
}

async function viaCnpjWs(cnpj: string): Promise<RawEmpresa | null> {
  const j = await getJson(`https://publica.cnpj.ws/cnpj/${cnpj}`);
  if (!j?.razao_social) return null;
  return {
    razaoSocial: j.razao_social,
    municipio: j.estabelecimento?.cidade?.nome,
    capitalSocial: Number(j.capital_social) || undefined,
    situacao: j.estabelecimento?.situacao_cadastral,
    abertura: j.estabelecimento?.data_inicio_atividade,
    socios: (j.socios || []).map((s: any) => ({
      nome: s.nome,
      qualificacao: s.qualificacao_socio?.descricao,
      dataEntrada: s.data_entrada,
      faixaEtaria: s.faixa_etaria,
    })),
    fonte: "CNPJ.ws (Receita Federal)",
  };
}

async function viaReceitaWs(cnpj: string): Promise<RawEmpresa | null> {
  const j = await getJson(`https://receitaws.com.br/v1/cnpj/${cnpj}`);
  if (!j?.nome || j.status === "ERROR") return null;
  return {
    razaoSocial: j.nome,
    municipio: j.municipio,
    capitalSocial: Number(j.capital_social) || undefined,
    situacao: j.situacao,
    abertura: j.abertura,
    socios: (j.qsa || []).map((s: any) => ({ nome: s.nome, qualificacao: s.qual })),
    fonte: "ReceitaWS (Receita Federal)",
  };
}

async function consultarCnpj(cnpj: string): Promise<RawEmpresa | null> {
  let primeiro: RawEmpresa | null = null;
  for (const fn of [viaBrasilApi, viaMinhaReceita, viaCnpjWs, viaReceitaWs]) {
    const r = await fn(cnpj);
    if (r) {
      if (r.socios.length > 0) return r;
      primeiro ??= r;
    }
  }
  return primeiro;
}

function titleCase(s: string) {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) => (["da", "de", "do", "dos", "das", "e"].includes(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

async function descobrirCnpj(nome: string, cidade?: string): Promise<string> {
  const key = process.env.SERPAPI_API_KEY?.trim() || "ec62da1cce88a0223fee434841dbaceef4b27c63b8825d53de8d25090ccdbe02";
  try {
    const q = `cnpj "${nome}" ${cidade || ""}`;
    const res = await fetch(
      `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(q)}&api_key=${key}&hl=pt-br&gl=br`,
      { signal: AbortSignal.timeout(10000) },
    );
    if (!res.ok) return "";
    const json = (await res.json()) as { organic_results?: Array<{ snippet?: string; title?: string }> };
    const txt = (json.organic_results || []).map((r) => `${r.title} ${r.snippet}`).join(" ");
    const m = txt.match(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/);
    return m ? cleanCnpj(m[0]) : "";
  } catch {
    return "";
  }
}

export const consultarQsaDecisores = createServerFn({ method: "POST" })
  .inputValidator((data: { cnpj?: string; nomeEmpresa: string; cidade?: string }) => data)
  .handler(async ({ data }): Promise<DecisoresResult> => {
    let cnpj = cleanCnpj(data.cnpj);
    if (cnpj.length !== 14) cnpj = await descobrirCnpj(data.nomeEmpresa, data.cidade);

    if (cnpj.length === 14) {
      let emp = await consultarCnpj(cnpj);
      let aviso: string | undefined;
      // Filial sem sócios: QSA fica na matriz (/0001)
      if ((!emp || emp.socios.length === 0) && cnpj.slice(8, 12) !== "0001") {
        const matriz = dvCnpj(cnpj.slice(0, 8) + "0001");
        const m = await consultarCnpj(matriz);
        if (m && m.socios.length > 0) {
          emp = m;
          aviso = "Sócios obtidos pelo CNPJ da matriz.";
        }
      }
      if (emp) {
        const decisores: SocioDecisor[] = emp.socios
          .filter((s) => s.nome)
          .map((s, idx) => {
            const nome = titleCase(s.nome);
            const cargo = s.qualificacao || "Sócio";
            const isAdm = /administrador|diretor|presidente|titular/i.test(cargo);
            return {
              nome,
              cargo,
              tipo: isAdm ? "socio_administrador" : "socio",
              linkedinSearchUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`${nome} ${emp!.razaoSocial || data.nomeEmpresa}`)}`,
              dataEntrada: s.dataEntrada,
              faixaEtaria: s.faixaEtaria,
              principal: isAdm || idx === 0,
            };
          });
        return {
          empresaNome: data.nomeEmpresa,
          cnpj,
          razaoSocial: emp.razaoSocial,
          cidade: emp.municipio || data.cidade,
          capitalSocial: emp.capitalSocial,
          situacaoCadastral: emp.situacao,
          dataAbertura: emp.abertura,
          decisores,
          decisorPrincipal: decisores.find((d) => d.tipo === "socio_administrador") || decisores[0],
          fonte: emp.fonte,
          real: true,
          aviso:
            aviso ||
            (decisores.length === 0
              ? "A Receita não lista sócios para este CNPJ (ex.: MEI/empresário individual)."
              : undefined),
        };
      }
    }

    return {
      empresaNome: data.nomeEmpresa,
      cidade: data.cidade,
      cnpj: cnpj || undefined,
      decisores: [],
      real: false,
      aviso:
        cnpj.length === 14
          ? "Não foi possível consultar a Receita Federal agora. Tente novamente."
          : "CNPJ não encontrado. Informe o CNPJ da empresa para buscar os sócios reais.",
    };
  });
