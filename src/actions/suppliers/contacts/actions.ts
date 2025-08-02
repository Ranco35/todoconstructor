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

// Función helper para verificar si una tabla existe
async function tableExists(supabase: any, tableName: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(tableName)
      .select('count')
      .limit(1);
    
    return !error;
  } catch (error) {
    return false;
  }
}

// Funciones adicionales para gestion de contactos
export async function updateContactStatus(contactId: number, active: boolean) {
  try {
    const supabase = await getSupabaseClient();
    
    // Verificar si la tabla SupplierContact existe
    const contactsTableExists = await tableExists(supabase, 'SupplierContact');
    if (!contactsTableExists) {
      return { success: false, error: 'La funcionalidad de contactos no está disponible. La tabla SupplierContact no existe.' };
    }
    
    const { data: updatedContact, error } = await supabase
      .from('SupplierContact')
      .update({ active })
      .eq('id', contactId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error actualizando contacto: ${error.message}`);
    }
    
    revalidatePath('/dashboard/suppliers');
    return { success: true, data: updatedContact };
  } catch (error) {
    console.error('Error updating contact status:', error);
    return { success: false, error: 'Error al actualizar el estado del contacto' };
  }
}

export async function setPrimaryContact(contactId: number) {
  try {
    const supabase = await getSupabaseClient();
    
    // Primero obtener el contacto para saber el supplierId
    const { data: contact, error: contactError } = await supabase
      .from('SupplierContact')
      .select('supplierId')
      .eq('id', contactId)
      .single();
    
    if (contactError || !contact) {
      return { success: false, error: 'Contacto no encontrado' };
    }
    
    // Desactivar todos los contactos principales del proveedor
    const { error: updateError } = await supabase
      .from('SupplierContact')
      .update({ isPrimary: false })
      .eq('supplierId', contact.supplierId);

    if (updateError) {
      throw new Error(`Error desactivando contactos principales: ${updateError.message}`);
    }
    
    // Activar el contacto seleccionado como principal
    const { data: updatedContact, error: primaryError } = await supabase
      .from('SupplierContact')
      .update({ isPrimary: true })
      .eq('id', contactId)
      .select()
      .single();

    if (primaryError) {
      throw new Error(`Error estableciendo contacto principal: ${primaryError.message}`);
    }
    
    revalidatePath('/dashboard/suppliers');
    return { success: true, data: updatedContact };
  } catch (error) {
    console.error('Error setting primary contact:', error);
    return { success: false, error: 'Error al establecer el contacto principal' };
  }
}

export async function bulkDeleteContacts(contactIds: number[]) {
  try {
    const supabase = await getSupabaseClient();
    
    const { error } = await supabase
      .from('SupplierContact')
      .delete()
      .in('id', contactIds);

    if (error) {
      throw new Error(`Error eliminando contactos: ${error.message}`);
    }
    
    revalidatePath('/dashboard/suppliers');
    return { success: true };
  } catch (error) {
    console.error('Error bulk deleting contacts:', error);
    return { success: false, error: 'Error al eliminar los contactos' };
  }
}

export async function bulkActivateContacts(contactIds: number[]) {
  try {
    const supabase = await getSupabaseClient();
    
    const { error } = await supabase
      .from('SupplierContact')
      .update({ active: true })
      .in('id', contactIds);

    if (error) {
      throw new Error(`Error activando contactos: ${error.message}`);
    }
    
    revalidatePath('/dashboard/suppliers');
    return { success: true };
  } catch (error) {
    console.error('Error bulk activating contacts:', error);
    return { success: false, error: 'Error al activar los contactos' };
  }
}

export async function bulkDeactivateContacts(contactIds: number[]) {
  try {
    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from('SupplierContact')
      .update({ active: false })
      .in('id', contactIds);

    if (error) {
      throw new Error(`Error desactivando contactos: ${error.message}`);
    }
    
    revalidatePath('/dashboard/suppliers');
    return { success: true };
  } catch (error) {
    console.error('Error bulk deactivating contacts:', error);
    return { success: false, error: 'Error al desactivar los contactos' };
  }
} 