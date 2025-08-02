'use server';

import { getSupabaseServerClient, getSupabaseServiceClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import * as XLSX from 'xlsx';
import { getCurrentUser } from './auth-actions';

// Types
export interface CashSessionData {
  id: number;
  sessionNumber?: string;
  userId: string; // UUID string
  cashRegisterId: number;
  openingAmount: number;
  currentAmount: number;
  openedAt: Date;
  closedAt?: Date | null;
  status: 'open' | 'closed' | 'suspended'; // Minúsculas
  notes?: string | null;
  User: {
    id: string;
    name: string;
    email: string;
  };
  CashRegister: {
    id: number;
    name: string;
    location: string;
  };
}

export interface PettyCashExpenseData {
  id: number;
  description: string;
  amount: number;
  category?: string | null;
  categoryId?: number | null;
  receiptImage?: string | null;
  createdAt?: Date;
  approvedAt?: Date | null;
  notes?: string | null;
  costCenterId?: number | null;
  paymentMethod?: 'cash' | 'transfer' | 'card' | 'other';
  transactionType?: 'expense' | 'income' | 'refund';
  affectsPhysicalCash?: boolean;
  bankReference?: string | null;
  bankAccount?: string | null;
  User: {
    name: string;
  };
  ApprovedByUser?: {
    name: string;
  };
  Category?: {
    id: number;
    name: string;
    description?: string | null;
  } | null;
  CostCenter?: {
    id: number;
    name: string;
    code?: string | null;
  } | null;
}

export interface PettyCashPurchaseData {
  id: number;
  description: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  supplier?: string | null;
  receiptImage?: string | null;
  createdAt?: Date;
  approvedAt?: Date | null;
  notes?: string | null;
  productId?: number | null;
  costCenterId?: number | null;
  paymentMethod?: 'cash' | 'transfer' | 'card' | 'other';
  transactionType?: 'purchase' | 'return';
  affectsPhysicalCash?: boolean;
  bankReference?: string | null;
  bankAccount?: string | null;
  User: {
    name: string;
  };
  ApprovedByUser?: {
    name: string;
  };
  Product?: {
    id: number;
    name: string;
    sku?: string | null;
    Category?: {
      id: number;
      name: string;
    } | null;
  } | null;
  CostCenter?: {
    id: number;
    name: string;
    code?: string | null;
  } | null;
}

// Funciones básicas de caja chica
export async function createCashSession(formData: FormData) {
  try {
    const userId = formData.get('userId') as string;
    const cashRegisterId = parseInt(formData.get('cashRegisterId') as string);
    const openingAmount = parseFloat(formData.get('openingAmount') as string);
    const notes = formData.get('notes') as string;

    const supabase = await getSupabaseServerClient();
    const { data: session, error } = await supabase
      .from('CashSession')
      .insert({
        userId,
        cashRegisterId,
        openingAmount,
        currentAmount: openingAmount,
        notes,
        status: 'open'
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/pettyCash');
    return { success: true, sessionId: session.id };
  } catch (error) {
    console.error('Error creating cash session:', error);
    return { success: false, error: 'Error al crear la sesión de caja' };
  }
}

export async function createCashSessionWithVerification(formData: FormData) {
  try {
    const userId = formData.get('userId') as string;
    const cashRegisterId = parseInt(formData.get('cashRegisterId') as string);
    const declaredAmount = parseFloat(formData.get('declaredAmount') as string);
    const notes = formData.get('notes') as string;
    const expectedAmount = formData.get('expectedAmount') ? parseFloat(formData.get('expectedAmount') as string) : null;

    let difference = 0;
    let hasDiscrepancy = false;
    if (expectedAmount !== null) {
      difference = declaredAmount - expectedAmount;
      hasDiscrepancy = Math.abs(difference) > 0;
    }

    let sessionNotes = notes || '';
    if (hasDiscrepancy && expectedAmount !== null) {
      const discrepancyNote = `DIFERENCIA EN APERTURA: Esperado $${expectedAmount?.toLocaleString()}, Declarado $${declaredAmount.toLocaleString()}, Diferencia ${difference >= 0 ? '+' : ''}$${difference.toLocaleString()}`;
      sessionNotes = sessionNotes ? `${discrepancyNote}\n\n${notes}` : discrepancyNote;
    }

    const { data: session, error } = await (await getSupabaseServerClient()).from('CashSession')
      .insert({
        userId,
        cashRegisterId,
        openingAmount: declaredAmount,
        currentAmount: declaredAmount,
        status: 'open',
        notes: sessionNotes,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/pettyCash');
    return { success: true, sessionId: session.id };
  } catch (error) {
    console.error('Error creating cash session with verification:', error);
    return { success: false, error: 'Error al crear la sesión de caja' };
  }
}

export async function getPreviousDayBalance(cashRegisterId: number) {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1);

    const { data: lastSession, error } = await (await getSupabaseServerClient()).from('CashSession')
      .select('*')
      .eq('cashRegisterId', cashRegisterId)
      .gte('openedAt', startOfYesterday.toISOString())
      .lt('openedAt', endOfYesterday.toISOString())
      .order('openedAt', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!lastSession) {
      return {
        hasPreviousSession: false,
        previousBalance: 0,
        previousSessionId: null
      };
    }

    const { data: expenses } = await (await getSupabaseServerClient()).from('PettyCashExpense')
      .select('amount, affectsPhysicalCash')
      .eq('sessionId', lastSession.id);

    const { data: purchases } = await (await getSupabaseServerClient()).from('PettyCashPurchase')
      .select('totalAmount, affectsPhysicalCash')
      .eq('sessionId', lastSession.id);

    const { data: incomes } = await (await getSupabaseServerClient()).from('PettyCashExpense')
      .select('amount, affectsPhysicalCash')
      .eq('sessionId', lastSession.id)
      .eq('transactionType', 'income');

    const totalExpenses = expenses?.reduce((sum, exp) => 
      sum + (exp.affectsPhysicalCash ? exp.amount : 0), 0) || 0;
    const totalPurchases = purchases?.reduce((sum, pur) => 
      sum + (pur.affectsPhysicalCash ? pur.totalAmount : 0), 0) || 0;
    const totalIncomes = incomes?.reduce((sum, inc) => 
      sum + (inc.affectsPhysicalCash ? inc.amount : 0), 0) || 0;

    const previousBalance = lastSession.openingAmount + totalIncomes - totalExpenses - totalPurchases;

    return {
      hasPreviousSession: true,
      previousBalance,
      previousSessionId: lastSession.id
    };
  } catch (error) {
    console.error('Error getting previous day balance:', error);
    return {
      hasPreviousSession: false,
      previousBalance: 0,
      previousSessionId: null
    };
  }
}

// Nueva función para obtener la última sesión cerrada (sin restricción de fechas)
export async function getLastClosedSessionBalance(cashRegisterId: number) {
  try {
    console.log('🔍 Buscando última sesión cerrada para caja:', cashRegisterId);
    
    // Buscar la última sesión cerrada sin importar la fecha
    const { data: lastSession, error } = await (await getSupabaseServerClient()).from('CashSession')
      .select(`
        *,
        User:User(id, name, email)
      `)
      .eq('cashRegisterId', cashRegisterId)
      .eq('status', 'closed')
      .order('closedAt', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Error al buscar última sesión cerrada:', error);
      throw error;
    }

    if (!lastSession) {
      console.log('⚠️ No se encontró ninguna sesión cerrada');
      return {
        hasHistory: false,
        message: 'Esta es la primera sesión de caja. No hay historial previo.',
        expectedAmount: 0
      };
    }

    console.log('✅ Última sesión cerrada encontrada:', {
      id: lastSession.id,
      openingAmount: lastSession.openingAmount,
      currentAmount: lastSession.currentAmount,
      closedAt: lastSession.closedAt,
      user: lastSession.User?.name
    });

    // Obtener transacciones de la sesión cerrada
    const { data: expenses } = await (await getSupabaseServerClient()).from('PettyCashExpense')
      .select('amount, affectsPhysicalCash, transactionType')
      .eq('sessionId', lastSession.id);

    const { data: purchases } = await (await getSupabaseServerClient()).from('PettyCashPurchase')
      .select('totalAmount, affectsPhysicalCash')
      .eq('sessionId', lastSession.id);

    // Separar gastos e ingresos
    const regularExpenses = expenses?.filter(exp => exp.transactionType !== 'income') || [];
    const incomes = expenses?.filter(exp => exp.transactionType === 'income') || [];

    const totalExpenses = regularExpenses.reduce((sum, exp) => 
      sum + (exp.affectsPhysicalCash ? exp.amount : 0), 0);
    const totalPurchases = purchases?.reduce((sum, pur) => 
      sum + (pur.affectsPhysicalCash ? pur.totalAmount : 0), 0) || 0;
    const totalIncomes = incomes.reduce((sum, inc) => 
      sum + (inc.affectsPhysicalCash ? inc.amount : 0), 0);

    // El saldo esperado es el currentAmount de la sesión cerrada
    const expectedAmount = lastSession.currentAmount;
    
    // Calcular diferencia si había una en el cierre
    const calculatedBalance = lastSession.openingAmount + totalIncomes - totalExpenses - totalPurchases;
    const difference = lastSession.currentAmount - calculatedBalance;

    console.log('💰 Cálculo de saldo:', {
      openingAmount: lastSession.openingAmount,
      totalIncomes,
      totalExpenses,
      totalPurchases,
      calculatedBalance,
      currentAmount: lastSession.currentAmount,
      expectedAmount,
      difference
    });

    return {
      hasHistory: true,
      expectedAmount,
      lastClosureDate: lastSession.closedAt,
      lastSessionDate: lastSession.openedAt,
      lastSessionNumber: `#${lastSession.id}`,
      lastUser: lastSession.User?.name || 'Usuario desconocido',
      difference,
      source: 'closure' as const,
      message: `Última sesión cerrada: ${new Date(lastSession.closedAt).toLocaleString('es-CL')}`,
      sessionId: lastSession.id
    };
  } catch (error) {
    console.error('❌ Error getting last closed session balance:', error);
    return {
      hasHistory: false,
      message: 'Error al obtener el saldo de la última sesión cerrada',
      error: error instanceof Error ? error.message : 'Error desconocido',
      expectedAmount: 0
    };
  }
}

export async function getCurrentCashSession(cashRegisterId: number): Promise<CashSessionData | null> {
  try {
    const supabase = await getSupabaseServiceClient();
    const { data: session, error } = await supabase
      .from('CashSession')
      .select(`
        *,
        User:User(id, name, email)
      `)
      .eq('cashRegisterId', cashRegisterId)
      .eq('status', 'open')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error getting current cash session:', error);
      return null;
    }

    if (!session) {
      return null;
    }

    return {
      id: session.id,
      sessionNumber: session.sessionNumber,
      userId: session.userId,
      cashRegisterId: session.cashRegisterId,
      openingAmount: session.openingAmount,
      currentAmount: session.currentAmount,
      openedAt: new Date(session.openedAt),
      closedAt: session.closedAt ? new Date(session.closedAt) : null,
      status: session.status,
      notes: session.notes,
      User: {
        id: session.User?.id || 'unknown',
        name: session.User?.name || 'Usuario no encontrado',
        email: session.User?.email || 'email@noencontrado.com',
      },
      CashRegister: {
        id: session.cashRegisterId,
        name: 'Caja Principal',
        location: 'Ubicación Principal',
      }
    };
  } catch (error) {
    console.error('Error getting current cash session:', error);
    return null;
  }
}

// Nueva función para obtener una sesión específica por ID
export async function getCashSessionById(sessionId: number): Promise<CashSessionData | null> {
  try {
    const { data: session, error } = await (await getSupabaseServerClient()).from('CashSession')
      .select(`
        *,
        User:User(id, name, email)
      `)
      .eq('id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No found
        return null;
      }
      console.error('Error getting cash session by ID:', error);
      return null;
    }

    return {
      id: session.id,
      sessionNumber: session.sessionNumber,
      userId: session.userId,
      cashRegisterId: session.cashRegisterId,
      openingAmount: session.openingAmount,
      currentAmount: session.currentAmount,
      openedAt: new Date(session.openedAt),
      closedAt: session.closedAt ? new Date(session.closedAt) : null,
      status: session.status,
      notes: session.notes,
      User: {
        id: session.User?.id || 'unknown',
        name: session.User?.name || 'Usuario no encontrado',
        email: session.User?.email || 'email@noencontrado.com',
      },
      CashRegister: {
        id: session.cashRegisterId,
        name: 'Caja Principal',
        location: 'Ubicación Principal',
      }
    };
  } catch (error) {
    console.error('Error getting cash session by ID:', error);
    return null;
  }
}

export async function createPettyCashExpense(formData: FormData) {
  try {
    const sessionId = parseInt(formData.get('sessionId') as string);
    const description = formData.get('description') as string;
    const amount = parseFloat(formData.get('amount') as string);
    let category = formData.get('categoryId') || formData.get('category');
    if (category && typeof category !== 'string') category = category.toString();
    console.log('[createPettyCashExpense] Valor recibido para categoría:', category);
    const costCenterId = formData.get('costCenterId') ? parseInt(formData.get('costCenterId') as string) : null;
    const paymentMethod = formData.get('paymentMethod') as 'cash' | 'transfer' | 'card' | 'other';
    const transactionType = formData.get('transactionType') as 'expense' | 'income' | 'refund';
    const affectsPhysicalCash = formData.get('affectsPhysicalCash') === 'true';
    const bankReference = formData.get('bankReference') as string;
    const bankAccount = formData.get('bankAccount') as string;

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    if (!category) {
      console.error('[createPettyCashExpense] Error: categoría no recibida');
      return { success: false, error: 'La categoría es obligatoria' };
    }

    const { data: expense, error } = await (await getSupabaseServiceClient()).from('PettyCashExpense')
      .insert({
        sessionId,
        description,
        amount,
        category,
        costCenterId,
        paymentMethod,
        transactionType,
        affectsPhysicalCash,
        bankReference: bankReference || null,
        bankAccount: bankAccount || null,
        userId: currentUser.id
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/pettyCash');
    return { success: true, expenseId: expense.id };
  } catch (error) {
    console.error('Error creating petty cash expense:', error);
    return { success: false, error: 'Error al crear el gasto' };
  }
}

export async function createPettyCashPurchase(formData: FormData) {
  try {
    const sessionId = parseInt(formData.get('sessionId') as string);
    const quantity = parseFloat(formData.get('quantity') as string);
    const unitPrice = parseFloat(formData.get('unitPrice') as string);
    const productId = formData.get('productId') ? parseInt(formData.get('productId') as string) : null;
    const costCenterId = formData.get('costCenterId') ? parseInt(formData.get('costCenterId') as string) : null;
    const supplierId = formData.get('supplierId') ? parseInt(formData.get('supplierId') as string) : null;
    const paymentMethod = formData.get('paymentMethod') as 'cash' | 'transfer' | 'card' | 'other';
    const transactionType = formData.get('transactionType') as 'purchase' | 'return';
    const affectsPhysicalCash = formData.get('affectsPhysicalCash') === 'true';
    const bankReference = formData.get('bankReference') as string;
    const bankAccount = formData.get('bankAccount') as string;

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    const totalAmount = quantity * unitPrice;

    const { data: purchase, error } = await (await getSupabaseServiceClient()).from('PettyCashPurchase')
      .insert({
        sessionId,
        quantity,
        unitPrice,
        totalAmount,
        productId,
        costCenterId,
        supplierId,
        paymentMethod,
        transactionType,
        affectsPhysicalCash,
        bankReference: bankReference || null,
        bankAccount: bankAccount || null,
        userId: currentUser.id
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/pettyCash');
    return { success: true, purchaseId: purchase.id };
  } catch (error) {
    console.error('Error creating petty cash purchase:', error);
    return { success: false, error: 'Error al crear la compra' };
  }
}

export async function getPettyCashExpenses(sessionId: number): Promise<PettyCashExpenseData[]> {
  try {
    const { data: expenses, error } = await (await getSupabaseServerClient()).from('PettyCashExpense')
      .select(`
        *,
        User:User(name),
        Cost_Center:Cost_Center(id, name, code)
      `)
      .eq('sessionId', sessionId)
      .order('createdAt', { ascending: false });

    if (error) throw error;

    return expenses?.map(expense => ({
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      categoryId: expense.categoryId,
      receiptImage: expense.receiptImage,
      createdAt: expense.createdAt ? new Date(expense.createdAt) : undefined,
      approvedAt: expense.approvedAt ? new Date(expense.approvedAt) : null,
      notes: expense.notes,
      costCenterId: expense.costCenterId,
      paymentMethod: expense.paymentMethod,
      transactionType: expense.transactionType,
      affectsPhysicalCash: expense.affectsPhysicalCash,
      bankReference: expense.bankReference,
      bankAccount: expense.bankAccount,
      User: {
        name: expense.User?.name || 'Usuario no encontrado'
      },
      Category: null, // No hay relación con Category en la estructura actual
      CostCenter: expense.Cost_Center ? {
        id: expense.Cost_Center.id,
        name: expense.Cost_Center.name,
        code: expense.Cost_Center.code
      } : null
    })) || [];
  } catch (error) {
    console.error('Error getting petty cash expenses:', error);
    return [];
  }
}

export async function getPettyCashPurchases(sessionId: number): Promise<PettyCashPurchaseData[]> {
  try {
    const { data: purchases, error } = await (await getSupabaseServerClient()).from('PettyCashPurchase')
      .select(`
        *,
        User:User(name),
        Product:Product(id, name, sku),
        Cost_Center:Cost_Center(id, name, code)
      `)
      .eq('sessionId', sessionId)
      .order('createdAt', { ascending: false });

    if (error) throw error;

    return purchases?.map(purchase => ({
      id: purchase.id,
      description: purchase.description || 'Compra sin descripción',
      productName: purchase.Product?.name || 'Producto no encontrado',
      quantity: purchase.quantity,
      unitPrice: purchase.unitPrice,
      totalAmount: purchase.totalAmount,
      supplier: purchase.supplier,
      receiptImage: purchase.receiptImage,
      createdAt: purchase.createdAt ? new Date(purchase.createdAt) : undefined,
      approvedAt: purchase.approvedAt ? new Date(purchase.approvedAt) : null,
      notes: purchase.notes,
      productId: purchase.productId,
      costCenterId: purchase.costCenterId,
      paymentMethod: purchase.paymentMethod,
      transactionType: purchase.transactionType,
      affectsPhysicalCash: purchase.affectsPhysicalCash,
      bankReference: purchase.bankReference,
      bankAccount: purchase.bankAccount,
      User: {
        name: purchase.User?.name || 'Usuario no encontrado'
      },
      Product: purchase.Product ? {
        id: purchase.Product.id,
        name: purchase.Product.name,
        sku: purchase.Product.sku,
        Category: null // No hay relación anidada con Category
      } : null,
      CostCenter: purchase.Cost_Center ? {
        id: purchase.Cost_Center.id,
        name: purchase.Cost_Center.name,
        code: purchase.Cost_Center.code
      } : null
    })) || [];
  } catch (error) {
    console.error('Error getting petty cash purchases:', error);
    return [];
  }
}

export async function getPettyCashSummary(sessionId: number) {
  try {
    const [expenses, purchases, incomesResult] = await Promise.all([
      getPettyCashExpenses(sessionId),
      getPettyCashPurchases(sessionId),
      (await getSupabaseServerClient()).from('PettyCashIncome')
        .select('amount, paymentMethod')
        .eq('sessionId', sessionId)
    ]);

    const totalExpenses = expenses
      .filter(exp => exp.affectsPhysicalCash)
      .reduce((sum, exp) => sum + exp.amount, 0);

    const totalPurchases = purchases
      .filter(pur => pur.affectsPhysicalCash)
      .reduce((sum, pur) => sum + pur.totalAmount, 0);

    // Solo contar ingresos en efectivo para el cálculo físico
    const totalIncomes = incomesResult.data
      ?.filter(inc => inc.paymentMethod === 'Efectivo')
      .reduce((sum, inc) => sum + inc.amount, 0) || 0;

    console.log('💰 RESUMEN CALCULADO:', {
      totalExpenses,
      totalPurchases,
      totalIncomes,
      netCashFlow: totalIncomes - totalExpenses - totalPurchases
    });

    return {
      totalExpenses,
      totalPurchases,
      totalIncomes,
      totalTransactions: expenses.length + purchases.length + (incomesResult.data?.length || 0),
      pendingTransactions: 0, // Todos están aprobados automáticamente
      totalSpent: totalExpenses + totalPurchases,
      netCashFlow: totalIncomes - totalExpenses - totalPurchases
    };
  } catch (error) {
    console.error('Error getting petty cash summary:', error);
    return {
      totalExpenses: 0,
      totalPurchases: 0,
      totalIncomes: 0,
      totalTransactions: 0,
      pendingTransactions: 0,
      totalSpent: 0,
      netCashFlow: 0
    };
  }
}

export async function getCashSessions(filters?: {
  status?: 'OPEN' | 'CLOSED' | 'SUSPENDED';
  startDate?: Date;
  endDate?: Date;
  userId?: number;
  limit?: number;
}): Promise<CashSessionData[]> {
  try {
    const supabase = await getSupabaseServiceClient();
    
    let query = supabase
      .from('CashSession')
      .select(`
        *,
        User:User(id, name, email)
      `)
      .order('openedAt', { ascending: false });

    console.log('📋 Base query constructed');

    if (filters?.status) {
      query = query.eq('status', filters.status.toLowerCase());
      console.log('🔍 Status filter applied:', filters.status.toLowerCase());
    }

    if (filters?.startDate) {
      query = query.gte('openedAt', filters.startDate.toISOString());
      console.log('📅 Start date filter applied:', filters.startDate.toISOString());
    }

    if (filters?.endDate) {
      query = query.lte('openedAt', filters.endDate.toISOString());
      console.log('📅 End date filter applied:', filters.endDate.toISOString());
    }

    if (filters?.userId) {
      query = query.eq('userId', filters.userId);
      console.log('👤 User ID filter applied:', filters.userId);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
      console.log('📊 Limit filter applied:', filters.limit);
    }

    console.log('🚀 Executing query...');
    const { data: sessions, error } = await query;

    if (error) {
      console.error('❌ Query error:', error);
      throw error;
    }

    console.log('✅ Query successful, sessions received:', sessions?.length || 0);
    console.log('📄 Raw sessions data:', sessions);

    const mappedSessions = sessions?.map(session => ({
      id: session.id,
      sessionNumber: session.sessionNumber,
      userId: session.userId,
      cashRegisterId: session.cashRegisterId,
      openingAmount: session.openingAmount,
      currentAmount: session.currentAmount,
      openedAt: new Date(session.openedAt),
      closedAt: session.closedAt ? new Date(session.closedAt) : null,
      status: session.status,
      notes: session.notes,
      User: {
        id: session.User?.id || 'unknown',
        name: session.User?.name || 'Usuario no encontrado',
        email: session.User?.email || 'email@noencontrado.com',
      },
      CashRegister: {
        id: session.cashRegisterId,
        name: 'Caja Principal',
        location: 'Ubicación Principal',
      },
      // Campo explícito para el frontend
      closingAmount: session.status === 'closed' ? session.currentAmount : null,
    })) || [];

    console.log('📊 Mapped sessions result:', mappedSessions.length);
    console.log('📋 Returning sessions:', mappedSessions);
    
    return mappedSessions;
  } catch (error) {
    console.error('❌ Error getting cash sessions:', error);
    return [];
  }
}

export async function deletePettyCashExpense(expenseId: string, userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    const { data: expense, error: fetchError } = await (await getSupabaseServiceClient()).from('PettyCashExpense')
      .select('*')
      .eq('id', expenseId)
      .single();

    if (fetchError || !expense) {
      return { success: false, error: 'Gasto no encontrado' };
    }

    const { error: deleteError } = await (await getSupabaseServiceClient()).from('PettyCashExpense')
      .delete()
      .eq('id', expenseId);

    if (deleteError) throw deleteError;

    revalidatePath('/dashboard/pettyCash');
    return { success: true };
  } catch (error) {
    console.error('Error deleting petty cash expense:', error);
    return { success: false, error: 'Error al eliminar el gasto' };
  }
}

export async function deletePettyCashPurchase(purchaseId: string, userId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    const { data: purchase, error: fetchError } = await (await getSupabaseServiceClient()).from('PettyCashPurchase')
      .select('*')
      .eq('id', purchaseId)
      .single();

    if (fetchError || !purchase) {
      return { success: false, error: 'Compra no encontrada' };
    }

    const { error: deleteError } = await (await getSupabaseServiceClient()).from('PettyCashPurchase')
      .delete()
      .eq('id', purchaseId);

    if (deleteError) throw deleteError;

    revalidatePath('/dashboard/pettyCash');
    return { success: true };
  } catch (error) {
    console.error('Error deleting petty cash purchase:', error);
    return { success: false, error: 'Error al eliminar la compra' };
  }
}

// Funciones para gestion de cajas historicas
export async function createHistoricalCashSession(formData: FormData) {
  try {
    const sessionNumber = formData.get('sessionNumber') as string;
    const openingAmount = parseFloat(formData.get('openingAmount') as string);
    const currentAmount = parseFloat(formData.get('currentAmount') as string);
    const date = formData.get('date') as string;
    const status = (formData.get('status') as string).toLowerCase() as 'open' | 'closed' | 'suspended';
    const notes = formData.get('notes') as string;

    // Validaciones
    if (!openingAmount || openingAmount <= 0) {
      return { success: false, error: 'El monto de apertura debe ser mayor a 0' };
    }

    if (!date) {
      return { success: false, error: 'La fecha es obligatoria' };
    }

    if (status === 'closed' && (!currentAmount || currentAmount < 0)) {
      return { success: false, error: 'Para sesiones cerradas, el monto actual debe ser mayor o igual a 0' };
    }

    // Usar un usuario válido de la base de datos
    const userId = 'd5a89886-4457-4373-8014-d3e0c4426e35'; // Eduardo ppp

    // Verificar si ya existe una sesión con ese número (si se proporciona)
    if (sessionNumber) {
      const { data: existingSession, error: checkError } = await (await getSupabaseServerClient()).from('CashSession')
        .select('*')
        .eq('sessionNumber', sessionNumber)
        .single();

      if (checkError === null && existingSession) {
        return { success: false, error: 'Ya existe una sesion con ese numero' };
      }
    }

    // Preparar los datos para inserción
    const sessionData: any = {
      userId,
      cashRegisterId: 1,
      openingAmount,
      currentAmount: status === 'closed' ? currentAmount : openingAmount,
      openedAt: new Date(date).toISOString(),
      status,
      notes: notes || `Sesion historica creada el ${new Date().toLocaleDateString()}`
    };

    // Agregar fecha de cierre si la sesión está cerrada
    if (status === 'closed') {
      sessionData.closedAt = new Date(date).toISOString();
    }

    console.log('📋 Creando sesión histórica con datos:', sessionData);

    const { data: session, error } = await (await getSupabaseServerClient()).from('CashSession')
      .insert(sessionData)
      .select()
      .single();

    if (error) {
      console.error('Error creating historical cash session:', error);
      return { success: false, error: 'Error al crear la sesión histórica' };
    }

    console.log('✅ Sesión histórica creada exitosamente:', session);
    revalidatePath('/dashboard/pettyCash');
    return { success: true, sessionId: session.id };
  } catch (error) {
    console.error('Error creating historical cash session:', error);
    return { success: false, error: 'Error inesperado al crear la sesión histórica' };
  }
}

export async function importHistoricalCashSessions(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file) {
      return { success: false, error: 'No se proporciono ningun archivo' };
    }

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    let createdCount = 0;
    let errorCount = 0;

    // Usar un usuario válido de la base de datos
    const userId = 'd5a89886-4457-4373-8014-d3e0c4426e35'; // Eduardo ppp

    for (const row of data as any[]) {
      try {
        const sessionNumber = row['Numero de Sesion'] || row['sessionNumber'];
        const openingAmount = parseFloat(row['Monto Apertura'] || row['openingAmount'] || '0');
        const currentAmount = parseFloat(row['Monto Actual'] || row['currentAmount'] || row['Monto Cierre'] || row['closingAmount'] || '0');
        const date = row['Fecha'] || row['date'] || row['Date'];
        const status = (row['Estado'] || row['status'] || 'CLOSED').toUpperCase();
        const notes = row['Notas'] || row['notes'] || '';

        if (!sessionNumber) {
          errorCount++;
          continue;
        }

        // Verificar si ya existe una sesión con ese número
        const { data: existingSession, error: checkError } = await (await getSupabaseServerClient()).from('CashSession')
          .select('*')
          .eq('sessionNumber', sessionNumber)
          .single();

        if (checkError === null && existingSession) {
          errorCount++;
          continue;
        }

        // Validaciones básicas
        if (!openingAmount || openingAmount <= 0) {
          console.warn(`⚠️ Fila ${index + 1}: Monto de apertura inválido (${openingAmount})`);
          continue;
        }

        if (!date) {
          console.warn(`⚠️ Fila ${index + 1}: Fecha faltante`);
          continue;
        }

        // Preparar datos de sesión
        const sessionData = {
          userId,
          cashRegisterId: 1,
          openingAmount,
          currentAmount: status === 'CLOSED' ? currentAmount : openingAmount,
          openedAt: new Date(date).toISOString(),
          status: status.toLowerCase() as 'open' | 'closed' | 'suspended',
          notes: notes || `Sesión importada el ${new Date().toLocaleDateString()}`,
          ...(status === 'CLOSED' && { closedAt: new Date(date).toISOString() })
        };

        await (await getSupabaseServerClient()).from('CashSession')
          .insert(sessionData);
        createdCount++;
      } catch {
        errorCount++;
      }
    }

    revalidatePath('/dashboard/pettyCash');
    return { 
      success: true, 
      createdCount, 
      errorCount,
      message: `Se importaron ${createdCount} sesiones. ${errorCount} errores.`
    };
  } catch (error) {
    console.error('Error importing historical cash sessions:', error);
    return { success: false, error: 'Error al importar las sesiones' };
  }
}

export async function exportHistoricalCashSessions() {
  try {
    const { data: sessions, error } = await (await getSupabaseServerClient()).from('CashSession')
      .select('*')
      .order('openedAt', { ascending: false });

    if (error) throw error;

    if (!sessions || sessions.length === 0) {
      return {
        success: true,
        data: Buffer.from([]),
        filename: `sesiones_caja_${new Date().toISOString().split('T')[0]}.xlsx`,
        count: 0
      };
    }

    const csvData = sessions.map(session => ({
      'Número de Sesión': session.sessionNumber || `S${session.id}`,
      'Fecha Apertura': session.openedAt.toISOString().split('T')[0],
      'Fecha Cierre': session.closedAt ? session.closedAt.toISOString().split('T')[0] : '',
      'Monto Apertura': session.openingAmount,
      'Monto Actual': session.currentAmount,
      'Estado': session.status.toUpperCase(),
      'Cajero': session.User?.name || 'Usuario no encontrado',
      'Notas': session.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(csvData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sesiones de Caja');
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const filename = `sesiones_caja_${new Date().toISOString().split('T')[0]}.xlsx`;

    return {
      success: true,
      data: Buffer.from(buffer),
      filename,
      count: sessions.length
    };
  } catch (error) {
    console.error('Error exporting historical cash sessions:', error);
    return { success: false, error: 'Error al exportar las sesiones' };
  }
}

// --- CREAR PAGO A PROVEEDOR PART-TIME ---
export async function createSupplierPayment(formData: FormData) {
  try {
    const sessionId = parseInt(formData.get('sessionId') as string);
    const supplierId = parseInt(formData.get('supplierId') as string);
    const amount = parseFloat(formData.get('amount') as string);
    const description = formData.get('description') as string;
    const costCenterId = formData.get('costCenterId') ? parseInt(formData.get('costCenterId') as string) : null;
    const paymentMethod = formData.get('paymentMethod') as 'cash' | 'transfer' | 'card' | 'other';
    const bankReference = formData.get('bankReference') as string;
    const bankAccount = formData.get('bankAccount') as string;
    const receiptNumber = formData.get('receiptNumber') as string;
    const notes = formData.get('notes') as string;

    console.log('🔍 [createSupplierPayment] Datos recibidos:', {
      sessionId,
      supplierId,
      amount,
      description,
      costCenterId,
      paymentMethod,
      bankReference,
      bankAccount,
      receiptNumber,
      notes
    });

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      console.error('❌ [createSupplierPayment] Usuario no autenticado');
      return { success: false, error: 'Usuario no autenticado' };
    }

    // Verificar que el proveedor existe y es tipo PERSONA
    const { data: supplier, error: supplierError } = await (await getSupabaseServerClient()).from('Supplier')
      .select('id, name, companyType')
      .eq('id', supplierId)
      .single();

    if (supplierError || !supplier) {
      console.error('❌ [createSupplierPayment] Proveedor no encontrado', { supplierId, supplierError });
      return { success: false, error: 'Proveedor no encontrado' };
    }

    if (supplier.companyType !== 'PERSONA') {
      console.error('❌ [createSupplierPayment] Proveedor no es PERSONA', { supplierId, companyType: supplier.companyType });
      return { success: false, error: 'Solo se pueden registrar pagos a proveedores tipo Persona Natural' };
    }

    // Verificar que el centro de costo existe
    if (costCenterId) {
      console.log('🔍 [createSupplierPayment] Ejecutando consulta centro de costo:', {
        costCenterId,
        query: `SELECT id, name FROM Cost_Center WHERE id = ${costCenterId}`
      });
      
      // Debug: Obtener todos los centros de costo para verificar
      const { data: allCostCenters, error: allError } = await (await getSupabaseServerClient()).from('Cost_Center')
        .select('id, name, isActive')
        .order('id');
      
      console.log('🔍 [createSupplierPayment] Todos los centros de costo en BD:', allCostCenters);
      
      // Intentar con createClient directo como en el API
      const { createClient } = await import('@supabase/supabase-js');
      const directClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const { data: directCostCenters, error: directError } = await directClient
        .from('Cost_Center')
        .select('id, name, isActive')
        .order('id');
      
      console.log('🔍 [createSupplierPayment] Centros de costo con cliente directo:', directCostCenters);
      
      // Usar el cliente directo para validar el centro de costo específico
      const { data: costCenter, error: costCenterError } = await directClient
        .from('Cost_Center')
        .select('id, name')
        .eq('id', costCenterId)
        .single();

      console.log('🔍 [createSupplierPayment] Resultado búsqueda centro de costo:', { costCenterId, costCenter, costCenterError });

      if (costCenterError || !costCenter) {
        console.error('❌ [createSupplierPayment] Centro de costo no encontrado', { costCenterId, costCenterError });
        return { success: false, error: 'Centro de costo no encontrado' };
      }
    }

    // Crear el pago como un gasto de caja chica
    const { data: payment, error } = await (await getSupabaseServerClient()).from('PettyCashExpense')
      .insert({
        sessionId,
        amount,
        description: `Pago a proveedor: ${supplier.name} - ${description}`,
        category: 'Pagos a Proveedores',
        costCenterId,
        receiptNumber: receiptNumber || null
      })
      .select()
      .single();

    if (error) throw error;

    // Crear registro adicional en una tabla específica para pagos a proveedores (opcional)
    // Esto permite un mejor seguimiento y reportes específicos
    const { error: supplierPaymentError } = await (await getSupabaseServerClient()).from('SupplierPayment')
      .insert({
        sessionId,
        supplierId,
        amount,
        description,
        costCenterId,
        paymentMethod,
        bankReference: bankReference || null,
        bankAccount: bankAccount || null,
        receiptNumber: receiptNumber || null,
        notes: notes || null,
        userId: currentUser.id,
        pettyCashExpenseId: payment.id
      });

    if (supplierPaymentError) {
      console.warn('Error creating supplier payment record:', supplierPaymentError);
      // No fallamos si no se puede crear el registro adicional
    }

    revalidatePath('/dashboard/pettyCash');
    return { success: true, paymentId: payment.id };
  } catch (error) {
    console.error('Error creating supplier payment:', error);
    return { success: false, error: 'Error al crear el pago al proveedor' };
  }
}

// --- OBTENER PAGOS A PROVEEDORES ---
export async function getSupplierPayments(sessionId: number) {
  try {
    const { data: payments, error } = await (await getSupabaseServerClient()).from('SupplierPayment')
      .select(`
        *,
        Supplier:Supplier(id, name, vat, phone, email),
        CostCenter:CostCenter(id, name, code),
        User:User(name)
      `)
      .eq('sessionId', sessionId)
      .order('createdAt', { ascending: false });

    if (error) throw error;

    return payments?.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      description: payment.description,
      paymentMethod: payment.paymentMethod,
      bankReference: payment.bankReference,
      bankAccount: payment.bankAccount,
      receiptNumber: payment.receiptNumber,
      notes: payment.notes,
      createdAt: payment.createdAt ? new Date(payment.createdAt) : undefined,
      Supplier: payment.Supplier ? {
        id: payment.Supplier.id,
        name: payment.Supplier.name,
        vat: payment.Supplier.vat,
        phone: payment.Supplier.phone,
        email: payment.Supplier.email
      } : null,
      CostCenter: payment.CostCenter ? {
        id: payment.CostCenter.id,
        name: payment.CostCenter.name,
        code: payment.CostCenter.code
      } : null,
      User: {
        name: payment.User?.name || 'Usuario no encontrado'
      }
    })) || [];
  } catch (error) {
    console.error('Error getting supplier payments:', error);
    return [];
  }
}

// Funciones para gestión de sesiones
export async function getCashSessionStats() {
  try {
    console.log('📊 getCashSessionStats called');
    
    // Obtener estadísticas de sesiones
    const supabase = await getSupabaseServiceClient();
    console.log('✅ Supabase service client obtained for stats (bypassing RLS)');
    
    const { data: sessions, error: sessionsError } = await supabase
      .from('CashSession')
      .select('*');

    if (sessionsError) {
      console.error('❌ Error fetching sessions for stats:', sessionsError);
      throw sessionsError;
    }

    console.log('📋 Sessions for stats:', sessions?.length || 0);
    console.log('📄 Sessions data for stats:', sessions);

    const stats = {
      total: sessions.length,
      open: sessions.filter(s => s.status === 'open').length,
      closed: sessions.filter(s => s.status === 'closed').length,
      suspended: sessions.filter(s => s.status === 'suspended').length,
      totalAmount: sessions.reduce((sum, s) => sum + s.openingAmount, 0),
      averageAmount: sessions.length > 0 ? sessions.reduce((sum, s) => sum + s.openingAmount, 0) / sessions.length : 0
    };

    console.log('📊 Calculated stats:', stats);
    return stats;
  } catch (error) {
    console.error('❌ Error getting cash session stats:', error);
    return {
      total: 0,
      open: 0,
      closed: 0,
      suspended: 0,
      totalAmount: 0,
      averageAmount: 0
    };
  }
}

export async function deleteCashSession(formData: FormData) {
  try {
    const sessionId = parseInt(formData.get('sessionId') as string);
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    // Verificar que la sesión existe y no está cerrada
    const { data: session, error: sessionError } = await (await getSupabaseServerClient()).from('CashSession')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return { success: false, error: 'Sesión no encontrada' };
    }

    if (session.status === 'closed') {
      return { success: false, error: 'No se pueden eliminar sesiones cerradas' };
    }

    // Verificar que no hay transacciones asociadas
    const { data: expenses, error: expensesError } = await (await getSupabaseServerClient()).from('PettyCashExpense')
      .select('id')
      .eq('sessionId', sessionId);

    const { data: purchases, error: purchasesError } = await (await getSupabaseServerClient()).from('PettyCashPurchase')
      .select('id')
      .eq('sessionId', sessionId);

    const { data: incomes, error: incomesError } = await (await getSupabaseServerClient()).from('PettyCashIncome')
      .select('id')
      .eq('sessionId', sessionId);

    if (expensesError || purchasesError || incomesError) {
      return { success: false, error: 'Error al verificar transacciones' };
    }

    if (expenses.length > 0 || purchases.length > 0 || incomes.length > 0) {
      return { success: false, error: 'No se pueden eliminar sesiones con transacciones' };
    }

    // Eliminar la sesión
    const { error: deleteError } = await (await getSupabaseServerClient()).from('CashSession')
      .delete()
      .eq('id', sessionId);

    if (deleteError) throw deleteError;

    revalidatePath('/dashboard/pettyCash/sessions');
    return { success: true };
  } catch (error) {
    console.error('Error deleting cash session:', error);
    return { success: false, error: 'Error al eliminar la sesión' };
  }
}

