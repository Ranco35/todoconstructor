'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getCurrentUser } from '@/actions/configuration/auth-actions';

export interface AuditLogEntry {
  id: number;
  reservation_id: number;
  action_type: 'CREATE' | 'UPDATE' | 'DELETE';
  user_id: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  change_reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  // Información del usuario que hizo el cambio
  user_name: string | null;
  user_email: string | null;
}

export interface ReservationAuditInfo {
  reservation_id: number;
  guest_name: string;
  guest_email: string;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  // Información de usuarios
  creator_name: string | null;
  creator_email: string | null;
  updater_name: string | null;
  updater_email: string | null;
  // Historial de cambios
  audit_log: AuditLogEntry[];
}

/**
 * Obtiene el historial completo de auditoría de una reserva
 * @param reservationId ID de la reserva
 * @returns Información completa de auditoría
 */
export async function getReservationAuditHistory(reservationId: number): Promise<ReservationAuditInfo | null> {
  try {
    // Verificar que el usuario esté autenticado
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    const supabase = await getSupabaseServerClient();

    // Obtener información básica de la reserva
    const { data: reservation, error: reservationError } = await supabase
      .from('reservations')
      .select(`
        id,
        guest_name,
        guest_email,
        created_by,
        updated_by,
        created_at,
        updated_at
      `)
      .eq('id', reservationId)
      .single();

    if (reservationError || !reservation) {
      throw new Error('Reserva no encontrada');
    }

    // Obtener información de los usuarios (creador y último editor)
    const userIds = [reservation.created_by, reservation.updated_by].filter(Boolean);
    const { data: users, error: usersError } = await supabase
      .from('User')
      .select('id, name, email')
      .in('id', userIds);

    if (usersError) {
      console.error('Error obteniendo usuarios:', usersError);
    }

    // Crear mapeo de usuarios
    const userMap = new Map();
    users?.forEach(user => {
      userMap.set(user.id, { name: user.name, email: user.email });
    });

    // Obtener historial de cambios
    const { data: auditLog, error: auditError } = await supabase
      .from('reservation_audit_log')
      .select(`
        id,
        reservation_id,
        action_type,
        user_id,
        field_name,
        old_value,
        new_value,
        change_reason,
        ip_address,
        user_agent,
        created_at
      `)
      .eq('reservation_id', reservationId)
      .order('created_at', { ascending: false });

    if (auditError) {
      console.error('Error obteniendo historial de auditoría:', auditError);
    }

    // Obtener información de todos los usuarios que aparecen en el historial
    const auditUserIds = auditLog?.map(entry => entry.user_id).filter(Boolean) || [];
    const allUserIds = [...new Set([...userIds, ...auditUserIds])];

    const { data: allUsers, error: allUsersError } = await supabase
      .from('User')
      .select('id, name, email')
      .in('id', allUserIds);

    if (allUsersError) {
      console.error('Error obteniendo todos los usuarios:', allUsersError);
    }

    // Actualizar mapeo de usuarios
    allUsers?.forEach(user => {
      userMap.set(user.id, { name: user.name, email: user.email });
    });

    // Enriquecer historial con información de usuarios
    const enrichedAuditLog: AuditLogEntry[] = auditLog?.map(entry => ({
      ...entry,
      user_name: userMap.get(entry.user_id)?.name || null,
      user_email: userMap.get(entry.user_id)?.email || null,
    })) || [];

    // Construir respuesta
    const auditInfo: ReservationAuditInfo = {
      reservation_id: reservation.id,
      guest_name: reservation.guest_name,
      guest_email: reservation.guest_email,
      created_by: reservation.created_by,
      updated_by: reservation.updated_by,
      created_at: reservation.created_at,
      updated_at: reservation.updated_at,
      creator_name: userMap.get(reservation.created_by)?.name || null,
      creator_email: userMap.get(reservation.created_by)?.email || null,
      updater_name: userMap.get(reservation.updated_by)?.name || null,
      updater_email: userMap.get(reservation.updated_by)?.email || null,
      audit_log: enrichedAuditLog,
    };

    return auditInfo;

  } catch (error) {
    console.error('Error obteniendo historial de auditoría:', error);
    return null;
  }
}

/**
 * Obtiene estadísticas de auditoría para el dashboard
 * @returns Estadísticas de auditoría
 */
export async function getAuditStatistics() {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('Usuario no autenticado');
    }

    const supabase = await getSupabaseServerClient();

    // Obtener estadísticas generales
    const { data: stats, error: statsError } = await supabase
      .from('reservation_audit_log')
      .select('action_type, created_at', { count: 'exact' });

    if (statsError) {
      console.error('Error obteniendo estadísticas:', statsError);
      return null;
    }

    // Procesar estadísticas
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalChanges = stats?.length || 0;
    const changesThisWeek = stats?.filter(entry => 
      new Date(entry.created_at) >= thisWeek
    ).length || 0;
    const changesThisMonth = stats?.filter(entry => 
      new Date(entry.created_at) >= thisMonth
    ).length || 0;

    const actionCounts = stats?.reduce((acc, entry) => {
      acc[entry.action_type] = (acc[entry.action_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return {
      totalChanges,
      changesThisWeek,
      changesThisMonth,
      actionCounts,
    };

  } catch (error) {
    console.error('Error obteniendo estadísticas de auditoría:', error);
    return null;
  }
} 