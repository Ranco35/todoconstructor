'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getCurrentUser } from '@/actions/configuration/auth-actions';
import { revalidatePath } from 'next/cache';
import { createInvoiceFromReservation } from './create-invoice-from-reservation';

/**
 * Actualizar el estado de una reserva (incluye soporte para reservas modulares)
 * @param reservationId ID de la reserva (puede ser principal o modular)
 * @param newStatus Nuevo estado
 * @param paymentStatus Estado de pago opcional
 * @returns Resultado de la operación
 */
export async function updateReservationStatus(
  reservationId: number, 
  newStatus: 'prereserva' | 'confirmada' | 'en_curso' | 'finalizada' | 'cancelled',
  paymentStatus?: 'no_payment' | 'partial' | 'paid' | 'overdue'
) {
  try {
    // Verificar autenticación
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    const supabase = await getSupabaseServerClient();

    // Primero intentar buscar como reserva principal
    let { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('id, status, payment_status, guest_name, room_code')
      .eq('id', reservationId)
      .single();

    let isModularReservation = false;
    let actualReservationId = reservationId;

    // Si no se encuentra como reserva principal, buscar como reserva modular
    if (fetchError || !reservation) {
      console.log(`[DEBUG] No encontrada como reserva principal, buscando como modular: ${reservationId}`);
      
      const { data: modularReservation, error: modularError } = await supabase
        .from('modular_reservations')
        .select(`
          id, 
          reservation_id, 
          status,
          room_code,
          guest_name,
          reservations!inner(
            id, status, payment_status, guest_name
          )
        `)
        .eq('id', reservationId)
        .single();

      if (modularError || !modularReservation) {
        return { success: false, error: 'Reserva no encontrada (ni principal ni modular)' };
      }

      // Usar los datos de la reserva principal asociada
      reservation = {
        id: modularReservation.reservation_id,
        status: modularReservation.reservations.status,
        payment_status: modularReservation.reservations.payment_status,
        guest_name: modularReservation.reservations.guest_name,
        room_code: modularReservation.room_code
      };
      
      isModularReservation = true;
      actualReservationId = modularReservation.reservation_id;
      
      console.log(`[DEBUG] Encontrada como reserva modular. reservation_id: ${actualReservationId}`);
    }

    // Preparar datos de actualización
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    // Si se especifica estado de pago, incluirlo
    if (paymentStatus) {
      updateData.payment_status = paymentStatus;
    }

    // Actualizar la reserva principal (siempre actualizar la tabla principal)
    const { data: updatedReservation, error: updateError } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', actualReservationId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Error al actualizar reserva principal: ${updateError.message}`);
    }

    // Si es una reserva modular, también actualizar la tabla modular_reservations
    if (isModularReservation) {
      const { error: modularUpdateError } = await supabase
        .from('modular_reservations')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId); // Usar el ID modular original

      if (modularUpdateError) {
        console.warn(`Warning: No se pudo actualizar modular_reservations: ${modularUpdateError.message}`);
        // No fallar la operación principal, solo advertir
      }
    }

    // Agregar comentario del sistema sobre el cambio de estado
    await supabase
      .from('reservation_comments')
      .insert([{
        reservation_id: actualReservationId,
        text: `🔄 Estado cambiado de "${reservation.status}" a "${newStatus}"${isModularReservation ? ' (reserva modular)' : ''}`,
        author: 'Sistema',
        comment_type: 'system'
      }]);

    // Revalidar rutas relacionadas
    revalidatePath('/dashboard/reservations');
    revalidatePath('/dashboard/reservations/calendar');
    revalidatePath('/dashboard/reservations/list');
    revalidatePath(`/dashboard/reservations/${actualReservationId}`);
    revalidatePath(`/dashboard/reservations/${reservationId}`); // También el ID original si es diferente

    return {
      success: true,
      reservation: updatedReservation,
      message: `Estado actualizado a "${newStatus}" para ${reservation.guest_name}${isModularReservation ? ' (reserva modular)' : ''}`,
      isModularReservation,
      originalId: reservationId,
      principalId: actualReservationId
    };

  } catch (error) {
    console.error('Error updating reservation status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al actualizar estado'
    };
  }
}

