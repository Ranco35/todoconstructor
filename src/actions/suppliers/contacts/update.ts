'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { validateEmail, validatePhone } from '@/lib/supplier-utils';

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

export async function updateSupplierContact(contactId: number, formData: FormData) {
  const supabase = await getSupabaseClient();
  
  try {
    // Verificar si la tabla SupplierContact existe
    const contactsTableExists = await tableExists(supabase, 'SupplierContact');
    if (!contactsTableExists) {
      throw new Error('La funcionalidad de contactos no está disponible. La tabla SupplierContact no existe.');
    }

    // Verificar que el contacto existe
    const { data: existingContact, error: fetchError } = await supabase
      .from('SupplierContact')
      .select(`
        *,
        Supplier (
          id
        )
      `)
      .eq('id', contactId)
      .single();

    if (fetchError || !existingContact) {
      throw new Error('Contacto no encontrado');
    }

    // Extraer datos del formulario
    const name = formData.get('name') as string;
    const position = formData.get('position') as string;
    const type = formData.get('type') as 'PRINCIPAL' | 'SECUNDARIO' | 'EMERGENCIA';
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const mobile = formData.get('mobile') as string;
    const notes = formData.get('notes') as string;
    const isPrimary = formData.get('isPrimary') === 'true';
    const active = formData.get('active') === 'true';

    // Validaciones
    if (!name || name.trim().length === 0) {
      throw new Error('El nombre del contacto es requerido');
    }

    if (name.length < 2 || name.length > 100) {
      throw new Error('El nombre debe tener entre 2 y 100 caracteres');
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      throw new Error(emailValidation.error);
    }

    // Validar teléfono principal (opcional)
    if (phone && phone.trim() !== '') {
      const phoneValidation = validatePhone(phone);
      if (!phoneValidation.isValid) {
        throw new Error(`Teléfono principal: ${phoneValidation.error}`);
      }
    }

    // Validar teléfono móvil (opcional)
    if (mobile && mobile.trim() !== '') {
      const mobileValidation = validatePhone(mobile);
      if (!mobileValidation.isValid) {
        throw new Error(`Teléfono móvil: ${mobileValidation.error}`);
      }
    }

    // Si se marca como contacto principal, desactivar otros contactos principales
    if (isPrimary && !existingContact.isPrimary) {
      const { error: updateError } = await supabase
        .from('SupplierContact')
        .update({ isPrimary: false })
        .eq('supplierId', existingContact.supplierId)
        .eq('isPrimary', true)
        .neq('id', contactId);

      if (updateError) {
        throw new Error(`Error actualizando contactos principales: ${updateError.message}`);
      }
    }

    // Actualizar el contacto
    const { data: contact, error: updateError } = await supabase
      .from('SupplierContact')
      .update({
        name: name.trim(),
        position: position?.trim() || null,
        type: type || existingContact.type,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        mobile: mobile?.trim() || null,
        notes: notes?.trim() || null,
        isPrimary,
        active,
      })
      .eq('id', contactId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Error actualizando contacto: ${updateError.message}`);
    }

    revalidatePath(`/dashboard/suppliers/${existingContact.supplierId}`);
    revalidatePath(`/dashboard/suppliers/${existingContact.supplierId}/contacts`);

    return { success: true, contact };

  } catch (error) {
    console.error('Error updating supplier contact:', error);
    throw error;
  }
}

export async function updateContactStatus(contactId: number, active: boolean) {
  const supabase = await getSupabaseClient();
  
  try {
    const { data: contact, error } = await supabase
      .from('SupplierContact')
      .update({ active })
      .eq('id', contactId)
      .select(`
        *,
        Supplier (
          id
        )
      `)
      .single();

    if (error) {
      throw new Error(`Error actualizando estado del contacto: ${error.message}`);
    }

    revalidatePath(`/dashboard/suppliers/${contact.supplierId}`);
    revalidatePath(`/dashboard/suppliers/${contact.supplierId}/contacts`);

    return { success: true, contact };

  } catch (error) {
    console.error('Error updating contact status:', error);
    throw error;
  }
}

export async function setPrimaryContact(contactId: number) {
  const supabase = await getSupabaseClient();
  
  try {
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

    // Desactivar otros contactos principales del mismo proveedor
    const { error: updateError } = await supabase
      .from('SupplierContact')
      .update({ isPrimary: false })
      .eq('supplierId', contact.supplierId)
      .eq('isPrimary', true)
      .neq('id', contactId);

    if (updateError) {
      throw new Error(`Error desactivando contactos principales: ${updateError.message}`);
    }

    // Marcar este contacto como principal
    const { data: updatedContact, error: primaryError } = await supabase
      .from('SupplierContact')
      .update({ isPrimary: true })
      .eq('id', contactId)
      .select()
      .single();

    if (primaryError) {
      throw new Error(`Error marcando contacto como principal: ${primaryError.message}`);
    }

    revalidatePath(`/dashboard/suppliers/${contact.supplierId}`);
    revalidatePath(`/dashboard/suppliers/${contact.supplierId}/contacts`);

    return { success: true, contact: updatedContact };

  } catch (error) {
    console.error('Error setting primary contact:', error);
    throw error;
  }
} 