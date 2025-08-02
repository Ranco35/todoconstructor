'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getCurrentUser } from '@/actions/configuration/auth-actions';

// Tipos para el uso de tokens
export interface TokenUsageRecord {
  id: number;
  user_id: number | null;
  session_id: string | null;
  feature_type: string;
  model_used: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
  request_type: string | null;
  endpoint_used: string | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface TokenUsageInput {
  session_id?: string;
  feature_type: string;
  model_used: string;
  prompt_tokens: number;
  completion_tokens: number;
  request_type?: string;
  endpoint_used?: string;
  success?: boolean;
  error_message?: string;
}

export interface TokenUsageStats {
  total_tokens: number;
  total_cost_usd: number;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  average_tokens_per_request: number;
  most_used_model: string;
  most_used_feature: string;
}

export interface TokenUsageFilters {
  period: 'today' | 'week' | 'month' | 'all';
  feature_type?: string;
  model_used?: string;
  success?: boolean;
  start_date?: Date;
  end_date?: Date;
}

// Precios aproximados por token (en USD) - actualizar según precios actuales de OpenAI
const TOKEN_PRICES = {
  'gpt-3.5-turbo': {
    prompt: 0.000001,
    completion: 0.000002
  },
  'gpt-3.5-turbo-16k': {
    prompt: 0.000003,
    completion: 0.000004
  },
  'gpt-4': {
    prompt: 0.00003,
    completion: 0.00006
  },
  'gpt-4-turbo-preview': {
    prompt: 0.00001,
    completion: 0.00003
  },
  'gpt-4-turbo': {
    prompt: 0.00001,
    completion: 0.00003
  }
};

/**
 * Calcula el costo estimado basado en el modelo y tokens usados
 */
function calculateEstimatedCost(model: string, promptTokens: number, completionTokens: number): number {
  const modelPrices = TOKEN_PRICES[model as keyof typeof TOKEN_PRICES] || TOKEN_PRICES['gpt-3.5-turbo'];
  
  const promptCost = promptTokens * modelPrices.prompt;
  const completionCost = completionTokens * modelPrices.completion;
  
  return promptCost + completionCost;
}

/**
 * Registra el uso de tokens en la base de datos
 */
export async function logTokenUsage(input: TokenUsageInput): Promise<{ success: boolean; error?: string; data?: TokenUsageRecord }> {
  try {
    console.log('🤖 Registrando uso de tokens:', input);
    
    const supabase = await getSupabaseServerClient();
    const currentUser = await getCurrentUser();
    
    const totalTokens = input.prompt_tokens + input.completion_tokens;
    const estimatedCost = calculateEstimatedCost(input.model_used, input.prompt_tokens, input.completion_tokens);
    
    const tokenUsageData = {
      user_id: currentUser?.id || null,
      session_id: input.session_id || null,
      feature_type: input.feature_type,
      model_used: input.model_used,
      prompt_tokens: input.prompt_tokens,
      completion_tokens: input.completion_tokens,
      total_tokens: totalTokens,
      estimated_cost_usd: estimatedCost,
      request_type: input.request_type || 'completion',
      endpoint_used: input.endpoint_used || null,
      success: input.success !== false, // default true
      error_message: input.error_message || null
    };
    
    const { data, error } = await supabase
      .from('ai_token_usage')
      .insert(tokenUsageData)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error registrando uso de tokens:', error);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Uso de tokens registrado correctamente:', data);
    return { success: true, data };
    
  } catch (error) {
    console.error('❌ Error en logTokenUsage:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}

/**
 * Obtiene estadísticas de uso de tokens con filtros
 */
export async function getTokenUsageStats(filters?: TokenUsageFilters): Promise<{ success: boolean; data?: TokenUsageStats; error?: string }> {
  try {
    console.log('📊 Obteniendo estadísticas de tokens con filtros:', filters);
    
    const supabase = await getSupabaseServerClient();
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return { success: false, error: 'Usuario no autenticado' };
    }
    
    // Construir la consulta base
    let query = supabase
      .from('ai_token_usage')
      .select('*');
    
    // Aplicar filtros
    if (filters) {
      // Filtro por período
      if (filters.period && filters.period !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (filters.period) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          default:
            startDate = new Date(0); // Desde el inicio
        }
        
        query = query.gte('created_at', startDate.toISOString());
      }
      
      // Filtros personalizados
      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date.toISOString());
      }
      
      if (filters.end_date) {
        query = query.lte('created_at', filters.end_date.toISOString());
      }
      
      if (filters.feature_type) {
        query = query.eq('feature_type', filters.feature_type);
      }
      
      if (filters.model_used) {
        query = query.eq('model_used', filters.model_used);
      }
      
      if (filters.success !== undefined) {
        query = query.eq('success', filters.success);
      }
    }
    
