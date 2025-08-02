'use client';

import { useState } from 'react';
import { UnitMeasure, UNIT_CATEGORIES } from '@/types/unit-measure';
import { deleteUnitMeasureAction } from '@/actions/configuration/unit-measure-actions';
import { Edit, Trash2, Shield, AlertCircle, Calculator } from 'lucide-react';
import Link from 'next/link';

interface UnitMeasureTableProps {
  data: UnitMeasure[];
  deleteAction: (formData: FormData) => Promise<void>;
}

export default function UnitMeasureTable({ data, deleteAction }: UnitMeasureTableProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (unit: UnitMeasure) => {
    if (unit.isDefault) {
      alert('No se pueden eliminar las unidades del sistema');
      return;
    }

    const confirmed = confirm(
      `¿Estás seguro de que deseas eliminar la unidad "${unit.name}" (${unit.abbreviation})?\n\n` +
      'Esta acción no se puede deshacer.'
    );

    if (!confirmed) return;

    setDeletingId(unit.id);
    
    try {
      const formData = new FormData();
      formData.append('id', unit.id.toString());
      await deleteAction(formData);
    } catch (error) {
      alert('Error al eliminar la unidad de medida: ' + (error as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  const getCategoryInfo = (category: string) => {
    const categoryInfo = UNIT_CATEGORIES.find(cat => cat.value === category);
    return categoryInfo || { value: category, label: category, icon: '❓' };
  };

  const getConversionDisplay = (unit: UnitMeasure) => {
    if (!unit.baseUnit) {
      return <span className="text-gray-500 text-sm">Unidad base</span>;
    }
    
    return (
      <div className="text-sm">
        <div className="font-medium">
          1 {unit.abbreviation} = {unit.conversionFactor} {unit.baseUnit.abbreviation}
        </div>
        {unit.conversionFormula && (
          <div className="text-gray-600 italic">
            {unit.conversionFormula}
          </div>
        )}
      </div>
    );
  };

  const getUnitTypeBadge = (unitType: string) => {
    const badges = {
      standard: { label: 'Estándar', color: 'bg-blue-100 text-blue-800' },
      compound: { label: 'Compuesta', color: 'bg-green-100 text-green-800' },
      custom: { label: 'Personalizada', color: 'bg-purple-100 text-purple-800' }
    };
    
    const badge = badges[unitType as keyof typeof badges] || badges.custom;
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center text-gray-500">
          <Calculator className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay unidades de medida</h3>
          <p className="text-gray-600 mb-4">
            Comienza creando tu primera unidad de medida personalizada.
          </p>
          <Link href="/dashboard/configuration/units/create">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
              Crear primera unidad
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unidad
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoría
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Conversión
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((unit) => {
              const categoryInfo = getCategoryInfo(unit.category);
              
              return (
                <tr key={unit.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      <div>
                        <div className="flex items-center space-x-2">
                          <div className="text-sm font-semibold text-gray-900">
                            {unit.name}
                          </div>
                          <div className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-mono">
                            {unit.abbreviation}
                          </div>
                          {unit.isDefault && (
                            <Shield className="w-4 h-4 text-blue-500" title="Unidad del sistema" />
                          )}
                        </div>
                        {unit.description && (
                          <div className="text-sm text-gray-600 mt-1">
                            {unit.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{categoryInfo.icon}</span>
                      <span className="text-sm text-gray-900">{categoryInfo.label}</span>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    {getConversionDisplay(unit)}
                  </td>

                  <td className="px-4 py-4">
                    {getUnitTypeBadge(unit.unitType)}
                  </td>

                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      unit.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {unit.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {!unit.isDefault && (
                        <>
                          <Link href={`/dashboard/configuration/units/edit/${unit.id}`}>
                            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                          </Link>
                          
                          <button
                            onClick={() => handleDelete(unit)}
                            disabled={deletingId === unit.id}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          >
                            {deletingId === unit.id ? (
                              <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </>
                      )}
                      
                      {unit.isDefault && (
                        <div className="flex items-center text-gray-400 text-sm">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          Sistema
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
} 