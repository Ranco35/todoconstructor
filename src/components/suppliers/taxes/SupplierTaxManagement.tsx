'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Calculator, Building2, Tag } from 'lucide-react';
import { TAX_TYPES, TAX_CONFIG, SUPPLIER_CATEGORIES } from '@/constants/supplier';
import { toast } from 'sonner';

interface SupplierTax {
  id: number;
  supplierId: number;
  taxType: string;
  taxRate: number;
  taxCode?: string;
  description: string;
  active: boolean;
  isRetention: boolean;
  appliesToCategory?: string;
  createdAt: string;
  updatedAt: string;
}

interface SupplierTaxFormData {
  taxType: string;
  taxRate: number;
  taxCode: string;
  description: string;
  active: boolean;
  isRetention: boolean;
  appliesToCategory: string;
}

interface SupplierTaxManagementProps {
  supplierId: number;
  supplierName: string;
  initialTaxes?: SupplierTax[];
}

export default function SupplierTaxManagement({
  supplierId,
  supplierName,
  initialTaxes = []
}: SupplierTaxManagementProps) {
  const [taxes, setTaxes] = useState<SupplierTax[]>(initialTaxes);
  const [showDialog, setShowDialog] = useState(false);
  const [editingTax, setEditingTax] = useState<SupplierTax | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState<SupplierTaxFormData>({
    taxType: '',
    taxRate: 0,
    taxCode: '',
    description: '',
    active: true,
    isRetention: false,
    appliesToCategory: ''
  });

  // Cargar configuración por defecto cuando se selecciona un tipo de impuesto
  const handleTaxTypeChange = (taxType: string) => {
    const config = TAX_CONFIG[taxType as keyof typeof TAX_CONFIG];
    const taxTypeInfo = TAX_TYPES.find(t => t.value === taxType);
    
    setFormData(prev => ({
      ...prev,
      taxType,
      taxRate: config?.defaultRate || 0,
      description: taxTypeInfo?.label || '',
      isRetention: config?.isRetention || false,
      appliesToCategory: config?.category || ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.taxType || formData.taxRate <= 0) {
      toast.error('Por favor complete todos los campos obligatorios');
      return;
    }

    setLoading(true);
    try {
      if (editingTax) {
        // Actualizar impuesto existente
        const updatedTax: SupplierTax = {
          ...editingTax,
          ...formData,
          updatedAt: new Date().toISOString()
        };
        
        setTaxes(prev => prev.map(tax => 
          tax.id === editingTax.id ? updatedTax : tax
        ));
        
        toast.success('Configuración de impuesto actualizada');
      } else {
        // Crear nuevo impuesto
        const newTax: SupplierTax = {
          id: Date.now(), // En producción sería generado por la base de datos
          supplierId,
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setTaxes(prev => [...prev, newTax]);
        toast.success('Configuración de impuesto agregada');
      }
      
      closeDialog();
    } catch (error) {
      console.error('Error al guardar impuesto:', error);
      toast.error('Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (taxId: number) => {
    if (!confirm('¿Está seguro de eliminar esta configuración de impuesto?')) {
      return;
    }

    try {
      setTaxes(prev => prev.filter(tax => tax.id !== taxId));
      toast.success('Configuración eliminada');
    } catch (error) {
      console.error('Error al eliminar impuesto:', error);
      toast.error('Error al eliminar la configuración');
    }
  };

  const handleEdit = (tax: SupplierTax) => {
    setEditingTax(tax);
    setFormData({
      taxType: tax.taxType,
      taxRate: tax.taxRate,
      taxCode: tax.taxCode || '',
      description: tax.description,
      active: tax.active,
      isRetention: tax.isRetention,
      appliesToCategory: tax.appliesToCategory || ''
    });
    setShowDialog(true);
  };

  const toggleTaxStatus = async (taxId: number, active: boolean) => {
    try {
      setTaxes(prev => prev.map(tax => 
        tax.id === taxId ? { ...tax, active, updatedAt: new Date().toISOString() } : tax
      ));
      toast.success(`Impuesto ${active ? 'activado' : 'desactivado'}`);
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      toast.error('Error al cambiar el estado');
    }
  };

  const openNewTaxDialog = () => {
    setEditingTax(null);
    setFormData({
      taxType: '',
      taxRate: 0,
      taxCode: '',
      description: '',
      active: true,
      isRetention: false,
      appliesToCategory: ''
    });
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
    setEditingTax(null);
  };

  const getTaxBadgeColor = (taxType: string, isRetention: boolean) => {
    if (isRetention) return 'bg-red-100 text-red-800';
    if (taxType.includes('ANTICIPADO')) return 'bg-orange-100 text-orange-800';
    if (taxType.includes('IVA_C')) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(amount);
  };

  const calculateSampleTax = (rate: number, baseAmount: number = 100000) => {
    return (baseAmount * rate) / 100;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calculator className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle>Configuración de Impuestos</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Configurar impuestos específicos para <strong>{supplierName}</strong>
                </p>
              </div>
            </div>
            <Button onClick={openNewTaxDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Impuesto
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Lista de impuestos configurados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Impuestos Configurados ({taxes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {taxes.length === 0 ? (
            <div className="text-center py-12">
              <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay impuestos configurados
              </h3>
              <p className="text-gray-500 mb-6">
                Agregue configuraciones de impuestos específicas para este proveedor
              </p>
              <Button onClick={openNewTaxDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Primer Impuesto
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo de Impuesto</TableHead>
                  <TableHead>Tasa (%)</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Ejemplo (sobre $100.000)</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taxes.map((tax) => (
                  <TableRow key={tax.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge 
                          className={getTaxBadgeColor(tax.taxType, tax.isRetention)}
                        >
                          {tax.description}
                        </Badge>
                        {tax.isRetention && (
                          <div className="text-xs text-red-600">
                            • Retención
                          </div>
                        )}
                        {tax.taxCode && (
                          <div className="text-xs text-gray-500">
                            Código: {tax.taxCode}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-lg">
                        {tax.taxRate.toFixed(2)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      {tax.appliesToCategory ? (
                        <Badge variant="outline" className="text-xs">
                          {tax.appliesToCategory}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">Todos los productos</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className={tax.isRetention ? 'text-red-600' : 'text-green-600'}>
                          {tax.isRetention ? '-' : '+'}
                          {formatCurrency(calculateSampleTax(tax.taxRate))}
                        </div>
                        <div className="text-xs text-gray-500">
                          Base: $100.000
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={tax.active}
                          onCheckedChange={(checked) => toggleTaxStatus(tax.id, checked)}
                        />
                        <span className="text-sm">
                          {tax.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(tax)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(tax.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog para agregar/editar impuesto */}
      <Dialog open={showDialog} onOpenChange={closeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTax ? 'Editar Impuesto' : 'Agregar Nuevo Impuesto'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="taxType">Tipo de Impuesto *</Label>
              <Select
                value={formData.taxType}
                onValueChange={handleTaxTypeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo de impuesto" />
                </SelectTrigger>
                <SelectContent>
                  {TAX_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="taxRate">Tasa de Impuesto (%) *</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.taxRate}
                onChange={(e) => setFormData(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="taxCode">Código Fiscal</Label>
              <Input
                id="taxCode"
                value={formData.taxCode}
                onChange={(e) => setFormData(prev => ({ ...prev, taxCode: e.target.value }))}
                placeholder="Ej: IVA19"
              />
            </div>

            <div>
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción del impuesto"
              />
            </div>

            <div>
              <Label htmlFor="appliesToCategory">Categoría Específica (Opcional)</Label>
              <Select
                value={formData.appliesToCategory}
                onValueChange={(value) => setFormData(prev => ({ ...prev, appliesToCategory: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Aplica a todos los productos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los productos</SelectItem>
                  {SUPPLIER_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isRetention"
                checked={formData.isRetention}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRetention: checked }))}
              />
              <Label htmlFor="isRetention">Es una retención</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
              />
              <Label htmlFor="active">Activo</Label>
            </div>

            {/* Preview del cálculo */}
            {formData.taxRate > 0 && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="text-sm font-medium mb-2">Vista previa del cálculo:</h4>
                <div className="text-sm space-y-1">
                  <div>Base: $100.000</div>
                  <div className={formData.isRetention ? 'text-red-600' : 'text-green-600'}>
                    {formData.isRetention ? 'Retención' : 'Impuesto'}: {formData.isRetention ? '-' : '+'}
                    {formatCurrency(calculateSampleTax(formData.taxRate))}
                  </div>
                  <div className="font-medium">
                    Total: {formatCurrency(100000 + (formData.isRetention ? -calculateSampleTax(formData.taxRate) : calculateSampleTax(formData.taxRate)))}
                  </div>
                </div>
              </div>
            )}
          </form>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeDialog}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} onClick={handleSubmit}>
              {loading ? 'Guardando...' : editingTax ? 'Actualizar' : 'Agregar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 