'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { CreateReservationFormData } from '@/types/reservation';
import { createInvoiceFromReservation } from './create-invoice-from-reservation';
import { getCurrentUser } from '@/actions/configuration/auth-actions';

export async function updateReservation(id: number, formData: FormData) {
  try {
    // Verificar que el usuario esté autenticado
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    const reservationData: Partial<CreateReservationFormData> = {
      guest_name: formData.get('guestName')?.toString() || '',
      guest_email: formData.get('email')?.toString() || '',
      guest_phone: formData.get('phone')?.toString() || '',
      check_in: formData.get('checkIn')?.toString() || '',
      check_out: formData.get('checkOut')?.toString() || '',
      guests: parseInt(formData.get('guests')?.toString() || '1'),
      room_id: parseInt(formData.get('roomId')?.toString() || '0'),
      client_type: (formData.get('clientType')?.toString() as 'individual' | 'corporate') || 'individual',
      contact_id: formData.get('contactId') ? parseInt(formData.get('contactId')?.toString() || '0') : undefined,
      company_id: formData.get('companyId') ? parseInt(formData.get('companyId')?.toString() || '0') : undefined,
      billing_name: formData.get('billingName')?.toString() || '',
      billing_rut: formData.get('billingRut')?.toString() || '',
      billing_address: formData.get('billingAddress')?.toString() || '',
      authorized_by: formData.get('authorizedBy')?.toString() || '',
      total_amount: parseFloat(formData.get('totalAmount')?.toString() || '0'),
      deposit_amount: parseFloat(formData.get('depositAmount')?.toString() || '0'),
      // ⚠️ IMPORTANTE: Los campos de pago (paid_amount, pending_amount, payment_status) 
      // NO se pueden editar directamente desde este formulario.
      // Para agregar pagos/abonos, usar el flujo de pagos centralizado.
      // Los valores se calculan automáticamente desde reservation_payments
      payment_method: formData.get('paymentMethod')?.toString()
    };

    // Validaciones básicas
    if (!reservationData.guest_name || !reservationData.guest_email || !reservationData.guest_phone) {
      throw new Error('Los datos del huésped son obligatorios');
    }

    if (!reservationData.check_in || !reservationData.check_out) {
      throw new Error('Las fechas de check-in y check-out son obligatorias');
    }

    if (reservationData.room_id === 0) {
      throw new Error('Debe seleccionar una habitación');
    }

    // Obtener los datos actuales de la reserva
    const { data: currentReservation, error: currentReservationError } = await (await getSupabaseServerClient())
      .from('reservations')
      .select('status, room_id, check_in, check_out')
      .eq('id', id)
      .single();

    if (currentReservationError) {
      throw new Error('No se pudo encontrar la reserva a actualizar');
    }

    // Verificar disponibilidad de la habitación (excluyendo la reserva actual)
    const { data: existingReservations, error: availabilityError } = await (await getSupabaseServerClient())
      .from('reservations')
      .select('id')
      .eq('room_id', reservationData.room_id)
      .eq('status', 'confirmed')
      .neq('id', id)
      .or(`check_in.lte.${reservationData.check_out},check_out.gte.${reservationData.check_in}`);

    if (availabilityError) {
      throw new Error('Error al verificar disponibilidad');
    }

    if (existingReservations && existingReservations.length > 0) {
      throw new Error('La habitación no está disponible para las fechas seleccionadas');
    }

    // 🧮 CALCULAR AUTOMÁTICAMENTE SALDOS Y ESTADOS
    // ⚠️ IMPORTANTE: Los montos de pago se calculan automáticamente desde reservation_payments
    // NO se pueden modificar directamente desde este formulario
    
    // Lógica de cambio de estado automático de la reserva
    let newStatus = currentReservation?.status || 'pending';
    
    // Lógica para check-out automático
    if (formData.get('checkOutCompleted') === 'true') {
      newStatus = 'completed';
    }

    // Actualizar la reserva
    const { data: reservation, error: reservationError } = await (await getSupabaseServerClient())
      .from('reservations')
      .update({
        guest_name: reservationData.guest_name,
        guest_email: reservationData.guest_email,
        guest_phone: reservationData.guest_phone,
        check_in: reservationData.check_in,
        check_out: reservationData.check_out,
        guests: reservationData.guests,
        room_id: reservationData.room_id,
        client_type: reservationData.client_type,
        contact_id: reservationData.contact_id,
        company_id: reservationData.company_id,
        billing_name: reservationData.billing_name,
        billing_rut: reservationData.billing_rut,
        billing_address: reservationData.billing_address,
        authorized_by: reservationData.authorized_by,
        total_amount: reservationData.total_amount,
        deposit_amount: reservationData.deposit_amount,
        // ⚠️ IMPORTANTE: paid_amount, pending_amount y payment_status NO se actualizan aquí
        // Estos valores se calculan automáticamente desde reservation_payments por el trigger SQL
        payment_method: reservationData.payment_method,
        status: newStatus,
        // Campo de auditoría
        updated_by: currentUser.id
      })
      .eq('id', id)
      .select()
      .single();

    if (reservationError) {
      throw new Error(`Error al actualizar la reserva: ${reservationError.message}`);
    }

    // Actualizar productos si se proporcionaron
    const selectedProducts = formData.get('selectedProducts')?.toString();
    if (selectedProducts) {
      const products = JSON.parse(selectedProducts);
      
      // Eliminar productos existentes
      await (await getSupabaseServerClient())
        .from('reservation_products')
        .delete()
        .eq('reservation_id', id);

      // Agregar nuevos productos
      if (products.length > 0) {
        const productsData = products.map((product: any) => ({
          reservation_id: id,
          product_id: product.id,
          quantity: product.quantity,
          unit_price: product.unit_price,
          total_price: product.total_price
        }));

        const { error: productsError } = await (await getSupabaseServerClient())
          .from('reservation_products')
          .insert(productsData);

        if (productsError) {
          throw new Error(`Error al actualizar productos: ${productsError.message}`);
        }
      }
    }

    // Agregar comentario si hay observaciones
    const observations = formData.get('observations')?.toString();
    if (observations && observations.trim()) {
      await (await getSupabaseServerClient())
        .from('reservation_comments')
        .insert([{
          reservation_id: id,
          text: observations,
          author: reservationData.authorized_by,
          comment_type: 'general'
        }]);
    }

    revalidatePath('/dashboard/reservations');
    return { success: true, reservationId: id };
  } catch (error) {
    console.error('Error updating reservation:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al actualizar la reserva' 
    };
  }
}

