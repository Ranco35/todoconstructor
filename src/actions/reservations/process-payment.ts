'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

interface ProcessPaymentData {
  reservationId: number;
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  notes?: string;
  processedBy: string;
}

export async function processPayment(data: ProcessPaymentData) {
  try {
    const supabase = await getSupabaseServerClient();

    // 1. Primero obtener información de la reserva principal
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select('id, paid_amount, pending_amount, payment_status, total_amount')
      .eq('id', data.reservationId)
      .single();

    if (reservationError || !reservation) {
      throw new Error('No se pudo encontrar la reserva principal');
    }

    // 2. Obtener información de las reservas modulares asociadas
    const { data: modularReservations, error: modularError } = await supabase
      .from('modular_reservations')
      .select('id, grand_total, final_price, reservation_id')
      .eq('reservation_id', data.reservationId);

    if (modularError || !modularReservations || modularReservations.length === 0) {
      throw new Error('No se pudo encontrar las reservas modulares asociadas');
    }

    // 3. Calcular total amount - usar el total de la reserva principal que ya incluye todo
    const totalAmount = reservation.total_amount || 0;
    const currentPaidAmount = reservation.paid_amount || 0;
    const currentPendingAmount = Math.max(0, totalAmount - currentPaidAmount);
    
    // Validar que el monto no exceda el saldo pendiente
    if (data.amount > currentPendingAmount) {
      throw new Error(`El monto de $${data.amount.toLocaleString()} excede el saldo pendiente de $${currentPendingAmount.toLocaleString()}`);
    }

    // 3. Calcular nuevos valores
    const previousPaidAmount = currentPaidAmount;
    const newTotalPaid = previousPaidAmount + data.amount;
    const newRemainingBalance = Math.max(0, totalAmount - newTotalPaid);
    
    // 4. 🧠 LÓGICA INTELIGENTE: Determinar tipo de pago automáticamente
    const paymentType = newRemainingBalance === 0 ? 'pago_total' : 'abono';
    
    // 5. Determinar nuevo estado de pago
    let newPaymentStatus: 'no_payment' | 'partial' | 'paid' | 'overdue' = 'partial';
    if (newTotalPaid >= totalAmount) {
      newPaymentStatus = 'paid';
    } else if (newTotalPaid <= 0) {
      newPaymentStatus = 'no_payment';
    }

    // 6. Determinar nuevo estado de reserva
    let newReservationStatus = 'confirmed'; // Siempre dejar en confirmada, nunca en_curso ni finalizada por pago
    // NO cambiar a 'en_curso' ni 'finalizada' automáticamente por pago total
    if (newPaymentStatus === 'paid') {
      newReservationStatus = 'confirmed'; // Lista para la estadía
    }

    // 7. Insertar el registro de pago en el historial
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('reservation_payments')
      .insert([{
        reservation_id: data.reservationId,
        amount: data.amount,
        payment_type: paymentType,
        payment_method: data.paymentMethod,
        previous_paid_amount: previousPaidAmount,
        new_total_paid: newTotalPaid,
        remaining_balance: newRemainingBalance,
        total_reservation_amount: totalAmount,
        reference_number: data.referenceNumber,
        notes: data.notes,
        processed_by: data.processedBy
      }])
      .select()
      .single();

    if (paymentError) {
      throw new Error(`Error al registrar el pago: ${paymentError.message}`);
    }

    // 8. Actualizar la reserva principal con los nuevos montos y estados
    const { error: updateError } = await supabase
      .from('reservations')
      .update({
        paid_amount: newTotalPaid,
        pending_amount: newRemainingBalance,
        payment_status: newPaymentStatus,
        status: newReservationStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.reservationId);

    if (updateError) {
      throw new Error(`Error al actualizar la reserva: ${updateError.message}`);
    }

    // 9. Agregar comentario automático al historial
    await supabase
      .from('reservation_comments')
      .insert([{
        reservation_id: data.reservationId,
        text: `${paymentType === 'pago_total' ? 'Pago total' : 'Abono'} de $${data.amount.toLocaleString()} procesado. ${paymentType === 'pago_total' ? 'Reserva completamente pagada.' : `Saldo pendiente: $${newRemainingBalance.toLocaleString()}`}`,
        author: data.processedBy,
        comment_type: 'payment'
      }]);

    revalidatePath('/dashboard/reservations');
    
    return {
      success: true,
      paymentType,
      newTotalPaid,
      remainingBalance: newRemainingBalance,
      paymentRecord,
      message: paymentType === 'pago_total' 
        ? '✅ Pago total procesado. La reserva está completamente pagada.'
        : `✅ Abono de $${data.amount.toLocaleString()} procesado. Saldo pendiente: $${newRemainingBalance.toLocaleString()}`
    };

  } catch (error) {
    console.error('Error processing payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al procesar el pago'
    };
  }
}

export async function getPaymentHistory(reservationId: number) {
  try {
    const supabase = await getSupabaseServerClient();

    const { data: payments, error } = await supabase
      .from('reservation_payments')
      .select('*')
      .eq('reservation_id', reservationId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error al obtener historial de pagos: ${error.message}`);
    }

    return {
      success: true,
      payments: payments || []
    };

  } catch (error) {
    console.error('Error getting payment history:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al obtener historial de pagos'
    };
  }
} 