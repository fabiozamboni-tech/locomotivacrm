import { jsPDF } from "jspdf";
import pptxgen from "pptxgenjs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Empresa, ApresentacaoSlidesData, SlideItem } from "./mock-data";
import { SLIDE_TEMPLATE_ASSETS } from "./slide-templates-assets";

/**
 * Formata a data atual por extenso em português para o slide de capa (ex: "19 DE OUTUBRO DE 2026")
 */
function getDataFormatadaExtenso(): string {
  try {
    return format(new Date(), "dd 'DE' MMMM 'DE' yyyy", { locale: ptBR }).toUpperCase();
  } catch {
    return new Date().toLocaleDateString("pt-BR");
  }
}

/**
 * Sanitiza o nome do arquivo para download
 */
function getNomeArquivoBase(empresa: Empresa): string {
  const nomeLimpo = (empresa.nome || "Cliente")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 30);
  return `Apresentacao_Locomotiva_${nomeLimpo}`;
}

/**
 * Exporta a apresentação completa como arquivo PDF usando os templates oficiais da Locomotiva
 */
export async function exportarApresentacaoPDF(
  deck: ApresentacaoSlidesData,
  empresa: Empresa,
): Promise<void> {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: [842, 595],
    compress: true,
  });

  const dataExtenso = getDataFormatadaExtenso();
  const tituloGeral = (deck.titulo || "Apresentação Estratégica").toUpperCase();
  const clienteNome = (empresa.nome || "Cliente").toUpperCase();
  const slides = deck.slides.filter((s) => !s.oculto);

  slides.forEach((slide, index) => {
    if (index > 0) {
      doc.addPage([842, 595], "landscape");
    }

    const numeroPagina = index + 1;
    const isCapa = slide.tipo === "capa" || index === 0;
    const isFim = slide.tipo === "fim" || index === slides.length - 1;

    if (isCapa) {
      // SLIDE 1: CAPA COM ASSETS ORIGINAIS DA LOCOMOTIVA
      doc.addImage(SLIDE_TEMPLATE_ASSETS.capaBgBase64, "PNG", 0, 0, 842, 595);

      // TÍTULO DA APRESENTAÇÃO (ONDE DIZ TÍTULO NO TEMPLATE)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(26);
      doc.setTextColor(30, 41, 59); // Slate-800
      const tituloLinhas = doc.splitTextToSize(slide.titulo || deck.titulo, 620);
      doc.text(tituloLinhas, 88, 220);

      // CLIENTE (ONDE DIZ CLIENTE NO TEMPLATE)
      const yAposTitulo = 220 + tituloLinhas.length * 28;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(18);
      doc.setTextColor(51, 65, 85); // Slate-700
      doc.text(clienteNome, 88, Math.max(265, yAposTitulo));

      // DATA (ONDE DIZ DATA NO TEMPLATE)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.text(dataExtenso, 88, Math.max(345, yAposTitulo + 60));
    } else if (isFim) {
      // SLIDE FINAL: FIM COM LOGO CENTRAL E CONTATOS ORIGINAIS
      doc.addImage(SLIDE_TEMPLATE_ASSETS.fimBgBase64, "PNG", 0, 0, 842, 595);
    } else {
      // SLIDES INTERNOS (Páginas 2 até N-1)
      doc.addImage(SLIDE_TEMPLATE_ASSETS.internoBgBase64, "PNG", 0, 0, 842, 595);

      // HEADER NO TOPO ESQUERDO: TITULO EM NEGRITO - CLIENTE
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(30, 41, 59);
      doc.text(tituloGeral, 68, 53);

      const largTitulo = doc.getTextWidth(tituloGeral);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text(` - ${clienteNome}`, 68 + largTitulo, 53);

      // NÚMERO DA PÁGINA NO BADGE ROSA NO CANTO INFERIOR ESQUERDO
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text(String(numeroPagina), 20, 563, { align: "center" });

      // TÍTULO DA SEÇÃO DO SLIDE
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42); // Slate-900
      const slideTituloLinhas = doc.splitTextToSize(slide.titulo, 700);
      doc.text(slideTituloLinhas, 64, 105);

      let curY = 105 + slideTituloLinhas.length * 24;

      // SUBTÍTULO
      if (slide.subtitulo) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.setTextColor(100, 116, 139); // Slate-500
        const subLinhas = doc.splitTextToSize(slide.subtitulo, 700);
        doc.text(subLinhas, 64, curY);
        curY += subLinhas.length * 16 + 10;
      } else {
        curY += 10;
      }

      // TÓPICOS / BULLET POINTS
      const espacoDisponivel = 480 - curY;
      const numPontos = slide.pontos?.length || 1;
      const espacamento = Math.min(36, Math.max(22, Math.floor(espacoDisponivel / numPontos)));

      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);

      slide.pontos.forEach((ponto) => {
        // Marcador rosa da Locomotiva (#D22D67)
        doc.setFillColor(210, 45, 103);
        doc.circle(70, curY - 4, 3, "F");

        const pontoLinhas = doc.splitTextToSize(ponto, 675);
        doc.text(pontoLinhas, 82, curY);
        curY += Math.max(espacamento, pontoLinhas.length * 15 + 8);
      });

      // BOX DE DESTAQUE / TAKEAWAY
      if (slide.destaque && curY < 490) {
        curY = Math.max(curY, 445);
        const cardH = 55;
        // Fundo suave rosa/cinza
        doc.setFillColor(253, 242, 246); // #fdf2f6
        doc.setDrawColor(251, 207, 232); // #fbcfe8
        doc.roundedRect(64, curY, 715, cardH, 6, 6, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10.5);
        doc.setTextColor(157, 23, 77); // Pink-800
        const destLinhas = doc.splitTextToSize(`💡 ${slide.destaque}`, 690);
        doc.text(destLinhas, 76, curY + 22);
      }
    }
  });

  const nomeArquivo = `${getNomeArquivoBase(empresa)}.pdf`;
  doc.save(nomeArquivo);
}

