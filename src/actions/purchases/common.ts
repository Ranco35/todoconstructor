'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';

export interface SupplierOption {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  vat?: string; // RUT del proveedor
}

export interface ProductOption {
  id: number;
  name: string;
  sku: string;
  salePrice: number;
  description?: string;
}

/**
 * Obtener lista de proveedores para formularios
 */
export async function getSuppliersForForms(): Promise<SupplierOption[]> {
  try {
    console.log('🔄 [getSuppliersForForms] Iniciando carga de proveedores...');
    const supabase = await getSupabaseServerClient();
    
    // ✅ CAMBIO: Mostrar TODOS los proveedores activos, tengan o no RUT
    const { data: suppliers, error } = await supabase
      .from('Supplier')
      .select('id, name, email, phone, vat')
      .eq('active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ [getSuppliersForForms] Error fetching suppliers:', error);
      return [];
    }

    console.log('✅ [getSuppliersForForms] Proveedores obtenidos:', suppliers?.length || 0);
    console.log('📋 [getSuppliersForForms] Detalle de proveedores:', suppliers?.map(s => ({
      id: s.id,
      name: s.name,
      vat: s.vat || 'SIN RUT' // ✅ Mostrar "SIN RUT" para los que no tienen
    })));

    return suppliers || [];
  } catch (error) {
    console.error('❌ [getSuppliersForForms] Error in getSuppliersForForms:', error);
    return [];
  }
}

/**
 * Obtener lista de productos para formularios
 */
export async function getProductsForForms(): Promise<ProductOption[]> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data: products, error } = await supabase
      .from('Product')
      .select('id, name, sku, saleprice, description')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    return products || [];
  } catch (error) {
    console.error('Error in getProductsForForms:', error);
    return [];
  }
}

/**
 * Obtener lista de bodegas para formularios
 */
export async function getWarehousesForForms(): Promise<{ id: number; name: string }[]> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data: warehouses, error } = await supabase
      .from('Warehouse')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching warehouses:', error);
      return [];
    }

    return warehouses || [];
  } catch (error) {
    console.error('Error in getWarehousesForForms:', error);
    return [];
  }
}

/**
 * Buscar productos por término de búsqueda
 */
