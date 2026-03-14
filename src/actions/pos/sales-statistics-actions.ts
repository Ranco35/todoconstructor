'use server'

import { getSupabaseServiceClient } from '@/lib/supabase-server'

export interface SalesStatistics {
  productSales: {
    productId: number
    productName: string
    totalQuantity: number
    totalAmount: number
    salesCount: number
    averagePrice: number
    isCombo: boolean
  }[]

  componentSales: {
    componentId: number
    componentName: string
    totalQuantity: number
    totalAmount: number
    salesCount: number
    averagePrice: number
    costCenterId?: number
    costCenterName?: string
    comboProductId?: number
    comboProductName?: string
  }[]

  summary: {
    totalSales: number
    totalAmount: number
    comboSales: number
    componentSales: number
    regularSales: number
  }
}

/**
 * Obtiene estadísticas de ventas con doble nivel: productos completos y componentes de combo/kit
 */
export async function getSalesStatisticsWithBreakdown(
  startDate?: Date,
  endDate?: Date,
  costCenterId?: number
): Promise<{ success: boolean; data?: SalesStatistics; error?: string }> {
  try {
    const supabase = await getSupabaseServiceClient()

    let dateFilter = ''
    if (startDate && endDate) {
      dateFilter = `AND ps."createdAt" >= '${startDate.toISOString()}' AND ps."createdAt" <= '${endDate.toISOString()}'`
    }

    const productStatsQuery = `
      SELECT
        psi."productId",
        psi."productName",
        SUM(psi.quantity) as total_quantity,
        SUM(psi.total) as total_amount,
        COUNT(DISTINCT psi."saleId") as sales_count,
        AVG(psi."unitPrice") as average_price,
        p.type as product_type
      FROM "POSSaleItem" psi
      JOIN "POSSale" ps ON psi."saleId" = ps.id
      JOIN "Product" p ON psi."productId" = p.id
      WHERE psi."isComboComponent" = FALSE OR psi."isComboComponent" IS NULL
      ${dateFilter}
      GROUP BY psi."productId", psi."productName", p.type
      ORDER BY total_amount DESC
    `

    const { data: productStats, error: productError } = await supabase.rpc('exec_sql', {
      sql: productStatsQuery
    })

    if (productError) {
      const { data: fallbackStats } = await supabase
        .from('POSSaleItem')
        .select(`
          productId,
          productName,
          quantity,
          total,
          unitPrice,
          Product:productId(type)
        `)
        .eq('isComboComponent', false)
        .order('total', { ascending: false })

      processProductStats(fallbackStats || [])
    }

    const componentStatsQuery = `
      SELECT
        psi."productId" as component_id,
        psi."productName" as component_name,
        SUM(psi.quantity) as total_quantity,
        SUM(psi.total) as total_amount,
        COUNT(DISTINCT psi."saleId") as sales_count,
        AVG(psi."unitPrice") as average_price,
        psi."costCenterId",
        cc.name as cost_center_name,
        psi."comboProductId",
        p.name as combo_product_name
      FROM "POSSaleItem" psi
      JOIN "POSSale" ps ON psi."saleId" = ps.id
      LEFT JOIN "Cost_Center" cc ON psi."costCenterId" = cc.id
      LEFT JOIN "Product" p ON psi."comboProductId" = p.id
      WHERE psi."isComboComponent" = TRUE
      ${dateFilter}
      GROUP BY psi."productId", psi."productName", psi."costCenterId", cc.name, psi."comboProductId", p.name
      ORDER BY total_amount DESC
    `

    const { data: componentStats } = await supabase.rpc('exec_sql', {
      sql: componentStatsQuery
    })

    const summaryQuery = `
      SELECT
        COUNT(DISTINCT ps.id) as total_sales,
        (SELECT COALESCE(SUM(s.total), 0) FROM "POSSale" s WHERE s.id IN (
          SELECT DISTINCT ps2.id FROM "POSSale" ps2
          JOIN "POSSaleItem" psi2 ON ps2.id = psi2."saleId"
          WHERE 1=1 ${dateFilter}
        )) as total_amount,
        COUNT(DISTINCT CASE WHEN p.type = 'COMBO' THEN ps.id END) as combo_sales,
        COUNT(CASE WHEN psi."isComboComponent" = TRUE THEN 1 END) as component_sales,
        COUNT(CASE WHEN psi."isComboComponent" = FALSE OR psi."isComboComponent" IS NULL THEN 1 END) as regular_sales
      FROM "POSSale" ps
      JOIN "POSSaleItem" psi ON ps.id = psi."saleId"
      JOIN "Product" p ON psi."productId" = p.id
      WHERE 1=1 ${dateFilter}
    `

    const { data: summaryData } = await supabase.rpc('exec_sql', {
      sql: summaryQuery
    })

    const result: SalesStatistics = {
      productSales: (productStats || []).map((stat: any) => ({
        productId: stat.productId,
        productName: stat.productName,
        totalQuantity: parseFloat(stat.total_quantity),
        totalAmount: parseFloat(stat.total_amount),
        salesCount: parseInt(stat.sales_count),
        averagePrice: parseFloat(stat.average_price),
        isCombo: stat.product_type === 'COMBO'
      })),

      componentSales: (componentStats || []).map((stat: any) => ({
        componentId: stat.component_id,
        componentName: stat.component_name,
        totalQuantity: parseFloat(stat.total_quantity),
        totalAmount: parseFloat(stat.total_amount),
        salesCount: parseInt(stat.sales_count),
        averagePrice: parseFloat(stat.average_price),
        costCenterId: stat.costCenterId,
        costCenterName: stat.cost_center_name,
        comboProductId: stat.comboProductId,
        comboProductName: stat.combo_product_name
      })),

      summary: {
        totalSales: parseInt(summaryData?.[0]?.total_sales || '0'),
        totalAmount: parseFloat(summaryData?.[0]?.total_amount || '0'),
        comboSales: parseInt(summaryData?.[0]?.combo_sales || '0'),
        componentSales: parseInt(summaryData?.[0]?.component_sales || '0'),
        regularSales: parseInt(summaryData?.[0]?.regular_sales || '0')
      }
    }

    return { success: true, data: result }

  } catch (error) {
    console.error('Error in getSalesStatisticsWithBreakdown:', error)
    return {
      success: false,
      error: `Error obteniendo estadísticas: ${error instanceof Error ? error.message : 'Error desconocido'}`
    }
  }
}

