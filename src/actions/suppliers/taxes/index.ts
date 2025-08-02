import { getSupplierTaxes } from "./list";
import { createSupplierTaxAction as createSupplierTax } from "./create";
import { updateSupplierTaxAction as updateSupplierTax } from "./update";
import { deleteSupplierTaxAction as deleteSupplierTax } from "./delete";
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

export { getSupplierTaxes, createSupplierTax, updateSupplierTax, deleteSupplierTax };

export async function updateTaxStatus(taxId: number, active: boolean) {
  'use server';
  const supabase = await getSupabaseClient();
  try {
    const { data: updatedTax, error } = await supabase
      .from('SupplierTax')
      .update({ active })
      .eq('id', taxId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    revalidatePath('/dashboard/suppliers');
    return { success: true, data: updatedTax };
  } catch (error) {
    console.error('Error updating tax status:', error);
    return { success: false, error: 'Error al actualizar el estado del impuesto' };
  }
}

export async function bulkDeleteTaxes(taxIds: number[]) {
  'use server';
  const supabase = await getSupabaseClient();
  try {
    const { error } = await supabase
      .from('SupplierTax')
      .delete()
      .in('id', taxIds);
    
    if (error) throw error;
    revalidatePath('/dashboard/suppliers');
    return { success: true };
  } catch (error) {
    console.error('Error bulk deleting taxes:', error);
    return { success: false, error: 'Error al eliminar los impuestos' };
  }
}

export async function bulkActivateTaxes(taxIds: number[]) {
  'use server';
  const supabase = await getSupabaseClient();
  try {
    const { error } = await supabase
      .from('SupplierTax')
      .update({ active: true })
      .in('id', taxIds);
    
    if (error) throw error;
    revalidatePath('/dashboard/suppliers');
    return { success: true };
  } catch (error) {
    console.error('Error bulk activating taxes:', error);
    return { success: false, error: 'Error al activar los impuestos' };
  }
}

export async function bulkDeactivateTaxes(taxIds: number[]) {
  'use server';
  const supabase = await getSupabaseClient();
  try {
    const { error } = await supabase
      .from('SupplierTax')
      .update({ active: false })
      .in('id', taxIds);
    
    if (error) throw error;
    revalidatePath('/dashboard/suppliers');
    return { success: true };
  } catch (error) {
    console.error('Error bulk deactivating taxes:', error);
    return { success: false, error: 'Error al desactivar los impuestos' };
  }
} 