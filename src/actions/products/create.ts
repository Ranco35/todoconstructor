"use server";
import { getSupabaseServerClient } from '@/lib/supabase-server';
import { ProductFormData, ProductType } from '@/types/product';
import { generateIntelligentSKU, ensureUniqueSKU } from '@/actions/products/sku';
import { revalidatePath } from 'next/cache';

// Usar el cliente centralizado con getAll/setAll cookies para evitar 429 y warnings
async function getSupabaseClient() {
  return await getSupabaseServerClient();
}

// Función auxiliar para convertir FormData a objeto
function formDataToObject(formData: FormData): ProductFormData {
  const result: any = {};
  
  // Mapear todos los campos del FormData
  for (const [key, value] of formData.entries()) {
    if (value === null || value === undefined || value === '') {
      continue;
    }
    
    const stringValue = value.toString();
    
    // Manejar campos especiales
    switch (key) {
      case 'type':
        result[key] = stringValue as ProductType;
        break;
      case 'costPrice':
      case 'salePrice':
      case 'vat':
      case 'categoryId':
      case 'supplierId':
      case 'posCategoryId':
      case 'usageid':
      case 'stateid':
      case 'marketplaceid':
      case 'invoicepolicyid':
      case 'salelinewarnid':
      case 'stockid':
      case 'storageid':
      case 'acquisitionid':
      case 'usefulLife':
      case 'maintenanceInterval':
      case 'maintenanceCost':
        result[key] = stringValue === '' ? undefined : Number(stringValue);
        break;
      // Soporte para unidades: aceptar camelCase y snake_case
      case 'salesUnitId':
      case 'salesunitid': {
        const num = stringValue === '' ? undefined : Number(stringValue);
        result['salesUnitId'] = num;
        result['salesunitid'] = num;
        break;
      }
      case 'purchaseUnitId':
      case 'purchaseunitid': {
        const num = stringValue === '' ? undefined : Number(stringValue);
        result['purchaseUnitId'] = num;
        result['purchaseunitid'] = num;
        break;
      }
      case 'isEquipment':
      case 'isPOSEnabled':
      case 'isForSale':
        result[key] = stringValue === 'true';
        break;
      case 'stock':
      case 'components':
        try {
          result[key] = JSON.parse(stringValue);
        } catch {
          result[key] = key === 'stock' ? { min: 0, max: 0, current: 0 } : [];
        }
        break;
      default:
        result[key] = stringValue;
    }
  }
  
  // Defaults de unidades si no vienen informadas (UND = id 1)
  if (result['salesunitid'] === undefined && result['salesUnitId'] === undefined) {
    result['salesunitid'] = 1;
    result['salesUnitId'] = 1;
  }
  if (result['purchaseunitid'] === undefined && result['purchaseUnitId'] === undefined) {
    result['purchaseunitid'] = 1;
    result['purchaseUnitId'] = 1;
  }

  return result as ProductFormData;
}

