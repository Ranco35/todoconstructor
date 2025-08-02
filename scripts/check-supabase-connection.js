require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Verificando configuración de Supabase...');
console.log('URL:', supabaseUrl ? '✅ Presente' : '❌ Faltante');
console.log('Service Key:', supabaseServiceKey ? '✅ Presente' : '❌ Faltante');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkConnection() {
  try {
    console.log('\n🔍 Probando conexión a Supabase...');
    
    // Verificar estructura de tablas
    console.log('\n🔍 Verificando estructura de tablas...');
    
    // Verificar CashSession específicamente
    console.log('\n📋 Verificando tabla CashSession...');
    
    // Intentar obtener información de la tabla sin datos
    const { data: tableInfo, error: tableError } = await supabase
      .from('CashSession')
      .select('*')
      .limit(0);
    
    if (tableError) {
      console.error('❌ Error al consultar estructura de CashSession:', tableError);
    } else {
      console.log('✅ Tabla CashSession accesible');
      console.log('📋 La tabla existe pero no podemos ver las columnas sin datos');
    }
    
    // Intentar crear una sesión mínima para ver la estructura
    console.log('\n🧪 Intentando crear sesión mínima para verificar estructura...');
    const { data: testSession, error: testError } = await supabase
      .from('CashSession')
      .insert({
        userId: '00000000-0000-0000-0000-000000000000',
        cashRegisterId: 1,
        openingAmount: 1000,
        currentAmount: 1000,
        status: 'open',
        openedAt: new Date().toISOString()
      })
      .select()
      .single();
    
    if (testError) {
      console.error('❌ Error al crear sesión mínima:', testError);
      console.log('📋 Esto indica qué columnas faltan o están mal configuradas');
    } else {
      console.log('✅ Sesión mínima creada exitosamente');
      console.log('📋 Estructura de CashSession:', Object.keys(testSession));
      console.log('📋 Datos de la sesión:', testSession);
      
      // Eliminar la sesión de prueba
      await supabase
        .from('CashSession')
        .delete()
        .eq('id', testSession.id);
      console.log('🧹 Sesión de prueba eliminada');
    }
    
    // Verificar User específicamente
    console.log('\n📋 Verificando tabla User...');
    const { data: users, error: userError } = await supabase
      .from('User')
      .select('*')
      .limit(1);
    
    if (userError) {
      console.error('❌ Error al consultar User:', userError);
    } else {
      console.log('✅ Tabla User accesible');
      if (users && users.length > 0) {
        console.log('📋 Columnas de User:', Object.keys(users[0]));
      } else {
        console.log('ℹ️ Tabla User vacía');
      }
    }
    
    // Verificar relaciones
    console.log('\n🔍 Verificando relaciones...');
    
    const { data: sessionWithUser, error: relationError } = await supabase
      .from('CashSession')
      .select(`
        *,
        User:User(id, name, email)
      `)
      .limit(1);
    
    if (relationError) {
      console.error('❌ Error en relación CashSession-User:', relationError);
    } else {
      console.log('✅ Relación CashSession-User funciona');
      if (sessionWithUser && sessionWithUser.length > 0) {
        console.log('📋 Datos con relación:', sessionWithUser[0]);
      }
    }
    
    // Verificar sesiones activas
    console.log('\n🔍 Verificando sesiones activas...');
    
    const { data: activeSessions, error: activeError } = await supabase
      .from('CashSession')
      .select('*')
      .eq('status', 'open');
    
    if (activeError) {
      console.error('❌ Error al consultar sesiones activas:', activeError);
    } else {
      console.log(`✅ Sesiones activas encontradas: ${activeSessions?.length || 0}`);
      if (activeSessions && activeSessions.length > 0) {
        activeSessions.forEach(session => {
          console.log(`  - ID: ${session.id}, Usuario: ${session.userId}, Monto: $${session.currentAmount}`);
        });
      }
    }
    
    // Verificar todas las sesiones con openedAt
    console.log('\n🔍 Verificando todas las sesiones con openedAt...');
    
    const { data: allSessions, error: allError } = await supabase
      .from('CashSession')
      .select('*')
      .order('openedAt', { ascending: false })
      .limit(5);
    
    if (allError) {
      console.error('❌ Error al consultar todas las sesiones:', allError);
    } else {
      console.log(`✅ Total de sesiones encontradas: ${allSessions?.length || 0}`);
      if (allSessions && allSessions.length > 0) {
        allSessions.forEach(session => {
          console.log(`  - ID: ${session.id}, Status: ${session.status}, Usuario: ${session.userId}, Monto: $${session.currentAmount}, Fecha: ${session.openedAt}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

checkConnection(); 