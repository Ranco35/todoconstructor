'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getCurrentUser } from '@/actions/configuration/auth-actions';
import { syncReservationStatus } from './sync-status';
import { checkOutReservation } from './update-status';

export interface MultipleRoomCheckoutResult {
  success: boolean;
  message: string;
  reservationId: number;
  guestName?: string;
  issues?: string[];
  roomsProcessed?: string[];
}

/**
 * Diagnosticar problemas de check-out en reservas de múltiples habitaciones
 * @param reservationId ID de la reserva (principal o modular)
 * @returns Diagnóstico detallado
 */
export async function diagnoseMultipleRoomCheckout(reservationId: number) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Buscar si es reserva principal o modular
    let mainReservationId = reservationId;
    let isModular = false;
    
    // Intentar buscar como reserva principal
    let { data: mainReservation, error: mainError } = await supabase
      .from('reservations')
      .select('id, guest_name, status, payment_status')
      .eq('id', reservationId)
      .single();
    
    // Si no se encuentra, buscar como modular
    if (mainError || !mainReservation) {
      const { data: modularReservation, error: modularError } = await supabase
        .from('modular_reservations')
        .select(`
          id,
          reservation_id,
          room_code,
          status,
          reservations!inner(id, guest_name, status, payment_status)
        `)
        .eq('id', reservationId)
        .single();
      
      if (modularError || !modularReservation) {
        return {
          success: false,
          message: 'Reserva no encontrada',
          reservationId
        };
      }
      
      mainReservationId = modularReservation.reservation_id;
      isModular = true;
      mainReservation = {
        id: modularReservation.reservation_id,
        guest_name: modularReservation.reservations.guest_name,
        status: modularReservation.reservations.status,
        payment_status: modularReservation.reservations.payment_status
      };
    }
    
    // Obtener todas las reservas modulares asociadas
    const { data: modularReservations, error: modularError } = await supabase
      .from('modular_reservations')
      .select('id, room_code, status')
      .eq('reservation_id', mainReservationId);
    
    if (modularError) {
      return {
        success: false,
        message: `Error obteniendo habitaciones: ${modularError.message}`,
        reservationId: mainReservationId
      };
    }
    
    const issues: string[] = [];
    const roomsInfo: string[] = [];
    
    // Analizar estados
    const mainStatus = mainReservation.status;
    const modularStatuses = modularReservations?.map(mr => mr.status) || [];
    const uniqueStatuses = [...new Set(modularStatuses)];
    
    roomsInfo.push(`Reserva principal: ${mainStatus}`);
    
    if (modularReservations && modularReservations.length > 0) {
      roomsInfo.push(`Habitaciones (${modularReservations.length}):`);
      modularReservations.forEach(mr => {
        roomsInfo.push(`  - Hab. ${mr.room_code}: ${mr.status}`);
      });
      
      // Detectar inconsistencias
      if (uniqueStatuses.length > 1) {
        issues.push(`❌ Estados inconsistentes entre habitaciones: ${uniqueStatuses.join(', ')}`);
      }
      
      if (!uniqueStatuses.includes(mainStatus)) {
        issues.push(`❌ Estado principal (${mainStatus}) no coincide con habitaciones`);
      }
      
      // Verificar si puede hacer check-out
      if (mainStatus === 'confirmada' && uniqueStatuses.includes('confirmada')) {
        issues.push(`⚠️ Reserva en estado 'confirmada' - Requiere check-in primero`);
      }
      
      if (mainStatus === 'en_curso' && !uniqueStatuses.every(s => s === 'en_curso')) {
        issues.push(`⚠️ Algunas habitaciones no están en 'en_curso'`);
      }
      
      if (mainStatus === 'finalizada') {
        issues.push(`ℹ️ Reserva ya finalizada - Check-out ya realizado`);
      }
    } else {
      issues.push(`⚠️ No se encontraron habitaciones modulares para esta reserva`);
    }
    
    return {
      success: true,
      message: issues.length === 0 ? '✅ No se detectaron problemas' : `Se detectaron ${issues.length} problema(s)`,
      reservationId: mainReservationId,
      guestName: mainReservation.guest_name,
      issues,
      roomsProcessed: roomsInfo,
      canCheckout: mainStatus === 'en_curso' && uniqueStatuses.every(s => s === 'en_curso'),
      needsSync: uniqueStatuses.length > 1 || !uniqueStatuses.includes(mainStatus),
      currentStatus: mainStatus,
      paymentStatus: mainReservation.payment_status
    };
    
  } catch (error) {
    console.error('Error in diagnoseMultipleRoomCheckout:', error);
    return {
      success: false,
      message: `Error de diagnóstico: ${error instanceof Error ? error.message : 'Unknown error'}`,
      reservationId
    };
  }
}

