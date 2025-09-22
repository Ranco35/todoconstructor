'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';

export interface SimpleProduct {
  id: number;
  name: string;
  sku: string | null;
  costPrice: number | null;
  salePrice: number | null;
  categoryName: string | null;
  supplierName: string | null;
  vat: number | null;
  stock: number | null;
}

export async function getSimpleProducts(params: {
  search?: string;
  page?: number;
  pageSize?: number;
  stockFilter?: 'all' | 'with_stock' | 'no_stock';
} = {}): Promise<{ 
  success: boolean; 
  data?: SimpleProduct[]; 
  error?: string;
  totalCount?: number;
  totalPages?: number;
}> {
  try {
    const supabase = await getSupabaseServerClient();
    const { search, page = 1, pageSize = 20, stockFilter = 'all' } = params;
    
    // Si necesitamos filtrar por stock, necesitamos obtener todos los productos primero
    // y luego aplicar el filtro antes de la paginación
    let allProducts: SimpleProduct[] = [];
    let totalCount = 0;

    if (stockFilter === 'all') {
      // Para 'all', podemos usar paginación normal
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      let query = supabase
        .from('Product')
        .select(`
          id,
          name,
          sku,
          costprice,
          saleprice,
          categoryid,
          supplierid,
          vat
        `, { count: 'exact' })
        .order('name');

      if (search && search.trim()) {
        query = query.or(`name.ilike.%${search.trim()}%,sku.ilike.%${search.trim()}%`);
      }

      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching simple products:', error);
        return { success: false, error: error.message };
      }

      if (!data || data.length === 0) {
        return { success: true, data: [], totalCount: count || 0, totalPages: 0 };
      }

      // Obtener categorías y proveedores
      const { data: categories } = await supabase
        .from('Category')
        .select('id, name');
      
      const { data: suppliers } = await supabase
        .from('Supplier')
        .select('id, name');

      const categoryMap = new Map(categories?.map(cat => [cat.id, cat.name]) || []);
      const supplierMap = new Map(suppliers?.map(supp => [supp.id, supp.name]) || []);

      // Obtener stock para estos productos
      const productIds = data.map(p => p.id);
      const { data: warehouseProducts } = await supabase
        .from('Warehouse_Product')
        .select('productId, quantity')
        .in('productId', productIds);

      const stockMap = new Map<number, number>();
      warehouseProducts?.forEach(wp => {
        const currentStock = stockMap.get(wp.productId) || 0;
        stockMap.set(wp.productId, currentStock + (wp.quantity || 0));
      });

      allProducts = data.map(product => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        costPrice: product.costprice,
        salePrice: product.saleprice,
        categoryName: product.categoryid ? categoryMap.get(product.categoryid) || null : null,
        supplierName: product.supplierid ? supplierMap.get(product.supplierid) || null : null,
        vat: product.vat,
        stock: stockMap.get(product.id) || 0
      }));

      totalCount = count || 0;
    } else {
      // Para filtros de stock, necesitamos obtener todos los productos primero
      let query = supabase
        .from('Product')
        .select(`
          id,
          name,
          sku,
          costprice,
          saleprice,
          categoryid,
          supplierid,
          vat
        `, { count: 'exact' })
        .order('name');

      if (search && search.trim()) {
        query = query.or(`name.ilike.%${search.trim()}%,sku.ilike.%${search.trim()}%`);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching simple products:', error);
        return { success: false, error: error.message };
      }

      if (!data || data.length === 0) {
        return { success: true, data: [], totalCount: 0, totalPages: 0 };
      }

      // Obtener categorías y proveedores
      const { data: categories } = await supabase
        .from('Category')
        .select('id, name');
      
      const { data: suppliers } = await supabase
        .from('Supplier')
        .select('id, name');

      const categoryMap = new Map(categories?.map(cat => [cat.id, cat.name]) || []);
      const supplierMap = new Map(suppliers?.map(supp => [supp.id, supp.name]) || []);

      // Obtener stock para todos los productos
      const productIds = data.map(p => p.id);
      const { data: warehouseProducts } = await supabase
        .from('Warehouse_Product')
        .select('productId, quantity')
        .in('productId', productIds);

      const stockMap = new Map<number, number>();
      warehouseProducts?.forEach(wp => {
        const currentStock = stockMap.get(wp.productId) || 0;
        stockMap.set(wp.productId, currentStock + (wp.quantity || 0));
      });

      // Transformar datos y aplicar filtro de stock
      let allProductsWithStock = data.map(product => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        costPrice: product.costprice,
        salePrice: product.saleprice,
        categoryName: product.categoryid ? categoryMap.get(product.categoryid) || null : null,
        supplierName: product.supplierid ? supplierMap.get(product.supplierid) || null : null,
        vat: product.vat,
        stock: stockMap.get(product.id) || 0
      }));

      // Aplicar filtro de stock
      if (stockFilter === 'with_stock') {
        allProductsWithStock = allProductsWithStock.filter(p => (p.stock || 0) > 0);
      } else if (stockFilter === 'no_stock') {
        allProductsWithStock = allProductsWithStock.filter(p => (p.stock || 0) === 0);
      }

      totalCount = allProductsWithStock.length;
      allProducts = allProductsWithStock;
    }

    // Aplicar paginación a los productos filtrados
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    const paginatedProducts = allProducts.slice(from, to);
    const totalPages = Math.ceil(totalCount / pageSize);

    return { 
      success: true, 
      data: paginatedProducts, 
      totalCount, 
      totalPages 
    };

  } catch (error: any) {
    console.error('Error in getSimpleProducts:', error);
    return { success: false, error: error.message };
  }
}

