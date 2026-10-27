import { PROMPT_PADRAO_BASE } from "./prompt-padrao-config";

export interface MontarPromptSiteParams {
  empresa: {
    nome: string;
    segmento: string;
    areaAtuacao?: string;
    cidade: string;
    endereco?: string;
    telefone?: string;
    whatsapp?: string;
    email?: string;
    termosEncontrados?: string;
  };
  diagnostico?: any;
  dossier360?: any;
  relatorio?: any;
  promptPadrao?: string;
  siteConteudoCustomizado?: string;
  logoBase64?: string;
  logoNomeArquivo?: string;
  instrucoesDesignMd?: string;
  pesquisaSnippets?: string[];
  diferenciaisDetectados?: string[];
  // Campos legados opcionais para retrocompatibilidade
  usarAntiIaBespoke?: boolean;
  usarSkillsClaude?: boolean;
  motorScroll?: string;
  skillsAdicionais?: any[];
}

export function montarPromptSiteCompleto(params: MontarPromptSiteParams): {
  promptSystem: string;
  promptUser: string;
  promptFinal: string;
} {
  const {
    empresa,
    diagnostico,
    dossier360,
    relatorio,
    promptPadrao,
    siteConteudoCustomizado,
    logoBase64,
    logoNomeArquivo,
    instrucoesDesignMd,
    pesquisaSnippets = [],
    diferenciaisDetectados = [],
  } = params;

  // 1. Extração de diagnósticos
  const diagnosticoSite = diagnostico?.site || {};
  const diagnosticoAtend = diagnostico?.atendimento || {};
  const diagnosticoInsta = diagnostico?.instagram || {};
  const relatorioLead = relatorio || {};

  const diagnosticoItens: string[] = [];
  if (diagnosticoSite.responsivo === false) {
    diagnosticoItens.push("Site anterior não era responsivo para celulares (gerar layout mobile-first impecável).");
  }
  if (diagnosticoSite.velocidade === "ruim" || diagnosticoSite.velocidade === "media") {
    diagnosticoItens.push(`Velocidade de carregamento anterior classificada como '${diagnosticoSite.velocidade}' (gerar código leve, otimizado e veloz).`);
  }
  if (diagnosticoSite.cta === false) {
    diagnosticoItens.push("Faltavam chamadas claras para ação (incluir CTAs estratégicos e botões visíveis).");
  }
  if (diagnosticoSite.whatsappBtn === false) {
    diagnosticoItens.push("Ausência de botão para WhatsApp (incluir botão flutuante e botões na Hero e seções).");
  }
  if (diagnosticoSite.qualidadePercebida !== undefined && diagnosticoSite.qualidadePercebida < 7) {
    diagnosticoItens.push(`Qualidade percebida anterior baixa (${diagnosticoSite.qualidadePercebida}/10) - transmitir sofisticação, acabamento nobre e autoridade.`);
  }

  if (diagnosticoAtend.clarezaServicos === false) {
    diagnosticoItens.push("Falta de clareza nas especialidades oferecidas (detalhar cada serviço com benefícios concretos).");
  }
  if (diagnosticoAtend.provaSocial === false) {
    diagnosticoItens.push("Carência de provas sociais (destacar projetos executados, credibilidade e depoimentos de clientes da região).");
  }
  if (diagnosticoAtend.contatoFacil === false) {
    diagnosticoItens.push("Canais de contato confusos (prover formulário direto de orçamento e canais rápidos e acessíveis).");
  }

  if (diagnosticoInsta.qualidadeVisual !== undefined) {
    diagnosticoItens.push(`Alinhamento visual da marca: nota ${diagnosticoInsta.qualidadeVisual}/10 (elevar padrão editorial).`);
  }

  if (relatorioLead.resumo) {
    diagnosticoItens.push(`Diagnóstico Estratégico do Lead: ${relatorioLead.resumo}`);
  }
  if (empresa.termosEncontrados) {
    diagnosticoItens.push(`Termos de busca e palavras-chave locais: ${empresa.termosEncontrados.replace(/\n/g, ", ")}`);
  }

  const dossierPersonas = dossier360?.personas || [];
  const dossierObjecoes = dossier360?.objecoes || [];
  const dossierDiferenciais = dossier360?.diferenciais || [];

  // 2. Montagem do System Prompt (Baseado estritamente no Prompt Padrão salvo pelo usuário)
  const baseSystem = promptPadrao && promptPadrao.trim().length > 0 ? promptPadrao.trim() : PROMPT_PADRAO_BASE.trim();
  const partesSystem: string[] = [baseSystem];

  if (logoBase64) {
    partesSystem.push(`[LOGO OFICIAL DA MARCA FORNECIDO PELO USUÁRIO]
O cliente anexou o arquivo de logo '${logoNomeArquivo || "logo"}'. No cabeçalho (navbar) e no rodapé (footer), UTILIZE A IMAGEM DO LOGO via <img src="${logoBase64}" alt="${empresa.nome}" class="h-10 sm:h-12 w-auto object-contain" /> em vez de texto tipográfico.`);
  }

  if (instrucoesDesignMd) {
    partesSystem.push(`[DIRETRIZES DE DESIGN E BRANDING DO CLIENTE (.MD)]
${instrucoesDesignMd}`);
  }

  partesSystem.push(`[FORMATO OBRIGATÓRIO DE RETORNO]
Retorne APENAS o código HTML5 completo (começando em <!DOCTYPE html> e terminando em </html>), sem blocos de texto ou explicações antes ou depois.`);

  const promptSystem = partesSystem.join("\n\n");

  // 3. Montagem do User Prompt (Dados da Empresa + Estrutura & Copys do Botão Conteúdo)
  const partesUser: string[] = [];

  partesUser.push(`[DADOS DA EMPRESA E LOCALIZAÇÃO]
- Nome da Empresa: ${empresa.nome}
- Nicho / Segmento: ${empresa.segmento}
- Área de Atuação: ${empresa.areaAtuacao || empresa.segmento}
- Cidade: ${empresa.cidade}/RS (Serra Gaúcha)
- Endereço: ${empresa.endereco || "Não informado"}
- Telefone / WhatsApp: ${empresa.whatsapp || empresa.telefone || "Não informado"}
- E-mail: ${empresa.email || "Não informado"}`);

  // ESTRUTURA E COPYS DEFINIDAS NO BOTÃO "CONTEÚDO"
  if (siteConteudoCustomizado && siteConteudoCustomizado.trim().length > 0) {
    partesUser.push(`[ESTRUTURA DE SEÇÕES E CONTEÚDO/COPY DO SITE (DEFINIDOS NO BOTÃO CONTEÚDO)]
ATENÇÃO OBRIGATÓRIA: Utilize estritamente a seguinte estrutura de seções recomendada e as copys/textos redigidos no botão Conteúdo para estruturar a página e compor todas as seções, títulos (H1/H2), parágrafos, listas de serviços, provas sociais e CTAs:
---
${siteConteudoCustomizado.trim()}
---`);
  }

  partesUser.push(`[DADOS DO DIAGNÓSTICO E RELATÓRIO DO CLIENTE]
${diagnosticoItens.length > 0 ? diagnosticoItens.map((d) => `- ${d}`).join("\n") : "- O novo site deve resolver todas as falhas diagnosticadas com estrutura ONE-PAGE fluida, carregamento instantâneo e excelente conversão para WhatsApp."}`);

  partesUser.push(`[DADOS DO DOSSIÊ 360 DO LEAD]
${dossierPersonas.length > 0 ? `- Perfil do público/persona: ${JSON.stringify(dossierPersonas.slice(0, 2))}.` : `- Público-alvo: Clientes residenciais e comerciais de ${empresa.cidade} e região que buscam confiança e alto padrão.`}
${dossierObjecoes.length > 0 ? `- Objeções comuns no fechamento: ${JSON.stringify(dossierObjecoes.slice(0, 3))}.` : "- Objeções a contornar nos textos: segurança técnica, prazos e garantia de acabamento."}
${dossierDiferenciais.length > 0 ? `- Diferenciais competitivos: ${JSON.stringify(dossierDiferenciais.slice(0, 3))}.` : `- Diferenciais locais: atendimento próximo, pontualidade e credibilidade em ${empresa.cidade}.`}`);

  if (pesquisaSnippets.length > 0) {
    partesUser.push(`[PESQUISA WEB LOCAL EM TEMPO REAL]
${pesquisaSnippets.slice(0, 4).join("\n")}
Diferenciais detectados no mercado: ${diferenciaisDetectados.length > 0 ? diferenciaisDetectados.join(", ") : "Qualidade artesanal, pontualidade e transparência."}`);
  }

  if (instrucoesDesignMd) {
    partesUser.push(`[ESPECIFICAÇÕES DE DESIGN FORNECIDAS PELO USUÁRIO (.MD)]
${instrucoesDesignMd}`);
  }

  partesUser.push(`Gere agora o código HTML5 completo do site ONE-PAGE seguindo rigorosamente todas as regras e opções definidas acima.`);

  const promptUser = partesUser.join("\n\n");
  const promptFinal = `=== PROMPT DO SISTEMA (PROMPT PADRÃO) ===\n\n${promptSystem}\n\n=== PROMPT DO USUÁRIO (CONTEÚDO & BRIEFING) ===\n\n${promptUser}`;

  return { promptSystem, promptUser, promptFinal };
}
