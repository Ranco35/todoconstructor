'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseClient } from '@/lib/supabase-server';

export async function getSupplierTags(tipoAplicacion?: 'todos' | 'EMPRESA_INDIVIDUAL' | 'SOCIEDAD_ANONIMA') {
  try {
    const supabase = await getSupabaseClient();
    let query = supabase
      .from('SupplierTag')
      .select('*')
      .eq('activo', true);

    if (tipoAplicacion && tipoAplicacion !== 'todos') {
      query = query.eq('tipoAplicacion', tipoAplicacion);
    }

    const { data: tags, error } = await query
      .order('esSistema', { ascending: false })
      .order('orden', { ascending: true })
      .order('nombre', { ascending: true });

    if (error) throw error;

    return { success: true, data: tags || [] };
  } catch (error) {
    console.error('Error fetching supplier tags:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener las etiquetas'
    };
  }
}

export async function getSupplierTagsBySupplier(supplierId: number) {
  try {
    const supabase = await getSupabaseClient();
    const { data: assignments, error } = await supabase
      .from('SupplierTagAssignment')
      .select(`
        *,
        etiqueta:SupplierTag(*)
      `)
      .eq('supplierId', supplierId);

    if (error) throw error;

    return { success: true, data: assignments || [] };
  } catch (error) {
    console.error('Error fetching supplier tags by supplier:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener las etiquetas del proveedor'
    };
  }
}

export async function assignTagsToSupplier(supplierId: number, tagIds: number[]) {
  try {
    const supabase = await getSupabaseClient();
    
    // Primero eliminar todas las asignaciones existentes
    const { error: deleteError } = await supabase
      .from('SupplierTagAssignment')
      .delete()
      .eq('supplierId', supplierId);

    if (deleteError) throw deleteError;

    // Si no hay etiquetas para asignar, terminar aquí
    if (tagIds.length === 0) {
      revalidatePath('/dashboard/suppliers');
      return { success: true, data: [] };
    }

    // Crear nuevas asignaciones
    const assignments = tagIds.map(tagId => ({
      supplierId,
      etiquetaId: tagId
    }));

    const { data: newAssignments, error: insertError } = await supabase
      .from('SupplierTagAssignment')
      .insert(assignments)
      .select(`
        *,
        etiqueta:SupplierTag(*)
      `);

    if (insertError) throw insertError;

    revalidatePath('/dashboard/suppliers');
    return { success: true, data: newAssignments || [] };
  } catch (error) {
    console.error('Error assigning tags to supplier:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al asignar etiquetas al proveedor'
    };
  }
}

export async function createSupplierTag(tagData: {
  nombre: string;
  descripcion?: string;
  color?: string;
  icono?: string;
  tipoAplicacion?: 'todos' | 'EMPRESA_INDIVIDUAL' | 'SOCIEDAD_ANONIMA';
  orden?: number;
  activo?: boolean;
  esSistema?: boolean;
}) {
  try {
    const supabase = await getSupabaseClient();
    
    // Verificar que el nombre sea único
    const { data: existingTag } = await supabase
      .from('SupplierTag')
      .select('*')
      .eq('nombre', tagData.nombre)
      .single();

    if (existingTag) {
      return {
        success: false,
        error: 'Ya existe una etiqueta con ese nombre'
      };
    }

    const { data: tag, error } = await supabase
      .from('SupplierTag')
      .insert({
        nombre: tagData.nombre,
        descripcion: tagData.descripcion,
        color: tagData.color || '#F59E0B',
        icono: tagData.icono || 'truck',
        tipoAplicacion: tagData.tipoAplicacion || 'todos',
        orden: tagData.orden || 0,
        activo: tagData.activo !== undefined ? tagData.activo : true,
        esSistema: tagData.esSistema !== undefined ? tagData.esSistema : false
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/suppliers');
    revalidatePath('/dashboard/configuration/tags');
    return { success: true, data: tag };
  } catch (error) {
    console.error('Error creating supplier tag:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al crear la etiqueta'
    };
  }
}

export async function updateSupplierTag(
  id: number, 
  tagData: {
    nombre?: string;
    descripcion?: string;
    color?: string;
    icono?: string;
    tipoAplicacion?: 'todos' | 'EMPRESA_INDIVIDUAL' | 'SOCIEDAD_ANONIMA';
    orden?: number;
    activo?: boolean;
    esSistema?: boolean;
  }
) {
  try {
    const supabase = await getSupabaseClient();
    
    // Verificar que la etiqueta existe
    const { data: existingTag, error: checkError } = await supabase
      .from('SupplierTag')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError || !existingTag) {
      return {
        success: false,
        error: 'Etiqueta no encontrada'
      };
    }

    // Verificar que el nombre sea único si se está cambiando
    if (tagData.nombre && tagData.nombre !== existingTag.nombre) {
      const { data: duplicateTag } = await supabase
        .from('SupplierTag')
        .select('*')
        .eq('nombre', tagData.nombre)
        .single();

      if (duplicateTag) {
        return {
          success: false,
          error: 'Ya existe una etiqueta con ese nombre'
        };
      }
    }

    const { data: tag, error } = await supabase
      .from('SupplierTag')
      .update(tagData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/dashboard/suppliers');
    revalidatePath('/dashboard/configuration/tags');
    return { success: true, data: tag };
  } catch (error) {
    console.error('Error updating supplier tag:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al actualizar la etiqueta'
    };
  }
}

export async function deleteSupplierTag(id: number) {
  try {
    const supabase = await getSupabaseClient();
    
    // Verificar que la etiqueta existe
    const { data: existingTag, error: checkError } = await supabase
      .from('SupplierTag')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError || !existingTag) {
      return {
        success: false,
        error: 'Etiqueta no encontrada'
      };
    }

    // Verificar si hay proveedores usando esta etiqueta
    const { count: suppliersWithTag } = await supabase
      .from('SupplierTagAssignment')
      .select('*', { count: 'exact', head: true })
      .eq('etiquetaId', id);

    if (suppliersWithTag && suppliersWithTag > 0) {
      return {
        success: false,
        error: `No se puede eliminar la etiqueta porque ${suppliersWithTag} proveedor(es) la están usando`
      };
    }

    const { error } = await supabase
      .from('SupplierTag')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/dashboard/suppliers');
    revalidatePath('/dashboard/configuration/tags');
    return { success: true };
  } catch (error) {
    console.error('Error deleting supplier tag:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al eliminar la etiqueta'
    };
  }
} 