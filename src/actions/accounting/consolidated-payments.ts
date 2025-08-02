'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';

// Interfaces para los diferentes tipos de pagos
export interface ConsolidatedPayment {
  id: string;
  source: 'pos' | 'reservation' | 'supplier' | 'invoice' | 'petty_cash_income' | 'petty_cash_expense';
  date: string;
  description: string;
  amount: number;
  paymentMethod: string;
  reference?: string;
  bankReference?: string;
  bankAccount?: string;
  sourceData?: any; // Datos específicos de la fuente
  createdAt: string;
  type: 'income' | 'expense';
}

export interface ConsolidatedPaymentsFilters {
  dateFrom?: string;
  dateTo?: string;
  source?: string;
  paymentMethod?: string;
  minAmount?: number;
  maxAmount?: number;
  type?: 'income' | 'expense';
}

export interface ConsolidatedPaymentsStats {
  totalPayments: number;
  totalIncome: number;
  totalExpense: number;
  netAmount: number;
  bySource: {
    pos: { count: number; amount: number };
    reservation: { count: number; amount: number };
    supplier: { count: number; amount: number };
    invoice: { count: number; amount: number };
    petty_cash: { count: number; amount: number };
  };
  byPaymentMethod: Record<string, { count: number; amount: number }>;
}

/**
 * Obtiene todos los pagos consolidados del sistema
 */