export async function updateCashSession(formData: FormData) {
  try {
    const sessionId = parseInt(formData.get('sessionId') as string);
    const notes = formData.get('notes') as string;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    // Verificar que la sesión existe
    const { data: session, error: sessionError } = await (await getSupabaseServerClient()).from('CashSession')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return { success: false, error: 'Sesión no encontrada' };
    }

    // Solo permitir actualizar notas
    const { error: updateError } = await (await getSupabaseServerClient()).from('CashSession')
      .update({ notes })
      .eq('id', sessionId);

    if (updateError) throw updateError;

    revalidatePath('/dashboard/pettyCash/sessions');
    return { success: true };
  } catch (error) {
    console.error('Error updating cash session:', error);
    return { success: false, error: 'Error al actualizar la sesión' };
  }
}

export async function forceDeleteCashSession(formData: FormData) {
  try {
    const sessionId = parseInt(formData.get('sessionId') as string);
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    // Verificar que el usuario tiene permisos de administrador
    if (currentUser.role !== 'SUPER_USER' && currentUser.role !== 'ADMINISTRADOR') {
      return { success: false, error: 'No tienes permisos para esta acción' };
    }

    // Eliminar transacciones asociadas primero
    await (await getSupabaseServerClient()).from('PettyCashExpense')
      .delete()
      .eq('sessionId', sessionId);

    await (await getSupabaseServerClient()).from('PettyCashPurchase')
      .delete()
      .eq('sessionId', sessionId);

    await (await getSupabaseServerClient()).from('PettyCashIncome')
      .delete()
      .eq('sessionId', sessionId);

    // Eliminar la sesión
    const { error: deleteError } = await (await getSupabaseServerClient()).from('CashSession')
      .delete()
      .eq('id', sessionId);

    if (deleteError) throw deleteError;

    revalidatePath('/dashboard/pettyCash/sessions');
    return { success: true };
  } catch (error) {
    console.error('Error force deleting cash session:', error);
    return { success: false, error: 'Error al eliminar la sesión' };
  }
}

