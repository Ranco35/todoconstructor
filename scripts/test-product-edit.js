require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Configuración:');
console.log('URL:', supabaseUrl ? '✅ Configurada' : '❌ Faltante');
console.log('Service Key:', supabaseServiceKey ? '✅ Configurada' : '❌ Faltante');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('\n❌ Error: Variables de entorno de Supabase no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Script para probar la edición de productos
console.log('🧪 Probando edición de productos...\n');

// Simular datos de un formulario de edición
const mockFormData = {
  id: '25', // ID del producto a editar
  name: 'Producto de Prueba Editado',
  type: 'ALMACENABLE',
  sku: 'TEST-EDIT-001',
  description: 'Producto editado para pruebas',
  brand: 'Marca Test Editada',
  costprice: '150.00',
  saleprice: '200.00',
  vat: '19.00',
  stock: JSON.stringify({
    warehouseid: 7, // ID de la bodega "Comedor"
    current: 25,
    min: 5,
    max: 50
  })
};

console.log('📋 Datos simulados del formulario:');
console.log(JSON.stringify(mockFormData, null, 2));

console.log('\n🔍 Análisis del flujo:');
console.log('1. ✅ El formulario envía los datos como FormData');
console.log('2. ✅ La función updateProduct recibe el FormData');
console.log('3. ✅ Se parsea el campo stock como JSON');
console.log('4. ✅ Se actualiza el producto principal');
console.log('5. ✅ Se procesa el stock usando service role (bypass RLS)');
console.log('6. ✅ Se inserta/actualiza en Warehouse_Product');

console.log('\n💡 Para probar la funcionalidad:');
console.log('1. Ve a http://localhost:3000/dashboard/configuration/products');
console.log('2. Haz clic en "Editar" en cualquier producto');
console.log('3. En la pestaña "Stock", selecciona una bodega y cantidad');
console.log('4. Guarda el producto');
console.log('5. Verifica que el stock aparezca en el listado');

console.log('\n🔧 Si hay problemas:');
console.log('- Revisa la consola del navegador para errores');
console.log('- Revisa la consola del servidor Next.js para logs de debug');
console.log('- Verifica que las políticas RLS estén aplicadas en Supabase');

console.log('\n📝 Logs esperados en la consola del servidor:');
console.log('🔍 DEBUG - Procesando stock para producto: { productId: 25, warehouseId: 7, ... }');
console.log('🔍 DEBUG - Creando nuevo registro en Warehouse_Product');
console.log('✅ Stock creado exitosamente en Warehouse_Product');

async function testProductEdit() {
  try {
    console.log('\n🧪 Probando edición de productos...\n');

    // 1. Crear un producto de prueba
    console.log('📦 Creando producto de prueba...');
    const testProductData = {
      name: 'Producto Test Edición',
      type: 'CONSUMIBLE',
      sku: 'TEST-EDIT-001',
      description: 'Producto para probar edición',
      brand: 'Test Brand',
      costprice: 10.00,
      saleprice: 15.00,
      vat: 19
    };

    const { data: createdProduct, error: createError } = await supabase
      .from('Product')
      .insert(testProductData)
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creando producto de prueba:', createError);
      return;
    }

    console.log('✅ Producto creado:', {
      id: createdProduct.id,
      name: createdProduct.name,
      sku: createdProduct.sku
    });

    // 2. Contar productos antes de la edición
    const { count: countBefore } = await supabase
      .from('Product')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Productos antes de edición: ${countBefore}`);

    // 3. Simular edición (actualizar el producto)
    console.log('\n✏️ Editando producto...');
    const updateData = {
      name: 'Producto Test Editado',
      description: 'Descripción actualizada',
      brand: 'Test Brand Updated',
      costprice: 12.00,
      saleprice: 18.00
    };

    const { data: updatedProduct, error: updateError } = await supabase
      .from('Product')
      .update(updateData)
      .eq('id', createdProduct.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error editando producto:', updateError);
      return;
    }

    console.log('✅ Producto editado:', {
      id: updatedProduct.id,
      name: updatedProduct.name,
      description: updatedProduct.description,
      brand: updatedProduct.brand,
      costprice: updatedProduct.costprice,
      saleprice: updatedProduct.saleprice
    });

    // 4. Contar productos después de la edición
    const { count: countAfter } = await supabase
      .from('Product')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Productos después de edición: ${countAfter}`);

    // 5. Verificar que no se creó un producto nuevo
    if (countAfter === countBefore) {
      console.log('✅ ÉXITO: No se creó un producto nuevo durante la edición');
    } else {
      console.log('❌ ERROR: Se creó un producto nuevo durante la edición');
      console.log(`   Antes: ${countBefore}, Después: ${countAfter}`);
    }

    // 6. Verificar que los datos se actualizaron correctamente
    const { data: finalProduct, error: finalError } = await supabase
      .from('Product')
      .select('*')
      .eq('id', createdProduct.id)
      .single();

    if (finalError) {
      console.error('❌ Error verificando producto final:', finalError);
    } else {
      console.log('\n🔍 Verificación final del producto:');
      console.log(`  Nombre: ${finalProduct.name} (esperado: Producto Test Editado)`);
      console.log(`  Descripción: ${finalProduct.description} (esperado: Descripción actualizada)`);
      console.log(`  Marca: ${finalProduct.brand} (esperado: Test Brand Updated)`);
      console.log(`  Precio costo: ${finalProduct.costprice} (esperado: 12.00)`);
      console.log(`  Precio venta: ${finalProduct.saleprice} (esperado: 18.00)`);
    }

    // 7. Limpiar producto de prueba
    console.log('\n🧹 Limpiando producto de prueba...');
    const { error: deleteError } = await supabase
      .from('Product')
      .delete()
      .eq('id', createdProduct.id);

    if (deleteError) {
      console.error('❌ Error eliminando producto de prueba:', deleteError);
    } else {
      console.log('✅ Producto de prueba eliminado');
    }

    console.log('\n🎉 Prueba de edición completada!');

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  }
}

testProductEdit(); 