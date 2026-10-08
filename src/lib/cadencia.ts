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
  nomeAgencia = "nossa agência",
  linkAuditoria?: string,
): CadenciaProspectResult {
  const auditUrl = linkAuditoria || `https://locomotivacrm.com.br/auditoria/${empresa.id}`;
  const contato = nomeDecisor || "tudo bem?";

  const passos: PassoCadencia[] = [
    {
      dia: 0,
      rotuloDia: "D+0 (Dia 1)",
      canal: "whatsapp",
      titulo: "1. Abertura: Dor Imediata & Alívio Rápido",
      objetivo: "Abrir a conversa apontando um ponto cego sem parecer vendedor chato.",
      gatilhoPsicologico: "Curiosidade + Dor Imediata",
      dicaExecucao: "Envie em horário comercial (entre 09:30 e 11:30 ou 14:30 e 17:00).",
      mensagem: `Olá, ${contato}! Tudo bem?\n\nMe chamo [Seu Nome] e acompanho o setor de ${empresa.segmento} em ${empresa.cidade}.\n\nEstive analisando a presença da ${empresa.nome} e notei um gargalo que pode estar custando clientes prontos para fechar todos os dias por falta de um canal de conversão mais rápido.\n\nPreparamos uma análise de 2 minutos sobre isso. Posso compartilhar com você por aqui?\n\nUm abraço,\n${nomeAgencia}`,
    },
    {
      dia: 2,
      rotuloDia: "D+2 (48h após)",
      canal: "email",
      titulo: "2. Diagnóstico Visual & Custo da Inação",
      objetivo: "Apresentar a micro-auditoria interativa e o impacto financeiro de não mudar.",
      assuntoEmail: `Micro-Auditoria & Oportunidade de Lucro — ${empresa.nome} (${empresa.cidade})`,
      gatilhoPsicologico: "Autoridade + Custo da Inação + Prova Visual",
      dicaExecucao: "Envie por e-mail com link clicável da micro-auditoria.",
      mensagem: `Olá, ${contato},\n\nConforme mencionei no WhatsApp, nossa equipe estruturou uma Micro-Auditoria Visual exclusiva para a ${empresa.nome}.\n\nNela, mapeamos:\n1. Os principais gargalos na apresentação e captação digital atual;\n2. Estimativa de quanto a empresa deixa de faturar mensalmente;\n3. Como tratar esses sintomas com Comunicação 360 e Sistemas de Gestão.\n\n👉 Você pode visualizar o relatório completo e interativo neste link:\n${auditUrl}\n\nFico à disposição para uma conversa de 15 minutos caso queira entender como aplicar na prática.\n\nAtenciosamente,\n${nomeAgencia}`,
    },
    {
      dia: 5,
      rotuloDia: "D+5 (5 dias após)",
      canal: "whatsapp",
      titulo: "3. Solução em Ação: Sistemas & Lucratividade",
      objetivo: "Quebrar a objeção de falta de tempo apresentando a solução 'chave na mão' com sistemas.",
      gatilhoPsicologico: "Facilidade de Implementação + Ambição de Lucro",
      dicaExecucao: "Mantenha o tom leve e mostre que a agência cuida de 100% da parte técnica.",
      mensagem: `Oi, ${contato}! Passando rapidinho para compartilhar um ponto interessante:\n\nMuitas empresas de ${empresa.segmento} acham que modernizar a comunicação e implantar um CRM de vendas dá trabalho para a equipe. Na verdade, nosso modelo é 100% chave na mão — nós cuidamos de toda a parte técnica para você só receber os orçamentos prontos.\n\nConseguiu dar uma olhada na auditoria que te enviei no link (${auditUrl})?\n\nSe fizer sentido, podemos marcar um café ou call rápida de 10 minutos esta semana.`,
    },
    {
      dia: 8,
      rotuloDia: "D+8 (Última tentativa)",
      canal: "whatsapp",
      titulo: "4. Break-up Consultivo: Saída Elegante",
      objetivo: "Gerar urgência por escassez e liberar o lead sem atrito caso não haja momento.",
      gatilhoPsicologico: "Medo de Perda (FOMO) + Desapego Profissional",
      dicaExecucao: "O desapego gera alta taxa de resposta de clientes que estavam ocupados.",
      mensagem: `Olá, ${contato}! Como não tivemos retorno, imagino que o momento esteja muito corrido por aí ou que essa não seja a prioridade da ${empresa.nome} agora, e está tudo bem.\n\nVou encerrar meus contatos por aqui para não incomodar, mas deixo o link da sua auditoria (${auditUrl}) disponível caso queiram retomar no futuro.\n\nDesejo muito sucesso e crescimento para a ${empresa.nome} em ${empresa.cidade}!\n\nUm abraço,\n${nomeAgencia}`,
    },
  ];

  return {
    empresaId: empresa.id,
    empresaNome: empresa.nome,
    nomeDecisor,
    passos,
  };
}
