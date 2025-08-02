'use client';

import React, { useState, useEffect } from 'react';
import { getActiveCostCenters } from '@/actions/configuration/cost-center-actions';

interface CostCenter {
  id: number;
  name: string;
  code?: string | null;
  Parent?: {
    name: string;
  } | null;
}

interface CostCenterSelectorProps {
  selectedCostCenterId?: number;
  onCostCenterChange: (costCenterId: number | null) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

export function CostCenterSelector({
  selectedCostCenterId,
  onCostCenterChange,
  disabled = false,
  required = false,
  placeholder = "Selecciona un centro de costo",
  className = ""
}: CostCenterSelectorProps) {
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCostCenters() {
      try {
        setLoading(true);
        const data = await getActiveCostCenters();
        setCostCenters(data);
      } catch (err) {
        console.error('Error fetching cost centers:', err);
        setError('Error al cargar centros de costo');
      } finally {
        setLoading(false);
      }
    }

    fetchCostCenters();
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    onCostCenterChange(value ? parseInt(value) : null);
  };

  if (loading) {
    return (
      <div className={`${className}`}>
        <select 
          disabled 
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
        >
          <option>Cargando centros de costo...</option>
        </select>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <select 
          disabled 
          className="w-full px-3 py-2 border border-red-300 rounded-md shadow-sm bg-red-50 text-red-500"
        >
          <option>{error}</option>
        </select>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <select
        value={selectedCostCenterId || ''}
        onChange={handleChange}
        disabled={disabled}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
      >
        <option value="">{placeholder}</option>
        {costCenters.map((costCenter) => (
          <option key={costCenter.id} value={costCenter.id}>
            {costCenter.name}
            {costCenter.code && ` (${costCenter.code})`}
            {costCenter.Parent && ` - ${costCenter.Parent.name}`}
          </option>
        ))}
      </select>
      
      {costCenters.length === 0 && (
        <p className="mt-1 text-sm text-amber-600">
          No hay centros de costo activos. Crea uno primero.
        </p>
      )}
    </div>
  );
}

// Componente alternativo para uso en formularios tradicionales con name
interface CostCenterSelectorFormProps {
  name: string;
  defaultValue?: number;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

export function CostCenterSelectorForm({
  name,
  defaultValue,
  disabled = false,
  required = false,
  placeholder = "Selecciona un centro de costo",
  className = ""
}: CostCenterSelectorFormProps) {
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCostCenters() {
      try {
        const data = await getActiveCostCenters();
        setCostCenters(data);
      } catch (err) {
        console.error('Error fetching cost centers:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCostCenters();
  }, []);

  if (loading) {
    return (
      <select 
        name={name}
        disabled 
        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 ${className}`}
      >
        <option>Cargando...</option>
      </select>
    );
  }

  return (
    <select
      name={name}
      defaultValue={defaultValue || ''}
      disabled={disabled}
      required={required}
      className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${className}`}
    >
      <option value="">{placeholder}</option>
      {costCenters.map((costCenter) => (
        <option key={costCenter.id} value={costCenter.id}>
          {costCenter.name}
          {costCenter.code && ` (${costCenter.code})`}
          {costCenter.Parent && ` - ${costCenter.Parent.name}`}
        </option>
      ))}
    </select>
  );
}