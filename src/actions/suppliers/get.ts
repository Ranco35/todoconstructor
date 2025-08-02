'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

interface GetSupplierOptions {
  includeContacts?: boolean;
  includeBanks?: boolean;
  includeTaxes?: boolean;
  includeProducts?: boolean;
  includeCounts?: boolean;
}

async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );
}

export async function getSupplier(supplierId: number, options: GetSupplierOptions = {}) {
  const supabase = await getSupabaseClient();
  try {
    let selectQuery = `
      *,
      etiquetas:SupplierTagAssignment(
        id,
        etiquetaId,
        etiqueta:SupplierTag(
          id,
          nombre,
          color,
          icono,
          activo
        )
      )
    `;

    if (options.includeContacts) selectQuery += ', SupplierContact(*)';
    if (options.includeBanks) selectQuery += ', SupplierBank(*)';
    if (options.includeTaxes) selectQuery += ', SupplierTax(*)';
    if (options.includeProducts) selectQuery += ', Product(*)';

    const { data: supplier, error } = await supabase
      .from('Supplier')
      .select(selectQuery)
      .eq('id', supplierId)
      .single();

    if (error) throw error;
    
    return supplier;

  } catch (error) {
    console.error('Error getting supplier:', error);
    throw error;
  }
}

// Alias para mantener compatibilidad
export const getSupplierById = getSupplier;

export async function getSupplierByReference(reference: string) {
  const supabase = await getSupabaseClient();
  try {
    const { data: supplier, error } = await supabase
      .from('Supplier')
      .select('*') // Podríamos añadir counts aquí si es necesario con otra llamada
      .eq('reference', reference)
      .single();
    
    if (error) throw error;
    return supplier;

  } catch (error) {
    console.error('Error getting supplier by reference:', error);
    throw error;
  }
}

export async function getSupplierWithContacts(supplierId: number) {
  return getSupplier(supplierId, { includeContacts: true });
}

export async function getSupplierWithBanks(supplierId: number) {
  return getSupplier(supplierId, { includeBanks: true });
}

export async function getSupplierWithTaxes(supplierId: number) {
  return getSupplier(supplierId, { includeTaxes: true });
}

export async function getSupplierComplete(supplierId: number) {
  return getSupplier(supplierId, { 
    includeContacts: true, 
    includeBanks: true, 
    includeTaxes: true 
  });
}

export async function getSupplierAction(_id: number) {
  // This function is a placeholder for compatibility
  // Implementation can be added later if needed
  throw new Error('getSupplierAction not implemented');
}

// --- OBTENER PROVEEDORES ACTIVOS ---
export async function getActiveSuppliers() {
  const supabase = await getSupabaseClient();
  try {
    const { data: suppliers, error } = await supabase
      .from('Supplier')
      .select(`
        id,
        name,
        displayName,
        companyType,
        vat,
        taxId,
        phone,
        mobile,
        email,
        active,
        supplierRank,
        category,
        createdAt,
        updatedAt
      `)
      .eq('active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return suppliers || [];
  } catch (error) {
    console.error('Error getting active suppliers:', error);
    return [];
  }
}

// --- OBTENER PROVEEDORES POR TIPO ---
export async function getSuppliersByType(companyType: 'INDIVIDUAL' | 'EMPRESA') {
  const supabase = await getSupabaseClient();
  try {
    const { data: suppliers, error } = await supabase
      .from('Supplier')
      .select(`
        id,
        name,
        displayName,
        companyType,
        vat,
        taxId,
        phone,
        mobile,
        email,
        active,
        supplierRank,
        category,
        createdAt,
        updatedAt
      `)
      .eq('active', true)
      .eq('companyType', companyType)
      .order('name', { ascending: true });

    if (error) throw error;
    return suppliers || [];
  } catch (error) {
    console.error(`Error getting suppliers by type ${companyType}:`, error);
    return [];
  }
} 