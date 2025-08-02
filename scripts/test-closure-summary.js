const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 PROBANDO getCashClosureSummary\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testClosureSummary() {
  try {
    const sessionId = 4; // La sesión activa
    
    console.log(`🔍 1. Probando getCashClosureSummary para sesión ${sessionId}...`);

    // Primero verificar la estructura de la tabla User
    console.log('\n📊 1.1. Verificando estructura de tabla User...');
    const { data: users, error: usersError } = await supabase
      .from('User')
      .select('*')
      .limit(1);

    if (usersError) {
      console.error('❌ Error consultando usuarios:', usersError.message);
      return;
    }

    if (users && users.length > 0) {
      console.log('✅ Campos disponibles en User:', Object.keys(users[0]));
    }

    // Verificar la sesión específica
    console.log('\n📊 1.2. Verificando sesión específica...');
    const { data: session, error: sessionError } = await supabase
      .from('CashSession')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      console.error('❌ Error consultando sesión:', sessionError.message);
      return;
    }

    console.log('✅ Sesión encontrada:', {
      id: session.id,
      userId: session.userId,
      openingAmount: session.openingAmount,
      status: session.status
    });

    // Verificar el usuario de la sesión
    console.log('\n📊 1.3. Verificando usuario de la sesión...');
    const { data: sessionUser, error: userError } = await supabase
      .from('User')
      .select('*')
      .eq('id', session.userId)
      .single();

    if (userError) {
      console.error('❌ Error consultando usuario de sesión:', userError.message);
      return;
    }

    console.log('✅ Usuario de sesión:', {
      id: sessionUser.id,
      name: sessionUser.name,
      email: sessionUser.email
    });

    // Simular la función getCashClosureSummary manualmente
    console.log('\n🔧 2. Simulando getCashClosureSummary...');

    // Obtener ventas del día para esta caja registradora
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    console.log(`   Buscando ventas del ${startOfDay.toISOString()} al ${endOfDay.toISOString()}`);

    const { data: sales, error: salesError } = await supabase
      .from('sale')
      .select(`
        *,
        Invoice:invoiceId(*)
      `)
      .eq('cashRegisterId', session.cashRegisterId)
      .gte('date', startOfDay.toISOString())
      .lt('date', endOfDay.toISOString());

    console.log(`   Ventas encontradas: ${sales?.length || 0}`);
    if (salesError) {
      console.log(`   ⚠️ Error ventas (puede ser normal si no hay tabla): ${salesError.message}`);
    }

    // Obtener gastos
    const { data: expenses, error: expensesError } = await supabase
      .from('PettyCashExpense')
      .select('*')
      .eq('sessionId', sessionId);

    console.log(`   Gastos encontrados: ${expenses?.length || 0}`);
    if (expensesError) {
      console.error('   ❌ Error gastos:', expensesError.message);
      return;
    }

    // Obtener compras
    const { data: purchases, error: purchasesError } = await supabase
      .from('PettyCashPurchase')
      .select('*')
      .eq('sessionId', sessionId);

    console.log(`   Compras encontradas: ${purchases?.length || 0}`);
    if (purchasesError) {
      console.error('   ❌ Error compras:', purchasesError.message);
      return;
    }

    // Calcular totales
    const totalSales = sales?.reduce((sum, sale) => sum + (sale.Invoice?.total || 0), 0) || 0;
    const salesCash = totalSales * 0.6;
    const salesCard = totalSales * 0.4;
    const totalExpenses = expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
    const totalPurchases = purchases?.reduce((sum, purchase) => sum + (purchase.quantity * purchase.unitPrice), 0) || 0;
    const expectedCash = session.openingAmount + salesCash - totalExpenses - totalPurchases;

    // Crear el summary manualmente
    const manualSummary = {
      openingAmount: session.openingAmount,
      totalSales,
      salesCash,
      salesCard,
      totalExpenses,
      totalPurchases,
      expectedCash,
      sessionNumber: `S${session.id}`,
      userName: sessionUser.name || `${sessionUser.firstName || ''} ${sessionUser.lastName || ''}`,
      sessionDuration: '1h 30min'
    };

    console.log('\n✅ 3. CLOSURE SUMMARY GENERADO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   💰 Monto apertura: $${manualSummary.openingAmount.toLocaleString()}`);
    console.log(`   🏪 Ventas totales: $${manualSummary.totalSales.toLocaleString()}`);
    console.log(`   💵 Ventas efectivo: $${manualSummary.salesCash.toLocaleString()}`);
    console.log(`   💳 Ventas tarjeta: $${manualSummary.salesCard.toLocaleString()}`);
    console.log(`   📝 Total gastos: $${manualSummary.totalExpenses.toLocaleString()}`);
    console.log(`   🛒 Total compras: $${manualSummary.totalPurchases.toLocaleString()}`);
    console.log(`   🎯 Efectivo esperado: $${manualSummary.expectedCash.toLocaleString()}`);
    console.log(`   👤 Usuario: ${manualSummary.userName}`);
    console.log(`   📊 Sesión: ${manualSummary.sessionNumber}`);

    console.log('\n💡 SOLUCIÓN:');
    console.log('El closureSummary se puede generar. El problema debe estar en la función getCashClosureSummary.');
    console.log('Vamos a corregir la estructura de la consulta de usuario.');

  } catch (error) {
    console.error('💥 Error general:', error.message);
  }
}

testClosureSummary(); 