/**
 * Realizar check-in de una reserva (incluye soporte para reservas modulares)
 * @param reservationId ID de la reserva (puede ser principal o modular)
 * @returns Resultado de la operación
 */
export async function checkInReservation(reservationId: number) {
  try {
    // Utilizar la función actualizada que ya maneja reservas modulares
    const result = await updateReservationStatus(reservationId, 'en_curso');
    
    if (result.success) {
      // Agregar comentario específico de check-in si la actualización fue exitosa
      const supabase = await getSupabaseServerClient();
      
      const actualReservationId = result.principalId || reservationId;
      const isModular = result.isModularReservation || false;
      
      await supabase
        .from('reservation_comments')
        .insert([{
          reservation_id: actualReservationId,
          text: `🏨 Check-in realizado - Huésped registrado${isModular ? ' (reserva modular)' : ''}`,
          author: 'Sistema',
          comment_type: 'system'
        }]);

      return {
        ...result,
        message: `Check-in realizado exitosamente para ${result.reservation?.guest_name || 'el huésped'}${isModular ? ' (reserva modular)' : ''}`
      };
    }
    
    return result;
  } catch (error) {
    console.error('Error in checkInReservation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al realizar check-in'
    };
  }
}

/**
 * Realizar check-out de una reserva (incluye soporte para reservas modulares)
 * @param reservationId ID de la reserva (puede ser principal o modular)
 * @returns Resultado de la operación
 */
