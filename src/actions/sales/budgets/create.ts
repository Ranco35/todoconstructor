"use server";

import { getSupabaseServerClient } from '@/lib/supabase-server';
import type { Budget, BudgetLine } from '../../../types/ventas/budget';

export interface CreateBudgetInput {
  number: string;
  client_id: number;
  reservation_id?: number;
  status?: string;
  total: number;
  currency?: string;
  expiration_date?: string;
  notes?: string;
  internal_notes?: string; // Notas internas solo para personal interno
  payment_terms?: string;
  company_id?: number;
  seller_id?: string; // UUID
  lines: Omit<BudgetLine, 'id' | 'quoteId'>[];
}

export async function createBudget(input: CreateBudgetInput): Promise<{ success: boolean; data?: Budget; error?: string }> {
  try {
    // Validación básica
    if (!input.number || !input.client_id || !input.total || !input.lines || input.lines.length === 0) {
      return { success: false, error: 'Faltan campos obligatorios o líneas de presupuesto vacías.' };
    }

    // Obtener cliente de Supabase del servidor
    const supabase = await getSupabaseServerClient();
    
    // Insertar presupuesto principal
    const { data: budget, error: budgetError } = await supabase
      .from('sales_quotes')
      .insert([
        {
          number: input.number,
          client_id: input.client_id,
          reservation_id: input.reservation_id ?? null,
          status: input.status ?? 'draft',
          total: input.total,
          currency: input.currency ?? 'CLP',
          expiration_date: input.expiration_date ?? null,
          notes: input.notes ?? null,
          internal_notes: input.internal_notes ?? null, // Notas internas
          payment_terms: input.payment_terms ?? null,
          company_id: input.company_id ?? null,
          seller_id: input.seller_id ?? null,
        },
      ])
      .select()
      .single();

    if (budgetError || !budget) {
      return { success: false, error: budgetError?.message || 'Error al crear presupuesto.' };
    }

    // Insertar líneas
    const linesToInsert = input.lines.map((line) => ({
      quote_id: budget.id,
      product_id: line.productId,
      description: line.description,
      quantity: line.quantity,
      unit_price: line.unitPrice,
      discount_percent: line.discountPercent,
      taxes: line.taxes,
      subtotal: line.subtotal
    }));

    const { error: linesError } = await supabase
      .from('sales_quote_lines')
      .insert(linesToInsert);

    if (linesError) {
      // Rollback manual si falla
      await supabase.from('sales_quotes').delete().eq('id', budget.id);
      return { success: false, error: linesError.message };
    }

    // Retornar presupuesto creado con líneas
    const { data: lines } = await supabase
      .from('sales_quote_lines')
      .select('*')
      .eq('quote_id', budget.id);

    return {
      success: true,
      data: {
        ...budget,
        lines: lines || [],
      } as Budget,
    };
    
  } catch (error) {
    console.error('Error creating budget:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error inesperado al crear el presupuesto' 
    };
  }
} 