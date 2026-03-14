'use server'

import { getSupabaseServiceClient } from '@/lib/supabase-server'

export interface ComboComponentSale {
  productId: number
  productName: string
  quantity: number
  unitPrice: number
  total: number
  costCenterId?: number
  costCenterName?: string
  warehouseId?: number | null
  warehouseName?: string
  isComboComponent: boolean
  comboProductId: number
  comboProductName: string
}

export interface ComboBreakdownResult {
  originalCombo: {
    productId: number
    productName: string
    quantity: number
    unitPrice: number
    total: number
  }
  components: ComboComponentSale[]
  totalComponentsValue: number
  margin: number
}

/**
 * Desglosa un producto combo/kit en sus componentes individuales
 */
export async function breakDownComboSale(
  comboProductId: number,
  comboQuantity: number,
  comboUnitPrice: number
): Promise<{ success: boolean; data?: ComboBreakdownResult; error?: string }> {
  try {
    const supabase = await getSupabaseServiceClient()

    // 1. Obtener información del combo/kit
    const { data: comboProduct, error: comboError } = await supabase
      .from('Product')
      .select('id, name, type, cost_center_id, cost_distribution_type')
      .eq('id', comboProductId)
      .eq('type', 'COMBO')
      .single()

    if (comboError || !comboProduct) {
      return { success: false, error: 'Combo/Kit no encontrado' }
    }

    // 2. Obtener componentes
    const { data: components, error: componentsError } = await supabase
      .from('product_components')
      .select(`
        component_product_id,
        quantity,
        unit_price,
        warehouse_id,
        Product:component_product_id(
          id,
          name,
          sku,
          cost_center_id,
          cost_distribution_type
        )
      `)
      .eq('combo_product_id', comboProductId)

    if (componentsError || !components || components.length === 0) {
      return { success: false, error: 'No se encontraron componentes del combo/kit' }
    }

    // 3. Desglosar componentes con centros de costo
    const componentSales: ComboComponentSale[] = []
    let totalComponentsValue = 0

    for (const component of components) {
      const componentProduct = component.Product
      if (!componentProduct) continue

      const componentQuantity = component.quantity * comboQuantity
      const componentUnitPrice = component.unit_price
      const componentTotal = componentQuantity * componentUnitPrice
      totalComponentsValue += componentTotal

      let costCenterId = componentProduct.cost_center_id
      let costCenterName = 'Sin centro asignado'

      if (!costCenterId && comboProduct.cost_center_id) {
        costCenterId = comboProduct.cost_center_id

        const { data: costCenter } = await supabase
          .from('Cost_Center')
          .select('name')
          .eq('id', costCenterId)
          .single()

        costCenterName = costCenter?.name || 'Centro del combo'
      } else if (costCenterId) {
        const { data: costCenter } = await supabase
          .from('Cost_Center')
          .select('name')
          .eq('id', costCenterId)
          .single()

        costCenterName = costCenter?.name || 'Centro del componente'
      }

      let warehouseId = component.warehouse_id
      let warehouseName = 'Bodega predeterminada'

      if (warehouseId) {
        const { data: warehouse } = await supabase
          .from('Warehouse')
          .select('name')
          .eq('id', warehouseId)
          .single()

        warehouseName = warehouse?.name || 'Bodega personalizada'
      } else {
        const { data: warehouseProduct } = await supabase
          .from('Warehouse_Product')
          .select(`
            warehouseId,
            Warehouse:warehouseId(name)
          `)
          .eq('productId', componentProduct.id)
          .single()

        if (warehouseProduct && warehouseProduct.warehouseId) {
          warehouseId = warehouseProduct.warehouseId
          const warehouse = Array.isArray(warehouseProduct.Warehouse)
            ? warehouseProduct.Warehouse[0]
            : warehouseProduct.Warehouse
          warehouseName = warehouse?.name || 'Bodega del producto'
        }
      }

      componentSales.push({
        productId: componentProduct.id,
        productName: componentProduct.name,
        quantity: componentQuantity,
        unitPrice: componentUnitPrice,
        total: componentTotal,
        costCenterId,
        costCenterName,
        warehouseId,
        warehouseName,
        isComboComponent: true,
        comboProductId: comboProduct.id,
        comboProductName: comboProduct.name
      })
    }

    // 4. Calcular margen
    const comboTotal = comboQuantity * comboUnitPrice
    const margin = comboTotal - totalComponentsValue

    const result: ComboBreakdownResult = {
      originalCombo: {
        productId: comboProduct.id,
        productName: comboProduct.name,
        quantity: comboQuantity,
        unitPrice: comboUnitPrice,
        total: comboTotal
      },
      components: componentSales,
      totalComponentsValue,
      margin
    }

    return { success: true, data: result }

  } catch (error) {
    console.error('Error in breakDownComboSale:', error)
    return {
      success: false,
      error: `Error desglosando combo/kit: ${error instanceof Error ? error.message : 'Error desconocido'}`
    }
  }
}

