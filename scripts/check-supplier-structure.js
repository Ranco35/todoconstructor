require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSupplierStructure() {
  console.log('🔍 Verificando estructura de la tabla Supplier...');
  
  try {
    // Intentar obtener una muestra de datos para inferir estructura
    const { data: sample, error: sampleError } = await supabase
      .from('Supplier')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('❌ Error obteniendo muestra:', sampleError);
      return;
    }
    
    if (sample && sample.length > 0) {
      console.log('📋 Estructura real de la tabla Supplier:');
      console.log(JSON.stringify(sample[0], null, 2));
      
      // Mostrar solo los nombres de las columnas
      console.log('\n📝 Columnas disponibles:');
      Object.keys(sample[0]).forEach(column => {
        console.log(`   - ${column}: ${typeof sample[0][column]}`);
      });
    } else {
      console.log('📋 Tabla Supplier está vacía, probando inserción mínima...');
      
      // Intentar insertar con solo campos básicos
      const minimalSupplier = {
        name: 'Test Supplier',
        taxId: 'TEST123456'
      };
      
      const { data: inserted, error: insertError } = await supabase
        .from('Supplier')
        .insert(minimalSupplier)
        .select()
        .single();
      
      if (insertError) {
        console.log('❌ Error en inserción mínima:', insertError);
      } else {
        console.log('✅ Inserción mínima exitosa:', inserted);
        
        // Limpiar el registro de prueba
        await supabase
          .from('Supplier')
          .delete()
          .eq('id', inserted.id);
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkSupplierStructure()
  .then(() => {
    console.log('🏁 Verificación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  }); 