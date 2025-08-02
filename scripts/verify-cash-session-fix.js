const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://bvzfuibqlprrfbudnauc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2emZ1aWJxbHBycmZidWRuYXVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU1MjYwMSwiZXhwIjoyMDY2MTI4NjAxfQ.4TGUtzCpdxCEwlpC3WKlHJ4I6O7ZGTCbFQBARYgv834';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyCashSessionFix() {
  console.log('🔍 VERIFICANDO CORRECCIÓN DEL PROBLEMA DE SESIÓN');
  console.log('='.repeat(60));

  try {
    // 1. Verificar estado actual de sesiones
    console.log('1️⃣ Estado actual de sesiones:');
    
    const { data: allSessions, error: allError } = await supabase
      .from('CashSession')
      .select('*')
      .order('id', { ascending: false })
      .limit(5);

    if (allError) {
      console.log('❌ Error al obtener sesiones:', allError.message);
      return;
    }

    console.log(`✅ Sesiones encontradas: ${allSessions.length}`);
    allSessions.forEach(session => {
      console.log(`   ID: ${session.id}, Estado: ${session.status}, Usuario: ${session.userId}, Monto: $${session.openingAmount}`);
    });

    // 2. Verificar sesión activa específica
    console.log('\n2️⃣ Verificando sesión activa para cashRegisterId: 1...');
    
    const { data: activeSession, error: activeError } = await supabase
      .from('CashSession')
      .select('*')
      .eq('cashRegisterId', 1)
      .eq('status', 'open')
      .single();

    if (activeError) {
      if (activeError.code === 'PGRST116') {
        console.log('❌ No hay sesión activa para cashRegisterId: 1');
      } else {
        console.log('❌ Error al buscar sesión activa:', activeError.message);
      }
    } else {
      console.log('✅ Sesión activa encontrada:');
      console.log(`   ID: ${activeSession.id}`);
      console.log(`   Estado: ${activeSession.status}`);
      console.log(`   Usuario: ${activeSession.userId}`);
      console.log(`   Monto inicial: $${activeSession.openingAmount}`);
    }

    // 3. Verificar que la sesión 15 está cerrada
    console.log('\n3️⃣ Verificando que sesión 15 está cerrada...');
    
    const { data: session15, error: session15Error } = await supabase
      .from('CashSession')
      .select('*')
      .eq('id', 15)
      .single();

    if (session15Error) {
      console.log('❌ Error al verificar sesión 15:', session15Error.message);
    } else {
      console.log(`✅ Sesión 15: Estado = ${session15.status}`);
      if (session15.status === 'closed') {
        console.log('   ✅ Correcto: Sesión 15 está cerrada');
      } else {
        console.log('   ⚠️ ADVERTENCIA: Sesión 15 no está cerrada');
      }
    }

    // 4. Probar consulta que estaba fallando (error 406)
    console.log('\n4️⃣ Probando consulta problemática (error 406)...');
    
    const { data: problematicQuery, error: problematicError } = await supabase
      .from('CashSession')
      .select('*')
      .eq('id', 15)
      .eq('status', 'open');

    if (problematicError) {
      console.log('❌ Error en consulta problemática:', problematicError.message);
      console.log('   Código:', problematicError.code);
    } else {
      console.log('✅ Consulta problemática funciona correctamente');
      console.log(`   Resultados: ${problematicQuery.length}`);
      if (problematicQuery.length === 0) {
        console.log('   ✅ Correcto: No hay sesión 15 con status=open');
      }
    }

    // 5. Verificar que se puede crear ingreso en sesión activa
    console.log('\n5️⃣ Verificando creación de ingreso en sesión activa...');
    
    if (activeSession) {
      const { data: testIncome, error: incomeError } = await supabase
        .from('PettyCashIncome')
        .insert({
          sessionId: activeSession.id,
          amount: 1,
          description: 'Prueba de verificación - se eliminará',
          category: 'Test',
          paymentMethod: 'Efectivo'
        })
        .select()
        .single();

      if (incomeError) {
        console.log('❌ Error al crear ingreso de prueba:', incomeError.message);
      } else {
        console.log('✅ Ingreso de prueba creado correctamente');
        
        // Eliminar el ingreso de prueba
        const { error: deleteError } = await supabase
          .from('PettyCashIncome')
          .delete()
          .eq('id', testIncome.id);
        
        if (deleteError) {
          console.log('⚠️ No se pudo eliminar ingreso de prueba:', deleteError.message);
        } else {
          console.log('✅ Ingreso de prueba eliminado correctamente');
        }
      }
    } else {
      console.log('⚠️ No hay sesión activa para probar creación de ingreso');
    }

    console.log('\n🎯 RESUMEN DE VERIFICACIÓN');
    console.log('='.repeat(60));
    
    const hasActiveSession = activeSession !== null;
    const session15Closed = session15 && session15.status === 'closed';
    const problematicQueryWorks = !problematicError;
    
    console.log(`✅ Sesión activa disponible: ${hasActiveSession ? 'SÍ' : 'NO'}`);
    console.log(`✅ Sesión 15 cerrada: ${session15Closed ? 'SÍ' : 'NO'}`);
    console.log(`✅ Consulta problemática funciona: ${problematicQueryWorks ? 'SÍ' : 'NO'}`);
    
    if (hasActiveSession && session15Closed && problematicQueryWorks) {
      console.log('\n🎉 ¡PROBLEMA RESUELTO!');
      console.log('   - El frontend debería funcionar correctamente');
      console.log('   - No más errores 406');
      console.log('   - No más errores de sesión no encontrada');
    } else {
      console.log('\n⚠️ PROBLEMA PERSISTE');
      console.log('   - Revisar configuración de base de datos');
      console.log('   - Verificar políticas RLS');
      console.log('   - Comprobar cache del frontend');
    }

  } catch (error) {
    console.error('❌ Error en verificación:', error);
  }
}

// Ejecutar la verificación
verifyCashSessionFix(); 