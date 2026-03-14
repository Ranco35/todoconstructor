'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';

export interface LeadNote {
  id: number;
  lead_id: number;
  note_text: string;
  note_type: 'general' | 'call' | 'email' | 'meeting' | 'follow_up' | 'internal';
  is_private: boolean;
  created_by: string;
  created_by_name: string;
  created_by_email: string;
  created_at: string;
  updated_at: string;
}

export interface CreateNoteInput {
  lead_id: number;
  note_text: string;
  note_type?: 'general' | 'call' | 'email' | 'meeting' | 'follow_up' | 'internal';
  is_private?: boolean;
  created_by: string;
  created_by_name: string;
  created_by_email: string;
}

export interface UpdateNoteInput {
  id: number;
  note_text: string;
  note_type?: 'general' | 'call' | 'email' | 'meeting' | 'follow_up' | 'internal';
  is_private?: boolean;
}

/**
 * Obtiene todas las notas de un lead
 */
export async function getLeadNotes(leadId: number): Promise<{ success: boolean; data?: LeadNote[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('crm_lead_notes')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching lead notes:', error);
      return { success: false, error: 'Error al obtener notas del lead' };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error in getLeadNotes:', error);
    return { success: false, error: 'Error inesperado al obtener notas' };
  }
}

/**
 * Crea una nueva nota para un lead
 */
export async function createLeadNote(input: CreateNoteInput): Promise<{ success: boolean; data?: LeadNote; error?: string }> {
  try {
    console.log('🔍 createLeadNote - Input recibido:', input);
    const supabase = await getSupabaseServerClient();
    console.log('🔍 createLeadNote - Supabase client obtenido');
    
    const insertData = {
      lead_id: input.lead_id,
      note_text: input.note_text,
      note_type: input.note_type || 'general',
      is_private: input.is_private || false,
      created_by: input.created_by,
      created_by_name: input.created_by_name,
      created_by_email: input.created_by_email
    };
    
    console.log('🔍 createLeadNote - Datos a insertar:', insertData);
    
    const { data, error } = await supabase
      .from('crm_lead_notes')
      .insert([insertData])
      .select()
      .single();

    console.log('🔍 createLeadNote - Resultado insert:', { data, error });

    if (error) {
      console.error('❌ Error creating lead note:', error);
      return { success: false, error: `Error al crear la nota: ${error.message}` };
    }

    console.log('✅ Nota creada exitosamente:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Error in createLeadNote:', error);
    return { success: false, error: `Error inesperado al crear la nota: ${error}` };
  }
}

/**
 * Actualiza una nota existente
 */
export async function updateLeadNote(input: UpdateNoteInput): Promise<{ success: boolean; data?: LeadNote; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('crm_lead_notes')
      .update({
        note_text: input.note_text,
        note_type: input.note_type,
        is_private: input.is_private,
        updated_at: new Date().toISOString()
      })
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating lead note:', error);
      return { success: false, error: 'Error al actualizar la nota' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in updateLeadNote:', error);
    return { success: false, error: 'Error inesperado al actualizar la nota' };
  }
}

/**
 * Elimina una nota
 */
export async function deleteLeadNote(noteId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { error } = await supabase
      .from('crm_lead_notes')
      .delete()
      .eq('id', noteId);

    if (error) {
      console.error('Error deleting lead note:', error);
      return { success: false, error: 'Error al eliminar la nota' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteLeadNote:', error);
    return { success: false, error: 'Error inesperado al eliminar la nota' };
  }
}
