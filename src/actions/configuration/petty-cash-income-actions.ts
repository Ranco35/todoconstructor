'use server';

import { getSupabaseServerClient, getSupabaseServiceClient } from '@/lib/supabase-server';

export interface PettyCashIncomeData {
  id?: number;
  sessionId?: number;
  amount: number;
  description: string;
  category: string;
  paymentMethod: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  // bankReference y bankAccount no existen en la tabla PettyCashIncome
}

export interface PettyCashIncomeWithSession extends PettyCashIncomeData {
  CashSession?: {
    id: number;
    openingAmount: number;
    currentAmount: number;
    status: string;
    openedAt: string;
  };
}

/**
 * Crear un nuevo ingreso de dinero en caja chica
 * @param data Datos del ingreso
 * @returns Resultado de la operación
 */
export async function createPettyCashIncome(data: PettyCashIncomeData & { cashRegisterId: number, sessionId?: number }) {
  try {
    // Forzar sessionId a número si existe
    const sessionId = data.sessionId !== undefined ? Number(data.sessionId) : undefined;
    console.log('[createPettyCashIncome] sessionId recibido:', sessionId, typeof sessionId, '| cashRegisterId:', data.cashRegisterId);
    
    let activeSession = null;
    let sessionError = null;
    
    // Usar EXACTAMENTE el mismo patrón que getCurrentCashSession (que SÍ funciona)
    console.log(`🔍 Buscando sesión activa para cashRegisterId: ${data.cashRegisterId}`);
    
    const { data: session, error } = await (await getSupabaseServerClient()).from('CashSession')
      .select(`
        *,
        User:User(id, name, email)
      `)
      .eq('cashRegisterId', data.cashRegisterId)
      .eq('status', 'open')
      .single();

    activeSession = session;
    sessionError = error;
    
    // Manejo de errores EXACTAMENTE como getCurrentCashSession
    if (sessionError) {
      if (sessionError.code === 'PGRST116') {
        console.log(`✅ No hay sesión activa para cashRegisterId: ${data.cashRegisterId}`);
        throw new Error('No hay una sesión de caja activa. Abre una sesión para registrar ingresos.');
      }
      console.error('❌ Error en consulta de sesión:', sessionError);
      throw new Error('Error al buscar sesión activa.');
    }

    if (!activeSession) {
      console.log(`✅ No se encontró sesión activa para cashRegisterId: ${data.cashRegisterId}`);
      throw new Error('No hay una sesión de caja activa. Abre una sesión para registrar ingresos.');
    }

    console.log(`✅ Sesión activa encontrada: ID ${activeSession.id}, Usuario: ${activeSession.User?.name}`);

    // Si se especificó un sessionId, validar que coincida
    if (sessionId && activeSession.id !== sessionId) {
      console.error('[createPettyCashIncome] sessionId no coincide. Esperado:', sessionId, 'Encontrado:', activeSession.id);
      throw new Error('La sesión seleccionada no coincide con la sesión activa de la caja.');
    }

    // 2. Crear el ingreso usando la sesión activa (solo columnas que existen)
    const { data: income, error: incomeError } = await (await getSupabaseServiceClient()).from('PettyCashIncome')
      .insert({
        sessionId: activeSession.id, // Usar la sesión activa
        amount: data.amount,
        description: data.description,
        category: data.category,
        paymentMethod: data.paymentMethod,
        notes: data.notes || null
        // NO incluir bankReference y bankAccount porque no existen en la tabla
      })
      .select()
      .single();

    if (incomeError) {
      console.error('Error creating petty cash income:', incomeError);
      throw new Error('Error al crear el ingreso de dinero');
    }

    // 3. Actualizar el saldo de la sesión
    const newCurrentAmount = activeSession.currentAmount + data.amount;
    const { error: updateError } = await (await getSupabaseServiceClient()).from('CashSession')
      .update({ currentAmount: newCurrentAmount })
      .eq('id', activeSession.id);

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
    console.error('Error in createPettyCashIncome:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      message: 'Error al registrar el ingreso'
    };
  }
}

/**
 * Obtener todos los ingresos de una sesión
 * @param sessionId ID de la sesión
 * @returns Lista de ingresos
 */
export async function getPettyCashIncomes(sessionId: number) {
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
    console.error('Error in getPettyCashIncomes:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      data: [],
      message: 'Error al obtener los ingresos'
    };
  }
}

/**
 * Obtener resumen de ingresos por categoría
 * @param sessionId ID de la sesión
 * @returns Resumen de ingresos
 */
export async function getIncomeSummary(sessionId: number) {
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
    console.error('Error in getIncomeSummary:', error);
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

/**
 * Eliminar un ingreso (solo para administradores)
 * @param incomeId ID del ingreso
 * @param sessionId ID de la sesión
 * @returns Resultado de la operación
 */
export async function deletePettyCashIncome(incomeId: number, sessionId: number) {
  try {
    // 1. Obtener el ingreso para verificar el monto
    const { data: income, error: getError } = await (await getSupabaseServerClient()).from('PettyCashIncome')
      .select('amount')
      .eq('id', incomeId)
      .eq('sessionId', sessionId)
      .single();

    if (getError || !income) {
      throw new Error('Ingreso no encontrado');
    }

    // 2. Obtener la sesión actual
    const { data: session, error: sessionError } = await (await getSupabaseServerClient()).from('CashSession')
      .select('currentAmount')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error('Sesión no encontrada');
    }

    // 3. Eliminar el ingreso
    const { error: deleteError } = await (await getSupabaseServerClient()).from('PettyCashIncome')
      .delete()
      .eq('id', incomeId)
      .eq('sessionId', sessionId);

    if (deleteError) {
      console.error('Error deleting petty cash income:', deleteError);
      throw new Error('Error al eliminar el ingreso');
    }

    // 4. Actualizar el saldo de la sesión
    const newCurrentAmount = session.currentAmount - income.amount;
    const { error: updateError } = await (await getSupabaseServerClient()).from('CashSession')
      .update({ currentAmount: newCurrentAmount })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Error updating session amount after deletion:', updateError);
      throw new Error('Error al actualizar el saldo de la sesión');
    }

    return {
      success: true,
      message: 'Ingreso eliminado exitosamente'
    };

  } catch (error) {
    console.error('Error in deletePettyCashIncome:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      message: 'Error al eliminar el ingreso'
    };
  }
}

/**
 * Exportar ingresos a Excel
 * @param sessionId ID de la sesión
 * @returns Buffer del archivo Excel
 */
export async function exportPettyCashIncomes(sessionId: number) {
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
      console.error('Error getting incomes for export:', error);
      throw new Error('Error al obtener los ingresos para exportar');
    }

    // Aquí podrías usar una librería como xlsx para generar el archivo Excel
    // Por ahora retornamos los datos en formato JSON
    return {
      success: true,
      data: incomes || [],
      count: incomes?.length || 0,
      filename: `ingresos_sesion_${sessionId}_${new Date().toISOString().split('T')[0]}.json`
    };

  } catch (error) {
    console.error('Error in exportPettyCashIncomes:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      data: [],
      count: 0,
      filename: ''
    };
  }
} 