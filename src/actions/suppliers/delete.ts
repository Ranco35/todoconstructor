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

export async function deleteSupplier(id: number) {
  const supabase = await getSupabaseClient();
  
  try {
    // Verificar que el proveedor existe
    const { data: supplier, error: fetchError } = await supabase
      .from('Supplier')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !supplier) {
      throw new Error('Proveedor no encontrado');
    }

    console.log(`🗑️ Iniciando eliminación del proveedor ${id}`);

    // Verificar y eliminar contactos del proveedor (si la tabla existe)
    const contactsTableExists = await tableExists(supabase, 'SupplierContact');
    if (contactsTableExists) {
      console.log('📞 Eliminando contactos del proveedor...');
      const { error: contactsError } = await supabase
        .from('SupplierContact')
        .delete()
        .eq('supplierId', id);

      if (contactsError) {
        console.warn(`⚠️ Error eliminando contactos: ${contactsError.message}`);
        // No lanzar error, solo advertir
      } else {
        console.log('✅ Contactos eliminados correctamente');
      }
    } else {
      console.log('ℹ️ Tabla SupplierContact no existe, omitiendo...');
    }

    // Verificar y eliminar bancos del proveedor (si la tabla existe)
    const banksTableExists = await tableExists(supabase, 'SupplierBank');
    if (banksTableExists) {
      console.log('🏦 Eliminando bancos del proveedor...');
      const { error: banksError } = await supabase
        .from('SupplierBank')
        .delete()
        .eq('supplierId', id);

      if (banksError) {
        console.warn(`⚠️ Error eliminando bancos: ${banksError.message}`);
        // No lanzar error, solo advertir
      } else {
        console.log('✅ Bancos eliminados correctamente');
      }
    } else {
      console.log('ℹ️ Tabla SupplierBank no existe, omitiendo...');
    }

    // Verificar y eliminar impuestos del proveedor (si la tabla existe)
    const taxesTableExists = await tableExists(supabase, 'SupplierTax');
    if (taxesTableExists) {
      console.log('💰 Eliminando impuestos del proveedor...');
      const { error: taxesError } = await supabase
        .from('SupplierTax')
        .delete()
        .eq('supplierId', id);

      if (taxesError) {
        console.warn(`⚠️ Error eliminando impuestos: ${taxesError.message}`);
        // No lanzar error, solo advertir
      } else {
        console.log('✅ Impuestos eliminados correctamente');
      }
    } else {
      console.log('ℹ️ Tabla SupplierTax no existe, omitiendo...');
    }

    // Finalmente eliminar el proveedor
    console.log('🏢 Eliminando proveedor principal...');
    const { error: deleteError } = await supabase
      .from('Supplier')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw new Error(`Error eliminando proveedor: ${deleteError.message}`);
    }

    console.log('✅ Proveedor eliminado correctamente');
    revalidatePath('/dashboard/suppliers');
    return { success: true, message: 'Proveedor eliminado correctamente' };

  } catch (error) {
    console.error('💥 Error deleting supplier:', error);
    throw error;
  }
}

export async function deleteSupplierAction(formData: FormData) {
  const id = parseInt(formData.get('id') as string);
  return await deleteSupplier(id);
}

export async function softDeleteSupplier(id: number) {
  const supabase = await getSupabaseClient();
  
  try {
    // Marcar como inactivo en lugar de eliminar
    const { error } = await supabase
      .from('Supplier')
      .update({ active: false })
      .eq('id', id);

    if (error) {
      throw new Error(`Error desactivando proveedor: ${error.message}`);
    }

    revalidatePath('/dashboard/suppliers');
    revalidatePath(`/dashboard/suppliers/${id}`);

    return { success: true, message: 'Proveedor desactivado correctamente' };

  } catch (error) {
    console.error('Error soft deleting supplier:', error);
    throw error;
  }
}

export async function restoreSupplier(id: number) {
  const supabase = await getSupabaseClient();
  
  try {
    const { error } = await supabase
      .from('Supplier')
      .update({ active: true })
      .eq('id', id);

    if (error) {
      throw new Error(`Error reactivando proveedor: ${error.message}`);
    }

    revalidatePath('/dashboard/suppliers');
    revalidatePath(`/dashboard/suppliers/${id}`);

    return { success: true, message: 'Proveedor reactivado correctamente' };

  } catch (error) {
    console.error('Error restoring supplier:', error);
    throw error;
  }
}

