'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Package, DollarSign, FileText, Tag, Sparkles } from 'lucide-react';
import { 
  createProgramaAlojamiento, 
  updateProgramaAlojamiento,
  type ProgramaAlojamiento 
} from '@/actions/configuration/programas-alojamiento';

interface ProgramaAlojamientoFormProps {
  programa?: ProgramaAlojamiento | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ProgramaAlojamientoForm({ 
  programa, 
  onSuccess, 
  onCancel 
}: ProgramaAlojamientoFormProps) {
  const isEditing = !!programa;
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    saleprice: '',
    costprice: '',
    sku: '',
    brand: '',
    type: 'PROGRAMA'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (programa) {
      setFormData({
        name: programa.name || '',
        description: programa.description || '',
        saleprice: programa.saleprice?.toString() || '',
        costprice: programa.costprice?.toString() || '',
        sku: programa.sku || '',
        brand: programa.brand || '',
        type: programa.type || 'PROGRAMA'
      });
    }
  }, [programa]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    } else if (formData.name.length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres';
    }

    if (formData.saleprice && (isNaN(Number(formData.saleprice)) || Number(formData.saleprice) <= 0)) {
      newErrors.saleprice = 'El precio de venta debe ser un número mayor a 0';
    }

    if (formData.costprice && (isNaN(Number(formData.costprice)) || Number(formData.costprice) < 0)) {
      newErrors.costprice = 'El precio de costo debe ser un número válido';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'La descripción no puede exceder 500 caracteres';
    }

    if (formData.sku && formData.sku.length > 50) {
      newErrors.sku = 'El SKU no puede exceder 50 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSubmitError(null);

    try {
      const programaData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        saleprice: Number(formData.saleprice),
        costprice: formData.costprice ? Number(formData.costprice) : undefined,
        sku: formData.sku.trim() || undefined,
        brand: formData.brand.trim() || undefined,
        type: formData.type
      };

      let result;
      if (isEditing) {
        result = await updateProgramaAlojamiento(programa!.id, programaData);
      } else {
        result = await createProgramaAlojamiento(programaData);
      }

      if (result.error) {
        setSubmitError(result.error);
      } else {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError('Error inesperado al guardar el programa');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const generateSKU = () => {
    const timestamp = Date.now().toString().slice(-4);
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const baseName = formData.name.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '') || 'PROG';
    const sku = `${baseName}-${timestamp}-${randomNum}`;
    handleChange('sku', sku);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
              <Package className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Editar Programa' : 'Nuevo Programa de Alojamiento'}
              </h2>
              <p className="text-sm text-gray-600">
                {isEditing 
                  ? 'Modifica los datos del programa de alojamiento'
                  : 'Crea un nuevo programa de alojamiento para el hotel'
                }
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Error Alert */}
        {submitError && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{submitError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <FileText size={20} className="text-blue-600" />
              Información Básica
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombre */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Programa *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="ej. Paquete Romántico, Fin de Semana Relax..."
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.name && (
                  <p className="text-red-600 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              {/* Descripción */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describe qué incluye el programa, características especiales, etc."
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.description.length}/500 caracteres
                </p>
                {errors.description && (
                  <p className="text-red-600 text-sm mt-1">{errors.description}</p>
                )}
              </div>

              {/* Marca/Hotel */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marca/Hotel
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => handleChange('brand', e.target.value)}
                  placeholder="ej. Hotel Termas, Spa Resort..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Programa
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="PROGRAMA">Programa Estándar</option>
                  <option value="PAQUETE">Paquete Especial</option>
                  <option value="PROMOCION">Promoción</option>
                  <option value="TEMPORADA">Programa de Temporada</option>
                </select>
              </div>
            </div>
          </div>

          {/* Precios */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <DollarSign size={20} className="text-green-600" />
              Precios
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Precio de Venta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio de Venta *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.saleprice}
                    onChange={(e) => handleChange('saleprice', e.target.value)}
                    placeholder="250000"
                    min="0"
                    step="1000"
                    className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.saleprice ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.saleprice && (
                  <p className="text-red-600 text-sm mt-1">{errors.saleprice}</p>
                )}
              </div>

              {/* Precio de Costo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio de Costo (opcional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={formData.costprice}
                    onChange={(e) => handleChange('costprice', e.target.value)}
                    placeholder="180000"
                    min="0"
                    step="1000"
                    className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.costprice ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.costprice && (
                  <p className="text-red-600 text-sm mt-1">{errors.costprice}</p>
                )}
              </div>
            </div>

            {/* Mostrar margen si ambos precios están disponibles */}
            {formData.saleprice && formData.costprice && 
             !isNaN(Number(formData.saleprice)) && !isNaN(Number(formData.costprice)) && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-green-600" size={16} />
                  <span className="text-sm font-medium text-green-800">Análisis de Margen</span>
                </div>
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    Margen: ${(Number(formData.saleprice) - Number(formData.costprice)).toLocaleString()} 
                    ({(((Number(formData.saleprice) - Number(formData.costprice)) / Number(formData.saleprice)) * 100).toFixed(1)}%)
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* SKU */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Tag size={20} className="text-purple-600" />
              Identificación
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SKU (Código de Producto)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => handleChange('sku', e.target.value)}
                  placeholder="PROG-1234-567"
                  className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.sku ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={generateSKU}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <Sparkles size={16} />
                  Generar
                </button>
              </div>
              {errors.sku && (
                <p className="text-red-600 text-sm mt-1">{errors.sku}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Si se deja vacío, se generará automáticamente
              </p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {isEditing ? 'Actualizando...' : 'Creando...'}
                </>
              ) : (
                <>
                  <Save size={16} />
                  {isEditing ? 'Actualizar Programa' : 'Crear Programa'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 