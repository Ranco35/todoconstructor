'use client';

import { useState } from 'react';
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
import { AlertCircle, CheckCircle, CreditCard, DollarSign, FileText } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';

interface SelectedInvoice {
  id: number;
  number: string;
  supplier_name: string;
  total: number;
  payment_status?: string;
}

interface BulkPurchasePaymentFormProps {
  selectedInvoices: SelectedInvoice[];
  onSuccess?: (payment: any) => void;
  onCancel?: () => void;
}

interface BulkPaymentData {
  amount: number;
  payment_method: string;
  payment_date: string;
  reference: string;
  notes: string;
  invoice_ids: number[];
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

export default function BulkPurchasePaymentForm({ 
  selectedInvoices, 
  onSuccess, 
  onCancel 
}: BulkPurchasePaymentFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calcular el total de todas las facturas seleccionadas
  const totalAmount = selectedInvoices.reduce((sum, invoice) => sum + invoice.total, 0);

  const [formData, setFormData] = useState<BulkPaymentData>({
    amount: totalAmount,
    payment_method: 'bank_transfer', // Default to bank transfer as requested
    payment_date: new Date().toISOString().split('T')[0],
    reference: '',
    notes: `Pago múltiple para facturas: ${selectedInvoices.map(inv => inv.number).join(', ')}`,
    invoice_ids: selectedInvoices.map(inv => inv.id)
  });

  const handleInputChange = (field: keyof BulkPaymentData, value: string | number | number[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'El monto debe ser mayor a 0';
    }

    if (formData.amount !== totalAmount) {
      newErrors.amount = `El monto debe ser exactamente ${formatCurrency(totalAmount)} para cubrir todas las facturas seleccionadas`;
    }

    if (!formData.payment_method) {
      newErrors.payment_method = 'Debe seleccionar un método de pago';
    }

    if (!formData.payment_date) {
      newErrors.payment_date = 'La fecha de pago es obligatoria';
    }

    if (!formData.reference.trim()) {
      newErrors.reference = 'La referencia del pago es obligatoria para pagos múltiples';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      console.log('💳 Procesando pago múltiple:', formData);

      const response = await fetch('/api/purchases/payments/bulk-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Pago múltiple registrado exitosamente');
        onSuccess?.(result.data);
      } else {
        console.error('❌ Error del API:', result.error);
        setErrors({ submit: result.error || 'Error al procesar el pago múltiple' });
      }
    } catch (error) {
      console.error('❌ Error procesando pago múltiple:', error);
      setErrors({ submit: 'Error de red al procesar el pago' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Resumen de facturas seleccionadas */}
      <Card className="bg-white shadow-lg border">
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Facturas Seleccionadas ({selectedInvoices.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-white">
          <div className="space-y-3">
            {selectedInvoices.map((invoice) => (
              <div key={invoice.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{invoice.number}</p>
                  <p className="text-sm text-gray-600">{invoice.supplier_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(invoice.total)}</p>
                  {invoice.payment_status && (
                    <Badge variant="outline" className="text-xs">
                      {invoice.payment_status === 'partial' ? 'Pago Parcial' : 'Pendiente'}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
            <div className="border-t pt-3">
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Total a Pagar:</span>
                <span className="text-green-600">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulario de pago */}
      <Card className="bg-white shadow-lg border">
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Información del Pago
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-white p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Monto */}
            <div className="space-y-2">
              <Label htmlFor="amount">Monto Total *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                  className="pl-10"
                  placeholder="0.00"
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.amount}
                </p>
              )}
            </div>

            {/* Método de Pago */}
            <div className="space-y-2">
              <Label htmlFor="payment_method">Método de Pago *</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => handleInputChange('payment_method', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un método de pago" />
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
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.payment_method}
                </p>
              )}
            </div>

            {/* Fecha de Pago */}
            <div className="space-y-2">
              <Label htmlFor="payment_date">Fecha de Pago *</Label>
              <Input
                id="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={(e) => handleInputChange('payment_date', e.target.value)}
              />
              {errors.payment_date && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.payment_date}
                </p>
              )}
            </div>

            {/* Referencia */}
            <div className="space-y-2">
              <Label htmlFor="reference">Referencia del Pago *</Label>
              <Input
                id="reference"
                value={formData.reference}
                onChange={(e) => handleInputChange('reference', e.target.value)}
                placeholder="Ej: Transferencia #123456 - Banco Santander"
              />
              {errors.reference && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.reference}
                </p>
              )}
            </div>

            {/* Notas */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Notas adicionales sobre el pago..."
                rows={3}
              />
            </div>

            {/* Error de envío */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.submit}
                </p>
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-end gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Registrar Pago Múltiple
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}