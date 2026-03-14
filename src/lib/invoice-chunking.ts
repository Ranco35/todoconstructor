/**
 * Invoice Chunking - Chunking inteligente por páginas
 * Última actualización: 2026-01-28
 *
 * Agrupa páginas en chunks sin cortar líneas a la mitad.
 * Cada chunk puede procesarse independientemente por IA.
 */

import { PdfPage } from './pdf-pages-extractor';

export interface PageChunk {
  chunkIndex: number;
  pagesIncluded: number[]; // Índices de páginas (0-based)
  startPage: number; // 1-based para UI
  endPage: number; // 1-based para UI
  text: string;
  charCount: number;
  isEmpty: boolean;
}

export interface ChunkingResult {
  chunks: PageChunk[];
  totalChunks: number;
  totalChars: number;
  averageCharsPerChunk: number;
}

/**
 * Configuración de chunking
 */
export interface ChunkingConfig {
  maxCharsPerChunk: number; // Máximo de caracteres por chunk (default: 10000)
  minCharsPerChunk: number; // Mínimo para no crear chunks muy pequeños (default: 2000)
  preferPageBoundaries: boolean; // Preferir límites de página (default: true)
}

const DEFAULT_CONFIG: ChunkingConfig = {
  maxCharsPerChunk: 10000,
  minCharsPerChunk: 2000,
  preferPageBoundaries: true
};

/**
 * Crea chunks inteligentes de páginas sin cortar líneas
 */
export function createPageChunks(
  pages: PdfPage[],
  config: Partial<ChunkingConfig> = {}
): ChunkingResult {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  console.log('🔪 Creando chunks de páginas:', {
    totalPages: pages.length,
    maxCharsPerChunk: finalConfig.maxCharsPerChunk,
    minCharsPerChunk: finalConfig.minCharsPerChunk
  });

  const chunks: PageChunk[] = [];
  let currentChunk: PageChunk | null = null;
  let chunkIndex = 0;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];

    // Si la página está vacía, crear chunk vacío o agregar a chunk actual
    if (page.isEmpty) {
      if (currentChunk && currentChunk.charCount > 0) {
        // Finalizar chunk actual antes de página vacía
        chunks.push(currentChunk);
        currentChunk = null;
      }
      // Crear chunk vacío para esta página
      chunks.push({
        chunkIndex: chunkIndex++,
        pagesIncluded: [page.index],
        startPage: page.index + 1,
        endPage: page.index + 1,
        text: '',
        charCount: 0,
        isEmpty: true
      });
      continue;
    }

    // Si no hay chunk actual, crear uno nuevo
    if (!currentChunk) {
      currentChunk = {
        chunkIndex: chunkIndex++,
        pagesIncluded: [page.index],
        startPage: page.index + 1,
        endPage: page.index + 1,
        text: page.text,
        charCount: page.charCount,
        isEmpty: false
      };
      continue;
    }

    // Verificar si agregar esta página excedería el límite
    const newCharCount = currentChunk.charCount + page.charCount;

    if (newCharCount <= finalConfig.maxCharsPerChunk) {
      // Agregar página al chunk actual
      currentChunk.pagesIncluded.push(page.index);
      currentChunk.endPage = page.index + 1;
      currentChunk.text += '\n' + page.text;
      currentChunk.charCount = newCharCount;
    } else {
      // El chunk actual está lleno — guardarlo y empezar uno nuevo con esta página
      const canExtend =
        currentChunk.charCount < finalConfig.minCharsPerChunk &&
        newCharCount <= finalConfig.maxCharsPerChunk * 1.2;

      if (canExtend) {
        // Chunk muy pequeño: extender un poco y guardarlo junto con la página actual
        currentChunk.pagesIncluded.push(page.index);
        currentChunk.endPage = page.index + 1;
        currentChunk.text += '\n' + page.text;
        currentChunk.charCount = newCharCount;
        chunks.push(currentChunk);
      } else {
        // Guardar chunk actual e iniciar nuevo con esta página
        chunks.push(currentChunk);
        currentChunk = {
          chunkIndex: chunkIndex++,
          pagesIncluded: [page.index],
          startPage: page.index + 1,
          endPage: page.index + 1,
          text: page.text,
          charCount: page.charCount,
          isEmpty: false
        };
        // No hacer continue: currentChunk ya contiene la página, seguirá en la próxima iteración
      }
    }
  }

  // Agregar último chunk si existe
  if (currentChunk) {
    chunks.push(currentChunk);
  }

  const totalChars = chunks.reduce((sum, chunk) => sum + chunk.charCount, 0);
  const averageCharsPerChunk = chunks.length > 0 ? totalChars / chunks.length : 0;

  console.log('✅ Chunks creados:', {
    totalChunks: chunks.length,
    totalChars,
    averageCharsPerChunk: Math.round(averageCharsPerChunk),
    chunks: chunks.map(c => ({
      pages: `${c.startPage}-${c.endPage}`,
      chars: c.charCount,
      isEmpty: c.isEmpty
    }))
  });

  return {
    chunks,
    totalChunks: chunks.length,
    totalChars,
    averageCharsPerChunk
  };
}

/**
 * Identifica qué páginas deben procesarse en "header pass"
 * (típicamente páginas 1-2 donde está la información del proveedor)
 */
export function getHeaderPages(pages: PdfPage[], maxHeaderPages: number = 2): number[] {
  return pages
    .slice(0, Math.min(maxHeaderPages, pages.length))
    .map(p => p.index + 1); // 1-based para UI
}

/**
 * Identifica qué chunks contienen solo items (no header)
 */
export function getLineItemChunks(
  chunks: PageChunk[],
  headerPages: number[]
): PageChunk[] {
  return chunks.filter(chunk => {
    // Si el chunk no incluye ninguna página de header, es un chunk de items
    return !chunk.pagesIncluded.some(pageIndex =>
      headerPages.includes(pageIndex + 1)
    );
  });
}
