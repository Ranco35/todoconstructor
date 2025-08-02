const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupReservationsTestData() {
  console.log('🏨 Configurando datos de prueba para módulo de reservaciones...');

  try {
    // Agregar productos a las reservas
    console.log('🛍️ Agregando productos a reservas...');
    const reservationProducts = [
      { reservation_id: 1, product_id: 1, quantity: 1, unit_price: 85000, total_price: 85000 },
      { reservation_id: 1, product_id: 4, quantity: 2, unit_price: 45000, total_price: 90000 },
      { reservation_id: 2, product_id: 2, quantity: 1, unit_price: 120000, total_price: 120000 },
      { reservation_id: 3, product_id: 6, quantity: 1, unit_price: 350000, total_price: 350000 },
      { reservation_id: 4, product_id: 3, quantity: 1, unit_price: 150000, total_price: 150000 }
    ];

    for (const product of reservationProducts) {
      const { error } = await supabase
        .from('reservation_products')
        .insert([product]);
      
      if (error) {
        console.log('❌ Error al agregar producto:', error.message);
      } else {
        console.log('✅ Producto agregado a reserva', product.reservation_id);
      }
    }

    // Agregar comentarios de ejemplo
    console.log('💬 Agregando comentarios a reservas...');
    const comments = [
      { 
        reservation_id: 1, 
        text: 'Cliente solicita habitación con vista al jardín', 
        author: 'Recepción', 
        comment_type: 'general' 
      },
      { 
        reservation_id: 2, 
        text: 'Pendiente confirmación de pago', 
        author: 'Administración', 
        comment_type: 'payment' 
      },
      { 
        reservation_id: 3, 
        text: 'Celebración de aniversario - decoración especial', 
        author: 'Servicios', 
        comment_type: 'service' 
      }
    ];

    for (const comment of comments) {
      const { error } = await supabase
        .from('reservation_comments')
        .insert([comment]);
      
      if (error) {
        console.log('❌ Error al agregar comentario:', error.message);
      } else {
        console.log('✅ Comentario agregado a reserva', comment.reservation_id);
      }
    }

    // Agregar pagos de ejemplo
    console.log('💰 Agregando pagos a reservas...');
    const payments = [
      { 
        reservation_id: 1, 
        amount: 100000, 
        method: 'Transferencia', 
        reference: 'TRF-001234', 
        processed_by: 'Admin' 
      },
      { 
        reservation_id: 3, 
        amount: 440000, 
        method: 'Tarjeta de Crédito', 
        reference: 'TC-005678', 
        processed_by: 'Recepción' 
      },
      { 
        reservation_id: 4, 
        amount: 75000, 
        method: 'Efectivo', 
        reference: 'EF-001122', 
        processed_by: 'Caja' 
      }
    ];

    for (const payment of payments) {
      const { error } = await supabase
        .from('payments')
        .insert([payment]);
      
      if (error) {
        console.log('❌ Error al agregar pago:', error.message);
      } else {
        console.log('✅ Pago agregado a reserva', payment.reservation_id);
      }
    }

    // Verificar estado final
    console.log('\n📊 Verificando estado final...');
    
    const { data: reservations } = await supabase
      .from('reservations')
      .select('*');
    
    const { data: products } = await supabase
      .from('reservation_products')
      .select('*');
    
    const { data: commentsList } = await supabase
      .from('reservation_comments')
      .select('*');
    
    const { data: paymentsList } = await supabase
      .from('payments')
      .select('*');

    console.log(`✅ Total reservas: ${reservations?.length || 0}`);
    console.log(`✅ Total productos en reservas: ${products?.length || 0}`);
    console.log(`✅ Total comentarios: ${commentsList?.length || 0}`);
    console.log(`✅ Total pagos: ${paymentsList?.length || 0}`);
    
    console.log('\n🎉 ¡Datos de prueba configurados exitosamente!');
    console.log('🌐 Ahora puedes revisar el módulo en: http://localhost:3000/dashboard/reservations');

  } catch (error) {
    console.error('❌ Error configurando datos:', error);
  }
}

setupReservationsTestData().catch(console.error); 