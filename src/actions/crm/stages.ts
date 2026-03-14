'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import { CRMStage } from '@/types/crm';

/**
 * Obtiene todas las etapas del pipeline CRM
 */
export async function getCRMStages(): Promise<{ success: boolean; data?: CRMStage[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('crm_stages')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching CRM stages:', error);
      // Para cualquier error, devolver etapas por defecto para que la UI funcione
      const defaultStages: CRMStage[] = [
        { id: 1, name: 'nuevo_contacto', description: 'Nuevo Contacto', color: '#EF4444', order_index: 1, is_active: true, is_final: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 2, name: 'cliente_interesado', description: 'Cliente Interesado', color: '#F97316', order_index: 2, is_active: true, is_final: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 3, name: 'contacto_calificado', description: 'Contacto Calificado', color: '#EAB308', order_index: 3, is_active: true, is_final: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 4, name: 'cotizacion_enviada', description: 'Cotización Enviada', color: '#22C55E', order_index: 4, is_active: true, is_final: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 5, name: 'negociacion', description: 'Negociación', color: '#3B82F6', order_index: 5, is_active: true, is_final: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 6, name: 'confirmado', description: 'Confirmado / Reserva', color: '#8B5CF6', order_index: 6, is_active: true, is_final: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 7, name: 'ganado', description: 'Ganado', color: '#10B981', order_index: 7, is_active: true, is_final: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 8, name: 'perdido', description: 'Perdido', color: '#6B7280', order_index: 8, is_active: true, is_final: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      ];
      return { success: true, data: defaultStages };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error in getCRMStages:', error);
    // Para cualquier error, devolver etapas por defecto para que la UI funcione
    const defaultStages: CRMStage[] = [
      { id: 1, name: 'nuevo_contacto', description: 'Nuevo Contacto', color: '#EF4444', order_index: 1, is_active: true, is_final: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 2, name: 'cliente_interesado', description: 'Cliente Interesado', color: '#F97316', order_index: 2, is_active: true, is_final: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 3, name: 'contacto_calificado', description: 'Contacto Calificado', color: '#EAB308', order_index: 3, is_active: true, is_final: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 4, name: 'cotizacion_enviada', description: 'Cotización Enviada', color: '#22C55E', order_index: 4, is_active: true, is_final: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 5, name: 'negociacion', description: 'Negociación', color: '#3B82F6', order_index: 5, is_active: true, is_final: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 6, name: 'confirmado', description: 'Confirmado / Reserva', color: '#8B5CF6', order_index: 6, is_active: true, is_final: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 7, name: 'ganado', description: 'Ganado', color: '#10B981', order_index: 7, is_active: true, is_final: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 8, name: 'perdido', description: 'Perdido', color: '#6B7280', order_index: 8, is_active: true, is_final: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    ];
    return { success: true, data: defaultStages };
  }
}

/**
 * Obtiene una etapa específica por ID
 */
export async function getCRMStageById(id: number): Promise<{ success: boolean; data?: CRMStage; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('crm_stages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching CRM stage:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in getCRMStageById:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Crea una nueva etapa del pipeline
 */
export async function createCRMStage(stage: Omit<CRMStage, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: CRMStage; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('crm_stages')
      .insert([stage])
      .select()
      .single();

    if (error) {
      console.error('Error creating CRM stage:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in createCRMStage:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Actualiza una etapa existente
 */
export async function updateCRMStage(id: number, updates: Partial<CRMStage>): Promise<{ success: boolean; data?: CRMStage; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('crm_stages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating CRM stage:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in updateCRMStage:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Elimina una etapa (soft delete)
 */
export async function deleteCRMStage(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { error } = await supabase
      .from('crm_stages')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting CRM stage:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteCRMStage:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}
