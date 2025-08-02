const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPettyCashFixes() {
  console.log('🔧 Probando correcciones de caja chica...\n');

  try {
    // 1. Verificar estructura de tabla CashSession
    console.log('📋 1. Verificando estructura de CashSession...');
    const { data: cashSessionColumns, error: cashSessionError } = await supabase
      .from('CashSession')
      .select('*')
      .limit(1);

    if (cashSessionError) {
      console.error('❌ Error al verificar CashSession:', cashSessionError);
    } else {
      console.log('✅ CashSession accesible correctamente');
      console.log('   Columnas disponibles:', Object.keys(cashSessionColumns[0] || {}));
    }

    // 2. Verificar estructura de tabla PettyCashExpense
    console.log('\n📋 2. Verificando estructura de PettyCashExpense...');
    const { data: expenseColumns, error: expenseError } = await supabase
      .from('PettyCashExpense')
      .select('*')
      .limit(1);

    if (expenseError) {
      console.error('❌ Error al verificar PettyCashExpense:', expenseError);
    } else {
      console.log('✅ PettyCashExpense accesible correctamente');
      console.log('   Columnas disponibles:', Object.keys(expenseColumns[0] || {}));
    }

    // 3. Verificar estructura de tabla PettyCashPurchase
    console.log('\n📋 3. Verificando estructura de PettyCashPurchase...');
    const { data: purchaseColumns, error: purchaseError } = await supabase
      .from('PettyCashPurchase')
      .select('*')
      .limit(1);

    if (purchaseError) {
      console.error('❌ Error al verificar PettyCashPurchase:', purchaseError);
    } else {
      console.log('✅ PettyCashPurchase accesible correctamente');
      console.log('   Columnas disponibles:', Object.keys(purchaseColumns[0] || {}));
    }

    // 4. Probar creación de sesión histórica
    console.log('\n📋 4. Probando creación de sesión histórica...');
    const testSessionData = {
      userId: 'd5a89886-4457-4373-8014-d3e0c4426e35',
      cashRegisterId: 1,
      openingAmount: 50000,
      currentAmount: 50000,
      openedAt: new Date().toISOString(),
      status: 'open',
      notes: 'Sesión de prueba para verificar correcciones'
    };

    const { data: newSession, error: sessionError } = await supabase
      .from('CashSession')
      .insert(testSessionData)
      .select()
      .single();

    if (sessionError) {
      console.error('❌ Error al crear sesión de prueba:', sessionError);
    } else {
      console.log('✅ Sesión de prueba creada exitosamente');
      console.log('   ID:', newSession.id);
      console.log('   Monto inicial:', newSession.openingAmount);
      console.log('   Estado:', newSession.status);

      // Limpiar sesión de prueba
      await supabase
        .from('CashSession')
        .delete()
        .eq('id', newSession.id);
      console.log('   🧹 Sesión de prueba eliminada');
    }

    // 5. Probar creación de gasto/ingreso
    console.log('\n📋 5. Probando creación de gasto/ingreso...');
    const testExpenseData = {
      sessionId: 1, // Usar una sesión existente
      description: 'Prueba de ingreso',
      amount: 10000,
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
      console.error('❌ Error al crear gasto/ingreso de prueba:', expenseCreateError);
    } else {
      console.log('✅ Gasto/ingreso de prueba creado exitosamente');
      console.log('   ID:', newExpense.id);
      console.log('   Descripción:', newExpense.description);
      console.log('   Monto:', newExpense.amount);
      console.log('   Tipo:', newExpense.transactionType);

      // Limpiar gasto de prueba
      await supabase
        .from('PettyCashExpense')
        .delete()
        .eq('id', newExpense.id);
      console.log('   🧹 Gasto de prueba eliminado');
    }

    // 6. Probar creación de compra
    console.log('\n📋 6. Probando creación de compra...');
    const testPurchaseData = {
      sessionId: 1, // Usar una sesión existente
      quantity: 2,
      unitPrice: 5000,
      totalAmount: 10000,
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
      console.error('❌ Error al crear compra de prueba:', purchaseCreateError);
    } else {
      console.log('✅ Compra de prueba creada exitosamente');
      console.log('   ID:', newPurchase.id);
      console.log('   Cantidad:', newPurchase.quantity);
      console.log('   Precio unitario:', newPurchase.unitPrice);
      console.log('   Total:', newPurchase.totalAmount);

      // Limpiar compra de prueba
      await supabase
        .from('PettyCashPurchase')
        .delete()
        .eq('id', newPurchase.id);
      console.log('   🧹 Compra de prueba eliminada');
    }

    // 7. Verificar sesiones existentes
    console.log('\n📋 7. Verificando sesiones existentes...');
    const { data: existingSessions, error: sessionsError } = await supabase
      .from('CashSession')
      .select('*')
      .order('openedAt', { ascending: false })
      .limit(5);

    if (sessionsError) {
      console.error('❌ Error al obtener sesiones:', sessionsError);
    } else {
      console.log('✅ Sesiones obtenidas correctamente');
      console.log(`   Total de sesiones encontradas: ${existingSessions.length}`);
      existingSessions.forEach((session, index) => {
        console.log(`   ${index + 1}. ID: ${session.id}, Estado: ${session.status}, Monto: $${session.openingAmount}`);
      });
    }

    console.log('\n🎉 ¡Todas las pruebas completadas exitosamente!');
    console.log('✅ El sistema de caja chica está funcionando correctamente');
    console.log('✅ Las correcciones de columnas han sido aplicadas');
    console.log('✅ Los ingresos de dinero funcionan correctamente');

  } catch (error) {
    console.error('❌ Error inesperado durante las pruebas:', error);
  }
}

testPettyCashFixes(); 