'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import { PurchaseStats } from '@/types/purchases';

/**
 * Obtener estadísticas completas del módulo de compras
 */
export async function getPurchaseStats(): Promise<PurchaseStats> {
  try {
    const supabase = await getSupabaseServerClient();

    // Obtener total de órdenes
    const { count: totalOrders } = await supabase
      .from('purchase_orders')
      .select('*', { count: 'exact', head: true });

    // Obtener total de facturas
    const { count: totalInvoices } = await supabase
      .from('purchase_invoices')
      .select('*', { count: 'exact', head: true });

    // Obtener total de pagos
    const { count: totalPayments } = await supabase
      .from('purchase_payments')
      .select('*', { count: 'exact', head: true });

    // Obtener total gastado (suma de todas las facturas)
    const { data: invoices } = await supabase
      .from('purchase_invoices')
      .select('total');

    const totalSpent = invoices?.reduce((sum, invoice) => sum + (invoice.total || 0), 0) || 0;

    // Obtener órdenes pendientes (draft, sent, approved)
    const { count: pendingOrders } = await supabase
      .from('purchase_orders')
      .select('*', { count: 'exact', head: true })
      .in('status', ['draft', 'sent', 'approved']);

    // Obtener facturas pendientes (draft, sent, received)
    const { count: pendingInvoices } = await supabase
      .from('purchase_invoices')
      .select('*', { count: 'exact', head: true })
      .in('status', ['draft', 'sent', 'received']);

    // Obtener órdenes de este mes
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: ordersThisMonth } = await supabase
      .from('purchase_orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString());

    // Obtener facturas de este mes
    const { count: invoicesThisMonth } = await supabase
      .from('purchase_invoices')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString());

    // Obtener gastos de este mes
    const { data: invoicesThisMonthData } = await supabase
      .from('purchase_invoices')
      .select('total')
      .gte('created_at', startOfMonth.toISOString());

    const spentThisMonth = invoicesThisMonthData?.reduce((sum, invoice) => sum + (invoice.total || 0), 0) || 0;

    // Obtener gastos de hoy
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { data: invoicesToday } = await supabase
      .from('purchase_invoices')
      .select('total')
      .gte('created_at', startOfDay.toISOString());

    const spentToday = invoicesToday?.reduce((sum, invoice) => sum + (invoice.total || 0), 0) || 0;

    return {
      totalOrders: totalOrders || 0,
      totalInvoices: totalInvoices || 0,
      totalPayments: totalPayments || 0,
      totalSpent,
      pendingOrders: pendingOrders || 0,
      pendingInvoices: pendingInvoices || 0,
      ordersThisMonth: ordersThisMonth || 0,
      invoicesThisMonth: invoicesThisMonth || 0,
      spentThisMonth,
      spentToday,
    };
  } catch (error) {
    console.error('Error getting purchase stats:', error);
    return {
      totalOrders: 0,
      totalInvoices: 0,
      totalPayments: 0,
      totalSpent: 0,
      pendingOrders: 0,
      pendingInvoices: 0,
      ordersThisMonth: 0,
      invoicesThisMonth: 0,
      spentThisMonth: 0,
      spentToday: 0,
    };
  }
}



/**
 * Obtener estadísticas para el dashboard principal
 */
export async function getPurchaseDashboardStats(): Promise<{
  success: boolean;
  data?: {
    totalOrders: number;
    totalSpent: number;
    pendingOrders: number;
    spentThisMonth: number;
    recentOrders: Array<{
      id: number;
      number: string;
      supplier_name: string;
      total: number;
      status: string;
      created_at: string;
    }>;
  };
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();

    // Obtener estadísticas básicas
    const stats = await getPurchaseStats();

    // Obtener órdenes recientes
    const { data: recentOrders, error } = await supabase
      .from('purchase_orders')
      .select(`
        id,
        number,
        total,
        status,
        created_at,
        supplier:Supplier(name)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching recent orders:', error);
      return { success: false, error: 'Error al obtener órdenes recientes' };
    }

    const formattedRecentOrders = recentOrders?.map(order => ({
      id: order.id,
      number: order.number,
      supplier_name: order.supplier?.name || 'Sin proveedor',
      total: order.total,
      status: order.status,
      created_at: order.created_at,
    })) || [];

    return {
      success: true,
      data: {
        totalOrders: stats.totalOrders,
        totalSpent: stats.totalSpent,
        pendingOrders: stats.pendingOrders,
        spentThisMonth: stats.spentThisMonth,
        recentOrders: formattedRecentOrders,
      },
    };
  } catch (error) {
    console.error('Error in getPurchaseDashboardStats:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
} 