const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Verificando tablas y cerrando caja...\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkTablesAndCloseCash() {
  try {
    // 1. Verificar tabla de usuarios
    console.log('1️⃣ Verificando tablas de usuarios...');
    
    // Intentar diferentes nombres de tabla
    const tableNames = ['User', 'users', 'auth.users'];
    let userTable = null;
    let userData = null;
    
    for (const tableName of tableNames) {
      try {
        console.log(`🔍 Probando tabla: ${tableName}`);
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
          
        if (!error && data) {
          console.log(`✅ Tabla ${tableName} existe`);
          userTable = tableName;
          
          // Buscar usuario Eduardo
          const { data: user } = await supabase
            .from(tableName)
            .select('*')
            .or('email.eq.eduardo@admintermas.com,name.ilike.%Eduardo%')
            .limit(1);
            
          if (user && user.length > 0) {
            userData = user[0];
            console.log(`✅ Usuario encontrado en ${tableName}: ${userData.name || userData.email || userData.id}`);
          }
          break;
        }
      } catch (e) {
        console.log(`❌ Tabla ${tableName} no existe o no es accesible`);
      }
    }

    // 2. Verificar sesiones de caja
    console.log('\n2️⃣ Verificando sesiones de caja...');
    const { data: sessions, error: sessionError } = await supabase
      .from('CashSession')
      .select('*')
      .order('id', { ascending: false });

    if (sessionError) {
      console.error('❌ Error consultando sesiones:', sessionError.message);
      return;
    }

    console.log(`📊 Total de sesiones encontradas: ${sessions.length}`);
    
    // Mostrar todas las sesiones
    sessions.forEach(session => {
      console.log(`📋 ID: ${session.id}, Estado: ${session.status}, Usuario: ${session.userId}, Apertura: $${session.openingAmount}`);
    });

    // 3. Buscar sesiones abiertas
    const openSessions = sessions.filter(s => s.status === 'open');
    console.log(`\n🔓 Sesiones abiertas: ${openSessions.length}`);

    if (openSessions.length > 0) {
      // 4. Cerrar todas las sesiones abiertas
      console.log('\n3️⃣ Cerrando sesiones abiertas...');
      
      for (const session of openSessions) {
        console.log(`🔒 Cerrando sesión ID: ${session.id}`);
        
        const closingAmount = session.currentAmount || session.openingAmount;
        const { error: closeError } = await supabase
          .from('CashSession')
          .update({
            status: 'closed',
            closedAt: new Date().toISOString(),
            currentAmount: closingAmount,
            notes: 'Cerrado por script de emergencia - problema de autenticación web'
          })
          .eq('id', session.id);

        if (closeError) {
          console.error(`❌ Error cerrando sesión ${session.id}:`, closeError.message);
        } else {
          console.log(`✅ Sesión ${session.id} cerrada exitosamente`);
        }
      }

      // 5. Verificar que todas están cerradas
      console.log('\n4️⃣ Verificando cierre...');
      const { data: updatedSessions } = await supabase
        .from('CashSession')
        .select('*')
        .eq('status', 'open');

      if (updatedSessions.length === 0) {
        console.log('✅ Todas las sesiones están cerradas');
      } else {
        console.log(`⚠️ Aún quedan ${updatedSessions.length} sesiones abiertas`);
      }

    } else {
      console.log('ℹ️ No hay sesiones abiertas para cerrar');
    }

    // 6. Estado final
    console.log('\n5️⃣ Estado final del sistema:');
    const { data: finalSessions } = await supabase
      .from('CashSession')
      .select('*')
      .order('id', { ascending: false })
      .limit(5);

    console.log('📊 Últimas 5 sesiones:');
    finalSessions.forEach(session => {
      const status = session.status === 'closed' ? '🔒' : '🔓';
      console.log(`${status} ID: ${session.id}, Estado: ${session.status}, Monto: $${session.currentAmount || session.openingAmount}`);
    });

  } catch (error) {
    console.error('💥 Error general:', error.message);
  }
}

checkTablesAndCloseCash(); 