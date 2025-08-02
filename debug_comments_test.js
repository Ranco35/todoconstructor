// ================================================
// SCRIPT DE DEPURACIÓN PARA COMENTARIOS DE RESERVAS
// Fecha: 2025-01-27
// Descripción: Probar la funcionalidad de comentarios paso a paso
// ================================================

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase (usar variables de entorno reales)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCommentsSystem() {
  console.log('🔍 Iniciando pruebas del sistema de comentarios...\n');

  try {
    // 1. Verificar conexión a Supabase
    console.log('1️⃣ Verificando conexión a Supabase...');
    const { data: testConnection, error: connectionError } = await supabase
      .from('reservations')
      .select('id')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Error de conexión:', connectionError);
      return;
    }
    console.log('✅ Conexión exitosa\n');

    // 2. Obtener una reserva de prueba
    console.log('2️⃣ Obteniendo reserva de prueba...');
    const { data: reservations, error: reservationError } = await supabase
      .from('reservations')
      .select('id, guest_name, guest_email')
      .limit(1);
    
    if (reservationError || !reservations || reservations.length === 0) {
      console.error('❌ Error obteniendo reservas:', reservationError);
      return;
    }
    
    const testReservation = reservations[0];
    console.log('✅ Reserva de prueba:', testReservation);
    console.log('');

    // 3. Verificar estructura de tabla reservation_comments
    console.log('3️⃣ Verificando estructura de tabla reservation_comments...');
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_columns', { table_name: 'reservation_comments' })
      .catch(() => {
        // Si la función RPC no existe, usar una consulta directa
        return supabase
          .from('reservation_comments')
          .select('*')
          .limit(0);
      });
    
    if (tableError) {
      console.error('❌ Error verificando tabla:', tableError);
    } else {
      console.log('✅ Tabla reservation_comments existe');
    }
    console.log('');

    // 4. Verificar comentarios existentes para la reserva
    console.log('4️⃣ Verificando comentarios existentes...');
    const { data: existingComments, error: existingError } = await supabase
      .from('reservation_comments')
      .select('*')
      .eq('reservation_id', testReservation.id);
    
    if (existingError) {
      console.error('❌ Error obteniendo comentarios existentes:', existingError);
      return;
    }
    
    console.log(`✅ Comentarios existentes: ${existingComments.length}`);
    if (existingComments.length > 0) {
      console.log('📝 Comentarios encontrados:', existingComments);
    }
    console.log('');

    // 5. Intentar insertar un comentario de prueba
    console.log('5️⃣ Insertando comentario de prueba...');
    const testComment = {
      reservation_id: testReservation.id,
      text: `Comentario de prueba - ${new Date().toISOString()}`,
      author: 'Sistema de Prueba',
      is_edited: false
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('reservation_comments')
      .insert([testComment])
      .select();
    
    if (insertError) {
      console.error('❌ Error insertando comentario:', insertError);
      console.error('📋 Detalles del error:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
      return;
    }
    
    console.log('✅ Comentario insertado exitosamente:', insertResult);
    console.log('');

    // 6. Verificar que el comentario se guardó
    console.log('6️⃣ Verificando que el comentario se guardó...');
    const { data: verifyComments, error: verifyError } = await supabase
      .from('reservation_comments')
      .select('*')
      .eq('reservation_id', testReservation.id)
      .order('created_at', { ascending: false });
    
    if (verifyError) {
      console.error('❌ Error verificando comentarios:', verifyError);
      return;
    }
    
    console.log(`✅ Total de comentarios después de insertar: ${verifyComments.length}`);
    console.log('📝 Último comentario:', verifyComments[0]);
    console.log('');

    // 7. Limpiar comentario de prueba
    console.log('7️⃣ Limpiando comentario de prueba...');
    if (insertResult && insertResult.length > 0) {
      const { error: deleteError } = await supabase
        .from('reservation_comments')
        .delete()
        .eq('id', insertResult[0].id);
      
      if (deleteError) {
        console.error('❌ Error eliminando comentario de prueba:', deleteError);
      } else {
        console.log('✅ Comentario de prueba eliminado');
      }
    }

    console.log('\n🎉 Pruebas completadas exitosamente');

  } catch (error) {
    console.error('💥 Error general en las pruebas:', error);
  }
}

// Ejecutar las pruebas
testCommentsSystem();