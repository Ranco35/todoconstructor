'use server'

import { getSupabaseServerClient } from '@/lib/supabase-server'
import { getCurrentUser } from '@/actions/configuration/auth-actions'
import { revalidatePath } from 'next/cache'

// Interfaces
interface PurchaseInvoice {
  id: number
  number: string
  supplier_invoice_number?: string // Número oficial de la factura del proveedor
  supplier_id: number | null
  issue_date: string
  due_date: string | null
  subtotal: number
  tax_amount: number
  total: number
  status: string
  pdf_file_path: string | null
  pdf_file_name: string | null
  pdf_file_size: number | null
  extracted_data: any
  extraction_confidence: number | null
  manual_review_required: boolean
  notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
  approved_by: string | null
  approved_at: string | null
  // Líneas de la factura
  purchase_invoice_lines?: PurchaseInvoiceLine[]
  lines?: PurchaseInvoiceLine[]
}

interface CreateInvoiceData {
  number: string
  supplier_invoice_number?: string // Número de la factura del proveedor
  supplier_id: number | null
  warehouse_id?: number | null
  issue_date: string
  due_date?: string
  subtotal: number
  tax_amount: number
  total: number
  status?: string
  notes?: string
}

interface UpdateInvoiceData extends Partial<CreateInvoiceData> {
  id: number
}

interface PurchaseInvoiceLine {
  purchase_invoice_id: number
  product_id?: number | null
  description: string
  product_code?: string | null
  quantity: number
  unit_price: number
  discount_percent: number
  discount_amount: number
  tax_rate: number
  tax_amount: number
  line_total: number
  line_order: number
}

// Tipos para respuestas
interface ActionResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Validar si una factura necesita bodega basándose en sus productos
 */
async function validateInvoiceWarehouseRequirement(invoiceId: number): Promise<{
  needsWarehouse: boolean;
  hasPhysicalProducts: boolean;
  hasServices: boolean;
  productTypes: string[];
}> {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Obtener líneas de la factura con información de productos
    const { data: lines, error: linesError } = await supabase
      .from('purchase_invoice_lines')
      .select(`
        product_id,
        description,
        Product:Product(
          id,
          name,
          type
        )
      `)
      .eq('purchase_invoice_id', invoiceId);
    
    if (linesError || !lines) {
      console.error('❌ Error obteniendo líneas de factura:', linesError);
      return {
        needsWarehouse: true, // Por defecto, requerir bodega si hay error
        hasPhysicalProducts: true,
        hasServices: false,
        productTypes: []
      };
    }
    
    const productTypes: string[] = [];
    let hasPhysicalProducts = false;
    let hasServices = false;
    
    for (const line of lines) {
      // Si no tiene producto_id, verificar por descripción
      if (!line.product_id) {
        const description = (line.description || '').toLowerCase();
        
        // Palabras clave que indican servicios
        const serviceKeywords = [
          'servicio', 'service', 'mantenimiento', 'maintenance', 
          'reparacion', 'reparación', 'consultoria', 'consultoría',
          'asesoría', 'asesoria', 'instalacion', 'instalación',
          'limpieza', 'cleaning', 'control', 'fumigacion', 'fumigación',
          'desinfeccion', 'desinfección', 'sanitizacion', 'sanitización',
          'plaga', 'plagas', 'pest', 'professional', 'profesional'
        ];
        
        // Verificar si la descripción contiene palabras clave de servicios
        const isService = serviceKeywords.some(keyword => description.includes(keyword));
        
        console.log(`🔍 Analizando descripción: "${line.description}" → ${isService ? 'SERVICIO' : 'FÍSICO'}`);
        
        if (isService) {
          hasServices = true;
          productTypes.push('SERVICIO_BY_DESCRIPTION');
        } else {
          hasPhysicalProducts = true;
          productTypes.push('UNKNOWN');
        }
        continue;
      }
      
      // Si tiene producto, verificar su tipo
      const product = line.Product;
      if (!product) {
        hasPhysicalProducts = true; // Si no se puede determinar, asumir físico
        productTypes.push('UNKNOWN');
        continue;
      }
      
      productTypes.push(product.type);
      
      if (product.type === 'SERVICIO') {
        hasServices = true;
      } else {
        hasPhysicalProducts = true;
      }
    }
    
    // Necesita bodega si tiene productos físicos
    const needsWarehouse = hasPhysicalProducts;
    
    return {
      needsWarehouse,
      hasPhysicalProducts,
      hasServices,
      productTypes: [...new Set(productTypes)] // Eliminar duplicados
    };
    
  } catch (error) {
    console.error('❌ Error en validateInvoiceWarehouseRequirement:', error);
    return {
      needsWarehouse: true, // Por defecto, requerir bodega si hay error
      hasPhysicalProducts: true,
      hasServices: false,
      productTypes: []
    };
  }
}

