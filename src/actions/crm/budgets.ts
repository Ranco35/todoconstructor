'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import type { Budget } from '@/types/ventas/budget';

interface BudgetWithAssociation extends Budget {
  is_primary?: boolean;
  associated_at?: string;
  associated_by?: string;
  association_notes?: string;
}

// ==================== FUNCIONES DE CONSULTA ====================

// Obtener presupuestos asociados a un lead
export async function getBudgetsByLeadId(leadId: number): Promise<{ 
  success: boolean; 
  data?: BudgetWithAssociation[]; 
  error?: string 
}> {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Obtener asociaciones
    const { data: associations, error: associationsError } = await supabase
      .from('crm_lead_budgets')
      .select(`
        is_primary,
        associated_at,
        associated_by,
        notes,
        budget_id
      `)
      .eq('lead_id', leadId)
      .order('associated_at', { ascending: false });

    if (associationsError) {
      console.error('Error fetching budget associations:', associationsError);
      return { success: false, error: 'Error al cargar presupuestos asociados' };
    }

    if (!associations || associations.length === 0) {
      return { success: true, data: [] };
    }

    // Obtener IDs de presupuestos
    const budgetIds = associations.map(assoc => assoc.budget_id);
    
    if (budgetIds.length === 0) {
      return { success: true, data: [] };
    }
    
    // Obtener presupuestos por separado
    const { data: budgetsData, error: budgetsError } = await supabase
      .from('sales_quotes')
      .select(`
        id,
        number,
        client_id,
        total,
        status,
        summary,
        internal_notes,
        created_at,
        updated_at
      `)
      .in('id', budgetIds);
    
    if (budgetsError) {
      console.error('Error fetching budgets:', budgetsError);
      return { success: false, error: 'Error al cargar presupuestos' };
    }
    
    // Mapear datos combinando asociaciones y presupuestos
    const budgets: BudgetWithAssociation[] = associations.map(assoc => {
      const budget = budgetsData?.find(b => b.id === assoc.budget_id);
      if (!budget) {
        return null;
      }
      
      return {
        ...budget,
        is_primary: assoc.is_primary,
        associated_at: assoc.associated_at,
        associated_by: assoc.associated_by,
        association_notes: assoc.notes
      };
    }).filter(Boolean) as BudgetWithAssociation[];

    return { success: true, data: budgets };
  } catch (error) {
    console.error('Error in getBudgetsByLeadId:', error);
    return { success: false, error: 'Error inesperado al cargar presupuestos' };
  }
}

// Obtener presupuestos no asignados a ningún lead
export async function getUnassignedBudgets(): Promise<{ 
  success: boolean; 
  data?: Budget[]; 
  error?: string 
}> {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Obtener todos los IDs de presupuestos ya asociados
    const { data: assignedBudgets, error: assignedError } = await supabase
      .from('crm_lead_budgets')
      .select('budget_id');

    if (assignedError) {
      console.error('Error fetching assigned budgets:', assignedError);
      return { success: false, error: 'Error al verificar presupuestos asignados' };
    }

    const assignedIds = assignedBudgets?.map(b => b.budget_id) || [];

    // Obtener presupuestos que NO están en la lista de asignados
    let query = supabase
      .from('sales_quotes')
      .select('*')
      .order('created_at', { ascending: false });

    if (assignedIds.length > 0) {
      query = query.not('id', 'in', `(${assignedIds.join(',')})`);
    }

    const { data: budgets, error: budgetsError } = await query;

    if (budgetsError) {
      console.error('Error fetching unassigned budgets:', budgetsError);
      return { success: false, error: 'Error al cargar presupuestos disponibles' };
    }

    return { success: true, data: budgets || [] };
  } catch (error) {
    console.error('Error in getUnassignedBudgets:', error);
    return { success: false, error: 'Error inesperado al cargar presupuestos' };
  }
}

