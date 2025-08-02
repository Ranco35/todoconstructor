'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { CreatePurchaseInvoiceInput } from '@/types/purchases';

/**
 * Crear factura de compra
 */
export async function createPurchaseInvoice(input: CreatePurchaseInvoiceInput): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const {
      supplier_id,
      supplier_invoice_number,
      order_id,
      warehouse_id,
      due_date,
      notes,
      payment_terms,
      lines,
    } = input;

    // Validar datos requeridos
    if (!supplier_id) {
      return { success: false, error: 'El proveedor es requerido' };
    }

    if (!warehouse_id) {
      return { success: false, error: 'La bodega es requerida' };
    }

    if (!lines || lines.length === 0) {
      return { success: false, error: 'Debe agregar al menos un producto' };
    }

    // Validar que no existe otra factura con el mismo número oficial del proveedor
    if (supplier_invoice_number) {
      const { data: existingInvoice } = await supabase
        .from('purchase_invoices')
        .select('id')
        .eq('supplier_id', supplier_id)
        .eq('supplier_invoice_number', supplier_invoice_number)
        .single();

      if (existingInvoice) {
        return { 
          success: false, 
          error: `Ya existe una factura con el número oficial "${supplier_invoice_number}" para este proveedor` 
        };
      }
    }

    // Generar número de factura
    const invoiceNumber = await generateInvoiceNumber();

    // Calcular total
    const total = lines.reduce((sum, line) => {
      const subtotal = (line.quantity * line.unit_price) * (1 - (line.discount_percent || 0) / 100);
      return sum + subtotal;
    }, 0);

    // Crear factura
    const { data: invoice, error: invoiceError } = await supabase
      .from('purchase_invoices')
      .insert({
        number: invoiceNumber,
        supplier_invoice_number,
        supplier_id,
        order_id,
        warehouse_id,
        due_date,
        notes,
        payment_terms,
        total,
        status: 'draft',
        currency: 'CLP',
      })
      .select()
      .single();

    if (invoiceError) {
      console.error('Error creating purchase invoice:', invoiceError);
      return { success: false, error: 'Error al crear la factura de compra' };
    }

    // Crear líneas de factura
    const linesToInsert = lines.map(line => ({
      invoice_id: invoice.id,
      product_id: line.product_id,
      description: line.description || '',
      quantity: line.quantity,
      unit_price: line.unit_price,
      discount_percent: line.discount_percent || 0,
      subtotal: (line.quantity * line.unit_price) * (1 - (line.discount_percent || 0) / 100),
      received_quantity: line.received_quantity || 0,
    }));

    const { error: linesError } = await supabase
      .from('purchase_invoice_lines')
      .insert(linesToInsert);

    if (linesError) {
      console.error('Error creating purchase invoice lines:', linesError);
      return { success: false, error: 'Error al crear las líneas de la factura' };
    }

    revalidatePath('/dashboard/purchases');
    revalidatePath('/dashboard/purchases/invoices');

    return {
      success: true,
      data: invoice,
    };
  } catch (error) {
    console.error('Error in createPurchaseInvoice:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Generar número de factura automático
 */
export async function generateInvoiceNumber(): Promise<string> {
  try {
    const supabase = await createClient();

    // Obtener el último número de factura
    const { data: lastInvoice } = await supabase
      .from('purchase_invoices')
      .select('number')
      .order('number', { ascending: false })
      .limit(1)
      .single();

    let nextNumber = 1;
    if (lastInvoice?.number) {
      const match = lastInvoice.number.match(/FC(\d{6})-(\d{4})/);
      if (match) {
        const sequence = parseInt(match[2]);
        nextNumber = sequence + 1;
      }
    }

    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const sequence = nextNumber.toString().padStart(4, '0');

    return `FC${year}${month}${day}-${sequence}`;
  } catch (error) {
    console.error('Error generating invoice number:', error);
    const timestamp = Date.now().toString().slice(-4);
    return `FC${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}-${timestamp}`;
  }
}

/**
 * Actualizar factura de compra
 */
export async function updatePurchaseInvoice(id: number, input: Partial<CreatePurchaseInvoiceInput>): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (input.supplier_id !== undefined) updateData.supplier_id = input.supplier_id;
    if (input.order_id !== undefined) updateData.order_id = input.order_id;
    if (input.warehouse_id !== undefined) updateData.warehouse_id = input.warehouse_id;
    if (input.due_date !== undefined) updateData.due_date = input.due_date;
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.payment_terms !== undefined) updateData.payment_terms = input.payment_terms;

    // Actualizar factura principal
    const { data: invoice, error: invoiceError } = await supabase
      .from('purchase_invoices')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (invoiceError) {
      console.error('Error updating purchase invoice:', invoiceError);
      return { success: false, error: 'Error al actualizar la factura de compra' };
    }

    // Actualizar líneas si se proporcionan
    if (input.lines && input.lines.length > 0) {
      // Eliminar líneas existentes
      await supabase
        .from('purchase_invoice_lines')
        .delete()
        .eq('invoice_id', id);

      // Insertar nuevas líneas
      const linesToInsert = input.lines.map(line => ({
        invoice_id: id,
        product_id: line.product_id,
        description: line.description || '',
        quantity: line.quantity,
        unit_price: line.unit_price,
        discount_percent: line.discount_percent || 0,
        subtotal: (line.quantity * line.unit_price) * (1 - (line.discount_percent || 0) / 100),
        received_quantity: line.received_quantity || 0,
      }));

      const { error: linesError } = await supabase
        .from('purchase_invoice_lines')
        .insert(linesToInsert);

      if (linesError) {
        console.error('Error updating purchase invoice lines:', linesError);
        return { success: false, error: 'Error al actualizar las líneas de la factura' };
      }
    }

    // Recalcular total
    const { data: lines } = await supabase
      .from('purchase_invoice_lines')
      .select('subtotal')
      .eq('invoice_id', id);

    const total = lines?.reduce((sum, line) => sum + (line.subtotal || 0), 0) || 0;

    await supabase
      .from('purchase_invoices')
      .update({ total })
      .eq('id', id);

    revalidatePath('/dashboard/purchases');
    revalidatePath(`/dashboard/purchases/invoices/${id}`);

    return {
      success: true,
      data: { ...invoice, total },
    };
  } catch (error) {
    console.error('Error in updatePurchaseInvoice:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Cambiar estado de factura
 */
export async function updateInvoiceStatus(id: number, status: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data: invoice, error } = await supabase
      .from('purchase_invoices')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating invoice status:', error);
      return { success: false, error: 'Error al actualizar el estado de la factura' };
    }

    revalidatePath('/dashboard/purchases');
    revalidatePath(`/dashboard/purchases/invoices/${id}`);

    return {
      success: true,
      data: invoice,
    };
  } catch (error) {
    console.error('Error in updateInvoiceStatus:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
} 