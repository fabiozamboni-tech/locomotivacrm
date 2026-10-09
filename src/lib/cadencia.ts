import type { Empresa } from "./mock-data";

export interface PassoCadencia {
  dia: number; // 0, 2, 5, 8
  rotuloDia: string; // "D+0", "D+2", "D+5", "D+8"
  canal: "whatsapp" | "email" | "instagram" | "ligacao";
  titulo: string;
  objetivo: string;
  assuntoEmail?: string;
  mensagem: string;
  gatilhoPsicologico: string;
  dicaExecucao: string;
}

export interface CadenciaProspectResult {
  empresaId: string;
  empresaNome: string;
  nomeDecisor: string;
  cargoDecisor?: string;
  passos: PassoCadencia[];
}

export function gerarCadenciaCompleta(
  empresa: { id: string; nome: string; cidade: string; segmento: string; whatsapp?: string; site?: string },
  nomeDecisor = "Gestor(a)",
  nomeAgencia = "Locomotiva Comunicação",
  linkAuditoria?: string,
): CadenciaProspectResult {
  const auditUrl = linkAuditoria || `https://locomotivacrm.com.br/auditoria/${empresa.id}`;
  const contato = nomeDecisor || "tudo bem?";

  const passos: PassoCadencia[] = [
    {
      dia: 0,
      rotuloDia: "D+0 (Dia 1)",
      canal: "whatsapp",
      titulo: "1. Abertura Consultiva: Ponto de Atenção Direto",
      objetivo: "Abrir a conversa apontando um gargalo real sem bajulação ou insistência.",
      gatilhoPsicologico: "Curiosidade Técnica + Dor Imediata",
      dicaExecucao: "Envie em horário comercial (entre 09:30 e 11:30 ou 14:30 e 17:00).",
      mensagem: `Olá, ${contato}! Tudo bem?\n\nMe chamo [Seu Nome], da ${nomeAgencia}.\n\nAcompanhamos o mercado de ${empresa.segmento} em ${empresa.cidade} e mapeamos gargalos nos canais da ${empresa.nome} que estão fazendo orçamentos irem para concorrentes da região.\n\nPreparamos uma análise de 2 minutos sobre como estancar essas perdas. Posso te enviar o link por aqui?\n\nUm abraço,\n${nomeAgencia}`,
    },
    {
      dia: 2,
      rotuloDia: "D+2 (48h após)",
      canal: "email",
      titulo: "2. Diagnóstico Visual & Custo da Inação",
      objetivo: "Apresentar a micro-auditoria interativa e o impacto financeiro de adiar a modernização.",
      assuntoEmail: `Micro-Auditoria & Oportunidade de Lucro — ${empresa.nome} (${empresa.cidade})`,
      gatilhoPsicologico: "Autoridade Técnica + Custo da Inação + Prova Visual",
      dicaExecucao: "Envie por e-mail com link clicável da micro-auditoria.",
      mensagem: `Olá, ${contato},\n\nConforme conversamos, a equipe da ${nomeAgencia} estruturou uma Micro-Auditoria Visual focada na ${empresa.nome}.\n\nNela, mapeamos:\n1. Os pontos críticos que travam a captação de clientes hoje;\n2. Estimativa de receita que a empresa deixa de faturar mensalmente;\n3. Plano prático de Comunicação 360 e Sistemas para estancar esse vazamento.\n\n👉 Você pode visualizar o relatório completo e interativo neste link:\n${auditUrl}\n\nFicamos à disposição para uma conversa rápida de 10 minutos caso queira entender a aplicação prática.\n\nAtenciosamente,\n${nomeAgencia}\nlocomotivacomunicacao.com.br`,
    },
    {
      dia: 5,
      rotuloDia: "D+5 (5 dias após)",
      canal: "whatsapp",
      titulo: "3. Solução em Ação: Sistemas & Automação Chave na Mão",
      objetivo: "Demonstrar facilidade de implementação sem trabalho técnico para a equipe.",
      gatilhoPsicologico: "Zero Sobrecarga + Ambição de Lucro",
      dicaExecucao: "Mantenha o tom profissional e mostre que a agência assume o peso operacional.",
      mensagem: `Oi, ${contato}! Passando para compartilhar um dado importante:\n\nMuitas empresas de ${empresa.segmento} acham que modernizar o marketing e implantar um CRM de vendas dá trabalho para a equipe. Na ${nomeAgencia}, nosso modelo é 100% chave na mão — nós cuidamos de toda a tecnologia e design para que você só receba os orçamentos prontos.\n\nConseguiu dar uma olhada no diagnóstico que te enviei (${auditUrl})?\n\nSe fizer sentido, podemos marcar uma conversa de 10 minutos esta semana.`,
    },
    {
      dia: 8,
      rotuloDia: "D+8 (Última tentativa)",
      canal: "whatsapp",
      titulo: "4. Break-up Consultivo: Saída Elegante",
      objetivo: "Liberar o lead sem atrito mantendo a porta aberta.",
      gatilhoPsicologico: "Desapego Profissional + Escassez",
      dicaExecucao: "O desapego gera alta taxa de resposta de decisores ocupados.",
      mensagem: `Olá, ${contato}! Como não tivemos retorno, imagino que o momento esteja corrido por aí ou que essa não seja a prioridade da ${empresa.nome} agora, e está tudo bem.\n\nVou encerrar meus contatos por aqui para não tomar seu tempo, mas deixo o link da sua auditoria (${auditUrl}) disponível caso decidam retomar no futuro.\n\nSucesso nos negócios da ${empresa.nome} em ${empresa.cidade}!\n\nAtenciosamente,\n${nomeAgencia}`,
    },
  ];

  return {
    empresaId: empresa.id,
    empresaNome: empresa.nome,
    nomeDecisor,
    passos,
  };
}
