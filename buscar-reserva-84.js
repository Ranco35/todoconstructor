// Script temporal para buscar reserva ID 84
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uqmlsdflbslrvqvvmroi.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxbWxzZGZsYnNscnZxdnZtcm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTkzNTEzNjYsImV4cCI6MjAzNDkyNzM2Nn0.Fgd1m8OAZ2xwS7j5rP_Zb02owYHhCbPyF4tGlVGvDaI'
);

async function buscarReserva84() {
  console.log('🔍 Buscando reserva con ID 84...\n');
  
  try {
    // 1. Buscar en tabla reservations (principal)
    console.log('📋 1. Buscando en tabla reservations (ID principal):');
    const { data: reservaPrincipal, error: errorPrincipal } = await supabase
      .from('reservations')
      .select(`
        id,
        client_id,
        check_in,
        check_out,
        status,
        total_amount,
        created_at,
        clients(full_name, email, phone)
      `)
      .eq('id', 84)
      .single();
    
    if (errorPrincipal && errorPrincipal.code !== 'PGRST116') {
      console.error('❌ Error al buscar en reservations:', errorPrincipal);
    } else if (reservaPrincipal) {
      console.log('✅ Encontrada en reservations:');
      console.log(JSON.stringify(reservaPrincipal, null, 2));
    } else {
      console.log('❌ No encontrada en tabla reservations');
    }
    
    console.log('\n' + '─'.repeat(60) + '\n');
    
    // 2. Buscar en tabla modular_reservations (modular)
    console.log('📋 2. Buscando en tabla modular_reservations (ID modular):');
    const { data: reservaModular, error: errorModular } = await supabase
      .from('modular_reservations')
      .select(`
        id,
        reservation_id,
        check_in,
        check_out,
        guest_name,
        package_name,
        total_with_vat,
        room_code,
        created_at
      `)
      .eq('id', 84)
      .single();
    
    if (errorModular && errorModular.code !== 'PGRST116') {
      console.error('❌ Error al buscar en modular_reservations:', errorModular);
    } else if (reservaModular) {
      console.log('✅ Encontrada en modular_reservations:');
      console.log(JSON.stringify(reservaModular, null, 2));
      
      // Si encontramos reserva modular, buscar el principal asociado
      if (reservaModular.reservation_id) {
        console.log('\n🔗 Buscando reserva principal asociada (ID ' + reservaModular.reservation_id + '):');
        const { data: principalAsociada } = await supabase
          .from('reservations')
          .select(`
            id,
            client_id,
            status,
            total_amount,
            clients(full_name, email, phone)
          `)
          .eq('id', reservaModular.reservation_id)
          .single();
        
        if (principalAsociada) {
          console.log('✅ Reserva principal asociada:');
          console.log(JSON.stringify(principalAsociada, null, 2));
        }
      }
    } else {
      console.log('❌ No encontrada en tabla modular_reservations');
    }
    
    console.log('\n' + '─'.repeat(60) + '\n');
    
    // 3. Buscar todas las reservas con ID 84 en cualquier campo
    console.log('📋 3. Búsqueda amplia - reservas relacionadas con ID 84:');
    
    const { data: todasReservas } = await supabase
      .from('modular_reservations')
      .select(`
        id,
        reservation_id,
        guest_name,
        package_name,
        room_code,
        check_in,
        check_out
      `)
      .or('id.eq.84,reservation_id.eq.84')
      .order('id', { ascending: true });
    
    if (todasReservas && todasReservas.length > 0) {
      console.log(`✅ Encontradas ${todasReservas.length} reservas relacionadas con ID 84:`);
      todasReservas.forEach((reserva, index) => {
        console.log(`\n${index + 1}. ${reserva.guest_name || 'Sin nombre'}`);
        console.log(`   ID Modular: ${reserva.id}, ID Principal: ${reserva.reservation_id}`);
        console.log(`   Habitación: ${reserva.room_code || 'Sin habitación'}`);
        console.log(`   Paquete: ${reserva.package_name || 'Sin paquete'}`);
        console.log(`   Fechas: ${reserva.check_in} → ${reserva.check_out}`);
      });
    } else {
      console.log('❌ No se encontraron reservas relacionadas con ID 84');
    }

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar la búsqueda
buscarReserva84().then(() => {
  console.log('\n🏁 Búsqueda completada');
  process.exit(0);
}).catch(console.error); 