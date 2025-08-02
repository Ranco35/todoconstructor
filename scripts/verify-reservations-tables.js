#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase con credenciales reales
const supabaseUrl = 'https://bvzfuibqlprrfbudnauc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2emZ1aWJxbHBycmZidWRuYXVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU1MjYwMSwiZXhwIjoyMDY2MTI4NjAxfQ.4TGUtzCpdxCEwlpC3WKlHJ4I6O7ZGTCbFQBARYgv834';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyReservationsTables() {
  console.log('🔍 Verificando tablas del módulo de reservas...\n');

  const tables = [
    'companies',
    'company_contacts', 
    'rooms',
    'spa_products',
    'reservations',
    'reservation_products',
    'reservation_comments',
    'payments'
  ];

  const results = [];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        results.push({
          table,
          status: '❌ ERROR',
          message: error.message
        });
      } else {
        results.push({
          table,
          status: '✅ EXISTE',
          message: `Tabla creada correctamente (${data?.length || 0} registros)`
        });
      }
    } catch (err) {
      results.push({
        table,
        status: '❌ ERROR',
        message: err.message
      });
    }
  }

  // Mostrar resultados
  console.log('📊 Resultados de la verificación:\n');
  results.forEach(result => {
    console.log(`${result.status} ${result.table}: ${result.message}`);
  });

  // Resumen
  const successCount = results.filter(r => r.status === '✅ EXISTE').length;
  const errorCount = results.filter(r => r.status === '❌ ERROR').length;

  console.log('\n📋 Resumen:');
  console.log(`✅ Tablas existentes: ${successCount}`);
  console.log(`❌ Tablas con errores: ${errorCount}`);
  console.log(`📊 Total: ${results.length}`);

  if (successCount === results.length) {
    console.log('\n🎉 ¡Todas las tablas del módulo de reservas están creadas correctamente!');
    console.log('🚀 El módulo está listo para usar en: http://localhost:3000/dashboard/reservations');
  } else {
    console.log('\n⚠️  Algunas tablas tienen problemas. Revisa los errores arriba.');
  }

  return results;
}

// Ejecutar verificación
verifyReservationsTables()
  .then(() => {
    console.log('\n✅ Verificación completada');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error durante la verificación:', error);
    process.exit(1);
  }); 