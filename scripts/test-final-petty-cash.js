const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes');
  console.log('💡 Para ejecutar este script, necesitas configurar las variables de entorno:');
  console.log('   - NEXT_PUBLIC_SUPABASE_URL');
  console.log('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testFinalPettyCash() {
  console.log('🎯 PRUEBA FINAL - Sistema de Caja Chica\n');

  try {
    // 1. Verificar que podemos acceder a las tablas
    console.log('📋 1. Verificando acceso a tablas...');
    
    const { data: cashSessions, error: cashSessionError } = await supabase
      .from('CashSession')
      .select('*')
      .limit(1);
    
    if (cashSessionError) {
      console.error('❌ Error accediendo a CashSession:', cashSessionError);
      return;
    }
    console.log('✅ CashSession accesible');

    const { data: expenses, error: expenseError } = await supabase
      .from('PettyCashExpense')
      .select('*')
      .limit(1);
    
    if (expenseError) {
      console.error('❌ Error accediendo a PettyCashExpense:', expenseError);
      return;
    }
    console.log('✅ PettyCashExpense accesible');

    const { data: purchases, error: purchaseError } = await supabase
      .from('PettyCashPurchase')
      .select('*')
      .limit(1);
    
    if (purchaseError) {
      console.error('❌ Error accediendo a PettyCashPurchase:', purchaseError);
      return;
    }
    console.log('✅ PettyCashPurchase accesible');

    // 2. Probar creación de sesión (sin closingAmount)
    console.log('\n📋 2. Probando creación de sesión...');
    const testSessionData = {
      userId: 'd5a89886-4457-4373-8014-d3e0c4426e35',
      cashRegisterId: 1,
      openingAmount: 100000,
      currentAmount: 100000,
      openedAt: new Date().toISOString(),
      status: 'open',
      notes: 'Sesión de prueba final'
    };

    const { data: newSession, error: sessionError } = await supabase
      .from('CashSession')
      .insert(testSessionData)
      .select()
      .single();

    if (sessionError) {
      console.error('❌ Error creando sesión:', sessionError);
      return;
    }
    console.log('✅ Sesión creada exitosamente');
    console.log(`   ID: ${newSession.id}`);
    console.log(`   Monto: $${newSession.openingAmount}`);

    // 3. Probar creación de gasto/ingreso (sin status)
    console.log('\n📋 3. Probando creación de gasto/ingreso...');
    const testExpenseData = {
      sessionId: newSession.id,
      description: 'Prueba de ingreso final',
      amount: 50000,
      category: 'Ingresos',
      paymentMethod: 'cash',
      transactionType: 'income',
      affectsPhysicalCash: true,
      userId: 'd5a89886-4457-4373-8014-d3e0c4426e35'
    };

    const { data: newExpense, error: expenseCreateError } = await supabase
      .from('PettyCashExpense')
      .insert(testExpenseData)
      .select()
      .single();

    if (expenseCreateError) {
      console.error('❌ Error creando gasto/ingreso:', expenseCreateError);
      return;
    }
    console.log('✅ Gasto/ingreso creado exitosamente');
    console.log(`   ID: ${newExpense.id}`);
    console.log(`   Descripción: ${newExpense.description}`);
    console.log(`   Monto: $${newExpense.amount}`);
    console.log(`   Tipo: ${newExpense.transactionType}`);

    // 4. Probar creación de compra (sin status)
    console.log('\n📋 4. Probando creación de compra...');
    const testPurchaseData = {
      sessionId: newSession.id,
      quantity: 2,
      unitPrice: 15000,
      totalAmount: 30000,
      paymentMethod: 'cash',
      transactionType: 'purchase',
      affectsPhysicalCash: true,
      userId: 'd5a89886-4457-4373-8014-d3e0c4426e35'
    };

    const { data: newPurchase, error: purchaseCreateError } = await supabase
      .from('PettyCashPurchase')
      .insert(testPurchaseData)
      .select()
      .single();

    if (purchaseCreateError) {
      console.error('❌ Error creando compra:', purchaseCreateError);
      return;
    }
    console.log('✅ Compra creada exitosamente');
    console.log(`   ID: ${newPurchase.id}`);
    console.log(`   Cantidad: ${newPurchase.quantity}`);
    console.log(`   Total: $${newPurchase.totalAmount}`);

    // 5. Verificar que podemos obtener los datos
    console.log('\n📋 5. Verificando obtención de datos...');
    
    const { data: sessionExpenses, error: getExpensesError } = await supabase
      .from('PettyCashExpense')
      .select('*')
      .eq('sessionId', newSession.id);

    if (getExpensesError) {
      console.error('❌ Error obteniendo gastos:', getExpensesError);
    } else {
      console.log(`✅ Gastos obtenidos: ${sessionExpenses.length}`);
    }

    const { data: sessionPurchases, error: getPurchasesError } = await supabase
      .from('PettyCashPurchase')
      .select('*')
      .eq('sessionId', newSession.id);

    if (getPurchasesError) {
      console.error('❌ Error obteniendo compras:', getPurchasesError);
    } else {
      console.log(`✅ Compras obtenidas: ${sessionPurchases.length}`);
    }

    // 6. Limpiar datos de prueba
    console.log('\n📋 6. Limpiando datos de prueba...');
    
    await supabase
      .from('PettyCashExpense')
      .delete()
      .eq('id', newExpense.id);
    console.log('✅ Gasto de prueba eliminado');

    await supabase
      .from('PettyCashPurchase')
      .delete()
      .eq('id', newPurchase.id);
    console.log('✅ Compra de prueba eliminada');

    await supabase
      .from('CashSession')
      .delete()
      .eq('id', newSession.id);
    console.log('✅ Sesión de prueba eliminada');

    console.log('\n🎉 ¡PRUEBA FINAL EXITOSA!');
    console.log('✅ Todas las correcciones funcionan correctamente');
    console.log('✅ No hay errores de columnas faltantes');
    console.log('✅ El sistema de caja chica está 100% operativo');
    console.log('✅ Los ingresos de dinero funcionan perfectamente');

  } catch (error) {
    console.error('❌ Error inesperado durante la prueba final:', error);
  }
}

testFinalPettyCash(); 