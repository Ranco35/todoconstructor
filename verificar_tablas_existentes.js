/**
 * Script para verificar qué tablas existen en la base de datos
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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verificarTablas() {
  console.log('🔍 Verificando tablas en la base de datos...\n');
  console.log('=====================================\n');

  // Tablas esperadas del módulo de clientes
  const tablasEsperadas = [
    'Client',
    'ClientContact',
    'ClientTag',
    'ClientTagAssignment',
    'Country',
    'EconomicSector',
    'RelationshipType'
  ];

  console.log('📋 Verificando tablas esperadas del módulo de clientes:\n');

  for (const tabla of tablasEsperadas) {
    try {
      // Intentar hacer una consulta simple a la tabla
      const { data, error } = await supabase
        .from(tabla)
        .select('*', { count: 'exact', head: true });

      if (error) {
        if (error.message.includes('does not exist') || error.code === '42P01') {
          console.log(`❌ ${tabla}: NO EXISTE`);
        } else {
          console.log(`⚠️  ${tabla}: ERROR - ${error.message}`);
        }
      } else {
        console.log(`✅ ${tabla}: EXISTE`);
      }
    } catch (err) {
      console.log(`❌ ${tabla}: ERROR - ${err.message}`);
    }
  }

  console.log('\n=====================================');
  console.log('🔍 Listando TODAS las tablas existentes:\n');

  try {
    // Usar una consulta directa para listar todas las tablas
    const { data: tables, error } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          ORDER BY table_name;
        `
      });

    if (error) {
      console.error('❌ Error listando tablas:', error.message);
      
      // Intentar método alternativo
      console.log('\n🔄 Intentando método alternativo...\n');
      
      // Lista de tablas comunes en proyectos Supabase
      const tablasComunes = [
        'User', 'users', 'auth.users',
        'Product', 'products',
        'Category', 'categories',
        'Sale', 'sales', 'Venta', 'ventas',
        'Invoice', 'invoices', 'Factura', 'facturas',
        'Supplier', 'suppliers', 'Proveedor', 'proveedores',
        'Warehouse', 'warehouses', 'Bodega', 'bodegas',
        'PosProduct', 'POSProduct',
        'Client', 'Cliente', 'clients', 'clientes'
      ];
      
      console.log('Verificando tablas comunes:\n');
      
      for (const tabla of tablasComunes) {
        try {
          const { error: testError } = await supabase
            .from(tabla)
            .select('*', { count: 'exact', head: true });
          
          if (!testError) {
            console.log(`✅ ${tabla}`);
          }
        } catch (err) {
          // Silencioso para tablas que no existen
        }
      }
    } else if (tables && Array.isArray(tables)) {
      tables.forEach((row, index) => {
        console.log(`${index + 1}. ${row.table_name}`);
      });
      console.log(`\n📊 Total de tablas: ${tables.length}`);
    }
  } catch (err) {
    console.error('❌ Error general:', err.message);
  }

  console.log('\n=====================================');
  console.log('✅ Verificación completada');
}

verificarTablas()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n❌ Error fatal:', err);
    process.exit(1);
  });

