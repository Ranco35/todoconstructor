require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createSuperUser() {
  console.log('🚀 Creando super usuario Eduardo...');
  
  const email = 'eduardo@termasllifen.cl';
  const password = 'Eduardo2024!'; // Contraseña temporal - cambiar después del primer login
  const name = 'Eduardo Probost';
  
  try {
    // 1. Crear usuario en Supabase Auth
    console.log('📝 Creando usuario en Supabase Auth...');
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        name: name,
        role: 'SUPER_USER'
      }
    });

    if (authError) {
      console.error('❌ Error creando usuario en Auth:', authError.message);
      return;
    }

    console.log('✅ Usuario creado en Auth:', authUser.user.id);

    // 2. Verificar si existe el rol SUPER_USER
    console.log('🔍 Verificando rol SUPER_USER...');
    let { data: superUserRole, error: roleError } = await supabase
      .from('Role')
      .select('id')
      .eq('roleName', 'SUPER_USER')
      .single();

    if (roleError || !superUserRole) {
      console.log('📝 Creando rol SUPER_USER...');
      const { data: newRole, error: createRoleError } = await supabase
        .from('Role')
        .insert({
          roleName: 'SUPER_USER',
          description: 'Super Usuario con acceso completo al sistema'
        })
        .select()
        .single();

      if (createRoleError) {
        console.error('❌ Error creando rol:', createRoleError.message);
        return;
      }
      superUserRole = newRole;
    }

    console.log('✅ Rol SUPER_USER ID:', superUserRole.id);

    // 3. Crear perfil de usuario en la tabla User
    console.log('📝 Creando perfil de usuario...');
    const { data: userProfile, error: profileError } = await supabase
      .from('User')
      .insert({
        id: authUser.user.id,
        name: name,
        email: email,
        username: 'eduardo',
        roleId: superUserRole.id,
        department: 'ADMINISTRACION',
        isActive: true,
        isCashier: true, // Super usuario puede manejar caja
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Error creando perfil:', profileError.message);
      return;
    }

    console.log('✅ Perfil de usuario creado');

    // 4. Mostrar información del usuario creado
    console.log('\n🎉 ¡Super usuario Eduardo creado exitosamente!');
    console.log('📧 Email:', email);
    console.log('🔑 Contraseña temporal:', password);
    console.log('👤 Nombre:', name);
    console.log('🏷️ Rol: SUPER_USER');
    console.log('🆔 ID:', authUser.user.id);
    console.log('\n⚠️  IMPORTANTE: Cambia la contraseña después del primer login');
    console.log('🌐 URL de login: https://admintermas-imfxqpasm-eduardo-probostes-projects.vercel.app/login');

  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
  }
}

createSuperUser(); 