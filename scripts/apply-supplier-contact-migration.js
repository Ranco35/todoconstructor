const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', !!supabaseKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('🔧 Aplicando migración para crear tabla SupplierContact...');

    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250628000010_create_supplier_contact_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Ejecutar la migración
    const { error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      // Si no existe la función exec_sql, intentar ejecutar directamente
      console.log('⚠️ Función exec_sql no disponible, ejecutando SQL directamente...');
      
      // Dividir el SQL en statements individuales
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        if (statement.includes('CREATE TABLE')) {
          console.log(`📝 Ejecutando: ${statement.substring(0, 50)}...`);
          
          const { error: createError } = await supabase
            .from('SupplierContact')
            .select('count')
            .limit(1);

          if (createError && createError.code === '42P01') {
            console.log('✅ Tabla SupplierContact no existe, necesita ser creada');
            console.log('⚠️ No se puede crear la tabla directamente desde el cliente');
            console.log('💡 Solución: Crear la tabla manualmente desde el dashboard de Supabase');
            console.log('📋 SQL para ejecutar:');
            console.log(migrationSQL);
            return;
          } else if (!createError) {
            console.log('✅ Tabla SupplierContact ya existe');
            return;
          }
        }
      }
    } else {
      console.log('✅ Migración aplicada exitosamente');
    }

    // Verificar que la tabla se creó correctamente
    const { data, error: testError } = await supabase
      .from('SupplierContact')
      .select('count')
      .limit(1);

    if (testError) {
      console.log('❌ Error verificando tabla:', testError.message);
      console.log('💡 La tabla no se pudo crear automáticamente');
      console.log('📋 Ejecuta este SQL manualmente en tu dashboard de Supabase:');
      console.log('\n' + migrationSQL);
    } else {
      console.log('✅ Tabla SupplierContact verificada exitosamente');
    }

  } catch (error) {
    console.error('❌ Error aplicando migración:', error);
    console.log('\n📋 SQL para ejecutar manualmente:');
    console.log(migrationPath);
  }
}

// Ejecutar el script
applyMigration(); 