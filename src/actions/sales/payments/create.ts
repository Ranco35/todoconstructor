'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';

export interface CreatePaymentInput {
  invoice_id: number;
  amount: number;
  payment_method: string;
  payment_date?: string;
  reference_number?: string;
  notes?: string;
  bank_account_id?: number;
  processed_by?: string; // UUID del usuario
}

export interface Payment {
  id: number;
  invoiceId: number;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  referenceNumber?: string;
  notes?: string;
  bankAccountId?: number;
  processedBy?: string;
  createdAt: string;
  updatedAt: string;
  status: string;
}

export interface PaymentSummary {
  totalPaid: number;
  remainingBalance: number;
  payments: Payment[];
  invoiceTotal: number;
  isFullyPaid: boolean;
}

const PAYMENT_METHODS = [
  'cash', 'bank_transfer', 'credit_card', 'debit_card', 
  'check', 'online_payment', 'crypto', 'other'
] as const;

export async function createPayment(input: CreatePaymentInput): Promise<{ success: boolean; data?: Payment; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();

    // Validaciones básicas
    if (!input.invoice_id) {
      return { success: false, error: 'ID de factura es obligatorio.' };
    }

    if (!input.amount || input.amount <= 0) {
      return { success: false, error: 'El monto del pago debe ser mayor a 0.' };
    }

    if (!input.payment_method || !PAYMENT_METHODS.includes(input.payment_method as any)) {
      return { success: false, error: 'Método de pago inválido.' };
    }

    // Verificar que la factura existe y obtener información
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, total, status')
      .eq('id', input.invoice_id)
      .single();

    if (invoiceError || !invoice) {
      return { success: false, error: 'Factura no encontrada.' };
    }

    if (invoice.status === 'paid') {
      return { success: false, error: 'Esta factura ya está completamente pagada.' };
    }

    if (invoice.status === 'cancelled') {
      return { success: false, error: 'No se pueden registrar pagos en facturas canceladas.' };
    }

    // Obtener pagos existentes para calcular saldo
    const { data: existingPayments } = await supabase
      .from('invoice_payments')
      .select('amount')
      .eq('invoice_id', input.invoice_id)
      .eq('status', 'completed');

    const totalPaid = (existingPayments || []).reduce((sum, payment) => sum + Number(payment.amount), 0);
    const remainingBalance = Number(invoice.total) - totalPaid;

    // Validar que el pago no exceda el saldo pendiente
    if (input.amount > remainingBalance) {
      return { 
        success: false, 
        error: `El monto del pago ($${input.amount.toLocaleString('es-CL')}) excede el saldo pendiente ($${remainingBalance.toLocaleString('es-CL')}).` 
      };
    }

    // Insertar el pago
    const { data: payment, error: paymentError } = await supabase
      .from('invoice_payments')
      .insert({
        invoice_id: input.invoice_id,
        amount: input.amount,
        payment_method: input.payment_method,
        payment_date: input.payment_date || new Date().toISOString(),
        reference_number: input.reference_number,
        notes: input.notes,
        bank_account_id: input.bank_account_id,
        processed_by: input.processed_by,
        status: 'completed',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error al crear pago:', paymentError);
      return { success: false, error: 'Error al registrar el pago.' };
    }

    // Calcular nuevo saldo después del pago
    const newTotalPaid = totalPaid + input.amount;
    const newRemainingBalance = Number(invoice.total) - newTotalPaid;

    // Actualizar estado de la factura si está completamente pagada
    let newInvoiceStatus = invoice.status;
    if (newRemainingBalance <= 0.01) { // Considerando centavos
      newInvoiceStatus = 'paid';
      
      await supabase
        .from('invoices')
        .update({ 
          status: 'paid',
          updated_at: new Date().toISOString() 
        })
        .eq('id', input.invoice_id);
    } else if (invoice.status === 'overdue' && newTotalPaid > 0) {
      // Si había facturas vencidas y se hace un pago, cambiar a enviada
      newInvoiceStatus = 'sent';
      
      await supabase
        .from('invoices')
        .update({ 
          status: 'sent',
          updated_at: new Date().toISOString() 
        })
        .eq('id', input.invoice_id);
    }

    // Formatear respuesta
    const result: Payment = {
      id: payment.id,
      invoiceId: payment.invoice_id,
      amount: Number(payment.amount),
      paymentMethod: payment.payment_method,
      paymentDate: payment.payment_date,
      referenceNumber: payment.reference_number,
      notes: payment.notes,
      bankAccountId: payment.bank_account_id,
      processedBy: payment.processed_by,
      createdAt: payment.created_at,
      updatedAt: payment.updated_at,
      status: payment.status
    };

    return { success: true, data: result };

  } catch (error) {
    console.error('Error inesperado al crear pago:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
}

export async function getPaymentSummary(invoiceId: number): Promise<{ success: boolean; data?: PaymentSummary; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();

    // Obtener información de la factura
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, total, status')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return { success: false, error: 'Factura no encontrada.' };
    }

    // Obtener todos los pagos de la factura
    const { data: payments, error: paymentsError } = await supabase
      .from('invoice_payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('payment_date', { ascending: false });

    if (paymentsError) {
      console.error('Error al obtener pagos:', paymentsError);
      return { success: false, error: 'Error al obtener pagos.' };
    }

    // Calcular totales
    const totalPaid = (payments || []).reduce((sum, payment) => sum + Number(payment.amount), 0);
    const invoiceTotal = Number(invoice.total);
    const remainingBalance = invoiceTotal - totalPaid;
    const isFullyPaid = remainingBalance <= 0.01;

    // Formatear pagos
    const formattedPayments: Payment[] = (payments || []).map(payment => ({
      id: payment.id,
      invoiceId: payment.invoice_id,
      amount: Number(payment.amount),
      paymentMethod: payment.payment_method,
      paymentDate: payment.payment_date,
      referenceNumber: payment.reference_number,
      notes: payment.notes,
      bankAccountId: payment.bank_account_id,
      processedBy: payment.processed_by,
      createdAt: payment.created_at,
      updatedAt: payment.updated_at,
      status: payment.status
    }));

    const summary: PaymentSummary = {
      totalPaid,
      remainingBalance: Math.max(0, remainingBalance),
      payments: formattedPayments,
      invoiceTotal,
      isFullyPaid
    };

    return { success: true, data: summary };

  } catch (error) {
    console.error('Error inesperado al obtener resumen de pagos:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
}

export async function cancelPayment(paymentId: number, reason?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();

    // Obtener información del pago
    const { data: payment, error: paymentError } = await supabase
      .from('invoice_payments')
      .select('*, invoices(total, status)')
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      return { success: false, error: 'Pago no encontrado.' };
    }

    if (payment.status === 'cancelled') {
      return { success: false, error: 'Este pago ya está cancelado.' };
    }

    // Cancelar el pago
    await supabase
      .from('invoice_payments')
      .update({
        status: 'cancelled',
        notes: payment.notes ? `${payment.notes}\n[CANCELADO: ${reason || 'Sin razón especificada'}]` : `[CANCELADO: ${reason || 'Sin razón especificada'}]`,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId);

    // Recalcular estado de la factura
    const { data: remainingPayments } = await supabase
      .from('invoice_payments')
      .select('amount')
      .eq('invoice_id', payment.invoice_id)
      .eq('status', 'completed');

    const totalPaid = (remainingPayments || []).reduce((sum, p) => sum + Number(p.amount), 0);
    const remainingBalance = Number(payment.invoices.total) - totalPaid;

    // Actualizar estado de factura si es necesario
    if (remainingBalance > 0.01 && payment.invoices.status === 'paid') {
      await supabase
        .from('invoices')
        .update({
          status: 'sent',
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.invoice_id);
    }

    return { success: true };

  } catch (error) {
    console.error('Error inesperado al cancelar pago:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
} 