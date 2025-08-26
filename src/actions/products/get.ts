"use server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ProductType } from '@/types/product';
import { mapProductDBToFrontend, ProductDB } from '@/lib/product-mapper';
import { getSupabaseServiceClient } from '@/lib/supabase-server';
import { getCategoryTableName } from '@/lib/table-resolver';

async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );
}

export async function getProductById(id: number) {
  try {
    const supabase = await getSupabaseClient();
    
    console.log('🔍 DEBUG - Cargando producto ID:', id);
    
    // Consulta SIMPLE (sin relaciones) para evitar errores de relaciones en PostgREST
    let product: any = null;
    let simpleError: any = null;
    {
      const { data, error } = await supabase
        .from('Product')
        .select('*')
        .eq('id', id)
        .single();
      product = data;
      simpleError = error;
    }

    // Fallback con service client si falla por RLS u otros motivos
    if ((!product || simpleError) && !product) {
      try {
        const svc = await getSupabaseServiceClient();
        const { data: svcProduct } = await svc
          .from('Product')
          .select('*')
          .eq('id', id)
          .single();
        if (svcProduct) product = svcProduct;
      } catch (e) {
        console.error('Error fetching product with service client:', e);
      }
    }

    if (!product) {
      console.error('Error fetching product:', simpleError || 'Producto no encontrado');
      return null;
    }

    console.log('🔍 DEBUG - Producto cargado:', product.name);
    console.log('🔍 DEBUG - Datos del producto:', {
      id: product.id,
      name: product.name,
      saleprice: product.saleprice,
      vat: product.vat,
      finalPrice: product.finalPrice,
      isForSale: product.isForSale,
      type: product.type,
      // 🔍 NUEVOS LOGS PARA UNIDADES
      salesunitid: product.salesunitid,
      purchaseunitid: product.purchaseunitid,
      unit: product.unit
    });

    // Mapear producto de snake_case (BD) a camelCase (Frontend)
    const mappedProduct = mapProductDBToFrontend(product as ProductDB);
    
    console.log('🔍 DEBUG - Producto mapeado:', {
      id: mappedProduct.id,
      name: mappedProduct.name,
      salePrice: mappedProduct.salePrice,
      finalPrice: mappedProduct.finalPrice,
      vat: mappedProduct.vat,
      isForSale: mappedProduct.isForSale,
      type: mappedProduct.type,
      // 🔍 NUEVOS LOGS PARA UNIDADES MAPEADAS
      salesUnitId: mappedProduct.salesUnitId,
      purchaseUnitId: mappedProduct.purchaseUnitId,
      unit: mappedProduct.unit
    });

    // Obtener registros de stock desde Warehouse_Product (sin joins)
    console.log('🔍 DEBUG - Buscando stock para producto:', id);
    const { data: warehouseProducts, error: stockError } = await supabase
      .from('Warehouse_Product')
      .select('*')
      .eq('productId', id);

    if (stockError) {
      console.error('Error obteniendo stock:', stockError);
    }

    let stock = undefined;
    if (warehouseProducts && warehouseProducts.length > 0) {
      const wp = warehouseProducts[0];
      console.log('🔍 DEBUG - Stock encontrado:', wp);
      stock = {
        min: wp.minStock || 0,
        max: wp.maxStock || 0,
        current: wp.quantity || 0,
        warehouseid: wp.warehouseId || undefined
      };
      console.log('🔍 DEBUG - Stock procesado:', stock);
    } else {
      console.log('🔍 DEBUG - No se encontró stock para el producto');
    }

    // Cargar categorías POS del producto (robusto, sin fallar si falta tabla/RLS)
    console.log('🔍 DEBUG - Cargando categorías POS para producto:', id);
    let posCategoriesRaw: any[] = [];
    try {
      const { data, error } = await supabase
        .from('ProductPOSCategory')
        .select('poscategoryid, cashregistertypeid')
        .eq('productid', id);
      if (!error && data) {
        posCategoriesRaw = data;
      } else {
        // Fallback con service client
        try {
          const svc = await getSupabaseServiceClient();
          const { data: svcData } = await svc
            .from('ProductPOSCategory')
            .select('poscategoryid, cashregistertypeid')
            .eq('productid', id);
          if (svcData) posCategoriesRaw = svcData;
        } catch (e) {
          // Ignorar silenciosamente: consideramos que no hay categorías POS
        }
      }
    } catch (e) {
      // Tabla inexistente u otras restricciones; continuar sin POS categories
    }

    // Mapear los nombres de columnas de snake_case a camelCase
    const posCategories = (posCategoriesRaw || []).map(item => ({
      posCategoryId: item.poscategoryid,
      cashRegisterTypeId: item.cashregistertypeid
    }));
    console.log('🔍 DEBUG - Categorías POS cargadas:', posCategories);

    // Determinar el tipo de producto basándose en sus características
    const determineProductType = (): ProductType => {
      // Verificar si es SERVICIO
      // Los servicios tienen precio de venta y no tienen stock (pueden tener proveedor)
      if (mappedProduct.salePrice && (!stock || stock.current === 0) && !mappedProduct.costPrice) {
        return ProductType.SERVICIO;
      }
      
      // Verificar si es ALMACENABLE
      // Los productos almacenables tienen stock
      if (stock && stock.current > 0) {
        return ProductType.ALMACENABLE;
      }
      
      // Verificar si es CONSUMIBLE
      // Los consumibles tienen proveedor y precio de costo
      if (mappedProduct.supplierId && mappedProduct.costPrice) {
        return ProductType.CONSUMIBLE;
      }
      
      // Verificar si es INVENTARIO
      // Los productos de inventario tienen precio de costo pero no stock
      if (mappedProduct.costPrice && (!stock || stock.current === 0)) {
        return ProductType.INVENTARIO;
      }
      
      // Verificar si es COMBO
      // Los combos tienen precio de venta pero no stock ni proveedor ni costo
      if (mappedProduct.salePrice && !mappedProduct.supplierId && !mappedProduct.costPrice) {
        return ProductType.COMBO;
      }
      
      // Por defecto, ALMACENABLE
      return ProductType.ALMACENABLE;
    };

    // Cargar componentes si es un producto COMBO
    let components = [];
    const productType = (product as any).type || determineProductType();
    
    if (productType === ProductType.COMBO) {
      console.log('🔍 DEBUG - Cargando componentes para combo:', id);
      
      const { data: comboComponents, error: componentsError } = await supabase
        .from('product_components')
        .select(`
          id,
          quantity,
          unit_price,
          component_product_id,
          Product:component_product_id (
            id,
            name,
            sku
          )
        `)
        .eq('combo_product_id', id);

      if (componentsError) {
        console.error('Error cargando componentes:', componentsError);
      } else if (comboComponents && comboComponents.length > 0) {
        components = comboComponents.map((comp: any) => ({
          id: comp.component_product_id,
          quantity: comp.quantity,
          price: comp.unit_price
        }));
        console.log('🔍 DEBUG - Componentes cargados:', components);
      }
    }

    // Cargar categoría y proveedor con llamadas simples (sin joins)
    let categoryObj: any = null;
    if ((product as any).categoryid) {
      try {
        const categoryTable = await getCategoryTableName(supabase as any);
        const { data: cat } = await (supabase as any)
          .from(categoryTable)
          .select('id, name')
          .eq('id', (product as any).categoryid)
          .single();
        if (cat) categoryObj = cat;
      } catch {}
    }

    let supplierObj: any = null;
    if ((product as any).supplierid) {
      try {
        const { data: sup } = await supabase
          .from('Supplier')
          .select('id, name')
          .eq('id', (product as any).supplierid)
          .single();
        if (sup) supplierObj = sup;
      } catch {}
    }

    // Convertir los datos para que sean compatibles con el formulario
    const result = {
      ...mappedProduct,
      // Usar el campo type de la base de datos
      type: productType,
      stock,
      components,
      // Agregar las categorías POS cargadas
      posCategories,
      // Relacionados cargados manualmente
      Category: categoryObj ? { id: categoryObj.id, name: categoryObj.name } : null,
      Supplier: supplierObj ? { id: supplierObj.id, name: supplierObj.name } : null,
      // Pasar también los registros de bodega
      Warehouse_Products: warehouseProducts || [],
      // Campos de equipos/máquinas
      isEquipment: (product as any).isEquipment || false,
      model: (product as any).model || '',
      serialNumber: (product as any).serialNumber || '',
      purchaseDate: (product as any).purchaseDate || '',
      warrantyExpiration: (product as any).warrantyExpiration || '',
      usefulLife: (product as any).usefulLife || null,
      maintenanceInterval: (product as any).maintenanceInterval || null,
      lastMaintenance: (product as any).lastMaintenance || '',
      nextMaintenance: (product as any).nextMaintenance || '',
      maintenanceCost: (product as any).maintenanceCost || null,
      maintenanceProvider: (product as any).maintenanceProvider || '',
      currentLocation: (product as any).currentLocation || '',
      responsiblePerson: (product as any).responsiblePerson || '',
      operationalStatus: (product as any).operationalStatus || 'OPERATIVO',
    };

    console.log('🔍 DEBUG - Producto final procesado:', {
      id: result.id,
      name: result.name,
      salePrice: result.salePrice,
      finalPrice: result.finalPrice,
      vat: result.vat,
      isForSale: result.isForSale,
      type: result.type,
      stock: result.stock,
      posCategories: result.posCategories
    });

    return result;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
} 