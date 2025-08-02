'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

async function getSupabaseClient() {
  // Usar la service key para acceso completo a la base de datos
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: () => undefined,
        set: () => {},
        remove: () => {},
      }
    }
  );
}

export async function getCashSessionStatus() {
  try {
    const supabase = await getSupabaseClient();

    // Obtener sesiones activas
    const { data: activeSessions, error: activeError } = await supabase
      .from('CashSession')
      .select('*')
      .eq('status', 'open');

    if (activeError) {
      console.error('Error getting active sessions:', activeError);
      throw activeError;
    }

    // Contar gastos totales
    const { data: expenses, error: expensesError } = await supabase
      .from('PettyCashExpense')
      .select('id');

    // Contar compras totales
    const { data: purchases, error: purchasesError } = await supabase
      .from('PettyCashPurchase')
      .select('id');

    return {
      activeSessions: activeSessions?.length || 0,
      activeSessionsDetails: activeSessions || [],
      totalExpenses: expenses?.length || 0,
      totalPurchases: purchases?.length || 0,
    };
  } catch (error) {
    console.error('Error getting cash session status:', error);
    throw error;
  }
}

export async function resetCashSessions() {
  try {
    const supabase = await getSupabaseClient();

    // 1. Obtener sesiones activas
    const { data: activeSessions, error: getError } = await supabase
      .from('CashSession')
      .select('*')
      .eq('status', 'open');

    if (getError) {
      console.error('Error getting active sessions:', getError);
      return { success: false, error: 'Error al obtener sesiones activas: ' + getError.message };
    }

    if (!activeSessions || activeSessions.length === 0) {
      return { 
        success: true, 
        message: 'No hay sesiones activas para cerrar. El sistema ya está limpio.' 
      };
    }

    // 2. Cerrar todas las sesiones activas
    const closedSessions = [];
    const errors = [];

    for (const session of activeSessions) {
      const { error: updateError } = await supabase
        .from('CashSession')
        .update({
          status: 'closed',
          closedAt: new Date().toISOString(),
          currentAmount: session.openingAmount, // Cerrar con monto inicial
          notes: `SESIÓN CERRADA AUTOMÁTICAMENTE - RESET DEL SISTEMA
Fecha de reset: ${new Date().toLocaleString()}
Monto inicial: $${session.openingAmount.toLocaleString()}
Sesión cerrada para limpieza del sistema`
        })
        .eq('id', session.id);

      if (updateError) {
        console.error(`Error closing session ${session.id}:`, updateError);
        errors.push(`Sesión ${session.id}: ${updateError.message}`);
      } else {
        closedSessions.push(session.id);
      }
    }

    // 3. Revalidar rutas
    revalidatePath('/dashboard/pettyCash');
    revalidatePath('/dashboard/pettyCash/reset');

    // 4. Preparar mensaje de resultado
    if (errors.length > 0) {
      return {
        success: false,
        error: `Errores al cerrar algunas sesiones: ${errors.join(', ')}`
      };
    }

    const successMessage = `✅ Reset completado exitosamente!

📊 Sesiones cerradas: ${closedSessions.length}
📋 IDs de sesiones: ${closedSessions.join(', ')}

🧹 El sistema está ahora limpio y listo para empezar desde cero.

Siguientes pasos:
1. Ve a la página principal de Caja Chica
2. Haz clic en "Abrir Nueva Sesión"
3. Ingresa el monto inicial real
4. Registra solo transacciones reales`;

    return {
      success: true,
      message: successMessage,
      closedSessions: closedSessions.length
    };

  } catch (error) {
    console.error('Error during reset:', error);
    return { 
      success: false, 
      error: 'Error inesperado durante el reset: ' + error.message 
    };
  }
}

export async function debugCashSessions() {
  try {
    const supabase = await getSupabaseClient();
    
    console.log('🔧 DEBUG: Iniciando diagnóstico completo...');
    
    // Query 1: Todas las sesiones
    const { data: all, error: e1 } = await supabase
      .from('CashSession')
      .select('*');
    
    // Query 2: Solo sesiones abiertas
    const { data: open, error: e2 } = await supabase
      .from('CashSession')
      .select('*')
      .eq('status', 'open');
    
    // Query 3: Verificar estructura de la tabla
    const { data: sample, error: e3 } = await supabase
      .from('CashSession')
      .select('*')
      .limit(1);
    
    console.log('🔧 Total sesiones:', all?.length || 0);
    console.log('🔧 Sesiones abiertas:', open?.length || 0);
    console.log('🔧 Muestra de estructura:', sample?.[0]);
    
    if (all && all.length > 0) {
      console.log('🔧 Detalle de todas las sesiones:');
      all.forEach((session, index) => {
        console.log(`  ${index + 1}. ID: ${session.id}, Status: "${session.status}", User: ${session.userId}`);
      });
    }
    
    return {
      success: true,
      totalSessions: all?.length || 0,
      openSessions: open?.length || 0,
      allSessions: all || [],
      openSessionsOnly: open || []
    };
    
  } catch (error) {
    console.error('Error in debug:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function cleanTestData() {
  try {
    const supabase = await getSupabaseClient();

    // Eliminar gastos de prueba
    const { error: expensesError } = await supabase
      .from('PettyCashExpense')
      .delete()
      .or('description.ilike.%prueba%,description.ilike.%test%,description.ilike.%demo%');

    // Eliminar compras de prueba
    const { error: purchasesError } = await supabase
      .from('PettyCashPurchase')
      .delete()
      .or('description.ilike.%prueba%,description.ilike.%test%,description.ilike.%demo%');

    if (expensesError || purchasesError) {
      return {
        success: false,
        error: `Error limpiando datos: ${expensesError?.message || purchasesError?.message}`
      };
    }

    revalidatePath('/dashboard/pettyCash');
    return {
      success: true,
      message: 'Datos de prueba eliminados correctamente'
    };

  } catch (error) {
    console.error('Error cleaning test data:', error);
    return {
      success: false,
      error: 'Error inesperado limpiando datos: ' + error.message
    };
  }
} 