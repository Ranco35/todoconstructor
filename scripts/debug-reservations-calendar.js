// Script para debuggear el problema del calendario de reservas
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugReservationsCalendar() {
  console.log('🔍 Debugging reservations calendar...\n');
  
  try {
    // 1. Obtener reservas modulares
    console.log('📊 Obteniendo reservas modulares...');
    const { data: modularReservations, error: modularError } = await supabase
      .from('modular_reservations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (modularError) {
      console.error('❌ Error obteniendo reservas modulares:', modularError);
      return;
    }
    
    console.log(`✅ Reservas modulares encontradas: ${modularReservations.length}`);
    
    // 2. Obtener habitaciones
    console.log('\n🏠 Obteniendo habitaciones...');
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('*')
      .order('number');
    
    if (roomsError) {
      console.error('❌ Error obteniendo habitaciones:', roomsError);
      return;
    }
    
    console.log(`✅ Habitaciones encontradas: ${rooms.length}`);
    
    // 3. Mostrar primera reserva para análisis
    if (modularReservations.length > 0) {
      console.log('\n📋 Primera reserva modular:');
      const firstReservation = modularReservations[0];
      console.log({
        id: firstReservation.id,
        room_code: firstReservation.room_code,
        room_code_type: typeof firstReservation.room_code,
        check_in: firstReservation.check_in,
        check_out: firstReservation.check_out,
        client_full_name: firstReservation.client_full_name,
        package_name: firstReservation.package_name
      });
    }
    
    // 4. Mostrar primera habitación para análisis
    if (rooms.length > 0) {
      console.log('\n🏠 Primera habitación:');
      const firstRoom = rooms[0];
      console.log({
        id: firstRoom.id,
        number: firstRoom.number,
        number_type: typeof firstRoom.number,
        type: firstRoom.type,
        status: firstRoom.status
      });
    }
    
    // 5. Verificar coincidencias
    console.log('\n🔍 Verificando coincidencias room_code vs room.number:');
    const roomNumbers = rooms.map(r => r.number);
    const roomCodes = [...new Set(modularReservations.map(r => r.room_code))];
    
    console.log('Room numbers:', roomNumbers);
    console.log('Room codes:', roomCodes);
    
    // Buscar coincidencias
    const matches = roomCodes.filter(code => roomNumbers.includes(code));
    const mismatches = roomCodes.filter(code => !roomNumbers.includes(code));
    
    console.log('✅ Coincidencias:', matches);
    console.log('❌ No coincidencias:', mismatches);
    
    // 6. Análisis de tipos
    console.log('\n📊 Análisis de tipos:');
    if (modularReservations.length > 0 && rooms.length > 0) {
      const reservation = modularReservations[0];
      const room = rooms[0];
      
      console.log('reservation.room_code:', reservation.room_code, typeof reservation.room_code);
      console.log('room.number:', room.number, typeof room.number);
      console.log('Comparación estricta:', reservation.room_code === room.number);
      console.log('Comparación flexible:', reservation.room_code == room.number);
    }
    
    // 7. Reservas por habitación (con lógica corregida)
    console.log('\n🏠 Reservas por habitación (con lógica corregida):');
    roomNumbers.forEach(roomNumber => {
      const reservationsInRoom = modularReservations.filter(r => 
        r.room_code === roomNumber || 
        r.room_code === `habitacion_${roomNumber}` ||
        r.room_code.replace('habitacion_', '') === roomNumber
      );
      console.log(`Habitación ${roomNumber}: ${reservationsInRoom.length} reservas`);
      if (reservationsInRoom.length > 0) {
        reservationsInRoom.forEach(res => {
          console.log(`  - ${res.client_full_name} (${res.room_code})`);
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Error en debug:', error);
  }
}

// Ejecutar el debug
debugReservationsCalendar(); 