const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://bvzfuibqlprrfbudnauc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2emZ1aWJxbHBycmZidWRuYXVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU1MjYwMSwiZXhwIjoyMDY2MTI4NjAxfQ.4TGUtzCpdxCEwlpC3WKlHJ4I6O7ZGTCbFQBARYgv834'
);

async function checkIncomeRecords() {
  try {
    console.log('🔍 Verificando registros de ingresos para sesión 18...');
    
    // 1. Verificar ingresos en PettyCashIncome
    console.log('\n1️⃣ Consultando tabla PettyCashIncome...');
    const { data: incomes, error: incomeError } = await supabase
      .from('PettyCashIncome')
      .select('*')
      .eq('sessionId', 18)
      .order('createdAt', { ascending: false });
      
    if (incomeError) {
      console.log('❌ Error consultando ingresos:', incomeError.message);
    } else {
      console.log(`📋 Ingresos encontrados: ${incomes.length}`);
      incomes.forEach((income, index) => {
        console.log(`💰 Ingreso ${index + 1}:`, {
          id: income.id,
          amount: income.amount,
          description: income.description,
          category: income.category,
          paymentMethod: income.paymentMethod,
          createdAt: income.createdAt
        });
      });
    }
    
    // 2. Verificar sesión actual
    console.log('\n2️⃣ Verificando sesión actual...');
    const { data: session, error: sessionError } = await supabase
      .from('CashSession')
      .select('*')
      .eq('id', 18)
      .single();
      
    if (sessionError) {
      console.log('❌ Error consultando sesión:', sessionError.message);
    } else {
      console.log('📊 Estado de sesión:', {
        id: session.id,
        openingAmount: session.openingAmount,
        currentAmount: session.currentAmount,
        status: session.status
      });
    }
    
    // 3. Verificar gastos para comparar
    console.log('\n3️⃣ Consultando gastos para comparar...');
    const { data: expenses, error: expenseError } = await supabase
      .from('PettyCashExpense')
      .select('*')
      .eq('sessionId', 18)
      .order('createdAt', { ascending: false });
      
    if (expenseError) {
      console.log('❌ Error consultando gastos:', expenseError.message);
    } else {
      console.log(`📋 Gastos encontrados: ${expenses.length}`);
      expenses.forEach((expense, index) => {
        console.log(`💸 Gasto ${index + 1}:`, {
          id: expense.id,
          amount: expense.amount,
          description: expense.description,
          category: expense.category,
          paymentMethod: expense.paymentMethod,
          createdAt: expense.createdAt
        });
      });
    }
    
    // 4. Calcular totales
    console.log('\n4️⃣ Calculando totales...');
    const totalIncomes = incomes?.reduce((sum, income) => sum + parseFloat(income.amount), 0) || 0;
    const totalExpenses = expenses?.reduce((sum, expense) => sum + parseFloat(expense.amount), 0) || 0;
    const expectedAmount = (session?.openingAmount || 0) + totalIncomes - totalExpenses;
    
    console.log(`💰 Total ingresos: $${totalIncomes}`);
    console.log(`💸 Total gastos: $${totalExpenses}`);
    console.log(`🎯 Saldo esperado: $${expectedAmount}`);
    console.log(`📊 Saldo actual en sesión: $${session?.currentAmount || 0}`);
    
    if (expectedAmount !== (session?.currentAmount || 0)) {
      console.log('⚠️ DISCREPANCIA: El saldo actual no coincide con el esperado');
    } else {
      console.log('✅ Los saldos coinciden correctamente');
    }
    
  } catch (error) {
    console.error('💥 Error inesperado:', error);
  }
}

checkIncomeRecords(); 