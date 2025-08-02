'use server';

import { getSupabaseServerClient, getSupabaseServiceClient } from '@/lib/supabase-server';

export interface PettyCashIncomeData {
  id?: number;
  sessionId: number;
  amount: number;
  description: string;
  category: string;
  paymentMethod: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Server Action: Crear un nuevo ingreso de dinero en caja chica
 * @param data Datos del ingreso
 * @returns Resultado de la operación
 */
export async function createPettyCashIncomeAction(data: PettyCashIncomeData) {
  try {
    // 1. Verificar que la sesión existe y está activa
    const { data: session, error: sessionError } = await (await getSupabaseServerClient()).from('CashSession')
      .select('*')
      .eq('id', data.sessionId)
      .eq('status', 'open')
      .single();

    if (sessionError || !session) {
      throw new Error('Sesión no encontrada o no está activa');
    }

    // 2. Crear el ingreso
    const { data: income, error: incomeError } = await (await getSupabaseServiceClient()).from('PettyCashIncome')
      .insert({
        sessionId: data.sessionId,
        amount: data.amount,
        description: data.description,
        category: data.category,
        paymentMethod: data.paymentMethod,
        notes: data.notes || null
      })
      .select()
      .single();

    if (incomeError) {
      console.error('Error creating petty cash income:', incomeError);
      throw new Error('Error al crear el ingreso de dinero');
    }

    // 3. Actualizar el saldo de la sesión
    const newCurrentAmount = session.currentAmount + data.amount;
    const { error: updateError } = await (await getSupabaseServiceClient()).from('CashSession')
      .update({ currentAmount: newCurrentAmount })
      .eq('id', data.sessionId);

    if (updateError) {
      console.error('Error updating session amount:', updateError);
      throw new Error('Error al actualizar el saldo de la sesión');
    }

    return {
      success: true,
      data: income,
      message: 'Ingreso registrado exitosamente'
    };

  } catch (error) {
    console.error('Error in createPettyCashIncomeAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      message: 'Error al registrar el ingreso'
    };
  }
}

/**
 * Server Action: Obtener todos los ingresos de una sesión
 * @param sessionId ID de la sesión
 * @returns Lista de ingresos
 */
export async function getPettyCashIncomesAction(sessionId: number) {
  try {
    const { data: incomes, error } = await (await getSupabaseServerClient()).from('PettyCashIncome')
      .select(`
        *,
        CashSession (
          id,
          openingAmount,
          currentAmount,
          status,
          openedAt
        )
      `)
      .eq('sessionId', sessionId)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error getting petty cash incomes:', error);
      throw new Error('Error al obtener los ingresos');
    }

    return {
      success: true,
      data: incomes || [],
      message: 'Ingresos obtenidos exitosamente'
    };

  } catch (error) {
    console.error('Error in getPettyCashIncomesAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      data: [],
      message: 'Error al obtener los ingresos'
    };
  }
}

/**
 * Server Action: Obtener resumen de ingresos por categoría
 * @param sessionId ID de la sesión
 * @returns Resumen de ingresos
 */
export async function getIncomeSummaryAction(sessionId: number) {
  try {
    const { data: summary, error } = await (await getSupabaseServerClient()).from('PettyCashIncome')
      .select('amount, category')
      .eq('sessionId', sessionId);

    if (error) {
      console.error('Error getting income summary:', error);
      throw new Error('Error al obtener el resumen de ingresos');
    }

    // Calcular totales por categoría
    const categoryTotals = summary?.reduce((acc, income) => {
      const category = income.category;
      acc[category] = (acc[category] || 0) + income.amount;
      return acc;
    }, {} as Record<string, number>) || {};

    const totalIncome = summary?.reduce((sum, income) => sum + income.amount, 0) || 0;

    return {
      success: true,
      data: {
        totalIncome,
        categoryTotals,
        incomeCount: summary?.length || 0
      },
      message: 'Resumen de ingresos obtenido exitosamente'
    };

  } catch (error) {
    console.error('Error in getIncomeSummaryAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      data: {
        totalIncome: 0,
        categoryTotals: {},
        incomeCount: 0
      },
      message: 'Error al obtener el resumen de ingresos'
    };
  }
} 