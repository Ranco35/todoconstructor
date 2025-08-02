'use client';

import { useState, useEffect } from 'react';
import { getAllWarehouses } from '@/actions/configuration/warehouse-actions';

interface Warehouse {
  id: number;
  name: string;
  type: string;
  location: string;
}

interface BodegaSelectorProps {
  value?: number;
  onChange: (warehouseId: number | undefined) => void;
  className?: string;
  placeholder?: string;
  productType?: string;
}

export default function BodegaSelector({ 
  value, 
  onChange, 
  className = "mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm",
  placeholder = "Seleccionar bodega (opcional)",
  productType
}: BodegaSelectorProps) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);

  const getCompatibleWarehouseTypes = (productType: string): string[] => {
    const compatibilityMatrix: Record<string, string[]> = {
      'CONSUMIBLE': ['CONSUMIBLE', 'ALMACENAMIENTO'],
      'ALMACENABLE': ['CONSUMIBLE', 'ALMACENAMIENTO'],
      'INVENTARIO': ['INVENTARIO'],
      'SERVICIO': [],
      'COMBO': ['CONSUMIBLE', 'ALMACENAMIENTO']
    };

    return compatibilityMatrix[productType] || [];
  };

  const filteredWarehouses = productType 
    ? warehouses.filter(warehouse => {
        const compatibleTypes = getCompatibleWarehouseTypes(productType);
        return compatibleTypes.includes(warehouse.type);
      })
    : warehouses;

  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        const warehouseList = await getAllWarehouses();
        setWarehouses(warehouseList);
      } catch (error) {
        console.error('Error loading warehouses:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWarehouses();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    onChange(selectedId ? parseInt(selectedId) : undefined);
  };

  if (loading) {
    return (
      <select disabled className={className}>
        <option>Cargando bodegas...</option>
      </select>
    );
  }

  if (productType && filteredWarehouses.length === 0) {
    return (
      <div className="mt-1 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <div className="text-sm text-yellow-800">
          <strong>⚠️ Atención:</strong> No hay bodegas compatibles con productos tipo {productType}.
          {productType === 'INVENTARIO' && (
            <div className="mt-1">Los productos de INVENTARIO requieren bodegas de tipo INVENTARIO.</div>
          )}
          {(productType === 'CONSUMIBLE' || productType === 'ALMACENABLE') && (
            <div className="mt-1">Los productos {productType} requieren bodegas de tipo CONSUMIBLE o ALMACENAMIENTO.</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <select
        value={value || ''}
        onChange={handleChange}
        className={className}
      >
        <option value="">{placeholder}</option>
        {filteredWarehouses.map((warehouse) => (
          <option key={warehouse.id} value={warehouse.id}>
            {warehouse.name} ({warehouse.type}) - {warehouse.location}
          </option>
        ))}
      </select>
      
      {productType && filteredWarehouses.length > 0 && (
        <div className="mt-1 text-xs text-gray-500">
          Mostrando solo bodegas compatibles con productos tipo {productType}
        </div>
      )}
    </div>
  );
} 