export async function checkOutReservation(reservationId: number) {
  try {
    // Verificar autenticación
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    const supabase = await getSupabaseServerClient();

    // Primero intentar buscar como reserva principal
    let { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('id, status, payment_status, guest_name, room_code')
      .eq('id', reservationId)
      .single();

    let isModularReservation = false;
    let actualReservationId = reservationId;
    let roomInfo = '';

    // Si no se encuentra como reserva principal, buscar como reserva modular
    if (fetchError || !reservation) {
      console.log(`[DEBUG] Check-out: No encontrada como reserva principal, buscando como modular: ${reservationId}`);
      
      const { data: modularReservation, error: modularError } = await supabase
        .from('modular_reservations')
        .select(`
          id, 
          reservation_id, 
          status,
          room_code,
          guest_name,
          reservations!inner(
            id, status, payment_status, guest_name
          )
        `)
        .eq('id', reservationId)
        .single();

      if (modularError || !modularReservation) {
        return { success: false, error: 'Reserva no encontrada para check-out' };
      }

      // Usar los datos de la reserva principal asociada
      reservation = {
        id: modularReservation.reservation_id,
        status: modularReservation.reservations.status,
        payment_status: modularReservation.reservations.payment_status,
        guest_name: modularReservation.reservations.guest_name,
        room_code: modularReservation.room_code
      };
      
      isModularReservation = true;
      actualReservationId = modularReservation.reservation_id;
      roomInfo = modularReservation.room_code ? ` - Habitación(es): ${modularReservation.room_code}` : '';
      
      console.log(`[DEBUG] Check-out: Encontrada como reserva modular. reservation_id: ${actualReservationId}`);
    } else {
      roomInfo = reservation.room_code ? ` - Habitación: ${reservation.room_code}` : '';
    }

    // Verificar que no esté ya finalizada
    if (reservation.status === 'finalizada') {
      return { success: false, error: 'La reserva ya ha sido finalizada' };
    }

    // Preparar datos de actualización
    const updateData: any = {
      status: 'finalizada',
      updated_at: new Date().toISOString()
    };

    // Actualizar la reserva principal
    const { data: updatedReservation, error: updateError } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', actualReservationId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Error al actualizar reserva principal: ${updateError.message}`);
    }

    // Si es una reserva modular, también actualizar la tabla modular_reservations
    if (isModularReservation) {
      const { error: modularUpdateError } = await supabase
        .from('modular_reservations')
        .update({
          status: 'finalizada',
          updated_at: new Date().toISOString()
        })
        .eq('id', reservationId); // Usar el ID modular original

      if (modularUpdateError) {
        console.warn(`Warning: No se pudo actualizar modular_reservations en check-out: ${modularUpdateError.message}`);
      }
    }

    // Agregar comentario de sistema sobre el check-out
    await supabase
      .from('reservation_comments')
      .insert([{
        reservation_id: actualReservationId,
        text: `✅ Check-out realizado - Reserva finalizada${roomInfo}${isModularReservation ? ' (reserva modular)' : ''}`,
        author: 'Sistema',
        comment_type: 'system'
      }]);

    // 🆕 CREAR FACTURA AUTOMÁTICAMENTE DESPUÉS DEL CHECKOUT
    let invoiceResult = null;
    try {
      // Generar número de factura automático
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const autoNumber = `F-${isModularReservation ? 'MOD' : 'RES'}-${String(actualReservationId).padStart(4, '0')}-${year}${month}${day}`;

      invoiceResult = await createInvoiceFromReservation({
        reservationId: actualReservationId,
        invoiceNumber: autoNumber,
        notes: `Factura generada automáticamente desde checkout de reserva #${actualReservationId}${isModularReservation ? ' (modular)' : ''}`,
        paymentTerms: '30 días'
      });

      if (invoiceResult.success) {
        // Agregar comentario sobre la factura creada
        await supabase
          .from('reservation_comments')
          .insert([{
            reservation_id: actualReservationId,
            text: `🧾 Factura ${invoiceResult.data.invoice.number} creada automáticamente${isModularReservation ? ' para reserva modular' : ''}`,
            author: 'Sistema',
            comment_type: 'system'
          }]);
      }
    } catch (invoiceError) {
      console.error('Error al crear factura automática:', invoiceError);
      // No fallar el checkout si falla la factura, pero registrar el error
      await supabase
        .from('reservation_comments')
        .insert([{
          reservation_id: actualReservationId,
          text: `⚠️ Check-out completado pero falló la creación automática de factura. Puede crear la factura manualmente.`,
          author: 'Sistema',
          comment_type: 'system'
        }]);
    }

    // Revalidar rutas relacionadas
    revalidatePath('/dashboard/reservations');
    revalidatePath('/dashboard/reservations/calendar');
    revalidatePath('/dashboard/reservations/list');
    revalidatePath(`/dashboard/reservations/${actualReservationId}`);
    revalidatePath(`/dashboard/reservations/${reservationId}`); // También el ID original si es diferente

    return {
      success: true,
      reservation: updatedReservation,
      message: `Check-out realizado exitosamente para ${reservation.guest_name}${roomInfo}${isModularReservation ? ' (reserva modular)' : ''}`,
      invoice: invoiceResult?.success ? invoiceResult.data : null,
      invoiceError: invoiceResult?.success ? null : invoiceResult?.error,
      isModularReservation,
      originalId: reservationId,
      principalId: actualReservationId
    };

  } catch (error) {
    console.error('Error in checkOutReservation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al realizar check-out'
    };
  }
}

/**
 * Confirmar una pre-reserva (cuando se recibe abono)
 * @param reservationId ID de la reserva
 * @returns Resultado de la operación
 */
export async function confirmReservation(reservationId: number) {
  return updateReservationStatus(reservationId, 'confirmada', 'partial');
}

/**
 * Cancelar una reserva
 * @param reservationId ID de la reserva
 * @returns Resultado de la operación
 */
export async function cancelReservation(reservationId: number) {
  return updateReservationStatus(reservationId, 'cancelled');
}

