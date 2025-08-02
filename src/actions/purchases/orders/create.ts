'use server';

import { createClient } from '@/lib/supabase-server';
import { CreatePurchaseOrderInput, PurchaseOrder, PurchaseOrderWithDetails } from '@/types/purchases';
import { revalidatePath } from 'next/cache';

/**
 * Crear una nueva orden de compra
 */
export async function createPurchaseOrder(input: CreatePurchaseOrderInput): Promise<{
  success: boolean;
  data?: PurchaseOrder;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Validar datos de entrada
    if (!input.supplier_id) {
      return { success: false, error: 'Proveedor es requerido' };
    }

    if (!input.warehouse_id) {
      return { success: false, error: 'Bodega es requerida' };
    }

    if (!input.lines || input.lines.length === 0) {
      return { success: false, error: 'Debe agregar al menos una línea de producto' };
    }

    // Generar número de orden
    const orderNumber = await generatePurchaseOrderNumber();

    // Calcular total
    const total = input.lines.reduce((sum, line) => {
      const subtotal = line.quantity * line.unit_price;
      const discount = subtotal * (line.discount_percent || 0) / 100;
      return sum + (subtotal - discount);
    }, 0);

    // Crear la orden de compra
    const { data: order, error: orderError } = await supabase
      .from('purchase_orders')
      .insert({
        number: orderNumber,
        supplier_id: input.supplier_id,
        warehouse_id: input.warehouse_id,
        status: 'draft',
        total,
        currency: 'CLP',
        expected_delivery_date: input.expected_delivery_date,
        notes: input.notes,
        payment_terms: input.payment_terms,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating purchase order:', orderError);
      return { success: false, error: 'Error al crear la orden de compra' };
    }

    // Crear las líneas de la orden
    const linesToInsert = input.lines.map(line => ({
      order_id: order.id,
      product_id: line.product_id,
      description: line.description,
      quantity: line.quantity,
      unit_price: line.unit_price,
      discount_percent: line.discount_percent || 0,
      subtotal: line.quantity * line.unit_price * (1 - (line.discount_percent || 0) / 100),
    }));

    const { error: linesError } = await supabase
      .from('purchase_order_lines')
      .insert(linesToInsert);

    if (linesError) {
      console.error('Error creating purchase order lines:', linesError);
      return { success: false, error: 'Error al crear las líneas de la orden' };
    }

    revalidatePath('/dashboard/purchases');
    revalidatePath('/dashboard/purchases/orders');

    return { success: true, data: order };
  } catch (error) {
    console.error('Error in createPurchaseOrder:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Generar número único para orden de compra
 */
async function generatePurchaseOrderNumber(): Promise<string> {
  const supabase = await createClient();
  
  // Obtener el último número de orden
  const { data: lastOrder } = await supabase
    .from('purchase_orders')
    .select('number')
    .order('number', { ascending: false })
    .limit(1)
    .single();

  let nextNumber = 1;
  if (lastOrder?.number) {
    const lastNumber = parseInt(lastOrder.number.replace('OC-', ''));
    nextNumber = lastNumber + 1;
  }

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  return `OC-${String(nextNumber).padStart(4, '0')}-${year}${month}${day}`;
}

/**
 * Obtener orden de compra por ID con detalles completos
 */
export async function getPurchaseOrderById(id: number): Promise<{
  success: boolean;
  data?: PurchaseOrderWithDetails;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Obtener la orden con información del proveedor y bodega
    const { data: order, error: orderError } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        supplier:Supplier(id, name, email, phone),
        warehouse:Warehouse(id, name, location)
      `)
      .eq('id', id)
      .single();

    if (orderError) {
      console.error('Error fetching purchase order:', orderError);
      return { success: false, error: 'Orden de compra no encontrada' };
    }

    // Obtener las líneas de la orden con información de productos
    const { data: lines, error: linesError } = await supabase
      .from('purchase_order_lines')
      .select(`
        *,
        product:Product(id, name, sku, brand)
      `)
      .eq('order_id', id)
      .order('id');

    if (linesError) {
      console.error('Error fetching purchase order lines:', linesError);
      return { success: false, error: 'Error al obtener las líneas de la orden' };
    }

    const orderWithDetails: PurchaseOrderWithDetails = {
      ...order,
      lines: lines || [],
    };

    return { success: true, data: orderWithDetails };
  } catch (error) {
    console.error('Error in getPurchaseOrderById:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Obtener orden de compra para edición
 */
export async function getPurchaseOrderForEdit(id: number): Promise<{
  success: boolean;
  data?: PurchaseOrderWithDetails;
  error?: string;
}> {
  return getPurchaseOrderById(id);
}

/**
 * Actualizar orden de compra
 */
export async function updatePurchaseOrder(input: {
  id: number;
  supplier_id?: number;
  warehouse_id?: number;
  expected_delivery_date?: string;
  notes?: string;
  payment_terms?: string;
  status?: string;
  lines?: Array<{
    id?: number;
    product_id: number;
    description?: string;
    quantity: number;
    unit_price: number;
    discount_percent?: number;
  }>;
}): Promise<{
  success: boolean;
  data?: PurchaseOrder;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Validar que la orden existe y no está en estado final
    const { data: existingOrder } = await supabase
      .from('purchase_orders')
      .select('status')
      .eq('id', input.id)
      .single();

    if (!existingOrder) {
      return { success: false, error: 'Orden de compra no encontrada' };
    }

    if (existingOrder.status === 'received' || existingOrder.status === 'cancelled') {
      return { success: false, error: 'No se puede editar una orden recibida o cancelada' };
    }

    // Calcular nuevo total si hay líneas
    let total = existingOrder.total;
    if (input.lines) {
      total = input.lines.reduce((sum, line) => {
        const subtotal = line.quantity * line.unit_price;
        const discount = subtotal * (line.discount_percent || 0) / 100;
        return sum + (subtotal - discount);
      }, 0);
    }

    // Actualizar la orden
    const { data: order, error: orderError } = await supabase
      .from('purchase_orders')
      .update({
        supplier_id: input.supplier_id,
        warehouse_id: input.warehouse_id,
        expected_delivery_date: input.expected_delivery_date,
        notes: input.notes,
        payment_terms: input.payment_terms,
        status: input.status,
        total,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.id)
      .select()
      .single();

    if (orderError) {
      console.error('Error updating purchase order:', orderError);
      return { success: false, error: 'Error al actualizar la orden de compra' };
    }

    // Actualizar líneas si se proporcionan
    if (input.lines) {
      // Eliminar líneas existentes
      await supabase
        .from('purchase_order_lines')
        .delete()
        .eq('order_id', input.id);

      // Insertar nuevas líneas
      const linesToInsert = input.lines.map(line => ({
        order_id: input.id,
        product_id: line.product_id,
        description: line.description,
        quantity: line.quantity,
        unit_price: line.unit_price,
        discount_percent: line.discount_percent || 0,
        subtotal: line.quantity * line.unit_price * (1 - (line.discount_percent || 0) / 100),
      }));

      const { error: linesError } = await supabase
        .from('purchase_order_lines')
        .insert(linesToInsert);

      if (linesError) {
        console.error('Error updating purchase order lines:', linesError);
        return { success: false, error: 'Error al actualizar las líneas de la orden' };
      }
    }

    revalidatePath('/dashboard/purchases');
    revalidatePath('/dashboard/purchases/orders');
    revalidatePath(`/dashboard/purchases/orders/${input.id}`);

    return { success: true, data: order };
  } catch (error) {
    console.error('Error in updatePurchaseOrder:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Aprobar orden de compra
 */
export async function approvePurchaseOrder(id: number): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Obtener usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    // Actualizar estado de la orden
    const { error } = await supabase
      .from('purchase_orders')
      .update({
        status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error approving purchase order:', error);
      return { success: false, error: 'Error al aprobar la orden de compra' };
    }

    revalidatePath('/dashboard/purchases');
    revalidatePath('/dashboard/purchases/orders');
    revalidatePath(`/dashboard/purchases/orders/${id}`);

    return { success: true };
  } catch (error) {
    console.error('Error in approvePurchaseOrder:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Cancelar orden de compra
 */
export async function cancelPurchaseOrder(id: number): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('purchase_orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error cancelling purchase order:', error);
      return { success: false, error: 'Error al cancelar la orden de compra' };
    }

    revalidatePath('/dashboard/purchases');
    revalidatePath('/dashboard/purchases/orders');
    revalidatePath(`/dashboard/purchases/orders/${id}`);

    return { success: true };
  } catch (error) {
    console.error('Error in cancelPurchaseOrder:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
} 