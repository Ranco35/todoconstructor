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

async function updateEduardoToSuperUser() {
  console.log('🚀 Actualizando Eduardo a Super Usuario...');
  
  const email = 'eduardo@termasllifen.cl';
  
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
      return;
    }

    console.log('✅ Usuario encontrado en Auth:', authUser.id);

    // 2. Verificar/crear rol SUPER_USER
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

    // 3. Verificar si el usuario existe en la tabla User
    console.log('🔍 Verificando perfil de usuario...');
    const { data: existingUser, error: findError } = await supabase
      .from('User')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      console.error('❌ Error buscando usuario:', findError.message);
      return;
    }

    if (existingUser) {
      // Usuario existe, actualizar solo el rol y otros campos, mantener username actual
      console.log('📝 Actualizando perfil existente...');
      console.log('📝 Username actual:', existingUser.username);
      
      const { data: updatedUser, error: updateError } = await supabase
        .from('User')
        .update({
          roleId: superUserRole.id,
          name: 'Eduardo Probost',
          department: 'ADMINISTRACION',
          isActive: true,
          isCashier: true,
          updatedAt: new Date().toISOString()
        })
        .eq('id', authUser.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error actualizando perfil:', updateError.message);
        return;
      }

      console.log('✅ Perfil actualizado');
      console.log('👤 Username mantenido:', existingUser.username);
    } else {
      // Usuario no existe en tabla User, crear perfil con username único
      console.log('📝 Creando nuevo perfil...');
      
      // Generar username único
      const baseUsername = 'eduardo';
      let uniqueUsername = baseUsername;
      let counter = 1;
      
      // Verificar si el username existe
      while (true) {
        const { data: existingUsername } = await supabase
          .from('User')
          .select('username')
          .eq('username', uniqueUsername)
          .single();
        
        if (!existingUsername) {
          break; // Username disponible
        }
        
        uniqueUsername = `${baseUsername}${counter}`;
        counter++;
      }
      
      console.log('📝 Username único generado:', uniqueUsername);
      
      const { data: newUser, error: createError } = await supabase
        .from('User')
        .insert({
          id: authUser.id,
          name: 'Eduardo Probost',
          email: email,
          username: uniqueUsername,
          roleId: superUserRole.id,
          department: 'ADMINISTRACION',
          isActive: true,
          isCashier: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creando perfil:', createError.message);
        return;
      }

      console.log('✅ Perfil creado');
      console.log('👤 Username asignado:', uniqueUsername);
    }

    // 4. Actualizar metadata en Auth
    console.log('📝 Actualizando metadata en Auth...');
    const { data: updatedAuthUser, error: metadataError } = await supabase.auth.admin.updateUserById(
      authUser.id,
      {
        user_metadata: {
          name: 'Eduardo Probost',
          role: 'SUPER_USER'
        }
      }
    );

    if (metadataError) {
      console.error('❌ Error actualizando metadata:', metadataError.message);
    } else {
      console.log('✅ Metadata actualizada');
    }

    // 5. Obtener información final del usuario
    const { data: finalUser } = await supabase
      .from('User')
      .select('*, Role(roleName)')
      .eq('id', authUser.id)
      .single();

    // 6. Mostrar información
    console.log('\n🎉 ¡Eduardo actualizado a Super Usuario exitosamente!');
    console.log('📧 Email:', email);
    console.log('👤 Nombre: Eduardo Probost');
    console.log('👤 Username:', finalUser?.username || 'N/A');
    console.log('🏷️ Rol: SUPER_USER');
    console.log('🆔 ID:', authUser.id);
    console.log('🌐 URL de login: https://admintermas-imfxqpasm-eduardo-probostes-projects.vercel.app/login');
    console.log('\n✅ Puedes hacer login con:');
    console.log('   - Email: eduardo@termasllifen.cl');
    console.log('   - O Username:', finalUser?.username || 'N/A');
    console.log('   - Y tu contraseña actual');

  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
  }
}

updateEduardoToSuperUser(); 