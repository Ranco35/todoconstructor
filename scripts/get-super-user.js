require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getSuperUser() {
  try {
    console.log('🔍 Buscando super usuario...\n');

    // Buscar usuario con rol SUPER_USER
    const { data: superUsers, error } = await supabase
      .from('User')
      .select('*, Role(roleName)')
      .eq('Role.roleName', 'SUPER_USER');

    if (error) {
      console.error('Error obteniendo super usuarios:', error.message);
      return;
    }

    if (!superUsers || superUsers.length === 0) {
      console.log('❌ No se encontraron super usuarios');
      return;
    }

    console.log('✅ Super usuarios encontrados:');
    superUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. Super Usuario:`);
      console.log('   ID:', user.id);
      console.log('   Nombre:', user.name);
      console.log('   Email:', user.email);
      console.log('   Username:', user.username);
      console.log('   Rol:', user.Role?.roleName);
      console.log('   Departamento:', user.department);
      console.log('   Activo:', user.isActive);
    });

    // También buscar en auth.users para verificar si están confirmados
    console.log('\n🔍 Verificando en auth.users...');
    for (const user of superUsers) {
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(user.id);
      
      if (authError) {
        console.log(`❌ Error obteniendo ${user.email} de auth:`, authError.message);
      } else if (authUser.user) {
        console.log(`✅ ${user.email} - Email confirmado: ${authUser.user.email_confirmed_at ? 'Sí' : 'No'}`);
      }
    }

  } catch (error) {
    console.error('Error general:', error.message);
  }
}

getSuperUser(); 