// Listas de apoio para os filtros de descoberta (País / Estado / Cidade).

export const PAISES = [
  { code: "BR", nome: "Brasil" },
  { code: "PT", nome: "Portugal" },
  { code: "AR", nome: "Argentina" },
  { code: "UY", nome: "Uruguai" },
  { code: "PY", nome: "Paraguai" },
  { code: "CL", nome: "Chile" },
  { code: "US", nome: "Estados Unidos" },
  { code: "ES", nome: "Espanha" },
] as const;

export const ESTADOS_BR = [
  { uf: "AC", nome: "Acre" },
  { uf: "AL", nome: "Alagoas" },
  { uf: "AP", nome: "Amapá" },
  { uf: "AM", nome: "Amazonas" },
  { uf: "BA", nome: "Bahia" },
  { uf: "CE", nome: "Ceará" },
  { uf: "DF", nome: "Distrito Federal" },
  { uf: "ES", nome: "Espírito Santo" },
  { uf: "GO", nome: "Goiás" },
  { uf: "MA", nome: "Maranhão" },
  { uf: "MT", nome: "Mato Grosso" },
  { uf: "MS", nome: "Mato Grosso do Sul" },
  { uf: "MG", nome: "Minas Gerais" },
  { uf: "PA", nome: "Pará" },
  { uf: "PB", nome: "Paraíba" },
  { uf: "PR", nome: "Paraná" },
  { uf: "PE", nome: "Pernambuco" },
  { uf: "PI", nome: "Piauí" },
  { uf: "RJ", nome: "Rio de Janeiro" },
  { uf: "RN", nome: "Rio Grande do Norte" },
  { uf: "RS", nome: "Rio Grande do Sul" },
  { uf: "RO", nome: "Rondônia" },
  { uf: "RR", nome: "Roraima" },
  { uf: "SC", nome: "Santa Catarina" },
  { uf: "SP", nome: "São Paulo" },
  { uf: "SE", nome: "Sergipe" },
  { uf: "TO", nome: "Tocantins" },
] as const;

// Sugestões de cidades por UF (as demais UFs aceitam digitação livre).
export const CIDADES_POR_UF: Record<string, string[]> = {
  SC: ["Florianópolis", "Joinville", "Blumenau", "Chapecó", "Criciúma", "Itajaí", "Lages"],
  PR: ["Curitiba", "Londrina", "Maringá", "Cascavel", "Ponta Grossa", "Foz do Iguaçu"],
  SP: ["São Paulo", "Campinas", "Santos", "Ribeirão Preto", "Sorocaba", "São José dos Campos"],
  RJ: ["Rio de Janeiro", "Niterói", "Petrópolis", "Campos dos Goytacazes", "Nova Friburgo"],
  MG: ["Belo Horizonte", "Uberlândia", "Juiz de Fora", "Contagem", "Poços de Caldas"],
};
