'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, CreditCard, DollarSign } from 'lucide-react';
import type { CreatePurchasePaymentInput } from '@/actions/purchases/payments/create';

interface PurchasePaymentFormProps {
  selectedInvoiceId?: number;
  onSuccess?: (payment: any) => void;
  onCancel?: () => void;
}

interface InvoiceForPayment {
  id: number;
  invoiceNumber: string;
  supplierName: string;
  totalAmount: number;
  remainingBalance: number;
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Efectivo', icon: '💵' },
  { value: 'bank_transfer', label: 'Transferencia Bancaria', icon: '🏦' },
  { value: 'credit_card', label: 'Tarjeta de Crédito', icon: '💳' },
  { value: 'debit_card', label: 'Tarjeta de Débito', icon: '💳' },
  { value: 'check', label: 'Cheque', icon: '📝' },
  { value: 'online_payment', label: 'Pago Online', icon: '💻' },
  { value: 'crypto', label: 'Criptomoneda', icon: '₿' },
  { value: 'other', label: 'Otro', icon: '📄' }
];

export default function PurchasePaymentForm({ selectedInvoiceId, onSuccess, onCancel }: PurchasePaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceForPayment[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceForPayment | null>(null);
  const [formData, setFormData] = useState<CreatePurchasePaymentInput>({
    purchase_invoice_id: selectedInvoiceId || 0,
    amount: 0,
    payment_method: '',
    payment_date: new Date().toISOString().split('T')[0],
    reference: '',
    notes: '',
    created_by: null // Se puede establecer el UUID del usuario actual
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar facturas disponibles para pago
  useEffect(() => {
    const loadInvoices = async () => {
      setLoading(true);
      try {
        console.log('🔍 Cargando facturas disponibles para pago...');
        const response = await fetch('/api/purchases/payments/invoices');
        const data = await response.json();
        
        console.log('📊 Facturas encontradas:', data.data?.length || 0);
        
        if (data.success) {
          setInvoices(data.data || []);
          
          // Si hay una factura preseleccionada, buscarla
          if (selectedInvoiceId) {
            const preselected = data.data?.find((inv: InvoiceForPayment) => inv.id === selectedInvoiceId);
            if (preselected) {
              setSelectedInvoice(preselected);
              setFormData(prev => ({
                ...prev,
                purchase_invoice_id: selectedInvoiceId,
                amount: preselected.remainingBalance
              }));
            }
          }
        } else {
          console.error('❌ Error del API:', data.error);
        }
      } catch (error) {
        console.error('❌ Error loading invoices:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
  }, [selectedInvoiceId]);

  const handleInvoiceChange = (invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === parseInt(invoiceId));
    setSelectedInvoice(invoice || null);
    setFormData(prev => ({
      ...prev,
      purchase_invoice_id: parseInt(invoiceId),
      amount: invoice?.remainingBalance || 0
    }));
    setErrors(prev => ({ ...prev, purchase_invoice_id: '' }));
  };

  const handleInputChange = (field: keyof CreatePurchasePaymentInput, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.purchase_invoice_id) {
      newErrors.purchase_invoice_id = 'Debe seleccionar una factura';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'El monto debe ser mayor a 0';
    }

    if (selectedInvoice && formData.amount > selectedInvoice.remainingBalance) {
      newErrors.amount = `El monto no puede exceder el saldo pendiente ($${selectedInvoice.remainingBalance.toLocaleString('es-CL')})`;
    }

    if (!formData.payment_method) {
      newErrors.payment_method = 'Debe seleccionar un método de pago';
    }

    if (!formData.payment_date) {
      newErrors.payment_date = 'La fecha de pago es obligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/purchases/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        if (onSuccess) {
          onSuccess(result.data);
        }
      } else {
        setErrors({ general: result.error || 'Error al registrar el pago' });
      }
    } catch (error) {
      console.error('Error submitting payment:', error);
      setErrors({ general: 'Error de conexión. Intente nuevamente.' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando facturas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Registrar Pago de Factura de Compra
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error general */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700">{errors.general}</span>
            </div>
          )}

          {/* Selección de factura */}
          <div className="space-y-2">
            <Label htmlFor="invoice">Factura a Pagar</Label>
            <Select
              value={formData.purchase_invoice_id?.toString() || ''}
              onValueChange={handleInvoiceChange}
              disabled={!!selectedInvoiceId}
            >
              <SelectTrigger className={errors.purchase_invoice_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="Seleccionar factura..." />
              </SelectTrigger>
              <SelectContent>
                {invoices.map((invoice) => (
                  <SelectItem key={invoice.id} value={invoice.id.toString()}>
                    <div className="flex flex-col">
                      <span className="font-medium">{invoice.invoiceNumber}</span>
                      <span className="text-sm text-gray-600">
                        {invoice.supplierName} - Pendiente: {formatCurrency(invoice.remainingBalance)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.purchase_invoice_id && (
              <span className="text-sm text-red-500">{errors.purchase_invoice_id}</span>
            )}
          </div>

          {/* Información de la factura seleccionada */}
          {selectedInvoice && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Proveedor:</span>
                    <p className="text-gray-900">{selectedInvoice.supplierName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Total Factura:</span>
                    <p className="text-gray-900">{formatCurrency(selectedInvoice.totalAmount)}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium text-gray-600">Saldo Pendiente:</span>
                    <p className="text-lg font-semibold text-blue-600">
                      {formatCurrency(selectedInvoice.remainingBalance)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Monto del pago */}
          <div className="space-y-2">
            <Label htmlFor="amount">Monto del Pago</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="amount"
                type="number"
                min="0"
                step="1"
                value={formData.amount || ''}
                onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                className={`pl-10 ${errors.amount ? 'border-red-500' : ''}`}
                placeholder="0"
              />
            </div>
            {errors.amount && (
              <span className="text-sm text-red-500">{errors.amount}</span>
            )}
          </div>

          {/* Método de pago */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Método de Pago</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) => handleInputChange('payment_method', value)}
            >
              <SelectTrigger className={errors.payment_method ? 'border-red-500' : ''}>
                <SelectValue placeholder="Seleccionar método..." />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    <div className="flex items-center gap-2">
                      <span>{method.icon}</span>
                      <span>{method.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.payment_method && (
              <span className="text-sm text-red-500">{errors.payment_method}</span>
            )}
          </div>

          {/* Fecha de pago */}
          <div className="space-y-2">
            <Label htmlFor="paymentDate">Fecha de Pago</Label>
            <Input
              id="paymentDate"
              type="date"
              value={formData.payment_date}
              onChange={(e) => handleInputChange('payment_date', e.target.value)}
              className={errors.payment_date ? 'border-red-500' : ''}
            />
            {errors.payment_date && (
              <span className="text-sm text-red-500">{errors.payment_date}</span>
            )}
          </div>

          {/* Referencia */}
          <div className="space-y-2">
            <Label htmlFor="reference">Número de Referencia (Opcional)</Label>
            <Input
              id="reference"
              value={formData.reference || ''}
              onChange={(e) => handleInputChange('reference', e.target.value)}
              placeholder="Número de transferencia, cheque, etc."
            />
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas (Opcional)</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Observaciones del pago..."
              rows={3}
            />
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 pt-4">
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={submitting}
              >
                Cancelar
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={submitting || !selectedInvoice}
              className="min-w-[120px]"
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Procesando...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Registrar Pago</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}