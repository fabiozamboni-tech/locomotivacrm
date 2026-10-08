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
}

function cleanCnpj(val?: string): string {
  if (!val) return "";
  return val.replace(/\D/g, "");
}

/**
 * Consulta o QSA (Quadro de Sócios e Administradores) via BrasilAPI / Receita Federal
 */
export const consultarQsaDecisores = createServerFn({ method: "POST" })
  .inputValidator((data: { cnpj?: string; nomeEmpresa: string; cidade?: string }) => data)
  .handler(async ({ data }): Promise<DecisoresResult> => {
    let cnpjNum = cleanCnpj(data.cnpj);

    // Se não tiver CNPJ, tenta buscar pelo nome da empresa e cidade via BrasilAPI / SerpApi
    if (!cnpjNum || cnpjNum.length !== 14) {
      const serpApiKey =
        process.env.SERPAPI_API_KEY?.trim() ||
        "ec62da1cce88a0223fee434841dbaceef4b27c63b8825d53de8d25090ccdbe02";

      if (serpApiKey && serpApiKey.length > 20 && !serpApiKey.includes(":")) {
        try {
          const q = `cnpj "${data.nomeEmpresa}" ${data.cidade || ""}`;
          const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(q)}&api_key=${serpApiKey}&hl=pt-br&gl=br`;
          const res = await fetch(url);
          if (res.ok) {
            const json = (await res.json()) as { organic_results?: Array<{ snippet?: string; title?: string }> };
            const fullText = (json.organic_results || []).map((r) => `${r.title} ${r.snippet}`).join(" ");
            const cnpjMatch = fullText.match(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/);
            if (cnpjMatch) {
              cnpjNum = cleanCnpj(cnpjMatch[0]);
            }
          }
        } catch (e) {
          console.warn("Erro ao buscar CNPJ via SerpApi:", e);
        }
      }
    }

    if (cnpjNum && cnpjNum.length === 14) {
      try {
        const resp = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjNum}`, {
          headers: { "User-Agent": "LocomotivaCRM/1.0" },
        });

        if (resp.ok) {
          const json = (await resp.json()) as {
            razao_social?: string;
            nome_fantasia?: string;
            cnpj?: string;
            municipio?: string;
            capital_social?: number;
            descricao_situacao_cadastral?: string;
            data_inicio_atividade?: string;
            qsa?: Array<{
              nome_socio?: string;
              qualificacao_socio?: string;
              data_entrada_sociedade?: string;
              faixa_etaria?: string;
            }>;
          };

          const qsaList = json.qsa || [];
          const decisores: SocioDecisor[] = qsaList.map((s, idx) => {
            const nomeFormatado = (s.nome_socio || "Sócio")
              .toLowerCase()
              .split(" ")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ");

            const cargo = s.qualificacao_socio || "Sócio-Administrador";
            const isAdm = /administrador|diretor|presidente/i.test(cargo);

            return {
              nome: nomeFormatado,
              cargo,
              tipo: isAdm ? "socio_administrador" : "socio",
              linkedinSearchUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`${nomeFormatado} ${json.razao_social || data.nomeEmpresa}`)}`,
              dataEntrada: s.data_entrada_sociedade,
              faixaEtaria: s.faixa_etaria,
              principal: idx === 0 || isAdm,
            };
          });

          const principal = decisores.find((d) => d.tipo === "socio_administrador") || decisores[0];

          return {
            empresaNome: data.nomeEmpresa,
            cnpj: json.cnpj,
            razaoSocial: json.razao_social,
            cidade: json.municipio || data.cidade,
            capitalSocial: json.capital_social,
            situacaoCadastral: json.descricao_situacao_cadastral,
            dataAbertura: json.data_inicio_atividade,
            decisores,
            decisorPrincipal: principal,
          };
        }
      } catch (err) {
        console.warn("Erro ao consultar BrasilAPI QSA:", err);
      }
    }

    // Fallback inteligente para demonstração
    const nomeDecisorFallback = `Gestor(a) / Sócio(a) da ${data.nomeEmpresa}`;
    return {
      empresaNome: data.nomeEmpresa,
      cidade: data.cidade,
      decisores: [
        {
          nome: nomeDecisorFallback,
          cargo: "Diretor Executivo / Sócio",
          tipo: "socio_administrador",
          linkedinSearchUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`${data.nomeEmpresa} diretor ${data.cidade || ""}`)}`,
          principal: true,
        },
      ],
      decisorPrincipal: {
        nome: nomeDecisorFallback,
        cargo: "Diretor Executivo / Sócio",
        tipo: "socio_administrador",
        linkedinSearchUrl: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(`${data.nomeEmpresa} diretor ${data.cidade || ""}`)}`,
        principal: true,
      },
    };
  });
