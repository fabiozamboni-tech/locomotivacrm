import { createServerFn } from "@tanstack/react-start";
import type { BrasilApiCnpjResult } from "./public-apis.functions";

export interface GerarDadosCadastroInput {
  nome: string;
  segmento?: string;
  cidade: string;
  bairro?: string;
  endereco?: string;
  cep?: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  cnpj?: string;
  razaoSocial?: string;
  site?: string;
  instagram?: string;
  observacoes?: string;
  areaAtuacaoAtual?: string;
  publicoAlvoAtual?: string;
  buscaGoogleMapsAtual?: string;
  buscasPartidaAtual?: string;
}

export interface DadosCadastroIAResult {
  // Identificação e Atuação
  nome: string;
  razaoSocial?: string;
  cnpj?: string;
  segmentoRefinado: string;
  areaAtuacao: string;
  publicoAlvo: string;

  // Localização & Contato
  cidade: string;
  bairro?: string;
  endereco?: string;
  cep?: string;
  telefone?: string; // Telefone Fixo
  whatsapp?: string; // WhatsApp Comercial
  email?: string;
  site?: string;
  instagram?: string;

  // Inteligência de Busca & SEO
  buscasPartida: string;
  termosEncontrados: string;
  buscaGoogleMaps: string;
  googleMapsUri?: string;
  rating?: number;
  totalRatings?: number;

  // Resumo & Metadados
  resumoEstrategico: string;
  modo: "ia" | "autocomplete_deterministico";
  fontes: string[];
  dadosReceita?: BrasilApiCnpjResult | null;
}

export function cleanDigits(val?: string | null): string {
  return (val || "").replace(/\D/g, "");
}

export function formatarCNPJ(raw: string): string {
  const c = cleanDigits(raw);
  if (c.length !== 14) return raw.trim();
  return `${c.slice(0, 2)}.${c.slice(2, 5)}.${c.slice(5, 8)}/${c.slice(8, 12)}-${c.slice(12, 14)}`;
}

export function formatarTelefoneBR(raw: string, dddPadrao = "54"): string {
  let digits = cleanDigits(raw);
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
    digits = digits.slice(2);
  }
  // Se veio sem DDD (8 ou 9 dígitos)
  if (digits.length === 8 || digits.length === 9) {
    digits = `${dddPadrao}${digits}`;
  }
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return raw.trim();
}

export function classificarTelefones(
  candidatos: (string | undefined | null)[],
  dddPadrao = "54",
): { fixo?: string; whatsapp?: string } {
  const fixosSet = new Set<string>();
  const mobilesSet = new Set<string>();

  for (const c of candidatos) {
    if (!c) continue;
    // Separa possíveis números concatenados (ex: "54 34552000 / 54 991234567")
    const partes = c.split(/[/;,|\n]+/).map((s) => s.trim()).filter(Boolean);
    for (const p of partes) {
      let d = cleanDigits(p);
      if (!d || d.length < 8) continue;
      if ((d.length === 12 || d.length === 13) && d.startsWith("55")) {
        d = d.slice(2);
      }
      if (d.length === 8) {
        if (d.startsWith("9")) {
          d = `${dddPadrao}9${d}`;
          mobilesSet.add(formatarTelefoneBR(d));
        } else {
          d = `${dddPadrao}${d}`;
          fixosSet.add(formatarTelefoneBR(d));
        }
      } else if (d.length === 9) {
        d = `${dddPadrao}${d}`;
        mobilesSet.add(formatarTelefoneBR(d));
      } else if (d.length === 10) {
        const primeiroDigito = d[2];
        if (primeiroDigito === "9") {
          const d11 = `${d.slice(0, 2)}9${d.slice(2)}`;
          mobilesSet.add(formatarTelefoneBR(d11));
        } else {
          fixosSet.add(formatarTelefoneBR(d));
        }
      } else if (d.length === 11) {
        if (d[2] === "9") {
          mobilesSet.add(formatarTelefoneBR(d));
        } else {
          fixosSet.add(formatarTelefoneBR(d));
        }
      }
    }
  }

  const fixos = Array.from(fixosSet);
  const mobiles = Array.from(mobilesSet);

  return {
    fixo: fixos[0],
    whatsapp: mobiles[0],
  };
}

