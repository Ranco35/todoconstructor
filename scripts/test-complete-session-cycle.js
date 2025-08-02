const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bvzfuibqlprrfbudnauc.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2emZ1aWJxbHBycmZidWRuYXVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU1MjYwMSwiZXhwIjoyMDY2MTI4NjAxfQ.4TGUtzCpdxCEwlpC3WKlHJ4I6O7ZGTCbFQBARYgv834'
);

async function testCompleteSessionCycle() {
  console.log('🧪 PRUEBA COMPLETA: CREAR → USAR → CERRAR SESIÓN');
  console.log('='.repeat(60));

  try {
    // 1. Cerrar sesiones activas
    console.log('\n1️⃣ Cerrando sesiones activas previas...');
    await supabase
      .from('CashSession')
      .update({ 
        status: 'closed', 
        closedAt: new Date().toISOString(),
        notes: 'Cerrada automáticamente para prueba'
      })
      .eq('status', 'open');

    // 2. Buscar cualquier usuario disponible
    console.log('\n2️⃣ Buscando usuario disponible...');
    const { data: users, error: usersError } = await supabase
      .from('User')
      .select('*')
      .or('role.eq.SUPER_USER,role.eq.ADMINISTRADOR,isCashier.eq.true')
      .eq('isActive', true)
      .limit(1);

    if (usersError || !users || users.length === 0) {
      console.log('❌ No se encontró ningún usuario disponible');
      return;
    }

    const user = users[0];
    console.log(`✅ Usuario encontrado: ${user.name} (${user.email})`);
    console.log(`   ID: ${user.id}, Role: ${user.role}`);

    // 3. Crear nueva sesión
    console.log('\n3️⃣ Creando nueva sesión...');
    const { data: newSession, error: sessionError } = await supabase
      .from('CashSession')
      .insert({
        userId: user.id,
        cashRegisterId: 1,
        openingAmount: 100,
        currentAmount: 100,
        status: 'open',
        openedAt: new Date().toISOString(),
        notes: 'Sesión de prueba completa - ' + new Date().toLocaleString()
      })
      .select()
      .single();

    if (sessionError) {
      console.log('❌ Error creando sesión:', sessionError);
      return;
    }

    console.log(`✅ Sesión creada: ID ${newSession.id}`);
    console.log(`   💰 Monto inicial: $${newSession.openingAmount}`);

    // 4. Agregar transacciones de prueba
    console.log('\n4️⃣ Agregando transacciones...');
    
    // Crear gasto
    const { data: expense, error: expenseError } = await supabase
      .from('PettyCashExpense')
      .insert({
        sessionId: newSession.id,
        amount: 30,
        description: 'Gasto de prueba - materiales oficina',
        category: 'Oficina',
        costCenterId: 1,
        receiptNumber: 'TEST-' + Date.now(),
        createdAt: new Date().toISOString()
      })
      .select()
      .single();

    if (expenseError) {
      console.log('⚠️ Error agregando gasto:', expenseError.message);
    } else {
      console.log(`✅ Gasto agregado: $${expense.amount} - ${expense.description}`);
    }

    // Crear compra
    const { data: purchase, error: purchaseError } = await supabase
      .from('PettyCashPurchase')
      .insert({
        sessionId: newSession.id,
        productId: 1,
        quantity: 2,
        unitPrice: 15,
        costCenterId: 1,
        supplierId: 1,
        createdAt: new Date().toISOString()
      })
      .select()
      .single();

    if (purchaseError) {
      console.log('⚠️ Error agregando compra:', purchaseError.message);
    } else {
      console.log(`✅ Compra agregada: ${purchase.quantity} x $${purchase.unitPrice} = $${purchase.quantity * purchase.unitPrice}`);
    }

    // 5. Calcular totales
    console.log('\n5️⃣ Calculando totales...');
    const totalGastos = expense ? expense.amount : 0;
    const totalCompras = purchase ? (purchase.quantity * purchase.unitPrice) : 0;
    const efectivoEsperado = newSession.openingAmount - totalGastos - totalCompras;

    console.log(`💸 Total gastos: $${totalGastos}`);
    console.log(`🛍️ Total compras: $${totalCompras}`);
    console.log(`🎯 Efectivo esperado: $${efectivoEsperado}`);

    // 6. Simular cierre de caja
    console.log('\n6️⃣ Simulando cierre de caja...');
    const { data: closedSession, error: closeError } = await supabase
      .from('CashSession')
      .update({
        status: 'closed',
        closedAt: new Date().toISOString(),
        currentAmount: efectivoEsperado, // Cerrar con el monto esperado
        notes: `CIERRE DE PRUEBA:
Monto inicial: $${newSession.openingAmount}
Gastos: $${totalGastos}
Compras: $${totalCompras}
Efectivo final: $${efectivoEsperado}
Fecha: ${new Date().toLocaleString()}`
      })
      .eq('id', newSession.id)
      .select()
      .single();

    if (closeError) {
      console.log('❌ Error cerrando sesión:', closeError);
      return;
    }

    console.log('✅ Sesión cerrada exitosamente');

    // 7. Intentar eliminar sesión (debería fallar)
    console.log('\n7️⃣ Probando eliminación (debería fallar)...');
    const { error: deleteError } = await supabase
      .from('CashSession')
      .delete()
      .eq('id', newSession.id);

    if (deleteError) {
      console.log(`✅ CORRECTO: No se pudo eliminar la sesión`);
      console.log(`   Razón: ${deleteError.message}`);
    } else {
      console.log(`❌ PROBLEMA: La sesión se eliminó cuando NO debería`);
    }

    // 8. Verificar integridad
    console.log('\n8️⃣ Verificando integridad final...');
    const { data: finalSession } = await supabase
      .from('CashSession')
      .select('*')
      .eq('id', newSession.id)
      .single();

    const { data: finalExpenses } = await supabase
      .from('PettyCashExpense')
      .select('*')
      .eq('sessionId', newSession.id);

    const { data: finalPurchases } = await supabase
      .from('PettyCashPurchase')
      .select('*')
      .eq('sessionId', newSession.id);

    console.log(`📊 ESTADO FINAL:`);
    console.log(`   Sesión existe: ${finalSession ? 'SÍ' : 'NO'}`);
    console.log(`   Estado: ${finalSession?.status || 'N/A'}`);
    console.log(`   Gastos asociados: ${finalExpenses?.length || 0}`);
    console.log(`   Compras asociadas: ${finalPurchases?.length || 0}`);

    if (finalSession && finalSession.status === 'closed' && 
        (finalExpenses?.length > 0 || finalPurchases?.length > 0)) {
      console.log('\n🎉 PRUEBA EXITOSA: Ciclo completo funciona correctamente');
      console.log('   ✅ Sesión se creó');
      console.log('   ✅ Transacciones se agregaron');
      console.log('   ✅ Sesión se cerró');
      console.log('   ✅ Sesión no se puede eliminar (protegida)');
    } else {
      console.log('\n❌ PRUEBA FALLIDA: Hay problemas en el ciclo');
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

if (require.main === module) {
  testCompleteSessionCycle();
} 