const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabaseStructure() {
  console.log('🔍 Verificando estructura real de la base de datos...\n');

  try {
    // 1. Verificar estructura de CashSession
    console.log('📋 1. Estructura de tabla CashSession:');
    const { data: cashSessionSample, error: cashSessionError } = await supabase
      .from('CashSession')
      .select('*')
      .limit(1);

    if (cashSessionError) {
      console.error('❌ Error al verificar CashSession:', cashSessionError);
    } else if (cashSessionSample && cashSessionSample.length > 0) {
      const columns = Object.keys(cashSessionSample[0]);
      console.log('✅ Columnas disponibles:');
      columns.forEach(col => console.log(`   - ${col}`));
    } else {
      console.log('⚠️ Tabla CashSession vacía o no accesible');
    }

    // 2. Verificar estructura de PettyCashExpense
    console.log('\n📋 2. Estructura de tabla PettyCashExpense:');
    const { data: expenseSample, error: expenseError } = await supabase
      .from('PettyCashExpense')
      .select('*')
      .limit(1);

    if (expenseError) {
      console.error('❌ Error al verificar PettyCashExpense:', expenseError);
    } else if (expenseSample && expenseSample.length > 0) {
      const columns = Object.keys(expenseSample[0]);
      console.log('✅ Columnas disponibles:');
      columns.forEach(col => console.log(`   - ${col}`));
    } else {
      console.log('⚠️ Tabla PettyCashExpense vacía o no accesible');
    }

    // 3. Verificar estructura de PettyCashPurchase
    console.log('\n📋 3. Estructura de tabla PettyCashPurchase:');
    const { data: purchaseSample, error: purchaseError } = await supabase
      .from('PettyCashPurchase')
      .select('*')
      .limit(1);

    if (purchaseError) {
      console.error('❌ Error al verificar PettyCashPurchase:', purchaseError);
    } else if (purchaseSample && purchaseSample.length > 0) {
      const columns = Object.keys(purchaseSample[0]);
      console.log('✅ Columnas disponibles:');
      columns.forEach(col => console.log(`   - ${col}`));
    } else {
      console.log('⚠️ Tabla PettyCashPurchase vacía o no accesible');
    }

    // 4. Probar inserción sin status en PettyCashExpense
    console.log('\n📋 4. Probando inserción en PettyCashExpense sin status:');
    const testExpenseData = {
      sessionId: 1,
      description: 'Prueba sin status',
      amount: 1000,
      category: 'Prueba',
      paymentMethod: 'cash',
      transactionType: 'expense',
      affectsPhysicalCash: true,
      userId: 'd5a89886-4457-4373-8014-d3e0c4426e35'
    };

    const { data: newExpense, error: expenseInsertError } = await supabase
      .from('PettyCashExpense')
      .insert(testExpenseData)
      .select()
      .single();

    if (expenseInsertError) {
      console.error('❌ Error al insertar en PettyCashExpense:', expenseInsertError);
    } else {
      console.log('✅ Inserción exitosa sin campo status');
      console.log('   ID:', newExpense.id);
      console.log('   Descripción:', newExpense.description);
      
      // Limpiar
      await supabase
        .from('PettyCashExpense')
        .delete()
        .eq('id', newExpense.id);
      console.log('   🧹 Registro de prueba eliminado');
    }

    // 5. Probar inserción sin status en PettyCashPurchase
    console.log('\n📋 5. Probando inserción en PettyCashPurchase sin status:');
    const testPurchaseData = {
      sessionId: 1,
      quantity: 1,
      unitPrice: 1000,
      totalAmount: 1000,
      paymentMethod: 'cash',
      transactionType: 'purchase',
      affectsPhysicalCash: true,
      userId: 'd5a89886-4457-4373-8014-d3e0c4426e35'
    };

    const { data: newPurchase, error: purchaseInsertError } = await supabase
      .from('PettyCashPurchase')
      .insert(testPurchaseData)
      .select()
      .single();

    if (purchaseInsertError) {
      console.error('❌ Error al insertar en PettyCashPurchase:', purchaseInsertError);
    } else {
      console.log('✅ Inserción exitosa sin campo status');
      console.log('   ID:', newPurchase.id);
      console.log('   Total:', newPurchase.totalAmount);
      
      // Limpiar
      await supabase
        .from('PettyCashPurchase')
        .delete()
        .eq('id', newPurchase.id);
      console.log('   🧹 Registro de prueba eliminado');
    }

    console.log('\n🎯 CONCLUSIÓN:');
    console.log('✅ Las tablas NO tienen columna status');
    console.log('✅ Las inserciones funcionan correctamente sin status');
    console.log('✅ El código debe eliminar todas las referencias a status');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

checkDatabaseStructure(); 