export async function getConsolidatedPayments(
  filters: ConsolidatedPaymentsFilters = {}
): Promise<{ success: boolean; data?: ConsolidatedPayment[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const payments: ConsolidatedPayment[] = [];

    // 1. Obtener pagos de POS (ventas)
    if (!filters.source || filters.source === 'pos') {
      try {
        let posQuery = supabase
          .from('Sale')
          .select(`
            id,
            total,
            paymentMethod,
            createdAt,
            customerName,
            cashRegister:cashRegisterId(type)
          `);

        if (filters.dateFrom) {
          posQuery = posQuery.gte('createdAt', filters.dateFrom);
        }
        if (filters.dateTo) {
          posQuery = posQuery.lte('createdAt', filters.dateTo);
        }

        const { data: posPayments, error: posError } = await posQuery;
        
        if (!posError && posPayments) {
          for (const payment of posPayments) {
            if (!filters.paymentMethod || payment.paymentMethod === filters.paymentMethod) {
              const amount = Number(payment.total) || 0;
              if (amount >= (filters.minAmount || 0) && (!filters.maxAmount || amount <= filters.maxAmount)) {
                if (!filters.type || filters.type === 'income') {
                  payments.push({
                    id: `pos-${payment.id}`,
                    source: 'pos',
                    date: payment.createdAt.split('T')[0],
                    description: `Venta POS ${payment.cashRegister?.type || 'POS'} - ${payment.customerName || 'Cliente'}`,
                    amount,
                    paymentMethod: payment.paymentMethod || 'efectivo',
                    reference: `POS-${payment.id}`,
                    sourceData: payment,
                    createdAt: payment.createdAt,
                    type: 'income'
                  });
                }
              }
            }
          }
        }
      } catch (error) {
        console.warn('Error obteniendo pagos POS:', error);
      }
    }

    // 2. Obtener pagos de reservas
    if (!filters.source || filters.source === 'reservation') {
      try {
        let reservationQuery = supabase
          .from('reservation_payments')
          .select(`
            id,
            reservation_id,
            amount,
            payment_method,
            payment_type,
            reference_number,
            notes,
            created_at,
            reservation:reservation_id(guest_name, id)
          `);

        if (filters.dateFrom) {
          reservationQuery = reservationQuery.gte('created_at', filters.dateFrom);
        }
        if (filters.dateTo) {
          reservationQuery = reservationQuery.lte('created_at', filters.dateTo);
        }

        const { data: reservationPayments, error: reservationError } = await reservationQuery;
        
        if (!reservationError && reservationPayments) {
          for (const payment of reservationPayments) {
            if (!filters.paymentMethod || payment.payment_method === filters.paymentMethod) {
              const amount = Number(payment.amount) || 0;
              if (amount >= (filters.minAmount || 0) && (!filters.maxAmount || amount <= filters.maxAmount)) {
                if (!filters.type || filters.type === 'income') {
                  payments.push({
                    id: `reservation-${payment.id}`,
                    source: 'reservation',
                    date: payment.created_at.split('T')[0],
                    description: `Pago Reserva - ${payment.reservation?.guest_name || 'Huésped'} (${payment.payment_type || 'pago'})`,
                    amount,
                    paymentMethod: payment.payment_method || 'efectivo',
                    reference: payment.reference_number || `RES-${payment.reservation_id}`,
                    sourceData: payment,
                    createdAt: payment.created_at,
                    type: 'income'
                  });
                }
              }
            }
          }
        }
      } catch (error) {
        console.warn('Error obteniendo pagos de reservas:', error);
      }
    }

    // 3. Obtener pagos a proveedores
    if (!filters.source || filters.source === 'supplier') {
      try {
        let supplierQuery = supabase
          .from('SupplierPayment')
          .select(`
            id,
            amount,
            description,
            paymentMethod,
            bankReference,
            bankAccount,
            receiptNumber,
            createdAt,
            supplierId
          `);

        if (filters.dateFrom) {
          supplierQuery = supplierQuery.gte('createdAt', filters.dateFrom);
        }
        if (filters.dateTo) {
          supplierQuery = supplierQuery.lte('createdAt', filters.dateTo);
        }

        const { data: supplierPayments, error: supplierError } = await supplierQuery;
        
        if (!supplierError && supplierPayments) {
          for (const payment of supplierPayments) {
            if (!filters.paymentMethod || payment.paymentMethod === filters.paymentMethod) {
              const amount = Number(payment.amount) || 0;
              if (Math.abs(amount) >= (filters.minAmount || 0) && (!filters.maxAmount || Math.abs(amount) <= filters.maxAmount)) {
                if (!filters.type || filters.type === 'expense') {
                  payments.push({
                    id: `supplier-${payment.id}`,
                    source: 'supplier',
                    date: payment.createdAt.split('T')[0],
                    description: `Pago Proveedor - ${payment.description || 'Pago a proveedor'}`,
                    amount: -Math.abs(amount), // Negativo porque es un egreso
                    paymentMethod: payment.paymentMethod || 'transferencia',
                    reference: payment.receiptNumber || `SUP-${payment.supplierId}`,
                    bankReference: payment.bankReference,
                    bankAccount: payment.bankAccount,
                    sourceData: payment,
                    createdAt: payment.createdAt,
                    type: 'expense'
                  });
                }
              }
            }
          }
        }
      } catch (error) {
        console.warn('Error obteniendo pagos de proveedores:', error);
      }
    }

    // 4. Obtener pagos de facturas
    if (!filters.source || filters.source === 'invoice') {
      try {
        let invoiceQuery = supabase
          .from('invoice_payments')
          .select(`
            id,
            invoice_id,
            amount,
            payment_method,
            payment_date,
            reference_number,
            notes,
            created_at,
            invoice:invoice_id(number, client:client_id(firstName, lastName))
          `);

        if (filters.dateFrom) {
          invoiceQuery = invoiceQuery.gte('payment_date', filters.dateFrom);
        }
        if (filters.dateTo) {
          invoiceQuery = invoiceQuery.lte('payment_date', filters.dateTo);
        }

        const { data: invoicePayments, error: invoiceError } = await invoiceQuery;
        
        if (!invoiceError && invoicePayments) {
          for (const payment of invoicePayments) {
            if (!filters.paymentMethod || payment.payment_method === filters.paymentMethod) {
              const amount = Number(payment.amount) || 0;
              if (amount >= (filters.minAmount || 0) && (!filters.maxAmount || amount <= filters.maxAmount)) {
                if (!filters.type || filters.type === 'income') {
                  const clientName = payment.invoice?.client 
                    ? `${payment.invoice.client.firstName || ''} ${payment.invoice.client.lastName || ''}`.trim()
                    : 'Cliente';
                  
                  payments.push({
                    id: `invoice-${payment.id}`,
                    source: 'invoice',
                    date: payment.payment_date.split('T')[0],
                    description: `Pago Factura ${payment.invoice?.number || payment.invoice_id} - ${clientName}`,
                    amount,
                    paymentMethod: payment.payment_method || 'efectivo',
                    reference: payment.reference_number || `INV-${payment.invoice_id}`,
                    sourceData: payment,
                    createdAt: payment.created_at,
                    type: 'income'
                  });
                }
              }
            }
          }
        }
      } catch (error) {
        console.warn('Error obteniendo pagos de facturas:', error);
      }
    }

    // 5. Obtener ingresos de caja chica
    if (!filters.source || filters.source === 'petty_cash_income') {
      try {
        let pettyCashIncomeQuery = supabase
          .from('PettyCashIncome')
          .select(`
            id,
            amount,
            description,
            paymentMethod,
            bankReference,
            bankAccount,
            receiptNumber,
            createdAt
          `);

        if (filters.dateFrom) {
          pettyCashIncomeQuery = pettyCashIncomeQuery.gte('createdAt', filters.dateFrom);
        }
        if (filters.dateTo) {
          pettyCashIncomeQuery = pettyCashIncomeQuery.lte('createdAt', filters.dateTo);
        }

        const { data: pettyCashIncomes, error: pettyCashIncomeError } = await pettyCashIncomeQuery;
        
        if (!pettyCashIncomeError && pettyCashIncomes) {
          for (const income of pettyCashIncomes) {
            if (!filters.paymentMethod || income.paymentMethod === filters.paymentMethod) {
              const amount = Number(income.amount) || 0;
              if (amount >= (filters.minAmount || 0) && (!filters.maxAmount || amount <= filters.maxAmount)) {
                if (!filters.type || filters.type === 'income') {
                  payments.push({
                    id: `petty-income-${income.id}`,
                    source: 'petty_cash_income',
                    date: income.createdAt.split('T')[0],
                    description: `Ingreso Caja Chica - ${income.description || 'Ingreso'}`,
                    amount,
                    paymentMethod: income.paymentMethod || 'efectivo',
                    reference: income.receiptNumber || `PC-IN-${income.id}`,
                    bankReference: income.bankReference,
                    bankAccount: income.bankAccount,
                    sourceData: income,
                    createdAt: income.createdAt,
                    type: 'income'
                  });
                }
              }
            }
          }
        }
      } catch (error) {
        console.warn('Error obteniendo ingresos de caja chica:', error);
      }
    }

    // 6. Obtener gastos de caja chica
    if (!filters.source || filters.source === 'petty_cash_expense') {
      try {
        let pettyCashExpenseQuery = supabase
          .from('PettyCashExpense')
          .select(`
            id,
            amount,
            description,
            paymentMethod,
            bankReference,
            bankAccount,
            receiptNumber,
            createdAt
          `);

        if (filters.dateFrom) {
          pettyCashExpenseQuery = pettyCashExpenseQuery.gte('createdAt', filters.dateFrom);
        }
        if (filters.dateTo) {
          pettyCashExpenseQuery = pettyCashExpenseQuery.lte('createdAt', filters.dateTo);
        }

        const { data: pettyCashExpenses, error: pettyCashExpenseError } = await pettyCashExpenseQuery;
        
        if (!pettyCashExpenseError && pettyCashExpenses) {
          for (const expense of pettyCashExpenses) {
            if (!filters.paymentMethod || expense.paymentMethod === filters.paymentMethod) {
              const amount = Number(expense.amount) || 0;
              if (Math.abs(amount) >= (filters.minAmount || 0) && (!filters.maxAmount || Math.abs(amount) <= filters.maxAmount)) {
                if (!filters.type || filters.type === 'expense') {
                  payments.push({
                    id: `petty-expense-${expense.id}`,
                    source: 'petty_cash_expense',
                    date: expense.createdAt.split('T')[0],
                    description: `Gasto Caja Chica - ${expense.description || 'Gasto'}`,
                    amount: -Math.abs(amount), // Negativo porque es un egreso
                    paymentMethod: expense.paymentMethod || 'efectivo',
                    reference: expense.receiptNumber || `PC-EX-${expense.id}`,
                    bankReference: expense.bankReference,
                    bankAccount: expense.bankAccount,
                    sourceData: expense,
                    createdAt: expense.createdAt,
                    type: 'expense'
                  });
                }
              }
            }
          }
        }
      } catch (error) {
        console.warn('Error obteniendo gastos de caja chica:', error);
      }
    }

    // Ordenar por fecha (más recientes primero)
    payments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return { success: true, data: payments };

  } catch (error) {
    console.error('Error obteniendo pagos consolidados:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al obtener pagos consolidados' 
    };
  }
}

