'use server'

import { createClient } from '@/lib/supabase-server'

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

export interface ProductCategory {
  id: number
  name: string
  description: string | null
}

/**
 * Obtiene todos los productos con stock positivo para mostrar en el website
 */
export async function getProductsWithStock(): Promise<ProductWithStock[]> {
  const supabase = await createClient()

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
  const supabase = await createClient()

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
 */
export async function getProductsByCategory(categoryId: number): Promise<ProductWithStock[]> {
  const supabase = await createClient()

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
 */
export async function searchProducts(query: string): Promise<ProductWithStock[]> {
  const supabase = await createClient()

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
