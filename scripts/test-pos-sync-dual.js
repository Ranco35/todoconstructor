#!/usr/bin/env node

/**
 * Script para probar la nueva funcionalidad de sincronización dual de POS
 * Verifica que los productos se sincronicen en ambos tipos de POS
 */

const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Función para limpiar productos POS existentes (solo para pruebas)
async function cleanupPOSProducts() {
  console.log('🧹 Limpiando productos POS existentes para prueba...')
  
  const { error } = await supabase
    .from('POSProduct')
    .delete()
    .not('productId', 'is', null) // Solo eliminar productos sincronizados
  
  if (error) {
    console.error('❌ Error limpiando productos POS:', error)
    return false
  }
  
  console.log('✅ Productos POS limpiados')
  return true
}

// Función para verificar productos habilitados para POS
async function checkEnabledProducts() {
  console.log('🔍 Verificando productos habilitados para POS...')
  
  const { data: enabledProducts, error } = await supabase
    .from('Product')
    .select('id, name, isPOSEnabled')
    .eq('isPOSEnabled', true)
  
  if (error) {
    console.error('❌ Error obteniendo productos habilitados:', error)
    return []
  }
  
  console.log(`📊 Productos habilitados encontrados: ${enabledProducts?.length || 0}`)
  if (enabledProducts && enabledProducts.length > 0) {
    enabledProducts.forEach(p => {
      console.log(`  - ${p.name} (ID: ${p.id})`)
    })
  }
  
  return enabledProducts || []
}

// Función para verificar categorías POS
async function checkPOSCategories() {
  console.log('🔍 Verificando categorías POS...')
  
  const { data: categories, error } = await supabase
    .from('POSProductCategory')
    .select('id, name, displayName, cashRegisterTypeId, isActive')
    .eq('isActive', true)
    .order('cashRegisterTypeId')
    .order('sortOrder')
  
  if (error) {
    console.error('❌ Error obteniendo categorías POS:', error)
    return []
  }
  
  console.log(`📊 Categorías POS encontradas: ${categories?.length || 0}`)
  
  const receptionCategories = categories?.filter(c => c.cashRegisterTypeId === 1) || []
  const restaurantCategories = categories?.filter(c => c.cashRegisterTypeId === 2) || []
  
  console.log(`  🏨 Recepción (${receptionCategories.length}):`)
  receptionCategories.forEach(c => {
    console.log(`    - ${c.displayName} (ID: ${c.id})`)
  })
  
  console.log(`  🍽️ Restaurante (${restaurantCategories.length}):`)
  restaurantCategories.forEach(c => {
    console.log(`    - ${c.displayName} (ID: ${c.id})`)
  })
  
  return categories || []
}

// Función para ejecutar sincronización POS (simulada)
async function syncPOSProducts() {
  console.log('🔄 Iniciando sincronización de productos POS...')
  
  // Obtener productos habilitados que no están en POSProduct
  const { data: existingPosProductIds } = await supabase
    .from('POSProduct')
    .select('productId')
    .not('productId', 'is', null)
  
  const existingIds = existingPosProductIds?.map(p => p.productId) || []
  
  const { data: productsToSync, error: productsError } = await supabase
    .from('Product')
    .select('id, name, description, sku, saleprice, costprice, image, isPOSEnabled')
    .eq('isPOSEnabled', true)
    .not('id', 'in', `(${existingIds.length > 0 ? existingIds.join(',') : '0'})`)
  
  if (productsError) {
    console.error('❌ Error obteniendo productos para sincronizar:', productsError)
    return false
  }
  
  console.log(`📊 Productos a sincronizar: ${productsToSync?.length || 0}`)
  
  if (!productsToSync || productsToSync.length === 0) {
    console.log('ℹ️ No hay productos para sincronizar')
    return true
  }
  
  // Obtener categorías por defecto
  const { data: receptionCategory } = await supabase
    .from('POSProductCategory')
    .select('id')
    .eq('isActive', true)
    .eq('cashRegisterTypeId', 1)
    .order('sortOrder')
    .limit(1)
    .single()
  
  const { data: restaurantCategory } = await supabase
    .from('POSProductCategory')
    .select('id')
    .eq('isActive', true)
    .eq('cashRegisterTypeId', 2)
    .order('sortOrder')
    .limit(1)
    .single()
  
  if (!receptionCategory && !restaurantCategory) {
    console.error('❌ No se encontraron categorías por defecto')
    return false
  }
  
  console.log(`✅ Categorías encontradas:`)
  if (receptionCategory) console.log(`  🏨 Recepción: ID ${receptionCategory.id}`)
  if (restaurantCategory) console.log(`  🍽️ Restaurante: ID ${restaurantCategory.id}`)
  
  const posProductsToCreate = []
  
  // Crear registros para ambos tipos de POS
  for (const product of productsToSync) {
    console.log(`📝 Procesando: ${product.name}`)
    
    if (receptionCategory) {
      posProductsToCreate.push({
        name: product.name,
        description: product.description,
        sku: product.sku,
        price: product.saleprice || 0,
        cost: product.costprice || 0,
        image: product.image,
        categoryId: receptionCategory.id,
        productId: product.id,
        isActive: true,
        stockRequired: false,
        sortOrder: 0
      })
      console.log(`  ✅ Agregado a Recepción`)
    }
    
    if (restaurantCategory) {
      posProductsToCreate.push({
        name: product.name,
        description: product.description,
        sku: product.sku,
        price: product.saleprice || 0,
        cost: product.costprice || 0,
        image: product.image,
        categoryId: restaurantCategory.id,
        productId: product.id,
        isActive: true,
        stockRequired: false,
        sortOrder: 0
      })
      console.log(`  ✅ Agregado a Restaurante`)
    }
  }
  
  if (posProductsToCreate.length === 0) {
    console.log('⚠️ No hay registros para crear')
    return true
  }
  
  console.log(`💾 Creando ${posProductsToCreate.length} registros en POSProduct...`)
  
  const { data: createdProducts, error: createError } = await supabase
    .from('POSProduct')
    .insert(posProductsToCreate)
    .select()
  
  if (createError) {
    console.error('❌ Error creando productos POS:', createError)
    return false
  }
  
  const receptionCount = receptionCategory ? productsToSync.length : 0
  const restaurantCount = restaurantCategory ? productsToSync.length : 0
  
  console.log(`✅ Sincronización completada:`)
  console.log(`  📊 ${createdProducts?.length || 0} registros creados`)
  console.log(`  🏨 ${receptionCount} productos en Recepción`)
  console.log(`  🍽️ ${restaurantCount} productos en Restaurante`)
  
  return true
}

