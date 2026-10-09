import { createServerFn } from "@tanstack/react-start";
import type { EmpresaCtx } from "./ai.functions";

export interface OpcaoRespostaObjecao {
  id: string;
  angulo: string;
  titulo: string;
  gatilho: string;
  texto: string;
  proximoPasso: string;
}

export interface CopilotoObjecaoResult {
  objecaoOriginal: string;
  empresaNome: string;
  analiseIA: string;
  opcoes: OpcaoRespostaObjecao[];
}

export const OBTACOES_COMUNS = [
  {
    id: "esta_caro",
    label: "💸 'Está caro' / 'Não temos verba'",
    exemplo: "Achei o valor elevado para o momento da nossa empresa.",
  },
  {
    id: "ja_tenho_agencia",
    label: "🤝 'Já temos quem faça' / 'Já temos agência'",
    exemplo: "Já temos uma agência / pessoa que cuida do nosso marketing.",
  },
  {
    id: "manda_por_email",
    label: "📧 'Me manda uma proposta por e-mail'",
    exemplo: "Pode me enviar a apresentação e valores por e-mail que eu analiso?",
  },
  {
    id: "sem_tempo",
    label: "⏳ 'Não temos tempo / equipe para implantar'",
    exemplo: "Nossa rotina está muito corrida agora, não consigo parar para ver isso.",
  },
  {
    id: "cortando_custos",
    label: "📉 'Estamos em contenção de despesas'",
    exemplo: "Estamos segurando investimentos e cortando custos este semestre.",
  },
] as const;

export const gerarRespostasObjecao_IA = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      empresa: EmpresaCtx;
      objecao: string;
      canal?: "whatsapp" | "email" | "ligacao";
      nomeAgencia?: string;
    }) => data,
  )
  .handler(async ({ data }): Promise<CopilotoObjecaoResult> => {
    const { chatJSON } = await import("./ai-gateway.server");
    const agencia = data.nomeAgencia?.trim() || "Locomotiva Comunicação";
    const canal = data.canal || "whatsapp";

    const sys = `Você é um mestre em negociação consultiva e fechamento de vendas B2B da LOCOMOTIVA COMUNICAÇÃO (agência de Comunicação 360 e Sistemas de Gestão).
Sua missão é contornar a objeção do cliente com firmeza, clareza técnica e pragmatismo, reenquadrando o serviço como um INVESTIMENTO DE RETORNO LÓGICO (e não um custo supérfluo).
DIRETRIZ CRÍTICA DE TOM:
- Não seja bajulador nem insistente chato.
- Seja seguro, analítico e mostre o cálculo financeiro do custo da inação.`;

    const user = `O cliente da empresa "${data.empresa.nome}" (${data.empresa.segmento} em ${data.empresa.cidade}/RS) respondeu com a seguinte objeção:
"""
${data.objecao}
"""

Gere 3 opções de respostas estratégicas para o canal "${canal}", usando ângulos diferentes:
1. Ângulo ROI & Custo da Inação (mostra que não fazer nada custa muito mais caro em perda de clientes)
2. Ângulo Diferenciação 360 & Execução Chave na Mão (mostra que a Locomotiva Comunicação cuida de tudo sem tomar tempo)
3. Ângulo Descompromissado & Demonstração Leve (convite para ver dados sem pressão)

Retorne JSON EXATO:
{
  "objecaoOriginal": "${data.objecao}",
  "empresaNome": "${data.empresa.nome}",
  "analiseIA": "1-2 frases analisando o verdadeiro motivo por trás dessa objeção",
  "opcoes": [
    {
      "id": "opcao_roi",
      "angulo": "Reenquadramento de ROI & Lucro",
      "titulo": "Foco no Retorno Financeiro Imediato",
      "gatilho": "Custo da Inação vs. Lucro Gerado",
      "texto": "Texto completo e pronto para enviar no ${canal}",
      "proximoPasso": "Convidar para simulação rápida de faturamento"
    },
    {
      "id": "opcao_360",
      "angulo": "Diferenciação 360 & Solução Chave na Mão",
      "titulo": "Foco em Execução Sem Trabalho para a Equipe",
      "gatilho": "Alívio Operacional",
      "texto": "Texto completo e pronto para enviar no ${canal}",
      "proximoPasso": "Demonstrar que a Locomotiva Comunicação assume o peso técnico"
    },
    {
      "id": "opcao_desapego",
      "angulo": "Apresentação Leve Sem Compromisso",
      "titulo": "Conversa Rápida de 10 Minutos",
      "gatilho": "Baixa Fricção",
      "texto": "Texto completo e pronto para enviar no ${canal}",
      "proximoPasso": "Troca de ideias rápida de 10 minutos"
    }
  ]
}`;

    try {
      return await chatJSON<CopilotoObjecaoResult>([
        { role: "system", content: sys },
        { role: "user", content: user },
      ]);
    } catch (err) {
      console.warn("Fallback do Copiloto de Objeções:", err);
      return gerarFallbackObjecoes(data.empresa, data.objecao, agencia);
    }
  });

function gerarFallbackObjecoes(empresa: EmpresaCtx, objecao: string, agencia: string): CopilotoObjecaoResult {
  const nome = empresa.nome;
  const contato = "[Nome do contato]";

  return {
    objecaoOriginal: objecao,
    empresaNome: nome,
    analiseIA: "O cliente está comparando o valor com um custo pontual em vez de enxergar o retorno financeiro em novos clientes e economia operacional.",
    opcoes: [
      {
        id: "opcao_roi",
        angulo: "Reenquadramento de ROI & Lucro",
        titulo: "Foco no Retorno Financeiro Imediato",
        gatilho: "Custo da Inação",
        texto: `Entendo perfeitamente, ${contato}! Nosso foco na ${agencia} não é ser um custo a mais, e sim uma ferramenta que se paga já nas primeiras semanas estancando os orçamentos que a ${nome} perde hoje.\n\nSe colocarmos 3 novos clientes no seu caixa por mês, o projeto já se torna 100% lucrativo.\n\nTopa uma conversa de 10 minutos só para avaliarmos essa conta na prática?`,
        proximoPasso: "Agendar call de 10 minutos para mostrar a matemática do ROI",
      },
      {
        id: "opcao_360",
        angulo: "Diferenciação 360 & Solução Chave na Mão",
        titulo: "Execução 100% Gerenciada",
        gatilho: "Zero Sobrecarga",
        texto: `Compreendo, ${contato}! Um dos maiores diferenciais da ${agencia} é que entregamos a solução 360 completa e 'chave na mão': nós cuidamos do design, tecnologia e automações para que você e sua equipe não percam nenhum minuto com reuniões técnicas.\n\nPodemos fazer um alinhamento rápido para você conhecer como funciona nosso modelo guiado?`,
        proximoPasso: "Apresentar a facilidade de onboarding",
      },
      {
        id: "opcao_desapego",
        angulo: "Apresentação Leve Sem Compromisso",
        titulo: "Demonstração de 10 Minutos",
        gatilho: "Sem Compromisso",
        texto: `Sem problemas, ${contato}! O objetivo não é te vender nada agora, apenas compartilhar o diagnóstico que preparamos para a ${nome} para você ter em mãos quando for o momento ideal.\n\nVocê teria 10 minutos nesta quinta-feira só para passar o olho nas oportunidades que mapeamos?`,
        proximoPasso: "Agendar demonstração curta",
      },
    ],
  };
}
