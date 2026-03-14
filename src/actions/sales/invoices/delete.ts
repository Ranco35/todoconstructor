'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';

export async function deleteInvoice(invoiceId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();

    // Verificar que la factura existe y está en estado draft
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select('id, number, status')
      .eq('id', invoiceId)
      .single();

    if (fetchError || !invoice) {
      return { success: false, error: 'Factura no encontrada.' };
    }

    if (invoice.status !== 'draft') {
      return {
        success: false,
        error: `No se pueden eliminar facturas en estado "${invoice.status}". Solo se pueden eliminar borradores.`
      };
    }

    // Eliminar líneas de factura primero (foreign key)
    const { error: linesError } = await supabase
      .from('invoice_lines')
      .delete()
      .eq('invoice_id', invoiceId);

    if (linesError) {
      console.error('Error eliminando líneas de factura:', linesError);
      return { success: false, error: 'Error al eliminar líneas de factura.' };
    }

    // Eliminar factura
    const { error: deleteError } = await supabase
      .from('invoices')
      .delete()
      .eq('id', invoiceId);

    if (deleteError) {
      console.error('Error eliminando factura:', deleteError);
      return { success: false, error: 'Error al eliminar la factura.' };
    }

    return { success: true };

  } catch (error) {
    console.error('Error inesperado en deleteInvoice:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
}
