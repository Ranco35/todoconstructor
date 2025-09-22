'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';

export async function testProductConnection() {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Prueba simple: obtener algunos productos básicos
    const { data, error } = await supabase
      .from('Product')
      .select('id, name, saleprice')
      .limit(5);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { 
      success: true, 
      message: `Conexión exitosa. Productos encontrados: ${data?.length || 0}`,
      count: data?.length || 0,
      sample: data?.slice(0, 2) || []
    };
    
  } catch (error: any) {
    return { 
      success: false, 
      error: `Error de conexión: ${error.message}` 
    };
  }
}
