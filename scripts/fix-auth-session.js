require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🔧 Diagnóstico y solución de problemas de autenticación\n');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnoseAuth() {
  console.log('1️⃣ Verificando estado de autenticación...');
  
  try {
    // Verificar sesión actual
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.log(`❌ Error obteniendo sesión: ${sessionError.message}`);
      return false;
    }
    
    if (!session) {
      console.log('⚠️ No hay sesión activa');
      return false;
    }
    
    console.log('✅ Sesión activa encontrada');
    console.log(`   Usuario: ${session.user.email}`);
    console.log(`   Expira: ${new Date(session.expires_at * 1000).toLocaleString()}`);
    
    // Verificar usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log(`❌ Error obteniendo usuario: ${userError.message}`);
      return false;
    }
    
    if (!user) {
      console.log('❌ No se pudo obtener información del usuario');
      return false;
    }
    
    console.log('✅ Usuario autenticado correctamente');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    
    return true;
  } catch (error) {
    console.log(`❌ Error inesperado: ${error.message}`);
    return false;
  }
}

async function testDatabaseAccess() {
  console.log('\n2️⃣ Probando acceso a la base de datos...');
  
  try {
    // Intentar acceder a la tabla User
    const { data: users, error } = await supabase
      .from('User')
      .select('id, name, email, isActive')
      .limit(3);
    
    if (error) {
      console.log(`❌ Error accediendo a la base de datos: ${error.message}`);
      console.log(`   Código: ${error.code}`);
      console.log(`   Detalles: ${error.details}`);
      return false;
    }
    
    console.log('✅ Acceso a base de datos exitoso');
    console.log(`   Usuarios encontrados: ${users.length}`);
    
    return true;
  } catch (error) {
    console.log(`❌ Error inesperado: ${error.message}`);
    return false;
  }
}

async function clearSession() {
  console.log('\n3️⃣ Limpiando sesión actual...');
  
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.log(`❌ Error cerrando sesión: ${error.message}`);
      return false;
    }
    
    console.log('✅ Sesión cerrada correctamente');
    return true;
  } catch (error) {
    console.log(`❌ Error inesperado: ${error.message}`);
    return false;
  }
}

async function testLogin() {
  console.log('\n4️⃣ Probando login con credenciales de prueba...');
  
  // Usar un usuario de prueba (ajusta según tus datos)
  const testCredentials = {
    email: 'eduardo@termasllifen.cl',
    password: 'test123' // Ajusta la contraseña según tu configuración
  };
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword(testCredentials);
    
    if (error) {
      console.log(`❌ Error en login: ${error.message}`);
      console.log('💡 Verifica las credenciales de prueba');
      return false;
    }
    
    console.log('✅ Login exitoso');
    console.log(`   Usuario: ${data.user.email}`);
    console.log(`   Sesión creada: ${new Date().toLocaleString()}`);
    
    return true;
  } catch (error) {
    console.log(`❌ Error inesperado: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando diagnóstico completo de autenticación...\n');
  
  // Paso 1: Diagnosticar estado actual
  const hasSession = await diagnoseAuth();
  
  // Paso 2: Probar acceso a base de datos
  const dbAccess = await testDatabaseAccess();
  
  // Paso 3: Si hay problemas, limpiar sesión
  if (!hasSession || !dbAccess) {
    console.log('\n🔄 Intentando limpiar sesión...');
    await clearSession();
    
    // Paso 4: Probar login
    console.log('\n🔄 Intentando login de prueba...');
    const loginSuccess = await testLogin();
    
    if (loginSuccess) {
      // Paso 5: Verificar nuevamente
      console.log('\n🔄 Verificando estado después del login...');
      await diagnoseAuth();
      await testDatabaseAccess();
    }
  }
  
  console.log('\n📊 Resumen del diagnóstico:');
  console.log(`Sesión activa: ${hasSession ? '✅' : '❌'}`);
  console.log(`Acceso a BD: ${dbAccess ? '✅' : '❌'}`);
  
  if (!hasSession || !dbAccess) {
    console.log('\n💡 Recomendaciones:');
    console.log('1. Verifica que el usuario tenga permisos en Supabase');
    console.log('2. Revisa las políticas RLS en la base de datos');
    console.log('3. Asegúrate de que las credenciales sean correctas');
    console.log('4. Intenta acceder desde el navegador a /login');
  } else {
    console.log('\n✅ Sistema de autenticación funcionando correctamente');
  }
}

main().catch(console.error); 