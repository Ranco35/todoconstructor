'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Save, X, Building2, FileText, Search, Cloud, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import PurchaseInvoiceLinesWithTaxes from './PurchaseInvoiceLinesWithTaxes';
import { getActiveSuppliers } from '@/actions/suppliers/get';
import { getAllWarehouses } from '@/actions/configuration/warehouse-actions';
// Eliminado useFormPersistence para manejar el estado localmente

interface InvoiceLineTax {
  id?: number;
  taxType: string;
  taxName: string;
  taxRate: number;
  taxAmount: number;
  isRetention: boolean;
  taxBase: number;
}

interface InvoiceLine {
  id?: number;
  productId?: number;
  description: string;
  productCode?: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  subtotal: number;
  taxes: InvoiceLineTax[];
  lineTotal: number;
}

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
  totalTaxes: number;
  total: number;
  notes: string;
  lines: InvoiceLine[];
}

interface PurchaseInvoiceFormWithTaxesProps {
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

export default function PurchaseInvoiceFormWithTaxes({
  initialData,
  isEditing = false,
  currentStatus = 'draft',
  onSubmit,
  onCancel
}: PurchaseInvoiceFormWithTaxesProps) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Estado local para el formulario
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
    totalTaxes: 0,
    total: 0,
    notes: '',
    lines: [],
    ...initialData
  });

  // Función para actualizar los datos del formulario
  const updateFormData = (updater: Partial<PurchaseInvoiceFormData> | ((prev: PurchaseInvoiceFormData) => PurchaseInvoiceFormData)) => {
    setFormData(prevData => {
      const newData = {
        ...prevData,
        ...(typeof updater === 'function' ? updater(prevData) : updater)
      };
      
      // Si se actualizan las líneas, recalcular totales
      if ('lines' in newData) {
        const subtotalNet = newData.lines.reduce((sum, line) => {
          const lineTotal = line.quantity * line.unitPrice * (1 - (line.discountPercent / 100));
          return sum + lineTotal;
        }, 0);
        
        const totalTaxes = newData.lines.reduce((sum, line) => {
          return sum + (line.taxes?.reduce((taxSum: number, tax: any) => taxSum + (tax.taxAmount || 0), 0) || 0);
        }, 0);
        
        const total = subtotalNet + totalTaxes;
        
        return {
          ...newData,
          subtotalNet: parseFloat(subtotalNet.toFixed(2)),
          totalTaxes: parseFloat(totalTaxes.toFixed(2)),
          total: parseFloat(total.toFixed(2))
        };
      }
      
      return newData;
    });
  };

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<any[]>([]);
  const [filteredWarehouses, setFilteredWarehouses] = useState<any[]>([]);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [warehouseSearch, setWarehouseSearch] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [showWarehouseDropdown, setShowWarehouseDropdown] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  // Actualizar campos de búsqueda cuando cambien los IDs y tengamos los datos cargados
  useEffect(() => {
    if (formData.supplierId && suppliers.length > 0) {
      const selectedSupplier = suppliers.find(s => s.id === formData.supplierId);
      if (selectedSupplier) {
        setSupplierSearch(selectedSupplier.name || selectedSupplier.displayName || '');
      }
    }
  }, [formData.supplierId, suppliers, initialData]);

  useEffect(() => {
    if (formData.warehouseId && warehouses.length > 0) {
      const selectedWarehouse = warehouses.find(w => w.id === formData.warehouseId);
      if (selectedWarehouse && !warehouseSearch) {
        setWarehouseSearch(selectedWarehouse.name || '');
      }
    }
  }, [formData.warehouseId, warehouses]);

  // Filtrar proveedores según búsqueda
  useEffect(() => {
    if (!supplierSearch.trim()) {
      setFilteredSuppliers(suppliers);
    } else {
      const searchTerm = supplierSearch.toLowerCase();
      const filtered = suppliers.filter(supplier => 
        (supplier.name?.toLowerCase().includes(searchTerm) || 
         supplier.displayName?.toLowerCase().includes(searchTerm) ||
         supplier.taxId?.toLowerCase().includes(searchTerm) ||
         supplier.email?.toLowerCase().includes(searchTerm) ||
         supplier.phone?.toLowerCase().includes(searchTerm))
      );
      setFilteredSuppliers(filtered);
    }
  }, [supplierSearch, suppliers]);

  // Filtrar bodegas según búsqueda
  useEffect(() => {
    if (!warehouseSearch.trim()) {
      setFilteredWarehouses(warehouses);
    } else {
      const searchTerm = warehouseSearch.toLowerCase();
      const filtered = warehouses.filter(warehouse => 
        warehouse.name?.toLowerCase().includes(searchTerm) ||
        warehouse.code?.toLowerCase().includes(searchTerm) ||
        warehouse.location?.toLowerCase().includes(searchTerm) ||
        warehouse.manager_name?.toLowerCase().includes(searchTerm)
      );
      setFilteredWarehouses(filtered);
    }
  }, [warehouseSearch, warehouses]);

  const loadInitialData = async () => {
    setLoadingData(true);
    try {
      const [suppliersData, warehousesData] = await Promise.all([
        getActiveSuppliers(),
        getAllWarehouses()
      ]);

      setSuppliers(suppliersData || []);
      setWarehouses(warehousesData || []);
      setFilteredSuppliers(suppliersData || []);
      setFilteredWarehouses(warehousesData || []);

      // Si estamos editando, establecer los valores de búsqueda con los datos actuales
      if (formData.supplierId && suppliersData) {
        const selectedSupplier = suppliersData.find(s => s.id === formData.supplierId);
        if (selectedSupplier) {
          setSupplierSearch(selectedSupplier.name || selectedSupplier.displayName || '');
        }
      }

      if (formData.warehouseId && warehousesData) {
        const selectedWarehouse = warehousesData.find(w => w.id === formData.warehouseId);
        if (selectedWarehouse) {
          setWarehouseSearch(selectedWarehouse.name || '');
        }
      }
      
      console.log('✅ Datos cargados:', {
        suppliers: suppliersData?.length || 0,
        warehouses: warehousesData?.length || 0,
        selectedSupplier: formData.supplierId,
        selectedWarehouse: formData.warehouseId
      });
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      toast.error('Error cargando proveedores y bodegas');
    } finally {
      setLoadingData(false);
    }
  };

  // Manejar cambios en los campos del formulario
  const handleInputChange = (
    nameOrEvent: string | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    value?: string | number
  ) => {
    let fieldName: string;
    let fieldValue: string | number;

    // Manejar ambos casos: con evento o con nombre/valor directo
    if (typeof nameOrEvent === 'string') {
      fieldName = nameOrEvent;
      fieldValue = value!;
    } else {
      // Es un evento
      const { name, value: eventValue } = nameOrEvent.target;
      fieldName = name;
      fieldValue = eventValue;
    }
    
    // Manejar campos numéricos
    const numericFields = ['subtotalNet', 'totalTaxes', 'total', 'paymentTerms'];
    const newValue = numericFields.includes(fieldName) ? 
      (typeof fieldValue === 'string' ? parseFloat(fieldValue) || 0 : fieldValue) : 
      fieldValue;
    
    // Actualizar el estado del formulario
    updateFormData(prev => ({
      ...prev,
      [fieldName]: newValue
    }));
    
    // Si se está cambiando el proveedor, forzar una actualización del formulario
    if (fieldName === 'supplierId') {
      console.log('Cambiando proveedor a:', newValue);
    }
  };

  const handleSupplierSelect = (supplierId: number, supplierName: string) => {
    const selectedSupplier = suppliers.find(s => s.id === supplierId);
    
    // Actualizar el estado del formulario con el nuevo proveedor
    updateFormData(prev => ({
      ...prev,
      supplierId,
      // Actualizar también los campos relacionados si es necesario
      supplierInvoiceNumber: prev.supplierInvoiceNumber || '',
      // Otros campos que puedan depender del proveedor
    }));
    
    // Actualizar la búsqueda y cerrar el dropdown
    setSupplierSearch(supplierName);
    setShowSupplierDropdown(false);
    
    console.log('Proveedor seleccionado:', {
      supplierId,
      supplierName,
      currentFormData: formData
    });
  };

  const handleWarehouseSelect = (warehouseId: number, warehouseName: string) => {
    updateFormData({ warehouseId });
    setWarehouseSearch(warehouseName);
    setShowWarehouseDropdown(false);
  };

  // Manejar cambios en las líneas de la factura
  const handleLinesChange = (lines: any[]) => {
    updateFormData({ lines });
    
    // Recalcular totales basado en las líneas
    const subtotalNet = lines.reduce((sum, line) => sum + (line.quantity * line.unitPrice * (1 - (line.discountPercent / 100))), 0);
    const totalTaxes = lines.reduce((sum, line) => sum + (line.taxes?.reduce((taxSum: number, tax: any) => taxSum + (tax.taxAmount || 0), 0) || 0), 0);
    const total = subtotalNet + totalTaxes;
    
    updateFormData({
      subtotalNet: parseFloat(subtotalNet.toFixed(2)),
      totalTaxes: parseFloat(totalTaxes.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    });
  };

  const handleTotalsChange = (totals: { subtotal: number; totalTaxes: number; total: number }) => {
    updateFormData({
      subtotalNet: totals.subtotal,
      totalTaxes: totals.totalTaxes,
      total: totals.total
    });
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      // No hay necesidad de limpiar el estado ya que el componente se desmontará
    } catch (error) {
      console.error('Error al guardar la factura:', error);
      toast.error('Error al guardar la factura. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Manejo del botón cancelar
  const handleCancel = () => {
    // Mostrar confirmación antes de cancelar
    if (window.confirm('¿Está seguro de que desea cancelar? Los cambios no guardados se perderán.')) {
      onCancel();
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

  if (loadingData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sección de mensajes de estado */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-blue-700">
            Complete el formulario y haga clic en 'Guardar' para registrar la factura.
          </span>
        </div>
      </div>

      {/* Header con estado y proveedor */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {formData.supplierId && (
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium text-gray-900">
                  {suppliers.find(s => s.id === formData.supplierId)?.name || 
                   suppliers.find(s => s.id === formData.supplierId)?.displayName}
                </div>
                {suppliers.find(s => s.id === formData.supplierId)?.vat && (
                  <div className="text-sm text-gray-600">
                    RUT: {suppliers.find(s => s.id === formData.supplierId)?.vat}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {isEditing && (
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-600">Estado:</span>
            {getCurrentStatusBadge()}
          </div>
        )}
      </div>

      {/* Información básica */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Información General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
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
            {/* Selector de Proveedor con Búsqueda */}
            <div className="relative">
              <Label htmlFor="supplierSearch">Proveedor *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="supplierSearch"
                  value={supplierSearch}
                  onChange={(e) => {
                    setSupplierSearch(e.target.value);
                    setShowSupplierDropdown(true);
                  }}
                  onFocus={() => setShowSupplierDropdown(true)}
                  placeholder="Buscar proveedor por nombre o VAT/RUT..."
                  className="pl-10"
                />
              </div>
              {showSupplierDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredSuppliers.slice(0, 20).map((supplier) => (
                    <div
                      key={supplier.id}
                      className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                      onClick={() => handleSupplierSelect(supplier.id, supplier.name || supplier.displayName)}
                    >
                      <div className="font-medium">{supplier.name || supplier.displayName}</div>
                      <div className="text-sm text-gray-500">
                        {supplier.vat && `VAT/RUT: ${supplier.vat}`}
                        {supplier.email && ` | ${supplier.email}`}
                      </div>
                    </div>
                  ))}
                  {filteredSuppliers.length === 0 && (
                    <div className="p-3 text-gray-500 text-center">
                      No se encontraron proveedores
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selector de Bodega con Búsqueda */}
            <div className="relative">
              <Label htmlFor="warehouseSearch">Bodega *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="warehouseSearch"
                  value={warehouseSearch}
                  onChange={(e) => {
                    setWarehouseSearch(e.target.value);
                    setShowWarehouseDropdown(true);
                  }}
                  onFocus={() => setShowWarehouseDropdown(true)}
                  placeholder="Buscar bodega..."
                  className="pl-10"
                />
              </div>
              {showWarehouseDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {filteredWarehouses.map((warehouse) => (
                    <div
                      key={warehouse.id}
                      className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                      onClick={() => handleWarehouseSelect(warehouse.id, warehouse.name)}
                    >
                      <div className="font-medium">{warehouse.name}</div>
                    </div>
                  ))}
                  {filteredWarehouses.length === 0 && (
                    <div className="p-3 text-gray-500 text-center">
                      No se encontraron bodegas
                    </div>
                  )}
                </div>
              )}
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

      {/* Líneas de productos con impuestos */}
      <PurchaseInvoiceLinesWithTaxes
        lines={formData.lines}
        supplierId={formData.supplierId || undefined}
        onChange={handleLinesChange}
        onTotalsChange={handleTotalsChange}
      />

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
        <Button type="button" variant="outline" onClick={handleCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        
        <Button type="submit" disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Guardando...' : isEditing ? 'Actualizar Factura' : 'Crear Factura'}
        </Button>
      </div>

      {/* Click outside para cerrar dropdowns */}
      {(showSupplierDropdown || showWarehouseDropdown) && (
        <div 
          className="fixed inset-0 z-5"
          onClick={() => {
            setShowSupplierDropdown(false);
            setShowWarehouseDropdown(false);
          }}
        />
      )}
    </form>
  );
} 