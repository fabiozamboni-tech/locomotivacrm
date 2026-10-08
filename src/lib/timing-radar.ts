import type { Empresa } from "./mock-data";

export interface SinalCompraAlerta {
  id: string;
  empresaId: string;
  empresaNome: string;
  segmento: string;
  cidade: string;
  tipoGatilho: "dominio_expirando" | "instagram_parado" | "site_sem_ssl" | "sem_site" | "atendimento_lento" | "score_critico";
  titulo: string;
  descricao: string;
  acaoRecomendada: string;
  urgencia: "critica" | "alta" | "media";
  icone: string;
}

export function detectarSinaisDeCompra(empresas: Empresa[]): SinalCompraAlerta[] {
  const alertas: SinalCompraAlerta[] = [];

  for (const e of empresas) {
    // 1. Sem Site
    if (e.statusSite === "sem_site") {
      alertas.push({
        id: `alerta-sem-site-${e.id}`,
        empresaId: e.id,
        empresaNome: e.nome,
        segmento: e.segmento,
        cidade: e.cidade,
        tipoGatilho: "sem_site",
        titulo: "🚨 Ausência Total de Canal Web",
        descricao: `${e.nome} não possui site institucional e está perdendo buscas orgânicas locais em ${e.cidade}.`,
        acaoRecomendada: "Oferecer criação de Site de Alta Conversão + Identidade 360.",
        urgencia: "critica",
        icone: "Globe",
      });
    }

    // 2. Site Sem SSL (Aviso de Não Seguro)
    if (e.statusSite === "sem_ssl" || (!e.diagnostico.site.ssl && e.site)) {
      alertas.push({
        id: `alerta-ssl-${e.id}`,
        empresaId: e.id,
        empresaNome: e.nome,
        segmento: e.segmento,
        cidade: e.cidade,
        tipoGatilho: "site_sem_ssl",
        titulo: "⚠️ Site Inseguro (Sem Certificado SSL)",
        descricao: `Navegadores exibem aviso de site perigoso/não seguro, afugentando clientes imediatamente.`,
        acaoRecomendada: "Abordagem com gancho de segurança, autoridade e reconstrução segura.",
        urgencia: "alta",
        icone: "ShieldAlert",
      });
    }

    // 3. Instagram Abandonado (> 45 dias sem post)
    const diasSemPost = e.diagnostico.instagram.diasDesdeUltimoPost;
    if (diasSemPost !== null && diasSemPost > 45) {
      alertas.push({
        id: `alerta-ig-${e.id}`,
        empresaId: e.id,
        empresaNome: e.nome,
        segmento: e.segmento,
        cidade: e.cidade,
        tipoGatilho: "instagram_parado",
        titulo: `📱 Instagram Parado há ~${diasSemPost} dias`,
        descricao: `Perfil transmite sensação de negócio inativo ou fechado para novos visitantes.`,
        acaoRecomendada: "Oferecer retomada com calendário editorial, vídeos comerciais e gestão 360.",
        urgencia: "alta",
        icone: "Instagram",
      });
    }

    // 4. Atendimento Lento / Falta de Canais Ágeis
    if (!e.diagnostico.atendimento.contatoFacil || !e.diagnostico.atendimento.respostaRapida) {
      alertas.push({
        id: `alerta-atendimento-${e.id}`,
        empresaId: e.id,
        empresaNome: e.nome,
        segmento: e.segmento,
        cidade: e.cidade,
        tipoGatilho: "atendimento_lento",
        titulo: "⚡ Gargalo Crítico no Atendimento & WhatsApp",
        descricao: `Demora para responder orçamentos faz clientes comprarem do concorrente em minutos.`,
        acaoRecomendada: "Venda de Automação de WhatsApp + CRM Comercial.",
        urgencia: "alta",
        icone: "MessageSquare",
      });
    }

    // 5. Score Digital Crítico (< 45/100)
    if (e.score < 45) {
      alertas.push({
        id: `alerta-score-${e.id}`,
        empresaId: e.id,
        empresaNome: e.nome,
        segmento: e.segmento,
        cidade: e.cidade,
        tipoGatilho: "score_critico",
        titulo: `📉 Score Digital Crítico (${e.score}/100)`,
        descricao: `Vulnerabilidade alta frente à concorrência regional de ${e.cidade}.`,
        acaoRecomendada: "Apresentar plano de reformulação completa de Comunicação 360.",
        urgencia: "critica",
        icone: "Flame",
      });
    }
  }

  return alertas.sort((a, b) => {
    const p = { critica: 3, alta: 2, media: 1 };
    return p[b.urgencia] - p[a.urgencia];
  });
}
