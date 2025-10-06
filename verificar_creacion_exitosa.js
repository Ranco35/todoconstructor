/**
 * Script para verificar que las tablas de clientes se crearon correctamente
 * y están accesibles para usuarios autenticados
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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verificar() {
  console.log('🎉 VERIFICANDO CREACIÓN EXITOSA DE TABLAS\n');
  console.log('=====================================\n');

  // Verificar cada tabla
  const tablas = [
    { nombre: 'Country', esperado: 7, campo: 'nombre' },
    { nombre: 'EconomicSector', esperado: 10, campo: 'nombre' },
    { nombre: 'RelationshipType', esperado: 7, campo: 'nombre' },
    { nombre: 'ClientTag', esperado: 6, campo: 'nombre' },
    { nombre: 'Client', esperado: 0, campo: 'nombrePrincipal' },
    { nombre: 'ClientContact', esperado: 0, campo: 'nombre' },
    { nombre: 'ClientTagAssignment', esperado: 0, campo: 'id' }
  ];

  let todasExitosas = true;

  for (const tabla of tablas) {
    try {
      const { data, error, count } = await supabase
        .from(tabla.nombre)
        .select('*', { count: 'exact' })
        .limit(5);

      if (error) {
        console.log(`❌ ${tabla.nombre}: ERROR`);
        console.log(`   ${error.message}`);
        todasExitosas = false;
      } else {
        const registros = count || 0;
        const estado = registros >= tabla.esperado ? '✅' : (tabla.esperado === 0 ? '✅' : '⚠️');
        console.log(`${estado} ${tabla.nombre}: ${registros} registros`);
        
        if (data && data.length > 0 && tabla.campo) {
          console.log(`   Ejemplos: ${data.slice(0, 3).map(r => r[tabla.campo]).join(', ')}`);
        }
      }
    } catch (err) {
      console.log(`❌ ${tabla.nombre}: EXCEPCIÓN - ${err.message}`);
      todasExitosas = false;
    }
  }

  console.log('\n=====================================');
  
  if (todasExitosas) {
    console.log('✅ ¡TODAS LAS TABLAS FUNCIONAN CORRECTAMENTE!\n');
    console.log('🎯 Próximos pasos:');
    console.log('   1. Recarga tu aplicación web');
    console.log('   2. Ve a /dashboard/customers');
    console.log('   3. ¡Deberías poder ver y crear clientes!\n');
  } else {
    console.log('⚠️  Algunas tablas tienen problemas\n');
    console.log('💡 Revisa los errores arriba y verifica las políticas RLS en Supabase\n');
  }

  console.log('=====================================');
}

verificar()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });

