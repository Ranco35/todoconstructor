"use server";

import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '@/lib/supabase-server';

async function getSupabaseClient() {
  // Usar el cliente centralizado que preserva la sesión autenticada en Server Actions
  return await getSupabaseServerClient();
}

export interface Warehouse {
  id: number;
  name: string;
  description: string | null;
  location: string | null;
  type: string;
  capacity: number | null;
  costCenterId: number | null;
  isActive: boolean;
  parentId: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface WarehouseWithCount extends Warehouse {
  Parent?: {
    id: number;
    name: string;
  } | null;
  Children?: Array<{
    id: number;
    name: string;
  }>;
  _count?: {
    Warehouse_Product: number;
    Inventory: number;
    Children: number;
  };
}

export interface WarehouseProduct {
  id: number;
  warehouseId: number;
  productId: number;
  quantity: number;
  minStock: number;
  maxStock: number;
  createdAt?: string;
  updatedAt?: string;
  Product?: {
    id: number;
    name: string;
    sku?: string;
    barcode?: string;
    Category?: { name: string } | null;
    Supplier?: { name: string } | null;
  };
}

// === FUNCIONES BÁSICAS DE BODEGAS ===

export async function getAllWarehouses(): Promise<Warehouse[]> {
  try {
    const supabase = await getSupabaseClient();
    
    const { data, error } = await supabase
      .from('Warehouse')
      .select('*')
      .order('name');
    
    if (error) {
      // Si la tabla no existe aún, devolver lista vacía silenciosamente
      if ((error as any)?.code === '42P01' || /does not exist/i.test((error as any)?.message || '')) {
        console.warn('⚠️ Tabla Warehouse no existe todavía. Retornando lista vacía.');
        return [];
      }
      console.error('Error obteniendo bodegas:', error);
      throw new Error(`Error obteniendo bodegas: ${error.message}`);
    }
    
    return data || [];
  } catch (error) {
    console.error('Error en getAllWarehouses:', error);
    throw error;
  }
}

// Obtener bodegas con paginación y conteos
export async function getWarehouses(params?: { page?: number; pageSize?: number }) {
  try {
    const supabase = await getSupabaseClient();
    
    // Si no se proporcionan parámetros, usar función simple para compatibilidad
    if (!params) {
      const warehouses = await getAllWarehouses();
      return { data: warehouses, success: true, totalCount: warehouses.length };
    }

    const { page = 1, pageSize = 10 } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Obtener bodegas con conteos y relaciones
    const { data: warehouses, error, count } = await supabase
      .from('Warehouse')
      .select(`
        *,
        Parent:parentId (
          id,
          name
        ),
        Children:Warehouse!parentId (
          id,
          name
        )
      `, { count: 'exact' })
      .range(from, to)
      .order('name');

    if (error) {
      const err: any = error as any;
      const code = err?.code;
      const msg = err?.message || '';
      const isMissing = code === '42P01' || /does not exist/i.test(msg) || (!code && !msg);
      if (isMissing) {
        console.warn('⚠️ Tabla Warehouse no disponible o error vacío; devolviendo lista vacía.');
        return { data: [], success: true, totalCount: 0 };
      }
      console.error('Error obteniendo bodegas:', error);
      throw new Error(`Error obteniendo bodegas: ${err?.message || err?.code || 'desconocido'}`);
    }

    // Para cada bodega, obtener conteos de productos, inventarios y bodegas hijas
    const warehousesWithCounts = await Promise.all(
      (warehouses || []).map(async (warehouse) => {
        // Contar productos asignados
        const { count: productCount } = await supabase
          .from('Warehouse_Product')
          .select('*', { count: 'exact', head: true })
          .eq('warehouseId', warehouse.id);

        // Contar inventarios
        const { count: inventoryCount } = await supabase
          .from('Inventory')
          .select('*', { count: 'exact', head: true })
          .eq('warehouseId', warehouse.id);

        // Contar bodegas hijas
        const { count: childrenCount } = await supabase
          .from('Warehouse')
          .select('*', { count: 'exact', head: true })
          .eq('parentId', warehouse.id);

        return {
          ...warehouse,
          _count: {
            Warehouse_Product: productCount || 0,
            Inventory: inventoryCount || 0,
            Children: childrenCount || 0,
          }
        };
      })
    );

    return { 
      data: warehousesWithCounts, 
      success: true, 
      totalCount: count || 0 
    };
  } catch (error: any) {
    return { data: [], success: false, error: error.message, totalCount: 0 };
  }
}

export async function getWarehouseById(id: number): Promise<Warehouse | null> {
  try {
    const supabase = await getSupabaseClient();
    
    const { data, error } = await supabase
      .from('Warehouse')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error obteniendo bodega:', error);
      throw new Error(`Error obteniendo bodega: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error en getWarehouseById:', error);
    throw error;
  }
}

export async function getWarehousesForParent(parentId?: number | null): Promise<Warehouse[]> {
  try {
    const supabase = await getSupabaseClient();
    
    let query = supabase
      .from('Warehouse')
      .select('*')
      .order('name');
    
    if (parentId === null || parentId === undefined) {
      query = query.is('parentId', null);
    } else {
      query = query.eq('parentId', parentId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error obteniendo bodegas por padre:', error);
      throw new Error(`Error obteniendo bodegas por padre: ${error.message}`);
    }
    
    return data || [];
  } catch (error) {
    console.error('Error en getWarehousesForParent:', error);
    throw error;
  }
}

// Función para crear bodega desde objeto (uso programático)
export async function createWarehouseFromData(warehouseData: Omit<Warehouse, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const supabase = await getSupabaseClient();
    
    // Algunas instalaciones no tienen columnas opcionales: omitirlas si existen
    const { capacity: _omitCapacity, costCenterId: _omitCostCenter, ...dataToInsert } = (warehouseData as any) || {};

    const { data, error } = await supabase
      .from('Warehouse')
      .insert(dataToInsert)
      .select()
      .single();
    
    if (error) {
      console.error('Error creando bodega:', error);
      throw new Error(`Error creando bodega: ${error.message}`);
    }
    
    revalidatePath('/dashboard/configuration/inventory/warehouses');
    return { data, success: true, message: 'Bodega creada exitosamente' };
  } catch (error: any) {
    console.error('Error en createWarehouseFromData:', error);
    return { success: false, error: error.message };
  }
}

// Función para crear bodega desde FormData (uso en formularios)
export async function createWarehouse(formData: FormData) {
  try {
    const supabase = await getSupabaseClient();
    
    // Extraer datos del FormData
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const location = formData.get('location') as string;
    const type = formData.get('type') as string;
    const parentIdStr = formData.get('parentId') as string;
    
    // Validar campos requeridos
    if (!name || !name.trim()) {
      return { success: false, error: 'El nombre de la bodega es requerido' };
    }
    
    if (!location || !location.trim()) {
      return { success: false, error: 'La ubicación de la bodega es requerida' };
    }
    
    if (!type || !type.trim()) {
      return { success: false, error: 'El tipo de bodega es requerido' };
    }
    
    // Preparar datos para insertar
    const warehouseData = {
      name: name.trim(),
      description: description?.trim() || null,
      location: location.trim(),
      type: type.trim(),
      parentId: parentIdStr && parentIdStr !== '' ? parseInt(parentIdStr) : null,
      costCenterId: null,
      isActive: true
    };
    
    console.log('📝 Datos de bodega a crear:', warehouseData);
    
    // Algunas instalaciones no tienen columnas opcionales: omitirlas explícitamente
    const { capacity: _omitCapacity, costCenterId: _omitCostCenter, ...dataToInsert } = (warehouseData as any);

    const { data, error } = await supabase
      .from('Warehouse')
      .insert(dataToInsert)
      .select()
      .single();
    
    if (error) {
      console.error('Error creando bodega:', error);
      throw new Error(`Error creando bodega: ${error.message}`);
    }
    
    console.log('✅ Bodega creada exitosamente:', data);
    revalidatePath('/dashboard/configuration/inventory/warehouses');
    return { data, success: true, message: 'Bodega creada exitosamente' };
  } catch (error: any) {
    console.error('Error en createWarehouse:', error);
    return { success: false, error: error.message };
  }
}

export async function updateWarehouse(id: number, warehouseData: Partial<Warehouse>) {
  try {
    const supabase = await getSupabaseClient();
    
    const { data, error } = await supabase
      .from('Warehouse')
      .update(warehouseData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error actualizando bodega:', error);
      throw new Error(`Error actualizando bodega: ${error.message}`);
    }
    
    revalidatePath('/dashboard/configuration/inventory/warehouses');
    return { data, success: true, message: 'Bodega actualizada exitosamente' };
  } catch (error: any) {
    console.error('Error en updateWarehouse:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteWarehouseAction(id: number) {
  try {
    const supabase = await getSupabaseClient();
    
    // Verificar si la bodega tiene productos asignados
    const { data: products } = await supabase
      .from('Warehouse_Product')
      .select('id')
      .eq('warehouseId', id)
      .limit(1);
    
    if (products && products.length > 0) {
      return { 
        success: false, 
        error: 'No se puede eliminar la bodega porque tiene productos asignados. Remueva los productos primero.' 
      };
    }
    
    const { error } = await supabase
      .from('Warehouse')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error eliminando bodega:', error);
      throw new Error(`Error eliminando bodega: ${error.message}`);
    }
    
    revalidatePath('/dashboard/configuration/inventory/warehouses');
    return { success: true, message: 'Bodega eliminada exitosamente' };
  } catch (error: any) {
    console.error('Error en deleteWarehouseAction:', error);
    return { success: false, error: error.message };
  }
}

// === FUNCIONES DE PRODUCTOS EN BODEGAS ===

export async function getProductsByWarehouse(
  warehouseId: number, 
  params?: { page?: number; pageSize?: number; search?: string; stockFilter?: 'all' | 'withStock' | 'withoutStock' | 'negative' }
): Promise<{ data: WarehouseProduct[]; totalCount: number }> {
  try {
    const supabase = await getSupabaseClient();
    
    // Si no hay parámetros, usar función simple
    if (!params) {
      const { data, error } = await supabase
        .from('Warehouse_Product')
        .select(`
          *,
          Product!inner (
            id,
            name,
            sku,
            barcode,
            Category (
              name
            ),
            Supplier (
              name
            )
          )
        `)
        .eq('warehouseId', warehouseId)
        .order('id');
      
      if (error) {
        console.error('Error obteniendo productos de bodega:', error);
        throw new Error(`Error obteniendo productos de bodega: ${error.message}`);
      }
      
      return { data: data || [], totalCount: data?.length || 0 };
    }

    const { page = 1, pageSize = 10, search = '', stockFilter = 'all' } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('Warehouse_Product')
      .select(`
        *,
        Product!inner (
          id,
          name,
          sku,
          barcode,
          Category (
            name
          ),
          Supplier (
            name
          )
        )
      `, { count: 'exact' })
      .eq('warehouseId', warehouseId);

    // Aplicar filtro de búsqueda si existe
    if (search) {
      // Buscar en nombre del producto
      query = query.ilike('Product.name', `%${search}%`);
    }

    // Aplicar filtro de stock
    if (stockFilter === 'withStock') {
      query = query.gt('quantity', 0);
    } else if (stockFilter === 'withoutStock') {
      query = query.eq('quantity', 0);
    } else if (stockFilter === 'negative') {
      query = query.lt('quantity', 0);
    }

    const { data, error, count } = await query
      .range(from, to)
      .order('id');
    
    if (error) {
      console.error('Error obteniendo productos de bodega:', error);
      throw new Error(`Error obteniendo productos de bodega: ${error.message}`);
    }
    
    return { data: data || [], totalCount: count || 0 };
  } catch (error) {
    console.error('Error en getProductsByWarehouse:', error);
    throw error;
  }
}

export async function getUnassignedProducts(
  warehouseId?: number, 
  params?: { search?: string }
): Promise<{ data: any[]; totalCount: number }> {
  try {
    const supabase = await getSupabaseClient();
    
    let query = supabase
      .from('Product')
      .select(`
        id,
        name,
        sku,
        barcode,
        Category (
          name
        ),
        Supplier (
          name
        )
      `, { count: 'exact' });

    // Si se especifica una bodega, obtener productos NO asignados a esa bodega específica
    if (warehouseId) {
      query = query.not('id', 'in', `(
        SELECT DISTINCT productId 
        FROM "Warehouse_Product" 
        WHERE "warehouseId" = ${warehouseId}
      )`);
    } else {
      // Si no se especifica bodega, obtener productos no asignados a ninguna bodega
      query = query.not('id', 'in', `(
        SELECT DISTINCT productId 
        FROM "Warehouse_Product"
      )`);
    }

    // Aplicar filtro de búsqueda si existe
    if (params?.search) {
      const searchTerm = params.search;
      query = query.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%,barcode.ilike.%${searchTerm}%`);
    }

    const { data, error, count } = await query.order('name');
    
    if (error) {
      console.error('Error obteniendo productos no asignados:', error);
      throw new Error(`Error obteniendo productos no asignados: ${error.message}`);
    }
    
    return { data: data || [], totalCount: count || 0 };
  } catch (error) {
    console.error('Error en getUnassignedProducts:', error);
    throw error;
  }
}

