"use server";

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { OdooProduct, OdooCategory, OdooSupplier, OdooSyncResult, ODOO_PRODUCT_TYPE_MAPPING, DEFAULT_ODOO_CONFIG } from '@/types/odoo';
import { ProductImportData } from '@/lib/import-parsers';
import { importProducts } from '@/actions/products/import';
import { mapOdooProductToImportData } from '@/lib/odoo-utils';

async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );
}

// Función para obtener productos desde Odoo
export async function getOdooProducts(): Promise<{ success: boolean; data?: OdooProduct[]; error?: string }> {
  try {
    console.log('🔄 Conectando con Odoo para obtener productos...');
    
    const response = await fetch(`${DEFAULT_ODOO_CONFIG.baseUrl}/api/productos`, {
      method: 'POST', // Odoo type='json' requiere POST
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({}), // Enviar JSON vacío
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Error al conectar con Odoo: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    // La API de Odoo devuelve {productos: [...]} no directamente [...]
    const products = responseData.productos || responseData;
    console.log(`✅ Obtenidos ${Array.isArray(products) ? products.length : 0} productos desde Odoo`);

    return { success: true, data: products };
  } catch (error) {
    console.error('❌ Error al obtener productos de Odoo:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al conectar con Odoo' 
    };
  }
}

// Función para descargar imagen desde Odoo
export async function downloadOdooImage(imageUrl: string, productName: string): Promise<string | null> {
  try {
    if (!imageUrl) return null;

    console.log(`📥 Descargando imagen para: ${productName}`);
    
    const response = await fetch(imageUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AdminTermas/1.0)',
      },
    });

    if (!response.ok) {
      console.warn(`⚠️ No se pudo descargar imagen para ${productName}: ${response.status}`);
      return null;
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.warn(`⚠️ Error descargando imagen para ${productName}:`, error);
    return null;
  }
}

