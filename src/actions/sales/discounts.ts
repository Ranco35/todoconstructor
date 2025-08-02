'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';

// Interfaces para descuentos
export interface Discount {
  id?: number;
  name: string;
  description: string;
  type: 'percentage' | 'fixed' | 'buy_x_get_y';
  value: number;
  minAmount?: number;
  maxDiscount?: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  appliesTo: 'all' | 'products' | 'categories' | 'clients';
  productIds?: number[];
  categoryIds?: number[];
  clientIds?: number[];
  usageLimit?: number;
  currentUsage: number;
  code?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DiscountApplication {
  discountId: number;
  invoiceId: number;
  amount: number;
  appliedAt: string;
}

// Función para crear descuento
export async function createDiscount(discount: Omit<Discount, 'id' | 'currentUsage' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; data?: Discount; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('sales_discounts')
      .insert({
        name: discount.name,
        description: discount.description,
        type: discount.type,
        value: discount.value,
        min_amount: discount.minAmount,
        max_discount: discount.maxDiscount,
        valid_from: discount.validFrom,
        valid_to: discount.validTo,
        is_active: discount.isActive,
        applies_to: discount.appliesTo,
        product_ids: discount.productIds,
        category_ids: discount.categoryIds,
        client_ids: discount.clientIds,
        usage_limit: discount.usageLimit,
        current_usage: 0,
        code: discount.code
      })
      .select()
      .single();

    if (error) {
      console.error('Error creando descuento:', error);
      return { success: false, error: 'Error al crear descuento.' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error creando descuento:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
}

// Función para obtener descuentos
export async function getDiscounts(): Promise<{ success: boolean; data?: Discount[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('sales_discounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo descuentos:', error);
      return { success: false, error: 'Error al obtener descuentos.' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error obteniendo descuentos:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
}

// Función para obtener descuento por ID
export async function getDiscountById(id: number): Promise<{ success: boolean; data?: Discount; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('sales_discounts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error obteniendo descuento:', error);
      return { success: false, error: 'Error al obtener descuento.' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error obteniendo descuento:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
}

// Función para actualizar descuento
export async function updateDiscount(id: number, discount: Partial<Discount>): Promise<{ success: boolean; data?: Discount; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const updateData: any = {};
    
    if (discount.name !== undefined) updateData.name = discount.name;
    if (discount.description !== undefined) updateData.description = discount.description;
    if (discount.type !== undefined) updateData.type = discount.type;
    if (discount.value !== undefined) updateData.value = discount.value;
    if (discount.minAmount !== undefined) updateData.min_amount = discount.minAmount;
    if (discount.maxDiscount !== undefined) updateData.max_discount = discount.maxDiscount;
    if (discount.validFrom !== undefined) updateData.valid_from = discount.validFrom;
    if (discount.validTo !== undefined) updateData.valid_to = discount.validTo;
    if (discount.isActive !== undefined) updateData.is_active = discount.isActive;
    if (discount.appliesTo !== undefined) updateData.applies_to = discount.appliesTo;
    if (discount.productIds !== undefined) updateData.product_ids = discount.productIds;
    if (discount.categoryIds !== undefined) updateData.category_ids = discount.categoryIds;
    if (discount.clientIds !== undefined) updateData.client_ids = discount.clientIds;
    if (discount.usageLimit !== undefined) updateData.usage_limit = discount.usageLimit;
    if (discount.code !== undefined) updateData.code = discount.code;

    const { data, error } = await supabase
      .from('sales_discounts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando descuento:', error);
      return { success: false, error: 'Error al actualizar descuento.' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error actualizando descuento:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
}

// Función para eliminar descuento
export async function deleteDiscount(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { error } = await supabase
      .from('sales_discounts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error eliminando descuento:', error);
      return { success: false, error: 'Error al eliminar descuento.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error eliminando descuento:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
}

// Función para validar descuento
export async function validateDiscount(code: string, invoiceAmount: number, clientId?: number, productIds?: number[]): Promise<{ success: boolean; data?: Discount; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('sales_discounts')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return { success: false, error: 'Código de descuento no válido.' };
    }

    const discount = data;
    const now = new Date();
    const validFrom = new Date(discount.valid_from);
    const validTo = new Date(discount.valid_to);

    // Verificar fechas de validez
    if (now < validFrom || now > validTo) {
      return { success: false, error: 'El descuento no está vigente.' };
    }

    // Verificar límite de uso
    if (discount.usage_limit && discount.current_usage >= discount.usage_limit) {
      return { success: false, error: 'El descuento ha alcanzado su límite de uso.' };
    }

    // Verificar monto mínimo
    if (discount.min_amount && invoiceAmount < discount.min_amount) {
      return { success: false, error: `Monto mínimo requerido: $${discount.min_amount.toLocaleString('es-CL')}` };
    }

    // Verificar aplicabilidad
    if (discount.applies_to === 'clients' && discount.client_ids && clientId) {
      if (!discount.client_ids.includes(clientId)) {
        return { success: false, error: 'El descuento no aplica para este cliente.' };
      }
    }

    if (discount.applies_to === 'products' && discount.product_ids && productIds) {
      const hasValidProduct = productIds.some(id => discount.product_ids.includes(id));
      if (!hasValidProduct) {
        return { success: false, error: 'El descuento no aplica para estos productos.' };
      }
    }

    return { success: true, data: discount };
  } catch (error) {
    console.error('Error validando descuento:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
}

// Función para aplicar descuento
export async function applyDiscount(discountId: number, invoiceId: number, amount: number): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Registrar aplicación del descuento
    const { error: applicationError } = await supabase
      .from('sales_discount_applications')
      .insert({
        discount_id: discountId,
        invoice_id: invoiceId,
        amount: amount,
        applied_at: new Date().toISOString()
      });

    if (applicationError) {
      console.error('Error aplicando descuento:', applicationError);
      return { success: false, error: 'Error al aplicar descuento.' };
    }

    // Incrementar contador de uso
    const { error: updateError } = await supabase
      .from('sales_discounts')
      .update({ current_usage: supabase.rpc('increment', { value: 1 }) })
      .eq('id', discountId);

    if (updateError) {
      console.error('Error actualizando uso del descuento:', updateError);
      return { success: false, error: 'Error al actualizar uso del descuento.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error aplicando descuento:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
}

// Función para calcular descuento
export async function calculateDiscount(discount: Discount, subtotal: number): Promise<number> {
  let discountAmount = 0;

  switch (discount.type) {
    case 'percentage':
      discountAmount = subtotal * (discount.value / 100);
      break;
    case 'fixed':
      discountAmount = discount.value;
      break;
    case 'buy_x_get_y':
      // Implementar lógica específica para compra X obtén Y
      discountAmount = 0;
      break;
  }

  // Aplicar descuento máximo si está configurado
  if (discount.maxDiscount && discountAmount > discount.maxDiscount) {
    discountAmount = discount.maxDiscount;
  }

  return Math.min(discountAmount, subtotal);
}

// Función para obtener descuentos activos
export async function getActiveDiscounts(): Promise<{ success: boolean; data?: Discount[]; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient();
    
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('sales_discounts')
      .select('*')
      .eq('is_active', true)
      .gte('valid_from', now)
      .lte('valid_to', now)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error obteniendo descuentos activos:', error);
      return { success: false, error: 'Error al obtener descuentos activos.' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error obteniendo descuentos activos:', error);
    return { success: false, error: 'Error interno del servidor.' };
  }
} 