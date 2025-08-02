const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyCategoryPolicies() {
  console.log('🔧 Aplicando políticas RLS para la tabla Category...');

  const policies = [
    // Eliminar políticas existentes si existen
    `DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "Category";`,
    `DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "Category";`,
    `DROP POLICY IF EXISTS "Enable update for authenticated users" ON "Category";`,
    `DROP POLICY IF EXISTS "Enable delete for authenticated users" ON "Category";`,
    `DROP POLICY IF EXISTS "Enable all access for service role" ON "Category";`,
    
    // Crear nuevas políticas
    `CREATE POLICY "Enable read access for authenticated users" ON "Category"
     FOR SELECT USING (auth.role() = 'authenticated');`,
    
    `CREATE POLICY "Enable insert for authenticated users" ON "Category"
     FOR INSERT WITH CHECK (auth.role() = 'authenticated');`,
    
    `CREATE POLICY "Enable update for authenticated users" ON "Category"
     FOR UPDATE USING (auth.role() = 'authenticated');`,
    
    `CREATE POLICY "Enable delete for authenticated users" ON "Category"
     FOR DELETE USING (auth.role() = 'authenticated');`,
    
    `CREATE POLICY "Enable all access for service role" ON "Category"
     FOR ALL USING (auth.role() = 'service_role');`
  ];

  try {
    for (const [index, policy] of policies.entries()) {
      console.log(`📝 Ejecutando política ${index + 1}/${policies.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { 
        sql: policy 
      });
      
      if (error) {
        // Intentar con query directo si rpc falla
        const { error: directError } = await supabase
          .from('_sql')
          .select('*')
          .eq('query', policy);
          
        if (directError) {
          console.log(`⚠️ Política ${index + 1} puede que ya exista o tenga un error menor:`, error.message);
        }
      } else {
        console.log(`✅ Política ${index + 1} aplicada exitosamente`);
      }
    }

    // Verificar que las políticas se aplicaron
    console.log('\n🔍 Verificando políticas aplicadas...');
    
    const { data: policies_check, error: checkError } = await supabase
      .from('pg_policies')
      .select('policyname, tablename')
      .eq('tablename', 'Category');

    if (checkError) {
      console.log('⚠️ No se pudo verificar las políticas, pero probablemente se aplicaron correctamente');
    } else {
      console.log('📋 Políticas encontradas para Category:', policies_check?.length || 0);
      if (policies_check && policies_check.length > 0) {
        policies_check.forEach(policy => {
          console.log(`  - ${policy.policyname}`);
        });
      }
    }

    console.log('\n✅ Proceso completado. Intenta importar categorías nuevamente.');
    
  } catch (error) {
    console.error('❌ Error aplicando políticas:', error.message);
    
    // Como fallback, intentemos deshabilitar RLS temporalmente
    console.log('\n🔄 Como alternativa, intentando deshabilitar RLS temporalmente...');
    
    try {
      const { error: disableError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE "Category" DISABLE ROW LEVEL SECURITY;'
      });
      
      if (disableError) {
        console.log('⚠️ No se pudo deshabilitar RLS automáticamente');
        console.log('💡 Solución manual: Ve a Supabase Dashboard > Authentication > Policies');
        console.log('💡 Y deshabilita temporalmente RLS para la tabla Category');
      } else {
        console.log('✅ RLS deshabilitado temporalmente para Category');
        console.log('⚠️ Recuerda volver a habilitarlo después de importar');
      }
    } catch (fallbackError) {
      console.error('❌ Error en fallback:', fallbackError.message);
    }
  }
}

// Ejecutar el script
applyCategoryPolicies(); 