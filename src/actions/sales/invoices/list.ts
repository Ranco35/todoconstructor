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
    console.log('📋 listInvoices llamado con:', input);
    
    const supabase = await getSupabaseServerClient();
    const {
      page = 1,
      pageSize = 20,
      filters = {}
    } = input;

    // Calcular offset
    const offset = (page - 1) * pageSize;

    // Construir query base SIN JOIN primero para verificar
    let query = supabase
      .from('invoices')
      .select('*', { count: 'exact' });

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

    console.log('📊 Resultado de query:', {
      count,
      invoicesLength: invoices?.length,
      hasError: !!error
    });

    if (error) {
      console.error('❌ Error al listar facturas:', error);
      return { success: false, error: 'Error al obtener facturas.' };
    }

    // Obtener IDs de clientes únicos
    const clientIds = [...new Set((invoices || []).map(inv => inv.client_id).filter(id => id))];
    
    // Obtener información de clientes
    const clientMap = new Map();
    if (clientIds.length > 0) {
      const { data: clients } = await supabase
        .from('Client')
        .select('id, nombrePrincipal, apellido, email')
        .in('id', clientIds);
      
      clients?.forEach(client => {
        clientMap.set(client.id, {
          id: client.id,
          firstName: client.nombrePrincipal,
          lastName: client.apellido,
          email: client.email
        });
      });
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
          budgetId: invoice.budget_id || invoice.quote_id,
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
            quantity: Number(line.quantity),
            unitPrice: Number(line.unit_price),
            unit: line.unit || 'UND',
            discountPercent: Number(line.discount_percent),
            taxes: line.taxes || [],
            subtotal: Number(line.subtotal)
          })),
          client: clientMap.get(invoice.client_id) || null
        } as Invoice & { client: { id: number; firstName: string; lastName: string; email: string } | null };
      })
    );

    console.log('✅ Facturas con datos procesados:', invoicesWithLines.length);

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
    
    // Obtener factura principal
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error || !invoice) {
      return { success: false, error: 'Factura no encontrada.' };
    }
    
    // Obtener información del cliente
    let clientData = null;
    if (invoice.client_id) {
      const { data: client } = await supabase
        .from('Client')
        .select('id, nombrePrincipal, apellido, email, telefono')
        .eq('id', invoice.client_id)
        .single();
        
      if (client) {
        clientData = {
          id: client.id,
          nombrePrincipal: client.nombrePrincipal,
          apellido: client.apellido,
          email: client.email,
          telefono: client.telefono
        };
      }
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
        client: clientData,
        lines: (lines || []).map(line => ({
          id: line.id,
          invoiceId: line.invoice_id,
          productId: line.product_id,
          productName: line.product_name || line.name || '',
          description: line.description,
          quantity: Number(line.quantity),
          unitPrice: Number(line.unit_price),
          unit: line.unit || 'UND',
          discountPercent: Number(line.discount_percent),
          taxes: line.taxes || [],
          subtotal: Number(line.subtotal)
        }))
      }
    };
  } catch (error) {
    console.error('Error al obtener factura por ID:', error);
    return { success: false, error: 'Error inesperado al obtener la factura.' };
  }
} 

export async function getRecentInvoices(limit: number = 10): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();

    // Obtener las facturas más recientes
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('id, number, status, total, created_at, client_id')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error al obtener facturas recientes:', error);
      return { success: false, error: 'Error al obtener facturas recientes.' };
    }

    // Obtener información de clientes
    const clientIds = [...new Set((invoices || []).map(inv => inv.client_id).filter(id => id))];
    const clientMap = new Map();
    
    if (clientIds.length > 0) {
      const { data: clients } = await supabase
        .from('Client')
        .select('id, nombrePrincipal, apellido, email')
        .in('id', clientIds);
      
      clients?.forEach(client => {
        clientMap.set(client.id, {
          id: client.id,
          name: `${client.nombrePrincipal || ''} ${client.apellido || ''}`.trim(),
          email: client.email || ''
        });
      });
    }

    // Formatear los datos para el dashboard
    const recentInvoices = (invoices || []).map(invoice => ({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      total: Number(invoice.total),
      createdAt: invoice.created_at,
      client: clientMap.get(invoice.client_id) || null
    }));

    return { success: true, data: recentInvoices };

  } catch (error) {
    console.error('Error inesperado al obtener facturas recientes:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
} 