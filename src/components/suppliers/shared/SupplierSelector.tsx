'use client';

import React, { useState, useEffect } from 'react';
import { searchSuppliersByName } from '@/actions/suppliers/list';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface SupplierSelectorProps {
  value?: number;
  onValueChange: (value: number | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  error?: string;
  className?: string;
  showCreateOption?: boolean;
  onCreateNew?: () => void;
}

export default function SupplierSelector({
  value,
  onValueChange,
  placeholder = "Seleccionar proveedor...",
  disabled = false,
  required = false,
  label = "Proveedor",
  error,
  className,
  showCreateOption = false,
  onCreateNew
}: SupplierSelectorProps) {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        setLoading(true);
        console.log('[SupplierSelector] Cargando proveedores...');
        const results = await searchSuppliersByName('', 100); // Cargar todos los proveedores
        console.log('[SupplierSelector] Proveedores cargados:', results.length);
        setSuppliers(results);
      } catch (error) {
        console.error('[SupplierSelector] Error loading suppliers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSuppliers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    console.log('[SupplierSelector] Seleccionando proveedor ID:', selectedValue);
    if (selectedValue === '') {
      onValueChange(undefined);
    } else if (selectedValue === 'create_new') {
      onCreateNew?.();
    } else {
      onValueChange(parseInt(selectedValue));
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <select
        value={value || ''}
        onChange={handleChange}
        required={required}
        disabled={disabled || loading}
        className={cn(
          "w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200",
          loading ? 'bg-gray-100 text-gray-500' : 'bg-white',
          error && 'border-red-500'
        )}
      >
        <option value="">
          {loading ? 'Cargando proveedores...' : placeholder}
        </option>
        
        {showCreateOption && !loading && (
          <option value="create_new" className="text-blue-600 font-medium">
            + Crear nuevo proveedor
          </option>
        )}
        
        {!loading && suppliers.length > 0 && showCreateOption && (
          <option disabled>── Proveedores Existentes ──</option>
        )}
        
        {suppliers.map((supplier) => (
          <option key={supplier.id} value={supplier.id}>
            {supplier.name}
            {supplier.email && ` (${supplier.email})`}
            {supplier.supplierRank && ` - ${supplier.supplierRank}`}
          </option>
        ))}
        
        {!loading && suppliers.length === 0 && (
          <option value="" disabled>No hay proveedores disponibles</option>
        )}
      </select>
      
      {loading && (
        <p className="text-sm text-gray-500">Cargando proveedores disponibles...</p>
      )}
      
      {!loading && suppliers.length === 0 && (
        <div className="mt-1">
          <p className="text-sm text-gray-500">No hay proveedores disponibles.</p>
          {showCreateOption && (
            <p className="text-sm text-blue-600">
              <button 
                type="button"
                onClick={onCreateNew}
                className="underline hover:no-underline"
              >
                Crear nuevo proveedor →
              </button>
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <span>⚠️</span>
          {error}
        </p>
      )}
    </div>
  );
} 