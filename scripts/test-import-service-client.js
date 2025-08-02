// ========================================
// PRUEBA DE IMPORTACIÓN DE GETSUPABASESERVICECLIENT
// ========================================

console.log('=== PRUEBA DE IMPORTACIÓN ===');

try {
  // Simular el entorno de Next.js
  process.env.NODE_ENV = 'development';
  
  // Cargar variables de entorno
  require('dotenv').config({ path: '.env.local' });
  
  console.log('✅ Variables de entorno cargadas');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurada' : '❌ No configurada');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurada' : '❌ No configurada');
  
  // Intentar importar la función
  console.log('\n🔧 Intentando importar getSupabaseServiceClient...');
  
  // Simular la importación como lo haría Next.js
  const { getSupabaseServiceClient } = require('../src/lib/supabase-server.js');
  
  console.log('✅ Importación exitosa');
  console.log('Tipo de función:', typeof getSupabaseServiceClient);
  
  // Probar la función
  console.log('\n🔧 Probando función getSupabaseServiceClient...');
  
  async function testFunction() {
    try {
      const client = await getSupabaseServiceClient();
      console.log('✅ Función ejecutada correctamente');
      console.log('Tipo de cliente:', typeof client);
      
      // Probar una operación simple
      const { data: roles, error } = await client
        .from('Role')
        .select('*')
        .limit(1);
      
      if (error) {
        console.log('❌ Error en operación:', error.message);
      } else {
        console.log('✅ Operación exitosa');
        console.log('Roles encontrados:', roles?.length || 0);
      }
      
    } catch (error) {
      console.log('❌ Error ejecutando función:', error.message);
      console.log('Stack:', error.stack);
    }
  }
  
  testFunction();
  
} catch (error) {
  console.log('❌ Error en importación:', error.message);
  console.log('Stack:', error.stack);
} 