export async function getSimpleProduct(productId: number): Promise<{ 
  success: boolean; 
  data?: SimpleProduct; 
  error?: string; 
}> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('Product')
      .select(`
        id,
        name,
        sku,
        costprice,
        saleprice,
        categoryid,
        supplierid,
        vat
      `)
      .eq('id', productId)
      .single();

    if (error) {
      return { success: false, error: error.message };
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

    // Obtener stock total del producto
    const { data: warehouseProducts } = await supabase
      .from('Warehouse_Product')
      .select('quantity')
      .eq('productId', productId);

    const totalStock = warehouseProducts?.reduce((sum, wp) => sum + (wp.quantity || 0), 0) || 0;

    const product: SimpleProduct = {
      id: data.id,
      name: data.name,
      sku: data.sku,
      costPrice: data.costprice,
      salePrice: data.saleprice,
      categoryName: categoryName,
      supplierName: supplierName,
      vat: data.vat,
      stock: totalStock
    };

    return { success: true, data: product };

  } catch (error: any) {
    console.error('Error in getSimpleProduct:', error);
    return { success: false, error: error.message };
  }
}

// Función para actualizar precios de un producto
export async function updateProductPrices(params: {
  productId: number;
  costPrice?: number;
  salePrice?: number;
  finalPrice?: number;
  reason: string;
  priceType?: 'net' | 'gross';
}): Promise<{ 
  success: boolean; 
  message?: string; 
  error?: string; 
}> {
  try {
    const supabase = await getSupabaseServerClient();
    const { productId, costPrice, salePrice, finalPrice, reason, priceType = 'net' } = params;

    // Validar que al menos un precio se proporcione
    if (!costPrice && !salePrice && !finalPrice) {
      return { success: false, error: 'Debe proporcionar al menos un precio para actualizar' };
    }

    // Validar que se proporcione la razón
    if (!reason || reason.trim() === '') {
      return { success: false, error: 'Debe proporcionar una razón para el cambio de precio' };
    }

    // Obtener información del producto para calcular IVA
    const { data: productData } = await supabase
      .from('Product')
      .select('vat')
      .eq('id', productId)
      .single();

    const vatRate = productData?.vat || 0;

    // Función para convertir precio bruto a neto
    const convertGrossToNet = (grossPrice: number) => {
      if (priceType === 'gross' && vatRate > 0) {
        return Math.round(grossPrice / (1 + vatRate / 100));
      }
      return grossPrice;
    };

    // Preparar datos para actualizar (siempre guardar precios netos en la base de datos)
    const updateData: any = {};
    
    if (costPrice !== undefined) {
      updateData.costprice = convertGrossToNet(costPrice);
    }
    
    if (salePrice !== undefined) {
      updateData.saleprice = convertGrossToNet(salePrice);
    }

    // Si se proporciona finalPrice, usarlo como salePrice
    if (finalPrice !== undefined) {
      updateData.saleprice = convertGrossToNet(finalPrice);
    }

    // Log de la actualización para debugging
    console.log(`🔄 Actualizando precios para producto ${productId}:`, {
      costPrice,
      salePrice,
      finalPrice,
      priceType,
      reason,
      updateData
    });

    // Actualizar el producto en la base de datos
    const { error: updateError } = await supabase
      .from('Product')
      .update(updateData)
      .eq('id', productId);

    if (updateError) {
      console.error('❌ Error updating product prices:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log(`✅ Precios actualizados exitosamente para producto ${productId}`);

    // TODO: Implementar historial de cambios de precios de manera segura
    // Por ahora, no registramos en PriceHistory para evitar errores de trigger
    console.log('📝 Cambio de precio registrado (historial deshabilitado temporalmente):', {
      productId,
      costPrice,
      salePrice: salePrice || finalPrice,
      reason,
      priceType
    });

    // Construir mensaje de confirmación
    const updatedFields = [];
    if (costPrice !== undefined) {
      const netCostPrice = convertGrossToNet(costPrice);
      if (priceType === 'gross') {
        updatedFields.push(`Precio de costo: $${costPrice.toLocaleString()} (bruto) → $${netCostPrice.toLocaleString()} (neto guardado)`);
      } else {
        updatedFields.push(`Precio de costo: $${costPrice.toLocaleString()} (neto)`);
      }
    }
    if (salePrice !== undefined) {
      const netSalePrice = convertGrossToNet(salePrice);
      if (priceType === 'gross') {
        updatedFields.push(`Precio de venta: $${salePrice.toLocaleString()} (bruto) → $${netSalePrice.toLocaleString()} (neto guardado)`);
      } else {
        updatedFields.push(`Precio de venta: $${salePrice.toLocaleString()} (neto)`);
      }
    }
    if (finalPrice !== undefined) {
      const netFinalPrice = convertGrossToNet(finalPrice);
      if (priceType === 'gross') {
        updatedFields.push(`Precio final: $${finalPrice.toLocaleString()} (bruto) → $${netFinalPrice.toLocaleString()} (neto guardado)`);
      } else {
        updatedFields.push(`Precio final: $${finalPrice.toLocaleString()} (neto)`);
      }
    }

    const message = `✅ Precios actualizados correctamente:
${updatedFields.map(field => `• ${field}`).join('\n')}
• Razón: ${reason}
• Tipo ingresado: ${priceType === 'net' ? 'Neto (sin IVA)' : 'Bruto (con IVA)'}
• Guardado en BD: Siempre como Neto (sin IVA)
• Fecha: ${new Date().toLocaleString()}`;

    return { 
      success: true, 
      message: message
    };

  } catch (error: any) {
    console.error('Error in updateProductPrices:', error);
    return { success: false, error: error.message || 'Error inesperado al actualizar precios' };
  }
}
