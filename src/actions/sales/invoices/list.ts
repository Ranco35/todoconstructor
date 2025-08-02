'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import type { Invoice } from './create';

export interface InvoiceFilters {
  status?: string;
  clientId?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface InvoiceListResponse {
  invoices: (Invoice & { client: { id: number; firstName: string; lastName: string; email: string } | null })[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ListInvoicesInput {
  page?: number;
  pageSize?: number;
  filters?: InvoiceFilters;
}

export async function listInvoices(input: ListInvoicesInput = {}): Promise<{ success: boolean; data?: InvoiceListResponse; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      page = 1,
      pageSize = 20,
      filters = {}
    } = input;

    // Calcular offset
    const offset = (page - 1) * pageSize;

    // Construir query base con JOIN para obtener información del cliente
    let query = supabase
      .from('invoices')
      .select(`
        *,
        client:client_id (
          id,
          firstName,
          lastName,
          email
        )
      `, { count: 'exact' });

    // Aplicar filtros
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.clientId) {
      query = query.eq('client_id', filters.clientId);
    }

    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    if (filters.search) {
      query = query.or(`number.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
    }

    // Aplicar paginación y ordenamiento
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    const { data: invoices, error, count } = await query;

    if (error) {
      console.error('Error al listar facturas:', error);
      return { success: false, error: 'Error al obtener facturas.' };
    }

    // Obtener líneas de factura para cada factura
    const invoicesWithLines = await Promise.all(
      (invoices || []).map(async (invoice) => {
        const { data: lines } = await supabase
          .from('invoice_lines')
          .select('*')
          .eq('invoice_id', invoice.id)
          .order('id');

        return {
          id: invoice.id,
          number: invoice.number,
          clientId: invoice.client_id,
          budgetId: invoice.budget_id,
          reservationId: invoice.reservation_id,
          status: invoice.status,
          createdAt: invoice.created_at,
          updatedAt: invoice.updated_at,
          total: Number(invoice.total),
          currency: invoice.currency,
          dueDate: invoice.due_date,
          notes: invoice.notes,
          paymentTerms: invoice.payment_terms,
          companyId: invoice.company_id,
          sellerId: invoice.seller_id,
          lines: (lines || []).map(line => ({
            id: line.id,
            invoiceId: line.invoice_id,
            productId: line.product_id,
            description: line.description,
            quantity: line.quantity,
            unitPrice: Number(line.unit_price),
            unit: line.unit || 'UND', // Unidad de medida del producto
            discountPercent: Number(line.discount_percent),
            taxes: line.taxes || [],
            subtotal: Number(line.subtotal)
          })),
          // Información del cliente
          client: invoice.client ? {
            id: invoice.client.id,
            firstName: invoice.client.firstName || '',
            lastName: invoice.client.lastName || '',
            email: invoice.client.email || ''
          } : null
        } as Invoice & { client: { id: number; firstName: string; lastName: string; email: string } | null };
      })
    );

    const totalPages = Math.ceil((count || 0) / pageSize);

    return {
      success: true,
      data: {
        invoices: invoicesWithLines,
        total: count || 0,
        page,
        pageSize,
        totalPages
      }
    };

  } catch (error) {
    console.error('Error inesperado al listar facturas:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
}

export async function getInvoiceStats(): Promise<{ success: boolean; data?: { byStatus: Record<string, number>; totalAmount: number; thisMonth: number; pendingAmount: number }; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();

    // Estadísticas por estado
    const { data: statusStats } = await supabase
      .from('invoices')
      .select('status, total')
      .order('status');

    // Agrupar por estado
    const byStatus: Record<string, number> = {};
    let totalAmount = 0;
    let pendingAmount = 0;

    (statusStats || []).forEach(invoice => {
      byStatus[invoice.status] = (byStatus[invoice.status] || 0) + 1;
      totalAmount += Number(invoice.total);
      
      // Sumar pendientes (draft, sent, overdue)
      if (['draft', 'sent', 'overdue'].includes(invoice.status)) {
        pendingAmount += Number(invoice.total);
      }
    });

    // Facturas de este mes
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const { count: thisMonth } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', firstDayOfMonth.toISOString());

    return {
      success: true,
      data: {
        byStatus,
        totalAmount,
        thisMonth: thisMonth || 0,
        pendingAmount
      }
    };

  } catch (error) {
    console.error('Error al obtener estadísticas de facturas:', error);
    return { success: false, error: 'Error al obtener estadísticas.' };
  }
} 

export async function getInvoiceById(id: number): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    // Obtener factura principal con cliente
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:client_id (
          id,
          nombrePrincipal,
          apellido,
          email,
          telefono
        )
      `)
      .eq('id', id)
      .single();
    if (error || !invoice) {
      return { success: false, error: 'Factura no encontrada.' };
    }
    // Obtener líneas
    const { data: lines } = await supabase
      .from('invoice_lines')
      .select('*')
      .eq('invoice_id', id)
      .order('id');
    return {
      success: true,
      data: {
        ...invoice,
        lines: (lines || []).map(line => ({
          id: line.id,
          invoiceId: line.invoice_id,
          productId: line.product_id,
          productName: line.product_name || '',
          description: line.description,
          quantity: line.quantity,
          unitPrice: Number(line.unit_price),
          unit: line.unit || 'UND', // Unidad de medida del producto
          discountPercent: Number(line.discount_percent),
          taxes: line.taxes || [],
          subtotal: Number(line.subtotal)
        }))
      }
    };
  } catch (error) {
    return { success: false, error: 'Error inesperado al obtener la factura.' };
  }
} 

export async function getRecentInvoices(limit: number = 10): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();

    // Obtener las facturas más recientes con información del cliente
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select(`
        id,
        number,
        status,
        total,
        created_at,
        client:client_id (
          id,
          nombrePrincipal,
          apellido,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error al obtener facturas recientes:', error);
      return { success: false, error: 'Error al obtener facturas recientes.' };
    }

    // Formatear los datos para el dashboard
    const recentInvoices = (invoices || []).map(invoice => ({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      total: Number(invoice.total),
      createdAt: invoice.created_at,
      client: invoice.client ? {
        id: invoice.client.id,
        name: `${invoice.client.nombrePrincipal || ''} ${invoice.client.apellido || ''}`.trim(),
        email: invoice.client.email || ''
      } : null
    }));

    return { success: true, data: recentInvoices };

  } catch (error) {
    console.error('Error inesperado al obtener facturas recientes:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
} 