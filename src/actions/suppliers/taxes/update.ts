'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SupplierTaxFormData } from '@/types/supplier';
import { revalidatePath } from 'next/cache';

async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );
}

export async function updateSupplierTaxAction(
  taxId: number, 
  data: SupplierTaxFormData
) {
  const supabase = await getSupabaseClient();
  try {
    // Obtener la configuración fiscal actual
    const { data: currentTax, error: fetchError } = await supabase
      .from('SupplierTax')
      .select('*, Supplier(id)')
      .eq('id', taxId)
      .single();

    if (fetchError || !currentTax) {
      return {
        success: false,
        error: 'Configuración fiscal no encontrada'
      };
    }

    // Validar que la tasa de impuesto esté en un rango válido
    if (data.taxRate < 0 || data.taxRate > 100) {
      return {
        success: false,
        error: 'La tasa de impuesto debe estar entre 0 y 100%'
      };
    }

    // Verificar si ya existe otra configuración para el mismo tipo de impuesto
    const { data: existingTax } = await supabase
      .from('SupplierTax')
      .select('id')
      .eq('supplierId', currentTax.supplierId)
      .eq('taxType', data.taxType)
      .eq('active', true)
      .neq('id', taxId)
      .single();

    if (existingTax) {
      return {
        success: false,
        error: `Ya existe otra configuración activa para ${data.taxType}`
      };
    }

    // Actualizar la configuración fiscal
    const { data: tax, error: updateError } = await supabase
      .from('SupplierTax')
      .update({
        taxType: data.taxType,
        taxRate: data.taxRate,
        taxCode: data.taxCode,
        description: data.description,
        active: data.active,
      })
      .eq('id', taxId)
      .select()
      .single();

    if (updateError) {
      return {
        success: false,
        error: `Error al actualizar la configuración fiscal: ${updateError.message}`
      };
    }

    // Revalidar las páginas relacionadas
    revalidatePath(`/dashboard/suppliers/${currentTax.supplierId}/taxes`);
    revalidatePath(`/dashboard/suppliers/${currentTax.supplierId}`);

    return {
      success: true,
      data: tax
    };

  } catch (error) {
    console.error('Error updating supplier tax:', error);
    return {
      success: false,
      error: 'Error al actualizar la configuración fiscal'
    };
  }
} 