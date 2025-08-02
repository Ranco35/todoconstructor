'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import type { SeasonConfiguration, SeasonInfo, PriceCalculation } from '@/types/season';

// ===================================
// OBTENER TEMPORADAS
// ===================================

export async function getSeasonConfigurations(page = 1, pageSize = 20, search = '') {
  try {
    const supabase = await getSupabaseServerClient();
    let query = supabase
      .from('season_configurations')
      .select('*', { count: 'exact' })
      .order('start_date', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,season_type.ilike.%${search}%`);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query.range(from, to);

    if (error) {
      throw new Error(`Error al obtener temporadas: ${error.message}`);
    }

    return {
      success: true,
      data: data || [],
      count: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize)
    };
  } catch (error) {
    console.error('Error fetching season configurations:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      data: [],
      count: 0,
      totalPages: 0
    };
  }
}

export async function getActiveSeasonConfigurations() {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from('season_configurations')
      .select('*')
      .eq('is_active', true)
      .order('start_date');

    if (error) {
      throw new Error(`Error al obtener temporadas activas: ${error.message}`);
    }

    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    console.error('Error fetching active seasons:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      data: []
    };
  }
}

// ===================================
// OBTENER TEMPORADA POR FECHA
// ===================================

export async function getSeasonForDate(date: string): Promise<{ success: boolean; data?: SeasonInfo; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .rpc('get_season_for_date', { check_date: date });

    if (error) {
      throw new Error(`Error al obtener temporada para fecha: ${error.message}`);
    }

    return {
      success: true,
      data: data && data.length > 0 ? data[0] : undefined
    };
  } catch (error) {
    console.error('Error getting season for date:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

// ===================================
// CALCULAR PRECIO ESTACIONAL
// ===================================

export async function calculateSeasonalPrice(
  basePrice: number, 
  date: string, 
  priceType: 'room' | 'program' = 'room'
): Promise<{ success: boolean; data?: PriceCalculation; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .rpc('calculate_seasonal_price', { 
        base_price: basePrice, 
        check_date: date, 
        price_type: priceType 
      });

    if (error) {
      throw new Error(`Error al calcular precio estacional: ${error.message}`);
    }

    // Obtener información de la temporada para contexto adicional
    const seasonInfo = await getSeasonForDate(date);
    
    const calculation: PriceCalculation = {
      base_price: basePrice,
      seasonal_price: data || basePrice,
      discount_percentage: seasonInfo.data?.discount_percentage || 0,
      season_name: seasonInfo.data?.name,
      season_type: seasonInfo.data?.season_type
    };

    return {
      success: true,
      data: calculation
    };
  } catch (error) {
    console.error('Error calculating seasonal price:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

// ===================================
// CREAR TEMPORADA
// ===================================

export async function createSeasonConfiguration(formData: FormData) {
  try {
    const supabase = await getSupabaseServerClient();

    const seasonData = {
      name: formData.get('name') as string,
      season_type: formData.get('season_type') as 'low' | 'mid' | 'high',
      start_date: formData.get('start_date') as string,
      end_date: formData.get('end_date') as string,
      discount_percentage: parseFloat(formData.get('discount_percentage') as string) || 0,
      priority: parseInt(formData.get('priority') as string) || 1,
      applies_to_rooms: formData.get('applies_to_rooms') === 'true',
      applies_to_programs: formData.get('applies_to_programs') === 'true',
      is_active: formData.get('is_active') === 'true',
      created_by: 'usuario' // Se puede mejorar con auth
    };

    const { data, error } = await supabase
      .from('season_configurations')
      .insert([seasonData])
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear temporada: ${error.message}`);
    }

    revalidatePath('/dashboard/configuration/seasons');
    revalidatePath('/dashboard/reservations');

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error creating season configuration:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

// ===================================
// ACTUALIZAR TEMPORADA
// ===================================

export async function updateSeasonConfiguration(id: number, formData: FormData) {
  try {
    const supabase = await getSupabaseServerClient();

    const seasonData = {
      name: formData.get('name') as string,
      season_type: formData.get('season_type') as 'low' | 'mid' | 'high',
      start_date: formData.get('start_date') as string,
      end_date: formData.get('end_date') as string,
      discount_percentage: parseFloat(formData.get('discount_percentage') as string) || 0,
      priority: parseInt(formData.get('priority') as string) || 1,
      applies_to_rooms: formData.get('applies_to_rooms') === 'true',
      applies_to_programs: formData.get('applies_to_programs') === 'true',
      is_active: formData.get('is_active') === 'true'
    };

    const { data, error } = await supabase
      .from('season_configurations')
      .update(seasonData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar temporada: ${error.message}`);
    }

    revalidatePath('/dashboard/configuration/seasons');
    revalidatePath('/dashboard/reservations');

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error updating season configuration:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

// ===================================
// ELIMINAR TEMPORADA
// ===================================

export async function deleteSeasonConfiguration(id: number) {
  try {
    const supabase = await getSupabaseServerClient();

    const { error } = await supabase
      .from('season_configurations')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error al eliminar temporada: ${error.message}`);
    }

    revalidatePath('/dashboard/configuration/seasons');
    revalidatePath('/dashboard/reservations');

    return {
      success: true
    };
  } catch (error) {
    console.error('Error deleting season configuration:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

// ===================================
// OBTENER UNA TEMPORADA POR ID
// ===================================

export async function getSeasonConfigurationById(id: number) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from('season_configurations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Error al obtener temporada: ${error.message}`);
    }

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error fetching season configuration:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      data: null
    };
  }
}

// Alias para consistencia
export const getSeasonConfiguration = getSeasonConfigurationById;

// ===================================
// VALIDAR CONFLICTOS DE FECHAS
// ===================================

export async function validateSeasonDates(
  startDate: string, 
  endDate: string, 
  excludeId?: number
) {
  try {
    const supabase = await getSupabaseServerClient();
    let query = supabase
      .from('season_configurations')
      .select('id, name, start_date, end_date, priority')
      .eq('is_active', true)
      .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error al validar fechas: ${error.message}`);
    }

    return {
      success: true,
      conflicts: data || []
    };
  } catch (error) {
    console.error('Error validating season dates:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      conflicts: []
    };
  }
} 