'use client';

import React, { useState } from 'react';
import { createPettyCashPurchase } from '@/actions/configuration/petty-cash-actions';
import ProductSelector from './ProductSelector';
import CategorySelector from '../products/CategorySelector';
import CostCenterSelector from './CostCenterSelector';

interface Product {
  id: number;
  name: string;
  sku?: string | null;
  costprice?: number | null;
  saleprice?: number | null;
  Category?: {
    id: number;
    name: string;
  } | null;
}

interface PurchaseFormProps {
  sessionId: number;
  userId: number;
  userName: string;
  onClose: () => void;
}

export default function PurchaseForm({ sessionId, userId, userName, onClose }: PurchaseFormProps) {
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [supplier, setSupplier] = useState('');
  const [notes, setNotes] = useState('');
  
  // Nuevos estados para integración con sistema
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const [useExistingProduct, setUseExistingProduct] = useState(false);
  const [selectedCostCenter, setSelectedCostCenter] = useState<number | null>(null);

  const totalAmount = quantity && unitPrice ? parseFloat(quantity) * parseFloat(unitPrice) : 0;

  // Manejar selección de producto existente
  const handleProductSelect = (product: Product | null) => {
    setSelectedProduct(product);
    if (product) {
      setProductName(product.name);
      setUnitPrice(product.costprice?.toString() || '');
      setSupplier(''); // Ya no tenemos Supplier en la interfaz simplificada
      if (product.sku) {
        setDescription(`Compra de ${product.name} (${product.sku})`);
      } else {
        setDescription(`Compra de ${product.name}`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);

    const formData = new FormData();
    formData.append('sessionId', sessionId.toString());
    formData.append('requestedBy', userId.toString());
    formData.append('description', description);
    formData.append('productName', productName);
    formData.append('quantity', quantity);
    formData.append('unitPrice', unitPrice);
    formData.append('supplier', supplier);
    formData.append('notes', notes);
    
    // Agregar ID del producto si se seleccionó uno existente
    if (selectedProduct) {
      formData.append('productId', selectedProduct.id.toString());
    }

    // Agregar centro de costo si se seleccionó
    if (selectedCostCenter) {
      formData.append('costCenterId', selectedCostCenter.toString());
    }

    try {
      const result = await createPettyCashPurchase(formData);
      if (result.success) {
        onClose();
        alert('Compra registrada y aprobada automáticamente. Inventario actualizado.');
      } else {
        alert(result.error || 'Error al registrar la compra');
      }
    } catch (error) {
      console.error('Error registering purchase:', error);
      alert('Error al registrar la compra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                🛒 Compra con Caja Chica
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                <strong>Usuario:</strong> {userName} | <strong>Sin límites - Se actualizará inventario automáticamente</strong>
              </p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Toggle para usar producto existente o crear nuevo */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="useExistingProduct"
                  checked={useExistingProduct}
                  onChange={(e) => {
                    setUseExistingProduct(e.target.checked);
                    if (!e.target.checked) {
                      setSelectedProduct(null);
                      setProductName('');
                      setUnitPrice('');
                      setSupplier('');
                      setDescription('');
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="useExistingProduct" className="text-sm font-medium text-gray-700">
                  Usar producto existente del sistema
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Marca esta opción para seleccionar un producto ya registrado en el inventario
              </p>
            </div>

            {/* Selector de categoría (para filtrar productos) */}
            {useExistingProduct && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtrar por Categoría (Opcional)
                </label>
                <CategorySelector
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  placeholder="Todas las categorías"
                />
              </div>
            )}

            {/* Selector de producto existente */}
            {useExistingProduct && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Producto del Sistema *
                </label>
                <ProductSelector
                  value={selectedProduct?.id}
                  onChange={handleProductSelect}
                  categoryFilter={selectedCategory}
                  placeholder="Seleccionar producto existente"
                />
                {selectedProduct && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800">
                      <strong>Producto seleccionado:</strong> {selectedProduct.name}
                      {selectedProduct.sku && ` (${selectedProduct.sku})`}
                      {selectedProduct.costprice && (
                        <span className="ml-2">• Precio costo: ${selectedProduct.costprice.toLocaleString()}</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción de la Compra *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe brevemente la compra..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Proveedor *
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nombre del proveedor o tienda"
                required
              />
            </div>

            {/* Selector de Centro de Costo */}
            <CostCenterSelector
              value={selectedCostCenter}
              onChange={setSelectedCostCenter}
              required={true}
              placeholder="Seleccionar centro de costo para esta compra"
            />

            {/* Nombre del producto - solo editable si no se usa producto existente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Producto *
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder={useExistingProduct ? "Se completará automáticamente" : "Nombre del producto"}
                required
                disabled={useExistingProduct}
              />
              {useExistingProduct && (
                <p className="text-xs text-gray-500 mt-1">
                  El nombre se completa automáticamente al seleccionar un producto
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad *
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="0.01"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio Unitario *
                </label>
                <input
                  type="number"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  step="0.01"
                  min="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {/* Total Amount Display */}
            {totalAmount > 0 && (
              <div className="p-3 rounded-lg border-2 bg-blue-50 border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Total de la compra:</span>
                  <span className="text-lg font-bold text-blue-600">
                    ${totalAmount.toLocaleString()}
                  </span>
                </div>
                <p className="text-blue-600 text-sm mt-1">
                  Sin límites configurados - Se procesará automáticamente
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas Adicionales
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Comentarios adicionales (opcional)"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <div className="text-blue-600 text-lg">ℹ️</div>
                <div className="text-blue-800 text-sm">
                  <strong>Información:</strong> Esta compra se procesará automáticamente:
                  <ul className="mt-1 ml-4 list-disc text-xs">
                    <li>Se descontará del efectivo de la caja</li>
                    {selectedProduct ? (
                      <li>Se actualizará automáticamente el stock del producto existente</li>
                    ) : (
                      <li>Se registrará como producto nuevo (podrás agregarlo al inventario después)</li>
                    )}
                    <li>Se asociará al centro de costo seleccionado para reportes contables</li>
                    <li>Quedará disponible para reportes y auditorías</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                disabled={loading || !description.trim() || !productName.trim() || !supplier.trim() || !quantity || !unitPrice || !selectedCostCenter}
              >
                {loading ? 'Registrando...' : '🛒 Registrar Compra'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 