/**
 * Obtener información detallada de factura con validación de bodega
 */
export async function getPurchaseInvoiceDetails(invoiceId: number): Promise<ActionResponse<{
  invoice: PurchaseInvoice;
  warehouseValidation: {
    needsWarehouse: boolean;
    hasPhysicalProducts: boolean;
    hasServices: boolean;
    productTypes: string[];
  };
  canBeApproved: boolean;
  approvalRequirements: string[];
}>> {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Obtener factura con líneas, productos, proveedor y bodega
    const { data: invoice, error: invoiceError } = await supabase
      .from('purchase_invoices')
      .select(`
        *,
        lines:purchase_invoice_lines(
          id,
          product_id,
          description,
          quantity,
          unit_price,
          Product:Product(
            id,
            name,
            type,
            sku
          )
        ),
        Supplier:Supplier(
          id,
          name,
          vat,
          email,
          phone,
          address
        ),
        Warehouse:Warehouse(
          id,
          name,
          location
        )
      `)
      .eq('id', invoiceId)
      .single()
    
    if (invoiceError || !invoice) {
      return { success: false, error: 'Factura no encontrada' };
    }
    
    // Validar requisitos de bodega
    const warehouseValidation = await validateInvoiceWarehouseRequirement(invoiceId);
    
    // Verificar si puede ser aprobada
    const approvalRequirements: string[] = [];
    let canBeApproved = true;
    
    if (invoice.status === 'approved') {
      approvalRequirements.push('La factura ya está aprobada');
      canBeApproved = false;
    }
    
    if (warehouseValidation.needsWarehouse && !invoice.warehouse_id) {
      approvalRequirements.push('Se requiere asignar una bodega para productos físicos');
      canBeApproved = false;
    }
    
    return {
      success: true,
      data: {
        invoice,
        warehouseValidation,
        canBeApproved,
        approvalRequirements
      }
    };
    
  } catch (error) {
    console.error('❌ Error en getPurchaseInvoiceDetails:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error obteniendo detalles de factura'
    };
  }
}

/**
 * Obtener lista de facturas de compra con filtros y paginación
 */
