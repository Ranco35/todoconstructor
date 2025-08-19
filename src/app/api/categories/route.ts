import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getCategoryTableName } from '@/lib/table-resolver';

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    
    const primaryTable = await getCategoryTableName(supabase as any);
    const fallbacks = [primaryTable, primaryTable === 'category' ? 'Category' : 'category'];
    let categories: any[] | null = null;
    let lastError: any = null;

    for (const tableName of fallbacks) {
      console.log('[API /categories] Trying table:', tableName);
      const { data, error } = await (supabase as any)
        .from(tableName)
        .select('*');
      if (!error) {
        categories = data || [];
        break;
      }
      lastError = error;
      const errMsg: string = error?.message || '';
      const errCode: string = error?.code || '';
      const isRelationMissing = errCode === '42P01' || /relation .* does not exist/i.test(errMsg);
      if (!isRelationMissing) {
        // Error distinto: no seguir intentando
        break;
      }
    }

    if (!categories) {
      throw new Error(`Error obteniendo categorías: ${lastError?.message || 'desconocido'}`);
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

    // Ordenar por nombre del padre primero, luego por nombre de la categoría
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

    return NextResponse.json(sortedCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor al obtener categorías.' },
      { status: 500 }
    );
  }
} 