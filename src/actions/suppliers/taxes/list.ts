'use server';

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

export async function getSupplierTaxes(supplierId: number) {
  const supabase = await getSupabaseClient();
  try {
    const { data: taxes, error } = await supabase
      .from('SupplierTax')
      .select('*')
      .eq('supplierId', supplierId)
      .order('createdAt', { ascending: false });

    if (error) {
      throw error;
    }

    return taxes;
  } catch (error) {
    console.error('Error getting supplier taxes:', error);
    throw error;
  }
} 