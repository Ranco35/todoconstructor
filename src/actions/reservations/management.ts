'use server';

import { getSupabaseClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

export async function updateReservationStatus(reservationId: number, newStatus: string) {
  const supabase = await getSupabaseClient();
  try {
    // 1. Intentar actualizar usando el ID directamente (caso reserva principal)
    let { data, error } = await supabase
      .from('reservations')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', reservationId)
      .select()
      .single();

    // 2. Si no se encontró la reserva, buscar en modular_reservations
    if (error && error.code === 'PGRST116') {
      // Buscar el reservation_id correspondiente
      const { data: modular, error: modularError } = await supabase
        .from('modular_reservations')
        .select('reservation_id')
        .eq('id', reservationId)
        .single();
      if (modularError || !modular?.reservation_id) {
        console.error('No se encontró reservation_id en modular_reservations');
        throw new Error('No se pudo encontrar la reserva principal para actualizar el estado');
      }
      // Intentar actualizar usando el reservation_id real
      ({ data, error } = await supabase
        .from('reservations')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', modular.reservation_id)
        .select()
        .single());
    }

    if (error) {
      console.error('Error updating reservation status:', error);
      throw new Error('Error al actualizar el estado de la reserva');
    }

    // Sincronizar estado en modular_reservations si existe
    // Buscar modular_reservation asociada
    const { data: modular, error: modularError } = await supabase
      .from('modular_reservations')
      .select('id')
      .eq('reservation_id', data?.id || reservationId)
      .single();
    if (modular && modular.id) {
      await supabase
        .from('modular_reservations')
        .update({ status: newStatus })
        .eq('id', modular.id);
    }

    revalidatePath('/dashboard/reservations');
    return { success: true, data };
  } catch (error) {
    console.error('Error in updateReservationStatus:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

export async function addReservationPayment(
  reservationId: number, 
  amount: number, 
  paymentMethod: string = 'efectivo',
  notes?: string,
  paymentDate?: string
) {
  // ⚠️ IMPORTANTE: Esta función ahora usa el flujo centralizado de pagos
  // para mantener consistencia y historial completo
  
  try {
    const { processPayment } = await import('./process-payment');
    
    const result = await processPayment({
      reservationId,
      amount,
      paymentMethod,
      referenceNumber: paymentDate ? `PAGO-${new Date(paymentDate).toISOString().split('T')[0]}` : undefined,
      notes: notes || `Pago procesado - ${paymentMethod}`,
      processedBy: 'Sistema'
    });

    if (result.success) {
      revalidatePath('/dashboard/reservations');
      return { 
        success: true, 
        data: result,
        paymentInfo: {
          amount,
          paymentMethod,
          newPaidAmount: result.newTotalPaid,
          newPaymentStatus: result.paymentType === 'pago_total' ? 'paid' : 'partial'
        }
      };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Error in addReservationPayment:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

export async function getReservationPayments(reservationId: number) {
  const supabase = await getSupabaseClient();
  
  try {
    // Primero obtener la reserva modular para obtener el reservation_id correcto
    const { data: modularReservation, error: modularError } = await supabase
      .from('modular_reservations')
      .select('reservation_id')
      .eq('id', reservationId)
      .single();

    if (modularError) {
      console.error('Error fetching modular reservation:', modularError);
      // Si no encuentra la reserva modular, intentar con el ID original
      const actualReservationId = reservationId;
      
      const { data, error } = await supabase
        .from('reservation_payments')
        .select('*')
        .eq('reservation_id', actualReservationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reservation payments:', error);
        // Si la tabla no existe, retornamos array vacío
        if (error.code === '42P01') { // Table doesn't exist
          return { success: true, data: [] };
        }
        throw new Error('Error al obtener el historial de pagos');
      }

      return { success: true, data: data || [] };
    }

    // Usar el reservation_id de la reserva modular
    const actualReservationId = modularReservation.reservation_id;
    
    const { data, error } = await supabase
      .from('reservation_payments')
      .select('*')
      .eq('reservation_id', actualReservationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reservation payments:', error);
      // Si la tabla no existe, retornamos array vacío
      if (error.code === '42P01') { // Table doesn't exist
        return { success: true, data: [] };
      }
      throw new Error('Error al obtener el historial de pagos');
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error in getReservationPayments:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
}

export async function getReservationDetails(reservationId: number) {
  const supabase = await getSupabaseClient();
  
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        room:rooms(*),
        client:clients(*),
        company:companies(*)
      `)
      .eq('id', reservationId)
      .single();

    if (error) {
      console.error('Error fetching reservation details:', error);
      throw new Error('Error al obtener los detalles de la reserva');
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in getReservationDetails:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
  }
} 