// Mock data para Radar de Presença Digital
// Empresas fictícias da Serra Gaúcha e RS para demonstração comercial

export type StatusSite =
  | "sem_site"
  | "desatualizado"
  | "sem_ssl"
  | "nao_responsivo"
  | "ok";
export type StatusInstagram =
  | "sem_perfil"
  | "parado"
  | "irregular"
  | "ativo"
  | "consistente";
export type CrmStage =
  | "identificado"
  | "analisado"
  | "contato_preparado"
  | "primeiro_contato"
  | "aguardando_retorno"
  | "em_negociacao"
  | "convertido"
  | "perdido"
  | "sem_fit";

export type OrigemDado =
  | "google_places"
  | "diretorio_publico"
  | "manual"
  | "csv"
  | "enriquecimento";

export interface Empresa {
  id: string;
  nome: string;
  segmento: string;
  cidade: string;
  bairro?: string;
  endereco: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  site?: string;
  instagram?: string;
  statusSite: StatusSite;
  statusInstagram: StatusInstagram;
  score: number;
  ultimaAnalise: string;
  origem: OrigemDado;
  tags: string[];
  crmStage: CrmStage;
  ultimoContato?: string;
  proximoFollowup?: string;
  naoContatar?: boolean;
  observacoes?: string;
  // Diagnóstico
  diagnostico: {
    site: {
      responsivo: boolean;
      ssl: boolean;
      velocidade: "boa" | "media" | "ruim" | "na";
      cta: boolean;
      formulario: boolean;
      whatsappBtn: boolean;
      seoBasico: boolean;
      presencaGoogle: boolean;
      identidadeConsistente: boolean;
      qualidadePercebida: number; // 0-10
    };
    instagram: {
      diasDesdeUltimoPost: number | null;
      frequencia: "alta" | "media" | "baixa" | "nenhuma";
      qualidadeVisual: number; // 0-10
      consistenciaMarca: number;
      engajamentoAparente: "alto" | "medio" | "baixo" | "na";
      bioForte: boolean;
    };
    atendimento: {
      contatoFacil: boolean;
      multiplosCanais: boolean;
      respostaRapida: boolean;
      provaSocial: boolean;
      clarezaServicos: boolean;
    };
  };
  historico: Array<{
    data: string;
    tipo: "nota" | "email" | "whatsapp" | "ligacao" | "status";
    texto: string;
  }>;
}

const SEGMENTOS = [
  "Vinícola",
  "Restaurante",
  "Pousada",
  "Metalurgia",
  "Móveis planejados",
  "Confecção",
  "Estética",
  "Odontologia",
  "Advocacia",
  "Contabilidade",
  "Autopeças",
  "Padaria artesanal",
  "Serralheria",
  "Loja de roupas",
  "Malharia",
  "Turismo receptivo",
  "Cervejaria artesanal",
];

const CIDADES_SERRA = [
  "Caxias do Sul",
  "Bento Gonçalves",
  "Farroupilha",
  "Garibaldi",
  "Carlos Barbosa",
  "Flores da Cunha",
  "São Marcos",
  "Canela",
  "Gramado",
  "Nova Petrópolis",
  "Vacaria",
];

const NOMES_BASE = [
  "Cantina",
  "Vinícola",
  "Casa",
  "Estúdio",
  "Ateliê",
  "Boutique",
  "Recanto",
  "Villa",
  "Serra",
  "Rústica",
  "Bella",
  "Nonna",
  "Bertol",
  "Zanella",
  "Marchiori",
  "Fontanive",
  "Dal Bó",
  "De Conto",
  "Sartori",
  "Menegat",
  "Fanti",
];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

