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

export async function deleteSupplierTaxAction(taxId: number) {
  const supabase = await getSupabaseClient();
  try {
    // Obtener la configuración fiscal para validar
    const { data: tax, error: fetchError } = await supabase
      .from('SupplierTax')
      .select('*, Supplier(id)')
      .eq('id', taxId)
      .single();

    if (fetchError || !tax) {
      return {
        success: false,
        error: 'Configuración fiscal no encontrada'
      };
    }

    // Eliminar la configuración fiscal
    const { error: deleteError } = await supabase
      .from('SupplierTax')
      .delete()
      .eq('id', taxId);

    if (deleteError) {
      return {
        success: false,
        error: `Error eliminando la configuración fiscal: ${deleteError.message}`
      };
    }

    // Revalidar las páginas relacionadas
    revalidatePath(`/dashboard/suppliers/${tax.supplierId}/taxes`);
    revalidatePath(`/dashboard/suppliers/${tax.supplierId}`);

    return {
      success: true,
      message: 'Configuración fiscal eliminada exitosamente'
    };

  } catch (error) {
    console.error('Error deleting supplier tax:', error);
    return {
      success: false,
      error: 'Error al eliminar la configuración fiscal'
    };
  }
} 