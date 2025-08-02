require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Variables de entorno no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCreateUser() {
  try {
    console.log('🧪 Probando creación de usuario...');

    // Simular los datos del formulario
    const testUserData = {
      email: 'test.usuario@test.com',
      password: 'password123',
      firstName: 'Usuario',
      lastName: 'Prueba',
      roleName: 'USUARIO_FINAL',
      department: 'SISTEMAS',
      isCashier: false
    };

    console.log('📝 Datos del usuario:', testUserData);

    // 1. Verificar que el rol existe
    console.log('\n1. Verificando rol...');
    const { data: roleData, error: roleError } = await supabase
      .from('Role')
      .select('id')
      .eq('roleName', testUserData.roleName)
      .single();

    if (roleError || !roleData) {
      console.error('❌ Error obteniendo rol:', roleError?.message);
      return;
    }
    console.log('✅ Rol encontrado:', roleData);

    // 2. Crear usuario en Auth
    console.log('\n2. Creando usuario en Auth...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testUserData.email,
      password: testUserData.password,
      email_confirm: true,
      user_metadata: { name: `${testUserData.firstName} ${testUserData.lastName}` }
    });

    if (authError) {
      console.error('❌ Error en Auth:', authError.message);
      return;
    }
    console.log('✅ Usuario creado en Auth:', authData.user.id);

    // 3. Crear perfil en tabla User
    console.log('\n3. Creando perfil en tabla User...');
    const { data: newUser, error: profileError } = await supabase
      .from('User')
      .insert({
        id: authData.user.id,
        name: `${testUserData.firstName} ${testUserData.lastName}`,
        username: testUserData.email,
        email: testUserData.email,
        roleId: roleData.id,
        department: testUserData.department,
        isCashier: testUserData.isCashier,
        isActive: true,
      })
      .select('id')
      .single();

    if (profileError) {
      console.error('❌ Error creando perfil:', profileError.message);
      // Limpiar usuario de Auth
      await supabase.auth.admin.deleteUser(authData.user.id);
      return;
    }

    console.log('✅ Usuario creado exitosamente:', newUser);
    console.log('\n🎉 Prueba completada con éxito!');

  } catch (error) {
    console.error('❌ Error general:', error.message);
    console.error('Stack:', error.stack);
  }
}

testCreateUser();