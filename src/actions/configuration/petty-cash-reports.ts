'use server';

import { createClient } from '@supabase/supabase-js';
// Carga dinámica cuando se usa (evita bundling en build)

// Cliente Supabase simplificado
async function getSupabaseClient() {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export interface TransactionReportData {
  id: number;
  sessionId: number;
  sessionNumber: string;
  type: 'expense' | 'purchase' | 'opening' | 'closing';
  amount: number;
  description: string;
  category?: string;
  productName?: string;
  quantity?: number;
  unitPrice?: number;
  userName: string;
  cashRegisterName: string;
  costCenterName?: string;
  createdAt: string;
  runningBalance: number;
}

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  sessionId?: number;
  type?: 'expense' | 'purchase' | 'opening' | 'closing' | 'all';
  userId?: string;
  cashRegisterId?: number;
}

export interface ReportSummary {
  totalTransactions: number;
  totalExpenses: number;
  totalPurchases: number;
  totalAmount: number;
  initialBalance: number;
  finalBalance: number;
  periodicSummary: {
    [key: string]: {
      transactions: number;
      expenses: number;
      purchases: number;
      balance: number;
    };
  };
}

// Función principal de reportes simplificada
export async function getTransactionsReport(filters: ReportFilters = {}): Promise<{
  success: boolean;
  data?: TransactionReportData[];
  summary?: ReportSummary;
  error?: string;
}> {
  try {
    console.log('🔍 Generando reporte con filtros:', filters);
    
    const supabase = await getSupabaseClient();

    // Obtener gastos
    let expensesQuery = supabase
      .from('PettyCashExpense')
      .select('id, sessionId, amount, description, category, createdAt')
      .order('createdAt', { ascending: true });

    // Aplicar filtros de fecha a gastos
    if (filters.startDate) {
      expensesQuery = expensesQuery.gte('createdAt', filters.startDate + 'T00:00:00');
    }
    if (filters.endDate) {
      expensesQuery = expensesQuery.lte('createdAt', filters.endDate + 'T23:59:59');
    }
    if (filters.sessionId) {
      expensesQuery = expensesQuery.eq('sessionId', filters.sessionId);
    }

    // Obtener compras
    let purchasesQuery = supabase
      .from('PettyCashPurchase')
      .select('id, sessionId, quantity, unitPrice, totalAmount, createdAt, productId')
      .order('createdAt', { ascending: true });

    // Aplicar filtros de fecha a compras
    if (filters.startDate) {
      purchasesQuery = purchasesQuery.gte('createdAt', filters.startDate + 'T00:00:00');
    }
    if (filters.endDate) {
      purchasesQuery = purchasesQuery.lte('createdAt', filters.endDate + 'T23:59:59');
    }
    if (filters.sessionId) {
      purchasesQuery = purchasesQuery.eq('sessionId', filters.sessionId);
    }

    // Ejecutar consultas según el tipo
    let expenses: any[] = [];
    let purchases: any[] = [];

    if (filters.type !== 'purchase' && filters.type !== 'opening' && filters.type !== 'closing') {
      const expensesResult = await expensesQuery;
      if (expensesResult.error) {
        console.error('❌ Error obteniendo gastos:', expensesResult.error);
        throw expensesResult.error;
      }
      expenses = expensesResult.data || [];
    }

    if (filters.type !== 'expense' && filters.type !== 'opening' && filters.type !== 'closing') {
      const purchasesResult = await purchasesQuery;
      if (purchasesResult.error) {
        console.error('❌ Error obteniendo compras:', purchasesResult.error);
        throw purchasesResult.error;
      }
      purchases = purchasesResult.data || [];
    }

    console.log(`📊 Datos obtenidos: ${expenses.length} gastos, ${purchases.length} compras`);

    // Obtener todas las sesiones únicas
    const allSessionIds = [...new Set([
      ...expenses.map(e => e.sessionId),
      ...purchases.map(p => p.sessionId)
    ])];

    // Obtener información de sesiones y usuarios
    const sessionsMap = new Map();
    const usersMap = new Map();
    
    if (allSessionIds.length > 0) {
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('CashSession')
        .select('id, openingAmount, userId, status, openedAt')
        .in('id', allSessionIds);

      if (sessionsError) {
        console.error('❌ Error obteniendo sesiones:', sessionsError);
        throw sessionsError;
      }

      sessionsData?.forEach(session => {
        sessionsMap.set(session.id, session);
      });

      // Obtener información de usuarios
      const userIds = [...new Set(sessionsData?.map(s => s.userId).filter(Boolean) || [])];
      if (userIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('User')
          .select('id, name')
          .in('id', userIds);

        if (usersError) {
          console.error('❌ Error obteniendo usuarios:', usersError);
        } else {
          usersData?.forEach(user => {
            usersMap.set(user.id, user);
          });
        }
      }
    }

    // Obtener información de productos para las compras
    const productIds = [...new Set(purchases.map(p => p.productId).filter(Boolean))];
    const productsMap = new Map();
    
    if (productIds.length > 0) {
      const { data: productsData, error: productsError } = await supabase
        .from('Product')
        .select('id, name, sku')
        .in('id', productIds);

      if (productsError) {
        console.error('❌ Error obteniendo productos:', productsError);
      } else {
        productsData?.forEach(product => {
          productsMap.set(product.id, product);
        });
      }
    }

    // Transformar y combinar datos
    let allTransactions: TransactionReportData[] = [
      // Agregar aperturas de caja (solo si están en el rango de fechas)
      ...Array.from(sessionsMap.values())
        .filter(session => {
          if (!session.openedAt) return false;
          const sessionDate = session.openedAt.split('T')[0];
          const isInRange = (!filters.startDate || sessionDate >= filters.startDate) &&
                          (!filters.endDate || sessionDate <= filters.endDate);
          return isInRange;
        })
        .map(session => {
          const user = usersMap.get(session.userId);
          return {
            id: `opening-${session.id}`,
            sessionId: session.id,
            sessionNumber: `S${session.id}`,
            type: 'opening' as const,
            amount: session.openingAmount || 0,
            description: `Apertura de caja - Sesión ${session.id}`,
            userName: user?.name || 'Usuario desconocido',
            cashRegisterName: 'Caja Principal',
            costCenterName: undefined,
            createdAt: session.openedAt || new Date().toISOString(),
            runningBalance: 0 // Se calculará después
          };
        }),
      ...expenses.map(expense => {
        const session = sessionsMap.get(expense.sessionId);
        const user = usersMap.get(session?.userId);
        return {
          id: expense.id,
          sessionId: expense.sessionId,
          sessionNumber: `S${expense.sessionId}`,
          type: 'expense' as const,
          amount: expense.amount,
          description: expense.description || 'Sin descripción',
          category: expense.category,
          userName: user?.name || 'Usuario desconocido',
          cashRegisterName: 'Caja Principal',
          costCenterName: undefined,
          createdAt: expense.createdAt,
          runningBalance: 0 // Se calculará después
        };
      }),
      ...purchases.map(purchase => {
        const session = sessionsMap.get(purchase.sessionId);
        const user = usersMap.get(session?.userId);
        const product = productsMap.get(purchase.productId);
        return {
          id: purchase.id,
          sessionId: purchase.sessionId,
          sessionNumber: `S${purchase.sessionId}`,
          type: 'purchase' as const,
          amount: purchase.totalAmount || (purchase.quantity * purchase.unitPrice),
          description: `Compra: ${product?.name || 'Producto'} (${purchase.quantity} x $${purchase.unitPrice?.toLocaleString()})`,
          productName: product?.name,
          quantity: purchase.quantity,
          unitPrice: purchase.unitPrice,
          userName: user?.name || 'Usuario desconocido',
          cashRegisterName: 'Caja Principal',
          costCenterName: undefined,
          createdAt: purchase.createdAt,
          runningBalance: 0 // Se calculará después
        };
      })
    ];

    // Ordenar por fecha
    allTransactions = allTransactions.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    // Calcular saldos corrientes usando TODAS las transacciones
    const sessionBalances = new Map<number, number>();
    // Inicializar saldos con montos de apertura
    sessionsMap.forEach((session, sessionId) => {
      sessionBalances.set(sessionId, session.openingAmount || 0);
    });

    // Calcular saldo corriente para cada transacción (usando todas)
    allTransactions.forEach(transaction => {
      if (transaction.type === 'opening') {
        transaction.runningBalance = transaction.amount;
      } else {
        const currentBalance = sessionBalances.get(transaction.sessionId) || 0;
        const newBalance = currentBalance - transaction.amount;
        sessionBalances.set(transaction.sessionId, newBalance);
        transaction.runningBalance = newBalance;
      }
    });

    // AGREGAR CIERRES SOLO PARA SESIONES CERRADAS
    const closingTransactions: TransactionReportData[] = [];
    Array.from(sessionsMap.values()).forEach(session => {
      if (session.status === 'closed') {
        // Buscar la última transacción de la sesión
        const sessionTxs = allTransactions.filter(t => t.sessionId === session.id);
        if (sessionTxs.length > 0) {
          const lastTx = sessionTxs[sessionTxs.length - 1];
          closingTransactions.push({
            id: `closing-${session.id}`,
            sessionId: session.id,
            sessionNumber: `S${session.id}`,
            type: 'closing',
            amount: lastTx.runningBalance,
            description: `Cierre de caja - Sesión ${session.id}`,
            userName: lastTx.userName,
            cashRegisterName: 'Caja Principal',
            costCenterName: undefined,
            createdAt: lastTx.createdAt,
            runningBalance: lastTx.runningBalance
          });
        }
      }
    });
    allTransactions = [...allTransactions, ...closingTransactions].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    console.log(`🔄 Total transacciones procesadas: ${allTransactions.length}`);

    console.log(`🔄 Total transacciones procesadas con saldos: ${allTransactions.length}`);

    // PASO 1: Calcular saldos corrientes cronológicamente con TODAS las transacciones
    // Esto es CRÍTICO para que los saldos sean correctos
    const chronologicalTransactions = [...allTransactions].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    let runningBalance = 0;
    const balanceMap = new Map();
    
    chronologicalTransactions.forEach(transaction => {
      if (transaction.type === 'opening') {
        // Para aperturas, establecer el balance con el monto de apertura
        runningBalance = transaction.amount;
      } else {
        // Para gastos y compras, restar del balance actual
        runningBalance = Math.max(0, runningBalance - transaction.amount);
      }
      
      // Guardar el balance correcto para cada transacción
      const key = `${transaction.type}-${transaction.id}-${transaction.sessionId}`;
      balanceMap.set(key, runningBalance);
      transaction.runningBalance = runningBalance;
    });

    // PASO 2: AHORA aplicar filtros PERO mantener los saldos ya calculados
    let filteredTransactions = allTransactions;
    if (filters.type && filters.type !== 'all') {
      filteredTransactions = allTransactions.filter(transaction => transaction.type === filters.type);
    }

    console.log(`🔄 Transacciones filtradas: ${filteredTransactions.length}`);
    
    // Logging detallado para debugging
    console.log('📋 Resumen de transacciones por tipo:');
    console.log(`  - Aperturas: ${filteredTransactions.filter(t => t.type === 'opening').length}`);
    console.log(`  - Gastos: ${filteredTransactions.filter(t => t.type === 'expense').length}`);
    console.log(`  - Compras: ${filteredTransactions.filter(t => t.type === 'purchase').length}`);
    console.log(`  - Cierres: ${filteredTransactions.filter(t => t.type === 'closing').length}`);
    console.log(`📊 Sesiones involucradas: ${[...new Set(filteredTransactions.map(t => t.sessionId))].join(', ')}`);
    
    // Mostrar las primeras 5 transacciones para debugging (ordenadas cronológicamente)
    const debugTransactions = [...filteredTransactions].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    console.log('📝 Primeras 5 transacciones ordenadas cronológicamente:');
    debugTransactions.slice(0, 5).forEach((tx, i) => {
      console.log(`  ${i+1}. ${tx.createdAt} | ${tx.type} | $${tx.amount} | Saldo: $${tx.runningBalance} | Sesión ${tx.sessionId}`);
    });

    // PASO 3: Calcular resumen usando transacciones filtradas
    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPurchases = filteredTransactions
      .filter(t => t.type === 'purchase')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalOpenings = filteredTransactions
      .filter(t => t.type === 'opening')
      .reduce((sum, t) => sum + t.amount, 0);

    // Saldo inicial y final basado en las transacciones filtradas pero con saldos correctos
    let initialBalance = 0;
    let finalBalance = 0;
    
    if (filteredTransactions.length > 0) {
      const sortedFiltered = [...filteredTransactions].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      // Saldo inicial: primer saldo menos el impacto de la primera transacción (si no es apertura)
      const firstTx = sortedFiltered[0];
      if (firstTx.type === 'opening') {
        initialBalance = firstTx.amount;
      } else {
        initialBalance = firstTx.runningBalance + firstTx.amount;
      }
      
      // Saldo final: último saldo de las transacciones
      finalBalance = sortedFiltered[sortedFiltered.length - 1].runningBalance;
    }

    // Calcular resumen periódico (por día) usando transacciones filtradas
    const periodicSummary: ReportSummary['periodicSummary'] = {};
    filteredTransactions.forEach(transaction => {
      const date = transaction.createdAt.split('T')[0];
      if (!periodicSummary[date]) {
        periodicSummary[date] = {
          transactions: 0,
          expenses: 0,
          purchases: 0,
          balance: 0
        };
      }
      
      periodicSummary[date].transactions++;
      if (transaction.type === 'expense') {
        periodicSummary[date].expenses += transaction.amount;
      } else if (transaction.type === 'purchase') {
        periodicSummary[date].purchases += transaction.amount;
      }
      periodicSummary[date].balance = transaction.runningBalance;
    });

    const summary: ReportSummary = {
      totalTransactions: filteredTransactions.length,
      totalExpenses,
      totalPurchases,
      totalAmount: totalExpenses + totalPurchases,
      initialBalance,
      finalBalance,
      periodicSummary
    };

    console.log('✅ Reporte generado exitosamente:', {
      transacciones: summary.totalTransactions,
      gastos: summary.totalExpenses,
      compras: summary.totalPurchases,
      saldoInicial: summary.initialBalance,
      saldoFinal: summary.finalBalance
    });
    
    // Logging adicional de verificación
    const calculatedFinal = summary.initialBalance - summary.totalExpenses - summary.totalPurchases;
    console.log(`🔍 Verificación de saldo: Inicial (${summary.initialBalance}) - Gastos (${summary.totalExpenses}) - Compras (${summary.totalPurchases}) = ${calculatedFinal}`);
    console.log(`📊 Saldo final reportado: ${summary.finalBalance}`);
    
    if (filteredTransactions.length > 0) {
      const lastTx = [...filteredTransactions].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ).pop();
      console.log(`🎯 Último saldo de transacción: ${lastTx?.runningBalance}`);
    }

    return {
      success: true,
      data: filteredTransactions,
      summary
    };

  } catch (error) {
    console.error('❌ Error generating transactions report:', error);
    return {
      success: false,
      error: 'Error al generar el reporte de transacciones'
    };
  }
}

