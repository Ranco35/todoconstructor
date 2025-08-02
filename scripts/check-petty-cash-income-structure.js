const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bvzfuibqlprrfbudnauc.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2emZ1aWJxbHBycmZidWRuYXVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU1MjYwMSwiZXhwIjoyMDY2MTI4NjAxfQ.4TGUtzCpdxCEwlpC3WKlHJ4I6O7ZGTCbFQBARYgv834'
);

async function checkPettyCashIncomeStructure() {
  try {
    console.log('🔍 Verificando estructura de tabla PettyCashIncome...');
    
    // 1. Intentar hacer un select para ver qué columnas existen
    console.log('\n1️⃣ Consultando registros existentes...');
    const { data, error } = await supabase
      .from('PettyCashIncome')
      .select('*')
      .limit(1);
      
    if (error) {
      console.log('❌ Error en consulta:', error.message);
    } else {
      console.log('✅ Consulta exitosa');
      if (data && data.length > 0) {
        console.log('📋 Columnas disponibles:', Object.keys(data[0]));
        console.log('📄 Ejemplo de registro:', data[0]);
      } else {
        console.log('📋 Tabla existe pero está vacía');
      }
    }
    
    // 2. Probar inserción con columnas básicas
    console.log('\n2️⃣ Probando inserción con columnas básicas...');
    const basicInsert = {
      sessionId: 18,
      amount: 1,
      description: 'Test básico',
      category: 'Test'
    };
    
    console.log('📝 Datos básicos a insertar:', basicInsert);
    
    const { data: testData, error: testError } = await supabase
      .from('PettyCashIncome')
      .insert(basicInsert)
      .select();
      
    if (testError) {
      console.log('❌ Error en inserción básica:', testError.message);
    } else {
      console.log('✅ Inserción básica exitosa:', testData);
      
      // Eliminar el registro de prueba
      if (testData && testData[0]) {
        await supabase
          .from('PettyCashIncome')
          .delete()
          .eq('id', testData[0].id);
        console.log('🗑️ Registro de prueba eliminado');
      }
    }
    
    // 3. Probar inserción con todas las columnas que intentamos usar
    console.log('\n3️⃣ Probando inserción con todas las columnas...');
    const fullInsert = {
      sessionId: 18,
      amount: 1,
      description: 'Test completo',
      category: 'Test',
      paymentMethod: 'cash',
      notes: 'Test notes',
      bankReference: 'Test ref',
      bankAccount: 'Test account'
    };
    
    console.log('📝 Datos completos a insertar:', fullInsert);
    
    const { data: fullTestData, error: fullTestError } = await supabase
      .from('PettyCashIncome')
      .insert(fullInsert)
      .select();
      
    if (fullTestError) {
      console.log('❌ Error en inserción completa:', fullTestError.message);
      console.log('🔍 Código de error:', fullTestError.code);
    } else {
      console.log('✅ Inserción completa exitosa:', fullTestData);
      
      // Eliminar el registro de prueba
      if (fullTestData && fullTestData[0]) {
        await supabase
          .from('PettyCashIncome')
          .delete()
          .eq('id', fullTestData[0].id);
        console.log('🗑️ Registro de prueba completo eliminado');
      }
    }
    
    // 4. Verificar estructura de otras tablas relacionadas para comparar
    console.log('\n4️⃣ Comparando con estructura de PettyCashExpense...');
    const { data: expenseData, error: expenseError } = await supabase
      .from('PettyCashExpense')
      .select('*')
      .limit(1);
      
    if (!expenseError && expenseData && expenseData.length > 0) {
      console.log('📋 Columnas en PettyCashExpense:', Object.keys(expenseData[0]));
    }
    
  } catch (error) {
    console.error('💥 Error inesperado:', error);
  }
}

checkPettyCashIncomeStructure(); 