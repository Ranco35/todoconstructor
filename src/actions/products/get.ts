"use server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ProductType } from '@/types/product';
import { mapProductDBToFrontend, ProductDB } from '@/lib/product-mapper';

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
    
    const { data: product, error } = await supabase
      .from('Product')
      .select(`
        *,
        Category (*),
        Supplier (*),
        Warehouse_Products:Warehouse_Product (
          id,
          quantity,
          warehouseId,
          productId,
          minStock,
          maxStock,
          Warehouse (
            id,
            name
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error || !product) {
      console.error('Error fetching product:', error);
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

    // Obtener el primer registro de stock desde Warehouse_Product
    console.log('🔍 DEBUG - Buscando stock para producto:', id);
    const { data: warehouseProducts, error: stockError } = await supabase
      .from('Warehouse_Product')
      .select('*')
      .eq('productId', id)
      .limit(1);

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

    // Cargar categorías POS del producto
    console.log('🔍 DEBUG - Cargando categorías POS para producto:', id);
    const { data: posCategoriesData, error: posCategoriesError } = await supabase
      .from('ProductPOSCategory')
      .select('poscategoryid, cashregistertypeid')
      .eq('productid', id);

    if (posCategoriesError) {
      console.error('Error cargando categorías POS:', posCategoriesError);
    }

    // Mapear los nombres de columnas de snake_case a camelCase
    const posCategories = (posCategoriesData || []).map(item => ({
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

    // Convertir los datos para que sean compatibles con el formulario
    const result = {
      ...mappedProduct,
      // Usar el campo type de la base de datos
      type: productType,
      stock,
      components,
      // Agregar las categorías POS cargadas
      posCategories,
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