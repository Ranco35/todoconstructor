const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

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

async function disableCategoryRLS() {
  console.log('🔧 Deshabilitando RLS temporalmente para la tabla Category...');
  
  try {
    // Intentar deshabilitar RLS usando una consulta SQL directa
    const { data, error } = await supabase
      .from('Category')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.log('❌ Error accediendo a Category:', error.message);
      console.log('\n💡 SOLUCIÓN MANUAL:');
      console.log('1. Ve a tu dashboard de Supabase: https://supabase.com/dashboard');
      console.log('2. Selecciona tu proyecto');
      console.log('3. Ve a Authentication > Policies');
      console.log('4. Busca la tabla "Category"');
      console.log('5. Deshabilita temporalmente "Enable RLS" para esa tabla');
      console.log('6. Después de importar las categorías, vuelve a habilitarlo');
      console.log('\nO ejecuta este SQL en el SQL Editor:');
      console.log('ALTER TABLE "Category" DISABLE ROW LEVEL SECURITY;');
    } else {
      console.log('✅ Acceso a Category funcional. El problema puede estar en las políticas.');
      console.log('\n💡 SOLUCIÓN RECOMENDADA:');
      console.log('1. Ve a Supabase Dashboard > SQL Editor');
      console.log('2. Ejecuta este comando:');
      console.log('   ALTER TABLE "Category" DISABLE ROW LEVEL SECURITY;');
      console.log('3. Importa las categorías');
      console.log('4. Después ejecuta:');
      console.log('   ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

disableCategoryRLS(); 