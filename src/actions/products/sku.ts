'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createHash } from 'crypto';
import { ProductType } from '@/types/product';

async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );
}

interface SKUIntelligentConfig {
  maxKeywords: number;
  keywordLength: number;
  includeNumbers: boolean;
  includeBrand: boolean;
  sequenceDigits: number;
  stopWords: string[];
  priorityWords: string[];
  brandPriority: boolean;
}

const skuConfig: SKUIntelligentConfig = {
  maxKeywords: 2,
  keywordLength: 4,
  includeNumbers: true,
  includeBrand: true,
  sequenceDigits: 3,
  stopWords: ['de', 'del', 'la', 'el', 'para', 'con', 'sin', 'por', 'en', 'y', 'o'],
  priorityWords: ['monitor', 'teclado', 'mouse', 'papel', 'cable', 'usb', 'hdmi', 'led', 'lcd'],
  brandPriority: true
};

/**
 * Genera un SKU inteligente basado en categoría y nombre del producto
 */
export async function generateIntelligentSKU(productData: {
  name: string;
  brand?: string;
  categoryId?: number;
  type: ProductType;
}): Promise<string> {
  try {
    const supabase = await getSupabaseClient();
    
    // 1. Obtener información de la categoría si está disponible
    let categoryName = '';
    if (productData.categoryId) {
      try {
        const { data: category } = await supabase
          .from('Category')
          .select('name')
          .eq('id', productData.categoryId)
          .single();
        categoryName = category?.name || '';
      } catch (error) {
        console.warn('No se pudo obtener la categoría:', error);
      }
    }

    // 2. Limpiar y normalizar textos
    const cleanName = cleanProductName(productData.name);
    const cleanCategory = categoryName ? cleanProductName(categoryName) : '';
    
    // 3. Extraer palabras clave relevantes (categoría + nombre + marca)
    const keywords = extractKeywords(cleanName, productData.brand, cleanCategory);
    
    // 4. Obtener secuencial único para estas keywords
    const sequence = await getNextIntelligentSequence(keywords.join('-'));
    
    // 5. Construir SKU final
    const sequenceFormatted = sequence.toString().padStart(skuConfig.sequenceDigits, '0');
    return `${keywords.join('-')}-${sequenceFormatted}`;
    
  } catch (error) {
    console.error('Error generando SKU inteligente:', error);
    // Fallback: usar timestamp si falla
    return `PROD-${Date.now().toString().slice(-6)}`;
  }
}

/**
 * Limpia y normaliza el nombre del producto
 */
function cleanProductName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e') 
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extrae palabras clave relevantes de categoría, nombre y marca del producto
 */
