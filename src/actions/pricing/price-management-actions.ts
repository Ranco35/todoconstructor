'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import { 
  PriceCalculation, 
  PricePromotion, 
  CategoryProfitConfig, 
  ProductProfitConfig,
  calculateCompletePrice,
  validateProfitMargin,
  validatePrice
} from '@/utils/price-utils';

// ============================================
// TIPOS E INTERFACES
// ============================================

export interface PriceHistoryEntry {
  id: number;
  productId: number;
  oldCostPrice: number | null;
  newCostPrice: number | null;
  oldSalePrice: number | null;
  newSalePrice: number | null;
  oldFinalPrice: number | null;
  newFinalPrice: number | null;
  changeReason: string;
  promotionId: number | null;
  profitMarginBefore: number | null;
  profitMarginAfter: number | null;
  changedAt: string;
  changedBy: string | null;
}

export interface PriceAnalysisEntry {
  id: number;
  productId: number;
  analysisDate: string;
  costPrice: number;
  salePrice: number;
  finalPrice: number;
  profitMargin: number;
  profitAmount: number;
  categoryAverageMargin: number | null;
  marketPosition: 'below_market' | 'market_average' | 'above_market' | null;
  competitorPrice: number | null;
  recommendation: string | null;
  createdAt: string;
}

export interface ProductForPricing {
  id: number;
  name: string;
  sku: string | null;
  description: string | null;
  brand: string | null;
  costPrice: number | null;
  salePrice: number | null;
  vat: number | null;
  finalPrice: number | null;
  categoryId: number | null;
  categoryName: string | null;
  supplierId: number | null;
  supplierName: string | null;
  isActive: boolean;
  isForSale: boolean;
  isPOSEnabled: boolean;
}

export interface CreateCategoryProfitConfigData {
  categoryId: number;
  defaultProfitMargin: number;
  minProfitMargin: number;
  maxProfitMargin: number;
  roundingRule: 'none' | 'tens' | 'hundreds' | 'thousands';
}

export interface UpdateCategoryProfitConfigData {
  defaultProfitMargin?: number;
  minProfitMargin?: number;
  maxProfitMargin?: number;
  roundingRule?: 'none' | 'tens' | 'hundreds' | 'thousands';
  isActive?: boolean;
}

export interface CreateProductProfitConfigData {
  productId: number;
  profitMargin: number;
  roundingRule: 'none' | 'tens' | 'hundreds' | 'thousands';
}

export interface UpdateProductProfitConfigData {
  profitMargin?: number;
  roundingRule?: 'none' | 'tens' | 'hundreds' | 'thousands';
  isActive?: boolean;
}

export interface CreatePricePromotionData {
  name: string;
  description?: string;
  promotionType: 'discount_percentage' | 'discount_fixed' | 'markup_percentage' | 'markup_fixed' | 'special_price';
  value: number;
  appliesTo: 'all_products' | 'categories' | 'specific_products' | 'suppliers';
  targetIds: number[];
  startDate: string;
  endDate: string;
  priority: number;
  maxUsage?: number;
}

// ============================================
// CONFIGURACIÓN DE UTILIDADES POR CATEGORÍA
// ============================================