// Función para verificar productos sincronizados
async function verifySync() {
  console.log('🔍 Verificando productos sincronizados...')
  
  const { data: posProducts, error } = await supabase
    .from('POSProduct')
    .select(`
      id, name, productId, isActive,
      category:POSProductCategory(
        id, displayName, cashRegisterTypeId
      )
    `)
    .eq('isActive', true)
    .not('productId', 'is', null)
    .order('productId')
    .order('categoryId')
  
  if (error) {
    console.error('❌ Error verificando productos sincronizados:', error)
    return false
  }
  
  console.log(`📊 Productos sincronizados: ${posProducts?.length || 0}`)
  
  const receptionProducts = posProducts?.filter(p => p.category?.cashRegisterTypeId === 1) || []
  const restaurantProducts = posProducts?.filter(p => p.category?.cashRegisterTypeId === 2) || []
  
  console.log(`🏨 Productos en Recepción: ${receptionProducts.length}`)
  receptionProducts.forEach(p => {
    console.log(`  - ${p.name} (Producto ID: ${p.productId}, POS ID: ${p.id})`)
  })
  
  console.log(`🍽️ Productos en Restaurante: ${restaurantProducts.length}`)
  restaurantProducts.forEach(p => {
    console.log(`  - ${p.name} (Producto ID: ${p.productId}, POS ID: ${p.id})`)
  })
  
  return true
}

// Función principal
async function main() {
  console.log('🧪 PRUEBA: Sincronización Dual de Productos POS')
  console.log('='.repeat(50))
  
  try {
    // 1. Verificar estado inicial
    console.log('\n1️⃣ VERIFICACIÓN INICIAL')
    const enabledProducts = await checkEnabledProducts()
    await checkPOSCategories()
    
    if (enabledProducts.length === 0) {
      console.log('⚠️ No hay productos habilitados para POS. Habilitando algunos productos...')
      
      // Habilitar algunos productos para prueba
      const { data: someProducts } = await supabase
        .from('Product')
        .select('id, name')
        .limit(3)
      
      if (someProducts && someProducts.length > 0) {
        const { error: updateError } = await supabase
          .from('Product')
          .update({ isPOSEnabled: true })
          .in('id', someProducts.map(p => p.id))
        
        if (!updateError) {
          console.log(`✅ Habilitados ${someProducts.length} productos para POS`)
          someProducts.forEach(p => console.log(`  - ${p.name}`))
        }
      }
    }
    
    // 2. Limpiar para prueba
    console.log('\n2️⃣ LIMPIEZA PARA PRUEBA')
    await cleanupPOSProducts()
    
    // 3. Ejecutar sincronización
    console.log('\n3️⃣ SINCRONIZACIÓN')
    const syncSuccess = await syncPOSProducts()
    
    if (!syncSuccess) {
      console.error('❌ Falló la sincronización')
      process.exit(1)
    }
    
    // 4. Verificar resultados
    console.log('\n4️⃣ VERIFICACIÓN DE RESULTADOS')
    await verifySync()
    
    console.log('\n✅ PRUEBA COMPLETADA EXITOSAMENTE')
    console.log('='.repeat(50))
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error)
    process.exit(1)
  }
}

// Ejecutar prueba
if (require.main === module) {
  main()
} 