// === FUNCIONES DE ASIGNACIÓN ===

export async function assignProductToWarehouse(
  productId: number, 
  warehouseId: number, 
  options: { quantity?: number; minStock?: number; maxStock?: number } = {}
) {
  try {
    const supabase = await getSupabaseClient();
    
    const { quantity = 0, minStock = 0, maxStock = 100 } = options;
    
    // Verificar si ya existe la asignación
    const { data: existing } = await supabase
      .from('Warehouse_Product')
      .select('id')
      .eq('productId', productId)
      .eq('warehouseId', warehouseId)
      .single();
    
    if (existing) {
      throw new Error('El producto ya está asignado a esta bodega');
    }
    
    const { data, error } = await supabase
      .from('Warehouse_Product')
      .insert({
        productId,
        warehouseId,
        quantity,
        minStock,
        maxStock
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error asignando producto a bodega:', error);
      throw new Error(`Error asignando producto a bodega: ${error.message}`);
    }
    
    return { data, success: true, message: 'Producto asignado exitosamente' };
  } catch (error: any) {
    console.error('Error en assignProductToWarehouse:', error);
    throw error;
  }
}

export async function assignProductToMultipleWarehouses(
  productId: number,
  assignments: Array<{ warehouseId: number; quantity?: number; minStock?: number; maxStock?: number }>
) {
  try {
    const supabase = await getSupabaseClient();
    
    const results = [];
    const summary = { success: 0, errors: 0 };
    
    for (const assignment of assignments) {
      try {
        const result = await assignProductToWarehouse(productId, assignment.warehouseId, {
          quantity: assignment.quantity || 0,
          minStock: assignment.minStock || 0,
          maxStock: assignment.maxStock || 100
        });
        results.push({ warehouseId: assignment.warehouseId, success: true, data: result.data });
        summary.success++;
      } catch (error: any) {
        results.push({ warehouseId: assignment.warehouseId, success: false, error: error.message });
        summary.errors++;
      }
    }
    
    return { results, summary, success: true };
  } catch (error: any) {
    console.error('Error en assignProductToMultipleWarehouses:', error);
    throw error;
  }
}

export async function bulkAssignProductsToWarehouse(
  warehouseId: number,
  assignments: Array<{ productId: number; quantity?: number; minStock?: number; maxStock?: number }>
) {
  try {
    const supabase = await getSupabaseClient();
    
    const results = [];
    const summary = { success: 0, errors: 0 };
    
    for (const assignment of assignments) {
      try {
        const result = await assignProductToWarehouse(assignment.productId, warehouseId, {
          quantity: assignment.quantity || 0,
          minStock: assignment.minStock || 0,
          maxStock: assignment.maxStock || 100
        });
        results.push({ productId: assignment.productId, success: true, data: result.data });
        summary.success++;
      } catch (error: any) {
        results.push({ productId: assignment.productId, success: false, error: error.message });
        summary.errors++;
      }
    }
    
    return { results, summary, success: true };
  } catch (error: any) {
    console.error('Error en bulkAssignProductsToWarehouse:', error);
    throw error;
  }
}

// === FUNCIONES DE ACTUALIZACIÓN Y ELIMINACIÓN ===

export async function updateProductStockInWarehouse(
  productId: number,
  warehouseId: number,
  updates: { quantity?: number; minStock?: number; maxStock?: number }
) {
  try {
    const supabase = await getSupabaseClient();
    
    const { data, error } = await supabase
      .from('Warehouse_Product')
      .update(updates)
      .eq('productId', productId)
      .eq('warehouseId', warehouseId)
      .select()
      .single();
    
    if (error) {
      console.error('Error actualizando stock:', error);
      throw new Error(`Error actualizando stock: ${error.message}`);
    }
    
    return { data, success: true, message: 'Stock actualizado exitosamente' };
  } catch (error: any) {
    console.error('Error en updateProductStockInWarehouse:', error);
    throw error;
  }
}

export async function removeProductFromWarehouse(productId: number, warehouseId: number) {
  try {
    const supabase = await getSupabaseClient();
    
    const { error } = await supabase
      .from('Warehouse_Product')
      .delete()
      .eq('productId', productId)
      .eq('warehouseId', warehouseId);
    
    if (error) {
      console.error('Error removiendo producto de bodega:', error);
      throw new Error(`Error removiendo producto de bodega: ${error.message}`);
    }
    
    return { success: true, message: 'Producto removido de la bodega exitosamente' };
  } catch (error: any) {
    console.error('Error en removeProductFromWarehouse:', error);
    throw error;
  }
}

 