require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('👥 Verificando usuarios disponibles en la base de datos\n');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

// Usar service role key para bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUsers() {
  try {
    console.log('🔍 Buscando usuarios en la base de datos...');
    
    const { data: users, error } = await supabase
      .from('User')
      .select(`
        id,
        name,
        email,
        isActive,
        isCashier,
        Role:roleId (
          roleName
        )
      `)
      .order('name');
    
    if (error) {
      console.error(`❌ Error obteniendo usuarios: ${error.message}`);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('⚠️ No se encontraron usuarios en la base de datos');
      console.log('💡 Necesitas crear al menos un usuario para poder hacer login');
      return;
    }
    
    console.log(`✅ Se encontraron ${users.length} usuarios:\n`);
    
    users.forEach((user, index) => {
      const role = user.Role ? user.Role.roleName : 'Sin rol';
      const status = user.isActive ? '✅ Activo' : '❌ Inactivo';
      const cashier = user.isCashier ? '💰 Cajero' : '👤 Usuario';
      
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Rol: ${role} | Estado: ${status} | ${cashier}`);
      console.log('');
    });
    
    // Mostrar usuarios activos que pueden hacer login
    const activeUsers = users.filter(user => user.isActive);
    
    if (activeUsers.length > 0) {
      console.log('🔑 Usuarios disponibles para login:');
      activeUsers.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   Nombre: ${user.name}`);
        console.log(`   Rol: ${user.Role ? user.Role.roleName : 'Sin rol'}`);
        console.log('');
      });
    } else {
      console.log('⚠️ No hay usuarios activos disponibles para login');
    }
    
  } catch (error) {
    console.error(`❌ Error inesperado: ${error.message}`);
  }
}

async function checkAuthUsers() {
  try {
    console.log('\n🔐 Verificando usuarios en Supabase Auth...');
    
    // Listar usuarios de autenticación (esto requiere permisos de admin)
    const { data: authUsers, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.log(`⚠️ No se pudieron obtener usuarios de Auth: ${error.message}`);
      console.log('💡 Esto es normal si no tienes permisos de admin');
      return;
    }
    
    if (!authUsers || authUsers.users.length === 0) {
      console.log('⚠️ No hay usuarios en Supabase Auth');
      return;
    }
    
    console.log(`✅ Se encontraron ${authUsers.users.length} usuarios en Auth:\n`);
    
    authUsers.users.forEach((user, index) => {
      const status = user.email_confirmed_at ? '✅ Confirmado' : '❌ No confirmado';
      const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Nunca';
      
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   Estado: ${status}`);
      console.log(`   Último login: ${lastSignIn}`);
      console.log(`   Creado: ${new Date(user.created_at).toLocaleString()}`);
      console.log('');
    });
    
  } catch (error) {
    console.log(`⚠️ Error verificando usuarios de Auth: ${error.message}`);
  }
}

async function main() {
  await checkUsers();
  await checkAuthUsers();
  
  console.log('💡 Para crear un usuario de prueba, puedes:');
  console.log('1. Usar el script create-test-user.js');
  console.log('2. Crear un usuario manualmente en Supabase Dashboard');
  console.log('3. Usar la función de registro si está habilitada');
}

main().catch(console.error); 