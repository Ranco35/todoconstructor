'use server';

import { getSupabaseServerClient } from '@/lib/supabase-server';
import { getCurrentUser } from '@/actions/configuration/auth-actions';
import { getAllCategories } from '@/actions/configuration/category-actions';
import { getActiveCostCenters } from '@/actions/configuration/cost-center-actions';
import * as XLSX from 'xlsx';

export interface PettyCashTransactionRow {
  // Campos básicos
  sessionId: number;
  transactionType: 'expense' | 'income' | 'purchase';
  description: string;
  amount: number;
  date: string;
  
  // Campos opcionales para gastos/compras
  categoryId?: number;
  categoryName?: string;
  costCenterId?: number;
  costCenterName?: string;
  paymentMethod?: 'cash' | 'transfer' | 'card' | 'other';
  affectsPhysicalCash?: boolean;
  
  // Campos específicos para compras
  productId?: number;
  productName?: string;
  quantity?: number;
  unitPrice?: number;
  supplierId?: number;
  supplierName?: string;
  
  // Campos bancarios
  bankReference?: string;
  bankAccount?: string;
  
  // Notas
  notes?: string;
}

export interface ImportResult {
  success: boolean;
  message: string;
  imported: number;
  errors: string[];
  details?: any[];
}

export async function generatePettyCashTemplate(): Promise<{ success: boolean; data?: Buffer; filename?: string; error?: string }> {
  try {
    // Obtener datos de referencia
    const categories = await getAllCategories();
    const costCenters = await getActiveCostCenters();
    
    // Crear workbook
    const workbook = XLSX.utils.book_new();
    
    // Hoja de instrucciones
    const instructionsData = [
      ['📋 PLANTILLA PARA IMPORTAR TRANSACCIONES HISTÓRICAS DE CAJA CHICA'],
      [''],
      ['INSTRUCCIONES:'],
      ['1. Complete los campos obligatorios marcados con *'],
      ['2. Para gastos: use transactionType = "expense"'],
      ['3. Para ingresos: use transactionType = "income"'],
      ['4. Para compras: use transactionType = "purchase"'],
      ['5. Las fechas deben estar en formato YYYY-MM-DD'],
      ['6. Los montos deben ser números positivos'],
      ['7. Los IDs de categorías y centros de costo deben existir en el sistema'],
      [''],
      ['CAMPOS OBLIGATORIOS:'],
      ['• sessionId: ID de la sesión de caja (debe existir)'],
      ['• transactionType: tipo de transacción (expense/income/purchase)'],
      ['• description: descripción de la transacción'],
      ['• amount: monto de la transacción'],
      ['• date: fecha de la transacción (YYYY-MM-DD)'],
      [''],
      ['CAMPOS OPCIONALES:'],
      ['• categoryId: ID de la categoría (ver hoja "Categorías")'],
      ['• costCenterId: ID del centro de costo (ver hoja "Centros de Costo")'],
      ['• paymentMethod: método de pago (cash/transfer/card/other)'],
      ['• affectsPhysicalCash: si afecta caja física (true/false)'],
      ['• notes: notas adicionales'],
      [''],
      ['PARA INGRESOS (transactionType = "income"):'],
      ['• NO requiere categoría ni centro de costo'],
      ['• Usar para ventas en efectivo, préstamos, reposiciones'],
      ['• Solo necesita monto, descripción y fecha'],
      [''],
      ['EJEMPLOS:'],
      ['sessionId | transactionType | description | amount | date | categoryId | costCenterId'],
      ['15 | expense | Compra de papelería | 50000 | 2025-06-20 | 1 | 2'],
      ['15 | income | Venta en efectivo | 25000 | 2025-06-20 | |'],
      ['15 | purchase | Compra de productos | 100000 | 2025-06-20 | 3 | 1'],
    ];
    
    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instrucciones');
    
    // Hoja de categorías disponibles
    const categoriesData = [
      ['ID', 'Nombre', 'Descripción'],
      ...categories.map(cat => [cat.id, cat.name, cat.description || ''])
    ];
    const categoriesSheet = XLSX.utils.aoa_to_sheet(categoriesData);
    XLSX.utils.book_append_sheet(workbook, categoriesSheet, 'Categorías');
    
    // Hoja de centros de costo disponibles
    const costCentersData = [
      ['ID', 'Nombre', 'Código'],
      ...costCenters.map(cc => [cc.id, cc.name, cc.code || ''])
    ];
    const costCentersSheet = XLSX.utils.aoa_to_sheet(costCentersData);
    XLSX.utils.book_append_sheet(workbook, costCentersSheet, 'Centros de Costo');
    
    // Hoja de plantilla para datos
    const templateData = [
      ['sessionId*', 'transactionType*', 'description*', 'amount*', 'date*', 'categoryId', 'costCenterId', 'paymentMethod', 'affectsPhysicalCash', 'notes'],
      ['15', 'expense', 'Ejemplo de gasto', '50000', '2025-06-20', '1', '2', 'cash', 'true', 'Nota de ejemplo'],
      ['15', 'income', 'Venta en efectivo', '25000', '2025-06-20', '', '', 'cash', 'true', 'Ingreso directo a caja'],
      ['15', 'purchase', 'Compra de productos', '100000', '2025-06-20', '3', '1', 'transfer', 'false', 'Compra con transferencia'],
    ];
    const templateSheet = XLSX.utils.aoa_to_sheet(templateData);
    XLSX.utils.book_append_sheet(workbook, templateSheet, 'Plantilla');
    
    // Generar buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    return {
      success: true,
      data: buffer,
      filename: `plantilla_transacciones_historicas_${new Date().toISOString().split('T')[0]}.xlsx`
    };
  } catch (error) {
    console.error('Error generating template:', error);
    return {
      success: false,
      error: 'Error al generar la plantilla'
    };
  }
}

