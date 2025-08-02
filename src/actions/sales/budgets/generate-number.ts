'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';

export async function generateBudgetNumber(): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();

    // Obtener el último número de presupuesto
    const { data: lastBudget, error } = await supabase
      .from('sales_quotes')
      .select('number')
      .order('id', { ascending: false })
      .limit(1)
      .single();

    let nextNumber = 1;

    if (!error && lastBudget?.number) {
      // Extraer número del formato P0001, P0002, etc.
      const match = lastBudget.number.match(/^P(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    // Formatear con ceros a la izquierda (P0001, P0002, etc.)
    const budgetNumber = `P${nextNumber.toString().padStart(4, '0')}`;

    return { success: true, data: budgetNumber };

  } catch (error) {
    console.error('Error generando número de presupuesto:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
}

export async function validateBudgetNumber(number: string): Promise<{ success: boolean; isAvailable?: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();

    // Verificar formato correcto P + número
    if (!/^P\d{4}$/.test(number)) {
      return { success: false, error: 'El formato debe ser P seguido de 4 dígitos (ej: P0001)' };
    }

    // Verificar que no exista
    const { data: existingBudget, error } = await supabase
      .from('sales_quotes')
      .select('id')
      .eq('number', number)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
      console.error('Error validando número de presupuesto:', error);
      return { success: false, error: 'Error al validar número.' };
    }

    const isAvailable = !existingBudget;

    return { success: true, isAvailable };

  } catch (error) {
    console.error('Error inesperado validando número:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
} 