// Obtener presupuestos sin asignar de un cliente específico
export async function getClientUnassignedBudgets(clientId: number): Promise<{ 
  success: boolean; 
  data?: Budget[]; 
  error?: string 
}> {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Obtener IDs de presupuestos ya asignados
    const { data: assignedBudgets, error: assignedError } = await supabase
      .from('crm_lead_budgets')
      .select('budget_id');

    if (assignedError) {
      console.error('Error fetching assigned budgets:', assignedError);
      return { success: false, error: 'Error al verificar presupuestos asignados' };
    }

    const assignedIds = assignedBudgets?.map(b => b.budget_id) || [];

    // Obtener presupuestos del cliente que NO están asignados
    let query = supabase
      .from('sales_quotes')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (assignedIds.length > 0) {
      query = query.not('id', 'in', `(${assignedIds.join(',')})`);
    }

    const { data: budgets, error: budgetsError } = await query;

    if (budgetsError) {
      console.error('Error fetching client unassigned budgets:', budgetsError);
      return { success: false, error: 'Error al cargar presupuestos del cliente' };
    }

    return { success: true, data: budgets || [] };
  } catch (error) {
    console.error('Error in getClientUnassignedBudgets:', error);
    return { success: false, error: 'Error inesperado' };
  }
}

// Obtener lead asociado a un presupuesto
export async function getLeadByBudgetId(budgetId: number): Promise<{ 
  success: boolean; 
  data?: number | null; 
  error?: string 
}> {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Buscar en la tabla de asociaciones
    const { data: association, error: associationError } = await supabase
      .from('crm_lead_budgets')
      .select('lead_id')
      .eq('budget_id', budgetId)
      .maybeSingle(); // ← CAMBIO: usar maybeSingle() en lugar de single()

    // Solo fallar si hay un error real de DB, no si no hay resultados
    if (associationError) {
      console.error('Error fetching lead association:', associationError);
      return { success: false, error: 'Error al buscar lead asociado' };
    }

    // Si encontramos asociación, retornar
    if (association && association.lead_id) {
      return { success: true, data: association.lead_id };
    }

    // Si no hay asociación, buscar en método legacy
    try {
      const { data: lead, error: leadError } = await supabase
        .from('crm_leads')
        .select('id')
        .eq('budget_id', budgetId)
        .maybeSingle(); // ← CAMBIO: usar maybeSingle() en lugar de single()

      if (leadError) {
        console.error('Error fetching lead by budget_id:', leadError);
        // No fallar, solo retornar null
        return { success: true, data: null };
      }

      return { success: true, data: lead?.id || null };
    } catch (legacyError) {
      // No fallar si el método legacy falla
      console.warn('⚠️ Legacy lead lookup failed:', legacyError);
      return { success: true, data: null };
    }

  } catch (error) {
    console.error('Error in getLeadByBudgetId:', error);
    // Retornar éxito con null en lugar de fallar
    return { success: true, data: null };
  }
}

// ==================== FUNCIONES DE MODIFICACIÓN ====================

