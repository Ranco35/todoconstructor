'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, Package } from 'lucide-react';
import DirectProductSearch from './DirectProductSearch';
import { ProductFrontend } from '@/lib/product-mapper';

interface ProductSelectorForInvoiceProps {
  onProductSelect: (product: ProductFrontend) => void;
  selectedProducts?: ProductFrontend[];
  disabled?: boolean;
}

export default function ProductSelectorForInvoice({ 
  onProductSelect, 
  selectedProducts = [],
  disabled = false 
}: ProductSelectorForInvoiceProps) {
  const [showSelector, setShowSelector] = useState(false);
  
  // Debug
  console.log('🔍 ProductSelector recibió', selectedProducts.length, 'productos seleccionados');

  const handleProductSelect = (product: ProductFrontend) => {
    // Verificar que no esté ya en la lista
    const isAlreadySelected = selectedProducts.some(p => p.id === product.id);
    
    if (!isAlreadySelected) {
      onProductSelect(product);
      setShowSelector(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Botón para abrir selector */}
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-gray-700">Seleccionar Producto</h4>
        <Button
          type="button"
          onClick={() => setShowSelector(!showSelector)}
          disabled={disabled}
          className="bg-orange-600 hover:bg-orange-700 text-white"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          {showSelector ? 'Cerrar Buscador' : 'Buscar Producto'}
        </Button>
      </div>

      {/* Productos ya seleccionados en esta factura */}
      {selectedProducts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-orange-800 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Productos en esta factura ({selectedProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {selectedProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-2 bg-white border border-orange-200 rounded-lg text-sm"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Package className="h-3 w-3 text-orange-600 flex-shrink-0" />
                    <span className="font-medium text-gray-900 truncate">{product.name}</span>
                    {product.sku && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {product.sku}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-green-600 font-medium whitespace-nowrap ml-2">
                    Ya agregado
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selector de productos */}
      {showSelector && (
        <Card className="border-2 border-orange-300 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-orange-800">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Buscar Producto Directamente
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowSelector(false)}
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
                     <CardContent>
            <DirectProductSearch
              placeholder="Buscar producto por nombre, SKU, marca..."
              onProductSelect={handleProductSelect}
              selectedProducts={selectedProducts}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
} 