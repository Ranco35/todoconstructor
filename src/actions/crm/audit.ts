'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';

export interface LeadAuditEntry {
  id: number;
  lead_id: number;
  user_id: string;
  user_name?: string;
  user_email?: string;
  action: 'created' | 'updated' | 'deleted' | 'status_changed';
  field_name?: string;
  old_value?: string;
  new_value?: string;
  changes?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface CreateAuditEntryInput {
  lead_id: number;
  user_id: string;
  user_name?: string;
  user_email?: string;
  action: 'created' | 'updated' | 'deleted' | 'status_changed';
  field_name?: string;
  old_value?: string;
  new_value?: string;
  changes?: any;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Crea una entrada de auditoría para un lead
 */
export async function createLeadAuditEntry(input: CreateAuditEntryInput): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { error } = await supabase
      .from('crm_lead_audit')
      .insert([{
        lead_id: input.lead_id,
        user_id: input.user_id,
        user_name: input.user_name,
        user_email: input.user_email,
        action: input.action,
        field_name: input.field_name,
        old_value: input.old_value,
        new_value: input.new_value,
        changes: input.changes,
        ip_address: input.ip_address,
        user_agent: input.user_agent
      }]);

    if (error) {
      console.error('Error creating lead audit entry:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in createLeadAuditEntry:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Obtiene el historial de auditoría de un lead
 */
export async function getLeadAuditHistory(leadId: number): Promise<{ success: boolean; data?: LeadAuditEntry[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('crm_lead_audit')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching lead audit history:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error in getLeadAuditHistory:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Compara dos objetos y devuelve los cambios
 */
export async function getObjectChanges(oldObj: any, newObj: any): Promise<{ [key: string]: { old: any; new: any } }> {
  const changes: { [key: string]: { old: any; new: any } } = {};
  
  // Campos a comparar
  const fieldsToCompare = [
    'title', 'description', 'source', 'priority', 'estimated_value', 
    'probability', 'stage_id', 'assigned_to', 'notes', 'tags'
  ];
  
  for (const field of fieldsToCompare) {
    if (oldObj[field] !== newObj[field]) {
      changes[field] = {
        old: oldObj[field],
        new: newObj[field]
      };
    }
  }
  
  return changes;
}

/**
 * Formatea los cambios para mostrar en la auditoría
 */
export async function formatChangesForDisplay(changes: { [key: string]: { old: any; new: any } }): Promise<string[]> {
  const formattedChanges: string[] = [];
  
  const fieldLabels: { [key: string]: string } = {
    title: 'Título',
    description: 'Descripción',
    source: 'Fuente',
    priority: 'Prioridad',
    estimated_value: 'Valor Estimado',
    probability: 'Probabilidad',
    stage_id: 'Etapa',
    assigned_to: 'Asignado a',
    notes: 'Notas',
    tags: 'Etiquetas'
  };
  
  for (const [field, change] of Object.entries(changes)) {
    const label = fieldLabels[field] || field;
    const oldValue = change.old === null || change.old === undefined ? 'Sin valor' : String(change.old);
    const newValue = change.new === null || change.new === undefined ? 'Sin valor' : String(change.new);
    
    formattedChanges.push(`${label}: "${oldValue}" → "${newValue}"`);
  }
  
  return formattedChanges;
}
