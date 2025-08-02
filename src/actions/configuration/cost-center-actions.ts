'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { PostgrestError } from '@supabase/supabase-js';

// Interfaz para los parámetros de obtención
interface GetCostCentersParams {
  page?: number;
  pageSize?: number;
}

// --- MANEJO DE ERRORES ---
function handleError(error: PostgrestError | Error | any, context: string): never {
  console.error(`Error en ${context}:`, error);
  if (error && 'code' in error && error.code === '23505') { // Unique violation
    if (error.details?.includes('name')) {
      throw new Error('Ya existe un centro de costo con ese nombre.');
    }
    if (error.details?.includes('code')) {
      throw new Error('Ya existe un centro de costo con ese código.');
    }
  }
  const message = error?.message || `Error en ${context}. Inténtalo de nuevo.`;
  throw new Error(message);
}

// --- CREAR CENTRO DE COSTO ---
export async function createCostCenter(formData: FormData) {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const code = formData.get('code') as string;
  const parentId = formData.get('parentId') as string;

  if (!name || name.trim() === '') {
    throw new Error('El nombre del centro de costo es requerido.');
  }

  let parsedParentId: number | null = null;
  if (parentId && parentId !== '') {
    parsedParentId = parseInt(parentId);
    if (isNaN(parsedParentId)) {
      throw new Error('ID de centro de costo padre no válido.');
    }
    const { data: parentExists, error: parentError } = await (await getSupabaseServerClient()).from('Cost_Center')
      .select('id')
      .eq('id', parsedParentId)
      .single();
    if (parentError || !parentExists) {
      handleError(parentError || new Error('El centro de costo padre especificado no existe.'), 'verificando padre');
    }
  }

  if (code && code.trim() !== '') {
    const { data: existingCode, error: codeError } = await (await getSupabaseServerClient()).from('Cost_Center')
      .select('id')
      .eq('code', code.trim())
      .single();
    if (codeError && codeError.code !== 'PGRST116') {
      handleError(codeError, 'verificando código');
    }
    if (existingCode) {
      throw new Error('Ya existe un centro de costo con ese código.');
    }
  }

  const { error } = await (await getSupabaseServerClient()).from('Cost_Center')
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      code: code?.trim() || null,
      parentId: parsedParentId,
    });
  
  if (error) {
    handleError(error, 'creando centro de costo');
  }

  revalidatePath('/dashboard/configuration/cost-centers');
  redirect('/dashboard/configuration/cost-centers');
}

// --- ACTUALIZAR CENTRO DE COSTO ---
export async function updateCostCenter(id: number, formData: FormData) {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const code = formData.get('code') as string;
  const parentId = formData.get('parentId') as string;
  const isActive = formData.get('isActive') === 'true';

  if (!name || name.trim() === '') {
    throw new Error('El nombre del centro de costo es requerido.');
  }

  let parsedParentId: number | null = null;
  if (parentId && parentId !== '') {
    parsedParentId = parseInt(parentId);
    if (isNaN(parsedParentId)) {
      throw new Error('ID de centro de costo padre no válido.');
    }
    if (parsedParentId === id) {
      throw new Error('Un centro de costo no puede ser padre de sí mismo.');
    }
    const wouldCreateCycle = await checkForHierarchyCycle(id, parsedParentId);
    if (wouldCreateCycle) {
      throw new Error('Esta asignación crearía un ciclo jerárquico.');
    }
  }

  if (code && code.trim() !== '') {
    const { data: existingCode, error: codeError } = await (await getSupabaseServerClient()).from('Cost_Center')
      .select('id')
      .eq('code', code.trim())
      .not('id', 'eq', id)
      .single();
    if (codeError && codeError.code !== 'PGRST116') {
       handleError(codeError, 'verificando código al actualizar');
    }
    if (existingCode) {
      throw new Error('Ya existe otro centro de costo con ese código.');
    }
  }

  const { error } = await (await getSupabaseServerClient()).from('Cost_Center')
    .update({
      name: name.trim(),
      description: description?.trim() || null,
      code: code?.trim() || null,
      parentId: parsedParentId,
      isActive,
    })
    .eq('id', id);

  if (error) {
    handleError(error, 'actualizando centro de costo');
  }

  revalidatePath('/dashboard/configuration/cost-centers');
  redirect('/dashboard/configuration/cost-centers');
}

// --- FUNCIÓN AUXILIAR: VERIFICAR CICLOS JERÁRQUICOS ---
async function checkForHierarchyCycle(childId: number, potentialParentId: number): Promise<boolean> {
  let currentParentId: number | null = potentialParentId;

  while (currentParentId) {
    if (currentParentId === childId) {
      return true; // Ciclo detectado
    }
    const { data: parent, error } = await (await getSupabaseServerClient()).from('Cost_Center')
      .select('parentId')
      .eq('id', currentParentId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      handleError(error, 'verificando ciclo jerárquico');
    }
    
    currentParentId = parent?.parentId || null;
  }
  
  return false;
}

