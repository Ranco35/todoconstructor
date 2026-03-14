/**
 * PDF Pages Extractor - Extracción por páginas individuales
 * Última actualización: 2026-01-28
 *
 * Extrae texto de cada página del PDF por separado para permitir
 * chunking inteligente sin cortar líneas a la mitad.
 */

export interface PdfPage {
  index: number; // 0-based
  text: string;
  charCount: number;
  isEmpty: boolean;
}

export interface PdfPagesResult {
  pages: PdfPage[];
  fullText: string;
  totalPages: number;
  pagesWithText: number;
  pagesEmpty: number;
}

/**
 * Extrae texto de cada página del PDF por separado
 */
export async function extractPdfPagesText(file: File | ArrayBuffer): Promise<PdfPagesResult> {
  if (typeof window === 'undefined') {
    throw new Error('extractPdfPagesText solo funciona en navegador');
  }

  try {
    // Importar PDF.js dinámicamente
    const pdfjsLib = await import('pdfjs-dist/build/pdf');

    // Configurar worker (Next.js bundle)
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

    console.log('📄 Iniciando extracción por páginas con PDF.js...');

    // Leer archivo como ArrayBuffer
    const arrayBuffer = file instanceof File ? await file.arrayBuffer() : file;

    // Cargar documento PDF
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    const totalPages = pdf.numPages;
    console.log(`📚 PDF cargado: ${totalPages} páginas`);

    const pages: PdfPage[] = [];
    let fullText = '';

    // Extraer texto de cada página individualmente
    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent({
        normalizeWhitespace: true
      });

      // Concatenar items de texto de esta página
      const pageText = textContent.items
        .map((item: any) => item.str || '')
        .join(' ')
        .replace(/\s+/g, ' ')  // Normalizar espacios
        .trim();

      const charCount = pageText.length;
      const isEmpty = charCount === 0;

      pages.push({
        index: pageNum - 1, // 0-based
        text: pageText,
        charCount,
        isEmpty
      });

      if (pageText) {
        fullText += pageText + '\n';
      }

      console.log(`  ✅ Página ${pageNum}/${totalPages}: ${charCount} caracteres ${isEmpty ? '(VACÍA)' : ''}`);
    }

    const finalFullText = fullText.trim();
    const pagesWithText = pages.filter(p => !p.isEmpty).length;
    const pagesEmpty = pages.filter(p => p.isEmpty).length;

    console.log(`✅ Extracción por páginas completada:`);
    console.log(`   - Total páginas: ${totalPages}`);
    console.log(`   - Páginas con texto: ${pagesWithText}`);
    console.log(`   - Páginas vacías: ${pagesEmpty}`);
    console.log(`   - Texto total: ${finalFullText.length} caracteres`);

    return {
      pages,
      fullText: finalFullText,
      totalPages,
      pagesWithText,
      pagesEmpty
    };

  } catch (error) {
    console.error('❌ Error extrayendo páginas del PDF:', error);
    throw new Error(`Error procesando PDF por páginas: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Fallback: Si no se puede extraer por páginas, intenta heurística de page breaks
 * Úsalo solo si extractPdfPagesText falla
 */
export function splitTextByPageBreaks(fullText: string, estimatedPages: number = 1): PdfPage[] {
  console.log('⚠️ Usando heurística de page breaks (menos preciso)');

  // Buscar marcadores comunes de salto de página
  const pageBreakMarkers = [
    /\f/g, // Form feed character
    /\n{3,}/g, // Múltiples saltos de línea
    /Página\s+\d+/gi, // "Página 1", "Página 2", etc.
    /Page\s+\d+/gi, // "Page 1", "Page 2", etc.
  ];

  // Intentar dividir por form feed primero
  let chunks = fullText.split(/\f/);

  // Si no hay form feeds, intentar por saltos grandes
  if (chunks.length === 1) {
    chunks = fullText.split(/\n{3,}/);
  }

  // Si aún no hay divisiones, dividir equitativamente
  if (chunks.length === 1 && estimatedPages > 1) {
    const charsPerPage = Math.ceil(fullText.length / estimatedPages);
    chunks = [];
    for (let i = 0; i < estimatedPages; i++) {
      const start = i * charsPerPage;
      const end = Math.min(start + charsPerPage, fullText.length);
      chunks.push(fullText.substring(start, end));
    }
  }

  const pages: PdfPage[] = chunks.map((text, index) => {
    const trimmed = text.trim();
    return {
      index,
      text: trimmed,
      charCount: trimmed.length,
      isEmpty: trimmed.length === 0
    };
  });

  console.log(`📄 Heurística generó ${pages.length} páginas estimadas`);
  return pages;
}
