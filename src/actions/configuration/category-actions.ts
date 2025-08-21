// app/actions/category-actions.ts
'use server';

import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { CategoryImportData } from "@/lib/import-parsers";
import { getCategoryTableName } from '@/lib/table-resolver';

async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );
}

async function getSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null as any;
  return createClient(url, key);
}

// Helper para generar un slug simple
// const generateSlug = (name: string) => {
//   return name
//     .toLowerCase()
//     .replace(/[^a-z0-9\s-]/g, '')
//     .replace(/\s+/g, '-')
//     .replace(/-+/g, '-');
// };

// --- CREAR CATEGORÍA ---
export async function createCategory(formData: FormData) {
  const supabase = await getSupabaseClient();
  const categoryTable = (process.env.NEXT_PUBLIC_CATEGORY_TABLE_NAME || 'Category') as string;
  
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const parentId = formData.get('parentId') as string;

  if (!name || name.trim() === '') {
    throw new Error('El nombre de la categoría es requerido.');
  }

  // Validar que el nombre no sea muy largo
  if (name.trim().length > 100) {
    throw new Error('El nombre de la categoría no puede tener más de 100 caracteres.');
  }

  // Validar parentId si se proporciona
  let parsedParentId: number | null = null;
  if (parentId && parentId !== '') {
    parsedParentId = parseInt(parentId);
    if (isNaN(parsedParentId)) {
      throw new Error('El ID de la categoría padre es inválido.');
    }
    
    // Verificar que la categoría padre existe
    const { data: parentCategory, error: parentError } = await (supabase as any)
      .from(categoryTable)
      .select('id')
      .eq('id', parsedParentId)
      .single();
    
    if (parentError || !parentCategory) {
      throw new Error('La categoría padre seleccionada no existe.');
    }
  }

  try {
    const { error } = await (supabase as any)
      .from(categoryTable)
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        parentId: parsedParentId,
      });

    if (error && (error as any).code) {
      console.error('❌ Supabase insert Category error:', error || '(null)');
      if (error.code === '23505') { // Unique violation
        throw new Error('Ya existe una categoría con ese nombre.');
      }
      if (error.code === '23503') { // Foreign key violation
        throw new Error('La categoría padre seleccionada no existe.');
      }
      // Intentar con Service Role como fallback si es problema de permisos/RLS
      try {
        const svc = await getSupabaseServiceClient();
        if (!svc) {
          const msg = (error as any)?.message || (error as any)?.hint || (error as any)?.details || 'Error desconocido en inserción (RLS/Permisos/Constraint)';
          throw new Error(msg);
        }
        const { error: srvErr } = await (svc as any)
          .from(categoryTable)
          .insert({
            name: name.trim(),
            description: description?.trim() || null,
            parentId: parsedParentId,
          });
        if (srvErr && (srvErr as any).code) {
          console.error('❌ Service insert Category error:', srvErr || '(null)');
          const srvMsg = (srvErr as any)?.message || (srvErr as any)?.hint || (srvErr as any)?.details || 'Error desconocido en inserción (Service)';
          throw new Error(srvMsg);
        }
      } catch (svcCatch: any) {
        throw new Error(`Error creando categoría: ${svcCatch?.message || svcCatch}`);
      }
    }
    
    revalidatePath('/dashboard/configuration/category');
    redirect('/dashboard/configuration/category?status=success&message=Categoría creada exitosamente.');
  } catch (error: any) {
    console.error('Error al crear categoría:', error);
    throw error;
  }
}

// --- ACTUALIZAR CATEGORÍA ---
export async function updateCategory(id: number, formData: FormData) {
  const supabase = await getSupabaseClient();
  const categoryTable = await getCategoryTableName(supabase as any);
  
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const parentId = formData.get('parentId') as string;

  if (!name || name.trim() === '') {
    throw new Error('El nombre de la categoría es requerido.');
  }

  // Validar que el nombre no sea muy largo
  if (name.trim().length > 100) {
    throw new Error('El nombre de la categoría no puede tener más de 100 caracteres.');
  }

  // Validar parentId si se proporciona
  let parsedParentId: number | null = null;
  if (parentId && parentId !== '') {
    parsedParentId = parseInt(parentId);
    if (isNaN(parsedParentId)) {
      throw new Error('El ID de la categoría padre es inválido.');
    }
    
    // Verificar que la categoría padre existe y no es la misma categoría
    if (parsedParentId === id) {
      throw new Error('Una categoría no puede ser su propia padre.');
    }
    
    const { data: parentCategory, error: parentError } = await (supabase as any)
      .from(categoryTable)
      .select('id')
      .eq('id', parsedParentId)
      .single();
    
    if (parentError || !parentCategory) {
      throw new Error('La categoría padre seleccionada no existe.');
    }
  }

  try {
    const { error } = await (supabase as any)
      .from(categoryTable)
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        parentId: parsedParentId,
      })
      .eq('id', id);

    if (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Ya existe una categoría con ese nombre.');
      }
      if (error.code === '23503') { // Foreign key violation
        throw new Error('La categoría padre seleccionada no existe.');
      }
      throw new Error(`Error actualizando categoría: ${error.message}`);
    }
    
    revalidatePath('/dashboard/configuration/category');
    redirect(`/dashboard/configuration/category?status=success&message=Categoría ${name} actualizada exitosamente.`);
  } catch (error: any) {
    console.error('Error al actualizar categoría:', error);
    throw error;
  }
}

