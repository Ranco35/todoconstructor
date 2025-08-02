const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ibpbclxszblystwffxzn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlicGJjbHhzemJseXN0d2ZmeHpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxOTE5NzQ5MywiZXhwIjoyMDM0NzczNDkzfQ.hHCcQ6dQON7_3bgjYGqj-K9bMQnGqgJ6lzCJD7UJ1bw';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function quickOpenSession() {
  try {
    console.log('🚀 ABRIENDO SESIÓN RÁPIDA DE PRUEBA');
    console.log('════════════════════════════════════');
    
    // 1. Buscar cualquier usuario disponible
    console.log('🔍 Buscando usuarios disponibles...');
    const { data: users } = await supabase
      .from('User')
      .select('*')
      .limit(5);
    
    if (!users || users.length === 0) {
      console.log('❌ No se encontraron usuarios');
      return;
    }
    
    console.log(`📋 Usuarios encontrados: ${users.length}`);
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name || user.firstName} (${user.email || user.id})`);
    });
    
    // Usar el primer usuario
    const user = users[0];
    console.log(`✅ Usando usuario: ${user.name || user.firstName} (${user.email || user.id})`);
    
    // 2. Cerrar cualquier sesión activa
    console.log('\n🔒 Cerrando sesiones previas...');
    await supabase
      .from('CashSession')
      .update({ status: 'closed', closedAt: new Date().toISOString() })
      .eq('status', 'open');
    
    console.log('✅ Sesiones previas cerradas');
    
    // 3. Crear nueva sesión
    console.log('\n🆕 Creando nueva sesión...');
    const sessionData = {
      userId: user.id,
      cashRegisterId: 1,
      openingAmount: 100,
      currentAmount: 100,
      status: 'open',
      openedAt: new Date().toISOString(),
      notes: 'Sesión de prueba para test de cierre'
    };
    
    const { data: newSession, error } = await supabase
      .from('CashSession')
      .insert(sessionData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error al crear sesión:', error);
      return;
    }
    
    console.log('✅ SESIÓN CREADA:');
    console.log(`   ID: ${newSession.id}`);
    console.log(`   Usuario: ${user.name || user.firstName}`);
    console.log(`   Monto inicial: $${newSession.openingAmount.toLocaleString()}`);
    
    // 4. Agregar algunas transacciones de prueba
    console.log('\n💸 Agregando transacciones de prueba...');
    
    try {
      // Agregar un gasto
      await supabase
        .from('PettyCashExpense')
        .insert({
          sessionId: newSession.id,
          amount: 50,
          description: 'Gasto de prueba para testing',
          category: 'Oficina',
          costCenterId: 1,
          receiptNumber: 'TEST-001',
          createdAt: new Date().toISOString()
        });
        
      console.log('   ✅ Gasto agregado: $50');
    } catch (expenseError) {
      console.log('   ⚠️ No se pudo agregar gasto:', expenseError.message);
    }
      
    try {
      // Agregar una compra  
      await supabase
        .from('PettyCashPurchase')
        .insert({
          sessionId: newSession.id,
          productId: 1,
          quantity: 2,
          unitPrice: 25,
          costCenterId: 1,
          supplierId: 1,
          createdAt: new Date().toISOString()
        });
        
      console.log('   ✅ Compra agregada: 2 x $25 = $50');
    } catch (purchaseError) {
      console.log('   ⚠️ No se pudo agregar compra:', purchaseError.message);
    }
    
    console.log('\n🎯 LISTO PARA PROBAR:');
    console.log(`   URL: http://localhost:3000/dashboard/pettyCash`);
    console.log('   - Efectivo inicial: $100');
    console.log('   - Total gastos/compras: $100');
    console.log('   - Efectivo esperado: $0');
    console.log('   - Perfecto para probar el caso de déficit!');
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

quickOpenSession(); 