export async function getOpenCashSessions() {
  try {
    const { data: sessions, error } = await (await getSupabaseServerClient()).from('CashSession')
      .select('id, sessionNumber, openingAmount, openedAt, cashRegisterId')
      .eq('status', 'open')
      .order('openedAt', { ascending: false });
    if (error) throw error;
    return sessions || [];
  } catch (error) {
    console.error('Error getting open cash sessions:', error);
    return [];
  }
}

// FUNCIÓN TEMPORAL DE DEBUG - REMOVER DESPUÉS
export async function debugCashSessions() {
  try {
    console.log('🔧 DEBUG: Testing direct CashSession access...');
    
    const supabase = await getSupabaseServerClient();
    const supabaseService = await getSupabaseServiceClient();
    
    console.log('🔍 Using both anon client and service client for comparison');
    
    // Verificar autenticación actual
    console.log('🔐 Test 0: Check authentication');
    const { data: authData, error: authError } = await supabase.auth.getUser();
    console.log('👤 Auth result:', {
      error: authError?.message,
      userId: authData?.user?.id,
      email: authData?.user?.email,
      isAuthenticated: !!authData?.user
    });

    // Prueba 1: Consulta directa sin join
    console.log('🔍 Test 1: Direct query without User join');
    const { data: directSessions, error: directError } = await supabase
      .from('CashSession')
      .select('*')
      .order('openedAt', { ascending: false });
    
    console.log('📊 Direct query result:', {
      error: directError?.message,
      count: directSessions?.length || 0,
      data: directSessions?.slice(0, 2) // Solo los primeros 2 para no saturar logs
    });

    // Prueba 2: Verificar tabla User
    console.log('🔍 Test 2: Check User table access');
    const { data: users, error: userError } = await supabase
      .from('User')
      .select('id, name, email')
      .limit(3);
    
    console.log('👤 User table result:', {
      error: userError?.message,
      count: users?.length || 0,
      data: users
    });

    // Prueba 3: Consulta con join como está actualmente
    console.log('🔍 Test 3: Query with User join (current implementation)');
    const { data: joinSessions, error: joinError } = await supabase
      .from('CashSession')
      .select(`
        *,
        User:User(id, name, email)
      `)
      .order('openedAt', { ascending: false })
      .limit(5);
    
    console.log('🔗 Join query result:', {
      error: joinError?.message,
      count: joinSessions?.length || 0,
      data: joinSessions
    });

    // Prueba 4: Verificar con service role (sin RLS)
    console.log('🔍 Test 4: Count all records in CashSession (total in DB) - Service Client');
    const { count, error: countError } = await supabaseService
      .from('CashSession')
      .select('*', { count: 'exact', head: true });
    
    console.log('📊 Total count result (Service):', {
      error: countError?.message,
      totalCount: count
    });

    // Prueba 5: Obtener registros reales con Service Client
    console.log('🔍 Test 5: Get actual records with Service Client');
    const { data: serviceSessions, error: serviceError } = await supabaseService
      .from('CashSession')
      .select(`
        *,
        User:User(id, name, email)
      `)
      .order('openedAt', { ascending: false })
      .limit(5);
    
    console.log('🚀 Service client query result:', {
      error: serviceError?.message,
      count: serviceSessions?.length || 0,
      data: serviceSessions?.slice(0, 2)
    });

    return {
      auth: { 
        isAuthenticated: !!authData?.user, 
        userId: authData?.user?.id,
        error: authError?.message 
      },
      directQuery: { error: directError?.message, count: directSessions?.length || 0 },
      userTable: { error: userError?.message, count: users?.length || 0 },
      joinQuery: { error: joinError?.message, count: joinSessions?.length || 0 },
      totalCount: { error: countError?.message, count: count },
      serviceQuery: { error: serviceError?.message, count: serviceSessions?.length || 0 }
    };
    
  } catch (error) {
    console.error('❌ DEBUG Error:', error);
    return { error: error.message };
  }
}

