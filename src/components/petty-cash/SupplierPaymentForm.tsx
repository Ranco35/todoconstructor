'use client';

import { useState, useEffect } from 'react';
import { createSupplierPayment } from '@/actions/configuration/petty-cash-actions';
import { getPartTimeSuppliers } from '@/actions/configuration/suppliers-actions';

interface SupplierPaymentFormProps {
  sessionId: number;
  userId: string;
  userName: string;
  onClose: () => void;
}

interface SupplierPaymentFormData {
  supplierId: number | null;
  amount: number;
  description: string;
  costCenterId: number | null;
  paymentMethod: 'cash' | 'transfer' | 'card' | 'other';
  bankReference?: string;
  bankAccount?: string;
  receiptNumber?: string;
  notes?: string;
}

interface Supplier {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  taxId?: string | null;
  supplierRank?: string | null;
  isActive?: boolean;
  notes?: string | null;
  companyType?: string | null;
}

interface CostCenter {
  id: number;
  name: string;
  code?: string | null;
  description?: string | null;
}

export default function SupplierPaymentForm({ 
  sessionId, 
  userId, 
  userName, 
  onClose 
}: SupplierPaymentFormProps) {
  const [formData, setFormData] = useState<SupplierPaymentFormData>({
    supplierId: null,
    amount: 0,
    description: '',
    costCenterId: null,
    paymentMethod: 'cash',
    bankReference: '',
    bankAccount: '',
    receiptNumber: '',
    notes: ''
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const suppliersData = await getPartTimeSuppliers();
      setSuppliers(suppliersData || []);
      
      console.log('🔄 [SupplierPaymentForm] Cargando centros de costo...');
      const res = await fetch('/api/cost-centers', { cache: 'no-store' });
      const json = await res.json();
      const costCenters = Array.isArray(json) ? json : (json.costCenters || []);
      
      console.log('✅ [SupplierPaymentForm] Centros de costo cargados:', costCenters.map(cc => ({
        id: cc.id,
        name: cc.name,
        code: cc.code,
        isActive: cc.isActive
      })));
      
      // Log detallado de cada centro de costo
      console.log('📋 [SupplierPaymentForm] Detalle completo de centros de costo:');
      costCenters.forEach((cc, index) => {
        console.log(`  ${index + 1}. ID: ${cc.id}, Nombre: "${cc.name}", Código: "${cc.code || 'Sin código'}", Activo: ${cc.isActive}`);
      });
      
      setCostCenters(costCenters);
    } catch (error) {
      console.error('❌ [SupplierPaymentForm] Error fetching data:', error);
      setSuppliers([]);
      setCostCenters([]);
      alert('Error cargando datos de proveedores y centros de costo');
    }
  };

  const handleInputChange = (field: keyof SupplierPaymentFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Log específico para costCenterId
    if (field === 'costCenterId') {
      const selectedCostCenter = costCenters.find(cc => cc.id === value);
      console.log('🎯 [SupplierPaymentForm] Centro de costo seleccionado:', {
        costCenterId: value,
        costCenterName: selectedCostCenter?.name || 'No encontrado',
        costCenterCode: selectedCostCenter?.code || 'Sin código',
        costCenterActive: selectedCostCenter?.isActive,
        existsInList: !!selectedCostCenter,
        totalCostCenters: costCenters.length
      });
    }
    
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.supplierId) {
      newErrors.supplierId = 'Debes seleccionar un proveedor';
    }

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'El monto debe ser mayor a 0';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    if (!formData.costCenterId) {
      newErrors.costCenterId = 'Debes seleccionar un centro de costo';
    }

    if (formData.paymentMethod === 'transfer' && !formData.bankReference?.trim()) {
      newErrors.bankReference = 'La referencia bancaria es requerida para transferencias';
    }

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
      const formDataToSend = new FormData();
      formDataToSend.append('sessionId', sessionId.toString());
      formDataToSend.append('supplierId', formData.supplierId!.toString());
      formDataToSend.append('amount', formData.amount.toString());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('costCenterId', formData.costCenterId!.toString());
      formDataToSend.append('paymentMethod', formData.paymentMethod);
      formDataToSend.append('bankReference', formData.bankReference || '');
      formDataToSend.append('bankAccount', formData.bankAccount || '');
      formDataToSend.append('receiptNumber', formData.receiptNumber || '');
      formDataToSend.append('notes', formData.notes || '');

      const result = await createSupplierPayment(formDataToSend);
      
      if (result.success) {
        onClose();
        // Opcional: mostrar mensaje de éxito
        alert('Pago a proveedor registrado exitosamente');
      } else {
        alert(result.error || 'Error al registrar el pago');
      }
    } catch (error) {
      console.error('Error registering supplier payment:', error);
      alert('Error al registrar el pago');
    } finally {
      setLoading(false);
    }
  };

  const selectedSupplier = suppliers?.find(s => s.id === formData.supplierId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                💰 Pago a Proveedores Part-Time
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                <strong>Usuario:</strong> {userName} | <strong>Sesión:</strong> {sessionId}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Solo proveedores tipo PART-TIME disponibles para pago
              </p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Proveedor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proveedor Part-Time <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.supplierId || ''}
                onChange={(e) => handleInputChange('supplierId', e.target.value ? parseInt(e.target.value) : null)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.supplierId ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Seleccionar proveedor part-time</option>
                {suppliers?.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                    {supplier.taxId && ` (${supplier.taxId})`}
                    {supplier.phone && ` - ${supplier.phone}`}
                  </option>
                )) || []}
              </select>
              {errors.supplierId && (
                <p className="mt-1 text-sm text-red-600">{errors.supplierId}</p>
              )}
            </div>

            {/* Información del proveedor seleccionado */}
            {selectedSupplier && (
              <div className="bg-blue-50 rounded-lg p-4 my-4">
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <div>
                    <span className="font-semibold text-blue-900">Nombre:</span> {selectedSupplier.name}
                  </div>
                  <div>
                    <span className="font-semibold text-blue-900 ml-0 md:ml-6">Tipo:</span> <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold mr-2">{selectedSupplier.supplierRank}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-blue-900 ml-0 md:ml-6">Tipo de Proveedor:</span> <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
                      {selectedSupplier.companyType === 'PERSONA'
                        ? 'Persona Natural'
                        : selectedSupplier.companyType === 'EMPRESA'
                          ? 'Empresa'
                          : selectedSupplier.companyType}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Monto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto del Pago <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                  className={`w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.amount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                  min="0"
                  step="100"
                  required
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
              )}
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción del Pago <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                rows={3}
                placeholder="Ej: Pago por servicios de limpieza del mes de junio"
                required
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Centro de Costo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Centro de Costo <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.costCenterId !== null ? formData.costCenterId.toString() : ''}
                onChange={(e) => handleInputChange('costCenterId', e.target.value ? parseInt(e.target.value) : null)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.costCenterId ? 'border-red-500' : 'border-gray-300'}`}
                required
              >
                <option value="">Seleccionar centro de costo</option>
                {costCenters?.map((costCenter) => (
                  <option key={costCenter.id} value={costCenter.id.toString()}>
                    {costCenter.name}
                    {costCenter.code && ` (${costCenter.code})`}
                  </option>
                )) || []}
              </select>
              {errors.costCenterId && (
                <p className="mt-1 text-sm text-red-600">{errors.costCenterId}</p>
              )}
            </div>

            {/* Método de Pago */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Método de Pago <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => handleInputChange('paymentMethod', e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="cash">Efectivo</option>
                <option value="transfer">Transferencia</option>
                <option value="card">Tarjeta</option>
                <option value="other">Otro</option>
              </select>
            </div>

            {/* Campos condicionales para transferencia */}
            {formData.paymentMethod === 'transfer' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Referencia Bancaria <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.bankReference}
                    onChange={(e) => handleInputChange('bankReference', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.bankReference ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Número de transferencia o referencia"
                    required
                  />
                  {errors.bankReference && (
                    <p className="mt-1 text-sm text-red-600">{errors.bankReference}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cuenta Bancaria
                  </label>
                  <input
                    type="text"
                    value={formData.bankAccount}
                    onChange={(e) => handleInputChange('bankAccount', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Número de cuenta (opcional)"
                  />
                </div>
              </>
            )}

            {/* Número de Recibo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Recibo
              </label>
              <input
                type="text"
                value={formData.receiptNumber}
                onChange={(e) => handleInputChange('receiptNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Número de recibo o comprobante (opcional)"
              />
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas Adicionales
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Información adicional sobre el pago (opcional)"
              />
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Registrando...' : 'Registrar Pago'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 