export async function getCategoryProfitConfigs(): Promise<{
  success: boolean;
  data?: CategoryProfitConfig[];
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('CategoryProfitConfig')
      .select(`
        id,
        categoryId,
        defaultProfitMargin,
        minProfitMargin,
        maxProfitMargin,
        roundingRule,
        isActive,
        createdAt,
        updatedAt,
        Category:Category(name)
      `)
      .order('createdAt', { ascending: false });
    
    if (error) {
      console.error('Error fetching category profit configs:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Unexpected error fetching category profit configs:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

export async function getCategoryProfitConfig(categoryId: number): Promise<{
  success: boolean;
  data?: CategoryProfitConfig;
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('CategoryProfitConfig')
      .select('*')
      .eq('categoryId', categoryId)
      .eq('isActive', true)
      .single();
    
    if (error) {
      console.error('Error fetching category profit config:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error fetching category profit config:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

export async function createCategoryProfitConfig(data: CreateCategoryProfitConfigData): Promise<{
  success: boolean;
  data?: CategoryProfitConfig;
  error?: string;
}> {
  try {
    // Validar datos
    const marginValidation = validateProfitMargin(
      data.defaultProfitMargin,
      data.minProfitMargin,
      data.maxProfitMargin
    );
    
    if (!marginValidation.isValid) {
      return { success: false, error: marginValidation.message };
    }
    
    const supabase = await getSupabaseServerClient();
    
    const { data: result, error } = await supabase
      .from('CategoryProfitConfig')
      .insert(data)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating category profit config:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Unexpected error creating category profit config:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

export async function updateCategoryProfitConfig(
  id: number,
  data: UpdateCategoryProfitConfigData
): Promise<{
  success: boolean;
  data?: CategoryProfitConfig;
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data: result, error } = await supabase
      .from('CategoryProfitConfig')
      .update({
        ...data,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating category profit config:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Unexpected error updating category profit config:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

export async function deleteCategoryProfitConfig(id: number): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { error } = await supabase
      .from('CategoryProfitConfig')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting category profit config:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Unexpected error deleting category profit config:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

// ============================================
// CONFIGURACIÓN DE UTILIDADES POR PRODUCTO
// ============================================

export async function getProductProfitConfig(productId: number): Promise<{
  success: boolean;
  data?: ProductProfitConfig;
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('ProductProfitConfig')
      .select('*')
      .eq('productId', productId)
      .eq('isActive', true)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching product profit config:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data: data || null };
  } catch (error) {
    console.error('Unexpected error fetching product profit config:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

export async function createProductProfitConfig(data: CreateProductProfitConfigData): Promise<{
  success: boolean;
  data?: ProductProfitConfig;
  error?: string;
}> {
  try {
    // Validar margen
    const marginValidation = validateProfitMargin(data.profitMargin);
    
    if (!marginValidation.isValid) {
      return { success: false, error: marginValidation.message };
    }
    
    const supabase = await getSupabaseServerClient();
    
    const { data: result, error } = await supabase
      .from('ProductProfitConfig')
      .insert(data)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating product profit config:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Unexpected error creating product profit config:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

export async function updateProductProfitConfig(
  id: number,
  data: UpdateProductProfitConfigData
): Promise<{
  success: boolean;
  data?: ProductProfitConfig;
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data: result, error } = await supabase
      .from('ProductProfitConfig')
      .update({
        ...data,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating product profit config:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Unexpected error updating product profit config:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

export async function deleteProductProfitConfig(id: number): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { error } = await supabase
      .from('ProductProfitConfig')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting product profit config:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Unexpected error deleting product profit config:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

// ============================================
// PROMOCIONES DE PRECIOS
// ============================================

export async function getPricePromotions(): Promise<{
  success: boolean;
  data?: PricePromotion[];
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('PricePromotions')
      .select('*')
      .order('priority', { ascending: false })
      .order('createdAt', { ascending: false });
    
    if (error) {
      console.error('Error fetching price promotions:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Unexpected error fetching price promotions:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

export async function getActivePricePromotions(): Promise<{
  success: boolean;
  data?: PricePromotion[];
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('PricePromotions')
      .select('*')
      .eq('isActive', true)
      .lte('startDate', now)
      .gte('endDate', now)
      .order('priority', { ascending: false });
    
    if (error) {
      console.error('Error fetching active price promotions:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Unexpected error fetching active price promotions:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

export async function createPricePromotion(data: CreatePricePromotionData): Promise<{
  success: boolean;
  data?: PricePromotion;
  error?: string;
}> {
  try {
    // Validar fechas
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    
    if (startDate >= endDate) {
      return { success: false, error: 'La fecha de inicio debe ser anterior a la fecha de fin' };
    }
    
    // Validar valor
    if (data.value <= 0) {
      return { success: false, error: 'El valor de la promoción debe ser mayor a cero' };
    }
    
    const supabase = await getSupabaseServerClient();
    
    const { data: result, error } = await supabase
      .from('PricePromotions')
      .insert(data)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating price promotion:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Unexpected error creating price promotion:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

export async function updatePricePromotion(
  id: number,
  data: Partial<CreatePricePromotionData & { isActive: boolean }>
): Promise<{
  success: boolean;
  data?: PricePromotion;
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data: result, error } = await supabase
      .from('PricePromotions')
      .update({
        ...data,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating price promotion:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Unexpected error updating price promotion:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

export async function deletePricePromotion(id: number): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { error } = await supabase
      .from('PricePromotions')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting price promotion:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Unexpected error deleting price promotion:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

// ============================================
// HISTORIAL DE PRECIOS
// ============================================

export async function getPriceHistory(productId?: number): Promise<{
  success: boolean;
  data?: PriceHistoryEntry[];
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();
    
    let query = supabase
      .from('PriceHistory')
      .select(`
        *,
        Product:Product(name),
        User:User(email)
      `)
      .order('changedAt', { ascending: false });
    
    if (productId) {
      query = query.eq('productId', productId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching price history:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Unexpected error fetching price history:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

// ============================================
// ANÁLISIS DE PRECIOS
// ============================================

export async function getPriceAnalysis(productId?: number): Promise<{
  success: boolean;
  data?: PriceAnalysisEntry[];
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();
    
    let query = supabase
      .from('PriceAnalysis')
      .select(`
        *,
        Product:Product(name)
      `)
      .order('analysisDate', { ascending: false });
    
    if (productId) {
      query = query.eq('productId', productId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching price analysis:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Unexpected error fetching price analysis:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

export async function createPriceAnalysis(data: {
  productId: number;
  costPrice: number;
  salePrice: number;
  finalPrice: number;
  profitMargin: number;
  profitAmount: number;
  categoryAverageMargin?: number;
  marketPosition?: 'below_market' | 'market_average' | 'above_market';
  competitorPrice?: number;
  recommendation?: string;
}): Promise<{
  success: boolean;
  data?: PriceAnalysisEntry;
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const analysisData = {
      ...data,
      analysisDate: new Date().toISOString().split('T')[0]
    };
    
    const { data: result, error } = await supabase
      .from('PriceAnalysis')
      .insert(analysisData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating price analysis:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Unexpected error creating price analysis:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

// ============================================
// FUNCIONES DE CÁLCULO Y ACTUALIZACIÓN MASIVA
// ============================================

export async function updateProductPriceFromCost(
  productId: number,
  costPrice: number,
  reason: string = 'cost_update'
): Promise<{
  success: boolean;
  data?: PriceCalculation;
  error?: string;
}> {
  try {
    // Validar precio de costo
    const priceValidation = validatePrice(costPrice);
    if (!priceValidation.isValid) {
      return { success: false, error: priceValidation.message };
    }
    
    const supabase = await getSupabaseServerClient();
    
    // Obtener configuración del producto o categoría
    const productConfigResult = await getProductProfitConfig(productId);
    let profitMargin = 30; // Margen por defecto
    let roundingRule: 'none' | 'tens' | 'hundreds' | 'thousands' = 'hundreds';
    
    if (productConfigResult.success && productConfigResult.data) {
      profitMargin = productConfigResult.data.profitMargin;
      roundingRule = productConfigResult.data.roundingRule;
    } else {
      // Obtener configuración de categoría
      const { data: product } = await supabase
        .from('Product')
        .select('categoryId')
        .eq('id', productId)
        .single();
      
      if (product?.categoryId) {
        const categoryConfigResult = await getCategoryProfitConfig(product.categoryId);
        if (categoryConfigResult.success && categoryConfigResult.data) {
          profitMargin = categoryConfigResult.data.defaultProfitMargin;
          roundingRule = categoryConfigResult.data.roundingRule;
        }
      }
    }
    
    // Calcular nuevo precio
    const calculation = calculateCompletePrice(costPrice, profitMargin, 19, roundingRule);
    
    // Actualizar producto
    const { data: updatedProduct, error } = await supabase
      .from('Product')
      .update({
        costprice: costPrice,
        saleprice: calculation.salePrice,
        // El trigger automáticamente actualizará final_price_with_vat
      })
      .eq('id', productId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating product price:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data: calculation };
  } catch (error) {
    console.error('Unexpected error updating product price:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

export async function updateCategoryPricesFromCost(
  categoryId: number,
  reason: string = 'margin_adjustment'
): Promise<{
  success: boolean;
  data?: { updated: number; errors: string[] };
  error?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Obtener configuración de categoría
    const categoryConfigResult = await getCategoryProfitConfig(categoryId);
    if (!categoryConfigResult.success || !categoryConfigResult.data) {
      return { success: false, error: 'No se encontró configuración para la categoría' };
    }
    
    const config = categoryConfigResult.data;
    
    // Obtener productos de la categoría
    const { data: products, error: productsError } = await supabase
      .from('Product')
      .select('id, costprice')
      .eq('categoryId', categoryId)
      .not('costprice', 'is', null);
    
    if (productsError) {
      console.error('Error fetching products:', productsError);
      return { success: false, error: productsError.message };
    }
    
    let updated = 0;
    const errors: string[] = [];
    
    // Actualizar cada producto
    for (const product of products || []) {
      if (!product.costprice) continue;
      
      const result = await updateProductPriceFromCost(product.id, product.costprice, reason);
      if (result.success) {
        updated++;
      } else {
        errors.push(`Producto ${product.id}: ${result.error}`);
      }
    }
    
    return { success: true, data: { updated, errors } };
  } catch (error) {
    console.error('Unexpected error updating category prices:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

// ============================================
// FUNCIONES PARA PRODUCTOS
// ============================================

/**
 * Obtiene productos para gestión de precios
 */
export async function getProductsForPricing(params: {
  search?: string;
  categoryId?: number;
  supplierId?: number;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<{ success: boolean; data?: ProductForPricing[]; error?: string; total?: number }> {
  try {
    const supabase = await getSupabaseServerClient();
    const { search, categoryId, supplierId, isActive = true, page = 1, pageSize = 50 } = params;

    let query = supabase
      .from('Product')
      .select(`
        id,
        name,
        sku,
        description,
        brand,
        costprice,
        saleprice,
        vat,
        finalPrice,
        categoryid,
        supplierid,
        isForSale,
        isPOSEnabled
      `)
      .order('name');

    // Aplicar filtros
    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (categoryId) {
      query = query.eq('categoryid', categoryId);
    }

    if (supplierId) {
      query = query.eq('supplierid', supplierId);
    }

    // Aplicar paginación
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return { success: false, error: 'Error al obtener productos' };
    }

    // Obtener categorías y proveedores por separado
    const { data: categories } = await supabase
      .from('Category')
      .select('id, name');
    
    const { data: suppliers } = await supabase
      .from('Supplier')
      .select('id, name');

    // Crear mapas para búsqueda rápida
    const categoryMap = new Map(categories?.map(cat => [cat.id, cat.name]) || []);
    const supplierMap = new Map(suppliers?.map(supp => [supp.id, supp.name]) || []);

    // Transformar datos
    const products: ProductForPricing[] = data?.map(product => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      description: product.description,
      brand: product.brand,
      costPrice: product.costprice,
      salePrice: product.saleprice,
      vat: product.vat,
      finalPrice: product.finalPrice,
      categoryId: product.categoryid,
      categoryName: product.categoryid ? categoryMap.get(product.categoryid) || null : null,
      supplierId: product.supplierid,
      supplierName: product.supplierid ? supplierMap.get(product.supplierid) || null : null,
      isActive: true, // Por defecto activo hasta que se implemente la columna
      isForSale: product.isForSale,
      isPOSEnabled: product.isPOSEnabled
    })) || [];

    return { 
      success: true, 
      data: products, 
      total: count || 0 
    };

  } catch (error) {
    console.error('Error fetching products for pricing:', error);
    return { success: false, error: 'Error al obtener productos' };
  }
}

/**
 * Obtiene un producto específico para gestión de precios
 */
export async function getProductForPricing(productId: number): Promise<{ success: boolean; data?: ProductForPricing; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from('Product')
      .select(`
        id,
        name,
        sku,
        description,
        brand,
        costprice,
        saleprice,
        vat,
        finalPrice,
        categoryid,
        supplierid,
        isForSale,
        isPOSEnabled
      `)
      .eq('id', productId)
      .single();

    if (error) {
      console.error('Error fetching product:', error);
      return { success: false, error: 'Error al obtener producto' };
    }

    if (!data) {
      return { success: false, error: 'Producto no encontrado' };
    }

    // Obtener nombre de categoría si existe
    let categoryName = null;
    if (data.categoryid) {
      const { data: category } = await supabase
        .from('Category')
        .select('name')
        .eq('id', data.categoryid)
        .single();
      categoryName = category?.name || null;
    }

    // Obtener nombre de proveedor si existe
    let supplierName = null;
    if (data.supplierid) {
      const { data: supplier } = await supabase
        .from('Supplier')
        .select('name')
        .eq('id', data.supplierid)
        .single();
      supplierName = supplier?.name || null;
    }

    const product: ProductForPricing = {
      id: data.id,
      name: data.name,
      sku: data.sku,
      description: data.description,
      brand: data.brand,
      costPrice: data.costprice,
      salePrice: data.saleprice,
      vat: data.vat,
      finalPrice: data.finalPrice,
      categoryId: data.categoryid,
      categoryName: categoryName,
      supplierId: data.supplierid,
      supplierName: supplierName,
      isActive: true, // Por defecto activo hasta que se implemente la columna
      isForSale: data.isForSale,
      isPOSEnabled: data.isPOSEnabled
    };

    return { success: true, data: product };

  } catch (error) {
    console.error('Error fetching product for pricing:', error);
    return { success: false, error: 'Error al obtener producto' };
  }
}

/**
 * Actualiza precios de un producto
 */
export async function updateProductPrices(params: {
  productId: number;
  costPrice?: number;
  salePrice?: number;
  finalPrice?: number;
  changeReason: string;
  changedBy?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const { productId, costPrice, salePrice, finalPrice, changeReason, changedBy } = params;

    // Obtener datos actuales del producto
    const { data: currentProduct, error: fetchError } = await supabase
      .from('Product')
      .select('costprice, saleprice, finalPrice')
      .eq('id', productId)
      .single();

    if (fetchError || !currentProduct) {
      return { success: false, error: 'Producto no encontrado' };
    }

    // Preparar datos de actualización
    const updateData: any = {};
    if (costPrice !== undefined) updateData.costprice = costPrice;
    if (salePrice !== undefined) updateData.saleprice = salePrice;
    if (finalPrice !== undefined) updateData.finalPrice = finalPrice;
    updateData.updatedAt = new Date().toISOString();

    // Actualizar producto
    const { error: updateError } = await supabase
      .from('Product')
      .update(updateData)
      .eq('id', productId);

    if (updateError) {
      console.error('Error updating product prices:', updateError);
      return { success: false, error: 'Error al actualizar precios del producto' };
    }

    // Registrar en historial de precios
    const historyData = {
      productId,
      oldCostPrice: currentProduct.costprice,
      newCostPrice: costPrice || currentProduct.costprice,
      oldSalePrice: currentProduct.saleprice,
      newSalePrice: salePrice || currentProduct.saleprice,
      oldFinalPrice: currentProduct.finalPrice,
      newFinalPrice: finalPrice || currentProduct.finalPrice,
      changeReason,
      changedBy: changedBy || null,
      profitMarginBefore: currentProduct.costprice && currentProduct.saleprice 
        ? ((currentProduct.saleprice - currentProduct.costprice) / currentProduct.costprice) * 100 
        : null,
      profitMarginAfter: (costPrice && salePrice) 
        ? ((salePrice - costPrice) / costPrice) * 100 
        : null,
      changedAt: new Date().toISOString()
    };

    const { error: historyError } = await supabase
      .from('PriceHistory')
      .insert(historyData);

    if (historyError) {
      console.warn('Error saving price history:', historyError);
      // No fallar por esto, solo registrar warning
    }

    return { success: true };

  } catch (error) {
    console.error('Error updating product prices:', error);
    return { success: false, error: 'Error al actualizar precios del producto' };
  }
}
