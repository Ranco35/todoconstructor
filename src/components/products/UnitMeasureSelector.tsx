'use client';

import React, { useState, useEffect } from 'react';
import { getUnitMeasures } from '@/actions/configuration/unit-measure-actions';
import { UnitMeasure } from '@/types/unit-measure';

interface UnitMeasureSelectorProps {
  value?: number;
  onChange: (value?: number) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  category?: string;
}

export default function UnitMeasureSelector({
  value, 
  onChange, 
  placeholder = "Seleccionar unidad de medida", 
  label,
  required = false,
  className = "",
  category
}: UnitMeasureSelectorProps) {
  const [units, setUnits] = useState<UnitMeasure[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUnits = async () => {
      try {
        setLoading(true);
        console.log('🔍 UnitMeasureSelector: Cargando unidades, categoría:', category);
        const { data } = await getUnitMeasures({ 
          pageSize: 1000, // Obtener todas las unidades activas
          category 
        });
        console.log('📊 UnitMeasureSelector: Unidades cargadas:', data.length);
        console.log('🎯 UnitMeasureSelector: Value recibido:', value, 'tipo:', typeof value);
        
        // Verificar si la unidad con el value existe
        const selectedUnit = data.find(unit => unit.id === value);
        console.log('✅ UnitMeasureSelector: Unidad encontrada para value:', selectedUnit);
        
        setUnits(data);
      } catch (error) {
        console.error('❌ UnitMeasureSelector: Error cargando unidades de medida:', error);
        setUnits([]);
      } finally {
        setLoading(false);
      }
    };

    loadUnits();
  }, [category, value]); // Agregar value como dependencia para ver cambios

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    console.log('🔄 UnitMeasureSelector: Cambio seleccionado:', selectedValue);
    onChange(selectedValue ? parseInt(selectedValue) : undefined);
  };

  // Log cada vez que se renderiza
  console.log('🔄 UnitMeasureSelector: Renderizando con value:', value, 'units:', units.length);

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        value={value || ''}
        onChange={handleChange}
        required={required}
        disabled={loading}
        className={`${className} block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
          loading ? 'bg-gray-100 text-gray-500' : 'bg-white'
        }`}
      >
        <option value="">
          {loading ? 'Cargando unidades...' : placeholder}
        </option>
        {units.map((unit) => (
          <option key={unit.id} value={unit.id}>
            {unit.name}
            {unit.abbreviation && ` (${unit.abbreviation})`}
          </option>
        ))}
      </select>
      
      {loading && (
        <p className="mt-1 text-sm text-gray-500">Cargando unidades de medida...</p>
      )}
      
      {!loading && units.length === 0 && (
        <p className="mt-1 text-sm text-gray-500">No hay unidades de medida disponibles.</p>
      )}

      {/* Debug info - remover en producción */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-1 p-2 bg-gray-100 text-xs border rounded">
          <div><strong>Debug UnitMeasureSelector:</strong></div>
          <div>Value: {value} (tipo: {typeof value})</div>
          <div>Units cargadas: {units.length}</div>
          <div>Loading: {loading ? 'Sí' : 'No'}</div>
          {value && (
            <div>
              Unidad seleccionada: {units.find(u => u.id === value)?.name || 'No encontrada'}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 