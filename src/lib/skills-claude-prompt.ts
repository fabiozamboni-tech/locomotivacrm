/**
 * Diretrizes Oficiais de Engenharia de Design extraídas do repositório
 * da Anthropic (https://github.com/anthropics/skills/tree/main/skills/frontend-design)
 *
 * Aplicadas universalmente no Estúdio de Criação para evitar vícios estéticos de IA
 * e gerar interfaces autênticas, com grounding no nicho real, tipografia rigorosa
 * e animações coordenadas.
 */

export const PROMPT_BLOCO_SKILLS_CLAUDE = `
[DIRETRIZES OFICIAIS DE ENGENHARIA DE DESIGN DA ANTHROPIC (CLAUDE FRONTEND-DESIGN SKILL)]
Atue como Lead Designer de Elite seguindo o padrão oficial da Anthropic (github.com/anthropics/skills):
1. Enraizamento no Nicho Real (Grounding): Não use templates genéricos. O visual, paleta e texturas devem emanar diretamente dos materiais, público e essência da empresa.
2. Fuga dos 3 Vícios de IA Identificados pela Anthropic:
   - Não caia no vício 1: Fundo creme (#F4F1EA) automático com terracota (#D97757).
   - Não caia no vício 2: Fundo preto escuro com luz neon verde-ácido ou vermilion.
   - Não caia no vício 3: Broadsheet denso com zero-border-radius mecânico.
3. Tipografia Rigorosa: Máximo de 2 famílias tipográficas com escala harmônica; comprimentos de linha inferiores a 80 caracteres; proibição de destacar apenas uma palavra em cor/itálico no título; sem caixa alta excessiva em rótulos.
4. Estrutura como Informação: Linhas, divisórias e números devem codificar dados reais, não apenas decorar (ex: não use marcadores 01/02/03 a menos que o conteúdo seja uma sequência real de etapas).
5. Movimento Orquestrado: Uma única sequência de entrada bem orquestrada na Hero supera dezenas de efeitos espalhados. Evite animações automáticas em cada card.
`;
