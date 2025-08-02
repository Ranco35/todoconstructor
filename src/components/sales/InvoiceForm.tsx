'use client';

import React, { useState, useEffect } from 'react';
import { createInvoice, CreateInvoiceInput, Invoice } from '@/actions/sales/invoices/create';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Calculator, Save, X } from 'lucide-react';
import ClientSelector from '../clients/ClientSelector';
import ProductSelector from './ProductSelector';

interface InvoiceFormProps {
  onSuccess?: (invoice: Invoice) => void;
  onCancel?: () => void;
  budgetData?: {
    id: number;
    client_id: number;
    clientName: string;
    lines: Array<{
      description: string;
      quantity: number;
      unit_price: number;
      discount_percent: number;
      subtotal: number;
    }>;
    total: number;
  };
}

interface InvoiceLine {
  product_id?: number;
  product_name?: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  taxes: number[];
  subtotal: number;
}

const INVOICE_STATUSES = [
  { value: 'draft', label: 'Borrador', color: 'bg-gray-100 text-gray-800' },
  { value: 'sent', label: 'Enviada', color: 'bg-blue-100 text-blue-800' },
  { value: 'paid', label: 'Pagada', color: 'bg-green-100 text-green-800' },
  { value: 'overdue', label: 'Vencida', color: 'bg-red-100 text-red-800' },
  { value: 'cancelled', label: 'Cancelada', color: 'bg-gray-100 text-gray-800' }
];

