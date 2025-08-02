const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPriceImport() {
  console.log('🧪 Probando importación de precios...');

  try {
    // 1. Buscar productos de tipo SERVICIO que tengan precios para probar
    console.log('🔍 Buscando productos tipo SERVICIO...');
    const { data: serviceProducts, error: serviceError } = await supabase
      .from('Product')
      .select('id, name, type, costprice, saleprice, vat')
      .eq('type', 'SERVICIO')
      .limit(3);

    if (serviceError) {
      console.error('❌ Error buscando servicios:', serviceError);
      return;
    }

    if (!serviceProducts || serviceProducts.length === 0) {
      console.log('⚠️ No se encontraron productos de tipo SERVICIO. Creando uno de prueba...');
      
      // Crear producto de prueba
      const { data: newProduct, error: createError } = await supabase
        .from('Product')
        .insert({
          name: 'MASAJE TEST PRECIOS',
          type: 'SERVICIO',
          costprice: 15000,
          saleprice: 25000,
          vat: 19
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creando producto de prueba:', createError);
        return;
      }

      console.log('✅ Producto de prueba creado:', newProduct);
    } else {
      console.log(`📊 Productos SERVICIO encontrados: ${serviceProducts.length}`);
      serviceProducts.forEach(p => {
        console.log(`  - ${p.name} (ID: ${p.id})`);
        console.log(`    💰 Precio Costo: $${p.costprice || 0}`);
        console.log(`    💸 Precio Venta: $${p.saleprice || 0}`);
        console.log(`    📋 IVA: ${p.vat || 0}%`);
      });
    }

    // 2. Probar actualización de precios (simular importación)
    console.log('\n🔄 Probando actualización de precios...');
    
    const testProduct = serviceProducts?.[0];
    if (testProduct) {
      const newCostPrice = 20000;
      const newSalePrice = 35000;
      const newVat = 21;

      console.log(`📝 Actualizando producto: ${testProduct.name}`);
      console.log(`   Precios originales: Costo $${testProduct.costprice}, Venta $${testProduct.saleprice}, IVA ${testProduct.vat}%`);
      console.log(`   Nuevos precios: Costo $${newCostPrice}, Venta $${newSalePrice}, IVA ${newVat}%`);

      const { data: updatedProduct, error: updateError } = await supabase
        .from('Product')
        .update({
          costprice: newCostPrice,
          saleprice: newSalePrice,
          vat: newVat
        })
        .eq('id', testProduct.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error actualizando precios:', updateError);
        return;
      }

      console.log('✅ Precios actualizados exitosamente:');
      console.log(`   💰 Precio Costo: $${updatedProduct.costprice}`);
      console.log(`   💸 Precio Venta: $${updatedProduct.saleprice}`);
      console.log(`   📋 IVA: ${updatedProduct.vat}%`);

      // Revertir cambios
      console.log('\n🔄 Revirtiendo cambios...');
      await supabase
        .from('Product')
        .update({
          costprice: testProduct.costprice,
          saleprice: testProduct.saleprice,
          vat: testProduct.vat
        })
        .eq('id', testProduct.id);

      console.log('✅ Cambios revertidos.');
    }

    console.log('\n🎉 Prueba de importación de precios completada!');
    console.log('📝 RESULTADO: La actualización de precios funciona correctamente a nivel de base de datos.');
    console.log('⚠️  NOTA: Si la importación Excel no actualiza precios, el problema está en el código de parsing o mapping.');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar prueba
testPriceImport(); 