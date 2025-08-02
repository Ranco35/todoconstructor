const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://ibpbclxszblystwffxzn.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlicGJjbHhzemJseXN0d2ZmeHpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxOTIzNzYwOSwiZXhwIjoyMDM0ODEzNjA5fQ.x4QJPLKZwEwKzF-N_8Bss8T_rXXYZ9Cc6QayaLq-_rQ';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testHistorialNavigation() {
  console.log('\n🔍 PRUEBA DE BOTÓN HISTORIAL');
  console.log('='.repeat(50));
  
  try {
    // 1. Verificar que tenemos datos para mostrar
    console.log('1. Verificando sesiones existentes...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('CashSession')
      .select('*')
      .order('openedAt', { ascending: false })
      .limit(5);

    if (sessionsError) {
      console.error('❌ Error al obtener sesiones:', sessionsError);
      return;
    }

    console.log(`✅ Sesiones encontradas: ${sessions?.length || 0}`);
    if (sessions && sessions.length > 0) {
      sessions.forEach((session, index) => {
        console.log(`   ${index + 1}. ID: ${session.id}, Status: ${session.status}, Fecha: ${new Date(session.openedAt).toLocaleDateString()}`);
      });
    }

    // 2. Verificar estadísticas
    console.log('\n2. Verificando estadísticas...');
    const [totalSessions, openSessions, closedSessions] = await Promise.all([
      supabase.from('CashSession').select('*', { count: 'exact', head: true }),
      supabase.from('CashSession').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('CashSession').select('*', { count: 'exact', head: true }).eq('status', 'closed'),
    ]);

    console.log(`✅ Total sesiones: ${totalSessions.count}`);
    console.log(`✅ Sesiones abiertas: ${openSessions.count}`);
    console.log(`✅ Sesiones cerradas: ${closedSessions.count}`);

    // 3. Verificar usuario de prueba
    console.log('\n3. Verificando usuario de prueba...');
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('*')
      .eq('email', 'eduardo@termasllifen.cl')
      .single();

    if (userError) {
      console.error('❌ Error al obtener usuario:', userError);
      return;
    }

    console.log(`✅ Usuario encontrado: ${user.name} (${user.email})`);
    console.log(`   Rol: ${user.role}`);
    console.log(`   Es cajero: ${user.isCashier ? 'Sí' : 'No'}`);

    // 4. Verificar permisos para historial
    console.log('\n4. Verificando permisos para historial...');
    const canAccessHistory = user.isCashier || user.role === 'SUPER_USER' || user.role === 'ADMINISTRADOR';
    console.log(`✅ Puede acceder al historial: ${canAccessHistory ? 'Sí' : 'No'}`);

    console.log('\n🎯 RESUMEN:');
    console.log('='.repeat(30));
    console.log(`• Sesiones disponibles: ${sessions?.length || 0}`);
    console.log(`• Usuario autenticado: ${user.name}`);
    console.log(`• Permisos para historial: ${canAccessHistory ? '✅' : '❌'}`);
    console.log(`• Todo listo para navegación: ${sessions && sessions.length > 0 && canAccessHistory ? '✅' : '❌'}`);

    if (sessions && sessions.length > 0 && canAccessHistory) {
      console.log('\n💡 El botón de historial debería funcionar correctamente.');
      console.log('Si no funciona, el problema podría ser:');
      console.log('• Error en el navegador (revisar consola)');
      console.log('• Problemas de cache (recargar página)');
      console.log('• Error en el router de Next.js');
      console.log('• Interferencia de otro JavaScript');
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar prueba
testHistorialNavigation().then(() => {
  console.log('\n✅ Prueba completada');
}).catch(console.error); 