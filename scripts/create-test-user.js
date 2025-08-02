require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
  try {
    console.log('🔧 Creando usuario de prueba...\n');

    // 1. Verificar roles existentes
    console.log('1. Verificando roles existentes:');
    const { data: roles, error: rolesError } = await supabase
      .from('Role')
      .select('*');

    if (rolesError) {
      console.error('Error obteniendo roles:', rolesError.message);
      return;
    }

    if (!roles || roles.length === 0) {
      console.log('No hay roles existentes. Creando roles básicos...');
      
      // Crear roles básicos
      const { data: newRoles, error: createRolesError } = await supabase
        .from('Role')
        .insert([
          { roleName: 'SUPER_USER', description: 'Acceso completo a todas las funcionalidades del sistema.' },
          { roleName: 'ADMINISTRADOR', description: 'Gestión general del sistema, usuarios y configuraciones.' },
          { roleName: 'JEFE_SECCION', description: 'Gestión de un departamento o sección específica.' },
          { roleName: 'USUARIO_FINAL', description: 'Acceso a funcionalidades operativas básicas.' }
        ])
        .select();

      if (createRolesError) {
        console.error('Error creando roles:', createRolesError.message);
        return;
      }

      console.log('Roles creados:', newRoles);
    } else {
      console.log('Roles existentes:', roles);
    }

    // 2. Obtener el ID del rol USUARIO_FINAL
    const { data: userRole, error: roleError } = await supabase
      .from('Role')
      .select('id')
      .eq('roleName', 'USUARIO_FINAL')
      .single();

    if (roleError || !userRole) {
      console.error('Error obteniendo rol USUARIO_FINAL:', roleError?.message);
      return;
    }

    console.log('Rol USUARIO_FINAL encontrado con ID:', userRole.id);

    // 3. Crear usuario en auth.users
    console.log('2. Creando usuario en auth.users...');
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'usuario.prueba@test.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: { name: 'Usuario Prueba' }
    });

    if (authError) {
      console.error('Error creando usuario en auth:', authError.message);
      return;
    }

    console.log('Usuario creado en auth.users con ID:', authUser.user.id);

    // 4. Crear perfil en la tabla User
    const testUserProfile = {
      id: authUser.user.id, // Usar el ID del usuario de auth
      name: 'Usuario Prueba',
      username: 'usuario.prueba',
      email: 'usuario.prueba@test.com',
      roleId: userRole.id,
      department: 'SISTEMAS',
      isCashier: false,
      isActive: true
    };

    console.log('3. Creando perfil en tabla User:', testUserProfile);

    const { data: newUser, error: userError } = await supabase
      .from('User')
      .insert(testUserProfile)
      .select('*, Role(roleName)')
      .single();

    if (userError) {
      console.error('Error creando perfil de usuario:', userError.message);
      // Limpiar el usuario de auth si falla la creación del perfil
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return;
    }

    console.log('✅ Usuario creado exitosamente:');
    console.log('ID:', newUser.id);
    console.log('Nombre:', newUser.name);
    console.log('Email:', newUser.email);
    console.log('Rol:', newUser.Role?.roleName);
    console.log('Departamento:', newUser.department);
    console.log('Es Cajero:', newUser.isCashier);
    console.log('Activo:', newUser.isActive);

    // 5. Verificar que se puede consultar correctamente
    console.log('\n4. Verificando consulta del usuario:');
    const { data: verifyUser, error: verifyError } = await supabase
      .from('User')
      .select('*, Role(roleName)')
      .eq('id', newUser.id)
      .single();

    if (verifyError) {
      console.error('Error verificando usuario:', verifyError.message);
    } else {
      console.log('✅ Usuario verificado correctamente:');
      console.log('Consulta exitosa con join a Role');
    }

    console.log('\n🎯 URL para probar la edición:');
    console.log(`http://localhost:3000/dashboard/configuration/users/edit/${newUser.id}`);
    console.log('\n📧 Credenciales de acceso:');
    console.log('Email: usuario.prueba@test.com');
    console.log('Password: password123');

  } catch (error) {
    console.error('Error general:', error.message);
  }
}

createTestUser(); 