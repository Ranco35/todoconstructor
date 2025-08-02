'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getCurrentUser } from '@/actions/configuration/auth-actions';

export interface GarzonReservationSummary {
  id: number;
  clientName: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  status: string;
  type: 'arrival' | 'departure' | 'staying';
  total_amount?: number;
}

export interface GarzonDashboardData {
  arrivals: GarzonReservationSummary[];
  departures: GarzonReservationSummary[];
  currentGuests: GarzonReservationSummary[];
  totalGuests: number;
  occupiedRooms: number;
  totalRooms: number;
}

/**
 * Obtener todas las reservas relevantes para garzones en el día actual
 */
export async function getGarzonDashboardData(): Promise<{ success: boolean; data?: GarzonDashboardData; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    // Verificar permisos - solo garzones y roles superiores
    const allowedRoles = ['GARZONES', 'JEFE_SECCION', 'ADMINISTRADOR', 'SUPER_USER'];
    if (!allowedRoles.includes(currentUser.role)) {
      return { success: false, error: 'Permisos insuficientes' };
    }

    const supabase = await getSupabaseServerClient();
    const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD

    console.log(`[DEBUG] getGarzonDashboardData - Fetching data for date: ${today}`);

    // 1. Obtener reservas que llegan hoy (check-in)
    const { data: arrivalsData, error: arrivalsError } = await supabase
      .from('reservations')
      .select(`
        id,
        check_in,
        check_out,
        status,
        guests,
        total_amount,
        room_id,
        client_id,
        room:rooms(number),
        client:clients(firstName, lastName)
      `)
      .eq('check_in', today)
      .in('status', ['confirmed', 'pending']);

    if (arrivalsError) {
      console.error('Error fetching arrivals:', arrivalsError);
    }

    // 2. Obtener reservas que se van hoy (check-out)
    const { data: departuresData, error: departuresError } = await supabase
      .from('reservations')
      .select(`
        id,
        check_in,
        check_out,
        status,
        guests,
        total_amount,
        room_id,
        client_id,
        room:rooms(number),
        client:clients(firstName, lastName)
      `)
      .eq('check_out', today)
      .in('status', ['confirmed', 'pending']);

    if (departuresError) {
      console.error('Error fetching departures:', departuresError);
    }

    // 3. Obtener huéspedes que están hospedados actualmente (arrived but not yet departed)
    const { data: currentGuestsData, error: currentGuestsError } = await supabase
      .from('reservations')
      .select(`
        id,
        check_in,
        check_out,
        status,
        guests,
        total_amount,
        room_id,
        client_id,
        room:rooms(number),
        client:clients(firstName, lastName)
      `)
      .lte('check_in', today)
      .gte('check_out', today)
      .in('status', ['confirmed']);

    if (currentGuestsError) {
      console.error('Error fetching current guests:', currentGuestsError);
    }

    // 4. Obtener total de habitaciones para estadísticas
    const { data: roomsData, error: roomsError } = await supabase
      .from('rooms')
      .select('id, number')
      .eq('is_active', true);

    if (roomsError) {
      console.error('Error fetching rooms:', roomsError);
    }

    // Mapear datos de llegadas
    const arrivals: GarzonReservationSummary[] = (arrivalsData || []).map(reservation => ({
      id: reservation.id,
      clientName: `${reservation.client?.firstName || ''} ${reservation.client?.lastName || ''}`.trim() || 'Cliente sin nombre',
      roomNumber: reservation.room?.number || 'Sin asignar',
      checkIn: reservation.check_in,
      checkOut: reservation.check_out,
      guests: reservation.guests || 1,
      status: reservation.status,
      type: 'arrival' as const,
      total_amount: reservation.total_amount
    }));

    // Mapear datos de salidas
    const departures: GarzonReservationSummary[] = (departuresData || []).map(reservation => ({
      id: reservation.id,
      clientName: `${reservation.client?.firstName || ''} ${reservation.client?.lastName || ''}`.trim() || 'Cliente sin nombre',
      roomNumber: reservation.room?.number || 'Sin asignar',
      checkIn: reservation.check_in,
      checkOut: reservation.check_out,
      guests: reservation.guests || 1,
      status: reservation.status,
      type: 'departure' as const,
      total_amount: reservation.total_amount
    }));

    // Mapear huéspedes actuales
    const currentGuests: GarzonReservationSummary[] = (currentGuestsData || []).map(reservation => ({
      id: reservation.id,
      clientName: `${reservation.client?.firstName || ''} ${reservation.client?.lastName || ''}`.trim() || 'Cliente sin nombre',
      roomNumber: reservation.room?.number || 'Sin asignar',
      checkIn: reservation.check_in,
      checkOut: reservation.check_out,
      guests: reservation.guests || 1,
      status: reservation.status,
      type: 'staying' as const,
      total_amount: reservation.total_amount
    }));

    // Calcular estadísticas
    const totalGuests = currentGuests.reduce((sum, guest) => sum + guest.guests, 0);
    const occupiedRooms = currentGuests.length;
    const totalRooms = roomsData?.length || 0;

    const dashboardData: GarzonDashboardData = {
      arrivals,
      departures,
      currentGuests,
      totalGuests,
      occupiedRooms,
      totalRooms
    };

    console.log(`[DEBUG] getGarzonDashboardData - Success: ${arrivals.length} arrivals, ${departures.length} departures, ${currentGuests.length} current guests`);

    return {
      success: true,
      data: dashboardData
    };

  } catch (error) {
    console.error('Error in getGarzonDashboardData:', error);
    return {
      success: false,
      error: 'Error interno del servidor'
    };
  }
}

/**
 * Obtener solo los huéspedes actuales (más ligero para actualizaciones frecuentes)
 */
export async function getCurrentGuests(): Promise<{ success: boolean; data?: GarzonReservationSummary[]; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    const supabase = await getSupabaseServerClient();
    const today = new Date().toISOString().split('T')[0];

    const { data: currentGuestsData, error } = await supabase
      .from('reservations')
      .select(`
        id,
        check_in,
        check_out,
        status,
        guests,
        room_id,
        client_id,
        room:rooms(number),
        client:clients(firstName, lastName)
      `)
      .lte('check_in', today)
      .gte('check_out', today)
      .in('status', ['confirmed']);

    if (error) {
      console.error('Error fetching current guests:', error);
      return { success: false, error: 'Error al obtener huéspedes actuales' };
    }

    const currentGuests: GarzonReservationSummary[] = (currentGuestsData || []).map(reservation => ({
      id: reservation.id,
      clientName: `${reservation.client?.firstName || ''} ${reservation.client?.lastName || ''}`.trim() || 'Cliente sin nombre',
      roomNumber: reservation.room?.number || 'Sin asignar',
      checkIn: reservation.check_in,
      checkOut: reservation.check_out,
      guests: reservation.guests || 1,
      status: reservation.status,
      type: 'staying' as const
    }));

    return {
      success: true,
      data: currentGuests
    };

  } catch (error) {
    console.error('Error in getCurrentGuests:', error);
    return {
      success: false,
      error: 'Error interno del servidor'
    };
  }
}