// Construção manual das empresas para variedade rica
const EMPRESAS_RAW: Array<Partial<Empresa> & { nome: string; segmento: string; cidade: string }> = [
  {
    nome: "Cantina Nonna Rosa",
    segmento: "Restaurante",
    cidade: "Bento Gonçalves",
    bairro: "Zona Rural",
    telefone: "(54) 3452-1122",
    whatsapp: "(54) 99912-3344",
    site: undefined,
    instagram: "@cantinanonnarosa",
    statusSite: "sem_site",
    statusInstagram: "parado",
    origem: "google_places",
  },
  {
    nome: "Vinícola Val de Serra",
    segmento: "Vinícola",
    cidade: "Garibaldi",
    site: "valdeserra.com.br",
    instagram: "@valdeserra",
    telefone: "(54) 3464-7788",
    email: "contato@valdeserra.com.br",
    statusSite: "desatualizado",
    statusInstagram: "irregular",
    origem: "google_places",
  },
  {
    nome: "Móveis Bertolini Planejados",
    segmento: "Móveis planejados",
    cidade: "Caxias do Sul",
    bairro: "Sanvitto",
    telefone: "(54) 3221-4455",
    whatsapp: "(54) 99988-1122",
    site: "moveisbertolini.com.br",
    statusSite: "nao_responsivo",
    statusInstagram: "sem_perfil",
    origem: "diretorio_publico",
  },
  {
    nome: "Pousada Recanto da Serra",
    segmento: "Pousada",
    cidade: "Gramado",
    bairro: "Bavária",
    telefone: "(54) 3286-9911",
    whatsapp: "(54) 99777-2211",
    email: "reservas@recantodaserra.tur.br",
    site: "recantodaserra.tur.br",
    instagram: "@pousadarecantoserra",
    statusSite: "ok",
    statusInstagram: "ativo",
    origem: "google_places",
  },
  {
    nome: "Metalúrgica Zanella",
    segmento: "Metalurgia",
    cidade: "Farroupilha",
    bairro: "Distrito Industrial",
    telefone: "(54) 3268-3300",
    email: "comercial@zanella.ind.br",
    statusSite: "sem_ssl",
    statusInstagram: "sem_perfil",
    origem: "diretorio_publico",
  },
  {
    nome: "Estética Bella Vita",
    segmento: "Estética",
    cidade: "Caxias do Sul",
    bairro: "Centro",
    whatsapp: "(54) 99123-4567",
    instagram: "@bellavitaestetica",
    statusSite: "sem_site",
    statusInstagram: "ativo",
    origem: "manual",
  },
  {
    nome: "Autopeças Marchiori",
    segmento: "Autopeças",
    cidade: "Flores da Cunha",
    telefone: "(54) 3292-1010",
    site: "marchioriautopecas.com.br",
    statusSite: "desatualizado",
    statusInstagram: "sem_perfil",
    origem: "google_places",
  },
  {
    nome: "Padaria Artesanal Dal Bó",
    segmento: "Padaria artesanal",
    cidade: "Carlos Barbosa",
    telefone: "(54) 3461-4422",
    whatsapp: "(54) 99655-3322",
    instagram: "@padariadalbo",
    statusSite: "sem_site",
    statusInstagram: "irregular",
    origem: "google_places",
  },
  {
    nome: "Cervejaria Colonial Fontanive",
    segmento: "Cervejaria artesanal",
    cidade: "Nova Petrópolis",
    site: "colonialfontanive.com",
    instagram: "@colonialfontanive",
    telefone: "(54) 3281-2200",
    email: "hello@colonialfontanive.com",
    statusSite: "ok",
    statusInstagram: "consistente",
    origem: "google_places",
  },
  {
    nome: "Ateliê De Conto Confecções",
    segmento: "Confecção",
    cidade: "Caxias do Sul",
    bairro: "Rio Branco",
    whatsapp: "(54) 99811-2244",
    instagram: "@ateliedeconto",
    statusSite: "sem_site",
    statusInstagram: "ativo",
    origem: "manual",
  },
  {
    nome: "Turismo Sartori Receptivo",
    segmento: "Turismo receptivo",
    cidade: "Canela",
    telefone: "(54) 3282-9900",
    email: "reservas@sartoriturismo.com.br",
    site: "sartoriturismo.com.br",
    instagram: "@sartoriturismo",
    statusSite: "desatualizado",
    statusInstagram: "parado",
    origem: "google_places",
  },
  {
    nome: "Serralheria Menegat",
    segmento: "Serralheria",
    cidade: "São Marcos",
    telefone: "(54) 3291-7788",
    statusSite: "sem_site",
    statusInstagram: "sem_perfil",
    origem: "csv",
  },
  {
    nome: "Odontologia Dra. Fanti",
    segmento: "Odontologia",
    cidade: "Bento Gonçalves",
    bairro: "Cidade Alta",
    telefone: "(54) 3055-6677",
    whatsapp: "(54) 99444-8899",
    email: "contato@drafanti.com.br",
    site: "drafanti.com.br",
    instagram: "@drafanti.odonto",
    statusSite: "nao_responsivo",
    statusInstagram: "irregular",
    origem: "google_places",
  },
  {
    nome: "Advocacia Menegat & Associados",
    segmento: "Advocacia",
    cidade: "Caxias do Sul",
    bairro: "Centro",
    telefone: "(54) 3028-9911",
    email: "contato@menegat.adv.br",
    site: "menegat.adv.br",
    statusSite: "desatualizado",
    statusInstagram: "sem_perfil",
    origem: "diretorio_publico",
  },
  {
    nome: "Malharia Villa Bella",
    segmento: "Malharia",
    cidade: "Farroupilha",
    whatsapp: "(54) 99700-1234",
    instagram: "@malhariavillabella",
    statusSite: "sem_site",
    statusInstagram: "parado",
    origem: "manual",
  },
  {
    nome: "Contabilidade Segura Vacaria",
    segmento: "Contabilidade",
    cidade: "Vacaria",
    telefone: "(54) 3231-4400",
    email: "contato@seguravacaria.com.br",
    site: "seguravacaria.com.br",
    statusSite: "sem_ssl",
    statusInstagram: "sem_perfil",
    origem: "diretorio_publico",
  },
  {
    nome: "Boutique Rústica Gramado",
    segmento: "Loja de roupas",
    cidade: "Gramado",
    bairro: "Centro",
    whatsapp: "(54) 99888-5566",
    instagram: "@boutiquerusticagramado",
    statusSite: "sem_site",
    statusInstagram: "ativo",
    origem: "google_places",
  },
  {
    nome: "Casa Bertol Vinhos",
    segmento: "Vinícola",
    cidade: "Bento Gonçalves",
    telefone: "(54) 3055-1177",
    email: "loja@casabertol.com.br",
    site: "casabertol.com.br",
    instagram: "@casabertol",
    statusSite: "ok",
    statusInstagram: "consistente",
    origem: "google_places",
  },
  {
    nome: "Estúdio Marchiori Fotografia",
    segmento: "Estética",
    cidade: "Bento Gonçalves",
    whatsapp: "(54) 99933-4455",
    instagram: "@marchiorifoto",
    statusSite: "sem_site",
    statusInstagram: "ativo",
    origem: "manual",
  },
  {
    nome: "Recanto Alpino Restaurante",
    segmento: "Restaurante",
    cidade: "Canela",
    telefone: "(54) 3282-4411",
    site: "recantoalpino.com.br",
    instagram: "@recantoalpino",
    statusSite: "desatualizado",
    statusInstagram: "irregular",
    origem: "google_places",
  },
];

