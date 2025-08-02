const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Configurado' : '❌ Faltante');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Configurado' : '❌ Faltante');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function updateJosePassword() {
  console.log('🚀 Actualizando contraseña de José...');
  
  const email = 'jose@termasllifen.cl';
  const newPassword = '2014jose';
  
  try {
    // 1. Buscar usuario en Supabase Auth
    console.log('🔍 Buscando usuario en Auth...');
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listando usuarios:', listError.message);
      return;
    }

    const authUser = users.users.find(user => user.email === email);
    
    if (!authUser) {
      console.error('❌ Usuario no encontrado en Auth');
      console.log('📧 Emails disponibles:', users.users.map(u => u.email));
      return;
    }

    console.log('✅ Usuario encontrado en Auth:', authUser.id);
    console.log('📧 Email:', authUser.email);
    console.log('👤 Nombre:', authUser.user_metadata?.name || 'No especificado');

    // 2. Actualizar contraseña en Supabase Auth
    console.log('🔐 Actualizando contraseña...');
    const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
      authUser.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('❌ Error actualizando contraseña:', updateError.message);
      return;
    }

    console.log('✅ Contraseña actualizada exitosamente');

    // 3. Verificar que el usuario existe en la tabla User
    console.log('🔍 Verificando perfil en tabla User...');
    const { data: userProfile, error: profileError } = await supabase
      .from('User')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Error verificando perfil:', profileError.message);
      return;
    }

    if (userProfile) {
      console.log('✅ Perfil encontrado en tabla User');
      console.log('👤 Nombre:', userProfile.name);
      console.log('🏷️ Departamento:', userProfile.department);
    } else {
      console.log('⚠️ Usuario no encontrado en tabla User (solo en Auth)');
    }

    // 4. Mostrar información final
    console.log('\n🎉 ¡Contraseña actualizada exitosamente!');
    console.log('📧 Email:', email);
    console.log('🔐 Nueva contraseña:', newPassword);
    console.log('🆔 ID:', authUser.id);
    console.log('🌐 URL de login: https://admintermas.vercel.app/login');
    console.log('\n✅ José puede hacer login con su email y la nueva contraseña');

  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
  }
}

// Ejecutar el script
updateJosePassword()
  .then(() => {
    console.log('\n✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error ejecutando script:', error);
    process.exit(1);
  }); 