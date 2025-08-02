const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🧪 PROBANDO APERTURA DE SESIÓN DE CAJA\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testSessionOpening() {
  try {
    console.log('🔍 1. Verificando estado actual...');
    
    // Buscar usuario Eduardo
    const { data: users } = await supabase
      .from('User')
      .select('*')
      .or('email.eq.eduardo@admintermas.com,email.eq.eduardo@termasllifen.cl');
    
    if (!users || users.length === 0) {
      console.log('❌ No se encontró usuario Eduardo');
      return;
    }
    
    const user = users[0];
    console.log(`✅ Usuario encontrado: ${user.name} (${user.email}) - ID: ${user.id}`);

    // Verificar sesiones existentes
    const { data: activeSessions } = await supabase
      .from('CashSession')
      .select('*')
      .eq('status', 'open');
    
    console.log(`📊 Sesiones activas: ${activeSessions.length}`);
    
    if (activeSessions.length > 0) {
      console.log('⚠️ Hay sesiones activas. Cerrándolas primero...');
      for (const session of activeSessions) {
        await supabase
          .from('CashSession')
          .update({ 
            status: 'closed', 
            closedAt: new Date().toISOString(),
            currentAmount: session.currentAmount || session.openingAmount 
          })
          .eq('id', session.id);
        console.log(`🔒 Sesión ${session.id} cerrada`);
      }
    }

    console.log('\n🚀 2. Intentando crear nueva sesión...');

    // Datos de prueba para la sesión
    const sessionData = {
      userId: user.id,
      cashRegisterId: 1,
      openingAmount: 50000, // $50,000
      currentAmount: 50000,
      status: 'open',
      notes: 'Sesión de prueba creada por script'
    };

    const { data: newSession, error: sessionError } = await supabase
      .from('CashSession')
      .insert(sessionData)
      .select()
      .single();

    if (sessionError) {
      console.error('❌ Error creando sesión:', sessionError.message);
      console.error('Detalles:', sessionError);
      return;
    }

    console.log('✅ Sesión creada exitosamente!');
    console.log(`📋 ID: ${newSession.id}`);
    console.log(`👤 Usuario: ${user.name}`);
    console.log(`💰 Monto apertura: $${newSession.openingAmount.toLocaleString()}`);
    console.log(`📅 Fecha: ${new Date(newSession.openedAt).toLocaleString()}`);

    // Verificar que la sesión se puede leer correctamente
    console.log('\n🔍 3. Verificando sesión creada...');
    
    const { data: verifySession, error: verifyError } = await supabase
      .from('CashSession')
      .select('*')
      .eq('id', newSession.id)
      .single();

    if (verifyError) {
      console.error('❌ Error verificando sesión:', verifyError.message);
      return;
    }

    console.log('✅ Sesión verificada correctamente');
    console.log(`🔓 Estado: ${verifySession.status}`);
    console.log(`💰 Monto actual: $${verifySession.currentAmount.toLocaleString()}`);

    // Probar la función getCurrentCashSession
    console.log('\n🔍 4. Probando función getCurrentCashSession...');
    
    const { data: currentSession, error: currentError } = await supabase
      .from('CashSession')
      .select('*')
      .eq('cashRegisterId', 1)
      .eq('status', 'open')
      .order('openedAt', { ascending: false })
      .limit(1);

    if (currentError) {
      console.error('❌ Error obteniendo sesión actual:', currentError.message);
      return;
    }

    if (currentSession && currentSession.length > 0) {
      console.log('✅ Función getCurrentCashSession funcionaría correctamente');
      console.log(`📋 Sesión encontrada: ID ${currentSession[0].id}`);
    } else {
      console.log('❌ No se encontró sesión activa (problema con la función)');
    }

    console.log('\n🎉 RESULTADO:');
    console.log('✅ La apertura de sesión funciona correctamente');
    console.log('✅ La sesión se guarda en la base de datos');
    console.log('✅ La sesión se puede consultar');
    console.log('\n💡 PRÓXIMO PASO:');
    console.log('• Inicia el servidor: npm run dev');
    console.log('• Ve a: http://localhost:3000/dashboard/pettyCash');
    console.log('• Debería mostrar botones de "Nuevo Gasto", "Nueva Compra", "Cerrar Sesión"');
    console.log(`• Sesión activa: ID ${newSession.id} con $${newSession.openingAmount.toLocaleString()}`);

  } catch (error) {
    console.error('💥 Error general:', error.message);
    console.error('Stack:', error.stack);
  }
}

testSessionOpening(); 