export async function bulkDeleteSuppliers(ids: number[]) {
  const supabase = await getSupabaseClient();
  
  try {
    // Verificar que todos los proveedores existen y no tienen productos
    const { data: suppliers, error: fetchError } = await supabase
      .from('Supplier')
      .select(`
        id,
        name,
        Product (
          id,
          name
        )
      `)
      .in('id', ids);

    if (fetchError) {
      throw new Error(`Error verificando proveedores: ${fetchError.message}`);
    }

    if (!suppliers || suppliers.length !== ids.length) {
      throw new Error('Algunos proveedores no fueron encontrados');
    }

    // Verificar que ninguno tiene productos
    const suppliersWithProducts = suppliers.filter(s => s.Product && s.Product.length > 0);
    if (suppliersWithProducts.length > 0) {
      const names = suppliersWithProducts.map(s => s.name).join(', ');
      throw new Error(
        `Los siguientes proveedores tienen productos asociados y no pueden ser eliminados: ${names}`
      );
    }

    console.log(`🗑️ Iniciando eliminación masiva de ${ids.length} proveedores`);

    // Eliminar en secuencia (Supabase no tiene transacciones como Prisma)
    // Verificar y eliminar contactos (si la tabla existe)
    const contactsTableExists = await tableExists(supabase, 'SupplierContact');
    if (contactsTableExists) {
      console.log('📞 Eliminando contactos de proveedores...');
      const { error: contactsError } = await supabase
        .from('SupplierContact')
        .delete()
        .in('supplierId', ids);

      if (contactsError) {
        console.warn(`⚠️ Error eliminando contactos: ${contactsError.message}`);
        // No lanzar error, solo advertir
      } else {
        console.log('✅ Contactos eliminados correctamente');
      }
    } else {
      console.log('ℹ️ Tabla SupplierContact no existe, omitiendo...');
    }

    // Verificar y eliminar cuentas bancarias (si la tabla existe)
    const banksTableExists = await tableExists(supabase, 'SupplierBank');
    if (banksTableExists) {
      console.log('🏦 Eliminando bancos de proveedores...');
      const { error: banksError } = await supabase
        .from('SupplierBank')
        .delete()
        .in('supplierId', ids);

      if (banksError) {
        console.warn(`⚠️ Error eliminando bancos: ${banksError.message}`);
        // No lanzar error, solo advertir
      } else {
        console.log('✅ Bancos eliminados correctamente');
      }
    } else {
      console.log('ℹ️ Tabla SupplierBank no existe, omitiendo...');
    }

    // Verificar y eliminar configuraciones fiscales (si la tabla existe)
    const taxesTableExists = await tableExists(supabase, 'SupplierTax');
    if (taxesTableExists) {
      console.log('💰 Eliminando impuestos de proveedores...');
      const { error: taxesError } = await supabase
        .from('SupplierTax')
        .delete()
        .in('supplierId', ids);

      if (taxesError) {
        console.warn(`⚠️ Error eliminando impuestos: ${taxesError.message}`);
        // No lanzar error, solo advertir
      } else {
        console.log('✅ Impuestos eliminados correctamente');
      }
    } else {
      console.log('ℹ️ Tabla SupplierTax no existe, omitiendo...');
    }

    // Finalmente eliminar los proveedores
    console.log('🏢 Eliminando proveedores principales...');
    const { error: suppliersError } = await supabase
      .from('Supplier')
      .delete()
      .in('id', ids);

    if (suppliersError) {
      throw new Error(`Error eliminando proveedores: ${suppliersError.message}`);
    }

    console.log('✅ Proveedores eliminados correctamente');
    revalidatePath('/dashboard/suppliers');
    return { 
      success: true, 
      message: `${suppliers.length} proveedor(es) eliminado(s) correctamente` 
    };

  } catch (error) {
    console.error('💥 Error bulk deleting suppliers:', error);
    throw error;
  }
}

export async function bulkSoftDeleteSuppliers(ids: number[]) {
  const supabase = await getSupabaseClient();
  
  try {
    const { count, error } = await supabase
      .from('Supplier')
      .update({ active: false })
      .in('id', ids)
      .select('id', { count: 'exact' });

    if (error) {
      throw new Error(`Error desactivando proveedores: ${error.message}`);
    }

    revalidatePath('/dashboard/suppliers');
    return { 
      success: true, 
      message: `${count || ids.length} proveedor(es) desactivado(s) correctamente` 
    };

  } catch (error) {
    console.error('Error bulk soft deleting suppliers:', error);
    throw error;
  }
}

export async function bulkRestoreSuppliers(ids: number[]) {
  const supabase = await getSupabaseClient();
  
  try {
    const { count, error } = await supabase
      .from('Supplier')
      .update({ active: true })
      .in('id', ids)
      .select('id', { count: 'exact' });

    if (error) {
      throw new Error(`Error reactivando proveedores: ${error.message}`);
    }

    revalidatePath('/dashboard/suppliers');
    return { 
      success: true, 
      message: `${count || ids.length} proveedor(es) reactivado(s) correctamente` 
    };

  } catch (error) {
    console.error('Error bulk restoring suppliers:', error);
    throw error;
  }
}