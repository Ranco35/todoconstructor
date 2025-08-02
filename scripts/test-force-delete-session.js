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

async function testForceDeleteSession() {
  console.log('🧪 Iniciando prueba de eliminación fuerte de sesión...\n');

  try {
    // 1. Verificar sesiones existentes
    console.log('📋 Verificando sesiones existentes...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('CashSession')
      .select('*')
      .order('id', { ascending: false })
      .limit(5);

    if (sessionsError) {
      console.error('❌ Error obteniendo sesiones:', sessionsError);
      return;
    }

    console.log(`✅ Encontradas ${sessions.length} sesiones:`);
    sessions.forEach(session => {
      console.log(`   - Sesión ${session.id}: ${session.status} ($${session.openingAmount})`);
    });

    if (sessions.length === 0) {
      console.log('❌ No hay sesiones para probar');
      return;
    }

    // 2. Seleccionar una sesión para eliminar (la más reciente)
    const sessionToDelete = sessions[0];
    console.log(`\n🎯 Seleccionada sesión ${sessionToDelete.id} para eliminación fuerte`);

    // 3. Verificar transacciones asociadas
    console.log('\n📊 Verificando transacciones asociadas...');
    
    const { data: expenses, error: expensesError } = await supabase
      .from('PettyCashExpense')
      .select('*')
      .eq('sessionId', sessionToDelete.id);

    const { data: purchases, error: purchasesError } = await supabase
      .from('PettyCashPurchase')
      .select('*')
      .eq('sessionId', sessionToDelete.id);

    const { data: closures, error: closuresError } = await supabase
      .from('CashClosure')
      .select('*')
      .eq('sessionId', sessionToDelete.id);

    if (expensesError) console.error('❌ Error obteniendo gastos:', expensesError);
    if (purchasesError) console.error('❌ Error obteniendo compras:', purchasesError);
    if (closuresError) console.error('❌ Error obteniendo cierres:', closuresError);

    console.log(`   - Gastos: ${expenses?.length || 0}`);
    console.log(`   - Compras: ${purchases?.length || 0}`);
    console.log(`   - Cierres: ${closures?.length || 0}`);

    // 4. Simular eliminación fuerte (solo para prueba, no eliminar realmente)
    console.log('\n⚠️  SIMULACIÓN: No se eliminará realmente la sesión');
    console.log('   Para eliminar realmente, usa la interfaz web con un usuario administrador');
    
    console.log('\n📋 Resumen de lo que se eliminaría:');
    console.log(`   - Sesión ${sessionToDelete.id} ($${sessionToDelete.openingAmount})`);
    console.log(`   - ${expenses?.length || 0} gastos`);
    console.log(`   - ${purchases?.length || 0} compras`);
    console.log(`   - ${closures?.length || 0} cierres`);

    // 5. Verificar permisos de usuario
    console.log('\n🔐 Verificando permisos...');
    const { data: users, error: usersError } = await supabase
      .from('User')
      .select('*, Role(roleName)')
      .limit(5);

    if (usersError) {
      console.error('❌ Error obteniendo usuarios:', usersError);
    } else {
      console.log('✅ Usuarios disponibles:');
      users.forEach(user => {
        const role = user.Role ? user.Role.roleName : 'Sin rol';
        console.log(`   - ${user.name} (${user.email}): ${role}`);
      });
    }

    console.log('\n✅ Prueba completada exitosamente');
    console.log('💡 Para probar la eliminación real, usa la interfaz web con un usuario administrador');

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

// Ejecutar la prueba
testForceDeleteSession(); 