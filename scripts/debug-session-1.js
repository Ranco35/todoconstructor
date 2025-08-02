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

async function debugSession1() {
  console.log('🔍 Debugging sesión 1...\n');

  try {
    // 1. Verificar si la sesión 1 existe directamente
    console.log('📋 Verificando sesión 1 directamente...');
    const { data: session1, error: session1Error } = await supabase
      .from('CashSession')
      .select('*')
      .eq('id', 1)
      .single();

    if (session1Error) {
      console.error('❌ Error obteniendo sesión 1:', session1Error);
    } else {
      console.log('✅ Sesión 1 encontrada:', session1);
    }

    // 2. Verificar con la misma query que usa forceDeleteCashSession
    console.log('\n🔍 Verificando con query de forceDeleteCashSession...');
    const { data: sessionWithRelations, error: relationsError } = await supabase
      .from('CashSession')
      .select(`
        *,
        PettyCashExpense:PettyCashExpense(id, amount, description),
        PettyCashPurchase:PettyCashPurchase(id, totalAmount, description),
        CashClosure:CashClosure(id)
      `)
      .eq('id', 1)
      .single();

    if (relationsError) {
      console.error('❌ Error con query de relaciones:', relationsError);
    } else {
      console.log('✅ Sesión 1 con relaciones encontrada:', sessionWithRelations);
    }

    // 3. Verificar si hay problemas con las tablas relacionadas
    console.log('\n🔍 Verificando tablas relacionadas...');
    
    // Verificar PettyCashExpense
    const { data: expenses, error: expensesError } = await supabase
      .from('PettyCashExpense')
      .select('id, sessionId, amount')
      .eq('sessionId', 1);

    if (expensesError) {
      console.error('❌ Error obteniendo gastos:', expensesError);
    } else {
      console.log(`✅ Gastos para sesión 1: ${expenses?.length || 0}`);
    }

    // Verificar PettyCashPurchase
    const { data: purchases, error: purchasesError } = await supabase
      .from('PettyCashPurchase')
      .select('id, sessionId, totalAmount')
      .eq('sessionId', 1);

    if (purchasesError) {
      console.error('❌ Error obteniendo compras:', purchasesError);
    } else {
      console.log(`✅ Compras para sesión 1: ${purchases?.length || 0}`);
    }

    // 4. Verificar si la tabla CashClosure existe
    console.log('\n🔍 Verificando tabla CashClosure...');
    try {
      const { data: closures, error: closuresError } = await supabase
        .from('CashClosure')
        .select('id, sessionId')
        .eq('sessionId', 1);

      if (closuresError) {
        console.log('ℹ️  Tabla CashClosure no existe o error:', closuresError.message);
      } else {
        console.log(`✅ Cierres para sesión 1: ${closures?.length || 0}`);
      }
    } catch (error) {
      console.log('ℹ️  Tabla CashClosure no existe');
    }

    // 5. Simular la eliminación paso a paso
    console.log('\n🧪 Simulando eliminación paso a paso...');
    
    if (session1) {
      console.log('📊 Estadísticas de la sesión 1:');
      console.log(`   - Gastos: ${expenses?.length || 0}`);
      console.log(`   - Compras: ${purchases?.length || 0}`);
      console.log(`   - Estado: ${session1.status}`);
      console.log(`   - Monto inicial: $${session1.openingAmount}`);
      
      if (expenses?.length > 0 || purchases?.length > 0) {
        console.log('\n⚠️  ADVERTENCIA: La sesión tiene transacciones asociadas');
        console.log('   Solo se puede eliminar con "Eliminación Fuerte"');
      } else {
        console.log('\n✅ La sesión no tiene transacciones, se puede eliminar normalmente');
      }
    }

  } catch (error) {
    console.error('❌ Error en el debug:', error);
  }
}

debugSession1(); 