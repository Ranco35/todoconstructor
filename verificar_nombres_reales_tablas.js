/**
 * Script para verificar los nombres REALES de las tablas en la base de datos
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

async function verificarNombresReales() {
  console.log('🔍 Verificando nombres REALES de tablas en PostgreSQL...\n');
  console.log('=====================================\n');

  // Intentar diferentes variaciones de nombres
  const variacionesNombres = [
    // Variaciones de Client
    { supabase: 'Client', postgres: ['Client', 'client', 'Cliente', 'cliente', 'clients', 'Clients'] },
    { supabase: 'ClientContact', postgres: ['ClientContact', 'clientcontact', 'client_contact', 'ClienteContacto', 'cliente_contacto'] },
    { supabase: 'ClientTag', postgres: ['ClientTag', 'clienttag', 'client_tag', 'ClienteEtiqueta', 'cliente_etiqueta'] },
    { supabase: 'ClientTagAssignment', postgres: ['ClientTagAssignment', 'clienttagassignment', 'client_tag_assignment'] },
    { supabase: 'Country', postgres: ['Country', 'country', 'countries', 'Pais', 'pais'] },
    { supabase: 'EconomicSector', postgres: ['EconomicSector', 'economicsector', 'economic_sector', 'SectorEconomico', 'sector_economico'] },
    { supabase: 'RelationshipType', postgres: ['RelationshipType', 'relationshiptype', 'relationship_type', 'TipoRelacion', 'tipo_relacion'] }
  ];

  console.log('📋 Intentando encontrar nombres exactos de tablas:\n');

  for (const tabla of variacionesNombres) {
    console.log(`\n🔎 Buscando tabla: ${tabla.supabase}`);
    
    let encontrada = false;
    let nombreReal = null;

    for (const nombrePg of tabla.postgres) {
      try {
        // Intentar acceder con cada variación
        const { data, error } = await supabase
          .from(nombrePg)
          .select('*', { count: 'exact', head: true })
          .limit(1);

        if (!error) {
          console.log(`   ✅ ENCONTRADA como: "${nombrePg}"`);
          nombreReal = nombrePg;
          encontrada = true;
          break;
        }
      } catch (err) {
        // Continuar probando
      }
    }

    if (!encontrada) {
      console.log(`   ❌ NO encontrada con ninguna variación`);
    }
  }

  console.log('\n\n=====================================');
  console.log('🔍 Listando TODAS las tablas del esquema public:\n');

  // Intentar obtener lista de tablas usando una función personalizada o método alternativo
  try {
    // Probar con diferentes métodos
    const metodosConsulta = [
      // Método 1: Función RPC si existe
      async () => {
        const { data, error } = await supabase.rpc('get_tables');
        return { data, error, metodo: 'RPC get_tables' };
      },
      
      // Método 2: Consulta a pg_tables usando from
      async () => {
        const { data, error } = await supabase
          .from('pg_tables')
          .select('tablename')
          .eq('schemaname', 'public');
        return { data, error, metodo: 'pg_tables' };
      },
      
      // Método 3: information_schema.tables
      async () => {
        const { data, error } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .eq('table_type', 'BASE TABLE');
        return { data, error, metodo: 'information_schema' };
      }
    ];

    let tablas = null;
    let metodoExitoso = null;

    for (const metodo of metodosConsulta) {
      try {
        const resultado = await metodo();
        if (!resultado.error && resultado.data) {
          tablas = resultado.data;
          metodoExitoso = resultado.metodo;
          break;
        }
      } catch (err) {
        // Continuar con el siguiente método
      }
    }

    if (tablas) {
      console.log(`✅ Tablas obtenidas usando: ${metodoExitoso}\n`);
      
      const nombresTablas = tablas.map(t => t.tablename || t.table_name).filter(Boolean);
      
      // Filtrar tablas relacionadas con clientes
      const tablasClientes = nombresTablas.filter(t => 
        t.toLowerCase().includes('client') ||
        t.toLowerCase().includes('cliente') ||
        t.toLowerCase().includes('country') ||
        t.toLowerCase().includes('pais') ||
        t.toLowerCase().includes('economic') ||
        t.toLowerCase().includes('sector') ||
        t.toLowerCase().includes('relationship') ||
        t.toLowerCase().includes('relacion') ||
        t.toLowerCase().includes('tag') ||
        t.toLowerCase().includes('etiqueta')
      );

      if (tablasClientes.length > 0) {
        console.log('📊 Tablas relacionadas con clientes encontradas:\n');
        tablasClientes.forEach((tabla, idx) => {
          console.log(`   ${idx + 1}. "${tabla}"`);
        });
      } else {
        console.log('⚠️  No se encontraron tablas relacionadas con clientes');
        console.log('\n📊 Mostrando todas las tablas (primeras 50):\n');
        nombresTablas.slice(0, 50).forEach((tabla, idx) => {
          console.log(`   ${idx + 1}. "${tabla}"`);
        });
      }
      
      console.log(`\n📊 Total de tablas en public: ${nombresTablas.length}`);
    } else {
      console.log('❌ No se pudo obtener la lista de tablas con ningún método');
      console.log('\n🔧 Sugerencia: Verifica manualmente en Supabase Dashboard -> Table Editor');
    }

  } catch (err) {
    console.error('❌ Error obteniendo lista de tablas:', err.message);
  }

  console.log('\n=====================================');
  console.log('✅ Verificación completada');
  console.log('\n💡 IMPORTANTE: Copia los nombres exactos encontrados para actualizar las políticas RLS');
}

verificarNombresReales()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n❌ Error fatal:', err);
    process.exit(1);
  });




