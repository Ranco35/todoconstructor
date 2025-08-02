'use server';

import { createClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { UpdatePurchaseOrderInput, PurchaseOrderStatus } from '@/types/purchases';

/**
 * Actualizar orden de compra
 */
export async function updatePurchaseOrder(input: UpdatePurchaseOrderInput): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const {
      id,
      supplier_id,
      warehouse_id,
      expected_delivery_date,
      notes,
      payment_terms,
      status,
      lines,
    } = input;

    // Actualizar orden principal
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (supplier_id !== undefined) updateData.supplier_id = supplier_id;
    if (warehouse_id !== undefined) updateData.warehouse_id = warehouse_id;
    if (expected_delivery_date !== undefined) updateData.expected_delivery_date = expected_delivery_date;
    if (notes !== undefined) updateData.notes = notes;
    if (payment_terms !== undefined) updateData.payment_terms = payment_terms;
    if (status !== undefined) updateData.status = status;

    // Si se está aprobando, agregar información de aprobación
    if (status === 'approved') {
      const { data: { user } } = await supabase.auth.getUser();
      updateData.approved_by = user?.id;
      updateData.approved_at = new Date().toISOString();
    }

    const { data: order, error: orderError } = await supabase
      .from('purchase_orders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (orderError) {
      console.error('Error updating purchase order:', orderError);
      return { success: false, error: 'Error al actualizar la orden de compra' };
    }

    // Actualizar líneas si se proporcionan
    if (lines && lines.length > 0) {
      // Eliminar líneas existentes
      await supabase
        .from('purchase_order_lines')
        .delete()
        .eq('order_id', id);

      // Insertar nuevas líneas
      const linesToInsert = lines.map(line => ({
        order_id: id,
        product_id: line.product_id,
        description: line.description || '',
        quantity: line.quantity,
        unit_price: line.unit_price,
        discount_percent: line.discount_percent || 0,
        subtotal: (line.quantity * line.unit_price) * (1 - (line.discount_percent || 0) / 100),
      }));

      const { error: linesError } = await supabase
        .from('purchase_order_lines')
        .insert(linesToInsert);

      if (linesError) {
        console.error('Error updating purchase order lines:', linesError);
        return { success: false, error: 'Error al actualizar las líneas de la orden' };
      }
    }

    // Recalcular total
    const { data: lines } = await supabase
      .from('purchase_order_lines')
      .select('subtotal')
      .eq('order_id', id);

    const total = lines?.reduce((sum, line) => sum + (line.subtotal || 0), 0) || 0;

    await supabase
      .from('purchase_orders')
      .update({ total })
      .eq('id', id);

    revalidatePath('/dashboard/purchases');
    revalidatePath(`/dashboard/purchases/orders/${id}`);

    return {
      success: true,
      data: { ...order, total },
    };
  } catch (error) {
    console.error('Error in updatePurchaseOrder:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Aprobar orden de compra
 */
export async function approvePurchaseOrder(orderId: number): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    const { data: order, error } = await supabase
      .from('purchase_orders')
      .update({
        status: 'approved',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Error approving purchase order:', error);
      return { success: false, error: 'Error al aprobar la orden de compra' };
    }

    revalidatePath('/dashboard/purchases');
    revalidatePath(`/dashboard/purchases/orders/${orderId}`);

    return {
      success: true,
      data: order,
    };
  } catch (error) {
    console.error('Error in approvePurchaseOrder:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Cancelar orden de compra
 */
export async function cancelPurchaseOrder(orderId: number): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data: order, error } = await supabase
      .from('purchase_orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Error cancelling purchase order:', error);
      return { success: false, error: 'Error al cancelar la orden de compra' };
    }

    revalidatePath('/dashboard/purchases');
    revalidatePath(`/dashboard/purchases/orders/${orderId}`);

    return {
      success: true,
      data: order,
    };
  } catch (error) {
    console.error('Error in cancelPurchaseOrder:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Marcar orden como recibida
 */
export async function markOrderAsReceived(orderId: number): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data: order, error } = await supabase
      .from('purchase_orders')
      .update({
        status: 'received',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Error marking order as received:', error);
      return { success: false, error: 'Error al marcar la orden como recibida' };
    }

    revalidatePath('/dashboard/purchases');
    revalidatePath(`/dashboard/purchases/orders/${orderId}`);

    return {
      success: true,
      data: order,
    };
  } catch (error) {
    console.error('Error in markOrderAsReceived:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
}

/**
 * Enviar orden al proveedor
 */
export async function sendOrderToSupplier(orderId: number): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data: order, error } = await supabase
      .from('purchase_orders')
      .update({
        status: 'sent',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Error sending order to supplier:', error);
      return { success: false, error: 'Error al enviar la orden al proveedor' };
    }

    revalidatePath('/dashboard/purchases');
    revalidatePath(`/dashboard/purchases/orders/${orderId}`);

    return {
      success: true,
      data: order,
    };
  } catch (error) {
    console.error('Error in sendOrderToSupplier:', error);
    return { success: false, error: 'Error interno del servidor' };
  }
} 