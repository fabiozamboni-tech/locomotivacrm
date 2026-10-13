import { createServerFn } from "@tanstack/react-start";

export interface GerarDadosCadastroInput {
  nome: string;
  segmento?: string;
  cidade: string;
  bairro?: string;
  endereco?: string;
  site?: string;
  instagram?: string;
  observacoes?: string;
  areaAtuacaoAtual?: string;
}

export interface DadosCadastroIAResult {
  areaAtuacao: string;
  segmentoRefinado: string;
  buscasPartida: string;
  termosEncontrados: string;
  buscaGoogleMaps: string;
  resumoEstrategico: string;
  modo: "ia" | "autocomplete_deterministico";
}

async function buscarSugestoesGoogle(query: string): Promise<string[]> {
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=pt-BR&gl=br&q=${encodeURIComponent(query)}`;
    const resp = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LocomotivaBot/1.0)" },
    });
    if (!resp.ok) return [];
    const data = (await resp.json()) as [string, string[]];
    return Array.isArray(data?.[1]) ? data[1] : [];
  } catch {
    return [];
  }
}

function gerarFallbackDeterministico(
  data: GerarDadosCadastroInput,
  sugestoesGoogle: string[],
): DadosCadastroIAResult {
  const seg = (data.segmento?.trim() || "Empresa").toLowerCase();
  const cid = data.cidade.trim();
  const nome = data.nome.trim();

  // Especialidade e área de atuação contextual
  let areaAtuacao = data.areaAtuacaoAtual?.trim() || "";
  if (!areaAtuacao) {
    if (seg.includes("vinícola") || seg.includes("vinho")) {
      areaAtuacao = `Produção e comercialização de vinhos finos, espumantes e experiências de enoturismo em ${cid}`;
    } else if (seg.includes("móve") || seg.includes("marcenaria")) {
      areaAtuacao = `Fabricação e projetos de móveis sob medida e planejados de alto padrão residencial e corporativo`;
    } else if (seg.includes("restaurante") || seg.includes("gastronomia") || seg.includes("pizzaria")) {
      areaAtuacao = `Gastronomia regional, atendimento a la carte, eventos e reservas em ${cid}`;
    } else if (seg.includes("hotel") || seg.includes("pousada")) {
      areaAtuacao = `Hospedagem turística, acomodações e lazer na região da Serra Gaúcha`;
    } else if (seg.includes("clínica") || seg.includes("odont")) {
      areaAtuacao = `Serviços especializados em saúde, estética e tratamentos odontológicos avançados`;
    } else {
      areaAtuacao = `Prestação de serviços e fornecimento de produtos especializados no segmento de ${seg} para ${cid} e região`;
    }
  }

  // Buscas de partida (Google Search Seeds)
  const buscasPartida = [
    `${seg} em ${cid}`,
    `melhor ${seg} ${cid}`,
    `${nome} ${cid}`,
    `${seg} perto de mim`,
    `onde comprar ${seg} ${cid}`,
    `orçamento ${seg} ${cid}`,
  ].join("\n");

  // Termos encontrados (Google Autocomplete / SEO)
  const termosSet = new Set<string>();
  for (const s of sugestoesGoogle) {
    termosSet.add(s);
  }
  if (termosSet.size < 5) {
    termosSet.add(`${seg} ${cid}`);
    termosSet.add(`${seg} em ${cid} rs`);
    termosSet.add(`${seg} ${cid} horario`);
    termosSet.add(`${seg} ${cid} telefone`);
    termosSet.add(`${nome} ${cid}`);
    termosSet.add(`${nome} instagram`);
    termosSet.add(`preço ${seg} ${cid}`);
  }
  const termosEncontrados = Array.from(termosSet).slice(0, 10).join("\n");

  const buscaGoogleMaps = `${nome} ${seg} ${cid} RS`;
  const resumoEstrategico = `Empresa localizada em ${cid}/RS com alta oportunidade de ampliação de captação digital no segmento de ${seg}.`;

  return {
    areaAtuacao,
    segmentoRefinado: data.segmento || "Geral",
    buscasPartida,
    termosEncontrados,
    buscaGoogleMaps,
    resumoEstrategico,
    modo: "autocomplete_deterministico",
  };
}

export const gerarDadosCadastroIA_ServerFn = createServerFn({ method: "POST" })
  .inputValidator((data: GerarDadosCadastroInput) => data)
  .handler(async ({ data }): Promise<DadosCadastroIAResult> => {
    const seg = data.segmento?.trim() || "Empresa";
    const cid = data.cidade.trim();

    // Busca sugestões em tempo real no Google Autocomplete para enriquecer a base
    const queries = [`${seg} em ${cid}`, `${data.nome} ${cid}`];
    const sugestoesArrays = await Promise.all(queries.map(buscarSugestoesGoogle));
    const sugestoesGoogle = Array.from(new Set(sugestoesArrays.flat()));

    // 1. Tenta usar o ChatGPT / Lovable AI Gateway se disponível
    try {
      const { chatJSON } = await import("./ai-gateway.server");
      const sys = `Você é um Estrategista Sênior de SEO, Inteligência de Mercado e Posicionamento B2B da LOCOMOTIVA COMUNICAÇÃO (agência de Comunicação 360 & Tecnologia na Serra Gaúcha/RS).
Sua missão é enriquecer o cadastro comercial de uma empresa para alimentar diagnósticos, relatórios de SEO/leads e abordagens executivas de vendas.
Seja direto, técnico, específico para o negócio e para a localização regional. Nada de respostas genéricas.`;

      const user = `Analise os dados cadastrais da empresa e produza as informações estratégicas para seu cadastro:

Empresa: ${data.nome}
Segmento inicial: ${seg}
Cidade: ${cid} / RS
Bairro/Endereço: ${data.bairro || ""} ${data.endereco || ""}
Site: ${data.site || "Não possui ou não informado"}
Instagram: ${data.instagram || "Não possui ou não informado"}
Observações internas: ${data.observacoes || "Nenhuma"}
${data.areaAtuacaoAtual ? `Área de atuação já registrada: ${data.areaAtuacaoAtual}` : ""}
${sugestoesGoogle.length > 0 ? `Termos sugeridos pelo Google na região:\n${sugestoesGoogle.slice(0, 6).join(", ")}` : ""}

Retorne EXATAMENTE este JSON:
{
  "areaAtuacao": "Descrição refinada de 1 a 2 linhas da especialidade, posicionamento e produtos/serviços principais da empresa (ex: 'Fabricação sob medida de móveis planejados de alto padrão para residências e escritórios corporativos').",
  "segmentoRefinado": "O segmento comercial padronizado e profissional (ex: 'Móveis Planejados & Decoração', 'Vinícola & Enoturismo', 'Restaurante Típico Regional', etc.).",
  "buscasPartida": "De 4 a 6 termos de busca que clientes reais digitam no Google para encontrar essa solução na cidade/região, separados estritamente por quebra de linha (uma busca por linha).",
  "termosEncontrados": "De 6 a 10 palavras-chave com alta intenção de compra e volume no Google para esse nicho e local, separadas estritamente por quebra de linha (um termo por linha).",
  "buscaGoogleMaps": "A consulta ideal e exata para verificar a presença desta empresa e seus concorrentes diretos no Google Maps e Google Busca (ex: 'Móveis planejados em Bento Gonçalves RS').",
  "resumoEstrategico": "2 frases com a síntese do potencial de captação comercial desta empresa."
}`;

      const res = await chatJSON<{
        areaAtuacao: string;
        segmentoRefinado: string;
        buscasPartida: string;
        termosEncontrados: string;
        buscaGoogleMaps: string;
        resumoEstrategico: string;
      }>([
        { role: "system", content: sys },
        { role: "user", content: user },
      ]);

      if (res && res.areaAtuacao && res.buscasPartida) {
        return {
          ...res,
          modo: "ia",
        };
      }
    } catch (err: any) {
      console.warn("AI Gateway indisponível ou erro na chamada, utilizando gerador inteligente de contingência:", err.message);
    }

    // 2. Fallback determinístico inteligente
    return gerarFallbackDeterministico(data, sugestoesGoogle);
  });
