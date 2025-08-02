'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { 
  assignProductToWarehouse, 
  assignProductToMultipleWarehouses,
  bulkAssignProductsToWarehouse,
  updateProductStockInWarehouse,
  removeProductFromWarehouse
} from './warehouse-actions';

// --- ASIGNAR PRODUCTO A BODEGA (PARA FORMULARIOS) ---
export async function assignProductToWarehouseAction(formData: FormData) {
  const productId = formData.get('productId') as string;
  const warehouseId = formData.get('warehouseId') as string;
  const quantity = formData.get('quantity') as string;
  const minStock = formData.get('minStock') as string;
  const maxStock = formData.get('maxStock') as string;

  const parsedProductId = parseInt(productId);
  const parsedWarehouseId = parseInt(warehouseId);
  const parsedQuantity = quantity ? parseInt(quantity) : 0;
  const parsedMinStock = minStock ? parseInt(minStock) : 0;
  const parsedMaxStock = maxStock ? parseInt(maxStock) : 100;

  if (isNaN(parsedProductId) || isNaN(parsedWarehouseId)) {
    throw new Error('IDs no válidos.');
  }

  try {
    const result = await assignProductToWarehouse(parsedProductId, parsedWarehouseId, {
      quantity: parsedQuantity,
      minStock: parsedMinStock,
      maxStock: parsedMaxStock
    });

    revalidatePath('/dashboard/configuration/inventory/warehouses');
    revalidatePath('/dashboard/configuration/products');
    
    return { success: true, message: result.message };
  } catch (error: any) {
    console.error('Error al asignar producto a bodega:', error);
    return { success: false, error: error.message };
  }
}

// --- ASIGNAR PRODUCTO A MÚLTIPLES BODEGAS (PARA FORMULARIOS) ---
export async function assignProductToMultipleWarehousesAction(formData: FormData) {
  const productId = formData.get('productId') as string;
  const warehouseIds = formData.getAll('warehouseIds') as string[];
  const quantities = formData.getAll('quantities') as string[];
  const minStocks = formData.getAll('minStocks') as string[];
  const maxStocks = formData.getAll('maxStocks') as string[];

  const parsedProductId = parseInt(productId);
  
  if (isNaN(parsedProductId)) {
    throw new Error('ID de producto no válido.');
  }

  if (warehouseIds.length === 0) {
    throw new Error('Debe seleccionar al menos una bodega.');
  }

  try {
    const assignments = warehouseIds.map((warehouseId, index) => ({
      warehouseId: parseInt(warehouseId),
      quantity: quantities[index] ? parseInt(quantities[index]) : 0,
      minStock: minStocks[index] ? parseInt(minStocks[index]) : 0,
      maxStock: maxStocks[index] ? parseInt(maxStocks[index]) : 100
    }));

    const result = await assignProductToMultipleWarehouses(parsedProductId, assignments);

    revalidatePath('/dashboard/configuration/inventory/warehouses');
    revalidatePath('/dashboard/configuration/products');
    
    return { 
      success: true, 
      message: `Asignación completada. ${result.summary.success} exitosas, ${result.summary.errors} errores.`,
      result 
    };
  } catch (error: any) {
    console.error('Error en asignación múltiple:', error);
    return { success: false, error: error.message };
  }
}

// --- ASIGNACIÓN MASIVA DE PRODUCTOS A BODEGA (PARA FORMULARIOS) ---
export async function bulkAssignProductsToWarehouseAction(formData: FormData) {
  const warehouseId = formData.get('warehouseId') as string;
  const productIds = formData.getAll('productIds') as string[];
  const quantities = formData.getAll('quantities') as string[];
  const minStocks = formData.getAll('minStocks') as string[];
  const maxStocks = formData.getAll('maxStocks') as string[];

  const parsedWarehouseId = parseInt(warehouseId);
  
  if (isNaN(parsedWarehouseId)) {
    throw new Error('ID de bodega no válido.');
  }

  if (productIds.length === 0) {
    throw new Error('Debe seleccionar al menos un producto.');
  }

  try {
    const assignments = productIds.map((productId, index) => ({
      productId: parseInt(productId),
      quantity: quantities[index] ? parseInt(quantities[index]) : 0,
      minStock: minStocks[index] ? parseInt(minStocks[index]) : 0,
      maxStock: maxStocks[index] ? parseInt(maxStocks[index]) : 100
    }));

    const result = await bulkAssignProductsToWarehouse(parsedWarehouseId, assignments);

    revalidatePath('/dashboard/configuration/inventory/warehouses');
    revalidatePath('/dashboard/configuration/products');
    
    return { 
      success: true, 
      message: `Asignación masiva completada. ${result.summary.success} exitosas, ${result.summary.errors} errores.`,
      result 
    };
  } catch (error: any) {
    console.error('Error en asignación masiva:', error);
    return { success: false, error: error.message };
  }
}

