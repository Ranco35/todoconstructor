'use server';

import { createClient } from '@/lib/supabase';
import { UnitMeasure, UnitMeasureFormData, UnitMeasureResponse, ProductUnitConversion, ProductUnitConversionFormData } from '@/types/unit-measure';
import { revalidatePath } from 'next/cache';

/**
 * Obtener todas las unidades de medida con paginación
 */
export async function getUnitMeasures({ 
  page = 1, 
  pageSize = 10, 
  search = '',
  category = '',
  includeInactive = false 
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  includeInactive?: boolean;
} = {}): Promise<UnitMeasureResponse> {
  const supabase = createClient();
  
  try {
    let query = supabase
      .from('UnitMeasure')
      .select(`
        *,
        baseUnit:baseUnitId (
          id,
          name,
          abbreviation
        )
      `, { count: 'exact' });

    // Filtros
    if (!includeInactive) {
      query = query.eq('isActive', true);
    }
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,abbreviation.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    if (category) {
      query = query.eq('category', category);
    }

    // Ordenamiento
    query = query.order('isDefault', { ascending: false })
                 .order('category', { ascending: true })
                 .order('name', { ascending: true });

    // Paginación
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error obteniendo unidades de medida:', error);
      throw new Error('Error al obtener unidades de medida');
    }

    const totalPages = Math.ceil((count || 0) / pageSize);

    return {
      data: data || [],
      totalCount: count || 0,
      totalPages
    };
  } catch (error) {
    console.error('Error en getUnitMeasures:', error);
    throw new Error('Error al obtener unidades de medida');
  }
}

/**
 * Obtener una unidad de medida por ID
 */
