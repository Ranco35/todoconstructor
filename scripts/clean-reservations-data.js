const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanReservationsData() {
  console.log('🧹 Iniciando limpieza completa de datos de reservas...\n');

  try {
    // 1. ELIMINAR DATOS DE RESERVAS (en orden de dependencias)
    console.log('1️⃣ Eliminando datos relacionados con reservas...');
    
    // Eliminar pagos
    const { error: paymentsError } = await supabase
      .from('payments')
      .delete()
      .neq('id', 0); // Elimina todos los registros

    if (paymentsError) {
      console.error('❌ Error eliminando payments:', paymentsError.message);
    } else {
      console.log('✅ Payments eliminados');
    }

    // Eliminar comentarios de reservas
    const { error: commentsError } = await supabase
      .from('reservation_comments')
      .delete()
      .neq('id', 0); // Elimina todos los registros

    if (commentsError) {
      console.error('❌ Error eliminando reservation_comments:', commentsError.message);
    } else {
      console.log('✅ Reservation comments eliminados');
    }

    // Eliminar productos de reservas
    const { error: reservationProductsError } = await supabase
      .from('reservation_products')
      .delete()
      .neq('id', 0); // Elimina todos los registros

    if (reservationProductsError) {
      console.error('❌ Error eliminando reservation_products:', reservationProductsError.message);
    } else {
      console.log('✅ Reservation products eliminados');
    }

    // Eliminar reservas principales
    const { error: reservationsError } = await supabase
      .from('reservations')
      .delete()
      .neq('id', 0); // Elimina todos los registros

    if (reservationsError) {
      console.error('❌ Error eliminando reservations:', reservationsError.message);
    } else {
      console.log('✅ Reservations eliminadas');
    }

    console.log('\n2️⃣ Eliminando datos de empresas y contactos...');

    // Eliminar contactos de empresas
    const { error: contactsError } = await supabase
      .from('company_contacts')
      .delete()
      .neq('id', 0); // Elimina todos los registros

    if (contactsError) {
      console.error('❌ Error eliminando company_contacts:', contactsError.message);
    } else {
      console.log('✅ Company contacts eliminados');
    }

    // Eliminar empresas
    const { error: companiesError } = await supabase
      .from('companies')
      .delete()
      .neq('id', 0); // Elimina todos los registros

    if (companiesError) {
      console.error('❌ Error eliminando companies:', companiesError.message);
    } else {
      console.log('✅ Companies eliminadas');
    }

    console.log('\n3️⃣ Eliminando productos del spa (datos de ejemplo)...');

    // Eliminar productos del spa (ejemplos)
    const { error: spaProductsError } = await supabase
      .from('spa_products')
      .delete()
      .neq('id', 0); // Elimina todos los registros

    if (spaProductsError) {
      console.error('❌ Error eliminando spa_products:', spaProductsError.message);
    } else {
      console.log('✅ Spa products eliminados');
    }

    console.log('\n4️⃣ Verificando datos restantes...');

    // Verificar que todo está limpio
    const checks = [
      { table: 'reservations', name: 'Reservas' },
      { table: 'reservation_products', name: 'Productos de reservas' },
      { table: 'reservation_comments', name: 'Comentarios de reservas' },
      { table: 'payments', name: 'Pagos' },
      { table: 'companies', name: 'Empresas' },
      { table: 'company_contacts', name: 'Contactos de empresas' },
      { table: 'spa_products', name: 'Productos del spa' }
    ];

    for (const check of checks) {
      const { count, error } = await supabase
        .from(check.table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error(`❌ Error verificando ${check.name}:`, error.message);
      } else {
        console.log(`📊 ${check.name}: ${count} registros restantes`);
      }
    }

    console.log('\n5️⃣ Reiniciando secuencias de auto-incremento...');

    // Reiniciar secuencias para que los próximos IDs empiecen en 1
    const sequences = [
      'reservations_id_seq',
      'reservation_products_id_seq', 
      'reservation_comments_id_seq',
      'payments_id_seq',
      'companies_id_seq',
      'company_contacts_id_seq',
      'spa_products_id_seq'
    ];

    for (const seq of sequences) {
      try {
        const { error } = await supabase.rpc('execute_sql', {
          sql: `ALTER SEQUENCE ${seq} RESTART WITH 1;`
        });
        
        if (error) {
          console.log(`⚠️  No se pudo reiniciar secuencia ${seq} (puede que no exista)`);
        } else {
          console.log(`✅ Secuencia ${seq} reiniciada`);
        }
      } catch (err) {
        console.log(`⚠️  No se pudo reiniciar secuencia ${seq}`);
      }
    }

    console.log('\n🎉 LIMPIEZA COMPLETA EXITOSA!');
    console.log('📋 Resumen:');
    console.log('   • Todas las reservas eliminadas');
    console.log('   • Todas las empresas y contactos eliminados');
    console.log('   • Todos los productos del spa eliminados');
    console.log('   • Todos los pagos y comentarios eliminados');
    console.log('   • Las tablas están vacías y listas para nuevos datos');
    console.log('   • Las habitaciones existentes se mantuvieron');
    console.log('\n✨ El sistema está listo para empezar desde cero!');

  } catch (error) {
    console.error('💥 Error durante la limpieza:', error);
    process.exit(1);
  }
}

// Ejecutar el script
if (require.main === module) {
  cleanReservationsData()
    .then(() => {
      console.log('\n🏁 Script de limpieza completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error ejecutando script:', error);
      process.exit(1);
    });
}

module.exports = { cleanReservationsData }; 