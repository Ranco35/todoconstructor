require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSessions() {
  console.log('🔍 Verificando sesiones de caja...\n');

  try {
    // Verificar sesiones existentes
    const { data: sessions, error: sessionsError } = await supabase
      .from('CashSession')
      .select('*')
      .order('id', { ascending: false });

    if (sessionsError) {
      console.error('❌ Error obteniendo sesiones:', sessionsError);
      return;
    }

    console.log(`✅ Encontradas ${sessions.length} sesiones:`);
    if (sessions.length === 0) {
      console.log('   - No hay sesiones en la base de datos');
    } else {
      sessions.forEach(session => {
        console.log(`   - Sesión ${session.id}: ${session.status} ($${session.openingAmount}) - ${session.openedAt}`);
      });
    }

    // Verificar cajas registradoras
    const { data: registers, error: registersError } = await supabase
      .from('CashRegister')
      .select('*');

    if (registersError) {
      console.error('❌ Error obteniendo cajas registradoras:', registersError);
    } else {
      console.log(`\n💰 Cajas registradoras disponibles:`);
      registers.forEach(register => {
        console.log(`   - Caja ${register.id}: ${register.name} (${register.location})`);
      });
    }

    // Verificar usuarios
    const { data: users, error: usersError } = await supabase
      .from('User')
      .select('id, name, email, role')
      .limit(5);

    if (usersError) {
      console.error('❌ Error obteniendo usuarios:', usersError);
    } else {
      console.log(`\n👥 Usuarios disponibles:`);
      users.forEach(user => {
        console.log(`   - Usuario ${user.id}: ${user.name} (${user.email})`);
      });
    }

  } catch (error) {
    console.error('❌ Error en la verificación:', error);
  }
}

checkSessions(); 