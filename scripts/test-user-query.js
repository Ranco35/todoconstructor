require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUserQuery() {
  try {
    const userId = 'c0ef4756-1bc7-4c1a-ba33-e898f6e52712';
    
    console.log('🔍 Probando consulta de usuario con anon key...');
    console.log('Usuario ID:', userId);

    // 1. Probar consulta simple
    console.log('\n1. Consulta simple:');
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('*')
      .eq('id', userId);

    if (userError) {
      console.error('Error en consulta simple:', userError.message);
    } else {
      console.log('✅ Consulta simple exitosa:');
      console.log('Encontrados:', user?.length || 0);
      if (user && user.length > 0) {
        console.log('Usuario:', user[0].name);
      }
    }

    // 2. Probar consulta con join
    console.log('\n2. Consulta con join a Role:');
    const { data: userWithRole, error: joinError } = await supabase
      .from('User')
      .select('*, Role(roleName)')
      .eq('id', userId);

    if (joinError) {
      console.error('Error en consulta con join:', joinError.message);
    } else {
      console.log('✅ Consulta con join exitosa:');
      console.log('Encontrados:', userWithRole?.length || 0);
      if (userWithRole && userWithRole.length > 0) {
        console.log('Usuario:', userWithRole[0].name);
        console.log('Rol:', userWithRole[0].Role?.roleName);
      }
    }

    // 3. Probar consulta con single()
    console.log('\n3. Consulta con single():');
    const { data: singleUser, error: singleError } = await supabase
      .from('User')
      .select('*, Role(roleName)')
      .eq('id', userId)
      .single();

    if (singleError) {
      console.error('Error en consulta single():', singleError.message);
    } else {
      console.log('✅ Consulta single() exitosa:');
      console.log('Usuario:', singleUser.name);
      console.log('Rol:', singleUser.Role?.roleName);
    }

    // 4. Verificar políticas RLS
    console.log('\n4. Verificando políticas RLS:');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'User');

    if (policiesError) {
      console.error('Error obteniendo políticas:', policiesError.message);
    } else {
      console.log('Políticas encontradas:', policies?.length || 0);
      if (policies && policies.length > 0) {
        policies.forEach(policy => {
          console.log(`- ${policy.policyname}: ${policy.cmd} ${policy.permissive ? 'PERMISSIVE' : 'RESTRICTIVE'}`);
        });
      }
    }

  } catch (error) {
    console.error('Error general:', error.message);
  }
}

testUserQuery(); 