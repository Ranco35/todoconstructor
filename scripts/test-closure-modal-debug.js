const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ibpbclxszblystwffxzn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlicGJjbHhzemJseXN0d2ZmeHpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxOTE5NzQ5MywiZXhwIjoyMDM0NzczNDkzfQ.hHCcQ6dQON7_3bgjYGqj-K9bMQnGqgJ6lzCJD7UJ1bw';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testClosureModalDebug() {
  try {
    console.log('🔍 TEST CLOSURE MODAL DEBUG');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 1. Buscar sesión activa
    console.log('\n1️⃣ BUSCANDO SESIÓN ACTIVA...');
    const { data: session, error: sessionError } = await supabase
      .from('CashSession')
      .select(`
        *,
        User:userId(name, firstName, lastName, email)
      `)
      .eq('status', 'open')
      .eq('cashRegisterId', 1)
      .single();

    if (sessionError || !session) {
      console.log('❌ No hay sesión activa:', sessionError?.message);
      return;
    }

    console.log('✅ Sesión encontrada:');
    console.log(`   ID: ${session.id}`);
    console.log(`   Usuario: ${session.User?.name || session.User?.firstName + ' ' + session.User?.lastName}`);
    console.log(`   Monto apertura: $${session.openingAmount.toLocaleString()}`);
    console.log(`   Abierta desde: ${new Date(session.openedAt).toLocaleString()}`);

    // 2. Obtener gastos EXACTAMENTE como en la función
    console.log('\n2️⃣ OBTENIENDO GASTOS...');
    const { data: expenses, error: expensesError } = await supabase
      .from('PettyCashExpense')
      .select('*')
      .eq('sessionId', session.id);

    if (expensesError) {
      console.log('❌ Error gastos:', expensesError);
    } else {
      console.log(`✅ Gastos encontrados: ${expenses?.length || 0}`);
      if (expenses && expenses.length > 0) {
        console.log('   Detalle de gastos:');
        expenses.forEach(expense => {
          console.log(`   - ID: ${expense.id}, Monto: $${expense.amount}, Descripción: ${expense.description}`);
        });
      }
    }

    // 3. Obtener compras EXACTAMENTE como en la función
    console.log('\n3️⃣ OBTENIENDO COMPRAS...');
    const { data: purchases, error: purchasesError } = await supabase
      .from('PettyCashPurchase')
      .select('*')
      .eq('sessionId', session.id);

    if (purchasesError) {
      console.log('❌ Error compras:', purchasesError);
    } else {
      console.log(`✅ Compras encontradas: ${purchases?.length || 0}`);
      if (purchases && purchases.length > 0) {
        console.log('   Detalle de compras:');
        purchases.forEach(purchase => {
          console.log(`   - ID: ${purchase.id}, Cantidad: ${purchase.quantity}, Precio: $${purchase.unitPrice}, Total: $${purchase.quantity * purchase.unitPrice}`);
        });
      }
    }

    // 4. Calcular totales EXACTAMENTE como en getCashClosureSummary
    console.log('\n4️⃣ CALCULANDO TOTALES (simulando getCashClosureSummary)...');
    
    const totalSales = 0;
    const salesCash = 0;
    const salesCard = 0;
    const totalExpenses = expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
    const totalPurchases = purchases?.reduce((sum, purchase) => sum + (purchase.quantity * purchase.unitPrice), 0) || 0;
    const expectedCash = session.openingAmount + salesCash - totalExpenses - totalPurchases;

    console.log('📊 RESULTADOS DEL CÁLCULO:');
    console.log(`   Monto apertura: $${session.openingAmount.toLocaleString()}`);
    console.log(`   Ventas efectivo: $${salesCash.toLocaleString()}`);
    console.log(`   Total gastos: $${totalExpenses.toLocaleString()}`);
    console.log(`   Total compras: $${totalPurchases.toLocaleString()}`);
    console.log(`   Efectivo esperado: $${expectedCash.toLocaleString()}`);

    // 5. Simular el closureSummary que se pasa al modal
    const simulatedClosureSummary = {
      openingAmount: session.openingAmount,
      totalSales,
      salesCash,
      salesCard,
      totalExpenses,
      totalPurchases,
      expectedCash,
      sessionNumber: `S${session.id}`,
      userName: session.User?.name || 'Usuario',
      sessionDuration: (() => {
        const now = new Date();
        const opened = new Date(session.openedAt);
        const diff = now.getTime() - opened.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}min`;
      })(),
    };

    console.log('\n5️⃣ CLOSURE SUMMARY SIMULADO:');
    console.log(JSON.stringify(simulatedClosureSummary, null, 2));

    // 6. Verificar qué está mal
    console.log('\n6️⃣ DIAGNÓSTICO:');
    if (totalExpenses === 0) {
      console.log('⚠️ PROBLEMA: Total gastos es 0');
      if (!expenses || expenses.length === 0) {
        console.log('   Causa: No hay gastos registrados en la sesión');
      } else {
        console.log('   Causa: Gastos están registrados pero el cálculo da 0');
        console.log('   Revisar: Estructura de datos y tipo de campos');
      }
    } else {
      console.log('✅ Total gastos está calculado correctamente');
    }

    if (totalPurchases === 0) {
      console.log('⚠️ PROBLEMA: Total compras es 0');
      if (!purchases || purchases.length === 0) {
        console.log('   Causa: No hay compras registradas en la sesión');
      } else {
        console.log('   Causa: Compras están registradas pero el cálculo da 0');
      }
    } else {
      console.log('✅ Total compras está calculado correctamente');
    }

    console.log('\n🎯 CONCLUSIÓN:');
    if (totalExpenses > 0 || totalPurchases > 0) {
      console.log('✅ Los cálculos están funcionando. El problema debe estar en el frontend o en el paso de datos.');
    } else {
      console.log('❌ Los cálculos dan 0. Verificar datos en la base de datos.');
    }

  } catch (error) {
    console.error('❌ Error en test:', error);
  }
}

testClosureModalDebug(); 