// --- ELIMINAR CATEGORÍA ---
export async function deleteCategory(id: number) {
  try {
    const supabase = await getSupabaseClient();
    
    // Verificar si la categoría tiene productos asociados
    const categoryTable = await getCategoryTableName(supabase as any);
    const { data: categoryWithProducts, error: categoryError } = await (supabase as any)
      .from(categoryTable)
      .select('id, name')
      .eq('id', id)
      .single();

    if (categoryError || !categoryWithProducts) {
      return {
        success: false,
        error: 'La categoría no fue encontrada.'
      };
    }

    // PROTECCIÓN: No permitir eliminar categoría "Sistema Reservas"
    if (categoryWithProducts.name === 'Sistema Reservas') {
      return {
        success: false,
        error: 'No se puede eliminar la categoría "Sistema Reservas". Esta categoría es especial y solo se puede gestionar desde configuración de habitaciones.'
      };
    }

    // Verificar productos asociados
    const { count: productCount } = await supabase
      .from('Product')
      .select('*', { count: 'exact', head: true })
      .eq('categoryid', id);

    if (productCount && productCount > 0) {
      return {
        success: false,
        error: `No se puede eliminar la categoría "${categoryWithProducts.name}" porque tiene ${productCount} producto(s) asociado(s).`
      };
    }

    const { error: deleteError } = await (supabase as any)
      .from(categoryTable)
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw new Error(`Error eliminando categoría: ${deleteError.message}`);
    }
    
    revalidatePath('/dashboard/configuration/category');
    
    return {
      success: true,
      message: `Categoría "${categoryWithProducts.name}" eliminada exitosamente.`
    };
  } catch (error: any) {
    console.error('Error al eliminar categoría:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al eliminar la categoría.'
    };
  }
}

export async function deleteCategoryAction(formData: FormData) {
  try {
    const idValue = formData.get('id');
    if (!idValue) {
      return {
        success: false,
        error: 'ID de categoría requerido.'
      };
    }

    const id = parseInt(idValue as string);
    if (isNaN(id)) {
      return {
        success: false,
        error: 'ID de categoría inválido.'
      };
    }

    return await deleteCategory(id);
  } catch (error) {
    console.error('Error en deleteCategoryAction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al procesar la eliminación.'
    };
  }
}

// --- OBTENER CATEGORÍAS CON PAGINACIÓN Y CONTEO DE PRODUCTOS ---
interface GetCategoriesParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export async function getCategories({ page = 1, pageSize = 10, search }: GetCategoriesParams = {}) {
  const supabase = await getSupabaseClient();