// --- ELIMINAR CENTRO DE COSTO ---
export async function deleteCostCenterAction(formData: FormData) {
  const id = parseInt(formData.get('id') as string);
  if (!id || isNaN(id)) {
    throw new Error('ID de centro de costo no válido');
  }

  // Verificar hijos
  const { data: children, error: childrenError } = await (await getSupabaseServerClient()).from('Cost_Center')
    .select('id', { count: 'exact' })
    .eq('parentId', id);
  if (childrenError) handleError(childrenError, 'verificando hijos');
  if (children && children.length > 0) {
    throw new Error('No se puede eliminar un centro de costo que tiene centros hijos. Primero reasigna o elimina los centros hijos.');
  }

  // Verificar relaciones (ejemplo con Productos, expandir si es necesario)
  const { data: products, error: productsError } = await (await getSupabaseServerClient()).from('Product')
    .select('id', { count: 'exact' })
    .eq('defaultCostCenterId', id);
  if (productsError) handleError(productsError, 'verificando productos');
  if (products && products.length > 0) {
    throw new Error(`No se puede eliminar el centro de costo porque tiene ${products.length} productos asociados.`);
  }

  // Realizar borrado
  const { error: deleteError } = await (await getSupabaseServerClient()).from('Cost_Center')
    .delete()
    .eq('id', id);

  if (deleteError) {
    handleError(deleteError, 'eliminando centro de costo');
  }

  revalidatePath('/dashboard/configuration/cost-centers');
}

// --- OBTENER CENTROS DE COSTO CON PAGINACIÓN ---
export async function getCostCenters({ page = 1, pageSize = 10 }: GetCostCentersParams = {}) {
  const skip = (page - 1) * pageSize;

  const { data, error, count } = await (await getSupabaseServerClient()).from('Cost_Center')
    .select(`
      id,
      name,
      description,
      code,
      isActive,
      createdAt,
      updatedAt,
      Parent:parentId (id, name, code),
      Children:Cost_Center!parentId(id, name),
      product_count:Product!defaultCostCenterId(count)
    `, { count: 'exact' })
    .range(skip, skip + pageSize - 1)
    .order('name', { ascending: true });

  if (error) {
    handleError(error, 'obteniendo centros de costo');
  }
  
  // Adaptar datos para que se parezcan a la estructura de Prisma
  const adaptedData = data?.map(cc => {
    const { product_count, ...rest } = cc as any;
    return {
      ...rest,
      _count: {
        Product: product_count?.[0]?.count || 0,
        Children: rest.Children?.length || 0,
        Sale: 0, // Dato estático hasta que se defina la relación
        Permission: 0, // Dato estático hasta que se defina la relación
      }
    }
  }) || [];

  return {
    costCenters: adaptedData,
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}


// --- OBTENER UN CENTRO DE COSTO POR ID ---
export async function getCostCenterById(id: number) {
  if (!id || isNaN(id)) {
    throw new Error('ID inválido');
  }

  const { data, error } = await (await getSupabaseServerClient()).from('Cost_Center')
    .select(`
      id,
      name,
      description,
      code,
      isActive,
      parentId,
      Parent:parentId(id, name, code)
    `)
    .eq('id', id)
    .single();

  if (error) {
    handleError(error, `obteniendo centro de costo con id ${id}`);
  }
  return data;
}

// --- OBTENER TODOS LOS CENTROS DE COSTO (para selectores) ---
export async function getCostCentersForParent(excludeId?: number) {
  let query = (await getSupabaseServerClient()).from('Cost_Center')
    .select('id, name, code, parentId')
    .order('name', { ascending: true });

  if (excludeId) {
    query = query.not('id', 'eq', excludeId);
  }

  const { data, error } = await query;
  
  if (error) {
    handleError(error, 'obteniendo lista de centros de costo');
  }
  
  return data || [];
}

// --- OBTENER CENTROS DE COSTO ACTIVOS ---
export async function getActiveCostCenters() {
  const { data, error } = await (await getSupabaseServerClient()).from('Cost_Center')
    .select('id, name, code')
    .eq('isActive', true)
    .order('name');
  
  if (error) {
    handleError(error, 'obteniendo centros de costo activos');
  }

  return data || [];
}

// --- OBTENER TODOS LOS CENTROS DE COSTO (ALIAS PARA COMPATIBILIDAD) ---
export async function getAllCostCenters() {
  const { data, error } = await (await getSupabaseServerClient()).from('Cost_Center')
    .select('id, name, code, description, isActive, parentId')
    .order('name', { ascending: true });
  
  if (error) {
    handleError(error, 'obteniendo todos los centros de costo');
  }

  return data || [];
}