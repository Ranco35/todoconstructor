'use client';

import React, { useState } from 'react';
import { SupplierTax } from '@/types/database';
import { SupplierTaxFormData } from '@/types/supplier';
import { TAX_TYPES } from '@/constants/supplier';
import { createSupplierTax, updateSupplierTax } from '@/actions/suppliers/taxes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TaxFormProps {
  mode: 'create' | 'edit';
  supplierId: number;
  tax?: SupplierTax;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function TaxForm({ mode, supplierId, tax, onSuccess, onCancel }: TaxFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<SupplierTaxFormData>({
    taxType: tax?.taxType || '',
    taxRate: tax?.taxRate || 0,
    taxCode: tax?.taxCode || '',
    description: tax?.description || '',
    active: tax?.active ?? true,
  });

  const handleInputChange = (field: keyof SupplierTaxFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'create') {
        const result = await createSupplierTax(supplierId, formData);
        if (result.success) {
          onSuccess?.();
        } else {
          console.error('Error creating tax:', result.error);
          alert('Error al crear la configuración fiscal');
        }
      } else if (tax) {
        const result = await updateSupplierTax(tax.id, formData);
        if (result.success) {
          onSuccess?.();
        } else {
          console.error('Error updating tax:', result.error);
          alert('Error al actualizar la configuración fiscal');
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error al procesar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'Agregar Configuración Fiscal' : 'Editar Configuración Fiscal'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de Impuesto */}
          <div className="space-y-2">
            <Label htmlFor="taxType">Tipo de Impuesto *</Label>
            <Select
              value={formData.taxType}
              onValueChange={(value: string) => handleInputChange('taxType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo de impuesto" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {TAX_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tasa de Impuesto */}
          <div className="space-y-2">
            <Label htmlFor="taxRate">Tasa de Impuesto (%) *</Label>
            <Input
              id="taxRate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.taxRate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('taxRate', parseFloat(e.target.value) || 0)}
              placeholder="19.0"
              required
            />
            <p className="text-sm text-gray-500">
              Ingrese el porcentaje del impuesto (ej: 19 para IVA 19%)
            </p>
          </div>

          {/* Código Fiscal */}
          <div className="space-y-2">
            <Label htmlFor="taxCode">Código Fiscal</Label>
            <Input
              id="taxCode"
              value={formData.taxCode}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('taxCode', e.target.value)}
              placeholder="IVA001"
            />
            <p className="text-sm text-gray-500">
              Código interno o de referencia para este impuesto
            </p>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
              placeholder="Descripción detallada del impuesto..."
              rows={3}
            />
          </div>

          {/* Estado */}
          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked: boolean) => handleInputChange('active', checked)}
            />
            <Label htmlFor="active">Configuración activa</Label>
          </div>

          {/* Información adicional */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              💡 Información sobre impuestos
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>IVA:</strong> Impuesto al Valor Agregado (generalmente 19% en Chile)</li>
              <li>• <strong>ISR:</strong> Impuesto Sobre la Renta</li>
              <li>• <strong>IEPS:</strong> Impuesto Especial sobre Producción y Servicios</li>
              <li>• <strong>ISH:</strong> Impuesto Sobre Hospedaje</li>
              <li>• <strong>Retención:</strong> Retenciones de impuestos</li>
            </ul>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Guardando...' : mode === 'create' ? 'Crear Configuración' : 'Actualizar Configuración'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 