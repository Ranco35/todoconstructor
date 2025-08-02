'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getCurrentUser } from '@/actions/configuration/auth-actions';

export interface PendingOrder {
  id: string;
  table: string;
  items: string[];
  orderTime: string;
  priority: 'normal' | 'urgent';
  estimatedTime: number; // en minutos
}

export interface KitchenDashboardData {
  pendingOrders: PendingOrder[];
  totalOrders: number;
  averageWaitTime: number;
  currentCapacity: number;
}

/**
 * Obtiene los datos del dashboard de cocina
 */
export async function getKitchenDashboardData(): Promise<KitchenDashboardData> {
  try {
    console.log('[DEBUG] getKitchenDashboardData - Starting...');
    
    // Verificar usuario autenticado
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    // Verificar permisos de cocina
    const allowedRoles = ['COCINA', 'ADMINISTRADOR', 'SUPER_USER', 'JEFE_SECCION'];
    if (!allowedRoles.includes(currentUser.role)) {
      throw new Error('Usuario no tiene permisos para acceder a datos de cocina');
    }

    const supabase = await getSupabaseServerClient();
    const today = new Date().toISOString().split('T')[0];

    // Por ahora retornamos datos simulados hasta que se implemente
    // la integración completa con el sistema POS
    const mockData: KitchenDashboardData = {
      pendingOrders: [
        {
          id: 'ord-001',
          table: 'Mesa 5',
          items: [
            'Salmón a la plancha',
            'Ensalada César',
            'Pisco Sour x2'
          ],
          orderTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // hace 15 minutos
          priority: 'normal',
          estimatedTime: 20
        },
        {
          id: 'ord-002',
          table: 'Mesa 12',
          items: [
            'Cazuela de cordero',
            'Pan de campo',
            'Vino tinto (copa)'
          ],
          orderTime: new Date(Date.now() - 25 * 60 * 1000).toISOString(), // hace 25 minutos
          priority: 'urgent',
          estimatedTime: 18
        },
        {
          id: 'ord-003',
          table: 'Hab 101',
          items: [
            'Desayuno buffet x2',
            'Café americano x2',
            'Jugo natural'
          ],
          orderTime: new Date(Date.now() - 8 * 60 * 1000).toISOString(), // hace 8 minutos
          priority: 'normal',
          estimatedTime: 12
        }
      ],
      totalOrders: 23,
      averageWaitTime: 18,
      currentCapacity: 75
    };

    console.log('[DEBUG] getKitchenDashboardData - Success:', {
      pendingOrders: mockData.pendingOrders.length,
      totalOrders: mockData.totalOrders
    });

    return mockData;

  } catch (error) {
    console.error('Error in getKitchenDashboardData:', error);
    throw error;
  }
}

/**
 * Marca una orden como completada
 */
