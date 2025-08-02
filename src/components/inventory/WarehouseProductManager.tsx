'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { bulkAssignProductsToWarehouseAction, updateProductStockInWarehouseAction, removeProductFromWarehouseAction } from '@/actions/configuration/warehouse-assignment-actions';
import { getUnassignedProducts } from '@/actions/configuration/warehouse-actions';

interface WarehouseProduct {
  id: number;
  warehouseId: number;
  productId: number;
  quantity: number;
  minStock: number;
  maxStock: number;
  Product: {
    id: number;
    name: string;
    sku?: string;
    barcode?: string;
    Category?: { name: string } | null;
    Supplier?: { name: string } | null;
  };
}

interface WarehouseProductManagerProps {
  warehouseId: number;
  warehouseName: string;
  assignedProducts: WarehouseProduct[];
  onUpdate?: () => void;
}

export default function WarehouseProductManager({ warehouseId, warehouseName, assignedProducts, onUpdate }: WarehouseProductManagerProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<{ quantity: number; minStock: number; maxStock: number }>({ quantity: 0, minStock: 0, maxStock: 100 });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [unassigned, setUnassigned] = useState<any[]>([]);
  const [selected, setSelected] = useState<{ [productId: number]: { quantity: number; minStock: number; maxStock: number; selected: boolean } }>({});
  const [search, setSearch] = useState('');

  // Cargar productos no asignados
  useEffect(() => {
    if (!showAdd) return;
    const load = async () => {
      const { data } = await getUnassignedProducts(warehouseId, { search });
      setUnassigned(data || []);
    };
    load();
  }, [showAdd, warehouseId, search]);

  // Edición de producto asignado
  const handleEdit = (wp: WarehouseProduct) => {
    setEditingId(wp.id);
    setEditData({ quantity: wp.quantity, minStock: wp.minStock, maxStock: wp.maxStock });
  };

  const handleSave = async (wp: WarehouseProduct) => {
    setLoading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('productId', wp.productId.toString());
      formData.append('warehouseId', warehouseId.toString());
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

  const handleRemove = async (wp: WarehouseProduct) => {
    if (!confirm(`¿Remover "${wp.Product.name}" de la bodega?`)) return;
    setLoading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('productId', wp.productId.toString());
      formData.append('warehouseId', warehouseId.toString());
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

  // Asignación masiva
  const handleBulkAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedProducts = Object.entries(selected).filter(([_, v]) => v.selected);
    if (selectedProducts.length === 0) {
      setMessage({ type: 'error', text: 'Selecciona al menos un producto' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('warehouseId', warehouseId.toString());
      selectedProducts.forEach(([productId, v]) => {
        formData.append('productIds', productId);
        formData.append('quantities', v.quantity.toString());
        formData.append('minStocks', v.minStock.toString());
        formData.append('maxStocks', v.maxStock.toString());
      });
      const result = await bulkAssignProductsToWarehouseAction(formData);
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        setShowAdd(false);
        setSelected({});
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

  // UI helpers
  const getStockStatus = (quantity: number, minStock: number) => {
    if (quantity === 0) return { status: 'Sin Stock', color: 'bg-red-100 text-red-800' };
    if (quantity < minStock) return { status: 'Stock Bajo', color: 'bg-orange-100 text-orange-800' };
    return { status: 'Stock OK', color: 'bg-green-100 text-green-800' };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📦 Productos en {warehouseName}
          <Badge variant="outline">{assignedProducts.length} productos</Badge>
          <Button size="sm" className="ml-auto" onClick={() => setShowAdd(v => !v)}>
            {showAdd ? 'Cerrar asignación' : 'Agregar productos'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {message && (
          <div className={`p-3 rounded-md mb-4 ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>{message.text}</div>
        )}
        {/* Tabla de productos asignados */}
        <div className="space-y-4 mb-8">
          {assignedProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">📦</div>
              <p>No hay productos asignados a esta bodega</p>
            </div>
          ) : assignedProducts.map(wp => {
            const stockStatus = getStockStatus(wp.quantity, wp.minStock);
            const isEditing = editingId === wp.id;
            return (
              <div key={wp.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{wp.Product.name}</h4>
                    <p className="text-sm text-gray-600">SKU: {wp.Product.sku || 'N/A'} • {wp.Product.Category?.name || 'Sin categoría'} • {wp.Product.Supplier?.name || 'Sin proveedor'}</p>
                  </div>
                  <Badge className={stockStatus.color}>{stockStatus.status}</Badge>
                </div>
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-sm">Cantidad actual</Label>
                        <Input type="number" min="0" value={editData.quantity} onChange={e => setEditData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))} />
                      </div>
                      <div>
                        <Label className="text-sm">Stock mínimo</Label>
                        <Input type="number" min="0" value={editData.minStock} onChange={e => setEditData(prev => ({ ...prev, minStock: parseInt(e.target.value) || 0 }))} />
                      </div>
                      <div>
                        <Label className="text-sm">Stock máximo</Label>
                        <Input type="number" min="0" value={editData.maxStock} onChange={e => setEditData(prev => ({ ...prev, maxStock: parseInt(e.target.value) || 100 }))} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSave(wp)} disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)} disabled={loading}>Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div><span className="font-medium">Cantidad actual:</span> {wp.quantity}</div>
                      <div><span className="font-medium">Stock mínimo:</span> {wp.minStock}</div>
                      <div><span className="font-medium">Stock máximo:</span> {wp.maxStock}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(wp)} disabled={loading}>✏️ Editar</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleRemove(wp)} disabled={loading}>🗑️ Remover</Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {/* Formulario de asignación masiva */}
        {showAdd && (
          <form onSubmit={handleBulkAssign} className="space-y-4">
            <div className="mb-2">
              <Label>Buscar producto</Label>
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nombre, SKU o código de barras" />
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {unassigned.length === 0 ? (
                <div className="text-gray-500 text-sm">No hay productos disponibles para asignar</div>
              ) : unassigned.map(product => (
                <div key={product.id} className="flex items-center gap-3 border rounded-lg p-3">
                  <Checkbox checked={!!selected[product.id]?.selected} onCheckedChange={checked => setSelected(prev => ({ ...prev, [product.id]: { ...prev[product.id], selected: checked, quantity: prev[product.id]?.quantity || 0, minStock: prev[product.id]?.minStock || 0, maxStock: prev[product.id]?.maxStock || 100 } }))} />
                  <div className="flex-1">
                    <span className="font-medium">{product.name}</span>
                    <span className="ml-2 text-xs text-gray-500">SKU: {product.sku || 'N/A'}</span>
                    <span className="ml-2 text-xs text-gray-500">{product.Category?.name || 'Sin categoría'}</span>
                  </div>
                  {selected[product.id]?.selected && (
                    <div className="flex gap-2">
                      <Input type="number" min="0" value={selected[product.id]?.quantity || 0} onChange={e => setSelected(prev => ({ ...prev, [product.id]: { ...prev[product.id], quantity: parseInt(e.target.value) || 0 } }))} className="w-20" placeholder="Cantidad" />
                      <Input type="number" min="0" value={selected[product.id]?.minStock || 0} onChange={e => setSelected(prev => ({ ...prev, [product.id]: { ...prev[product.id], minStock: parseInt(e.target.value) || 0 } }))} className="w-20" placeholder="Mínimo" />
                      <Input type="number" min="0" value={selected[product.id]?.maxStock || 100} onChange={e => setSelected(prev => ({ ...prev, [product.id]: { ...prev[product.id], maxStock: parseInt(e.target.value) || 100 } }))} className="w-20" placeholder="Máximo" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Button type="submit" disabled={loading || Object.values(selected).filter(v => v.selected).length === 0}>{loading ? 'Asignando...' : 'Asignar productos seleccionados'}</Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
} 