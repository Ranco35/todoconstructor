'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';

export interface ReservationComment {
  id: number;
  reservation_id: number;
  text: string;
  author: string;
  created_at: string;
  updated_at?: string;
  updated_by?: string;
  is_edited?: boolean;
  original_text?: string;
}

export async function getReservationComments(reservationId: number): Promise<ReservationComment[]> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from('reservation_comments')
      .select('*')
      .eq('reservation_id', reservationId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[ERROR] getReservationComments:', error);
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('[ERROR] getReservationComments failed:', error);
    return [];
  }
}

export async function addReservationComment(
  reservationId: number, 
  text: string, 
  author: string
): Promise<boolean> {
  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase
      .from('reservation_comments')
      .insert([{ 
        reservation_id: reservationId, 
        text: text.trim(), 
        author: author.trim(),
        is_edited: false
      }]);
    
    if (error) {
      console.error('[ERROR] addReservationComment:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('[ERROR] addReservationComment failed:', error);
    return false;
  }
}

export async function updateReservationComment(
  commentId: number,
  newText: string,
  updatedBy: string
): Promise<boolean> {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Primero obtener el comentario actual para guardar el texto original
    const { data: currentComment, error: fetchError } = await supabase
      .from('reservation_comments')
      .select('text, original_text, is_edited')
      .eq('id', commentId)
      .single();
    
    if (fetchError) {
      console.error('[ERROR] updateReservationComment - fetch:', fetchError);
      throw fetchError;
    }
    
    // Preparar datos de actualización
    const updateData: any = {
      text: newText.trim(),
      updated_by: updatedBy.trim(),
      is_edited: true
    };
    
    // Solo guardar original_text si es la primera edición
    if (!currentComment.is_edited) {
      updateData.original_text = currentComment.text;
    }
    
    const { error } = await supabase
      .from('reservation_comments')
      .update(updateData)
      .eq('id', commentId);
    
    if (error) {
      console.error('[ERROR] updateReservationComment:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('[ERROR] updateReservationComment failed:', error);
    return false;
  }
}

export async function getReservationMainComment(reservationId: number): Promise<string> {
  try {
    const supabase = await getSupabaseServerClient();
    
    // 🔧 CORRECCIÓN: Buscar por reservation_id en lugar de id
    // Para múltiples habitaciones, obtener el comentario de la primera reserva modular
    const { data, error } = await supabase
      .from('modular_reservations')
      .select('comments')
      .eq('reservation_id', reservationId)  // ✅ Usar reservation_id correctamente
      .order('created_at', { ascending: true })  // Tomar la primera creada
      .limit(1)
      .single();
    
    if (error) {
      // Si no hay reservas modulares, devolver vacío (no es un error crítico)
      if (error.code === 'PGRST116') {
        return '';  // No hay comentarios, normal
      }
      console.error('[ERROR] getReservationMainComment:', error);
      return '';
    }
    
    return data?.comments || '';
  } catch (error) {
    console.error('[ERROR] getReservationMainComment failed:', error);
    return '';
  }
} 