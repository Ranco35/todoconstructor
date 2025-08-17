'use server';

import type { PurchasePayment } from '@/types/database';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export interface ListPurchasePaymentsInput {
  page?: number;
  pageSize?: number;
  purchaseInvoiceId?: number;
  paymentMethod?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface PurchasePaymentWithDetails {
  id: number;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  reference?: string;
  notes?: string;
  status: string;
  processedBy: string;
  createdAt: string;
  updatedAt: string;
  purchaseInvoice?: {
    id: number;
    invoiceNumber: string;
    totalAmount: number;
    supplier?: {
      id: number;
      name: string;
      vat?: string;
    };
  };
}

export interface PurchasePaymentListResponse {
  payments: PurchasePaymentWithDetails[];
  pagination: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalCount: number;
  };
}

export async function listPurchasePayments(input: ListPurchasePaymentsInput = {}): Promise<{ success: boolean; data?: PurchasePaymentListResponse; error?: string }> {
  try {
    const {
      page = 1,
      pageSize = 20,
      purchaseInvoiceId,
      paymentMethod,
      status,
      startDate,
      endDate
    } = input;

    console.log('🔍 Listando pagos de compras con filtros:', { page, pageSize, purchaseInvoiceId, paymentMethod, status, startDate, endDate });

    const supabase = await getSupabaseServerClient();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Construir query base con JOINs
    let query = supabase
      .from('purchase_invoice_payments')
      .select(`
        *,
        purchase_invoices!purchase_invoice_id (
          id,
          number,
          total,
          Supplier!supplier_id (
            id,
            name,
            vat
          )
        )
      `, { count: 'exact' });

    // Aplicar filtros
    if (purchaseInvoiceId) {
      query = query.eq('purchase_invoice_id', purchaseInvoiceId);
    }

    if (paymentMethod) {
      query = query.eq('payment_method', paymentMethod);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (startDate) {
      query = query.gte('payment_date', startDate);
    }

    if (endDate) {
      query = query.lte('payment_date', endDate);
    }

    // Aplicar paginación y ordenamiento
    const { data: payments, error, count } = await query
      .range(from, to)
      .order('payment_date', { ascending: false });

    if (error) {
      console.error('Error al listar pagos de compras:', error);
      return { success: false, error: 'Error al obtener los pagos.' };
    }

    // Mapear los datos con nombres amigables
    const paymentsWithDetails: PurchasePaymentWithDetails[] = (payments || []).map(payment => ({
      id: payment.id,
      amount: Number(payment.amount),
      paymentMethod: payment.payment_method,
      paymentDate: payment.payment_date,
      reference: payment.reference,
      notes: payment.notes,
      processedBy: payment.processed_by,
      createdAt: payment.created_at,
      updatedAt: payment.updated_at,
      status: payment.status,
      purchaseInvoice: payment.purchase_invoices ? {
        id: payment.purchase_invoices.id,
        invoiceNumber: payment.purchase_invoices.number,
        totalAmount: Number(payment.purchase_invoices.total),
        supplier: payment.purchase_invoices.Supplier ? {
          id: payment.purchase_invoices.Supplier.id,
          name: payment.purchase_invoices.Supplier.name,
          vat: payment.purchase_invoices.Supplier.vat
        } : undefined
      } : undefined
    }));

    const totalPages = Math.ceil((count || 0) / pageSize);

    return {
      success: true,
      data: {
        payments: paymentsWithDetails,
        pagination: {
          currentPage: page,
          totalPages,
          pageSize,
          totalCount: count || 0
        }
      }
    };

  } catch (error) {
    console.error('Error inesperado al listar pagos de compras:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
}

/**
 * Obtener estadísticas de pagos de compras
 */
export async function getPurchasePaymentStats(): Promise<{
  success: boolean;
  data?: {
    totalPayments: number;
    totalAmount: number;
    averagePayment: number;
    paymentsByMethod: { [method: string]: number };
    paymentsByStatus: { [status: string]: number };
    recentPayments: PurchasePaymentWithDetails[];
  };
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();

    // Obtener todos los pagos para estadísticas
    const { data: allPayments, error } = await supabase
      .from('purchase_invoice_payments')
      .select(`
        *,
        purchase_invoices!purchase_invoice_id (
          id,
          number,
          total,
          Supplier!supplier_id (
            id,
            name,
            vat
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener estadísticas de pagos:', error);
      return { success: false, error: 'Error al obtener estadísticas.' };
    }

    const payments = allPayments || [];
    const totalPayments = payments.length;
    const totalAmount = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const averagePayment = totalPayments > 0 ? totalAmount / totalPayments : 0;

    // Agrupar por método de pago
    const paymentsByMethod: { [method: string]: number } = {};
    payments.forEach(payment => {
      const method = payment.payment_method || 'Sin especificar';
      paymentsByMethod[method] = (paymentsByMethod[method] || 0) + 1;
    });

    // Agrupar por estado
    const paymentsByStatus: { [status: string]: number } = {};
    payments.forEach(payment => {
      const status = payment.status || 'Sin estado';
      paymentsByStatus[status] = (paymentsByStatus[status] || 0) + 1;
    });

    // Obtener pagos recientes (últimos 5)
    const recentPayments: PurchasePaymentWithDetails[] = payments.slice(0, 5).map(payment => ({
      id: payment.id,
      amount: Number(payment.amount),
      paymentMethod: payment.payment_method,
      paymentDate: payment.payment_date,
      reference: payment.reference,
      notes: payment.notes,
      processedBy: payment.processed_by,
      createdAt: payment.created_at,
      updatedAt: payment.updated_at,
      status: payment.status,
      purchaseInvoice: payment.purchase_invoices ? {
        id: payment.purchase_invoices.id,
        invoiceNumber: payment.purchase_invoices.number,
        totalAmount: Number(payment.purchase_invoices.total),
        supplier: payment.purchase_invoices.Supplier ? {
          id: payment.purchase_invoices.Supplier.id,
          name: payment.purchase_invoices.Supplier.name,
          vat: payment.purchase_invoices.Supplier.vat
        } : undefined
      } : undefined
    }));

    return {
      success: true,
      data: {
        totalPayments,
        totalAmount,
        averagePayment,
        paymentsByMethod,
        paymentsByStatus,
        recentPayments
      }
    };

  } catch (error) {
    console.error('Error inesperado al obtener estadísticas de pagos:', error);
    return { success: false, error: 'Error interno del servidor.' };
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

export async function getPurchaseInvoicesForPayment(paymentStatusFilter?: string): Promise<{ success: boolean; data?: Array<{ id: number; invoiceNumber: string; supplierName: string; totalAmount: number; remainingBalance: number; payment_status?: string }>; error?: string }> {
  try {
    console.log('🔍 getPurchaseInvoicesForPayment: Iniciando con filtro:', paymentStatusFilter);
    const supabase = await getSupabaseServerClient();

    let query = supabase
      .from('purchase_invoices')
      .select(`
        id,
        number,
        total,
        payment_status,
        Supplier!supplier_id (
          name
        )
      `);

    // Aplicar filtro según el estado de pago
    if (paymentStatusFilter && paymentStatusFilter !== 'all') {
      query = query.eq('payment_status', paymentStatusFilter);
      console.log('🔍 Filtrando por payment_status:', paymentStatusFilter);
    } else if (!paymentStatusFilter) {
      // Si no hay filtro, mostrar solo pendientes y parciales (comportamiento original)
      query = query.in('payment_status', ['pending', 'partial']);
      console.log('🔍 Sin filtro: mostrando solo pending/partial');
    } else {
      // Si filtro es 'all', obtener todas las facturas
      console.log('🔍 Filtro "all": mostrando todas las facturas');
    }

    query = query.order('created_at', { ascending: false });

    const { data: invoices, error } = await query;

    console.log('📊 Facturas obtenidas:', invoices?.length || 0);

    if (error) {
      console.error('❌ Error obteniendo facturas:', error);
      return { success: false, error: 'Error al obtener facturas para pago' };
    }

    // Para cada factura, calcular el saldo pendiente
    const invoicesWithBalance = await Promise.all(
      (invoices || []).map(async (invoice) => {
        const { data: payments } = await supabase
          .from('purchase_invoice_payments')
          .select('amount')
          .eq('purchase_invoice_id', invoice.id);

        const totalPaid = (payments || []).reduce((sum, payment) => sum + Number(payment.amount), 0);
        const remainingBalance = Number(invoice.total) - totalPaid;

        return {
          id: invoice.id,
          invoiceNumber: invoice.number,
          supplierName: invoice.Supplier?.name || 'Proveedor desconocido',
          totalAmount: Number(invoice.total),
          remainingBalance: Math.max(0, remainingBalance),
          payment_status: invoice.payment_status || 'pending'
        };
      })
    );

    // Filtrar solo facturas con saldo pendiente
    const pendingInvoices = invoicesWithBalance.filter(invoice => invoice.remainingBalance > 0.01);

    console.log('💰 Facturas con saldo pendiente:', pendingInvoices.length);
    console.log('📋 Lista de facturas:', pendingInvoices.map(inv => ({ 
      id: inv.id, 
      invoiceNumber: inv.invoiceNumber, 
      supplierName: inv.supplierName,
      remainingBalance: inv.remainingBalance 
    })));

    return { success: true, data: pendingInvoices };

  } catch (error) {
    console.error('Error inesperado al obtener facturas para pago:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
} 