import JSZip from "jszip";

export interface ExportarZipOptions {
  empresaNome: string;
  segmento?: string;
  cidade?: string;
  htmlContent: string;
}

/**
 * Empacota a landing page e arquivos de suporte em um arquivo ZIP completo e inicia o download
 */
export async function exportarSiteComoZip({
  empresaNome,
  segmento = "Geral",
  cidade = "RS",
  htmlContent,
}: ExportarZipOptions): Promise<void> {
  const zip = new JSZip();

  const slug = empresaNome
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const readme = `# ${empresaNome} · Landing Page Profissional

Landing page moderna criada com diretrizes de **Design Editorial Anti-IA** e animações fluidas via **GSAP e ScrollTrigger**.

## Informações do Projeto
- **Empresa:** ${empresaNome}
- **Segmento:** ${segmento}
- **Cidade:** ${cidade}

## Como Rodar Localmente
Basta abrir o arquivo \`index.html\` em qualquer navegador moderno (Chrome, Safari, Edge, Firefox).

Se preferir rodar com um servidor local:
\`\`\`bash
npx serve .
\`\`\`

## Como Editar no Lovable ou Antigravity
1. Para editar no **Antigravity**: abra esta pasta no Antigravity ou VS Code.
2. Para editar no **Lovable**: crie um repositório no GitHub (disponível direto no botão 'Criar no GitHub' no Estúdio de Criação) e importe no Lovable.
3. Para publicar na **Vercel**: arraste a pasta ou conecte ao repositório GitHub.

---
Gerado pelo Estúdio de Criação Locomotiva CRM.
`;

  const gitignore = `.DS_Store
node_modules/
dist/
*.log
`;

  const packageJson = JSON.stringify(
    {
      name: `site-${slug}`,
      version: "1.0.0",
      description: `Landing page para ${empresaNome}`,
      scripts: {
        dev: "npx serve .",
        start: "npx serve .",
      },
    },
    null,
    2,
  );

  // Adiciona arquivos ao ZIP
  zip.file("index.html", htmlContent);
  zip.file("README.md", readme);
  zip.file(".gitignore", gitignore);
  zip.file("package.json", packageJson);

  // Gera o Blob do zip
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `site-${slug}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
