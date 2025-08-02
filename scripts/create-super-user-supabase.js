require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL or Service Role Key is missing.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSuperUser() {
  const userData = {
    email: 'edu@admintermas.com',
    password: 'password123',
    name: 'Eduardo',
    roleName: 'SUPER_USER', 
    department: 'SISTEMAS',
  };

  try {
    // 0. Buscar y eliminar el usuario si ya existe en Auth
    console.log(`0. Verificando si el usuario ${userData.email} ya existe en Supabase Auth...`);
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw new Error(`Error listando usuarios para verificación: ${listError.message}`);

    const existingUser = users.find(u => u.email === userData.email);

    if (existingUser) {
      console.warn(`⚠️  El usuario ${userData.email} ya existe (ID: ${existingUser.id}). Eliminándolo para recrearlo...`);
      const { error: deleteError } = await supabase.auth.admin.deleteUser(existingUser.id);
      if (deleteError) {
        throw new Error(`Error eliminando el usuario existente: ${deleteError.message}`);
      }
      console.log('✅ Usuario existente eliminado.');
    } else {
      console.log('ℹ️ No existe un usuario previo. Se creará uno nuevo.');
    }

    // 1. Crear el usuario en Supabase Auth
    console.log(`1. Creando usuario en Supabase Auth para ${userData.email}...`);
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Auto-confirma el email
      user_metadata: { name: userData.name, role: userData.roleName }
    });

    if (authError) {
      throw new Error(`Error en Supabase Auth: ${authError.message}`);
    }

    const authUser = authData.user;
    console.log(`✅ Usuario de autenticación creado con ID: ${authUser.id}`);
    
    // 2. Crear (o actualizar) el perfil en la tabla pública 'User'
    console.log(`2. Creando/actualizando perfil en la tabla pública 'User' para el ID: ${authUser.id}`);
    
    // Obtenemos el ID del rol
    const { data: roleData, error: roleError } = await supabase
      .from('Role')
      .select('id')
      .eq('roleName', userData.roleName)
      .single();

    if (roleError || !roleData) {
        throw new Error(`Rol '${userData.roleName}' no encontrado. Error: ${roleError?.message}`);
    }

    const { error: profileError } = await supabase
      .from('User')
      .upsert({
        id: authUser.id, // Aseguramos que el ID coincida con el de Auth
        name: userData.name,
        username: userData.name.toLowerCase(),
        email: userData.email,
        roleId: roleData.id,
        department: userData.department,
        isActive: true,
      });

    if (profileError) {
      throw new Error(`Error creando/actualizando el perfil: ${profileError.message}`);
    }

    console.log('✅ Perfil de usuario creado/actualizado exitosamente.');
    console.log('---');
    console.log('🎉 ¡Super Usuario "Eduardo" configurado correctamente! 🎉');
    console.log(`   - Email: ${userData.email}`);
    console.log(`   - Contraseña: ${userData.password}`);
    console.log('---');
    
  } catch (error) {
    console.error('❌ Error en el script:', error.message);
  }
}

createSuperUser(); 