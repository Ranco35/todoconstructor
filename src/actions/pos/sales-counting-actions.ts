'use server'

import { getSupabaseServiceClient } from '@/lib/supabase-server'

export interface SalesCountResult {
  salesStatistics: {
    totalSales: number
    totalAmount: number
    productsSold: Array<{
      productId: number
      productName: string
      quantity: number
      amount: number
      salesCount: number
      isCombo: boolean
    }>
  }

  costCenterStatistics: {
    totalComponents: number
    totalAmount: number
    componentsByCenter: Array<{
      costCenterId: number
      costCenterName: string
      componentCount: number
      amount: number
      components: Array<{
        componentId: number
        componentName: string
        quantity: number
        amount: number
      }>
    }>
  }

  comparison: {
    salesCount: number
    componentCount: number
    difference: number
    explanation: string
  }
}

/**
 * Obtiene conteo de ventas diferenciado: estadísticas vs centros de costo
 */
export async function getDifferentiatedSalesCount(
  startDate?: Date,
  endDate?: Date
): Promise<{ success: boolean; data?: SalesCountResult; error?: string }> {
  try {
    const supabase = await getSupabaseServiceClient()

    const dateFilter = startDate && endDate
      ? `AND ps."createdAt" >= '${startDate.toISOString()}' AND ps."createdAt" <= '${endDate.toISOString()}'`
      : ''

    const salesStatsQuery = `
      SELECT
        psi."productId",
        psi."productName",
        SUM(psi.quantity) as total_quantity,
        SUM(psi.total) as total_amount,
        COUNT(DISTINCT psi."saleId") as sales_count,
        p.type as product_type
      FROM "POSSaleItem" psi
      JOIN "POSSale" ps ON psi."saleId" = ps.id
      JOIN "Product" p ON psi."productId" = p.id
      WHERE (psi."isComboComponent" = FALSE OR psi."isComboComponent" IS NULL)
      ${dateFilter}
      GROUP BY psi."productId", psi."productName", p.type
      ORDER BY total_amount DESC
    `

    const { data: salesStats } = await supabase.rpc('exec_sql', {
      sql: salesStatsQuery
    })

    const costCenterStatsQuery = `
      SELECT
        psi."costCenterId",
        cc.name as cost_center_name,
        psi."productId" as component_id,
        psi."productName" as component_name,
        SUM(psi.quantity) as total_quantity,
        SUM(psi.total) as total_amount,
        COUNT(*) as component_count
      FROM "POSSaleItem" psi
      JOIN "POSSale" ps ON psi."saleId" = ps.id
      LEFT JOIN "Cost_Center" cc ON psi."costCenterId" = cc.id
      WHERE psi."isComboComponent" = TRUE
      ${dateFilter}
      GROUP BY psi."costCenterId", cc.name, psi."productId", psi."productName"
      ORDER BY total_amount DESC
    `

    const { data: costCenterStats } = await supabase.rpc('exec_sql', {
      sql: costCenterStatsQuery
    })

    const salesStatistics = {
      totalSales: salesStats?.length || 0,
      totalAmount: salesStats?.reduce((sum: number, stat: any) => sum + parseFloat(stat.total_amount), 0) || 0,
      productsSold: (salesStats || []).map((stat: any) => ({
        productId: stat.productId,
        productName: stat.productName,
        quantity: parseFloat(stat.total_quantity),
        amount: parseFloat(stat.total_amount),
        salesCount: parseInt(stat.sales_count),
        isCombo: stat.product_type === 'COMBO'
      }))
    }

    const componentsByCenter = new Map()
    let totalComponents = 0
    let totalComponentAmount = 0

    ;(costCenterStats || []).forEach((stat: any) => {
      const centerKey = stat.costCenterId || 'sin_centro'
      const centerName = stat.cost_center_name || 'Sin centro asignado'

      if (!componentsByCenter.has(centerKey)) {
        componentsByCenter.set(centerKey, {
          costCenterId: stat.costCenterId,
          costCenterName: centerName,
          componentCount: 0,
          amount: 0,
          components: []
        })
      }

      const center = componentsByCenter.get(centerKey)
      center.componentCount += parseInt(stat.component_count)
      center.amount += parseFloat(stat.total_amount)
      center.components.push({
        componentId: stat.component_id,
        componentName: stat.component_name,
        quantity: parseFloat(stat.total_quantity),
        amount: parseFloat(stat.total_amount)
      })

      totalComponents += parseInt(stat.component_count)
      totalComponentAmount += parseFloat(stat.total_amount)
    })

    const costCenterStatistics = {
      totalComponents,
      totalAmount: totalComponentAmount,
      componentsByCenter: Array.from(componentsByCenter.values())
    }

    const difference = totalComponents - salesStatistics.totalSales
    let explanation = ''

    if (difference > 0) {
      explanation = `Los centros de costo tienen ${difference} componentes más que ventas porque los combos/kits se desglosan en múltiples componentes.`
    } else if (difference < 0) {
      explanation = `Hay ${Math.abs(difference)} ventas más que componentes porque no todos los productos son combos/kits.`
    } else {
      explanation = 'El conteo coincide porque no hay combos/kits vendidos en este período.'
    }

    const result: SalesCountResult = {
      salesStatistics,
      costCenterStatistics,
      comparison: {
        salesCount: salesStatistics.totalSales,
        componentCount: totalComponents,
        difference,
        explanation
      }
    }

    return { success: true, data: result }

  } catch (error) {
    console.error('Error in getDifferentiatedSalesCount:', error)
    return {
      success: false,
      error: `Error obteniendo conteo diferenciado: ${error instanceof Error ? error.message : 'Error desconocido'}`
    }
  }
}

