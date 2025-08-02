'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );
}

export async function deleteSupplierBankAction(bankId: number) {
  const supabase = await getSupabaseClient();
  
  try {
    // Obtener la cuenta bancaria para validar
    const { data: bank, error: fetchError } = await supabase
      .from('SupplierBank')
      .select(`
        *,
        Supplier (
          id
        )
      `)
      .eq('id', bankId)
      .single();

    if (fetchError || !bank) {
      return {
        success: false,
        error: 'Cuenta bancaria no encontrada'
      };
    }

    // Verificar si es la cuenta principal
    if (bank.isPrimary) {
      // Buscar otra cuenta para hacerla principal
      const { data: otherBank } = await supabase
        .from('SupplierBank')
        .select('id')
        .eq('supplierId', bank.supplierId)
        .neq('id', bankId)
        .eq('active', true)
        .single();

      if (otherBank) {
        // Hacer la otra cuenta principal
        const { error: updateError } = await supabase
          .from('SupplierBank')
          .update({ isPrimary: true })
          .eq('id', otherBank.id);

        if (updateError) {
          return {
            success: false,
            error: `Error actualizando cuenta principal: ${updateError.message}`
          };
        }
      }
    }

    // Eliminar la cuenta bancaria
    const { error: deleteError } = await supabase
      .from('SupplierBank')
      .delete()
      .eq('id', bankId);

    if (deleteError) {
      return {
        success: false,
        error: `Error eliminando cuenta bancaria: ${deleteError.message}`
      };
    }

    // Revalidar las páginas relacionadas
    revalidatePath(`/dashboard/suppliers/${bank.supplierId}/banks`);
    revalidatePath(`/dashboard/suppliers/${bank.supplierId}`);

    return {
      success: true,
      message: 'Cuenta bancaria eliminada exitosamente'
    };

  } catch (error) {
    console.error('Error deleting supplier bank:', error);
    return {
      success: false,
      error: 'Error al eliminar la cuenta bancaria'
    };
  }
} 