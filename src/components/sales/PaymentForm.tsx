'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Receipt, CreditCard, Banknote, Building2, Check, AlertCircle } from 'lucide-react';

interface Invoice {
  id: number;
  number: string;
  clientName: string;
  total: number;
  remainingBalance: number;
}

interface PaymentFormData {
  invoice_id: number | null;
  amount: number;
  payment_method: string;
  payment_date: string;
  reference_number: string;
  notes: string;
}

interface PaymentFormProps {
  onSubmit: (data: PaymentFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  initialInvoiceId?: number;
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Efectivo', icon: Banknote },
  { value: 'bank_transfer', label: 'Transferencia Bancaria', icon: Building2 },
  { value: 'credit_card', label: 'Tarjeta de Crédito', icon: CreditCard },
  { value: 'debit_card', label: 'Tarjeta de Débito', icon: CreditCard },
  { value: 'check', label: 'Cheque', icon: Check },
  { value: 'online_payment', label: 'Pago Online', icon: CreditCard },
  { value: 'other', label: 'Otro', icon: Receipt }
];

export default function PaymentForm({ onSubmit, onCancel, isSubmitting = false, initialInvoiceId }: PaymentFormProps) {
  const [formData, setFormData] = useState<PaymentFormData>({
    invoice_id: initialInvoiceId || null,
    amount: 0,
    payment_method: '',
    payment_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    notes: ''
  });

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar facturas disponibles para pago
  useEffect(() => {
    const loadInvoices = async () => {
      try {
        const response = await fetch('/api/sales/payments/invoices');
        const data = await response.json();
        
        if (data.success) {
          setInvoices(data.data || []);
          
          // Si hay un invoice inicial, seleccionarlo
          if (initialInvoiceId && data.data) {
            const invoice = data.data.find((inv: Invoice) => inv.id === initialInvoiceId);
            if (invoice) {
              setSelectedInvoice(invoice);
              setFormData(prev => ({ ...prev, amount: invoice.remainingBalance }));
            }
          }
        }
      } catch (error) {
        console.error('Error al cargar facturas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
  }, [initialInvoiceId]);

  const handleInvoiceChange = (invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === parseInt(invoiceId));
    setSelectedInvoice(invoice || null);
    setFormData(prev => ({
      ...prev,
      invoice_id: parseInt(invoiceId),
      amount: invoice ? invoice.remainingBalance : 0
    }));
    setErrors(prev => ({ ...prev, invoice_id: '' }));
  };

  const handleAmountChange = (value: string) => {
    const amount = parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, amount }));
    setErrors(prev => ({ ...prev, amount: '' }));
  };

  const handleFieldChange = (field: keyof PaymentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.invoice_id) {
      newErrors.invoice_id = 'Debe seleccionar una factura.';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'El monto debe ser mayor a 0.';
    }

    if (selectedInvoice && formData.amount > selectedInvoice.remainingBalance) {
      newErrors.amount = `El monto no puede exceder el saldo pendiente ($${selectedInvoice.remainingBalance.toLocaleString('es-CL')}).`;
    }

    if (!formData.payment_method) {
      newErrors.payment_method = 'Debe seleccionar un método de pago.';
    }

    if (!formData.payment_date) {
      newErrors.payment_date = 'La fecha de pago es obligatoria.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    await onSubmit(formData);
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
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando facturas...</span>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Registrar Pago
        </CardTitle>
        <CardDescription>
          Registre un nuevo pago para una factura existente
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Selector de Factura */}
          <div className="space-y-2">
            <Label htmlFor="invoice">Factura *</Label>
            <Select 
              value={formData.invoice_id?.toString() || ''} 
              onValueChange={handleInvoiceChange}
              disabled={!!initialInvoiceId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione una factura" />
              </SelectTrigger>
              <SelectContent>
                {invoices.map((invoice) => (
                  <SelectItem key={invoice.id} value={invoice.id.toString()}>
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col">
                        <span className="font-medium">{invoice.number}</span>
                        <span className="text-sm text-muted-foreground">{invoice.clientName}</span>
                      </div>
                      <div className="text-right ml-4">
                        <div className="font-medium">{formatCurrency(invoice.remainingBalance)}</div>
                        <div className="text-xs text-muted-foreground">Pendiente</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.invoice_id && (
              <p className="text-sm text-red-600">{errors.invoice_id}</p>
            )}
          </div>

          {/* Información de la factura seleccionada */}
          {selectedInvoice && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div><strong>Cliente:</strong> {selectedInvoice.clientName}</div>
                  <div><strong>Total Factura:</strong> {formatCurrency(selectedInvoice.total)}</div>
                  <div><strong>Saldo Pendiente:</strong> {formatCurrency(selectedInvoice.remainingBalance)}</div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Monto */}
          <div className="space-y-2">
            <Label htmlFor="amount">Monto del Pago *</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="1"
              value={formData.amount || ''}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="Ingrese el monto"
              className="text-lg font-medium"
            />
            {errors.amount && (
              <p className="text-sm text-red-600">{errors.amount}</p>
            )}
            {formData.amount > 0 && (
              <p className="text-sm text-muted-foreground">
                Monto: {formatCurrency(formData.amount)}
              </p>
            )}
          </div>

          {/* Método de Pago */}
          <div className="space-y-2">
            <Label htmlFor="payment_method">Método de Pago *</Label>
            <Select value={formData.payment_method} onValueChange={(value) => handleFieldChange('payment_method', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione método de pago" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  return (
                    <SelectItem key={method.value} value={method.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {method.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {errors.payment_method && (
              <p className="text-sm text-red-600">{errors.payment_method}</p>
            )}
          </div>

          {/* Fecha de Pago */}
          <div className="space-y-2">
            <Label htmlFor="payment_date">Fecha de Pago *</Label>
            <Input
              id="payment_date"
              type="date"
              value={formData.payment_date}
              onChange={(e) => handleFieldChange('payment_date', e.target.value)}
            />
            {errors.payment_date && (
              <p className="text-sm text-red-600">{errors.payment_date}</p>
            )}
          </div>

          {/* Número de Referencia */}
          <div className="space-y-2">
            <Label htmlFor="reference_number">Número de Referencia</Label>
            <Input
              id="reference_number"
              type="text"
              value={formData.reference_number}
              onChange={(e) => handleFieldChange('reference_number', e.target.value)}
              placeholder="Ej: 123456789, CHQ-001, etc."
            />
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              placeholder="Notas adicionales sobre el pago..."
              rows={3}
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Registrando...
                </>
              ) : (
                <>
                  <Receipt className="h-4 w-4 mr-2" />
                  Registrar Pago
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 