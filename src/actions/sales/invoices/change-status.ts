'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';

export async function changeInvoiceStatus(
  invoiceId: number,
  newStatus: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();

    const validStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
      return { success: false, error: `Estado "${newStatus}" no válido.` };
    }

    const { error } = await supabase
      .from('invoices')
      .update({ status: newStatus })
      .eq('id', invoiceId);

    if (error) {
      console.error('Error cambiando estado de factura:', error);
      return { success: false, error: 'Error al cambiar el estado de la factura.' };
    }

    return { success: true };

  } catch (error) {
    console.error('Error inesperado en changeInvoiceStatus:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
}
