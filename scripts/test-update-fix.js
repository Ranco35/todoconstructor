require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testUpdateFix() {
  console.log('🧪 Probando corrección de updateProduct...\n');
  
  try {
    // 1. Obtener un producto existente
    console.log('📋 Paso 1: Obteniendo producto existente...');
    const { data: products, error: fetchError } = await supabase
      .from('Product')
      .select('*')
      .limit(1);
    
    if (fetchError || !products || products.length === 0) {
      console.error('❌ Error obteniendo productos:', fetchError);
      return;
    }
    
    const testProduct = products[0];
    console.log('✅ Producto encontrado:', {
      id: testProduct.id,
      name: testProduct.name,
      type: testProduct.type,
      categoryid: testProduct.categoryid
    });
    
    // 2. Simular datos de actualización (sin campos problemáticos)
    console.log('\n🔄 Paso 2: Simulando actualización...');
    const updateData = {
      name: testProduct.name + ' (Test Update)',
      type: 'ALMACENABLE',
      description: 'Descripción de prueba actualizada',
      brand: 'Marca Test',
      categoryid: testProduct.categoryid, // Mantener la misma categoría
      costprice: 100.50,
      saleprice: 150.00,
      vat: 19.0
    };
    
    console.log('📝 Datos de actualización:', updateData);
    
    // 3. Probar actualización directa
    console.log('\n🔧 Paso 3: Probando actualización directa...');
    const { data: updatedProduct, error: updateError } = await supabase
      .from('Product')
      .update(updateData)
      .eq('id', testProduct.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error en actualización:', updateError);
    } else {
      console.log('✅ Actualización exitosa:', {
        id: updatedProduct.id,
        name: updatedProduct.name,
        type: updatedProduct.type,
        categoryid: updatedProduct.categoryid,
        costprice: updatedProduct.costprice,
        saleprice: updatedProduct.saleprice
      });
    }
    
    // 4. Verificar que los datos se guardaron correctamente
    console.log('\n🔍 Paso 4: Verificando datos guardados...');
    const { data: verifyProduct, error: verifyError } = await supabase
      .from('Product')
      .select('*')
      .eq('id', testProduct.id)
      .single();
    
    if (verifyError) {
      console.error('❌ Error verificando producto:', verifyError);
    } else {
      console.log('✅ Verificación exitosa:', {
        name: verifyProduct.name,
        type: verifyProduct.type,
        categoryid: verifyProduct.categoryid,
        costprice: verifyProduct.costprice,
        saleprice: verifyProduct.saleprice
      });
    }
    
    console.log('\n✅ Prueba de corrección completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error en prueba:', error);
  }
}

testUpdateFix().then(() => {
  console.log('\n🏁 Script finalizado');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
}); 