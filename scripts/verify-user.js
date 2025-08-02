require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyUser() {
  try {
    const userId = 'c0ef4756-1bc7-4c1a-ba33-e898f6e52712';
    
    console.log('🔍 Verificando usuario:', userId);

    // 1. Verificar en auth.users
    console.log('\n1. Verificando en auth.users:');
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    
    if (authError) {
      console.error('Error obteniendo usuario de auth:', authError.message);
    } else if (authUser.user) {
      console.log('✅ Usuario encontrado en auth.users:');
      console.log('ID:', authUser.user.id);
      console.log('Email:', authUser.user.email);
      console.log('Email confirmado:', authUser.user.email_confirmed_at);
    } else {
      console.log('❌ Usuario no encontrado en auth.users');
    }

    // 2. Verificar en tabla User
    console.log('\n2. Verificando en tabla User:');
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('*')
      .eq('id', userId);

    if (userError) {
      console.error('Error obteniendo usuario de tabla User:', userError.message);
    } else if (user && user.length > 0) {
      console.log('✅ Usuario encontrado en tabla User:');
      console.log('Total encontrados:', user.length);
      console.table(user);
    } else {
      console.log('❌ Usuario no encontrado en tabla User');
    }

    // 3. Verificar con join a Role
    console.log('\n3. Verificando con join a Role:');
    const { data: userWithRole, error: joinError } = await supabase
      .from('User')
      .select('*, Role(roleName)')
      .eq('id', userId);

    if (joinError) {
      console.error('Error en consulta con join:', joinError.message);
    } else if (userWithRole && userWithRole.length > 0) {
      console.log('✅ Usuario encontrado con join a Role:');
      console.table(userWithRole);
    } else {
      console.log('❌ Usuario no encontrado con join a Role');
    }

    // 4. Listar todos los usuarios
    console.log('\n4. Listando todos los usuarios:');
    const { data: allUsers, error: allError } = await supabase
      .from('User')
      .select('id, name, email, username');

    if (allError) {
      console.error('Error listando usuarios:', allError.message);
    } else {
      console.log('Total de usuarios en la tabla:', allUsers?.length || 0);
      if (allUsers && allUsers.length > 0) {
        console.table(allUsers);
      }
    }

  } catch (error) {
    console.error('Error general:', error.message);
  }
}

verifyUser(); 