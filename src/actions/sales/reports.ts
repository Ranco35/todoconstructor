'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';

// Interfaces para reportes
export interface SalesReportFilters {
  dateFrom?: string;
  dateTo?: string;
  clientId?: number;
  status?: string;
  paymentMethod?: string;
  sellerId?: number;
}

export interface SalesReportData {
  totalRevenue: number;
  totalInvoices: number;
  totalPayments: number;
  conversionRate: number;
  averageInvoiceValue: number;
  topProducts: Array<{
    productId: number;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
  topClients: Array<{
    clientId: number;
    clientName: string;
    totalPurchases: number;
    totalRevenue: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    invoices: number;
  }>;
  paymentMethods: Array<{
    method: string;
    count: number;
    amount: number;
    percentage: number;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
    amount: number;
    percentage: number;
  }>;
}

export interface ProductPerformanceData {
  productId: number;
  productName: string;
  totalSold: number;
  totalRevenue: number;
  averagePrice: number;
  topClients: Array<{
    clientId: number;
    clientName: string;
    quantity: number;
    revenue: number;
  }>;
}

export interface ClientPerformanceData {
  clientId: number;
  clientName: string;
  totalInvoices: number;
  totalRevenue: number;
  averageInvoiceValue: number;
  lastPurchaseDate: string;
  paymentHistory: Array<{
    date: string;
    amount: number;
    method: string;
  }>;
}

export interface MonthlyProductData {
  month: string;
  monthNumber: number;
  products: number;
  revenue: number;
  growth: number;
  averagePrice: number;
  uniqueProducts: number;
  topProducts: Array<{
    productName: string;
    quantity: number;
    revenue: number;
  }>;
}

// Función principal para obtener reportes de ventas
export async function getSalesReport(filters: SalesReportFilters = {}): Promise<{ success: boolean; data?: SalesReportData; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Construir filtros de fecha
    const dateFilter = {};
    if (filters.dateFrom) {
      dateFilter.gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      dateFilter.lte = filters.dateTo;
    }

    // Obtener facturas con filtros
    let invoicesQuery = supabase
      .from('invoices')
      .select(`
        *,
        client:client_id (
          id,
          firstName,
          lastName
        ),
        lines:invoice_lines (
          product_id,
          quantity,
          unit_price,
          subtotal
        )
      `);

    // Aplicar filtros
    if (Object.keys(dateFilter).length > 0) {
      invoicesQuery = invoicesQuery.gte('created_at', dateFilter.gte || '1900-01-01');
      if (dateFilter.lte) {
        invoicesQuery = invoicesQuery.lte('created_at', dateFilter.lte);
      }
    }

    if (filters.clientId) {
      invoicesQuery = invoicesQuery.eq('client_id', filters.clientId);
    }

    if (filters.status) {
      invoicesQuery = invoicesQuery.eq('status', filters.status);
    }

    const { data: invoices, error: invoicesError } = await invoicesQuery;

    if (invoicesError) {
      console.error('Error obteniendo facturas:', invoicesError);
      return { success: false, error: 'Error al obtener datos de facturas.' };
    }

    // Obtener pagos con filtros
    let paymentsQuery = supabase
      .from('invoice_payments')
      .select('*');

    if (Object.keys(dateFilter).length > 0) {
      paymentsQuery = paymentsQuery.gte('payment_date', dateFilter.gte || '1900-01-01');
      if (dateFilter.lte) {
        paymentsQuery = paymentsQuery.lte('payment_date', dateFilter.lte);
      }
    }

    if (filters.paymentMethod) {
      paymentsQuery = paymentsQuery.eq('payment_method', filters.paymentMethod);
    }

    const { data: payments, error: paymentsError } = await paymentsQuery;

    if (paymentsError) {
      console.error('Error obteniendo pagos:', paymentsError);
      return { success: false, error: 'Error al obtener datos de pagos.' };
    }

    // Calcular métricas principales
    const totalRevenue = payments?.reduce((sum, payment) => sum + Number(payment.amount || 0), 0) || 0;
    const totalInvoices = invoices?.length || 0;
    const totalPayments = payments?.length || 0;
    const conversionRate = totalInvoices > 0 ? (totalPayments / totalInvoices) * 100 : 0;
    const averageInvoiceValue = totalInvoices > 0 ? 
      invoices?.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0) / totalInvoices : 0;

    // Análisis de productos más vendidos
    const productSales = new Map();
    invoices?.forEach(invoice => {
      invoice.lines?.forEach(line => {
        const productId = line.product_id;
        if (!productSales.has(productId)) {
          productSales.set(productId, { quantity: 0, revenue: 0 });
        }
        const current = productSales.get(productId);
        current.quantity += Number(line.quantity || 0);
        current.revenue += Number(line.subtotal || 0);
      });
    });

