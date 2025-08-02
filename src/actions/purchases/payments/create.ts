'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';

export interface CreatePurchasePaymentInput {
  purchase_invoice_id: number;
  amount: number;
  payment_method: string;
  payment_date: string;
  reference?: string;
  notes?: string;
  processed_by: string;
}

export async function createPurchasePayment(input: CreatePurchasePaymentInput): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log('🔍 Creando pago de factura de compra:', input);
    
    const supabase = await getSupabaseServerClient();

    // Crear el pago
    const { data: payment, error: paymentError } = await supabase
      .from('purchase_invoice_payments')
      .insert({
        purchase_invoice_id: input.purchase_invoice_id,
        amount: input.amount,
        payment_method: input.payment_method,
        payment_date: input.payment_date,
        reference: input.reference,
        notes: input.notes,
        processed_by: input.processed_by,
        status: 'completed'
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error al crear pago:', paymentError);
      return { success: false, error: 'Error al crear el pago.' };
    }

    // Obtener información de la factura para actualizar su estado
    const { data: invoice, error: invoiceError } = await supabase
      .from('purchase_invoices')
      .select('total')
      .eq('id', input.purchase_invoice_id)
      .single();

    if (invoiceError) {
      console.error('Error al obtener factura:', invoiceError);
      return { success: false, error: 'Error al obtener información de la factura.' };
    }

    // Calcular total pagado para esta factura
    const { data: allPayments } = await supabase
      .from('purchase_invoice_payments')
      .select('amount')
      .eq('purchase_invoice_id', input.purchase_invoice_id)
      .eq('status', 'completed');

    const totalPaid = (allPayments || []).reduce((sum, p) => sum + Number(p.amount), 0);
    const totalAmount = Number(invoice.total);

    // Actualizar estado de pago de la factura
    let newPaymentStatus = 'pending';
    if (totalPaid >= totalAmount) {
      newPaymentStatus = 'paid';
    } else if (totalPaid > 0) {
      newPaymentStatus = 'partial';
    }

    const { error: updateError } = await supabase
      .from('purchase_invoices')
      .update({ payment_status: newPaymentStatus })
      .eq('id', input.purchase_invoice_id);

    if (updateError) {
      console.error('Error al actualizar estado de factura:', updateError);
      // No retornamos error porque el pago sí se creó
    }

    console.log('✅ Pago creado exitosamente:', payment);
    return { success: true, data: payment };

  } catch (error) {
    console.error('Error inesperado al crear pago:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
}

/**
 * Actualizar pago de factura de compra
 */
export async function updatePurchasePayment(id: number, input: Partial<CreatePurchasePaymentInput>): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();

    const updateData: any = {};

    if (input.payment_date !== undefined) updateData.payment_date = input.payment_date;
    if (input.amount !== undefined) updateData.amount = input.amount;
    if (input.payment_method !== undefined) updateData.payment_method = input.payment_method;
    if (input.reference !== undefined) updateData.reference = input.reference;

    const { data: payment, error } = await supabase
      .from('purchase_payments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating purchase payment:', error);
      return { success: false, error: 'Error al actualizar el pago' };
    }

    // revalidatePath('/dashboard/purchases'); // This line was removed as per the new_code
    // revalidatePath('/dashboard/purchases/payments'); // This line was removed as per the new_code

    return {
      success: true,
      data: payment,
    };
  } catch (error) {
    console.error('Error in updatePurchasePayment:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Eliminar pago de factura de compra
 */
export async function deletePurchasePayment(id: number): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();

    // Obtener el pago antes de eliminarlo
    const { data: payment, error: getError } = await supabase
      .from('purchase_payments')
      .select('invoice_id, amount')
      .eq('id', id)
      .single();

    if (getError) {
      console.error('Error getting purchase payment:', getError);
      return { success: false, error: 'Error al obtener el pago' };
    }

    // Eliminar el pago
    const { error: deleteError } = await supabase
      .from('purchase_payments')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting purchase payment:', deleteError);
      return { success: false, error: 'Error al eliminar el pago' };
    }

    // Recalcular estado de la factura
    const { data: invoice } = await supabase
      .from('purchase_invoices')
      .select('id, total')
      .eq('id', payment.invoice_id)
      .single();

    if (invoice) {
      const { data: remainingPayments } = await supabase
        .from('purchase_payments')
        .select('amount')
        .eq('invoice_id', payment.invoice_id);

      const totalPaid = remainingPayments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      let newStatus = 'draft';
      if (totalPaid >= invoice.total) {
        newStatus = 'paid';
      } else if (totalPaid > 0) {
        newStatus = 'sent';
      }

      await supabase
        .from('purchase_invoices')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.invoice_id);
    }

    // revalidatePath('/dashboard/purchases'); // This line was removed as per the new_code
    // revalidatePath('/dashboard/purchases/payments'); // This line was removed as per the new_code
    // revalidatePath(`/dashboard/purchases/invoices/${payment.invoice_id}`); // This line was removed as per the new_code

    return {
      success: true,
      data: { id },
    };
  } catch (error) {
    console.error('Error in deletePurchasePayment:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Obtener métodos de pago disponibles
 */
export async function getAvailablePaymentMethods(): Promise<{
  success: boolean;
  data?: string[];
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();

    const { data: methods, error } = await supabase
      .from('purchase_payments')
      .select('payment_method')
      .not('payment_method', 'is', null);

    if (error) {
      console.error('Error getting payment methods:', error);
      return { success: false, error: 'Error al obtener los métodos de pago' };
    }

    const uniqueMethods = [...new Set(methods?.map(p => p.payment_method) || [])];

    // Agregar métodos estándar si no existen
    const standardMethods = [
      'cash',
      'bank_transfer',
      'credit_card',
      'debit_card',
      'check',
      'electronic_payment',
    ];

    const allMethods = [...new Set([...uniqueMethods, ...standardMethods])];

    return {
      success: true,
      data: allMethods,
    };
  } catch (error) {
    console.error('Error in getAvailablePaymentMethods:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Obtener resumen de pagos por factura
 */
export async function getPaymentSummaryByInvoice(invoiceId: number): Promise<{
  success: boolean;
  data?: {
    totalInvoice: number;
    totalPaid: number;
    remaining: number;
    paymentCount: number;
    lastPaymentDate?: string;
  };
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();

    // Obtener total de la factura
    const { data: invoice } = await supabase
      .from('purchase_invoices')
      .select('total')
      .eq('id', invoiceId)
      .single();

    if (!invoice) {
      return { success: false, error: 'Factura no encontrada' };
    }

    // Obtener pagos
    const { data: payments } = await supabase
      .from('purchase_payments')
      .select('amount, payment_date')
      .eq('invoice_id', invoiceId)
      .order('payment_date', { ascending: false });

    const totalPaid = payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
    const remaining = invoice.total - totalPaid;
    const paymentCount = payments?.length || 0;
    const lastPaymentDate = payments?.[0]?.payment_date;

    return {
      success: true,
      data: {
        totalInvoice: invoice.total,
        totalPaid,
        remaining,
        paymentCount,
        lastPaymentDate,
      },
    };
  } catch (error) {
    console.error('Error in getPaymentSummaryByInvoice:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
} 