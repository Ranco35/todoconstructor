const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://ibpbclxszblystwffxzn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlicGJjbHhzemJseXN0d2ZmeHpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxOTIzNzYwOSwiZXhwIjoyMDM0ODEzNjA5fQ.x4QJPLKZwEwKzF-N_8Bss8T_rXXYZ9Cc6QayaLq-_rQ';

console.log('🔧 Configuración:');
console.log('URL:', supabaseUrl);
console.log('Service Key:', supabaseServiceKey ? '✅ Presente' : '❌ Faltante');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
  console.log('\n🧪 Probando conexión con Supabase...');

  try {
    // Probar conexión básica
    const { data, error } = await supabase
      .from('CashSession')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Error de conexión:', error);
      return;
    }

    console.log('✅ Conexión exitosa con Supabase');
    
    // Obtener sesiones
    const { data: sessions, error: sessionsError } = await supabase
      .from('CashSession')
      .select('id, status, openingAmount')
      .order('id', { ascending: false })
      .limit(3);

    if (sessionsError) {
      console.error('❌ Error obteniendo sesiones:', sessionsError);
      return;
    }

    console.log(`✅ Encontradas ${sessions.length} sesiones:`);
    sessions.forEach(session => {
      console.log(`   - Sesión ${session.id}: ${session.status} ($${session.openingAmount})`);
    });

    if (sessions.length > 0) {
      const sessionId = sessions[0].id;
      console.log(`\n🎯 Sesión seleccionada para prueba: ${sessionId}`);
      
      // Verificar transacciones
      const { data: expenses } = await supabase
        .from('PettyCashExpense')
        .select('id')
        .eq('sessionId', sessionId);

      const { data: purchases } = await supabase
        .from('PettyCashPurchase')
        .select('id')
        .eq('sessionId', sessionId);

      console.log(`📊 Transacciones en sesión ${sessionId}:`);
      console.log(`   - Gastos: ${expenses?.length || 0}`);
      console.log(`   - Compras: ${purchases?.length || 0}`);
    }

    console.log('\n✅ Prueba completada exitosamente');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

testConnection(); 