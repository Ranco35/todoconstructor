'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  updateProductStockInWarehouseAction,
  removeProductFromWarehouseAction 
} from '@/actions/configuration/warehouse-assignment-actions';

interface ProductWarehouse {
  id: number;
  warehouseId: number;
  productId: number;
  quantity: number;
  minStock: number;
  maxStock: number;
  Warehouse: {
    id: number;
    name: string;
    location: string;
    type: string;
  };
}

interface ProductWarehouseListProps {
  productId: number;
  productName: string;
  warehouses: ProductWarehouse[];
  onUpdate?: () => void;
}

export default function ProductWarehouseList({ 
  productId, 
  productName, 
  warehouses, 
  onUpdate 
}: ProductWarehouseListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editData, setEditData] = useState<{
    quantity: number;
    minStock: number;
    maxStock: number;
  }>({ quantity: 0, minStock: 0, maxStock: 100 });

  const handleEdit = (warehouse: ProductWarehouse) => {
    setEditingId(warehouse.id);
    setEditData({
      quantity: warehouse.quantity,
      minStock: warehouse.minStock,
      maxStock: warehouse.maxStock
    });
  };

  const handleSave = async (warehouse: ProductWarehouse) => {
    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('productId', productId.toString());
      formData.append('warehouseId', warehouse.warehouseId.toString());
      formData.append('quantity', editData.quantity.toString());
      formData.append('minStock', editData.minStock.toString());
      formData.append('maxStock', editData.maxStock.toString());

      const result = await updateProductStockInWarehouseAction(formData);
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setEditingId(null);
        onUpdate?.();
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (warehouse: ProductWarehouse) => {
    if (!confirm(`¿Estás seguro de que quieres remover "${productName}" de la bodega "${warehouse.Warehouse.name}"?`)) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('productId', productId.toString());
      formData.append('warehouseId', warehouse.warehouseId.toString());

      const result = await removeProductFromWarehouseAction(formData);
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        onUpdate?.();
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (quantity: number, minStock: number) => {
    if (quantity === 0) return { status: 'Sin Stock', color: 'bg-red-100 text-red-800' };
    if (quantity < minStock) return { status: 'Stock Bajo', color: 'bg-orange-100 text-orange-800' };
    return { status: 'Stock OK', color: 'bg-green-100 text-green-800' };
  };

  if (warehouses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏭 Bodegas Asignadas
            <Badge variant="secondary">{productName}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">📦</div>
            <p>Este producto no está asignado a ninguna bodega</p>
            <p className="text-sm">Usa el formulario de asignación para agregarlo a una bodega</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🏭 Bodegas Asignadas
          <Badge variant="secondary">{productName}</Badge>
          <Badge variant="outline">{warehouses.length} bodega{warehouses.length !== 1 ? 's' : ''}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Mensajes */}
        {message && (
          <div className={`p-3 rounded-md mb-4 ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          {warehouses.map(warehouse => {
            const stockStatus = getStockStatus(warehouse.quantity, warehouse.minStock);
            const isEditing = editingId === warehouse.id;

            return (
              <div key={warehouse.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{warehouse.Warehouse.name}</h4>
                    <p className="text-sm text-gray-600">
                      {warehouse.Warehouse.location} • Tipo: {warehouse.Warehouse.type}
                    </p>
                  </div>
                  <Badge className={stockStatus.color}>
                    {stockStatus.status}
                  </Badge>
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-sm">Cantidad actual</Label>
                        <Input
                          type="number"
                          min="0"
                          value={editData.quantity}
                          onChange={(e) => setEditData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Stock mínimo</Label>
                        <Input
                          type="number"
                          min="0"
                          value={editData.minStock}
                          onChange={(e) => setEditData(prev => ({ ...prev, minStock: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Stock máximo</Label>
                        <Input
                          type="number"
                          min="0"
                          value={editData.maxStock}
                          onChange={(e) => setEditData(prev => ({ ...prev, maxStock: parseInt(e.target.value) || 100 }))}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSave(warehouse)}
                        disabled={loading}
                      >
                        {loading ? 'Guardando...' : 'Guardar'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(null)}
                        disabled={loading}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Cantidad actual:</span> {warehouse.quantity}
                      </div>
                      <div>
                        <span className="font-medium">Stock mínimo:</span> {warehouse.minStock}
                      </div>
                      <div>
                        <span className="font-medium">Stock máximo:</span> {warehouse.maxStock}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(warehouse)}
                        disabled={loading}
                      >
                        ✏️ Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemove(warehouse)}
                        disabled={loading}
                      >
                        🗑️ Remover
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
} 