# Definir nova senha de acesso

A senha atual não é visível — ela fica guardada de forma cifrada e nem eu consigo ler o valor.

## O que será feito

- Atualizar a senha de acesso do sistema para `nimda`.
- Manter todo o resto igual: mesma tela de entrada, mesmo botão "Sair", mesmo tempo de sessão (7 dias).
- Depois da mudança, quem já estiver dentro continua dentro; novos acessos usam a nova senha.

## Observação

`nimda` é uma senha muito curta e fácil de adivinhar, e ela dá acesso a todos os dados de prospecção. Faço como pediu, mas recomendo depois trocar por algo mais longo (por exemplo três palavras juntas).

## Detalhe técnico

- Atualizar o segredo `SITE_PASSWORD` do projeto; nenhum arquivo de código muda.
