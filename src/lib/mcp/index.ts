import { defineMcp } from "@lovable.dev/mcp-js";
import buscarEmpresas from "./tools/buscar-empresas";
import analisarPresenca from "./tools/analisar-presenca";
import gerarInsights from "./tools/gerar-insights";
import gerarAbordagem from "./tools/gerar-abordagem";
import gerarBriefing from "./tools/gerar-briefing";

export default defineMcp({
  name: "locomotivacrm",
  title: "Locomotivacrm",
  version: "0.1.0",
  instructions:
    "Ferramentas do Radar de Presença Digital, para prospecção de empresas com baixa maturidade digital no Rio Grande do Sul (foco Serra Gaúcha). Use `buscar_empresas` para encontrar empresas reais no Google Places, `analisar_presenca_digital` para diagnosticar um site ou perfil de Instagram, `gerar_insights` para argumentos de venda consultiva, `gerar_abordagem` para o texto de primeiro contato e `gerar_briefing` para briefings de site ou Instagram. As ferramentas não leem nem alteram a base de empresas da aplicação.",
  tools: [buscarEmpresas, analisarPresenca, gerarInsights, gerarAbordagem, gerarBriefing],
});