export async function searchProducts(searchTerm: string): Promise<ProductOption[]> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data: products, error } = await supabase
      .from('Product')
      .select('id, name, sku, saleprice, description')
      .or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`)
      .order('name', { ascending: true })
      .limit(20);

    if (error) {
      console.error('Error searching products:', error);
      return [];
    }

    return products || [];
  } catch (error) {
    console.error('Error in searchProducts:', error);
    return [];
  }
}

/**
 * Buscar proveedores por término de búsqueda
 */
export async function searchSuppliers(searchTerm: string): Promise<SupplierOption[]> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data: suppliers, error } = await supabase
      .from('Supplier')
      .select('id, name, email, phone')
      .eq('active', true)
      .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .order('name', { ascending: true })
      .limit(20);

    if (error) {
      console.error('Error searching suppliers:', error);
      return [];
    }

    return suppliers || [];
  } catch (error) {
    console.error('Error in searchSuppliers:', error);
    return [];
  }
} 

/**
 * Buscar producto automáticamente por descripción, SKU o código
 * Utilizado para conectar líneas de factura con productos existentes
 */
export async function findProductByDescription(description: string, productCode?: string): Promise<{
  product: any | null;
  confidence: number;
  suggestions: any[];
}> {
  try {
    const supabase = await getSupabaseServerClient();
    
    let bestMatch: any | null = null;
    let confidence = 0;
    let suggestions: any[] = [];

    // 1. Búsqueda exacta por SKU/código si se proporciona
    if (productCode && productCode.trim().length > 0) {
      const { data: exactMatch } = await supabase
        .from('Product')
        .select('id, name, sku, saleprice, description, barcode')
        .or(`sku.eq.${productCode},barcode.eq.${productCode}`)
        .limit(1)
        .single();

      if (exactMatch) {
        return {
          product: exactMatch,
          confidence: 0.95,
          suggestions: []
        };
      }
    }

    // 2. Búsqueda por palabras clave en descripción
    const words = description.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2); // Solo palabras de 3+ caracteres

    if (words.length === 0) {
      return { product: null, confidence: 0, suggestions: [] };
    }

    // 3. Buscar coincidencias parciales con búsqueda más amplia
    const searchTerms = words.slice(0, 5); // Máximo 5 palabras más relevantes
    
    // Crear múltiples consultas para mejorar la búsqueda
    const searchQueries = [
      // Búsqueda exacta por palabras completas
      ...searchTerms.map(term => `name.ilike.%${term}%`),
      ...searchTerms.map(term => `description.ilike.%${term}%`),
      // Búsqueda por subcadenas (para palabras largas)
      ...searchTerms.filter(term => term.length > 4).map(term => `name.ilike.%${term.substring(0, 4)}%`),
      // Búsqueda por SKU si contiene números
      ...searchTerms.filter(term => /\d/.test(term)).map(term => `sku.ilike.%${term}%`)
    ];

    const { data: products } = await supabase
      .from('Product')
      .select('id, name, sku, saleprice, description, barcode')
      .or(searchQueries.join(','))
      .limit(30); // Aumentar límite para más opciones

    if (!products || products.length === 0) {
      return { product: null, confidence: 0, suggestions: [] };
    }

    // 4. Calcular puntuación de coincidencia mejorada para cada producto
    const scoredProducts = products.map(product => {
      let score = 0;
      const productText = `${product.name} ${product.description || ''}`.toLowerCase();
      const productName = product.name.toLowerCase();
      const productDescription = (product.description || '').toLowerCase();
      
      // Puntuación por palabras coincidentes
      for (const word of words) {
        // Coincidencia en nombre (máximo peso)
        if (productName.includes(word)) {
          score += word.length * 3; // Triple peso para coincidencias en nombre
        }
        
        // Coincidencia en descripción
        if (productDescription.includes(word)) {
          score += word.length * 2; // Doble peso para coincidencias en descripción
        }
        
        // Coincidencia en SKU
        if (product.sku && product.sku.toLowerCase().includes(word)) {
          score += word.length * 2; // Doble peso para coincidencias en SKU
        }
      }
      
      // Bonificación por coincidencia exacta de palabras clave importantes
      const importantKeywords = ['harina', 'aceite', 'cafe', 'leche', 'pan', 'queso', 'carne', 'pescado'];
      for (const keyword of importantKeywords) {
        if (productText.includes(keyword) && description.toLowerCase().includes(keyword)) {
          score += 20; // Bonificación por palabras clave importantes
        }
      }
      
      // Bonificación por longitud similar de descripción
      const lengthDiff = Math.abs(productText.length - description.length);
      if (lengthDiff < 10) {
        score += 5; // Bonificación por descripciones de longitud similar
      }
      
      // Normalizar puntuación (0-1)
      const maxPossibleScore = words.reduce((sum, word) => sum + word.length * 3 + 25, 0);
      const normalizedScore = Math.min(score / maxPossibleScore, 1);
      
      return {
        ...product,
        matchScore: normalizedScore
      };
    });

    // 5. Ordenar por puntuación
    scoredProducts.sort((a, b) => b.matchScore - a.matchScore);
    
    // 6. Determinar mejor coincidencia (umbral muy bajo para capturar más coincidencias)
    if (scoredProducts[0] && scoredProducts[0].matchScore > 0.05) {
      bestMatch = scoredProducts[0];
      confidence = scoredProducts[0].matchScore;
    }

    // 7. Incluir sugerencias adicionales (más sugerencias con umbral muy bajo)
    suggestions = scoredProducts.slice(0, 10).filter(p => p.matchScore > 0.02);
    
    console.log(`🔍 Búsqueda de productos para "${description}":`)
    console.log(`   - Productos encontrados: ${products.length}`)
    console.log(`   - Mejor coincidencia: ${bestMatch ? bestMatch.name : 'Ninguna'}`)
    console.log(`   - Confianza: ${confidence.toFixed(3)}`)
    console.log(`   - Sugerencias: ${suggestions.length}`)

    return {
      product: bestMatch,
      confidence,
      suggestions
    };

  } catch (error) {
    console.error('Error en findProductByDescription:', error);
    return { product: null, confidence: 0, suggestions: [] };
  }
}

/**
 * Buscar múltiples productos para líneas de factura
 */
export async function findProductsForInvoiceLines(lines: Array<{
  description: string;
  productCode?: string;
  quantity: number;
  unitPrice: number;
}>): Promise<Array<{
  originalLine: any;
  productMatch: any | null;
  confidence: number;
  suggestions: any[];
}>> {
  const results = [];
  
  for (const line of lines) {
    const productMatch = await findProductByDescription(line.description, line.productCode);
    results.push({
      originalLine: line,
      productMatch: productMatch.product,
      confidence: productMatch.confidence,
      suggestions: productMatch.suggestions
    });
    
    // Pequeña pausa para no sobrecargar la base de datos
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

/**
 * Sugerir creación de productos nuevos basado en líneas de factura sin coincidencias
 */
export async function suggestNewProducts(lines: Array<{
  description: string;
  productCode?: string;
  quantity: number;
  unitPrice: number;
}>): Promise<Array<{
  suggestedProduct: {
    name: string;
    sku: string;
    description: string;
    costPrice: number;
    salePrice: number;
    category: string;
  };
  confidence: number;
  reasoning: string;
}>> {
  const suggestions = [];

  for (const line of lines) {
    // Solo sugerir para líneas que no tienen productos conectados
    const existingMatch = await findProductByDescription(line.description, line.productCode);
    
    if (!existingMatch.product) {
      // Generar sugerencia de producto nuevo
      const cleanDescription = line.description
        .replace(/\d+/g, '') // Remover números
        .replace(/[^\w\s]/g, ' ') // Remover símbolos
        .replace(/\s+/g, ' ') // Normalizar espacios
        .trim();

      const words = cleanDescription.split(' ').filter(w => w.length > 2);
      const productName = words.slice(0, 3).join(' '); // Primeras 3 palabras como nombre

      // Generar SKU sugerido
      const skuBase = (line.productCode || 
        words.map(w => w.substring(0, 2).toUpperCase()).join('')
      ).substring(0, 10);

      // Estimar categoría basada en palabras clave
      let suggestedCategory = 'GENERAL';
      const categoryKeywords = {
        'PAPELERIA': ['papel', 'lapiz', 'cuaderno', 'tinta', 'resma'],
        'LIMPIEZA': ['detergente', 'jabon', 'cloro', 'limpiador', 'toalla'],
        'OFICINA': ['archivo', 'carpeta', 'grapadora', 'clip', 'folder'],
        'TECNOLOGIA': ['cable', 'usb', 'mouse', 'teclado', 'monitor'],
        'MANTENIMIENTO': ['tornillo', 'herramienta', 'aceite', 'pintura', 'martillo']
      };

      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => 
          cleanDescription.toLowerCase().includes(keyword)
        )) {
          suggestedCategory = category;
          break;
        }
      }

      // Calcular precio de venta sugerido (margen del 30%)
      const suggestedSalePrice = Math.round(line.unitPrice * 1.3);

      suggestions.push({
        suggestedProduct: {
          name: productName || line.description.substring(0, 50),
          sku: `${skuBase}-${Date.now().toString().slice(-4)}`,
          description: line.description,
          costPrice: line.unitPrice,
          salePrice: suggestedSalePrice,
          category: suggestedCategory
        },
        confidence: 0.7, // Confianza media para productos sugeridos
        reasoning: `Producto no encontrado en BD. Sugerido basado en: ${cleanDescription}. Categoría estimada: ${suggestedCategory}`
      });
    }
  }

  return suggestions;
}

/**
 * Crear producto automáticamente desde sugerencia
 */
export async function createProductFromSuggestion(suggestion: {
  name: string;
  sku: string;
  description: string;
  costPrice: number;
  salePrice: number;
  category: string;
}, supplierId?: number): Promise<{ success: boolean; productId?: number; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Verificar que no exista un producto con el mismo SKU
    const { data: existingProduct } = await supabase
      .from('Product')
      .select('id')
      .eq('sku', suggestion.sku)
      .single();

    if (existingProduct) {
      return {
        success: false,
        error: `Ya existe un producto con SKU: ${suggestion.sku}`
      };
    }

    // Buscar o crear categoría
    let categoryId = null;
    const { getCategoryTableName } = await import('@/lib/table-resolver');
    const categoryTable = await getCategoryTableName(supabase as any);
    const { data: category } = await (supabase as any)
      .from(categoryTable)
      .select('id')
      .ilike('name', `%${suggestion.category}%`)
      .single();

    if (category) {
      categoryId = category.id;
    } else {
      // Crear categoría si no existe
      const { data: newCategory } = await (supabase as any)
        .from(categoryTable)
        .insert({
          name: suggestion.category,
          description: `Categoría creada automáticamente para: ${suggestion.category}`
        })
        .select('id')
        .single();
      
      categoryId = newCategory?.id;
    }

    // Crear el producto
    const { data: newProduct, error: productError } = await supabase
      .from('Product')
      .insert({
        name: suggestion.name,
        sku: suggestion.sku,
        description: suggestion.description,
        costprice: suggestion.costPrice,
        saleprice: suggestion.salePrice,
        categoryid: categoryId,
        supplierid: supplierId,
        vat: 19.0, // IVA estándar Chile
        isActive: true
      })
      .select('id')
      .single();

    if (productError) {
      console.error('Error creando producto:', productError);
      return {
        success: false,
        error: `Error creando producto: ${productError.message}`
      };
    }

    console.log(`✅ Producto creado automáticamente: ${suggestion.name} (ID: ${newProduct.id})`);
    
    return {
      success: true,
      productId: newProduct.id
    };

  } catch (error) {
    console.error('Error en createProductFromSuggestion:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
} 