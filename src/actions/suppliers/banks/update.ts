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

export async function updateSupplierBankAction(
  bankId: number, 
  data: SupplierBankFormData
) {
  const supabase = await getSupabaseClient();
  
  try {
    // Obtener la cuenta bancaria actual
    const { data: currentBank, error: fetchError } = await supabase
      .from('SupplierBank')
      .select(`
        *,
        Supplier (
          id
        )
      `)
      .eq('id', bankId)
      .single();

    if (fetchError || !currentBank) {
      return {
        success: false,
        error: 'Cuenta bancaria no encontrada'
      };
    }

    // Si esta cuenta será principal, desactivar otras cuentas principales del mismo proveedor
    if (data.isPrimary && !currentBank.isPrimary) {
      const { error: updateError } = await supabase
        .from('SupplierBank')
        .update({ isPrimary: false })
        .eq('supplierId', currentBank.supplierId)
        .eq('isPrimary', true)
        .neq('id', bankId);

      if (updateError) {
        return {
          success: false,
          error: `Error actualizando cuentas principales: ${updateError.message}`
        };
      }
    }

    // Actualizar la cuenta bancaria
    const { data: bank, error: updateError } = await supabase
      .from('SupplierBank')
      .update({
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
      .eq('id', bankId)
      .select()
      .single();

    if (updateError) {
      return {
        success: false,
        error: `Error al actualizar la cuenta bancaria: ${updateError.message}`
      };
    }

    // Revalidar las páginas relacionadas
    revalidatePath(`/dashboard/suppliers/${currentBank.supplierId}/banks`);
    revalidatePath(`/dashboard/suppliers/${currentBank.supplierId}`);

    return {
      success: true,
      data: bank
    };

  } catch (error) {
    console.error('Error updating supplier bank:', error);
    return {
      success: false,
      error: 'Error al actualizar la cuenta bancaria'
    };
  }
} 