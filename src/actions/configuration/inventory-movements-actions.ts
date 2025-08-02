'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentUser } from './auth-actions';

export type MovementType = 'TRANSFER' | 'ENTRADA' | 'SALIDA' | 'AJUSTE';

export interface InventoryMovement {
  id: number;
  productId: number;
  fromWarehouseId?: number;
  toWarehouseId?: number;
  movementType: MovementType;
  quantity: number;
  reason?: string;
  notes?: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  Product?: {
    id: number;
    name: string;
    sku?: string;
    code?: string;
  };
  FromWarehouse?: {
    id: number;
    name: string;
    location: string;
  };
  ToWarehouse?: {
    id: number;
    name: string;
    location: string;
  };
  User?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface MovementFilters {
  productId?: number;
  warehouseId?: number;
  movementType?: MovementType;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

// --- CREAR MOVIMIENTO DE INVENTARIO ---
export async function createInventoryMovement(formData: FormData) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error('Usuario no autenticado');
  }

  const productId = parseInt(formData.get('productId') as string);
  const fromWarehouseId = formData.get('fromWarehouseId') as string;
  const toWarehouseId = formData.get('toWarehouseId') as string;
  const movementType = formData.get('movementType') as MovementType;
  const quantity = parseFloat(formData.get('quantity') as string);
  const reason = formData.get('reason') as string;
  const notes = formData.get('notes') as string;

  // Validaciones
  if (!productId || isNaN(productId)) {
    throw new Error('Producto es requerido');
  }

  if (!movementType || !['TRANSFER', 'ENTRADA', 'SALIDA', 'AJUSTE'].includes(movementType)) {
    throw new Error('Tipo de movimiento no válido');
  }

  if (!quantity || isNaN(quantity) || quantity <= 0) {
    throw new Error('Cantidad debe ser mayor a 0');
  }

  // Validar bodegas según el tipo de movimiento
  let parsedFromWarehouseId: number | null = null;
  let parsedToWarehouseId: number | null = null;

  if (fromWarehouseId && fromWarehouseId !== '') {
    parsedFromWarehouseId = parseInt(fromWarehouseId);
    if (isNaN(parsedFromWarehouseId)) {
      throw new Error('Bodega de origen no válida');
    }
  }

  if (toWarehouseId && toWarehouseId !== '') {
    parsedToWarehouseId = parseInt(toWarehouseId);
    if (isNaN(parsedToWarehouseId)) {
      throw new Error('Bodega de destino no válida');
    }
  }

  // Validaciones específicas por tipo de movimiento
  if (movementType === 'TRANSFER') {
    if (!parsedFromWarehouseId || !parsedToWarehouseId) {
      throw new Error('Para transferencias se requieren bodega de origen y destino');
    }
    if (parsedFromWarehouseId === parsedToWarehouseId) {
      throw new Error('La bodega de origen y destino no pueden ser la misma');
    }
  } else if (movementType === 'ENTRADA') {
    if (!parsedToWarehouseId) {
      throw new Error('Para entradas se requiere bodega de destino');
    }
  } else if (movementType === 'SALIDA') {
    if (!parsedFromWarehouseId) {
      throw new Error('Para salidas se requiere bodega de origen');
    }
  }

  try {
    const supabase = await getSupabaseServerClient();

    // Verificar stock disponible para transferencias y salidas
    if (movementType === 'TRANSFER' || movementType === 'SALIDA') {
      const { data: currentStock } = await supabase
        .from('Warehouse_Product')
        .select('quantity')
        .eq('productId', productId)
        .eq('warehouseId', parsedFromWarehouseId!)
        .single();

      if (!currentStock || currentStock.quantity < quantity) {
        throw new Error('Stock insuficiente en la bodega de origen');
      }
    }

    // Crear el movimiento
    const { data: movement, error: movementError } = await supabase
      .from('InventoryMovement')
      .insert({
        productId,
        fromWarehouseId: parsedFromWarehouseId,
        toWarehouseId: parsedToWarehouseId,
        movementType,
        quantity,
        reason: reason || null,
        notes: notes || null,
        userId: currentUser.id,
      })
      .select()
      .single();

    if (movementError) {
      throw new Error(`Error al crear movimiento: ${movementError.message}`);
    }

    // Actualizar stock en las bodegas
    if (movementType === 'TRANSFER') {
      // Reducir stock en bodega de origen
      await supabase.rpc('update_warehouse_product_stock', {
        p_product_id: productId,
        p_warehouse_id: parsedFromWarehouseId!,
        p_quantity_change: -quantity
      });

      // Aumentar stock en bodega de destino
      await supabase.rpc('update_warehouse_product_stock', {
        p_product_id: productId,
        p_warehouse_id: parsedToWarehouseId!,
        p_quantity_change: quantity
      });
    } else if (movementType === 'ENTRADA') {
      // Aumentar stock en bodega de destino
      await supabase.rpc('update_warehouse_product_stock', {
        p_product_id: productId,
        p_warehouse_id: parsedToWarehouseId!,
        p_quantity_change: quantity
      });
    } else if (movementType === 'SALIDA') {
      // Reducir stock en bodega de origen
      await supabase.rpc('update_warehouse_product_stock', {
        p_product_id: productId,
        p_warehouse_id: parsedFromWarehouseId!,
        p_quantity_change: -quantity
      });
    }

  } catch (error: any) {
    console.error('Error al crear movimiento de inventario:', error);
    throw error;
  }

  revalidatePath('/dashboard/inventory/movements');
  redirect('/dashboard/inventory/movements?status=success&message=Movimiento registrado exitosamente');
}

