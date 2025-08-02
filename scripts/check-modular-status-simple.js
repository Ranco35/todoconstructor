// Script simple para verificar estado del sistema modular
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
);

async function checkStatus() {
  console.log('🔍 Verificando sistema modular...\n');

  try {
    // Verificar productos modulares
    const { data: modular, error: modularError } = await supabase
      .from('products_modular')
      .select('id, name, original_id, category');

    if (modularError) {
      console.error('Error productos modulares:', modularError);
      return;
    }

    console.log(`📊 Productos modulares totales: ${modular?.length || 0}`);
    
    if (modular) {
      const withOriginal = modular.filter(p => p.original_id).length;
      const withoutOriginal = modular.length - withOriginal;
      
      console.log(`✅ Con original_id: ${withOriginal}`);
      console.log(`❌ Sin original_id: ${withoutOriginal}`);
      
      // Mostrar distribución por categoría
      const categories = {};
      modular.forEach(p => {
        if (p.original_id) {
          categories[p.category] = (categories[p.category] || 0) + 1;
        }
      });
      
      console.log('\n📦 Por categoría:');
      Object.entries(categories).forEach(([cat, count]) => {
        console.log(`   ${cat}: ${count}`);
      });
    }

    // Verificar paquetes
    const { data: packages } = await supabase
      .from('packages_modular')
      .select('id, name');

    console.log(`\n📦 Paquetes: ${packages?.length || 0}`);

    // Verificar vinculaciones
    const { data: linkages } = await supabase
      .from('product_package_linkage')
      .select('package_id, product_id');

    console.log(`🔗 Vinculaciones: ${linkages?.length || 0}`);

    console.log('\n✅ Verificación completada');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkStatus(); 