// --- ACTUALIZAR STOCK DE PRODUCTO EN BODEGA (PARA FORMULARIOS) ---
export async function updateProductStockInWarehouseAction(formData: FormData) {
  const productId = formData.get('productId') as string;
  const warehouseId = formData.get('warehouseId') as string;
  const quantity = formData.get('quantity') as string;
  const minStock = formData.get('minStock') as string;
  const maxStock = formData.get('maxStock') as string;

  const parsedProductId = parseInt(productId);
  const parsedWarehouseId = parseInt(warehouseId);
  const parsedQuantity = quantity ? parseInt(quantity) : undefined;
  const parsedMinStock = minStock ? parseInt(minStock) : undefined;
  const parsedMaxStock = maxStock ? parseInt(maxStock) : undefined;

  if (isNaN(parsedProductId) || isNaN(parsedWarehouseId)) {
    throw new Error('IDs no válidos.');
  }

  try {
    const updates: any = {};
    if (parsedQuantity !== undefined) updates.quantity = parsedQuantity;
    if (parsedMinStock !== undefined) updates.minStock = parsedMinStock;
    if (parsedMaxStock !== undefined) updates.maxStock = parsedMaxStock;

    const result = await updateProductStockInWarehouse(parsedProductId, parsedWarehouseId, updates);

    revalidatePath('/dashboard/configuration/inventory/warehouses');
    revalidatePath('/dashboard/configuration/products');
    
    return { success: true, message: result.message };
  } catch (error: any) {
    console.error('Error al actualizar stock:', error);
    return { success: false, error: error.message };
  }
}

// --- REMOVER PRODUCTO DE BODEGA (PARA FORMULARIOS) ---
export async function removeProductFromWarehouseAction(formData: FormData) {
  const productId = formData.get('productId') as string;
  const warehouseId = formData.get('warehouseId') as string;

  const parsedProductId = parseInt(productId);
  const parsedWarehouseId = parseInt(warehouseId);

  if (isNaN(parsedProductId) || isNaN(parsedWarehouseId)) {
    throw new Error('IDs no válidos.');
  }
  
  try {
    await removeProductFromWarehouse(parsedProductId, parsedWarehouseId);
    
    revalidatePath('/dashboard/configuration/inventory/warehouses');
    revalidatePath('/dashboard/configuration/products');
    
    return { success: true, message: 'Producto removido de la bodega exitosamente.' };
  } catch (error: any) {
    console.error('Error al remover producto de bodega:', error);
    return { success: false, error: error.message };
  }
}

// --- ASIGNACIÓN RÁPIDA (PARA BOTONES) ---
export async function quickAssignProductAction(formData: FormData) {
  const productId = formData.get('productId') as string;
  const warehouseId = formData.get('warehouseId') as string;

  const parsedProductId = parseInt(productId);
  const parsedWarehouseId = parseInt(warehouseId);

  if (isNaN(parsedProductId) || isNaN(parsedWarehouseId)) {
    throw new Error('IDs no válidos.');
  }

  try {
    const result = await assignProductToWarehouse(parsedProductId, parsedWarehouseId, {
      quantity: 0,
      minStock: 0,
      maxStock: 100
    });

    revalidatePath('/dashboard/configuration/inventory/warehouses');
    revalidatePath('/dashboard/configuration/products');
    
    return { success: true, message: result.message };
  } catch (error: any) {
    console.error('Error en asignación rápida:', error);
    return { success: false, error: error.message };
  }
} 