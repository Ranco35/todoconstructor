'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, DollarSign, Building2, Search } from 'lucide-react';
import { PurchaseOrderStatus } from '@/types/purchases';
import { getSuppliersForForms, getWarehousesForForms, type SupplierOption } from '@/actions/purchases/common';
import PurchaseOrderLinesWithTaxes from './PurchaseOrderLinesWithTaxes';
import { toast } from 'sonner';

interface OrderLineTax {
  id?: number;
  taxType: string;
  taxName: string;
  taxRate: number;
  taxAmount: number;
  isRetention: boolean;
  taxBase: number;
}

interface PurchaseOrderLine {
  tempId: string;
  productId?: number;
  productName: string;
  description: string;
  productCode?: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  subtotal: number;
  taxes: OrderLineTax[];
  lineTotal: number;
}

interface PurchaseOrderFormData {
  orderNumber: string;
  supplierId: number | null;
  warehouseId: number | null;
  expectedDeliveryDate: string;
  paymentTerms: string;
  currency: string;
  notes: string;
  subtotal: number;
  totalTaxes: number;
  total: number;
  lines: PurchaseOrderLine[];
}

interface PurchaseOrderFormProps {
  onSubmit: (data: PurchaseOrderFormData) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<PurchaseOrderFormData>;
  isEditing?: boolean;
}

