'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';

// 🎯 INTERFAZ UNIFICADA - SOLO UN ID POR RESERVA
export interface UnifiedReservation {
  reservation_id: number;        // SIEMPRE ID de tabla principal
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  client_id: number;
  check_in: string;
  check_out: string;
  status: string;
  total_amount: number;
  paid_amount: number;
  payment_status: string;
  created_at: string;
  updated_at: string;
  
  // Datos del cliente
  client_full_name: string;
  client_rut: string;
  client_email: string;
  
  // Datos modulares (si existen)
  modular_internal_id?: number;  // Solo para referencia interna
  room_code?: string;
  package_modular_id?: number;
  adults?: number;
  children?: number;
  modular_total?: number;
  modular_final_price?: number;
  
  // Datos del paquete
  package_name?: string;
  package_code?: string;
  
  // Datos de habitación
  room_number?: string;
  room_type?: string;
  
  // Campos unificados
  unified_total: number;
  unified_guest_name: string;
  source_table: string;
  reservation_type: 'modular' | 'simple';
}

// 🎯 FUNCIÓN PRINCIPAL - USA VISTA UNIFICADA
export async function getUnifiedReservations(): Promise<UnifiedReservation[]> {
  try {
    console.log('[UNIFIED] Obteniendo reservas de vista unificada...');
    const supabase = await getSupabaseServerClient();
    
    const { data: reservations, error } = await supabase
      .from('v_unified_reservations')  // 🎯 VISTA UNIFICADA
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[UNIFIED] Error:', error);
      return [];
    }

    console.log(`[UNIFIED] ✅ ${reservations?.length || 0} reservas obtenidas`);
    
    // 🎯 NO HAY CONFUSIÓN DE IDs - SOLO reservation_id
    return reservations || [];
    
  } catch (error) {
    console.error('[UNIFIED] Error inesperado:', error);
    return [];
  }
}

// 🎯 OBTENER RESERVA POR ID - SIN CONFUSIÓN
export async function getUnifiedReservationById(reservationId: number): Promise<UnifiedReservation | null> {
  try {
    console.log(`[UNIFIED] Obteniendo reserva ID: ${reservationId}`);
    const supabase = await getSupabaseServerClient();
    
    const { data: reservation, error } = await supabase
      .from('v_unified_reservations')  // 🎯 VISTA UNIFICADA
      .select('*')
      .eq('reservation_id', reservationId)  // 🎯 SIEMPRE reservation_id
      .single();

    if (error) {
      console.error(`[UNIFIED] Error obteniendo reserva ${reservationId}:`, error);
      return null;
    }

    console.log(`[UNIFIED] ✅ Reserva ${reservationId}: ${reservation.unified_guest_name}`);
    return reservation;
    
  } catch (error) {
    console.error(`[UNIFIED] Error inesperado obteniendo reserva ${reservationId}:`, error);
    return null;
  }
}

// 🎯 BÚSQUEDA UNIFICADA - SIN CONFUSIÓN DE IDs
export async function searchUnifiedReservations(searchTerm: string): Promise<UnifiedReservation[]> {
  try {
    console.log(`[UNIFIED] Buscando: "${searchTerm}"`);
    const supabase = await getSupabaseServerClient();
    
    const { data: reservations, error } = await supabase
      .from('v_unified_reservations')  // 🎯 VISTA UNIFICADA
      .select('*')
      .or(`
        unified_guest_name.ilike.%${searchTerm}%,
        client_full_name.ilike.%${searchTerm}%,
        client_rut.ilike.%${searchTerm}%,
        guest_email.ilike.%${searchTerm}%,
        package_name.ilike.%${searchTerm}%,
        room_code.ilike.%${searchTerm}%
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[UNIFIED] Error en búsqueda:', error);
      return [];
    }

    console.log(`[UNIFIED] ✅ ${reservations?.length || 0} resultados para: "${searchTerm}"`);
    return reservations || [];
    
  } catch (error) {
    console.error('[UNIFIED] Error inesperado en búsqueda:', error);
    return [];
  }
}

// 🎯 ESTADÍSTICAS UNIFICADAS
export async function getUnifiedReservationStats() {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data: stats, error } = await supabase
      .from('v_unified_reservations')  // 🎯 VISTA UNIFICADA
      .select(`
        reservation_id,
        status,
        payment_status,
        unified_total,
        reservation_type
      `);

    if (error) {
      console.error('[UNIFIED] Error obteniendo estadísticas:', error);
      return null;
    }

    // Calcular estadísticas sin confusión de IDs
    const totalReservations = stats?.length || 0;
    const modularReservations = stats?.filter(r => r.reservation_type === 'modular').length || 0;
    const simpleReservations = stats?.filter(r => r.reservation_type === 'simple').length || 0;
    const totalRevenue = stats?.reduce((sum, r) => sum + (r.unified_total || 0), 0) || 0;
    
    return {
      total: totalReservations,
      modular: modularReservations,
      simple: simpleReservations,
      revenue: totalRevenue,
      confirmed: stats?.filter(r => r.status === 'confirmed').length || 0,
      pending: stats?.filter(r => r.status === 'pending').length || 0,
      paid: stats?.filter(r => r.payment_status === 'paid').length || 0
    };
    
  } catch (error) {
    console.error('[UNIFIED] Error inesperado obteniendo estadísticas:', error);
    return null;
  }
} 