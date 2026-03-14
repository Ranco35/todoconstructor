'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import { 
  CRMLead, 
  CreateLeadInput, 
  UpdateLeadInput, 
  LeadFilters,
  ConvertBudgetToLeadInput 
} from '@/types/crm';
import { createLeadAuditEntry, getObjectChanges } from './audit';

/**
 * Obtiene todos los leads con filtros opcionales
 */
export async function getCRMLeads(filters?: LeadFilters): Promise<{ success: boolean; data?: CRMLead[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Primero obtener los leads
    const { data: leads, error: leadsError } = await supabase
      .from('crm_leads')
      .select(`
        *,
        stage:crm_stages(*)
      `)
      .order('created_at', { ascending: false });

    if (leadsError) {
      console.error('Error fetching CRM leads:', leadsError);
      return { success: true, data: [] };
    }

    if (!leads || leads.length === 0) {
      return { success: true, data: [] };
    }

    // Obtener información de clientes para los leads que tienen client_id
    const clientIds = leads
      .filter(lead => lead.client_id)
      .map(lead => lead.client_id);

    let clientsData: any[] = [];
    if (clientIds.length > 0) {
      const { data: clients, error: clientsError } = await supabase
        .from('Client')
        .select('id, "nombrePrincipal", apellido, email, rut, telefono, "telefonoMovil"')
        .in('id', clientIds);

      if (!clientsError && clients) {
        clientsData = clients;
      }
    }

    // Combinar leads con información de clientes
    const leadsWithClients = leads.map(lead => ({
      ...lead,
      client: lead.client_id ? clientsData.find(client => client.id === lead.client_id) : null
    }));

    return { success: true, data: leadsWithClients };
  } catch (error) {
    console.error('Error in getCRMLeads:', error);
    return { success: true, data: [] };
  }
}

/**
 * Obtiene un lead específico por ID
 */