/**
 * Exporta a apresentação completa como arquivo PowerPoint PPTX usando os templates oficiais
 */
export async function exportarApresentacaoPPTX(
  deck: ApresentacaoSlidesData,
  empresa: Empresa,
): Promise<void> {
  const pres = new pptxgen();

  // Define proporção em formato A4 Paisagem (11.69 x 8.27 polegadas)
  pres.defineLayout({ name: "A4_LANDSCAPE", width: 11.69, height: 8.27 });
  pres.layout = "A4_LANDSCAPE";

  const dataExtenso = getDataFormatadaExtenso();
  const tituloGeral = (deck.titulo || "Apresentação Estratégica").toUpperCase();
  const clienteNome = (empresa.nome || "Cliente").toUpperCase();
  const slides = deck.slides.filter((s) => !s.oculto);

  slides.forEach((slide, index) => {
    const s = pres.addSlide();
    const numeroPagina = index + 1;
    const isCapa = slide.tipo === "capa" || index === 0;
    const isFim = slide.tipo === "fim" || index === slides.length - 1;

    if (isCapa) {
      // 1. CAPA COM IMAGEM DE FUNDO
      s.addImage({
        data: SLIDE_TEMPLATE_ASSETS.capaBgBase64,
        x: 0,
        y: 0,
        w: "100%",
        h: "100%",
      });

      // TÍTULO DA APRESENTAÇÃO
      s.addText(slide.titulo || deck.titulo, {
        x: 1.2,
        y: 3.1,
        w: 9.2,
        h: 0.9,
        fontSize: 26,
        bold: true,
        color: "1E293B",
        fontFace: "Arial",
        valign: "top",
      });

      // CLIENTE
      s.addText(clienteNome, {
        x: 1.2,
        y: 4.1,
        w: 9.2,
        h: 0.5,
        fontSize: 18,
        bold: false,
        color: "334155",
        fontFace: "Arial",
      });

      // DATA
      s.addText(dataExtenso, {
        x: 1.2,
        y: 4.8,
        w: 9.2,
        h: 0.4,
        fontSize: 11,
        color: "64748B",
        fontFace: "Arial",
      });
    } else if (isFim) {
      // SLIDE FINAL COM LOGO E CONTATOS
      s.addImage({
        data: SLIDE_TEMPLATE_ASSETS.fimBgBase64,
        x: 0,
        y: 0,
        w: "100%",
        h: "100%",
      });
    } else {
      // SLIDES INTERNOS
      s.addImage({
        data: SLIDE_TEMPLATE_ASSETS.internoBgBase64,
        x: 0,
        y: 0,
        w: "100%",
        h: "100%",
      });

      // HEADER NO TOPO ESQUERDO: TITULO EM NEGRITO - CLIENTE
      s.addText(
        [
          { text: tituloGeral, options: { bold: true, color: "334155" } },
          { text: ` - ${clienteNome}`, options: { bold: false, color: "64748B" } },
        ],
        {
          x: 0.88,
          y: 0.45,
          w: 7.5,
          h: 0.4,
          fontSize: 10.5,
          fontFace: "Arial",
        },
      );

      // NÚMERO DA PÁGINA NO BADGE ROSA
      s.addText(String(numeroPagina), {
        x: 0.0,
        y: 7.55,
        w: 0.57,
        h: 0.38,
        fontSize: 11,
        bold: true,
        color: "FFFFFF",
        align: "center",
        valign: "middle",
        fontFace: "Arial",
      });

      // TÍTULO DO SLIDE
      s.addText(slide.titulo, {
        x: 0.88,
        y: 1.3,
        w: 9.8,
        h: 0.6,
        fontSize: 22,
        bold: true,
        color: "0F172A",
        fontFace: "Arial",
      });

      // SUBTÍTULO
      if (slide.subtitulo) {
        s.addText(slide.subtitulo, {
          x: 0.88,
          y: 1.85,
          w: 9.8,
          h: 0.4,
          fontSize: 12,
          color: "64748B",
          fontFace: "Arial",
        });
      }

      // LISTA DE PONTOS / BULLETS
      const itensTexto = slide.pontos.map((p, idx) => ({
        text: p,
        options: {
          bullet: { type: "bullet" as const, color: "D22D67" },
          breakLine: idx < slide.pontos.length - 1,
        },
      }));

      s.addText(itensTexto, {
        x: 0.88,
        y: slide.subtitulo ? 2.45 : 2.1,
        w: 9.8,
        h: slide.destaque ? 3.4 : 4.4,
        fontSize: 13,
        color: "1E293B",
        lineSpacingMultiple: 1.35,
        fontFace: "Arial",
        valign: "top",
      });

      // BOX DE DESTAQUE
      if (slide.destaque) {
        s.addShape(pres.ShapeType.roundRect, {
          x: 0.88,
          y: 6.2,
          w: 9.8,
          h: 0.85,
          fill: { color: "FDF2F6" },
          line: { color: "FBCFE8", width: 1 },
          rectRadius: 0.08,
        });

        s.addText(`💡 ${slide.destaque}`, {
          x: 1.05,
          y: 6.25,
          w: 9.45,
          h: 0.75,
          fontSize: 11,
          bold: true,
          color: "9D174D",
          fontFace: "Arial",
          valign: "middle",
        });
      }
    }
  });

  const nomeArquivo = `${getNomeArquivoBase(empresa)}.pptx`;
  await pres.writeFile({ fileName: nomeArquivo });
}
