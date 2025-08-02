'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getCurrentUser } from '@/actions/configuration/auth-actions';
import { revalidatePath } from 'next/cache';

export async function deleteReservation(reservationId: number): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar autenticación
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    const supabase = await getSupabaseServerClient();

    // Verificar que la reserva existe
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('id, status, guest_name')
      .eq('id', reservationId)
      .single();

    if (fetchError) {
      console.error('Error fetching reservation:', fetchError);
      return { success: false, error: 'Reserva no encontrada' };
    }

    if (!reservation) {
      return { success: false, error: 'Reserva no encontrada' };
    }

    // Eliminar registros relacionados primero (para evitar errores de foreign key)
    
    // 1. Eliminar reservas modulares relacionadas
    const { error: modularError } = await supabase
      .from('modular_reservations')
      .delete()
      .eq('reservation_id', reservationId);

    if (modularError) {
      console.error('Error deleting modular reservations:', modularError);
      // Continuar con la eliminación principal incluso si falla esto
    }

    // 2. Eliminar la reserva principal
    const { error: deleteError } = await supabase
      .from('reservations')
      .delete()
      .eq('id', reservationId);

    if (deleteError) {
      console.error('Error deleting reservation:', deleteError);
      return { success: false, error: 'Error al eliminar la reserva' };
    }

    // Revalidar las páginas relacionadas
    revalidatePath('/dashboard/reservations');
    revalidatePath('/dashboard/reservations/list');
    revalidatePath('/dashboard/reservations/calendar');

    return { success: true };
  } catch (error) {
    console.error('Error in deleteReservation:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

export async function deleteMultipleReservations(reservationIds: number[]): Promise<{ success: boolean; error?: string; deletedCount?: number }> {
  try {
    // Verificar autenticación
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    const supabase = await getSupabaseServerClient();

    // Eliminar reservas modulares relacionadas
    const { error: modularError } = await supabase
      .from('modular_reservations')
      .delete()
      .in('reservation_id', reservationIds);

    if (modularError) {
      console.error('Error deleting modular reservations:', modularError);
      // Continuar con la eliminación principal
    }

    // Eliminar las reservas principales
    const { error: deleteError, count } = await supabase
      .from('reservations')
      .delete()
      .in('id', reservationIds);

    if (deleteError) {
      console.error('Error deleting reservations:', deleteError);
      return { success: false, error: 'Error al eliminar las reservas' };
    }

    // Revalidar las páginas relacionadas
    revalidatePath('/dashboard/reservations');
    revalidatePath('/dashboard/reservations/list');
    revalidatePath('/dashboard/reservations/calendar');

    return { success: true, deletedCount: count || 0 };
  } catch (error) {
    console.error('Error in deleteMultipleReservations:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
} 