export async function getCRMLeadById(id: number): Promise<{ success: boolean; data?: CRMLead; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Primero obtener el lead
    const { data: lead, error: leadError } = await supabase
      .from('crm_leads')
      .select(`
        *,
        stage:crm_stages(*),
        assigned_user:"User"!assigned_to(id, name, email),
        created_user:"User"!created_by(id, name, email)
      `)
      .eq('id', id)
      .single();

    if (leadError) {
      console.error('Error fetching CRM lead:', leadError);
      return { success: false, error: leadError.message };
    }

    if (!lead) {
      return { success: false, error: 'Lead no encontrado' };
    }

    // Si el lead tiene client_id, obtener información del cliente
    let clientData = null;
    if (lead.client_id) {
      console.log('🔍 getCRMLeadById - Buscando cliente ID:', lead.client_id);
      const { data: client, error: clientError } = await supabase
        .from('Client')
        .select('id, "nombrePrincipal", apellido, email, rut, telefono, "telefonoMovil", calle, ciudad, region')
        .eq('id', lead.client_id)
        .single();

      if (clientError) {
        console.error('❌ Error buscando cliente:', clientError);
      } else if (client) {
        console.log('✅ Cliente encontrado:', client);
        clientData = client;
      } else {
        console.log('⚠️ Cliente no encontrado para ID:', lead.client_id);
      }
    } else {
      console.log('ℹ️ Lead no tiene client_id');
    }

    // Combinar lead con información del cliente
    const leadWithClient = {
      ...lead,
      client: clientData
    };

    console.log('🔍 getCRMLeadById - Lead final:', {
      id: leadWithClient.id,
      title: leadWithClient.title,
      client_id: leadWithClient.client_id,
      has_client: !!leadWithClient.client,
      client_data: leadWithClient.client
    });

    return { success: true, data: leadWithClient };
  } catch (error) {
    console.error('Error in getCRMLeadById:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Crea un nuevo lead
 */
export async function createCRMLead(input: CreateLeadInput): Promise<{ success: boolean; data?: CRMLead; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();

    // Auto-setear created_by con el usuario actual si no viene
    let createdBy = input.created_by;
    if (!createdBy) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) createdBy = user.id;
    }

    // Auto-setear assigned_to con el usuario actual si no viene
    let assignedTo = input.assigned_to;
    if (!assignedTo && createdBy) {
      assignedTo = createdBy;
    }

    const { data, error } = await supabase
      .from('crm_leads')
      .insert([{
        ...input,
        created_by: createdBy,
        assigned_to: assignedTo,
        tags: input.tags || [],
        probability: input.probability || 50,
        estimated_value: input.estimated_value || 0
      }])
      .select(`
        *,
        stage:crm_stages(*),
        assigned_user:"User"!assigned_to(id, name, email),
        created_user:"User"!created_by(id, name, email)
      `)
      .single();

    if (error) {
      console.error('Error creating CRM lead:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in createCRMLead:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Actualiza un lead existente
 */
export async function updateCRMLead(input: UpdateLeadInput, userId?: string, userName?: string, userEmail?: string): Promise<{ success: boolean; data?: CRMLead; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { id, ...updates } = input;
    console.log('🔍 updateCRMLead - ID:', id, 'Updates:', updates, 'UserId:', userId);

    // Obtener el lead actual para comparar cambios
    const { data: currentLead, error: currentError } = await supabase
      .from('crm_leads')
      .select('*')
      .eq('id', id)
      .single();

    if (currentError) {
      console.error('❌ Error fetching current lead:', currentError);
      return { success: false, error: 'Error al obtener el lead actual' };
    }
    console.log('✅ Current lead fetched:', currentLead);

    // Auto-set actual_close_date when moving to final stages (Ganado=7, Perdido=8)
    if (updates.stage_id && (updates.stage_id === 7 || updates.stage_id === 8) && currentLead.stage_id !== updates.stage_id) {
      if (!updates.actual_close_date) {
        updates.actual_close_date = new Date().toISOString().split('T')[0];
      }
    }

    // Actualizar el lead
    const { data, error } = await supabase
      .from('crm_leads')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        stage:crm_stages(*),
        assigned_user:"User"!assigned_to(id, name, email)
      `)
      .single();

    if (error) {
      console.error('❌ Error updating CRM lead:', error);
      return { success: false, error: error.message };
    }
    console.log('✅ Lead updated successfully:', data);

    // Registrar cambios en auditoría si hay usuario
    if (userId && data) {
      try {
        const changes = await getObjectChanges(currentLead, data);
        
        // Solo registrar si hay cambios
        if (Object.keys(changes).length > 0) {
          const auditResult = await createLeadAuditEntry({
            lead_id: id,
            user_id: userId,
            user_name: userName,
            user_email: userEmail,
            action: 'updated',
            changes: changes
          });
          
          // Si hay error en auditoría, solo loguearlo pero no fallar la actualización
          if (!auditResult.success) {
            console.warn('Error en auditoría de lead (no crítico):', auditResult.error);
          }
        }
      } catch (auditError) {
        // Si hay error en auditoría, solo loguearlo pero no fallar la actualización
        console.warn('Error en auditoría de lead (no crítico):', auditError);
      }
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in updateCRMLead:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Elimina un lead
 */
export async function deleteCRMLead(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { error } = await supabase
      .from('crm_leads')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting CRM lead:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteCRMLead:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Convierte un presupuesto a lead
 */
export async function convertBudgetToLead(input: ConvertBudgetToLeadInput): Promise<{ success: boolean; data?: CRMLead; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Validar que el presupuesto existe y obtener client_id
    const { data: budget, error: budgetError } = await supabase
      .from('sales_quotes')
      .select('id, client_id, total, number')
      .eq('id', input.budget_id)
      .single();

    if (budgetError || !budget) {
      console.error('Error fetching budget:', budgetError);
      return { success: false, error: 'Presupuesto no encontrado' };
    }

    // Validar que el cliente existe
    if (!budget.client_id) {
      return { success: false, error: 'El presupuesto no tiene un cliente asociado' };
    }

    const { data: client, error: clientError } = await supabase
      .from('Client')
      .select('id, nombrePrincipal, apellido')
      .eq('id', budget.client_id)
      .single();

    if (clientError || !client) {
      console.error('Error fetching client:', clientError);
      return { success: false, error: 'Cliente asociado al presupuesto no encontrado' };
    }

    // Verificar si ya existe un lead para este presupuesto
    const { data: existingLead, error: existingError } = await supabase
      .from('crm_leads')
      .select('id')
      .eq('budget_id', input.budget_id)
      .single();

    if (existingLead) {
      return { success: false, error: 'Ya existe un lead asociado a este presupuesto' };
    }

    // Crear el lead con validaciones completas
    const leadData: CreateLeadInput = {
      title: input.title || `Lead desde Presupuesto ${budget.number}`,
      description: input.description || `Lead creado automáticamente desde presupuesto ${budget.number} para ${client.nombrePrincipal} ${client.apellido}`,
      source: input.source || 'manual',
      client_id: budget.client_id,
      budget_id: input.budget_id,
      stage_id: 1, // Nuevo Contacto por defecto
      priority: input.priority || 'medium',
      estimated_value: input.estimated_value || budget.total || 0,
      probability: 75, // Alta probabilidad ya que hay presupuesto
      assigned_to: input.assigned_to,
      notes: input.notes || `Presupuesto ${budget.number} por $${(budget.total || 0).toLocaleString()}`,
      tags: ['presupuesto']
    };

    return await createCRMLead(leadData);
  } catch (error) {
    console.error('Error in convertBudgetToLead:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Obtiene leads activos (no finales) de un cliente específico
 */
export async function getActiveLeadsByClientId(clientId: number): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();

    const { data: leads, error } = await supabase
      .from('crm_leads')
      .select(`
        id, title, stage_id, priority, created_at,
        crm_stages!inner(id, name, description, color, is_final)
      `)
      .eq('client_id', clientId)
      .eq('crm_stages.is_final', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching active leads for client:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: leads || [] };
  } catch (error) {
    console.error('Error in getActiveLeadsByClientId:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Obtiene estadísticas del CRM
 */
export async function getCRMStats(): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Obtener todos los leads
    const { data: allLeads, error: leadsError } = await supabase
      .from('crm_leads')
      .select('stage_id, estimated_value, source');

    if (leadsError) {
      console.error('Error fetching leads for stats:', leadsError);
      return { success: false, error: leadsError.message };
    }

    // Calcular estadísticas básicas
    const totalLeads = allLeads?.length || 0;
    const pipelineValue = allLeads?.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0) || 0;
    const wonLeads = allLeads?.filter(lead => lead.stage_id === 7).length || 0; // stage_id 7 = ganado
    const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;
    
    const stats = {
      total_leads: totalLeads,
      pipeline_value: pipelineValue,
      conversion_rate: Math.round(conversionRate),
      average_deal_size: totalLeads > 0 ? Math.round(pipelineValue / totalLeads) : 0,
      won_leads: wonLeads,
      lost_leads: allLeads?.filter(lead => lead.stage_id === 8).length || 0 // stage_id 8 = perdido
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error('Error in getCRMStats:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Obtiene usuarios activos para selector de asignación
 */
export async function getCRMUsers(): Promise<{ success: boolean; data?: { id: string; name: string; email: string }[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from('User')
      .select('id, name, email')
      .eq('isActive', true)
      .order('name');

    if (error) {
      console.error('Error fetching CRM users:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error in getCRMUsers:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Reasigna un lead a otro usuario
 */
export async function reassignLead(leadId: number, assignedTo: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase
      .from('crm_leads')
      .update({ assigned_to: assignedTo })
      .eq('id', leadId);

    if (error) {
      console.error('Error reassigning lead:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in reassignLead:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}
