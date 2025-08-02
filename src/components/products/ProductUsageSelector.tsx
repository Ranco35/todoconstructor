'use client';

import { useState, useEffect } from 'react';

interface ProductUsage {
  id: number;
  name: string;
  description?: string;
}

interface ProductUsageSelectorProps {
  value?: number;
  onChange: (usageId: number | undefined) => void;
  placeholder?: string;
  required?: boolean;
}

export default function ProductUsageSelector({ 
  value, 
  onChange, 
  placeholder = "Seleccionar tipo de uso", 
  required = false 
}: ProductUsageSelectorProps) {
  const [usages, setUsages] = useState<ProductUsage[]>([]);
  const [loading, setLoading] = useState(true);

  // Tipos de uso predefinidos
  const defaultUsages: ProductUsage[] = [
    { id: 1, name: 'Uso General', description: 'Uso general sin restricciones' },
    { id: 2, name: 'Uso Médico', description: 'Para uso médico y sanitario' },
    { id: 3, name: 'Uso Industrial', description: 'Para procesos industriales' },
    { id: 4, name: 'Uso Doméstico', description: 'Para uso en el hogar' },
    { id: 5, name: 'Uso Profesional', description: 'Para uso profesional especializado' },
    { id: 6, name: 'Uso Educativo', description: 'Para fines educativos' },
    { id: 7, name: 'Uso Alimentario', description: 'Para consumo alimentario' },
    { id: 8, name: 'Uso Cosmético', description: 'Para cuidado personal y belleza' },
    { id: 9, name: 'Uso Deportivo', description: 'Para actividades deportivas' },
    { id: 10, name: 'Uso Tecnológico', description: 'Para equipos y dispositivos tecnológicos' }
  ];

  useEffect(() => {
    const loadUsages = async () => {
      try {
        setLoading(true);
        // Simular carga de datos - reemplazar con llamada real a la API
        await new Promise(resolve => setTimeout(resolve, 100));
        setUsages(defaultUsages);
      } catch (error) {
        console.error('Error cargando tipos de uso:', error);
        setUsages(defaultUsages);
      } finally {
        setLoading(false);
      }
    };

    loadUsages();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    onChange(selectedValue ? parseInt(selectedValue) : undefined);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        Tipo de Uso
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        value={value || ''}
        onChange={handleChange}
        required={required}
        disabled={loading}
        className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
          loading ? 'bg-gray-100 text-gray-500' : 'bg-white'
        }`}
      >
        <option value="">
          {loading ? 'Cargando tipos de uso...' : placeholder}
        </option>
        {usages.map((usage) => (
          <option key={usage.id} value={usage.id}>
            {usage.name}
            {usage.description && ` - ${usage.description}`}
          </option>
        ))}
      </select>
      
      {loading && (
        <p className="mt-1 text-sm text-gray-500">Cargando tipos de uso...</p>
      )}
      
      {!loading && usages.length === 0 && (
        <p className="mt-1 text-sm text-gray-500">No hay tipos de uso disponibles.</p>
      )}
    </div>
  );
} 