import { z } from 'zod'

// ===============================
// TYPES AND SCHEMAS
// ===============================

export const PaymentMethodEnum = z.enum(['cash', 'credit_card', 'debit_card', 'transfer', 'other'])

export const POSSalePaymentSchema = z.object({
  saleId: z.number(),
  paymentMethod: PaymentMethodEnum,
  amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  receivedAmount: z.number().optional(),
  changeAmount: z.number().default(0),
  cardReference: z.string().optional(),
  bankReference: z.string().optional(),
  cardLast4: z.string().max(4).optional(),
  notes: z.string().optional()
})

// Esquema para pagos cuando se crea una nueva venta (saleId será asignado automáticamente)
export const NewSalePaymentSchema = z.object({
  paymentMethod: PaymentMethodEnum,
  amount: z.number().min(0.01, 'El monto debe ser mayor a 0'),
  receivedAmount: z.number().optional(),
  changeAmount: z.number().default(0),
  cardReference: z.string().optional(),
  bankReference: z.string().optional(),
  cardLast4: z.string().max(4).optional(),
  notes: z.string().optional()
})

export const MultiplePaymentSchema = z.object({
  sessionId: z.number(),
  customerName: z.string().optional(),
  customerDocument: z.string().optional(),
  clientId: z.number().optional(),
  tableNumber: z.string().optional(),
  roomNumber: z.string().optional(),
  subtotal: z.number(),
  taxAmount: z.number().default(0),
  discountAmount: z.number().default(0),
  discountReason: z.string().optional(),
  total: z.number(),
  notes: z.string().optional(),
  payments: z.array(NewSalePaymentSchema).min(1, 'Debe haber al menos un método de pago'),
  items: z.array(z.object({
    productId: z.number(),
    productName: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number(),
    total: z.number(),
    notes: z.string().optional()
  }))
}).refine((data) => {
  const totalPayments = data.payments.reduce((sum, payment) => sum + payment.amount, 0)
  return Math.abs(totalPayments - data.total) < 0.01 // Tolerancia de 1 centavo
}, {
  message: 'La suma de los pagos debe ser igual al total de la venta',
  path: ['payments']
})

export interface POSSalePayment {
  id: number
  saleId: number
  paymentMethod: string
  amount: number
  receivedAmount?: number
  changeAmount: number
  cardReference?: string
  bankReference?: string
  cardLast4?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

// ===============================
// PAYMENT METHODS INFO
// ===============================

export const PAYMENT_METHODS = {
  cash: { label: 'Efectivo', icon: '💵', requiresChange: true },
  credit_card: { label: 'Tarjeta de Crédito', icon: '💳', requiresReference: true },
  debit_card: { label: 'Tarjeta de Débito', icon: '💳', requiresReference: true },
  transfer: { label: 'Transferencia', icon: '🏦', requiresReference: true },
  other: { label: 'Otro', icon: '📄', requiresReference: false }
} as const

// ===============================
// VALIDATION FUNCTIONS
// ===============================

/**
 * Valida que los pagos sumen el total de la venta
 */
export function validatePaymentTotal(
  payments: Array<{ amount: number }>, 
  saleTotal: number
): { valid: boolean; difference: number; message?: string } {
  const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const difference = Math.abs(totalPayments - saleTotal)
  
  if (difference < 0.01) { // Tolerancia de 1 centavo
    return { valid: true, difference: 0 }
  }
  
  if (totalPayments < saleTotal) {
    return { 
      valid: false, 
      difference, 
      message: `Faltan $${(saleTotal - totalPayments).toFixed(2)} por pagar` 
    }
  }
  
  return { 
    valid: false, 
    difference, 
    message: `Sobran $${(totalPayments - saleTotal).toFixed(2)} en los pagos` 
  }
} 