async function consultarReceitaFederal(cnpj: string): Promise<BrasilApiCnpjResult | null> {
  const raw = cleanDigits(cnpj);
  if (raw.length !== 14) return null;

  // 1. Tenta BrasilAPI
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${raw}`, {
      headers: { "User-Agent": "LocomotivaCRM/1.0" },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const info: any = await res.json();
      if (info && (info.razao_social || info.nome_fantasia)) {
        return {
          sucesso: true,
          cnpj: formatarCNPJ(raw),
          razaoSocial: info.razao_social || "",
          nomeFantasia: info.nome_fantasia || info.razao_social || "",
          situacaoCadastral: info.descricao_situacao_cadastral || "ATIVA",
          dataAbertura: info.data_inicio_atividade || "",
          cnaeCodigo: info.cnae_fiscal,
          cnaeDescricao: info.cnae_fiscal_descricao || "",
          capitalSocial: info.capital_social,
          cep: info.cep ? cleanDigits(info.cep) : "",
          logradouro: info.logradouro || "",
          numero: info.numero || "",
          complemento: info.complemento || "",
          bairro: info.bairro || "",
          municipio: info.municipio || "",
          uf: info.uf || "",
          telefone: [info.ddd_telefone_1, info.ddd_telefone_2].filter(Boolean).join(" / "),
          email: info.email || "",
          qsa: Array.isArray(info.qsa)
            ? info.qsa.map((s: any) => ({
                nomeSocio: s.nome_socio || "",
                qualificacaoSocio: s.qualificacao_socio || "",
                faixaEtaria: s.faixa_etaria || "",
              }))
            : [],
        };
      }
    }
  } catch (err) {
    console.warn("[cadastro-ia] BrasilAPI falhou para CNPJ", raw, err);
  }

  // 2. Tenta Minha Receita
  try {
    const res = await fetch(`https://minhareceita.org/${raw}`, {
      headers: { "User-Agent": "LocomotivaCRM/1.0" },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const info: any = await res.json();
      if (info && info.razao_social) {
        return {
          sucesso: true,
          cnpj: formatarCNPJ(raw),
          razaoSocial: info.razao_social || "",
          nomeFantasia: info.nome_fantasia || info.razao_social || "",
          situacaoCadastral: info.descricao_situacao_cadastral || "ATIVA",
          dataAbertura: info.data_inicio_atividade || "",
          cnaeCodigo: info.cnae_fiscal,
          cnaeDescricao: info.cnae_fiscal_descricao || "",
          capitalSocial: info.capital_social,
          cep: info.cep ? cleanDigits(info.cep) : "",
          logradouro: info.logradouro || "",
          numero: info.numero || "",
          complemento: info.complemento || "",
          bairro: info.bairro || "",
          municipio: info.municipio || "",
          uf: info.uf || "",
          telefone: [info.ddd_telefone_1, info.ddd_telefone_2].filter(Boolean).join(" / "),
          email: info.email || "",
          qsa: Array.isArray(info.qsa)
            ? info.qsa.map((s: any) => ({
                nomeSocio: s.nome_socio || "",
                qualificacaoSocio: s.qualificacao_socio || "",
                faixaEtaria: s.faixa_etaria || "",
              }))
            : [],
        };
      }
    }
  } catch (err) {
    console.warn("[cadastro-ia] MinhaReceita falhou para CNPJ", raw, err);
  }

  // 3. Tenta ReceitaWS
  try {
    const res = await fetch(`https://receitaws.com.br/v1/cnpj/${raw}`, {
      headers: { "User-Agent": "LocomotivaCRM/1.0" },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const info: any = await res.json();
      if (info && info.status !== "ERROR" && info.nome) {
        return {
          sucesso: true,
          cnpj: formatarCNPJ(raw),
          razaoSocial: info.nome || "",
          nomeFantasia: info.fantasia || info.nome || "",
          situacaoCadastral: info.situacao || "ATIVA",
          dataAbertura: info.abertura || "",
          cnaeDescricao: info.atividade_principal?.[0]?.text || "",
          capitalSocial: Number(info.capital_social) || undefined,
          cep: info.cep ? cleanDigits(info.cep) : "",
          logradouro: info.logradouro || "",
          numero: info.numero || "",
          complemento: info.complemento || "",
          bairro: info.bairro || "",
          municipio: info.municipio || "",
          uf: info.uf || "",
          telefone: info.telefone || "",
          email: info.email || "",
          qsa: Array.isArray(info.qsa)
            ? info.qsa.map((s: any) => ({
                nomeSocio: s.nome || "",
                qualificacaoSocio: s.qual || "",
              }))
            : [],
        };
      }
    }
  } catch (err) {
    console.warn("[cadastro-ia] ReceitaWS falhou para CNPJ", raw, err);
  }

  return null;
}