  try {
    // Obtener todas las categorías sin paginación para ordenarlas correctamente
    const categoryTable = (process.env.NEXT_PUBLIC_CATEGORY_TABLE_NAME || 'Category') as string;
    let query = (supabase as any).from(categoryTable).select('*');
    let countQuery = (supabase as any).from(categoryTable).select('*', { count: 'exact', head: true });

    // Aplicar filtro de búsqueda si se proporciona
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      // Buscar en nombre y descripción
      query = query.or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`);
      countQuery = countQuery.or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`);
    }

    const [allCategoriesResult, totalResult] = await Promise.all([query, countQuery]);

    const allCategories = allCategoriesResult.data || [];
    const totalCount = totalResult.count || 0;

    // Agregar información del padre y conteo de productos
    const categoriesWithInfo = await Promise.all(
      allCategories.map(async (category) => {
        // Obtener conteo de productos
        const { count: productCount } = await (supabase as any)
          .from('Product')
          .select('*', { count: 'exact', head: true })
          .eq('categoryid', category.id);

        // Obtener información de la categoría padre si existe
        let parentInfo = null;
        if (category.parentId) {
          const { data: parentCategory } = await (supabase as any)
            .from(categoryTable)
            .select('name')
            .eq('id', category.parentId)
            .single();
          
          if (parentCategory) {
            parentInfo = { name: parentCategory.name };
          }
        }

        return {
          ...category,
          _count: {
            Product: productCount || 0
          },
          Parent: parentInfo
        };
      })
    );

    // Ordenar por nombre del padre primero, luego por nombre de la categoría
    const sortedCategories = categoriesWithInfo.sort((a, b) => {
      // Primer criterio: nombre del padre (categorías sin padre van primero)
      const parentNameA = a.Parent?.name || '';
      const parentNameB = b.Parent?.name || '';
      
      // Si ambas no tienen padre, ordenar por nombre de categoría
      if (!parentNameA && !parentNameB) {
        return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
      }
      
      // Si solo una no tiene padre, la que no tiene padre va primero
      if (!parentNameA && parentNameB) return -1;
      if (parentNameA && !parentNameB) return 1;
      
      // Si ambas tienen padre, comparar nombres de padres
      const parentComparison = parentNameA.localeCompare(parentNameB, 'es', { sensitivity: 'base' });
      
      // Si los padres son iguales, ordenar por nombre de categoría
      if (parentComparison === 0) {
        return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
      }
      
      return parentComparison;
    });

    // Aplicar paginación después del ordenamiento
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    const paginatedCategories = sortedCategories.slice(from, to);

    return {
      categories: paginatedCategories,
      totalCount,
      page,
      pageSize,
    };
  } catch (error) {
    console.error('Error al obtener categorías con paginación:', error);
    return {
      categories: [],
      totalCount: 0,
      page,
      pageSize,
    };
  }
}

