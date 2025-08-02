const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createNewSession() {
  console.log('🚀 CREANDO NUEVA SESIÓN DE CAJA');
  console.log('================================\n');

  try {
    // 1. Verificar si hay usuarios disponibles
    console.log('1. Buscando usuarios disponibles...');
    const { data: users, error: usersError } = await supabase
      .from('User')
      .select('id, name, email, isCashier')
      .eq('isActive', true)
      .or('isCashier.eq.true,role.eq.SUPER_USER,role.eq.ADMINISTRADOR');

    if (usersError) {
      console.log('❌ Error buscando usuarios:', usersError.message);
      return;
    }

    if (!users || users.length === 0) {
      console.log('❌ No se encontraron usuarios con permisos de cajero');
      console.log('💡 Ejecuta el script create-test-user-and-session.js para crear datos de prueba');
      return;
    }

    // Usar el primer usuario disponible
    const user = users[0];
    console.log(`✅ Usuario seleccionado: ${user.name} (ID: ${user.id})`);

    // 2. Verificar sesiones activas
    console.log('\n2. Verificando sesiones activas...');
    const { data: activeSessions, error: sessionError } = await supabase
      .from('CashSession')
      .select('*')
      .eq('status', 'open')
      .eq('cashRegisterId', 1);

    if (sessionError) {
      console.log('❌ Error verificando sesiones:', sessionError.message);
      return;
    }

    if (activeSessions && activeSessions.length > 0) {
      console.log('⚠️ Ya existe una sesión activa:');
      activeSessions.forEach(session => {
        console.log(`   - ID: ${session.id}, Usuario: ${session.userId}, Monto: $${session.openingAmount}`);
      });
      console.log('\n💡 Si necesitas cerrar las sesiones activas, usa el script reset-cash-session.js');
      return;
    }

    // 3. Crear nueva sesión
    console.log('\n3. Creando nueva sesión...');
    
    // Generar número de sesión
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const { count } = await supabase
      .from('CashSession')
      .select('*', { count: 'exact', head: true })
      .gte('openedAt', new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString())
      .lt('openedAt', new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString());
    
    const sessionCount = count || 0;
    const sessionNumber = `S${dateStr}-${String(sessionCount + 1).padStart(3, '0')}`;

    const openingAmount = 100; // Monto estándar de prueba
    
    const { data: newSession, error: createError } = await supabase
      .from('CashSession')
      .insert({
        sessionNumber,
        userId: user.id,
        cashRegisterId: 1,
        openingAmount,
        status: 'open',
        notes: `Sesión creada automáticamente - ${new Date().toLocaleString()}`
      })
      .select()
      .single();

    if (createError) {
      console.log('❌ Error creando sesión:', createError.message);
      return;
    }

    console.log('✅ Nueva sesión creada exitosamente!');
    console.log('=====================================');
    console.log(`📊 ID de sesión: ${newSession.id}`);
    console.log(`📝 Número de sesión: ${newSession.sessionNumber}`);
    console.log(`👤 Usuario: ${user.name}`);
    console.log(`💰 Monto inicial: $${newSession.openingAmount.toLocaleString()}`);
    console.log(`🕐 Abierta: ${new Date(newSession.openedAt).toLocaleString()}`);
    console.log('\n🎉 ¡Ahora puedes usar el sistema de caja chica!');
    console.log('💡 Ve a http://localhost:3000/dashboard/pettyCash para comenzar');

  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
  }
}

createNewSession(); 