async function descobrirCnpjGoogle(nome: string, cidade?: string): Promise<string> {
  const serpApiKey =
    process.env.SERPAPI_API_KEY?.trim() ||
    "ec62da1cce88a0223fee434841dbaceef4b27c63b8825d53de8d25090ccdbe02";
  if (!serpApiKey || serpApiKey.includes(":")) return "";

  try {
    const queries = [
      `cnpj "${nome}" ${cidade || ""}`,
      `cnpj ${nome} ${cidade || "RS"}`,
      `"${nome}" cnpj receita federal`,
    ];

    for (const q of queries) {
      const url = new URL("https://serpapi.com/search.json");
      url.searchParams.set("engine", "google");
      url.searchParams.set("q", q);
      url.searchParams.set("api_key", serpApiKey);
      url.searchParams.set("hl", "pt-br");
      url.searchParams.set("gl", "br");

      const res = await fetch(url.toString(), {
        headers: { "User-Agent": "LocomotivaCRM/1.0" },
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) continue;

      const json = (await res.json()) as {
        organic_results?: Array<{ title?: string; snippet?: string; link?: string }>;
      };

      const results = json.organic_results || [];
      for (const r of results) {
        const text = `${r.title || ""} ${r.snippet || ""} ${r.link || ""}`;
        const match = text.match(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/);
        if (match) {
          const c = cleanDigits(match[0]);
          if (c.length === 14) return c;
        }
      }
    }
  } catch (err) {
    console.warn("[cadastro-ia] Erro ao buscar CNPJ via Google Search:", err);
  }
  return "";
}

interface PlaceDataEnriched {
  title?: string;
  address?: string;
  bairro?: string;
  cidade?: string;
  cep?: string;
  phone?: string;
  website?: string;
  category?: string;
  rating?: number;
  reviews?: number;
  googleMapsUri?: string;
  lat?: number;
  lng?: number;
}

async function consultarGoogleMapsPlace(nome: string, cidade: string): Promise<PlaceDataEnriched | null> {
  const serpApiKey =
    process.env.SERPAPI_API_KEY?.trim() ||
    "ec62da1cce88a0223fee434841dbaceef4b27c63b8825d53de8d25090ccdbe02";
  if (!serpApiKey || serpApiKey.includes(":")) return null;

  try {
    const serpUrl = new URL("https://serpapi.com/search.json");
    serpUrl.searchParams.set("engine", "google_maps");
    serpUrl.searchParams.set("q", `${nome} ${cidade} RS`);
    serpUrl.searchParams.set("api_key", serpApiKey);
    serpUrl.searchParams.set("hl", "pt-br");
    serpUrl.searchParams.set("gl", "br");

    const res = await fetch(serpUrl.toString(), {
      headers: { "User-Agent": "LocomotivaCRM/1.0" },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return null;

    const json = (await res.json()) as {
      place_results?: any;
      local_results?: Array<any>;
    };

    const place = json.place_results || json.local_results?.[0];
    if (!place) return null;

    const rawAddr = place.address || "";
    let extractedBairro = "";
    let extractedCidade = "";
    let extractedCep = "";

    const cepMatch = rawAddr.match(/\b\d{5}-?\d{3}\b/);
    if (cepMatch) extractedCep = cleanDigits(cepMatch[0]);

    const dashParts = rawAddr.split(" - ").map((p: string) => p.trim());
    if (dashParts.length >= 3) {
      extractedBairro = dashParts[1];
      extractedCidade = dashParts[2].split(",")[0].trim();
    } else if (dashParts.length === 2) {
      extractedCidade = dashParts[1].split(",")[0].trim();
    }

    return {
      title: place.title,
      address: rawAddr,
      bairro: extractedBairro || undefined,
      cidade: extractedCidade || cidade,
      cep: extractedCep || undefined,
      phone: place.phone,
      website: place.website || place.links?.website,
      category: place.type || (place.types && place.types[0]),
      rating: place.rating,
      reviews: place.reviews,
      googleMapsUri:
        place.link ||
        (place.place_id ? `https://www.google.com/maps/place/?q=place_id:${place.place_id}` : undefined) ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.title || nome} ${rawAddr}`)}`,
      lat: place.gps_coordinates?.latitude,
      lng: place.gps_coordinates?.longitude,
    };
  } catch (err) {
    console.warn("[cadastro-ia] Erro ao buscar local no Google Maps:", err);
    return null;
  }
}

async function extrairInfoDoSite(
  siteUrl: string,
): Promise<{ whatsapp?: string; instagram?: string; email?: string }> {
  if (!siteUrl || siteUrl.length < 5) return {};
  try {
    const target = siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`;
    const res = await fetch(target, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return {};
    const html = await res.text();

    let whatsapp: string | undefined;
    let instagram: string | undefined;
    let email: string | undefined;

    // Link WhatsApp
    const waMatch = html.match(/(?:wa\.me\/|api\.whatsapp\.com\/send\?phone=)(?:55)?(\d{10,11})/i);
    if (waMatch && waMatch[1]) {
      whatsapp = waMatch[1];
    } else {
      const waTextMatch = html.match(/whatsapp[^\d]{1,25}\(?([1-9]{2})\)?\s*(9\d{4})[-.\s]*(\d{4})/i);
      if (waTextMatch) {
        whatsapp = `${waTextMatch[1]}${waTextMatch[2]}${waTextMatch[3]}`;
      }
    }

    // Perfil Instagram
    const igMatch = html.match(/instagram\.com\/([a-zA-Z0-9._]+)/i);
    if (igMatch && igMatch[1]) {
      const handle = igMatch[1].replace(/\/$/, "");
      if (!["p", "explore", "reels", "direct", "accounts", "share"].includes(handle.toLowerCase())) {
        instagram = `@${handle}`;
      }
    }

    // Email Comercial
    const mailMatch = html.match(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    if (mailMatch && mailMatch[1]) {
      email = mailMatch[1].toLowerCase().trim();
    }

    return { whatsapp, instagram, email };
  } catch {
    return {};
  }
}

export function gerarPublicoAlvoFallback(seg: string, cid: string, area?: string): string {
  const s = (seg || "").toLowerCase();
  const a = (area || "").toLowerCase();

  if (s.includes("vinícola") || s.includes("vinho") || s.includes("enoturismo") || a.includes("vinho")) {
    return `Turistas, apreciadores de vinhos finos e espumantes, casais e famílias (classes A e B) que visitam ${cid} e a Serra Gaúcha em busca de experiências enogastronômicas, passeios e compras diretas de rótulos selecionados.`;
  }
  if (s.includes("móve") || s.includes("marcenaria") || s.includes("planejados") || a.includes("móvel")) {
    return `Proprietários de imóveis residenciais de médio e alto padrão, arquitetos, designers de interiores e construtoras de ${cid} e região que buscam móveis sob medida com qualidade de acabamento, pontualidade e projetos personalizados.`;
  }
  if (s.includes("restaurante") || s.includes("gastronomia") || s.includes("pizzaria") || s.includes("bar")) {
    return `Moradores locais e visitantes em ${cid} que procuram refeições de qualidade, almoço executivo, jantares em família, celebrações ou experiências gastronômicas regionais autênticas com ambiente agradável e atendimento ágil.`;
  }
  if (s.includes("hotel") || s.includes("pousada") || s.includes("hospedagem")) {
    return `Viajantes a lazer, casais, famílias e profissionais em viagens de negócios que procuram conforto, boa localização e hospitalidade acolhedora em ${cid} e na região serrana.`;
  }
  if (s.includes("clínica") || s.includes("odont") || s.includes("saúde") || s.includes("médic")) {
    return `Pacientes de ${cid} e cidades vizinhas que valorizam atendimento humanizado, confiança profissional, tratamentos especializados e estrutura moderna para cuidar da saúde e bem-estar.`;
  }
  if (s.includes("metal") || s.includes("indústria") || s.includes("usinagem")) {
    return `Compradores técnicos, engenheiros de produção, gerentes de suprimentos e indústrias que demandam peças, estruturas e serviços de alta precisão com conformidade técnica e pontualidade.`;
  }
  return `Consumidores e empresas locais de ${cid} e região que procuram soluções confiáveis no segmento de ${seg || "serviços"}, priorizando agilidade no atendimento, qualidade comprovada e excelente reputação.`;
}

async function buscarSugestoesGoogle(query: string): Promise<string[]> {
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=pt-BR&gl=br&q=${encodeURIComponent(query)}`;
    const resp = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LocomotivaBot/1.0)" },
      signal: AbortSignal.timeout(4000),
    });
    if (!resp.ok) return [];
    const data = (await resp.json()) as [string, string[]];
    return Array.isArray(data?.[1]) ? data[1] : [];
  } catch {
    return [];
  }
}

