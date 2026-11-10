import type { EmpresaCtx } from "./ai.functions";

export interface TagVariavel {
  tag: string;
  descricao: string;
  exemplo: string;
}

export const TAGS_VARIAVEIS_DISPONIVEIS: TagVariavel[] = [
  {
    tag: "[Nome do Lead]",
    descricao: "Nome do lead ou empresa prospectada",
    exemplo: "Marcenaria Silva",
  },
  {
    tag: "[Negócio do Lead]",
    descricao: "Nicho, segmento ou especialidade do lead",
    exemplo: "móveis sob medida",
  },
  {
    tag: "[se tiver site: ... / se não tiver site: ...]",
    descricao: "Condicional automática que varia o texto se a empresa já tem site ou não",
    exemplo: "se tiver site: frase A / se não tiver site: frase B",
  },
  {
    tag: "[boa tarde/bom dia/boa noite]",
    descricao: "Saudação dinâmica baseada na hora atual (manhã, tarde ou noite)",
    exemplo: "bom dia / boa tarde / boa noite",
  },
  {
    tag: "[Área de Atuação]",
    descricao: "Área de atuação ou segmento da empresa",
    exemplo: "Móveis Sob Medida / Metalmecânica",
  },
  {
    tag: "[CIDADE]",
    descricao: "Cidade onde a empresa está localizada",
    exemplo: "Caxias do Sul / Bento Gonçalves",
  },
  {
    tag: "[SERVIÇO DO CLIENTE]",
    descricao: "Serviço ou nicho principal da empresa",
    exemplo: "marcenaria de alto padrão / usinagem",
  },
  {
    tag: "[TERMOS DE BUSCA LEVANTADOS]",
    descricao: "Palavras-chave reais identificadas na busca do Google na região",
    exemplo: '"móveis sob medida em Caxias do Sul" e "marcenaria fina"',
  },
  {
    tag: "[NOME DA EMPRESA]",
    descricao: "Nome fantasia da empresa do cliente",
    exemplo: "Marcenaria Silva",
  },
  {
    tag: "[SEU NOME]",
    descricao: "Seu nome ou consultor de prospecção",
    exemplo: "Fábio",
  },
  {
    tag: "[AGENCIA]",
    descricao: "Nome da agência de comunicação",
    exemplo: "Locomotiva Comunicação",
  },
];

export interface AbordagemTemplate {
  id: string;
  titulo: string;
  descricao?: string;
  canal: "whatsapp" | "instagram" | "email" | "todos";
  conteudo: string;
  criadoEm: string;
  isPadrao?: boolean;
}

export const TEMPLATE_PADRAO_FABIO: AbordagemTemplate = {
  id: "padrao_fabio_caxias",
  titulo: "Padrão (Fábio · Locomotiva Caxias do Sul)",
  descricao: "Abordagem oficial consultiva, sóbria, sem bajulação, citando termos reais e propondo o envio do PDF.",
  canal: "whatsapp",
  isPadrao: true,
  criadoEm: "2026-10-22T00:00:00.000Z",
  conteudo: `Oi, [boa tarde/bom dia/boa noite], tudo bem? 

Meu nome é Fábio, sou consultor na Locomotiva Comunicação, aqui de Caxias do Sul. Acompanhamos o mercado [Área de Atuação] da região e realizamos um levantamento técnico sobre como o público de [CIDADE] e região busca por serviços [SERVIÇO DO CLIENTE] na internet. 

Identificamos que termos como [TERMOS DE BUSCA LEVANTADOS] possuem um volume relevante de buscas mensais, mas notamos que sua estrutura digital e de comunicação atual ainda não captura essas oportunidades de forma direta. 

Reunimos esses dados e alguns pontos de melhoria em um documento resumido. Minha intenção é que esse material sirva de base para conversarmos sobre como podemos trabalhar juntos na demanda de comunicação do sua empresa. 

Posso te enviar o arquivo por aqui para você dar uma olhada quando tiver um momento? 

brigado pela atenção 
Qualquer dúvida estou a disposição 
Abraços`,
};

