'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';

/**
 * Corrige el estado de una reserva para habilitar acciones específicas
 * Útil cuando una reserva está en estado incorrecto y no muestra los botones esperados
 */
export async function fixReservationState(
  modularId: number, 
  targetState: 'confirmada' | 'en_curso' | 'finalizada'
) {
  const supabase = await getSupabaseServerClient();

  try {
    // 1. Obtener ID principal desde ID modular
    const { data: modularData, error: modularError } = await supabase
      .from('modular_reservations')
      .select(`
        id,
        reservation_id,
        room_number,
        reservations (
          id,
          guest_name,
          status,
          payment_status
        )
      `)
      .eq('id', modularId)
      .single();

    if (modularError || !modularData) {
      return {
        success: false,
        message: `Error: No se encontró reserva modular con ID ${modularId}`,
        error: modularError?.message
      };
    }

    const reservationId = modularData.reservation_id;
    const currentState = (modularData.reservations as any)?.status;
    const guestName = (modularData.reservations as any)?.guest_name;

    // 2. Actualizar estado de la reserva principal
    const { error: updateError } = await supabase
      .from('reservations')
      .update({ 
        status: targetState,
        updated_at: new Date().toISOString()
      })
      .eq('id', reservationId);

    if (updateError) {
      return {
        success: false,
        message: `Error al actualizar estado de reserva ${reservationId}`,
        error: updateError.message
      };
    }

    // 3. Verificar cambio
    const { data: updatedData, error: verifyError } = await supabase
      .from('reservations')
      .select('id, guest_name, status, payment_status')
      .eq('id', reservationId)
      .single();

    if (verifyError || !updatedData) {
      return {
        success: false,
        message: 'Error al verificar actualización',
        error: verifyError?.message
      };
    }

    return {
      success: true,
      message: `✅ Estado actualizado: ${guestName} (ID principal: ${reservationId}) cambió de "${currentState}" a "${targetState}"`,
      data: {
        modularId,
        reservationId,
        guestName,
        previousState: currentState,
        newState: updatedData.status,
        roomNumber: modularData.room_number,
        paymentStatus: updatedData.payment_status
      }
    };

  } catch (error) {
    console.error('Error en fixReservationState:', error);
    return {
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Obtiene información detallada de una reserva usando su ID modular
 */
export async function getReservationDetailsFromModular(modularId: number) {
  const supabase = await getSupabaseServerClient();

  try {
    const { data, error } = await supabase
      .from('modular_reservations')
      .select(`
        id,
        reservation_id,
        room_number,
        reservations (
          id,
          guest_name,
          status,
          payment_status,
          check_in_date,
          check_out_date,
          created_at,
          updated_at
        )
      `)
      .eq('id', modularId)
      .single();

    if (error || !data) {
      return {
        success: false,
        message: `No se encontró reserva modular con ID ${modularId}`,
        error: error?.message
      };
    }

    const reservation = data.reservations as any;

    return {
      success: true,
      data: {
        modularId: data.id,
        reservationId: data.reservation_id,
        roomNumber: data.room_number,
        guestName: reservation.guest_name,
        status: reservation.status,
        paymentStatus: reservation.payment_status,
        checkInDate: reservation.check_in_date,
        checkOutDate: reservation.check_out_date,
        createdAt: reservation.created_at,
        updatedAt: reservation.updated_at,
        // Análisis de estado
        analysis: {
          canCheckIn: reservation.status === 'confirmada' && reservation.payment_status === 'paid',
          canCheckOut: reservation.status === 'en_curso',
          isFinished: reservation.status === 'finalizada',
          needsStateCorrection: reservation.status !== 'en_curso' && reservation.status !== 'finalizada'
        }
      }
    };

  } catch (error) {
    console.error('Error en getReservationDetailsFromModular:', error);
    return {
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}