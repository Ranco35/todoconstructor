const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testClientReservationIntegration() {
  console.log('🧪 Probando integración Cliente-Reserva...');
  console.log('');

  // Verificar variables de entorno
  console.log('🔧 Verificando configuración...');
  console.log('   SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurada' : '❌ Faltante');
  console.log('   SERVICE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurada' : '❌ Faltante');
  console.log('');

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('❌ Error: Variables de entorno faltantes');
    return;
  }

  // Test 1: Verificar que la tabla reservations tiene client_id
  console.log('1️⃣ Verificando estructura de tabla reservations...');
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error consultando reservations:', error.message);
    } else {
      console.log('✅ Tabla reservations accesible');
      if (data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log('   - Columnas disponibles:', columns);
        console.log('   - ¿Tiene client_id?:', columns.includes('client_id') ? '✅ SÍ' : '❌ NO');
      }
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }

  // Test 2: Verificar tabla Client
  console.log('');
  console.log('2️⃣ Verificando tabla Client...');
  try {
    const { data, error } = await supabase
      .from('Client')
      .select('*')
      .limit(3);
    
    if (error) {
      console.log('❌ Error consultando Client:', error.message);
    } else {
      console.log(`✅ Tabla Client accesible: ${data.length} registros`);
      if (data.length > 0) {
        console.log('   - Cliente de ejemplo:', {
          id: data[0].id,
          nombre: data[0].nombrePrincipal,
          rut: data[0].rut,
          tipo: data[0].tipoCliente
        });
      }
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }

  // Test 3: Crear cliente de prueba
  console.log('');
  console.log('3️⃣ Creando cliente de prueba...');
  let testClientId = null;
  try {
    const { data: newClient, error } = await supabase
      .from('Client')
      .insert([{
        tipoCliente: 'PERSONA',
        nombrePrincipal: 'Cliente Test',
        apellido: 'Reservas',
        rut: '99.999.999-9',
        email: 'test@reservas.com',
        telefono: '+56 9 1234 5678',
        estado: 'activo',
        esClienteFrecuente: false
      }])
      .select()
      .single();

    if (error) {
      console.log('❌ Error creando cliente:', error.message);
    } else {
      testClientId = newClient.id;
      console.log('✅ Cliente de prueba creado:', {
        id: newClient.id,
        nombre: newClient.nombrePrincipal,
        rut: newClient.rut
      });
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }

  // Test 4: Crear reserva vinculada al cliente
  if (testClientId) {
    console.log('');
    console.log('4️⃣ Creando reserva vinculada al cliente...');
    try {
      const { data: newReservation, error } = await supabase
        .from('reservations')
        .insert([{
          client_id: testClientId,
          guest_name: 'Cliente Test Reservas',
          guest_email: 'test@reservas.com',
          guest_phone: '+56 9 1234 5678',
          check_in: '2024-07-01',
          check_out: '2024-07-03',
          guests: 2,
          room_id: 1,
          client_type: 'individual',
          billing_name: 'Cliente Test Reservas',
          billing_rut: '99.999.999-9',
          billing_address: 'Dirección de prueba',
          authorized_by: 'Cliente Test',
          status: 'pending',
          total_amount: 200000,
          payment_status: 'no_payment'
        }])
        .select()
        .single();

      if (error) {
        console.log('❌ Error creando reserva:', error.message);
      } else {
        console.log('✅ Reserva vinculada creada:', {
          id: newReservation.id,
          client_id: newReservation.client_id,
          guest_name: newReservation.guest_name
        });
      }
    } catch (err) {
      console.log('❌ Error:', err.message);
    }

    // Test 5: Consultar reserva con datos del cliente
    console.log('');
    console.log('5️⃣ Consultando reserva con datos del cliente...');
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          client:Client(*),
          room:rooms(*)
        `)
        .eq('client_id', testClientId)
        .single();

      if (error) {
        console.log('❌ Error consultando reserva con cliente:', error.message);
      } else {
        console.log('✅ Consulta con JOIN funcionando:', {
          reserva_id: data.id,
          cliente: data.client?.nombrePrincipal,
          habitacion: data.room?.number
        });
      }
    } catch (err) {
      console.log('❌ Error:', err.message);
    }

    // Limpiar datos de prueba
    console.log('');
    console.log('🧹 Limpiando datos de prueba...');
    try {
      await supabase.from('reservations').delete().eq('client_id', testClientId);
      await supabase.from('Client').delete().eq('id', testClientId);
      console.log('✅ Datos de prueba eliminados');
    } catch (err) {
      console.log('⚠️ Error limpiando datos:', err.message);
    }
  }

  console.log('');
  console.log('✅ Verificación de integración completada');
}

testClientReservationIntegration().catch(console.error); 