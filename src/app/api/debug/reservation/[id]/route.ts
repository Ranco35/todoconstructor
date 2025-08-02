import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reservationId = parseInt(id);
    
    if (isNaN(reservationId)) {
      return NextResponse.json({ error: 'ID de reserva inválido' }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();

    // 1. Obtener reserva principal
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .single();

    // 2. Obtener reservas modulares
    const { data: modularReservations, error: modularError } = await supabase
      .from('modular_reservations')
      .select('*')
      .eq('reservation_id', reservationId);

    // 3. Obtener información del cliente
    let client = null;
    if (reservation?.client_id) {
      const { data: clientData } = await supabase
        .from('Client')
        .select('*')
        .eq('id', reservation.client_id)
        .single();
      client = clientData;
    }

    // 4. Calcular número de habitaciones
    const roomCount = modularReservations?.length || 1;
    const roomCodes = modularReservations?.map(mr => mr.room_code) || [];

    const result = {
      // Información básica
      reservation_id: reservationId,
      exists: !!reservation,
      
      // Datos de la reserva principal
      reservation: reservation || null,
      reservationError: reservationError?.message || null,
      
      // Datos modulares
      modularReservations: modularReservations || [],
      modularError: modularError?.message || null,
      
      // Análisis
      analysis: {
        isMultipleRooms: roomCount > 1,
        roomCount,
        roomCodes,
        totalAmount: reservation?.total_amount || 0,
        paymentStatus: reservation?.payment_status || 'unknown',
        status: reservation?.status || 'unknown'
      },
      
      // Cliente
      client: client || null,
      
      // Respuesta a la pregunta
      answer: {
        question: "¿Cuántas habitaciones tiene la reserva?",
        response: roomCount === 1 
          ? "1 habitación" 
          : `${roomCount} habitaciones (múltiples)`,
        details: roomCount > 1 
          ? `Habitaciones: ${roomCodes.join(', ')}` 
          : roomCodes[0] || 'Sin información de habitación'
      }
    };

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('Error in debug reservation endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
  }
} 