export const TEMPLATE_PADRAO_LINK_SITE: AbordagemTemplate = {
  id: "padrao_link_site",
  titulo: "Padrão com link para site",
  descricao: "Abordagem apresentando proposta e protótipo de site moderno, adaptando caso já possua ou não site próprio.",
  canal: "todos",
  isPadrao: true,
  criadoEm: "2026-11-10T00:00:00.000Z",
  conteudo: `Olá, tudo bem? Me chamo Fábio, sou da Locomotiva Comunicação.

Vi que a [Nome do Lead] é uma referência em [Negócio do Lead] e acredito que exista uma oportunidade de fortalecer ainda mais sua presença digital. Notei que [se tiver site: o site atual poderia ser melhor aproveitado para apresentar os serviços e facilitar o contato com clientes / se não tiver site: a empresa ainda não conta com um site próprio para apresentar seus serviços e oferecer um canal direto de contato aos clientes].

Pensando nisso, desenvolvemos uma proposta de site moderno, rápido e alinhado ao perfil da [Nome da Empresa], com foco em valorizar o negócio, apresentar seus serviços e facilitar o contato com potenciais clientes.

Com quem eu poderia falar por aqui (ou por e-mail) para apresentar essa proposta e mostrar o protótipo que desenvolvemos especialmente para a empresa?

Obrigado pela atenção!`,
};

export const TEMPLATES_INICIAIS: AbordagemTemplate[] = [
  TEMPLATE_PADRAO_FABIO,
  TEMPLATE_PADRAO_LINK_SITE,
  {
    id: "contato_direto_whats",
    titulo: "Abordagem Rápida & Direta (WhatsApp)",
    descricao: "Mensagem curta de 4 parágrafos focada em abrir o canal no WhatsApp.",
    canal: "whatsapp",
    isPadrao: false,
    criadoEm: "2026-10-22T00:00:00.000Z",
    conteudo: `Olá, [boa tarde/bom dia/boa noite], tudo bem?

Sou o Fábio, da Locomotiva Comunicação aqui na Serra Gaúcha.

Estivemos mapeando a procura por [SERVIÇO DO CLIENTE] em [CIDADE] e identificamos uma demanda relevante por [TERMOS DE BUSCA LEVANTADOS]. Notamos que a [NOME DA EMPRESA] tem grande potencial para absorver esses clientes.

Sintetizamos esses dados em um documento resumido de 2 minutos. Posso te enviar o arquivo por aqui para dar uma olhada?

Obrigado pela atenção e um abraço!`,
  },
  {
    id: "contato_direct_instagram",
    titulo: "Direct Amigável (Instagram)",
    descricao: "Mensagem para Direct convidando educadamente a receber o PDF no WhatsApp.",
    canal: "instagram",
    isPadrao: false,
    criadoEm: "2026-10-22T00:00:00.000Z",
    conteudo: `Olá, pessoal da [NOME DA EMPRESA]! [boa tarde/bom dia/boa noite], tudo bem?

Me chamo Fábio, sou consultor na Locomotiva Comunicação aqui de Caxias do Sul.

Realizamos um levantamento técnico sobre a procura por [SERVIÇO DO CLIENTE] em [CIDADE] e região, reunindo dados práticos em um PDF resumido.

Qual seria o melhor WhatsApp de vocês para eu enviar esse material para darem uma olhada sem compromisso?

Um abraço!`,
  },
];

export const LS_KEY_ABORDAGEM_TEMPLATES = "locomotiva_abordagem_templates";

/**
 * Carrega a lista de templates salvos no localStorage (com fallback para templates padrão).
 */
export function loadAbordagemTemplates(): AbordagemTemplate[] {
  if (typeof window === "undefined") return TEMPLATES_INICIAIS;
  try {
    const raw = localStorage.getItem(LS_KEY_ABORDAGEM_TEMPLATES);
    if (!raw) return TEMPLATES_INICIAIS;
    const parsed = JSON.parse(raw) as AbordagemTemplate[];
    if (!Array.isArray(parsed) || parsed.length === 0) return TEMPLATES_INICIAIS;

    let result = [...parsed];

    // Garante que o template padrão esteja sempre presente no início
    const temPadrao = result.some((t) => t.id === TEMPLATE_PADRAO_FABIO.id);
    if (!temPadrao) {
      result = [TEMPLATE_PADRAO_FABIO, ...result];
    }

    // Garante que o template Padrão com link para site esteja sempre presente
    const temLinkSite = result.some((t) => t.id === TEMPLATE_PADRAO_LINK_SITE.id);
    if (!temLinkSite) {
      const idxPadrao = result.findIndex((t) => t.id === TEMPLATE_PADRAO_FABIO.id);
      if (idxPadrao !== -1) {
        result.splice(idxPadrao + 1, 0, TEMPLATE_PADRAO_LINK_SITE);
      } else {
        result = [TEMPLATE_PADRAO_LINK_SITE, ...result];
      }
    }

    return result;
  } catch (err) {
    console.error("Erro ao carregar templates de abordagem:", err);
    return TEMPLATES_INICIAIS;
  }
}

/**
 * Salva a lista de templates de abordagem no localStorage.
 */
