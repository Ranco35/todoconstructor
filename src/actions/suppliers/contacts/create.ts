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

export async function createSupplierContact(supplierId: number, formData: FormData) {
  const supabase = await getSupabaseClient();
  
  try {
    // Verificar si la tabla SupplierContact existe
    const contactsTableExists = await tableExists(supabase, 'SupplierContact');
    if (!contactsTableExists) {
      throw new Error('La funcionalidad de contactos no está disponible. La tabla SupplierContact no existe.');
    }

    // Verificar que el proveedor existe
    const { data: supplier, error: supplierError } = await supabase
      .from('Supplier')
      .select('id')
      .eq('id', supplierId)
      .single();

    if (supplierError || !supplier) {
      throw new Error('Proveedor no encontrado');
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
    if (isPrimary) {
      const { error: updateError } = await supabase
        .from('SupplierContact')
        .update({ isPrimary: false })
        .eq('supplierId', supplierId)
        .eq('isPrimary', true);

      if (updateError) {
        throw new Error(`Error actualizando contactos principales: ${updateError.message}`);
      }
    }

    // Crear el contacto
    const { data: contact, error: createError } = await supabase
      .from('SupplierContact')
      .insert({
        supplierId,
        name: name.trim(),
        position: position?.trim() || null,
        type: type || 'PRINCIPAL',
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        mobile: mobile?.trim() || null,
        notes: notes?.trim() || null,
        isPrimary,
        active,
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Error creando contacto: ${createError.message}`);
    }

    revalidatePath(`/dashboard/suppliers/${supplierId}`);
    revalidatePath(`/dashboard/suppliers/${supplierId}/contacts`);

    return { success: true, contact };

  } catch (error) {
    console.error('Error creating supplier contact:', error);
    throw error;
  }
} 