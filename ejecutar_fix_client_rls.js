/**
 * Script para ejecutar la corrección de políticas RLS de clientes
 * Este script agrega las políticas necesarias para que usuarios autenticados
 * puedan acceder a las tablas del módulo de clientes
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      process.env[key.trim()] = value;
    }
  });
}

// Configuración de Supabase desde variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno');
  console.error('   Necesitas NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Crear cliente con service role key (necesario para modificar políticas RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function ejecutarSQL() {
  try {
    console.log('🔍 Leyendo archivo SQL...');
    const sqlContent = fs.readFileSync(
      path.join(__dirname, 'fix_client_rls_policies.sql'),
      'utf8'
    );

    console.log('📝 Contenido SQL cargado');
    console.log('=====================================');
    
    // Dividir el contenido en statements individuales
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => 
        s.length > 0 && 
        !s.startsWith('--') && 
        !s.match(/^DO\s+\$\$$/)
      );

    console.log(`📊 Total de statements a ejecutar: ${statements.length}`);
    console.log('=====================================\n');

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // Ejecutar cada statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Saltar comentarios
      if (statement.trim().startsWith('--')) continue;
      
      try {
        // Extraer nombre de tabla/operación para logging
        const match = statement.match(/(?:ON|TABLE)\s+"?(\w+)"?/i);
        const tableName = match ? match[1] : `Statement ${i + 1}`;
        
        console.log(`⏳ Ejecutando: ${tableName}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement
        });

        if (error) {
          console.error(`❌ Error en ${tableName}:`, error.message);
          errors.push({ statement: tableName, error: error.message });
          errorCount++;
        } else {
          console.log(`✅ ${tableName} - OK`);
          successCount++;
        }
      } catch (err) {
        console.error(`💥 Excepción en statement ${i + 1}:`, err.message);
        errors.push({ statement: `Statement ${i + 1}`, error: err.message });
        errorCount++;
      }
    }

    console.log('\n=====================================');
    console.log('📊 RESUMEN DE EJECUCIÓN');
    console.log('=====================================');
    console.log(`✅ Exitosos: ${successCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    
    if (errors.length > 0) {
      console.log('\n❌ ERRORES ENCONTRADOS:');
      errors.forEach(({ statement, error }) => {
        console.log(`   - ${statement}: ${error}`);
      });
    }

    // Verificar que las políticas se crearon correctamente
    console.log('\n🔍 Verificando políticas creadas...');
    
    const tables = [
      'Client',
      'ClientContact', 
      'ClientTag',
      'ClientTagAssignment',
      'Country',
      'EconomicSector',
      'RelationshipType'
    ];

    for (const table of tables) {
      const { data: policies, error } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT schemaname, tablename, policyname, permissive, roles, cmd
          FROM pg_policies 
          WHERE tablename = '${table}' AND policyname LIKE '%authenticated%';
        `
      });

      if (!error && policies) {
        console.log(`✅ ${table}: Políticas verificadas`);
      } else {
        console.log(`⚠️  ${table}: No se pudieron verificar políticas`);
      }
    }

    console.log('\n✅ Proceso completado');
    console.log('=====================================');

  } catch (error) {
    console.error('💥 Error general ejecutando SQL:', error);
    process.exit(1);
  }
}

// Ejecutar
console.log('🚀 Iniciando corrección de políticas RLS para módulo de clientes');
console.log('=====================================\n');

ejecutarSQL()
  .then(() => {
    console.log('\n✅ Script finalizado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });

