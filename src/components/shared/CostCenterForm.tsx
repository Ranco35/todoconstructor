'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// Local type definitions instead of Prisma types
type CostCenter = {
  id: number;
  name: string;
  description?: string | null;
  code?: string | null;
  parentId?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

interface CostCenterOption {
  id: number;
  name: string;
  code?: string | null;
  parentId?: number | null;
  Parent?: { name: string } | null;
}

interface CostCenterFormProps {
  parentOptions: CostCenterOption[];
  initialData?: Partial<CostCenter>;
  onSubmit: (formData: FormData) => Promise<void>;
  isEditing?: boolean;
}

export function CostCenterForm({
  parentOptions,
  initialData,
  onSubmit,
  isEditing = false
}: CostCenterFormProps) {
  const [selectedParent, setSelectedParent] = useState(
    initialData?.parentId?.toString() || ''
  );
  const [isActive, setIsActive] = useState(
    initialData?.isActive !== undefined ? initialData.isActive : true
  );

  const handleSubmit = async (formData: FormData) => {
    // Agregar el estado activo al FormData
    formData.set('isActive', isActive.toString());
    await onSubmit(formData);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <form action={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              defaultValue={initialData?.name}
              required
              placeholder="Ej: Administración, Ventas, Marketing..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Nombre único del centro de costo
            </p>
          </div>

          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              Código <span className="text-gray-400">(Opcional)</span>
            </label>
            <input
              type="text"
              id="code"
              name="code"
              defaultValue={initialData?.code || ''}
              placeholder="Ej: ADM-001, VEN-001, MKT-001"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Código único para identificación rápida
            </p>
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={initialData?.description || ''}
            placeholder="Descripción detallada del centro de costo..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Descripción opcional del propósito del centro de costo
          </p>
        </div>

        {/* Centro de Costo Padre */}
        <div>
          <label htmlFor="parentId" className="block text-sm font-medium text-gray-700 mb-2">
            Centro de Costo Padre <span className="text-gray-400">(Opcional)</span>
          </label>
          <select
            id="parentId"
            name="parentId"
            value={selectedParent}
            onChange={(e) => setSelectedParent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Sin centro padre (centro raíz)</option>
            {parentOptions.map((option) => (
              <option key={option.id} value={option.id.toString()}>
                {option.name}
                {option.code && ` (${option.code})`}
                {option.Parent && ` - Hijo de: ${option.Parent.name}`}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            Selecciona un centro padre para crear una jerarquía organizacional
          </p>
        </div>

        {/* Estado (solo para edición) */}
        {isEditing && (
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Centro de costo activo
            </label>
            <p className="ml-2 text-sm text-gray-500">
              (Los centros inactivos no aparecerán en los selectores)
            </p>
          </div>
        )}

        {/* Información adicional para edición */}
        {isEditing && initialData && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Información del centro</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Creado:</span>
                <span className="ml-2 text-gray-900">
                  {initialData.createdAt
                    ? new Date(initialData.createdAt).toLocaleDateString('es-ES')
                    : 'N/A'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Actualizado:</span>
                <span className="ml-2 text-gray-900">
                  {initialData.updatedAt
                    ? new Date(initialData.updatedAt).toLocaleDateString('es-ES')
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-4 pt-4 border-t border-gray-200">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            {isEditing ? 'Actualizar Centro de Costo' : 'Crear Centro de Costo'}
          </button>
          <Link
            href="/dashboard/configuration/cost-centers"
            className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-center transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
} 