function buildEmpresa(idx: number, raw: (typeof EMPRESAS_RAW)[number]): Empresa {
  const id = slugify(raw.nome) + "-" + idx;
  const site = raw.site;
  const statusSite = raw.statusSite ?? "sem_site";
  const statusInstagram = raw.statusInstagram ?? "sem_perfil";

  const diagnostico: Empresa["diagnostico"] = {
    site: {
      responsivo: statusSite !== "nao_responsivo" && statusSite !== "sem_site",
      ssl: statusSite !== "sem_ssl" && statusSite !== "sem_site",
      velocidade:
        statusSite === "sem_site"
          ? "na"
          : statusSite === "ok"
            ? "boa"
            : statusSite === "desatualizado"
              ? "media"
              : "ruim",
      cta: statusSite === "ok",
      formulario: statusSite === "ok" || statusSite === "desatualizado",
      whatsappBtn: statusSite === "ok",
      seoBasico: statusSite === "ok",
      presencaGoogle: raw.origem === "google_places" || statusSite !== "sem_site",
      identidadeConsistente: statusSite === "ok",
      qualidadePercebida:
        statusSite === "ok"
          ? 8
          : statusSite === "desatualizado"
            ? 4
            : statusSite === "nao_responsivo"
              ? 3
              : statusSite === "sem_ssl"
                ? 3
                : 0,
    },
    instagram: {
      diasDesdeUltimoPost:
        statusInstagram === "sem_perfil"
          ? null
          : statusInstagram === "consistente"
            ? 2
            : statusInstagram === "ativo"
              ? 7
              : statusInstagram === "irregular"
                ? 45
                : 180,
      frequencia:
        statusInstagram === "consistente"
          ? "alta"
          : statusInstagram === "ativo"
            ? "media"
            : statusInstagram === "irregular"
              ? "baixa"
              : "nenhuma",
      qualidadeVisual:
        statusInstagram === "consistente"
          ? 9
          : statusInstagram === "ativo"
            ? 7
            : statusInstagram === "irregular"
              ? 4
              : 2,
      consistenciaMarca:
        statusInstagram === "consistente"
          ? 9
          : statusInstagram === "ativo"
            ? 6
            : 3,
      engajamentoAparente:
        statusInstagram === "consistente"
          ? "alto"
          : statusInstagram === "ativo"
            ? "medio"
            : statusInstagram === "irregular"
              ? "baixo"
              : "na",
      bioForte: statusInstagram === "consistente" || statusInstagram === "ativo",
    },
    atendimento: {
      contatoFacil: !!(raw.whatsapp || raw.telefone),
      multiplosCanais:
        [raw.whatsapp, raw.telefone, raw.email].filter(Boolean).length >= 2,
      respostaRapida: statusInstagram === "consistente" || statusSite === "ok",
      provaSocial: statusSite === "ok" && statusInstagram !== "sem_perfil",
      clarezaServicos: statusSite === "ok",
    },
  };

  return {
    id,
    nome: raw.nome,
    segmento: raw.segmento,
    cidade: raw.cidade,
    bairro: raw.bairro,
    endereco: `Rua ${pick(NOMES_BASE, idx + 3)}, ${100 + idx * 7} · ${raw.cidade}/RS`,
    telefone: raw.telefone,
    whatsapp: raw.whatsapp,
    email: raw.email,
    site,
    instagram: raw.instagram,
    statusSite,
    statusInstagram,
    score: 0, // preenchido depois
    ultimaAnalise: daysAgo(idx % 14),
    origem: raw.origem ?? "google_places",
    tags: [],
    crmStage: (
      [
        "identificado",
        "analisado",
        "analisado",
        "contato_preparado",
        "primeiro_contato",
        "aguardando_retorno",
        "em_negociacao",
        "identificado",
      ] as CrmStage[]
    )[idx % 8],
    ultimoContato: idx % 4 === 0 ? daysAgo(idx * 2) : undefined,
    proximoFollowup: idx % 5 === 0 ? daysAgo(-3 - (idx % 5)) : undefined,
    diagnostico,
    historico: [
      {
        data: daysAgo(idx % 14),
        tipo: "status",
        texto: "Empresa importada do pipeline de descoberta.",
      },
    ],
  };
}

