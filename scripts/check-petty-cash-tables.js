const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPettyCashTables() {
  console.log('🔍 Verificando estructura de tablas de caja chica...\n');

  try {
    // Verificar PettyCashExpense
    console.log('📋 Verificando tabla PettyCashExpense...');
    const { data: expenses, error: expenseError } = await supabase
      .from('PettyCashExpense')
      .select('*')
      .limit(1);

    if (expenseError) {
      console.error('❌ Error al consultar PettyCashExpense:', expenseError);
    } else {
      console.log('✅ PettyCashExpense accesible');
      if (expenses && expenses.length > 0) {
        console.log('📊 Columnas encontradas:', Object.keys(expenses[0]));
        console.log('📝 Ejemplo de registro:', expenses[0]);
      } else {
        console.log('📝 Tabla vacía, verificando estructura...');
        // Intentar insertar un registro de prueba
        const testExpense = {
          sessionId: 1,
          description: 'Test expense',
          amount: 100,
          category: 'Test',
          status: 'approved'
        };
        
        const { data: insertData, error: insertError } = await supabase
          .from('PettyCashExpense')
          .insert(testExpense)
          .select()
          .single();

        if (insertError) {
          console.error('❌ Error al insertar prueba:', insertError);
        } else {
          console.log('✅ Inserción de prueba exitosa');
          // Limpiar el registro de prueba
          await supabase.from('PettyCashExpense').delete().eq('id', insertData.id);
        }
      }
    }

    console.log('\n📋 Verificando tabla PettyCashPurchase...');
    const { data: purchases, error: purchaseError } = await supabase
      .from('PettyCashPurchase')
      .select('*')
      .limit(1);

    if (purchaseError) {
      console.error('❌ Error al consultar PettyCashPurchase:', purchaseError);
    } else {
      console.log('✅ PettyCashPurchase accesible');
      if (purchases && purchases.length > 0) {
        console.log('📊 Columnas encontradas:', Object.keys(purchases[0]));
        console.log('📝 Ejemplo de registro:', purchases[0]);
      } else {
        console.log('📝 Tabla vacía, verificando estructura...');
        // Intentar insertar un registro de prueba
        const testPurchase = {
          sessionId: 1,
          quantity: 1,
          unitPrice: 100,
          totalAmount: 100,
          description: 'Test purchase',
          status: 'approved'
        };
        
        const { data: insertData, error: insertError } = await supabase
          .from('PettyCashPurchase')
          .insert(testPurchase)
          .select()
          .single();

        if (insertError) {
          console.error('❌ Error al insertar prueba:', insertError);
        } else {
          console.log('✅ Inserción de prueba exitosa');
          // Limpiar el registro de prueba
          await supabase.from('PettyCashPurchase').delete().eq('id', insertData.id);
        }
      }
    }

    // Verificar relaciones con User
    console.log('\n🔗 Verificando relaciones con User...');
    const { data: userTest, error: userError } = await supabase
      .from('User')
      .select('id, name')
      .limit(1);

    if (userError) {
      console.error('❌ Error al consultar User:', userError);
    } else {
      console.log('✅ Tabla User accesible');
      console.log('👤 Usuario de prueba:', userTest[0]);
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkPettyCashTables().then(() => {
  console.log('\n✅ Verificación completada');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
}); 