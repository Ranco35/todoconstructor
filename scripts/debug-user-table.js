require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');
  console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Not set');
  console.log('Supabase Key:', supabaseKey ? 'Set' : 'Not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugUserTable() {
  try {
    console.log('🔍 Diagnóstico de la tabla User...\n');

    // 1. Verificar estructura de la tabla
    console.log('1. Estructura de la tabla User:');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'User')
      .eq('table_schema', 'public');

    if (columnsError) {
      console.error('Error obteniendo estructura:', columnsError.message);
    } else {
      console.table(columns);
    }

    // 2. Contar usuarios
    console.log('\n2. Conteo de usuarios:');
    const { count, error: countError } = await supabase
      .from('User')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error contando usuarios:', countError.message);
    } else {
      console.log(`Total de usuarios: ${count}`);
    }

    // 3. Listar algunos usuarios
    console.log('\n3. Primeros 5 usuarios:');
    const { data: users, error: usersError } = await supabase
      .from('User')
      .select('id, name, email, username, roleId')
      .limit(5);

    if (usersError) {
      console.error('Error obteniendo usuarios:', usersError.message);
    } else {
      console.table(users);
    }

    // 4. Verificar tabla Role
    console.log('\n4. Estructura de la tabla Role:');
    const { data: roles, error: rolesError } = await supabase
      .from('Role')
      .select('*');

    if (rolesError) {
      console.error('Error obteniendo roles:', rolesError.message);
    } else {
      console.table(roles);
    }

    // 5. Probar consulta con join
    console.log('\n5. Probando consulta con join Role:');
    const { data: userWithRole, error: joinError } = await supabase
      .from('User')
      .select('*, Role(roleName)')
      .limit(1);

    if (joinError) {
      console.error('Error en consulta con join:', joinError.message);
    } else {
      console.log('Consulta con join exitosa:');
      console.table(userWithRole);
    }

  } catch (error) {
    console.error('Error general:', error.message);
  }
}

debugUserTable(); 