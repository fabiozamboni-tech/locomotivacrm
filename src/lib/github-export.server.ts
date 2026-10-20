import { createServerFn } from "@tanstack/react-start";

export interface CriarRepositorioGithubInput {
  token?: string;
  repoName: string;
  isPrivate?: boolean;
  empresaNome: string;
  segmento?: string;
  cidade?: string;
  htmlContent: string;
}

export interface CriarRepositorioGithubOutput {
  sucesso: boolean;
  repoUrl?: string;
  cloneUrl?: string;
  owner?: string;
  repoName?: string;
  lovableImportUrl?: string;
  mensagem: string;
}

/**
 * Cria ou atualiza um repositório no GitHub com a landing page em GSAP gerada,
 * permitindo edição instantânea no Lovable e clonagem no Antigravity.
 */
export const criarRepositorioGithub_ServerFn = createServerFn({ method: "POST" })
  .inputValidator((data: CriarRepositorioGithubInput) => data)
  .handler(async ({ data }): Promise<CriarRepositorioGithubOutput> => {
    const rawToken =
      data.token?.trim() ||
      process.env.GITHUB_TOKEN?.trim() ||
      "";

    if (!rawToken) {
      return {
        sucesso: false,
        mensagem: "Token de acesso pessoal do GitHub não informado. Insira o token com permissão 'repo'.",
      };
    }

    const headers = {
      Authorization: `Bearer ${rawToken}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "Locomotiva-CRM-Estudio-Criacao",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    try {
      // 1. Valida o usuário autenticado
      const userRes = await fetch("https://api.github.com/user", { headers });
      if (!userRes.ok) {
        const errJson = await userRes.json().catch(() => ({}));
        return {
          sucesso: false,
          mensagem: `Token do GitHub inválido ou expirado (HTTP ${userRes.status}): ${errJson.message || "Acesso negado"}`,
        };
      }
      const userData = (await userRes.json()) as { login: string; html_url: string };
      const owner = userData.login;

      // Sanitiza o nome do repositório
      const repoSlug = data.repoName
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      const cleanRepoName = repoSlug || `site-${data.empresaNome.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;

      // 2. Verifica se o repositório já existe ou cria novo
      let repoUrl = `https://github.com/${owner}/${cleanRepoName}`;
      let cloneUrl = `https://github.com/${owner}/${cleanRepoName}.git`;

      const checkRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepoName}`, { headers });
      if (!checkRes.ok && checkRes.status === 404) {
        // Cria o repositório
        const createRes = await fetch("https://api.github.com/user/repos", {
          method: "POST",
          headers,
          body: JSON.stringify({
            name: cleanRepoName,
            description: `Landing page de alta conversão para ${data.empresaNome} (${data.segmento || "Comércio/Serviços"} em ${data.cidade || "RS"}) — Criado no Estúdio de Criação Locomotiva.`,
            private: !!data.isPrivate,
            auto_init: true,
          }),
        });

        if (!createRes.ok) {
          const errData = await createRes.json().catch(() => ({}));
          return {
            sucesso: false,
            mensagem: `Falha ao criar repositório no GitHub (${createRes.status}): ${errData.message || "Erro desconhecido"}`,
          };
        }

        const newRepoData = await createRes.json();
        repoUrl = newRepoData.html_url || repoUrl;
        cloneUrl = newRepoData.clone_url || cloneUrl;
      }

      // Função auxiliar para criar ou atualizar arquivo no repositório
      const commitFile = async (filePath: string, content: string, commitMessage: string) => {
        // Checa se o arquivo já existe para obter seu SHA
        let sha: string | undefined;
        try {
          const getRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepoName}/contents/${filePath}`, {
            headers,
          });
          if (getRes.ok) {
            const existingFile = (await getRes.json()) as { sha?: string };
            sha = existingFile.sha;
          }
        } catch {
          // Arquivo não existe ainda
        }

        const base64Content = Buffer.from(content, "utf-8").toString("base64");
        const putBody: Record<string, unknown> = {
          message: commitMessage,
          content: base64Content,
        };
        if (sha) {
          putBody.sha = sha;
        }

        const putRes = await fetch(`https://api.github.com/repos/${owner}/${cleanRepoName}/contents/${filePath}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(putBody),
        });

        if (!putRes.ok) {
          const errData = await putRes.json().catch(() => ({}));
          console.warn(`[GitHub Export] Falha ao enviar ${filePath}:`, errData);
        }
      };

      // 3. Monta o README.md completo
      const readmeContent = `# ${data.empresaNome} · Landing Page de Alta Conversão

> Desenvolvido com **Design Editorial Anti-IA**, animações fluidas via **GSAP & ScrollTrigger**, e otimização para conversão mobile.

## 🚀 Sobre o Projeto
- **Cliente:** ${data.empresaNome}
- **Segmento:** ${data.segmento || "Geral"}
- **Localização:** ${data.cidade || "Serra Gaúcha, RS"}
- **Tecnologias:** HTML5, Tailwind CSS, GSAP 3.12, ScrollTrigger, Lucide Icons, Google Fonts.

---

## 🛠️ Como Visualizar e Editar

### Opção 1: Abrir no Antigravity
Clone o repositório no seu ambiente de desenvolvimento:
\`\`\`bash
git clone ${cloneUrl}
cd ${cleanRepoName}
npx serve .
\`\`\`

### Opção 2: Importar no Lovable
1. Acesse [Lovable.dev](https://lovable.dev)
2. Clique em **Import Project** ou **Connect GitHub Repository**
3. Selecione o repositório \`${owner}/${cleanRepoName}\`
4. Continue editando o site visualmente ou adicionando integrações backend!

### Opção 3: Deploy Gratuito na Vercel ou Netlify
- O arquivo \`index.html\` é autossuficiente e está pronto para ser publicado em 1 clique na [Vercel](https://vercel.com) ou [GitHub Pages](https://pages.github.com).

---
*Gerado automaticamente pelo **Estúdio de Criação Locomotiva CRM**.*
`;

      const gitignoreContent = `.DS_Store
node_modules/
dist/
.vercel/
*.log
`;

      const packageJsonContent = JSON.stringify(
        {
          name: cleanRepoName,
          version: "1.0.0",
          private: true,
          description: `Landing page para ${data.empresaNome}`,
          scripts: {
            dev: "npx serve .",
            start: "npx serve .",
          },
        },
        null,
        2,
      );

      // 4. Executa os commits sequenciais
      await commitFile("index.html", data.htmlContent, `feat: landing page em GSAP para ${data.empresaNome}`);
      await commitFile("README.md", readmeContent, "docs: manual do projeto e instruções Lovable / Antigravity");
      await commitFile(".gitignore", gitignoreContent, "chore: adicionar .gitignore");
      await commitFile("package.json", packageJsonContent, "chore: adicionar package.json");

      return {
        sucesso: true,
        repoUrl,
        cloneUrl,
        owner,
        repoName: cleanRepoName,
        lovableImportUrl: `https://lovable.dev`,
        mensagem: `Repositório '${cleanRepoName}' criado e sincronizado com sucesso no GitHub!`,
      };
    } catch (err: any) {
      console.error("[GitHub Export] Erro:", err);
      return {
        sucesso: false,
        mensagem: `Erro de comunicação com o GitHub: ${err?.message || "Erro desconhecido"}`,
      };
    }
  });
