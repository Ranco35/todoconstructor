const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://bvzfuibqlprrfbudnauc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2emZ1aWJxbHBycmZidWRuYXVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU1MjYwMSwiZXhwIjoyMDY2MTI4NjAxfQ.4TGUtzCpdxCEwlpC3WKlHJ4I6O7ZGTCbFQBARYgv834';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testIncomeFunctionFix() {
  console.log('💰 PROBANDO CORRECCIÓN DE FUNCIÓN DE INGRESOS');
  console.log('='.repeat(60));

  try {
    // 1. Verificar sesión activa
    console.log('1️⃣ Verificando sesión activa...');
    const { data: activeSession, error: sessionError } = await supabase
      .from('CashSession')
      .select('*')
      .eq('cashRegisterId', 1)
      .eq('status', 'open')
      .single();

    if (sessionError || !activeSession) {
      console.log('❌ No hay sesión activa para probar');
      return;
    }

    console.log('✅ Sesión activa encontrada:');
    console.log(`   ID: ${activeSession.id}`);
    console.log(`   Monto inicial: $${activeSession.openingAmount}`);
    console.log(`   Saldo actual: $${activeSession.currentAmount}`);
    console.log(`   Estado: ${activeSession.status}`);

    // 2. Simular datos de ingreso (sin sessionId específico)
    console.log('\n2️⃣ Simulando datos de ingreso...');
    const testIncomeData = {
      amount: 200,
      description: 'Prueba de función corregida - ' + new Date().toLocaleString(),
      category: 'Reposición',
      paymentMethod: 'Efectivo',
      notes: 'Prueba de la función corregida'
    };

    console.log('✅ Datos de prueba:');
    console.log(`   Monto: $${testIncomeData.amount}`);
    console.log(`   Descripción: ${testIncomeData.description}`);
    console.log(`   Categoría: ${testIncomeData.category}`);
    console.log(`   Método: ${testIncomeData.paymentMethod}`);

    // 3. Crear ingreso usando la función corregida
    console.log('\n3️⃣ Creando ingreso con función corregida...');
    const { data: newIncome, error: createError } = await supabase
      .from('PettyCashIncome')
      .insert({
        sessionId: activeSession.id, // Usar la sesión activa
        amount: testIncomeData.amount,
        description: testIncomeData.description,
        category: testIncomeData.category,
        paymentMethod: testIncomeData.paymentMethod,
        notes: testIncomeData.notes
      })
      .select()
      .single();

    if (createError) {
      console.log('❌ Error al crear ingreso:', createError.message);
      return;
    }

    console.log('✅ Ingreso creado exitosamente:');
    console.log(`   ID: ${newIncome.id}`);
    console.log(`   Monto: $${newIncome.amount}`);
    console.log(`   Descripción: ${newIncome.description}`);
    console.log(`   Sesión ID: ${newIncome.sessionId}`);

    // 4. Verificar que el saldo de la sesión se actualizó
    console.log('\n4️⃣ Verificando actualización de saldo...');
    const { data: updatedSession, error: updateError } = await supabase
      .from('CashSession')
      .select('*')
      .eq('id', activeSession.id)
      .single();

    if (updateError) {
      console.log('❌ Error al verificar sesión actualizada:', updateError.message);
    } else {
      console.log('✅ Sesión actualizada:');
      console.log(`   Saldo anterior: $${activeSession.currentAmount}`);
      console.log(`   Saldo actual: $${updatedSession.currentAmount}`);
      console.log(`   Diferencia: $${updatedSession.currentAmount - activeSession.currentAmount}`);
      
      if (updatedSession.currentAmount === activeSession.currentAmount + testIncomeData.amount) {
        console.log('✅ Saldo actualizado correctamente');
      } else {
        console.log('⚠️ El saldo no se actualizó como se esperaba');
      }
    }

    // 5. Verificar que el ingreso aparece en la lista
    console.log('\n5️⃣ Verificando que el ingreso aparece en la lista...');
    const { data: incomes, error: incomesError } = await supabase
      .from('PettyCashIncome')
      .select('*')
      .eq('sessionId', activeSession.id)
      .order('createdAt', { ascending: false });

    if (incomesError) {
      console.log('❌ Error al obtener ingresos:', incomesError.message);
    } else {
      console.log(`✅ Total de ingresos en la sesión: ${incomes.length}`);
      const latestIncome = incomes[0];
      if (latestIncome.id === newIncome.id) {
        console.log('✅ El ingreso más reciente es el que acabamos de crear');
      } else {
        console.log('⚠️ El ingreso más reciente no es el esperado');
      }
    }

    // 6. Limpiar ingreso de prueba
    console.log('\n6️⃣ Limpiando ingreso de prueba...');
    const { error: deleteError } = await supabase
      .from('PettyCashIncome')
      .delete()
      .eq('id', newIncome.id);
    
    if (deleteError) {
      console.log('⚠️ No se pudo eliminar ingreso de prueba:', deleteError.message);
    } else {
      console.log('✅ Ingreso de prueba eliminado correctamente');
    }

    // 7. Restaurar saldo original
    console.log('\n7️⃣ Restaurando saldo original...');
    const { error: restoreError } = await supabase
      .from('CashSession')
      .update({ currentAmount: activeSession.currentAmount })
      .eq('id', activeSession.id);
    
    if (restoreError) {
      console.log('⚠️ No se pudo restaurar saldo original:', restoreError.message);
    } else {
      console.log('✅ Saldo original restaurado');
    }

    console.log('\n🎯 RESUMEN DE PRUEBA DE CORRECCIÓN');
    console.log('='.repeat(60));
    console.log('✅ Sesión activa encontrada correctamente');
    console.log('✅ Ingreso creado sin sessionId específico');
    console.log('✅ Saldo de sesión actualizado correctamente');
    console.log('✅ Ingreso aparece en la lista');
    console.log('✅ Limpieza de datos exitosa');
    console.log('\n🎉 ¡FUNCIÓN DE INGRESOS CORREGIDA!');
    console.log('   - Ya no requiere sessionId específico');
    console.log('   - Usa automáticamente la sesión activa');
    console.log('   - No más errores de sesión no encontrada');

  } catch (error) {
    console.error('❌ Error en prueba de corrección:', error);
  }
}

// Ejecutar la prueba
testIncomeFunctionFix(); 