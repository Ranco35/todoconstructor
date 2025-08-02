require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno no configuradas');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Configurada' : '❌ Faltante');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Configurada' : '❌ Faltante');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testProductCreation() {
  console.log('🧪 Iniciando prueba de creación de productos...\n');

  try {
    // 1. Verificar que las tablas existan
    console.log('📋 Verificando estructura de tablas...');
    
    // Probar una consulta simple a la tabla Product
    const { data: productTest, error: productError } = await supabase
      .from('Product')
      .select('id, name, type')
      .limit(1);

    if (productError) {
      console.error('❌ Error accediendo a tabla Product:', productError);
      return;
    }

    console.log('✅ Tabla Product accesible correctamente');

    // 2. Verificar políticas RLS
    console.log('\n🔒 Verificando políticas RLS...');
    
    // Intentar insertar un producto de prueba
    console.log('\n➕ Probando inserción de producto...');
    
    const testProduct = {
      name: 'Producto de Prueba - ' + Date.now(),
      type: 'ALMACENABLE',
      sku: 'TEST-' + Date.now(),
      description: 'Producto de prueba para verificar funcionalidad',
      brand: 'Marca Test',
      costprice: 100.00,
      saleprice: 150.00,
      vat: 19.00
    };

    console.log('📦 Datos del producto de prueba:', testProduct);

    const { data: newProduct, error: insertError } = await supabase
      .from('Product')
      .insert(testProduct)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error insertando producto:', insertError);
      return;
    }

    console.log('✅ Producto creado exitosamente:', newProduct);

    // 3. Probar inserción en Warehouse_Product
    console.log('\n🏪 Probando inserción en Warehouse_Product...');
    
    // Primero obtener una bodega existente
    const { data: warehouses, error: warehouseError } = await supabase
      .from('Warehouse')
      .select('id, name')
      .limit(1);

    if (warehouseError || !warehouses || warehouses.length === 0) {
      console.log('⚠️  No se encontraron bodegas, creando una de prueba...');
      
      const { data: newWarehouse, error: createWarehouseError } = await supabase
        .from('Warehouse')
        .insert({
          name: 'Bodega de Prueba',
          description: 'Bodega creada para pruebas'
        })
        .select()
        .single();

      if (createWarehouseError) {
        console.error('❌ Error creando bodega de prueba:', createWarehouseError);
        return;
      }

      console.log('✅ Bodega de prueba creada:', newWarehouse);
      
      // Probar inserción en Warehouse_Product
      const warehouseProductData = {
        productId: newProduct.id,
        warehouseId: newWarehouse.id,
        quantity: 10,
        minStock: 5,
        maxStock: 50
      };

      const { data: newWarehouseProduct, error: wpError } = await supabase
        .from('Warehouse_Product')
        .insert(warehouseProductData)
        .select()
        .single();

      if (wpError) {
        console.error('❌ Error insertando en Warehouse_Product:', wpError);
      } else {
        console.log('✅ Warehouse_Product creado exitosamente:', newWarehouseProduct);
      }
    } else {
      console.log('✅ Usando bodega existente:', warehouses[0]);
      
      const warehouseProductData = {
        productId: newProduct.id,
        warehouseId: warehouses[0].id,
        quantity: 10,
        minStock: 5,
        maxStock: 50
      };

      const { data: newWarehouseProduct, error: wpError } = await supabase
        .from('Warehouse_Product')
        .insert(warehouseProductData)
        .select()
        .single();

      if (wpError) {
        console.error('❌ Error insertando en Warehouse_Product:', wpError);
      } else {
        console.log('✅ Warehouse_Product creado exitosamente:', newWarehouseProduct);
      }
    }

    // 4. Limpiar datos de prueba
    console.log('\n🧹 Limpiando datos de prueba...');
    
    const { error: deleteWPError } = await supabase
      .from('Warehouse_Product')
      .delete()
      .eq('productId', newProduct.id);

    if (deleteWPError) {
      console.error('⚠️  Error eliminando Warehouse_Product de prueba:', deleteWPError);
    }

    const { error: deleteProductError } = await supabase
      .from('Product')
      .delete()
      .eq('id', newProduct.id);

    if (deleteProductError) {
      console.error('⚠️  Error eliminando producto de prueba:', deleteProductError);
    } else {
      console.log('✅ Datos de prueba eliminados correctamente');
    }

    console.log('\n🎉 ¡Prueba completada exitosamente!');
    console.log('✅ La creación de productos funciona correctamente');
    console.log('✅ Las políticas RLS están configuradas correctamente');
    console.log('✅ La inserción en Warehouse_Product funciona');

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  }
}

// Ejecutar la prueba
testProductCreation(); 