// Asociar presupuesto a un lead
export async function associateBudgetToLead(
  leadId: number, 
  budgetId: number, 
  notes?: string,
  isPrimary: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Validar parámetros
    if (!leadId || !budgetId) {
      return { success: false, error: 'ID de lead y presupuesto son requeridos' };
    }

    // Verificar que el presupuesto no esté ya asociado
    const { data: existingAssociation, error: existingError } = await supabase
      .from('crm_lead_budgets')
      .select('id')
      .eq('lead_id', leadId)
      .eq('budget_id', budgetId)
      .single();

    if (existingAssociation) {
      return { success: false, error: 'Este presupuesto ya está asociado a este lead' };
    }

    // Obtener información del usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    const associatedBy = user?.email || 'sistema';

    // Insertar asociación
    const { error: insertError } = await supabase
      .from('crm_lead_budgets')
      .insert({
        lead_id: leadId,
        budget_id: budgetId,
        is_primary: isPrimary,
        associated_by: associatedBy,
        notes: notes || null
      });

    if (insertError) {
      console.error('Error inserting budget association:', insertError);
      return { success: false, error: 'Error al asociar presupuesto al lead' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in associateBudgetToLead:', error);
    return { success: false, error: 'Error inesperado al asociar presupuesto' };
  }
}

// Desasociar presupuesto de un lead
export async function disassociateBudgetFromLead(
  leadId: number, 
  budgetId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { error } = await supabase
      .from('crm_lead_budgets')
      .delete()
      .eq('lead_id', leadId)
      .eq('budget_id', budgetId);

    if (error) {
      console.error('Error disassociating budget:', error);
      return { success: false, error: 'Error al desasociar presupuesto' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in disassociateBudgetFromLead:', error);
    return { success: false, error: 'Error inesperado' };
  }
}

// Actualizar notas de asociación
export async function updateBudgetAssociationNotes(
  leadId: number, 
  budgetId: number, 
  notes: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { error } = await supabase
      .from('crm_lead_budgets')
      .update({ notes })
      .eq('lead_id', leadId)
      .eq('budget_id', budgetId);

    if (error) {
      console.error('Error updating association notes:', error);
      return { success: false, error: 'Error al actualizar notas' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateBudgetAssociationNotes:', error);
    return { success: false, error: 'Error inesperado' };
  }
}

// Marcar presupuesto como principal
export async function setPrimaryBudget(
  leadId: number,
  budgetId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Desmarcar todos los presupuestos del lead como principales
    await supabase
      .from('crm_lead_budgets')
      .update({ is_primary: false })
      .eq('lead_id', leadId);

    // Marcar el presupuesto seleccionado como principal
    const { error } = await supabase
      .from('crm_lead_budgets')
      .update({ is_primary: true })
      .eq('lead_id', leadId)
      .eq('budget_id', budgetId);

    if (error) {
      console.error('Error setting primary budget:', error);
      return { success: false, error: 'Error al marcar presupuesto como principal' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in setPrimaryBudget:', error);
    return { success: false, error: 'Error inesperado' };
  }
}

// Función para marcar un presupuesto como ganador y actualizar el lead
export async function markBudgetAsWinner(
  budgetId: number, 
  leadId: number,
  markOthersAsRejected: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    // 1. Verificar que el presupuesto está asociado al lead
    const { data: association, error: associationError } = await supabase
      .from('crm_lead_budgets')
      .select('id, is_primary')
      .eq('lead_id', leadId)
      .eq('budget_id', budgetId)
      .single();

    if (associationError || !association) {
      return { success: false, error: 'Presupuesto no está asociado a este lead' };
    }

    // 2. Actualizar presupuesto ganador a 'accepted'
    const { error: budgetError } = await supabase
      .from('sales_quotes')
      .update({ 
        status: 'accepted',
        updated_at: new Date().toISOString()
      })
      .eq('id', budgetId);

    if (budgetError) {
      console.error('Error updating winning budget:', budgetError);
      return { success: false, error: 'Error al actualizar presupuesto ganador' };
    }

    // 3. Actualizar lead a estado "Ganado" (stage_id = 7)
    const { error: leadError } = await supabase
      .from('crm_leads')
      .update({
        stage_id: 7, // "Ganado"
        actual_close_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId);

    if (leadError) {
      console.error('Error updating lead to won:', leadError);
      return { success: false, error: 'Error al actualizar lead' };
    }

    // 4. Opcional: Marcar otros presupuestos como rechazados
    if (markOthersAsRejected) {
      // Obtener otros presupuestos del lead
      const { data: otherBudgets } = await supabase
        .from('crm_lead_budgets')
        .select('budget_id')
        .eq('lead_id', leadId)
        .neq('budget_id', budgetId);

      if (otherBudgets && otherBudgets.length > 0) {
        const otherBudgetIds = otherBudgets.map(b => b.budget_id);
        
        await supabase
          .from('sales_quotes')
          .update({ 
            status: 'rejected',
            updated_at: new Date().toISOString()
          })
          .in('id', otherBudgetIds);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error in markBudgetAsWinner:', error);
    return { success: false, error: 'Error inesperado al marcar presupuesto como ganador' };
  }
}