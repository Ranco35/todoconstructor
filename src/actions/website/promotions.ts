'use server'

import { getSupabaseServiceClient } from '@/lib/supabase-server'
import { 
  ActivePromotion, 
  calculatePromotionPrice, 
  findBestPromotionForProduct 
} from '@/lib/promotions-utils'

export interface ProductWithPromotion {
  id: number;
  name: string;
  sku: string | null;
  description: string | null;
  brand: string | null;
  image: string | null;
  saleprice: number | null;
  finalPrice: number | null;
  vat: number | null;
  category: {
    id: number;
    name: string;
  } | null;
  stock: number;
  warehouse: {
    id: number;
    name: string;
  };
  // Nuevos campos para promociones
  originalPrice: number | null;
  promotionPrice: number | null;
  hasPromotion: boolean;
  promotionData?: {
    name: string;
    type: string;
    savings: number;
    savingsPercent: number;
  };
}

/**
 * Obtiene todas las promociones activas
 */
export async function getActivePromotions(): Promise<ActivePromotion[]> {
  const supabase = await getSupabaseServiceClient();

  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('PricePromotions')
      .select('*')
      .eq('isActive', true)
      .lte('startDate', now)
      .gte('endDate', now)
      .order('priority', { ascending: false });

    if (error) {
      console.error('Error fetching active promotions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getActivePromotions:', error);
    return [];
  }
}


/**
 * Obtiene productos con promociones aplicadas
 */
export async function getProductsWithPromotions(): Promise<ProductWithPromotion[]> {
  const supabase = await getSupabaseServiceClient();

  try {
    // Obtener TODOS los productos (con y sin stock)
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
        supplierid,
        Warehouse_Product (
          quantity,
          warehouseId
        )
      `)
      .order('name');

    if (error) {
      console.error('Error fetching products with stock:', error);
      return [];
    }

    // Obtener categorías y warehouses
    const [categoriesResult, warehousesResult, promotionsResult] = await Promise.all([
      supabase.from('Category').select('id, name'),
      supabase.from('Warehouse').select('id, name'),
      getActivePromotions()
    ]);

    const categoriesData = categoriesResult.data || [];
    const warehousesData = warehousesResult.data || [];
    const activePromotions = promotionsResult;

    // Transformar productos aplicando promociones
    const products: ProductWithPromotion[] = data?.map(product => {
      const category = categoriesData.find(cat => cat.id === product.categoryid);
      const warehouse = warehousesData.find(wh => wh.id === product.Warehouse_Product?.[0]?.warehouseId);
      
      // Obtener precio original
      const originalPrice = product.finalPrice || product.saleprice || 0;
      
      // Buscar promoción aplicable
      const bestPromotion = findBestPromotionForProduct(
        product.id,
        product.categoryid,
        product.supplierid,
        activePromotions
      );

      let promotionPrice = null;
      let hasPromotion = false;
      let promotionData = undefined;

      if (bestPromotion && originalPrice > 0) {
        promotionPrice = calculatePromotionPrice(originalPrice, bestPromotion);
        hasPromotion = promotionPrice !== originalPrice;
        
        if (hasPromotion) {
          const savings = originalPrice - promotionPrice;
          const savingsPercent = originalPrice > 0 ? (savings / originalPrice * 100) : 0;
          
          promotionData = {
            name: bestPromotion.name,
            type: bestPromotion.promotionType,
            savings: Math.abs(savings),
            savingsPercent: Math.abs(savingsPercent)
          };
        }
      }

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
        } : { id: 0, name: 'Sin almacén' },
        // Campos de promoción
        originalPrice,
        promotionPrice,
        hasPromotion,
        promotionData
      };
    }) || [];

    return products;
  } catch (error) {
    console.error('Error in getProductsWithPromotions:', error);
    return [];
  }
}

/**
 * Obtiene solo productos que tienen promociones activas
 */
export async function getPromotedProductsOnly(): Promise<ProductWithPromotion[]> {
  const allProducts = await getProductsWithPromotions();
  return allProducts.filter(product => product.hasPromotion);
}

/**
 * Obtiene productos con promociones filtrados por categoría
 */
export async function getProductsWithPromotionsByCategory(categoryId: number): Promise<ProductWithPromotion[]> {
  const allProducts = await getProductsWithPromotions();
  return allProducts.filter(product => product.category?.id === categoryId);
}

/**
 * Busca productos con promociones
 */
export async function searchProductsWithPromotions(query: string): Promise<ProductWithPromotion[]> {
  const allProducts = await getProductsWithPromotions();
  const lowerQuery = query.toLowerCase();
  
  return allProducts.filter(product => 
    product.name.toLowerCase().includes(lowerQuery) ||
    product.description?.toLowerCase().includes(lowerQuery) ||
    product.brand?.toLowerCase().includes(lowerQuery) ||
    product.sku?.toLowerCase().includes(lowerQuery)
  );
}
