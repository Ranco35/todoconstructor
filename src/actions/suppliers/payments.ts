'use server';

import { getSupabaseServerClient, getSupabaseServiceClient } from '@/lib/supabase-server';

export interface SupplierPaymentData {
  id: number;
  amount: number;
  description: string;
  paymentMethod: 'cash' | 'transfer' | 'card' | 'other';
  bankReference?: string | null;
  bankAccount?: string | null;
  receiptNumber?: string | null;
  notes?: string | null;
  createdAt: Date;
  CashSession: {
    id: number;
    sessionNumber?: string;
    openedAt: Date;
  };
  CostCenter?: {
    id: number;
    name: string;
    code?: string | null;
  } | null;
  User: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Obtiene el historial de pagos de un proveedor específico desde caja chica
 */
export async function getSupplierPayments(supplierId: number): Promise<SupplierPaymentData[]> {
  try {
    console.log('🔍 [getSupplierPayments] Obteniendo pagos para proveedor:', supplierId);

    // Usar service client para evitar problemas de RLS
    const supabase = await getSupabaseServiceClient();
    
    console.log('🔍 [getSupplierPayments] Cliente Supabase obtenido');
    
    // Primero verificar si la tabla existe y tiene datos
    const { data: testQuery, error: testError } = await supabase
      .from('SupplierPayment')
      .select('count')
      .limit(1);
    
    console.log('🔍 [getSupplierPayments] Test query resultado:', { testQuery, testError });
    
    // Consulta simplificada para evitar problemas de referencias
    const { data: payments, error } = await supabase
      .from('SupplierPayment')
      .select('*')
      .eq('supplierId', supplierId)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('❌ [getSupplierPayments] Error en consulta:', error);
      throw error;
    }

    console.log(`✅ [getSupplierPayments] ${payments?.length || 0} pagos encontrados para proveedor ${supplierId}`);
    console.log('🔍 [getSupplierPayments] Primeros datos:', payments?.slice(0, 2));

    if (!payments || payments.length === 0) {
      return [];
    }

    // Obtener información adicional por separado
    const sessionIds = [...new Set(payments.map(p => p.sessionId))];
    const userIds = [...new Set(payments.map(p => p.userId))];
    const costCenterIds = [...new Set(payments.map(p => p.costCenterId).filter(Boolean))];

    console.log('🔍 [getSupplierPayments] IDs a consultar:', { sessionIds, userIds, costCenterIds });

    // Consultas paralelas para obtener información relacionada
    const [sessionsData, usersData, costCentersData] = await Promise.all([
      supabase.from('CashSession').select('id, sessionNumber, openedAt').in('id', sessionIds),
      supabase.from('User').select('id, name, email').in('id', userIds),
      costCenterIds.length > 0 
        ? supabase.from('Cost_Center').select('id, name, code').in('id', costCenterIds)
        : Promise.resolve({ data: [], error: null })
    ]);

    console.log('🔍 [getSupplierPayments] Datos relacionados obtenidos:', {
      sessions: sessionsData.data?.length,
      users: usersData.data?.length,
      costCenters: costCentersData.data?.length
    });

    // Crear mapas para búsqueda rápida
    const sessionsMap = new Map((sessionsData.data || []).map(s => [s.id, s]));
    const usersMap = new Map((usersData.data || []).map(u => [u.id, u]));
    const costCentersMap = new Map((costCentersData.data || []).map(cc => [cc.id, cc]));

    const mappedPayments = payments.map(payment => {
      const session = sessionsMap.get(payment.sessionId);
      const user = usersMap.get(payment.userId);
      const costCenter = payment.costCenterId ? costCentersMap.get(payment.costCenterId) : null;

      return {
        id: payment.id,
        amount: payment.amount,
        description: payment.description,
        paymentMethod: payment.paymentMethod,
        bankReference: payment.bankReference,
        bankAccount: payment.bankAccount,
        receiptNumber: payment.receiptNumber,
        notes: payment.notes,
        createdAt: new Date(payment.createdAt),
        CashSession: {
          id: session?.id || 0,
          sessionNumber: session?.sessionNumber || `Sesión #${session?.id || payment.sessionId}`,
          openedAt: session?.openedAt ? new Date(session.openedAt) : new Date(),
        },
        CostCenter: costCenter ? {
          id: costCenter.id,
          name: costCenter.name,
          code: costCenter.code,
        } : null,
        User: {
          id: user?.id || 'unknown',
          name: user?.name || 'Usuario no encontrado',
          email: user?.email || 'email@desconocido.com',
        }
      };
    });

    console.log('✅ [getSupplierPayments] Pagos mapeados exitosamente:', mappedPayments.length);
    return mappedPayments;
  } catch (error) {
    console.error('❌ [getSupplierPayments] Error general:', error);
    return [];
  }
}

/**
 * Obtiene estadísticas de pagos de un proveedor
 */
export async function getSupplierPaymentStats(supplierId: number) {
  try {
    const payments = await getSupplierPayments(supplierId);
    
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalPayments = payments.length;
    const lastPayment = payments.length > 0 ? payments[0] : null;
    
    // Pagos por método
    const paymentsByMethod = payments.reduce((acc, payment) => {
      acc[payment.paymentMethod] = (acc[payment.paymentMethod] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Pagos por mes (últimos 6 meses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const recentPayments = payments.filter(payment => payment.createdAt >= sixMonthsAgo);
    const monthlyPayments = recentPayments.reduce((acc, payment) => {
      const monthKey = payment.createdAt.toISOString().substring(0, 7); // YYYY-MM
      acc[monthKey] = (acc[monthKey] || 0) + payment.amount;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalAmount,
      totalPayments,
      lastPayment,
      paymentsByMethod,
      monthlyPayments,
      averagePayment: totalPayments > 0 ? totalAmount / totalPayments : 0,
    };
  } catch (error) {
    console.error('❌ [getSupplierPaymentStats] Error:', error);
    return {
      totalAmount: 0,
      totalPayments: 0,
      lastPayment: null,
      paymentsByMethod: {},
      monthlyPayments: {},
      averagePayment: 0,
    };
  }
} 