// --- OBTENER MOVIMIENTOS CON FILTROS ---
export async function getInventoryMovements(filters: MovementFilters = {}) {
  const {
    productId,
    warehouseId,
    movementType,
    startDate,
    endDate,
    page = 1,
    pageSize = 20
  } = filters;

  try {
    const supabase = await getSupabaseServerClient();
    let query = supabase
      .from('InventoryMovement')
      .select(`
        *,
        Product (
          id,
          name,
          sku,
          code
        ),
        FromWarehouse:Warehouse!fromWarehouseId (
          id,
          name,
          location
        ),
        ToWarehouse:Warehouse!toWarehouseId (
          id,
          name,
          location
        ),
        User (
          id,
          name,
          email
        )
      `)
      .order('createdAt', { ascending: false });

    // Aplicar filtros
    if (productId) {
      query = query.eq('productId', productId);
    }

    if (warehouseId) {
      query = query.or(`fromWarehouseId.eq.${warehouseId},toWarehouseId.eq.${warehouseId}`);
    }

    if (movementType) {
      query = query.eq('movementType', movementType);
    }

    if (startDate) {
      query = query.gte('createdAt', startDate);
    }

    if (endDate) {
      query = query.lte('createdAt', endDate);
    }

    // Paginación
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    const { data, error, count } = await query
      .range(from, to);

    if (error) {
      throw new Error(`Error al obtener movimientos: ${error.message}`);
    }

    return {
      data: data || [],
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    };

  } catch (error: any) {
    console.error('Error al obtener movimientos:', error);
    return {
      data: [],
      count: 0,
      page: 1,
      pageSize,
      totalPages: 0
    };
  }
}

// --- OBTENER ESTADÍSTICAS DE MOVIMIENTOS ---
export async function getMovementStats() {
  try {
    const supabase = await getSupabaseServerClient();
    
    const [
      totalMovements,
      todayMovements,
      transferMovements,
      entryMovements,
      exitMovements,
      adjustmentMovements
    ] = await Promise.all([
      supabase.from('InventoryMovement').select('*', { count: 'exact', head: true }),
      supabase.from('InventoryMovement').select('*', { count: 'exact', head: true })
        .gte('createdAt', new Date().toISOString().split('T')[0]),
      supabase.from('InventoryMovement').select('*', { count: 'exact', head: true })
        .eq('movementType', 'TRANSFER'),
      supabase.from('InventoryMovement').select('*', { count: 'exact', head: true })
        .eq('movementType', 'ENTRADA'),
      supabase.from('InventoryMovement').select('*', { count: 'exact', head: true })
        .eq('movementType', 'SALIDA'),
      supabase.from('InventoryMovement').select('*', { count: 'exact', head: true })
        .eq('movementType', 'AJUSTE')
    ]);

    return {
      totalMovements: totalMovements.count || 0,
      todayMovements: todayMovements.count || 0,
      transferMovements: transferMovements.count || 0,
      entryMovements: entryMovements.count || 0,
      exitMovements: exitMovements.count || 0,
      adjustmentMovements: adjustmentMovements.count || 0
    };

  } catch (error: any) {
    console.error('Error al obtener estadísticas de movimientos:', error);
    return {
      totalMovements: 0,
      todayMovements: 0,
      transferMovements: 0,
      entryMovements: 0,
      exitMovements: 0,
      adjustmentMovements: 0
    };
  }
}

// --- OBTENER PRODUCTOS DISPONIBLES PARA MOVIMIENTO ---
export async function getProductsForMovement(warehouseId?: number) {
  try {
    const supabase = await getSupabaseServerClient();
    
    let query = supabase
      .from('Product')
      .select(`
        id,
        name,
        sku,
        code,
        Warehouse_Product (
          quantity,
          warehouseId,
          Warehouse (
            id,
            name
          )
        )
      `)
      .eq('type', 'INVENTARIO');

    if (warehouseId) {
      query = query.eq('Warehouse_Product.warehouseId', warehouseId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error al obtener productos: ${error.message}`);
    }

    return data || [];

  } catch (error: any) {
    console.error('Error al obtener productos para movimiento:', error);
    return [];
  }
}

// --- CREAR FUNCIÓN PARA ACTUALIZAR STOCK (PARA USAR EN SUPABASE) ---
export async function createUpdateStockFunction() {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION update_warehouse_product_stock(
          p_product_id BIGINT,
          p_warehouse_id BIGINT,
          p_quantity_change INTEGER
        ) RETURNS VOID AS $$
        BEGIN
          -- Verificar si existe la relación producto-bodega
          IF NOT EXISTS (
            SELECT 1 FROM "Warehouse_Product" 
            WHERE "productId" = p_product_id AND "warehouseId" = p_warehouse_id
          ) THEN
            -- Si no existe, crear la relación con la cantidad inicial
            INSERT INTO "Warehouse_Product" ("productId", "warehouseId", "quantity", "minStock", "maxStock")
            VALUES (p_product_id, p_warehouse_id, GREATEST(0, p_quantity_change), 0, NULL);
          ELSE
            -- Si existe, actualizar la cantidad
            UPDATE "Warehouse_Product"
            SET "quantity" = GREATEST(0, "quantity" + p_quantity_change),
                "updatedAt" = NOW()
            WHERE "productId" = p_product_id AND "warehouseId" = p_warehouse_id;
          END IF;
        END;
        $$ LANGUAGE plpgsql;
      `
    });

    if (error) {
      console.error('Error al crear función de actualización de stock:', error);
    }

  } catch (error: any) {
    console.error('Error al crear función de actualización de stock:', error);
  }
} 