// --- OBTENER UNA CATEGORÍA POR ID ---
export async function getCategoryById(id: number) {
  try {
    const supabase = await getSupabaseClient();
    
    const categoryTable = await getCategoryTableName(supabase as any);
    const { data: category, error } = await (supabase as any)
      .from(categoryTable)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Error obteniendo categoría: ${error.message}`);
    }

    // Agregar conteo de productos manualmente
    const { count: productCount } = await supabase
      .from('Product')
      .select('*', { count: 'exact', head: true })
      .eq('categoryid', id);

    return {
      ...category,
      _count: {
        Product: productCount || 0
      }
    };
  } catch (error) {
    console.error('Error al obtener categoría por ID:', error);
    return null;
  }
}

export interface ImportResult {
  success: boolean;
  message: string;
  created: number;
  updated: number;
  skipped: number;
}

export async function importCategories(categories: CategoryImportData[]): Promise<ImportResult> {
  const supabase = await getSupabaseClient();
  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  try {
    const categoryTable = await getCategoryTableName(supabase as any);
    const { data: allCategories, error: fetchError } = await (supabase as any)
      .from(categoryTable)
      .select('id, name');

    if (fetchError) {
      throw new Error(`Error obteniendo categorías: ${fetchError.message}`);
    }

    const idMap = new Map((allCategories || []).map(c => [c.id, c]));
    const nameMap = new Map((allCategories || []).map(c => [c.name.toLowerCase(), c]));

    const getParentId = (cat: CategoryImportData): number | null => {
      if (cat.parentId && idMap.has(cat.parentId)) {
        return cat.parentId;
      }
      if (cat.parentName && nameMap.has(cat.parentName.toLowerCase())) {
        return nameMap.get(cat.parentName.toLowerCase())!.id;
      }
      return null;
    };

    for (const cat of categories) {
      if (!cat.name) {
        skippedCount++;
        continue;
      }

      const parentId = getParentId(cat);
      const data = {
        name: cat.name,
        description: cat.description,
        parentId: parentId,
      };

      if (cat.id && idMap.has(cat.id)) {
        // Actualizar categoría existente
        const { error: updateError } = await (supabase as any)
          .from(categoryTable)
          .update(data)
          .eq('id', cat.id);

        if (updateError) {
          throw new Error(`Error actualizando categoría: ${updateError.message}`);
        }
        updatedCount++;
      } else if (!nameMap.has(cat.name.toLowerCase())) {
        // Crear nueva categoría
        const { data: newCategory, error: createError } = await (supabase as any)
          .from(categoryTable)
          .insert(data)
          .select()
          .single();

        if (createError) {
          throw new Error(`Error creando categoría: ${createError.message}`);
        }

        // Actualizar los mapas para las siguientes iteraciones
        if (newCategory) {
          idMap.set(newCategory.id, newCategory);
          nameMap.set(newCategory.name.toLowerCase(), newCategory);
        }
        createdCount++;
      } else {
        // Omitir (ya existe por nombre o id inválido)
        skippedCount++;
      }
    }

    revalidatePath('/dashboard/configuration/category');
    return {
      success: true,
      message: `Importación completada. ${createdCount} creadas, ${updatedCount} actualizadas, ${skippedCount} ignoradas.`,
      created: createdCount,
      updated: updatedCount,
      skipped: skippedCount,
    };

  } catch (error) {
    console.error("Error al importar categorías:", error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("Ocurrió un error desconocido durante la importación.");
  }
}

// --- OBTENER ESTADÍSTICAS PARA DASHBOARD ---
export async function getDashboardStats() {
  const supabase = await getSupabaseClient();
  
  try {
    // Obtener conteo total de categorías
    const categoryTable = await getCategoryTableName(supabase as any);
    const { count: totalCategories } = await (supabase as any)
      .from(categoryTable)
      .select('*', { count: 'exact', head: true });

    // Obtener conteo total de productos
    const { count: totalProducts } = await supabase
      .from('Product')
      .select('*', { count: 'exact', head: true });

    // Obtener productos activos (todos por ahora, hasta que se implemente isActive)
    const { count: activeProducts } = await supabase
      .from('Product')
      .select('*', { count: 'exact', head: true });

    // Obtener productos con stock bajo (usando Warehouse_Product)
    const { count: lowStockProducts } = await supabase
      .from('Warehouse_Product')
      .select('*', { count: 'exact', head: true })
      .lt('quantity', 10);

    // Obtener categorías con más productos
    const { data: topCategories } = await (supabase as any)
      .from(categoryTable)
      .select(`
        id,
        name,
        Product (count)
      `)
      .limit(5);

    return {
      totalCategories: totalCategories || 0,
      totalProducts: totalProducts || 0,
      activeProducts: activeProducts || 0,
      lowStockProducts: lowStockProducts || 0,
      topCategories: topCategories || []
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas del dashboard:', error);
    return {
      totalCategories: 0,
      totalProducts: 0,
      activeProducts: 0,
      lowStockProducts: 0,
      topCategories: []
    };
  }
}

// --- OBTENER TODAS LAS CATEGORÍAS (SIN PAGINACIÓN) ---
export async function getAllCategories() {
  const supabase = await getSupabaseClient();
  
  try {
    const categoryTable = (process.env.NEXT_PUBLIC_CATEGORY_TABLE_NAME || 'Category') as string;
    const { data: categories, error } = await (supabase as any)
      .from(categoryTable)
      .select('*');

    if (error) {
      throw new Error(`Error obteniendo todas las categorías: ${error.message}`);
    }

    const allCategories = categories || [];

    // Agregar información del padre para ordenamiento consistente
    const categoriesWithParent = await Promise.all(
      allCategories.map(async (category) => {
        let parentInfo = null;
        if (category.parentId) {
          const { data: parentCategory } = await (supabase as any)
            .from(categoryTable)
            .select('name')
            .eq('id', category.parentId)
            .single();
          
          if (parentCategory) {
            parentInfo = { name: parentCategory.name };
          }
        }

        return {
          ...category,
          Parent: parentInfo
        };
      })
    );

    // Aplicar el mismo ordenamiento que en getCategories
    const sortedCategories = categoriesWithParent.sort((a, b) => {
      // Primer criterio: nombre del padre (categorías sin padre van primero)
      const parentNameA = a.Parent?.name || '';
      const parentNameB = b.Parent?.name || '';
      
      // Si ambas no tienen padre, ordenar por nombre de categoría
      if (!parentNameA && !parentNameB) {
        return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
      }
      
      // Si solo una no tiene padre, la que no tiene padre va primero
      if (!parentNameA && parentNameB) return -1;
      if (parentNameA && !parentNameB) return 1;
      
      // Si ambas tienen padre, comparar nombres de padres
      const parentComparison = parentNameA.localeCompare(parentNameB, 'es', { sensitivity: 'base' });
      
      // Si los padres son iguales, ordenar por nombre de categoría
      if (parentComparison === 0) {
        return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
      }
      
      return parentComparison;
    });

    return sortedCategories;
  } catch (error) {
    console.error('Error al obtener todas las categorías:', error);
    return [];
  }
}

