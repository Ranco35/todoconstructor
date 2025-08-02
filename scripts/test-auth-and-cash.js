const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Verificando autenticación y caja chica...\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testAuthAndCash() {
  try {
    // 1. Verificar usuario Eduardo
    console.log('1️⃣ Verificando usuario Eduardo...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'eduardo@admintermas.com')
      .single();

    if (userError) {
      console.error('❌ Error consultando usuario:', userError.message);
      return;
    }

    if (!user) {
      console.log('❌ Usuario Eduardo no encontrado');
      return;
    }

    console.log(`✅ Usuario encontrado: ${user.name} - ID: ${user.id}`);

    // 2. Verificar sesión activa
    console.log('\n2️⃣ Verificando sesión de caja activa...');
    const { data: activeSessions, error: sessionError } = await supabase
      .from('CashSession')
      .select('*')
      .eq('status', 'open');

    if (sessionError) {
      console.error('❌ Error consultando sesiones:', sessionError.message);
      return;
    }

    console.log(`📊 Sesiones activas encontradas: ${activeSessions.length}`);
    
    if (activeSessions.length > 0) {
      const session = activeSessions[0];
      console.log(`✅ Sesión activa: ID ${session.id}, Usuario: ${session.userId}, Monto: $${session.openingAmount}`);
      
      // 3. Intentar cerrar la sesión
      console.log('\n3️⃣ Cerrando sesión de caja...');
      
      const closingAmount = session.currentAmount || session.openingAmount;
      const { error: closeError } = await supabase
        .from('CashSession')
        .update({
          status: 'closed',
          closedAt: new Date().toISOString(),
          currentAmount: closingAmount,
          notes: 'Cerrado por script de emergencia - problema autenticación'
        })
        .eq('id', session.id);

      if (closeError) {
        console.error('❌ Error cerrando sesión:', closeError.message);
        return;
      }

      console.log('✅ Sesión cerrada exitosamente');

      // 4. Verificar cierre
      console.log('\n4️⃣ Verificando cierre...');
      const { data: closedSession } = await supabase
        .from('CashSession')
        .select('*')
        .eq('id', session.id)
        .single();

      if (closedSession && closedSession.status === 'closed') {
        console.log('✅ Sesión confirmada como cerrada');
        console.log(`📅 Cerrada el: ${closedSession.closedAt}`);
        console.log(`💰 Monto final: $${closedSession.currentAmount}`);
      }

    } else {
      console.log('ℹ️ No hay sesiones activas para cerrar');
    }

    // 5. Mostrar todas las sesiones
    console.log('\n5️⃣ Historial completo de sesiones:');
    const { data: allSessions } = await supabase
      .from('CashSession')
      .select('*')
      .order('id', { ascending: false });

    if (allSessions && allSessions.length > 0) {
      allSessions.forEach(session => {
        console.log(`📋 ID: ${session.id}, Estado: ${session.status}, Apertura: $${session.openingAmount}, Actual: $${session.currentAmount || 'N/A'}`);
      });
    } else {
      console.log('❌ No se encontraron sesiones');
    }

  } catch (error) {
    console.error('💥 Error general:', error.message);
  }
}

testAuthAndCash(); 