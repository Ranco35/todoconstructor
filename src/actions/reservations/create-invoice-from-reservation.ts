'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import { createInvoice, CreateInvoiceInput } from '@/actions/sales/invoices/create';

export interface CreateInvoiceFromReservationInput {
  reservationId: number;
  invoiceNumber?: string;
  notes?: string;
  paymentTerms?: string;
}

export interface ReservationInvoiceData {
  reservation: {
    id: number;
    guest_name: string;
    guest_email: string;
    guest_phone: string;
    check_in: string;
    check_out: string;
    guests: number;
    total_amount: number;
    billing_name: string;
    billing_rut: string;
    billing_address: string;
    client_id: number;
    status: string;
  };
  client: {
    id: number;
    nombrePrincipal: string;
    apellido: string;
    email: string;
    telefono: string;
  };
  products: Array<{
    id: number;
    name: string;
    description: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  payments: Array<{
    id: number;
    amount: number;
    payment_method: string;
    payment_date: string;
    reference_number?: string;
    notes?: string;
  }>;
}

export async function createInvoiceFromReservation(
  input: CreateInvoiceFromReservationInput
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();

    // 1. Obtener datos completos de la reserva
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select(`
        *,
        client:client_id (
          id,
          nombrePrincipal,
          apellido,
          email,
          telefono
        )
      `)
      .eq('id', input.reservationId)
      .single();

    if (reservationError || !reservation) {
      return { success: false, error: 'Reserva no encontrada.' };
    }

    // Verificar que la reserva esté finalizada
    if (reservation.status !== 'finalizada') {
      return { success: false, error: 'Solo se pueden crear facturas de reservas finalizadas.' };
    }

    // 2. Obtener productos de la reserva (sin JOIN automático)
    const { data: reservationProducts, error: productsError } = await supabase
      .from('reservation_products')
      .select('*')
      .eq('reservation_id', input.reservationId);

    if (productsError) {
      console.error('Error al obtener productos de la reserva:', productsError);
      // Solo retorna error si es un error real de consulta
      return { success: false, error: 'Error al obtener productos de la reserva.' };
    }

    // Enriquecer productos manualmente
    const invoiceLines = await Promise.all(
      (reservationProducts || []).map(async (product) => {
        let name = '';
        let description = '';
        let isRoom = false;
        if (product.product_type === 'modular_product' && product.modular_product_id) {
          const { data: modularProduct } = await supabase
            .from('products_modular')
            .select('name, description, category')
            .eq('id', product.modular_product_id)
            .single();
          if (modularProduct) {
            name = modularProduct.name || `Producto modular (ID: ${product.modular_product_id})`;
            description = modularProduct.description || '';
            if (modularProduct.category === 'alojamiento') isRoom = true;
          } else {
            name = `Producto eliminado (ID: ${product.modular_product_id})`;
            description = '';
          }
        } else if (product.product_id) {
          const { data: spaProduct } = await supabase
            .from('spa_products')
            .select('name, description, type, unit')
            .eq('id', product.product_id)
            .single();
          if (spaProduct) {
            name = spaProduct.name || `Producto spa (ID: ${product.product_id})`;
            description = spaProduct.description || '';
            if (spaProduct.type === 'HOSPEDAJE') isRoom = true;
          } else {
            name = `Producto eliminado (ID: ${product.product_id})`;
            description = '';
          }
        } else {
          name = 'Producto sin nombre';
          description = '';
        }
        // Si no hay descripción, usar el nombre como descripción
        if (!description) description = name;
        // Si es habitación, nombre especial
        if (isRoom) {
          name = `Habitación: ${name}`;
        }
        return {
          product_id: product.product_id || null,
          modular_product_id: product.modular_product_id || null,
          name,
          description,
          quantity: product.quantity,
          unit_price: product.unit_price,
          unit: spaProduct?.unit || 'UND', // Unidad de medida del producto
          discount_percent: 0,
          taxes: [19], // IVA
          subtotal: product.total_price
        };
      })
    );

    // 3. Obtener pagos de la reserva
    const { data: reservationPayments, error: paymentsError } = await supabase
      .from('reservation_payments')
      .select('*')
      .eq('reservation_id', input.reservationId)
      .order('created_at', { ascending: true });

    if (paymentsError) {
      console.error('Error al obtener pagos de la reserva:', paymentsError);
      // No es crítico, continuamos sin pagos
    }

    // 4. Verificar si ya existe una factura para esta reserva
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('id, number')
      .eq('reservation_id', input.reservationId)
      .single();

    if (existingInvoice) {
      return { 
        success: false, 
        error: `Ya existe una factura (${existingInvoice.number}) para esta reserva.` 
      };
    }

    // 5. Generar número de factura automático si no se proporciona
    let invoiceNumber = input.invoiceNumber;
    if (!invoiceNumber) {
      const { count } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true });

