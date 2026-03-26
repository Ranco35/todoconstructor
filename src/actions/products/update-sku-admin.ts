"use server";

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ensureUniqueSKU, validateSKUUniqueness } from '@/actions/products/sku';

async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );
}

async function getSupabaseServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { get: () => undefined } }
  );
}

/**
 * 🔒 FUNCIÓN DE ADMINISTRADOR: Cambiar SKU de producto existente
 * Esta función solo debe ser usada por administradores y requiere confirmación explícita
 */
export async function updateProductSKUAdmin(
  productId: number,
  newSku: string,
  confirmationCode: string
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    // Validar código de confirmación (debe ser "ADMIN-SKU-CHANGE")
    if (confirmationCode !== "ADMIN-SKU-CHANGE") {
      return { 
        success: false, 
        error: "Código de confirmación inválido. Esta operación requiere autorización de administrador." 
      };
    }

    const supabase = await getSupabaseClient();
    const supabaseService = await getSupabaseServiceClient();

    // Validar que el producto existe
    const { data: existingProduct, error: fetchError } = await supabase
      .from('Product')
      .select('id, sku, name')
      .eq('id', productId)
      .single();

    if (fetchError || !existingProduct) {
      return { 
        success: false, 
        error: "Producto no encontrado." 
      };
    }

    // Validar que el nuevo SKU sea único
    const isUnique = await validateSKUUniqueness(newSku, productId);
    if (!isUnique) {
      return { 
        success: false, 
        error: `El SKU "${newSku}" ya está en uso por otro producto.` 
      };
    }

    // Actualizar el SKU del producto
    const { error: updateError } = await supabaseService
      .from('Product')
      .update({ sku: newSku })
      .eq('id', productId);

    if (updateError) {
      return { 
        success: false, 
        error: `Error actualizando SKU: ${updateError.message}` 
      };
    }

    // Log de auditoría (opcional)
    console.log(`🔒 ADMIN: SKU cambiado de "${existingProduct.sku}" a "${newSku}" para producto ID ${productId} (${existingProduct.name})`);

    return { 
      success: true, 
      message: `SKU actualizado exitosamente de "${existingProduct.sku}" a "${newSku}"` 
    };

  } catch (error: any) {
    console.error('Error en updateProductSKUAdmin:', error);
    return { 
      success: false, 
      error: `Error interno: ${error.message}` 
    };
  }
}

/**
 * 🔒 FUNCIÓN DE ADMINISTRADOR: Obtener información del producto para cambio de SKU
 */
export async function getProductForSKUChange(productId: number): Promise<{
  success: boolean;
  error?: string;
  product?: { id: number; sku: string; name: string };
}> {
  try {
    const supabase = await getSupabaseClient();

    const { data: product, error } = await supabase
      .from('Product')
      .select('id, sku, name')
      .eq('id', productId)
      .single();

    if (error || !product) {
      return { 
        success: false, 
        error: "Producto no encontrado." 
      };
    }

    return { 
      success: true, 
      product 
    };

  } catch (error: any) {
    console.error('Error en getProductForSKUChange:', error);
    return { 
      success: false, 
      error: `Error interno: ${error.message}` 
    };
  }
}
