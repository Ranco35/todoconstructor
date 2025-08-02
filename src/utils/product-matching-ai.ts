import { getProducts } from '@/actions/products/list';

interface ExtractedProduct {
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface ProductMatch {
  extractedProduct: ExtractedProduct;
  matchedProduct?: any;
  confidence: number;
  possibleMatches: any[];
  needsConfirmation: boolean;
  reason?: string;
}

interface ProductMatchingResult {
  matches: ProductMatch[];
  totalProducts: number;
  automaticMatches: number;
  needsConfirmation: number;
  noMatches: number;
}

/**
 * Busca productos en la base de datos que coincidan con el texto extraído
 * Incluye aprendizaje de facturas anteriores
 */
export async function findProductMatches(extractedText: string): Promise<any[]> {
  try {
    console.log('🔍 Buscando productos para:', extractedText);
    
    // Buscar por diferentes criterios en productos actuales
    const searchTerms = generateSearchTerms(extractedText);
    const allMatches: any[] = [];

    for (const term of searchTerms) {
      const result = await getProducts({
        search: term,
        page: 1,
        pageSize: 10
      });
      
      if (result.products && result.products.length > 0) {
        console.log(`📦 Encontrados ${result.products.length} productos con término "${term}"`);
        allMatches.push(...result.products);
      }
    }

    // 🧠 APRENDIZAJE: Buscar en facturas anteriores con descripciones similares
    await findProductsFromPreviousInvoices(extractedText, allMatches);

    // Eliminar duplicados y ordenar por relevancia
    const uniqueMatches = removeDuplicates(allMatches);
    const rankedMatches = rankByRelevance(uniqueMatches, extractedText);
    
    console.log(`💡 Total productos encontrados: ${rankedMatches.length}`);
    return rankedMatches;

  } catch (error) {
    console.error('Error buscando productos:', error);
    return [];
  }
}

/**
 * Busca productos en facturas anteriores con descripciones similares
 */
async function findProductsFromPreviousInvoices(extractedText: string, allMatches: any[]) {
  try {
    // Esta función necesitaría acceso a supabase
    // Por ahora implementamos una versión básica
    console.log('🧠 Buscando productos en facturas anteriores...');
    
    // TODO: Implementar búsqueda en purchase_invoice_lines
    // con descripciones similares y productos vinculados
    
  } catch (error) {
    console.error('Error buscando en facturas anteriores:', error);
  }
}

/**
 * Genera diferentes términos de búsqueda a partir del texto extraído
 */
function generateSearchTerms(text: string): string[] {
  const cleanText = text.toLowerCase().trim();
  const terms: string[] = [];
  
  // Término completo
  terms.push(cleanText);
  
  // Eliminar palabras comunes
  const withoutCommon = removeCommonWords(cleanText);
  if (withoutCommon !== cleanText) {
    terms.push(withoutCommon);
  }
  
  // Buscar códigos/SKUs (números)
  const codeMatch = cleanText.match(/\b\d{3,}\b/);
  if (codeMatch) {
    terms.push(codeMatch[0]);
  }
  
  // Palabras clave principales (primeras 2-3 palabras significativas)
  const keywords = extractKeywords(cleanText);
  if (keywords.length > 0) {
    terms.push(keywords.join(' '));
  }
  
  return [...new Set(terms)]; // Eliminar duplicados
}

/**
 * Elimina palabras comunes que no ayudan en la búsqueda
 */
function removeCommonWords(text: string): string {
  const commonWords = [
    'de', 'la', 'el', 'en', 'y', 'a', 'un', 'una', 'con', 'por', 'para',
    'kg', 'gr', 'ml', 'lt', 'cm', 'mm', 'unidad', 'pack', 'caja', 'bolsa',
    'kilo', 'kilogramo', 'gramo', 'litro', 'mililitro'
  ];
  
  const words = text.split(/\s+/);
  const filtered = words.filter(word => !commonWords.includes(word.toLowerCase()));
  return filtered.join(' ');
}

/**
 * Extrae palabras clave más relevantes
 */
function extractKeywords(text: string): string[] {
  const words = text.split(/\s+/).filter(word => word.length > 2);
  
  // Priorizar palabras que parecen nombres de productos
  const keywords = words.filter(word => {
    const w = word.toLowerCase();
    // Evitar palabras muy comunes
    return !['con', 'sin', 'para', 'tipo', 'marca', 'modelo'].includes(w);
  });
  
  return keywords.slice(0, 3); // Máximo 3 palabras clave
}

/**
 * Elimina productos duplicados del array
 */
function removeDuplicates(products: any[]): any[] {
  const seen = new Set();
  return products.filter(product => {
    if (seen.has(product.id)) {
      return false;
    }
    seen.add(product.id);
    return true;
  });
}

/**
 * Ordena productos por relevancia respecto al texto extraído
 */
function rankByRelevance(products: any[], extractedText: string): any[] {
  return products.map(product => ({
    ...product,
    relevanceScore: calculateRelevance(product, extractedText)
  }))
  .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Calcula puntuación de relevancia entre producto y texto extraído
 */
function calculateRelevance(product: any, extractedText: string): number {
  const text = extractedText.toLowerCase();
  const productName = (product.name || '').toLowerCase();
  const productSku = (product.sku || '').toLowerCase();
  const productDescription = (product.description || '').toLowerCase();
  
  let score = 0;
  
  // Coincidencia exacta de SKU
  if (productSku && text.includes(productSku)) {
    score += 100;
  }
  
  // Coincidencia exacta de nombre
  if (productName === text) {
    score += 90;
  }
  
  // Coincidencia parcial de nombre
  const nameWords = productName.split(/\s+/);
  const textWords = text.split(/\s+/);
  
  let matchingWords = 0;
  nameWords.forEach(nameWord => {
    if (textWords.some(textWord => 
      textWord.includes(nameWord) || nameWord.includes(textWord)
    )) {
      matchingWords++;
    }
  });
  
  score += (matchingWords / Math.max(nameWords.length, textWords.length)) * 70;
  
  // Coincidencia en descripción
  if (productDescription && productDescription.includes(text)) {
    score += 30;
  }
  
  return score;
}

/**
 * Procesa una lista de productos extraídos y encuentra matches
 */
export async function matchExtractedProducts(extractedProducts: ExtractedProduct[]): Promise<ProductMatchingResult> {
  const matches: ProductMatch[] = [];
  let automaticMatches = 0;
  let needsConfirmation = 0;
  let noMatches = 0;
  
  for (const extracted of extractedProducts) {
    const possibleMatches = await findProductMatches(extracted.description);
    
    let match: ProductMatch = {
      extractedProduct: extracted,
      confidence: 0,
      possibleMatches,
      needsConfirmation: false
    };
    
    if (possibleMatches.length === 0) {
      // Sin coincidencias
      match.needsConfirmation = true;
      match.reason = 'no_matches';
      noMatches++;
      
    } else if (possibleMatches.length === 1 && possibleMatches[0].relevanceScore > 80) {
      // Coincidencia única y alta confianza
      match.matchedProduct = possibleMatches[0];
      match.confidence = possibleMatches[0].relevanceScore;
      automaticMatches++;
      
    } else if (possibleMatches[0].relevanceScore > 90) {
      // Primera opción con muy alta confianza
      match.matchedProduct = possibleMatches[0];
      match.confidence = possibleMatches[0].relevanceScore;
      automaticMatches++;
      
    } else {
      // Múltiples opciones o baja confianza
      match.needsConfirmation = true;
      match.reason = possibleMatches.length > 1 ? 'multiple_matches' : 'low_confidence';
      match.confidence = possibleMatches[0]?.relevanceScore || 0;
      needsConfirmation++;
    }
    
    matches.push(match);
  }
  
  return {
    matches,
    totalProducts: extractedProducts.length,
    automaticMatches,
    needsConfirmation,
    noMatches
  };
}

/**
 * Confirma una selección manual de producto
 */
export function confirmProductMatch(match: ProductMatch, selectedProduct: any): ProductMatch {
  return {
    ...match,
    matchedProduct: selectedProduct,
    confidence: 100, // Confirmación manual = 100% confianza
    needsConfirmation: false,
    reason: 'manual_confirmation'
  };
}

/**
 * Marca un producto como nuevo (no existe en la base de datos)
 */
export function markAsNewProduct(match: ProductMatch): ProductMatch {
  return {
    ...match,
    matchedProduct: null,
    confidence: 100,
    needsConfirmation: false,
    reason: 'new_product'
  };
} 