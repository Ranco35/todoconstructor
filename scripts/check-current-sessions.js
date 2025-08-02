const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ibpbclxszblystwffxzn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlicGJjbHhzemJseXN0d2ZmeHpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxOTE5NzQ5MywiZXhwIjoyMDM0NzczNDkzfQ.hHCcQ6dQON7_3bgjYGqj-K9bMQnGqgJ6lzCJD7UJ1bw';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkCurrentSessions() {
  try {
    console.log('🔍 VERIFICANDO ESTADO DE SESIONES');
    console.log('═══════════════════════════════════');
    
    // Obtener todas las sesiones recientes
    const { data: sessions, error } = await supabase
      .from('CashSession')
      .select(`
        id,
        userId,
        cashRegisterId,
        openingAmount,
        currentAmount,
        status,
        openedAt,
        closedAt,
        notes
      `)
      .order('id', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ Error al obtener sesiones:', error);
      return;
    }
    
    if (!sessions || sessions.length === 0) {
      console.log('❌ No se encontraron sesiones');
      return;
    }
    
    console.log(`📊 Últimas ${sessions.length} sesiones:`);
    console.log('');
    
    sessions.forEach((session, index) => {
      const status = session.status === 'open' ? '🟢 ABIERTA' : 
                   session.status === 'closed' ? '🔒 CERRADA' : 
                   '⚠️ SUSPENDIDA';
      
      console.log(`${index + 1}. ID: ${session.id}`);
      console.log(`   Estado: ${status}`);
      console.log(`   Usuario: ${session.userId}`);
      console.log(`   Monto inicial: $${session.openingAmount?.toLocaleString()}`);
      console.log(`   Abierta: ${new Date(session.openedAt).toLocaleString()}`);
      if (session.closedAt) {
        console.log(`   Cerrada: ${new Date(session.closedAt).toLocaleString()}`);
      }
      console.log('');
    });
    
    // Contar sesiones activas
    const activeSessions = sessions.filter(s => s.status === 'open');
    console.log(`🟢 SESIONES ACTIVAS: ${activeSessions.length}`);
    
    if (activeSessions.length > 0) {
      console.log('');
      activeSessions.forEach(session => {
        console.log(`✅ Sesión activa ID ${session.id}:`);
        console.log(`   Monto: $${session.openingAmount?.toLocaleString()}`);
        console.log(`   Usuario: ${session.userId}`);
        console.log(`   Desde: ${new Date(session.openedAt).toLocaleString()}`);
      });
    } else {
      console.log('ℹ️ No hay sesiones activas en este momento');
    }
    
    // Verificar la sesión específica de caja 1
    console.log('');
    console.log('🔍 VERIFICANDO CAJA REGISTRADORA 1...');
    const { data: currentSession, error: currentError } = await supabase
      .from('CashSession')
      .select('*')
      .eq('cashRegisterId', 1)
      .eq('status', 'open')
      .single();
    
    if (currentError && currentError.code !== 'PGRST116') {
      console.error('❌ Error al verificar sesión actual:', currentError);
    } else if (!currentSession) {
      console.log('⚠️ No hay sesión activa para la caja registradora 1');
    } else {
      console.log('✅ Sesión activa encontrada para caja 1:');
      console.log(`   ID: ${currentSession.id}`);
      console.log(`   Monto: $${currentSession.openingAmount?.toLocaleString()}`);
      console.log(`   Usuario: ${currentSession.userId}`);
    }
    
  } catch (error) {
    console.error('💥 Error inesperado:', error);
  }
}

checkCurrentSessions(); 