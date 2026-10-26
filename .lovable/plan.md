# Corrigir publicação e unificar os dados entre navegadores

## Por que Safari e Chrome mostram dados diferentes
Hoje as empresas, exclusões, perfis do Instagram, pesos do score e colunas do Kanban ficam salvos **no próprio navegador** (armazenamento local). Existe uma tentativa de salvar também no servidor, mas ela grava em arquivo, e o servidor publicado não guarda arquivos entre acessos. Resultado: cada navegador (e cada computador) tem a sua própria cópia, e elas nunca se encontram.

## O que vamos fazer
1. **Banco de dados único (Lovable Cloud)** para empresas, exclusões, perfis do Instagram, pesos do score, colunas do Kanban e configurações de comunicação. Qualquer navegador passa a ver exatamente os mesmos dados.
2. **Migração sem perda:** na primeira abertura, cada navegador envia o que tem salvo localmente para o banco, mesclando por empresa (sem duplicar). Abra o sistema uma vez no Chrome e uma vez no Safari para juntar tudo.
3. O armazenamento local continua só como cópia rápida; o banco passa a ser a fonte oficial.
4. **Erro de publicação ("index.html")**: confirmar que a publicação usa a configuração padrão do sistema (sem arquivo index.html, que não é usado neste projeto) e corrigir o que estiver apontando para a configuração errada; validar com uma publicação de teste.

## Detalhes técnicos
- `src/lib/server-db.ts` usa `node:fs` — não persiste no Worker. Substituir por tabelas no Lovable Cloud (`empresas` em jsonb por id, `empresas_excluidas`, `instagram_profiles`, `app_settings` chave/valor), com RLS e GRANTs; acesso via server functions com o cliente admin carregado dentro do handler, protegido pela verificação da sessão da senha (`isUnlocked`).
- `store.tsx`: manter o merge atual (`missingOnServer`) como migração; incluir colunas do Kanban na sincronização; gravar alterações no banco a cada mudança.
- Build: o erro "Could not resolve entry module index.html" ocorre quando o Vite roda sem o plugin TanStack Start (ex.: comando/config alterado fora do Lovable ou build Vercel). Conferir `vite.config.ts`, scripts e `vercel.json`, rodar o build e ajustar.
