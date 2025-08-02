const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=');
          process.env[key] = value;
        }
      }
    });
  }
}

// Load environment variables
loadEnvFile();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  console.error('Supabase URL:', supabaseUrl ? 'Set' : 'Not set');
  console.error('Service Key:', supabaseServiceKey ? 'Set' : 'Not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
  const userData = {
    email: 'lorepg310@gmail.com',
    password: 'chile1010',
    name: 'Lorena Admin',
    roleName: 'ADMINISTRADOR',
    department: 'ADMINISTRACION',
  };

  try {
    console.log('🚀 Creando usuario administrador...');
    console.log(`📧 Email: ${userData.email}`);
    console.log(`👤 Nombre: ${userData.name}`);
    console.log(`🏷️ Rol: ${userData.roleName}`);
    
    // 1. Verificar si el usuario ya existe en Auth
    console.log('\n1. Verificando si el usuario ya existe en Supabase Auth...');
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw new Error(`Error listando usuarios: ${listError.message}`);

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

    // 2. Crear el usuario en Supabase Auth
    console.log('\n2. Creando usuario en Supabase Auth...');
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
    
    // 3. Verificar/crear el rol ADMINISTRADOR
    console.log('\n3. Verificando rol ADMINISTRADOR...');
    let { data: adminRole, error: roleError } = await supabase
      .from('Role')
      .select('id')
      .eq('roleName', userData.roleName)
      .single();

    if (roleError || !adminRole) {
      console.log('📝 Creando rol ADMINISTRADOR...');
      const { data: newRole, error: createRoleError } = await supabase
        .from('Role')
        .insert({
          roleName: 'ADMINISTRADOR',
          description: 'Administrador del sistema con acceso completo'
        })
        .select()
        .single();

      if (createRoleError) {
        throw new Error(`Error creando rol: ${createRoleError.message}`);
      }
      adminRole = newRole;
      console.log('✅ Rol ADMINISTRADOR creado');
    } else {
      console.log('✅ Rol ADMINISTRADOR encontrado');
    }

    console.log(`✅ Rol ID: ${adminRole.id}`);

    // 4. Crear perfil de usuario en la tabla User
    console.log('\n4. Creando perfil de usuario...');
    const { data: userProfile, error: profileError } = await supabase
      .from('User')
      .insert({
        id: authUser.id,
        name: userData.name,
        email: userData.email,
        username: 'lorena.admin',
        roleId: adminRole.id,
        department: userData.department,
        isActive: true,
        isCashier: true, // Administrador puede manejar caja
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      throw new Error(`Error creando perfil: ${profileError.message}`);
    }

    console.log('✅ Perfil de usuario creado exitosamente');

    // 5. Mostrar información del usuario creado
    console.log('\n🎉 ¡Usuario administrador creado exitosamente!');
    console.log('📧 Email:', userData.email);
    console.log('🔑 Contraseña:', userData.password);
    console.log('👤 Nombre:', userData.name);
    console.log('🏷️ Rol:', userData.roleName);
    console.log('🆔 ID:', authUser.id);
    console.log('👤 Username:', 'lorena.admin');
    console.log('🏢 Departamento:', userData.department);
    console.log('💳 Es Cajero:', true);
    console.log('\n🌐 Puedes hacer login en: http://localhost:3000/login');
    console.log('⚠️  IMPORTANTE: Cambia la contraseña después del primer login por seguridad');

  } catch (error) {
    console.error('❌ Error en el script:', error.message);
    process.exit(1);
  }
}

// Ejecutar el script
createAdminUser().then(() => {
  console.log('\n✅ Script completado exitosamente');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Error ejecutando script:', error);
  process.exit(1);
}); 