/**
 * Obtiene conteo de ventas por producto (excluyendo componentes de combo)
 */
export async function getProductSalesCount(
  startDate?: Date,
  endDate?: Date
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await getSupabaseServiceClient()

    const dateFilter = startDate && endDate
      ? `AND ps."createdAt" >= '${startDate.toISOString()}' AND ps."createdAt" <= '${endDate.toISOString()}'`
      : ''

    const query = `
      SELECT
        psi."productId",
        psi."productName",
        p.type as product_type,
        SUM(psi.quantity) as total_quantity,
        SUM(psi.total) as total_amount,
        COUNT(DISTINCT psi."saleId") as sales_count,
        AVG(psi."unitPrice") as average_price
      FROM "POSSaleItem" psi
      JOIN "POSSale" ps ON psi."saleId" = ps.id
      JOIN "Product" p ON psi."productId" = p.id
      WHERE (psi."isComboComponent" = FALSE OR psi."isComboComponent" IS NULL)
      ${dateFilter}
      GROUP BY psi."productId", psi."productName", p.type
      ORDER BY sales_count DESC, total_amount DESC
    `

    const { data, error } = await supabase.rpc('exec_sql', {
      sql: query
    })

    if (error) {
      return { success: false, error: error.message }
    }

    const processedData = (data || []).map((item: any) => ({
      productId: item.productId,
      productName: item.productName,
      productType: item.product_type,
      totalQuantity: parseFloat(item.total_quantity),
      totalAmount: parseFloat(item.total_amount),
      salesCount: parseInt(item.sales_count),
      averagePrice: parseFloat(item.average_price)
    }))

    return { success: true, data: processedData }

  } catch (error) {
    console.error('Error in getProductSalesCount:', error)
    return {
      success: false,
      error: `Error obteniendo conteo de productos: ${error instanceof Error ? error.message : 'Error desconocido'}`
    }
  }
}

/**
 * Obtiene conteo de componentes por centro de costo (solo componentes de combo/kit)
 */
export async function getComponentCountByCostCenter(
  startDate?: Date,
  endDate?: Date
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await getSupabaseServiceClient()

    const dateFilter = startDate && endDate
      ? `AND ps."createdAt" >= '${startDate.toISOString()}' AND ps."createdAt" <= '${endDate.toISOString()}'`
      : ''

    const query = `
      SELECT
        psi."costCenterId",
        cc.name as cost_center_name,
        COUNT(DISTINCT psi."productId") as unique_components,
        SUM(psi.quantity) as total_quantity,
        SUM(psi.total) as total_amount,
        COUNT(*) as component_sales
      FROM "POSSaleItem" psi
      JOIN "POSSale" ps ON psi."saleId" = ps.id
      LEFT JOIN "Cost_Center" cc ON psi."costCenterId" = cc.id
      WHERE psi."isComboComponent" = TRUE
      ${dateFilter}
      GROUP BY psi."costCenterId", cc.name
      ORDER BY total_amount DESC
    `

    const { data, error } = await supabase.rpc('exec_sql', {
      sql: query
    })

    if (error) {
      return { success: false, error: error.message }
    }

    const processedData = (data || []).map((item: any) => ({
      costCenterId: item.costCenterId,
      costCenterName: item.cost_center_name || 'Sin centro asignado',
      uniqueComponents: parseInt(item.unique_components),
      totalQuantity: parseFloat(item.total_quantity),
      totalAmount: parseFloat(item.total_amount),
      componentSales: parseInt(item.component_sales)
    }))

    return { success: true, data: processedData }

  } catch (error) {
    console.error('Error in getComponentCountByCostCenter:', error)
    return {
      success: false,
      error: `Error obteniendo conteo por centro: ${error instanceof Error ? error.message : 'Error desconocido'}`
    }
  }
}