    const topProducts = Array.from(productSales.entries())
      .map(([productId, data]: [number, any]) => ({
        productId,
        productName: `Producto ${productId}`, // TODO: Obtener nombre real
        quantity: data.quantity,
        revenue: data.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Análisis de clientes principales
    const clientSales = new Map();
    invoices?.forEach(invoice => {
      if (invoice.client) {
        const clientId = invoice.client.id;
        if (!clientSales.has(clientId)) {
          clientSales.set(clientId, {
            clientName: `${invoice.client.firstName || ''} ${invoice.client.lastName || ''}`.trim(),
            totalPurchases: 0,
            totalRevenue: 0
          });
        }
        const current = clientSales.get(clientId);
        current.totalPurchases += 1;
        current.totalRevenue += Number(invoice.total || 0);
      }
    });

    const topClients = Array.from(clientSales.entries())
      .map(([clientId, data]: [number, any]) => ({
        clientId,
        clientName: data.clientName,
        totalPurchases: data.totalPurchases,
        totalRevenue: data.totalRevenue
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    // Análisis de ingresos por mes
    const monthlyRevenue = new Map();
    invoices?.forEach(invoice => {
      const month = invoice.created_at?.slice(0, 7); // YYYY-MM
      if (month) {
        if (!monthlyRevenue.has(month)) {
          monthlyRevenue.set(month, { revenue: 0, invoices: 0 });
        }
        const current = monthlyRevenue.get(month);
        current.revenue += Number(invoice.total || 0);
        current.invoices += 1;
      }
    });

    const revenueByMonth = Array.from(monthlyRevenue.entries())
      .map(([month, data]: [string, any]) => ({
        month,
        revenue: data.revenue,
        invoices: data.invoices
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Análisis de métodos de pago
    const paymentMethodStats = new Map();
    payments?.forEach(payment => {
      const method = payment.payment_method;
      if (!paymentMethodStats.has(method)) {
        paymentMethodStats.set(method, { count: 0, amount: 0 });
      }
      const current = paymentMethodStats.get(method);
      current.count += 1;
      current.amount += Number(payment.amount || 0);
    });

    const paymentMethods = Array.from(paymentMethodStats.entries())
      .map(([method, data]: [string, any]) => ({
        method,
        count: data.count,
        amount: data.amount,
        percentage: totalRevenue > 0 ? (data.amount / totalRevenue) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount);

    // Distribución por estado
    const statusStats = new Map();
    invoices?.forEach(invoice => {
      const status = invoice.status;
      if (!statusStats.has(status)) {
        statusStats.set(status, { count: 0, amount: 0 });
      }
      const current = statusStats.get(status);
      current.count += 1;
      current.amount += Number(invoice.total || 0);
    });

    const statusDistribution = Array.from(statusStats.entries())
      .map(([status, data]: [string, any]) => ({
        status,
        count: data.count,
        amount: data.amount,
        percentage: totalInvoices > 0 ? (data.count / totalInvoices) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);

    return {
      success: true,
      data: {
        totalRevenue,
        totalInvoices,
        totalPayments,
        conversionRate,
        averageInvoiceValue,
        topProducts,
        topClients,
        revenueByMonth,
        paymentMethods,
        statusDistribution
      }
    };

  } catch (error) {
    console.error('Error generando reporte de ventas:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
}

// Función para obtener performance de productos
export async function getProductPerformance(filters: SalesReportFilters = {}): Promise<{ success: boolean; data?: ProductPerformanceData[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Obtener líneas de factura con información de productos
    const { data: invoiceLines, error } = await supabase
      .from('invoice_lines')
      .select(`
        product_id,
        quantity,
        unit_price,
        subtotal,
        invoice:invoice_id (
          client:client_id (
            id,
            firstName,
            lastName
          )
        )
      `);

    if (error) {
      console.error('Error obteniendo líneas de factura:', error);
      return { success: false, error: 'Error al obtener datos de productos.' };
    }

    // Agrupar por producto
    const productStats = new Map();
    
    invoiceLines?.forEach(line => {
      const productId = line.product_id;
      if (!productStats.has(productId)) {
        productStats.set(productId, {
          productName: `Producto ${productId}`, // TODO: Obtener nombre real
          totalSold: 0,
          totalRevenue: 0,
          clients: new Map()
        });
      }
      
      const current = productStats.get(productId);
      const quantity = Number(line.quantity || 0);
      const revenue = Number(line.subtotal || 0);
      
      current.totalSold += quantity;
      current.totalRevenue += revenue;
      
      // Agrupar por cliente
      if (line.invoice?.client) {
        const clientId = line.invoice.client.id;
        const clientName = `${line.invoice.client.firstName || ''} ${line.invoice.client.lastName || ''}`.trim();
        
        if (!current.clients.has(clientId)) {
          current.clients.set(clientId, {
            clientId,
            clientName,
            quantity: 0,
            revenue: 0
          });
        }
        
        const clientData = current.clients.get(clientId);
        clientData.quantity += quantity;
        clientData.revenue += revenue;
      }
    });

    // Convertir a array y calcular promedios
    const productPerformance = Array.from(productStats.entries())
      .map(([productId, data]: [number, any]) => ({
        productId,
        productName: data.productName,
        totalSold: data.totalSold,
        totalRevenue: data.totalRevenue,
        averagePrice: data.totalSold > 0 ? data.totalRevenue / data.totalSold : 0,
        topClients: Array.from(data.clients.values())
          .sort((a: any, b: any) => b.revenue - a.revenue)
          .slice(0, 5)
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    return {
      success: true,
      data: productPerformance
    };

  } catch (error) {
    console.error('Error obteniendo performance de productos:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
}

// Función para obtener performance de clientes
export async function getClientPerformance(filters: SalesReportFilters = {}): Promise<{ success: boolean; data?: ClientPerformanceData[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Obtener facturas con información de clientes
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select(`
        *,
        client:client_id (
          id,
          firstName,
          lastName
        )
      `);

    if (invoicesError) {
      console.error('Error obteniendo facturas:', invoicesError);
      return { success: false, error: 'Error al obtener datos de clientes.' };
    }

    // Obtener pagos
    const { data: payments, error: paymentsError } = await supabase
      .from('invoice_payments')
      .select('*');

    if (paymentsError) {
      console.error('Error obteniendo pagos:', paymentsError);
      return { success: false, error: 'Error al obtener datos de pagos.' };
    }

    // Agrupar por cliente
    const clientStats = new Map();
    
    invoices?.forEach(invoice => {
      if (invoice.client) {
        const clientId = invoice.client.id;
        if (!clientStats.has(clientId)) {
          clientStats.set(clientId, {
            clientName: `${invoice.client.firstName || ''} ${invoice.client.lastName || ''}`.trim(),
            totalInvoices: 0,
            totalRevenue: 0,
            lastPurchaseDate: null,
            paymentHistory: []
          });
        }
        
        const current = clientStats.get(clientId);
        current.totalInvoices += 1;
        current.totalRevenue += Number(invoice.total || 0);
        
        const purchaseDate = new Date(invoice.created_at);
        if (!current.lastPurchaseDate || purchaseDate > new Date(current.lastPurchaseDate)) {
          current.lastPurchaseDate = invoice.created_at;
        }
      }
    });

    // Agregar historial de pagos
    payments?.forEach(payment => {
      // Buscar la factura asociada al pago
      const invoice = invoices?.find(inv => inv.id === payment.invoice_id);
      if (invoice?.client) {
        const clientId = invoice.client.id;
        if (clientStats.has(clientId)) {
          const current = clientStats.get(clientId);
          current.paymentHistory.push({
            date: payment.payment_date,
            amount: Number(payment.amount),
            method: payment.payment_method
          });
        }
      }
    });

    // Convertir a array y calcular promedios
    const clientPerformance = Array.from(clientStats.entries())
      .map(([clientId, data]: [number, any]) => ({
        clientId,
        clientName: data.clientName,
        totalInvoices: data.totalInvoices,
        totalRevenue: data.totalRevenue,
        averageInvoiceValue: data.totalInvoices > 0 ? data.totalRevenue / data.totalInvoices : 0,
        lastPurchaseDate: data.lastPurchaseDate,
        paymentHistory: data.paymentHistory
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 10) // Últimos 10 pagos
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    return {
      success: true,
      data: clientPerformance
    };

  } catch (error) {
    console.error('Error obteniendo performance de clientes:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
}

// Nueva función para obtener datos de productos vendidos por mes
export async function getMonthlyProductSales(filters: SalesReportFilters = {}): Promise<{ success: boolean; data?: MonthlyProductData[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Construir filtros de fecha
    const dateFilter = {};
    if (filters.dateFrom) {
      dateFilter.gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      dateFilter.lte = filters.dateTo;
    }

    // Usar product_sales_tracking en lugar de sales_tracking
    let query = supabase
      .from('product_sales_tracking')
      .select(`
        id,
        product_id,
        sale_date,
        sale_type,
        package_id,
        quantity,
        unit_price,
        total_amount,
        customer_info,
        reservation_id,
        created_at,
        updated_at,
        product:product_id (
          name,
          sku
        )
      `);

    // Aplicar filtros de fecha
    if (Object.keys(dateFilter).length > 0) {
      query = query.gte('sale_date', dateFilter.gte || '1900-01-01');
      if (dateFilter.lte) {
        query = query.lte('sale_date', dateFilter.lte);
      }
    }

    const { data: salesData, error: salesError } = await query;

    if (salesError) {
      console.error('Error obteniendo datos de ventas:', salesError);
      return { success: false, error: 'Error al obtener datos de ventas.' };
    }

    if (!salesData || salesData.length === 0) {
      return { success: true, data: [] };
    }

    // Agrupar datos por mes
    const monthlyData = new Map<string, {
      products: number;
      revenue: number;
      productCounts: Map<string, { quantity: number; revenue: number; name: string }>;
      uniqueProducts: Set<string>;
    }>();

    salesData.forEach(sale => {
      const date = new Date(sale.sale_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          products: 0,
          revenue: 0,
          productCounts: new Map(),
          uniqueProducts: new Set()
        });
      }

      const monthData = monthlyData.get(monthKey)!;
      monthData.products += Number(sale.quantity || 1);
      monthData.revenue += Number(sale.total_amount || 0);
      monthData.uniqueProducts.add(sale.product_id?.toString() || '');

      // Contar productos individuales
      const productKey = sale.product_id?.toString() || 'unknown';
      const productName = sale.product?.name || `Producto ${productKey}`;
      
      if (!monthData.productCounts.has(productKey)) {
        monthData.productCounts.set(productKey, {
          quantity: 0,
          revenue: 0,
          name: productName
        });
      }

      const productData = monthData.productCounts.get(productKey)!;
      productData.quantity += Number(sale.quantity || 1);
      productData.revenue += Number(sale.total_amount || 0);
    });

    // Convertir a array y calcular métricas
    const months = Array.from(monthlyData.entries())
      .map(([monthKey, data]) => {
        const [year, month] = monthKey.split('-');
        const monthNumber = parseInt(month);
        const monthName = new Date(parseInt(year), monthNumber - 1).toLocaleDateString('es-ES', { 
          month: 'long', 
          year: 'numeric' 
        });

        // Obtener top productos del mes
        const topProducts = Array.from(data.productCounts.entries())
          .map(([productId, productData]) => ({
            productName: productData.name,
            quantity: productData.quantity,
            revenue: productData.revenue
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        return {
          monthKey,
          monthName,
          monthNumber,
          products: data.products,
          revenue: data.revenue,
          uniqueProducts: data.uniqueProducts.size,
          averagePrice: data.products > 0 ? data.revenue / data.products : 0,
          topProducts
        };
      })
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey));

    // Calcular crecimiento entre meses
    const monthlyDataWithGrowth = months.map((month, index) => {
      let growth = 0;
      if (index > 0) {
        const previousMonth = months[index - 1];
        if (previousMonth.products > 0) {
          growth = ((month.products - previousMonth.products) / previousMonth.products) * 100;
        }
      }

      return {
        month: month.monthName,
        monthNumber: month.monthNumber,
        products: month.products,
        revenue: month.revenue,
        growth: Math.round(growth * 10) / 10, // Redondear a 1 decimal
        averagePrice: Math.round(month.averagePrice),
        uniqueProducts: month.uniqueProducts,
        topProducts: month.topProducts
      };
    });

    return { success: true, data: monthlyDataWithGrowth };

  } catch (error) {
    console.error('Error en getMonthlyProductSales:', error);
    return { success: false, error: 'Error inesperado al obtener datos mensuales.' };
  }
}

// Función para exportar reportes
export async function exportSalesReport(filters: SalesReportFilters, format: 'excel' | 'pdf' = 'excel'): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Obtener datos del reporte
    const reportResult = await getSalesReport(filters);
    
    if (!reportResult.success || !reportResult.data) {
      return { success: false, error: 'Error al generar datos del reporte.' };
    }

    const reportData = reportResult.data;

    // Simular exportación (en producción se usaría una librería real)
    const exportData = {
      metadata: {
        generatedAt: new Date().toISOString(),
        filters,
        format
      },
      summary: {
        totalRevenue: reportData.totalRevenue,
        totalInvoices: reportData.totalInvoices,
        totalPayments: reportData.totalPayments,
        conversionRate: reportData.conversionRate,
        averageInvoiceValue: reportData.averageInvoiceValue
      },
      details: {
        topProducts: reportData.topProducts,
        topClients: reportData.topClients,
        revenueByMonth: reportData.revenueByMonth,
        paymentMethods: reportData.paymentMethods,
        statusDistribution: reportData.statusDistribution
      }
    };

    return {
      success: true,
      data: exportData
    };

  } catch (error) {
    console.error('Error exportando reporte:', error);
    return { success: false, error: 'Error al exportar reporte.' };
  }
} 