const { createClient } = require('@supabase/supabase-js');

// Configurar cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyUserRole() {
  try {
    console.log('🔍 Verificando usuarios y roles...\n');

    // Obtener todos los usuarios con sus roles
    const { data: users, error } = await supabase
      .from('User')
      .select(`
        id,
        firstName,
        lastName,
        email,
        isActive,
        roleId,
        Role (
          id,
          roleName,
          description
        )
      `)
      .eq('isActive', true);

    if (error) {
      console.error('❌ Error obteniendo usuarios:', error);
      return;
    }

    if (!users || users.length === 0) {
      console.log('❌ No se encontraron usuarios activos');
      return;
    }

    console.log('👥 USUARIOS ACTIVOS:\n');
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🎭 Rol: ${user.Role?.roleName || 'Sin rol'} (ID: ${user.roleId})`);
      console.log(`   📝 Descripción: ${user.Role?.description || 'N/A'}`);
      console.log(`   🆔 User ID: ${user.id}`);
      console.log('');
    });

    // Verificar la función get_user_role
    console.log('🔧 Probando función get_user_role() con diferentes usuarios:\n');
    
    for (const user of users) {
      try {
        const { data: roleResult, error: roleError } = await supabase
          .rpc('get_user_role');
        
        if (roleError) {
          console.log(`❌ Error probando get_user_role para ${user.email}: ${roleError.message}`);
        } else {
          console.log(`✅ get_user_role() para ${user.email}: ${roleResult || 'null'}`);
        }
      } catch (err) {
        console.log(`❌ Error ejecutando función: ${err.message}`);
      }
    }

    // Mostrar roles disponibles
    console.log('\n🎭 ROLES DISPONIBLES:\n');
    
    const { data: roles, error: rolesError } = await supabase
      .from('Role')
      .select('*')
      .order('id');

    if (roles) {
      roles.forEach(role => {
        console.log(`- ${role.roleName} (ID: ${role.id}): ${role.description}`);
      });
    }

    console.log('\n✅ Verificación completada');

  } catch (error) {
    console.error('❌ Error en verificación:', error);
  }
}

verifyUserRole(); 