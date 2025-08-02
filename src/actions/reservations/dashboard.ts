'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getCurrentUser } from '@/actions/configuration/auth-actions';

export interface ReservationStats {
  total: number;
  pending: number;
  confirmed: number;
  cancelled: number;
  completed: number;
  revenue: number;
  occupancy: number;
  averageStay: number;
}

export interface RecentReservation {
  id: number;
  client_id?: number;
  client_nombre?: string;
  client_rut?: string;
  check_in: string;
  check_out: string;
  status: string;
  total_amount: number;
  room_name?: string;
  created_at: string;
}

export interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
}

export async function getReservationStats(filters?: DashboardFilters): Promise<{ success: boolean; data?: ReservationStats; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    const supabase = await getSupabaseServerClient();

    // Construir consulta con filtros
    let query = supabase
      .from('reservations')
      .select(`
        id,
        status,
        total_amount,
        paid_amount,
        check_in,
        check_out,
        guests,
        created_at
      `);

    // Aplicar filtros si existen
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data: reservations, error: reservationsError } = await query;

    if (reservationsError) {
      console.error('Error fetching reservations:', reservationsError);
      return { success: false, error: 'Error al obtener las reservas' };
    }

    // Calcular estadísticas
    const total = reservations?.length || 0;
    const pending = reservations?.filter(r => r.status === 'pending')?.length || 0;
    const confirmed = reservations?.filter(r => r.status === 'confirmed')?.length || 0;
    const cancelled = reservations?.filter(r => r.status === 'cancelled')?.length || 0;
    const completed = reservations?.filter(r => r.status === 'completed')?.length || 0;

    // Calcular ingresos totales
    const revenue = reservations?.reduce((sum, r) => sum + (r.paid_amount || 0), 0) || 0;

    // Calcular estancia promedio
    const validReservations = reservations?.filter(r => r.check_in && r.check_out) || [];
    const totalNights = validReservations.reduce((sum, r) => {
      const checkIn = new Date(r.check_in);
      const checkOut = new Date(r.check_out);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      return sum + nights;
    }, 0);
    const averageStay = validReservations.length > 0 ? totalNights / validReservations.length : 0;

    // Obtener total de habitaciones para calcular ocupación
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id');

    const totalRooms = rooms?.length || 1;
    
    // Calcular ocupación aproximada (reservas confirmadas / total habitaciones * 100)
    const occupancy = Math.round((confirmed / totalRooms) * 100);

    const stats: ReservationStats = {
      total,
      pending,
      confirmed,
      cancelled,
      completed,
      revenue,
      occupancy: Math.min(occupancy, 100), // Cap at 100%
      averageStay: Math.round(averageStay * 10) / 10 // Round to 1 decimal
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error('Error in getReservationStats:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

export async function getRecentReservations(limit: number = 5, filters?: DashboardFilters): Promise<{ success: boolean; data?: RecentReservation[]; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    const supabase = await getSupabaseServerClient();

    // Construir consulta con join a Client y modular_reservations
    let query = supabase
      .from('reservations')
      .select(`
        id,
        client_id,
        Client:Client(id, nombrePrincipal, rut),
        check_in,
        check_out,
        status,
        total_amount,
        created_at,
        room:rooms(number),
        modular_reservation:modular_reservations(final_price, grand_total)
      `);

    // Aplicar filtros si existen
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data: reservations, error } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent reservations:', error);
      return { success: false, error: 'Error al obtener las reservas recientes' };
    }

    const recentReservations: RecentReservation[] = (reservations || []).map(r => ({
      id: r.id,
      client_id: r.client_id,
      client_nombre: r.Client?.nombrePrincipal || '',
      client_rut: r.Client?.rut || '',
      check_in: r.check_in,
      check_out: r.check_out,
      status: r.status,
      total_amount: r.modular_reservation?.final_price ?? r.modular_reservation?.grand_total ?? r.total_amount,
      room_name: r.room?.number ? `Habitación ${r.room.number}` : undefined,
      created_at: r.created_at
    }));

    return { success: true, data: recentReservations };
  } catch (error) {
    console.error('Error in getRecentReservations:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

export async function getOccupancyByDate(startDate: string, endDate: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    const supabase = await getSupabaseServerClient();

    const { data: reservations, error } = await supabase
      .from('reservations')
      .select(`
        check_in,
        check_out,
        status,
        room_id
      `)
      .gte('check_in', startDate)
      .lte('check_out', endDate)
      .in('status', ['confirmed', 'pending']);

    if (error) {
      console.error('Error fetching occupancy data:', error);
      return { success: false, error: 'Error al obtener datos de ocupación' };
    }

    // TODO: Procesar datos de ocupación por fecha
    // Por ahora retornamos datos simulados
    const data = [];

    return { success: true, data };
  } catch (error) {
    console.error('Error in getOccupancyByDate:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

export async function getRevenueByPeriod(startDate: string, endDate: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    const supabase = await getSupabaseServerClient();

    const { data: reservations, error } = await supabase
      .from('reservations')
      .select(`
        total_amount,
        paid_amount,
        created_at,
        status
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (error) {
      console.error('Error fetching revenue data:', error);
      return { success: false, error: 'Error al obtener datos de ingresos' };
    }

    const totalRevenue = reservations?.reduce((sum, r) => sum + (r.paid_amount || 0), 0) || 0;
    const pendingRevenue = reservations?.reduce((sum, r) => {
      if (r.status === 'confirmed' || r.status === 'pending') {
        return sum + (r.total_amount - (r.paid_amount || 0));
      }
      return sum;
    }, 0) || 0;

    const data = {
      totalRevenue,
      pendingRevenue,
      reservationsCount: reservations?.length || 0
    };

    return { success: true, data };
  } catch (error) {
    console.error('Error in getRevenueByPeriod:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Obtener reservas que llegan hoy (check-in)
 */
export async function getTodayArrivals(): Promise<{ success: boolean; data?: RecentReservation[]; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    const supabase = await getSupabaseServerClient();
    const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD

    const { data: reservations, error } = await supabase
      .from('reservations')
      .select(`
        id,
        client_id,
        Client:Client(id, nombrePrincipal, rut),
        check_in,
        check_out,
        status,
        total_amount,
        created_at,
        guest_name,
        room:rooms(number),
        modular_reservation:modular_reservations(final_price, grand_total)
      `)
      .eq('check_in', today)
      .in('status', ['prereserva', 'confirmada', 'en_curso'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching today arrivals:', error);
      return { success: false, error: 'Error al obtener las llegadas de hoy' };
    }

    const arrivals: RecentReservation[] = (reservations || []).map(r => ({
      id: r.id,
      client_id: r.client_id,
      client_nombre: r.Client?.nombrePrincipal || r.guest_name || 'Sin nombre',
      client_rut: r.Client?.rut || '',
      check_in: r.check_in,
      check_out: r.check_out,
      status: r.status,
      total_amount: r.modular_reservation?.final_price ?? r.modular_reservation?.grand_total ?? r.total_amount,
      room_name: r.room?.number ? `Habitación ${r.room.number}` : undefined,
      created_at: r.created_at
    }));

    return { success: true, data: arrivals };
  } catch (error) {
    console.error('Error in getTodayArrivals:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Obtener reservas que se retiran hoy (check-out)
 */
export async function getTodayDepartures(): Promise<{ success: boolean; data?: RecentReservation[]; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    const supabase = await getSupabaseServerClient();
    const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD

    const { data: reservations, error } = await supabase
      .from('reservations')
      .select(`
        id,
        client_id,
        Client:Client(id, nombrePrincipal, rut),
        check_in,
        check_out,
        status,
        total_amount,
        created_at,
        guest_name,
        room:rooms(number),
        modular_reservation:modular_reservations(final_price, grand_total)
      `)
      .eq('check_out', today)
      .in('status', ['confirmada', 'en_curso'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching today departures:', error);
      return { success: false, error: 'Error al obtener las salidas de hoy' };
    }

    const departures: RecentReservation[] = (reservations || []).map(r => ({
      id: r.id,
      client_id: r.client_id,
      client_nombre: r.Client?.nombrePrincipal || r.guest_name || 'Sin nombre',
      client_rut: r.Client?.rut || '',
      check_in: r.check_in,
      check_out: r.check_out,
      status: r.status,
      total_amount: r.modular_reservation?.final_price ?? r.modular_reservation?.grand_total ?? r.total_amount,
      room_name: r.room?.number ? `Habitación ${r.room.number}` : undefined,
      created_at: r.created_at
    }));

    return { success: true, data: departures };
  } catch (error) {
    console.error('Error in getTodayDepartures:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
} 