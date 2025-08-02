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

export async function createSupplierTaxAction(
  supplierId: number, 
  data: SupplierTaxFormData
) {
  const supabase = await getSupabaseClient();
  try {
    // Validar que el proveedor existe
    const { data: supplier, error: supplierError } = await supabase
      .from('Supplier')
      .select('id')
      .eq('id', supplierId)
      .single();

    if (supplierError || !supplier) {
      return {
        success: false,
        error: 'Proveedor no encontrado'
      };
    }

    // Validar que la tasa de impuesto esté en un rango válido
    if (data.taxRate < 0 || data.taxRate > 100) {
      return {
        success: false,
        error: 'La tasa de impuesto debe estar entre 0 y 100%'
      };
    }

    // Verificar si ya existe una configuración para el mismo tipo de impuesto
    const { data: existingTax } = await supabase
      .from('SupplierTax')
      .select('id')
      .eq('supplierId', supplierId)
      .eq('taxType', data.taxType)
      .eq('active', true)
      .single();

    if (existingTax) {
      return {
        success: false,
        error: `Ya existe una configuración activa para ${data.taxType}`
      };
    }

    // Crear la configuración fiscal
    const { data: tax, error: createError } = await supabase
      .from('SupplierTax')
      .insert({
        supplierId,
        taxType: data.taxType,
        taxRate: data.taxRate,
        taxCode: data.taxCode,
        description: data.description,
        active: data.active,
      })
      .select()
      .single();

    if (createError) {
      return {
        success: false,
        error: `Error al crear la configuración fiscal: ${createError.message}`
      };
    }

    // Revalidar las páginas relacionadas
    revalidatePath(`/dashboard/suppliers/${supplierId}/taxes`);
    revalidatePath(`/dashboard/suppliers/${supplierId}`);

    return {
      success: true,
      data: tax
    };

  } catch (error) {
    console.error('Error creating supplier tax:', error);
    return {
      success: false,
      error: 'Error al crear la configuración fiscal'
    };
  }
} 