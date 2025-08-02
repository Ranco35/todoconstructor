'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';

export interface SalesStats {
  totalInvoices: number;
  totalPayments: number;
  totalRevenue: number;
  pendingInvoices: number;
  revenueToday: number;
  paymentsThisMonth: number;
}

export async function getSalesStats(): Promise<SalesStats> {
  try {
    const supabase = await getSupabaseServerClient();

    // Obtener estadísticas de facturas
    const { data: invoicesStats, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .not('status', 'eq', 'cancelled');

    if (invoicesError) {
      console.error('Error obteniendo estadísticas de facturas:', invoicesError);
    }

    // Obtener estadísticas de pagos
    const { data: paymentsStats, error: paymentsError } = await supabase
      .from('invoice_payments')
      .select('*');

    if (paymentsError) {
      console.error('Error obteniendo estadísticas de pagos:', paymentsError);
    }

    // Calcular estadísticas
    const totalInvoices = invoicesStats?.length || 0;
    const totalPayments = paymentsStats?.length || 0;
    const totalRevenue = paymentsStats?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
    const pendingInvoices = invoicesStats?.filter(inv => inv.status === 'sent' || inv.status === 'overdue').length || 0;

    // Ingresos de hoy
    const today = new Date().toISOString().split('T')[0];
    const revenueToday = paymentsStats?.filter(payment => 
      payment.payment_date?.startsWith(today)
    ).reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

    // Pagos de este mes
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const paymentsThisMonth = paymentsStats?.filter(payment => 
      payment.payment_date?.startsWith(currentMonth)
    ).length || 0;

    return {
      totalInvoices,
      totalPayments,
      totalRevenue,
      pendingInvoices,
      revenueToday,
      paymentsThisMonth
    };

  } catch (error) {
    console.error('Error obteniendo estadísticas de ventas:', error);
    return {
      totalInvoices: 0,
      totalPayments: 0,
      totalRevenue: 0,
      pendingInvoices: 0,
      revenueToday: 0,
      paymentsThisMonth: 0
    };
  }
}

 