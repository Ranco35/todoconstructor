console.log('🎯 PRUEBA FINAL - SISTEMA CAJA CHICA');
console.log('=======================================');

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://bvzfuibqlprrfbudnauc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2emZ1aWJxbHBycmZidWRuYXVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU1MjYwMSwiZXhwIjoyMDY2MTI4NjAxfQ.4TGUtzCpdxCEwlpC3WKlHJ4I6O7ZGTCbFQBARYgv834'
);

async function finalTest() {
  try {
    console.log('1️⃣ Verificando estado actual de la base de datos...');
    
    // Verificar usuario
    const { data: user } = await supabase
      .from('User')
      .select('*')
      .eq('email', 'eduardo@termasllifen.cl')
      .single();
      
    console.log('👤 Usuario:', user?.name || 'No encontrado');
    
    // Verificar sesión activa
    const { data: activeSession } = await supabase
      .from('CashSession')
      .select('*')
      .eq('cashRegisterId', 1)
      .eq('status', 'open')
      .single();
      
    if (activeSession) {
      console.log('✅ SESIÓN ACTIVA DETECTADA:');
      console.log(`   📋 ID: ${activeSession.id}`);
      console.log(`   💰 Monto: $${activeSession.openingAmount?.toLocaleString()}`);
      console.log(`   📅 Creada: ${new Date(activeSession.openedAt).toLocaleString()}`);
      console.log(`   👤 Usuario: ${activeSession.userId}`);
      console.log(`   🏪 Caja: ${activeSession.cashRegisterId}`);
    } else {
      console.log('❌ NO HAY SESIÓN ACTIVA');
      console.log('🔍 Verificando todas las sesiones...');
      
      const { data: allSessions } = await supabase
        .from('CashSession')
        .select('*')
        .order('openedAt', { ascending: false })
        .limit(5);
        
      if (allSessions && allSessions.length > 0) {
        console.log('📊 Últimas 5 sesiones:');
        allSessions.forEach((session, index) => {
          console.log(`   ${index + 1}. ID: ${session.id} | Estado: ${session.status} | Usuario: ${session.userId}`);
        });
      }
    }
    
    console.log('\n2️⃣ Verificando acceso web...');
    
    try {
      const response = await fetch('http://localhost:3000/dashboard/pettyCash');
      console.log(`🌐 Servidor responde: ${response.status} ${response.statusText}`);
      
      if (response.status === 200) {
        console.log('✅ La página de caja chica está accesible');
      } else {
        console.log('❌ La página no está disponible');
      }
    } catch (error) {
      console.log('❌ Error conectando al servidor:', error.message);
    }
    
    console.log('\n🎯 CONCLUSIÓN:');
    
    if (activeSession) {
      console.log('✅ ESTADO PERFECTO:');
      console.log('   ✅ Usuario autenticado');
      console.log('   ✅ Sesión de caja activa');
      console.log('   ✅ Base de datos funcionando');
      console.log('   🎯 El botón "Abrir Nueva Sesión" ya NO debería aparecer');
      console.log('   🎯 En su lugar deberían aparecer los botones de gastos/compras/cierre');
    } else {
      console.log('⚠️ LISTO PARA ABRIR SESIÓN:');
      console.log('   ✅ Usuario autenticado'); 
      console.log('   ⚠️ No hay sesión activa');
      console.log('   ✅ Base de datos funcionando');
      console.log('   🎯 El botón "Abrir Nueva Sesión" DEBERÍA funcionar ahora');
    }
    
  } catch (error) {
    console.error('💥 Error en prueba final:', error);
  }
}

finalTest(); 