export async function updateReservationStatus(id: number, status: string, comment?: string) {
  try {
    // Verificar que el usuario esté autenticado
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await (await getSupabaseServerClient())
      .from('reservations')
      .update({ 
        status,
        updated_by: currentUser.id
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar el estado: ${error.message}`);
    }

    // Agregar comentario si se proporciona
    if (comment && comment.trim()) {
      await (await getSupabaseServerClient())
        .from('reservation_comments')
        .insert([{
          reservation_id: id,
          text: `Estado cambiado a: ${status}. ${comment}`,
          author: 'Sistema',
          comment_type: 'status_change'
        }]);
    }

    revalidatePath('/dashboard/reservations');
    return { success: true };
  } catch (error) {
    console.error('Error updating reservation status:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al actualizar el estado' 
    };
  }
}

export async function addPayment(reservationId: number, formData: FormData) {
  try {
    const paymentData = {
      reservation_id: reservationId,
      amount: parseFloat(formData.get('amount')?.toString() || '0'),
      method: formData.get('method')?.toString() || '',
      reference: formData.get('reference')?.toString(),
      notes: formData.get('notes')?.toString(),
      processed_by: formData.get('processedBy')?.toString() || 'Sistema'
    };

    if (paymentData.amount <= 0) {
      throw new Error('El monto del pago debe ser mayor a 0');
    }

    if (!paymentData.method) {
      throw new Error('Debe especificar el método de pago');
    }

    // Obtener la reserva actual para calcular los nuevos montos
    const { data: currentReservation, error: reservationError } = await (await getSupabaseServerClient())
      .from('reservations')
      .select('paid_amount, total_amount, pending_amount')
      .eq('id', reservationId)
      .single();

    if (reservationError || !currentReservation) {
      throw new Error('No se pudo encontrar la reserva');
    }

    // Calcular nuevos montos
    const newPaidAmount = (currentReservation.paid_amount || 0) + paymentData.amount;
    const newPendingAmount = Math.max(0, (currentReservation.total_amount || 0) - newPaidAmount);
    
    // Determiner nuevo estado de pago
    let newPaymentStatus: 'no_payment' | 'partial' | 'paid' | 'overdue' = 'partial';
    if (newPaidAmount >= (currentReservation.total_amount || 0)) {
      newPaymentStatus = 'paid';
    } else if (newPaidAmount <= 0) {
      newPaymentStatus = 'no_payment';
    }

    // Insertar el pago
    const { data: payment, error: paymentError } = await (await getSupabaseServerClient())
      .from('payments')
      .insert([paymentData])
      .select()
      .single();

    if (paymentError) {
      throw new Error(`Error al registrar el pago: ${paymentError.message}`);
    }

    // Actualizar la reserva con los nuevos montos
    const { error: updateError } = await (await getSupabaseServerClient())
      .from('reservations')
      .update({
        paid_amount: newPaidAmount,
        pending_amount: newPendingAmount,
        payment_status: newPaymentStatus
      })
      .eq('id', reservationId);

    if (updateError) {
      // Si falla la actualización, eliminar el pago recién creado
      await (await getSupabaseServerClient())
        .from('payments')
        .delete()
        .eq('id', payment.id);
      
      throw new Error(`Error al actualizar la reserva: ${updateError.message}`);
    }

    // Agregar comentario del pago
    await (await getSupabaseServerClient())
      .from('reservation_comments')
      .insert([{
        reservation_id: reservationId,
        text: `💰 Pago registrado: $${paymentData.amount.toLocaleString('es-CL')} vía ${paymentData.method}${paymentData.reference ? ` (Ref: ${paymentData.reference})` : ''}`,
        author: paymentData.processed_by,
        comment_type: 'payment'
      }]);

    revalidatePath('/dashboard/reservations');
    return { 
      success: true, 
      payment,
      newTotals: {
        paid_amount: newPaidAmount,
        pending_amount: newPendingAmount,
        payment_status: newPaymentStatus
      }
    };
  } catch (error) {
    console.error('Error adding payment:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al agregar el pago' 
    };
  }
}

export async function addComment(reservationId: number, formData: FormData) {
  try {
    const commentData = {
      reservation_id: reservationId,
      text: formData.get('text')?.toString() || '',
      author: formData.get('author')?.toString() || 'Sistema',
      comment_type: (formData.get('commentType')?.toString() as 'general' | 'payment' | 'service' | 'cancellation') || 'general'
    };

    if (!commentData.text.trim()) {
      throw new Error('El comentario no puede estar vacío');
    }

    const { data, error } = await (await getSupabaseServerClient())
      .from('reservation_comments')
      .insert([commentData])
      .select()
      .single();

    if (error) {
      throw new Error(`Error al agregar el comentario: ${error.message}`);
    }

    revalidatePath('/dashboard/reservations');
    return { success: true, commentId: data.id };
  } catch (error) {
    console.error('Error adding comment:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al agregar el comentario' 
    };
  }
}

export async function checkoutReservation(id: number) {
  try {
    // Verificar que el usuario esté autenticado
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    // Obtener la reserva actual
    const { data: reservation, error: fetchError } = await (await getSupabaseServerClient())
      .from('reservations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw new Error(`Error al obtener la reserva: ${fetchError.message}`);
    }

    if (!reservation) {
      throw new Error('Reserva no encontrada');
    }

    // Verificar que la reserva esté en un estado válido para check-out
    if (reservation.status === 'finalizada') {
      throw new Error('La reserva ya ha sido finalizada');
    }

    // Realizar check-out: cambiar estado a 'finalizada'
    const { data: updatedReservation, error: updateError } = await (await getSupabaseServerClient())
      .from('reservations')
      .update({
        status: 'finalizada',
        updated_at: new Date().toISOString(),
        updated_by: currentUser.id
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Error al realizar check-out: ${updateError.message}`);
    }

    // Agregar comentario de sistema sobre el check-out
    await (await getSupabaseServerClient())
      .from('reservation_comments')
      .insert([{
        reservation_id: id,
        text: '✅ Check-out realizado - Reserva finalizada',
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
      const autoNumber = `F-RES-${String(id).padStart(4, '0')}-${year}${month}${day}`;

      invoiceResult = await createInvoiceFromReservation({
        reservationId: id,
        invoiceNumber: autoNumber,
        notes: `Factura generada automáticamente desde checkout de reserva #${id}`,
        paymentTerms: '30 días'
      });

      if (invoiceResult.success) {
        // Agregar comentario sobre la factura creada
        await (await getSupabaseServerClient())
          .from('reservation_comments')
          .insert([{
            reservation_id: id,
            text: `🧾 Factura ${invoiceResult.data.invoice.number} creada automáticamente`,
            author: 'Sistema',
            comment_type: 'system'
          }]);
      }
    } catch (invoiceError) {
      console.error('Error al crear factura automática:', invoiceError);
      // No fallar el checkout si falla la factura, pero registrar el error
      await (await getSupabaseServerClient())
        .from('reservation_comments')
        .insert([{
          reservation_id: id,
          text: `⚠️ Check-out completado pero falló la creación automática de factura. Puede crear la factura manualmente.`,
          author: 'Sistema',
          comment_type: 'system'
        }]);
    }

    revalidatePath('/dashboard/reservations');
    revalidatePath('/dashboard/reservations/list');

    return {
      success: true,
      message: 'Check-out realizado exitosamente',
      reservation: updatedReservation,
      invoice: invoiceResult?.success ? invoiceResult.data : null,
      invoiceError: invoiceResult?.success ? null : invoiceResult?.error
    };

  } catch (error) {
    console.error('Error en checkoutReservation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
} 