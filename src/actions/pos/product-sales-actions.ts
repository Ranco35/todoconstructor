'use server'

import { getSupabaseServerClient } from '@/lib/supabase-server'

export interface ProductSalesData {
  productId: number
  productName: string
  categoryId?: number
  categoryName?: string
  totalQuantity: number
  totalAmount: number
  salesCount: number
  averagePrice: number
}

export interface ProductSalesFilters {
  dateFrom?: string
  dateTo?: string
  categoryIds?: number[]
  productIds?: number[]
  catalogProductId?: number
  comboProductId?: number
  includeComboComponents?: boolean
  comboMode?: 'commercial' | 'operational' | 'all'
  registerTypeId?: number
  searchTerm?: string
  page?: number
  limit?: number
}

/**
 * Obtiene ventas agrupadas por productos con filtros opcionales
 */
export async function getProductSalesByDateRange(
  filters: ProductSalesFilters
): Promise<{ success: boolean; data?: ProductSalesData[]; total?: number; totalPages?: number; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    const page = filters.page ?? 1
    const limit = Math.min(Math.max(filters.limit ?? 20, 10), 100)

    const useProductInner = Boolean(filters.categoryIds && filters.categoryIds.length > 0 && !filters.searchTerm)

    const productSelect = useProductInner
      ? `product:POSProduct!inner(
          categoryId,
          category:POSProductCategory(
            id,
            name,
            displayName
          )
        )`
      : `product:POSProduct(
          categoryId,
          category:POSProductCategory(
            id,
            name,
            displayName
          )
        )`

    let linkedPosProductIds: number[] | null = null
    if (filters.catalogProductId) {
      const { data: linkedProducts, error: linkedProductsError } = await supabase
        .from('POSProduct')
        .select('id')
        .eq('productId', filters.catalogProductId)
        .eq('isActive', true)

      if (linkedProductsError) {
        return { success: false, error: linkedProductsError.message }
      }

      linkedPosProductIds = (linkedProducts || []).map((p: { id: number }) => p.id)
      if (linkedPosProductIds.length === 0) {
        return { success: true, data: [], total: 0, totalPages: 0 }
      }
    }

    let query = supabase
      .from('POSSaleItem')
      .select(`
        productId,
        productName,
        isComboComponent,
        comboProductId,
        quantity,
        total,
        unitPrice,
        saleId,
        sale:POSSale!inner(
          createdAt,
          session:CashSession!inner(cashRegisterTypeId)
        ),
        ${productSelect}
      `)

    if (filters.dateFrom) {
      const dateFromStart = `${filters.dateFrom}T00:00:00.000-04:00`
      query = query.gte('sale.createdAt', dateFromStart)
    }

    if (filters.dateTo) {
      const dateToEnd = `${filters.dateTo}T23:59:59.999-03:00`
      query = query.lte('sale.createdAt', dateToEnd)
    }

    if (filters.registerTypeId) {
      query = query.eq('sale.session.cashRegisterTypeId', filters.registerTypeId)
    }

    const comboMode = filters.comboMode ?? (filters.includeComboComponents ? 'all' : 'commercial')
    if (comboMode === 'commercial') {
      query = query.or('isComboComponent.eq.false,isComboComponent.is.null')
    } else if (comboMode === 'operational') {
      query = query.eq('isComboComponent', true)
    }

    if (linkedPosProductIds && linkedPosProductIds.length > 0) {
      query = query.in('productId', linkedPosProductIds)
    }

    if (filters.comboProductId) {
      query = query.eq('comboProductId', filters.comboProductId)
    }

    let matchingProducts: Array<{ id: number; name: string; categoryId?: number; category?: { displayName?: string; name?: string } }> | null = null

    if (filters.searchTerm && filters.searchTerm.trim()) {
      const searchTerm = filters.searchTerm.trim().replace(/%/g, '\\%')

      let productsQuery = supabase
        .from('POSProduct')
        .select(`
          id,
          name,
          productId,
          categoryId,
          category:POSProductCategory(
            id,
            name,
            displayName
          )
        `)
        .ilike('name', `%${searchTerm}%`)
        .eq('isActive', true)

      if (filters.catalogProductId) {
        productsQuery = productsQuery.eq('productId', filters.catalogProductId)
      }

      if (filters.registerTypeId) {
        const { data: categories } = await supabase
          .from('POSProductCategory')
          .select('id')
          .eq('cashRegisterTypeId', filters.registerTypeId)
          .eq('isActive', true)

        const categoryIds = categories?.map((c: { id: number }) => c.id) || []
        if (categoryIds.length > 0) {
          productsQuery = productsQuery.in('categoryId', categoryIds)
        } else {
          return { success: true, data: [], total: 0, totalPages: 0 }
        }
      }

      const { data: productsData, error: productsError } = await productsQuery

      if (productsError) {
        return { success: false, error: productsError.message }
      }

      matchingProducts = productsData || []
      let matchingProductIds = matchingProducts.map((p) => p.id)

      if (matchingProductIds.length === 0) {
        return { success: true, data: [], total: 0, totalPages: 0 }
      }

      if (filters.productIds && filters.productIds.length > 0) {
        const selectedSet = new Set(filters.productIds)
        matchingProductIds = matchingProductIds.filter((id) => selectedSet.has(id))
        if (matchingProductIds.length === 0) {
          return { success: true, data: [], total: 0, totalPages: 0 }
        }
      }

      query = query.in('productId', matchingProductIds)
    } else {
      if (filters.categoryIds && filters.categoryIds.length > 0) {
        query = query.in('product.categoryId', filters.categoryIds)
      }
      if (filters.productIds && filters.productIds.length > 0) {
        query = query.in('productId', filters.productIds)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching product sales:', error)
      return { success: false, error: error.message }
    }

    const groupedData = new Map<number, {
      productId: number
      productName: string
      categoryId?: number
      categoryName?: string
      quantities: number[]
      amounts: number[]
      saleIds: Set<number>
      prices: number[]
    }>()

    const productsWithSales = new Set<number>()

    data?.forEach((item: any) => {
      const productId = item.productId
      const categoryId = item.product?.categoryId
      const categoryName = item.product?.category?.displayName || item.product?.category?.name
      productsWithSales.add(productId)

      if (!groupedData.has(productId)) {
        groupedData.set(productId, {
          productId,
          productName: item.productName,
          categoryId,
          categoryName,
          quantities: [],
          amounts: [],
          saleIds: new Set(),
          prices: []
        })
      }

      const productData = groupedData.get(productId)!
      productData.quantities.push(item.quantity)
      productData.amounts.push(parseFloat(item.total?.toString() || '0'))
      productData.saleIds.add(item.saleId)
      productData.prices.push(parseFloat(item.unitPrice?.toString() || '0'))
    })

    if (matchingProducts && matchingProducts.length > 0) {
      matchingProducts.forEach((product: any) => {
        if (!productsWithSales.has(product.id)) {
          groupedData.set(product.id, {
            productId: product.id,
            productName: product.name,
            categoryId: product.categoryId,
            categoryName: product.category?.displayName || product.category?.name,
            quantities: [],
            amounts: [],
            saleIds: new Set(),
            prices: []
          })
        }
      })
    }

    const result: ProductSalesData[] = Array.from(groupedData.values()).map(item => ({
      productId: item.productId,
      productName: item.productName,
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      totalQuantity: item.quantities.reduce((sum, qty) => sum + qty, 0),
      totalAmount: item.amounts.reduce((sum, amt) => sum + amt, 0),
      salesCount: item.saleIds.size,
      averagePrice: item.prices.length > 0
        ? item.prices.reduce((sum, price) => sum + price, 0) / item.prices.length
        : 0
    }))

    result.sort((a, b) => b.totalAmount - a.totalAmount)

    const total = result.length
    const totalPages = Math.ceil(total / limit)
    const from = (page - 1) * limit
    const paginatedData = result.slice(from, from + limit)

    return {
      success: true,
      data: paginatedData,
      total,
      totalPages
    }
  } catch (error) {
    console.error('Error in getProductSalesByDateRange:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Obtiene ventas agrupadas por categoría
 */
export async function getProductSalesByCategory(
  filters: ProductSalesFilters
): Promise<{ success: boolean; data?: Record<string, ProductSalesData[]>; error?: string }> {
  try {
    const result = await getProductSalesByDateRange(filters)

    if (!result.success || !result.data) {
      return result as any
    }

    const groupedByCategory: Record<string, ProductSalesData[]> = {}

    result.data.forEach(product => {
      const categoryName = product.categoryName || 'Sin categoría'
      if (!groupedByCategory[categoryName]) {
        groupedByCategory[categoryName] = []
      }
      groupedByCategory[categoryName].push(product)
    })

    return { success: true, data: groupedByCategory }
  } catch (error) {
    console.error('Error in getProductSalesByCategory:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Obtiene ventas de productos específicos
 */
export async function getProductSalesByProducts(
  productIds: number[],
  filters: Omit<ProductSalesFilters, 'productIds'>
): Promise<{ success: boolean; data?: ProductSalesData[]; error?: string }> {
  return getProductSalesByDateRange({
    ...filters,
    productIds
  })
}

/**
 * Obtiene lista de productos POS con sus categorías
 */
export async function getPOSProductsWithCategories(
  registerTypeId?: number
): Promise<{ success: boolean; data?: Array<{
  id: number
  name: string
  categoryId?: number
  categoryName?: string
  price: number
  isActive: boolean
}>; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    let query = supabase
      .from('POSProduct')
      .select(`
        id,
        name,
        price,
        isActive,
        categoryId,
        category:POSProductCategory(
          id,
          name,
          displayName,
          cashRegisterTypeId
        )
      `)
      .eq('isActive', true)

    if (registerTypeId) {
      const { data: categories } = await supabase
        .from('POSProductCategory')
        .select('id')
        .eq('cashRegisterTypeId', registerTypeId)
        .eq('isActive', true)

      const categoryIds = categories?.map(c => c.id) || []
      if (categoryIds.length > 0) {
        query = query.in('categoryId', categoryIds)
      } else {
        return { success: true, data: [] }
      }
    }

    const { data, error } = await query.order('name')

    if (error) {
      console.error('Error fetching POS products:', error)
      return { success: false, error: error.message }
    }

    const result = (data || []).map((product: any) => ({
      id: product.id,
      name: product.name,
      categoryId: product.categoryId,
      categoryName: product.category?.displayName || product.category?.name,
      price: parseFloat(product.price?.toString() || '0'),
      isActive: product.isActive
    }))

    return { success: true, data: result }
  } catch (error) {
    console.error('Error in getPOSProductsWithCategories:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Obtiene todas las categorías POS activas
 */
export async function getAllPOSCategories(
  registerTypeId?: number
): Promise<{ success: boolean; data?: Array<{
  id: number
  name: string
  displayName: string
  cashRegisterTypeId?: number
}>; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    let query = supabase
      .from('POSProductCategory')
      .select('id, name, displayName, cashRegisterTypeId')
      .eq('isActive', true)
      .order('sortOrder')

    if (registerTypeId) {
      query = query.eq('cashRegisterTypeId', registerTypeId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching POS categories:', error)
      return { success: false, error: error.message }
    }

    const result = (data || []).map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      displayName: cat.displayName,
      cashRegisterTypeId: cat.cashRegisterTypeId
    }))

    return { success: true, data: result }
  } catch (error) {
    console.error('Error in getAllPOSCategories:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}
