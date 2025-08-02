'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SupplierBankFormData } from '@/types/supplier';
import { revalidatePath } from 'next/cache';

async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );
}

export async function createSupplierBankAction(
  supplierId: number, 
  data: SupplierBankFormData
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

    // Si esta cuenta será principal, desactivar otras cuentas principales
    if (data.isPrimary) {
      const { error: updateError } = await supabase
        .from('SupplierBank')
        .update({ isPrimary: false })
        .eq('supplierId', supplierId)
        .eq('isPrimary', true);

      if (updateError) {
        return {
          success: false,
          error: `Error actualizando cuentas principales: ${updateError.message}`
        };
      }
    }

    // Crear la cuenta bancaria
    const { data: bank, error: createError } = await supabase
      .from('SupplierBank')
      .insert({
        supplierId,
        bankName: data.bankName,
        accountNumber: data.accountNumber,
        accountType: data.accountType,
        routingNumber: data.routingNumber,
        swiftCode: data.swiftCode,
        iban: data.iban,
        holderName: data.holderName,
        holderDocument: data.holderDocument,
        isPrimary: data.isPrimary,
        active: data.active,
      })
      .select()
      .single();

    if (createError) {
      return {
        success: false,
        error: `Error al crear la cuenta bancaria: ${createError.message}`
      };
    }

    // Revalidar las páginas relacionadas
    revalidatePath(`/dashboard/suppliers/${supplierId}/banks`);
    revalidatePath(`/dashboard/suppliers/${supplierId}`);

    return {
      success: true,
      data: bank
    };

  } catch (error) {
    console.error('Error creating supplier bank:', error);
    return {
      success: false,
      error: 'Error al crear la cuenta bancaria'
    };
  }
} 