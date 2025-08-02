'use server'
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

export async function getInventories({
  page = 1,
  pageSize = 10,
}: {
  page?: number
  pageSize?: number
}) {
  const supabase = await getSupabaseClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const [dataResult, totalResult] = await Promise.all([
    supabase
      .from('Inventory')
      .select(`
        *,
        Cost_Center (*),
        Warehouse (*)
      `)
      .range(from, to)
      .order('id', { ascending: false }),
    supabase
      .from('Inventory')
      .select('*', { count: 'exact', head: true })
  ]);

  const data = dataResult.data || [];
  const total = totalResult.count || 0;

  return {
    data,
    total,
    totalCount: Math.ceil(total / pageSize),
    currentPage: page,
  }
}

export async function getInventoryById(id: number) {
  const supabase = await getSupabaseClient();
  
  const { data, error } = await supabase
    .from('Inventory')
    .select(`
      *,
      Cost_Center (*),
      Warehouse (*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Error obteniendo inventario: ${error.message}`);
  }

  return data;
}

export async function createInventory(data: {
  totalItems: number
  lastUpdated: Date
  Cost_CenterId: number
  warehouseId: number
}) {
  const supabase = await getSupabaseClient();
  
  const { data: inventory, error } = await supabase
    .from('Inventory')
    .insert(data)
    .select()
    .single();

  if (error) {
    throw new Error(`Error creando inventario: ${error.message}`);
  }

  return inventory;
}

export async function updateInventory(id: number, data: {
  totalItems?: number
  lastUpdated?: Date
  Cost_CenterId?: number
  warehouseId?: number
}) {
  const supabase = await getSupabaseClient();
  
  const { data: inventory, error } = await supabase
    .from('Inventory')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Error actualizando inventario: ${error.message}`);
  }

  return inventory;
}

export async function deleteInventory(id: number) {
  const supabase = await getSupabaseClient();
  
  const { error } = await supabase
    .from('Inventory')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Error eliminando inventario: ${error.message}`);
  }

  return { success: true };
}

export async function deleteInventoryAction(formData: FormData) {
  const id = parseInt(formData.get('id') as string);
  return await deleteInventory(id);
}