export async function getPurchaseInvoices(params: {
  page?: number
  limit?: number
  status?: string
  supplier_id?: number
  search?: string
  date_from?: string
  date_to?: string
}): Promise<ActionResponse<{ invoices: PurchaseInvoice[], total: number }>> {
  try {
    console.log('📋 Obteniendo facturas de compra con filtros:', params)
    
    const supabase = await getSupabaseServerClient()
    const { page = 1, limit = 20, status, supplier_id, search, date_from, date_to } = params
    
    // Construir query base
    let query = supabase
      .from('purchase_invoices')
      .select(`
        *,
        Supplier (
          id,
          name,
          vat,
          email
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
    
    // Aplicar filtros
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }
    
    if (supplier_id) {
      query = query.eq('supplier_id', supplier_id)
    }
    
    if (search) {
      query = query.or(`number.ilike.%${search}%,notes.ilike.%${search}%`)
    }
    
    if (date_from) {
      query = query.gte('invoice_date', date_from)
    }
    
    if (date_to) {
      query = query.lte('invoice_date', date_to)
    }
    
    // Aplicar paginación
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    const { data, error, count } = await query.range(from, to)
    
    if (error) {
      console.error('❌ Error obteniendo facturas:', error)
      throw new Error('Error obteniendo facturas: ' + error.message)
    }
    
    console.log(`✅ ${data?.length || 0} facturas obtenidas de ${count || 0} totales`)
    
    return {
      success: true,
      data: {
        invoices: data || [],
        total: count || 0
      }
    }
    
  } catch (error) {
    console.error('❌ Error en getPurchaseInvoices:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error obteniendo facturas'
    }
  }
}

/**
 * Obtener factura de compra por ID
 */
export async function getPurchaseInvoiceById(id: number): Promise<ActionResponse<PurchaseInvoice>> {
  try {
    console.log('🔍 Obteniendo factura ID:', id)
    
    const supabase = await getSupabaseServerClient()
    
    const { data, error } = await supabase
      .from('purchase_invoices')
      .select(`
        *,
        Supplier (
          id,
          name,
          vat,
          email,
          phone,
          address
        ),
        Warehouse (
          id,
          name,
          location
        ),
        purchase_invoice_lines (
          id,
          product_id,
          description,
          product_code,
          quantity,
          unit_price,
          discount_percent,
          discount_amount,
          tax_rate,
          tax_amount,
          line_total,
          line_order,
          Product (
            id,
            name,
            sku
          )
        ),
        purchase_invoice_payments (
          id,
          payment_date,
          amount,
          payment_method,
          reference,
          notes
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('❌ Error obteniendo factura:', error)
      throw new Error('Factura no encontrada')
    }
    
    console.log('✅ Factura obtenida:', data.number)
    
    return {
      success: true,
      data
    }
    
  } catch (error) {
    console.error('❌ Error en getPurchaseInvoiceById:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error obteniendo factura'
    }
  }
}

/**
 * Crear nueva factura de compra
 */
export async function createPurchaseInvoice(data: CreateInvoiceData): Promise<ActionResponse<PurchaseInvoice>> {
  try {
    console.log('📝 Creando nueva factura:', data.number)
    console.log('📝 Datos de factura recibidos:', {
      number: data.number,
      supplier_invoice_number: data.supplier_invoice_number,
      supplier_id: data.supplier_id,
      warehouse_id: data.warehouse_id, // ✅ LOG AGREGADO
      issue_date: data.issue_date,
      due_date: data.due_date,
      subtotal: data.subtotal,
      tax_amount: data.tax_amount,
      total: data.total,
      status: data.status,
      notes: data.notes
    })
    
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('Usuario no autenticado')
    }
    
    const supabase = await getSupabaseServerClient()
    
    // Verificar que no existe otra factura con el mismo número oficial del proveedor
    if (data.supplier_id && data.supplier_invoice_number) {
      const { data: existing } = await supabase
        .from('purchase_invoices')
        .select('id')
        .eq('supplier_id', data.supplier_id)
        .eq('supplier_invoice_number', data.supplier_invoice_number)
        .single()
      
      if (existing) {
        throw new Error('Ya existe una factura con este número oficial para este proveedor')
      }
    }
    
    const invoiceData = {
      ...data,
      status: data.status || 'draft',
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    console.log('📝 invoiceData a insertar:', invoiceData)
    
    const { data: invoice, error } = await supabase
      .from('purchase_invoices')
      .insert(invoiceData)
      .select('*')
      .single()
    
    if (error) {
      console.error('❌ Error creando factura:', error)
      throw new Error('Error creando factura: ' + error.message)
    }
    
    console.log('✅ Factura creada exitosamente:', {
      id: invoice.id,
      number: invoice.number,
      warehouse_id: invoice.warehouse_id, // ✅ LOG AGREGADO
      supplier_id: invoice.supplier_id,
      status: invoice.status
    })
    
    revalidatePath('/dashboard/purchases/invoices')
    
    return {
      success: true,
      data: invoice
    }
    
  } catch (error) {
    console.error('❌ Error en createPurchaseInvoice:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error creando factura'
    }
  }
}

/**
 * Crear líneas de productos para una factura de compra
 */
export async function createPurchaseInvoiceLines(invoiceId: number, lines: any[]): Promise<ActionResponse> {
  try {
    console.log('📝 Creando líneas de factura para invoice ID:', invoiceId)
    
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('Usuario no autenticado')
    }
    
    const supabase = await getSupabaseServerClient()
    
    // Mapear las líneas del formulario al formato de la base de datos
    const invoiceLines: PurchaseInvoiceLine[] = lines.map((line, index) => ({
      purchase_invoice_id: invoiceId,
      product_id: line.productId || null,
      description: line.productName || line.description || '',
      product_code: null, // Se puede mapear desde el producto si es necesario
      quantity: line.quantity || 0,
      unit_price: line.unitPriceNet || 0,
      discount_percent: line.discountPercent || 0,
      discount_amount: ((line.quantity || 0) * (line.unitPriceNet || 0) * (line.discountPercent || 0)) / 100,
      tax_rate: line.ivaPercent || 0,
      tax_amount: line.ivaAmount || 0,
      line_total: line.totalLine || 0,
      line_order: index + 1
    }));
    
    const { data, error } = await supabase
      .from('purchase_invoice_lines')
      .insert(invoiceLines)
      .select('*')
    
    if (error) {
      console.error('❌ Error creando líneas de factura:', error)
      throw new Error('Error creando líneas de factura: ' + error.message)
    }
    
    console.log('✅ Líneas de factura creadas exitosamente:', data?.length)
    
    return {
      success: true,
      data
    }
    
  } catch (error) {
    console.error('❌ Error en createPurchaseInvoiceLines:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error creando líneas de factura'
    }
  }
}

