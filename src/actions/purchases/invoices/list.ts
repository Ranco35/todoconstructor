'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';

// Interfaces
interface PurchaseInvoiceWithDetails {
  id: number;
  number: string;
  supplier_invoice_number?: string;
  supplier_id: number | null;
  issue_date: string;
  due_date: string | null;
  subtotal: number;
  tax_amount: number;
  total: number;
  status: string;
  created_at: string;
  updated_at: string;
  supplier?: {
    id: number;
    name: string;
    email?: string;
    phone?: string;
  };
  warehouse?: {
    id: number;
    name: string;
    location?: string;
  };
  order?: {
    id: number;
    number: string;
    status: string;
  };
  lines: any[];
  payments: any[];
}

// Interface para filtros
interface ListPurchaseInvoicesFilters {
  search?: string;
  status?: string;
  supplier_id?: number;
  dateFrom?: string;
  dateTo?: string;
}

export async function listPurchaseInvoices(filters?: ListPurchaseInvoicesFilters): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    console.log('🔍 Ejecutando listPurchaseInvoices con filtros:', filters);
    
    const supabase = await getSupabaseServerClient();
    
    let query = supabase
      .from('purchase_invoices')
      .select(`
        id,
        number,
        supplier_invoice_number,
        total,
        status,
        payment_status,
        created_at,
        due_date,
        supplier:Supplier(name)
      `);

    // Aplicar filtros si existen
    if (filters?.search) {
      query = query.or(`number.ilike.%${filters.search}%,supplier_invoice_number.ilike.%${filters.search}%`);
    }
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters?.supplier_id) {
      query = query.eq('supplier_id', filters.supplier_id);
    }
    
    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    
    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    // Ordenar por fecha de creación (más recientes primero)
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('❌ Error fetching purchase invoices:', error);
      return {
        success: false,
        error: 'Error al obtener las facturas'
      };
    }

    console.log('✅ Facturas obtenidas:', data?.length || 0);
    
    // Mapear supplier_name
    const invoicesWithSupplierName = (data || []).map((invoice) => ({
      ...invoice,
      supplier_name: invoice.supplier?.name || 'Sin proveedor',
    }));

    return {
      success: true,
      data: invoicesWithSupplierName
    };
    
  } catch (error) {
    console.error('❌ Error en listPurchaseInvoices:', error);
    return {
      success: false,
      error: 'Error interno del servidor'
    };
  }
}

/**
 * Obtener estadísticas de facturas de compra
 */
export async function getPurchaseInvoiceStats(): Promise<{
  success: boolean;
  data?: {
    total: number;
    draft: number;
    sent: number;
    received: number;
    paid: number;
    cancelled: number;
    thisMonth: number;
    totalValue: number;
    totalPaid: number;
    totalPending: number;
  };
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();

    // Obtener total de facturas
    const { count: total } = await supabase
      .from('purchase_invoices')
      .select('*', { count: 'exact', head: true });

    // Obtener facturas por estado
    const { data: statusCounts } = await supabase
      .from('purchase_invoices')
      .select('status');

    const statusBreakdown = {
      draft: 0,
      sent: 0,
      received: 0,
      paid: 0,
      cancelled: 0,
    };

    statusCounts?.forEach(invoice => {
      if (invoice.status in statusBreakdown) {
        statusBreakdown[invoice.status as keyof typeof statusBreakdown]++;
      }
    });

    // Obtener facturas de este mes
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: thisMonth } = await supabase
      .from('purchase_invoices')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString());

    // Obtener valor total de todas las facturas
    const { data: totalValueData } = await supabase
      .from('purchase_invoices')
      .select('total_amount');

    const totalValue = totalValueData?.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0) || 0;

    // Obtener total pagado
    const { data: paymentsData } = await supabase
      .from('purchase_invoice_payments')
      .select('amount');

    const totalPaid = paymentsData?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

    const totalPending = totalValue - totalPaid;

    return {
      success: true,
      data: {
        total: total || 0,
        ...statusBreakdown,
        thisMonth: thisMonth || 0,
        totalValue,
        totalPaid,
        totalPending,
      },
    };
  } catch (error) {
    console.error('Error in getPurchaseInvoiceStats:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Obtener facturas recientes
 */
export async function getRecentPurchaseInvoices(limit: number = 5): Promise<{
  success: boolean;
  data?: PurchaseInvoiceWithDetails[];
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();

    const { data: invoices, error } = await supabase
      .from('purchase_invoices')
      .select(`
        *,
        supplier:Supplier(id, name, email, phone),
        warehouse:Warehouse(id, name, location),
        order:purchase_orders(id, number, status)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error getting recent purchase invoices:', error);
      return { success: false, error: 'Error al obtener las facturas recientes' };
    }

    // Obtener líneas para cada factura
    const invoicesWithLines = await Promise.all(
      (invoices || []).map(async (invoice) => {
        const { data: lines } = await supabase
          .from('purchase_invoice_lines')
          .select(`
            *,
            product:Product(id, name, sku, brand)
          `)
          .eq('invoice_id', invoice.id)
          .order('id');

        return {
          ...invoice,
          lines: lines || [],
          payments: [],
        } as PurchaseInvoiceWithDetails;
      })
    );

    return {
      success: true,
      data: invoicesWithLines,
    };
  } catch (error) {
    console.error('Error in getRecentPurchaseInvoices:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Obtener factura por ID
 */
export async function getPurchaseInvoiceById(id: number): Promise<{
  success: boolean;
  data?: PurchaseInvoiceWithDetails;
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();

    const { data: invoice, error } = await supabase
      .from('purchase_invoices')
      .select(`
        *,
        supplier:Supplier(id, name, email, phone),
        warehouse:Warehouse(id, name, location),
        order:purchase_orders(id, number, status)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error getting purchase invoice:', error);
      return { success: false, error: 'Error al obtener la factura de compra' };
    }

    // Obtener líneas
    const { data: lines } = await supabase
      .from('purchase_invoice_lines')
      .select(`
        *,
        product:Product(id, name, sku, brand)
      `)
      .eq('invoice_id', id)
      .order('id');

    // Obtener pagos
    const { data: payments } = await supabase
      .from('purchase_payments')
      .select('*')
      .eq('invoice_id', id)
      .order('payment_date');

    const invoiceWithDetails: PurchaseInvoiceWithDetails = {
      ...invoice,
      lines: lines || [],
      payments: payments || [],
    };

    return {
      success: true,
      data: invoiceWithDetails,
    };
  } catch (error) {
    console.error('Error in getPurchaseInvoiceById:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
} 