export async function importPettyCashTransactions(file: File): Promise<ImportResult> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return {
        success: false,
        message: 'Usuario no autenticado',
        imported: 0,
        errors: ['Usuario no autenticado']
      };
    }
    
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Buscar hoja de datos (puede ser "Plantilla" o la primera hoja con datos)
    let dataSheet = workbook.Sheets['Plantilla'];
    if (!dataSheet) {
      // Buscar la primera hoja que no sea de instrucciones
      const sheetNames = workbook.SheetNames.filter(name => 
        !['Instrucciones', 'Categorías', 'Centros de Costo'].includes(name)
      );
      if (sheetNames.length > 0) {
        dataSheet = workbook.Sheets[sheetNames[0]];
      }
    }
    
    if (!dataSheet) {
      return {
        success: false,
        message: 'No se encontró hoja de datos válida',
        imported: 0,
        errors: ['No se encontró hoja de datos válida']
      };
    }
    
    const jsonData = XLSX.utils.sheet_to_json(dataSheet, { header: 1 });
    const headers = jsonData[0] as string[];
    const rows = jsonData.slice(1) as any[][];
    
    const errors: string[] = [];
    const imported: any[] = [];
    let successCount = 0;
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.every(cell => !cell)) continue; // Fila vacía
      
      try {
        const transaction = parseTransactionRow(headers, row, i + 2);
        
        if (transaction.transactionType === 'expense' || transaction.transactionType === 'income') {
          const result = await importExpense(transaction, currentUser.id);
          if (result.success) {
            successCount++;
            imported.push({ ...transaction, id: result.expenseId });
          } else {
            errors.push(`Fila ${i + 2}: ${result.error}`);
          }
        } else if (transaction.transactionType === 'purchase') {
          const result = await importPurchase(transaction, currentUser.id);
          if (result.success) {
            successCount++;
            imported.push({ ...transaction, id: result.purchaseId });
          } else {
            errors.push(`Fila ${i + 2}: ${result.error}`);
          }
        } else {
          errors.push(`Fila ${i + 2}: Tipo de transacción inválido: ${transaction.transactionType}`);
        }
      } catch (error) {
        errors.push(`Fila ${i + 2}: Error de formato - ${error}`);
      }
    }
    
    return {
      success: successCount > 0,
      message: `Importación completada. ${successCount} transacciones importadas, ${errors.length} errores.`,
      imported: successCount,
      errors,
      details: imported
    };
  } catch (error) {
    console.error('Error importing transactions:', error);
    return {
      success: false,
      message: 'Error al procesar el archivo',
      imported: 0,
      errors: ['Error al procesar el archivo: ' + error]
    };
  }
}

function parseTransactionRow(headers: string[], row: any[], rowNumber: number): PettyCashTransactionRow {
  const getValue = (header: string) => {
    const index = headers.findIndex(h => h.toLowerCase().includes(header.toLowerCase()));
    return index >= 0 ? row[index] : undefined;
  };
  
  const sessionId = parseInt(getValue('sessionId'));
  if (!sessionId) throw new Error('sessionId es obligatorio');
  
  const transactionType = getValue('transactionType');
  if (!['expense', 'income', 'purchase'].includes(transactionType)) {
    throw new Error('transactionType debe ser expense, income o purchase');
  }
  
  const description = getValue('description');
  if (!description) throw new Error('description es obligatorio');
  
  const amount = parseFloat(getValue('amount'));
  if (isNaN(amount) || amount <= 0) throw new Error('amount debe ser un número positivo');
  
  const date = getValue('date');
  if (!date) throw new Error('date es obligatorio');
  
  return {
    sessionId,
    transactionType,
    description,
    amount,
    date,
    categoryId: getValue('categoryId') ? parseInt(getValue('categoryId')) : undefined,
    costCenterId: getValue('costCenterId') ? parseInt(getValue('costCenterId')) : undefined,
    paymentMethod: getValue('paymentMethod') || 'cash',
    affectsPhysicalCash: getValue('affectsPhysicalCash') !== 'false',
    notes: getValue('notes'),
    // Campos específicos para compras
    productId: getValue('productId') ? parseInt(getValue('productId')) : undefined,
    quantity: getValue('quantity') ? parseInt(getValue('quantity')) : undefined,
    unitPrice: getValue('unitPrice') ? parseFloat(getValue('unitPrice')) : undefined,
    supplierId: getValue('supplierId') ? parseInt(getValue('supplierId')) : undefined,
    // Campos bancarios
    bankReference: getValue('bankReference'),
    bankAccount: getValue('bankAccount'),
  };
}