export const gerarDadosCadastroIA_ServerFn = createServerFn({ method: "POST" })
  .validator((data: GerarDadosCadastroInput) => data)
  .handler(async ({ data }): Promise<DadosCadastroIAResult> => {
    const segInicial = data.segmento?.trim() || "";
    const cid = data.cidade?.trim() || "Bento Gonçalves";
    const nome = data.nome?.trim() || "Empresa";
    const fontesUtilizadas: string[] = [];

    // 1. DISPARO PARALELO: Google Maps, CNPJ Search e Google Autocomplete
    const rawCnpjInformado = cleanDigits(data.cnpj);

    const [placeData, cnpjDescoberto, sugestoesResult] = await Promise.all([
      consultarGoogleMapsPlace(nome, cid),
      rawCnpjInformado.length === 14 ? Promise.resolve(rawCnpjInformado) : descobrirCnpjGoogle(nome, cid),
      Promise.all([
        buscarSugestoesGoogle(`${segInicial || "serviços"} em ${cid}`),
        buscarSugestoesGoogle(`${nome} ${cid}`),
        buscarSugestoesGoogle(`melhor ${segInicial || "loja"} ${cid}`),
      ]),
    ]);

    if (placeData) fontesUtilizadas.push("Google Maps");

    const cnpjAlvo = rawCnpjInformado.length === 14 ? rawCnpjInformado : cnpjDescoberto;
    let dadosReceita: BrasilApiCnpjResult | null = null;

    // 2. CONSULTA RECEITA FEDERAL
    if (cnpjAlvo && cnpjAlvo.length === 14) {
      dadosReceita = await consultarReceitaFederal(cnpjAlvo);
      if (dadosReceita && dadosReceita.sucesso) {
        fontesUtilizadas.push("Receita Federal (BrasilAPI)");
      }
    }

    // 3. EXTRAÇÃO DE INFORMAÇÕES DO SITE (WhatsApp, Instagram, Email)
    const siteUrl = data.site?.trim() || placeData?.website || "";
    let siteInfo: { whatsapp?: string; instagram?: string; email?: string } = {};
    if (siteUrl) {
      siteInfo = await extrairInfoDoSite(siteUrl);
      if (siteInfo.whatsapp || siteInfo.instagram || siteInfo.email) {
        fontesUtilizadas.push("Site Oficial");
      }
    }

    // 4. CLASSIFICAÇÃO DE TELEFONES (Fixo vs WhatsApp)
    const dddSugerido = cid.toLowerCase().includes("porto alegre") ? "51" : "54";
    const telefonesClassificados = classificarTelefones(
      [
        data.whatsapp,
        siteInfo.whatsapp,
        placeData?.phone,
        dadosReceita?.telefone,
        data.telefone,
      ],
      dddSugerido,
    );

    // 5. RECONCILIAÇÃO DE CAMPOS DE ENDEREÇO E CONTATO
    const enderecoMontado =
      data.endereco?.trim() ||
      placeData?.address ||
      (dadosReceita?.logradouro
        ? `${dadosReceita.logradouro}, ${dadosReceita.numero || "s/n"}${dadosReceita.complemento ? ` - ${dadosReceita.complemento}` : ""}`
        : "");

    const bairroFinal = data.bairro?.trim() || placeData?.bairro || dadosReceita?.bairro || "";
    const cepFinal =
      data.cep?.trim() ||
      placeData?.cep ||
      (dadosReceita?.cep ? cleanDigits(dadosReceita.cep) : "");
    const emailFinal =
      data.email?.trim() ||
      siteInfo.email ||
      dadosReceita?.email?.toLowerCase().trim() ||
      "";
    const siteFinal = data.site?.trim() || placeData?.website || "";
    const instagramFinal = data.instagram?.trim() || siteInfo.instagram || "";
    const cnpjFinal = cnpjAlvo ? formatarCNPJ(cnpjAlvo) : (data.cnpj || "");
    const razaoSocialFinal =
      data.razaoSocial?.trim() ||
      dadosReceita?.razaoSocial ||
      dadosReceita?.nomeFantasia ||
      "";

    // 6. SUGESTÕES DO GOOGLE AUTOCOMPLETE
    const sugestoesGoogle = Array.from(new Set(sugestoesResult.flat())).filter(Boolean);
    if (sugestoesGoogle.length > 0) fontesUtilizadas.push("Google Autocomplete");

    // 7. SÍNTESE INTELIGENTE VIA LLM (Universal Router / Lovable / OpenRouter / Gemini)
    try {
      const { chatJSON } = await import("./ai-gateway.server");
      const sys = `Você é um Diretor Executivo de Inteligência de Mercado e Estrategista Comercial da LOCOMOTIVA COMUNICAÇÃO (agência 360 & Tecnologia de Caxias do Sul e Serra Gaúcha/RS).
Sua missão é gerar dados cadastrais ricos, técnicos e 100% alinhados à realidade do negócio para alimentar o CRM, relatórios de auditoria e roteiros de abordagem no WhatsApp.
Seja direto, profissional, regionalmente preciso para o RS e altamente persuasivo. Nada de respostas genéricas.`;

      const user = `Analise os dados reais coletados desta empresa e produza as informações cadastrais e estratégicas completas:

Empresa: ${nome}
Cidade: ${cid} / RS
Segmento informado: ${segInicial || "Não especificado"}
CNAE Receita Federal: ${dadosReceita?.cnaeDescricao || "Não informado"}
Categoria Google Maps: ${placeData?.category || "Não informada"}
Razão Social: ${razaoSocialFinal || "Não informada"}
CNPJ: ${cnpjFinal || "Não localizado"}
Endereço: ${enderecoMontado || "Região central de " + cid}
Telefone Fixo detectado: ${telefonesClassificados.fixo || "Nenhum"}
WhatsApp detectado: ${telefonesClassificados.whatsapp || "Nenhum"}
Site: ${siteFinal || "Não possui"}
Instagram: ${instagramFinal || "Não possui"}
Sugestões do Google na região: ${sugestoesGoogle.slice(0, 8).join(", ") || "Nenhuma"}
${data.areaAtuacaoAtual ? `Área de atuação já registrada: ${data.areaAtuacaoAtual}` : ""}
${data.publicoAlvoAtual ? `Público-alvo já registrado: ${data.publicoAlvoAtual}` : ""}
${data.observacoes ? `Observações internas: ${data.observacoes}` : ""}

Retorne EXATAMENTE este JSON:
{
  "segmentoRefinado": "O segmento comercial profissional e padronizado (ex: 'Móveis Planejados & Decoração', 'Vinícola & Enoturismo', 'Restaurante & Gastronomia', 'Hotel & Pousada', 'Clínica & Saúde', 'Indústria Metalmecânica', 'Comércio Varejista', 'Construção & Engenharia', 'Agronegócio', 'Educação & Cursos', 'Tecnologia & Software', etc.)",
  "areaAtuacao": "Descrição clara e precisa de 1 a 2 frases do QUE A EMPRESA FAZ, especialidades e produtos/serviços oferecidos na região. Isso alimentará a saudação das abordagens comerciais da Locomotiva Comunicação (ex: 'Acompanhamos o mercado de [Área de Atuação] da região...').",
  "publicoAlvo": "Descrição detalhada de 2 a 3 frases identificando quem são os compradores e clientes desta empresa na cidade e região (perfil sócio-econômico, B2B ou B2C, hábitos de busca e critérios de decisão).",
  "buscasPartida": "De 5 a 7 termos de busca reais que clientes locais digitam no Google para contratar ou comprar dessa empresa (uma por linha, ex: 'móveis planejados em bento gonçalves').",
  "termosEncontrados": "De 8 a 12 palavras-chave de alto valor de conversão e intenção de compra associadas a esta empresa e nicho (uma por linha).",
  "buscaGoogleMaps": "A consulta ideal e exata para avaliar a posição da empresa no Google Maps e comparar com concorrentes locais (ex: '${nome} ${segInicial || "serviços"} em ${cid} RS').",
  "resumoEstrategico": "2 frases com a síntese do potencial de captação comercial desta empresa."
}`;

      const res = await chatJSON<{
        segmentoRefinado: string;
        areaAtuacao: string;
        publicoAlvo: string;
        buscasPartida: string;
        termosEncontrados: string;
        buscaGoogleMaps: string;
        resumoEstrategico: string;
      }>([
        { role: "system", content: sys },
        { role: "user", content: user },
      ]);

      if (res && res.areaAtuacao && res.buscasPartida) {
        fontesUtilizadas.push("Inteligência Artificial (LLM)");
        return {
          nome: placeData?.title || nome,
          razaoSocial: razaoSocialFinal || undefined,
          cnpj: cnpjFinal || undefined,
          segmentoRefinado: res.segmentoRefinado || segInicial || "Serviços Corporativos",
          areaAtuacao: res.areaAtuacao,
          publicoAlvo: res.publicoAlvo || gerarPublicoAlvoFallback(res.segmentoRefinado, cid, res.areaAtuacao),
          cidade: placeData?.cidade || cid,
          bairro: bairroFinal || undefined,
          endereco: enderecoMontado || undefined,
          cep: cepFinal || undefined,
          telefone: telefonesClassificados.fixo,
          whatsapp: telefonesClassificados.whatsapp,
          email: emailFinal || undefined,
          site: siteFinal || undefined,
          instagram: instagramFinal || undefined,
          buscasPartida: res.buscasPartida,
          termosEncontrados: res.termosEncontrados,
          buscaGoogleMaps: res.buscaGoogleMaps || `${nome} ${res.segmentoRefinado} em ${cid} RS`,
          googleMapsUri: placeData?.googleMapsUri,
          rating: placeData?.rating,
          totalRatings: placeData?.reviews,
          resumoEstrategico: res.resumoEstrategico,
          modo: "ia",
          fontes: fontesUtilizadas,
          dadosReceita,
        };
      }
    } catch (err: any) {
      console.warn("[cadastro-ia] Falha ao processar via LLM, acionando gerador determinístico inteligente:", err.message);
    }

    // 8. FALLBACK DETERMINÍSTICO DE CONTINGÊNCIA (caso LLM indisponível)
    fontesUtilizadas.push("Gerador Inteligente Deterministico");
    const segFinal =
      dadosReceita?.cnaeDescricao ||
      placeData?.category ||
      segInicial ||
      "Comércio & Serviços";

    let areaAtuacao = data.areaAtuacaoAtual?.trim() || "";
    if (!areaAtuacao) {
      if (dadosReceita?.cnaeDescricao) {
        areaAtuacao = `Atuação especializada em ${dadosReceita.cnaeDescricao.toLowerCase()} para clientes de ${cid} e região.`;
      } else {
        areaAtuacao = `Prestação de serviços e fornecimento de produtos especializados no segmento de ${segFinal} para ${cid} e região.`;
      }
    }

    const buscasPartida = [
      `${segFinal} em ${cid}`,
      `melhor ${segFinal} ${cid}`,
      `${nome} ${cid}`,
      `${segFinal} perto de mim`,
      `onde comprar ${segFinal} ${cid}`,
      `orçamento ${segFinal} ${cid}`,
    ].join("\n");

    const termosSet = new Set<string>();
    for (const s of sugestoesGoogle) termosSet.add(s);
    if (termosSet.size < 6) {
      termosSet.add(`${segFinal} ${cid}`);
      termosSet.add(`${segFinal} em ${cid} rs`);
      termosSet.add(`${segFinal} ${cid} telefone`);
      termosSet.add(`${nome} ${cid}`);
      termosSet.add(`${nome} instagram`);
      termosSet.add(`preço ${segFinal} ${cid}`);
    }
    const termosEncontrados = Array.from(termosSet).slice(0, 10).join("\n");

    return {
      nome: placeData?.title || nome,
      razaoSocial: razaoSocialFinal || undefined,
      cnpj: cnpjFinal || undefined,
      segmentoRefinado: segFinal,
      areaAtuacao,
      publicoAlvo: data.publicoAlvoAtual?.trim() || gerarPublicoAlvoFallback(segFinal, cid, areaAtuacao),
      cidade: placeData?.cidade || cid,
      bairro: bairroFinal || undefined,
      endereco: enderecoMontado || undefined,
      cep: cepFinal || undefined,
      telefone: telefonesClassificados.fixo,
      whatsapp: telefonesClassificados.whatsapp,
      email: emailFinal || undefined,
      site: siteFinal || undefined,
      instagram: instagramFinal || undefined,
      buscasPartida,
      termosEncontrados,
      buscaGoogleMaps: `${nome} ${segFinal} em ${cid} RS`,
      googleMapsUri: placeData?.googleMapsUri,
      rating: placeData?.rating,
      totalRatings: placeData?.reviews,
      resumoEstrategico: `Empresa com alta relevância em ${cid}/RS e grande oportunidade de ampliação de captação digital no segmento de ${segFinal}.`,
      modo: "autocomplete_deterministico",
      fontes: fontesUtilizadas,
      dadosReceita,
    };
  });

