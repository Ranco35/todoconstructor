'use client';

import { useState, useEffect } from 'react';

interface Storage {
  id: number;
  name: string;
  description?: string;
  temperature?: string;
  humidity?: string;
}

interface StorageSelectorProps {
  value?: number;
  onChange: (storageId: number | undefined) => void;
  placeholder?: string;
  required?: boolean;
}

export default function StorageSelector({ 
  value, 
  onChange, 
  placeholder = "Seleccionar tipo de almacenamiento", 
  required = false 
}: StorageSelectorProps) {
  const [storages, setStorages] = useState<Storage[]>([]);
  const [loading, setLoading] = useState(true);

  // Tipos de almacenamiento predefinidos
  const defaultStorages: Storage[] = [
    { id: 1, name: 'Ambiente', description: 'Almacenamiento a temperatura ambiente', temperature: '15-25°C', humidity: '40-60%' },
    { id: 2, name: 'Refrigerado', description: 'Almacenamiento refrigerado', temperature: '2-8°C', humidity: '50-70%' },
    { id: 3, name: 'Congelado', description: 'Almacenamiento congelado', temperature: '-18°C o menor', humidity: 'Controlada' },
    { id: 4, name: 'Seco', description: 'Almacenamiento en lugar seco', temperature: 'Ambiente', humidity: '<40%' },
    { id: 5, name: 'Húmedo', description: 'Almacenamiento con humedad controlada', temperature: 'Ambiente', humidity: '60-80%' },
    { id: 6, name: 'Controlado', description: 'Almacenamiento con clima controlado', temperature: 'Variable', humidity: 'Variable' },
    { id: 7, name: 'Especial', description: 'Almacenamiento con condiciones especiales', temperature: 'Según producto', humidity: 'Según producto' },
    { id: 8, name: 'Peligroso', description: 'Almacenamiento para materiales peligrosos', temperature: 'Controlada', humidity: 'Controlada' }
  ];

  useEffect(() => {
    const loadStorages = async () => {
      try {
        setLoading(true);
        // Simular carga de datos - reemplazar con llamada real a la API
        await new Promise(resolve => setTimeout(resolve, 100));
        setStorages(defaultStorages);
      } catch (error) {
        console.error('Error cargando tipos de almacenamiento:', error);
        setStorages(defaultStorages);
      } finally {
        setLoading(false);
      }
    };

    loadStorages();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    onChange(selectedValue ? parseInt(selectedValue) : undefined);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        Tipo de Almacenamiento
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
          {loading ? 'Cargando tipos de almacenamiento...' : placeholder}
        </option>
        {storages.map((storage) => (
          <option key={storage.id} value={storage.id}>
            {storage.name}
            {storage.temperature && ` (${storage.temperature})`}
          </option>
        ))}
      </select>
      
      {loading && (
        <p className="mt-1 text-sm text-gray-500">Cargando tipos de almacenamiento...</p>
      )}
      
      {!loading && storages.length === 0 && (
        <p className="mt-1 text-sm text-gray-500">No hay tipos de almacenamiento disponibles.</p>
      )}
      
      {value && !loading && (
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
          {(() => {
            const selectedStorage = storages.find(s => s.id === value);
            return selectedStorage ? (
              <div className="text-sm text-blue-800">
                <p><strong>Condiciones:</strong></p>
                <p>Temperatura: {selectedStorage.temperature}</p>
                <p>Humedad: {selectedStorage.humidity}</p>
              </div>
            ) : null;
          })()}
        </div>
      )}
    </div>
  );
} 