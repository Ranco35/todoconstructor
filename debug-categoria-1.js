// Script de debug para verificar productos de categoría 1
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno no configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugCategoria1() {
  try {
    console.log('🔍 [DEBUG] Consultando productos de categoría 1...')
    
    // Consulta exacta como en el código
    const { data: categoryProducts, error } = await supabase
      .from('Product')
      .select(`
        id, name, sku, brand, description, supplierid, image
      `)
      .eq('categoryid', 1)
      .not('name', 'is', null)
      .neq('name', '')

    if (error) {
      console.error('❌ [DEBUG] Error en consulta:', error)
      return
    }

    console.log('✅ [DEBUG] Productos encontrados:', categoryProducts?.length || 0)
    
    if (categoryProducts && categoryProducts.length > 0) {
      console.log('🔍 [DEBUG] Primeros 3 productos:')
      categoryProducts.slice(0, 3).forEach((product, index) => {
        console.log(`  ${index + 1}. ID: ${product.id}, Nombre: "${product.name}", SKU: "${product.sku}"`)
      })
      
      // Verificar si hay productos sin nombre
      const productosSinNombre = categoryProducts.filter(p => !p.name || p.name.trim() === '')
      if (productosSinNombre.length > 0) {
        console.log('⚠️ [DEBUG] Productos sin nombre encontrados:', productosSinNombre.length)
        productosSinNombre.slice(0, 3).forEach((product, index) => {
          console.log(`  ${index + 1}. ID: ${product.id}, Nombre: "${product.name}", SKU: "${product.sku}"`)
        })
      }
    } else {
      console.log('❌ [DEBUG] No se encontraron productos en categoría 1')
    }

  } catch (error) {
    console.error('💥 [DEBUG] Error general:', error)
  }
}

debugCategoria1()



