'use server'

import { getSupabaseServiceClient } from '@/lib/supabase-server'
import { 
  getProductsWithPromotions, 
  getProductsWithPromotionsByCategory, 
  searchProductsWithPromotions,
  ProductWithPromotion 
} from './promotions'

export interface ProductWithStock {
  id: number
  name: string
  sku: string | null
  description: string | null
  brand: string | null
  image: string | null
  saleprice: number | null
  finalPrice: number | null
  vat: number | null
  category: {
    id: number
    name: string
  } | null
  stock: number
  warehouse: {
    id: number
    name: string
  }
}

// Re-exportar el tipo con promociones para compatibilidad
export type { ProductWithPromotion }

export interface ProductCategory {
  id: number
  name: string
  description: string | null
}

/**
 * Obtiene todos los productos con stock positivo para mostrar en el website
 * DEPRECATED: Usar getProductsWithPromotions() para incluir ofertas
 */
export async function getProductsWithStock(): Promise<ProductWithStock[]> {
  const supabase = await getSupabaseServiceClient()

  try {
    const { data, error } = await supabase
      .from('Product')
      .select(`
        id,
        name,
        sku,
        description,
        brand,
        image,
        saleprice,
        finalPrice,
        vat,
        categoryid,
        Warehouse_Product!inner (
          quantity,
          warehouseId
        )
      `)
      .gt('Warehouse_Product.quantity', 0, { foreignTable: 'Warehouse_Product' })
      .order('name')

    if (error) {
      console.error('Error fetching products with stock:', error)
      return []
    }

    // Obtener categorías por separado
    const { data: categoriesData } = await supabase
      .from('Category')
      .select('id, name')

    // Obtener warehouses por separado
    const { data: warehousesData } = await supabase
      .from('Warehouse')
      .select('id, name')

    // Transformar los datos para que sean más fáciles de usar
    const products: ProductWithStock[] = data?.map(product => {
      const category = categoriesData?.find(cat => cat.id === product.categoryid)
      const warehouse = warehousesData?.find(wh => wh.id === product.Warehouse_Product?.[0]?.warehouseId)
      
      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        description: product.description,
        brand: product.brand,
        image: product.image,
        saleprice: product.saleprice,
        finalPrice: product.finalPrice,
        vat: product.vat,
        category: category ? {
          id: category.id,
          name: category.name
        } : null,
        stock: product.Warehouse_Product?.[0]?.quantity || 0,
        warehouse: warehouse ? {
          id: warehouse.id,
          name: warehouse.name
        } : { id: 0, name: 'Sin almacén' }
      }
    }) || []

    return products
  } catch (error) {
    console.error('Error in getProductsWithStock:', error)
    return []
  }
}

/**
 * Obtiene las categorías de productos disponibles
 */
export async function getProductCategories(): Promise<ProductCategory[]> {
  const supabase = await getSupabaseServiceClient()

  try {
    const { data, error } = await supabase
      .from('Category')
      .select('id, name, description')
      .order('name')

    if (error) {
      console.error('Error fetching categories:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getProductCategories:', error)
    return []
  }
}

/**
 * Obtiene productos filtrados por categoría
 * DEPRECATED: Usar getProductsWithPromotionsByCategory() para incluir ofertas
 */
export async function getProductsByCategory(categoryId: number): Promise<ProductWithStock[]> {
  const supabase = await getSupabaseServiceClient()

  try {
    const { data, error } = await supabase
      .from('Product')
      .select(`
        id,
        name,
        sku,
        description,
        brand,
        image,
        saleprice,
        finalPrice,
        vat,
        categoryid,
        Warehouse_Product!inner (
          quantity,
          warehouseId
        )
      `)
      .eq('categoryid', categoryId)
      .gt('Warehouse_Product.quantity', 0, { foreignTable: 'Warehouse_Product' })
      .order('name')

    if (error) {
      console.error('Error fetching products by category:', error)
      return []
    }

    // Obtener categorías y warehouses por separado
    const { data: categoriesData } = await supabase
      .from('Category')
      .select('id, name')

    const { data: warehousesData } = await supabase
      .from('Warehouse')
      .select('id, name')

    const products: ProductWithStock[] = data?.map(product => {
      const category = categoriesData?.find(cat => cat.id === product.categoryid)
      const warehouse = warehousesData?.find(wh => wh.id === product.Warehouse_Product?.[0]?.warehouseId)
      
      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        description: product.description,
        brand: product.brand,
        image: product.image,
        saleprice: product.saleprice,
        finalPrice: product.finalPrice,
        vat: product.vat,
        category: category ? {
          id: category.id,
          name: category.name
        } : null,
        stock: product.Warehouse_Product?.[0]?.quantity || 0,
        warehouse: warehouse ? {
          id: warehouse.id,
          name: warehouse.name
        } : { id: 0, name: 'Sin almacén' }
      }
    }) || []

    return products
  } catch (error) {
    console.error('Error in getProductsByCategory:', error)
    return []
  }
}

/**
 * Busca productos por nombre o descripción  
 * DEPRECATED: Usar searchProductsWithPromotions() para incluir ofertas
 */
export async function searchProducts(query: string): Promise<ProductWithStock[]> {
  const supabase = await getSupabaseServiceClient()

  try {
    const { data, error } = await supabase
      .from('Product')
      .select(`
        id,
        name,
        sku,
        description,
        brand,
        image,
        saleprice,
        finalPrice,
        vat,
        categoryid,
        Warehouse_Product!inner (
          quantity,
          warehouseId
        )
      `)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,brand.ilike.%${query}%`)
      .gt('Warehouse_Product.quantity', 0, { foreignTable: 'Warehouse_Product' })
      .order('name')

    if (error) {
      console.error('Error searching products:', error)
      return []
    }

    // Obtener categorías y warehouses por separado
    const { data: categoriesData } = await supabase
      .from('Category')
      .select('id, name')

    const { data: warehousesData } = await supabase
      .from('Warehouse')
      .select('id, name')

    const products: ProductWithStock[] = data?.map(product => {
      const category = categoriesData?.find(cat => cat.id === product.categoryid)
      const warehouse = warehousesData?.find(wh => wh.id === product.Warehouse_Product?.[0]?.warehouseId)
      
      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        description: product.description,
        brand: product.brand,
        image: product.image,
        saleprice: product.saleprice,
        finalPrice: product.finalPrice,
        vat: product.vat,
        category: category ? {
          id: category.id,
          name: category.name
        } : null,
        stock: product.Warehouse_Product?.[0]?.quantity || 0,
        warehouse: warehouse ? {
          id: warehouse.id,
          name: warehouse.name
        } : { id: 0, name: 'Sin almacén' }
      }
    }) || []

    return products
  } catch (error) {
    console.error('Error in searchProducts:', error)
    return []
  }
}

// ============================================
// NUEVAS FUNCIONES CON PROMOCIONES
// ============================================

/**
 * Función wrapper para obtener productos con promociones (recomendada)
 */
export async function getProductsForWebsite(): Promise<ProductWithPromotion[]> {
  return await getProductsWithPromotions();
}

/**
 * Función wrapper para obtener productos por categoría con promociones
 */
export async function getProductsForWebsiteByCategory(categoryId: number): Promise<ProductWithPromotion[]> {
  return await getProductsWithPromotionsByCategory(categoryId);
}

/**
 * Función wrapper para buscar productos con promociones
 */
export async function searchProductsForWebsite(query: string): Promise<ProductWithPromotion[]> {
  return await searchProductsWithPromotions(query);
}
