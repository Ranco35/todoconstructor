'use client';

import { useState, useEffect } from 'react';

interface InvoicePolicy {
  id: number;
  name: string;
  description?: string;
}

interface InvoicePolicySelectorProps {
  value?: number;
  onChange: (policyId: number | undefined) => void;
  placeholder?: string;
  required?: boolean;
}

export default function InvoicePolicySelector({ 
  value, 
  onChange, 
  placeholder = "Seleccionar política de facturación", 
  required = false 
}: InvoicePolicySelectorProps) {
  const [policies, setPolicies] = useState<InvoicePolicy[]>([]);
  const [loading, setLoading] = useState(true);

  // Políticas de facturación predefinidas
  const defaultPolicies: InvoicePolicy[] = [
    { id: 1, name: 'Facturación Estándar', description: 'Facturación normal según cantidades entregadas' },
    { id: 2, name: 'Facturación Anticipada', description: 'Facturar antes de la entrega' },
    { id: 3, name: 'Facturación por Lotes', description: 'Facturar por lotes completos' },
    { id: 4, name: 'Facturación Diferida', description: 'Facturar después de un período determinado' },
    { id: 5, name: 'Sin Facturación', description: 'Producto que no se factura directamente' },
    { id: 6, name: 'Facturación Parcial', description: 'Permitir facturación parcial' },
    { id: 7, name: 'Facturación por Servicios', description: 'Facturación específica para servicios' }
  ];

  useEffect(() => {
    const loadPolicies = async () => {
      try {
        setLoading(true);
        // Simular carga de datos - reemplazar con llamada real a la API
        await new Promise(resolve => setTimeout(resolve, 100));
        setPolicies(defaultPolicies);
      } catch (error) {
        console.error('Error cargando políticas de facturación:', error);
        setPolicies(defaultPolicies);
      } finally {
        setLoading(false);
      }
    };

    loadPolicies();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    onChange(selectedValue ? parseInt(selectedValue) : undefined);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        Política de Facturación
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
          {loading ? 'Cargando políticas...' : placeholder}
        </option>
        {policies.map((policy) => (
          <option key={policy.id} value={policy.id}>
            {policy.name}
            {policy.description && ` - ${policy.description}`}
          </option>
        ))}
      </select>
      
      {loading && (
        <p className="mt-1 text-sm text-gray-500">Cargando políticas de facturación...</p>
      )}
      
      {!loading && policies.length === 0 && (
        <p className="mt-1 text-sm text-gray-500">No hay políticas de facturación disponibles.</p>
      )}
    </div>
  );
} 