'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { CreateReservationFormData } from '@/types/reservation';
import { getCurrentUser } from '@/actions/configuration/auth-actions';

export async function createReservation(formData: FormData) {
  try {
    // Verificar que el usuario esté autenticado
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    const clientId = formData.get('clientId')?.toString();
    
    const reservationData: CreateReservationFormData = {
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
      // ⚠️ IMPORTANTE: Los campos de pago se inicializan en 0 y se calculan desde reservation_payments
      // Si hay un pago inicial, debe agregarse después de crear la reserva usando el flujo de pagos
      payment_status: 'no_payment', // Siempre inicia sin pagos
      payment_method: formData.get('paymentMethod')?.toString(),
      // Campos de descuento
      discount_type: (formData.get('discount_type')?.toString() as 'none' | 'percentage' | 'fixed_amount') || 'none',
      discount_value: parseFloat(formData.get('discount_value')?.toString() || '0'),
      discount_amount: parseFloat(formData.get('discount_amount')?.toString() || '0'),
      discount_reason: formData.get('discount_reason')?.toString() || '',
      selected_products: JSON.parse(formData.get('selectedProducts')?.toString() || '[]')
    };

    // Validaciones básicas
    if (!clientId) {
      throw new Error('Debe seleccionar un cliente registrado');
    }

    if (!reservationData.guest_name || !reservationData.guest_email || !reservationData.guest_phone) {
      throw new Error('Los datos del huésped son obligatorios');
    }

    if (!reservationData.check_in || !reservationData.check_out) {
      throw new Error('Las fechas de check-in y check-out son obligatorias');
    }

    if (reservationData.room_id === 0) {
      throw new Error('Debe seleccionar una habitación');
    }

    // Verificar disponibilidad de la habitación
    const { data: existingReservations, error: availabilityError } = await (await getSupabaseServerClient())
      .from('reservations')
      .select('id')
      .eq('room_id', reservationData.room_id)
      .eq('status', 'confirmed')
      .or(`check_in.lte.${reservationData.check_out},check_out.gte.${reservationData.check_in}`);

    if (availabilityError) {
      throw new Error('Error al verificar disponibilidad');
    }

    if (existingReservations && existingReservations.length > 0) {
      throw new Error('La habitación no está disponible para las fechas seleccionadas');
    }

    // Calcular el monto del descuento si es necesario
    let finalTotalAmount = reservationData.total_amount;
    let discountAmount = 0;

    if (reservationData.discount_type === 'percentage' && reservationData.discount_value > 0) {
      discountAmount = Math.round(reservationData.total_amount * (reservationData.discount_value / 100));
    } else if (reservationData.discount_type === 'fixed_amount' && reservationData.discount_value > 0) {
      discountAmount = Math.min(reservationData.discount_value, reservationData.total_amount);
    }

    finalTotalAmount = reservationData.total_amount - discountAmount;

    // Crear la reserva
    const { data: reservation, error: reservationError } = await (await getSupabaseServerClient())
      .from('reservations')
      .insert([{
        client_id: parseInt(clientId),
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
        total_amount: finalTotalAmount, // Total con descuento ya aplicado
        deposit_amount: reservationData.deposit_amount,
        // ⚠️ IMPORTANTE: Los campos de pago se inicializan en 0
        // paid_amount, pending_amount se calculan automáticamente desde reservation_payments
        paid_amount: 0, // Siempre inicia en 0
        pending_amount: finalTotalAmount, // Inicia igual al total con descuento
        payment_status: 'no_payment', // Siempre inicia sin pagos
        payment_method: reservationData.payment_method,
        // Campos de descuento
        discount_type: reservationData.discount_type,
        discount_value: reservationData.discount_value,
        discount_amount: discountAmount,
        discount_reason: reservationData.discount_reason,
        status: 'prereserva',
        // Campos de auditoría
        created_by: currentUser.id,
        updated_by: currentUser.id
      }])
      .select()
      .single();

    if (reservationError) {
      throw new Error(`Error al crear la reserva: ${reservationError.message}`);
    }

    // 🧮 Si hay un pago inicial, procesarlo a través del flujo de pagos
    const initialPayment = parseFloat(formData.get('paidAmount')?.toString() || '0');
    if (initialPayment > 0) {
      try {
        const { processPayment } = await import('./process-payment');
        await processPayment({
          reservationId: reservation.id,
          amount: initialPayment,
          paymentMethod: reservationData.payment_method || 'efectivo',
          referenceNumber: 'PAGO_INICIAL',
          notes: 'Pago inicial de la reserva',
          processedBy: 'Sistema'
        });
      } catch (paymentError) {
        console.warn('⚠️ No se pudo procesar el pago inicial:', paymentError);
        // No fallamos la creación de la reserva si falla el pago inicial
      }
    }

    // Agregar productos si existen
    if (reservationData.selected_products.length > 0) {
      const productsData = reservationData.selected_products.map((product) => ({
        reservation_id: reservation.id,
        product_type: 'spa_product',
        product_id: product.id,
        modular_product_id: null, // No usar para productos spa
        quantity: product.quantity,
        unit_price: product.unit_price,
        total_price: product.total_price
      }));

      const { error: productsError } = await (await getSupabaseServerClient())
        .from('reservation_products')
        .insert(productsData);

      if (productsError) {
        throw new Error(`Error al agregar productos: ${productsError.message}`);
      }
    }

    // Crear comentario automático si hay descuento aplicado
    if (discountAmount > 0) {
      const discountText = reservationData.discount_type === 'percentage' 
        ? `${reservationData.discount_value}%`
        : `$${reservationData.discount_value.toLocaleString()}`;
      
      const reasonText = reservationData.discount_reason 
        ? ` - Razón: ${reservationData.discount_reason}`
        : '';
      
      await (await getSupabaseServerClient())
        .from('reservation_comments')
        .insert([{
          reservation_id: reservation.id,
          text: `💸 Descuento aplicado: ${discountText} = $${discountAmount.toLocaleString()}${reasonText}`,
          author: reservationData.authorized_by || 'Sistema',
          comment_type: 'general'
        }]);
    }

    // Crear comentario inicial si hay observaciones
    const observations = formData.get('observations')?.toString();
    if (observations && observations.trim()) {
      await (await getSupabaseServerClient())
        .from('reservation_comments')
        .insert([{
          reservation_id: reservation.id,
          text: observations,
          author: reservationData.authorized_by,
          comment_type: 'general'
        }]);
    }

    revalidatePath('/dashboard/reservations');
    return { success: true, reservationId: reservation.id };
  } catch (error) {
    console.error('Error creating reservation:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al crear la reserva' 
    };
  }
} 