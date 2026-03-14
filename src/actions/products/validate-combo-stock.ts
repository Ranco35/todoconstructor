'use server'

import { getSupabaseServiceClient } from '@/lib/supabase-server'

interface StockValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

interface ComponentWithWarehouse {
  id: number
  warehouseId?: number | null
  quantity: number
}

/**
 * Valida que todos los componentes de un combo/kit tengan stock suficiente
 * en sus bodegas específicas o en la bodega del producto base
 */
export async function validateComboComponentsStock(
  components: ComponentWithWarehouse[]
): Promise<StockValidationResult> {
  const supabase = await getSupabaseServiceClient()
  const errors: string[] = []
  const warnings: string[] = []

  for (const component of components) {
    try {
      let warehouseId = component.warehouseId
      let warehouseSource = 'personalizada'

      if (!warehouseId) {
        const { data: warehouseProduct } = await supabase
          .from('Warehouse_Product')
          .select('warehouseId')
          .eq('productId', component.id)
          .single()

        warehouseId = warehouseProduct?.warehouseId
        warehouseSource = 'producto'
      }

      if (!warehouseId) {
        warnings.push(
          `Componente ID ${component.id}: No tiene bodega asignada. Se requerirá configurar una antes de vender el kit.`
        )
        continue
      }

      const { data: stockData, error: stockError } = await supabase
        .from('Warehouse_Product')
        .select('quantity, Product(name)')
        .eq('productId', component.id)
        .eq('warehouseId', warehouseId)
        .single()

      if (stockError || !stockData) {
        errors.push(
          `Componente ID ${component.id}: No se pudo verificar el stock en la bodega ${warehouseId}.`
        )
        continue
      }

      const productName = Array.isArray(stockData.Product)
        ? stockData.Product[0]?.name
        : stockData.Product?.name
      const currentStock = stockData.quantity || 0

      if (currentStock < 10) {
        warnings.push(
          `${productName || `Producto ${component.id}`}: Stock bajo en bodega ${warehouseSource} (${currentStock} unidades disponibles).`
        )
      }

      if (currentStock <= 0) {
        errors.push(
          `${productName || `Producto ${component.id}`}: Sin stock en bodega ${warehouseSource}. No se puede vender el kit hasta reponer.`
        )
      }

    } catch (error) {
      console.error(`Error validando stock del componente ${component.id}:`, error)
      errors.push(
        `Componente ID ${component.id}: Error al validar stock. ${error instanceof Error ? error.message : ''}`
      )
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Obtiene información detallada del stock de componentes de un combo/kit
 */
export async function getComboComponentsStockInfo(comboId: number) {
  const supabase = await getSupabaseServiceClient()

  const { data: components, error } = await supabase
    .from('product_components')
    .select(`
      component_product_id,
      quantity,
      warehouse_id,
      Product:component_product_id(
        id,
        name,
        sku
      )
    `)
    .eq('combo_product_id', comboId)

  if (error || !components) {
    return { success: false, error: 'Error obteniendo componentes del kit' }
  }

  const stockInfo = []

  for (const component of components) {
    const productData = Array.isArray(component.Product)
      ? component.Product[0]
      : component.Product

    let warehouseId = component.warehouse_id
    let warehouseSource = 'personalizada'

    if (!warehouseId) {
      const { data: warehouseProduct } = await supabase
        .from('Warehouse_Product')
        .select('warehouseId, Warehouse:warehouseId(name)')
        .eq('productId', component.component_product_id)
        .single()

      warehouseId = warehouseProduct?.warehouseId
      warehouseSource = 'producto'
    }

    let stock = 0
    let warehouseName = 'Sin bodega'

    if (warehouseId) {
      const { data: stockData } = await supabase
        .from('Warehouse_Product')
        .select('quantity, Warehouse:warehouseId(name)')
        .eq('productId', component.component_product_id)
        .eq('warehouseId', warehouseId)
        .single()

      if (stockData) {
        stock = stockData.quantity || 0
        const warehouse = Array.isArray(stockData.Warehouse)
          ? stockData.Warehouse[0]
          : stockData.Warehouse
        warehouseName = warehouse?.name || 'Bodega desconocida'
      }
    }

    stockInfo.push({
      productId: component.component_product_id,
      productName: productData?.name || 'Producto desconocido',
      sku: productData?.sku || '',
      quantityInCombo: component.quantity,
      warehouseId,
      warehouseName,
      warehouseSource,
      currentStock: stock,
      hasStock: stock > 0,
      isLowStock: stock > 0 && stock < 10
    })
  }

  return {
    success: true,
    data: stockInfo
  }
}