/**
 * Obtiene estadísticas de los pagos consolidados
 */
export async function getConsolidatedPaymentsStats(
  filters: ConsolidatedPaymentsFilters = {}
): Promise<{ success: boolean; data?: ConsolidatedPaymentsStats; error?: string }> {
  try {
    const paymentsResult = await getConsolidatedPayments(filters);
    
    if (!paymentsResult.success || !paymentsResult.data) {
      return { success: false, error: paymentsResult.error };
    }

    const payments = paymentsResult.data;
    
    const stats: ConsolidatedPaymentsStats = {
      totalPayments: payments.length,
      totalIncome: 0,
      totalExpense: 0,
      netAmount: 0,
      bySource: {
        pos: { count: 0, amount: 0 },
        reservation: { count: 0, amount: 0 },
        supplier: { count: 0, amount: 0 },
        invoice: { count: 0, amount: 0 },
        petty_cash: { count: 0, amount: 0 }
      },
      byPaymentMethod: {}
    };

    payments.forEach(payment => {
      const amount = payment.amount;
      
      // Calcular totales por tipo
      if (amount > 0) {
        stats.totalIncome += amount;
      } else {
        stats.totalExpense += Math.abs(amount);
      }
      
      stats.netAmount += amount;

      // Estadísticas por fuente
      if (payment.source === 'pos') {
        stats.bySource.pos.count++;
        stats.bySource.pos.amount += amount;
      } else if (payment.source === 'reservation') {
        stats.bySource.reservation.count++;
        stats.bySource.reservation.amount += amount;
      } else if (payment.source === 'supplier') {
        stats.bySource.supplier.count++;
        stats.bySource.supplier.amount += amount;
      } else if (payment.source === 'invoice') {
        stats.bySource.invoice.count++;
        stats.bySource.invoice.amount += amount;
      } else if (payment.source === 'petty_cash_income' || payment.source === 'petty_cash_expense') {
        stats.bySource.petty_cash.count++;
        stats.bySource.petty_cash.amount += amount;
      }

      // Estadísticas por método de pago
      const method = payment.paymentMethod || 'sin_especificar';
      if (!stats.byPaymentMethod[method]) {
        stats.byPaymentMethod[method] = { count: 0, amount: 0 };
      }
      stats.byPaymentMethod[method].count++;
      stats.byPaymentMethod[method].amount += amount;
    });

    return { success: true, data: stats };

  } catch (error) {
    console.error('Error obteniendo estadísticas de pagos consolidados:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al obtener estadísticas' 
    };
  }
}