      const reservationNumber = String(input.reservationId).padStart(4, '0');
      invoiceNumber = `F-RES-${reservationNumber}-${String((count || 0) + 1).padStart(4, '0')}`;
    }

    // 6. Preparar líneas de factura
    // La lógica de enriquecimiento de productos ahora está en la consulta de reserva_products
    // y la creación de invoiceLines.

    // 7. Crear la factura
    const invoiceInput: CreateInvoiceInput = {
      number: invoiceNumber,
      client_id: reservation.client_id,
      reservation_id: reservation.id,
      status: 'draft', // Siempre en borrador para revisión
      total: reservation.total_amount,
      currency: 'CLP',
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 días
      notes: input.notes || `Factura generada automáticamente desde reserva #${reservation.id}`,
      payment_terms: input.paymentTerms || '30 días',
      lines: invoiceLines
    };

    const createResult = await createInvoice(invoiceInput);

    if (!createResult.success) {
      return createResult;
    }

    // 8. Si hay pagos en la reserva, transferirlos a la factura
    if (reservationPayments && reservationPayments.length > 0) {
      for (const payment of reservationPayments) {
        if (payment.status === 'completed') {
          const { error: paymentError } = await supabase
            .from('invoice_payments')
            .insert({
              invoice_id: createResult.data!.id,
              amount: payment.amount,
              payment_method: payment.payment_method,
              payment_date: payment.created_at.split('T')[0],
              reference_number: payment.reference_number,
              notes: `Transferido desde reserva #${reservation.id} - ${payment.notes || ''}`,
              processed_by: payment.processed_by,
              status: 'completed',
              created_at: payment.created_at,
              updated_at: new Date().toISOString()
            });

          if (paymentError) {
            console.error('Error al transferir pago:', paymentError);
            // No es crítico, la factura se creó correctamente
          }
        }
      }
    }

    // 9. Actualizar estado de la reserva para indicar que tiene factura
    await supabase
      .from('reservations')
      .update({ 
        status: 'facturada',
        updated_at: new Date().toISOString()
      })
      .eq('id', reservation.id);

    return {
      success: true,
      data: {
        invoice: createResult.data,
        reservation: {
          id: reservation.id,
          guest_name: reservation.guest_name,
          total_amount: reservation.total_amount,
          status: 'facturada'
        },
        transferred_payments: reservationPayments?.length || 0
      }
    };

  } catch (error) {
    console.error('Error inesperado al crear factura desde reserva:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
}

export async function getReservationForInvoice(
  reservationId: number
): Promise<{ success: boolean; data?: ReservationInvoiceData; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();

    // Obtener datos completos de la reserva
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select(`
        *,
        client:client_id (
          id,
          nombrePrincipal,
          apellido,
          email,
          telefono
        )
      `)
      .eq('id', reservationId)
      .single();

    if (reservationError || !reservation) {
      return { success: false, error: 'Reserva no encontrada.' };
    }

    // Obtener productos de la reserva (sin JOIN problemático)
    const { data: reservationProducts, error: productsError } = await supabase
      .from('reservation_products')
      .select('*')
      .eq('reservation_id', reservationId);

    if (productsError) {
      console.error('Error al obtener productos de la reserva:', productsError);
      return { success: false, error: 'Error al obtener productos.' };
    }

    // Enriquecer los productos con datos de productos modulares si es necesario
    const enrichedProducts = await Promise.all(
      (reservationProducts || []).map(async (product) => {
        let productName = 'Producto';
        let productDescription = '';
        
        if (product.product_type === 'modular_product' && product.modular_product_id) {
          // Obtener datos del producto modular por separado
          const { data: modularProduct } = await supabase
            .from('products_modular')
            .select('name, description')
            .eq('id', product.modular_product_id)
            .single();
          
          if (modularProduct) {
            productName = modularProduct.name || 'Producto Modular';
            productDescription = modularProduct.description || '';
          }
        } else if (product.product_id) {
          // Obtener datos del producto spa por separado
          const { data: spaProduct } = await supabase
            .from('spa_products')
            .select('name, description')
            .eq('id', product.product_id)
            .single();
          
          if (spaProduct) {
            productName = spaProduct.name || 'Producto Spa';
            productDescription = spaProduct.description || '';
          }
        }

        return {
          id: product.id,
          name: productName,
          description: productDescription,
          quantity: product.quantity,
          unit_price: product.unit_price,
          total_price: product.total_price
        };
      })
    );

    // Obtener pagos
    const { data: payments, error: paymentsError } = await supabase
      .from('reservation_payments')
      .select('*')
      .eq('reservation_id', reservationId)
      .order('created_at', { ascending: true });

    if (paymentsError) {
      return { success: false, error: 'Error al obtener pagos.' };
    }

    const data: ReservationInvoiceData = {
      reservation: {
        id: reservation.id,
        guest_name: reservation.guest_name,
        guest_email: reservation.guest_email,
        guest_phone: reservation.guest_phone,
        check_in: reservation.check_in,
        check_out: reservation.check_out,
        guests: reservation.guests,
        total_amount: reservation.total_amount,
        billing_name: reservation.billing_name,
        billing_rut: reservation.billing_rut,
        billing_address: reservation.billing_address,
        client_id: reservation.client_id,
        status: reservation.status
      },
      client: reservation.client ? {
        id: reservation.client.id,
        nombrePrincipal: reservation.client.nombrePrincipal,
        apellido: reservation.client.apellido || '',
        email: reservation.client.email || '',
        telefono: reservation.client.telefono || ''
      } : {
        id: 0,
        nombrePrincipal: reservation.guest_name,
        apellido: '',
        email: reservation.guest_email,
        telefono: reservation.guest_phone
      },
      products: enrichedProducts,
      payments: (payments || []).map(p => ({
        id: p.id,
        amount: p.amount,
        payment_method: p.payment_method,
        payment_date: p.created_at,
        reference_number: p.reference_number,
        notes: p.notes
      }))
    };

    return { success: true, data };

  } catch (error) {
    console.error('Error al obtener datos de reserva para factura:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
} 