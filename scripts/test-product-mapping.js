/**
 * Script de prueba para verificar el mapeo de productos
 * Ejecutar con: node scripts/test-product-mapping.js
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas');
  console.log('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en tu .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProductMapping() {
  console.log('🧪 Iniciando prueba de mapeo de productos...\n');

  try {
    // 1. Probar consulta de productos con relaciones
    console.log('1️⃣ Probando consulta de productos con Warehouse_Product...');
    
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
          productId,
          Warehouse (
            id,
            name
          )
        )
      `)
      .limit(3);

    if (error) {
      console.error('❌ Error en consulta:', error);
      return;
    }

    console.log(`✅ Productos obtenidos: ${products?.length || 0}`);
    
    if (products && products.length > 0) {
      const product = products[0];
      console.log('\n📋 Estructura del primer producto:');
      console.log('- ID:', product.id);
      console.log('- Nombre:', product.name);
      console.log('- SKU:', product.sku);
      console.log('- Categoría (snake_case):', product.categoryid);
      console.log('- Proveedor (snake_case):', product.supplierid);
      console.log('- Precio costo (snake_case):', product.costprice);
      console.log('- Precio venta (snake_case):', product.saleprice);
      console.log('- Warehouse_Products:', product.Warehouse_Products?.length || 0);
      
      if (product.Warehouse_Products && product.Warehouse_Products.length > 0) {
        const wp = product.Warehouse_Products[0];
        console.log('\n🏭 Primer Warehouse_Product:');
        console.log('- ID:', wp.id);
        console.log('- warehouseId (camelCase):', wp.warehouseId);
        console.log('- productId (camelCase):', wp.productId);
        console.log('- Cantidad:', wp.quantity);
        console.log('- Bodega:', wp.Warehouse?.name);
      }
    }

    // 2. Probar consulta directa de Warehouse_Product
    console.log('\n2️⃣ Probando consulta directa de Warehouse_Product...');
    
    const { data: warehouseProducts, error: wpError } = await supabase
      .from('Warehouse_Product')
      .select(`
        *,
        Product (id, name),
        Warehouse (id, name)
      `)
      .limit(3);

    if (wpError) {
      console.error('❌ Error en consulta Warehouse_Product:', wpError);
    } else {
      console.log(`✅ Warehouse_Products obtenidos: ${warehouseProducts?.length || 0}`);
      
      if (warehouseProducts && warehouseProducts.length > 0) {
        const wp = warehouseProducts[0];
        console.log('\n📋 Estructura del primer Warehouse_Product:');
        console.log('- ID:', wp.id);
        console.log('- warehouseId:', wp.warehouseId);
        console.log('- productId:', wp.productId);
        console.log('- quantity:', wp.quantity);
        console.log('- Product:', wp.Product?.name);
        console.log('- Warehouse:', wp.Warehouse?.name);
      }
    }

    // 3. Verificar estructura de tabla Product
    console.log('\n3️⃣ Verificando estructura de tabla Product...');
    
    const { data: productStructure, error: structureError } = await supabase
      .from('Product')
      .select('*')
      .limit(1);

    if (structureError) {
      console.error('❌ Error obteniendo estructura:', structureError);
    } else if (productStructure && productStructure.length > 0) {
      const fields = Object.keys(productStructure[0]);
      console.log('📋 Campos de la tabla Product:');
      fields.forEach(field => {
        console.log(`- ${field}`);
      });
    }

    console.log('\n✅ Prueba de mapeo completada exitosamente');

  } catch (error) {
    console.error('❌ Error en prueba:', error);
  }
}

// Ejecutar la prueba
testProductMapping(); 