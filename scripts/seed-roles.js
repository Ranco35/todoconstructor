require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL or Service Role Key is missing.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const rolesToSeed = [
  { roleName: 'SUPER_USER', description: 'Acceso completo a todas las funcionalidades del sistema.' },
  { roleName: 'ADMINISTRADOR', description: 'Gestión general del sistema, usuarios y configuraciones.' },
  { roleName: 'JEFE_SECCION', description: 'Gestión de un departamento o sección específica.' },
  { roleName: 'USUARIO_FINAL', description: 'Acceso a funcionalidades operativas básicas.' }
];

async function seedRoles() {
  console.log('Iniciando el sembrado de roles...');
  try {
    const { data, error } = await supabase
      .from('Role')
      .upsert(rolesToSeed, { onConflict: 'roleName' });

    if (error) {
      throw error;
    }

    console.log('✅ Roles sembrados o actualizados exitosamente:');
    console.log(rolesToSeed.map(r => `- ${r.roleName}`).join('\\n'));
    console.log('---');

  } catch (error) {
    console.error('❌ Error al sembrar roles:', error.message);
    process.exit(1);
  }
}

seedRoles(); 