'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServiceClient } from '@/lib/supabase-server';
import { NO_WAREHOUSE_MARKER } from '@/lib/purchases/invoice-flags';

function setMarkerInNotes(notes: string | null | undefined, marker: string, enabled: boolean): string {
  const current = String(notes || '').trim();
  const hasMarker = current.includes(marker);

  if (enabled && !hasMarker) {
    return current ? `${current}\n${marker}` : marker;
  }

  if (!enabled && hasMarker) {
    return current
      .replace(marker, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  return current;
}

export async function setInvoiceNoWarehouseMode(invoiceId: number, enabled: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const id = Number(invoiceId);
    if (!id) return { success: false, error: 'invoiceId requerido' };

    const supabase = await getSupabaseServiceClient();

    const { data: invoice, error: readError } = await supabase
      .from('purchase_invoices')
      .select('id, notes')
      .eq('id', id)
      .single();

    if (readError || !invoice) {
      return { success: false, error: readError?.message || 'Factura no encontrada' };
    }

    const nextNotes = setMarkerInNotes((invoice as any).notes, NO_WAREHOUSE_MARKER, enabled);
    const { error: updateError } = await supabase
      .from('purchase_invoices')
      .update({ notes: nextNotes, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath(`/dashboard/purchases/invoices/${id}`);
    revalidatePath('/dashboard/purchases/invoices');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error actualizando opción sin bodega'
    };
  }
}