// --- ELIMINAR TRANSACCIONES DE CAJA CHICA ---
export async function deletePettyCashTransaction(formData: FormData) {
  try {
    const transactionId = parseInt(formData.get('transactionId') as string);
    const transactionType = formData.get('transactionType') as 'expense' | 'purchase' | 'income';
    const sessionId = parseInt(formData.get('sessionId') as string);

    console.log('🗑️ [deletePettyCashTransaction] Datos recibidos:', {
      transactionId,
      transactionType,
      sessionId
    });

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      console.error('❌ [deletePettyCashTransaction] Usuario no autenticado');
      return { success: false, error: 'Usuario no autenticado' };
    }

    // Verificar que la sesión existe y está abierta
    const { data: session, error: sessionError } = await (await getSupabaseServerClient()).from('CashSession')
      .select('id, status, userId')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      console.error('❌ [deletePettyCashTransaction] Sesión no encontrada', { sessionId, sessionError });
      return { success: false, error: 'Sesión no encontrada' };
    }

    if (session.status !== 'open') {
      console.error('❌ [deletePettyCashTransaction] Sesión cerrada', { sessionId, status: session.status });
      return { success: false, error: 'No se pueden eliminar transacciones de sesiones cerradas' };
    }

    // Verificar permisos: solo el usuario que creó la transacción o un administrador puede eliminarla
    const isAdmin = currentUser.role === 'ADMINISTRADOR' || currentUser.role === 'SUPER_USER';
    const isSessionOwner = session.userId === currentUser.id;

    if (!isAdmin && !isSessionOwner) {
      console.error('❌ [deletePettyCashTransaction] Sin permisos', { 
        currentUserId: currentUser.id, 
        sessionUserId: session.userId, 
        currentUserRole: currentUser.role 
      });
      return { success: false, error: 'No tienes permisos para eliminar esta transacción' };
    }

    let deletedTransaction: any = null;

    // Eliminar según el tipo de transacción
    switch (transactionType) {
      case 'expense':
        const { data: expense, error: expenseError } = await (await getSupabaseServerClient()).from('PettyCashExpense')
          .select('id, amount, description')
          .eq('id', transactionId)
          .eq('sessionId', sessionId)
          .single();

        if (expenseError || !expense) {
          console.error('❌ [deletePettyCashTransaction] Gasto no encontrado', { transactionId, expenseError });
          return { success: false, error: 'Gasto no encontrado' };
        }

        const { error: deleteExpenseError } = await (await getSupabaseServerClient()).from('PettyCashExpense')
          .delete()
          .eq('id', transactionId)
          .eq('sessionId', sessionId);

        if (deleteExpenseError) {
          console.error('❌ [deletePettyCashTransaction] Error eliminando gasto', deleteExpenseError);
          return { success: false, error: 'Error al eliminar el gasto' };
        }

        deletedTransaction = expense;
        console.log('✅ [deletePettyCashTransaction] Gasto eliminado:', expense);
        break;

      case 'purchase':
        const { data: purchase, error: purchaseError } = await (await getSupabaseServerClient()).from('PettyCashPurchase')
          .select('id, totalAmount, description')
          .eq('id', transactionId)
          .eq('sessionId', sessionId)
          .single();

        if (purchaseError || !purchase) {
          console.error('❌ [deletePettyCashTransaction] Compra no encontrada', { transactionId, purchaseError });
          return { success: false, error: 'Compra no encontrada' };
        }

        const { error: deletePurchaseError } = await (await getSupabaseServerClient()).from('PettyCashPurchase')
          .delete()
          .eq('id', transactionId)
          .eq('sessionId', sessionId);

        if (deletePurchaseError) {
          console.error('❌ [deletePettyCashTransaction] Error eliminando compra', deletePurchaseError);
          return { success: false, error: 'Error al eliminar la compra' };
        }

        deletedTransaction = purchase;
        console.log('✅ [deletePettyCashTransaction] Compra eliminada:', purchase);
        break;

      case 'income':
        const { data: income, error: incomeError } = await (await getSupabaseServerClient()).from('PettyCashIncome')
          .select('id, amount, description')
          .eq('id', transactionId)
          .eq('sessionId', sessionId)
          .single();

        if (incomeError || !income) {
          console.error('❌ [deletePettyCashTransaction] Ingreso no encontrado', { transactionId, incomeError });
          return { success: false, error: 'Ingreso no encontrado' };
        }

        const { error: deleteIncomeError } = await (await getSupabaseServerClient()).from('PettyCashIncome')
          .delete()
          .eq('id', transactionId)
          .eq('sessionId', sessionId);

        if (deleteIncomeError) {
          console.error('❌ [deletePettyCashTransaction] Error eliminando ingreso', deleteIncomeError);
          return { success: false, error: 'Error al eliminar el ingreso' };
        }

        deletedTransaction = income;
        console.log('✅ [deletePettyCashTransaction] Ingreso eliminado:', income);
        break;

      default:
        console.error('❌ [deletePettyCashTransaction] Tipo de transacción inválido', { transactionType });
        return { success: false, error: 'Tipo de transacción inválido' };
    }

    // También eliminar el registro de pago a proveedor si existe
    if (transactionType === 'expense') {
      const { error: deleteSupplierPaymentError } = await (await getSupabaseServerClient()).from('SupplierPayment')
        .delete()
        .eq('pettyCashExpenseId', transactionId);

      if (deleteSupplierPaymentError) {
        console.warn('⚠️ [deletePettyCashTransaction] Error eliminando pago a proveedor (no crítico):', deleteSupplierPaymentError);
      }
    }

    revalidatePath('/dashboard/pettyCash');
    
    console.log('✅ [deletePettyCashTransaction] Transacción eliminada exitosamente:', {
      transactionId,
      transactionType,
      amount: deletedTransaction.amount || deletedTransaction.totalAmount,
      description: deletedTransaction.description
    });

    return { 
      success: true, 
      message: `${transactionType === 'expense' ? 'Gasto' : transactionType === 'purchase' ? 'Compra' : 'Ingreso'} eliminado exitosamente`,
      deletedTransaction
    };

  } catch (error) {
    console.error('❌ [deletePettyCashTransaction] Error general:', error);
    return { success: false, error: 'Error al eliminar la transacción' };
  }
}

