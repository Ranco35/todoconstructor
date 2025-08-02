'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';

export interface ProductForSales {
  id: string;
  defaultCode: string;
  name: string;
  description?: string;
  salePrice: number;
  costPrice: number;
  vat: number;
  category?: {
    id: number;
    name: string;
  };
  type: string;
  active: boolean;
  hasStock: boolean;
  availableStock?: number;
}

export interface ProductSearchFilters {
  search?: string;
  categoryId?: number;
  type?: string;
  active?: boolean;
  limit?: number;
}

export async function getProductsForSales(filters: ProductSearchFilters = {}): Promise<{ success: boolean; data?: ProductForSales[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      search,
      categoryId,
      type,
      active = true,
      limit = 50
    } = filters;

    // Construir query base con información de categoría
    let query = supabase
      .from('Product')
      .select(`
        id,
        sku,
        name,
        description,
        saleprice,
        costprice,
        vat,
        type,
        categoryid,
        Category:categoryid (
          id,
          name
        )
      `)
      .limit(limit);

    // Aplicar filtros
    // Nota: La tabla Product no tiene campo 'active', se asume que todos están activos
    // if (active !== undefined) {
    //   query = query.eq('active', active);
    // }

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (categoryId) {
      query = query.eq('categoryid', categoryId);
    }

    if (type) {
      query = query.eq('type', type);
    }

    // Ordenar por nombre
    query = query.order('name');

    const { data: products, error } = await query;

    if (error) {
      console.error('Error al obtener productos para ventas:', error);
      return { success: false, error: 'Error al obtener productos.' };
    }

    // Obtener información de stock si el producto lo requiere
    const productsWithStock = await Promise.all(
      (products || []).map(async (product) => {
        let availableStock: number | undefined;
        let hasStock = false;

        // Solo verificar stock para productos que lo requieren
        if (['ALMACENABLE', 'CONSUMIBLE'].includes(product.type)) {
          try {
            const { data: stockData } = await supabase
              .from('Warehouse_Product')
              .select('quantity')
              .eq('productId', product.id);

            if (stockData && stockData.length > 0) {
              availableStock = stockData.reduce((total, item) => total + (item.quantity || 0), 0);
              hasStock = availableStock > 0;
            }
          } catch (stockError) {
            console.warn(`Error al obtener stock para producto ${product.id}:`, stockError);
            availableStock = 0;
            hasStock = false;
          }
        } else {
          // Para servicios y otros tipos, no se requiere stock
          hasStock = true;
        }

        return {
          id: product.id,
          defaultCode: product.sku || '',
          name: product.name || '',
          description: product.description,
          salePrice: Number(product.saleprice) || 0,
          costPrice: Number(product.costprice) || 0,
          vat: Number(product.vat) || 19,
          category: product.Category ? {
            id: product.Category.id,
            name: product.Category.name
          } : undefined,
          type: product.type || 'SERVICIO',
          active: true, // Asumimos que todos los productos están activos
          hasStock,
          availableStock
        } as ProductForSales;
      })
    );

    return { success: true, data: productsWithStock };

  } catch (error) {
    console.error('Error inesperado al obtener productos para ventas:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
}

export async function getProductById(productId: string): Promise<{ success: boolean; data?: ProductForSales; error?: string }> {
  try {
    const result = await getProductsForSales({ search: productId, limit: 1 });
    
    if (!result.success) {
      return result;
    }

    const product = result.data?.find(p => p.id === productId || p.defaultCode === productId);
    
    if (!product) {
      return { success: false, error: 'Producto no encontrado.' };
    }

    return { success: true, data: product };

  } catch (error) {
    console.error('Error inesperado al obtener producto por ID:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
}

export async function calculateProductPrice(productId: string, quantity: number = 1, discountPercent: number = 0): Promise<{ success: boolean; data?: { unitPrice: number; subtotal: number; taxes: number; total: number }; error?: string }> {
  try {
    const productResult = await getProductById(productId);
    
    if (!productResult.success || !productResult.data) {
      return { success: false, error: 'Producto no encontrado.' };
    }

    const product = productResult.data;
    const unitPrice = product.salePrice;
    const subtotalBeforeDiscount = quantity * unitPrice;
    const discountAmount = subtotalBeforeDiscount * (discountPercent / 100);
    const subtotal = subtotalBeforeDiscount - discountAmount;
    const taxes = subtotal * (product.vat / 100);
    const total = subtotal + taxes;

    return {
      success: true,
      data: {
        unitPrice,
        subtotal,
        taxes,
        total
      }
    };

  } catch (error) {
    console.error('Error inesperado al calcular precio del producto:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
} 