'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { getSupabaseServerClient } from '@/lib/supabase-server'

type AdjustmentType = 'REFUND' | 'CREDIT'
type RefundMethod = 'cash' | 'credit_card' | 'debit_card' | 'transfer' | 'other' | 'wallet'

interface CreatePosSaleAdjustmentInput {
  saleId: number
  saleItemId: number
  adjustmentType: AdjustmentType
  quantity: number
  reason: string
  refundMethod?: RefundMethod | null
}

interface SaleItemRow {
  id: number
  saleId: number
  productId: number
  productName: string
  quantity: number
  unitPrice: number
  total: number
}

interface AdjustmentRow {
  id: number
  saleId: number
  saleItemId: number | null
  productId: number | null
  adjustmentType: AdjustmentType
  quantity: number
  unitPrice: number
  amount: number
  refundMethod?: RefundMethod | null
  affectsPaidAmount: boolean
  reason: string
  createdBy: string | null
  createdAt: string
}

const ENABLE_CREDIT_ADJUSTMENTS = false

const CreatePosSaleAdjustmentSchema = z.object({
  saleId: z.number().int().positive(),
  saleItemId: z.number().int().positive(),
  adjustmentType: z.enum(['REFUND', 'CREDIT']),
  quantity: z.number().int().positive(),
  reason: z.string().min(3),
  refundMethod: z.enum(['cash', 'credit_card', 'debit_card', 'transfer', 'other', 'wallet']).nullable().optional()
})

function roundCLP(n: number): number {
  return Math.round(Number.isFinite(n) ? n : 0)
}

function clamp0(n: number): number {
  return Math.max(0, Number.isFinite(n) ? n : 0)
}

export async function createPosSaleAdjustment(
  input: CreatePosSaleAdjustmentInput
): Promise<{ success: boolean; data?: AdjustmentRow; error?: string }> {
  try {
    const supabase = await getSupabaseServerClient()

    const {
      data: { user }
    } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Usuario no autenticado' }

    const validated = CreatePosSaleAdjustmentSchema.parse(input)

    if (validated.adjustmentType === 'CREDIT' && !ENABLE_CREDIT_ADJUSTMENTS) {
      return { success: false, error: 'Crédito a favor deshabilitado temporalmente' }
    }

    const { data: sale, error: saleError } = await supabase
      .from('POSSale')
      .select('id, status')
      .eq('id', validated.saleId)
      .single()

    if (saleError || !sale) {
      return { success: false, error: 'Venta no encontrada' }
    }

    const statusUpper = String(sale.status || '').toUpperCase()
    if (statusUpper === 'CANCELADO' || statusUpper === 'CANCELLED') {
      return { success: false, error: 'No se permiten ajustes en ventas canceladas' }
    }

    const { data: item, error: itemError } = await supabase
      .from('POSSaleItem')
      .select('id, saleId, productId, productName, quantity, unitPrice, total')
      .eq('id', validated.saleItemId)
      .single()

    if (itemError || !item) {
      return { success: false, error: 'Item de venta no encontrado' }
    }

    const itemRow = item as SaleItemRow
    if (itemRow.saleId !== validated.saleId) {
      return { success: false, error: 'El item no pertenece a la venta indicada' }
    }

    const { data: existingAdjustments, error: adjustmentsError } = await supabase
      .from('POSSaleAdjustment')
      .select('quantity')
      .eq('saleItemId', validated.saleItemId)

    if (adjustmentsError) {
      return { success: false, error: adjustmentsError.message }
    }

    const usedQty = (existingAdjustments || []).reduce((sum, row) => sum + Number(row.quantity || 0), 0)
    const remainingQty = Math.max(0, Number(itemRow.quantity || 0) - usedQty)

    if (validated.quantity > remainingQty) {
      return {
        success: false,
        error: `Cantidad inválida: disponible ${remainingQty}, solicitado ${validated.quantity}`
      }
    }

    const unitPriceFallback = Number(itemRow.quantity || 0) > 0 ? Number(itemRow.total || 0) / Number(itemRow.quantity || 1) : 0
    const unitPrice = clamp0(Number(itemRow.unitPrice || unitPriceFallback || 0))
    const amount = clamp0(roundCLP(validated.quantity * unitPrice))

    if (amount <= 0) {
      return { success: false, error: 'Monto inválido para ajuste' }
    }

    if (validated.adjustmentType === 'REFUND' && !validated.refundMethod) {
      return { success: false, error: 'Debe indicar el método de devolución' }
    }

    if (validated.adjustmentType === 'REFUND') {
      const { data: paymentsRows, error: paymentsError } = await supabase
        .from('POSSalePayment')
        .select('amount')
        .eq('saleId', validated.saleId)

      if (paymentsError) {
        return { success: false, error: paymentsError.message }
      }

      const paymentsTotal = (paymentsRows || []).reduce((sum, row) => sum + Number(row.amount || 0), 0)

      const { data: refundRows, error: refundsError } = await supabase
        .from('POSSaleAdjustment')
        .select('amount')
        .eq('saleId', validated.saleId)
        .eq('affectsPaidAmount', true)

      if (refundsError) {
        return { success: false, error: refundsError.message }
      }

      const refundsTotal = (refundRows || []).reduce((sum, row) => sum + Number(row.amount || 0), 0)
      if (refundsTotal + amount > paymentsTotal + 0.01) {
        return { success: false, error: 'No se puede devolver más dinero del pagado' }
      }
    }

    const affectsPaidAmount = validated.adjustmentType === 'REFUND'
    const refundMethod = validated.adjustmentType === 'REFUND' ? validated.refundMethod : 'wallet'

    const { data: inserted, error: insertError } = await supabase
      .from('POSSaleAdjustment')
      .insert({
        saleId: validated.saleId,
        saleItemId: validated.saleItemId,
        productId: itemRow.productId,
        adjustmentType: validated.adjustmentType,
        quantity: validated.quantity,
        unitPrice,
        amount,
        refundMethod,
        affectsPaidAmount,
        reason: validated.reason,
        createdBy: user.id
      })
      .select()
      .single()

    if (insertError) {
      return { success: false, error: insertError.message }
    }

    revalidatePath(`/dashboard/pos/sales/${validated.saleId}`)
    revalidatePath('/dashboard/pos/sales')

    return { success: true, data: inserted as AdjustmentRow }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Datos inválidos' }
    }
    console.error('Error in createPosSaleAdjustment:', error)
    return { success: false, error: 'Error interno del servidor' }
  }
}
