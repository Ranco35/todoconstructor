"use server";

import { getSupabaseServerClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { convertBudgetToInvoice } from '@/actions/sales/invoices/create';

interface BudgetUpdateData {
  clientId: number | null;
  expirationDate: string;
  paymentTerms: string;
  currency: string;
  notes: string;
  internalNotes?: string; // Notas internas
  total: number;
  lines: {
    id?: number;
    tempId?: string;
    productId: number | null;
    productName: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discountPercent: number;
    subtotal: number;
  }[];
}

export async function updateBudget(id: number, data: BudgetUpdateData): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Actualizar presupuesto principal
    const { data: updatedBudget, error: budgetError } = await supabase
      .from('sales_quotes')
      .update({
        client_id: data.clientId,
        expiration_date: data.expirationDate,
        payment_terms: data.paymentTerms,
        currency: data.currency,
        notes: data.notes,
        internal_notes: data.internalNotes, // Notas internas
        total: data.total,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (budgetError) {
      console.error('Error al actualizar presupuesto:', budgetError);
      return { success: false, error: 'Error al actualizar el presupuesto' };
    }

    // Eliminar líneas existentes
    const { error: deleteError } = await supabase
      .from('sales_quote_lines')
      .delete()
      .eq('quote_id', id);

    if (deleteError) {
      console.error('Error al eliminar líneas anteriores:', deleteError);
      return { success: false, error: 'Error al actualizar las líneas del presupuesto' };
    }

    // Insertar nuevas líneas
    const linesToInsert = data.lines.map(line => ({
      quote_id: id,
      product_id: line.productId,
      description: line.description,
      quantity: line.quantity,
      unit_price: line.unitPrice,
      discount_percent: line.discountPercent,
      taxes: [],
      subtotal: line.subtotal
    }));

    if (linesToInsert.length > 0) {
      const { error: linesError } = await supabase
        .from('sales_quote_lines')
        .insert(linesToInsert);

      if (linesError) {
        console.error('Error al insertar líneas:', linesError);
        return { success: false, error: 'Error al actualizar las líneas del presupuesto' };
      }
    }

    // Revalidar rutas
    revalidatePath('/dashboard/sales/budgets');
    revalidatePath(`/dashboard/sales/budgets/${id}`);

    return { success: true, data: updatedBudget };
    
  } catch (error) {
    console.error('Error actualizando presupuesto:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error inesperado al actualizar el presupuesto' 
    };
  }
}

/**
 * Actualizar solo el estado de un presupuesto
 */
export async function updateBudgetStatus(id: number, status: string): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data: updatedBudget, error: budgetError } = await supabase
      .from('sales_quotes')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (budgetError) {
      console.error('Error al actualizar estado del presupuesto:', budgetError);
      return { success: false, error: 'Error al actualizar el estado del presupuesto' };
    }

    // Revalidar rutas
    revalidatePath('/dashboard/sales/budgets');
    revalidatePath(`/dashboard/sales/budgets/${id}`);

    return { success: true, data: updatedBudget };
    
  } catch (error) {
    console.error('Error actualizando estado del presupuesto:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error inesperado al actualizar el estado del presupuesto' 
    };
  }
}

/**
 * Aprobar presupuesto y crear factura automáticamente
 */
export async function approveBudgetAndCreateInvoice(budgetId: number): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    // Paso 1: Aprobar el presupuesto
    const approveResult = await updateBudgetStatus(budgetId, 'accepted');
    
    if (!approveResult.success) {
      return { success: false, error: approveResult.error };
    }

    // Paso 2: Crear factura automáticamente
    const invoiceResult = await convertBudgetToInvoice(budgetId);
    
    if (!invoiceResult.success) {
      // Si falla la creación de factura, revertir estado del presupuesto
      await updateBudgetStatus(budgetId, 'sent');
      return { success: false, error: `Error al crear factura: ${invoiceResult.error}` };
    }

    // Paso 3: Actualizar estado del presupuesto a convertido
    await updateBudgetStatus(budgetId, 'converted');

    return { 
      success: true, 
      data: {
        budget: approveResult.data,
        invoice: invoiceResult.data
      }
    };
    
  } catch (error) {
    console.error('Error en proceso de aprobación y creación de factura:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error inesperado en el proceso' 
    };
  }
}

/**
 * Función específica para actualizar solo las notas internas
 * Solo para uso del personal interno - NO se envían a clientes
 */
export async function updateBudgetInternalNotes(id: number, internalNotes: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Actualizar solo las notas internas
    const { error: updateError } = await supabase
      .from('sales_quotes')
      .update({
        internal_notes: internalNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error al actualizar notas internas:', updateError);
      return { success: false, error: 'Error al actualizar las notas internas' };
    }

    // Revalidar rutas relacionadas
    revalidatePath(`/dashboard/sales/budgets/${id}`);
    revalidatePath('/dashboard/sales/budgets');

    return { success: true };
    
  } catch (error) {
    console.error('Error actualizando notas internas:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
}