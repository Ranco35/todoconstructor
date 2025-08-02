'use client';

import { useState, useEffect } from 'react';

interface ProductState {
  id: number;
  name: string;
  description?: string;
}

interface ProductStateSelectorProps {
  value?: number;
  onChange: (stateId: number | undefined) => void;
  placeholder?: string;
  required?: boolean;
}

export default function ProductStateSelector({ 
  value, 
  onChange, 
  placeholder = "Seleccionar estado del producto", 
  required = false 
}: ProductStateSelectorProps) {
  const [states, setStates] = useState<ProductState[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados predefinidos comunes
  const defaultStates: ProductState[] = [
    { id: 1, name: 'Activo', description: 'Producto disponible para venta' },
    { id: 2, name: 'Inactivo', description: 'Producto no disponible temporalmente' },
    { id: 3, name: 'Descontinuado', description: 'Producto que ya no se vende' },
    { id: 4, name: 'En Desarrollo', description: 'Producto en fase de desarrollo' },
    { id: 5, name: 'Agotado', description: 'Producto sin stock disponible' },
    { id: 6, name: 'En Promoción', description: 'Producto con precio promocional' },
    { id: 7, name: 'Reservado', description: 'Producto reservado para clientes específicos' }
  ];

  useEffect(() => {
    const loadStates = async () => {
      try {
        setLoading(true);
        // Simular carga de datos - reemplazar con llamada real a la API
        await new Promise(resolve => setTimeout(resolve, 100));
        setStates(defaultStates);
      } catch (error) {
        console.error('Error cargando estados de producto:', error);
        setStates(defaultStates);
      } finally {
        setLoading(false);
      }
    };

    loadStates();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    onChange(selectedValue ? parseInt(selectedValue) : undefined);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        Estado del Producto
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
          {loading ? 'Cargando estados...' : placeholder}
        </option>
        {states.map((state) => (
          <option key={state.id} value={state.id}>
            {state.name}
            {state.description && ` - ${state.description}`}
          </option>
        ))}
      </select>
      
      {loading && (
        <p className="mt-1 text-sm text-gray-500">Cargando estados disponibles...</p>
      )}
      
      {!loading && states.length === 0 && (
        <p className="mt-1 text-sm text-gray-500">No hay estados disponibles.</p>
      )}
    </div>
  );
} 