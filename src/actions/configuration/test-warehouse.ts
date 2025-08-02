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

export async function testWarehouseConnection() {
  try {
    const supabase = await getSupabaseClient();
    console.log('Probando conexión a base de datos...');
    
    // Intentar contar las bodegas
    const { count } = await supabase
      .from('Warehouse')
      .select('*', { count: 'exact', head: true });
    console.log('Número de bodegas en la base de datos:', count);
    
    // Intentar obtener una bodega simple
    const { data: firstWarehouse } = await supabase
      .from('Warehouse')
      .select('*')
      .limit(1)
      .single();
    console.log('Primera bodega encontrada:', firstWarehouse);
    
    return { success: true, count, firstWarehouse };
  } catch (error: any) {
    console.error('Error al probar conexión:', error);
    return { success: false, error: error.message };
  }
} 