function extractKeywords(cleanName: string, brand?: string, categoryName?: string): string[] {
  const nameWords = cleanName.split(' ').filter(word => word.length > 0);
  const categoryWords = categoryName ? categoryName.split(' ').filter(word => word.length > 0) : [];
  const keywords: string[] = [];
  
  // Diccionario de palabras relevantes por categoría
  const relevantWords = {
    electronics: ['monitor', 'teclado', 'keyboard', 'mouse', 'raton', 'cable', 'usb', 'hdmi', 'led', 'lcd', 'oled', 'wifi', 'bluetooth'],
    office: ['papel', 'paper', 'lapiz', 'pencil', 'boligrafo', 'pen', 'carpeta', 'folder', 'archivo', 'file', 'grapadora', 'stapler'],
    specs: ['24', '27', '32', '43', '55', 'pulgadas', 'inches', 'gb', 'tb', 'mb', 'kg', 'cm', 'mm', 'metros', 'meter'],
    colors: ['negro', 'black', 'blanco', 'white', 'azul', 'blue', 'rojo', 'red', 'verde', 'green', 'gris', 'gray'],
    brands: ['samsung', 'hp', 'dell', 'logitech', 'canon', 'epson', 'microsoft', 'apple', 'sony', 'lg'],
    materials: ['plastico', 'plastic', 'metal', 'vidrio', 'glass', 'madera', 'wood', 'cuero', 'leather'],
    types: ['inalambrico', 'wireless', 'mecanico', 'mechanical', 'optico', 'optical', 'laser', 'inkjet', 'ergonomico']
  };

  const allRelevantWords = Object.values(relevantWords).flat();

  // 1. PRIORIDAD MÁXIMA: Buscar palabra clave de categoría primero
  if (categoryWords.length > 0) {
    for (const word of categoryWords) {
      if (keywords.length < 1) { // Solo tomar la primera palabra de categoría
        const categoryKeyword = word.substring(0, skuConfig.keywordLength).toUpperCase();
        keywords.push(categoryKeyword);
        break;
      }
    }
  }

  // 2. Buscar palabras de prioridad en el nombre
  for (const word of nameWords) {
    if (skuConfig.priorityWords.some(priority => word.includes(priority) || priority.includes(word))) {
      if (keywords.length < skuConfig.maxKeywords) {
        const isNotDuplicate = !keywords.some(k => 
          k.toLowerCase().includes(word.substring(0, 3)) || 
          word.includes(k.toLowerCase().substring(0, 3))
        );
        if (isNotDuplicate) {
          keywords.push(word.substring(0, skuConfig.keywordLength).toUpperCase());
        }
      }
    }
  }

  // 3. Agregar marca si está disponible y hay prioridad de marca
  if (brand && skuConfig.includeBrand && skuConfig.brandPriority && keywords.length < skuConfig.maxKeywords) {
    const brandClean = cleanProductName(brand);
    const brandKeyword = brandClean.substring(0, skuConfig.keywordLength).toUpperCase();
    const isNotDuplicate = !keywords.some(k => 
      k.toLowerCase().includes(brandKeyword.substring(0, 3)) || 
      brandKeyword.includes(k.toLowerCase().substring(0, 3))
    );
    if (isNotDuplicate) {
      keywords.push(brandKeyword);
    }
  }

  // 4. Buscar palabras relevantes restantes (nombre primero, luego categoría)
  for (const word of nameWords) {
    if (keywords.length >= skuConfig.maxKeywords) break;
    
    const isRelevant = allRelevantWords.some(relevant => 
      word.includes(relevant) || relevant.includes(word)
    );
    
    const isNotStopWord = !skuConfig.stopWords.includes(word);
    const isNotAlreadyIncluded = !keywords.some(k => 
      k.toLowerCase().includes(word.substring(0, 3)) || 
      word.includes(k.toLowerCase().substring(0, 3))
    );
    
    if (isRelevant && isNotStopWord && isNotAlreadyIncluded && word.length >= 3) {
      keywords.push(word.substring(0, skuConfig.keywordLength).toUpperCase());
    }
  }

  // 5. Si incluimos números, buscar especificaciones numéricas
  if (skuConfig.includeNumbers && keywords.length < skuConfig.maxKeywords) {
    for (const word of nameWords) {
      if (/\d+/.test(word) && keywords.length < skuConfig.maxKeywords) {
        // Extraer número y contexto
        const number = word.match(/\d+/)?.[0];
        if (number && parseInt(number) > 0) {
          const isNotDuplicate = !keywords.some(k => k.includes(number));
          if (isNotDuplicate) {
            keywords.push(number.padStart(2, '0'));
            break;
          }
        }
      }
    }
  }

  // 6. Si no hay suficientes palabras relevantes, tomar palabras significativas del nombre
  if (keywords.length < skuConfig.maxKeywords) {
    for (const word of nameWords) {
      if (keywords.length >= skuConfig.maxKeywords) break;
      
      const isNotStopWord = !skuConfig.stopWords.includes(word);
      const isNotAlreadyIncluded = !keywords.some(k => 
        k.toLowerCase().includes(word.substring(0, 3)) || 
        word.includes(k.toLowerCase().substring(0, 3))
      );
      
      if (isNotStopWord && isNotAlreadyIncluded && word.length >= 3) {
        keywords.push(word.substring(0, skuConfig.keywordLength).toUpperCase());
      }
    }
  }

  // 7. Si aún no hay suficientes, agregar marca sin prioridad
  if (brand && skuConfig.includeBrand && keywords.length < skuConfig.maxKeywords) {
    const brandClean = cleanProductName(brand);
    const brandKeyword = brandClean.substring(0, skuConfig.keywordLength).toUpperCase();
    const isNotDuplicate = !keywords.some(k => 
      k.toLowerCase().includes(brandKeyword.substring(0, 3)) || 
      brandKeyword.includes(k.toLowerCase().substring(0, 3))
    );
    if (isNotDuplicate) {
      keywords.push(brandKeyword);
    }
  }

  // Asegurar que tenemos al menos una palabra clave
  if (keywords.length === 0) {
    keywords.push('PROD');
  }

  return keywords.slice(0, skuConfig.maxKeywords);
}

/**
 * Obtiene el siguiente número secuencial para un conjunto de keywords
 */
async function getNextIntelligentSequence(keywords: string): Promise<number> {
  try {
    const supabase = await getSupabaseClient();
    
    // Buscar el último SKU que use estas keywords
    const { data: lastProduct } = await supabase
      .from('Product')
      .select('sku')
      .ilike('sku', `${keywords}-%`)
      .order('sku', { ascending: false })
      .limit(1)
      .single();

    if (lastProduct?.sku) {
      // Extraer el número secuencial del último SKU
      const match = lastProduct.sku.match(/-(\d+)$/);
      if (match) {
        const lastSequence = parseInt(match[1]);
        return lastSequence + 1;
      }
    }

    // Si no hay SKUs previos, empezar en 1
    return 1;
  } catch (error) {
    console.error('Error obteniendo secuencia:', error);
    // Fallback: usar timestamp
    return Math.floor(Date.now() / 1000) % 1000;
  }
}

export async function validateSKUUniqueness(sku: string, excludeId?: number): Promise<boolean> {
  try {
    const supabase = await getSupabaseClient();
    
    let query = supabase
      .from('Product')
      .select('id')
      .eq('sku', sku);
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data, error } = await query.single();
    
    // Si no hay error y no hay datos, el SKU es único
    return !error && !data;
  } catch (error) {
    // Si hay error, probablemente significa que no existe (es único)
    return true;
  }
}

export async function ensureUniqueSKU(baseSku: string, excludeId?: number): Promise<string> {
  let sku = baseSku;
  let counter = 1;
  
  while (!(await validateSKUUniqueness(sku, excludeId))) {
    sku = `${baseSku}-${counter.toString().padStart(2, '0')}`;
    counter++;
    
    // Prevenir bucle infinito
    if (counter > 100) {
      sku = `${baseSku}-${Date.now().toString().slice(-4)}`;
      break;
    }
  }
  
  return sku;
} 