/**
 * Actualizar factura de compra
 */
export async function updatePurchaseInvoice(data: UpdateInvoiceData): Promise<ActionResponse<PurchaseInvoice>> {
  try {
    console.log('📝 Actualizando factura ID:', data.id)
    console.log('📝 Datos a actualizar:', data)
    
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('Usuario no autenticado')
    }
    
    const supabase = await getSupabaseServerClient()
    
    // Verificar que la factura existe
    const { data: existing } = await supabase
      .from('purchase_invoices')
      .select('id, status')
      .eq('id', data.id)
      .single()
    
    if (!existing) {
      throw new Error('Factura no encontrada')
    }
    
    const { id, ...updateData } = data
    const invoiceData = {
      ...updateData,
      updated_at: new Date().toISOString()
    }
    
    const { data: invoice, error } = await supabase
      .from('purchase_invoices')
      .update(invoiceData)
      .eq('id', id)
      .select('*')
      .single()
    
    if (error) {
      console.error('❌ Error actualizando factura:', error)
      throw new Error('Error actualizando factura: ' + error.message)
    }
    
    console.log('✅ Factura actualizada exitosamente')
    console.log('✅ Datos actualizados:', invoice)
    
    revalidatePath('/dashboard/purchases')
    revalidatePath('/dashboard/purchases/invoices')
    revalidatePath(`/dashboard/purchases/invoices/${id}`)
    revalidatePath(`/dashboard/purchases/invoices/${id}/edit`)
    
    return {
      success: true,
      data: invoice
    }
    
  } catch (error) {
    console.error('❌ Error en updatePurchaseInvoice:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error actualizando factura'
    }
  }
}

/**
 * Eliminar factura de compra
 */
export async function deletePurchaseInvoice(id: number): Promise<ActionResponse> {
  try {
    console.log('🗑️ Eliminando factura ID:', id)
    
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('Usuario no autenticado')
    }
    
    const supabase = await getSupabaseServerClient()
    
    // Verificar que la factura existe y se puede eliminar
    const { data: invoice } = await supabase
      .from('purchase_invoices')
              .select('id, status, number')
      .eq('id', id)
      .single()
    
    if (!invoice) {
      throw new Error('Factura no encontrada')
    }
    
    if (invoice.status === 'paid') {
      throw new Error('No se puede eliminar una factura pagada')
    }
    
    // Eliminar la factura (las líneas y logs se eliminan por CASCADE)
    const { error } = await supabase
      .from('purchase_invoices')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('❌ Error eliminando factura:', error)
      throw new Error('Error eliminando factura: ' + error.message)
    }
    
    console.log('✅ Factura eliminada exitosamente:', invoice.number)
    
    revalidatePath('/dashboard/purchases')
    
    return {
      success: true
    }
    
  } catch (error) {
    console.error('❌ Error en deletePurchaseInvoice:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error eliminando factura'
    }
  }
}

