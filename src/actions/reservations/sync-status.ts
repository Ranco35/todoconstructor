'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';

export interface StatusSyncResult {
  success: boolean;
  message: string;
  reservation_id: number;
  main_status: string;
  modular_count: number;
  synced_count: number;
}

/**
 * Sincroniza el estado entre la reserva principal y sus reservas modulares
 */
export async function syncReservationStatus(reservationId: number): Promise<StatusSyncResult> {
  try {
    const supabase = await getSupabaseServerClient();

    // 1️⃣ Obtener estado de la reserva principal
    const { data: mainReservation, error: mainError } = await supabase
      .from('reservations')
      .select('id, status')
      .eq('id', reservationId)
      .single();

    if (mainError || !mainReservation) {
      return {
        success: false,
        message: `Reserva principal ${reservationId} no encontrada`,
        reservation_id: reservationId,
        main_status: '',
        modular_count: 0,
        synced_count: 0
      };
    }

    // 2️⃣ Obtener reservas modulares actuales
    const { data: modularReservations, error: modularError } = await supabase
      .from('modular_reservations')
      .select('id, status, room_code')
      .eq('reservation_id', reservationId);

    if (modularError) {
      return {
        success: false,
        message: `Error al obtener reservas modulares: ${modularError.message}`,
        reservation_id: reservationId,
        main_status: mainReservation.status,
        modular_count: 0,
        synced_count: 0
      };
    }

    const modularCount = modularReservations?.length || 0;

    if (modularCount === 0) {
      return {
        success: true,
        message: 'No hay reservas modulares que sincronizar',
        reservation_id: reservationId,
        main_status: mainReservation.status,
        modular_count: 0,
        synced_count: 0
      };
    }

    // 3️⃣ Verificar si ya están sincronizadas
    const alreadySynced = modularReservations?.every(mr => mr.status === mainReservation.status) || false;

    if (alreadySynced) {
      return {
        success: true,
        message: 'Estados ya sincronizados',
        reservation_id: reservationId,
        main_status: mainReservation.status,
        modular_count: modularCount,
        synced_count: modularCount
      };
    }

    // 4️⃣ Sincronizar estados (actualizar modulares al estado principal)
    const { error: updateError, count } = await supabase
      .from('modular_reservations')
      .update({ status: mainReservation.status })
      .eq('reservation_id', reservationId);

    if (updateError) {
      return {
        success: false,
        message: `Error al sincronizar estados: ${updateError.message}`,
        reservation_id: reservationId,
        main_status: mainReservation.status,
        modular_count: modularCount,
        synced_count: 0
      };
    }

    return {
      success: true,
      message: `Estados sincronizados correctamente. ${count} registros modulares actualizados a '${mainReservation.status}'`,
      reservation_id: reservationId,
      main_status: mainReservation.status,
      modular_count: modularCount,
      synced_count: count || 0
    };

  } catch (error) {
    console.error('Error in syncReservationStatus:', error);
    return {
      success: false,
      message: `Error interno: ${error instanceof Error ? error.message : 'Unknown error'}`,
      reservation_id: reservationId,
      main_status: '',
      modular_count: 0,
      synced_count: 0
    };
  }
}

/**
 * Sincroniza estados de todas las reservas que tengan inconsistencias
 */
export async function syncAllReservationStatuses(): Promise<{
  success: boolean;
  message: string;
  results: StatusSyncResult[];
}> {
  try {
    const supabase = await getSupabaseServerClient();

    // Obtener reservas con inconsistencias de estado
    const { data: inconsistentReservations, error } = await supabase
      .rpc('find_status_inconsistencies');

    if (error) {
      console.error('Error finding inconsistencies:', error);
      return {
        success: false,
        message: `Error al buscar inconsistencias: ${error.message}`,
        results: []
      };
    }

    if (!inconsistentReservations || inconsistentReservations.length === 0) {
      return {
        success: true,
        message: 'No se encontraron inconsistencias de estado',
        results: []
      };
    }

    // Sincronizar cada reserva inconsistente
    const results: StatusSyncResult[] = [];
    for (const reservation of inconsistentReservations) {
      const result = await syncReservationStatus(reservation.reservation_id);
      results.push(result);
    }

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    return {
      success: successCount === totalCount,
      message: `Sincronización completada: ${successCount}/${totalCount} reservas procesadas exitosamente`,
      results
    };

  } catch (error) {
    console.error('Error in syncAllReservationStatuses:', error);
    return {
      success: false,
      message: `Error interno: ${error instanceof Error ? error.message : 'Unknown error'}`,
      results: []
    };
  }
} 