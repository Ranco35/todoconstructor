'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

async function getSupabaseClient() {
  // 🔧 CLIENTE DIRECTO: Sin cookies para server actions con service role
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // ✅ CORREGIDO: Usar service role para server actions
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

export interface CashClosureData {
  id: number;
  sessionId: number;
  totalSales: number;
  salesCash: number;
  salesCard: number;
  totalExpenses: number;
  totalPurchases: number;
  expectedCash: number;
  actualCash: number;
  difference: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  supervisorApproval: boolean;
  closedAt: Date;
  notes?: string | null;
  CashSession: {
    sessionNumber: string;
    openingAmount: number;
    User: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

export interface CashClosureSummary {
  openingAmount: number;
  totalSales: number;
  salesCash: number;
  salesCard: number;
  totalExpenses: number;
  totalPurchases: number;
  totalIncomes: number;
  expectedCash: number;
  sessionNumber: string;
  userName: string;
  sessionDuration: string;
}

export async function getCashClosureSummary(sessionId: number): Promise<CashClosureSummary | null> {
  try {
    const supabase = await getSupabaseClient();

    // 🔍 DEBUG: Verificar existencia de sesión sin filtros
    console.log('🔍 CLOSURE SUMMARY DEBUG - SessionID:', sessionId);
    
    const { data: session, error: sessionError } = await supabase
      .from('CashSession')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      console.log('❌ Error obteniendo sesión o sesión no encontrada:', sessionError);
      return null;
    }

    console.log('✅ Sesión encontrada:', session.id, 'Estado:', session.status);

    // Obtener información del usuario por separado
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('*')
      .eq('id', session.userId)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      // No retornar null, continuar con datos por defecto
    }

    // Obtener ventas del día para esta caja registradora
    // Por ahora no hay tabla de ventas, usamos valores por defecto
    const totalSales = 0;
    const salesCash = 0;
    const salesCard = 0;

    // Obtener gastos, compras e ingresos
    const { data: expenses, error: expensesError } = await supabase
      .from('PettyCashExpense')
      .select('*')
      .eq('sessionId', sessionId);

    if (expensesError) {
      console.error('Error fetching expenses:', expensesError);
      // Continuar con array vacío en lugar de retornar null
    }

    const { data: purchases, error: purchasesError } = await supabase
      .from('PettyCashPurchase')
      .select('*')
      .eq('sessionId', sessionId);

    if (purchasesError) {
      console.error('Error fetching purchases:', purchasesError);
      // Continuar con array vacío en lugar de retornar null
    }

    const { data: incomes, error: incomesError } = await supabase
      .from('PettyCashIncome')
      .select('*')
      .eq('sessionId', sessionId);

    if (incomesError) {
      console.error('Error fetching incomes:', incomesError);
      // Continuar con array vacío en lugar de retornar null
    }

    const totalExpenses = expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
    const totalPurchases = purchases?.reduce((sum, purchase) => sum + (purchase.quantity * purchase.unitPrice), 0) || 0;
    const totalIncomes = incomes?.filter(inc => inc.paymentMethod === 'Efectivo')
      .reduce((sum, income) => sum + income.amount, 0) || 0;

    // CÁLCULO CORRECTO: Efectivo esperado = Monto inicial + Ventas en efectivo + Ingresos - Gastos - Compras
    const expectedCash = session.openingAmount + salesCash + totalIncomes - totalExpenses - totalPurchases;
    
    console.log('🧮 DEBUG CLOSURE SUMMARY - getCashClosureSummary:');
    console.log(`   SessionID: ${sessionId}`);
    console.log(`   Expenses data:`, expenses);
    console.log(`   Purchases data:`, purchases);
    console.log(`   Incomes data:`, incomes);
    console.log(`💰 Monto inicial: $${session.openingAmount}`);
    console.log(`🛒 Ventas en efectivo: $${salesCash}`);
    console.log(`💵 Total ingresos en efectivo: $${totalIncomes}`);
    console.log(`💸 Total gastos calculado: $${totalExpenses}`);
    console.log(`🛍️ Total compras calculado: $${totalPurchases}`);
    console.log(`🎯 Efectivo esperado: $${expectedCash}`);

    // Calcular duración de la sesión
    const endTime = session.closedAt ? new Date(session.closedAt) : new Date();
    const duration = endTime.getTime() - new Date(session.openedAt).getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    const sessionDuration = `${hours}h ${minutes}min`;

    return {
      openingAmount: session.openingAmount,
      totalSales,
      salesCash,
      salesCard,
      totalExpenses,
      totalPurchases,
      totalIncomes,
      expectedCash,
      sessionNumber: `S${session.id}`,
      userName: user?.name || 'Usuario',
      sessionDuration,
    };
  } catch (error) {
    console.error('Error getting cash closure summary:', error);
    return null;
  }
}

export async function createCashClosure(formData: FormData) {
  try {
    const supabase = await getSupabaseClient();
    
    const sessionId = parseInt(formData.get('sessionId') as string);
    const actualCash = parseFloat(formData.get('actualCash') as string);
    const notes = formData.get('notes') as string;

    console.log('🔒 Iniciando cierre de caja para sesión:', sessionId);

    // Validar que el sessionId sea válido
    if (!sessionId || isNaN(sessionId)) {
      console.error('❌ SessionID inválido:', sessionId);
      return { success: false, error: 'ID de sesión inválido' };
    }

    // 🔍 DEBUG: Primero buscar la sesión sin filtros para ver si existe
    console.log('🔍 DEBUG: Buscando sesión sin filtros...');
    const { data: sessionDebug, error: debugError } = await supabase
      .from('CashSession')
      .select('id, status, openingAmount, userId')
      .eq('id', sessionId)
      .single();
      
    console.log('🔍 DEBUG - Sesión encontrada sin filtros:', sessionDebug);
    console.log('🔍 DEBUG - Error sin filtros:', debugError);

    // Obtener datos básicos de la sesión directamente - SOLO SESIONES ABIERTAS
    const { data: session, error: sessionError } = await supabase
      .from('CashSession')
      .select('*')
      .eq('id', sessionId)
      .eq('status', 'open')  // ✅ FILTRO CRÍTICO: Solo sesiones abiertas
      .single();

    console.log('✅ Sesión encontrada:', session?.id, 'Estado:', session?.status);

    if (sessionError || !session) {
      console.error('❌ Error al buscar sesión:', sessionError);
      
      // Mensaje más específico según el tipo de error
      let errorMessage = 'No se pudo encontrar la sesión de caja';
      if (sessionError?.code === 'PGRST116') {
        errorMessage = `La sesión con ID ${sessionId} no existe, fue eliminada, o ya está cerrada`;
      } else if (sessionError) {
        errorMessage = `Error de base de datos: ${sessionError.message}`;
      }
      
      return { success: false, error: errorMessage };
    }

    // Verificar que la sesión esté abierta
    if (session.status !== 'open') {
      console.error('❌ Intentando cerrar sesión que no está abierta:', session.status);
      return { success: false, error: `La sesión ya está ${session.status === 'closed' ? 'cerrada' : 'suspendida'}` };
    }

    // Obtener datos básicos del usuario
    const { data: user, error: userError } = await supabase
      .from('User')
      .select('id, name, email')
      .eq('id', session.userId)
      .single();

    // Obtener gastos y compras básicos (sin validar errores estrictos)
    const { data: expenses } = await supabase
      .from('PettyCashExpense')
      .select('amount')
      .eq('sessionId', sessionId);

    const { data: purchases } = await supabase
      .from('PettyCashPurchase')
      .select('quantity, unitPrice')
      .eq('sessionId', sessionId);

    // Calcular totales básicos
    const totalExpenses = expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
    const totalPurchases = purchases?.reduce((sum, purchase) => sum + (purchase.quantity * purchase.unitPrice), 0) || 0;
    
    // CÁLCULO CORRECTO: Mismo que en getCashClosureSummary
    // Por ahora salesCash = 0 hasta que se implemente el módulo de ventas
    const salesCash = 0; 
    const expectedCash = session.openingAmount + salesCash - totalExpenses - totalPurchases;
    const difference = actualCash - expectedCash;

    console.log('🔒 CIERRE DE CAJA - CÁLCULO FINAL:');
    console.log(`💰 Monto inicial: $${session.openingAmount}`);
    console.log(`🛒 Ventas en efectivo: $${salesCash}`);
    console.log(`💸 Total gastos: $${totalExpenses}`);
    console.log(`🛍️ Total compras: $${totalPurchases}`);
    console.log(`🎯 Efectivo esperado: $${expectedCash}`);
    console.log(`💵 Efectivo contado: $${actualCash}`);
    console.log(`📊 Diferencia: $${difference}`);

    // Crear notas del cierre
    const closureNotes = `CIERRE DE CAJA:
Monto inicial: $${session.openingAmount.toLocaleString()}
Gastos caja chica: $${totalExpenses.toLocaleString()}
Compras caja chica: $${totalPurchases.toLocaleString()}
Efectivo esperado: $${expectedCash.toLocaleString()}
Efectivo contado: $${actualCash.toLocaleString()}
Diferencia: ${difference >= 0 ? '+' : ''}$${difference.toLocaleString()}
Estado: CERRADO
Usuario: ${user?.name || 'Usuario'}
Fecha cierre: ${new Date().toLocaleString()}
${notes ? `Observaciones: ${notes}` : ''}`;

    // Cerrar la sesión de caja
    const { error: updateError } = await supabase
      .from('CashSession')
      .update({
        status: 'closed',
        closedAt: new Date().toISOString(),
        currentAmount: actualCash,
        notes: closureNotes
      })
      .eq('id', sessionId);

    if (updateError) {
      console.error('Error closing session:', updateError);
      return { success: false, error: 'Error al cerrar la sesión: ' + updateError.message };
    }

    revalidatePath('/dashboard/pettyCash');
    return { 
      success: true, 
      sessionId: sessionId,
      difference,
      expectedCash,
      actualCash,
      userName: user?.name || 'Usuario'
    };
  } catch (error) {
    console.error('Error creating cash closure:', error);
    return { success: false, error: 'Error al crear el cierre de caja: ' + error.message };
  }
}

export async function approveCashClosure(formData: FormData) {
  try {
    const supabase = await getSupabaseClient();
    
    const closureId = parseInt(formData.get('closureId') as string);
    const approvedBy = parseInt(formData.get('approvedBy') as string);
    const notes = formData.get('notes') as string;

    const { error } = await supabase
      .from('cashClosure')
      .update({
        status: 'APPROVED',
        supervisorApproval: true,
        approvedBy,
        notes,
      })
      .eq('id', closureId);

    if (error) {
      console.error('Error approving cash closure:', error);
      return { success: false, error: 'Error al aprobar el cierre de caja' };
    }

    revalidatePath('/dashboard/pettyCash');
    return { success: true };
  } catch (error) {
    console.error('Error approving cash closure:', error);
    return { success: false, error: 'Error al aprobar el cierre de caja' };
  }
}

export async function rejectCashClosure(formData: FormData) {
  try {
    const supabase = await getSupabaseClient();
    
    const closureId = parseInt(formData.get('closureId') as string);
    const approvedBy = parseInt(formData.get('approvedBy') as string);
    const notes = formData.get('notes') as string;

    const { error: closureError } = await supabase
      .from('cashClosure')
      .update({
        status: 'REJECTED',
        approvedBy,
        notes,
      })
      .eq('id', closureId);

    if (closureError) {
      console.error('Error rejecting cash closure:', closureError);
      return { success: false, error: 'Error al rechazar el cierre de caja' };
    }

    // Reabrir la sesión de caja para corrección
    const { data: closure, error: fetchError } = await supabase
      .from('cashClosure')
      .select('sessionId')
      .eq('id', closureId)
      .single();

    if (!fetchError && closure) {
      const { error: sessionError } = await supabase
        .from('cashSession')
        .update({
          status: 'OPEN',
          closedAt: null,
          closingAmount: null,
        })
        .eq('id', closure.sessionId);

      if (sessionError) {
        console.error('Error reopening session:', sessionError);
      }
    }

    revalidatePath('/dashboard/pettyCash');
    return { success: true };
  } catch (error) {
    console.error('Error rejecting cash closure:', error);
    return { success: false, error: 'Error al rechazar el cierre de caja' };
  }
}

export async function getCashClosures(limit: number = 10): Promise<CashClosureData[]> {
  try {
    const supabase = await getSupabaseClient();

    const { data: closures, error } = await supabase
      .from('cashClosure')
      .select(`
        *,
        CashSession:sessionId(
          sessionNumber,
          openingAmount,
          User:userId(firstName, lastName, email)
        )
      `)
      .order('closedAt', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error getting cash closures:', error);
      return [];
    }

    return closures || [];
  } catch (error) {
    console.error('Error getting cash closures:', error);
    return [];
  }
}

export async function getCashClosureById(closureId: number): Promise<CashClosureData | null> {
  try {
    const supabase = await getSupabaseClient();

    const { data: closure, error } = await supabase
      .from('cashClosure')
      .select(`
        *,
        CashSession:sessionId(
          sessionNumber,
          openingAmount,
          User:userId(firstName, lastName, email)
        )
      `)
      .eq('id', closureId)
      .single();

    if (error) {
      console.error('Error getting cash closure by id:', error);
      return null;
    }

    return closure;
  } catch (error) {
    console.error('Error getting cash closure by id:', error);
    return null;
  }
}

export async function getDailyCashReport(date: Date = new Date()) {
  try {
    const supabase = await getSupabaseClient();
    
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

    const { data: sessions, error } = await supabase
      .from('cashSession')
      .select(`
        *,
        User:userId(firstName, lastName, email),
        CashRegister:cashRegisterId(*),
        CashClosure:sessionId(*)
      `)
      .gte('openedAt', startOfDay.toISOString())
      .lt('openedAt', endOfDay.toISOString());

    if (error) {
      console.error('Error getting daily cash report:', error);
      return null;
    }

    const closures = sessions?.filter(session => session.CashClosure) || [];
    const totalSessions = sessions?.length || 0;
    const closedSessions = closures.length;
    const openSessions = totalSessions - closedSessions;

    const totalSales = closures.reduce((sum, session) => sum + (session.CashClosure?.totalSales || 0), 0);
    const totalExpenses = closures.reduce((sum, session) => sum + (session.CashClosure?.totalExpenses || 0), 0);
    const totalPurchases = closures.reduce((sum, session) => sum + (session.CashClosure?.totalPurchases || 0), 0);
    const totalDifferences = closures.reduce((sum, session) => sum + Math.abs(session.CashClosure?.difference || 0), 0);

    return {
      date: date.toISOString().split('T')[0],
      totalSessions,
      closedSessions,
      openSessions,
      totalSales,
      totalExpenses,
      totalPurchases,
      totalDifferences,
      sessions: sessions || [],
    };
  } catch (error) {
    console.error('Error getting daily cash report:', error);
    return null;
  }
} 