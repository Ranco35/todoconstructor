'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { 
  Plus, 
  Trash2, 
  CreditCard, 
  Banknote,
  Building2,
  FileText,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react'
import { formatCurrency } from '@/utils/currency'
import { PAYMENT_METHODS, type POSSalePayment, validatePaymentTotal } from '@/utils/payment-utils'

interface PaymentInput {
  id: string
  paymentMethod: string
  amount: number
  receivedAmount?: number
  changeAmount: number
  cardReference?: string
  bankReference?: string
  cardLast4?: string
  notes?: string
}

interface MultiplePaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (payments: PaymentInput[]) => void
  saleTotal: number
  customerName?: string
  tableNumber?: string
  roomNumber?: string
  isProcessing?: boolean
}

const getPaymentIcon = (method: string) => {
  switch (method) {
    case 'cash': return <Banknote className="h-4 w-4" />
    case 'credit_card':
    case 'debit_card': return <CreditCard className="h-4 w-4" />
    case 'transfer': return <Building2 className="h-4 w-4" />
    default: return <FileText className="h-4 w-4" />
  }
}

export default function MultiplePaymentModal({
  isOpen,
  onClose,
  onConfirm,
  saleTotal,
  customerName,
  tableNumber,
  roomNumber,
  isProcessing = false
}: MultiplePaymentModalProps) {
  const [payments, setPayments] = useState<PaymentInput[]>([])
  const [validationResult, setValidationResult] = useState<{
    valid: boolean
    difference: number
    message?: string
  }>({ valid: false, difference: saleTotal })

  // Inicializar con un pago en efectivo por el total
  useEffect(() => {
    if (isOpen) {
      setPayments([{
        id: 'payment-1',
        paymentMethod: 'cash',
        amount: saleTotal,
        receivedAmount: 0,
        changeAmount: 0,
        notes: ''
      }])
    }
  }, [isOpen, saleTotal])

  // Validar pagos cada vez que cambien
  useEffect(() => {
    const result = validatePaymentTotal(payments, saleTotal)
    setValidationResult(result)
  }, [payments, saleTotal])

  const addPayment = () => {
    const newPayment: PaymentInput = {
      id: `payment-${Date.now()}`,
      paymentMethod: 'cash',
      amount: Math.max(0, saleTotal - getTotalPayments()),
      receivedAmount: 0,
      changeAmount: 0,
      notes: ''
    }
    setPayments([...payments, newPayment])
  }

  const removePayment = (paymentId: string) => {
    if (payments.length > 1) {
      setPayments(payments.filter(p => p.id !== paymentId))
    }
  }

  const updatePayment = (paymentId: string, updates: Partial<PaymentInput>) => {
    setPayments(payments.map(payment => 
      payment.id === paymentId 
        ? { ...payment, ...updates }
        : payment
    ))
  }

  const getTotalPayments = () => {
    return payments.reduce((sum, payment) => sum + (payment.amount || 0), 0)
  }

  const calculateChange = (payment: PaymentInput) => {
    if (payment.paymentMethod === 'cash' && payment.receivedAmount && payment.amount) {
      return Math.max(0, payment.receivedAmount - payment.amount)
    }
    return 0
  }

  const handlePaymentAmountChange = (paymentId: string, amount: number) => {
    updatePayment(paymentId, { amount })
  }

  const handleReceivedAmountChange = (paymentId: string, receivedAmount: number) => {
    const payment = payments.find(p => p.id === paymentId)
    if (payment && payment.paymentMethod === 'cash') {
      const changeAmount = Math.max(0, receivedAmount - payment.amount)
      updatePayment(paymentId, { 
        receivedAmount, 
        changeAmount 
      })
    }
  }

  const handleQuickAmount = (paymentId: string, quickAmount: number) => {
    const payment = payments.find(p => p.id === paymentId)
    if (payment && payment.paymentMethod === 'cash') {
      const changeAmount = Math.max(0, quickAmount - payment.amount)
      updatePayment(paymentId, { 
        receivedAmount: quickAmount, 
        changeAmount 
      })
    }
  }

  const handleConfirm = () => {
    if (validationResult.valid && payments.length > 0) {
      onConfirm(payments)
    }
  }

  const handleClose = () => {
    setPayments([])
    onClose()
  }

  const quickAmounts = [5000, 10000, 20000, 50000, 100000]

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Procesar Pago - Múltiples Métodos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información de la venta */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Información de la Venta</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Cliente:</span>
                <div className="font-medium">
                  {customerName || <span className="text-gray-400 italic">Sin cliente seleccionado</span>}
                </div>
              </div>
              
              {tableNumber && (
                <div>
                  <span className="text-gray-500">Mesa:</span>
                  <div className="font-medium">{tableNumber}</div>
                </div>
              )}
              
              <div>
                <span className="text-gray-500">Habitación:</span>
                <div className="font-medium">
                  {roomNumber || <span className="text-gray-400 italic">No especificada</span>}
                </div>
              </div>
              
              <div>
                <span className="text-gray-500">Total a Pagar:</span>
                <div className="font-bold text-lg text-blue-600">
                  {formatCurrency(saleTotal)}
                </div>
              </div>
            </div>
          </div>

          {/* Lista de pagos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Métodos de Pago</h3>
              <Button
                onClick={addPayment}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Agregar Método
              </Button>
            </div>

            {payments.map((payment, index) => (
              <div key={payment.id} className="p-4 border rounded-lg bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Método de pago */}
                  <div>
                    <Label htmlFor={`method-${payment.id}`}>Método de Pago</Label>
                    <Select
                      value={payment.paymentMethod}
                      onValueChange={(value) => updatePayment(payment.id, { paymentMethod: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PAYMENT_METHODS).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <span>{config.icon}</span>
                              {config.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Monto */}
                  <div>
                    <Label htmlFor={`amount-${payment.id}`}>Monto</Label>
                    <Input
                      id={`amount-${payment.id}`}
                      type="number"
                      value={payment.amount || ''}
                      onChange={(e) => handlePaymentAmountChange(payment.id, parseFloat(e.target.value) || 0)}
                      min={0}
                      step={0.01}
                      className="font-mono"
                    />
                  </div>

                  {/* Efectivo recibido (solo para efectivo) */}
                  {payment.paymentMethod === 'cash' && (
                    <div>
                      <Label htmlFor={`received-${payment.id}`}>Efectivo Recibido</Label>
                      <Input
                        id={`received-${payment.id}`}
                        type="number"
                        value={payment.receivedAmount || ''}
                        onChange={(e) => handleReceivedAmountChange(payment.id, parseFloat(e.target.value) || 0)}
                        min={0}
                        step={0.01}
                        className="font-mono"
                      />
                    </div>
                  )}

                  {/* Referencia de tarjeta */}
                  {(['credit_card', 'debit_card'].includes(payment.paymentMethod)) && (
                    <>
                      <div>
                        <Label htmlFor={`card-ref-${payment.id}`}>Referencia Tarjeta</Label>
                        <Input
                          id={`card-ref-${payment.id}`}
                          value={payment.cardReference || ''}
                          onChange={(e) => updatePayment(payment.id, { cardReference: e.target.value })}
                          placeholder="Ej: AUTH123456"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`card-last4-${payment.id}`}>Últimos 4 Dígitos</Label>
                        <Input
                          id={`card-last4-${payment.id}`}
                          value={payment.cardLast4 || ''}
                          onChange={(e) => updatePayment(payment.id, { cardLast4: e.target.value.slice(0, 4) })}
                          placeholder="1234"
                          maxLength={4}
                        />
                      </div>
                    </>
                  )}

                  {/* Referencia de transferencia */}
                  {payment.paymentMethod === 'transfer' && (
                    <div>
                      <Label htmlFor={`bank-ref-${payment.id}`}>Referencia Bancaria</Label>
                      <Input
                        id={`bank-ref-${payment.id}`}
                        value={payment.bankReference || ''}
                        onChange={(e) => updatePayment(payment.id, { bankReference: e.target.value })}
                        placeholder="Ej: TRX123456789"
                      />
                    </div>
                  )}
                </div>

                {/* Botones rápidos para efectivo */}
                {payment.paymentMethod === 'cash' && (
                  <div className="mt-3">
                    <Label className="text-xs text-gray-500">Montos Rápidos:</Label>
                    <div className="flex gap-2 mt-1">
                      {quickAmounts.map(amount => (
                        <Button
                          key={amount}
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickAmount(payment.id, amount)}
                          className="text-xs"
                        >
                          {formatCurrency(amount)}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vuelto calculado */}
                {payment.paymentMethod === 'cash' && payment.receivedAmount && payment.amount && (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                    <div className="text-sm">
                      <span className="text-green-700">Vuelto: </span>
                      <span className="font-bold text-green-800">
                        {formatCurrency(calculateChange(payment))}
                      </span>
                    </div>
                  </div>
                )}

                {/* Notas */}
                <div className="mt-3">
                  <Label htmlFor={`notes-${payment.id}`}>Notas (opcional)</Label>
                  <Textarea
                    id={`notes-${payment.id}`}
                    value={payment.notes || ''}
                    onChange={(e) => updatePayment(payment.id, { notes: e.target.value })}
                    placeholder="Observaciones del pago..."
                    rows={2}
                  />
                </div>

                {/* Botón eliminar */}
                <div className="flex justify-between items-center mt-3">
                  <div className="flex items-center gap-2">
                    {getPaymentIcon(payment.paymentMethod)}
                    <Badge variant="outline">
                      Pago #{index + 1}
                    </Badge>
                  </div>
                  {payments.length > 1 && (
                    <Button
                      onClick={() => removePayment(payment.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Resumen de pagos */}
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total de la Venta:</span>
                <span className="font-medium">{formatCurrency(saleTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total de Pagos:</span>
                <span className="font-medium">{formatCurrency(getTotalPayments())}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="font-medium">Estado del Pago:</span>
                <div className="flex items-center gap-2">
                  {validationResult.valid ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <Badge className="bg-green-100 text-green-800">
                        Completo
                      </Badge>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <Badge variant="outline" className="text-amber-800 border-amber-300">
                        {validationResult.message}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-3">
            <Button
              onClick={handleClose}
              variant="outline"
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!validationResult.valid || isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? 'Procesando...' : 'Confirmar Pago'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 