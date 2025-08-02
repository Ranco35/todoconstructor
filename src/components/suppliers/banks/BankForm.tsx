'use client';

import React, { useState } from 'react';
import { SupplierBank } from '@/types/database';
import { SupplierBankFormData } from '@/types/supplier';
import { ACCOUNT_TYPES } from '@/constants/supplier';
import { createSupplierBankAction, updateSupplierBankAction } from '@/actions/suppliers/banks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface BankFormProps {
  mode: 'create' | 'edit';
  supplierId: number;
  bank?: SupplierBank;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function BankForm({ mode, supplierId, bank, onSuccess, onCancel }: BankFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<SupplierBankFormData>({
    bankName: bank?.bankName || '',
    accountNumber: bank?.accountNumber || '',
    accountType: bank?.accountType || '',
    routingNumber: bank?.routingNumber || '',
    swiftCode: bank?.swiftCode || '',
    iban: bank?.iban || '',
    holderName: bank?.holderName || '',
    holderDocument: bank?.holderDocument || '',
    isPrimary: bank?.isPrimary || false,
    active: bank?.active ?? true,
  });

  const handleInputChange = (field: keyof SupplierBankFormData, value: any) => {
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
        const result = await createSupplierBankAction(supplierId, formData);
        if (result.success) {
          onSuccess?.();
        } else {
          console.error('Error creating bank:', result.error);
          alert('Error al crear la cuenta bancaria');
        }
      } else if (bank) {
        const result = await updateSupplierBankAction(bank.id, formData);
        if (result.success) {
          onSuccess?.();
        } else {
          console.error('Error updating bank:', result.error);
          alert('Error al actualizar la cuenta bancaria');
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
          {mode === 'create' ? 'Agregar Cuenta Bancaria' : 'Editar Cuenta Bancaria'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Información del Banco */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Nombre del Banco *</Label>
              <Input
                id="bankName"
                value={formData.bankName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('bankName', e.target.value)}
                placeholder="Banco de Chile"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Número de Cuenta *</Label>
              <Input
                id="accountNumber"
                value={formData.accountNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('accountNumber', e.target.value)}
                placeholder="12345678"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accountType">Tipo de Cuenta</Label>
              <Select
                value={formData.accountType}
                onValueChange={(value: string) => handleInputChange('accountType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {ACCOUNT_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="routingNumber">Código de Banco</Label>
              <Input
                id="routingNumber"
                value={formData.routingNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('routingNumber', e.target.value)}
                placeholder="001"
              />
            </div>
          </div>

          {/* Información Internacional */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="swiftCode">Código SWIFT</Label>
              <Input
                id="swiftCode"
                value={formData.swiftCode}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('swiftCode', e.target.value)}
                placeholder="BCHICLRM"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="iban">Número IBAN</Label>
              <Input
                id="iban"
                value={formData.iban}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('iban', e.target.value)}
                placeholder="CL12345678901234567890"
              />
            </div>
          </div>

          {/* Información del Titular */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="holderName">Nombre del Titular *</Label>
              <Input
                id="holderName"
                value={formData.holderName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('holderName', e.target.value)}
                placeholder="Juan Pérez González"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="holderDocument">Documento del Titular</Label>
              <Input
                id="holderDocument"
                value={formData.holderDocument}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('holderDocument', e.target.value)}
                placeholder="12.345.678-9"
              />
            </div>
          </div>

          {/* Configuración */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="isPrimary"
                checked={formData.isPrimary}
                onCheckedChange={(checked: boolean) => handleInputChange('isPrimary', checked)}
              />
              <Label htmlFor="isPrimary">Cuenta principal</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="active"
                checked={formData.active}
                onCheckedChange={(checked: boolean) => handleInputChange('active', checked)}
              />
              <Label htmlFor="active">Cuenta activa</Label>
            </div>
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
              {isLoading ? 'Guardando...' : mode === 'create' ? 'Crear Cuenta' : 'Actualizar Cuenta'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 