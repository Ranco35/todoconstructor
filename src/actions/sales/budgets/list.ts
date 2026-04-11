'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import type { Budget, BudgetFilters, BudgetListResponse } from '../../../types/ventas/budget';

export interface ListBudgetsInput {
  page?: number;
  pageSize?: number;
  filters?: BudgetFilters;
}

export async function listBudgets(input: ListBudgetsInput = {}): Promise<{ success: boolean; data?: BudgetListResponse; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      page = 1,
      pageSize = 20,
      filters = {}
    } = input;

    // Calcular offset
    const offset = (page - 1) * pageSize;

    // Construir query base SIN JOIN (obtendremos el cliente después)
    let query = supabase
      .from('sales_quotes')
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

    const { data: quotes, error, count } = await query;

    if (error) {
      console.error('Error al listar presupuestos:', error);
      return { success: false, error: 'Error al obtener presupuestos.' };
    }

    // Obtener líneas de presupuesto y clientes para cada presupuesto
    const quotesWithLines = await Promise.all(
      (quotes || []).map(async (quote) => {
        // Obtener líneas
        const { data: lines } = await supabase
          .from('sales_quote_lines')
          .select('*')
          .eq('quote_id', quote.id)
          .order('id');

        // Obtener cliente si existe
        let clientData = null;
        if (quote.client_id) {
          const { data: client } = await supabase
            .from('Client')
            .select('id, nombrePrincipal, apellido, email')
            .eq('id', quote.client_id)
            .single();
          
          if (client) {
            clientData = {
              id: client.id,
              nombrePrincipal: client.nombrePrincipal || '',
              apellido: client.apellido || '',
              email: client.email || ''
            };
          }
        }

        return {
          id: quote.id,
          number: quote.number,
          clientId: quote.client_id,
          reservationId: quote.reservation_id,
          status: quote.status,
          createdAt: quote.created_at,
          updatedAt: quote.updated_at,
          total: Number(quote.total),
          currency: quote.currency,
          expirationDate: quote.expiration_date,
          notes: quote.notes,
          paymentTerms: quote.payment_terms,
          companyId: quote.company_id,
          sellerId: quote.seller_id,
          lines: lines || [],
          client: clientData
        } as Budget & { client: { id: number; nombrePrincipal: string; apellido: string; email: string } | null };
      })
    );

    const totalPages = Math.ceil((count || 0) / pageSize);

    return {
      success: true,
      data: {
        budgets: quotesWithLines,
        total: count || 0,
        page,
        pageSize,
        totalPages
      }
    };

  } catch (error) {
    console.error('Error inesperado al listar presupuestos:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
}

export async function getBudgetStats(): Promise<{ success: boolean; data?: { byStatus: Record<string, number>; totalAmount: number; thisMonth: number }; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();

    // Estadísticas por estado
    const { data: statusStats } = await supabase
      .from('sales_quotes')
      .select('status, total')
      .order('status');

    // Agrupar por estado
    const byStatus: Record<string, number> = {};
    let totalAmount = 0;

    (statusStats || []).forEach(quote => {
      byStatus[quote.status] = (byStatus[quote.status] || 0) + 1;
      totalAmount += Number(quote.total);
    });

    // Presupuestos de este mes
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const { count: thisMonth } = await supabase
      .from('sales_quotes')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', firstDayOfMonth.toISOString());

    return {
      success: true,
      data: {
        byStatus,
        totalAmount,
        thisMonth: thisMonth || 0
      }
    };

  } catch (error) {
    console.error('Error al obtener estadísticas de presupuestos:', error);
    return { success: false, error: 'Error al obtener estadísticas.' };
  }
}

/**
 * Devuelve un resumen ligero de TODOS los presupuestos de un cliente.
 * Usado por la vista de detalle del cliente (Historial de Presupuestos).
 */
export async function getBudgetsByClientId(clientId: number): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from('sales_quotes')
      .select('id, number, status, total, currency, created_at, expiration_date')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener presupuestos por cliente:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error inesperado en getBudgetsByClientId:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
}