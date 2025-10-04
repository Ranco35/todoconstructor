"use server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ProductType } from '@/types/product';
import { ensureUniqueSKU, validateSKUUniqueness } from '@/actions/products/sku';
import { revalidatePath } from 'next/cache';
import { mapFormDataToProductFrontend, mapProductFrontendToDB, ProductFrontend } from '@/lib/product-mapper';

async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );
}

// Función para obtener cliente con service role (para operaciones que requieren bypass RLS)
async function getSupabaseServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { get: () => undefined } }
  );
}

export async function updateProduct(formData: FormData) {
  try {
    const supabase = await getSupabaseClient();
    const supabaseService = await getSupabaseServiceClient();
    
    console.log('🔍 DEBUG - Iniciando updateProduct con FormData keys:', Array.from(formData.keys()));
    
    // Validar ID
    const idString = formData.get('id') as string;
    if (!idString) {
      return { success: false, error: 'ID del producto es requerido' };
    }
    
    const id = parseInt(idString);
    if (isNaN(id)) {
      return { success: false, error: 'ID del producto no es válido' };
    }
    
    console.log('🔍 DEBUG - Procesando producto ID:', id);
    
    // Usar el mapeo automático para convertir FormData a objeto camelCase
    const productFrontend = mapFormDataToProductFrontend(formData);
    
    // Validar campos obligatorios
    if (!productFrontend.name || productFrontend.name.trim() === '') {
      return { success: false, error: 'El nombre del producto es requerido' };
    }
    
    // Obtener el tipo de producto del FormData directamente
    const type = formData.get('type') as ProductType;
    if (!type) {
      return { success: false, error: 'El tipo de producto es requerido' };
    }
    
    // Procesar precio final congelado si está presente
    const finalPriceValue = formData.get('finalPrice');
    const finalPrice = finalPriceValue && finalPriceValue !== '' ? parseFloat(finalPriceValue as string) : null;
    
    console.log('🔍 DEBUG - Datos del producto procesados:', {
      id,
      name: productFrontend.name,
      type,
      categoryId: productFrontend.categoryId,
      supplierId: productFrontend.supplierId,
      costPrice: productFrontend.costPrice,
      salePrice: productFrontend.salePrice,
      finalPrice: finalPrice
    });
    
    // Validar y asegurar unicidad del SKU si se proporciona
    let finalSku = productFrontend.sku;
    
    // 🔒 RESTRICCIÓN DOBLE: No modificar SKUs en edición para evitar errores de importación
    if (finalSku && finalSku.trim() !== '') {
      // Solo validar unicidad, pero NO modificar el SKU existente
      const isUnique = await validateSKUUniqueness(finalSku, id);
      if (!isUnique) {
        return { 
          success: false, 
          error: `El SKU "${finalSku}" ya está en uso por otro producto. No se puede modificar el SKU de productos existentes para evitar errores de importación. Contacta al administrador.` 
        };
      }
      // Mantener el SKU original sin modificaciones
      finalSku = productFrontend.sku;
    }
    
    // Preparar datos del producto con campos de equipos/máquinas
    const isEquipment = formData.get('isEquipment') === 'true';
    const equipmentFields = {
      isEquipment,
      model: formData.get('model') as string || null,
      serialNumber: formData.get('serialNumber') as string || null,
      purchaseDate: formData.get('purchaseDate') as string || null,
      warrantyExpiration: formData.get('warrantyExpiration') as string || null,
      usefulLife: formData.get('usefulLife') ? parseInt(formData.get('usefulLife') as string) : null,
      maintenanceInterval: formData.get('maintenanceInterval') ? parseInt(formData.get('maintenanceInterval') as string) : null,
      lastMaintenance: formData.get('lastMaintenance') as string || null,
      nextMaintenance: formData.get('nextMaintenance') as string || null,
      maintenanceCost: formData.get('maintenanceCost') ? parseFloat(formData.get('maintenanceCost') as string) : null,
      maintenanceProvider: formData.get('maintenanceProvider') as string || null,
      currentLocation: formData.get('currentLocation') as string || null,
      responsiblePerson: formData.get('responsiblePerson') as string || null,
      operationalStatus: formData.get('operationalStatus') as string || 'OPERATIVO'
    };
    
    // Obtener el campo posCategoryId directamente del FormData
    const posCategoryId = formData.get('posCategoryId');
    const posCategoryIdValue = posCategoryId && posCategoryId !== '' ? parseInt(posCategoryId as string) : undefined;
    
    // Crear objeto completo del producto para el frontend
    const completeProductFrontend: ProductFrontend = {
      ...productFrontend,
      id,
      type,
      sku: finalSku,
      posCategoryId: posCategoryIdValue,
      finalPrice: finalPrice, // Agregar precio final congelado
      ...equipmentFields
    };
    
    // Mapear a formato de base de datos (snake_case)
    const productDB = mapProductFrontendToDB(completeProductFrontend);
    
    // Filtrar solo los campos que existen en la tabla Product
    const { 
      id: productId, 
      Category, 
      Supplier, 
      Warehouse_Products, 
      createdAt, 
      updatedAt,
      ...productDataForUpdate 
    } = productDB;
    
    console.log('🔍 DEBUG - Datos mapeados a BD:', {
      type: productDataForUpdate.type,
      categoryid: productDataForUpdate.categoryid,
      supplierid: productDataForUpdate.supplierid,
      costprice: productDataForUpdate.costprice,
      saleprice: productDataForUpdate.saleprice,
      finalPrice: productDataForUpdate.finalPrice,
      unit: productDataForUpdate.unit,
      isPOSEnabled: productDataForUpdate.isPOSEnabled
    });
    
    // Actualizar producto principal
    const { data: updatedProduct, error: productError } = await supabase
      .from('Product')
      .update(productDataForUpdate)
      .eq('id', id)
      .select()
      .single();

    if (productError) {
      console.error('Error updating product:', productError);
      return { success: false, error: `Error actualizando producto: ${productError.message}` };
    }
    
    console.log('✅ Producto actualizado exitosamente');
    
    // --- LÓGICA DE STOCK Y BODEGA ---
    // Parsear datos de stock si existen
    let stockData = null;
    const stockFormValue = formData.get('stock');
    
    console.log('🔍 DEBUG - Stock raw value:', stockFormValue);
    console.log('🔍 DEBUG - Stock type:', typeof stockFormValue);
    
    if (stockFormValue) {
      try {
        if (typeof stockFormValue === 'string') {
          // Si es string, intentar parsear JSON
          stockData = JSON.parse(stockFormValue);
        } else if (typeof stockFormValue === 'object') {
          // Si ya es objeto, usar directamente
          stockData = stockFormValue;
        }
        console.log('🔍 DEBUG - Stock parseado exitosamente:', stockData);
      } catch (e) {
        console.error('Error parsing stock data:', e);
        console.log('🔍 DEBUG - Valor problemático:', stockFormValue);
        stockData = null;
      }
    } else {
      console.log('🔍 DEBUG - No hay datos de stock en FormData');
    }

    // Procesar stock solo si tiene warehouseid válido
    if (stockData && stockData.warehouseid && !isNaN(stockData.warehouseid)) {
      const warehouseId = parseInt(stockData.warehouseid.toString());
      
      // ✅ NO FORZAR A 0 - Validar explícitamente si vienen datos válidos
      const quantity = stockData.current;
      const minStock = stockData.min;
      const maxStock = stockData.max;
      
      // Validar que quantity sea un número válido
      if (quantity === null || quantity === undefined) {
        console.warn('⚠️ No se recibió quantity válida, preservando stock actual');
        // NO actualizar el stock - preservar el valor actual en la BD
        // Continuar con el resto del proceso sin tocar Warehouse_Product
      } else {
        console.log('🔍 DEBUG - Procesando stock para producto:', {
          productId: id,
          warehouseId,
          quantity,
          minStock: minStock ?? 0,
          maxStock: maxStock ?? null
        });

      // Usar service role para operaciones en Warehouse_Product (bypass RLS)
      // Buscar si ya existe un registro para este producto y bodega
      const { data: existing, error: findError } = await supabaseService
        .from('Warehouse_Product')
        .select('*')
        .eq('productId', id)
        .eq('warehouseId', warehouseId)
        .maybeSingle();

      if (findError) {
        console.error('Error buscando Warehouse_Product:', findError);
        return { success: false, error: `Error buscando registro de bodega: ${findError.message}` };
      }

      console.log('🔍 DEBUG - Registro existente encontrado:', existing);

      if (existing) {
        // Actualizar registro existente
        console.log('🔍 DEBUG - Actualizando registro existente en Warehouse_Product:', existing.id);
        const { error: updateStockError } = await supabaseService
          .from('Warehouse_Product')
          .update({
            quantity,
            minStock: minStock ?? 0,
            maxStock: maxStock ?? null
          })
          .eq('id', existing.id);
        
        if (updateStockError) {
          console.error('Error actualizando stock en Warehouse_Product:', updateStockError);
          return { success: false, error: `Error actualizando stock: ${updateStockError.message}` };
        } else {
          console.log('✅ Stock actualizado exitosamente en Warehouse_Product');
        }
      } else {
        // Crear nuevo registro
        console.log('🔍 DEBUG - Creando nuevo registro en Warehouse_Product');
        const { error: createStockError } = await supabaseService
          .from('Warehouse_Product')
          .insert({
            productId: id,
            warehouseId: warehouseId,
            quantity,
            minStock: minStock ?? 0,
            maxStock: maxStock ?? null
          });
        
        if (createStockError) {
          console.error('Error creando stock en Warehouse_Product:', createStockError);
          return { success: false, error: `Error creando stock: ${createStockError.message}` };
        } else {
          console.log('✅ Stock creado exitosamente en Warehouse_Product');
        }
      }
      } // Cierre del else que valida quantity
    } else {
      console.log('🔍 DEBUG - No hay datos de stock válidos para procesar');
      console.log('🔍 DEBUG - stockData:', stockData);
      console.log('🔍 DEBUG - warehouseid:', stockData?.warehouseid);
    }

    // --- LÓGICA DE COMPONENTES DEL COMBO ---
    // Procesar componentes solo si es un producto COMBO
    if (type === ProductType.COMBO) {
      let componentsData = null;
      const componentsFormValue = formData.get('components');
      
      console.log('🔍 DEBUG - Components raw value:', componentsFormValue);
      
      if (componentsFormValue) {
        try {
          if (typeof componentsFormValue === 'string') {
            componentsData = JSON.parse(componentsFormValue);
          } else if (typeof componentsFormValue === 'object') {
            componentsData = componentsFormValue;
          }
          console.log('🔍 DEBUG - Components parseados exitosamente:', componentsData);
        } catch (e) {
          console.error('Error parsing components data:', e);
          componentsData = null;
        }
      }

      // Eliminar componentes existentes del combo
      const { error: deleteError } = await supabase
        .from('product_components')
        .delete()
        .eq('combo_product_id', id);

      if (deleteError) {
        console.error('Error eliminando componentes existentes:', deleteError);
        // No retornar error aquí, continuar con la actualización
      } else {
        console.log('✅ Componentes existentes eliminados exitosamente');
      }

      // Insertar nuevos componentes si existen
      if (componentsData && Array.isArray(componentsData) && componentsData.length > 0) {
        console.log('🔍 DEBUG - Creando componentes del combo actualizados');
        
        const componentsPayload = componentsData.map((component: any) => ({
          combo_product_id: id,
          component_product_id: component.id,
          quantity: component.quantity,
          unit_price: component.price
        }));

        console.log('🔍 DEBUG - Payload de componentes:', componentsPayload);

        const { data: newComponents, error: componentsError } = await supabase
          .from('product_components')
          .insert(componentsPayload)
          .select();

        if (componentsError) {
          console.error('Error creando componentes actualizados:', componentsError);
          // No retornar error aquí, el producto principal ya se actualizó
        } else {
          console.log('✅ Componentes actualizados exitosamente:', newComponents);
        }
      } else {
        console.log('🔍 DEBUG - No hay componentes para actualizar');
      }
    }

    // --- GUARDAR RELACIONES POS ---
    if (Array.isArray(productFrontend.posCategories)) {
      // Eliminar relaciones antiguas
      await supabaseService
        .from('ProductPOSCategory')
        .delete()
        .eq('productId', id);

      // Insertar nuevas relaciones
      const relations = productFrontend.posCategories.map(rel => ({
        productId: id,
        posCategoryId: rel.posCategoryId,
        cashRegisterTypeId: rel.cashRegisterTypeId,
      }));
      if (relations.length > 0) {
        await supabaseService
          .from('ProductPOSCategory')
          .insert(relations);
      }
    }

    // Sincronizar productos POS automáticamente
    try {
      const { syncPOSProducts } = await import('@/actions/pos/pos-actions');
      await syncPOSProducts();
      console.log('✅ Sincronización POS completada tras actualizar producto');
    } catch (err) {
      console.warn('⚠️ Error en sincronización POS tras update:', err);
    }

    // Revalidar la página de productos
    revalidatePath('/dashboard/configuration/products');

    console.log('✅ updateProduct completado exitosamente');
    return { 
      success: true, 
      message: 'Producto actualizado exitosamente',
      data: updatedProduct
    };

  } catch (error) {
    console.error('Error in updateProduct:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
} 