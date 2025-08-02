'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';

// Interface para Programas de Alojamiento (basada en tabla Product)
export interface RealLodgingProgram {
  id: number;
  name: string;
  description: string | null;
  categoryid: number;
  saleprice: number; // Siempre será un número válido después del mapeo
  sku: string | null;
  Category?: {
    id: number;
    name: string;
  } | null;
}

export interface LodgingProgramFilters {
  min_price?: number;
  max_price?: number;
}

// Obtener todos los programas de alojamiento de la categoría ID 26
export async function getRealLodgingPrograms(filters?: LodgingProgramFilters): Promise<RealLodgingProgram[]> {
  try {
    let query = (await getSupabaseServerClient())
      .from('Product')
      .select(`
        id,
        name,
        description,
        categoryid,
        saleprice,
        sku,
        Category:categoryid(id, name)
      `)
      .eq('categoryid', 26) // Específicamente categoría "Programas Alojamiento"
      .order('saleprice', { ascending: true });

    if (filters) {
      if (filters.min_price) {
        query = query.gte('saleprice', filters.min_price);
      }
      if (filters.max_price) {
        query = query.lte('saleprice', filters.max_price);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error al obtener programas de alojamiento: ${error.message}`);
    }

    // Filtrar programas con precios válidos y agregar precio por defecto si es null
    const programsWithValidPrices = (data || []).map(program => ({
      ...program,
      saleprice: program.saleprice || 0
    }));

    return programsWithValidPrices;
  } catch (error) {
    console.error('Error fetching real lodging programs:', error);
    return [];
  }
}

// Obtener un programa específico por ID
export async function getRealLodgingProgramById(id: number): Promise<RealLodgingProgram | null> {
  try {
    const { data, error } = await (await getSupabaseServerClient())
      .from('Product')
      .select(`
        id,
        name,
        description,
        categoryid,
        saleprice,
        sku,
        Category:categoryid(id, name)
      `)
      .eq('id', id)
      .eq('categoryid', 26) // Solo programas de alojamiento
      .single();

    if (error) {
      throw new Error(`Error al obtener programa de alojamiento: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error fetching real lodging program by id:', error);
    return null;
  }
}

// Verificar si existe la categoría "Programas Alojamiento"
export async function verifyLodgingProgramsCategory() {
  try {
    const { data, error } = await (await getSupabaseServerClient())
      .from('Category')
      .select('id, name')
      .eq('name', 'Programas Alojamiento')
      .single();

    if (error) {
      console.log('Categoría "Programas Alojamiento" no encontrada');
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error verificando categoría:', error);
    return null;
  }
}

// Obtener estadísticas de programas de alojamiento
export async function getRealLodgingProgramStats() {
  try {
    const { data: programs, error } = await (await getSupabaseServerClient())
      .from('Product')
      .select('saleprice')
      .eq('categoryid', 26);

    if (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }

    if (!programs || programs.length === 0) {
      return {
        total: 0,
        avgPrice: 0,
        minPrice: 0,
        maxPrice: 0
      };
    }

    const prices = programs.map(p => p.saleprice).filter(p => p !== null) as number[];
    
    return {
      total: programs.length,
      avgPrice: prices.reduce((sum, price) => sum + price, 0) / prices.length,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices)
    };
  } catch (error) {
    console.error('Error getting real lodging programs stats:', error);
    return {
      total: 0,
      avgPrice: 0,
      minPrice: 0,
      maxPrice: 0
    };
  }
} 