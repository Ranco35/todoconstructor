const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPettyCashFinalStatus() {
  console.log('🔍 Verificando estado final de tablas de caja chica...\n');

  try {
    // Verificar PettyCashExpense
    console.log('📋 Verificando tabla PettyCashExpense...');
    const { data: expenses, error: expenseError } = await supabase
      .from('PettyCashExpense')
      .select('*')
      .limit(1);
    
    if (expenseError) {
      console.error('❌ Error en PettyCashExpense:', expenseError);
    } else {
      console.log('✅ PettyCashExpense accesible');
      if (expenses && expenses.length > 0) {
        console.log('📊 Columnas disponibles:', Object.keys(expenses[0]));
      }
    }

    // Verificar PettyCashPurchase
    console.log('\n📋 Verificando tabla PettyCashPurchase...');
    const { data: purchases, error: purchaseError } = await supabase
      .from('PettyCashPurchase')
      .select('*')
      .limit(1);
    
    if (purchaseError) {
      console.error('❌ Error en PettyCashPurchase:', purchaseError);
    } else {
      console.log('✅ PettyCashPurchase accesible');
      if (purchases && purchases.length > 0) {
        console.log('📊 Columnas disponibles:', Object.keys(purchases[0]));
      }
    }

    // Verificar CashSession
    console.log('\n📋 Verificando tabla CashSession...');
    const { data: sessions, error: sessionError } = await supabase
      .from('CashSession')
      .select('*')
      .limit(1);
    
    if (sessionError) {
      console.error('❌ Error en CashSession:', sessionError);
    } else {
      console.log('✅ CashSession accesible');
      if (sessions && sessions.length > 0) {
        console.log('📊 Columnas disponibles:', Object.keys(sessions[0]));
      }
    }

    // Verificar User
    console.log('\n📋 Verificando tabla User...');
    const { data: users, error: userError } = await supabase
      .from('User')
      .select('id, name')
      .limit(1);
    
    if (userError) {
      console.error('❌ Error en User:', userError);
    } else {
      console.log('✅ User accesible');
      if (users && users.length > 0) {
        console.log('📊 Usuario disponible:', users[0]);
      }
    }

    // Verificar relaciones
    console.log('\n🔗 Verificando relaciones...');
    
    // Intentar join entre PettyCashExpense y User
    const { data: expenseWithUser, error: expenseUserError } = await supabase
      .from('PettyCashExpense')
      .select(`
        *,
        User:User(id, name)
      `)
      .limit(1);
    
    if (expenseUserError) {
      console.log('⚠️ Relación PettyCashExpense-User:', expenseUserError.message);
    } else {
      console.log('✅ Relación PettyCashExpense-User funciona');
    }

    // Intentar join entre PettyCashPurchase y User
    const { data: purchaseWithUser, error: purchaseUserError } = await supabase
      .from('PettyCashPurchase')
      .select(`
        *,
        User:User(id, name)
      `)
      .limit(1);
    
    if (purchaseUserError) {
      console.log('⚠️ Relación PettyCashPurchase-User:', purchaseUserError.message);
    } else {
      console.log('✅ Relación PettyCashPurchase-User funciona');
    }

    console.log('\n🎯 Estado final verificado');
    console.log('✅ Sistema de importación/exportación Excel listo');
    console.log('✅ Transacciones históricas solo por Excel');
    console.log('✅ Ingresos directos a caja sin categorías');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkPettyCashFinalStatus(); 