// --- ELIMINAR PAGO A PROVEEDOR ---
export async function deleteSupplierPayment(formData: FormData) {
  try {
    const paymentId = parseInt(formData.get('paymentId') as string);
    const sessionId = parseInt(formData.get('sessionId') as string);

    console.log('🗑️ [deleteSupplierPayment] Datos recibidos:', {
      paymentId,
      sessionId
    });

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      console.error('❌ [deleteSupplierPayment] Usuario no autenticado');
      return { success: false, error: 'Usuario no autenticado' };
    }

    // Verificar que la sesión existe y está abierta
    const { data: session, error: sessionError } = await (await getSupabaseServerClient()).from('CashSession')
      .select('id, status, userId')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      console.error('❌ [deleteSupplierPayment] Sesión no encontrada', { sessionId, sessionError });
      return { success: false, error: 'Sesión no encontrada' };
    }

    if (session.status !== 'open') {
      console.error('❌ [deleteSupplierPayment] Sesión cerrada', { sessionId, status: session.status });
      return { success: false, error: 'No se pueden eliminar pagos de sesiones cerradas' };
    }

    // Verificar permisos
    const isAdmin = currentUser.role === 'ADMINISTRADOR' || currentUser.role === 'SUPER_USER';
    const isSessionOwner = session.userId === currentUser.id;

    if (!isAdmin && !isSessionOwner) {
      console.error('❌ [deleteSupplierPayment] Sin permisos', { 
        currentUserId: currentUser.id, 
        sessionUserId: session.userId, 
        currentUserRole: currentUser.role 
      });
      return { success: false, error: 'No tienes permisos para eliminar este pago' };
    }

    // Obtener el pago para verificar que existe
    const { data: payment, error: paymentError } = await (await getSupabaseServerClient()).from('SupplierPayment')
      .select('id, amount, description, pettyCashExpenseId')
      .eq('id', paymentId)
      .eq('sessionId', sessionId)
      .single();

    if (paymentError || !payment) {
      console.error('❌ [deleteSupplierPayment] Pago no encontrado', { paymentId, paymentError });
      return { success: false, error: 'Pago no encontrado' };
    }

    // Eliminar el pago a proveedor
    const { error: deletePaymentError } = await (await getSupabaseServerClient()).from('SupplierPayment')
      .delete()
      .eq('id', paymentId)
      .eq('sessionId', sessionId);

    if (deletePaymentError) {
      console.error('❌ [deleteSupplierPayment] Error eliminando pago', deletePaymentError);
      return { success: false, error: 'Error al eliminar el pago' };
    }

    // Si existe un gasto asociado, eliminarlo también
    if (payment.pettyCashExpenseId) {
      const { error: deleteExpenseError } = await (await getSupabaseServerClient()).from('PettyCashExpense')
        .delete()
        .eq('id', payment.pettyCashExpenseId)
        .eq('sessionId', sessionId);

      if (deleteExpenseError) {
        console.warn('⚠️ [deleteSupplierPayment] Error eliminando gasto asociado (no crítico):', deleteExpenseError);
      }
    }

    revalidatePath('/dashboard/pettyCash');
    
    console.log('✅ [deleteSupplierPayment] Pago eliminado exitosamente:', {
      paymentId,
      amount: payment.amount,
      description: payment.description
    });

    return { 
      success: true, 
      message: 'Pago a proveedor eliminado exitosamente',
      deletedPayment: payment
    };

  } catch (error) {
    console.error('❌ [deleteSupplierPayment] Error general:', error);
    return { success: false, error: 'Error al eliminar el pago' };
  }
} 