// Función para obtener categorías desde Odoo
export async function getOdooCategories(): Promise<{ success: boolean; data?: OdooCategory[]; error?: string }> {
  try {
    console.log('🔄 Conectando con Odoo para obtener categorías...');
    
    const response = await fetch(`${DEFAULT_ODOO_CONFIG.baseUrl}/api/categorias`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Error al conectar con Odoo: ${response.status} ${response.statusText}`);
    }

    const categories = await response.json();
    console.log(`✅ Obtenidas ${categories.length} categorías desde Odoo`);

    return { success: true, data: categories };
  } catch (error) {
    console.error('❌ Error al obtener categorías de Odoo:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al conectar con Odoo' 
    };
  }
}

// Función para obtener productos desde Odoo filtrados por categoría
export async function getOdooProductsByCategory(categoryId: number): Promise<{ success: boolean; data?: OdooProduct[]; error?: string }> {
  try {
    console.log(`🔄 Conectando con Odoo para obtener productos de categoría ${categoryId}...`);
    
    const response = await fetch(`${DEFAULT_ODOO_CONFIG.baseUrl}/api/productos/categoria/${categoryId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Error al conectar con Odoo: ${response.status} ${response.statusText}`);
    }

    const products = await response.json();
    console.log(`✅ Obtenidos ${products.length} productos de categoría ${categoryId} desde Odoo`);

    return { success: true, data: products };
  } catch (error) {
    console.error('❌ Error al obtener productos por categoría de Odoo:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al conectar con Odoo' 
    };
  }
}

// Función para transferir productos seleccionados a una categoría específica en Supabase
export async function transferOdooProductsToCategory(
  odooProducts: OdooProduct[], 
  targetCategoryId: number,
  includeImages: boolean = true
): Promise<OdooSyncResult> {
  const result: OdooSyncResult = {
    success: false,
    message: '',
    stats: {
      productsTotal: 0,
      productsCreated: 0,
      productsUpdated: 0,
      productsErrors: 0,
      imagesDownloaded: 0,
      categoriesCreated: 0,
      suppliersCreated: 0,
    },
    errors: [],
    warnings: []
  };

  try {
    console.log(`🚀 Iniciando transferencia de ${odooProducts.length} productos a categoría ${targetCategoryId}...`);

    result.stats.productsTotal = odooProducts.length;

    // Obtener información de la categoría destino
    const supabase = await getSupabaseClient();
    const { data: targetCategory, error: categoryError } = await supabase
      .from('Category')
      .select('name')
      .eq('id', targetCategoryId)
      .single();

    if (categoryError || !targetCategory) {
      result.errors.push(`Error: No se encontró la categoría destino con ID ${targetCategoryId}`);
      return result;
    }

    console.log(`📁 Transfiriendo productos a categoría: ${targetCategory.name}`);

    // Convertir productos al formato interno con categoría específica
    const importData: ProductImportData[] = [];
    
    for (const odooProduct of odooProducts) {
      try {
        let downloadedImage: string | null = null;

        // Descargar imagen si está habilitado
        if (includeImages && odooProduct.image_url) {
          downloadedImage = await downloadOdooImage(odooProduct.image_url, odooProduct.name);
          if (downloadedImage) {
            result.stats.imagesDownloaded++;
          }
        }

        // Mapear producto y asignar categoría específica
        const mappedProduct = mapOdooProductToImportData(odooProduct, downloadedImage);
        mappedProduct.categoryName = targetCategory.name;
        importData.push(mappedProduct);

      } catch (error) {
        console.error(`❌ Error procesando producto ${odooProduct.name}:`, error);
        result.errors.push(`Error procesando producto ${odooProduct.name}: ${error}`);
        result.stats.productsErrors++;
      }
    }

    console.log(`🔄 Importando ${importData.length} productos al sistema local...`);

    // Importar productos
    const importResult = await importProducts(importData);
    
    if (importResult.success) {
      result.success = true;
      result.message = `Transferencia exitosa: ${importResult.created} productos creados, ${importResult.updated} actualizados, ${result.stats.imagesDownloaded} imágenes descargadas`;
      result.stats.productsCreated = importResult.created;
      result.stats.productsUpdated = importResult.updated;
    } else {
      result.errors.push(`Error durante la importación: ${importResult.message}`);
    }

    // Revalidar rutas relacionadas
    revalidatePath('/dashboard/configuration/products');
    revalidatePath('/dashboard/products');

    return result;

  } catch (error) {
    console.error('❌ Error durante la transferencia:', error);
    result.errors.push(`Error durante la transferencia: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    return result;
  }
}

// Función principal para sincronizar productos desde Odoo
export async function syncProductsFromOdoo(includeImages: boolean = true): Promise<OdooSyncResult> {
  const result: OdooSyncResult = {
    success: false,
    message: '',
    stats: {
      productsTotal: 0,
      productsCreated: 0,
      productsUpdated: 0,
      productsErrors: 0,
      imagesDownloaded: 0,
      categoriesCreated: 0,
      suppliersCreated: 0,
    },
    errors: [],
    warnings: []
  };

  try {
    console.log('🚀 Iniciando sincronización con Odoo...');

    // 1. Obtener productos desde Odoo
    const odooResponse = await getOdooProducts();
    if (!odooResponse.success || !odooResponse.data) {
      result.errors.push(odooResponse.error || 'Error al obtener productos de Odoo');
      return result;
    }

    const odooProducts = odooResponse.data;
    result.stats.productsTotal = odooProducts.length;

    console.log(`📦 Procesando ${odooProducts.length} productos de Odoo...`);

    // 2. Convertir productos al formato interno
    const importData: ProductImportData[] = [];
    
    for (const odooProduct of odooProducts) {
      try {
        let downloadedImage: string | null = null;

        // 3. Descargar imagen si está habilitado
        if (includeImages && odooProduct.image_url) {
          downloadedImage = await downloadOdooImage(odooProduct.image_url, odooProduct.name);
          if (downloadedImage) {
            result.stats.imagesDownloaded++;
          }
        }

        // 4. Mapear producto
        const mappedProduct = mapOdooProductToImportData(odooProduct, downloadedImage);
        importData.push(mappedProduct);

      } catch (error) {
        console.error(`❌ Error procesando producto ${odooProduct.name}:`, error);
        result.errors.push(`Error procesando producto ${odooProduct.name}: ${error}`);
        result.stats.productsErrors++;
      }
    }

    console.log(`🔄 Importando ${importData.length} productos al sistema local...`);

    // 5. Importar productos usando la función existente
    const importResult = await importProducts(importData, false);

    // 6. Actualizar estadísticas
    result.success = importResult.success;
    result.message = importResult.message;
    result.stats.productsCreated = importResult.stats.created;
    result.stats.productsUpdated = importResult.stats.updated;
    result.stats.productsErrors += importResult.stats.errors;
    result.errors.push(...importResult.errors);

    // 7. Revalidar páginas relacionadas
    revalidatePath('/dashboard/products');
    revalidatePath('/dashboard/configuration/products');

    console.log('✅ Sincronización completada:', result.stats);

    if (result.success) {
      result.message = `Sincronización exitosa: ${result.stats.productsCreated} productos creados, ${result.stats.productsUpdated} actualizados, ${result.stats.imagesDownloaded} imágenes descargadas`;
    }

    return result;

  } catch (error) {
    console.error('❌ Error durante la sincronización:', error);
    result.errors.push(`Error durante la sincronización: ${error}`);
    result.message = 'Error durante la sincronización con Odoo';
    return result;
  }
}

// Función para verificar la conexión con Odoo
export async function testOdooConnection(): Promise<{ success: boolean; message: string; productCount?: number }> {
  try {
    console.log('🔍 Verificando conexión con Odoo...');
    
    const response = await fetch(`${DEFAULT_ODOO_CONFIG.baseUrl}/api/productos`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Error de conexión: ${response.status} ${response.statusText}`
      };
    }

    const products = await response.json();
    
    return {
      success: true,
      message: 'Conexión exitosa con Odoo',
      productCount: Array.isArray(products) ? products.length : 0
    };

  } catch (error) {
    console.error('❌ Error al verificar conexión:', error);
    return {
      success: false,
      message: `Error de conexión: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }
}

// Función para obtener estadísticas de productos en Odoo
export async function getOdooStats(): Promise<{ success: boolean; stats?: any; error?: string }> {
  try {
    const response = await getOdooProducts();
    if (!response.success || !response.data) {
      return { success: false, error: response.error };
    }

    const products = response.data;
    const stats = {
      total: products.length,
      active: products.filter(p => p.active).length,
      withStock: products.filter(p => p.qty_available > 0).length,
      withImages: products.filter(p => p.image_url).length,
      byType: {
        product: products.filter(p => p.type === 'product').length,
        consu: products.filter(p => p.type === 'consu').length,
        service: products.filter(p => p.type === 'service').length,
      },
      totalValue: products.reduce((sum, p) => sum + (p.lst_price * p.qty_available), 0),
      categories: [...new Set(products.map(p => p.categ_id[1]).filter(Boolean))].length
    };

    return { success: true, stats };
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}

// Función para verificar el estado de múltiples URLs de Odoo
export async function checkOdooAvailability(): Promise<{ 
  success: boolean; 
  workingUrl?: string; 
  results: Array<{url: string, available: boolean, responseTime: number}> 
}> {
  const urlsToTest = [
    'https://ranco35-hotelspatermasllifen4-prueba10-21690156.dev.odoo.com',
    'https://ranco35-hotelspatermasllifen4-staging-productos-api-21685451.dev.odoo.com',
    'https://ranco35-hotelspatermasllifen4-produccion-21690157.dev.odoo.com',
  ];

  const results = [];
  let workingUrl: string | undefined;

  for (const url of urlsToTest) {
    const startTime = Date.now();
    try {
      const response = await fetch(`${url}/api/productos`, {
        method: 'POST', // Odoo type='json' requiere POST
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({}), // Enviar JSON vacío
        cache: 'no-store',
        signal: AbortSignal.timeout(10000), // 10 segundos timeout
      });

      const responseTime = Date.now() - startTime;
      const available = response.ok;
      
      results.push({ url, available, responseTime });
      
      if (available && !workingUrl) {
        workingUrl = url;
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      results.push({ url, available: false, responseTime });
    }
  }

  return {
    success: !!workingUrl,
    workingUrl,
    results
  };
}

// Función mejorada para obtener productos con reintentos y URLs múltiples
export async function getOdooProductsWithRetry(): Promise<{ success: boolean; data?: OdooProduct[]; error?: string; urlUsed?: string }> {
  console.log('🔄 Verificando disponibilidad de instancias Odoo...');
  
  const availability = await checkOdooAvailability();
  
  if (!availability.success) {
    console.log('❌ Ninguna instancia de Odoo está disponible actualmente');
    console.log('📊 Estado de las instancias:', availability.results);
    
    return { 
      success: false, 
      error: 'Ninguna instancia de Odoo está disponible. Intenta más tarde.' 
    };
  }

  console.log(`✅ Instancia disponible encontrada: ${availability.workingUrl}`);
  
  // Usar la URL que funciona
  try {
    const response = await fetch(`${availability.workingUrl}/api/productos`, {
      method: 'POST', // Odoo type='json' requiere POST
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({}), // Enviar JSON vacío
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Error al conectar con Odoo: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    // La API de Odoo devuelve {productos: [...]} no directamente [...]
    const products = responseData.productos || responseData;
    console.log(`✅ Obtenidos ${Array.isArray(products) ? products.length : 0} productos desde ${availability.workingUrl}`);

    return { 
      success: true, 
      data: products, 
      urlUsed: availability.workingUrl 
    };
  } catch (error) {
    console.error('❌ Error al obtener productos de Odoo:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al conectar con Odoo' 
    };
  }
}

// Función mejorada para obtener categorías con reintentos
export async function getOdooCategoriesWithRetry(): Promise<{ success: boolean; data?: OdooCategory[]; error?: string; urlUsed?: string }> {
  console.log('🔄 Verificando disponibilidad de instancias Odoo para categorías...');
  
  const availability = await checkOdooAvailability();
  
  if (!availability.success) {
    return { 
      success: false, 
      error: 'Ninguna instancia de Odoo está disponible. Intenta más tarde.' 
    };
  }

  try {
    const response = await fetch(`${availability.workingUrl}/api/categorias`, {
      method: 'POST', // Odoo type='json' requiere POST
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({}), // Enviar JSON vacío
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Error al conectar con Odoo: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    // La API de Odoo puede devolver {categorias: [...]} o directamente [...]
    const categories = responseData.categorias || responseData.productos || responseData;
    console.log(`✅ Obtenidas ${Array.isArray(categories) ? categories.length : 0} categorías desde ${availability.workingUrl}`);

    return { 
      success: true, 
      data: categories, 
      urlUsed: availability.workingUrl 
    };
  } catch (error) {
    console.error('❌ Error al obtener categorías de Odoo:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al conectar con Odoo' 
    };
  }
}

// Función mejorada para obtener productos por categoría con reintentos
export async function getOdooProductsByCategoryWithRetry(categoryId: number): Promise<{ success: boolean; data?: OdooProduct[]; error?: string; urlUsed?: string }> {
  console.log(`🔄 Verificando disponibilidad de instancias Odoo para categoría ${categoryId}...`);
  
  const availability = await checkOdooAvailability();
  
  if (!availability.success) {
    return { 
      success: false, 
      error: 'Ninguna instancia de Odoo está disponible. Intenta más tarde.' 
    };
  }

  try {
    const response = await fetch(`${availability.workingUrl}/api/productos/categoria/${categoryId}`, {
      method: 'POST', // Odoo type='json' requiere POST
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({ categoria_id: categoryId }), // Enviar el ID de categoría en el body
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Error al conectar con Odoo: ${response.status} ${response.statusText}`);
    }

    const responseData = await response.json();
    // La API de Odoo puede devolver {productos: [...]} o directamente [...]
    const products = responseData.productos || responseData;
    console.log(`✅ Obtenidos ${Array.isArray(products) ? products.length : 0} productos de categoría ${categoryId} desde ${availability.workingUrl}`);

    return { 
      success: true, 
      data: products, 
      urlUsed: availability.workingUrl 
    };
  } catch (error) {
    console.error('❌ Error al obtener productos por categoría de Odoo:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al conectar con Odoo' 
    };
  }
} 