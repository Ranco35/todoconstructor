'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import type { Payment } from './create';

export interface PaymentFilters {
  invoiceId?: number;
  paymentMethod?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  clientId?: number;
}

export interface PaymentWithDetails extends Payment {
  invoice: {
    id: number;
    number: string;
    total: number;
    client: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
    } | null;
  } | null;
}

export interface PaymentListResponse {
  payments: PaymentWithDetails[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ListPaymentsInput {
  page?: number;
  pageSize?: number;
  filters?: PaymentFilters;
}

export async function listPayments(input: ListPaymentsInput = {}): Promise<{ success: boolean; data?: PaymentListResponse; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      page = 1,
      pageSize = 20,
      filters = {}
    } = input;

    // Calcular offset
    const offset = (page - 1) * pageSize;

    // Construir query base con JOINs
    let query = supabase
      .from('invoice_payments')
      .select(`
        *,
        invoice:invoice_id (
          id,
          number,
          total,
          client:client_id (
            id,
            firstName,
            lastName,
            email
          )
        )
      `, { count: 'exact' });

    // Aplicar filtros
    if (filters.invoiceId) {
      query = query.eq('invoice_id', filters.invoiceId);
    }

    if (filters.paymentMethod) {
      query = query.eq('payment_method', filters.paymentMethod);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.dateFrom) {
      query = query.gte('payment_date', filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.lte('payment_date', filters.dateTo);
    }

    if (filters.search) {
      query = query.or(`reference_number.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
    }

    // Aplicar paginación y ordenamiento
    query = query
      .order('payment_date', { ascending: false })
      .range(offset, offset + pageSize - 1);

    const { data: payments, error, count } = await query;

    if (error) {
      console.error('Error al listar pagos:', error);
      return { success: false, error: 'Error al obtener pagos.' };
    }

    // Formatear pagos con detalles
    const paymentsWithDetails: PaymentWithDetails[] = (payments || []).map(payment => ({
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
      status: payment.status,
      invoice: payment.invoice ? {
        id: payment.invoice.id,
        number: payment.invoice.number,
        total: Number(payment.invoice.total),
        client: payment.invoice.client ? {
          id: payment.invoice.client.id,
          firstName: payment.invoice.client.firstName || '',
          lastName: payment.invoice.client.lastName || '',
          email: payment.invoice.client.email || ''
        } : null
      } : null
    }));

    const totalPages = Math.ceil((count || 0) / pageSize);

    return {
      success: true,
      data: {
        payments: paymentsWithDetails,
        total: count || 0,
        page,
        pageSize,
        totalPages
      }
    };

  } catch (error) {
    console.error('Error inesperado al listar pagos:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
}

export async function getPaymentStats(): Promise<{ success: boolean; data?: { byMethod: Record<string, { count: number; amount: number }>; byStatus: Record<string, number>; totalAmount: number; thisMonth: number; todayAmount: number; pendingInvoices: number }; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();

    // Estadísticas por método de pago
    const { data: paymentStats } = await supabase
      .from('invoice_payments')
      .select('payment_method, amount, status, payment_date')
      .eq('status', 'completed')
      .order('payment_date', { ascending: false });

    // Agrupar por método de pago
    const byMethod: Record<string, { count: number; amount: number }> = {};
    const byStatus: Record<string, number> = {};
    let totalAmount = 0;

    (paymentStats || []).forEach(payment => {
      const method = payment.payment_method;
      const amount = Number(payment.amount);
      
      // Por método
      if (!byMethod[method]) {
        byMethod[method] = { count: 0, amount: 0 };
      }
      byMethod[method].count += 1;
      byMethod[method].amount += amount;
      
      // Por estado
      byStatus[payment.status] = (byStatus[payment.status] || 0) + 1;
      
      totalAmount += amount;
    });

    // Pagos de este mes
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const { count: thisMonth } = await supabase
      .from('invoice_payments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('payment_date', firstDayOfMonth.toISOString());

    // Pagos de hoy
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const { data: todayPayments } = await supabase
      .from('invoice_payments')
      .select('amount')
      .eq('status', 'completed')
      .gte('payment_date', todayStart.toISOString())
      .lte('payment_date', todayEnd.toISOString());

    const todayAmount = (todayPayments || []).reduce((sum, payment) => sum + Number(payment.amount), 0);

    // Facturas pendientes de pago
    const { count: pendingInvoices } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .in('status', ['sent', 'overdue']);

    return {
      success: true,
      data: {
        byMethod,
        byStatus,
        totalAmount,
        thisMonth: thisMonth || 0,
        todayAmount,
        pendingInvoices: pendingInvoices || 0
      }
    };

  } catch (error) {
    console.error('Error al obtener estadísticas de pagos:', error);
    return { success: false, error: 'Error al obtener estadísticas.' };
  }
}

export async function getPaymentMethodLabels(): Promise<Record<string, string>> {
  return {
    'cash': 'Efectivo',
    'bank_transfer': 'Transferencia Bancaria',
    'credit_card': 'Tarjeta de Crédito',
    'debit_card': 'Tarjeta de Débito',
    'check': 'Cheque',
    'online_payment': 'Pago Online',
    'crypto': 'Criptomoneda',
    'other': 'Otro'
  };
}

export async function getInvoicesForPayment(): Promise<{ success: boolean; data?: Array<{ id: number; number: string; clientName: string; total: number; remainingBalance: number }>; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();

    // Obtener facturas que no están completamente pagadas
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select(`
        id,
        number,
        total,
        client:client_id (
          firstName,
          lastName
        )
      `)
      .in('status', ['sent', 'overdue'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener facturas para pago:', error);
      return { success: false, error: 'Error al obtener facturas.' };
    }

    // Para cada factura, calcular el saldo pendiente
    const invoicesWithBalance = await Promise.all(
      (invoices || []).map(async (invoice) => {
        const { data: payments } = await supabase
          .from('invoice_payments')
          .select('amount')
          .eq('invoice_id', invoice.id)
          .eq('status', 'completed');

        const totalPaid = (payments || []).reduce((sum, payment) => sum + Number(payment.amount), 0);
        const remainingBalance = Number(invoice.total) - totalPaid;

        return {
          id: invoice.id,
          number: invoice.number,
          clientName: invoice.client 
            ? `${invoice.client.firstName || ''} ${invoice.client.lastName || ''}`.trim()
            : 'Cliente desconocido',
          total: Number(invoice.total),
          remainingBalance: Math.max(0, remainingBalance)
        };
      })
    );

    // Filtrar solo facturas con saldo pendiente
    const pendingInvoices = invoicesWithBalance.filter(invoice => invoice.remainingBalance > 0.01);

    return { success: true, data: pendingInvoices };

  } catch (error) {
    console.error('Error inesperado al obtener facturas para pago:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
} 