export const EMPRESAS_INICIAIS: Empresa[] = EMPRESAS_RAW.map((r, i) =>
  buildEmpresa(i, r),
);

export const CIDADES_RS_FOCO = CIDADES_SERRA;

export { SEGMENTOS };

// Constrói uma Empresa a partir de um resultado bruto (ex.: Google Places).
export function empresaFromRaw(input: {
  nome: string;
  segmento?: string;
  cidade: string;
  endereco: string;
  telefone?: string;
  site?: string;
  instagram?: string;
  origem?: OrigemDado;
  externalId?: string;
}): Empresa {
  const id = `${slugify(input.nome)}-${(input.externalId ?? Date.now().toString(36)).slice(-8)}`;
  const raw = {
    nome: input.nome,
    segmento: input.segmento ?? "Outros",
    cidade: input.cidade || "—",
    telefone: input.telefone,
    site: input.site,
    instagram: input.instagram,
    statusSite: (input.site ? "desatualizado" : "sem_site") as StatusSite,
    statusInstagram: (input.instagram ? "irregular" : "sem_perfil") as StatusInstagram,
    origem: input.origem ?? "google_places",
  };
  const built = buildEmpresa(0, raw);
  return {
    ...built,
    id,
    endereco: input.endereco || built.endereco,
    historico: [
      {
        data: new Date().toISOString(),
        tipo: "status",
        texto: `Empresa importada via ${raw.origem}.`,
      },
    ],
  };
}

