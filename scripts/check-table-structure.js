const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://bvzfuibqlprrfbudnauc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2emZ1aWJxbHBycmZidWRuYXVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU1MjYwMSwiZXhwIjoyMDY2MTI4NjAxfQ.4TGUtzCpdxCEwlpC3WKlHJ4I6O7ZGTCbFQBARYgv834'
);

async function checkTableStructure() {
  console.log('🔍 Verificando estructura de tabla CashSession...');
  
  try {
    // Método 1: Intentar obtener datos existentes para ver estructura
    const { data: existingSessions, error: selectError } = await supabase
      .from('CashSession')
      .select('*')
      .limit(1);
      
    if (existingSessions && existingSessions.length > 0) {
      console.log('📋 Estructura de datos existente:');
      console.log('Columnas encontradas:', Object.keys(existingSessions[0]));
      console.log('Ejemplo de registro:', existingSessions[0]);
    } else {
      console.log('📋 No hay datos existentes en CashSession');
    }
    
    // Método 2: Intentar inserción de prueba para ver qué campos faltan
    console.log('\n🧪 Probando inserción mínima...');
    
    const testData = {
      userId: '4c7d3972-1796-44fb-bf30-2594c1d892aa',
      cashRegisterId: 1,
      openingAmount: 1000,
      status: 'open'
    };
    
    const { data: testInsert, error: insertError } = await supabase
      .from('CashSession')
      .insert(testData)
      .select()
      .single();
      
    if (insertError) {
      console.log('❌ Error en inserción:', insertError.message);
      console.log('💡 Esto nos ayuda a identificar campos requeridos');
    } else {
      console.log('✅ Inserción exitosa:', testInsert);
      
      // Limpiar la sesión de prueba
      await supabase
        .from('CashSession')
        .delete()
        .eq('id', testInsert.id);
      console.log('🗑️ Sesión de prueba eliminada');
    }
    
    // Método 3: Ver estructura de otras tablas similares
    console.log('\n📊 Comparando con otras tablas...');
    
    const { data: users } = await supabase
      .from('User')
      .select('*')
      .limit(1);
      
    if (users && users.length > 0) {
      console.log('👤 Estructura User:', Object.keys(users[0]));
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

checkTableStructure(); 