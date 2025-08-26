'use server'

import { getSupabaseServerClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { MultiTransferFormData, ProductTransfer } from '@/types/inventory'
import { getCurrentUser } from '@/actions/configuration/auth-actions'
import { randomUUID } from 'crypto'

export interface InventoryMovement {
  id?: number
  productId: number
  fromWarehouseId?: number | null
  toWarehouseId?: number | null
  movementType: 'TRANSFER' | 'ENTRADA' | 'SALIDA' | 'AJUSTE'
  quantity: number
  reason?: string
  notes?: string
  userId?: string
  createdAt?: string
  updatedAt?: string
}

export interface MovementFilters {
  productId?: number
  fromWarehouseId?: number
  toWarehouseId?: number
  movementType?: string
  startDate?: string
  endDate?: string
  userId?: string
}

// Crear un nuevo movimiento de inventario
export async function createInventoryMovement(movement: InventoryMovement) {
  try {
    const supabase = await getSupabaseServerClient()
    
    // Validaciones básicas
    if (movement.quantity <= 0) {
      return { success: false, error: 'La cantidad debe ser mayor a 0' }
    }

    if (movement.movementType === 'TRANSFER' && (!movement.fromWarehouseId || !movement.toWarehouseId)) {
      return { success: false, error: 'Las transferencias requieren bodega de origen y destino' }
    }

    if (movement.movementType === 'ENTRADA' && !movement.toWarehouseId) {
      return { success: false, error: 'Las entradas requieren bodega de destino' }
    }

    if (movement.movementType === 'SALIDA' && !movement.fromWarehouseId) {
      return { success: false, error: 'Las salidas requieren bodega de origen' }
    }

    // Verificar stock disponible para salidas y transferencias
    if (movement.movementType === 'SALIDA' || movement.movementType === 'TRANSFER') {
      const { data: stockData, error: stockError } = await supabase
        .from('Warehouse_Product')
        .select('quantity')
        .eq('productId', movement.productId)
        .eq('warehouseId', movement.fromWarehouseId)
        .single()

      if (stockError || !stockData) {
        return { success: false, error: 'No se encontró stock para el producto en la bodega de origen' }
      }

      if (stockData.quantity < movement.quantity) {
        return { success: false, error: `Stock insuficiente. Disponible: ${stockData.quantity}, Solicitado: ${movement.quantity}` }
      }
    }

    // Insertar el movimiento
    const { data, error } = await supabase
      .from('InventoryMovement')
      .insert([movement])
      .select()
      .single()

    if (error) {
      console.error('Error al crear movimiento:', error)
      return { success: false, error: 'Error al crear el movimiento de inventario' }
    }

    // Actualizar stock en las bodegas afectadas
    if (movement.movementType === 'TRANSFER') {
      // Reducir stock en bodega de origen
      await supabase.rpc('update_warehouse_product_stock', {
        p_product_id: movement.productId,
        p_warehouse_id: movement.fromWarehouseId,
        p_quantity_change: -movement.quantity
      })

      // Aumentar stock en bodega de destino
      await supabase.rpc('update_warehouse_product_stock', {
        p_product_id: movement.productId,
        p_warehouse_id: movement.toWarehouseId,
        p_quantity_change: movement.quantity
      })
    } else if (movement.movementType === 'ENTRADA') {
      // Aumentar stock en bodega de destino
      await supabase.rpc('update_warehouse_product_stock', {
        p_product_id: movement.productId,
        p_warehouse_id: movement.toWarehouseId,
        p_quantity_change: movement.quantity
      })
    } else if (movement.movementType === 'SALIDA') {
      // Reducir stock en bodega de origen
      await supabase.rpc('update_warehouse_product_stock', {
        p_product_id: movement.productId,
        p_warehouse_id: movement.fromWarehouseId,
        p_quantity_change: -movement.quantity
      })
    }

    revalidatePath('/dashboard/inventory/movements')
    return { success: true, data }
  } catch (error) {
    console.error('Error en createInventoryMovement:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Transferencia múltiple de productos entre bodegas
 * Valida stock, registra todos los movimientos en una transacción
 */
export async function createMultiProductTransfer(form: MultiTransferFormData) {
  try {
    const supabase = await getSupabaseServerClient()
    const { fromWarehouseId, toWarehouseId, reason, notes, products } = form

    if (!fromWarehouseId || !toWarehouseId || fromWarehouseId === toWarehouseId) {
      return { success: false, error: 'Las bodegas deben ser distintas y estar seleccionadas.' }
    }
    if (!reason || !products || products.length === 0) {
      return { success: false, error: 'Debes ingresar una razón y al menos un producto.' }
    }

    // Validar stock de todos los productos
    for (const prod of products) {
      const { data: stockData, error: stockError } = await supabase
        .from('Warehouse_Product')
        .select('quantity')
        .eq('productId', prod.productId)
        .eq('warehouseId', fromWarehouseId)
        .single()
      if (stockError || !stockData) {
        return { success: false, error: `No se encontró stock para el producto ID ${prod.productId} en la bodega de origen.` }
      }
      if (stockData.quantity < prod.quantity) {
        return { success: false, error: `Stock insuficiente para el producto ID ${prod.productId}. Disponible: ${stockData.quantity}, Solicitado: ${prod.quantity}` }
      }
    }

    // Obtener usuario actual para trazabilidad
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return { success: false, error: 'Usuario no autenticado' }
    }

    // Generar batch_id para agrupar la operación
    const batchId = (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
      ? (crypto as any).randomUUID()
      : randomUUID()

    // Registrar movimientos en "transacción" (no real, pero secuencial)
    const movimientos = []
    for (const prod of products) {
      // Insertar movimiento
      const { data, error } = await supabase
        .from('InventoryMovement')
        .insert([{
          productId: prod.productId,
          fromWarehouseId,
          toWarehouseId,
          movementType: 'TRANSFER',
          quantity: prod.quantity,
          reason,
          notes,
          batch_id: batchId,
          userId: currentUser.id,
          createdAt: new Date().toISOString()
        }])
        .select()
        .single()
      if (error) {
        return { success: false, error: `Error al registrar movimiento para producto ID ${prod.productId}` }
      }
      // Actualizar stock en ambas bodegas
      await supabase.rpc('update_warehouse_product_stock', {
        p_product_id: prod.productId,
        p_warehouse_id: fromWarehouseId,
        p_quantity_change: -prod.quantity
      })
      await supabase.rpc('update_warehouse_product_stock', {
        p_product_id: prod.productId,
        p_warehouse_id: toWarehouseId,
        p_quantity_change: prod.quantity
      })
      movimientos.push(data)
    }
    revalidatePath('/dashboard/inventory/movements')
    return { success: true, movimientos, batchId }
  } catch (error) {
    console.error('Error en createMultiProductTransfer:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

// Obtener transferencias agrupadas por batch_id
export async function getGroupedTransfers(page: number = 1, limit: number = 20) {
  try {
    const supabase = await getSupabaseServerClient()

    // Obtener todos los movimientos que tengan batch_id
    const { data: movements, error } = await supabase
      .from('InventoryMovement')
      .select(`
        *,
        Product:Product(name),
        FromWarehouse:Warehouse!InventoryMovement_fromWarehouseId_fkey(name),
        ToWarehouse:Warehouse!InventoryMovement_toWarehouseId_fkey(name),
        User:User(id, name, email)
      `)
      .not('batch_id', 'is', null)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error al obtener transferencias agrupadas:', error)
      return { success: false, error: 'Error al obtener transferencias agrupadas' }
    }

    // Agrupar por batch_id
    const grouped: Record<string, any> = {}
    ;(movements || []).forEach((m) => {
      const key = (m as any).batch_id as string
      if (!grouped[key]) {
        grouped[key] = {
          batch_id: key,
          fromWarehouse: (m as any).FromWarehouse?.name || 'N/A',
          toWarehouse: (m as any).ToWarehouse?.name || 'N/A',
          reason: (m as any).reason || '',
          createdAt: (m as any).createdAt,
          user: (m as any).User || null,
          products: [] as Array<{ name: string; quantity: number }>,
          productCount: 0,
          totalQuantity: 0,
        }
      }
      grouped[key].products.push({
        name: (m as any).Product?.name || 'Producto',
        quantity: (m as any).quantity || 0
      })
      grouped[key].productCount += 1
      grouped[key].totalQuantity += (m as any).quantity || 0
    })

    const allTransfers = Object.values(grouped)
    const offset = (page - 1) * limit
    const paginated = allTransfers.slice(offset, offset + limit)

    return {
      success: true,
      transfers: paginated,
      pagination: {
        page,
        limit,
        total: allTransfers.length,
        totalPages: Math.ceil(allTransfers.length / limit)
      }
    }
  } catch (error) {
    console.error('Error en getGroupedTransfers:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

// Obtener movimientos con filtros
export async function getInventoryMovements(filters: MovementFilters = {}, page = 1, limit = 20) {
  try {
    const supabase = await getSupabaseServerClient()
    
    let query = supabase
      .from('InventoryMovement')
      .select(`
        *,
        Product:Product(name, sku),
        FromWarehouse:Warehouse!InventoryMovement_fromWarehouseId_fkey(name),
        ToWarehouse:Warehouse!InventoryMovement_toWarehouseId_fkey(name),
        User:User(name, email)
      `)
      .order('createdAt', { ascending: false })

    // Aplicar filtros
    if (filters.productId) {
      query = query.eq('productId', filters.productId)
    }
    if (filters.fromWarehouseId) {
      query = query.eq('fromWarehouseId', filters.fromWarehouseId)
    }
    if (filters.toWarehouseId) {
      query = query.eq('toWarehouseId', filters.toWarehouseId)
    }
    if (filters.movementType) {
      query = query.eq('movementType', filters.movementType)
    }
    if (filters.startDate) {
      query = query.gte('createdAt', filters.startDate)
    }
    if (filters.endDate) {
      query = query.lte('createdAt', filters.endDate)
    }
    if (filters.userId) {
      query = query.eq('userId', filters.userId)
    }

    // Paginación
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await query
      .range(from, to)
      .select(`
        *,
        Product:Product(name, sku, description),
        FromWarehouse:Warehouse!InventoryMovement_fromWarehouseId_fkey(name),
        ToWarehouse:Warehouse!InventoryMovement_toWarehouseId_fkey(name),
        User:User(name, email)
      `, { count: 'exact' })

    if (error) {
      console.error('Error al obtener movimientos:', error)
      return { success: false, error: 'Error al obtener los movimientos' }
    }

    return { 
      success: true, 
      data, 
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    }
  } catch (error) {
    console.error('Error en getInventoryMovements:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

// Obtener estadísticas de movimientos
export async function getMovementStats() {
  try {
    const supabase = await getSupabaseServerClient()
    
    // Total de movimientos por tipo
    const { data: typeStats, error: typeError } = await supabase
      .from('InventoryMovement')
      .select('movementType')
      .then(result => {
        if (result.error) return { data: null, error: result.error }
        
        const stats = result.data?.reduce((acc, movement) => {
          acc[movement.movementType] = (acc[movement.movementType] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        
        return { data: stats, error: null }
      })

    // Movimientos del último mes
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    
    const { data: recentMovements, error: recentError } = await supabase
      .from('InventoryMovement')
      .select('movementType, quantity')
      .gte('createdAt', lastMonth.toISOString())

    // Productos más movidos
    const { data: topProducts, error: topError } = await supabase
      .from('InventoryMovement')
      .select(`
        productId,
        quantity,
        Product:Product(name, sku)
      `)
      .then(result => {
        if (result.error) return { data: null, error: result.error }
        
        const productStats = result.data?.reduce((acc, movement) => {
          const productId = movement.productId
          if (!acc[productId]) {
            acc[productId] = {
              productId,
              name: movement.Product?.name || 'Producto desconocido',
              sku: movement.Product?.sku || '',
              totalQuantity: 0,
              movementCount: 0
            }
          }
          acc[productId].totalQuantity += movement.quantity
          acc[productId].movementCount += 1
          return acc
        }, {} as Record<number, any>)
        
        return { 
          data: Object.values(productStats || {}).sort((a, b) => b.totalQuantity - a.totalQuantity).slice(0, 10),
          error: null 
        }
      })

    // Calcular estadísticas adicionales
    const totalMovements = Object.values(typeStats || {}).reduce((sum, count) => sum + count, 0)
    const totalQuantity = (recentMovements || []).reduce((sum, movement) => sum + (movement.quantity || 0), 0)
    const entriesCount = typeStats?.['ENTRADA'] || 0
    const exitsCount = typeStats?.['SALIDA'] || 0
    const transfersCount = typeStats?.['TRANSFER'] || 0

    return {
      success: true,
      data: {
        totalMovements,
        totalQuantity,
        entriesCount,
        exitsCount,
        transfersCount,
        typeStats: typeStats || {},
        recentMovements: recentMovements || [],
        topProducts: topProducts || []
      }
    }
  } catch (error) {
    console.error('Error en getMovementStats:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

// Obtener productos disponibles para movimientos
export async function getProductsForMovement(warehouseId?: number) {
  try {
    const supabase = await getSupabaseServerClient()
    
    let query = supabase
      .from('Warehouse_Product')
      .select(`
        quantity,
        Product:Product(id, name, sku, description)
      `)
      .gt('quantity', 0)

    if (warehouseId) {
      query = query.eq('warehouseId', warehouseId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error al obtener productos:', error)
      return { success: false, error: 'Error al obtener los productos' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error en getProductsForMovement:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

// Obtener un movimiento específico
export async function getInventoryMovement(id: number) {
  try {
    const supabase = await getSupabaseServerClient()
    
    const { data, error } = await supabase
      .from('InventoryMovement')
      .select(`
        *,
        Product:Product(name, sku, description),
        FromWarehouse:Warehouse!InventoryMovement_fromWarehouseId_fkey(name),
        ToWarehouse:Warehouse!InventoryMovement_toWarehouseId_fkey(name),
        User:User(name, email)
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error al obtener movimiento:', error)
      return { success: false, error: 'Error al obtener el movimiento' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error en getInventoryMovement:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
} 