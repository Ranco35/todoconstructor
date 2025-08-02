'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { ProductImportData, resolveWarehouseIds } from '@/lib/import-parsers';
import { generateIntelligentSKU } from '@/actions/products/sku';

async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );
}

export interface ImportResult {
  success: boolean;
  message: string;
  stats: {
    total: number;
    created: number;
    updated: number;
    errors: number;
    warehousesAssigned: number;
    warehousesRemoved: number;
  };
  errors: string[];
  details: { row: number; error: string; updated?: boolean; created?: boolean; method?: string; warehousesAssigned?: number; warehousesRemoved?: number }[];
}

export async function importProducts(products: ProductImportData[], confirmDeletions: boolean = false): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    message: '',
    stats: {
      total: products.length,
      created: 0,
      updated: 0,
      errors: 0,
      warehousesAssigned: 0,
      warehousesRemoved: 0
    },
    errors: [],
    details: []
  };

  try {
    const supabase = await getSupabaseClient();

    // Obtener todas las bodegas para resolver IDs
    const { data: allWarehouses } = await supabase
      .from('Warehouse')
      .select('id, name');

    // Log temporal: bodegas en la BD
    console.log('Bodegas en BD:', (allWarehouses || []).map(w => ({ id: w.id, name: w.name, norm: w.name.trim().toLowerCase() })));

    // Recolectar posibles eliminaciones
    const possibleDeletions: { productId: number, productName: string, warehouseId: number, warehouseName: string }[] = [];
    // Recolectar bodegas no encontradas
    const notFoundWarehouses: { productName: string, warehouseName: string }[] = [];

    for (let i = 0; i < products.length; i++) {
      const productData = products[i];
      const rowNumber = i + 2; // +2 porque empieza en fila 2 (1 es header)

      // Log temporal: bodegas del Excel para este producto
      if (productData.warehouses && productData.warehouses.length > 0) {
        console.log(`Producto: ${productData.name} | Bodegas Excel:`, productData.warehouses.map(w => w.warehouseName));
      }

      try {
        // Validar datos mínimos
        const productName = productData.name ? String(productData.name).trim() : '';
        if (!productName) {
          result.errors.push(`Fila ${rowNumber}: El nombre del producto es requerido`);
          result.stats.errors++;
          result.details.push({ row: rowNumber, error: 'El nombre del producto es requerido' });
          continue;
        }

        // Validar tipo de producto obligatorio
        if (!productData.type || String(productData.type).trim() === '') {
          result.errors.push(`Fila ${rowNumber}: El campo 'Tipo Producto' es obligatorio y no puede estar vacío.`);
          result.stats.errors++;
          result.details.push({ row: rowNumber, error: "El campo 'Tipo Producto' es obligatorio y no puede estar vacío." });
          continue;
        }

        // Buscar categoría por ID o nombre
        let categoryId = productData.categoryId;
        if (!categoryId && productData.categoryName) {
          const categoryName = String(productData.categoryName).trim();
          if (categoryName) {
            const { data: category } = await supabase
              .from('Category')
              .select('id')
              .ilike('name', categoryName)
              .single();
            categoryId = category?.id;
          }
        }

        // Buscar proveedor por ID o nombre
        let supplierId = productData.supplierId;
        if (!supplierId && productData.supplierName) {
          const supplierName = String(productData.supplierName).trim();
          if (supplierName) {
            const { data: supplier } = await supabase
              .from('Supplier')
              .select('id')
              .ilike('name', supplierName)
              .single();
            supplierId = supplier?.id;
          }
        }

        // Buscar bodega por ID o nombre (para compatibilidad con formato anterior)
        let warehouseId = productData.warehouseId;
        if (!warehouseId && productData.warehouseName) {
          const warehouseName = String(productData.warehouseName).trim();
          if (warehouseName) {
            const { data: warehouse } = await supabase
              .from('Warehouse')
              .select('id')
              .ilike('name', warehouseName)
              .single();
            warehouseId = warehouse?.id;
          }
        }

        // Validar tipo de producto
        const productType = productData.type ? String(productData.type).trim().toUpperCase() : 'ALMACENABLE';
        const validTypes = ['CONSUMIBLE', 'ALMACENABLE', 'INVENTARIO', 'SERVICIO', 'COMBO'];
        
        if (!validTypes.includes(productType)) {
          result.errors.push(`Fila ${rowNumber}: El valor de 'Tipo Producto' es inválido. Debe ser CONSUMIBLE, ALMACENABLE, INVENTARIO, SERVICIO o COMBO.`);
          result.stats.errors++;
          result.details.push({ row: rowNumber, error: "El valor de 'Tipo Producto' es inválido. Debe ser CONSUMIBLE, ALMACENABLE, INVENTARIO, SERVICIO o COMBO." });
          continue;
        }

        // 1. Normalizar SKU
        let finalSku = null;
        if (productData.sku) {
          finalSku = String(productData.sku).trim().toLowerCase() || null;
        }
        // Si no hay SKU, generar uno automáticamente
        if (!finalSku) {
          try {
            finalSku = (await generateIntelligentSKU({
              name: productName,
              brand: productData.brand ? String(productData.brand).trim() : undefined,
              categoryId: categoryId || undefined,
              type: productType as any
            })).trim().toLowerCase();
          } catch (error) {
            finalSku = null;
          }
        }

        // 2. Buscar producto existente por ID o SKU
        let product = null;
        let searchMethod = '';
        if (productData.id && !isNaN(Number(productData.id))) {
          // Buscar por ID
          const { data: foundById, error: errorById } = await supabase
            .from('Product')
            .select('*')
            .eq('id', Number(productData.id))
            .single();
          if (foundById) {
            product = foundById;
            searchMethod = 'id';
          }
        }
        if (!product && finalSku) {
          // Buscar por SKU (normalizado)
          const { data: foundBySku, error: errorBySku } = await supabase
            .from('Product')
            .select('*')
            .eq('sku', finalSku)
            .single();
          if (foundBySku) {
            product = foundBySku;
            searchMethod = 'sku';
          }
        }

        // 3. Preparar payload y guardar (update o create)
        const productPayload = {
          name: productName,
          description: productData.description ? String(productData.description).trim() || null : null,
          brand: productData.brand ? String(productData.brand).trim() || null : null,
          categoryid: categoryId,
          supplierid: supplierId,
          type: productType,
          // AGREGADO: Incluir precios en la importación
          costprice: productData.costPrice || null,
          saleprice: productData.salePrice || null,
          vat: productData.vat || null,
          barcode: productData.barcode ? String(productData.barcode).trim() || null : null,
          // AGREGADO: Incluir contador de servicios vendidos
          servicesSold: productData.servicesSold || null,
          // AGREGADO: Incluir campo POS
          isPOSEnabled: productData.isPOSEnabled || false,
          // 🆕 NUEVO: Incluir campo para venta
          isForSale: productData.isForSale ?? true, // Por defecto es para venta
          // AGREGADO: Incluir unidades de medida
          unit: productData.unit || 'UND',
          // 🔧 AGREGADO: Incluir IDs de unidades específicas
          salesunitid: productData.salesUnitId || null,
          purchaseunitid: productData.purchaseUnitId || null,
        };

        let finalProductId: number;

        // 3. Crear o actualizar
        if (product) {
          // Actualizar producto existente
          const { error: updateError } = await supabase
            .from('Product')
            .update(productPayload)
            .eq('id', product.id);
          if (updateError) {
            result.errors.push(`Fila ${rowNumber}: Error al actualizar producto por ${searchMethod}: ${updateError.message}`);
            result.stats.errors++;
            result.details.push({ row: rowNumber, error: `Error al actualizar producto por ${searchMethod}: ${updateError.message}` });
            continue;
          } else {
            result.stats.updated++;
            finalProductId = product.id;
            result.details.push({ row: rowNumber, updated: true, method: searchMethod });
          }
        } else {
          // Crear producto nuevo
          const { data: newProduct, error: insertError } = await supabase
            .from('Product')
            .insert([{ ...productPayload, sku: finalSku }])
            .select()
            .single();
          if (insertError) {
            if (insertError.code === '23505') {
              result.errors.push(`Fila ${rowNumber}: SKU duplicado, no se puede crear el producto.`);
              result.stats.errors++;
              result.details.push({ row: rowNumber, error: 'SKU duplicado, no se puede crear el producto.' });
            } else {
              result.errors.push(`Fila ${rowNumber}: Error al crear producto: ${insertError.message}`);
              result.stats.errors++;
              result.details.push({ row: rowNumber, error: `Error al crear producto: ${insertError.message}` });
            }
            continue;
          } else {
            result.stats.created++;
            finalProductId = newProduct.id;
            result.details.push({ row: rowNumber, created: true });
          }
        }

        // 4. Procesar categoría POS si se especifica
        if (productData.isPOSEnabled && productData.posCategoryName) {
          try {
            // Buscar categoría POS por nombre
            const { data: posCategory } = await supabase
              .from('POSProductCategory')
              .select('id')
              .ilike('name', productData.posCategoryName.trim())
              .eq('isActive', true)
              .single();
            
            if (posCategory) {
              // Verificar si ya existe un producto POS para este producto
              const { data: existingPOSProduct } = await supabase
                .from('POSProduct')
                .select('id')
                .eq('productId', finalProductId)
                .single();
              
              if (existingPOSProduct) {
                // Actualizar categoría del producto POS existente
                await supabase
                  .from('POSProduct')
                  .update({ categoryId: posCategory.id })
                  .eq('id', existingPOSProduct.id);
              } else {
                // Crear nuevo producto POS
                await supabase
                  .from('POSProduct')
                  .insert({
                    name: productName,
                    description: productData.description || null,
                    sku: finalSku,
                    price: productData.salePrice || 0,
                    cost: productData.costPrice || 0,
                    categoryId: posCategory.id,
                    productId: finalProductId,
                    isActive: true,
                    stockRequired: false,
                    sortOrder: 0
                  });
              }
            }
          } catch (error) {
            console.error(`Error procesando categoría POS para producto ${finalProductId}:`, error);
            // No interrumpir el proceso, solo logear el error
          }
        }

        // 5. Sincronización exacta de bodegas (Excel es la fuente de la verdad)
        let warehousesAssigned = 0;
        let warehousesRemoved = 0;
        
        // Obtener todas las asignaciones actuales del producto
        const { data: currentAssignments } = await supabase
          .from('Warehouse_Product')
          .select('id, warehouseId, quantity')
          .eq('productId', finalProductId);
        
        const currentWarehouseIds = new Set((currentAssignments || []).map(a => a.warehouseId));
        const excelWarehouseIds = new Set<number>();
        
        // Procesar bodegas del Excel
        if (productData.warehouses && productData.warehouses.length > 0) {
          const warehouseNamesOrIds = productData.warehouses.map(w => w.warehouseName || w);
          const resolvedWarehouseIds = resolveWarehouseIds(warehouseNamesOrIds, allWarehouses || []);
          
          for (let i = 0; i < warehouseNamesOrIds.length; i++) {
            const warehouseNameOrId = warehouseNamesOrIds[i];
            const resolvedId = resolvedWarehouseIds[i];
            
            if (!resolvedId) {
              notFoundWarehouses.push({ productName: productName, warehouseName: warehouseNameOrId });
              console.log(`NO SE ENCONTRÓ bodega para producto '${productData.name}' con nombre/ID '${warehouseNameOrId}'`);
            } else {
              console.log(`Asignando bodega ID ${resolvedId} para producto '${productData.name}'`);
              excelWarehouseIds.add(resolvedId);
              
              // Obtener datos del warehouse original para stock
              const originalWarehouse = productData.warehouses[i];
              
              // Verificar si ya existe la asignación
              const { data: existingAssignment } = await supabase
                .from('Warehouse_Product')
                .select('id')
                .eq('productId', finalProductId)
                .eq('warehouseId', resolvedId)
                .single();

              if (!existingAssignment) {
                // Crear nueva asignación (SIN STOCK INICIAL - solo se puede modificar por ajuste de inventario)
                console.log(`🔄 [BD] Creando nueva asignación: Producto ${finalProductId} -> Bodega ${resolvedId}`);
                const { error: assignmentError } = await supabase
                  .from('Warehouse_Product')
                  .insert({
                    productId: finalProductId,
                    warehouseId: resolvedId,
                    quantity: 0, // STOCK INICIAL SIEMPRE EN 0 - solo se puede modificar por ajuste de inventario
                    minStock: originalWarehouse?.minStock || productData.minStock || 0,
                    maxStock: originalWarehouse?.maxStock || productData.maxStock || 100
                  });
                
                if (!assignmentError) {
                  console.log(`✅ [BD] Asignación creada exitosamente (stock inicial: 0)`);
                  warehousesAssigned++;
                } else {
                  console.error(`❌ [BD] Error al crear asignación:`, assignmentError);
                }
              } else {
                // Actualizar asignación existente (SIN MODIFICAR STOCK - solo se puede modificar por ajuste de inventario)
                console.log(`🔄 [BD] Actualizando asignación existente: ID ${existingAssignment.id} (manteniendo stock actual)`);
                const { error: updateError } = await supabase
                  .from('Warehouse_Product')
                  .update({
                    // NO actualizamos quantity - solo se puede modificar por ajuste de inventario
                    minStock: originalWarehouse?.minStock || productData.minStock || 0,
                    maxStock: originalWarehouse?.maxStock || productData.maxStock || 100
                  })
                  .eq('id', existingAssignment.id);
                
                if (!updateError) {
                  console.log(`✅ [BD] Asignación actualizada exitosamente (stock NO modificado)`);
                  warehousesAssigned++;
                } else {
                  console.error(`❌ [BD] Error al actualizar asignación:`, updateError);
                }
              }
            }
          }
        }
        // Si no hay bodegas múltiples pero hay una bodega individual, usarla
        else if (warehouseId) {
          excelWarehouseIds.add(warehouseId);
          
          const { data: existingAssignment } = await supabase
            .from('Warehouse_Product')
            .select('id')
            .eq('productId', finalProductId)
            .eq('warehouseId', warehouseId)
            .single();

          if (!existingAssignment) {
            const { error: assignmentError } = await supabase
              .from('Warehouse_Product')
              .insert({
                productId: finalProductId,
                warehouseId: warehouseId,
                quantity: 0, // STOCK INICIAL SIEMPRE EN 0 - solo se puede modificar por ajuste de inventario
                minStock: productData.minStock || 0,
                maxStock: productData.maxStock || 100
              });
            
            if (!assignmentError) {
              warehousesAssigned++;
            }
          } else {
            // Actualizar asignación existente (SIN MODIFICAR STOCK - solo se puede modificar por ajuste de inventario)
            const { error: updateError } = await supabase
              .from('Warehouse_Product')
              .update({
                // NO actualizamos quantity - solo se puede modificar por ajuste de inventario
                minStock: productData.minStock || 0,
                maxStock: productData.maxStock || 100
              })
              .eq('id', existingAssignment.id);
            
            if (!updateError) {
              warehousesAssigned++;
            }
          }
        }
        
        // Eliminar asignaciones que ya no están en el Excel
        for (const currentWarehouseId of currentWarehouseIds) {
          if (!excelWarehouseIds.has(currentWarehouseId)) {
            // Buscar nombre de la bodega
            const warehouseObj = (allWarehouses || []).find(w => w.id === currentWarehouseId);
            possibleDeletions.push({
              productId: finalProductId,
              productName: productName,
              warehouseId: currentWarehouseId,
              warehouseName: warehouseObj ? warehouseObj.name : 'ID ' + currentWarehouseId
            });
          }
        }

        // Actualizar contadores
        result.stats.warehousesAssigned += warehousesAssigned;
        const detailIndex = result.details.findIndex(d => d.row === rowNumber);
        if (detailIndex !== -1) {
          result.details[detailIndex].warehousesAssigned = warehousesAssigned;
          result.details[detailIndex].warehousesRemoved = warehousesRemoved;
        }

      } catch (error) {
        console.error(`Error procesando fila ${rowNumber}:`, error);
        result.errors.push(`Fila ${rowNumber}: Error interno del servidor`);
        result.stats.errors++;
        result.details.push({ row: rowNumber, error: 'Error interno del servidor' });
      }
    }

    // Advertencia y confirmación
    if (possibleDeletions.length > 0 && !confirmDeletions) {
      result.success = false;
      result.message = `Advertencia: Se detectaron ${possibleDeletions.length} asignaciones de bodegas que serían eliminadas. Confirme si desea proceder.`;
      result.errors.push('Se requiere confirmación para eliminar asignaciones de bodegas.');
      // Adjuntar detalles de las eliminaciones
      result.details.push(...possibleDeletions.map(d => ({
        row: 0,
        error: `Se eliminaría la bodega '${d.warehouseName}' del producto '${d.productName}' (ID producto: ${d.productId})`,
        warehousesRemoved: 1
      })));
      return result;
    }

    // SOLO SI SE CONFIRMA, proceder con la eliminación real
    for (const deletion of possibleDeletions) {
      const { error: deleteError } = await supabase
        .from('Warehouse_Product')
        .delete()
        .eq('productId', deletion.productId)
        .eq('warehouseId', deletion.warehouseId);
      if (!deleteError) {
        result.stats.warehousesRemoved++;
      }
    }

    // Advertencia de bodegas no encontradas
    if (notFoundWarehouses.length > 0) {
      result.success = false;
      result.message += `\nAdvertencia: ${notFoundWarehouses.length} bodegas del Excel no fueron encontradas en la base de datos.\n`;
      result.errors.push('Algunas bodegas del Excel no existen en la base de datos.');
      result.details.push(...notFoundWarehouses.map(d => ({
        row: 0,
        error: `No se encontró la bodega '${d.warehouseName}' para el producto '${d.productName}'.`,
        warehousesAssigned: 0
      })));
    }

    // Revalidar páginas
    revalidatePath('/dashboard/configuration/products');
    revalidatePath('/dashboard/inventory');

    result.message = `Importación completada. ${result.stats.created} creados, ${result.stats.updated} actualizados, ${result.stats.errors} errores, ${result.stats.warehousesAssigned} bodegas asignadas, ${result.stats.warehousesRemoved} bodegas eliminadas. ⚠️ IMPORTANTE: El stock inicial se establece en 0. Para modificar el stock, utiliza el sistema de Ajuste de Inventario.`;
    return result;

  } catch (error) {
    console.error('Error en importación:', error);
    result.success = false;
    result.message = 'Error interno del servidor durante la importación';
    return result;
  }
} 