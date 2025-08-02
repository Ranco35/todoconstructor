'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';

export interface SalesReportByProduct {
  product_id: number;
  product_name: string;
  product_sku: string;
  category_name: string;
  total_quantity: number;
  total_sales: number;
  sale_count: number;
  avg_unit_price: number;
  last_sale_date: string;
  first_sale_date: string;
}

export interface SalesDetail {
  id: number;
  product_id: number;
  product_name: string;
  product_sku: string;
  sale_date: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  sale_type: string;
  package_name?: string;
  reservation_id?: number;
  guest_name?: string;
  client_name?: string;
  created_at: string;
}

export interface SalesDateRange {
  start_date: string;
  end_date: string;
}

/**
 * Obtener reporte consolidado de ventas por producto
 */
export async function getSalesReportByProduct(
  dateRange?: SalesDateRange,
  productId?: number
): Promise<{ success: boolean; data?: SalesReportByProduct[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();

    let query = supabase
      .from('sales_tracking')
      .select(`
        product_id,
        product_name,
        product_sku,
        category_name,
        quantity,
        total_price,
        unit_price,
        created_at
      `);

    // Aplicar filtros
    if (dateRange) {
      query = query
        .gte('created_at', dateRange.start_date)
        .lte('created_at', dateRange.end_date);
    }

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data: salesData, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: `Error al obtener datos de ventas: ${error.message}` };
    }

    // Agrupar y consolidar datos por producto
    const productSalesMap = new Map<number, {
      product_id: number;
      product_name: string;
      product_sku: string;
      category_name: string;
      quantities: number[];
      prices: number[];
      unit_prices: number[];
      dates: string[];
    }>();

    salesData?.forEach(sale => {
      if (!productSalesMap.has(sale.product_id)) {
        productSalesMap.set(sale.product_id, {
          product_id: sale.product_id,
          product_name: sale.product_name,
          product_sku: sale.product_sku || '',
          category_name: sale.category_name,
          quantities: [],
          prices: [],
          unit_prices: [],
          dates: []
        });
      }

      const productData = productSalesMap.get(sale.product_id)!;
      productData.quantities.push(sale.quantity);
      productData.prices.push(sale.total_price);
      productData.unit_prices.push(sale.unit_price);
      productData.dates.push(sale.created_at);
    });

    // Calcular estadísticas consolidadas
    const report: SalesReportByProduct[] = Array.from(productSalesMap.values()).map(product => ({
      product_id: product.product_id,
      product_name: product.product_name,
      product_sku: product.product_sku,
      category_name: product.category_name,
      total_quantity: product.quantities.reduce((sum, qty) => sum + qty, 0),
      total_sales: product.prices.reduce((sum, price) => sum + price, 0),
      sale_count: product.quantities.length,
      avg_unit_price: product.unit_prices.reduce((sum, price) => sum + price, 0) / product.unit_prices.length,
      last_sale_date: product.dates.sort().reverse()[0],
      first_sale_date: product.dates.sort()[0]
    }));

    // Ordenar por total de ventas (descendente)
    report.sort((a, b) => b.total_sales - a.total_sales);

    return { success: true, data: report };

  } catch (error) {
    console.error('Error en getSalesReportByProduct:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Obtener detalle de ventas de un producto específico
 */
export async function getSalesDetailsByProduct(
  productId: number,
  dateRange?: SalesDateRange
): Promise<{ success: boolean; data?: SalesDetail[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();

    let query = supabase
      .from('sales_tracking')
      .select(`
        id,
        product_id,
        product_name,
        product_sku,
        quantity,
        unit_price,
        total_price,
        sale_type,
        package_name,
        reservation_id,
        created_at,
        updated_at
      `)
      .eq('product_id', productId);

    // Aplicar filtro de fecha si se proporciona
    if (dateRange) {
      query = query
        .gte('created_at', dateRange.start_date)
        .lte('created_at', dateRange.end_date);
    }

    const { data: salesData, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: `Error al obtener detalles de ventas: ${error.message}` };
    }

    // Enriquecer con datos de reserva si existe
    const enrichedData: SalesDetail[] = await Promise.all(
      (salesData || []).map(async (sale) => {
        let guestName = '';
        let clientName = '';

        if (sale.reservation_id) {
          const { data: reservationData } = await supabase
            .from('reservations')
            .select(`
              guest_name,
              client_id,
              clients:client_id (nombrePrincipal)
            `)
            .eq('id', sale.reservation_id)
            .single();

          if (reservationData) {
            guestName = reservationData.guest_name;
            clientName = reservationData.clients?.nombrePrincipal || '';
          }
        }

        return {
          id: sale.id,
          product_id: sale.product_id,
          product_name: sale.product_name,
          product_sku: sale.product_sku || '',
          sale_date: sale.created_at.split('T')[0], // Solo fecha
          quantity: sale.quantity,
          unit_price: sale.unit_price,
          total_price: sale.total_price,
          sale_type: sale.sale_type,
          package_name: sale.package_name,
          reservation_id: sale.reservation_id,
          guest_name: guestName,
          client_name: clientName,
          created_at: sale.created_at
        };
      })
    );

    return { success: true, data: enrichedData };

  } catch (error) {
    console.error('Error en getSalesDetailsByProduct:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Obtener ventas por categoría en un rango de fechas
 */
export async function getSalesByCategory(
  dateRange?: SalesDateRange
): Promise<{ success: boolean; data?: Record<string, number>; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();

    let query = supabase
      .from('sales_tracking')
      .select('category_name, total_price');

    if (dateRange) {
      query = query
        .gte('created_at', dateRange.start_date)
        .lte('created_at', dateRange.end_date);
    }

    const { data: salesData, error } = await query;

    if (error) {
      return { success: false, error: `Error al obtener ventas por categoría: ${error.message}` };
    }

    // Agrupar por categoría
    const categoryTotals: Record<string, number> = {};
    salesData?.forEach(sale => {
      const category = sale.category_name || 'Sin categoría';
      categoryTotals[category] = (categoryTotals[category] || 0) + sale.total_price;
    });

    return { success: true, data: categoryTotals };

  } catch (error) {
    console.error('Error en getSalesByCategory:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Obtener las ventas más recientes
 */
export async function getRecentSales(
  limit: number = 50
): Promise<{ success: boolean; data?: SalesDetail[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();

    const { data: salesData, error } = await supabase
      .from('sales_tracking')
      .select(`
        id,
        product_id,
        product_name,
        product_sku,
        quantity,
        unit_price,
        total_price,
        sale_type,
        package_name,
        reservation_id,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, error: `Error al obtener ventas recientes: ${error.message}` };
    }

    // Enriquecer con datos de reserva
    const enrichedData: SalesDetail[] = await Promise.all(
      (salesData || []).map(async (sale) => {
        let guestName = '';
        let clientName = '';

        if (sale.reservation_id) {
          const { data: reservationData } = await supabase
            .from('reservations')
            .select(`
              guest_name,
              client_id,
              clients:client_id (nombrePrincipal)
            `)
            .eq('id', sale.reservation_id)
            .single();

          if (reservationData) {
            guestName = reservationData.guest_name;
            clientName = reservationData.clients?.nombrePrincipal || '';
          }
        }

        return {
          id: sale.id,
          product_id: sale.product_id,
          product_name: sale.product_name,
          product_sku: sale.product_sku || '',
          sale_date: sale.created_at.split('T')[0],
          quantity: sale.quantity,
          unit_price: sale.unit_price,
          total_price: sale.total_price,
          sale_type: sale.sale_type,
          package_name: sale.package_name,
          reservation_id: sale.reservation_id,
          guest_name: guestName,
          client_name: clientName,
          created_at: sale.created_at
        };
      })
    );

    return { success: true, data: enrichedData };

  } catch (error) {
    console.error('Error en getRecentSales:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
} 