export async function createProduct(data: ProductFormData | FormData) {
  try {
    // Debug: Ver qué datos recibe la función
    console.log('🔍 DEBUG - createProduct recibió:', {
      dataType: data.constructor.name,
      isFormData: data instanceof FormData,
      dataKeys: data instanceof FormData ? Array.from(data.keys()) : Object.keys(data)
    });

    // Convertir FormData a objeto si es necesario
    let productData: ProductFormData;
    if (data instanceof FormData) {
      productData = formDataToObject(data);
      console.log('🔍 DEBUG - FormData convertido a objeto:', productData);
    } else {
      productData = data;
    }

    console.log('🔍 DEBUG - Datos finales del producto:', {
      name: productData.name,
      nameType: typeof productData.name,
      nameLength: productData.name?.length,
      type: productData.type,
      brand: productData.brand
    });

    // Validación estricta del campo name
    if (!productData.name || typeof productData.name !== 'string' || productData.name.trim() === '') {
      throw new Error('El nombre del producto es obligatorio y no puede estar vacío.');
    }

    // Validación del tipo de producto
    if (!productData.type) {
      throw new Error('Debes seleccionar un tipo de producto (Almacenable, Consumible, Servicio, Inventario o Combo).');
    }

    // Validación de SKU
    if (!productData.sku || productData.sku.trim() === '') {
      throw new Error('El SKU es obligatorio. Presiona "Generar SKU" si está vacío.');
    }

    // Validación básica para productos con precio
    if ([ProductType.CONSUMIBLE, ProductType.ALMACENABLE, ProductType.SERVICIO, ProductType.COMBO].includes(productData.type)) {
      console.log('🔍 DEBUG - Validación precio venta:', {
        type: productData.type,
        isForSale: productData.isForSale,
        salePrice: productData.salePrice,
        isForSaleType: typeof productData.isForSale
      });
      
      // Solo requerir precio de venta si el producto es para venta
      if (productData.isForSale === true) { // Solo si está explícitamente marcado como para venta
        console.log('🔍 DEBUG - Producto es para venta, validando precio');
        if (!productData.salePrice || productData.salePrice <= 0) {
          throw new Error('El precio de venta es obligatorio y debe ser mayor a cero para este tipo de producto.');
        }
      } else {
        console.log('🔍 DEBUG - Producto NO es para venta, no requiere precio');
      }
    }

    // Validación específica para productos COMBO
    if (productData.type === ProductType.COMBO) {
      if (!productData.components || !Array.isArray(productData.components) || productData.components.length === 0) {
        throw new Error('Los productos tipo COMBO deben tener al menos un componente. Agrega productos en la sección de componentes.');
      }
      
      // Validar que cada componente tenga la información necesaria
      for (const component of productData.components) {
        if (!component.id || !component.quantity || component.quantity <= 0) {
          throw new Error('Todos los componentes del COMBO deben tener un producto válido y una cantidad mayor a cero.');
        }
      }
    }
    
    const supabase = await getSupabaseClient();
    
    // Determinar qué campos incluir según el tipo de producto
    const baseData = {
      name: productData.name.trim(),
      description: productData.description?.trim() || '',
    };

    // Crear productData sin typeid (la tabla Product actual no tiene esta columna)
    const finalProductData: any = {
      ...baseData,
      type: productData.type,
    };
    // Mantener datos de stock fuera del objeto insertado para evitar columnas inexistentes
    let pendingStockData: any | null = null;

    // Generar SKU automáticamente si no se proporciona
    let finalSku = productData.sku;
    if (!finalSku || finalSku.trim() === '') {
      console.log('🔍 DEBUG - Generando SKU automático para:', productData.name);
      finalSku = await generateIntelligentSKU({
        name: productData.name,
        brand: productData.brand,
        categoryId: productData.categoryId,
        type: productData.type
      });
    }
    
    // Asegurar que el SKU sea único
    finalSku = await ensureUniqueSKU(finalSku);
    finalProductData.sku = finalSku;

    console.log('🔍 DEBUG - SKU final:', finalSku);

    // Campos comunes para todos los tipos
    if (productData.image) finalProductData.image = productData.image;
    if (productData.categoryId) finalProductData.categoryid = productData.categoryId;
    if (productData.marketplaceid) finalProductData.marketplaceid = productData.marketplaceid;

    // Campos específicos por tipo
    switch (productData.type) {
      case ProductType.CONSUMIBLE:
      case ProductType.ALMACENABLE:
        // Campos para Consumible y Almacenable
        if (productData.brand) finalProductData.brand = productData.brand;
        if (productData.unit) finalProductData.unit = productData.unit;
        if (productData.supplierId) finalProductData.supplierid = productData.supplierId;
        if (productData.supplierCode) finalProductData.supplierCode = productData.supplierCode;
        if (productData.barcode) finalProductData.barcode = productData.barcode;
        if (productData.costPrice) finalProductData.costprice = productData.costPrice;
        if (productData.salePrice) finalProductData.saleprice = productData.salePrice;
        if (productData.vat) finalProductData.vat = productData.vat;
        if (productData.storageid) finalProductData.storageid = productData.storageid;
        if (productData.acquisitionid) finalProductData.acquisitionid = productData.acquisitionid;
        if (productData.stateid) finalProductData.stateid = productData.stateid;
        if (productData.invoicepolicyid) finalProductData.invoicepolicyid = productData.invoicepolicyid;
        if (productData.salelinewarnid) finalProductData.salelinewarnid = productData.salelinewarnid;
        if (productData.isPOSEnabled !== undefined) finalProductData.isPOSEnabled = productData.isPOSEnabled;
        if (productData.isForSale !== undefined) finalProductData.isForSale = productData.isForSale;
        if (productData.posCategoryId) finalProductData.posCategoryId = productData.posCategoryId;
        if (productData.salesunitid) finalProductData.salesunitid = productData.salesunitid;
        if (productData.purchaseunitid) finalProductData.purchaseunitid = productData.purchaseunitid;
        
        // Crear stock si hay datos de stock
        if (productData.stock && (productData.stock.min || productData.stock.max || productData.stock.current)) {
          console.log('🔍 DEBUG - Creando stock con datos:', productData.stock);
          
          // Usar la tabla Warehouse_Product que es la que existe en el esquema
          const warehouseProductPayload = {
            warehouseId: productData.stock.warehouseid || null,
            productId: null, // Se asignará después de crear el producto
            quantity: productData.stock.current || 0,
            minStock: productData.stock.min || 0,
            maxStock: productData.stock.max || null,
          };
          
          console.log('🔍 DEBUG - Payload de Warehouse_Product:', warehouseProductPayload);
          
          // Guardar los datos de stock para asignarlos después de crear el producto (fuera del insert)
          pendingStockData = warehouseProductPayload;
        }
        break;

      case ProductType.INVENTARIO:
        // Campos para Inventario
        if (productData.brand) finalProductData.brand = productData.brand;
        if (productData.unit) finalProductData.unit = productData.unit;
        if (productData.barcode) finalProductData.barcode = productData.barcode;
        if (productData.costPrice) finalProductData.costprice = productData.costPrice;
        if (productData.vat) finalProductData.vat = productData.vat;
        if (productData.supplierId) finalProductData.supplierid = productData.supplierId;
        if (productData.supplierCode) finalProductData.supplierCode = productData.supplierCode;
        if (productData.storageid) finalProductData.storageid = productData.storageid;
        if (productData.acquisitionid) finalProductData.acquisitionid = productData.acquisitionid;
        if (productData.stateid) finalProductData.stateid = productData.stateid;
        if (productData.isPOSEnabled !== undefined) finalProductData.isPOSEnabled = productData.isPOSEnabled;
        if (productData.isForSale !== undefined) finalProductData.isForSale = productData.isForSale;
        if (productData.posCategoryId) finalProductData.posCategoryId = productData.posCategoryId;
        if (productData.salesunitid) finalProductData.salesunitid = productData.salesunitid;
        if (productData.purchaseunitid) finalProductData.purchaseunitid = productData.purchaseunitid;
        
        // Campos de equipos/máquinas para inventario
        if (productData.isEquipment) {
          finalProductData.isEquipment = productData.isEquipment;
          if (productData.model) finalProductData.model = productData.model;
          if (productData.serialNumber) finalProductData.serialNumber = productData.serialNumber;
          if (productData.purchaseDate) finalProductData.purchaseDate = productData.purchaseDate;
          if (productData.warrantyExpiration) finalProductData.warrantyExpiration = productData.warrantyExpiration;
          if (productData.usefulLife) finalProductData.usefulLife = productData.usefulLife;
          if (productData.maintenanceInterval) finalProductData.maintenanceInterval = productData.maintenanceInterval;
          if (productData.lastMaintenance) finalProductData.lastMaintenance = productData.lastMaintenance;
          if (productData.nextMaintenance) finalProductData.nextMaintenance = productData.nextMaintenance;
          if (productData.maintenanceCost) finalProductData.maintenanceCost = productData.maintenanceCost;
          if (productData.maintenanceProvider) finalProductData.maintenanceProvider = productData.maintenanceProvider;
          if (productData.currentLocation) finalProductData.currentLocation = productData.currentLocation;
          if (productData.responsiblePerson) finalProductData.responsiblePerson = productData.responsiblePerson;
          if (productData.operationalStatus) finalProductData.operationalStatus = productData.operationalStatus;
        }
        
        // Para inventario, también puede tener un registro de stock
        if (productData.stock && (productData.stock.min || productData.stock.max || productData.stock.current)) {
          console.log('🔍 DEBUG - Creando stock para inventario:', productData.stock);
          
          // Usar la tabla Warehouse_Product que es la que existe en el esquema
          const warehouseProductPayload = {
            warehouseId: productData.stock.warehouseid || null,
            productId: null, // Se asignará después de crear el producto
            quantity: productData.stock.current || 0,
            minStock: productData.stock.min || 0,
            maxStock: productData.stock.max || null,
          };
          
          console.log('🔍 DEBUG - Payload de Warehouse_Product inventario:', warehouseProductPayload);
          
          // Guardar los datos de stock para asignarlos después de crear el producto (fuera del insert)
          pendingStockData = warehouseProductPayload;
        }
        break;

      case ProductType.SERVICIO:
        // Campos para Servicio
        if (productData.salePrice) finalProductData.saleprice = productData.salePrice;
        if (productData.vat) finalProductData.vat = productData.vat;
        if (productData.stateid) finalProductData.stateid = productData.stateid;
        if (productData.invoicepolicyid) finalProductData.invoicepolicyid = productData.invoicepolicyid;
        if (productData.salelinewarnid) finalProductData.salelinewarnid = productData.salelinewarnid;
        if (productData.isPOSEnabled !== undefined) finalProductData.isPOSEnabled = productData.isPOSEnabled;
        if (productData.isForSale !== undefined) finalProductData.isForSale = productData.isForSale;
        if (productData.posCategoryId) finalProductData.posCategoryId = productData.posCategoryId;
        if (productData.salesunitid) finalProductData.salesunitid = productData.salesunitid;
        if (productData.purchaseunitid) finalProductData.purchaseunitid = productData.purchaseunitid;
        // 🆕 NUEVO: Permitir proveedor para servicios
        if (productData.supplierId) finalProductData.supplierid = productData.supplierId;
        if (productData.supplierCode) finalProductData.suppliercode = productData.supplierCode;
        break;

      case ProductType.COMBO:
        // Campos para Combo
        if (productData.salePrice) finalProductData.saleprice = productData.salePrice;
        if (productData.vat) finalProductData.vat = productData.vat;
        if (productData.invoicepolicyid) finalProductData.invoicepolicyid = productData.invoicepolicyid;
        if (productData.salelinewarnid) finalProductData.salelinewarnid = productData.salelinewarnid;
        if (productData.isPOSEnabled !== undefined) finalProductData.isPOSEnabled = productData.isPOSEnabled;
        if (productData.isForSale !== undefined) finalProductData.isForSale = productData.isForSale;
        if (productData.posCategoryId) finalProductData.posCategoryId = productData.posCategoryId;
        if (productData.salesunitid) finalProductData.salesunitid = productData.salesunitid;
        if (productData.purchaseunitid) finalProductData.purchaseunitid = productData.purchaseunitid;
        
        // Los componentes se procesarán después de crear el producto
        // No agregar _componentsData al objeto que va a la base de datos
        break;
    }

    // Normalizar unidades desde camelCase/snake_case y aplicar defaults si corresponde
    const normalizedSalesUnitId = (productData as any).salesunitid ?? (productData as any).salesUnitId;
    const normalizedPurchaseUnitId = (productData as any).purchaseunitid ?? (productData as any).purchaseUnitId;

    if (normalizedSalesUnitId !== undefined) {
      finalProductData.salesunitid = finalProductData.salesunitid ?? normalizedSalesUnitId;
    }
    if (normalizedPurchaseUnitId !== undefined) {
      finalProductData.purchaseunitid = finalProductData.purchaseunitid ?? normalizedPurchaseUnitId;
    }

    // Defaults a UND (id:1) cuando aplique y no fueron provistas
    const typesWithUnits = [ProductType.CONSUMIBLE, ProductType.ALMACENABLE, ProductType.SERVICIO, ProductType.INVENTARIO, ProductType.COMBO];
    if (typesWithUnits.includes(productData.type)) {
      if (finalProductData.salesunitid === undefined) finalProductData.salesunitid = 1;
      if (finalProductData.purchaseunitid === undefined) finalProductData.purchaseunitid = 1;
    }

    console.log('🔍 DEBUG - Datos finales para insertar:', {
      ...finalProductData,
      isPOSEnabled: finalProductData.isPOSEnabled,
      type: productData.type,
      hasComponents: productData.type === ProductType.COMBO ? productData.components?.length : 'N/A'
    });

    // Crear el producto en la tabla Product
    const { data: createdProduct, error: productError } = await supabase
      .from('Product')
      .insert(finalProductData)
      .select()
      .single();

    if (productError) {
      console.error('Error detallado al crear producto:', productError);

      // Normalizar mensaje evitando undefined
      const rawMessage = (productError as any)?.message
        ?? (productError as any)?.error
        ?? (productError as any)?.details
        ?? '';
      let errorMessage = typeof rawMessage === 'string' ? rawMessage : JSON.stringify(productError);

      // Traducir errores comunes de Supabase/PostgreSQL a español
      if (errorMessage.includes('duplicate key value violates unique constraint')) {
        if (errorMessage.includes('sku')) {
          errorMessage = 'Ya existe un producto con este SKU. Por favor, genera un SKU diferente.';
        } else if (errorMessage.includes('name')) {
          errorMessage = 'Ya existe un producto con este nombre. Por favor, usa un nombre diferente.';
        } else {
          errorMessage = 'Ya existe un producto con esta información. Verifica que los datos sean únicos.';
        }
      } else if (errorMessage.includes('violates foreign key constraint')) {
        if (errorMessage.includes('categoryid')) {
          errorMessage = 'La categoría seleccionada no existe. Por favor, selecciona una categoría válida.';
        } else if (errorMessage.includes('supplierid')) {
          errorMessage = 'El proveedor seleccionado no existe. Por favor, selecciona un proveedor válido.';
        } else {
          errorMessage = 'Uno de los datos seleccionados no es válido. Verifica la información del formulario.';
        }
      } else if (errorMessage.includes('violates not-null constraint')) {
        errorMessage = 'Faltan campos obligatorios. Verifica que todos los campos requeridos estén llenos.';
      } else if (errorMessage.includes('permission denied')) {
        errorMessage = 'No tienes permisos para crear productos. Contacta al administrador del sistema.';
      } else if (errorMessage.includes('column') && errorMessage.includes('does not exist')) {
        errorMessage = 'Error interno del sistema. Contacta al administrador técnico.';
      } else if (errorMessage.trim() === '') {
        errorMessage = 'Ha ocurrido un error al crear el producto (sin detalle).';
      }

      return { success: false, error: `Error al crear el producto: ${errorMessage}` };
    }

    const productId = createdProduct.id;

    // --- GUARDAR RELACIONES POS ---
    if (Array.isArray(productData.posCategories) && productData.posCategories.length > 0) {
      // Eliminar relaciones antiguas (por si acaso)
      await supabase
        .from('ProductPOSCategory')
        .delete()
        .eq('productId', productId);

      // Insertar nuevas relaciones
      const relations = productData.posCategories.map(rel => ({
        productId,
        posCategoryId: rel.posCategoryId,
        cashRegisterTypeId: rel.cashRegisterTypeId,
      }));
      await supabase
        .from('ProductPOSCategory')
        .insert(relations);
    }

    // Crear registro en Warehouse_Product si hay datos de stock
    if (pendingStockData && productId) {
      console.log('🔍 DEBUG - Creando Warehouse_Product con productId:', productId);
      
      const warehouseProductPayload = {
        ...pendingStockData,
        productId: productId
      };
      
      console.log('🔍 DEBUG - Payload final Warehouse_Product:', warehouseProductPayload);
      
      const { data: warehouseProductData, error: warehouseProductError } = await supabase
        .from('Warehouse_Product')
        .insert(warehouseProductPayload)
        .select()
        .single();
        
      if (warehouseProductError) {
        console.error('🔍 DEBUG - Error creando Warehouse_Product:', warehouseProductError);
        // No lanzar error aquí, solo log. El producto ya se creó exitosamente
      } else {
        console.log('🔍 DEBUG - Warehouse_Product creado exitosamente:', warehouseProductData);
      }
    }

    // Crear componentes del combo si hay datos de componentes
    if (productData.type === ProductType.COMBO && productData.components && productData.components.length > 0 && productId) {
      console.log('🔍 DEBUG - Creando componentes del combo con productId:', productId);
      
      try {
        // Crear tabla de componentes si no existe
        const { error: createTableError } = await supabase.rpc('create_product_components_table_if_not_exists');
        if (createTableError && !createTableError.message.includes('already exists')) {
          console.error('🔍 DEBUG - Error creando tabla de componentes:', createTableError);
        }

        // Insertar componentes
        const componentsPayload = productData.components.map((component: any) => ({
          combo_product_id: productId,
          component_product_id: component.id,
          quantity: component.quantity,
          unit_price: component.price
        }));

        console.log('🔍 DEBUG - Payload de componentes:', componentsPayload);

        const { data: componentsData, error: componentsError } = await supabase
          .from('product_components')
          .insert(componentsPayload)
          .select();

        if (componentsError) {
          console.error('🔍 DEBUG - Error creando componentes:', componentsError);
          // No lanzar error aquí, solo log. El producto ya se creó exitosamente
        } else {
          console.log('🔍 DEBUG - Componentes creados exitosamente:', componentsData);
        }
      } catch (error) {
        console.error('🔍 DEBUG - Error en procesamiento de componentes:', error);
      }
    }

    // Revalidar páginas
    revalidatePath('/dashboard/configuration/products');
    revalidatePath('/dashboard/inventory');

    const result = { 
      success: true, 
      product: createdProduct,
      message: `✅ Producto "${createdProduct.name}" creado exitosamente con SKU: ${createdProduct.sku}`
    };

    // Sincronizar productos POS solo si el nuevo producto está habilitado para POS
    if (finalProductData.isPOSEnabled === true) {
      console.log('🔄 Sincronizando productos POS...');
      try {
        const { syncPOSProducts } = await import('@/actions/pos/pos-actions');
        const syncResult = await syncPOSProducts();
        if (syncResult.success) {
          console.log('✅ Sincronización POS completada:', syncResult.data?.message);
        } else {
          console.warn('⚠️ Error en sincronización POS:', syncResult.error);
        }
      } catch (syncError) {
        console.error('❌ Error importando o ejecutando syncPOSProducts:', syncError);
      }
    } else {
      console.log('⏭️ Sincronización POS omitida: producto no habilitado para POS');
    }

    return result;
  } catch (error) {
    console.error('Error creating product:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido al crear el producto' 
    };
  }
} 