// Función para exportar reporte a Excel
export async function exportTransactionsToExcel(filters: ReportFilters = {}): Promise<{
  success: boolean;
  data?: Buffer;
  filename?: string;
  error?: string;
}> {
  try {
    console.log('📊 Iniciando exportación a Excel con filtros:', filters);
    
    const reportResult = await getTransactionsReport(filters);
    
    if (!reportResult.success || !reportResult.data) {
      return {
        success: false,
        error: reportResult.error || 'No se pudo generar el reporte'
      };
    }

    const { data: transactions, summary } = reportResult;

    // Crear workbook
    const workbook = XLSX.utils.book_new();

    // Hoja 1: Transacciones detalladas
    const transactionsData = transactions.map((transaction, index) => ({
      'N°': index + 1,
      'Fecha': new Date(transaction.createdAt).toLocaleDateString('es-CL'),
      'Hora': new Date(transaction.createdAt).toLocaleTimeString('es-CL', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      'Sesión': transaction.sessionNumber,
      'Tipo': transaction.type === 'expense' ? 'Gasto' : 'Compra',
      'Descripción': transaction.description,
      'Categoría': transaction.category || '',
      'Producto': transaction.productName || '',
      'Cantidad': transaction.quantity || '',
      'Precio Unit.': transaction.unitPrice ? `$${transaction.unitPrice.toLocaleString()}` : '',
      'Monto': `$${transaction.amount.toLocaleString()}`,
      'Saldo Después': `$${transaction.runningBalance.toLocaleString()}`,
      'Usuario': transaction.userName,
      'Caja': transaction.cashRegisterName,
      'Centro Costo': transaction.costCenterName || ''
    }));

    const transactionsSheet = XLSX.utils.json_to_sheet(transactionsData);
    
    // Configurar anchos de columna
    transactionsSheet['!cols'] = [
      { wch: 5 },   // N°
      { wch: 12 },  // Fecha
      { wch: 8 },   // Hora
      { wch: 10 },  // Sesión
      { wch: 8 },   // Tipo
      { wch: 35 },  // Descripción
      { wch: 15 },  // Categoría
      { wch: 20 },  // Producto
      { wch: 8 },   // Cantidad
      { wch: 12 },  // Precio Unit.
      { wch: 15 },  // Monto
      { wch: 15 },  // Saldo Después
      { wch: 20 },  // Usuario
      { wch: 15 },  // Caja
      { wch: 15 }   // Centro Costo
    ];

    XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Transacciones');

    // Hoja 2: Resumen por día
    const dailySummaryData = Object.entries(summary!.periodicSummary).map(([date, data]) => ({
      'Fecha': new Date(date).toLocaleDateString('es-CL'),
      'Transacciones': data.transactions,
      'Total Gastos': `$${data.expenses.toLocaleString()}`,
      'Total Compras': `$${data.purchases.toLocaleString()}`,
      'Total Día': `$${(data.expenses + data.purchases).toLocaleString()}`,
      'Saldo Final': `$${data.balance.toLocaleString()}`
    }));

    const dailySheet = XLSX.utils.json_to_sheet(dailySummaryData);
    dailySheet['!cols'] = [
      { wch: 12 },  // Fecha
      { wch: 12 },  // Transacciones
      { wch: 15 },  // Total Gastos
      { wch: 15 },  // Total Compras
      { wch: 15 },  // Total Día
      { wch: 15 }   // Saldo Final
    ];

    XLSX.utils.book_append_sheet(workbook, dailySheet, 'Resumen Diario');

    // Hoja 3: Resumen general
    const generalSummaryData = [
      { 'Concepto': 'Saldo Inicial', 'Valor': `$${summary!.initialBalance.toLocaleString()}` },
      { 'Concepto': 'Total Transacciones', 'Valor': summary!.totalTransactions },
      { 'Concepto': 'Total Gastos', 'Valor': `$${summary!.totalExpenses.toLocaleString()}` },
      { 'Concepto': 'Total Compras', 'Valor': `$${summary!.totalPurchases.toLocaleString()}` },
      { 'Concepto': 'Total Movimientos', 'Valor': `$${summary!.totalAmount.toLocaleString()}` },
      { 'Concepto': 'Saldo Final', 'Valor': `$${summary!.finalBalance.toLocaleString()}` },
      { 'Concepto': 'Período', 'Valor': `${filters.startDate || 'Inicio'} - ${filters.endDate || 'Hoy'}` }
    ];

    const summarySheet = XLSX.utils.json_to_sheet(generalSummaryData);
    summarySheet['!cols'] = [
      { wch: 25 },  // Concepto
      { wch: 20 }   // Valor
    ];

    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen General');

    // Generar buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Generar nombre de archivo
    const startDate = filters.startDate || 'inicio';
    const endDate = filters.endDate || new Date().toISOString().split('T')[0];
    const filename = `reporte_transacciones_${startDate}_${endDate}.xlsx`;

    console.log('✅ Excel generado exitosamente:', filename);

    return {
      success: true,
      data: buffer,
      filename
    };

  } catch (error) {
    console.error('❌ Error exporting transactions to Excel:', error);
    return {
      success: false,
      error: 'Error al exportar el reporte a Excel'
    };
  }
}

// Función para obtener opciones de filtros
export async function getReportFilterOptions(): Promise<{
  success: boolean;
  users?: Array<{ id: string; name: string }>;
  cashRegisters?: Array<{ id: number; name: string }>;
  dateRange?: { earliest: string; latest: string };
  error?: string;
}> {
  try {
    const supabase = await getSupabaseClient();

    const [usersResult, dateRangeResult] = await Promise.all([
      // Usuarios que han manejado caja
      supabase
        .from('User')
        .select('id, name')
        .eq('isActive', true),
      
      // Rango de fechas disponibles
      supabase
        .from('CashSession')
        .select('openedAt')
        .order('openedAt', { ascending: true })
        .limit(1)
    ]);

    if (usersResult.error) {
      console.error('❌ Error obteniendo usuarios:', usersResult.error);
      throw usersResult.error;
    }
    
    if (dateRangeResult.error) {
      console.error('❌ Error obteniendo rango de fechas:', dateRangeResult.error);
      throw dateRangeResult.error;
    }

    // Obtener fecha más reciente
    const { data: latestDate, error: latestError } = await supabase
      .from('CashSession')
      .select('openedAt')
      .order('openedAt', { ascending: false })
      .limit(1);

    if (latestError) {
      console.error('❌ Error obteniendo fecha más reciente:', latestError);
    }

    const dateRange = dateRangeResult.data && dateRangeResult.data.length > 0 && latestDate && latestDate.length > 0
      ? {
          earliest: dateRangeResult.data[0].openedAt.split('T')[0],
          latest: latestDate[0].openedAt.split('T')[0]
        }
      : undefined;

    return {
      success: true,
      users: usersResult.data || [],
      cashRegisters: [{ id: 1, name: 'Caja Principal' }], // Valor por defecto
      dateRange
    };

  } catch (error) {
    console.error('❌ Error getting report filter options:', error);
    return {
      success: false,
      error: 'Error al obtener opciones de filtros'
    };
  }
} 