function processProductStats(rawStats: any[]): any[] {
  const statsMap = new Map()

  rawStats.forEach(stat => {
    const key = stat.productId
    if (statsMap.has(key)) {
      const existing = statsMap.get(key)
      existing.totalQuantity += stat.quantity
      existing.totalAmount += stat.total
      existing.salesCount += 1
    } else {
      statsMap.set(key, {
        productId: stat.productId,
        productName: stat.productName,
        totalQuantity: stat.quantity,
        totalAmount: stat.total,
        salesCount: 1,
        averagePrice: stat.unitPrice,
        isCombo: stat.Product?.type === 'COMBO'
      })
    }
  })

  return Array.from(statsMap.values()).sort((a, b) => b.totalAmount - a.totalAmount)
}

/**
 * Obtiene estadísticas de ventas por centro de costo
 */
export async function getSalesStatisticsByCostCenter(
  startDate?: Date,
  endDate?: Date
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await getSupabaseServiceClient()

    const { data, error } = await supabase.rpc('get_sales_by_cost_center', {
      p_start_date: startDate?.toISOString().split('T')[0] || null,
      p_end_date: endDate?.toISOString().split('T')[0] || null
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }

  } catch (error) {
    console.error('Error in getSalesStatisticsByCostCenter:', error)
    return {
      success: false,
      error: `Error obteniendo estadísticas por centro: ${error instanceof Error ? error.message : 'Error desconocido'}`
    }
  }
}

/**
 * Obtiene el desglose de una venta específica
 */
export async function getSaleBreakdown(saleId: number): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await getSupabaseServiceClient()

    const { data: saleData, error: saleError } = await supabase
      .from('POSSale')
      .select('*')
      .eq('id', saleId)
      .single()

    if (saleError || !saleData) {
      return { success: false, error: 'Venta no encontrada' }
    }

    const { data: saleItems, error: itemsError } = await supabase
      .from('POSSaleItem')
      .select(`
        *,
        Cost_Center:costCenterId(name),
        Product:productId(name, type)
      `)
      .eq('saleId', saleId)
      .order('isComboComponent', { ascending: true })

    if (itemsError) {
      return { success: false, error: 'Error obteniendo items de la venta' }
    }

    const regularProducts = saleItems?.filter(item => !item.isComboComponent) || []
    const comboComponents = saleItems?.filter(item => item.isComboComponent) || []

    const result = {
      sale: saleData,
      regularProducts,
      comboComponents,
      hasComboBreakdown: comboComponents.length > 0,
      totalItems: saleItems?.length || 0
    }

    return { success: true, data: result }

  } catch (error) {
    console.error('Error in getSaleBreakdown:', error)
    return {
      success: false,
      error: `Error obteniendo desglose: ${error instanceof Error ? error.message : 'Error desconocido'}`
    }
  }
}