export function saveAbordagemTemplates(templates: AbordagemTemplate[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_KEY_ABORDAGEM_TEMPLATES, JSON.stringify(templates));
  } catch (err) {
    console.error("Erro ao salvar templates de abordagem:", err);
  }
}

/**
 * Obtém a saudação amigável baseada na hora do dia.
 */
export function obterSaudacaoHora(data: Date = new Date()): string {
  const hora = data.getHours();
  if (hora >= 5 && hora < 12) return "bom dia";
  if (hora >= 12 && hora < 18) return "boa tarde";
  return "boa noite";
}

/**
 * Resolve e substitui dinamicamente todas as variáveis em colchetes `[...]`
 * de um template para os dados reais da empresa ativa.
 */
export function resolverVariaveisTemplate(
  conteudoTemplate: string,
  empresa: EmpresaCtx,
  dataAtual: Date = new Date(),
): string {
  if (!conteudoTemplate) return "";

  const saudacao = obterSaudacaoHora(dataAtual);
  const nomeEmpresa = empresa.nome || "sua empresa";
  const cidade = empresa.cidade || "Caxias do Sul";
  const areaAtuacao = empresa.areaAtuacao || empresa.segmento || "do setor";
  const servicoCliente = empresa.segmento || empresa.areaAtuacao || "da sua empresa";

  // Extrai termos de busca reais levantados
  const termosArray = (empresa.termosEncontrados || empresa.buscasPartida || "")
    .split(/[\n,;]+/)
    .map((t) => t.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);

  let termosLevantados = "";
  if (termosArray.length >= 2) {
    termosLevantados = `"${termosArray[0]}" e "${termosArray[1]}"`;
  } else if (termosArray.length === 1) {
    termosLevantados = `"${termosArray[0]}"`;
  } else {
    termosLevantados = `"${servicoCliente} em ${cidade}"`;
  }

  // Verifica se a empresa tem site ativo e válido
  const temSite = Boolean(
    empresa.site &&
      empresa.site.trim().length > 3 &&
      empresa.statusSite !== "sem_site" &&
      !empresa.site.toLowerCase().includes("não possui") &&
      !empresa.site.toLowerCase().includes("nao possui"),
  );

  return (
    conteudoTemplate
      // Condicionais de site: [se tiver site: ... / se não tiver site: ...]
      .replace(
        /\[\s*se tiver site:\s*([\s\S]*?)\s*\/\s*se n[ãa]o tiver site:\s*([\s\S]*?)\s*\]/gi,
        (_match, comSite, semSite) => (temSite ? comSite.trim() : semSite.trim()),
      )
      .replace(
        /\[\s*se n[ãa]o tiver site:\s*([\s\S]*?)\s*\/\s*se tiver site:\s*([\s\S]*?)\s*\]/gi,
        (_match, semSite, comSite) => (temSite ? comSite.trim() : semSite.trim()),
      )
      // [boa tarde/bom dia/boa noite] e variações
      .replace(/\[\s*(?:boa tarde\/bom dia\/boa noite|bom dia\/boa tarde\/boa noite|sauda[çc][aã]o)\s*\]/gi, saudacao)
      // [Área de Atuação]
      .replace(/\[\s*(?:[Ááa]rea de [Aa]tua[çc][ãa]o|segmento)\s*\]/gi, areaAtuacao)
      // [CIDADE]
      .replace(/\[\s*(?:CIDADE|cidade)\s*\]/gi, cidade)
      // [SERVIÇO DO CLIENTE] ou [Negócio do Lead]
      .replace(
        /\[\s*(?:SERVI[ÇC]O DO CLIENTE|servi[çc]o do cliente|servi[çc]o|neg[oó]cio do lead|neg[oó]cio)\s*\]/gi,
        servicoCliente,
      )
      // [TERMOS DE BUSCA LEVANTADOS]
      .replace(
        /\[\s*(?:TERMOS DE BUSCA LEVANTADOS|termos de busca levantados|termos de busca|palavras[- ]chave)\s*\]/gi,
        termosLevantados,
      )
      // [NOME DA EMPRESA] ou [Nome do Lead]
      .replace(
        /\[\s*(?:NOME DA EMPRESA|nome da empresa|nome do lead|lead|empresa)\s*\]/gi,
        nomeEmpresa,
      )
      // [SEU NOME]
      .replace(/\[\s*(?:SEU NOME|seu nome|consultor)\s*\]/gi, "Fábio")
      // [AGENCIA]
      .replace(/\[\s*(?:AGENCIA|agencia|agência)\s*\]/gi, "Locomotiva Comunicação")
  );
}