async function importExpense(transaction: PettyCashTransactionRow, userId: string) {
  try {
    const { data, error } = await (await getSupabaseServerClient()).from('PettyCashExpense')
      .insert({
        sessionId: transaction.sessionId,
        description: transaction.description,
        amount: transaction.amount,
        category: transaction.categoryId ? transaction.categoryId.toString() : null,
        categoryId: transaction.categoryId,
        costCenterId: transaction.costCenterId,
        paymentMethod: transaction.paymentMethod,
        transactionType: transaction.transactionType,
        affectsPhysicalCash: transaction.affectsPhysicalCash,
        bankReference: transaction.bankReference || null,
        bankAccount: transaction.bankAccount || null,
        status: 'approved',
        userId: userId,
        notes: transaction.notes || null
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return { success: true, expenseId: data.id };
  } catch (error) {
    console.error('Error importing expense:', error);
    return { success: false, error: error.message };
  }
}

async function importPurchase(transaction: PettyCashTransactionRow, userId: string) {
  try {
    const totalAmount = transaction.amount;
    const quantity = transaction.quantity || 1;
    const unitPrice = transaction.unitPrice || totalAmount;
    
    const { data, error } = await (await getSupabaseServerClient()).from('PettyCashPurchase')
      .insert({
        sessionId: transaction.sessionId,
        quantity: quantity,
        unitPrice: unitPrice,
        totalAmount: totalAmount,
        productId: transaction.productId,
        costCenterId: transaction.costCenterId,
        supplierId: transaction.supplierId,
        paymentMethod: transaction.paymentMethod,
        transactionType: 'purchase',
        affectsPhysicalCash: transaction.affectsPhysicalCash,
        bankReference: transaction.bankReference || null,
        bankAccount: transaction.bankAccount || null,
        status: 'approved',
        userId: userId,
        notes: transaction.notes || null
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return { success: true, purchaseId: data.id };
  } catch (error) {
    console.error('Error importing purchase:', error);
    return { success: false, error: error.message };
  }
}

export async function exportPettyCashTransactions(sessionId?: number) {
  try {
    let query = (await getSupabaseServerClient()).from('PettyCashExpense')
      .select(`
        *,
        User:User(name),
        Category:Category(id, name),
        CostCenter:CostCenter(id, name)
      `);
    
    if (sessionId) {
      query = query.eq('sessionId', sessionId);
    }
    
    const { data: expenses, error: expenseError } = await query;
    
    if (expenseError) throw expenseError;
    
    // También obtener compras
    let purchaseQuery = (await getSupabaseServerClient()).from('PettyCashPurchase')
      .select(`
        *,
        User:User(name),
        Product:Product(id, name),
        CostCenter:CostCenter(id, name)
      `);
    
    if (sessionId) {
      purchaseQuery = purchaseQuery.eq('sessionId', sessionId);
    }
    
    const { data: purchases, error: purchaseError } = await purchaseQuery;
    
    if (purchaseError) throw purchaseError;
    
    // Crear workbook
    const workbook = XLSX.utils.book_new();
    
    // Convertir datos a formato de exportación
    const exportData = [
      ...(expenses || []).map(exp => ({
        sessionId: exp.sessionId,
        transactionType: exp.transactionType || 'expense',
        description: exp.description,
        amount: exp.amount,
        date: exp.createdAt ? new Date(exp.createdAt).toISOString().split('T')[0] : '',
        categoryId: exp.categoryId,
        categoryName: exp.Category?.name,
        costCenterId: exp.costCenterId,
        costCenterName: exp.CostCenter?.name,
        paymentMethod: exp.paymentMethod,
        affectsPhysicalCash: exp.affectsPhysicalCash,
        status: exp.status,
        notes: exp.notes,
        createdBy: exp.User?.name
      })),
      ...(purchases || []).map(pur => ({
        sessionId: pur.sessionId,
        transactionType: 'purchase',
        description: pur.description || pur.Product?.name || 'Compra',
        amount: pur.totalAmount,
        date: pur.createdAt ? new Date(pur.createdAt).toISOString().split('T')[0] : '',
        categoryId: null,
        categoryName: null,
        costCenterId: pur.costCenterId,
        costCenterName: pur.CostCenter?.name,
        paymentMethod: pur.paymentMethod,
        affectsPhysicalCash: pur.affectsPhysicalCash,
        status: pur.status,
        notes: pur.notes,
        createdBy: pur.User?.name
      }))
    ];
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Transacciones');
    
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    return {
      success: true,
      data: buffer,
      filename: `transacciones_caja_chica_${sessionId ? `sesion_${sessionId}_` : ''}${new Date().toISOString().split('T')[0]}.xlsx`
    };
  } catch (error) {
    console.error('Error exporting transactions:', error);
    return {
      success: false,
      error: 'Error al exportar transacciones'
    };
  }
} 