/**
 * Cambiar estado de factura
 */
export async function updateInvoiceStatus(
  id: number, 
  status: 'draft' | 'approved' | 'paid' | 'disputed' | 'cancelled'
): Promise<ActionResponse> {
  try {
    console.log(`📋 Cambiando estado de factura ${id} a:`, status)
    
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('Usuario no autenticado')
    }
    
    const supabase = await getSupabaseServerClient()
    
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }
    
    // Si se aprueba, registrar quién y cuándo
    if (status === 'approved') {
      updateData.approved_by = currentUser.id
      updateData.approved_at = new Date().toISOString()
      updateData.manual_review_required = false
    }
    
    // Si se paga, actualizar estado
    if (status === 'paid') {
      // El estado ya se actualiza arriba
    }
    
    const { error } = await supabase
      .from('purchase_invoices')
      .update(updateData)
      .eq('id', id)
    
    if (error) {
      console.error('❌ Error actualizando estado:', error)
      throw new Error('Error actualizando estado: ' + error.message)
    }
    
    console.log('✅ Estado actualizado exitosamente')
    
    revalidatePath('/dashboard/purchases')
    revalidatePath(`/dashboard/purchases/${id}`)
    
    return {
      success: true
    }
    
  } catch (error) {
    console.error('❌ Error en updateInvoiceStatus:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error actualizando estado'
    }
  }
}

/**
 * Obtener estadísticas de facturas
 */
export async function getPurchaseInvoiceStats(): Promise<ActionResponse<{
  total: number
  draft: number
  approved: number
  paid: number
  totalAmount: number
  pendingAmount: number
  averageProcessingTime: number
}>> {
  try {
    console.log('📊 Obteniendo estadísticas de facturas de compra')
    
    const supabase = await getSupabaseServerClient()
    
    // Query para obtener estadísticas básicas
    const { data: stats } = await supabase
      .from('purchase_invoices')
      .select('status, total_amount, created_at, approved_at')
    
    // Si no hay datos, devolver estadísticas vacías
    if (!stats || stats.length === 0) {
      return {
        success: true,
        data: {
          total: 0,
          draft: 0,
          approved: 0,
          paid: 0,
          totalAmount: 0,
          pendingAmount: 0,
          averageProcessingTime: 0
        }
      }
    }
    
    // Calcular estadísticas
    const total = stats.length
    const draft = stats.filter(i => i.status === 'draft').length
    const approved = stats.filter(i => i.status === 'approved').length
    const paid = stats.filter(i => i.status === 'paid').length
    
    const totalAmount = stats.reduce((sum, i) => sum + (i.total_amount || 0), 0)
    const pendingAmount = stats
      .filter(i => i.status !== 'paid' && i.status !== 'cancelled')
      .reduce((sum, i) => sum + (i.total_amount || 0), 0)
    
    // Calcular tiempo promedio de procesamiento (draft -> approved)
    const processedInvoices = stats.filter(i => i.approved_at && i.created_at)
    const averageProcessingTime = processedInvoices.length > 0
      ? processedInvoices.reduce((sum, i) => {
          const created = new Date(i.created_at).getTime()
          const approved = new Date(i.approved_at!).getTime()
          return sum + (approved - created)
        }, 0) / processedInvoices.length / (1000 * 60 * 60 * 24) // Convertir a días
      : 0
    
    const result = {
      total,
      draft,
      approved,
      paid,
      totalAmount,
      pendingAmount,
      averageProcessingTime: Math.round(averageProcessingTime * 10) / 10
    }
    
    console.log('✅ Estadísticas calculadas:', result)
    
    return {
      success: true,
      data: result
    }
    
  } catch (error) {
    console.error('❌ Error en getPurchaseInvoiceStats:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error obteniendo estadísticas'
    }
  }
}

