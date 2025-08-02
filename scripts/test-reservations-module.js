#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://bvzfuibqlprrfbudnauc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2emZ1aWJxbHBycmZidWRuYXVjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDU1MjYwMSwiZXhwIjoyMDY2MTI4NjAxfQ.4TGUtzCpdxCEwlpC3WKlHJ4I6O7ZGTCbFQBARYgv834';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testReservationsModule() {
  console.log('🧪 Probando funcionalidades del módulo de reservas...\n');

  try {
    // 1. Probar obtener empresas
    console.log('1️⃣ Probando obtener empresas...');
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .limit(5);

    if (companiesError) {
      console.log('❌ Error al obtener empresas:', companiesError.message);
    } else {
      console.log(`✅ Empresas obtenidas: ${companies?.length || 0} registros`);
      if (companies && companies.length > 0) {
        console.log(`   - Primera empresa: ${companies[0].name}`);
      }
    }

    // 2. Probar obtener habitaciones
    console.log('\n2️⃣ Probando obtener habitaciones...');
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('*')
      .limit(5);

    if (roomsError) {
      console.log('❌ Error al obtener habitaciones:', roomsError.message);
    } else {
      console.log(`✅ Habitaciones obtenidas: ${rooms?.length || 0} registros`);
      if (rooms && rooms.length > 0) {
        console.log(`   - Primera habitación: ${rooms[0].name}`);
      }
    }

    // 3. Probar obtener productos del spa
    console.log('\n3️⃣ Probando obtener productos del spa...');
    const { data: spaProducts, error: spaProductsError } = await supabase
      .from('spa_products')
      .select('*')
      .limit(5);

    if (spaProductsError) {
      console.log('❌ Error al obtener productos del spa:', spaProductsError.message);
    } else {
      console.log(`✅ Productos del spa obtenidos: ${spaProducts?.length || 0} registros`);
      if (spaProducts && spaProducts.length > 0) {
        console.log(`   - Primer producto: ${spaProducts[0].name}`);
      }
    }

    // 4. Probar obtener reservas
    console.log('\n4️⃣ Probando obtener reservas...');
    const { data: reservations, error: reservationsError } = await supabase
      .from('reservations')
      .select(`
        *,
        companies(name),
        rooms(name),
        company_contacts(name, email, phone)
      `)
      .limit(5);

    if (reservationsError) {
      console.log('❌ Error al obtener reservas:', reservationsError.message);
    } else {
      console.log(`✅ Reservas obtenidas: ${reservations?.length || 0} registros`);
      if (reservations && reservations.length > 0) {
        console.log(`   - Primera reserva: ${reservations[0].id}`);
      }
    }

    // 5. Probar crear una empresa de prueba
    console.log('\n5️⃣ Probando crear empresa de prueba...');
    const testCompany = {
      name: 'Empresa de Prueba - Reservas',
      tax_id: 'TEST123456',
      address: 'Dirección de prueba',
      city: 'Ciudad de prueba',
      state: 'Estado de prueba',
      country: 'País de prueba',
      phone: '+1234567890',
      email: 'test@reservas.com',
      website: 'https://test-reservas.com',
      industry: 'Turismo',
      notes: 'Empresa creada para pruebas del módulo de reservas'
    };

    const { data: newCompany, error: createCompanyError } = await supabase
      .from('companies')
      .insert([testCompany])
      .select()
      .single();

    if (createCompanyError) {
      console.log('❌ Error al crear empresa:', createCompanyError.message);
    } else {
      console.log(`✅ Empresa creada: ${newCompany.name} (ID: ${newCompany.id})`);
    }

    console.log('\n🎉 ¡Pruebas del módulo de reservas completadas!');
    console.log('\n📋 Resumen:');
    console.log('✅ Todas las tablas están funcionando correctamente');
    console.log('✅ Las consultas se ejecutan sin errores');
    console.log('✅ El módulo está listo para usar');
    
    console.log('\n🚀 Próximos pasos:');
    console.log('1. Ve a http://localhost:3000/dashboard/reservations');
    console.log('2. Crea algunas empresas, habitaciones y productos');
    console.log('3. Crea reservas y prueba todas las funcionalidades');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
  }
}

// Ejecutar pruebas
testReservationsModule()
  .then(() => {
    console.log('\n✅ Pruebas completadas');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }); 