export async function getUnitMeasureById(id: number): Promise<UnitMeasure | null> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('UnitMeasure')
      .select(`
        *,
        baseUnit:baseUnitId (
          id,
          name,
          abbreviation,
          category
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error obteniendo unidad de medida:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error en getUnitMeasureById:', error);
    return null;
  }
}

/**
 * Crear nueva unidad de medida
 */
export async function createUnitMeasure(formData: UnitMeasureFormData): Promise<UnitMeasure> {
  const supabase = createClient();
  
  try {
    // Validar que la abreviatura no exista
    const { data: existing } = await supabase
      .from('UnitMeasure')
      .select('id')
      .eq('abbreviation', formData.abbreviation.toUpperCase())
      .single();

    if (existing) {
      throw new Error(`Ya existe una unidad con la abreviatura "${formData.abbreviation}"`);
    }

    // Crear la unidad
    const { data, error } = await supabase
      .from('UnitMeasure')
      .insert({
        name: formData.name,
        abbreviation: formData.abbreviation.toUpperCase(),
        description: formData.description,
        isActive: formData.isActive ?? true,
        isDefault: false, // Solo las del sistema son default
        baseUnitId: formData.baseUnitId,
        conversionFactor: formData.conversionFactor ?? 1.0,
        conversionFormula: formData.conversionFormula,
        category: formData.category,
        unitType: formData.unitType ?? 'custom',
        notes: formData.notes
      })
      .select(`
        *,
        baseUnit:baseUnitId (
          id,
          name,
          abbreviation
        )
      `)
      .single();

    if (error) {
      console.error('Error creando unidad de medida:', error);
      throw new Error('Error al crear la unidad de medida');
    }

    revalidatePath('/dashboard/configuration/units');
    return data;
  } catch (error) {
    console.error('Error en createUnitMeasure:', error);
    throw error;
  }
}

/**
 * Actualizar unidad de medida
 */
export async function updateUnitMeasure(id: number, formData: UnitMeasureFormData): Promise<UnitMeasure> {
  const supabase = createClient();
  
  try {
    // Verificar que no sea una unidad del sistema
    const { data: current } = await supabase
      .from('UnitMeasure')
      .select('isDefault')
      .eq('id', id)
      .single();

    if (current?.isDefault) {
      throw new Error('No se pueden editar las unidades del sistema');
    }

    // Validar que la abreviatura no exista en otra unidad
    const { data: existing } = await supabase
      .from('UnitMeasure')
      .select('id')
      .eq('abbreviation', formData.abbreviation.toUpperCase())
      .neq('id', id)
      .single();

    if (existing) {
      throw new Error(`Ya existe otra unidad con la abreviatura "${formData.abbreviation}"`);
    }

    // Actualizar
    const { data, error } = await supabase
      .from('UnitMeasure')
      .update({
        name: formData.name,
        abbreviation: formData.abbreviation.toUpperCase(),
        description: formData.description,
        isActive: formData.isActive ?? true,
        baseUnitId: formData.baseUnitId,
        conversionFactor: formData.conversionFactor ?? 1.0,
        conversionFormula: formData.conversionFormula,
        category: formData.category,
        unitType: formData.unitType ?? 'custom',
        notes: formData.notes
      })
      .eq('id', id)
      .select(`
        *,
        baseUnit:baseUnitId (
          id,
          name,
          abbreviation
        )
      `)
      .single();

    if (error) {
      console.error('Error actualizando unidad de medida:', error);
      throw new Error('Error al actualizar la unidad de medida');
    }

    revalidatePath('/dashboard/configuration/units');
    return data;
  } catch (error) {
    console.error('Error en updateUnitMeasure:', error);
    throw error;
  }
}

/**
 * Eliminar unidad de medida
 */
export async function deleteUnitMeasure(id: number): Promise<void> {
  const supabase = createClient();
  
  try {
    // Verificar que no sea una unidad del sistema
    const { data: unit } = await supabase
      .from('UnitMeasure')
      .select('isDefault, name')
      .eq('id', id)
      .single();

    if (unit?.isDefault) {
      throw new Error('No se pueden eliminar las unidades del sistema');
    }

    // Verificar que no esté siendo usada en productos
    const { data: productUsage } = await supabase
      .from('Product')
      .select('id')
      .or(`salesunitid.eq.${id},purchaseunitid.eq.${id}`)
      .limit(1);

    if (productUsage && productUsage.length > 0) {
      throw new Error('No se puede eliminar la unidad porque está siendo usada en productos');
    }

    // Verificar que no esté siendo usada como unidad base
    const { data: baseUsage } = await supabase
      .from('UnitMeasure')
      .select('id')
      .eq('baseUnitId', id)
      .limit(1);

    if (baseUsage && baseUsage.length > 0) {
      throw new Error('No se puede eliminar la unidad porque es usada como base de otras unidades');
    }

    // Eliminar
    const { error } = await supabase
      .from('UnitMeasure')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error eliminando unidad de medida:', error);
      throw new Error('Error al eliminar la unidad de medida');
    }

    revalidatePath('/dashboard/configuration/units');
  } catch (error) {
    console.error('Error en deleteUnitMeasure:', error);
    throw error;
  }
}

/**
 * Server action para eliminar unidad (compatible con formularios)
 */
export async function deleteUnitMeasureAction(formData: FormData) {
  const id = parseInt(formData.get('id') as string);
  await deleteUnitMeasure(id);
}

/**
 * Obtener unidades base disponibles para conversión
 */
export async function getBaseUnits(): Promise<UnitMeasure[]> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('UnitMeasure')
      .select('*')
      .is('baseUnitId', null)
      .eq('isActive', true)
      .order('category')
      .order('name');

    if (error) {
      console.error('Error obteniendo unidades base:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error en getBaseUnits:', error);
    return [];
  }
}

/**
 * Obtener unidades por categoría
 */
export async function getUnitsByCategory(category: string): Promise<UnitMeasure[]> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('UnitMeasure')
      .select('*')
      .eq('category', category)
      .eq('isActive', true)
      .order('name');

    if (error) {
      console.error('Error obteniendo unidades por categoría:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error en getUnitsByCategory:', error);
    return [];
  }
}

/**
 * Convertir cantidad entre unidades
 */
export async function convertUnits(
  quantity: number, 
  fromUnitId: number, 
  toUnitId: number,
  productId?: number
): Promise<number> {
  const supabase = createClient();
  
  try {
    // Si son la misma unidad, no hay conversión
    if (fromUnitId === toUnitId) {
      return quantity;
    }

    // Primero intentar conversión específica por producto
    if (productId) {
      const { data: productConversion } = await supabase
        .from('ProductUnitConversion')
        .select('conversionFactor')
        .eq('productId', productId)
        .eq('purchaseUnitId', fromUnitId)
        .eq('saleUnitId', toUnitId)
        .eq('isActive', true)
        .single();

      if (productConversion) {
        return quantity * productConversion.conversionFactor;
      }
    }

    // Usar función de la base de datos para conversión estándar
    const { data, error } = await supabase
      .rpc('calculate_unit_conversion', {
        quantity,
        from_unit_id: fromUnitId,
        to_unit_id: toUnitId
      });

    if (error) {
      console.error('Error en conversión de unidades:', error);
      return quantity; // Retornar cantidad original si hay error
    }

    return data || quantity;
  } catch (error) {
    console.error('Error en convertUnits:', error);
    return quantity;
  }
}

/**
 * Crear conversión específica por producto
 */
export async function createProductUnitConversion(formData: ProductUnitConversionFormData): Promise<ProductUnitConversion> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('ProductUnitConversion')
      .insert({
        productId: formData.productId,
        purchaseUnitId: formData.purchaseUnitId,
        saleUnitId: formData.saleUnitId,
        conversionFactor: formData.conversionFactor,
        conversionFormula: formData.conversionFormula,
        isActive: formData.isActive ?? true
      })
      .select(`
        *,
        purchaseUnit:purchaseUnitId (
          id,
          name,
          abbreviation
        ),
        saleUnit:saleUnitId (
          id,
          name,
          abbreviation
        )
      `)
      .single();

    if (error) {
      console.error('Error creando conversión de producto:', error);
      throw new Error('Error al crear la conversión del producto');
    }

    return data;
  } catch (error) {
    console.error('Error en createProductUnitConversion:', error);
    throw error;
  }
} 