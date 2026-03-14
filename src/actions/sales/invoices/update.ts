'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import type { CreateInvoiceInput } from './create';

export async function updateInvoice(
  invoiceId: number,
  data: CreateInvoiceInput
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();

    // 1. Actualizar factura principal
    const { error: invoiceError } = await supabase
      .from('invoices')
      .update({
        number: data.number,
        client_id: data.client_id,
        budget_id: data.budget_id,
        status: data.status,
        total: data.total,
        currency: data.currency,
        due_date: data.due_date,
        notes: data.notes,
        payment_terms: data.payment_terms
      })
      .eq('id', invoiceId);

    if (invoiceError) {
      console.error('Error actualizando factura:', invoiceError);
      return { success: false, error: 'Error al actualizar la factura.' };
    }

    // 2. Eliminar líneas antiguas
    const { error: deleteError } = await supabase
      .from('invoice_lines')
      .delete()
      .eq('invoice_id', invoiceId);

    if (deleteError) {
      console.error('Error eliminando líneas antiguas:', deleteError);
      return { success: false, error: 'Error al actualizar las líneas de factura.' };
    }

    // 3. Insertar nuevas líneas
    const linesToInsert = data.lines.map((line: any) => ({
      invoice_id: invoiceId,
      product_id: line.product_id || null,
      name: line.product_name || line.name || null,
      description: line.description,
      quantity: line.quantity,
      unit_price: line.unit_price,
      discount_percent: line.discount_percent,
      taxes: line.taxes || [],
      subtotal: line.subtotal
    }));

    const { error: linesError } = await supabase
      .from('invoice_lines')
      .insert(linesToInsert);

    if (linesError) {
      console.error('Error insertando líneas:', linesError);
      return { success: false, error: 'Error al guardar las líneas de factura.' };
    }

    return {
      success: true,
      data: {
        id: invoiceId,
        number: data.number
      }
    };

  } catch (error) {
    console.error('Error inesperado en updateInvoice:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
}
