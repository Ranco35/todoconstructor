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

export async function deleteSupplierContact(contactId: number) {
  const supabase = await getSupabaseClient();
  
  try {
    // Verificar si la tabla SupplierContact existe
    const contactsTableExists = await tableExists(supabase, 'SupplierContact');
    if (!contactsTableExists) {
      throw new Error('La funcionalidad de contactos no está disponible. La tabla SupplierContact no existe.');
    }

    // Verificar que el contacto existe
    const { data: contact, error: fetchError } = await supabase
      .from('SupplierContact')
      .select(`
        *,
        Supplier (
          id
        )
      `)
      .eq('id', contactId)
      .single();

    if (fetchError || !contact) {
      throw new Error('Contacto no encontrado');
    }

    const supplierId = contact.supplierId;

    // Eliminar el contacto
    const { error: deleteError } = await supabase
      .from('SupplierContact')
      .delete()
      .eq('id', contactId);

    if (deleteError) {
      throw new Error(`Error eliminando contacto: ${deleteError.message}`);
    }

    revalidatePath(`/dashboard/suppliers/${supplierId}`);
    revalidatePath(`/dashboard/suppliers/${supplierId}/contacts`);

    return { success: true, message: 'Contacto eliminado correctamente' };

  } catch (error) {
    console.error('Error deleting supplier contact:', error);
    throw error;
  }
}

export async function deleteSupplierContactAction(formData: FormData) {
  const contactId = parseInt(formData.get('contactId') as string);
  return await deleteSupplierContact(contactId);
}

export async function bulkDeleteContacts(contactIds: number[]) {
  const supabase = await getSupabaseClient();
  
  try {
    // Verificar que todos los contactos existen
    const { data: contacts, error: fetchError } = await supabase
      .from('SupplierContact')
      .select(`
        *,
        Supplier (
          id
        )
      `)
      .in('id', contactIds);

    if (fetchError) {
      throw new Error(`Error verificando contactos: ${fetchError.message}`);
    }

    if (!contacts || contacts.length !== contactIds.length) {
      throw new Error('Algunos contactos no fueron encontrados');
    }

    // Agrupar por proveedor para revalidar las rutas
    const supplierIds = [...new Set(contacts.map(c => c.supplierId))];

    // Eliminar contactos
    const { error: deleteError } = await supabase
      .from('SupplierContact')
      .delete()
      .in('id', contactIds);

    if (deleteError) {
      throw new Error(`Error eliminando contactos: ${deleteError.message}`);
    }

    // Revalidar rutas para todos los proveedores afectados
    supplierIds.forEach(supplierId => {
      revalidatePath(`/dashboard/suppliers/${supplierId}`);
      revalidatePath(`/dashboard/suppliers/${supplierId}/contacts`);
    });

    return { 
      success: true, 
      message: `${contacts.length} contacto(s) eliminado(s) correctamente` 
    };

  } catch (error) {
    console.error('Error bulk deleting contacts:', error);
    throw error;
  }
}

export async function bulkActivateContacts(contactIds: number[]) {
  const supabase = await getSupabaseClient();
  
  try {
    const { data: contacts, error: fetchError } = await supabase
      .from('SupplierContact')
      .select(`
        *,
        Supplier (
          id
        )
      `)
      .in('id', contactIds);

    if (fetchError) {
      throw new Error(`Error verificando contactos: ${fetchError.message}`);
    }

    if (!contacts) {
      throw new Error('No se pudieron verificar los contactos');
    }

    const supplierIds = [...new Set(contacts.map(c => c.supplierId))];

    const { error: updateError } = await supabase
      .from('SupplierContact')
      .update({ active: true })
      .in('id', contactIds);

    if (updateError) {
      throw new Error(`Error activando contactos: ${updateError.message}`);
    }

    supplierIds.forEach(supplierId => {
      revalidatePath(`/dashboard/suppliers/${supplierId}`);
      revalidatePath(`/dashboard/suppliers/${supplierId}/contacts`);
    });

    return { 
      success: true, 
      message: `${contacts.length} contacto(s) activado(s) correctamente` 
    };

  } catch (error) {
    console.error('Error bulk activating contacts:', error);
    throw error;
  }
}

export async function bulkDeactivateContacts(contactIds: number[]) {
  const supabase = await getSupabaseClient();
  
  try {
    const { data: contacts, error: fetchError } = await supabase
      .from('SupplierContact')
      .select(`
        *,
        Supplier (
          id
        )
      `)
      .in('id', contactIds);

    if (fetchError) {
      throw new Error(`Error verificando contactos: ${fetchError.message}`);
    }

    if (!contacts) {
      throw new Error('No se pudieron verificar los contactos');
    }

    const supplierIds = [...new Set(contacts.map(c => c.supplierId))];

    const { error: updateError } = await supabase
      .from('SupplierContact')
      .update({ active: false })
      .in('id', contactIds);

    if (updateError) {
      throw new Error(`Error desactivando contactos: ${updateError.message}`);
    }

    supplierIds.forEach(supplierId => {
      revalidatePath(`/dashboard/suppliers/${supplierId}`);
      revalidatePath(`/dashboard/suppliers/${supplierId}/contacts`);
    });

    return { 
      success: true, 
      message: `${contacts.length} contacto(s) desactivado(s) correctamente` 
    };

  } catch (error) {
    console.error('Error bulk deactivating contacts:', error);
    throw error;
  }
} 