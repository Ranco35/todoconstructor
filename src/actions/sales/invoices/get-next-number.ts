'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';

/**
 * Obtiene el siguiente número de factura correlativo
 */
export async function getNextInvoiceNumber(): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();

    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('number')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error al obtener facturas:', error);
      return { success: false, error: 'Error al obtener el siguiente número.' };
    }

    const numbers = (invoices || [])
      .map(inv => {
        const match = inv.number.match(/\d+/);
        return match ? parseInt(match[0]) : 0;
      })
      .filter(num => num > 0);

    if (numbers.length === 0) {
      return { success: true, data: '1' };
    }

    const maxNumber = Math.max(...numbers);
    return { success: true, data: String(maxNumber + 1) };

  } catch (error) {
    console.error('Error inesperado al obtener siguiente número:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
}

/**
 * Verifica si un número de factura ya existe
 */
export async function checkInvoiceNumberExists(number: string): Promise<{ success: boolean; exists?: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();

    const { data, error } = await supabase
      .from('invoices')
      .select('id')
      .eq('number', number)
      .maybeSingle();

    if (error) {
      console.error('Error al verificar número de factura:', error);
      return { success: false, error: 'Error al verificar el número.' };
    }

    return { success: true, exists: !!data };

  } catch (error) {
    console.error('Error inesperado al verificar número:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
}
