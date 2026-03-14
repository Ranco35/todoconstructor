'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import { CRMLead } from '@/types/crm';

/**
 * Versión de debug que muestra errores reales en lugar de silenciarlos
 */
export async function debugGetCRMLeads(): Promise<{ success: boolean; data?: CRMLead[]; error?: string; details?: any }> {
  try {
    console.log('🔍 [DEBUG CRM] Iniciando getCRMLeads...');
    
    const supabase = await getSupabaseServerClient();
    console.log('✅ [DEBUG CRM] Cliente Supabase obtenido');
    
    const { data, error } = await supabase
      .from('crm_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [DEBUG CRM] Error en consulta:', error);
      return { 
        success: false, 
        error: error.message,
        details: {
          code: error.code,
          details: error.details,
          hint: error.hint
        }
      };
    }

    console.log('✅ [DEBUG CRM] Consulta exitosa, leads encontrados:', data?.length || 0);
    return { success: true, data: data || [] };
    
  } catch (error: any) {
    console.error('❌ [DEBUG CRM] Error general:', error);
    return { 
      success: false, 
      error: error.message,
      details: {
        stack: error.stack,
        name: error.name
      }
    };
  }
}

/**
 * Versión de debug que muestra errores reales para etapas
 */
export async function debugGetCRMStages(): Promise<{ success: boolean; data?: any[]; error?: string; details?: any }> {
  try {
    console.log('🔍 [DEBUG CRM STAGES] Iniciando getCRMStages...');
    
    const supabase = await getSupabaseServerClient();
    console.log('✅ [DEBUG CRM STAGES] Cliente Supabase obtenido');
    
    const { data, error } = await supabase
      .from('crm_stages')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('❌ [DEBUG CRM STAGES] Error en consulta:', error);
      return { 
        success: false, 
        error: error.message,
        details: {
          code: error.code,
          details: error.details,
          hint: error.hint
        }
      };
    }

    console.log('✅ [DEBUG CRM STAGES] Consulta exitosa, etapas encontradas:', data?.length || 0);
    return { success: true, data: data || [] };
    
  } catch (error: any) {
    console.error('❌ [DEBUG CRM STAGES] Error general:', error);
    return { 
      success: false, 
      error: error.message,
      details: {
        stack: error.stack,
        name: error.name
      }
    };
  }
}

/**
 * Verificar si las tablas CRM existen
 */
export async function debugCheckCRMTables(): Promise<{ success: boolean; tables?: string[]; error?: string; details?: any }> {
  try {
    console.log('🔍 [DEBUG CRM TABLES] Verificando existencia de tablas...');
    
    const supabase = await getSupabaseServerClient();
    
    // Verificar tablas intentando consultar cada una directamente
    const tables = ['crm_stages', 'crm_leads', 'crm_activities'];
    const existingTables = [];
    
    for (const table of tables) {
      try {
        const { error: tableError } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (!tableError) {
          existingTables.push(table);
        }
      } catch (err) {
        // Tabla no existe o no es accesible
        console.log(`Tabla ${table} no existe o no es accesible`);
      }
    }
    
    console.log('✅ [DEBUG CRM TABLES] Tablas encontradas:', existingTables);
    
    return { 
      success: true, 
      tables: existingTables,
      message: `Tablas CRM encontradas: ${existingTables.join(', ')}`
    };
    
  } catch (error: any) {
    console.error('❌ [DEBUG CRM TABLES] Error general:', error);
    return { 
      success: false, 
      error: error.message,
      details: {
        stack: error.stack,
        name: error.name
      }
    };
  }
}
