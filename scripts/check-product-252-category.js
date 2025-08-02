const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://flwewxqgbmsyqrjvhfuw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsd2V3eHFnYm1zeXFyanZoZnV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTAwNjczNCwiZXhwIjoyMDUwNTgyNzM0fQ.hcV2-F11nJy5ksqHBr_N8PLsQOGg6fBNQLxlOe4Hxcs';

async function checkProduct252Category() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('🔍 Verificando categoría del producto ID 252...');
  
  try {
    // 1. Verificar producto en tabla Product principal
    const { data: product, error: productError } = await supabase
      .from('Product')
      .select(`
        id,
        name,
        sku,
        categoryid,
        Category:categoryid(id, name)
      `)
      .eq('id', 252)
      .single();
      
    if (productError) {
      console.error('❌ Error obteniendo producto principal:', productError);
      return;
    }
    
    console.log('📦 Producto Principal (ID 252):');
    console.log('  Nombre:', product.name);
    console.log('  SKU:', product.sku);
    console.log('  Category ID:', product.categoryid);
    console.log('  Category Name:', product.Category?.name || 'Sin categoría');
    
    // 2. Verificar en tabla products_modular
    const { data: modularProduct, error: modularError } = await supabase
      .from('products_modular')
      .select('*')
      .eq('original_id', 252);
      
    if (modularError) {
      console.error('❌ Error obteniendo producto modular:', modularError);
      return;
    }
    
    if (modularProduct && modularProduct.length > 0) {
      console.log('\n📋 Producto Modular:');
      console.log('  ID Modular:', modularProduct[0].id);
      console.log('  Nombre:', modularProduct[0].name);
      console.log('  Categoría Modular:', modularProduct[0].category);
      console.log('  Original ID:', modularProduct[0].original_id);
      
      // 3. Determinar la categoría correcta
      const categoryName = product.Category?.name?.toLowerCase() || '';
      let correctCategory = 'servicios'; // por defecto
      
      if (categoryName.includes('alojamiento') || 
          categoryName.includes('habitacion') || 
          categoryName.includes('programa') ||
          product.name.toLowerCase().includes('habitacion')) {
        correctCategory = 'alojamiento';
      } else if (categoryName.includes('alimentacion') || 
                 categoryName.includes('comida') || 
                 categoryName.includes('bebida') || 
                 categoryName.includes('restaurante')) {
        correctCategory = 'comida';
      } else if (categoryName.includes('spa') || 
                 categoryName.includes('masaje') || 
                 categoryName.includes('tratamiento') || 
                 categoryName.includes('termal')) {
        correctCategory = 'spa';
      } else if (categoryName.includes('entretenimiento') || 
                 categoryName.includes('actividad')) {
        correctCategory = 'entretenimiento';
      }
      
      console.log('\n🎯 Análisis:');
      console.log('  Categoría BD original:', product.Category?.name || 'Sin categoría');
      console.log('  Categoría modular actual:', modularProduct[0].category);
      console.log('  Categoría modular correcta:', correctCategory);
      
      // 4. Corregir si es necesario
      if (modularProduct[0].category !== correctCategory) {
        console.log('\n🔧 Corrigiendo categoría...');
        
        const { error: updateError } = await supabase
          .from('products_modular')
          .update({ category: correctCategory })
          .eq('id', modularProduct[0].id);
          
        if (updateError) {
          console.error('❌ Error actualizando categoría:', updateError);
        } else {
          console.log('✅ Categoría corregida exitosamente!');
          console.log(`   ${modularProduct[0].category} → ${correctCategory}`);
        }
      } else {
        console.log('✅ La categoría ya está correcta');
      }
    } else {
      console.log('❌ No se encontró el producto en la tabla modular');
    }
    
  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

checkProduct252Category().then(() => {
  console.log('\n✨ Verificación completada');
  process.exit(0);
}).catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
}); 