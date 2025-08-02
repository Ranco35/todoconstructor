import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleRefreshReservation(request, params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleRefreshReservation(request, params);
}

async function handleRefreshReservation(
  request: NextRequest,
  params: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reservationId = parseInt(id);
    
    if (isNaN(reservationId)) {
      return NextResponse.json({ error: 'ID de reserva inválido' }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();

    // 1. Verificar estado actual en BD
    const { data: currentReservation, error: currentError } = await supabase
      .from('reservations')
      .select('id, status, payment_status, total_amount, paid_amount, guest_name')
      .eq('id', reservationId)
      .single();

    if (currentError || !currentReservation) {
      return NextResponse.json({ 
        error: 'Reserva no encontrada',
        details: currentError?.message 
      }, { status: 404 });
    }

    // 2. Forzar actualización de timestamp para invalidar cache
    const { error: updateError } = await supabase
      .from('reservations')
      .update({ 
        updated_at: new Date().toISOString()
      })
      .eq('id', reservationId);

    if (updateError) {
      console.error('Error updating timestamp:', updateError);
    }

    // 3. Revalidar todas las rutas relacionadas
    revalidatePath('/dashboard/reservations');
    revalidatePath('/dashboard/reservations/calendar');
    revalidatePath(`/dashboard/reservations/${reservationId}`);
    revalidatePath('/');

    // 4. Obtener datos actualizados
    const { data: updatedReservation } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .single();

    // 5. Verificar color que debería mostrar
    const expectedColor = currentReservation.status === 'finalizada' 
      ? 'bg-gradient-to-br from-gray-400 to-gray-500 text-white' 
      : 'color-based-on-status';

    return NextResponse.json({
      success: true,
      message: 'Reserva actualizada y cache invalidado',
      reservation: {
        id: reservationId,
        current_status: currentReservation.status,
        payment_status: currentReservation.payment_status,
        expected_color: expectedColor,
        should_show_gray: currentReservation.status === 'finalizada',
        guest_name: currentReservation.guest_name
      },
      updated_reservation: updatedReservation,
      cache_cleared: true,
      revalidated_paths: [
        '/dashboard/reservations',
        '/dashboard/reservations/calendar',
        `/dashboard/reservations/${reservationId}`
      ]
    });

  } catch (error) {
    console.error('Error in refresh reservation endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
  }
} 