"use server";

import { getSupabaseServerClient } from '@/lib/supabase-server';
import type { Budget } from '../../../types/ventas/budget';

export interface BudgetWithDetails extends Budget {
  client: {
    id: number;
    nombrePrincipal: string;
    apellido: string;
    email: string;
    rut?: string;
    telefono?: string;
    telefonoMovil?: string;
  } | null;
  lines: {
    id: number;
    quoteId: number;
    productId?: string;
    productName?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discountPercent: number;
    taxes: number[];
    subtotal: number;
  }[];
}

export async function getBudgetById(id: number): Promise<{ success: boolean; data?: BudgetWithDetails; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Obtener presupuesto con información del cliente
    const { data: budget, error: budgetError } = await supabase
      .from('sales_quotes')
      .select(`
        *,
        client:client_id (
          id,
          nombrePrincipal,
          apellido, 
          email,
          rut,
          telefono,
          telefonoMovil
        )
      `)
      .eq('id', id)
      .single();

    if (budgetError) {
      console.error('Error al obtener presupuesto:', budgetError);
      return { success: false, error: 'Presupuesto no encontrado.' };
    }

    if (!budget) {
      return { success: false, error: 'Presupuesto no encontrado.' };
    }

    // Obtener líneas del presupuesto con información del producto usando SQL manual
    const { data: lines, error: linesError } = await supabase
      .rpc('get_budget_lines_with_product', { budget_id: id });

    console.log('Líneas obtenidas:', lines);

    if (linesError) {
      console.error('Error al obtener líneas del presupuesto:', linesError);
      return { success: false, error: 'Error al cargar las líneas del presupuesto.' };
    }

    // Mapear datos a la interface esperada
    const budgetWithDetails: BudgetWithDetails = {
      id: budget.id,
      number: budget.number,
      clientId: budget.client_id,
      reservationId: budget.reservation_id,
      status: budget.status,
      createdAt: budget.created_at,
      updatedAt: budget.updated_at,
      total: Number(budget.total),
      currency: budget.currency,
      expirationDate: budget.expiration_date,
      notes: budget.notes,
      internalNotes: budget.internal_notes, // Notas internas
      paymentTerms: budget.payment_terms,
      companyId: budget.company_id,
      sellerId: budget.seller_id,
      client: budget.client,
      lines: (lines || []).map(line => ({
        id: line.id,
        quoteId: line.quote_id,
        productId: line.product_id,
        productName: line.product_name || null,
        description: line.description || line.product_name || 'Sin descripción',
        quantity: Number(line.quantity),
        unitPrice: Number(line.unit_price),
        discountPercent: Number(line.discount_percent || 0),
        taxes: line.taxes || [],
        subtotal: Number(line.subtotal)
      }))
    };

    return { success: true, data: budgetWithDetails };
    
  } catch (error) {
    console.error('Error obteniendo presupuesto:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error inesperado al obtener el presupuesto' 
    };
  }
}

export async function getBudgetPreview(id: number): Promise<{ success: boolean; data?: { number: string; clientName: string; total: number; currency: string; status: string }; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data: budget, error } = await supabase
      .from('sales_quotes')
      .select(`
        number,
        total,
        currency,
        status,
        client:client_id (
          nombrePrincipal,
          apellido
        )
      `)
      .eq('id', id)
      .single();

    if (error || !budget) {
      return { success: false, error: 'Presupuesto no encontrado.' };
    }

    return {
      success: true,
      data: {
        number: budget.number,
        clientName: budget.client ? `${budget.client.nombrePrincipal} ${budget.client.apellido}` : 'Cliente no encontrado',
        total: Number(budget.total),
        currency: budget.currency,
        status: budget.status
      }
    };
  } catch (error) {
    return { success: false, error: 'Error al obtener vista previa del presupuesto.' };
  }
}

export async function getBudgetForEdit(id: number): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Obtener presupuesto con información del cliente
    const { data: budget, error: budgetError } = await supabase
      .from('sales_quotes')
      .select(`
        *,
        client:client_id (
          id,
          nombrePrincipal,
          apellido, 
          email,
          rut,
          telefono,
          telefonoMovil
        )
      `)
      .eq('id', id)
      .single();

    if (budgetError) {
      console.error('Error al obtener presupuesto:', budgetError);
      return { success: false, error: 'Presupuesto no encontrado.' };
    }

    if (!budget) {
      return { success: false, error: 'Presupuesto no encontrado.' };
    }

    // Obtener líneas del presupuesto usando la función personalizada
    const { data: lines, error: linesError } = await supabase
      .rpc('get_budget_lines_with_product', { budget_id: id });

    if (linesError) {
      console.error('Error al obtener líneas del presupuesto:', linesError);
      return { success: false, error: 'Error al cargar las líneas del presupuesto.' };
    }

    // Mapear datos para el formulario
    const formData = {
      quoteNumber: budget.number,
      clientId: budget.client_id,
      expirationDate: budget.expiration_date || '',
      paymentTerms: budget.payment_terms || '30',
      currency: budget.currency || 'CLP',
      notes: budget.notes || '',
      internalNotes: budget.internal_notes || '', // Notas internas
      total: Number(budget.total),
      lines: (lines || []).map(line => ({
        tempId: `existing-${line.id}`,
        productId: line.product_id,
        productName: line.product_name || '',
        description: line.description || line.product_name || 'Sin descripción',
        quantity: Number(line.quantity),
        unitPrice: Number(line.unit_price),
        discountPercent: Number(line.discount_percent || 0),
        subtotal: Number(line.subtotal)
      }))
    };



    return { success: true, data: formData };
    
  } catch (error) {
    console.error('Error obteniendo presupuesto para edición:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error inesperado al obtener el presupuesto' 
    };
  }
} 