'use client';

import React, { useState, useEffect } from 'react';
import { getAllWarehouses, Warehouse } from '@/actions/configuration/warehouse-actions';

interface WarehouseSelectorProps {
  value?: number;
  onChange: (warehouseId: number | undefined) => void;
  placeholder?: string;
  required?: boolean;
}

export default function WarehouseSelector({ 
  value, 
  onChange, 
  placeholder = "Seleccionar bodega", 
  required = false 
}: WarehouseSelectorProps) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        setLoading(true);
        console.log('🔍 [WarehouseSelector] Iniciando carga de bodegas...');
        const warehouses = await getAllWarehouses();
        console.log('✅ [WarehouseSelector] Bodegas cargadas:', warehouses);
        setWarehouses(warehouses);
        setError(null);
      } catch (err) {
        console.error('❌ [WarehouseSelector] Error cargando bodegas:', err);
        console.error('❌ [WarehouseSelector] Error detallado:', JSON.stringify(err, null, 2));
        setError(`Error al cargar bodegas: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      } finally {
        setLoading(false);
      }
    };

    loadWarehouses();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    if (selectedValue === '') {
      onChange(undefined);
    } else {
      onChange(parseInt(selectedValue));
    }
  };

  // Función para crear las opciones jerárquicas
  const createHierarchicalOptions = () => {
    const rootWarehouses = warehouses.filter(wh => !wh.parentId);
    const childWarehouses = warehouses.filter(wh => wh.parentId);
    
    const options: JSX.Element[] = [];
    
    // Agregar bodegas raíz y sus hijos
    rootWarehouses.forEach(rootWarehouse => {
      // Agregar bodega padre
      options.push(
        <option key={rootWarehouse.id} value={rootWarehouse.id}>
          🏭 {rootWarehouse.name}
          {rootWarehouse.location && ` (${rootWarehouse.location})`}
          {!rootWarehouse.isActive && ' - INACTIVA'}
        </option>
      );
      
      // Agregar bodegas hijas de esta bodega padre
      const children = childWarehouses.filter(child => child.parentId === rootWarehouse.id);
      children.forEach(child => {
        options.push(
          <option key={child.id} value={child.id}>
            ┗━ {child.name}
            {child.location && ` (${child.location})`}
            {!child.isActive && ' - INACTIVA'}
          </option>
        );
      });
    });
    
    // Agregar bodegas huérfanas (sin padre válido) al final
    const orphanWarehouses = childWarehouses.filter(wh => 
      !rootWarehouses.find(root => root.id === wh.parentId)
    );
    
    if (orphanWarehouses.length > 0) {
      options.push(
        <option key="separator" disabled value="">
          ───────────────────
        </option>
      );
      orphanWarehouses.forEach(orphan => {
        options.push(
          <option key={orphan.id} value={orphan.id}>
            🔗 {orphan.name}
            {orphan.location && ` (${orphan.location})`}
            {!orphan.isActive && ' - INACTIVA'}
          </option>
        );
      });
    }
    
    return options;
  };

  if (error) {
    return (
      <div className="mt-1">
        <select 
          disabled 
          className="block w-full border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-500 sm:text-sm"
        >
          <option>Error al cargar bodegas</option>
        </select>
        <p className="mt-1 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="mt-1">
      <select
        value={value || ''}
        onChange={handleChange}
        required={required}
        disabled={loading}
        className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
          loading ? 'bg-gray-100 text-gray-500' : 'bg-white'
        }`}
      >
        <option value="">
          {loading ? 'Cargando bodegas...' : '🏪 Todas las bodegas'}
        </option>
        {!loading && (
          <option value="">
            🏪 Todas las bodegas
          </option>
        )}
        {!loading && createHierarchicalOptions()}
      </select>
      
      {loading && (
        <p className="mt-1 text-sm text-gray-500">Cargando bodegas disponibles...</p>
      )}
      
      {!loading && warehouses.length === 0 && (
        <div className="mt-1">
          <p className="text-sm text-gray-500">No hay bodegas disponibles.</p>
          <p className="text-sm text-blue-600">
            <a href="/dashboard/configuration/inventory/warehouses" className="underline">
              Crear nueva bodega →
            </a>
          </p>
        </div>
      )}
      
      {!loading && warehouses.length > 0 && (
        <div className="mt-1">
          <p className="text-sm text-gray-600">
            🏭 = Bodega Principal &nbsp;&nbsp; ┗━ = Sub-bodega &nbsp;&nbsp; 🔗 = Sin bodega padre
          </p>
        </div>
      )}
    </div>
  );
} 