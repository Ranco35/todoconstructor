'use server'

import { getSupabaseServerClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { 
  MultiplePaymentSchema, 
  NewSalePaymentSchema,
  POSSalePaymentSchema, 
  type POSSalePayment,
  PAYMENT_METHODS 
} from '@/utils/payment-utils'

// ===============================
// TYPES AND SCHEMAS
// ===============================





export interface POSSaleWithPayments {
  id: number
  sessionId: number
  saleNumber: string
  customerName?: string
  customerDocument?: string
  clientId?: number
  tableNumber?: string
  roomNumber?: string
  subtotal: number
  taxAmount: number
  discountAmount: number
  discountReason?: string
  total: number
  paidAmount: number
  pendingAmount: number
  paymentStatus: string
  notes?: string
  createdAt: string
  updatedAt: string
  payments: POSSalePayment[]
  items: Array<{
    id: number
    productId: number
    productName: string
    quantity: number
    unitPrice: number
    total: number
    notes?: string
  }>
}



// ===============================
// MAIN FUNCTIONS
// ===============================

/**
 * Crea una venta con múltiples métodos de pago
 */
export async function createPOSSaleWithMultiplePayments(
  saleData: z.infer<typeof MultiplePaymentSchema>
): Promise<{ success: boolean; data?: POSSaleWithPayments; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' }
    }
    
    // Validar datos
    const validatedData = MultiplePaymentSchema.parse(saleData)
    
    // Verificar que la sesión existe y es activa
    const { data: session, error: sessionError } = await supabase
      .from('CashSession')
      .select('*, cashRegisterTypeId')
      .eq('id', validatedData.sessionId)
      .eq('status', 'open')
      .single()
    
    if (sessionError || !session) {
      return { success: false, error: 'Sesión de caja no válida' }
    }
    
    // Generar número de venta
    const { data: saleNumber, error: numberError } = await supabase
      .rpc('generate_sale_number', { register_type_id: session.cashRegisterTypeId })
    
    if (numberError) {
      console.error('Error generating sale number:', numberError)
      return { success: false, error: 'Error generando número de venta' }
    }
    
    // Iniciar transacción
    const { data: sale, error: saleError } = await supabase
      .from('POSSale')
      .insert({
        sessionId: validatedData.sessionId,
        saleNumber,
        customerName: validatedData.customerName,
        customerDocument: validatedData.customerDocument,
        clientId: validatedData.clientId,
        tableNumber: validatedData.tableNumber,
        roomNumber: validatedData.roomNumber,
        subtotal: validatedData.subtotal,
        taxAmount: validatedData.taxAmount,
        discountAmount: validatedData.discountAmount,
        discountReason: validatedData.discountReason,
        total: validatedData.total,
        notes: validatedData.notes,
        // Los campos de pago se actualizarán automáticamente por el trigger
        paidAmount: 0,
        pendingAmount: validatedData.total,
        paymentStatus: 'no_payment'
      })
      .select()
      .single()
    
    if (saleError) {
      console.error('Error creating sale:', saleError)
      return { success: false, error: saleError.message }
    }
    
    // Crear los items de la venta
    const itemsData = validatedData.items.map(item => ({
      saleId: sale.id,
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
      notes: item.notes
    }))
    
    const { error: itemsError } = await supabase
      .from('POSSaleItem')
      .insert(itemsData)
    
    if (itemsError) {
      console.error('Error creating sale items:', itemsError)
      return { success: false, error: itemsError.message }
    }
    
    // Crear los pagos
    const paymentsData = validatedData.payments.map(payment => ({
      saleId: sale.id,
      paymentMethod: payment.paymentMethod,
      amount: payment.amount,
      receivedAmount: payment.receivedAmount,
      changeAmount: payment.changeAmount || 0,
      cardReference: payment.cardReference,
      bankReference: payment.bankReference,
      cardLast4: payment.cardLast4,
      notes: payment.notes
    }))
    
    const { data: payments, error: paymentsError } = await supabase
      .from('POSSalePayment')
      .insert(paymentsData)
      .select()
    
    if (paymentsError) {
      console.error('Error creating payments:', paymentsError)
      return { success: false, error: paymentsError.message }
    }
    
    // Obtener la venta completa con pagos actualizados
    const result = await getPOSSaleWithPayments(sale.id)
    if (!result.success) {
      return { success: false, error: 'Error obteniendo datos de la venta' }
    }
    
    // Actualizar el monto actual de la sesión (solo efectivo)
    const cashAmount = validatedData.payments
      .filter(p => p.paymentMethod === 'cash')
      .reduce((sum, p) => sum + p.amount, 0)
    
    if (cashAmount > 0) {
      const { error: updateError } = await supabase
        .from('CashSession')
        .update({
          currentAmount: (session.currentAmount || 0) + cashAmount
        })
        .eq('id', validatedData.sessionId)
      
      if (updateError) {
        console.error('Error updating session amount:', updateError)
      }
    }
    
    revalidatePath('/dashboard/pos')
    return { success: true, data: result.data }
  } catch (error) {
    console.error('Error in createPOSSaleWithMultiplePayments:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Obtiene una venta con todos sus pagos
 */
export async function getPOSSaleWithPayments(
  saleId: number
): Promise<{ success: boolean; data?: POSSaleWithPayments; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    
    // Obtener la venta
    const { data: sale, error: saleError } = await supabase
      .from('POSSale')
      .select(`
        *,
        items:POSSaleItem(*),
        payments:POSSalePayment(*)
      `)
      .eq('id', saleId)
      .single()
    
    if (saleError) {
      console.error('Error fetching sale:', saleError)
      return { success: false, error: saleError.message }
    }
    
    return { success: true, data: sale as POSSaleWithPayments }
  } catch (error) {
    console.error('Error in getPOSSaleWithPayments:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Agrega un pago adicional a una venta existente
 */
export async function addPaymentToSale(
  saleId: number,
  paymentData: z.infer<typeof POSSalePaymentSchema>
): Promise<{ success: boolean; data?: POSSalePayment; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    
    // Validar datos del pago
    const validatedPayment = POSSalePaymentSchema.parse({ ...paymentData, saleId })
    
    // Verificar que la venta existe y obtener información
    const { data: sale, error: saleError } = await supabase
      .from('POSSale')
      .select('total, paidAmount, pendingAmount, paymentStatus')
      .eq('id', saleId)
      .single()
    
    if (saleError || !sale) {
      return { success: false, error: 'Venta no encontrada' }
    }
    
    // Verificar que el pago no exceda el monto pendiente
    if (validatedPayment.amount > sale.pendingAmount) {
      return { 
        success: false, 
        error: `El pago (${validatedPayment.amount}) no puede ser mayor al monto pendiente (${sale.pendingAmount})` 
      }
    }
    
    // Crear el pago
    const { data: payment, error: paymentError } = await supabase
      .from('POSSalePayment')
      .insert({
        saleId: validatedPayment.saleId,
        paymentMethod: validatedPayment.paymentMethod,
        amount: validatedPayment.amount,
        receivedAmount: validatedPayment.receivedAmount,
        changeAmount: validatedPayment.changeAmount,
        cardReference: validatedPayment.cardReference,
        bankReference: validatedPayment.bankReference,
        cardLast4: validatedPayment.cardLast4,
        notes: validatedPayment.notes
      })
      .select()
      .single()
    
    if (paymentError) {
      console.error('Error creating payment:', paymentError)
      return { success: false, error: paymentError.message }
    }
    
    revalidatePath('/dashboard/pos')
    return { success: true, data: payment }
  } catch (error) {
    console.error('Error in addPaymentToSale:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Obtiene resumen de métodos de pago para reportes
 */
export async function getPaymentSummary(
  filters: {
    dateFrom?: string
    dateTo?: string
    registerTypeId?: number
    sessionId?: number
  } = {}
): Promise<{ success: boolean; data?: Array<{
  paymentMethod: string
  count: number
  totalAmount: number
  avgAmount: number
}>; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    
    let query = supabase
      .from('POSSalePayment')
      .select(`
        paymentMethod,
        amount,
        POSSale!inner(sessionId, createdAt),
        POSSale.CashSession!inner(cashRegisterTypeId)
      `)
    
    // Aplicar filtros
    if (filters.dateFrom) {
      query = query.gte('POSSale.createdAt', filters.dateFrom)
    }
    
    if (filters.dateTo) {
      query = query.lte('POSSale.createdAt', filters.dateTo)
    }
    
    if (filters.registerTypeId) {
      query = query.eq('POSSale.CashSession.cashRegisterTypeId', filters.registerTypeId)
    }
    
    if (filters.sessionId) {
      query = query.eq('POSSale.sessionId', filters.sessionId)
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching payment summary:', error)
      return { success: false, error: error.message }
    }
    
    // Agrupar por método de pago
    const summary = (data || []).reduce((acc, payment) => {
      const method = payment.paymentMethod
      if (!acc[method]) {
        acc[method] = {
          paymentMethod: method,
          count: 0,
          totalAmount: 0,
          avgAmount: 0
        }
      }
      
      acc[method].count++
      acc[method].totalAmount += parseFloat(payment.amount.toString())
      
      return acc
    }, {} as Record<string, any>)
    
    // Calcular promedios
    Object.values(summary).forEach((item: any) => {
      item.avgAmount = item.totalAmount / item.count
    })
    
    return { success: true, data: Object.values(summary) }
  } catch (error) {
    console.error('Error in getPaymentSummary:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

/**
 * Elimina un pago específico (solo administradores)
 */
export async function deletePayment(
  paymentId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'Usuario no autenticado' }
    }
    
    // Verificar que el usuario tiene permisos
    const userRole = user.user_metadata?.role
    if (!['ADMINISTRADOR', 'JEFE_SECCION'].includes(userRole)) {
      return { success: false, error: 'No tiene permisos para eliminar pagos' }
    }
    
    const { error } = await supabase
      .from('POSSalePayment')
      .delete()
      .eq('id', paymentId)
    
    if (error) {
      console.error('Error deleting payment:', error)
      return { success: false, error: error.message }
    }
    
    revalidatePath('/dashboard/pos')
    return { success: true }
  } catch (error) {
    console.error('Error in deletePayment:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}

