'use client';

import { useState, useEffect } from 'react';

interface SaleLineWarning {
  id: number;
  name: string;
  description?: string;
  severity: 'INFO' | 'WARNING' | 'ERROR';
}

interface SaleLineWarningSelectorProps {
  value?: number;
  onChange: (warningId: number | undefined) => void;
  placeholder?: string;
  required?: boolean;
}

export default function SaleLineWarningSelector({ 
  value, 
  onChange, 
  placeholder = "Seleccionar advertencia de línea de venta", 
  required = false 
}: SaleLineWarningSelectorProps) {
  const [warnings, setWarnings] = useState<SaleLineWarning[]>([]);
  const [loading, setLoading] = useState(true);

  // Advertencias predefinidas
  const defaultWarnings: SaleLineWarning[] = [
    { id: 1, name: 'Sin Advertencia', description: 'No mostrar advertencias', severity: 'INFO' },
    { id: 2, name: 'Stock Bajo', description: 'Advertir cuando el stock esté bajo', severity: 'WARNING' },
    { id: 3, name: 'Producto Descontinuado', description: 'Advertir que el producto está descontinuado', severity: 'WARNING' },
    { id: 4, name: 'Requiere Autorización', description: 'Requiere autorización para vender', severity: 'ERROR' },
    { id: 5, name: 'Precio Especial', description: 'Advertir sobre precios especiales', severity: 'INFO' },
    { id: 6, name: 'Producto Peligroso', description: 'Advertir que es un producto peligroso', severity: 'ERROR' },
    { id: 7, name: 'Venta Limitada', description: 'Advertir sobre limitaciones de venta', severity: 'WARNING' },
    { id: 8, name: 'Cliente Específico', description: 'Solo para clientes específicos', severity: 'WARNING' }
  ];

  useEffect(() => {
    const loadWarnings = async () => {
      try {
        setLoading(true);
        // Simular carga de datos - reemplazar con llamada real a la API
        await new Promise(resolve => setTimeout(resolve, 100));
        setWarnings(defaultWarnings);
      } catch (error) {
        console.error('Error cargando advertencias:', error);
        setWarnings(defaultWarnings);
      } finally {
        setLoading(false);
      }
    };

    loadWarnings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    onChange(selectedValue ? parseInt(selectedValue) : undefined);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'ERROR': return 'text-red-600';
      case 'WARNING': return 'text-yellow-600';
      case 'INFO': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'ERROR': return '🚫';
      case 'WARNING': return '⚠️';
      case 'INFO': return 'ℹ️';
      default: return '';
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        Advertencia de Línea de Venta
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
          {loading ? 'Cargando advertencias...' : placeholder}
        </option>
        {warnings.map((warning) => (
          <option key={warning.id} value={warning.id}>
            {getSeverityIcon(warning.severity)} {warning.name}
            {warning.description && ` - ${warning.description}`}
          </option>
        ))}
      </select>
      
      {loading && (
        <p className="mt-1 text-sm text-gray-500">Cargando advertencias...</p>
      )}
      
      {!loading && warnings.length === 0 && (
        <p className="mt-1 text-sm text-gray-500">No hay advertencias disponibles.</p>
      )}
      
      {value && !loading && (
        <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-md">
          {(() => {
            const selectedWarning = warnings.find(w => w.id === value);
            return selectedWarning ? (
              <div className={`text-sm ${getSeverityColor(selectedWarning.severity)}`}>
                <p>
                  <strong>{getSeverityIcon(selectedWarning.severity)} {selectedWarning.name}</strong>
                </p>
                <p>{selectedWarning.description}</p>
              </div>
            ) : null;
          })()}
        </div>
      )}
    </div>
  );
} 