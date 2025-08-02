'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );
}

interface BulkDeleteResult {
  success: boolean;
  deletedCount: number;
  failedCount: number;
  errors: string[];
  message: string;
}

export async function bulkDeleteProducts(productIds: number[]): Promise<BulkDeleteResult> {
  console.log('🔧 bulkDeleteProducts: Iniciando eliminación múltiple');
  console.log('📋 bulkDeleteProducts: IDs a eliminar:', productIds);
  
  if (!productIds || productIds.length === 0) {
    return {
      success: false,
      deletedCount: 0,
      failedCount: 0,
      errors: ['No se proporcionaron productos para eliminar'],
      message: 'No se proporcionaron productos para eliminar'
    };
  }

  try {
    const supabase = await getSupabaseClient();
    let deletedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    console.log(`🗑️ bulkDeleteProducts: Procesando ${productIds.length} productos...`);

    // Procesar cada producto individualmente para manejo granular de errores
    for (const productId of productIds) {
      try {
        console.log(`🔍 bulkDeleteProducts: Procesando producto ID: ${productId}`);

        // Verificar si el producto existe
        const { data: product, error: productError } = await supabase
          .from('Product')
          .select('id, name')
          .eq('id', productId)
          .single();

        if (productError || !product) {
          console.log(`❌ bulkDeleteProducts: Producto ${productId} no existe`);
          errors.push(`Producto ID ${productId}: No existe`);
          failedCount++;
          continue;
        }

        console.log(`✅ bulkDeleteProducts: Producto encontrado: ${product.name}`);

        // PROTECCIÓN CRÍTICA: Verificar si el producto está en facturas
        console.log(`🔍 bulkDeleteProducts: Verificando facturas para producto ${productId}...`);
        const [invoiceCheck, purchaseInvoiceCheck] = await Promise.all([
          supabase.from('invoice_lines').select('*', { count: 'exact', head: true }).eq('product_id', productId),
          supabase.from('purchase_invoice_lines').select('*', { count: 'exact', head: true }).eq('product_id', productId)
        ]);

        const hasInvoices = (invoiceCheck.count || 0) > 0 || (purchaseInvoiceCheck.count || 0) > 0;
        
        if (hasInvoices) {
          console.log(`🚫 bulkDeleteProducts: Producto ${productId} está en facturas - OMITIENDO`);
          const invoiceDetails = [];
          if ((invoiceCheck.count || 0) > 0) invoiceDetails.push(`${invoiceCheck.count} facturas de ventas`);
          if ((purchaseInvoiceCheck.count || 0) > 0) invoiceDetails.push(`${purchaseInvoiceCheck.count} facturas de compras`);
          
          errors.push(`🚫 ${product.name}: No se puede eliminar - Aparece en ${invoiceDetails.join(' y ')} (documentos legales protegidos)`);
          failedCount++;
          continue;
        }

        // Eliminación forzada: eliminar dependencias primero
        console.log(`🧹 bulkDeleteProducts: Eliminando dependencias del producto ${productId}`);
        
        // Eliminar en orden de dependencias (forzado para bulk delete)
        await Promise.all([
          supabase.from('Warehouse_Product').delete().eq('"productId"', productId),
          supabase.from('Sale_Product').delete().eq('"productId"', productId),
          supabase.from('Reservation_Product').delete().eq('"productId"', productId),
          supabase.from('Product_Component').delete().or(`"parentId".eq.${productId},"componentId".eq.${productId}`),
          supabase.from('PettyCashPurchase').delete().eq('"productId"', productId),
          supabase.from('POSProduct').delete().eq('"productId"', productId)
        ]);

        console.log(`🗑️ bulkDeleteProducts: Eliminando producto ${productId}`);
        
        // Eliminar el producto
        const { error: deleteError } = await supabase
          .from('Product')
          .delete()
          .eq('id', productId);

        if (deleteError) {
          console.log(`❌ bulkDeleteProducts: Error eliminando producto ${productId}:`, deleteError);
          errors.push(`Producto "${product.name}": ${deleteError.message}`);
          failedCount++;
        } else {
          console.log(`✅ bulkDeleteProducts: Producto ${productId} eliminado exitosamente`);
          deletedCount++;
        }

      } catch (error) {
        console.error(`💥 bulkDeleteProducts: Error procesando producto ${productId}:`, error);
        errors.push(`Producto ID ${productId}: Error interno`);
        failedCount++;
      }
    }

    console.log(`♻️ bulkDeleteProducts: Revalidando páginas...`);
    revalidatePath('/dashboard/configuration/products');
    revalidatePath('/dashboard/inventory');

    const success = deletedCount > 0;
    let message = '';
    
    if (deletedCount > 0 && failedCount === 0) {
      message = `${deletedCount} producto${deletedCount !== 1 ? 's' : ''} eliminado${deletedCount !== 1 ? 's' : ''} correctamente`;
    } else if (deletedCount > 0 && failedCount > 0) {
      message = `${deletedCount} producto${deletedCount !== 1 ? 's' : ''} eliminado${deletedCount !== 1 ? 's' : ''}, ${failedCount} fallaron`;
    } else {
      message = `No se pudieron eliminar los productos seleccionados`;
    }

    console.log(`✅ bulkDeleteProducts: Proceso completado - Eliminados: ${deletedCount}, Fallidos: ${failedCount}`);

    return {
      success,
      deletedCount,
      failedCount,
      errors,
      message
    };

  } catch (error) {
    console.error('💥 bulkDeleteProducts: Error general:', error);
    return {
      success: false,
      deletedCount: 0,
      failedCount: productIds.length,
      errors: ['Error interno del servidor durante la eliminación múltiple'],
      message: 'Error interno del servidor durante la eliminación múltiple'
    };
  }
} 