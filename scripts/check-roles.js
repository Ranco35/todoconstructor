require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL or Service Role Key is missing.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRoles() {
  console.log('Verificando roles en la base de datos...');
  try {
    const { data: roles, error } = await supabase
      .from('Role')
      .select('*');

    if (error) {
      throw error;
    }

    if (roles && roles.length > 0) {
      console.log('✅ Roles encontrados en la base de datos:');
      console.table(roles);
    } else {
      console.warn('⚠️ No se encontraron roles en la tabla "Role". La tabla está vacía.');
    }
    console.log('---');

  } catch (error) {
    console.error('❌ Error al verificar roles:', error.message);
    process.exit(1);
  }
}

checkRoles(); 