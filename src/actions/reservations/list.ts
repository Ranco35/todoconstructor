'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getReservationsWithClientInfo } from './get-with-client-info';

export interface ReservationListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  checkInFrom?: string;
  checkInTo?: string;
  clientId?: number;
}

export interface ReservationListItem {
  id: number;
  client_id: number;
  client_nombre: string;
  client_rut: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  status: string;
  total_amount: number;
  payment_status: string;
  room_name?: string;
  created_at: string;
  
  // Nuevos campos para identificar IDs múltiples
  id_reserva_modular?: number;
  estado_consistencia?: string;
}

// ✅ FUNCIÓN UNIFICADA - Usa la función base común
export async function getReservationsList(params: ReservationListParams = {}) {
  try {
    console.log('[DEBUG] getReservationsList - Starting with unified approach...');
    
    // ✅ USAR FUNCIÓN BASE COMÚN - Obtener todos los datos de forma consistente
    const allReservationsWithClientInfo = await getReservationsWithClientInfo();
    
    if (!allReservationsWithClientInfo || allReservationsWithClientInfo.length === 0) {
      console.log('[DEBUG] getReservationsList - No reservations found from unified function');
      return {
        success: true,
        data: {
          reservations: [],
          pagination: {
            page: params.page || 1,
            pageSize: params.pageSize || 20,
            total: 0,
            totalPages: 0
          }
        }
      };
    }

    console.log(`[DEBUG] getReservationsList - Got ${allReservationsWithClientInfo.length} reservations from unified function`);

    // 🔍 APLICAR FILTROS - Sobre los datos ya consistentes
    let filteredReservations = allReservationsWithClientInfo;

    const {
      page = 1,
      pageSize = 20,
      search = '',
      status = '',
      checkInFrom = '',
      checkInTo = '',
      clientId
    } = params;

    // Filtro por búsqueda
    if (search) {
      const searchLower = search.toLowerCase();
      filteredReservations = filteredReservations.filter(r => 
        r.client_full_name?.toLowerCase().includes(searchLower) ||
        r.room_code?.toLowerCase().includes(searchLower) ||
        r.package_name?.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por estado
    if (status) {
      filteredReservations = filteredReservations.filter(r => r.status === status);
    }

    // Filtro por fecha check-in desde
    if (checkInFrom) {
      filteredReservations = filteredReservations.filter(r => r.check_in >= checkInFrom);
    }

    // Filtro por fecha check-in hasta
    if (checkInTo) {
      filteredReservations = filteredReservations.filter(r => r.check_in <= checkInTo);
    }

    // Filtro por cliente
    if (clientId) {
      filteredReservations = filteredReservations.filter(r => r.client_id === clientId);
    }

    // 📊 PAGINACIÓN
    const total = filteredReservations.length;
    const totalPages = Math.ceil(total / pageSize);
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    const paginatedReservations = filteredReservations.slice(from, to);

    // 🗂️ MAPEAR A FORMATO DE LISTA - Mantener compatibilidad con interfaz existente
    const mappedReservations: ReservationListItem[] = paginatedReservations.map(r => {
      // 🔍 OBTENER RUT DEL CLIENTE (necesario buscar en BD)
      // Por ahora usar valor por defecto, se puede mejorar con consulta adicional
      
      console.log(`[DEBUG] getReservationsList - Mapping reservation ${r.compositeId}: total_amount=${r.total_amount}`);

      return {
        // ✅ USAR DATOS CONSISTENTES de la función base común
        id: r.id, // ID principal (reservation_id)
        client_id: r.client_id,
        client_nombre: r.client_full_name,
        client_rut: 'Sin RUT', // Se puede mejorar con consulta adicional
        guest_name: r.client_full_name,
        check_in: r.check_in,
        check_out: r.check_out,
        status: r.status,
        total_amount: r.total_amount, // ✅ USAR TOTAL CALCULADO DE FORMA CONSISTENTE
        payment_status: r.payment_status,
        room_name: r.room_code ? r.room_code.replace('habitacion_', 'Habitación ') : undefined,
        created_at: r.created_at,
        
        // Campos adicionales para debug
        id_reserva_modular: r.modularId,
        estado_consistencia: 'UNIFICADO' // Indicador de que usa función base común
      };
    });

    console.log(`[DEBUG] getReservationsList - Returning ${mappedReservations.length} mapped reservations`);

    return {
      success: true,
      data: {
        reservations: mappedReservations,
        pagination: {
          page,
          pageSize,
          total,
          totalPages
        }
      }
    };

  } catch (error) {
    console.error('Error in getReservationsList:', error);
    return {
      success: false,
      error: 'Error interno del servidor',
      data: {
        reservations: [],
        pagination: {
          page: params.page || 1,
          pageSize: params.pageSize || 20,
          total: 0,
          totalPages: 0
        }
      }
    };
  }
} 