export default function PurchaseOrderForm({ onSubmit, onCancel, initialData, isEditing = false }: PurchaseOrderFormProps) {
  // Función para generar número automático
  const generateOrderNumber = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const timestamp = Date.now().toString().slice(-4);
    return `OC${year}${month}${day}-${timestamp}`;
  };

  const [formData, setFormData] = useState<PurchaseOrderFormData>({
    orderNumber: initialData?.orderNumber || generateOrderNumber(),
    supplierId: initialData?.supplierId || null,
    warehouseId: initialData?.warehouseId || null,
    expectedDeliveryDate: initialData?.expectedDeliveryDate || '',
    paymentTerms: initialData?.paymentTerms || '30',
    currency: initialData?.currency || 'CLP',
    notes: initialData?.notes || '',
    subtotal: initialData?.subtotal || 0,
    totalTaxes: initialData?.totalTaxes || 0,
    total: initialData?.total || 0,
    lines: initialData?.lines || [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para datos dinámicos
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [warehouses, setWarehouses] = useState<{ id: number; name: string }[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<SupplierOption[]>([]);
  const [filteredWarehouses, setFilteredWarehouses] = useState<{ id: number; name: string }[]>([]);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [warehouseSearch, setWarehouseSearch] = useState('');
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [showWarehouseDropdown, setShowWarehouseDropdown] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Cargar datos al montar el componente
  useEffect(() => {
    const loadFormData = async () => {
      try {
        setLoadingData(true);
        const [suppliersData, warehousesData] = await Promise.all([
          getSuppliersForForms(),
          getWarehousesForForms()
        ]);
        
        setSuppliers(suppliersData);
        setWarehouses(warehousesData);
        setFilteredSuppliers(suppliersData);
        setFilteredWarehouses(warehousesData);

        // Si estamos editando, establecer los valores de búsqueda con los datos actuales
        if (formData.supplierId && suppliersData) {
          const selectedSupplier = suppliersData.find(s => s.id === formData.supplierId);
          if (selectedSupplier) {
            setSupplierSearch(selectedSupplier.name || '');
          }
        }

        if (formData.warehouseId && warehousesData) {
          const selectedWarehouse = warehousesData.find(w => w.id === formData.warehouseId);
          if (selectedWarehouse) {
            setWarehouseSearch(selectedWarehouse.name || '');
          }
        }
      } catch (error) {
        console.error('Error loading form data:', error);
        setError('Error al cargar los datos del formulario');
      } finally {
        setLoadingData(false);
      }
    };

    loadFormData();
  }, []);

  // Actualizar campos de búsqueda cuando cambien los IDs y tengamos los datos cargados
  useEffect(() => {
    if (formData.supplierId && suppliers.length > 0) {
      const selectedSupplier = suppliers.find(s => s.id === formData.supplierId);
      if (selectedSupplier && !supplierSearch) {
        setSupplierSearch(selectedSupplier.name || '');
      }
    }
  }, [formData.supplierId, suppliers]);

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
      const filtered = suppliers.filter(supplier => 
        supplier.name?.toLowerCase().includes(supplierSearch.toLowerCase()) ||
        supplier.vat?.toLowerCase().includes(supplierSearch.toLowerCase())
      );
      setFilteredSuppliers(filtered);
    }
  }, [supplierSearch, suppliers]);

  // Filtrar bodegas según búsqueda
  useEffect(() => {
    if (!warehouseSearch.trim()) {
      setFilteredWarehouses(warehouses);
    } else {
      const filtered = warehouses.filter(warehouse => 
        warehouse.name?.toLowerCase().includes(warehouseSearch.toLowerCase())
      );
      setFilteredWarehouses(filtered);
    }
  }, [warehouseSearch, warehouses]);

  const handleInputChange = (field: keyof PurchaseOrderFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSupplierSelect = (supplierId: number, supplierName: string) => {
    handleInputChange('supplierId', supplierId);
    setSupplierSearch(supplierName);
    setShowSupplierDropdown(false);
    // Re-render para mostrar el nombre del proveedor en el header
    setFormData(prev => ({ ...prev, supplierId }));
  };

  const handleWarehouseSelect = (warehouseId: number, warehouseName: string) => {
    handleInputChange('warehouseId', warehouseId);
    setWarehouseSearch(warehouseName);
    setShowWarehouseDropdown(false);
  };

  const handleLinesChange = (lines: PurchaseOrderLine[]) => {
    setFormData(prev => ({
      ...prev,
      lines
    }));
  };

  const handleTotalsChange = (totals: { subtotal: number; totalTaxes: number; total: number }) => {
    setFormData(prev => ({
      ...prev,
      subtotal: totals.subtotal,
      totalTaxes: totals.totalTaxes,
      total: totals.total
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.supplierId) {
      toast.error('Debe seleccionar un proveedor');
      return;
    }

    if (!formData.warehouseId) {
      toast.error('Debe seleccionar una bodega');
      return;
    }

    if (formData.lines.length === 0) {
      toast.error('Debe agregar al menos un producto');
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
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header con proveedor seleccionado */}
      {formData.supplierId && (
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-blue-600" />
          <div>
            <div className="font-medium text-gray-900">
              {suppliers.find(s => s.id === formData.supplierId)?.name}
            </div>
            {suppliers.find(s => s.id === formData.supplierId)?.vat && (
              <div className="text-sm text-gray-600">
                RUT: {suppliers.find(s => s.id === formData.supplierId)?.vat}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mostrar errores */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Principal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Información de la Orden
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="orderNumber">Número de Orden</Label>
                <Input
                  id="orderNumber"
                  value={formData.orderNumber}
                  readOnly
                  disabled
                  className="bg-gray-100 cursor-not-allowed"
                />
              </div>
              
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
                    placeholder="Buscar proveedor..."
                    className="pl-10"
                  />
                </div>
                {showSupplierDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredSuppliers.slice(0, 20).map((supplier) => (
                      <div
                        key={supplier.id}
                        className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                        onClick={() => handleSupplierSelect(supplier.id, supplier.name)}
                      >
                        <div className="font-medium">{supplier.name}</div>
                        <div className="text-sm text-gray-500">
                          {supplier.vat && `VAT/RUT: ${supplier.vat}`}
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
                <Label htmlFor="warehouseSearch">Bodega Destino *</Label>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="expectedDeliveryDate">Fecha de Entrega Esperada</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="expectedDeliveryDate"
                    type="date"
                    value={formData.expectedDeliveryDate}
                    onChange={(e) => handleInputChange('expectedDeliveryDate', e.target.value)}
                    className="pl-10"
                  />
                </div>
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
              
              <div>
                <Label htmlFor="currency">Moneda</Label>
                <Select 
                  value={formData.currency} 
                  onValueChange={(value) => handleInputChange('currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLP">Peso Chileno (CLP)</SelectItem>
                    <SelectItem value="USD">Dólar Americano (USD)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Líneas de productos con impuestos */}
        <PurchaseOrderLinesWithTaxes
          lines={formData.lines}
          supplierId={formData.supplierId || undefined}
          onChange={handleLinesChange}
          onTotalsChange={handleTotalsChange}
        />

        {/* Notas */}
        <Card>
          <CardHeader>
            <CardTitle>Notas y Observaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Agregue notas, observaciones o instrucciones especiales..."
              rows={3}
            />
          </CardContent>
        </Card>

        {/* Resumen Total */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Total de la Orden
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-sm text-gray-600">Subtotal</div>
                <div className="text-xl font-semibold">
                  ${formData.subtotal.toLocaleString('es-CL')}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Impuestos</div>
                <div className="text-xl font-semibold">
                  ${formData.totalTaxes.toLocaleString('es-CL')}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Total</div>
                <div className="text-2xl font-bold text-green-600">
                  ${formData.total.toLocaleString('es-CL')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botones de Acción */}
        <div className="flex justify-end gap-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            disabled={loading}
            className="px-8"
          >
            {loading ? 'Guardando...' : (isEditing ? 'Actualizar Orden' : 'Crear Orden')}
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}
      </form>

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
    </div>
  );
} 