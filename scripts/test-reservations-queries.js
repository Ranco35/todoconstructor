const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testReservationQueries() {
  console.log('🧪 Probando consultas del módulo de reservas...');
  console.log('');

  // Test 1: Consulta básica de reservas
  console.log('1️⃣ Probando consulta básica de reservas...');
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .limit(5);
    
    if (error) {
      console.log('❌ Error en consulta básica de reservas:', error.message);
    } else {
      console.log(`✅ Consulta básica funcionando: ${data.length} registros`);
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }

  // Test 2: Consulta con join a rooms
  console.log('');
  console.log('2️⃣ Probando consulta con join a rooms...');
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        id,
        guest_name,
        room:rooms(id, number, type)
      `)
      .limit(5);
    
    if (error) {
      console.log('❌ Error en join con rooms:', error.message);
    } else {
      console.log(`✅ Join con rooms funcionando: ${data.length} registros`);
      if (data.length > 0) {
        console.log('   - Ejemplo:', data[0]);
      }
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }

  // Test 3: Consulta completa como en get.ts
  console.log('');
  console.log('3️⃣ Probando consulta completa...');
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        room:rooms(*),
        company:companies(*),
        contact:company_contacts(*),
        reservation_products(*, product:spa_products(*)),
        reservation_comments(*),
        payments(*)
      `)
      .limit(3);
    
    if (error) {
      console.log('❌ Error en consulta completa:', error.message);
    } else {
      console.log(`✅ Consulta completa funcionando: ${data.length} registros`);
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }

  // Test 4: Verificar estructura de tablas
  console.log('');
  console.log('4️⃣ Verificando estructura de rooms...');
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error consultando rooms:', error.message);
    } else {
      console.log('✅ Tabla rooms accesible');
      if (data.length > 0) {
        console.log('   - Columnas disponibles:', Object.keys(data[0]));
      }
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }

  // Test 5: Verificar estructura de companies
  console.log('');
  console.log('5️⃣ Verificando estructura de companies...');
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Error consultando companies:', error.message);
    } else {
      console.log('✅ Tabla companies accesible');
      if (data.length > 0) {
        console.log('   - Columnas disponibles:', Object.keys(data[0]));
      }
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }

  console.log('');
  console.log('✅ Verificación de consultas completada');
}

testReservationQueries().catch(console.error); 