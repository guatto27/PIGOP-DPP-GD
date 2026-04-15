
// @ts-ignore
const pdfjs = window.pdfjsLib;

export interface ParsedDocument {
  text: string;
  images?: string[];
  isScanned: boolean;
}

export const extractTextFromXML = (xmlContent: string): ParsedDocument => {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "text/xml");

    const emisor = xmlDoc.getElementsByTagName("cfdi:Emisor")[0]?.getAttribute("Nombre") || "";
    const receptor = xmlDoc.getElementsByTagName("cfdi:Receptor")[0]?.getAttribute("Nombre") || "";
    const total = xmlDoc.getElementsByTagName("cfdi:Comprobante")[0]?.getAttribute("Total") || "";
    const fecha = xmlDoc.getElementsByTagName("cfdi:Comprobante")[0]?.getAttribute("Fecha") || "";
    const conceptos = Array.from(xmlDoc.getElementsByTagName("cfdi:Concepto"))
      .map(c => c.getAttribute("Descripcion"))
      .join(", ");

    const text = `TIPO: XML FACTURA (CFDI)
    FECHA: ${fecha}
    TOTAL: ${total}
    EMISOR: ${emisor}
    RECEPTOR: ${receptor}
    CONCEPTOS: ${conceptos}
    CONTENIDO COMPLETO (Snippet): ${xmlContent.substring(0, 1000)}`;

    return { text, isScanned: false };
  } catch (e) {
    return { text: "Error leyendo XML", isScanned: false };
  }
};

export const extractTextFromPDF = async (arrayBuffer: ArrayBuffer): Promise<ParsedDocument> => {
  try {
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = "";

    const numPages = pdf.numPages;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        fullText += `[PÁGINA ${pageNum} de ${numPages}]: ${pageText}\n`;
      } catch (err) {
        console.warn(`Error reading text from page ${pageNum}`, err);
      }
    }

    if (fullText.trim().length < 200) {
      const images: string[] = [];

      const renderPage = async (pNum: number) => {
        const page = await pdf.getPage(pNum);
        const viewport = page.getViewport({ scale: 3.0 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context!, viewport: viewport }).promise;

        const base64Url = canvas.toDataURL('image/jpeg', 0.85);
        return base64Url.split(',')[1];
      };

      const pagesToRender = [1];
      if (numPages > 1) pagesToRender.push(2);
      if (numPages > 2) pagesToRender.push(3);
      if (numPages > 3) pagesToRender.push(numPages);

      const uniquePages = [...new Set(pagesToRender)].sort((a, b) => a - b);

      for (const pNum of uniquePages) {
        images.push(await renderPage(pNum));
      }

      return {
        text: `[DOCUMENTO ESCANEADO DETECTADO (${numPages} PÁGINAS). SE HAN EXTRAÍDO IMÁGENES DE ALTA RESOLUCIÓN (Págs: ${uniquePages.join(',')}) PARA PROCESAMIENTO OCR AVANZADO]`,
        images: images,
        isScanned: true
      };
    }

    return { text: fullText, isScanned: false };
  } catch (e) {
    console.error("PDF Parse Error", e);
    return { text: "Error: No se pudo extraer texto del PDF (Archivo dañado o protegido).", isScanned: false };
  }
};

export const generatePDFThumbnail = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  try {
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale: 0.8 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context!, viewport: viewport }).promise;

    return canvas.toDataURL('image/jpeg', 0.7);
  } catch (e) {
    console.error("Error creating PDF thumbnail", e);
    return "";
  }
};
