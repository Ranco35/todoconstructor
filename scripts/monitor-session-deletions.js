const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bvzfuibqlprrfbudnauc.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2emZ1aWJxbHBycmZidWRuYXVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU1MjYwMSwiZXhwIjoyMDY2MTI4NjAxfQ.4TGUtzCpdxCEwlpC3WKlHJ4I6O7ZGTCbFQBARYgv834'
);

async function monitorSessionDeletions() {
  console.log('🔍 MONITOR DE ELIMINACIONES DE SESIONES');
  console.log('=====================================\n');

  try {
    // 1. Buscar sesiones activas actuales
    console.log('1. Estado actual del sistema...');
    const { data: activeSessions, error: activeError } = await supabase
      .from('CashSession')
      .select('*')
      .eq('status', 'open');

    if (activeError) {
      console.log('❌ Error buscando sesiones activas:', activeError.message);
      return;
    }

    console.log(`📊 Sesiones activas encontradas: ${activeSessions?.length || 0}`);
    if (activeSessions && activeSessions.length > 0) {
      activeSessions.forEach(session => {
        console.log(`   ✅ ID: ${session.id} | Usuario: ${session.userId} | Monto: $${session.openingAmount} | Abierta: ${new Date(session.openedAt).toLocaleString()}`);
      });
    }

    // 2. Buscar todas las sesiones (incluyendo cerradas)
    console.log('\n2. Historial completo de sesiones...');
    const { data: allSessions, error: allError } = await supabase
      .from('CashSession')
      .select('*')
      .order('id', { ascending: false })
      .limit(20);

    if (allError) {
      console.log('❌ Error obteniendo historial:', allError.message);
      return;
    }

    console.log(`📈 Total sesiones en BD (últimas 20): ${allSessions?.length || 0}`);
    if (allSessions && allSessions.length > 0) {
      console.log('\n📋 HISTORIAL DE SESIONES:');
      allSessions.forEach(session => {
        const status = session.status;
        const statusIcon = status === 'open' ? '🟢' : status === 'closed' ? '🔴' : '🟡';
        const closedInfo = session.closedAt ? ` | Cerrada: ${new Date(session.closedAt).toLocaleString()}` : '';
        console.log(`   ${statusIcon} ID: ${session.id} | Estado: ${status} | Usuario: ${session.userId} | Abierta: ${new Date(session.openedAt).toLocaleString()}${closedInfo}`);
      });
    }

    // 3. Identificar gaps en los IDs (sesiones eliminadas)
    console.log('\n3. Análisis de sesiones eliminadas...');
    if (allSessions && allSessions.length > 1) {
      const ids = allSessions.map(s => s.id).sort((a, b) => a - b);
      const minId = Math.min(...ids);
      const maxId = Math.max(...ids);
      
      console.log(`🔢 Rango de IDs: ${minId} - ${maxId}`);
      
      const missingIds = [];
      for (let i = minId; i <= maxId; i++) {
        if (!ids.includes(i)) {
          missingIds.push(i);
        }
      }
      
      if (missingIds.length > 0) {
        console.log(`⚠️  SESIONES ELIMINADAS DETECTADAS:`);
        console.log(`   IDs faltantes: ${missingIds.join(', ')}`);
        console.log(`   Total eliminadas: ${missingIds.length}`);
        
        // Verificar si alguna de estas era la sesión 5 o 6 que causó problemas
        if (missingIds.includes(5)) {
          console.log(`   🔴 CONFIRMADO: Sesión ID 5 fue eliminada (mencionada en problema anterior)`);
        }
        if (missingIds.includes(6)) {
          console.log(`   🔴 CONFIRMADO: Sesión ID 6 fue eliminada (problema actual)`);
        }
      } else {
        console.log(`✅ No se detectaron eliminaciones (secuencia de IDs continua)`);
      }
    }

    // 4. Buscar transacciones huérfanas (gastos/compras sin sesión)
    console.log('\n4. Verificando transacciones huérfanas...');
    
    const { data: expenses, error: expenseError } = await supabase
      .from('PettyCashExpense')
      .select('id, sessionId, amount, description, createdAt')
      .order('createdAt', { ascending: false })
      .limit(10);

    const { data: purchases, error: purchaseError } = await supabase
      .from('PettyCashPurchase')
      .select('id, sessionId, description, totalAmount, createdAt')
      .order('createdAt', { ascending: false })
      .limit(10);

    // Verificar si hay gastos que referencian sesiones eliminadas
    if (expenses && expenses.length > 0) {
      const sessionIds = allSessions?.map(s => s.id) || [];
      const orphanExpenses = expenses.filter(exp => !sessionIds.includes(exp.sessionId));
      
      if (orphanExpenses.length > 0) {
        console.log(`🔴 GASTOS HUÉRFANOS ENCONTRADOS:`);
        orphanExpenses.forEach(expense => {
          console.log(`   - ID: ${expense.id} | Sesión: ${expense.sessionId} | Monto: $${expense.amount} | ${expense.description}`);
        });
      } else {
        console.log(`✅ No hay gastos huérfanos`);
      }
    }

    if (purchases && purchases.length > 0) {
      const sessionIds = allSessions?.map(s => s.id) || [];
      const orphanPurchases = purchases.filter(pur => !sessionIds.includes(pur.sessionId));
      
      if (orphanPurchases.length > 0) {
        console.log(`🔴 COMPRAS HUÉRFANAS ENCONTRADAS:`);
        orphanPurchases.forEach(purchase => {
          console.log(`   - ID: ${purchase.id} | Sesión: ${purchase.sessionId} | Monto: $${purchase.totalAmount} | ${purchase.description}`);
        });
      } else {
        console.log(`✅ No hay compras huérfanas`);
      }
    }

    // 5. Posibles causas de eliminación
    console.log('\n5. POSIBLES CAUSAS DE ELIMINACIÓN:');
    console.log('==================================');
    console.log('🔍 Scripts sospechosos que pueden eliminar sesiones:');
    console.log('   - scripts/reset-cash-session.js (cierra pero NO elimina)');
    console.log('   - resetCashSessions() action (cierra pero NO elimina)');
    console.log('   - deleteCashSession() action (SÍ elimina)');
    console.log('   - DeleteSessionModal component (SÍ elimina)');
    console.log('   - Scripts manuales de limpieza');
    console.log('   - Eliminación directa desde BD/dashboard');
    console.log('');
    console.log('🚨 RECOMENDACIONES:');
    console.log('   1. NUNCA usar deleteCashSession() en sesiones con transacciones');
    console.log('   2. Solo CERRAR sesiones, no eliminarlas');
    console.log('   3. Implementar soft-delete si es necesario');
    console.log('   4. Agregar logs de auditoría');

    // 6. Estado de la base de datos
    console.log('\n6. VERIFICACIÓN DE INTEGRIDAD:');
    console.log('==============================');
    
    // Total de registros
    const { count: totalSessions } = await supabase
      .from('CashSession')
      .select('*', { count: 'exact', head: true });
    
    const { count: totalExpenses } = await supabase
      .from('PettyCashExpense')
      .select('*', { count: 'exact', head: true });
    
    const { count: totalPurchases } = await supabase
      .from('PettyCashPurchase')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Resumen de registros:`);
    console.log(`   Total sesiones: ${totalSessions || 0}`);
    console.log(`   Total gastos: ${totalExpenses || 0}`);
    console.log(`   Total compras: ${totalPurchases || 0}`);

    // 7. Crear nueva sesión si no hay activa
    if (!activeSessions || activeSessions.length === 0) {
      console.log('\n7. ¿CREAR NUEVA SESIÓN?');
      console.log('=======================');
      console.log('❌ No hay sesión activa.');
      console.log('💡 Para continuar trabajando, crea una nueva sesión:');
      console.log('   1. Ve a: http://localhost:3000/dashboard/pettyCash');
      console.log('   2. Haz clic en "Abrir Nueva Sesión"');
      console.log('   3. Usa un monto inicial real');
      console.log('');
      console.log('🔧 O ejecuta este script para crear una de prueba:');
      console.log('   node scripts/create-new-session-simple.js');
    }

    console.log('\n✅ MONITOREO COMPLETADO');
    console.log('=======================');

  } catch (error) {
    console.error('❌ Error durante monitoreo:', error);
  }
}

// Función auxiliar para crear una nueva sesión de emergencia
async function createEmergencySession(amount = 1000) {
  console.log('\n🚨 CREANDO SESIÓN DE EMERGENCIA...');
  
  try {
    const { data: session, error } = await supabase
      .from('CashSession')
      .insert({
        sessionNumber: `EMERGENCY-${Date.now()}`,
        userId: 1,
        cashRegisterId: 1,
        openingAmount: amount,
        status: 'open',
        openedAt: new Date().toISOString(),
        notes: `Sesión de emergencia creada por script de monitoreo. Fecha: ${new Date().toLocaleString()}`
      })
      .select()
      .single();

    if (error) {
      console.log('❌ Error creando sesión de emergencia:', error.message);
    } else {
      console.log('✅ Sesión de emergencia creada:');
      console.log(`   ID: ${session.id}`);
      console.log(`   Monto: $${amount.toLocaleString()}`);
      console.log(`   Estado: ${session.status}`);
    }
  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

// Ejecutar monitoreo
if (require.main === module) {
  monitorSessionDeletions();
  
  // Si quieres crear una sesión de emergencia, descomenta la siguiente línea:
  // createEmergencySession(1000);
} 