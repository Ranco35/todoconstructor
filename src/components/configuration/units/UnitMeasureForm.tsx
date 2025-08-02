'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UnitMeasure, UnitMeasureFormData, UNIT_CATEGORIES, UNIT_TYPES } from '@/types/unit-measure';
import { createUnitMeasure, updateUnitMeasure, getBaseUnits } from '@/actions/configuration/unit-measure-actions';
import { Save, ArrowLeft, Calculator, AlertCircle, Info } from 'lucide-react';
import Link from 'next/link';

interface UnitMeasureFormProps {
  initialData?: UnitMeasure;
  isEditing?: boolean;
}

export default function UnitMeasureForm({ initialData, isEditing = false }: UnitMeasureFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [baseUnits, setBaseUnits] = useState<UnitMeasure[]>([]);
  const [formData, setFormData] = useState<UnitMeasureFormData>({
    name: initialData?.name || '',
    abbreviation: initialData?.abbreviation || '',
    description: initialData?.description || '',
    isActive: initialData?.isActive ?? true,
    baseUnitId: initialData?.baseUnitId,
    conversionFactor: initialData?.conversionFactor || 1.0,
    conversionFormula: initialData?.conversionFormula || '',
    category: initialData?.category || 'general',
    unitType: initialData?.unitType || 'custom',
    notes: initialData?.notes || ''
  });

  useEffect(() => {
    const loadBaseUnits = async () => {
      try {
        const units = await getBaseUnits();
        setBaseUnits(units);
      } catch (error) {
        console.error('Error cargando unidades base:', error);
      }
    };
    
    loadBaseUnits();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing && initialData) {
        await updateUnitMeasure(initialData.id, formData);
      } else {
        await createUnitMeasure(formData);
      }
      
      router.push('/dashboard/configuration/units');
      router.refresh();
    } catch (error) {
      alert('Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UnitMeasureFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getFilteredBaseUnits = () => {
    // Para unidades de empaque, mostrar unidades de cantidad como base
    if (formData.category === 'empaque') {
      return baseUnits.filter(unit => unit.category === 'cantidad');
    }
    // Para otras categorías, mostrar unidades de la misma categoría
    return baseUnits.filter(unit => unit.category === formData.category);
  };

  const isReadOnly = initialData?.isDefault;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <Link href="/dashboard/configuration/units">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Editar Unidad de Medida' : 'Crear Nueva Unidad de Medida'}
            </h1>
            <p className="text-gray-600">
              {isEditing 
                ? 'Modifica los datos de la unidad de medida' 
                : 'Define una nueva unidad de medida con su fórmula de conversión'}
            </p>
          </div>
        </div>

        {isReadOnly && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-blue-800 font-medium">Unidad del Sistema</p>
              <p className="text-blue-700 text-sm">
                Esta es una unidad predefinida del sistema y no se puede editar.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Calculator className="w-5 h-5 mr-2" />
            Información Básica
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la Unidad *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ej: Jaba de 24 unidades"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={isReadOnly}
              />
              <p className="text-xs text-gray-500 mt-1">
                Nombre descriptivo de la unidad de medida
              </p>
            </div>

            {/* Abreviatura */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Abreviatura *
              </label>
              <input
                type="text"
                value={formData.abbreviation}
                onChange={(e) => handleInputChange('abbreviation', e.target.value.toUpperCase())}
                placeholder="Ej: JAB24"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                required
                disabled={isReadOnly}
                maxLength={10}
              />
              <p className="text-xs text-gray-500 mt-1">
                Código corto único (máximo 10 caracteres)
              </p>
            </div>

            {/* Categoría */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={isReadOnly}
              >
                {UNIT_CATEGORIES.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.icon} {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Unidad
              </label>
              <select
                value={formData.unitType}
                onChange={(e) => handleInputChange('unitType', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isReadOnly}
              >
                {UNIT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {UNIT_TYPES.find(t => t.value === formData.unitType)?.description}
              </p>
            </div>
          </div>

          {/* Descripción */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descripción detallada de la unidad de medida..."
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isReadOnly}
            />
          </div>
        </div>

        {/* Configuración de Conversión */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <ArrowLeft className="w-5 h-5 mr-2 rotate-180" />
            Configuración de Conversión
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Unidad Base */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unidad Base para Conversión
              </label>
              <select
                value={formData.baseUnitId || ''}
                onChange={(e) => handleInputChange('baseUnitId', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isReadOnly}
              >
                <option value="">Seleccionar unidad base (opcional)</option>
                {getFilteredBaseUnits().map(unit => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name} ({unit.abbreviation})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Unidad a la que se convertirá esta unidad
              </p>
            </div>

            {/* Factor de Conversión */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Factor de Conversión
              </label>
              <input
                type="number"
                step="0.0001"
                min="0.0001"
                value={formData.conversionFactor}
                onChange={(e) => handleInputChange('conversionFactor', parseFloat(e.target.value) || 1.0)}
                placeholder="1.0"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isReadOnly || !formData.baseUnitId}
              />
              <p className="text-xs text-gray-500 mt-1">
                1 {formData.abbreviation} = {formData.conversionFactor} unidades base
              </p>
            </div>
          </div>

          {/* Fórmula de Conversión */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fórmula de Conversión (Descriptiva)
            </label>
            <input
              type="text"
              value={formData.conversionFormula}
              onChange={(e) => handleInputChange('conversionFormula', e.target.value)}
              placeholder="Ej: 1 jaba = 24 unidades de bebida"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isReadOnly}
            />
            <p className="text-xs text-gray-500 mt-1">
              Descripción legible de la conversión para usuarios
            </p>
          </div>

          {/* Ejemplo de Conversión */}
          {formData.baseUnitId && formData.conversionFactor > 0 && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Ejemplo de Conversión:</h4>
              <div className="text-sm text-blue-700">
                <div>• 1 {formData.abbreviation} = {formData.conversionFactor} {baseUnits.find(u => u.id === formData.baseUnitId)?.abbreviation}</div>
                <div>• 5 {formData.abbreviation} = {(formData.conversionFactor * 5).toFixed(2)} {baseUnits.find(u => u.id === formData.baseUnitId)?.abbreviation}</div>
              </div>
            </div>
          )}
        </div>

        {/* Configuración Adicional */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Configuración Adicional</h2>

          <div className="space-y-4">
            {/* Estado */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isReadOnly}
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Unidad activa (disponible para uso)
              </label>
            </div>

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas Internas
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Notas adicionales para uso interno..."
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isReadOnly}
              />
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        {!isReadOnly && (
          <div className="flex justify-end space-x-4">
            <Link href="/dashboard/configuration/units">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </Link>
            
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
} 