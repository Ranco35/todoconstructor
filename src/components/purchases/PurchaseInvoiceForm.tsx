'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Save, X, Building2, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface PurchaseInvoiceFormData {
  invoiceNumber: string;
  supplierInvoiceNumber: string;
  supplierId: number | null;
  orderId?: number | null;
  warehouseId: number | null;
  issueDate: string;
  dueDate: string;
  paymentTerms: string;
  currency: string;
  subtotalNet: number;
  totalIva: number;
  total: number;
  notes: string;
  lines?: any[];
}

interface PurchaseInvoiceFormProps {
  initialData?: Partial<PurchaseInvoiceFormData>;
  isEditing?: boolean;
  currentStatus?: string;
  onSubmit: (data: PurchaseInvoiceFormData) => Promise<void>;
  onCancel: () => void;
}

const INVOICE_STATUSES = [
  { value: 'draft', label: 'Borrador', color: 'bg-gray-100 text-gray-800' },
  { value: 'approved', label: 'Aprobada', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'received', label: 'Recibida', color: 'bg-blue-100 text-blue-800' },
  { value: 'paid', label: 'Pagada', color: 'bg-green-100 text-green-800' },
];

export default function PurchaseInvoiceForm({
  initialData,
  isEditing = false,
  currentStatus = 'draft',
  onSubmit,
  onCancel
}: PurchaseInvoiceFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PurchaseInvoiceFormData>({
    invoiceNumber: '',
    supplierInvoiceNumber: '',
    supplierId: null,
    orderId: null,
    warehouseId: null,
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    paymentTerms: '30',
    currency: 'CLP',
    subtotalNet: 0,
    totalIva: 0,
    total: 0,
    notes: '',
    lines: [],
    ...initialData
  });

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  useEffect(() => {
    // Cargar proveedores y bodegas
    loadSuppliers();
    loadWarehouses();
  }, []);

  const loadSuppliers = async () => {
    try {
      // Simulamos carga de proveedores
      setSuppliers([
        { id: 1, name: 'Proveedor 1' },
        { id: 2, name: 'Proveedor 2' }
      ]);
    } catch (error) {
      console.error('Error cargando proveedores:', error);
    }
  };

  const loadWarehouses = async () => {
    try {
      // Simulamos carga de bodegas
      setWarehouses([
        { id: 1, name: 'Bodega Principal' },
        { id: 2, name: 'Bodega Secundaria' }
      ]);
    } catch (error) {
      console.error('Error cargando bodegas:', error);
    }
  };

  const handleInputChange = (field: keyof PurchaseInvoiceFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.supplierInvoiceNumber.trim()) {
      toast.error('El número de factura del proveedor es obligatorio');
      return;
    }

    if (!formData.supplierId) {
      toast.error('Debe seleccionar un proveedor');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error en submit:', error);
      toast.error('Error al procesar el formulario');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStatusBadge = () => {
    const status = INVOICE_STATUSES.find(s => s.value === currentStatus);
    if (!status) return null;
    
    return (
      <Badge className={status.color}>
        {status.label}
      </Badge>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header con estado */}
      {isEditing && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-600">Estado actual:</span>
            {getCurrentStatusBadge()}
          </div>
        </div>
      )}

      {/* Información básica */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Información General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoiceNumber">Número Interno</Label>
              <Input
                id="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                placeholder="Ej: FC250722-001"
                disabled={isEditing} // No editable en modo edición
              />
            </div>
            
            <div>
              <Label htmlFor="supplierInvoiceNumber">Número Factura Proveedor *</Label>
              <Input
                id="supplierInvoiceNumber"
                value={formData.supplierInvoiceNumber}
                onChange={(e) => handleInputChange('supplierInvoiceNumber', e.target.value)}
                placeholder="Número de factura del proveedor"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="supplierId">Proveedor *</Label>
              <Select 
                value={formData.supplierId?.toString() || ''} 
                onValueChange={(value) => handleInputChange('supplierId', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="warehouseId">Bodega</Label>
              <Select 
                value={formData.warehouseId?.toString() || ''} 
                onValueChange={(value) => handleInputChange('warehouseId', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar bodega" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fechas y términos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Fechas y Términos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="issueDate">Fecha Emisión</Label>
              <Input
                id="issueDate"
                type="date"
                value={formData.issueDate}
                onChange={(e) => handleInputChange('issueDate', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="dueDate">Fecha Vencimiento</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="paymentTerms">Términos de Pago (días)</Label>
              <Input
                id="paymentTerms"
                type="number"
                value={formData.paymentTerms}
                onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
                placeholder="30"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Montos */}
      <Card>
        <CardHeader>
          <CardTitle>Montos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="subtotalNet">Subtotal Neto</Label>
              <Input
                id="subtotalNet"
                type="number"
                step="0.01"
                value={formData.subtotalNet}
                onChange={(e) => handleInputChange('subtotalNet', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div>
              <Label htmlFor="totalIva">IVA</Label>
              <Input
                id="totalIva"
                type="number"
                step="0.01"
                value={formData.totalIva}
                onChange={(e) => handleInputChange('totalIva', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div>
              <Label htmlFor="total">Total</Label>
              <Input
                id="total"
                type="number"
                step="0.01"
                value={formData.total}
                onChange={(e) => handleInputChange('total', parseFloat(e.target.value) || 0)}
                className="font-bold"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notas */}
      <Card>
        <CardHeader>
          <CardTitle>Notas Adicionales</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Notas o comentarios adicionales..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        
        <Button type="submit" disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Guardando...' : isEditing ? 'Actualizar Factura' : 'Crear Factura'}
        </Button>
      </div>
    </form>
  );
}

