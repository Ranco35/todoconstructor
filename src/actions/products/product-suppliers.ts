'use server';

/**
 * Acciones de servidor para gestionar la tabla product_suppliers
 * (relación N:M entre Product y Supplier)
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ProductSupplier } from '@/types/product';

async function getSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Obtener proveedores de un producto
// ─────────────────────────────────────────────────────────────────────────────
export async function getProductSuppliers(productId: number): Promise<ProductSupplier[]> {
  const supabase = await getSupabaseClient();
  const { data, error } = await supabase
    .from('product_suppliers')
    .select(`
      id,
      product_id,
      supplier_id,
      supplier_code,
      is_primary,
      Supplier (id, name)
    `)
    .eq('product_id', productId)
    .order('is_primary', { ascending: false });

  if (error) {
    console.error('Error obteniendo product_suppliers:', error);
    return [];
  }

  return (data || []).map(row => ({
    id: row.id,
    supplierId: row.supplier_id,
    supplierName: (row.Supplier as any)?.name,
    supplierCode: row.supplier_code ?? undefined,
    isPrimary: row.is_primary,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Sincronizar proveedores de un producto (upsert + delete diferencial)
// ─────────────────────────────────────────────────────────────────────────────
export async function syncProductSuppliers(
  productId: number,
  suppliers: ProductSupplier[]
): Promise<{ success: boolean; error?: string }> {
  if (!productId) return { success: false, error: 'productId requerido' };

  const supabase = await getSupabaseClient();

  try {
    // 1. Obtener los supplier_ids actuales en BD
    const { data: existing } = await supabase
      .from('product_suppliers')
      .select('id, supplier_id')
      .eq('product_id', productId);

    const existingSupplierIds = new Set((existing || []).map(r => r.supplier_id));
    const incomingSupplierIds = new Set(suppliers.map(s => s.supplierId));

    // 2. Eliminar proveedores que ya no están en la lista
    const toDelete = (existing || [])
      .filter(r => !incomingSupplierIds.has(r.supplier_id))
      .map(r => r.id);

    if (toDelete.length > 0) {
      const { error: delErr } = await supabase
        .from('product_suppliers')
        .delete()
        .in('id', toDelete);
      if (delErr) throw new Error(`Error eliminando proveedores: ${delErr.message}`);
    }

    // 3. Garantizar solo un proveedor principal
    const hasPrimary = suppliers.some(s => s.isPrimary);
    const normalizedSuppliers = suppliers.map((s, idx) => ({
      ...s,
      isPrimary: hasPrimary ? s.isPrimary : idx === 0,
    }));

    // 4. Upsert de todos los proveedores
    for (const supplier of normalizedSuppliers) {
      const { error: upsertErr } = await supabase
        .from('product_suppliers')
        .upsert(
          {
            product_id: productId,
            supplier_id: supplier.supplierId,
            supplier_code: supplier.supplierCode ?? null,
            is_primary: supplier.isPrimary,
          },
          { onConflict: 'product_id,supplier_id' }
        );
      if (upsertErr) throw new Error(`Error upsert proveedor ${supplier.supplierId}: ${upsertErr.message}`);
    }

    // 5. Sincronizar Product.supplierid con el proveedor principal (compatibilidad)
    const primary = normalizedSuppliers.find(s => s.isPrimary);
    if (primary) {
      await supabase
        .from('Product')
        .update({
          supplierid: primary.supplierId,
          supplierCode: primary.supplierCode ?? null,
        })
        .eq('id', productId);
    } else if (suppliers.length === 0) {
      await supabase
        .from('Product')
        .update({ supplierid: null, supplierCode: null })
        .eq('id', productId);
    }

    return { success: true };
  } catch (err: any) {
    console.error('syncProductSuppliers error:', err);
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Agregar un proveedor a un producto
// ─────────────────────────────────────────────────────────────────────────────
export async function addProductSupplier(
  productId: number,
  supplier: Omit<ProductSupplier, 'id'>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await getSupabaseClient();

  if (supplier.isPrimary) {
    await supabase
      .from('product_suppliers')
      .update({ is_primary: false })
      .eq('product_id', productId);
  }

  const { error } = await supabase
    .from('product_suppliers')
    .upsert(
      {
        product_id: productId,
        supplier_id: supplier.supplierId,
        supplier_code: supplier.supplierCode ?? null,
        is_primary: supplier.isPrimary,
      },
      { onConflict: 'product_id,supplier_id' }
    );

  if (error) return { success: false, error: error.message };

  if (supplier.isPrimary) {
    await supabase
      .from('Product')
      .update({ supplierid: supplier.supplierId, supplierCode: supplier.supplierCode ?? null })
      .eq('id', productId);
  }

  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Eliminar un proveedor de un producto
// ─────────────────────────────────────────────────────────────────────────────
export async function removeProductSupplier(
  productId: number,
  rowId: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await getSupabaseClient();

  const { data: row } = await supabase
    .from('product_suppliers')
    .select('is_primary, supplier_id')
    .eq('id', rowId)
    .single();

  const { error } = await supabase
    .from('product_suppliers')
    .delete()
    .eq('id', rowId);

  if (error) return { success: false, error: error.message };

  if (row?.is_primary) {
    const { data: remaining } = await supabase
      .from('product_suppliers')
      .select('id, supplier_id, supplier_code')
      .eq('product_id', productId)
      .order('id', { ascending: true })
      .limit(1);

    if (remaining && remaining.length > 0) {
      await supabase
        .from('product_suppliers')
        .update({ is_primary: true })
        .eq('id', remaining[0].id);

      await supabase
        .from('Product')
        .update({ supplierid: remaining[0].supplier_id, supplierCode: remaining[0].supplier_code })
        .eq('id', productId);
    } else {
      await supabase
        .from('Product')
        .update({ supplierid: null, supplierCode: null })
        .eq('id', productId);
    }
  }

  return { success: true };
}
