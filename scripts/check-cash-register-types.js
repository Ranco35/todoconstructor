const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase (local)
const supabaseUrl = 'http://localhost:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCashRegisterTypes() {
  console.log('🔍 Verificando tipos de caja registradora...');

  try {
    const { data, error } = await supabase
      .from('CashRegisterType')
      .select('*');

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    console.log('✅ Tipos de caja registradora encontrados:');
    if (data && data.length > 0) {
      data.forEach(type => {
        console.log(`   - ID: ${type.id}, Nombre: ${type.name}, Descripción: ${type.description || 'N/A'}`);
      });
    } else {
      console.log('   ⚠️ No se encontraron tipos de caja registradora.');
      console.log('   📝 Creando tipos por defecto...');
      
      // Crear tipos por defecto
      const defaultTypes = [
        { id: 1, name: 'reception', description: 'Caja registradora de recepción' },
        { id: 2, name: 'restaurant', description: 'Caja registradora del restaurante' }
      ];

      const { data: insertData, error: insertError } = await supabase
        .from('CashRegisterType')
        .insert(defaultTypes)
        .select();

      if (insertError) {
        console.error('❌ Error al crear tipos por defecto:', insertError);
        return;
      }

      console.log('✅ Tipos por defecto creados:');
      insertData.forEach(type => {
        console.log(`   - ID: ${type.id}, Nombre: ${type.name}, Descripción: ${type.description}`);
      });
    }

  } catch (err) {
    console.error('💥 Error inesperado:', err);
  }
}

// Ejecutar
checkCashRegisterTypes(); 