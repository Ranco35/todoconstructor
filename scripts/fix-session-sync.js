require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixSessionSync() {
  console.log('🔧 Iniciando verificación y limpieza de sesiones...\n');

  try {
    // 1. Verificar sesiones existentes
    console.log('📋 Verificando sesiones existentes...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('CashSession')
      .select('*')
      .order('id', { ascending: false });

    if (sessionsError) {
      console.error('❌ Error obteniendo sesiones:', sessionsError);
      return;
    }

    console.log(`✅ Encontradas ${sessions.length} sesiones:`);
    sessions.forEach(session => {
      console.log(`   - Sesión ${session.id}: ${session.status} ($${session.openingAmount})`);
    });

    // 2. Verificar transacciones huérfanas
    console.log('\n🔍 Verificando transacciones huérfanas...');
    
    const { data: expenses, error: expensesError } = await supabase
      .from('PettyCashExpense')
      .select('id, sessionId, amount, description')
      .order('createdAt', { ascending: false });

    const { data: purchases, error: purchasesError } = await supabase
      .from('PettyCashPurchase')
      .select('id, sessionId, totalAmount, description')
      .order('createdAt', { ascending: false });

    if (expensesError) console.error('❌ Error obteniendo gastos:', expensesError);
    if (purchasesError) console.error('❌ Error obteniendo compras:', purchasesError);

    const sessionIds = sessions.map(s => s.id);
    
    // Verificar gastos huérfanos
    if (expenses) {
      const orphanExpenses = expenses.filter(exp => !sessionIds.includes(exp.sessionId));
      if (orphanExpenses.length > 0) {
        console.log(`🔴 Encontrados ${orphanExpenses.length} gastos huérfanos:`);
        orphanExpenses.forEach(exp => {
          console.log(`   - Gasto ${exp.id}: Sesión ${exp.sessionId} ($${exp.amount}) - ${exp.description}`);
        });
      } else {
        console.log('✅ No hay gastos huérfanos');
      }
    }

    // Verificar compras huérfanas
    if (purchases) {
      const orphanPurchases = purchases.filter(pur => !sessionIds.includes(pur.sessionId));
      if (orphanPurchases.length > 0) {
        console.log(`🔴 Encontradas ${orphanPurchases.length} compras huérfanas:`);
        orphanPurchases.forEach(pur => {
          console.log(`   - Compra ${pur.id}: Sesión ${pur.sessionId} ($${pur.totalAmount}) - ${pur.description}`);
        });
      } else {
        console.log('✅ No hay compras huérfanas');
      }
    }

    // 3. Verificar cierres de caja
    console.log('\n💰 Verificando cierres de caja...');
    const { data: closures, error: closuresError } = await supabase
      .from('CashClosure')
      .select('id, sessionId, closingAmount, closedAt');

    if (closuresError) {
      console.error('❌ Error obteniendo cierres:', closuresError);
    } else {
      const orphanClosures = closures.filter(closure => !sessionIds.includes(closure.sessionId));
      if (orphanClosures.length > 0) {
        console.log(`🔴 Encontrados ${orphanClosures.length} cierres huérfanos:`);
        orphanClosures.forEach(closure => {
          console.log(`   - Cierre ${closure.id}: Sesión ${closure.sessionId} ($${closure.closingAmount})`);
        });
      } else {
        console.log('✅ No hay cierres huérfanos');
      }
    }

    // 4. Resumen y recomendaciones
    console.log('\n📊 RESUMEN:');
    console.log('==========');
    console.log(`   - Sesiones totales: ${sessions.length}`);
    console.log(`   - Sesiones abiertas: ${sessions.filter(s => s.status === 'open').length}`);
    console.log(`   - Sesiones cerradas: ${sessions.filter(s => s.status === 'closed').length}`);
    console.log(`   - Sesiones suspendidas: ${sessions.filter(s => s.status === 'suspended').length}`);

    const totalOrphanExpenses = expenses ? expenses.filter(exp => !sessionIds.includes(exp.sessionId)).length : 0;
    const totalOrphanPurchases = purchases ? purchases.filter(pur => !sessionIds.includes(pur.sessionId)).length : 0;
    const totalOrphanClosures = closures ? closures.filter(closure => !sessionIds.includes(closure.sessionId)).length : 0;

    if (totalOrphanExpenses > 0 || totalOrphanPurchases > 0 || totalOrphanClosures > 0) {
      console.log('\n⚠️  PROBLEMAS DETECTADOS:');
      console.log(`   - Gastos huérfanos: ${totalOrphanExpenses}`);
      console.log(`   - Compras huérfanas: ${totalOrphanPurchases}`);
      console.log(`   - Cierres huérfanos: ${totalOrphanClosures}`);
      
      console.log('\n💡 RECOMENDACIONES:');
      console.log('   1. Revisar si las transacciones huérfanas son válidas');
      console.log('   2. Si son válidas, crear sesiones para ellas');
      console.log('   3. Si no son válidas, eliminarlas manualmente');
      console.log('   4. Verificar que no haya problemas de integridad referencial');
    } else {
      console.log('\n✅ SISTEMA EN BUEN ESTADO');
      console.log('   No se detectaron problemas de sincronización');
    }

  } catch (error) {
    console.error('❌ Error en la verificación:', error);
  }
}

fixSessionSync(); 