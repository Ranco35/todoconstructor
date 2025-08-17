"use server";

import { getSupabaseServerClient } from '@/lib/supabase-server';
import type { POSProductCategory } from '@/types/pos/category';

export async function getPOSCategories(typeId?: number): Promise<POSProductCategory[]> {
  const supabase = await getSupabaseServerClient();
  let query = supabase.from('POSProductCategory').select('*');
  if (typeId) query = query.eq('cashRegisterTypeId', typeId);
  const { data, error } = await query.order('sortOrder', { ascending: true });
  if (error) throw new Error(error.message);
  return data as POSProductCategory[];
}

export async function createPOSCategory(data: Omit<POSProductCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<POSProductCategory> {
  const supabase = await getSupabaseServerClient();
  const { data: result, error } = await supabase.from('POSProductCategory').insert([data]).select().single();
  if (error) throw new Error(error.message);
  return result as POSProductCategory;
}

export async function updatePOSCategory(id: number, data: Partial<Omit<POSProductCategory, 'id' | 'createdAt' | 'updatedAt'>>): Promise<POSProductCategory> {
  const supabase = await getSupabaseServerClient();
  const { data: result, error } = await supabase.from('POSProductCategory').update(data).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return result as POSProductCategory;
}

export async function deletePOSCategory(id: number): Promise<void> {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from('POSProductCategory').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function togglePOSCategoryActive(id: number, isActive: boolean): Promise<POSProductCategory> {
  return updatePOSCategory(id, { isActive });
} 