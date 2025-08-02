const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 DEBUGGING: ¿Por qué getCurrentCashSession no encuentra la sesión?\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function debugSessionDetection() {
  try {
    console.log('📊 1. Verificando TODAS las sesiones en BD...');
    
    const { data: allSessions, error: allError } = await supabase
      .from('CashSession')
      .select('*')
      .order('id', { ascending: false });

    if (allError) {
      console.error('❌ Error consultando sesiones:', allError.message);
      return;
    }

    console.log(`Total sesiones encontradas: ${allSessions.length}`);
    allSessions.forEach(session => {
      console.log(`📋 ID: ${session.id}, Estado: "${session.status}", CashRegister: ${session.cashRegisterId}, Usuario: ${session.userId}`);
      console.log(`   Apertura: $${session.openingAmount}, Actual: $${session.currentAmount}`);
      console.log(`   Abierta: ${session.openedAt}, Cerrada: ${session.closedAt || 'N/A'}`);
    });

    console.log('\n🔍 2. Simulando la función getCurrentCashSession...');
    console.log('   Buscando: cashRegisterId = 1, status = "open"');
    
    const { data: openSessions, error: openError } = await supabase
      .from('CashSession')
      .select('*')
      .eq('cashRegisterId', 1)
      .eq('status', 'open')
      .order('openedAt', { ascending: false })
      .limit(1);

    if (openError) {
      console.error('❌ Error en búsqueda open:', openError.message);
      return;
    }

    console.log(`✅ Sesiones con status='open' y cashRegisterId=1: ${openSessions.length}`);
    
    if (openSessions.length === 0) {
      console.log('\n🚨 PROBLEMA ENCONTRADO: No hay sesiones con status="open"');
      
      // Verificar qué estados existen
      console.log('\n🔍 3. Verificando estados disponibles...');
      const uniqueStatuses = [...new Set(allSessions.map(s => s.status))];
      console.log('Estados únicos encontrados:', uniqueStatuses);
      
      // Buscar sesiones para cashRegisterId = 1 con cualquier estado
      const sessionsForCash1 = allSessions.filter(s => s.cashRegisterId === 1);
      console.log(`\nSesiones para cashRegisterId=1: ${sessionsForCash1.length}`);
      sessionsForCash1.forEach(session => {
        console.log(`   ID: ${session.id}, Estado: "${session.status}"`);
      });
      
      // Si hay sesión abierta pero con estado diferente, corregirla
      const possibleActiveSessions = sessionsForCash1.filter(s => 
        s.status !== 'closed' && !s.closedAt
      );
      
      if (possibleActiveSessions.length > 0) {
        console.log('\n🔧 4. Corrigiendo estado de sesión activa...');
        const sessionToFix = possibleActiveSessions[0];
        console.log(`Corrigiendo sesión ID: ${sessionToFix.id} de "${sessionToFix.status}" a "open"`);
        
        const { error: updateError } = await supabase
          .from('CashSession')
          .update({ status: 'open' })
          .eq('id', sessionToFix.id);
        
        if (updateError) {
          console.error('❌ Error corrigiendo sesión:', updateError.message);
        } else {
          console.log('✅ Sesión corregida exitosamente');
          
          // Verificar la corrección
          const { data: fixedSession } = await supabase
            .from('CashSession')
            .select('*')
            .eq('id', sessionToFix.id)
            .single();
          
          console.log(`✅ Estado después de corrección: "${fixedSession.status}"`);
        }
      }
      
    } else {
      console.log('✅ Sesión encontrada correctamente');
      console.log(`   ID: ${openSessions[0].id}, Estado: "${openSessions[0].status}"`);
    }

    console.log('\n🔍 5. Verificación final...');
    const { data: finalCheck } = await supabase
      .from('CashSession')
      .select('*')
      .eq('cashRegisterId', 1)
      .eq('status', 'open')
      .order('openedAt', { ascending: false })
      .limit(1);

    if (finalCheck && finalCheck.length > 0) {
      console.log('✅ PROBLEMA RESUELTO: getCurrentCashSession ahora debería funcionar');
      console.log(`   Sesión encontrada: ID ${finalCheck[0].id} con $${finalCheck[0].currentAmount}`);
      console.log('\n💡 PRÓXIMO PASO:');
      console.log('• Recarga la página: http://localhost:3000/dashboard/pettyCash');
      console.log('• Debería mostrar la sesión activa y los botones correctos');
    } else {
      console.log('❌ No se encontró sesión activa después de la corrección');
    }

  } catch (error) {
    console.error('💥 Error general:', error.message);
  }
}

debugSessionDetection(); 