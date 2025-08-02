const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Verificar que las variables de entorno existen
console.log('Verificando variables de entorno...');
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'MISSING');
console.log('SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'OK' : 'MISSING');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugPettyCashClosure() {
  console.log('🔍 DIAGNÓSTICO DEL SISTEMA DE CAJA CHICA');
  console.log('==========================================\n');

  try {
    // 1. Verificar sesión actual
    console.log('1. VERIFICANDO SESIÓN ACTUAL...');
    const { data: currentSession, error: sessionError } = await supabase
      .from('CashSession')
      .select('*')
      .eq('status', 'open')
      .limit(1)
      .single();

    if (sessionError) {
      console.log('❌ Error obteniendo sesión:', sessionError.message);
      return;
    }

    if (!currentSession) {
      console.log('❌ No hay sesión activa');
      return;
    }

    console.log('✅ Sesión activa encontrada:');
    console.log(`   ID: ${currentSession.id}`);
    console.log(`   Usuario ID: ${currentSession.userId}`);
    console.log(`   Monto inicial: $${currentSession.openingAmount}`);
    console.log(`   Estado: ${currentSession.status}`);
    console.log(`   Abierta: ${new Date(currentSession.openedAt).toLocaleString()}`);

    // 2. Verificar usuario de la sesión
    console.log('\n2. VERIFICANDO USUARIO...');
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('*')
      .eq('id', currentSession.userId)
      .single();

    if (userError) {
      console.log('❌ Error obteniendo usuario:', userError.message);
    } else {
      console.log('✅ Usuario encontrado:');
      console.log(`   Nombre: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Es cajero: ${user.isCashier}`);
    }

    // 3. Verificar gastos de la sesión
    console.log('\n3. VERIFICANDO GASTOS...');
    const { data: expenses, error: expensesError } = await supabase
      .from('PettyCashExpense')
      .select('*')
      .eq('sessionId', currentSession.id);

    if (expensesError) {
      console.log('❌ Error obteniendo gastos:', expensesError.message);
    } else {
      console.log(`✅ Gastos encontrados: ${expenses.length}`);
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      console.log(`   Total en gastos: $${totalExpenses.toLocaleString()}`);
      
      if (expenses.length > 0) {
        console.log('   Últimos gastos:');
        expenses.slice(-3).forEach(expense => {
          console.log(`   - $${expense.amount}: ${expense.description}`);
        });
      }
    }

    // 4. Verificar compras de la sesión
    console.log('\n4. VERIFICANDO COMPRAS...');
    const { data: purchases, error: purchasesError } = await supabase
      .from('PettyCashPurchase')
      .select('*')
      .eq('sessionId', currentSession.id);

    if (purchasesError) {
      console.log('❌ Error obteniendo compras:', purchasesError.message);
    } else {
      console.log(`✅ Compras encontradas: ${purchases.length}`);
      const totalPurchases = purchases.reduce((sum, purchase) => sum + (purchase.quantity * purchase.unitPrice), 0);
      console.log(`   Total en compras: $${totalPurchases.toLocaleString()}`);
      
      if (purchases.length > 0) {
        console.log('   Últimas compras:');
        purchases.slice(-3).forEach(purchase => {
          console.log(`   - $${(purchase.quantity * purchase.unitPrice).toLocaleString()}: ${purchase.description}`);
        });
      }
    }

    // 5. Calcular resumen de cierre
    console.log('\n5. CALCULANDO RESUMEN DE CIERRE...');
    const totalExpenses = expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
    const totalPurchases = purchases?.reduce((sum, purchase) => sum + (purchase.quantity * purchase.unitPrice), 0) || 0;
    
    // Por ahora no hay tabla de ventas, usamos valores por defecto
    const totalSales = 0;
    const salesCash = 0;
    const salesCard = 0;
    
    const expectedCash = currentSession.openingAmount + salesCash - totalExpenses - totalPurchases;
    
    console.log('📊 RESUMEN CALCULADO:');
    console.log(`   Monto inicial: $${currentSession.openingAmount.toLocaleString()}`);
    console.log(`   Ventas efectivo: $${salesCash.toLocaleString()}`);
    console.log(`   Total gastos: $${totalExpenses.toLocaleString()}`);
    console.log(`   Total compras: $${totalPurchases.toLocaleString()}`);
    console.log(`   Efectivo esperado: $${expectedCash.toLocaleString()}`);
    console.log(`   Ventas tarjeta: $${salesCard.toLocaleString()}`);
    console.log(`   Total ventas: $${totalSales.toLocaleString()}`);

    // 6. Verificar estructura de closureSummary
    console.log('\n6. VERIFICANDO STRUCTURE CLOSURE SUMMARY...');
    const closureSummary = {
      openingAmount: currentSession.openingAmount,
      totalSales,
      salesCash,
      salesCard,
      totalExpenses,
      totalPurchases,
      expectedCash,
      sessionNumber: `S${currentSession.id}`,
      userName: user?.name || 'Usuario',
      sessionDuration: calcularDuracion(currentSession.openedAt),
    };
    
    console.log('✅ Estructura closureSummary:');
    console.log(JSON.stringify(closureSummary, null, 2));

    // 7. Verificar tabla CashClosure (si existe)
    console.log('\n7. VERIFICANDO TABLA CASH CLOSURE...');
    const { data: closures, error: closureError } = await supabase
      .from('CashClosure')
      .select('*')
      .eq('sessionId', currentSession.id);

    if (closureError) {
      console.log(`⚠️  Tabla CashClosure no existe o error: ${closureError.message}`);
      console.log('   Esto es normal si no se ha implementado tabla de cierres');
    } else {
      console.log(`✅ Cierres encontrados: ${closures.length}`);
    }

    console.log('\n✅ DIAGNÓSTICO COMPLETADO');
    console.log('==========================================');
    
  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
  }
}

function calcularDuracion(openedAt) {
  const now = new Date();
  const opened = new Date(openedAt);
  const diff = now.getTime() - opened.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}min`;
}

// Ejecutar diagnóstico
debugPettyCashClosure(); 