export async function markOrderComplete(orderId: string): Promise<{ success: boolean; message: string }> {
  try {
    console.log('[DEBUG] markOrderComplete - Order ID:', orderId);
    
    // Verificar usuario autenticado
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    // Verificar permisos de cocina
    const allowedRoles = ['COCINA', 'ADMINISTRADOR', 'SUPER_USER', 'JEFE_SECCION'];
    if (!allowedRoles.includes(currentUser.role)) {
      throw new Error('Usuario no tiene permisos para marcar órdenes como completadas');
    }

    // TODO: Implementar lógica real para marcar orden como completada
    // Esto incluiría:
    // 1. Actualizar estado en base de datos
    // 2. Notificar al POS/garzones
    // 3. Registrar tiempo de completación
    
    console.log('[DEBUG] markOrderComplete - Success for order:', orderId);
    
    return {
      success: true,
      message: 'Orden marcada como completada exitosamente'
    };

  } catch (error) {
    console.error('Error in markOrderComplete:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Obtiene estadísticas de rendimiento de cocina
 */
export async function getKitchenStats(date?: string): Promise<{
  totalOrders: number;
  completedOrders: number;
  averageCompletionTime: number;
  peakHours: string[];
}> {
  try {
    console.log('[DEBUG] getKitchenStats - Date:', date);
    
    // Verificar usuario autenticado
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    // Verificar permisos de cocina
    const allowedRoles = ['COCINA', 'ADMINISTRADOR', 'SUPER_USER', 'JEFE_SECCION'];
    if (!allowedRoles.includes(currentUser.role)) {
      throw new Error('Usuario no tiene permisos para ver estadísticas de cocina');
    }

    const supabase = await getSupabaseServerClient();
    const targetDate = date || new Date().toISOString().split('T')[0];

    // TODO: Implementar consultas reales a la base de datos
    // Por ahora retornamos datos simulados
    const mockStats = {
      totalOrders: 45,
      completedOrders: 42,
      averageCompletionTime: 18, // minutos
      peakHours: ['12:00-13:00', '19:00-20:00', '20:00-21:00']
    };

    console.log('[DEBUG] getKitchenStats - Success:', mockStats);
    
    return mockStats;

  } catch (error) {
    console.error('Error in getKitchenStats:', error);
    throw error;
  }
}

/**
 * Actualiza la prioridad de una orden
 */
export async function updateOrderPriority(
  orderId: string, 
  priority: 'normal' | 'urgent'
): Promise<{ success: boolean; message: string }> {
  try {
    console.log('[DEBUG] updateOrderPriority - Order ID:', orderId, 'Priority:', priority);
    
    // Verificar usuario autenticado
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    // Verificar permisos de cocina
    const allowedRoles = ['COCINA', 'ADMINISTRADOR', 'SUPER_USER', 'JEFE_SECCION'];
    if (!allowedRoles.includes(currentUser.role)) {
      throw new Error('Usuario no tiene permisos para actualizar prioridad de órdenes');
    }

    // TODO: Implementar lógica real para actualizar prioridad
    // Esto incluiría:
    // 1. Actualizar estado en base de datos
    // 2. Notificar cambio al POS/garzones
    // 3. Registrar el cambio en log de auditoría
    
    console.log('[DEBUG] updateOrderPriority - Success for order:', orderId);
    
    return {
      success: true,
      message: `Prioridad actualizada a ${priority} exitosamente`
    };

  } catch (error) {
    console.error('Error in updateOrderPriority:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Obtiene el historial de órdenes de cocina
 */
export async function getKitchenOrderHistory(
  date?: string,
  limit: number = 50
): Promise<PendingOrder[]> {
  try {
    console.log('[DEBUG] getKitchenOrderHistory - Date:', date, 'Limit:', limit);
    
    // Verificar usuario autenticado
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    // Verificar permisos de cocina
    const allowedRoles = ['COCINA', 'ADMINISTRADOR', 'SUPER_USER', 'JEFE_SECCION'];
    if (!allowedRoles.includes(currentUser.role)) {
      throw new Error('Usuario no tiene permisos para ver historial de órdenes');
    }

    const supabase = await getSupabaseServerClient();
    const targetDate = date || new Date().toISOString().split('T')[0];

    // TODO: Implementar consultas reales a la base de datos
    // Por ahora retornamos datos simulados
    const mockHistory: PendingOrder[] = [
      {
        id: 'ord-hist-001',
        table: 'Mesa 3',
        items: ['Paella de mariscos', 'Sangría', 'Postre del día'],
        orderTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // hace 2 horas
        priority: 'normal',
        estimatedTime: 25
      },
      {
        id: 'ord-hist-002',
        table: 'Hab 203',
        items: ['Room service - Hamburguesa', 'Papas fritas', 'Bebida'],
        orderTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // hace 3 horas
        priority: 'urgent',
        estimatedTime: 15
      }
    ];

    console.log('[DEBUG] getKitchenOrderHistory - Success:', mockHistory.length, 'orders');
    
    return mockHistory;

  } catch (error) {
    console.error('Error in getKitchenOrderHistory:', error);
    throw error;
  }
}