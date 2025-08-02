const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bvzfuibqlprrfbudnauc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2emZ1aWJxbHBycmZidWRuYXVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU1MjYwMSwiZXhwIjoyMDY2MTI4NjAxfQ.4TGUtzCpdxCEwlpC3WKlHJ4I6O7ZGTCbFQBARYgv834';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestSession() {
  console.log('🏦 CREANDO NUEVA SESIÓN DE CAJA PARA PRUEBAS');
  console.log('='.repeat(60));

  try {
    // Verificar si ya hay una sesión activa
    const { data: existingSession, error: checkError } = await supabase
      .from('CashSession')
      .select('*')
      .eq('status', 'open')
      .single();

    if (existingSession) {
      console.log('⚠️ Ya hay una sesión activa:');
      console.log(`   ID: ${existingSession.id}`);
      console.log(`   Estado: ${existingSession.status}`);
      console.log(`   Monto: $${existingSession.openingAmount}`);
      return;
    }

    // Obtener un usuario para la sesión
    const { data: users, error: userError } = await supabase
      .from('User')
      .select('id, name, email')
      .limit(1);

    if (userError || !users || users.length === 0) {
      console.log('❌ No se pudo obtener usuario para la sesión');
      return;
    }

    const user = users[0];
    const openingAmount = 1000; // $1000 para pruebas

    console.log(`👤 Usuario seleccionado: ${user.name} (${user.email})`);
    console.log(`💰 Monto inicial: $${openingAmount}`);

    // Crear nueva sesión
    const { data: newSession, error: createError } = await supabase
      .from('CashSession')
      .insert({
        userId: user.id,
        cashRegisterId: 1,
        status: 'open',
        openingAmount: openingAmount,
        currentAmount: openingAmount,
        notes: 'Sesión creada automáticamente para pruebas de cierre de caja',
        openedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.log('❌ Error al crear sesión:', createError.message);
      return;
    }

    console.log('✅ Sesión creada exitosamente:');
    console.log(`   ID: ${newSession.id}`);
    console.log(`   Usuario: ${user.name}`);
    console.log(`   Estado: ${newSession.status}`);
    console.log(`   Monto inicial: $${newSession.openingAmount}`);
    console.log(`   Fecha apertura: ${newSession.openedAt}`);

    console.log('\n🎉 SESIÓN LISTA PARA PRUEBAS');
    console.log('='.repeat(60));
    console.log('📋 Ahora puedes:');
    console.log('   1. Ir a /dashboard/pettyCash');
    console.log('   2. Probar agregar gastos/compras/ingresos');
    console.log('   3. Probar el cierre de caja');
    console.log('   4. Verificar que el frontend se actualiza correctamente');

  } catch (error) {
    console.error('❌ Error creando sesión:', error);
  }
}

// Ejecutar la función
createTestSession(); 