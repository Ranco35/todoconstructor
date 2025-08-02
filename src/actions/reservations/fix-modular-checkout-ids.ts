'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getCurrentUser } from '@/actions/configuration/auth-actions';
import { checkOutReservation } from './update-status';

export interface ModularCheckoutFix {
  success: boolean;
  message: string;
  modularId: number;
  principalId?: number;
  guestName?: string;
  error?: string;
}

/**
 * Obtener el ID principal real desde un ID modular
 * @param modularId ID de modular_reservations mostrado en calendario
 * @returns ID de la reserva principal y datos adicionales
 */
export async function getPrincipalIdFromModular(modularId: number): Promise<{
  success: boolean;
  principalId?: number;
  guestName?: string;
  status?: string;
  roomCode?: string;
  message: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data: modularReservation, error } = await supabase
      .from('modular_reservations')
      .select(`
        id,
        reservation_id,
        room_code,
        status,
        reservations!inner(
          id,
          guest_name,
          status,
          payment_status
        )
      `)
      .eq('id', modularId)
      .single();
    
    if (error || !modularReservation) {
      return {
        success: false,
        message: `ID modular ${modularId} no encontrado`
      };
    }
    
    return {
      success: true,
      principalId: modularReservation.reservation_id,
      guestName: modularReservation.reservations.guest_name,
      status: modularReservation.reservations.status,
      roomCode: modularReservation.room_code,
      message: `ID principal: ${modularReservation.reservation_id} para ${modularReservation.reservations.guest_name}`
    };
    
  } catch (error) {
    console.error('Error in getPrincipalIdFromModular:', error);
    return {
      success: false,
      message: `Error al obtener ID principal: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Realizar check-out usando ID modular (corrige automáticamente al ID principal)
 * @param modularId ID modular mostrado en el calendario
 * @returns Resultado del check-out
 */
export async function checkOutFromModularId(modularId: number): Promise<ModularCheckoutFix> {
  try {
    // Verificar autenticación
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        message: 'Usuario no autenticado',
        modularId
      };
    }
    
    // Obtener ID principal real
    const principalInfo = await getPrincipalIdFromModular(modularId);
    
    if (!principalInfo.success || !principalInfo.principalId) {
      return {
        success: false,
        message: principalInfo.message,
        modularId,
        error: 'No se pudo obtener ID principal'
      };
    }
    
    // Realizar check-out con ID principal correcto
    const checkoutResult = await checkOutReservation(principalInfo.principalId);
    
    return {
      success: checkoutResult.success,
      message: checkoutResult.success 
        ? `✅ Check-out exitoso para ${principalInfo.guestName} (ID modular ${modularId} → ID principal ${principalInfo.principalId})`
        : `❌ Error en check-out: ${checkoutResult.error}`,
      modularId,
      principalId: principalInfo.principalId,
      guestName: principalInfo.guestName,
      error: checkoutResult.success ? undefined : checkoutResult.error
    };
    
  } catch (error) {
    console.error('Error in checkOutFromModularId:', error);
    return {
      success: false,
      message: `Error en check-out desde ID modular: ${error instanceof Error ? error.message : 'Unknown error'}`,
      modularId,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Verificar y corregir múltiples IDs modulares de una vez
 * @param modularIds Array de IDs modulares problemáticos
 * @returns Resultados de la verificación y corrección
 */
export async function batchCheckoutModularIds(modularIds: number[]): Promise<{
  success: boolean;
  results: ModularCheckoutFix[];
  summary: string;
}> {
  try {
    const results: ModularCheckoutFix[] = [];
    
    for (const modularId of modularIds) {
      const result = await checkOutFromModularId(modularId);
      results.push(result);
    }
    
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    return {
      success: successCount === totalCount,
      results,
      summary: `Check-out procesado: ${successCount}/${totalCount} exitosos`
    };
    
  } catch (error) {
    console.error('Error in batchCheckoutModularIds:', error);
    return {
      success: false,
      results: [],
      summary: `Error en procesamiento batch: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Obtener mapping completo de IDs modulares a principales para debugging
 * @returns Mapping de todos los IDs problemáticos
 */
export async function getAllModularToPrincipalMapping(): Promise<{
  success: boolean;
  mappings: Array<{
    modularId: number;
    principalId: number;
    guestName: string;
    roomCode: string;
    status: string;
    paymentStatus: string;
  }>;
  message: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data: mappings, error } = await supabase
      .from('modular_reservations')
      .select(`
        id,
        reservation_id,
        room_code,
        status,
        reservations!inner(
          id,
          guest_name,
          status,
          payment_status
        )
      `)
      .order('id');
    
    if (error) {
      return {
        success: false,
        mappings: [],
        message: `Error obteniendo mappings: ${error.message}`
      };
    }
    
    const formattedMappings = mappings?.map(m => ({
      modularId: m.id,
      principalId: m.reservation_id,
      guestName: m.reservations.guest_name,
      roomCode: m.room_code,
      status: m.reservations.status,
      paymentStatus: m.reservations.payment_status
    })) || [];
    
    return {
      success: true,
      mappings: formattedMappings,
      message: `${formattedMappings.length} mappings encontrados`
    };
    
  } catch (error) {
    console.error('Error in getAllModularToPrincipalMapping:', error);
    return {
      success: false,
      mappings: [],
      message: `Error interno: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}