/**
 * Obtener facturas que requieren revisión manual
 */
export async function getInvoicesRequiringReview(): Promise<ActionResponse<PurchaseInvoice[]>> {
  try {
    console.log('🔍 Obteniendo facturas que requieren revisión manual')
    
    const supabase = await getSupabaseServerClient()
    
    const { data, error } = await supabase
      .from('purchase_invoices')
      .select(`
        *,
        Supplier (
          id,
          name,
          vat
        )
      `)
      .eq('manual_review_required', true)
      .eq('status', 'draft')
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('❌ Error obteniendo facturas para revisión:', error)
      throw new Error('Error obteniendo facturas para revisión')
    }
    
    console.log(`✅ ${data?.length || 0} facturas requieren revisión`)
    
    return {
      success: true,
      data: data || []
    }
    
  } catch (error) {
    console.error('❌ Error en getInvoicesRequiringReview:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error obteniendo facturas para revisión'
    }
  }
}

/**
 * Buscar facturas por texto
 */
export async function searchPurchaseInvoices(query: string): Promise<ActionResponse<PurchaseInvoice[]>> {
  try {
    console.log('🔍 Buscando facturas con query:', query)
    
    if (!query || query.trim().length < 2) {
      return {
        success: true,
        data: []
      }
    }
    
    const supabase = await getSupabaseServerClient()
    
    const { data, error } = await supabase
      .from('purchase_invoices')
      .select(`
        *,
        Supplier (
          id,
          name,
          vat
        )
      `)
      .or(`
        number.ilike.%${query}%,
        notes.ilike.%${query}%,
        Supplier.name.ilike.%${query}%,
        Supplier.vat.ilike.%${query}%
      `)
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (error) {
      console.error('❌ Error buscando facturas:', error)
      throw new Error('Error en búsqueda')
    }
    
    console.log(`✅ ${data?.length || 0} facturas encontradas`)
    
    return {
      success: true,
      data: data || []
    }
    
  } catch (error) {
    console.error('❌ Error en searchPurchaseInvoices:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error en búsqueda'
    }
  }
} 

/**
 * Crear movimientos de inventario para una factura de compra aprobada
 */
async function createInventoryMovementsForInvoice(invoiceId: number, warehouseId: number, userId: string) {
  try {
    console.log('📦 Creando movimientos de inventario para factura:', invoiceId);
    
    const supabase = await getSupabaseServerClient();
    
    // Obtener líneas de la factura con información de productos
    const { data: lines, error: linesError } = await supabase
      .from('purchase_invoice_lines')
      .select(`
        id,
        product_id,
        description,
        quantity,
        unit_price,
        Product:Product(
          id,
          name,
          type,
          sku
        )
      `)
      .eq('purchase_invoice_id', invoiceId);
    
    if (linesError) {
      console.error('❌ Error obteniendo líneas de factura:', linesError);
      return;
    }
    
    if (!lines || lines.length === 0) {
      console.log('ℹ️ No hay líneas de factura para procesar');
      return;
    }
    
    // 🆕 Filtrar solo productos físicos (no servicios)
    const physicalProductLines = lines.filter(line => {
      // Si no tiene producto_id, asumir que es físico
      if (!line.product_id) return true;
      
      // Si tiene producto, verificar su tipo
      const product = line.Product;
      if (!product) return true; // Si no se puede determinar, asumir físico
      
      // Solo procesar productos que NO son servicios
      return product.type !== 'SERVICIO';
    });
    
    console.log(`📊 Procesando ${physicalProductLines.length} productos físicos de ${lines.length} líneas totales`);
    
    // Crear movimientos solo para productos físicos
    for (const line of physicalProductLines) {
      if (!line.product_id) {
        console.log('⚠️ Línea sin producto_id, saltando:', line.description);
        continue;
      }
      
      const product = line.Product;
      if (!product) {
        console.log('⚠️ Producto no encontrado, saltando:', line.product_id);
        continue;
      }
      
      // Verificar que sea un producto físico
      if (product.type === 'SERVICIO') {
        console.log('ℹ️ Saltando servicio:', product.name);
        continue;
      }
      
      console.log(`📦 Procesando producto físico: ${product.name} (${line.quantity} unidades)`);
      
      // Crear movimiento de inventario
      const { data: movement, error: movementError } = await supabase
        .from('InventoryMovement')
        .insert({
          productId: line.product_id,
          fromWarehouseId: null, // Entrada desde proveedor
          toWarehouseId: warehouseId,
          movementType: 'ENTRADA',
          quantity: line.quantity,
          reason: 'Compra a proveedor',
          notes: `Factura de compra #${invoiceId} - ${line.description}`,
          userId: userId
        })
        .select()
        .single();
      
      if (movementError) {
        console.error('❌ Error creando movimiento de inventario:', movementError);
        continue;
      }
      
      console.log('✅ Movimiento creado:', movement.id);
      
      // Actualizar stock en la bodega usando la función existente
      const { error: stockError } = await supabase.rpc('update_warehouse_product_stock', {
        p_product_id: line.product_id,
        p_warehouse_id: warehouseId,
        p_quantity_change: line.quantity
      });
      
      if (stockError) {
        console.error('❌ Error actualizando stock:', stockError);
      } else {
        console.log(`✅ Stock actualizado: +${line.quantity} unidades del producto ${line.product_id} en bodega ${warehouseId}`);
      }
    }
    
    console.log('✅ Movimientos de inventario creados exitosamente');
    
  } catch (error) {
    console.error('❌ Error en createInventoryMovementsForInvoice:', error);
  }
}

