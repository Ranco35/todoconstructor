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

    // Construir query base con JOIN para obtener información del cliente
    let query = supabase
      .from('sales_quotes')
      .select(`
        *,
        client:client_id!inner (
          id,
          nombrePrincipal,
          apellido,
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

    const { data: quotes, error, count } = await query;

    if (error) {
      console.error('Error al listar presupuestos:', error);
      return { success: false, error: 'Error al obtener presupuestos.' };
    }

    // Obtener líneas de presupuesto para cada presupuesto
    const quotesWithLines = await Promise.all(
      (quotes || []).map(async (quote) => {
        const { data: lines } = await supabase
          .from('sales_quote_lines')
          .select('*')
          .eq('quote_id', quote.id)
          .order('id');

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
          // Información del cliente
          client: quote.client ? {
            id: quote.client.id,
            nombrePrincipal: quote.client.nombrePrincipal || '',
            apellido: quote.client.apellido || '',
            email: quote.client.email || ''
          } : null
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