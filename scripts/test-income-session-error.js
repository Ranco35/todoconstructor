require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testIncomeSessionError() {
  try {
    console.log('🔍 Probando función createPettyCashIncome...');
    
    const cashRegisterId = 1;
    
    console.log('📋 cashRegisterId recibido:', cashRegisterId, 'tipo:', typeof cashRegisterId);
    
    // Mostrar query exacto
    console.log('📋 Query: SELECT * FROM CashSession WHERE cashRegisterId =', cashRegisterId, 'AND status = open');
    
    // 1. Obtener la sesión activa del cash register recibido
    const { data: activeSession, error: sessionError } = await supabase
      .from('CashSession')
      .select('*')
      .eq('cashRegisterId', cashRegisterId)
      .eq('status', 'open')
      .single();

    console.log('📋 Resultado de búsqueda de sesión activa (JSON):', JSON.stringify(activeSession), 'Error:', sessionError);

    if (sessionError) {
      console.error('❌ sessionError:', sessionError);
      if (sessionError.code === '42501' || sessionError.message?.toLowerCase().includes('rls')) {
        console.error('❌ Posible problema de RLS (Row Level Security) o permisos.');
      }
    }

    if (!activeSession) {
      console.error('❌ No se encontró sesión activa. Error:', sessionError, 'activeSession:', activeSession);
      return;
    }

    console.log('✅ Sesión activa encontrada:', activeSession);

    // 2. Probar crear un ingreso
    const incomeData = {
      sessionId: activeSession.id,
      amount: 100,
      description: 'Prueba de ingreso',
      category: 'Reposición',
      paymentMethod: 'Efectivo',
      notes: 'Prueba desde script'
    };

    console.log('📋 Intentando crear ingreso con datos:', incomeData);

    const { data: income, error: incomeError } = await supabase
      .from('PettyCashIncome')
      .insert(incomeData)
      .select()
      .single();

    if (incomeError) {
      console.error('❌ Error creating petty cash income:', incomeError);
      return;
    }

    console.log('✅ Ingreso creado exitosamente:', income);

    // 3. Actualizar el saldo de la sesión
    const newCurrentAmount = activeSession.currentAmount + incomeData.amount;
    console.log('💰 Actualizando saldo de', activeSession.currentAmount, 'a', newCurrentAmount);
    
    const { error: updateError } = await supabase
      .from('CashSession')
      .update({ currentAmount: newCurrentAmount })
      .eq('id', activeSession.id);

    if (updateError) {
      console.error('❌ Error updating session amount:', updateError);
      return;
    }

    console.log('✅ Saldo de sesión actualizado exitosamente');

    // 4. Verificar la estructura de la tabla CashSession
    console.log('\n🔍 Verificando estructura de tabla CashSession...');
    const { data: sampleSession, error: structureError } = await supabase
      .from('CashSession')
      .select('*')
      .limit(1);

    if (structureError) {
      console.error('❌ Error verificando estructura:', structureError);
    } else {
      console.log('📊 Estructura de CashSession:', Object.keys(sampleSession[0] || {}));
    }

    console.log('\n🎉 Prueba completada exitosamente');

  } catch (error) {
    console.error('❌ Error in testIncomeSessionError:', error);
  }
}

// Ejecutar la prueba
testIncomeSessionError(); 