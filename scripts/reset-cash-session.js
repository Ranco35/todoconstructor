const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function resetCashSessions() {
  console.log('🧹 RESET DEL SISTEMA DE CAJA CHICA');
  console.log('==================================\n');

  try {
    // 1. Buscar sesiones activas
    console.log('1. Buscando sesiones activas...');
    const { data: activeSessions, error: sessionError } = await supabase
      .from('CashSession')
      .select('*')
      .eq('status', 'open');

    if (sessionError) {
      console.log('❌ Error buscando sesiones:', sessionError.message);
      return;
    }

    if (!activeSessions || activeSessions.length === 0) {
      console.log('✅ No hay sesiones activas para cerrar');
    } else {
      console.log(`⚠️  Encontradas ${activeSessions.length} sesión(es) activa(s):`);
      activeSessions.forEach(session => {
        console.log(`   - ID: ${session.id}, Usuario: ${session.userId}, Monto: $${session.openingAmount}`);
      });

      // 2. Cerrar sesiones activas
      console.log('\n2. Cerrando sesiones activas...');
      for (const session of activeSessions) {
        const { error: updateError } = await supabase
          .from('CashSession')
          .update({
            status: 'closed',
            closedAt: new Date().toISOString(),
            currentAmount: session.openingAmount, // Cerrar con monto inicial
            notes: 'SESIÓN CERRADA AUTOMÁTICAMENTE - RESET DEL SISTEMA'
          })
          .eq('id', session.id);

        if (updateError) {
          console.log(`❌ Error cerrando sesión ${session.id}:`, updateError.message);
        } else {
          console.log(`✅ Sesión ${session.id} cerrada correctamente`);
        }
      }
    }

    // 3. Revisar gastos y compras de prueba
    console.log('\n3. Revisando datos de prueba...');
    
    const { data: expenses, error: expensesError } = await supabase
      .from('PettyCashExpense')
      .select('id, sessionId, amount, description')
      .order('createdAt', { ascending: false })
      .limit(10);

    const { data: purchases, error: purchasesError } = await supabase
      .from('PettyCashPurchase')
      .select('id, sessionId, description, totalAmount')
      .order('createdAt', { ascending: false })
      .limit(10);

    if (expenses && expenses.length > 0) {
      console.log(`📊 Gastos recientes encontrados: ${expenses.length}`);
      expenses.forEach(expense => {
        console.log(`   - Sesión ${expense.sessionId}: $${expense.amount} - ${expense.description}`);
      });
    }

    if (purchases && purchases.length > 0) {
      console.log(`📊 Compras recientes encontradas: ${purchases.length}`);
      purchases.forEach(purchase => {
        console.log(`   - Sesión ${purchase.sessionId}: $${purchase.totalAmount} - ${purchase.description}`);
      });
    }

    // 4. Opción para limpiar datos de prueba
    console.log('\n4. OPCIONES DE LIMPIEZA:');
    console.log('========================================');
    console.log('Para limpiar datos de prueba, ejecuta manualmente:');
    console.log('');
    console.log('-- Eliminar gastos de prueba (opcional):');
    console.log("DELETE FROM \"PettyCashExpense\" WHERE description LIKE '%prueba%' OR description LIKE '%test%';");
    console.log('');
    console.log('-- Eliminar compras de prueba (opcional):');
    console.log("DELETE FROM \"PettyCashPurchase\" WHERE description LIKE '%prueba%' OR description LIKE '%test%';");
    console.log('');
    console.log('-- Eliminar sesiones cerradas automáticamente:');
    console.log("DELETE FROM \"CashSession\" WHERE notes LIKE '%RESET DEL SISTEMA%';");
    console.log('');

    // 5. Estado final
    console.log('5. VERIFICACIÓN FINAL...');
    const { data: remainingSessions, error: checkError } = await supabase
      .from('CashSession')
      .select('*')
      .eq('status', 'open');

    if (checkError) {
      console.log('❌ Error verificando estado final:', checkError.message);
    } else {
      console.log(`✅ Sesiones activas restantes: ${remainingSessions?.length || 0}`);
    }

    console.log('\n🎉 RESET COMPLETADO');
    console.log('====================');
    console.log('✅ Todas las sesiones activas han sido cerradas');
    console.log('✅ Puedes crear una nueva sesión limpia');
    console.log('✅ Ve a http://localhost:3000/dashboard/pettyCash');
    console.log('✅ Haz clic en "Abrir Nueva Sesión" para empezar');
    console.log('');
    console.log('📋 PASOS RECOMENDADOS PARA DATOS REALES:');
    console.log('1. Abre nueva sesión con monto inicial real');
    console.log('2. Registra solo gastos/compras reales');
    console.log('3. Usa descripciones claras y profesionales');
    console.log('4. Mantén recibos y documentación');

  } catch (error) {
    console.error('❌ Error durante el reset:', error);
  }
}

// Ejecutar reset
resetCashSessions(); 