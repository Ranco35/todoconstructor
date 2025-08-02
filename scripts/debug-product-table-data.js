require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugProductTableData() {
  try {
    console.log('🔍 Debug: Simulando consulta de ProductTable...\n');

    // Simular exactamente la consulta de getProducts
    const { data: products, error } = await supabase
      .from('Product')
      .select(`
        *,
        Category (*),
        Supplier (*),
        Warehouse_Products:Warehouse_Product (
          id,
          quantity,
          warehouseId,
          Warehouse (
            id,
            name
          )
        )
      `)
      .limit(5)
      .order('id', { ascending: false });

    if (error) {
      console.error('❌ Error en consulta:', error);
      return;
    }

    console.log('📦 Datos recibidos por ProductTable:');
    console.log('=' .repeat(80));
    
    products.forEach((product, index) => {
      console.log(`\n🔍 Producto ${index + 1}:`);
      console.log(`  ID: ${product.id}`);
      console.log(`  Nombre: ${product.name}`);
      console.log(`  SKU: ${product.sku}`);
      console.log(`  categoryid: ${product.categoryid}`);
      console.log(`  Category:`, product.Category);
      console.log(`  Category.name: ${product.Category?.name || 'UNDEFINED'}`);
      console.log(`  Supplier:`, product.Supplier);
      console.log(`  Warehouse_Products:`, product.Warehouse_Products?.length || 0, 'elementos');
      
      // Verificar si Category existe pero está vacío
      if (product.Category === null) {
        console.log(`  ⚠️ Category es NULL`);
      } else if (product.Category === undefined) {
        console.log(`  ⚠️ Category es UNDEFINED`);
      } else if (typeof product.Category === 'object') {
        console.log(`  ✅ Category es objeto válido`);
        console.log(`    - Category.id: ${product.Category.id}`);
        console.log(`    - Category.name: ${product.Category.name}`);
      }
    });

    // Verificar estructura de datos
    console.log('\n🔧 Estructura de datos:');
    console.log('=' .repeat(40));
    if (products.length > 0) {
      const sampleProduct = products[0];
      console.log('Claves del producto:', Object.keys(sampleProduct));
      console.log('Tipo de Category:', typeof sampleProduct.Category);
      console.log('Category es null?', sampleProduct.Category === null);
      console.log('Category es undefined?', sampleProduct.Category === undefined);
    }

    console.log('\n✅ Debug completado!');

  } catch (error) {
    console.error('❌ Error durante debug:', error);
  }
}

debugProductTableData(); 