export default function InvoiceForm({ onSuccess, onCancel, budgetData }: InvoiceFormProps) {
  const [loading, setLoading] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [clientId, setClientId] = useState<number | null>(budgetData?.client_id || null);
  const [status, setStatus] = useState('draft');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Inicializar con datos de presupuesto si se proporciona
  useEffect(() => {
    if (budgetData) {
      setLines(budgetData.lines.map(line => ({
        description: line.description,
        quantity: line.quantity,
        unit_price: line.unit_price,
        discount_percent: line.discount_percent,
        taxes: [19], // IVA por defecto
        subtotal: line.subtotal
      })));
    } else {
      // Línea vacía inicial
      setLines([{
        product_id: undefined,
        product_name: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        discount_percent: 0,
        taxes: [19],
        subtotal: 0
      }]);
    }

    // Generar número de factura automático
    if (!budgetData) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
      setInvoiceNumber(`F${year}${month}${day}-${time}`);
    }

    // Fecha de vencimiento por defecto (30 días)
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 30);
    setDueDate(defaultDueDate.toISOString().split('T')[0]);
  }, [budgetData]);

  const calculateSubtotal = (quantity: number, unitPrice: number, discountPercent: number): number => {
    const subtotalBeforeDiscount = quantity * unitPrice;
    const discountAmount = subtotalBeforeDiscount * (discountPercent / 100);
    return subtotalBeforeDiscount - discountAmount;
  };

  const updateLine = (index: number, field: keyof InvoiceLine, value: any) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    
    // Recalcular subtotal si cambian cantidad, precio o descuento
    if (['quantity', 'unit_price', 'discount_percent'].includes(field)) {
      const line = newLines[index];
      newLines[index].subtotal = calculateSubtotal(line.quantity, line.unit_price, line.discount_percent);
    }
    
    setLines(newLines);
  };

  const addLine = () => {
    setLines([...lines, {
      product_id: undefined,
      product_name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      discount_percent: 0,
      taxes: [19],
      subtotal: 0
    }]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== index));
    }
  };

  const calculateTotal = (): number => {
    return lines.reduce((total, line) => total + line.subtotal, 0);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!invoiceNumber.trim()) {
      newErrors.number = 'El número de factura es obligatorio';
    }

    if (!clientId) {
      newErrors.client = 'Debe seleccionar un cliente';
    }

    if (lines.length === 0) {
      newErrors.lines = 'Debe agregar al menos una línea';
    }

    lines.forEach((line, index) => {
      if (!line.description.trim()) {
        newErrors[`line_${index}_description`] = 'La descripción es obligatoria';
      }
      if (line.quantity <= 0) {
        newErrors[`line_${index}_quantity`] = 'La cantidad debe ser mayor a 0';
      }
      if (line.unit_price < 0) {
        newErrors[`line_${index}_price`] = 'El precio no puede ser negativo';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const invoiceInput: CreateInvoiceInput = {
        number: invoiceNumber,
        client_id: clientId,
        budget_id: budgetData?.id,
        status,
        total: calculateTotal(),
        currency: 'CLP',
        due_date: dueDate,
        notes,
        payment_terms: paymentTerms,
        lines
      };

      const result = await createInvoice(invoiceInput);
      
      if (result.success && result.data) {
        onSuccess?.(result.data);
      } else {
        setErrors({ general: result.error || 'Error al crear la factura' });
      }
    } catch (error) {
      setErrors({ general: 'Error inesperado al crear la factura' });
    } finally {
      setLoading(false);
    }
  };

  const selectedStatus = INVOICE_STATUSES.find(s => s.value === status);
  const total = calculateTotal();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {budgetData ? 'Convertir Presupuesto a Factura' : 'Nueva Factura'}
          </h1>
          <p className="text-gray-600 mt-1">
            {budgetData ? `Presupuesto #${budgetData.id}` : 'Crear una nueva factura para el cliente'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedStatus && (
            <Badge className={selectedStatus.color}>
              {selectedStatus.label}
            </Badge>
          )}
          <div className="text-right">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(total)}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Principal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Información de la Factura
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="number">Número de Factura *</Label>
              <Input
                id="number"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="F000001"
                className={errors.number ? 'border-red-500' : ''}
              />
              {errors.number && <p className="text-red-500 text-sm mt-1">{errors.number}</p>}
            </div>

            <div>
              <Label htmlFor="client">Cliente *</Label>
              <ClientSelector
                value={clientId || undefined}
                onValueChange={(value) => setClientId(value || null)}
                placeholder="Seleccionar cliente..."
                disabled={!!budgetData}
                className={errors.client ? 'border-red-500' : ''}
              />
              {errors.client && <p className="text-red-500 text-sm mt-1">{errors.client}</p>}
            </div>

            <div>
              <Label htmlFor="status">Estado</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVOICE_STATUSES.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dueDate">Fecha de Vencimiento</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="paymentTerms">Condiciones de Pago</Label>
              <Input
                id="paymentTerms"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                placeholder="30 días"
              />
            </div>
          </CardContent>
        </Card>

        {/* Líneas de Factura */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Líneas de Factura</CardTitle>
              <Button type="button" onClick={addLine} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Línea
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lines.map((line, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-start">
                    <div className="md:col-span-2">
                      <Label>Producto</Label>
                      <ProductSelector
                        onSelect={(product) => {
                          updateLine(index, 'product_id', product.id);
                          updateLine(index, 'product_name', product.name);
                          updateLine(index, 'description', product.name);
                          updateLine(index, 'unit_price', product.salePrice);
                        }}
                        placeholder="Buscar producto..."
                        selectedProductId={line.product_id?.toString()}
                        className="mb-2"
                      />
                      <Label>Descripción *</Label>
                      <Textarea
                        value={line.description}
                        onChange={(e) => updateLine(index, 'description', e.target.value)}
                        placeholder="Descripción del producto/servicio"
                        rows={2}
                        className={errors[`line_${index}_description`] ? 'border-red-500' : ''}
                      />
                      {errors[`line_${index}_description`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`line_${index}_description`]}</p>
                      )}
                    </div>

                    <div>
                      <Label>Cantidad *</Label>
                      <Input
                        type="number"
                        value={line.quantity}
                        onChange={(e) => updateLine(index, 'quantity', Number(e.target.value))}
                        min="0.01"
                        step="0.01"
                        className={errors[`line_${index}_quantity`] ? 'border-red-500' : ''}
                      />
                      {errors[`line_${index}_quantity`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`line_${index}_quantity`]}</p>
                      )}
                    </div>

                    <div>
                      <Label>Precio Unitario *</Label>
                      <Input
                        type="number"
                        value={line.unit_price}
                        onChange={(e) => updateLine(index, 'unit_price', Number(e.target.value))}
                        min="0"
                        step="0.01"
                        className={errors[`line_${index}_price`] ? 'border-red-500' : ''}
                      />
                      {errors[`line_${index}_price`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`line_${index}_price`]}</p>
                      )}
                    </div>

                    <div>
                      <Label>Descuento %</Label>
                      <Input
                        type="number"
                        value={line.discount_percent}
                        onChange={(e) => updateLine(index, 'discount_percent', Number(e.target.value))}
                        min="0"
                        max="100"
                        step="0.01"
                      />
                    </div>

                    <div className="flex items-end justify-between">
                      <div>
                        <Label>Subtotal</Label>
                        <p className="text-lg font-semibold text-blue-600">
                          {formatCurrency(line.subtotal)}
                        </p>
                      </div>
                      {lines.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeLine(index)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {errors.lines && <p className="text-red-500 text-sm mt-2">{errors.lines}</p>}
          </CardContent>
        </Card>

        {/* Notas */}
        <Card>
          <CardHeader>
            <CardTitle>Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Acciones */}
        <div className="flex items-center justify-between">
          <div>
            {errors.general && (
              <p className="text-red-500 text-sm">{errors.general}</p>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Guardando...' : (budgetData ? 'Convertir a Factura' : 'Crear Factura')}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
} 