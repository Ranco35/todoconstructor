'use server';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importProducts = importProducts;
const ssr_1 = require("@supabase/ssr");
const headers_1 = require("next/headers");
const cache_1 = require("next/cache");
const import_parsers_1 = require("@/lib/import-parsers");
const sku_1 = require("@/actions/products/sku");
async function getSupabaseClient() {
    const cookieStore = await (0, headers_1.cookies)();
    return (0, ssr_1.createServerClient)(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { cookies: { get: (name) => cookieStore.get(name)?.value } });
}
async function importProducts(products, confirmDeletions = false) {
    const result = {
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
        const possibleDeletions = [];
        // Recolectar bodegas no encontradas
        const notFoundWarehouses = [];
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
                        finalSku = (await (0, sku_1.generateIntelligentSKU)({
                            name: productName,
                            brand: productData.brand ? String(productData.brand).trim() : undefined,
                            categoryId: categoryId || undefined,
                            type: productType
                        })).trim().toLowerCase();
                    }
                    catch (error) {
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
                };
                let finalProductId;
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
                    }
                    else {
                        result.stats.updated++;
                        finalProductId = product.id;
                        result.details.push({ row: rowNumber, updated: true, method: searchMethod });
                    }
                }
                else {
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
                        }
                        else {
                            result.errors.push(`Fila ${rowNumber}: Error al crear producto: ${insertError.message}`);
                            result.stats.errors++;
                            result.details.push({ row: rowNumber, error: `Error al crear producto: ${insertError.message}` });
                        }
                        continue;
                    }
                    else {
                        result.stats.created++;
                        finalProductId = newProduct.id;
                        result.details.push({ row: rowNumber, created: true });
                    }
                }
                // 4. Sincronización exacta de bodegas (Excel es la fuente de la verdad)
                let warehousesAssigned = 0;
                let warehousesRemoved = 0;
                // Obtener todas las asignaciones actuales del producto
                const { data: currentAssignments } = await supabase
                    .from('Warehouse_Product')
                    .select('id, warehouseId, quantity')
                    .eq('productId', finalProductId);
                const currentWarehouseIds = new Set((currentAssignments || []).map(a => a.warehouseId));
                const excelWarehouseIds = new Set();
                // Procesar bodegas del Excel
                if (productData.warehouses && productData.warehouses.length > 0) {
                    const resolvedWarehouses = await (0, import_parsers_1.resolveWarehouseIds)(productData.warehouses, allWarehouses || []);
                    for (const warehouse of resolvedWarehouses) {
                        // Log temporal: resultado de la comparación
                        console.log(`Comparando para producto '${productData.name}': Excel='${warehouse.warehouseName}' (norm='${warehouse.warehouseName.trim().toLowerCase()}') vs BD`, (allWarehouses || []).map(w => w.name.trim().toLowerCase()));
                        if (!warehouse.warehouseId) {
                            notFoundWarehouses.push({ productName: productName, warehouseName: warehouse.warehouseName });
                            console.log(`NO SE ENCONTRÓ bodega para producto '${productData.name}' con nombre '${warehouse.warehouseName}'`);
                        }
                        else {
                            console.log(`Asignando bodega ID ${warehouse.warehouseId} para producto '${productData.name}'`);
                            excelWarehouseIds.add(warehouse.warehouseId);
                            // Verificar si ya existe la asignación
                            const { data: existingAssignment } = await supabase
                                .from('Warehouse_Product')
                                .select('id')
                                .eq('productId', finalProductId)
                                .eq('warehouseId', warehouse.warehouseId)
                                .single();
                            if (!existingAssignment) {
                                // Crear nueva asignación
                                const { error: assignmentError } = await supabase
                                    .from('Warehouse_Product')
                                    .insert({
                                    productId: finalProductId,
                                    warehouseId: warehouse.warehouseId,
                                    quantity: warehouse.quantity,
                                    minStock: warehouse.minStock,
                                    maxStock: warehouse.maxStock
                                });
                                if (!assignmentError) {
                                    warehousesAssigned++;
                                }
                            }
                            else {
                                // Actualizar asignación existente
                                const { error: updateError } = await supabase
                                    .from('Warehouse_Product')
                                    .update({
                                    quantity: warehouse.quantity,
                                    minStock: warehouse.minStock,
                                    maxStock: warehouse.maxStock
                                })
                                    .eq('id', existingAssignment.id);
                                if (!updateError) {
                                    warehousesAssigned++;
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
                            quantity: productData.currentStock || 0,
                            minStock: productData.minStock || 0,
                            maxStock: productData.maxStock || 100
                        });
                        if (!assignmentError) {
                            warehousesAssigned++;
                        }
                    }
                    else {
                        // Actualizar asignación existente
                        const { error: updateError } = await supabase
                            .from('Warehouse_Product')
                            .update({
                            quantity: productData.currentStock || 0,
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
            }
            catch (error) {
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
        (0, cache_1.revalidatePath)('/dashboard/configuration/products');
        (0, cache_1.revalidatePath)('/dashboard/inventory');
        result.message = `Importación completada. ${result.stats.created} creados, ${result.stats.updated} actualizados, ${result.stats.errors} errores, ${result.stats.warehousesAssigned} bodegas asignadas, ${result.stats.warehousesRemoved} bodegas eliminadas.`;
        return result;
    }
    catch (error) {
        console.error('Error en importación:', error);
        result.success = false;
        result.message = 'Error interno del servidor durante la importación';
        return result;
    }
}
