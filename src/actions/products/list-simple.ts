'use server';

import { getSupabaseClient } from '@/lib/supabase-server';

interface PaginationParams {
  page?: string | number;
  pageSize?: string | number;
  search?: string;
  categoryId?: string | number;
  warehouseId?: string | number;
}

function sanitizeSearchTerm(search: string): string {
  // Sanitizar término de búsqueda para evitar caracteres problemáticos
  return search
    .trim()
    .replace(/[%_]/g, '') // Eliminar caracteres especiales de SQL
    .substring(0, 100); // Limitar longitud
}

// Función simplificada para obtener productos sin relaciones complejas
export async function getProducts(params: PaginationParams) {
  try {
    const supabase = await getSupabaseClient();
    const { page = 1, pageSize = 10, search, categoryId, warehouseId } = params;
    const currentPage = typeof page === 'string' ? parseInt(page) : page;
    const currentPageSize = typeof pageSize === 'string' ? parseInt(pageSize) : pageSize;
    const from = (currentPage - 1) * currentPageSize;
    const to = from + currentPageSize - 1;

    console.log('🔍 Parámetros de búsqueda:', { page: currentPage, pageSize: currentPageSize, search, categoryId, warehouseId });

    // Consulta base simplificada sin relaciones problemáticas
    let query = supabase
      .from('Product')
      .select(`
        id,
        name,
        sku,
        description,
        unit,
        saleprice,
        costprice,
        vat,
        isPOSEnabled,
        isForSale,
        salesunitid,
        purchaseunitid,
        categoryid,
        supplierid
      `, { count: 'exact' });

    // Aplicar filtros de búsqueda
    if (search) {
      const sanitizedSearch = sanitizeSearchTerm(search);
      console.log('🔍 Búsqueda original:', search);
      console.log('🧹 Búsqueda sanitizada:', sanitizedSearch);
      
      if (sanitizedSearch) {
        try {
          query = query.or(
            `name.ilike.%${sanitizedSearch}%,` +
            `sku.ilike.%${sanitizedSearch}%,` +
            `description.ilike.%${sanitizedSearch}%`
          );
        } catch (searchError) {
          console.error('❌ Error en búsqueda OR:', searchError);
          // Fallback a búsqueda simple
          query = query.ilike('name', `%${sanitizedSearch}%`);
        }
      }
    }

    // Aplicar filtro por categoría
    if (categoryId) {
      const categoryIdNumber = typeof categoryId === 'string' ? parseInt(categoryId) : categoryId;
      if (!isNaN(categoryIdNumber)) {
        query = query.eq('categoryid', categoryIdNumber);
      }
    }

    // Aplicar paginación
    query = query.range(from, to);

    // Ejecutar consulta
    const { data: products, error, count } = await query.order('name', { ascending: true });

    if (error) {
      console.error('❌ Error en consulta de productos:', error);
      throw new Error(`Error obteniendo productos: ${error.message || 'desconocido'}`);
    }

    console.log(`✅ Consulta exitosa: ${products?.length || 0} productos encontrados`);

    // Mapear productos al formato esperado
    const mappedProducts = (products || []).map(product => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      description: product.description,
      unit: product.unit,
      salePrice: product.saleprice,
      costPrice: product.costprice,
      vat: product.vat,
      isPOSEnabled: product.isPOSEnabled,
      isForSale: product.isForSale,
      salesUnitId: product.salesunitid,
      purchaseUnitId: product.purchaseunitid,
      categoryId: product.categoryid,
      supplierId: product.supplierid,
      // Campos por defecto para compatibilidad
      warehouseProducts: [],
      category: null,
      supplier: null
    }));

    return {
      products: mappedProducts,
      totalCount: count || 0
    };

  } catch (error: any) {
    console.error('❌ Error general en getProducts:', error);
    throw new Error(`Error obteniendo productos: ${error.message || 'Error desconocido'}`);
  }
}