export const sugerirPublicoAlvoIA_ServerFn = createServerFn({ method: "POST" })
  .validator(
    (data: {
      nome: string;
      segmento: string;
      areaAtuacao?: string;
      cidade: string;
      observacoes?: string;
    }) => data,
  )
  .handler(async ({ data }): Promise<{ publicoAlvo: string; modo: "ia" | "deterministico" }> => {
    const seg = data.segmento?.trim() || "Empresa";
    const cid = data.cidade.trim();
    try {
      const { chatJSON } = await import("./ai-gateway.server");
      const sys =
        "Você é um Estrategista de Marketing e Comportamento do Consumidor da LOCOMOTIVA COMUNICAÇÃO. Identifique com precisão o perfil e comportamento dos clientes que costumam buscar este tipo de empresa.";
      const user = `Identifique o perfil do público-alvo dos clientes que costumam buscar os serviços da empresa abaixo:
Empresa: ${data.nome}
Segmento: ${seg}
Área de Atuação: ${data.areaAtuacao || seg}
Cidade: ${cid} / RS
${data.observacoes ? `Observações Adicionais: ${data.observacoes}\n` : ""}
Retorne EXATAMENTE este JSON:
{
  "publicoAlvo": "Descrição clara e persuasiva de 2 a 3 frases identificando quem são os compradores e contratantes deste serviço na cidade e região, seu perfil sócio-econômico, hábitos de busca e critérios decisivos para fechar negócio."
}`;
      const res = await chatJSON<{ publicoAlvo: string }>([
        { role: "system", content: sys },
        { role: "user", content: user },
      ]);
      if (res && res.publicoAlvo && res.publicoAlvo.length > 20) {
        return { publicoAlvo: res.publicoAlvo, modo: "ia" };
      }
    } catch (err: any) {
      console.warn("Falha ao sugerir público-alvo via IA, usando fallback heurístico:", err.message);
    }
    return {
      publicoAlvo: gerarPublicoAlvoFallback(seg, cid, data.areaAtuacao),
      modo: "deterministico",
    };
  });