/**
 * Corregir estados de reserva de múltiples habitaciones para permitir check-out
 * @param reservationId ID de la reserva (principal o modular)
 * @param forceToStatus Estado al que forzar (opcional)
 * @returns Resultado de la corrección
 */
export async function fixMultipleRoomForCheckout(
  reservationId: number,
  forceToStatus?: 'en_curso' | 'confirmada'
): Promise<MultipleRoomCheckoutResult> {
  try {
    // Verificar autenticación
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        message: 'Usuario no autenticado',
        reservationId
      };
    }
    
    // Primero diagnosticar
    const diagnosis = await diagnoseMultipleRoomCheckout(reservationId);
    if (!diagnosis.success) {
      return {
        success: false,
        message: `Error en diagnóstico: ${diagnosis.message}`,
        reservationId
      };
    }
    
    const mainReservationId = diagnosis.reservationId;
    const targetStatus = forceToStatus || 'en_curso';
    
    // Si ya está listo para check-out, no hacer nada
    if ((diagnosis as any).canCheckout && targetStatus === 'en_curso') {
      return {
        success: true,
        message: '✅ Reserva ya está lista para check-out',
        reservationId: mainReservationId,
        guestName: diagnosis.guestName
      };
    }
    
    // Sincronizar estados usando la función existente
    if ((diagnosis as any).needsSync) {
      console.log(`[DEBUG] Sincronizando estados para reserva ${mainReservationId}`);
      const syncResult = await syncReservationStatus(mainReservationId!);
      
      if (!syncResult.success) {
        return {
          success: false,
          message: `Error en sincronización: ${syncResult.message}`,
          reservationId: mainReservationId
        };
      }
    }
    
    // Si necesita ser movido a 'en_curso' para check-out
    if ((diagnosis as any).currentStatus === 'confirmada' && targetStatus === 'en_curso') {
      const supabase = await getSupabaseServerClient();
      
      // Actualizar reserva principal
      const { error: mainUpdateError } = await supabase
        .from('reservations')
        .update({
          status: 'en_curso',
          updated_at: new Date().toISOString()
        })
        .eq('id', mainReservationId);
      
      if (mainUpdateError) {
        return {
          success: false,
          message: `Error actualizando reserva principal: ${mainUpdateError.message}`,
          reservationId: mainReservationId
        };
      }
      
      // Actualizar reservas modulares
      const { error: modularUpdateError } = await supabase
        .from('modular_reservations')
        .update({
          status: 'en_curso',
          updated_at: new Date().toISOString()
        })
        .eq('reservation_id', mainReservationId);
      
      if (modularUpdateError) {
        console.warn(`Warning: Error actualizando modulares: ${modularUpdateError.message}`);
      }
      
      // Agregar comentario de sistema
      await supabase
        .from('reservation_comments')
        .insert([{
          reservation_id: mainReservationId,
          text: `🔧 Estados corregidos manualmente para permitir check-out. Confirmada → En Curso`,
          author: `${currentUser.firstName} ${currentUser.lastName}`,
          comment_type: 'system'
        }]);
    }
    
    return {
      success: true,
      message: `✅ Estados corregidos exitosamente. Reserva de ${diagnosis.guestName} lista para check-out`,
      reservationId: mainReservationId,
      guestName: diagnosis.guestName,
      roomsProcessed: diagnosis.roomsProcessed
    };
    
  } catch (error) {
    console.error('Error in fixMultipleRoomForCheckout:', error);
    return {
      success: false,
      message: `Error en corrección: ${error instanceof Error ? error.message : 'Unknown error'}`,
      reservationId
    };
  }
}

/**
 * Realizar check-out forzado para reservas problemáticas de múltiples habitaciones
 * @param reservationId ID de la reserva
 * @returns Resultado del check-out
 */
export async function forceMultipleRoomCheckout(reservationId: number): Promise<MultipleRoomCheckoutResult> {
  try {
    // Primero intentar corregir estados
    const fixResult = await fixMultipleRoomForCheckout(reservationId, 'en_curso');
    
    if (!fixResult.success) {
      return fixResult;
    }
    
    // Luego realizar check-out normal
    const checkoutResult = await checkOutReservation(fixResult.reservationId);
    
    return {
      success: checkoutResult.success,
      message: checkoutResult.success 
        ? `✅ Check-out completado exitosamente para ${fixResult.guestName}` 
        : `❌ Error en check-out: ${checkoutResult.error}`,
      reservationId: fixResult.reservationId,
      guestName: fixResult.guestName,
      roomsProcessed: fixResult.roomsProcessed
    };
    
  } catch (error) {
    console.error('Error in forceMultipleRoomCheckout:', error);
    return {
      success: false,
      message: `Error en check-out forzado: ${error instanceof Error ? error.message : 'Unknown error'}`,
      reservationId
    };
  }
}