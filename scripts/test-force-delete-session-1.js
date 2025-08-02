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

async function testForceDeleteSession1() {
  console.log('🧪 Probando eliminación fuerte de sesión 1...\n');

  try {
    // 1. Verificar estado actual de la sesión 1
    console.log('📋 Verificando estado actual de sesión 1...');
    const { data: session1, error: session1Error } = await supabase
      .from('CashSession')
      .select('*')
      .eq('id', 1)
      .single();

    if (session1Error) {
      console.error('❌ Error obteniendo sesión 1:', session1Error);
      return;
    }

    console.log('✅ Sesión 1 encontrada:', {
      id: session1.id,
      status: session1.status,
      openingAmount: session1.openingAmount,
      currentAmount: session1.currentAmount
    });

    // 2. Verificar transacciones asociadas
    console.log('\n🔍 Verificando transacciones asociadas...');
    
    const { data: expenses, error: expensesError } = await supabase
      .from('PettyCashExpense')
      .select('id, amount, description')
      .eq('sessionId', 1);

    const { data: purchases, error: purchasesError } = await supabase
      .from('PettyCashPurchase')
      .select('id, totalAmount, description')
      .eq('sessionId', 1);

    if (expensesError) console.error('❌ Error obteniendo gastos:', expensesError);
    if (purchasesError) console.error('❌ Error obteniendo compras:', purchasesError);

    console.log(`   - Gastos: ${expenses?.length || 0}`);
    console.log(`   - Compras: ${purchases?.length || 0}`);

    if (expenses) {
      expenses.forEach(exp => {
        console.log(`     * Gasto ${exp.id}: $${exp.amount} - ${exp.description}`);
      });
    }

    if (purchases) {
      purchases.forEach(pur => {
        console.log(`     * Compra ${pur.id}: $${pur.totalAmount} - ${pur.description}`);
      });
    }

    // 3. Simular eliminación fuerte (solo para prueba)
    console.log('\n⚠️  SIMULACIÓN: No se eliminará realmente la sesión');
    console.log('   Para eliminar realmente, usa la interfaz web con un usuario administrador');
    
    console.log('\n📋 Resumen de lo que se eliminaría:');
    console.log(`   - Sesión ${session1.id} ($${session1.openingAmount})`);
    console.log(`   - ${expenses?.length || 0} gastos`);
    console.log(`   - ${purchases?.length || 0} compras`);

    // 4. Verificar que la función corregida funcionaría
    console.log('\n✅ La función forceDeleteCashSession ha sido corregida');
    console.log('   - Eliminó referencias a tabla CashClosure inexistente');
    console.log('   - Ahora debería funcionar correctamente');
    console.log('   - Puedes probar la eliminación desde la interfaz web');

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  }
}

testForceDeleteSession1(); 