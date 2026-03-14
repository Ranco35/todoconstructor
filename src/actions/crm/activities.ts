'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';

export interface CRMActivityRow {
  id: number;
  lead_id: number;
  type: string;
  subject: string;
  description?: string;
  scheduled_at?: string;
  completed_at?: string;
  due_date?: string;
  status: string;
  outcome?: string;
  next_action?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Obtiene actividades de un lead
 */
export async function getLeadActivities(leadId: number): Promise<{ success: boolean; data?: CRMActivityRow[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from('crm_activities')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching lead activities:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error in getLeadActivities:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Marca una actividad como completada
 */
export async function completeActivity(
  activityId: number,
  outcome?: string,
  nextAction?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();

    const { error } = await supabase
      .from('crm_activities')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        outcome: outcome || 'positive',
        next_action: nextAction || null,
      })
      .eq('id', activityId);

    if (error) {
      console.error('Error completing activity:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in completeActivity:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Crea una nueva actividad para un lead
 */
export async function createActivity(input: {
  lead_id: number;
  type: string;
  subject: string;
  description?: string;
  due_date?: string;
}): Promise<{ success: boolean; data?: CRMActivityRow; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from('crm_activities')
      .insert({
        lead_id: input.lead_id,
        type: input.type,
        subject: input.subject,
        description: input.description || null,
        status: 'pending',
        due_date: input.due_date || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating activity:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in createActivity:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}
