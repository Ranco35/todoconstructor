const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Usar variables de entorno o valores por defecto para desarrollo
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'

console.log('🔧 Configuración Supabase:')
console.log('   URL:', supabaseUrl ? '✅ Configurada' : '❌ No configurada')
console.log('   Key:', supabaseKey ? '✅ Configurada' : '❌ No configurada')

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project') || supabaseKey.includes('your-service')) {
  console.error('❌ Error: Debe configurar las variables de entorno NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY')
  console.error('   Cree un archivo .env.local con sus credenciales de Supabase')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTestData() {
  try {
    console.log('🚀 Iniciando creación de datos de prueba para inventario físico...')

    // 1. Crear categorías de prueba
    console.log('📦 Creando categorías...')
    const { data: categories, error: categoryError } = await supabase
      .from('Category')
      .insert([
        { name: 'Vajilla', description: 'Platos, vasos, cubiertos' },
        { name: 'Cristalería', description: 'Copas, jarras, vasos' },
        { name: 'Cubiertos', description: 'Tenedores, cuchillos, cucharas' }
      ])
      .select()

    if (categoryError) {
      console.error('❌ Error creando categorías:', categoryError)
      return
    }
    console.log('✅ Categorías creadas:', categories?.length || 0)

    // 2. Crear bodegas de prueba
    console.log('🏢 Creando bodegas...')
    const { data: warehouses, error: warehouseError } = await supabase
      .from('Warehouse')
      .insert([
        { 
          name: 'Bodega Principal', 
          description: 'Bodega principal del hotel',
          location: 'Piso 1, Sector A',
          type: 'PRINCIPAL'
        },
        { 
          name: 'Bodega Cocina', 
          description: 'Bodega de cocina',
          location: 'Cocina Principal',
          type: 'COCINA'
        },
        { 
          name: 'Bodega Bar', 
          description: 'Bodega del bar',
          location: 'Bar Principal',
          type: 'BAR'
        }
      ])
      .select()

    if (warehouseError) {
      console.error('❌ Error creando bodegas:', warehouseError)
      return
    }
    console.log('✅ Bodegas creadas:', warehouses?.length || 0)

    // 3. Crear productos de prueba
    console.log('🍽️ Creando productos...')
    const { data: products, error: productError } = await supabase
      .from('Product')
      .insert([
        {
          name: 'Copa de Vino Blanco',
          sku: 'vaji-arco-005-9369',
          description: 'Copa de cristal para vino blanco',
          categoryid: categories?.[1]?.id,
          brand: 'Arco',
          costprice: 8500,
          saleprice: 12000
        },
        {
          name: 'Taza de Té 22cl',
          sku: 'vaji-te-005-5804',
          description: 'Taza de porcelana para té',
          categoryid: categories?.[0]?.id,
          brand: 'Porcelana',
          costprice: 4200,
          saleprice: 6000
        },
        {
          name: 'Cuchara de Té',
          sku: 'vaji-te-001-3040',
          description: 'Cuchara pequeña para té',
          categoryid: categories?.[2]?.id,
          brand: 'Inox',
          costprice: 1500,
          saleprice: 2200
        },
        {
          name: 'Cuchillo de Mesa',
          sku: 'vaji-wolf-008',
          description: 'Cuchillo de mesa acero inoxidable',
          categoryid: categories?.[2]?.id,
          brand: 'Wolfen',
          costprice: 3200,
          saleprice: 4800
        },
        {
          name: 'Tenedor de Mesa',
          sku: 'vaji-tene-003',
          description: 'Tenedor de mesa acero inoxidable',
          categoryid: categories?.[2]?.id,
          brand: 'Inox',
          costprice: 2800,
          saleprice: 4200
        }
      ])
      .select()

    if (productError) {
      console.error('❌ Error creando productos:', productError)
      return
    }
    console.log('✅ Productos creados:', products?.length || 0)

    // 4. Asignar productos a bodegas
    console.log('🔗 Asignando productos a bodegas...')
    const warehouseProducts = []
    
    // Asignar productos a la bodega principal
    if (warehouses?.[0] && products) {
      for (const product of products) {
        warehouseProducts.push({
          warehouseId: warehouses[0].id,
          productId: product.id,
          quantity: Math.floor(Math.random() * 50) + 10, // Entre 10 y 60 unidades
          minStock: 5,
          maxStock: 100
        })
      }
    }

    // Asignar algunos productos a la bodega cocina
    if (warehouses?.[1] && products) {
      for (let i = 0; i < 3; i++) {
        warehouseProducts.push({
          warehouseId: warehouses[1].id,
          productId: products[i].id,
          quantity: Math.floor(Math.random() * 30) + 5, // Entre 5 y 35 unidades
          minStock: 3,
          maxStock: 50
        })
      }
    }

    const { data: warehouseProductsData, error: wpError } = await supabase
      .from('Warehouse_Product')
      .insert(warehouseProducts)
      .select()

    if (wpError) {
      console.error('❌ Error asignando productos a bodegas:', wpError)
      return
    }
    console.log('✅ Productos asignados a bodegas:', warehouseProductsData?.length || 0)

    console.log('🎉 ¡Datos de prueba creados exitosamente!')
    console.log('📊 Resumen:')
    console.log(`   - Categorías: ${categories?.length || 0}`)
    console.log(`   - Bodegas: ${warehouses?.length || 0}`)
    console.log(`   - Productos: ${products?.length || 0}`)
    console.log(`   - Asignaciones: ${warehouseProductsData?.length || 0}`)

  } catch (error) {
    console.error('💥 Error general:', error)
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createTestData().then(() => {
    console.log('✅ Script terminado')
    process.exit(0)
  }).catch(error => {
    console.error('❌ Error en script:', error)
    process.exit(1)
  })
}

module.exports = { createTestData } 