/**
 * Aprobar factura de compra y crear movimientos de inventario
 */
export async function approvePurchaseInvoice(invoiceId: number): Promise<ActionResponse> {
  try {
    console.log('✅ Aprobando factura de compra:', invoiceId);
    
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('Usuario no autenticado')
    }
    
    const supabase = await getSupabaseServerClient()
    
    // Obtener la factura con sus datos completos para validaciones
    const { data: invoice, error: invoiceError } = await supabase
      .from('purchase_invoices')
      .select(`
        id, 
        warehouse_id, 
        status, 
        supplier_id, 
        supplier_invoice_number,
        subtotal,
        tax_amount,
        total_amount,
        Supplier:Supplier(id, name)
      `)
      .eq('id', invoiceId)
      .single()
    
    if (invoiceError || !invoice) {
      throw new Error('Factura no encontrada')
    }
    
    if (invoice.status === 'approved') {
      throw new Error('La factura ya está aprobada')
    }
    
    // 🆕 VALIDACIONES PREVIAS A LA APROBACIÓN
    console.log('🔍 Ejecutando validaciones previas a la aprobación...');
    
    // 1. Validar que el número de factura del proveedor exista
    if (!invoice.supplier_invoice_number || invoice.supplier_invoice_number.trim() === '') {
      throw new Error('La factura debe tener un número de factura del proveedor válido')
    }
    
    // 2. Validar que no exista duplicado del mismo proveedor
    if (invoice.supplier_id) {
      const { data: duplicateInvoice } = await supabase
        .from('purchase_invoices')
        .select('id, number')
        .eq('supplier_id', invoice.supplier_id)
        .eq('supplier_invoice_number', invoice.supplier_invoice_number.trim())
        .neq('id', invoiceId)
        .single()
      
      if (duplicateInvoice) {
        throw new Error(`Ya existe una factura del proveedor "${invoice.Supplier?.name}" con el número "${invoice.supplier_invoice_number}". Factura interna: ${duplicateInvoice.number}`)
      }
    }
    
    // 3. Validar que el IVA sea correcto matemáticamente (19% del subtotal)
    const subtotal = invoice.subtotal || 0;
    const taxAmount = invoice.tax_amount || 0;
    const total = invoice.total_amount || 0;
    
    // Calcular IVA esperado (19% del subtotal, redondeado sin decimales)
    const expectedTax = Math.round(subtotal * 0.19);
    const taxDifference = Math.abs(taxAmount - expectedTax);
    
    // Validar que el IVA no tenga decimales
    if (taxAmount % 1 !== 0) {
      throw new Error(`El IVA debe ser un número entero sin decimales. Actual: $${taxAmount.toLocaleString('es-CL')}`)
    }
    
    // Validar IVA con tolerancia de ±1 peso
    if (taxDifference > 1) {
      throw new Error(`El IVA no es correcto. Esperado: $${expectedTax.toLocaleString('es-CL')} (±$1), Actual: $${taxAmount.toLocaleString('es-CL')}. Diferencia: $${taxDifference}`)
    }
    
    // 4. Validar que el total sea correcto (subtotal + IVA)
    const expectedTotal = subtotal + taxAmount;
    const totalDifference = Math.abs(total - expectedTotal);
    if (totalDifference > 1) {
      throw new Error(`El total no es correcto. Esperado: $${expectedTotal.toLocaleString('es-CL')} (Subtotal + IVA), Actual: $${total.toLocaleString('es-CL')}`)
    }
    
    console.log('✅ Todas las validaciones pasaron correctamente:', {
      numeroFactura: invoice.supplier_invoice_number,
      proveedor: invoice.Supplier?.name,
      subtotal: `$${subtotal.toLocaleString('es-CL')}`,
      ivaCalculado: `$${expectedTax.toLocaleString('es-CL')}`,
      ivaActual: `$${taxAmount.toLocaleString('es-CL')}`,
      total: `$${total.toLocaleString('es-CL')}`
    });
    
    // 🆕 Validar si necesita bodega usando la función helper
    const warehouseValidation = await validateInvoiceWarehouseRequirement(invoiceId);
    
    console.log('📊 Validación de bodega:', {
      needsWarehouse: warehouseValidation.needsWarehouse,
      hasPhysicalProducts: warehouseValidation.hasPhysicalProducts,
      hasServices: warehouseValidation.hasServices,
      productTypes: warehouseValidation.productTypes
    });
    
    // Solo requerir bodega si hay productos físicos
    if (warehouseValidation.needsWarehouse && !invoice.warehouse_id) {
      throw new Error('La factura debe tener una bodega asignada para productos físicos')
    }
    
    // Actualizar estado de la factura
    const { error: updateError } = await supabase
      .from('purchase_invoices')
      .update({
        status: 'approved',
        approved_by: currentUser.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)
    
    if (updateError) {
      throw new Error('Error actualizando factura: ' + updateError.message)
    }
    
    // 🆕 Crear movimientos de inventario SOLO si hay productos físicos y bodega
    if (warehouseValidation.hasPhysicalProducts && invoice.warehouse_id) {
      await createInventoryMovementsForInvoice(invoiceId, invoice.warehouse_id, currentUser.id);
    } else {
      console.log('ℹ️ Factura aprobada sin movimientos de inventario (servicios o sin bodega)');
    }
    
    revalidatePath('/dashboard/purchases/invoices')
    revalidatePath(`/dashboard/purchases/invoices/${invoiceId}`)
    revalidatePath('/dashboard/inventory/movements')
    revalidatePath('/dashboard/configuration/inventory/warehouses')
    
    // 🆕 Mensaje personalizado según el tipo de factura
    let message = `✅ Factura ${invoice.supplier_invoice_number} aprobada exitosamente`;
    
    // Agregar información sobre validaciones
    message += ` - Validaciones: ✓ Número único ✓ IVA correcto (${((taxAmount/subtotal)*100).toFixed(1)}%)`;
    
    if (warehouseValidation.hasPhysicalProducts && warehouseValidation.hasServices) {
      message += ' ✓ Productos físicos y servicios';
    } else if (warehouseValidation.hasPhysicalProducts) {
      message += ' ✓ Productos agregados al inventario';
    } else if (warehouseValidation.hasServices) {
      message += ' ✓ Solo servicios';
    }
    
    return {
      success: true,
      message
    }
    
  } catch (error) {
    console.error('❌ Error en approvePurchaseInvoice:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error aprobando factura'
    }
  }
} 