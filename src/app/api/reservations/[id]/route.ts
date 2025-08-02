import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getCurrentUser } from '@/actions/configuration/auth-actions';
import { revalidatePath } from 'next/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reservationId = parseInt(id);
    
    if (!reservationId || isNaN(reservationId)) {
      return NextResponse.json(
        { error: 'Invalid reservation ID' },
        { status: 400 }
      );
    }

    const { data: reservation, error } = await (await getSupabaseServerClient())
      .from('reservations')
      .select(`
        *,
        room:rooms(*),
        company:companies(*),
        contact:company_contacts(*),
        client:Client(*),
        modular_reservation:modular_reservations(*),
        reservation_products(*),
        payments(*),
        reservation_payments(*)
      `)
      .eq('id', reservationId)
      .single();

    if (error) {
      console.error('Error fetching reservation:', error);
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    // Obtener información de los usuarios
    let created_by_user = null;
    let updated_by_user = null;

    // Obtener IDs únicos de usuarios
    const userIds = [];
    if (reservation.created_by) userIds.push(reservation.created_by);
    if (reservation.updated_by && reservation.updated_by !== reservation.created_by) userIds.push(reservation.updated_by);

    if (userIds.length > 0) {
      try {
        const { data: users, error: usersError } = await (await getSupabaseServerClient())
          .from('User')
          .select('id, name, email')
          .in('id', userIds);

        if (!usersError && users) {
          const usersMap = new Map(users.map(user => [user.id, user]));
          created_by_user = reservation.created_by ? usersMap.get(reservation.created_by) || null : null;
          updated_by_user = reservation.updated_by ? usersMap.get(reservation.updated_by) || null : null;
        } else {
          console.warn('Error getting users for single reservation audit info:', usersError);
        }
      } catch (error) {
        console.warn('Error in single reservation user lookup:', error);
      }
    }

    const result = {
      ...reservation,
      created_by_user,
      updated_by_user
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in reservation API:', {
      reservationId: await params.then(p => p.id),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reservationId = parseInt(id);
    
    if (!reservationId || isNaN(reservationId)) {
      return NextResponse.json(
        { error: 'Invalid reservation ID' },
        { status: 400 }
      );
    }

    // Obtener usuario actual para auditoría
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Extraer campos válidos para actualización
    const updateData: any = {};
    
    // Información del cliente
    if (body.guest_name !== undefined) updateData.guest_name = body.guest_name;
    if (body.guest_email !== undefined) updateData.guest_email = body.guest_email;
    if (body.guest_phone !== undefined) updateData.guest_phone = body.guest_phone;
    
    // Detalles de la reserva
    if (body.check_in !== undefined) updateData.check_in = body.check_in;
    if (body.check_out !== undefined) updateData.check_out = body.check_out;
    if (body.guests !== undefined) updateData.guests = body.guests;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.authorized_by !== undefined) updateData.authorized_by = body.authorized_by;
    
    // Información financiera
    if (body.total_amount !== undefined) updateData.total_amount = body.total_amount;
    if (body.payment_status !== undefined) updateData.payment_status = body.payment_status;
    
    // Sistema de descuentos
    if (body.discount_type !== undefined) updateData.discount_type = body.discount_type;
    if (body.discount_value !== undefined) updateData.discount_value = body.discount_value;
    if (body.discount_amount !== undefined) updateData.discount_amount = body.discount_amount;
    if (body.discount_reason !== undefined) updateData.discount_reason = body.discount_reason;
    
    // Sistema de recargos
    if (body.surcharge_type !== undefined) updateData.surcharge_type = body.surcharge_type;
    if (body.surcharge_value !== undefined) updateData.surcharge_value = body.surcharge_value;
    if (body.surcharge_amount !== undefined) updateData.surcharge_amount = body.surcharge_amount;
    if (body.surcharge_reason !== undefined) updateData.surcharge_reason = body.surcharge_reason;
    
    // Campos de auditoría
    updateData.updated_at = new Date().toISOString();
    updateData.updated_by = currentUser.id;

    const supabase = await getSupabaseServerClient();
    
    // Actualizar la reserva
    const { data: updatedReservation, error } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', reservationId)
      .select()
      .single();

    if (error) {
      console.error('Error updating reservation:', error);
      return NextResponse.json(
        { error: 'Failed to update reservation' },
        { status: 500 }
      );
    }

    if (!updatedReservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    // Crear comentario de auditoría automático
    const changes = [];
    if (body.discount_type && body.discount_type !== 'none') {
      changes.push(`💸 Descuento aplicado: ${body.discount_type === 'percentage' ? body.discount_value + '%' : '$' + body.discount_value} (Total: $${body.discount_amount}) - ${body.discount_reason || 'Sin motivo'}`);
    }
    if (body.surcharge_type && body.surcharge_type !== 'none') {
      changes.push(`📈 Recargo aplicado: ${body.surcharge_type === 'percentage' ? body.surcharge_value + '%' : '$' + body.surcharge_value} (Total: $${body.surcharge_amount}) - ${body.surcharge_reason || 'Sin motivo'}`);
    }
    if (body.status) {
      changes.push(`🔄 Estado cambiado a: ${body.status}`);
    }
    if (body.total_amount !== undefined) {
      changes.push(`💰 Total base modificado a: $${body.total_amount}`);
    }
    if (body.guest_name || body.guest_email || body.guest_phone) {
      changes.push(`👤 Información del cliente actualizada`);
    }
    if (body.check_in || body.check_out) {
      changes.push(`📅 Fechas de reserva modificadas`);
    }

    if (changes.length > 0) {
      const authorName = currentUser.username || currentUser.email || 'Usuario';
      const timestamp = new Date().toLocaleString('es-CL');
      
      await supabase
        .from('reservation_comments')
        .insert({
          reservation_id: reservationId,
          text: `📝 RESERVA EDITADA [${timestamp}]\nEditado por: ${authorName}\n\nCambios realizados:\n${changes.join('\n')}`,
          author: authorName,
          created_at: new Date().toISOString()
        });
    }

    // Revalidar todas las páginas que muestran reservas para refrescar la caché
    revalidatePath('/dashboard/reservations');
    revalidatePath('/dashboard/reservations/list');
    revalidatePath('/dashboard/reservations/calendar');
    revalidatePath(`/dashboard/reservations/${reservationId}`);
    revalidatePath(`/dashboard/reservations/${reservationId}/edit`);

    return NextResponse.json(updatedReservation);
  } catch (error) {
    console.error('Error in reservation PUT API:', {
      reservationId: await params.then(p => p.id),
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 