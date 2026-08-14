// Server-only: resolve dados económicos de um município brasileiro pelo nome.
import { MUNICIPIOS_BR } from "./geo-br";

export interface LocalidadeInfo {
  cidade: string;
  uf?: string;
  pais: string;
  populacao?: number;
  pibMilhares?: number;
  pibPerCapita?: number;
  setorPrincipal?: string;
  forcaEconomica?: number; // 0-2
}

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export function lookupLocalidade(
  cidade: string,
  opts: { uf?: string; pais?: string } = {},
): LocalidadeInfo {
  const pais = opts.pais?.trim() || "Brasil";
  const base: LocalidadeInfo = { cidade, uf: opts.uf, pais };
  if (norm(pais) !== "brasil" && norm(pais) !== "br") return base;

  const alvo = norm(cidade);
  const ufs = opts.uf ? [opts.uf.toUpperCase()] : Object.keys(MUNICIPIOS_BR);
  for (const uf of ufs) {
    const lista = MUNICIPIOS_BR[uf];
    if (!lista) continue;
    const m = lista.find((x) => norm(x[0]) === alvo);
    if (m) {
      const [nome, populacao, pibMil, setor, forca] = m;
      return {
        cidade: nome,
        uf,
        pais,
        populacao,
        pibMilhares: pibMil,
        pibPerCapita: populacao ? Math.round((pibMil * 1000) / populacao) : undefined,
        setorPrincipal: setor,
        forcaEconomica: forca,
      };
    }
  }
  return base;
}

export function localidadeTxt(info: LocalidadeInfo): string {
  const forca = ["economia local fraca", "economia local média", "economia local forte"];
  const fmt = (n?: number) => (n == null ? "n/d" : n.toLocaleString("pt-BR"));
  return [
    `País: ${info.pais}`,
    `Estado/UF: ${info.uf ?? "n/d"}`,
    `Cidade: ${info.cidade}`,
    info.populacao ? `População: ${fmt(info.populacao)} habitantes` : "",
    info.pibMilhares ? `PIB municipal: R$ ${fmt(info.pibMilhares)} mil` : "",
    info.pibPerCapita ? `PIB per capita: R$ ${fmt(info.pibPerCapita)}` : "",
    info.setorPrincipal ? `Setor económico principal do município: ${info.setorPrincipal}` : "",
    info.forcaEconomica != null ? `Força económica: ${forca[info.forcaEconomica] ?? "n/d"}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}
