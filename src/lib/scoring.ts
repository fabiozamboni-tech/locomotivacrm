import type { Empresa } from "./mock-data";

export interface ScoreWeights {
  semSite: number;
  siteDesatualizado: number;
  semSSL: number;
  naoResponsivo: number;
  semCTA: number;
  contatoDificil: number;
  instagramParado: number;
  bioFraca: number;
  identidadeInconsistente: number;
  atendimentoFraco: number;
  semProvaSocial: number;
  presencaGoogleFraca: number;
}

export const DEFAULT_WEIGHTS: ScoreWeights = {
  semSite: 25,
  siteDesatualizado: 12,
  semSSL: 6,
  naoResponsivo: 10,
  semCTA: 5,
  contatoDificil: 6,
  instagramParado: 12,
  bioFraca: 4,
  identidadeInconsistente: 6,
  atendimentoFraco: 6,
  semProvaSocial: 4,
  presencaGoogleFraca: 4,
};

export interface ScoreDetail {
  criterio: string;
  peso: number;
  aplicado: boolean;
  explicacao: string;
}

export function calcularScore(
  empresa: Empresa,
  weights: ScoreWeights = DEFAULT_WEIGHTS,
): { score: number; detalhes: ScoreDetail[] } {
  const d = empresa.diagnostico;
  const detalhes: ScoreDetail[] = [
    {
      criterio: "Não possui site",
      peso: weights.semSite,
      aplicado: empresa.statusSite === "sem_site",
      explicacao:
        "Empresa sem presença web própria — oportunidade direta para criação de site.",
    },
    {
      criterio: "Site com aparência antiga / desatualizado",
      peso: weights.siteDesatualizado,
      aplicado: empresa.statusSite === "desatualizado",
      explicacao:
        "Sinais visuais e estruturais indicam site que não recebe atualização há tempo.",
    },
    {
      criterio: "Sem SSL / com erros",
      peso: weights.semSSL,
      aplicado: empresa.statusSite === "sem_ssl",
      explicacao:
        "Ausência de HTTPS gera aviso no navegador e reduz confiança do visitante.",
    },
    {
      criterio: "Não responsivo (mobile)",
      peso: weights.naoResponsivo,
      aplicado: empresa.statusSite === "nao_responsivo" || !d.site.responsivo,
      explicacao:
        "Layout quebra em dispositivos móveis — perde a maioria dos acessos atuais.",
    },
    {
      criterio: "Ausência de CTA claro",
      peso: weights.semCTA,
      aplicado: !d.site.cta && empresa.statusSite !== "sem_site",
      explicacao: "Site não conduz o visitante a uma ação (contato, orçamento, reserva).",
    },
    {
      criterio: "Contato difícil de encontrar",
      peso: weights.contatoDificil,
      aplicado: !d.atendimento.contatoFacil || !d.atendimento.multiplosCanais,
      explicacao:
        "Poucos canais visíveis, sem WhatsApp/telefone direto — atrito na captação.",
    },
    {
      criterio: "Instagram sem postagem há +90 dias",
      peso: weights.instagramParado,
      aplicado:
        d.instagram.diasDesdeUltimoPost === null ||
        (d.instagram.diasDesdeUltimoPost ?? 0) > 90,
      explicacao:
        "Perfil parado transmite sensação de negócio inativo para novos clientes.",
    },
    {
      criterio: "Bio fraca / posicionamento pouco claro",
      peso: weights.bioFraca,
      aplicado: !d.instagram.bioForte,
      explicacao: "Bio não comunica proposta de valor nem direciona para conversão.",
    },
    {
      criterio: "Identidade visual inconsistente",
      peso: weights.identidadeInconsistente,
      aplicado: d.instagram.consistenciaMarca < 6,
      explicacao:
        "Feed sem paleta, tipografia ou padrão visual reconhecível — marca fragilizada.",
    },
    {
      criterio: "Comunicação e atendimento fracos",
      peso: weights.atendimentoFraco,
      aplicado: !d.atendimento.respostaRapida || !d.atendimento.clarezaServicos,
      explicacao:
        "Faltam respostas rápidas, clareza sobre serviços e caminhos de conversão.",
    },
    {
      criterio: "Ausência de prova social",
      peso: weights.semProvaSocial,
      aplicado: !d.atendimento.provaSocial,
      explicacao: "Sem depoimentos, portfólio ou avaliações visíveis para novos clientes.",
    },
    {
      criterio: "Presença no Google fraca ou inconsistente",
      peso: weights.presencaGoogleFraca,
      aplicado: !d.site.presencaGoogle,
      explicacao:
        "Ficha do Google Meu Negócio ausente ou incompleta reduz descoberta local.",
    },
  ];

  const total = detalhes.reduce((sum, d) => sum + (d.aplicado ? d.peso : 0), 0);
  const maxTotal = Object.values(weights).reduce((a, b) => a + b, 0);
  const score = Math.round((total / maxTotal) * 100);
  return { score: Math.min(100, score), detalhes };
}

export function classificarScore(score: number): {
  nivel: "quente" | "morno" | "frio" | "descartar";
  label: string;
  cor: string;
} {
  if (score >= 70)
    return { nivel: "quente", label: "Alta oportunidade", cor: "text-rose-500" };
  if (score >= 45)
    return { nivel: "morno", label: "Oportunidade moderada", cor: "text-amber-500" };
  if (score >= 20)
    return { nivel: "frio", label: "Baixa oportunidade", cor: "text-sky-500" };
  return { nivel: "descartar", label: "Sem gap evidente", cor: "text-emerald-500" };
}
