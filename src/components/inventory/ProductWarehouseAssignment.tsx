'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  assignProductToWarehouseAction, 
  assignProductToMultipleWarehousesAction,
  quickAssignProductAction 
} from '@/actions/configuration/warehouse-assignment-actions';
import { getWarehouses } from '@/actions/configuration/warehouse-actions';
import { Warehouse } from '@prisma/client';

interface ProductWarehouseAssignmentProps {
  productId: number;
  productName: string;
  currentWarehouses?: Array<{
    id: number;
    name: string;
    quantity: number;
    minStock: number;
    maxStock: number;
  }>;
  onSuccess?: () => void;
}

interface WarehouseAssignment {
  warehouseId: number;
  quantity: number;
  minStock: number;
  maxStock: number;
  selected: boolean;
}

export default function ProductWarehouseAssignment({ 
  productId, 
  productName, 
  currentWarehouses = [],
  onSuccess 
}: ProductWarehouseAssignmentProps) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [assignments, setAssignments] = useState<WarehouseAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'single' | 'multiple'>('single');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(0);
  const [minStock, setMinStock] = useState(0);
  const [maxStock, setMaxStock] = useState(100);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Cargar bodegas disponibles
  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        const { data } = await getWarehouses();
        setWarehouses(data || []);
        
        // Crear asignaciones iniciales
        const initialAssignments = (data || []).map(warehouse => ({
          warehouseId: warehouse.id,
          quantity: 0,
          minStock: 0,
          maxStock: 100,
          selected: false
        }));
        setAssignments(initialAssignments);
      } catch (error) {
        console.error('Error cargando bodegas:', error);
      }
    };
    
    loadWarehouses();
  }, []);

  // Marcar bodegas ya asignadas
  useEffect(() => {
    setAssignments(prev => prev.map(assignment => ({
      ...assignment,
      quantity: currentWarehouses.find(w => w.id === assignment.warehouseId)?.quantity || 0,
      minStock: currentWarehouses.find(w => w.id === assignment.warehouseId)?.minStock || 0,
      maxStock: currentWarehouses.find(w => w.id === assignment.warehouseId)?.maxStock || 100,
      selected: currentWarehouses.some(w => w.id === assignment.warehouseId)
    })));
  }, [currentWarehouses]);

  const handleSingleAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarehouseId) {
      setMessage({ type: 'error', text: 'Debe seleccionar una bodega' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('productId', productId.toString());
      formData.append('warehouseId', selectedWarehouseId.toString());
      formData.append('quantity', quantity.toString());
      formData.append('minStock', minStock.toString());
      formData.append('maxStock', maxStock.toString());

      const result = await assignProductToWarehouseAction(formData);
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        onSuccess?.();
        // Reset form
        setSelectedWarehouseId(null);
        setQuantity(0);
        setMinStock(0);
        setMaxStock(100);
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleMultipleAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedAssignments = assignments.filter(a => a.selected);
    
    if (selectedAssignments.length === 0) {
      setMessage({ type: 'error', text: 'Debe seleccionar al menos una bodega' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('productId', productId.toString());
      
      selectedAssignments.forEach(assignment => {
        formData.append('warehouseIds', assignment.warehouseId.toString());
        formData.append('quantities', assignment.quantity.toString());
        formData.append('minStocks', assignment.minStock.toString());
        formData.append('maxStocks', assignment.maxStock.toString());
      });

      const result = await assignProductToMultipleWarehousesAction(formData);
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        onSuccess?.();
        // Reset selections
        setAssignments(prev => prev.map(a => ({ ...a, selected: false })));
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAssignment = async (warehouseId: number) => {
    setLoading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('productId', productId.toString());
      formData.append('warehouseId', warehouseId.toString());

      const result = await quickAssignProductAction(formData);
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        onSuccess?.();
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const updateAssignment = (warehouseId: number, field: keyof WarehouseAssignment, value: any) => {
    setAssignments(prev => prev.map(a => 
      a.warehouseId === warehouseId ? { ...a, [field]: value } : a
    ));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📦 Asignar Producto a Bodegas
            <Badge variant="secondary">{productName}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Modo de asignación */}
          <div className="mb-6">
            <Label className="text-sm font-medium">Modo de asignación:</Label>
            <div className="flex gap-4 mt-2">
              <Button
                type="button"
                variant={mode === 'single' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('single')}
              >
                Asignación Individual
              </Button>
              <Button
                type="button"
                variant={mode === 'multiple' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMode('multiple')}
              >
                Asignación Múltiple
              </Button>
            </div>
          </div>

          {/* Mensajes */}
          {message && (
            <div className={`p-3 rounded-md mb-4 ${
              message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          {/* Asignación Individual */}
          {mode === 'single' && (
            <form onSubmit={handleSingleAssignment} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="warehouse">Bodega</Label>
                  <Select value={selectedWarehouseId?.toString() || ''} onValueChange={(value) => setSelectedWarehouseId(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar bodega" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {warehouses.map(warehouse => (
                        <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                          {warehouse.name} - {warehouse.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="quantity">Cantidad inicial</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="minStock">Stock mínimo</Label>
                  <Input
                    id="minStock"
                    type="number"
                    min="0"
                    value={minStock}
                    onChange={(e) => setMinStock(parseInt(e.target.value) || 0)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="maxStock">Stock máximo</Label>
                  <Input
                    id="maxStock"
                    type="number"
                    min="0"
                    value={maxStock}
                    onChange={(e) => setMaxStock(parseInt(e.target.value) || 100)}
                  />
                </div>
              </div>
              
              <Button type="submit" disabled={loading || !selectedWarehouseId}>
                {loading ? 'Asignando...' : 'Asignar a Bodega'}
              </Button>
            </form>
          )}

          {/* Asignación Múltiple */}
          {mode === 'multiple' && (
            <form onSubmit={handleMultipleAssignment} className="space-y-4">
              <div className="space-y-4">
                {assignments.map(assignment => {
                  const warehouse = warehouses.find(w => w.id === assignment.warehouseId);
                  if (!warehouse) return null;

                  return (
                    <div key={assignment.warehouseId} className="border rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Checkbox
                          checked={assignment.selected}
                          onCheckedChange={(checked) => 
                            updateAssignment(assignment.warehouseId, 'selected', checked)
                          }
                        />
                        <div className="flex-1">
                          <Label className="font-medium">{warehouse.name}</Label>
                          <p className="text-sm text-gray-600">{warehouse.location}</p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickAssignment(assignment.warehouseId)}
                          disabled={loading}
                        >
                          Asignación Rápida
                        </Button>
                      </div>
                      
                      {assignment.selected && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <Label className="text-sm">Cantidad inicial</Label>
                            <Input
                              type="number"
                              min="0"
                              value={assignment.quantity}
                              onChange={(e) => updateAssignment(assignment.warehouseId, 'quantity', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Stock mínimo</Label>
                            <Input
                              type="number"
                              min="0"
                              value={assignment.minStock}
                              onChange={(e) => updateAssignment(assignment.warehouseId, 'minStock', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div>
                            <Label className="text-sm">Stock máximo</Label>
                            <Input
                              type="number"
                              min="0"
                              value={assignment.maxStock}
                              onChange={(e) => updateAssignment(assignment.warehouseId, 'maxStock', parseInt(e.target.value) || 100)}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <Button type="submit" disabled={loading || assignments.filter(a => a.selected).length === 0}>
                {loading ? 'Asignando...' : `Asignar a ${assignments.filter(a => a.selected).length} bodegas`}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 