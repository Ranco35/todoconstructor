'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';

export interface CreateBulkPurchasePaymentInput {
  amount: number;
  payment_method: string;
  payment_date: string;
  reference: string;
  notes?: string;
  invoice_ids: number[];
  processed_by?: string;
}

export async function createBulkPurchasePayment(input: CreateBulkPurchasePaymentInput): Promise<{ 
  success: boolean; 
  data?: any; 
  error?: string 
}> {
  try {
    console.log('🔍 Creando pago múltiple de facturas:', input);
    
    const supabase = await getSupabaseServerClient();

    // Validar que las facturas existen y están pendientes de pago
    const { data: invoices, error: invoicesError } = await supabase
      .from('purchase_invoices')
      .select('id, total, payment_status, supplier_name')
      .in('id', input.invoice_ids);

    if (invoicesError) {
      console.error('Error al obtener facturas:', invoicesError);
      return { success: false, error: 'Error al obtener información de las facturas.' };
    }

    if (!invoices || invoices.length !== input.invoice_ids.length) {
      return { success: false, error: 'Algunas facturas no fueron encontradas.' };
    }

    // Verificar que todas las facturas se pueden pagar
    const unpayableInvoices = invoices.filter(invoice => 
      invoice.payment_status === 'paid'
    );

    if (unpayableInvoices.length > 0) {
      return { 
        success: false, 
        error: `Las siguientes facturas ya están pagadas completamente: ${unpayableInvoices.map(inv => inv.id).join(', ')}` 
      };
    }

    // Calcular el total de todas las facturas
    const totalInvoicesAmount = invoices.reduce((sum, invoice) => sum + Number(invoice.total), 0);

    // Validar que el monto del pago coincide con el total de las facturas
    if (Math.abs(input.amount - totalInvoicesAmount) > 0.01) {
      return { 
        success: false, 
        error: `El monto del pago ($${input.amount.toLocaleString('es-CL')}) no coincide con el total de las facturas ($${totalInvoicesAmount.toLocaleString('es-CL')})` 
      };
    }

    // Iniciar transacción - crear todos los pagos
    const paymentPromises = invoices.map(async (invoice) => {
      // Crear el pago individual para cada factura
      const { data: payment, error: paymentError } = await supabase
        .from('purchase_invoice_payments')
        .insert({
          purchase_invoice_id: invoice.id,
          amount: invoice.total, // Pagar el total de cada factura
          payment_method: input.payment_method,
          payment_date: input.payment_date,
          reference: input.reference,
          notes: `${input.notes || ''} | Pago múltiple - Factura ${invoice.id}`.trim(),
          processed_by: input.processed_by,
          status: 'completed'
        })
        .select()
        .single();

      if (paymentError) {
        console.error(`Error al crear pago para factura ${invoice.id}:`, paymentError);
        throw new Error(`Error al crear pago para factura ${invoice.id}`);
      }

      // Actualizar el estado de pago de la factura a 'paid'
      const { error: updateError } = await supabase
        .from('purchase_invoices')
        .update({ payment_status: 'paid' })
        .eq('id', invoice.id);

      if (updateError) {
        console.error(`Error al actualizar estado de factura ${invoice.id}:`, updateError);
        // No lanzamos error porque el pago sí se creó
      }

      return payment;
    });

    // Ejecutar todos los pagos
    const payments = await Promise.all(paymentPromises);

    // Crear un registro de pago múltiple para referencia (opcional)
    const { data: bulkPaymentRecord, error: bulkError } = await supabase
      .from('bulk_purchase_payments')
      .insert({
        total_amount: input.amount,
        payment_method: input.payment_method,
        payment_date: input.payment_date,
        reference: input.reference,
        notes: input.notes,
        invoice_count: input.invoice_ids.length,
        invoice_ids: input.invoice_ids,
        processed_by: input.processed_by,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    // Si la tabla bulk_purchase_payments no existe, creamos la información de respuesta sin ella
    const responseData = {
      payments: payments,
      total_amount: input.amount,
      invoice_count: input.invoice_ids.length,
      payment_method: input.payment_method,
      reference: input.reference,
      bulk_payment_id: bulkPaymentRecord?.id || null
    };

    console.log('✅ Pago múltiple creado exitosamente:', responseData);
    return { success: true, data: responseData };

  } catch (error) {
    console.error('Error inesperado al crear pago múltiple:', error);
    
    // Si hay error, intentar hacer rollback de los pagos creados
    try {
      const supabase = await getSupabaseServerClient();
      
      // Obtener todos los pagos que se pudieron haber creado para estos invoice_ids hoy
      const { data: recentPayments } = await supabase
        .from('purchase_invoice_payments')
        .select('id, purchase_invoice_id')
        .in('purchase_invoice_id', input.invoice_ids)
        .eq('reference', input.reference)
        .gte('created_at', new Date().toISOString().split('T')[0]);

      if (recentPayments && recentPayments.length > 0) {
        console.log('🔄 Haciendo rollback de pagos creados...');
        
        // Eliminar pagos creados
        await supabase
          .from('purchase_invoice_payments')
          .delete()
          .in('id', recentPayments.map(p => p.id));

        // Restaurar estados de facturas a su estado anterior
        for (const payment of recentPayments) {
          // Recalcular estado de pago para cada factura
          const { data: remainingPayments } = await supabase
            .from('purchase_invoice_payments')
            .select('amount')
            .eq('purchase_invoice_id', payment.purchase_invoice_id)
            .eq('status', 'completed');

          const { data: invoice } = await supabase
            .from('purchase_invoices')
            .select('total')
            .eq('id', payment.purchase_invoice_id)
            .single();

          if (invoice) {
            const totalPaid = (remainingPayments || []).reduce((sum, p) => sum + Number(p.amount), 0);
            const totalAmount = Number(invoice.total);

            let newPaymentStatus = 'pending';
            if (totalPaid >= totalAmount) {
              newPaymentStatus = 'paid';
            } else if (totalPaid > 0) {
              newPaymentStatus = 'partial';
            }

            await supabase
              .from('purchase_invoices')
              .update({ payment_status: newPaymentStatus })
              .eq('id', payment.purchase_invoice_id);
          }
        }
      }
    } catch (rollbackError) {
      console.error('Error durante rollback:', rollbackError);
    }

    return { success: false, error: 'Error interno del servidor al procesar el pago múltiple.' };
  }
}