    // Solo mostrar datos del usuario actual (excepto para administradores)
    if (currentUser.role !== 'SUPER_USER' && currentUser.role !== 'ADMINISTRADOR') {
      query = query.eq('user_id', currentUser.id);
    }
    
    const { data: records, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error obteniendo estadísticas de tokens:', error);
      return { success: false, error: error.message };
    }
    
    if (!records || records.length === 0) {
      return {
        success: true,
        data: {
          total_tokens: 0,
          total_cost_usd: 0,
          total_requests: 0,
          successful_requests: 0,
          failed_requests: 0,
          average_tokens_per_request: 0,
          most_used_model: 'N/A',
          most_used_feature: 'N/A'
        }
      };
    }
    
    // Calcular estadísticas
    const totalTokens = records.reduce((sum, record) => sum + (record.total_tokens || 0), 0);
    const totalCost = records.reduce((sum, record) => sum + (record.estimated_cost_usd || 0), 0);
    const totalRequests = records.length;
    const successfulRequests = records.filter(r => r.success).length;
    const failedRequests = totalRequests - successfulRequests;
    const averageTokensPerRequest = totalRequests > 0 ? Math.round(totalTokens / totalRequests) : 0;
    
    // Encontrar modelo y función más usados
    const modelCounts = records.reduce((acc, record) => {
      acc[record.model_used] = (acc[record.model_used] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const featureCounts = records.reduce((acc, record) => {
      acc[record.feature_type] = (acc[record.feature_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostUsedModel = Object.keys(modelCounts).reduce((a, b) => 
      modelCounts[a] > modelCounts[b] ? a : b, 'N/A'
    );
    
    const mostUsedFeature = Object.keys(featureCounts).reduce((a, b) => 
      featureCounts[a] > featureCounts[b] ? a : b, 'N/A'
    );
    
    const stats: TokenUsageStats = {
      total_tokens: totalTokens,
      total_cost_usd: totalCost,
      total_requests: totalRequests,
      successful_requests: successfulRequests,
      failed_requests: failedRequests,
      average_tokens_per_request: averageTokensPerRequest,
      most_used_model: mostUsedModel,
      most_used_feature: mostUsedFeature
    };
    
    console.log('✅ Estadísticas de tokens calculadas:', stats);
    return { success: true, data: stats };
    
  } catch (error) {
    console.error('❌ Error en getTokenUsageStats:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}

/**
 * Obtiene el historial detallado de uso de tokens
 */
export async function getTokenUsageHistory(
  filters?: TokenUsageFilters,
  page: number = 1,
  pageSize: number = 50
): Promise<{ 
  success: boolean; 
  data?: TokenUsageRecord[]; 
  totalCount?: number;
  totalPages?: number;
  error?: string 
}> {
  try {
    console.log('📋 Obteniendo historial de tokens:', { filters, page, pageSize });
    
    const supabase = await getSupabaseServerClient();
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return { success: false, error: 'Usuario no autenticado' };
    }
    
    // Construir la consulta para el conteo
    let countQuery = supabase
      .from('ai_token_usage')
      .select('*', { count: 'exact', head: true });
    
    // Construir la consulta principal
    let query = supabase
      .from('ai_token_usage')
      .select('*');
    
    // Aplicar filtros a ambas consultas
    const applyFilters = (q: any) => {
      if (filters) {
        // Filtro por período
        if (filters.period && filters.period !== 'all') {
          const now = new Date();
          let startDate: Date;
          
          switch (filters.period) {
            case 'today':
              startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              break;
            case 'week':
              startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              break;
            case 'month':
              startDate = new Date(now.getFullYear(), now.getMonth(), 1);
              break;
            default:
              startDate = new Date(0);
          }
          
          q = q.gte('created_at', startDate.toISOString());
        }
        
        if (filters.start_date) {
          q = q.gte('created_at', filters.start_date.toISOString());
        }
        
        if (filters.end_date) {
          q = q.lte('created_at', filters.end_date.toISOString());
        }
        
        if (filters.feature_type) {
          q = q.eq('feature_type', filters.feature_type);
        }
        
        if (filters.model_used) {
          q = q.eq('model_used', filters.model_used);
        }
        
        if (filters.success !== undefined) {
          q = q.eq('success', filters.success);
        }
      }
      
      // Solo mostrar datos del usuario actual (excepto para administradores)
      if (currentUser.role !== 'SUPER_USER' && currentUser.role !== 'ADMINISTRADOR') {
        q = q.eq('user_id', currentUser.id);
      }
      
      return q;
    };
    
    // Aplicar filtros
    countQuery = applyFilters(countQuery);
    query = applyFilters(query);
    
    // Obtener conteo total
    const { count, error: countError } = await countQuery;
    
    if (countError) {
      console.error('❌ Error obteniendo conteo de tokens:', countError);
      return { success: false, error: countError.message };
    }
    
    // Aplicar paginación y ordenamiento
    const offset = (page - 1) * pageSize;
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);
    
    const { data: records, error } = await query;
    
    if (error) {
      console.error('❌ Error obteniendo historial de tokens:', error);
      return { success: false, error: error.message };
    }
    
    const totalPages = Math.ceil((count || 0) / pageSize);
    
    console.log(`✅ Historial de tokens obtenido: ${records?.length || 0} registros de ${count || 0} total`);
    
    return {
      success: true,
      data: records || [],
      totalCount: count || 0,
      totalPages
    };
    
  } catch (error) {
    console.error('❌ Error en getTokenUsageHistory:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}

/**
 * Obtiene estadísticas agrupadas por período (para gráficos)
 */
export async function getTokenUsageTrends(
  period: 'daily' | 'weekly' | 'monthly',
  days: number = 30
): Promise<{ 
  success: boolean; 
  data?: Array<{
    date: string;
    total_tokens: number;
    total_cost_usd: number;
    requests: number;
  }>; 
  error?: string 
}> {
  try {
    console.log('📈 Obteniendo tendencias de tokens:', { period, days });
    
    const supabase = await getSupabaseServerClient();
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return { success: false, error: 'Usuario no autenticado' };
    }
    
    // Calcular fecha de inicio
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    
    let query = supabase
      .from('ai_token_usage')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    
    // Solo mostrar datos del usuario actual (excepto para administradores)
    if (currentUser.role !== 'SUPER_USER' && currentUser.role !== 'ADMINISTRADOR') {
      query = query.eq('user_id', currentUser.id);
    }
    
    const { data: records, error } = await query.order('created_at', { ascending: true });
    
    if (error) {
      console.error('❌ Error obteniendo tendencias de tokens:', error);
      return { success: false, error: error.message };
    }
    
    if (!records || records.length === 0) {
      return { success: true, data: [] };
    }
    
    // Agrupar por período
    const grouped = records.reduce((acc, record) => {
      const date = new Date(record.created_at);
      let key: string;
      
      switch (period) {
        case 'daily':
          key = date.toISOString().split('T')[0]; // YYYY-MM-DD
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }
      
      if (!acc[key]) {
        acc[key] = {
          date: key,
          total_tokens: 0,
          total_cost_usd: 0,
          requests: 0
        };
      }
      
      acc[key].total_tokens += record.total_tokens || 0;
      acc[key].total_cost_usd += record.estimated_cost_usd || 0;
      acc[key].requests += 1;
      
      return acc;
    }, {} as Record<string, any>);
    
    const trends = Object.values(grouped).sort((a: any, b: any) => 
      a.date.localeCompare(b.date)
    ) as Array<{
      date: string;
      total_tokens: number;
      total_cost_usd: number;
      requests: number;
    }>;
    
    console.log('✅ Tendencias de tokens calculadas:', trends.length, 'períodos');
    return { success: true, data: trends };
    
  } catch (error) {
    console.error('❌ Error en getTokenUsageTrends:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
} 