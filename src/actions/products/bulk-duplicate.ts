'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseClient } from '@/lib/supabase-server';

interface BulkDuplicateResult {
  success: boolean;
  duplicatedCount: number;
  failedCount: number;
  errors: string[];
  message: string;
}

export async function bulkDuplicateProducts(productIds: number[]): Promise<BulkDuplicateResult> {
  console.log('🔧 bulkDuplicateProducts: Iniciando duplicación múltiple');
  console.log('📋 bulkDuplicateProducts: IDs a duplicar:', productIds);
  
  if (!productIds || productIds.length === 0) {
    return {
      success: false,
      duplicatedCount: 0,
      failedCount: 0,
      errors: ['No se proporcionaron productos para duplicar'],
      message: 'No se proporcionaron productos para duplicar'
    };
  }

  try {
    const supabase = await getSupabaseClient();
    let duplicatedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    console.log(`🔄 bulkDuplicateProducts: Procesando ${productIds.length} productos...`);

    // Obtener todos los SKUs existentes para evitar duplicados
    const { data: existingProducts } = await supabase
      .from('Product')
      .select('sku')
      .not('sku', 'is', null);

    const existingSkus = new Set(existingProducts?.map(p => p.sku) || []);

    // Función para generar SKU único con número correlativo
    const generateUniqueSku = (originalSku: string, existingSkus: Set<string>): string => {
      if (!originalSku) {
        // Si no hay SKU original, generar uno basado en timestamp
        const timestamp = Date.now().toString().slice(-6);
        let newSku = `COPY-${timestamp}`;
        let counter = 1;
        while (existingSkus.has(newSku)) {
          newSku = `COPY-${timestamp}-${counter}`;
          counter++;
        }
        return newSku;
      }

      // Buscar patrón de número correlativo en el SKU
      // Buscar el primer número de 2-4 dígitos que aparezca en el SKU
      const correlativePattern = /^(.+?)(\d{2,4})(.*)$/;
      const match = originalSku.match(correlativePattern);
      
      if (match) {
        const beforeNumber = match[1]; // Ej: "SPA-PISC-"
        const numberStr = match[2]; // Ej: "002"
        const afterNumber = match[3]; // Ej: "-2280"
        const currentNumber = parseInt(numberStr);
        
        // Verificar si realmente parece un número correlativo
        // (debe tener al menos 2 dígitos y no ser mayor a 9999)
        if (numberStr.length >= 2 && currentNumber <= 9999) {
          console.log(`🔍 SKU correlativo detectado: ${originalSku}`);
          console.log(`📋 Antes: "${beforeNumber}", Número: ${currentNumber}, Después: "${afterNumber}"`);
          
          // Buscar el siguiente número disponible
          let nextNumber = currentNumber + 1;
          let newSku = '';
          
          // Buscar hasta encontrar un número disponible
          while (nextNumber <= currentNumber + 100) { // Límite de seguridad
            // Formatear el número con ceros a la izquierda para mantener la longitud
            const paddedNumber = nextNumber.toString().padStart(numberStr.length, '0');
            newSku = `${beforeNumber}${paddedNumber}${afterNumber}`;
            
            if (!existingSkus.has(newSku)) {
              console.log(`✅ Nuevo SKU correlativo generado: ${newSku}`);
              return newSku;
            }
            
            nextNumber++;
          }
          
          console.log(`⚠️ No se encontró número correlativo disponible, usando método tradicional`);
        } else {
          console.log(`🔍 Número encontrado (${numberStr}) no parece correlativo, usando método tradicional`);
        }
      }

      // Si no se encontró patrón correlativo o no hay números disponibles,
      // usar el método tradicional con sufijo -COPY
      let newSku = `${originalSku}-COPY`;
      let counter = 1;
      while (existingSkus.has(newSku)) {
        newSku = `${originalSku}-COPY-${counter}`;
        counter++;
      }
      
      console.log(`✅ Nuevo SKU generado (método tradicional): ${newSku}`);
      return newSku;
    };

    // Procesar cada producto individualmente
    for (const productId of productIds) {
      try {
        console.log(`🔍 bulkDuplicateProducts: Procesando producto ID: ${productId}`);

        // Obtener el producto original con todas sus relaciones
        const { data: originalProduct, error: fetchError } = await supabase
          .from('Product')
          .select(`
            *,
            Warehouse_Products:Warehouse_Product (
              "warehouseId",
              quantity,
              "minStock",
              "maxStock"
            )
          `)
          .eq('id', productId)
          .single();

        if (fetchError || !originalProduct) {
          console.log(`❌ bulkDuplicateProducts: Producto ${productId} no existe`);
          errors.push(`Producto ID ${productId}: No existe`);
          failedCount++;
          continue;
        }

        console.log(`✅ bulkDuplicateProducts: Producto encontrado: ${originalProduct.name}`);

        // Generar nuevo SKU único
        const newSku = generateUniqueSku(originalProduct.sku, existingSkus);
        existingSkus.add(newSku); // Agregar al set para evitar duplicados en esta misma operación

        // Crear el producto duplicado
        const newProductData = {
          name: `${originalProduct.name} - Copia`,
          sku: newSku,
          description: originalProduct.description,
          categoryid: originalProduct.categoryid,
          type: originalProduct.type,
          cost_price: originalProduct.cost_price,
          sale_price: originalProduct.sale_price,
          invoice_policy: originalProduct.invoice_policy,
          is_active: originalProduct.is_active,
          brand: originalProduct.brand,
          barcode: originalProduct.barcode,
          supplierid: originalProduct.supplierid,
          weight: originalProduct.weight,
          dimensions: originalProduct.dimensions,
          // Excluir campos que no se deben copiar
          // id se genera automáticamente
          // created_at y updated_at se generan automáticamente
        };

        console.log(`🔄 bulkDuplicateProducts: Creando copia con SKU: ${newSku}`);

        // Insertar el producto duplicado
        const { data: newProduct, error: insertError } = await supabase
          .from('Product')
          .insert(newProductData)
          .select()
          .single();

        if (insertError || !newProduct) {
          console.error(`❌ bulkDuplicateProducts: Error creando copia del producto ${productId}:`, insertError);
          console.error('📋 bulkDuplicateProducts: Datos del producto:', newProductData);
          const errorMessage = insertError?.message || 'Error desconocido al crear producto';
          errors.push(`Producto "${originalProduct.name}": ${errorMessage}`);
          failedCount++;
          continue;
        }

        console.log(`✅ bulkDuplicateProducts: Producto duplicado creado con ID: ${newProduct.id}`);

        // Duplicar asignaciones de bodegas si existen
        if (originalProduct.Warehouse_Products && originalProduct.Warehouse_Products.length > 0) {
          console.log(`🏭 bulkDuplicateProducts: Duplicando ${originalProduct.Warehouse_Products.length} asignaciones de bodegas`);
          
          const warehouseAssignments = originalProduct.Warehouse_Products.map(wp => ({
            "productId": newProduct.id,
            "warehouseId": wp.warehouseId,
            quantity: wp.quantity || 0,
            "minStock": wp.minStock || 0,
            "maxStock": wp.maxStock || 0
          }));

          const { error: warehouseError } = await supabase
            .from('Warehouse_Product')
            .insert(warehouseAssignments);

          if (warehouseError) {
            console.log(`⚠️ bulkDuplicateProducts: Error duplicando bodegas para producto ${newProduct.id}:`, warehouseError);
            // No falla la operación, solo advierte
          } else {
            console.log(`✅ bulkDuplicateProducts: Bodegas duplicadas exitosamente`);
          }
        }

        duplicatedCount++;

      } catch (error) {
        console.error(`💥 bulkDuplicateProducts: Error procesando producto ${productId}:`, error);
        errors.push(`Producto ID ${productId}: Error interno`);
        failedCount++;
      }
    }

    console.log(`♻️ bulkDuplicateProducts: Revalidando páginas...`);
    revalidatePath('/dashboard/configuration/products');
    revalidatePath('/dashboard/inventory');

    const success = duplicatedCount > 0;
    let message = '';
    
    if (duplicatedCount > 0 && failedCount === 0) {
      message = `${duplicatedCount} producto${duplicatedCount !== 1 ? 's' : ''} duplicado${duplicatedCount !== 1 ? 's' : ''} correctamente`;
    } else if (duplicatedCount > 0 && failedCount > 0) {
      message = `${duplicatedCount} producto${duplicatedCount !== 1 ? 's' : ''} duplicado${duplicatedCount !== 1 ? 's' : ''}, ${failedCount} fallaron`;
    } else {
      message = `No se pudieron duplicar los productos seleccionados${errors.length > 0 ? ': ' + errors.join(', ') : ''}`;
    }

    console.log(`✅ bulkDuplicateProducts: Proceso completado - Duplicados: ${duplicatedCount}, Fallidos: ${failedCount}`);

    return {
      success,
      duplicatedCount,
      failedCount,
      errors,
      message
    };

  } catch (error) {
    console.error('💥 bulkDuplicateProducts: Error general:', error);
    return {
      success: false,
      duplicatedCount: 0,
      failedCount: productIds.length,
      errors: ['Error interno del servidor durante la duplicación múltiple'],
      message: 'Error interno del servidor durante la duplicación múltiple'
    };
  }
} 