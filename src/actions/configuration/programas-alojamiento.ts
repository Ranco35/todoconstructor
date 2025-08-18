'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';

// Interface para Programas de Alojamiento (basada en tabla Product)
export interface ProgramaAlojamiento {
  id: number;
  name: string;
  description: string | null;
  categoryid: number;
  saleprice?: number | null;
  costprice?: number | null;
  sku: string | null;
  brand?: string | null;
  barcode?: string | null;
  type?: string | null;
  Category?: {
    id: number;
    name: string;
  } | null;
}

export interface ProgramaAlojamientoFilters {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  active?: boolean;
}

export interface ProgramaAlojamientoStats {
  total: number;
  active: number;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
}

// ID de la categoría "Programas Alojamiento"
const PROGRAMAS_ALOJAMIENTO_CATEGORY_ID = 26;

// Obtener todos los programas de alojamiento
export async function getProgramasAlojamiento(filters?: ProgramaAlojamientoFilters): Promise<{
  data: ProgramaAlojamiento[];
  error?: string;
}> {
  try {
    let query = (await getSupabaseServerClient())
      .from('Product')
      .select(`
        id,
        name,
        description,
        categoryid,
        saleprice,
        costprice,
        sku,
        brand,
        barcode,
        type,
        Category:categoryid(id, name)
      `)
      .eq('categoryid', PROGRAMAS_ALOJAMIENTO_CATEGORY_ID)
      .order('name', { ascending: true });

    // Aplicar filtros
    if (filters) {
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
      }
      if (filters.minPrice !== undefined) {
        query = query.gte('saleprice', filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        query = query.lte('saleprice', filters.maxPrice);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching programas alojamiento:', error);
      return { data: [], error: error.message };
    }

    // No filtrar por precios válidos ya que ahora pueden ser null
    const programas = (data || []).map(programa => ({
      ...programa,
      saleprice: programa.saleprice || null,
      costprice: programa.costprice || null
    }));

    return { data: programas };
  } catch (error) {
    console.error('Error in getProgramasAlojamiento:', error);
    return { 
      data: [], 
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

// Obtener un programa específico por ID
export async function getProgramaAlojamientoById(id: number): Promise<{
  data?: ProgramaAlojamiento;
  error?: string;
}> {
  try {
    const { data, error } = await (await getSupabaseServerClient())
      .from('Product')
      .select(`
        id,
        name,
        description,
        categoryid,
        saleprice,
        costprice,
        sku,
        brand,
        barcode,
        type,
        Category:categoryid(id, name)
      `)
      .eq('id', id)
      .eq('categoryid', PROGRAMAS_ALOJAMIENTO_CATEGORY_ID)
      .single();

    if (error) {
      console.error('Error fetching programa by id:', error);
      return { error: error.message };
    }

    return { data };
  } catch (error) {
    console.error('Error in getProgramaAlojamientoById:', error);
    return { 
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

// Crear un nuevo programa de alojamiento
export async function createProgramaAlojamiento(programaData: {
  name: string;
  description?: string;
  saleprice?: number;
  costprice?: number;
  sku?: string;
  brand?: string;
  type?: string;
}): Promise<{
  data?: ProgramaAlojamiento;
  error?: string;
}> {
  try {
    // Generar SKU automático si no se proporciona
    let sku = programaData.sku;
    if (!sku) {
      const timestamp = Date.now().toString().slice(-4);
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      sku = `PROG-${timestamp}-${randomNum}`;
    }

    const { data, error } = await (await getSupabaseServerClient())
      .from('Product')
      .insert({
        name: programaData.name,
        description: programaData.description,
        categoryid: PROGRAMAS_ALOJAMIENTO_CATEGORY_ID,
        saleprice: programaData.saleprice || null,
        costprice: programaData.costprice || null,
        sku: sku,
        brand: programaData.brand,
        type: programaData.type || 'PROGRAMA',
      })
      .select(`
        id,
        name,
        description,
        categoryid,
        saleprice,
        costprice,
        sku,
        brand,
        barcode,
        type,
        Category:categoryid(id, name)
      `)
      .single();

    if (error) {
      console.error('Error creating programa alojamiento:', error);
      return { error: error.message };
    }

    revalidatePath('/dashboard/configuration/programas');
    return { data };
  } catch (error) {
    console.error('Error in createProgramaAlojamiento:', error);
    return { 
      error: error instanceof Error ? error.message : 'Error desconocido al crear programa'
    };
  }
}

// Actualizar un programa de alojamiento
export async function updateProgramaAlojamiento(
  id: number, 
  programaData: Partial<{
    name: string;
    description: string;
    saleprice: number;
    costprice: number;
    sku: string;
    brand: string;
    type: string;
  }>
): Promise<{
  data?: ProgramaAlojamiento;
  error?: string;
}> {
  try {
    const { data, error } = await (await getSupabaseServerClient())
      .from('Product')
      .update(programaData)
      .eq('id', id)
      .eq('categoryid', PROGRAMAS_ALOJAMIENTO_CATEGORY_ID)
      .select(`
        id,
        name,
        description,
        categoryid,
        saleprice,
        costprice,
        sku,
        brand,
        barcode,
        type,
        Category:categoryid(id, name)
      `)
      .single();

    if (error) {
      console.error('Error updating programa alojamiento:', error);
      return { error: error.message };
    }

    revalidatePath('/dashboard/configuration/programas');
    return { data };
  } catch (error) {
    console.error('Error in updateProgramaAlojamiento:', error);
    return { 
      error: error instanceof Error ? error.message : 'Error desconocido al actualizar programa'
    };
  }
}

// Eliminar un programa de alojamiento
export async function deleteProgramaAlojamiento(id: number): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { error } = await (await getSupabaseServerClient())
      .from('Product')
      .delete()
      .eq('id', id)
      .eq('categoryid', PROGRAMAS_ALOJAMIENTO_CATEGORY_ID);

    if (error) {
      console.error('Error deleting programa alojamiento:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/configuration/programas');
    return { success: true };
  } catch (error) {
    console.error('Error in deleteProgramaAlojamiento:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al eliminar programa'
    };
  }
}

// Obtener estadísticas de programas de alojamiento
export async function getProgramasAlojamientoStats(): Promise<{
  data?: ProgramaAlojamientoStats;
  error?: string;
}> {
  try {
    const { data: programas, error } = await (await getSupabaseServerClient())
      .from('Product')
      .select('saleprice')
      .eq('categoryid', PROGRAMAS_ALOJAMIENTO_CATEGORY_ID);

    if (error) {
      console.error('Error fetching stats:', error);
      return { error: error.message };
    }

    if (!programas || programas.length === 0) {
      return {
        data: {
          total: 0,
          active: 0,
          avgPrice: 0,
          minPrice: 0,
          maxPrice: 0
        }
      };
    }

    const prices = programas.map(p => p.saleprice).filter(p => p !== null && p > 0) as number[];
    
    return {
      data: {
        total: programas.length,
        active: programas.length, // Todos son activos por estar en la tabla
        avgPrice: prices.length > 0 ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0,
        minPrice: prices.length > 0 ? Math.min(...prices) : 0,
        maxPrice: prices.length > 0 ? Math.max(...prices) : 0
      }
    };
  } catch (error) {
    console.error('Error in getProgramasAlojamientoStats:', error);
    return { 
      error: error instanceof Error ? error.message : 'Error desconocido al obtener estadísticas'
    };
  }
}

// Verificar si existe la categoría "Programas Alojamiento"
export async function verificarCategoriaPrograms(): Promise<{
  exists: boolean;
  categoryId?: number;
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();
    const { getCategoryTableName } = await import('@/lib/table-resolver');
    const categoryTable = await getCategoryTableName(supabase as any);
    const { data, error } = await (supabase as any)
      .from(categoryTable)
      .select('id, name')
      .eq('id', PROGRAMAS_ALOJAMIENTO_CATEGORY_ID)
      .single();

    if (error) {
      console.error('Error verificando categoría:', error);
      return { exists: false, error: error.message };
    }

    return { 
      exists: true, 
      categoryId: data.id 
    };
  } catch (error) {
    console.error('Error in verificarCategoriaPrograms:', error);
    return { 
      exists: false, 
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
} 