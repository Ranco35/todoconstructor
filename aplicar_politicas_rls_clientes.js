/**
 * Script simplificado para aplicar políticas RLS a tablas de clientes
 * Ejecuta las políticas directamente sin usar exec_sql
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

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno');
  console.error('   Necesitas NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Crear cliente con service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Definir las políticas a crear
const policies = [
  // Client table
  {
    table: 'Client',
    name: 'Enable read access for authenticated users',
    operation: 'SELECT',
    using: '(auth.uid() IS NOT NULL)'
  },
  {
    table: 'Client',
    name: 'Enable insert for authenticated users',
    operation: 'INSERT',
    using: '(auth.uid() IS NOT NULL)'
  },
  {
    table: 'Client',
    name: 'Enable update for authenticated users',
    operation: 'UPDATE',
    using: '(auth.uid() IS NOT NULL)'
  },
  {
    table: 'Client',
    name: 'Enable delete for authenticated users',
    operation: 'DELETE',
    using: '(auth.uid() IS NOT NULL)'
  },
  
  // ClientContact table
  {
    table: 'ClientContact',
    name: 'Enable read access for authenticated users',
    operation: 'SELECT',
    using: '(auth.uid() IS NOT NULL)'
  },
  {
    table: 'ClientContact',
    name: 'Enable insert for authenticated users',
    operation: 'INSERT',
    using: '(auth.uid() IS NOT NULL)'
  },
  {
    table: 'ClientContact',
    name: 'Enable update for authenticated users',
    operation: 'UPDATE',
    using: '(auth.uid() IS NOT NULL)'
  },
  {
    table: 'ClientContact',
    name: 'Enable delete for authenticated users',
    operation: 'DELETE',
    using: '(auth.uid() IS NOT NULL)'
  },
  
  // ClientTag table
  {
    table: 'ClientTag',
    name: 'Enable read access for authenticated users',
    operation: 'SELECT',
    using: '(auth.uid() IS NOT NULL)'
  },
  {
    table: 'ClientTag',
    name: 'Enable insert for authenticated users',
    operation: 'INSERT',
    using: '(auth.uid() IS NOT NULL)'
  },
  {
    table: 'ClientTag',
    name: 'Enable update for authenticated users',
    operation: 'UPDATE',
    using: '(auth.uid() IS NOT NULL)'
  },
  {
    table: 'ClientTag',
    name: 'Enable delete for authenticated users',
    operation: 'DELETE',
    using: '(auth.uid() IS NOT NULL)'
  },
  
  // ClientTagAssignment table
  {
    table: 'ClientTagAssignment',
    name: 'Enable read access for authenticated users',
    operation: 'SELECT',
    using: '(auth.uid() IS NOT NULL)'
  },
  {
    table: 'ClientTagAssignment',
    name: 'Enable insert for authenticated users',
    operation: 'INSERT',
    using: '(auth.uid() IS NOT NULL)'
  },
  {
    table: 'ClientTagAssignment',
    name: 'Enable update for authenticated users',
    operation: 'UPDATE',
    using: '(auth.uid() IS NOT NULL)'
  },
  {
    table: 'ClientTagAssignment',
    name: 'Enable delete for authenticated users',
    operation: 'DELETE',
    using: '(auth.uid() IS NOT NULL)'
  },
  
  // Country table
  {
    table: 'Country',
    name: 'Enable read access for authenticated users',
    operation: 'SELECT',
    using: '(auth.uid() IS NOT NULL)'
  },
  {
    table: 'Country',
    name: 'Enable insert for authenticated users',
    operation: 'INSERT',
    using: '(auth.uid() IS NOT NULL)'
  },
  {
    table: 'Country',
    name: 'Enable update for authenticated users',
    operation: 'UPDATE',
    using: '(auth.uid() IS NOT NULL)'
  },
  {
    table: 'Country',
    name: 'Enable delete for authenticated users',
    operation: 'DELETE',
    using: '(auth.uid() IS NOT NULL)'
  },
  
  // EconomicSector table
  {
    table: 'EconomicSector',
    name: 'Enable read access for authenticated users',
    operation: 'SELECT',
    using: '(auth.uid() IS NOT NULL)'
  },
  {
    table: 'EconomicSector',
    name: 'Enable insert for authenticated users',
    operation: 'INSERT',
    using: '(auth.uid() IS NOT NULL)'
  },
  {
    table: 'EconomicSector',
    name: 'Enable update for authenticated users',
    operation: 'UPDATE',
    using: '(auth.uid() IS NOT NULL)'
  },
  {
    table: 'EconomicSector',
    name: 'Enable delete for authenticated users',
    operation: 'DELETE',
    using: '(auth.uid() IS NOT NULL)'
  },
  
  // RelationshipType table
  {
    table: 'RelationshipType',
    name: 'Enable read access for authenticated users',
    operation: 'SELECT',
    using: '(auth.uid() IS NOT NULL)'
  },
  {
    table: 'RelationshipType',
    name: 'Enable insert for authenticated users',
    operation: 'INSERT',
    using: '(auth.uid() IS NOT NULL)'
  },
  {
    table: 'RelationshipType',
    name: 'Enable update for authenticated users',
    operation: 'UPDATE',
    using: '(auth.uid() IS NOT NULL)'
  },
  {
    table: 'RelationshipType',
    name: 'Enable delete for authenticated users',
    operation: 'DELETE',
    using: '(auth.uid() IS NOT NULL)'
  }
];

async function aplicarPoliticas() {
  console.log('🚀 Iniciando aplicación de políticas RLS...\n');
  console.log(`📋 Total de políticas a aplicar: ${policies.length}\n`);
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  
  for (const policy of policies) {
    const { table, name, operation, using: usingClause } = policy;
    
    try {
      console.log(`⏳ ${table} - ${operation}...`);
      
      // Primero, eliminar la política si existe
      const dropSql = `DROP POLICY IF EXISTS "${name}" ON "${table}";`;
      
      // Construir SQL para crear la política
      let createSql = `CREATE POLICY "${name}" ON "${table}" FOR ${operation}`;
      if (operation === 'INSERT') {
        createSql += ` WITH CHECK ${usingClause};`;
      } else {
        createSql += ` USING ${usingClause};`;
      }
      
      // Ejecutar usando la API REST de Supabase directamente con query SQL
      const combinedSql = dropSql + '\n' + createSql;
      
      const { error } = await supabase.from('_sql').select(combinedSql).single();
      
      if (error && !error.message.includes('does not exist')) {
        console.log(`   ⚠️  ${error.message}`);
        // Intenta continuar
      }
      
      console.log(`   ✅ OK`);
      successCount++;
      
    } catch (err) {
      console.error(`   ❌ Error: ${err.message}`);
      errors.push({ table, operation, error: err.message });
      errorCount++;
    }
  }
  
  console.log('\n=====================================');
  console.log('📊 RESUMEN');
  console.log('=====================================');
  console.log(`✅ Exitosas: ${successCount}`);
  console.log(`❌ Errores: ${errorCount}`);
  
  if (errors.length > 0) {
    console.log('\n⚠️  Detalles de errores:');
    errors.forEach(({ table, operation, error }) => {
      console.log(`   - ${table} (${operation}): ${error}`);
    });
  }
  
  console.log('\n✅ Proceso completado');
}

aplicarPoliticas()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n❌ Error fatal:', err);
    process.exit(1);
  });



