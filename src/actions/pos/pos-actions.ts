'use server'

import { getSupabaseServerClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ===============================
// TYPES AND SCHEMAS
// ===============================

const POSProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sku: z.string().optional(),
  price: z.number().min(0),
  cost: z.number().min(0).optional(),
  image: z.string().optional(),
  categoryId: z.number(),
  productId: z.number().optional(),
  stockRequired: z.boolean().default(false),
  sortOrder: z.number().default(0)
})

const POSSaleSchema = z.object({
  sessionId: z.number(),
  customerName: z.string().optional(),
  customerDocument: z.string().optional(),
  tableNumber: z.string().optional(),
  roomNumber: z.string().optional(),
  subtotal: z.number(),
  taxAmount: z.number().default(0),
  discountAmount: z.number().default(0),
  discountReason: z.string().optional(),
  total: z.number(),
  paymentMethod: z.enum(['cash', 'card', 'transfer', 'other']),
  cashReceived: z.number().optional(),
  change: z.number().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.number(),
    productName: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number(),
    total: z.number(),
    notes: z.string().optional()
  }))
})

export interface CashRegisterType {
  id: number
  name: string
  displayName: string
  description?: string
  isActive: boolean
}

export interface POSProduct {
  id: number
  name: string
  description?: string
  sku?: string
  price: number
  cost?: number
  image?: string
  categoryId: number
  category?: {
    name: string
    displayName: string
    icon?: string
    color?: string
  }
  productId?: number
  isActive: boolean
  stockRequired: boolean
  sortOrder: number
}

export interface POSSale {
  id: number
  sessionId: number
  saleNumber: string
  customerName?: string
  customerDocument?: string
  tableNumber?: string
  roomNumber?: string
  subtotal: number
  taxAmount: number
  discountAmount: number
  discountReason?: string
  total: number
  paymentMethod: string
  cashReceived?: number
  change?: number
  status: string
  notes?: string
  createdAt: string
  updatedAt: string
  date?: string // Campo mapeado desde createdAt para compatibilidad con frontend
  location?: string // Campo mapeado desde tableNumber/roomNumber para compatibilidad con frontend
  items?: POSSaleItem[]
}

export interface POSSaleItem {
  id: number
  saleId: number
  productId: number
  productName: string
  quantity: number
  unitPrice: number
  total: number
  notes?: string
}

export interface POSTable {
  id: number
  number: string
  name?: string
  capacity?: number
  status: 'available' | 'occupied' | 'reserved' | 'cleaning'
  currentSaleId?: number
  isActive: boolean
}

// ===============================
// CASH REGISTER TYPES
// ===============================

export async function getCashRegisterTypes(): Promise<{ success: boolean; data?: CashRegisterType[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    
    const { data, error } = await supabase
      .from('CashRegisterType')
      .select('*')
      .eq('isActive', true)
      .order('id')
    
    if (error) {
      console.error('Error fetching cash register types:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error in getCashRegisterTypes:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

export async function getCashRegisters(typeId?: number): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    
    let query = supabase
      .from('CashRegister')
      .select('*, typeId:CashRegisterType(*)')
      .eq('isActive', true)
    
    if (typeId) {
      query = query.eq('typeId', typeId)
    }
    
    const { data, error } = await query.order('id')
    
    if (error) {
      console.error('Error fetching cash registers:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error in getCashRegisters:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

// ===============================
// POS SESSIONS
// ===============================

export async function getCurrentPOSSession(registerTypeId: number): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' }
    }
    
    const { data, error } = await supabase
      .from('CashSession')
      .select('*')
      .eq('userId', user.id)
      .eq('cashRegisterTypeId', registerTypeId)
      .eq('status', 'open')
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching current POS session:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, data: data || null }
  } catch (error) {
    console.error('Error in getCurrentPOSSession:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

export async function createPOSSession(registerTypeId: number, initialAmount: number): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' }
    }
    
    // Verificar que no hay sesión activa
    const currentSessionResult = await getCurrentPOSSession(registerTypeId)
    if (currentSessionResult.data) {
      return { success: false, error: 'Ya existe una sesión activa para este tipo de caja' }
    }
    
    const { data, error } = await supabase
      .from('CashSession')
      .insert({
        userId: user.id,
        cashRegisterTypeId: registerTypeId,
        openingAmount: initialAmount,
        currentAmount: initialAmount,
        status: 'open'
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating POS session:', error)
      return { success: false, error: error.message }
    }
    
    revalidatePath('/dashboard/pos')
    return { success: true, data }
  } catch (error) {
    console.error('Error in createPOSSession:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

// ===============================
// POS PRODUCTS
// ===============================

export async function getPOSProductsByType(registerTypeId: number): Promise<{ success: boolean; data?: POSProduct[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    
    // Primero obtenemos las categorías del tipo de POS
    const { data: categories, error: categoriesError } = await supabase
      .from('POSProductCategory')
      .select('id')
      .eq('cashRegisterTypeId', registerTypeId)
      .eq('isActive', true)
    
    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError)
      return { success: false, error: categoriesError.message }
    }
    
    const categoryIds = categories?.map(cat => cat.id) || []
    
    if (categoryIds.length === 0) {
      return { success: true, data: [] }
    }
    
    // Obtener productos POS que estén vinculados a productos habilitados para POS
    // CORREGIDO: Cargar precios actualizados desde Product
    const { data, error } = await supabase
      .from('POSProduct')
      .select(`
        *,
        category:POSProductCategory(
          name,
          displayName,
          icon,
          color
        ),
        product:Product(
          id,
          name,
          isPOSEnabled,
          saleprice,
          vat,
          "finalPrice"
        )
      `)
      .eq('isActive', true)
      .in('categoryId', categoryIds)
      .not('productId', 'is', null) // Solo productos vinculados a Product
      .order('sortOrder')
    
    if (error) {
      console.error('Error fetching POS products:', error)
      return { success: false, error: error.message }
    }
    
    // Filtrar solo productos que estén habilitados para POS
    const filteredData = data?.filter(posProduct => 
      posProduct.product && posProduct.product.isPOSEnabled === true
    ) || []
    
    // CORREGIDO: Usar precios finales congelados (YA incluyen IVA)
    const productsWithUpdatedPrices = filteredData.map(posProduct => {
      const product = posProduct.product;
      
      // Los precios finales congelados YA incluyen IVA, usarlos directamente
      let finalPrice = posProduct.price; // Precio por defecto de POSProduct
      let priceSource = 'POSProduct';
      
      if (product && product.finalPrice) {
        // PRIORIDAD 1: Precio final congelado (YA incluye IVA)
        finalPrice = product.finalPrice;
        priceSource = 'finalPrice';
      } else if (product && product.saleprice) {
        // PRIORIDAD 2: Calcular desde precio neto si no hay precio congelado
        const vatRate = product.vat || 19;
        finalPrice = Math.round(product.saleprice * (1 + vatRate / 100));
        priceSource = 'calculated';
      }
      
      // Log para verificar precios
      if (posProduct.name?.includes('Almuerzo')) {
        console.log(`🔍 DEBUG Precio - ${posProduct.name}:`, {
          originalPOSPrice: posProduct.price,
          productSalePrice: product?.saleprice,
          productFinalPrice: product?.finalPrice,
          finalPriceUsed: finalPrice,
          priceSource,
          productVat: product?.vat
        });
      }
      
      return {
        ...posProduct,
        price: finalPrice, // Usar precio final (YA con IVA incluido)
        originalPrice: posProduct.price, // Guardar precio original para referencia
        hasFinalPrice: !!product?.finalPrice, // Indicar si usa precio congelado
        priceSource // Para debugging
      };
    });
    
    return { success: true, data: productsWithUpdatedPrices }
  } catch (error) {
    console.error('Error in getPOSProductsByType:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

export async function getPOSProductCategories(registerTypeId: number): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    
    const { data, error } = await supabase
      .from('POSProductCategory')
      .select('*')
      .eq('cashRegisterTypeId', registerTypeId)
      .eq('isActive', true)
      .order('sortOrder')
    
    if (error) {
      console.error('Error fetching POS categories:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error in getPOSProductCategories:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

// ===============================
// SINCRONIZACIÓN DE PRODUCTOS POS
// ===============================

/**
 * Sincroniza productos habilitados para POS con la tabla POSProduct
 * Esta función crea registros en POSProduct para productos que están habilitados para POS
 * pero que no tienen un registro correspondiente en POSProduct
 * ACTUALIZADO: Sincroniza productos en AMBOS tipos de POS (Recepción y Restaurante)
 */
export async function syncPOSProducts(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log('🔄 Iniciando sincronización de productos POS...')
    const supabase = await getSupabaseServerClient()
    
    // Obtener productos habilitados para POS que no tienen registro en POSProduct
    console.log('🔍 Buscando productos habilitados para POS...')
    // Primero obtener los IDs de productos que ya están en POSProduct
    const { data: existingPosProductIds, error: existingError } = await supabase
      .from('POSProduct')
      .select('productId')
      .not('productId', 'is', null)
    
    if (existingError) {
      console.error('❌ Error fetching existing POS products:', existingError)
      return { success: false, error: existingError.message }
    }
    
    const existingIds = existingPosProductIds?.map(p => p.productId) || []
    
    // Luego obtener productos habilitados para POS que no están en POSProduct
    const { data: productsToSync, error: productsError } = await supabase
      .from('Product')
      .select(`
        id,
        name,
        description,
        sku,
        saleprice,
        "finalPrice",
        costprice,
        image,
        categoryid,
        isPOSEnabled
      `)
      .eq('isPOSEnabled', true)
      .not('id', 'in', `(${existingIds.length > 0 ? existingIds.join(',') : '0'})`)
    
    if (productsError) {
      console.error('❌ Error fetching products to sync:', productsError)
      return { success: false, error: productsError.message }
    }
    
    console.log(`📊 Productos encontrados para sincronizar: ${productsToSync?.length || 0}`)
    if (productsToSync && productsToSync.length > 0) {
      console.log('📋 Productos a sincronizar:', productsToSync.map(p => ({ id: p.id, name: p.name })))
    }
    
    if (!productsToSync || productsToSync.length === 0) {
      console.log('ℹ️ No hay productos para sincronizar')
      return { success: true, data: { message: 'No hay productos para sincronizar' } }
    }
    
    // Obtener categorías por defecto para cada tipo de POS
    console.log('🔍 Buscando categorías por defecto para ambos tipos de POS...')
    
    // Categoría por defecto para Recepción (cashRegisterTypeId = 1)
    const { data: receptionCategory, error: receptionError } = await supabase
      .from('POSProductCategory')
      .select('id')
      .eq('isActive', true)
      .eq('cashRegisterTypeId', 1) // Recepción
      .order('sortOrder')
      .limit(1)
      .single()
    
    // Categoría por defecto para Restaurante (cashRegisterTypeId = 2)
    const { data: restaurantCategory, error: restaurantError } = await supabase
      .from('POSProductCategory')
      .select('id')
      .eq('isActive', true)
      .eq('cashRegisterTypeId', 2) // Restaurante
      .order('sortOrder')
      .limit(1)
      .single()
    
    if (receptionError && restaurantError) {
      console.error('❌ Error fetching default POS categories:', { receptionError, restaurantError })
      return { success: false, error: 'No se encontraron categorías por defecto para ningún tipo de POS' }
    }
    
    const posProductsToCreate = []
    
    // Para cada producto, crear registros en POSProduct para ambos tipos de POS si tienen categorías disponibles
    for (const product of productsToSync) {
      console.log(`📝 Preparando producto "${product.name}" para sincronización...`)
      
      // Agregar a Recepción si tiene categoría
      if (receptionCategory) {
        console.log(`  ✅ Agregando a Recepción (categoría ID: ${receptionCategory.id})`)
        posProductsToCreate.push({
          name: product.name,
          description: product.description,
          sku: product.sku ? `${product.sku}-REC` : `PROD-${product.id}-REC`, // SKU único para Recepción
          price: Math.round(product.finalPrice || product.saleprice || 0), // USAR PRECIO FINAL CONGELADO SI ESTÁ DISPONIBLE
          cost: Math.round(product.costprice || 0), // CORREGIDO: Redondear costo también
          image: product.image,
          categoryId: receptionCategory.id,
          productId: product.id,
          isActive: true,
          stockRequired: false,
          sortOrder: 0
        })
      }
      
      // Agregar a Restaurante si tiene categoría
      if (restaurantCategory) {
        console.log(`  ✅ Agregando a Restaurante (categoría ID: ${restaurantCategory.id})`)
        posProductsToCreate.push({
          name: product.name,
          description: product.description,
          sku: product.sku ? `${product.sku}-REST` : `PROD-${product.id}-REST`, // SKU único para Restaurante
          price: Math.round(product.finalPrice || product.saleprice || 0), // USAR PRECIO FINAL CONGELADO SI ESTÁ DISPONIBLE
          cost: Math.round(product.costprice || 0), // CORREGIDO: Redondear costo también
          image: product.image,
          categoryId: restaurantCategory.id,
          productId: product.id,
          isActive: true,
          stockRequired: false,
          sortOrder: 0
        })
      }
    }
    
    if (posProductsToCreate.length === 0) {
      console.log('⚠️ No se pueden crear productos POS: sin categorías disponibles')
      return { success: false, error: 'No hay categorías por defecto disponibles para sincronizar productos' }
    }
    
    console.log(`💾 Insertando ${posProductsToCreate.length} registros en POSProduct (${productsToSync.length} productos × tipos de POS)...`)
    const { data: createdProducts, error: createError } = await supabase
      .from('POSProduct')
      .insert(posProductsToCreate)
      .select()
    
    if (createError) {
      console.error('❌ Error creating POS products:', createError)
      return { success: false, error: createError.message }
    }
    
    const receptionCount = receptionCategory ? productsToSync.length : 0
    const restaurantCount = restaurantCategory ? productsToSync.length : 0
    
    console.log(`✅ Sincronización completada: ${createdProducts?.length || 0} registros creados`)
    console.log(`📊 Distribución: ${receptionCount} productos en Recepción, ${restaurantCount} productos en Restaurante`)
    
    return { 
      success: true, 
      data: { 
        message: `Se sincronizaron ${productsToSync.length} productos: ${receptionCount} en Recepción y ${restaurantCount} en Restaurante`,
        products: createdProducts,
        receptionCount,
        restaurantCount,
        totalProducts: productsToSync.length,
        totalRecords: createdProducts?.length || 0
      } 
    }
  } catch (error) {
    console.error('Error in syncPOSProducts:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Función de depuración para verificar el estado de sincronización POS
 * ACTUALIZADA: Incluye información sobre sincronización dual (Recepción + Restaurante)
 */
export async function debugPOSSync(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log('🔍 DEBUG - Iniciando depuración de sincronización POS dual...');
    const supabase = await getSupabaseServerClient()
    
    // 1. Verificar productos habilitados para POS
    console.log('🔍 Verificando productos habilitados para POS...');
    const { data: enabledProducts, error: enabledError } = await supabase
      .from('Product')
      .select('id, name, isPOSEnabled')
      .eq('isPOSEnabled', true)
    
    if (enabledError) {
      console.error('❌ Error contando productos habilitados:', enabledError);
      return { success: false, error: enabledError.message }
    }
    
    console.log(`📊 Productos habilitados para POS: ${enabledProducts?.length || 0}`);
    if (enabledProducts && enabledProducts.length > 0) {
      console.log('📋 Productos habilitados:', enabledProducts.map(p => ({ id: p.id, name: p.name })));
    }
    
    // 2. Verificar categorías POS por tipo
    console.log('🔍 Verificando categorías POS por tipo...');
    const { data: allCategories, error: categoriesError } = await supabase
      .from('POSProductCategory')
      .select('id, name, displayName, cashRegisterTypeId, isActive')
      .eq('isActive', true)
      .order('cashRegisterTypeId')
      .order('sortOrder')
    
    if (categoriesError) {
      console.error('❌ Error obteniendo categorías POS:', categoriesError);
    } else {
      const receptionCategories = allCategories?.filter(c => c.cashRegisterTypeId === 1) || []
      const restaurantCategories = allCategories?.filter(c => c.cashRegisterTypeId === 2) || []
      
      console.log(`📊 Categorías POS - Total: ${allCategories?.length || 0}`);
      console.log(`  🏨 Recepción (ID 1): ${receptionCategories.length} categorías`);
      if (receptionCategories.length > 0) {
        console.log('    Categorías:', receptionCategories.map(c => ({ id: c.id, name: c.displayName })));
      }
      console.log(`  🍽️ Restaurante (ID 2): ${restaurantCategories.length} categorías`);
      if (restaurantCategories.length > 0) {
        console.log('    Categorías:', restaurantCategories.map(c => ({ id: c.id, name: c.displayName })));
      }
    }
    
    // 3. Verificar productos en POSProduct por tipo
    console.log('🔍 Verificando productos en POSProduct por tipo...');
    const { data: posProducts, error: posError } = await supabase
      .from('POSProduct')
      .select(`
        id, name, productId, isActive, categoryId,
        category:POSProductCategory(
          id, displayName, cashRegisterTypeId
        )
      `)
      .eq('isActive', true)
      .not('productId', 'is', null)
    
    if (posError) {
      console.error('❌ Error contando productos POS:', posError);
    } else {
      const receptionPosProducts = posProducts?.filter(p => p.category?.cashRegisterTypeId === 1) || []
      const restaurantPosProducts = posProducts?.filter(p => p.category?.cashRegisterTypeId === 2) || []
      
      console.log(`📊 Productos sincronizados - Total: ${posProducts?.length || 0}`);
      console.log(`  🏨 En Recepción: ${receptionPosProducts.length} productos`);
      if (receptionPosProducts.length > 0) {
        console.log('    Productos:', receptionPosProducts.map(p => ({ 
          posId: p.id, 
          name: p.name, 
          productId: p.productId,
          categoryId: p.categoryId 
        })));
      }
      console.log(`  🍽️ En Restaurante: ${restaurantPosProducts.length} productos`);
      if (restaurantPosProducts.length > 0) {
        console.log('    Productos:', restaurantPosProducts.map(p => ({ 
          posId: p.id, 
          name: p.name, 
          productId: p.productId,
          categoryId: p.categoryId 
        })));
      }
    }
    
    // 4. Análisis de productos sincronizados vs habilitados
    console.log('🔍 Analizando estado de sincronización...');
    const uniqueProductIds = new Set(posProducts?.map(p => p.productId) || [])
    const syncedProducts = uniqueProductIds.size
    const pendingSync = (enabledProducts?.length || 0) - syncedProducts
    
    console.log(`📊 Análisis de sincronización:`);
    console.log(`  ✅ Productos únicos sincronizados: ${syncedProducts}`);
    console.log(`  ⏳ Productos pendientes: ${pendingSync}`);
    
    if (pendingSync > 0) {
      console.log('⚠️ Hay productos que necesitan sincronización automática');
      const enabledIds = enabledProducts?.map(p => p.id) || []
      const syncedIds = Array.from(uniqueProductIds)
      const pendingIds = enabledIds.filter(id => !syncedIds.includes(id))
      const pendingProductNames = enabledProducts?.filter(p => pendingIds.includes(p.id)).map(p => p.name) || []
      console.log('📋 Productos pendientes:', pendingProductNames);
    }
    
    // 5. Verificar duplicados por producto
    console.log('🔍 Verificando duplicados por producto...');
    const duplicates = []
    if (posProducts) {
      const productGroups = posProducts.reduce((groups, product) => {
        const productId = product.productId
        if (!groups[productId]) {
          groups[productId] = []
        }
        groups[productId].push(product)
        return groups
      }, {} as Record<number, any[]>)
      
      for (const [productId, products] of Object.entries(productGroups)) {
        if (products.length > 1) {
          const types = products.map(p => {
            const typeId = p.category?.cashRegisterTypeId
            return typeId === 1 ? 'Recepción' : typeId === 2 ? 'Restaurante' : 'Desconocido'
          })
          duplicates.push({
            productId: parseInt(productId),
            productName: products[0].name,
            count: products.length,
            types: types,
            posIds: products.map(p => p.id)
          })
        }
      }
    }
    
    console.log(`📊 Productos con múltiples registros POS: ${duplicates.length}`);
    if (duplicates.length > 0) {
      console.log('📋 Duplicados encontrados:', duplicates);
    }
    
    return {
      success: true,
      data: {
        enabledProducts: enabledProducts?.length || 0,
        totalPosProducts: posProducts?.length || 0,
        syncedUniqueProducts: syncedProducts,
        pendingSync,
        receptionProducts: posProducts?.filter(p => p.category?.cashRegisterTypeId === 1).length || 0,
        restaurantProducts: posProducts?.filter(p => p.category?.cashRegisterTypeId === 2).length || 0,
        receptionCategories: allCategories?.filter(c => c.cashRegisterTypeId === 1).length || 0,
        restaurantCategories: allCategories?.filter(c => c.cashRegisterTypeId === 2).length || 0,
        duplicates: duplicates.length,
        enabledProductsList: enabledProducts || [],
        posProductsList: posProducts || [],
        duplicatesList: duplicates
      }
    }
  } catch (error) {
    console.error('❌ Error en debugPOSSync:', error);
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Obtiene estadísticas de sincronización de productos POS
 */
export async function getPOSSyncStats(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    
    // Contar productos habilitados para POS
    const { count: enabledProducts, error: enabledError } = await supabase
      .from('Product')
      .select('*', { count: 'exact', head: true })
      .eq('isPOSEnabled', true)
    
    if (enabledError) {
      console.error('Error counting enabled products:', enabledError)
      return { success: false, error: enabledError.message }
    }
    
    // Contar productos en POSProduct
    const { count: posProducts, error: posError } = await supabase
      .from('POSProduct')
      .select('*', { count: 'exact', head: true })
      .eq('isActive', true)
    
    if (posError) {
      console.error('Error counting POS products:', posError)
      return { success: false, error: posError.message }
    }
    
    // Contar productos sincronizados (con productId)
    const { count: syncedProducts, error: syncedError } = await supabase
      .from('POSProduct')
      .select('*', { count: 'exact', head: true })
      .not('productId', 'is', null)
      .eq('isActive', true)
    
    if (syncedError) {
      console.error('Error counting synced products:', syncedError)
      return { success: false, error: syncedError.message }
    }
    
    return {
      success: true,
      data: {
        enabledProducts: enabledProducts || 0,
        posProducts: posProducts || 0,
        syncedProducts: syncedProducts || 0,
        pendingSync: (enabledProducts || 0) - (syncedProducts || 0)
      }
    }
  } catch (error) {
    console.error('Error in getPOSSyncStats:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

// ===============================
// POS SALES
// ===============================

export async function createPOSSale(saleData: z.infer<typeof POSSaleSchema>): Promise<{ success: boolean; data?: POSSale; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' }
    }
    
    // Validar datos
    const validatedData = POSSaleSchema.parse(saleData)
    
    // Verificar que la sesión existe y es activa
    const { data: session, error: sessionError } = await supabase
      .from('CashSession')
      .select('*, cashRegisterTypeId')
      .eq('id', validatedData.sessionId)
      .eq('isActive', true)
      .single()
    
    if (sessionError || !session) {
      return { success: false, error: 'Sesión de caja no válida' }
    }
    
    // Generar número de venta
    const { data: saleNumber, error: numberError } = await supabase
      .rpc('generate_sale_number', { register_type_id: session.cashRegisterTypeId })
    
    if (numberError) {
      console.error('Error generating sale number:', numberError)
      return { success: false, error: 'Error generando número de venta' }
    }
    
    // Crear la venta
    const { data: sale, error: saleError } = await supabase
      .from('POSSale')
      .insert({
        sessionId: validatedData.sessionId,
        saleNumber,
        customerName: validatedData.customerName,
        customerDocument: validatedData.customerDocument,
        tableNumber: validatedData.tableNumber,
        roomNumber: validatedData.roomNumber,
        subtotal: validatedData.subtotal,
        taxAmount: validatedData.taxAmount,
        discountAmount: validatedData.discountAmount,
        discountReason: validatedData.discountReason,
        total: validatedData.total,
        paymentMethod: validatedData.paymentMethod,
        cashReceived: validatedData.cashReceived,
        change: validatedData.change,
        notes: validatedData.notes
      })
      .select()
      .single()
    
    if (saleError) {
      console.error('Error creating sale:', saleError)
      return { success: false, error: saleError.message }
    }
    
    // Crear los items de la venta
    const itemsData = validatedData.items.map(item => ({
      saleId: sale.id,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
      notes: item.notes
    }))
    
    const { error: itemsError } = await supabase
      .from('POSSaleItem')
      .insert(itemsData)
    
    if (itemsError) {
      console.error('Error creating sale items:', itemsError)
      return { success: false, error: itemsError.message }
    }
    
    // Actualizar el monto actual de la sesión (solo si es efectivo)
    if (validatedData.paymentMethod === 'cash') {
      const { error: updateError } = await supabase
        .from('CashSession')
        .update({
          currentAmount: session.currentAmount + validatedData.total
        })
        .eq('id', validatedData.sessionId)
      
      if (updateError) {
        console.error('Error updating session amount:', updateError)
      }
    }
    
    revalidatePath('/dashboard/pos')
    return { success: true, data: sale }
  } catch (error) {
    console.error('Error in createPOSSale:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

export async function getPOSSales(sessionId: number): Promise<{ success: boolean; data?: POSSale[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    
    const { data, error } = await supabase
      .from('POSSale')
      .select(`
        *,
        items:POSSaleItem(*)
      `)
      .eq('sessionId', sessionId)
      .order('createdAt', { ascending: false })
    
    if (error) {
      console.error('Error fetching POS sales:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error in getPOSSales:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

// Función para obtener todas las ventas del POS con filtros
export async function getAllPOSSales(filters: {
  registerTypeId?: number;
  dateFrom?: string;
  dateTo?: string;
  paymentMethod?: string;
  status?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<{ success: boolean; data?: POSSale[]; error?: string; total?: number }> {
  try {
    console.log('🔍 Filtros recibidos en getAllPOSSales:', filters)
    const supabase = await getSupabaseServerClient()
    
    let query = supabase
      .from('POSSale')
      .select(`
        *,
        items:POSSaleItem(*),
        session:CashSession!inner(cashRegisterTypeId, id, sessionNumber)
      `, { count: 'exact' })
    
    // Aplicar filtros
    if (filters.registerTypeId) {
      query = query.eq('session.cashRegisterTypeId', filters.registerTypeId)
    }
    
    if (filters.dateFrom) {
      // Agregar las 00:00:00 al inicio del día
      const dateFromStart = `${filters.dateFrom}T00:00:00.000Z`
      console.log('📅 Filtro dateFrom aplicado:', dateFromStart)
      query = query.gte('createdAt', dateFromStart)
    }
    
    if (filters.dateTo) {
      // Agregar las 23:59:59 al final del día para incluir todo el día
      const dateToEnd = `${filters.dateTo}T23:59:59.999Z`
      console.log('📅 Filtro dateTo aplicado:', dateToEnd)
      query = query.lte('createdAt', dateToEnd)
    }
    
    if (filters.paymentMethod) {
      query = query.eq('paymentMethod', filters.paymentMethod)
    }
    
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    
    // Paginación
    const limit = filters.limit || 50
    const offset = filters.offset || 0
    
    query = query
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1)
    
    const { data, error, count } = await query
    
    console.log('📊 Resultados de consulta POS:', { 
      totalRegistros: count, 
      registrosEnPagina: data?.length,
      primeraVenta: data?.[0]?.createdAt,
      ultimaVenta: data?.[data.length - 1]?.createdAt
    })
    
    if (error) {
      console.error('Error fetching all POS sales:', error)
      return { success: false, error: error.message }
    }
    
    // Mapear los datos para que sean compatibles con el frontend
    const mappedData = data?.map(sale => ({
      ...sale,
      date: sale.createdAt, // Mapear createdAt a date para compatibilidad con frontend
      customerName: sale.customerName || '',
      location: sale.tableNumber || sale.roomNumber || '-',
      paymentMethod: sale.paymentMethod?.toUpperCase() || 'UNKNOWN',
      status: sale.status || 'PENDIENTE'
    })) || []
    
    return { success: true, data: mappedData, total: count || 0 }
  } catch (error) {
    console.error('Error in getAllPOSSales:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

// Función para obtener una venta específica por ID
export async function getPOSSaleById(saleId: number): Promise<{ success: boolean; data?: POSSale; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    
    const { data, error } = await supabase
      .from('POSSale')
      .select(`
        *,
        items:POSSaleItem(*),
        session:CashSession(cashRegisterTypeId, sessionNumber)
      `)
      .eq('id', saleId)
      .single()
    
    if (error) {
      console.error('Error fetching POS sale by ID:', error)
      return { success: false, error: error.message }
    }
    
    if (!data) {
      return { success: false, error: 'Venta no encontrada' }
    }
    
    // Mapear los datos para compatibilidad con el frontend
    const mappedData = {
      ...data,
      date: data.createdAt,
      customerName: data.customerName || '',
      location: data.tableNumber || data.roomNumber || '-',
      paymentMethod: data.paymentMethod?.toUpperCase() || 'UNKNOWN',
      status: data.status || 'PENDIENTE'
    }
    
    return { success: true, data: mappedData }
  } catch (error) {
    console.error('Error in getPOSSaleById:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

// Función para eliminar ventas masivamente (solo administradores)
export async function deletePOSSalesInBulk(saleIds: number[]): Promise<{ success: boolean; error?: string }> {
  try {
    if (!saleIds || saleIds.length === 0) {
      return { success: false, error: 'No se proporcionaron IDs de ventas para eliminar' }
    }

    const supabase = await getSupabaseServerClient()
    
    // Verificar permisos del usuario actual (en una implementación real)
    // TODO: Agregar verificación de permisos de administrador aquí
    
    // Eliminar items de las ventas primero (por FK constraint)
    const { error: itemsError } = await supabase
      .from('POSSaleItem')
      .delete()
      .in('saleId', saleIds)
    
    if (itemsError) {
      console.error('Error deleting sale items:', itemsError)
      return { success: false, error: 'Error al eliminar los items de las ventas' }
    }
    
    // Eliminar las ventas
    const { error: salesError } = await supabase
      .from('POSSale')
      .delete()
      .in('id', saleIds)
    
    if (salesError) {
      console.error('Error deleting sales:', salesError)
      return { success: false, error: 'Error al eliminar las ventas' }
    }

    console.log(`✅ ${saleIds.length} ventas POS eliminadas correctamente`)
    
    // Revalidar rutas relacionadas
    revalidatePath('/dashboard/pos/sales')
    revalidatePath('/dashboard/pos')
    
    return { success: true }
  } catch (error) {
    console.error('Error in deletePOSSalesInBulk:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

// ===============================
// POS TABLES (RESTAURANT)
// ===============================

export async function getPOSTables(): Promise<{ success: boolean; data?: POSTable[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    
    const { data, error } = await supabase
      .from('POSTable')
      .select('*')
      .eq('isActive', true)
      .order('number')
    
    if (error) {
      console.error('Error fetching POS tables:', error)
      return { success: false, error: error.message }
    }
    
    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error in getPOSTables:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

export async function updateTableStatus(tableId: number, status: string, saleId?: number): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    
    const updateData: any = { status }
    if (saleId !== undefined) {
      updateData.currentSaleId = saleId
    }
    
    const { error } = await supabase
      .from('POSTable')
      .update(updateData)
      .eq('id', tableId)
    
    if (error) {
      console.error('Error updating table status:', error)
      return { success: false, error: error.message }
    }
    
    revalidatePath('/dashboard/pos')
    return { success: true }
  } catch (error) {
    console.error('Error in updateTableStatus:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

// ===============================
// POS STATISTICS
// ===============================

export async function getPOSSessionStats(sessionId: number): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    
    const { data: salesData, error: salesError } = await supabase
      .from('POSSale')
      .select('total, paymentMethod')
      .eq('sessionId', sessionId)
    
    if (salesError) {
      console.error('Error fetching session stats:', salesError)
      return { success: false, error: salesError.message }
    }
    
    const stats = {
      totalSales: salesData?.length || 0,
      totalAmount: salesData?.reduce((sum, sale) => sum + (sale.total || 0), 0) || 0,
      cashSales: salesData?.filter(sale => sale.paymentMethod === 'cash').length || 0,
      cardSales: salesData?.filter(sale => sale.paymentMethod === 'card').length || 0,
      transferSales: salesData?.filter(sale => sale.paymentMethod === 'transfer').length || 0,
      cashAmount: salesData?.filter(sale => sale.paymentMethod === 'cash').reduce((sum, sale) => sum + (sale.total || 0), 0) || 0
    }
    
    return { success: true, data: stats }
  } catch (error) {
    console.error('Error in getPOSSessionStats:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
} 

/**
 * Función de diagnóstico para verificar estado de categorías y productos POS
 */
export async function diagnosePOSIssues(registerTypeId: number): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log('🔍 DIAGNÓSTICO POS - Iniciando análisis...');
    const supabase = await getSupabaseServerClient()
    
    // 1. Verificar categorías POS para este tipo de registro
    console.log(`📋 Verificando categorías POS para registerTypeId: ${registerTypeId}`);
    const { data: allCategories, error: allCategoriesError } = await supabase
      .from('POSProductCategory')
      .select('*')
      .eq('cashRegisterTypeId', registerTypeId)
      .order('sortOrder')
    
    if (allCategoriesError) {
      console.error('❌ Error obteniendo categorías:', allCategoriesError);
      return { success: false, error: allCategoriesError.message }
    }
    
    console.log(`📊 Categorías encontradas: ${allCategories?.length || 0}`);
    console.log('📋 Categorías:', allCategories?.map(c => ({ 
      id: c.id, 
      name: c.name, 
      displayName: c.displayName, 
      isActive: c.isActive 
    })));
    
    // 2. Verificar categorías activas específicamente
    const { data: activeCategories, error: activeCategoriesError } = await supabase
      .from('POSProductCategory')
      .select('*')
      .eq('cashRegisterTypeId', registerTypeId)
      .eq('isActive', true)
      .order('sortOrder')
    
    if (activeCategoriesError) {
      console.error('❌ Error obteniendo categorías activas:', activeCategoriesError);
    } else {
      console.log(`✅ Categorías activas: ${activeCategories?.length || 0}`);
      console.log('📋 Categorías activas:', activeCategories?.map(c => ({ 
        id: c.id, 
        name: c.name, 
        displayName: c.displayName 
      })));
    }
    
    // 3. Verificar productos POS para estas categorías
    const categoryIds = activeCategories?.map(cat => cat.id) || [];
    console.log(`🔍 Buscando productos POS para categoryIds: ${categoryIds}`);
    
    if (categoryIds.length > 0) {
      const { data: posProducts, error: posProductsError } = await supabase
        .from('POSProduct')
        .select(`
          *,
          category:POSProductCategory(
            name,
            displayName,
            icon,
            color
          ),
          product:Product(
            id,
            name,
            isPOSEnabled
          )
        `)
        .in('categoryId', categoryIds)
        .order('sortOrder')
      
      if (posProductsError) {
        console.error('❌ Error obteniendo productos POS:', posProductsError);
      } else {
        console.log(`📦 Productos POS encontrados: ${posProducts?.length || 0}`);
        console.log('📋 Productos POS:', posProducts?.map(p => ({ 
          id: p.id, 
          name: p.name, 
          isActive: p.isActive,
          categoryName: p.category?.name,
          productId: p.productId,
          isPOSEnabled: p.product?.isPOSEnabled
        })));
        
        // 4. Filtrar productos activos y habilitados para POS
        const filteredProducts = posProducts?.filter(posProduct => 
          posProduct.isActive === true &&
          posProduct.product && 
          posProduct.product.isPOSEnabled === true
        ) || [];
        
        console.log(`✅ Productos POS válidos (activos + habilitados): ${filteredProducts.length}`);
        console.log('📋 Productos válidos:', filteredProducts.map(p => ({ 
          id: p.id, 
          name: p.name, 
          categoryName: p.category?.name
        })));
      }
    }
    
    // 5. Verificar productos habilitados para POS que no están en POSProduct
    const { data: enabledProducts, error: enabledProductsError } = await supabase
      .from('Product')
      .select('id, name, isPOSEnabled')
      .eq('isPOSEnabled', true)
    
    if (enabledProductsError) {
      console.error('❌ Error obteniendo productos habilitados para POS:', enabledProductsError);
    } else {
      console.log(`📦 Productos habilitados para POS en Product: ${enabledProducts?.length || 0}`);
      
      // Verificar cuáles están sincronizados
      const { data: syncedProducts, error: syncedError } = await supabase
        .from('POSProduct')
        .select('productId')
        .not('productId', 'is', null)
        .eq('isActive', true)
      
      if (!syncedError) {
        const syncedIds = syncedProducts?.map(p => p.productId) || [];
        const unsyncedProducts = enabledProducts?.filter(p => !syncedIds.includes(p.id)) || [];
        
        console.log(`📊 Productos sincronizados: ${syncedIds.length}`);
        console.log(`⚠️ Productos no sincronizados: ${unsyncedProducts.length}`);
        console.log('📋 Productos no sincronizados:', unsyncedProducts.map(p => ({ 
          id: p.id, 
          name: p.name 
        })));
      }
    }
    
    // 6. Buscar específicamente "Menu Dia"
    const { data: menuDiaCategory, error: menuDiaCategoryError } = await supabase
      .from('POSProductCategory')
      .select('*')
      .ilike('name', '%menu%dia%')
      .or('displayName.ilike.*menu*dia*')
    
    if (menuDiaCategoryError) {
      console.error('❌ Error buscando Menu Dia:', menuDiaCategoryError);
    } else {
      console.log(`🔍 Categorías que contienen "Menu Dia": ${menuDiaCategory?.length || 0}`);
      console.log('📋 Categorías Menu Dia:', menuDiaCategory);
    }
    
    return {
      success: true,
      data: {
        registerTypeId,
        totalCategories: allCategories?.length || 0,
        activeCategories: activeCategories?.length || 0,
        categoryIds,
        enabledProducts: enabledProducts?.length || 0,
        allCategories: allCategories || [],
        activeCategories: activeCategories || [],
        menuDiaCategory: menuDiaCategory || []
      }
    }
  } catch (error) {
    console.error('❌ Error en diagnosePOSIssues:', error);
    return { success: false, error: 'Error interno del servidor' }
  }
} 

/**
 * Función para verificar y corregir el problema específico de "Menu Dia"
 */
export async function fixMenuDiaIssue(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log('🔧 CORRIGIENDO PROBLEMA DE MENU DIA...');
    const supabase = await getSupabaseServerClient()
    
    // 1. Buscar categoría "Menu Dia" específicamente para Recepción
    const { data: menuDiaCategories, error: searchError } = await supabase
      .from('POSProductCategory')
      .select('*')
      .or('name.ilike.*menu*dia*,displayName.ilike.*menu*dia*')
      .eq('cashRegisterTypeId', 1) // Solo para Recepción
    
    if (searchError) {
      console.error('❌ Error buscando Menu Dia:', searchError);
      return { success: false, error: searchError.message }
    }
    
    console.log(`🔍 Categorías encontradas con "Menu Dia" para Recepción: ${menuDiaCategories?.length || 0}`);
    console.log('📋 Categorías encontradas:', menuDiaCategories);
    
    // 2. Si no existe, crear la categoría "Menu Dia" para Recepción
    if (!menuDiaCategories || menuDiaCategories.length === 0) {
      console.log('➕ Creando categoría "Menu Dia" para Recepción...');
      const { data: newCategory, error: createError } = await supabase
        .from('POSProductCategory')
        .insert({
          name: 'menu_dia',
          displayName: 'Menu Dia',
          icon: '🍽️',
          color: '#FF6B6B',
          cashRegisterTypeId: 1, // Recepción
          isActive: true,
          sortOrder: 10
        })
        .select()
        .single()
      
      if (createError) {
        console.error('❌ Error creando categoría Menu Dia:', createError);
        return { success: false, error: createError.message }
      }
      
      console.log('✅ Categoría "Menu Dia" creada:', newCategory);
      return { 
        success: true, 
        data: { 
          action: 'created', 
          category: newCategory,
          message: 'Categoría "Menu Dia" creada exitosamente' 
        } 
      }
    }
    
    // 3. Buscar categoría activa primero
    const activeCategory = menuDiaCategories.find(cat => cat.isActive)
    if (activeCategory) {
      console.log('✅ Categoría "Menu Dia" ya está configurada correctamente');
      return { 
        success: true, 
        data: { 
          action: 'already_correct', 
          category: activeCategory,
          message: 'Categoría "Menu Dia" ya está configurada correctamente' 
        } 
      }
    }
    
    // 4. Si existe pero está inactiva, activarla
    const inactiveCategory = menuDiaCategories.find(cat => !cat.isActive)
    if (inactiveCategory) {
      console.log('🔄 Activando categoría "Menu Dia" inactiva...');
      const { data: updatedCategory, error: updateError } = await supabase
        .from('POSProductCategory')
        .update({ isActive: true })
        .eq('id', inactiveCategory.id)
        .select()
        .single()
      
      if (updateError) {
        console.error('❌ Error activando categoría Menu Dia:', updateError);
        return { success: false, error: updateError.message }
      }
      
      console.log('✅ Categoría "Menu Dia" activada:', updatedCategory);
      return { 
        success: true, 
        data: { 
          action: 'activated', 
          category: updatedCategory,
          message: 'Categoría "Menu Dia" activada exitosamente' 
        } 
      }
    }
    
    // 5. Si llegamos aquí, algo salió mal
    console.log('⚠️ Estado inesperado en categorías Menu Dia');
    return { 
      success: false, 
      error: 'Estado inesperado en categorías Menu Dia' 
    }
    
  } catch (error) {
    console.error('❌ Error en fixMenuDiaIssue:', error);
    return { success: false, error: 'Error interno del servidor' }
  }
} 

/**
 * Función para crear productos de prueba para la categoría "Menu Dia"
 */
export async function createSampleMenuDiaProducts(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log('🍽️ Verificando productos de Menu Dia...')
    const supabase = await getSupabaseServerClient()
    
    // Buscar la categoría Menu Dia de manera más amplia
    const { data: menuDiaCategories, error: categoryError } = await supabase
      .from('POSProductCategory')
      .select('id, name, displayName, isActive')
      .or('name.ilike.*menu*dia*,displayName.ilike.*menu*dia*')
      .eq('cashRegisterTypeId', 1)
    
    if (categoryError) {
      console.error('❌ Error buscando categoría Menu Dia:', categoryError)
      return { success: false, error: categoryError.message }
    }
    
    console.log(`🔍 Categorías encontradas: ${menuDiaCategories?.length || 0}`)
    console.log('📋 Detalles de categorías:', menuDiaCategories)
    
    // Buscar una categoría activa
    let menuDiaCategory = menuDiaCategories?.find(cat => cat.isActive)
    
    if (!menuDiaCategory) {
      console.log('❌ No se encontró la categoría Menu Dia activa, intentando crear...')
      
      // Intentar crear la categoría
      const { data: newCategory, error: createError } = await supabase
        .from('POSProductCategory')
        .insert({
          name: 'menu_dia',
          displayName: 'Menu Dia',
          icon: '🍽️',
          color: '#FF6B6B',
          cashRegisterTypeId: 1,
          isActive: true,
          sortOrder: 10
        })
        .select('id')
        .single()
      
      if (createError) {
        console.error('❌ Error creando categoría Menu Dia:', createError)
        return { success: false, error: `No se pudo crear la categoría Menu Dia: ${createError.message}` }
      }
      
      menuDiaCategory = newCategory
      console.log('✅ Categoría Menu Dia creada exitosamente:', menuDiaCategory)
    } else {
      console.log('✅ Categoría Menu Dia encontrada:', menuDiaCategory)
    }
    
    // Verificar si ya existen productos en esta categoría
    const { data: existingProducts, error: existingError } = await supabase
      .from('POSProduct')
      .select('id')
      .eq('categoryId', menuDiaCategory.id)
    
    if (existingError) {
      console.error('Error verificando productos existentes:', existingError)
      return { success: false, error: existingError.message }
    }
    
    if (existingProducts && existingProducts.length > 0) {
      console.log(`✅ Ya existen ${existingProducts.length} productos en Menu Dia`)
      return { success: true, data: { message: `Ya existen ${existingProducts.length} productos en Menu Dia` } }
    }
    
    // Crear productos de muestra para Menu Dia si no existen
    const sampleProducts = [
      {
        name: 'Menú Ejecutivo',
        description: 'Menú del día con entrada, plato principal y postre',
        price: 8500,
        categoryId: menuDiaCategory.id,
        isActive: true,
        stockRequired: false,
        sortOrder: 1
      },
      {
        name: 'Menú Vegetariano',
        description: 'Opción vegetariana del menú del día',
        price: 7500,
        categoryId: menuDiaCategory.id,
        isActive: true,
        stockRequired: false,
        sortOrder: 2
      },
      {
        name: 'Menú Infantil',
        description: 'Menú especial para niños',
        price: 5500,
        categoryId: menuDiaCategory.id,
        isActive: true,
        stockRequired: false,
        sortOrder: 3
      }
    ]
    
    const { data: createdProducts, error: createError } = await supabase
      .from('POSProduct')
      .insert(sampleProducts)
      .select()
    
    if (createError) {
      console.error('Error creando productos de muestra:', createError)
      return { success: false, error: createError.message }
    }
    
    console.log(`✅ Se crearon ${createdProducts?.length || 0} productos de muestra para Menu Dia`)
    return { 
      success: true, 
      data: { 
        message: `Se crearon ${createdProducts?.length || 0} productos de muestra para Menu Dia`,
        products: createdProducts
      } 
    }
  } catch (error) {
    console.error('Error en createSampleMenuDiaProducts:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

// ===============================
// CORRECCIÓN DE CATEGORÍA PROGRAMAS
// ===============================

/**
 * Corrige la categorización de productos que contienen "Programa" en el nombre
 * Los asigna correctamente a la categoría "Programas"
 */
export async function fixProgramaCategoryIssue(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log('🔧 Iniciando corrección de categoría Programas...')
    const supabase = await getSupabaseServerClient()
    
    // 1. Buscar la categoría "Programas" para Recepción (registerTypeId = 1)
    const { data: programasCategory, error: categoryError } = await supabase
      .from('POSProductCategory')
      .select('id, name, displayName')
      .eq('cashRegisterTypeId', 1) // Recepción
      .ilike('displayName', '%Programa%')
      .single()
    
    if (categoryError || !programasCategory) {
      console.log('❌ No se encontró la categoría Programas para Recepción')
      return { success: false, error: 'Categoría Programas no encontrada para Recepción' }
    }
    
    console.log(`✅ Categoría Programas encontrada: ID ${programasCategory.id} - ${programasCategory.displayName}`)
    
    // 2. Buscar productos en la tabla Product que contengan "Programa" en el nombre y estén habilitados para POS
    const { data: programaProducts, error: productsError } = await supabase
      .from('Product')
      .select('id, name, description, saleprice, costprice, isPOSEnabled')
      .eq('isPOSEnabled', true)
      .ilike('name', '%Programa%')
    
    if (productsError) {
      console.error('❌ Error buscando productos de Programa:', productsError)
      return { success: false, error: productsError.message }
    }
    
    console.log(`📋 Productos con "Programa" encontrados: ${programaProducts?.length || 0}`)
    if (programaProducts && programaProducts.length > 0) {
      console.log('📋 Lista de productos:', programaProducts.map(p => ({ id: p.id, name: p.name })))
    }
    
    if (!programaProducts || programaProducts.length === 0) {
      console.log('ℹ️ No se encontraron productos con "Programa" en el nombre')
      return { success: true, data: { message: 'No se encontraron productos con "Programa" para corregir' } }
    }
    
    // 3. Para cada producto, verificar si ya existe en POSProduct o crearlo/actualizarlo
    let updatedCount = 0
    let createdCount = 0
    
    for (const product of programaProducts) {
      try {
        // Verificar si ya existe en POSProduct
        const { data: existingPOSProduct, error: existingError } = await supabase
          .from('POSProduct')
          .select('id, categoryId')
          .eq('productId', product.id)
          .single()
        
        if (existingError && existingError.code !== 'PGRST116') {
          console.error(`❌ Error verificando producto ${product.id}:`, existingError)
          continue
        }
        
        if (existingPOSProduct) {
          // El producto ya existe en POSProduct, actualizar su categoría si es necesario
          if (existingPOSProduct.categoryId !== programasCategory.id) {
            const { error: updateError } = await supabase
              .from('POSProduct')
              .update({ categoryId: programasCategory.id })
              .eq('id', existingPOSProduct.id)
            
            if (updateError) {
              console.error(`❌ Error actualizando categoría del producto ${product.id}:`, updateError)
            } else {
              console.log(`✅ Producto "${product.name}" movido a categoría Programas`)
              updatedCount++
            }
          } else {
            console.log(`ℹ️ Producto "${product.name}" ya está en la categoría correcta`)
          }
        } else {
          // El producto no existe en POSProduct, crearlo en la categoría Programas
          const { error: createError } = await supabase
            .from('POSProduct')
            .insert({
              name: product.name,
              description: product.description,
              price: product.saleprice || 0,
              cost: product.costprice || 0,
              categoryId: programasCategory.id,
              productId: product.id,
              isActive: true,
              stockRequired: false,
              sortOrder: 0
            })
          
          if (createError) {
            console.error(`❌ Error creando producto POS ${product.id}:`, createError)
          } else {
            console.log(`✅ Producto "${product.name}" creado en categoría Programas`)
            createdCount++
          }
        }
      } catch (error) {
        console.error(`❌ Error procesando producto ${product.id}:`, error)
      }
    }
    
    const message = `Corrección completada: ${createdCount} productos creados, ${updatedCount} productos actualizados en categoría Programas`
    console.log(`✅ ${message}`)
    
    return {
      success: true,
      data: {
        message,
        createdCount,
        updatedCount,
        totalProcessed: programaProducts.length,
        categoryId: programasCategory.id,
        categoryName: programasCategory.displayName
      }
    }
  } catch (error) {
    console.error('❌ Error en fixProgramaCategoryIssue:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
} 

/**
 * Función para limpiar precios con decimales de productos POS existentes
 * Esta función redondea todos los precios que tengan decimales en la tabla POSProduct
 */
export async function cleanPOSProductPrices(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log('🧹 Iniciando limpieza de precios con decimales en productos POS...')
    const supabase = await getSupabaseServerClient()
    
    // Obtener todos los productos POS activos
    const { data: posProducts, error: fetchError } = await supabase
      .from('POSProduct')
      .select('id, name, price, cost')
      .eq('isActive', true)
    
    if (fetchError) {
      console.error('❌ Error fetching POS products:', fetchError)
      return { success: false, error: fetchError.message }
    }
    
    if (!posProducts || posProducts.length === 0) {
      console.log('ℹ️ No hay productos POS para limpiar')
      return { success: true, data: { message: 'No hay productos POS para limpiar' } }
    }
    
    // Identificar productos con decimales
    const productsToUpdate = posProducts.filter(product => {
      const hasDecimalPrice = product.price && product.price !== Math.round(product.price)
      const hasDecimalCost = product.cost && product.cost !== Math.round(product.cost)
      return hasDecimalPrice || hasDecimalCost
    })
    
    console.log(`📊 Productos con decimales encontrados: ${productsToUpdate.length} de ${posProducts.length}`)
    
    if (productsToUpdate.length === 0) {
      console.log('✅ Todos los precios ya están redondeados')
      return { success: true, data: { message: 'Todos los precios ya están redondeados' } }
    }
    
    // Mostrar productos que se van a actualizar
    console.log('📋 Productos a actualizar:')
    productsToUpdate.forEach(product => {
      console.log(`  - ${product.name}: Precio ${product.price} → ${Math.round(product.price)}, Costo ${product.cost} → ${Math.round(product.cost || 0)}`)
    })
    
    // Actualizar productos en lotes para mejor rendimiento
    const updates = productsToUpdate.map(product => ({
      id: product.id,
      price: Math.round(product.price),
      cost: Math.round(product.cost || 0)
    }))
    
    const { data: updatedProducts, error: updateError } = await supabase
      .from('POSProduct')
      .upsert(updates, { onConflict: 'id' })
      .select()
    
    if (updateError) {
      console.error('❌ Error updating POS products:', updateError)
      return { success: false, error: updateError.message }
    }
    
    console.log(`✅ Limpieza completada: ${updatedProducts?.length || 0} productos actualizados`)
    
    return {
      success: true,
      data: {
        message: `Se limpiaron ${updatedProducts?.length || 0} productos con decimales`,
        totalProducts: posProducts.length,
        productsWithDecimals: productsToUpdate.length,
        updatedProducts: updatedProducts?.length || 0,
        cleanedProducts: updatedProducts
      }
    }
  } catch (error) {
    console.error('❌ Error in cleanPOSProductPrices:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
} 

export async function fixPOSSalesCustomerNames(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    
    console.log('🔧 Iniciando corrección de nombres de clientes en ventas POS...')
    
    // 1. Actualizar ventas con cliente asociado pero sin nombre
    const { error: updateWithClientError } = await supabase.rpc('fix_pos_sales_with_client_names')
    
    if (updateWithClientError) {
      console.error('Error actualizando ventas con cliente asociado:', updateWithClientError)
      return { success: false, error: updateWithClientError.message }
    }
    
    // 2. Actualizar ventas sin cliente asociado
    const { error: updateWithoutClientError } = await supabase
      .from('POSSale')
      .update({ customerName: 'Cliente sin nombre' })
      .is('clientId', null)
      .or('customerName.is.null,customerName.eq.')
    
    if (updateWithoutClientError) {
      console.error('Error actualizando ventas sin cliente:', updateWithoutClientError)
      return { success: false, error: updateWithoutClientError.message }
    }
    
    // 3. Verificar resultado
    const { data: verificationData, error: verificationError } = await supabase
      .from('POSSale')
      .select('id, "saleNumber", "customerName", "clientId", "createdAt"')
      .order('createdAt', { ascending: false })
      .limit(10)
    
    if (verificationError) {
      console.error('Error verificando resultado:', verificationError)
      return { success: false, error: verificationError.message }
    }
    
    console.log('✅ Corrección de nombres de clientes completada')
    
    return { 
      success: true, 
      data: {
        message: 'Nombres de clientes corregidos exitosamente',
        sampleData: verificationData
      }
    }
  } catch (error) {
    console.error('Error in fixPOSSalesCustomerNames:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
} 

export async function checkPOSSalesCustomerNames(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    
    console.log('🔍 Revisando nombres de clientes en ventas POS...')
    
    // 1. Obtener ventas con problemas de nombre
    const { data: problematicSales, error: problematicError } = await supabase
      .from('POSSale')
      .select('id, "saleNumber", "customerName", "clientId", "createdAt", "total"')
      .or('customerName.is.null,customerName.eq.,customerName.eq.Cliente sin nombre')
      .order('createdAt', { ascending: false })
    
    if (problematicError) {
      console.error('Error obteniendo ventas problemáticas:', problematicError)
      return { success: false, error: problematicError.message }
    }
    
    // 2. Obtener estadísticas generales
    const { data: statsData, error: statsError } = await supabase
      .from('POSSale')
      .select('"customerName", "clientId"')
    
    if (statsError) {
      console.error('Error obteniendo estadísticas:', statsError)
      return { success: false, error: statsError.message }
    }
    
    // 3. Calcular estadísticas
    const stats = {
      totalVentas: statsData?.length || 0,
      sinNombreNull: statsData?.filter(s => s.customerName === null).length || 0,
      sinNombreVacio: statsData?.filter(s => s.customerName === '').length || 0,
      clienteSinNombre: statsData?.filter(s => s.customerName === 'Cliente sin nombre').length || 0,
      conClienteAsociado: statsData?.filter(s => s.clientId !== null).length || 0,
      sinClienteAsociado: statsData?.filter(s => s.clientId === null).length || 0
    }
    
    // 4. Obtener últimas 10 ventas para comparar
    const { data: recentSales, error: recentError } = await supabase
      .from('POSSale')
      .select('id, "saleNumber", "customerName", "clientId", "createdAt"')
      .order('createdAt', { ascending: false })
      .limit(10)
    
    if (recentError) {
      console.error('Error obteniendo ventas recientes:', recentError)
      return { success: false, error: recentError.message }
    }
    
    console.log('✅ Revisión de nombres de clientes completada')
    
    return { 
      success: true, 
      data: {
        problematicSales: problematicSales || [],
        statistics: stats,
        recentSales: recentSales || [],
        message: 'Revisión de nombres de clientes completada'
      }
    }
  } catch (error) {
    console.error('Error in checkPOSSalesCustomerNames:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
} 

export async function checkLatestPOSSales(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    
    console.log('🔍 Revisando últimas ventas POS y cliente recién creado...')
    
    // 1. Obtener últimas 10 ventas
    const { data: latestSales, error: latestError } = await supabase
      .from('POSSale')
      .select('id, "saleNumber", "customerName", "clientId", "createdAt", "total"')
      .order('createdAt', { ascending: false })
      .limit(10)
    
    if (latestError) {
      console.error('Error obteniendo últimas ventas:', latestError)
      return { success: false, error: latestError.message }
    }
    
    // 2. Buscar cliente recién creado
    const { data: recentClient, error: clientError } = await supabase
      .from('Client')
      .select('id, "nombrePrincipal", "apellido", "razonSocial", "tipoCliente", "rut", "createdAt"')
      .or('nombrePrincipal.like.%119224357%,apellido.like.%119224357%,razonSocial.like.%119224357%,rut.like.%119224357%')
      .order('createdAt', { ascending: false })
    
    if (clientError) {
      console.error('Error buscando cliente recién creado:', clientError)
      return { success: false, error: clientError.message }
    }
    
    // 3. Obtener clientes creados hoy
    const { data: todayClients, error: todayError } = await supabase
      .from('Client')
      .select('id, "nombrePrincipal", "apellido", "razonSocial", "tipoCliente", "rut", "createdAt"')
      .gte('createdAt', new Date().toISOString().split('T')[0] + 'T00:00:00')
      .order('createdAt', { ascending: false })
    
    if (todayError) {
      console.error('Error obteniendo clientes de hoy:', todayError)
      return { success: false, error: todayError.message }
    }
    
    // 4. Obtener ventas con cliente asociado pero sin nombre
    const { data: problematicSales, error: problematicError } = await supabase
      .from('POSSale')
      .select(`
        id, "saleNumber", "customerName", "clientId", "createdAt", "total",
        client:Client(id, "nombrePrincipal", "apellido", "razonSocial", "tipoCliente")
      `)
      .or('customerName.is.null,customerName.eq.,customerName.eq.Cliente sin nombre')
      .not('clientId', 'is', null)
      .order('createdAt', { ascending: false })
    
    if (problematicError) {
      console.error('Error obteniendo ventas problemáticas:', problematicError)
      return { success: false, error: problematicError.message }
    }
    
    // 5. Obtener la última venta con detalles completos
    const { data: lastSale, error: lastSaleError } = await supabase
      .from('POSSale')
      .select(`
        id, "saleNumber", "customerName", "clientId", "createdAt", "total",
        client:Client(id, "nombrePrincipal", "apellido", "razonSocial", "tipoCliente")
      `)
      .order('createdAt', { ascending: false })
      .limit(1)
      .single()
    
    if (lastSaleError && lastSaleError.code !== 'PGRST116') {
      console.error('Error obteniendo última venta:', lastSaleError)
      return { success: false, error: lastSaleError.message }
    }
    
    console.log('✅ Revisión de últimas ventas completada')
    
    return { 
      success: true, 
      data: {
        latestSales: latestSales || [],
        recentClient: recentClient || [],
        todayClients: todayClients || [],
        problematicSales: problematicSales || [],
        lastSale: lastSale || null,
        message: 'Revisión de últimas ventas completada'
      }
    }
  } catch (error) {
    console.error('Error in checkLatestPOSSales:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

export async function fixPOSSalesCustomerNamesNull() {
  try {
    console.log('🔧 CORRIGIENDO VENTAS CON CUSTOMERNAME = NULL...');

    // 1. Obtener todas las ventas con customerName = NULL
    const { data: ventasNull, error: errorVentasNull } = await supabase
      .from('POSSale')
      .select('id, customerName, clientId')
      .is('customerName', null);

    if (errorVentasNull) {
      console.error('❌ Error al obtener ventas con customerName = NULL:', errorVentasNull);
      return { success: false, error: errorVentasNull.message };
    }

    console.log(`📊 Encontradas ${ventasNull?.length || 0} ventas con customerName = NULL`);

    // 2. Para cada venta, obtener el nombre del cliente y actualizar
    let actualizadas = 0;
    let conCliente = 0;
    let sinCliente = 0;

    for (const venta of ventasNull || []) {
      if (venta.clientId) {
        // Ventas con cliente asociado
        const { data: cliente, error: errorCliente } = await supabase
          .from('Client')
          .select('nombrePrincipal, apellido, razonSocial, tipoCliente')
          .eq('id', venta.clientId)
          .single();

        if (errorCliente) {
          console.error(`❌ Error al obtener cliente ${venta.clientId}:`, errorCliente);
          continue;
        }

        // Construir nombre del cliente
        let nombreCliente = 'Cliente sin nombre';
        if (cliente) {
          if (cliente.tipoCliente === 'Empresa' && cliente.razonSocial) {
            nombreCliente = cliente.razonSocial;
          } else if (cliente.nombrePrincipal) {
            nombreCliente = `${cliente.nombrePrincipal} ${cliente.apellido || ''}`.trim();
          }
        }

        // Actualizar la venta
        const { error: errorUpdate } = await supabase
          .from('POSSale')
          .update({ customerName: nombreCliente })
          .eq('id', venta.id);

        if (errorUpdate) {
          console.error(`❌ Error al actualizar venta ${venta.id}:`, errorUpdate);
        } else {
          actualizadas++;
          conCliente++;
        }
      } else {
        // Ventas sin cliente asociado
        const { error: errorUpdate } = await supabase
          .from('POSSale')
          .update({ customerName: 'Cliente sin nombre' })
          .eq('id', venta.id);

        if (errorUpdate) {
          console.error(`❌ Error al actualizar venta ${venta.id}:`, errorUpdate);
        } else {
          actualizadas++;
          sinCliente++;
        }
      }
    }

    // 3. Obtener estadísticas después de la corrección
    const { data: stats, error: errorStats } = await supabase
      .from('POSSale')
      .select('customerName, clientId');

    if (errorStats) {
      console.error('❌ Error al obtener estadísticas:', errorStats);
    } else {
      const total = stats?.length || 0;
      const sinNombreNull = stats?.filter(v => v.customerName === null).length || 0;
      const sinNombreVacio = stats?.filter(v => v.customerName === '').length || 0;
      const clienteSinNombre = stats?.filter(v => v.customerName === 'Cliente sin nombre').length || 0;
      const conClienteAsociado = stats?.filter(v => v.clientId !== null).length || 0;
      const sinClienteAsociado = stats?.filter(v => v.clientId === null).length || 0;

      console.log('📊 Estadísticas después de la corrección:');
      console.log(`   Total ventas: ${total}`);
      console.log(`   Sin nombre (NULL): ${sinNombreNull}`);
      console.log(`   Sin nombre (vacío): ${sinNombreVacio}`);
      console.log(`   "Cliente sin nombre": ${clienteSinNombre}`);
      console.log(`   Con cliente asociado: ${conClienteAsociado}`);
      console.log(`   Sin cliente asociado: ${sinClienteAsociado}`);
      console.log(`   Ventas corregidas: ${actualizadas} (${conCliente} con cliente, ${sinCliente} sin cliente)`);
    }

    console.log('✅ Corrección de ventas con customerName = NULL completada');
    return { 
      success: true, 
      message: `Corrección completada: ${actualizadas} ventas corregidas`,
      data: {
        totalVentas: stats?.length || 0,
        sinNombreNull: stats?.filter(v => v.customerName === null).length || 0,
        sinNombreVacio: stats?.filter(v => v.customerName === '').length || 0,
        clienteSinNombre: stats?.filter(v => v.customerName === 'Cliente sin nombre').length || 0,
        conClienteAsociado: stats?.filter(v => v.clientId !== null).length || 0,
        sinClienteAsociado: stats?.filter(v => v.clientId === null).length || 0,
        ventasCorregidas: actualizadas,
        conClienteCorregidas: conCliente,
        sinClienteCorregidas: sinCliente
      }
    };

  } catch (error) {
    console.error('❌ Error general en fixPOSSalesCustomerNamesNull:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Actualiza precios en POSProduct basándose en los precios congelados de Product
 * Esta función sincroniza los precios finales congelados con la tabla POSProduct
 */
export async function updatePOSProductPrices(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log('🔄 Iniciando actualización de precios POS basándose en precios congelados...')
    const supabase = await getSupabaseServerClient()
    
    // Obtener todos los productos POS que están vinculados a productos con precios congelados
    const { data: posProducts, error: posError } = await supabase
      .from('POSProduct')
      .select(`
        id,
        name,
        price as precio_actual_pos,
        "productId",
        product:Product(
          id,
          name,
          saleprice,
          "finalPrice",
          vat
        )
      `)
      .not('productId', 'is', null)
    
    if (posError) {
      console.error('❌ Error fetching POS products:', posError)
      return { success: false, error: posError.message }
    }
    
    console.log(`📊 Productos POS encontrados: ${posProducts?.length || 0}`)
    
    const updates = []
    const updatedProducts = []
    
    for (const posProduct of posProducts || []) {
      if (posProduct.product) {
        const product = posProduct.product
        const newPrice = product.finalPrice || Math.round(product.saleprice * (1 + (product.vat || 19) / 100))
        
        if (posProduct.precio_actual_pos !== newPrice) {
          updates.push({
            id: posProduct.id,
            price: newPrice
          })
          
          updatedProducts.push({
            id: posProduct.id,
            name: posProduct.name,
            oldPrice: posProduct.precio_actual_pos,
            newPrice: newPrice,
            productId: posProduct.productId
          })
          
          console.log(`📝 Actualizando ${posProduct.name}: $${posProduct.precio_actual_pos} → $${newPrice}`)
        }
      }
    }
    
    if (updates.length === 0) {
      console.log('ℹ️ No hay precios para actualizar')
      return { success: true, data: { message: 'No hay precios para actualizar' } }
    }
    
    // Actualizar precios en lote
    const { error: updateError } = await supabase
      .from('POSProduct')
      .upsert(updates)
    
    if (updateError) {
      console.error('❌ Error updating POS product prices:', updateError)
      return { success: false, error: updateError.message }
    }
    
    console.log(`✅ Actualización completada: ${updates.length} productos actualizados`)
    
    return { 
      success: true, 
      data: { 
        message: `Se actualizaron ${updates.length} precios de productos POS`,
        updatedProducts,
        totalUpdated: updates.length
      } 
    }
  } catch (error) {
    console.error('Error in updatePOSProductPrices:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}