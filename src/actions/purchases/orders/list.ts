'use server';

import { createClient } from '@/lib/supabase-server';
import { ListPurchaseOrdersInput, PurchaseOrder, PurchaseOrderWithDetails } from '@/types/purchases';

/**
 * Listar órdenes de compra con filtros
 */
export async function listPurchaseOrders(input: ListPurchaseOrdersInput = {}): Promise<{
  success: boolean;
  data?: {
    orders: PurchaseOrderWithDetails[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const {
      page = 1,
      limit = 10,
      status,
      supplier_id,
      warehouse_id,
      search,
      start_date,
      end_date,
    } = input;

    let query = supabase
      .from('purchase_orders')
      .select(`
        *,
        supplier:Supplier(id, name, email, phone),
        warehouse:Warehouse(id, name, location)
      `, { count: 'exact' });

    // Aplicar filtros
    if (status) {
      query = query.eq('status', status);
    }

    if (supplier_id) {
      query = query.eq('supplier_id', supplier_id);
    }

    if (warehouse_id) {
      query = query.eq('warehouse_id', warehouse_id);
    }

    if (search) {
      query = query.or(`number.ilike.%${search}%,notes.ilike.%${search}%`);
    }

    if (start_date) {
      query = query.gte('created_at', start_date);
    }

    if (end_date) {
      query = query.lte('created_at', end_date);
    }

    // Aplicar paginación
    const offset = (page - 1) * limit;
    query = query.order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: orders, error, count } = await query;

    if (error) {
      console.error('Error listing purchase orders:', error);
      return { success: false, error: 'Error al obtener las órdenes de compra' };
    }

    // Obtener líneas para cada orden
    const ordersWithLines = await Promise.all(
      (orders || []).map(async (order) => {
        const { data: lines } = await supabase
          .from('purchase_order_lines')
          .select(`
            *,
            product:Product(id, name, sku, brand)
          `)
          .eq('order_id', order.id)
          .order('id');

        return {
          ...order,
          lines: lines || [],
        } as PurchaseOrderWithDetails;
      })
    );

    const totalPages = Math.ceil((count || 0) / limit);

    return {
      success: true,
      data: {
        orders: ordersWithLines,
        total: count || 0,
        page,
        limit,
        totalPages,
      },
    };
  } catch (error) {
    console.error('Error in listPurchaseOrders:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Obtener estadísticas de órdenes de compra
 */
export async function getPurchaseOrderStats(): Promise<{
  success: boolean;
  data?: {
    total: number;
    draft: number;
    sent: number;
    approved: number;
    received: number;
    cancelled: number;
    thisMonth: number;
    totalValue: number;
  };
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Obtener total de órdenes
    const { count: total } = await supabase
      .from('purchase_orders')
      .select('*', { count: 'exact', head: true });

    // Obtener órdenes por estado
    const { data: statusCounts } = await supabase
      .from('purchase_orders')
      .select('status');

    const statusBreakdown = {
      draft: 0,
      sent: 0,
      approved: 0,
      received: 0,
      cancelled: 0,
    };

    statusCounts?.forEach(order => {
      if (order.status in statusBreakdown) {
        statusBreakdown[order.status as keyof typeof statusBreakdown]++;
      }
    });

    // Obtener órdenes de este mes
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count: thisMonth } = await supabase
      .from('purchase_orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString());

    // Obtener valor total de todas las órdenes
    const { data: totalValueData } = await supabase
      .from('purchase_orders')
      .select('total');

    const totalValue = totalValueData?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

    return {
      success: true,
      data: {
        total: total || 0,
        ...statusBreakdown,
        thisMonth: thisMonth || 0,
        totalValue,
      },
    };
  } catch (error) {
    console.error('Error in getPurchaseOrderStats:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Obtener proveedores para selector
 */
export async function getSuppliersForSelector(): Promise<{
  success: boolean;
  data?: Array<{
    id: number;
    name: string;
    email: string;
    phone: string;
  }>;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data: suppliers, error } = await supabase
      .from('Supplier')
      .select('id, name, email, phone')
      .eq('active', true)
      .order('name');

    if (error) {
      console.error('Error fetching suppliers:', error);
      return { success: false, error: 'Error al obtener proveedores' };
    }

    return { success: true, data: suppliers };
  } catch (error) {
    console.error('Error in getSuppliersForSelector:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Obtener bodegas para selector
 */
export async function getWarehousesForSelector(): Promise<{
  success: boolean;
  data?: Array<{
    id: number;
    name: string;
    location: string;
  }>;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data: warehouses, error } = await supabase
      .from('Warehouse')
      .select('id, name, location')
      .order('name');

    if (error) {
      console.error('Error fetching warehouses:', error);
      return { success: false, error: 'Error al obtener bodegas' };
    }

    return { success: true, data: warehouses };
  } catch (error) {
    console.error('Error in getWarehousesForSelector:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Obtener productos para selector
 */
export async function getProductsForSelector(): Promise<{
  success: boolean;
  data?: Array<{
    id: number;
    name: string;
    sku: string;
    brand: string;
    saleprice: number;
  }>;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data: products, error } = await supabase
      .from('Product')
      .select('id, name, sku, brand, saleprice')
      .order('name');

    if (error) {
      console.error('Error fetching products:', error);
      return { success: false, error: 'Error al obtener productos' };
    }

    return { success: true, data: products };
  } catch (error) {
    console.error('Error in getProductsForSelector:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Obtener órdenes recientes para dashboard
 */
export async function getRecentPurchaseOrders(limit: number = 5): Promise<{
  success: boolean;
  data?: PurchaseOrderWithDetails[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data: orders, error } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        supplier:Supplier(id, name, email, phone),
        warehouse:Warehouse(id, name, location)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent purchase orders:', error);
      return { success: false, error: 'Error al obtener órdenes recientes' };
    }

    // Obtener líneas para cada orden
    const ordersWithLines = await Promise.all(
      (orders || []).map(async (order) => {
        const { data: lines } = await supabase
          .from('purchase_order_lines')
          .select(`
            *,
            product:Product(id, name, sku, brand)
          `)
          .eq('order_id', order.id)
          .order('id');

        return {
          ...order,
          lines: lines || [],
        } as PurchaseOrderWithDetails;
      })
    );

    return { success: true, data: ordersWithLines };
  } catch (error) {
    console.error('Error in getRecentPurchaseOrders:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
} 