/**
 * Registra una venta de combo/kit desglosando los componentes
 */
export async function registerComboBreakdownSale(
  comboProductId: number,
  comboQuantity: number,
  comboUnitPrice: number,
  saleId: number
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const breakdownResult = await breakDownComboSale(comboProductId, comboQuantity, comboUnitPrice)

    if (!breakdownResult.success || !breakdownResult.data) {
      return { success: false, error: breakdownResult.error || 'Error desglosando combo/kit' }
    }

    const supabase = await getSupabaseServiceClient()

    const componentSales = breakdownResult.data.components.map(component => ({
      saleId: saleId,
      productId: component.productId,
      productName: component.productName,
      quantity: component.quantity,
      unitPrice: component.unitPrice,
      total: component.total,
      costCenterId: component.costCenterId,
      notes: `Componente de kit: ${component.comboProductName}`,
      isComboComponent: true,
      comboProductId: component.comboProductId
    }))

    const { data: insertedItems, error: insertError } = await supabase
      .from('POSSaleItem')
      .insert(componentSales)
      .select()

    if (insertError) {
      console.error('Error insertando componentes:', insertError)
      return { success: false, error: 'Error registrando componentes del kit' }
    }

    return {
      success: true,
      data: {
        componentsRegistered: insertedItems?.length || 0,
        breakdown: breakdownResult.data
      }
    }

  } catch (error) {
    console.error('Error in registerComboBreakdownSale:', error)
    return {
      success: false,
      error: `Error registrando venta desglosada: ${error instanceof Error ? error.message : 'Error desconocido'}`
    }
  }
}

/**
 * Obtiene el desglose de una venta de combo/kit existente
 */
export async function getComboBreakdownBySale(
  saleId: number
): Promise<{ success: boolean; data?: ComboComponentSale[]; error?: string }> {
  try {
    const supabase = await getSupabaseServiceClient()

    const { data: components, error } = await supabase
      .from('POSSaleItem')
      .select(`
        productId,
        productName,
        quantity,
        unitPrice,
        total,
        costCenterId,
        notes,
        isComboComponent,
        comboProductId,
        Cost_Center:costCenterId(name)
      `)
      .eq('saleId', saleId)
      .eq('isComboComponent', true)

    if (error) {
      return { success: false, error: 'Error obteniendo desglose de kit' }
    }

    const componentSales: ComboComponentSale[] = (components || []).map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
      costCenterId: item.costCenterId,
      costCenterName: item.Cost_Center?.name || 'Sin centro',
      isComboComponent: true,
      comboProductId: item.comboProductId,
      comboProductName: item.notes?.replace('Componente de kit: ', '') || 'Kit'
    }))

    return { success: true, data: componentSales }

  } catch (error) {
    console.error('Error in getComboBreakdownBySale:', error)
    return {
      success: false,
      error: `Error obteniendo desglose: ${error instanceof Error ? error.message : 'Error desconocido'}`
    }
  }
}