/**
 * Obtiene pagos consolidados para conciliación bancaria
 * Filtrados específicamente para pagos con referencias bancarias
 */
export async function getPaymentsForReconciliation(
  filters: ConsolidatedPaymentsFilters = {}
): Promise<{ success: boolean; data?: ConsolidatedPayment[]; error?: string }> {
  try {
    const paymentsResult = await getConsolidatedPayments(filters);
    
    if (!paymentsResult.success || !paymentsResult.data) {
      return { success: false, error: paymentsResult.error };
    }

    // Filtrar solo pagos que tengan referencias bancarias o sean susceptibles de aparecer en cartola
    const reconciliablePayments = paymentsResult.data.filter(payment => {
      // Incluir pagos con tarjeta (aparecen en Getnet)
      if (payment.paymentMethod === 'tarjeta' || payment.paymentMethod === 'card') {
        return true;
      }
      
      // Incluir transferencias (aparecen en cartola bancaria)
      if (payment.paymentMethod === 'transferencia' || payment.paymentMethod === 'transfer') {
        return true;
      }
      
      // Incluir pagos que tengan referencia bancaria explícita
      if (payment.bankReference || payment.bankAccount) {
        return true;
      }
      
      // Incluir pagos grandes en efectivo que podrían haber sido depositados
      if (payment.paymentMethod === 'efectivo' && Math.abs(payment.amount) > 50000) {
        return true;
      }
      
      return false;
    });

    return { success: true, data: reconciliablePayments };

  } catch (error) {
    console.error('Error obteniendo pagos para conciliación:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al obtener pagos para conciliación' 
    };
  }
} 