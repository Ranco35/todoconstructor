'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';

export interface CreateInvoiceInput {
  number: string;
  client_id: number;
  budget_id?: number; // Si se convierte desde presupuesto
  reservation_id?: number;
  status?: string;
  total: number;
  currency?: string;
  due_date?: string;
  notes?: string;
  payment_terms?: string;
  company_id?: number;
  seller_id?: string; // UUID
  lines: {
    product_id?: number;
    modular_product_id?: number; // Para productos modulares
    name?: string; // Para reportes rápidos
    description: string;
    quantity: number;
    unit_price: number;
    unit?: string; // Unidad de medida del producto
    discount_percent: number;
    taxes: number[];
    subtotal: number;
  }[];
}

export interface Invoice {
  id: number;
  number: string;
  clientId: number;
  budgetId?: number;
  reservationId?: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  total: number;
  currency: string;
  dueDate?: string;
  notes?: string;
  paymentTerms?: string;
  companyId?: number;
  sellerId?: string;
  lines: InvoiceLine[];
}

export interface InvoiceLine {
  id: number;
  invoiceId: number;
  productId?: number;
  description: string;
  quantity: number;
  unitPrice: number;
  unit?: string; // Unidad de medida del producto
  discountPercent: number;
  taxes: number[];
  subtotal: number;
}

export async function createInvoice(input: CreateInvoiceInput): Promise<{ success: boolean; data?: Invoice; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();

    // Validaciones básicas
    if (!input.number.trim()) {
      return { success: false, error: 'El número de factura es obligatorio.' };
    }

    if (!input.client_id) {
      return { success: false, error: 'El cliente es obligatorio.' };
    }

    if (!input.lines || input.lines.length === 0) {
      return { success: false, error: 'Debe incluir al menos una línea en la factura.' };
    }

    // Verificar que el número no exista
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('id')
      .eq('number', input.number)
      .single();

    if (existingInvoice) {
      return { success: false, error: 'Ya existe una factura con ese número.' };
    }

    // Insertar factura principal
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        number: input.number,
        client_id: input.client_id,
        budget_id: input.budget_id,
        reservation_id: input.reservation_id,
        status: input.status || 'draft',
        total: input.total,
        currency: input.currency || 'CLP',
        due_date: input.due_date,
        notes: input.notes,
        payment_terms: input.payment_terms,
        company_id: input.company_id,
        seller_id: input.seller_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (invoiceError) {
      console.error('Error al crear factura:', invoiceError);
      return { success: false, error: 'Error al crear la factura.' };
    }

    // Insertar líneas de factura
    const invoiceLines = input.lines.map(line => ({
      invoice_id: invoice.id,
      product_id: line.product_id || null,
      modular_product_id: line.modular_product_id || null, // NUEVO: para productos modulares
      name: line.name || null, // NUEVO: para reportes rápidos
      description: line.description,
      quantity: line.quantity,
      unit_price: line.unit_price,
      unit: line.unit || 'UND', // Unidad de medida del producto
      discount_percent: line.discount_percent,
      taxes: line.taxes,
      subtotal: line.subtotal
    }));

    const { data: lines, error: linesError } = await supabase
      .from('invoice_lines')
      .insert(invoiceLines)
      .select();

    if (linesError) {
      console.error('Error al crear líneas de factura:', linesError);
      
      // Rollback manual: eliminar factura creada
      await supabase
        .from('invoices')
        .delete()
        .eq('id', invoice.id);

      return { success: false, error: 'Error al crear las líneas de la factura.' };
    }

    // Si la factura se creó desde un presupuesto, actualizar el estado del presupuesto
    if (input.budget_id) {
      await supabase
        .from('sales_quotes')
        .update({ status: 'converted', updated_at: new Date().toISOString() })
        .eq('id', input.budget_id);
    }

    // Formatear respuesta
    const result: Invoice = {
      id: invoice.id,
      number: invoice.number,
      clientId: invoice.client_id,
      budgetId: invoice.budget_id,
      reservationId: invoice.reservation_id,
      status: invoice.status,
      createdAt: invoice.created_at,
      updatedAt: invoice.updated_at,
      total: Number(invoice.total),
      currency: invoice.currency,
      dueDate: invoice.due_date,
      notes: invoice.notes,
      paymentTerms: invoice.payment_terms,
      companyId: invoice.company_id,
      sellerId: invoice.seller_id,
      lines: (lines || []).map(line => ({
        id: line.id,
        invoiceId: line.invoice_id,
        productId: line.product_id,
        description: line.description,
        quantity: line.quantity,
        unitPrice: Number(line.unit_price),
        unit: line.unit || 'UND', // Unidad de medida del producto
        discountPercent: Number(line.discount_percent),
        taxes: line.taxes || [],
        subtotal: Number(line.subtotal)
      }))
    };

    return { success: true, data: result };

  } catch (error) {
    console.error('Error inesperado al crear factura:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
}

export async function convertBudgetToInvoice(budgetId: number): Promise<{ success: boolean; data?: Invoice; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();

    // Obtener presupuesto con líneas
    const { data: budget, error: budgetError } = await supabase
      .from('sales_quotes')
      .select(`
        *,
        lines:sales_quote_lines(*)
      `)
      .eq('id', budgetId)
      .single();

    if (budgetError || !budget) {
      return { success: false, error: 'Presupuesto no encontrado.' };
    }

    if (budget.status === 'converted') {
      return { success: false, error: 'Este presupuesto ya fue convertido a factura.' };
    }

    if (budget.status !== 'accepted') {
      return { success: false, error: 'Solo se pueden convertir presupuestos aceptados.' };
    }

    // Generar número de factura automáticamente
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true });

    const invoiceNumber = `F${String((count || 0) + 1).padStart(6, '0')}`;

    // Crear factura desde presupuesto
    const invoiceInput: CreateInvoiceInput = {
      number: invoiceNumber,
      client_id: budget.client_id,
      budget_id: budget.id,
      reservation_id: budget.reservation_id,
      status: 'draft',
      total: Number(budget.total),
      currency: budget.currency,
      notes: budget.notes,
      payment_terms: budget.payment_terms,
      company_id: budget.company_id,
      seller_id: budget.seller_id,
      lines: (budget.lines || []).map((line: any) => ({
        product_id: line.product_id,
        description: line.description,
        quantity: line.quantity,
        unit_price: Number(line.unit_price),
        discount_percent: Number(line.discount_percent),
        taxes: line.taxes || [],
        subtotal: Number(line.subtotal)
      }))
    };

    return await createInvoice(invoiceInput);

  } catch (error) {
    console.error('Error inesperado al convertir presupuesto:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
} 