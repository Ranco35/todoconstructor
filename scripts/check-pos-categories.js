const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase (local)
const supabaseUrl = 'http://localhost:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkPOSCategories() {
  console.log('🔍 Verificando categorías POS...');

  try {
    const { data, error } = await supabase
      .from('POSProductCategory')
      .select('*')
      .order('cashRegisterTypeId, sortOrder');

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('✅ Categorías POS encontradas:');
    if (data && data.length > 0) {
      let currentType = null;
      data.forEach(cat => {
        if (currentType !== cat.cashRegisterTypeId) {
          currentType = cat.cashRegisterTypeId;
          console.log(`\n📱 ${cat.cashRegisterTypeId === 1 ? 'RECEPCIÓN' : 'RESTAURANTE'}:`);
        }
        console.log(`   - ${cat.displayName} (${cat.icon}) - Color: ${cat.color}`);
      });
      
      console.log(`\n📊 Total de categorías: ${data.length}`);
      console.log('🎉 ¡Sistema de categorías POS configurado correctamente!');
      console.log('🌐 Puedes acceder a: http://localhost:3000/dashboard/configuration/pos-categories');
    } else {
      console.log('   ⚠️ No se encontraron categorías POS.');
    }

  } catch (err) {
    console.error('💥 Error inesperado:', err);
  }
}

// Ejecutar
checkPOSCategories(); 