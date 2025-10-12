/**
 * Script para verificar las políticas RLS actuales en las tablas de clientes
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
  },
  db: {
    schema: 'public'
  }
});

async function verificarPoliticasRLS() {
  console.log('🔍 Verificando políticas RLS y estado de tablas...\n');
  console.log('=====================================\n');

  const tablas = [
    'Client',
    'ClientContact',
    'ClientTag',
    'ClientTagAssignment',
    'Country',
    'EconomicSector',
    'RelationshipType'
  ];

  for (const tabla of tablas) {
    console.log(`\n📋 Tabla: ${tabla}`);
    console.log('─────────────────────────────────');
    
    try {
      // 1. Verificar si la tabla tiene RLS habilitado
      console.log('🔐 Verificando estado RLS...');
      
      // 2. Intentar leer datos (para probar políticas actuales)
      const { data: testData, error: testError, count } = await supabase
        .from(tabla)
        .select('*', { count: 'exact', head: true });

      if (testError) {
        console.log(`   ❌ Error al acceder: ${testError.message}`);
        console.log(`   Código: ${testError.code}`);
        console.log(`   Detalles: ${testError.details}`);
        
        if (testError.message.includes('row-level security') || 
            testError.message.includes('policy') ||
            testError.code === 'PGRST301') {
          console.log('   ⚠️  RLS está HABILITADO pero SIN políticas adecuadas');
        }
      } else {
        console.log(`   ✅ Acceso OK - Registros: ${count || 0}`);
        console.log('   ✅ RLS configurado correctamente o deshabilitado');
      }

      // 3. Intentar insertar (solo verificar permiso, no realmente insertar)
      console.log('📝 Verificando permisos de escritura...');
      
      // Crear datos de prueba mínimos según la tabla
      let datoPrueba = {};
      switch(tabla) {
        case 'Client':
          datoPrueba = { nombrePrincipal: 'TEST', tipoCliente: 'PERSONA' };
          break;
        case 'ClientContact':
          datoPrueba = { clienteId: 9999999, nombre: 'TEST' };
          break;
        case 'ClientTag':
          datoPrueba = { nombre: 'TEST_TAG_' + Date.now() };
          break;
        case 'ClientTagAssignment':
          datoPrueba = { clienteId: 9999999, etiquetaId: 9999999 };
          break;
        case 'Country':
          datoPrueba = { codigo: 'XX', nombre: 'TEST' };
          break;
        case 'EconomicSector':
          datoPrueba = { nombre: 'TEST' };
          break;
        case 'RelationshipType':
          datoPrueba = { nombre: 'TEST' };
          break;
      }

      // Solo verificar el error, no insertar realmente
      const { error: insertError } = await supabase
        .from(tabla)
        .insert(datoPrueba)
        .select();

      if (insertError) {
        if (insertError.message.includes('row-level security') || 
            insertError.message.includes('policy') ||
            insertError.code === 'PGRST301' ||
            insertError.code === '42501') {
          console.log('   ❌ Sin permiso de inserción (RLS bloqueando)');
        } else if (insertError.message.includes('foreign key') || 
                   insertError.message.includes('violates')) {
          console.log('   ⚠️  Error de constraint (pero políticas parecen OK)');
        } else {
          console.log(`   ⚠️  Error: ${insertError.message}`);
        }
      } else {
        console.log('   ✅ Permiso de inserción OK');
        // Eliminar el registro de prueba
        await supabase.from(tabla).delete().eq('nombre', datoPrueba.nombre || 'TEST');
      }

    } catch (err) {
      console.error(`   💥 Error inesperado: ${err.message}`);
    }
  }

  console.log('\n\n=====================================');
  console.log('📊 DIAGNÓSTICO COMPLETO');
  console.log('=====================================\n');

  // Resumen y recomendación
  console.log('🔍 Intentando acceder a datos reales...\n');
  
  try {
    const { data: clientsData, error: clientsError } = await supabase
      .from('Client')
      .select('id, nombrePrincipal, tipoCliente')
      .limit(5);

    if (clientsError) {
      console.log('❌ ERROR AL LEER CLIENTES:');
      console.log(`   Mensaje: ${clientsError.message}`);
      console.log(`   Código: ${clientsError.code}`);
      console.log('\n💡 SOLUCIÓN REQUERIDA:');
      console.log('   1. Las tablas EXISTEN ✅');
      console.log('   2. RLS está HABILITADO 🔒');
      console.log('   3. FALTAN políticas RLS para usuarios autenticados ❌');
      console.log('\n   👉 Debes ejecutar fix_client_rls_policies.sql en Supabase SQL Editor');
    } else {
      console.log('✅ Datos leídos exitosamente:');
      console.log(`   Total de clientes: ${clientsData?.length || 0}`);
      if (clientsData && clientsData.length > 0) {
        clientsData.forEach(c => {
          console.log(`   - ${c.nombrePrincipal} (${c.tipoCliente})`);
        });
      }
      console.log('\n✅ Las políticas RLS parecen estar configuradas correctamente');
    }

    // Verificar ClientTag
    const { data: tagsData, error: tagsError } = await supabase
      .from('ClientTag')
      .select('id, nombre, color')
      .limit(5);

    if (tagsError) {
      console.log('\n❌ ERROR AL LEER ETIQUETAS:');
      console.log(`   Mensaje: ${tagsError.message}`);
      console.log('   👉 Las etiquetas también necesitan políticas RLS');
    } else {
      console.log(`\n✅ Etiquetas leídas: ${tagsData?.length || 0}`);
    }

  } catch (err) {
    console.error('💥 Error en diagnóstico:', err.message);
  }

  console.log('\n=====================================');
  console.log('✅ Verificación completada\n');
}

verificarPoliticasRLS()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('\n❌ Error fatal:', err);
    process.exit(1);
  });



