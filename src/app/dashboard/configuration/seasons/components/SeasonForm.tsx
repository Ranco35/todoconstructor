'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Info, AlertTriangle, Loader2, Eye } from 'lucide-react';
import { SeasonConfiguration, SEASON_TYPES, SeasonFormData } from '@/types/season';
import { 
  createSeasonConfiguration, 
  updateSeasonConfiguration, 
  validateSeasonDates 
} from '@/actions/configuration/season-actions';

interface SeasonFormProps {
  mode: 'create' | 'edit';
  initialData?: SeasonConfiguration;
}

export default function SeasonForm({ mode, initialData }: SeasonFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Estados del formulario
  const [formData, setFormData] = useState<SeasonFormData>({
    name: initialData?.name || '',
    season_type: initialData?.season_type || 'mid',
    start_date: initialData?.start_date || '',
    end_date: initialData?.end_date || '',
    discount_percentage: initialData?.discount_percentage || 0,
    priority: initialData?.priority || 1,
    applies_to_rooms: initialData?.applies_to_rooms || true,
    applies_to_programs: initialData?.applies_to_programs || true,
    is_active: initialData?.is_active ?? true
  });

  // Manejar cambios en el formulario
  const handleInputChange = (field: keyof SeasonFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value.toString());
      });

      let result;
      if (mode === 'create') {
        result = await createSeasonConfiguration(formDataToSend);
      } else {
        result = await updateSeasonConfiguration(initialData!.id, formDataToSend);
      }

      if (result.success) {
        router.push('/dashboard/configuration/seasons');
      } else {
        alert(result.error || 'Error al guardar la temporada');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error al guardar la temporada');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calcular duración en días
  const calculateDays = () => {
    if (!formData.start_date || !formData.end_date) return 0;
    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
  };

  // Previsualización de precios con ejemplos reales
  const getPreviewPrices = () => {
    const examples = [
      { type: 'Habitación Estándar', base: 50000, description: 'Precio típico por noche' },
      { type: 'Habitación Premium', base: 55000, description: 'Precio habitación superior' },
      { type: 'Programa Ejecutivo', base: 180000, description: 'Ejemplo programa básico' },
      { type: 'Programa Premium', base: 350000, description: 'Ejemplo programa completo' }
    ];
    
    return examples.map(example => ({
      ...example,
      adjusted: Math.round(example.base * (1 + formData.discount_percentage / 100)),
      difference: Math.round(example.base * formData.discount_percentage / 100)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Información básica */}
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Información Básica
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Define el nombre y tipo de temporada
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la Temporada *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Ej: Verano 2025, Navidad, Semana Santa..."
              required
            />
          </div>

          {/* Tipo de temporada */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Temporada *
            </label>
            <select
              value={formData.season_type}
              onChange={(e) => handleInputChange('season_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            >
              {Object.entries(SEASON_TYPES).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.icon} {config.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Fechas */}
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            Período de Vigencia
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Establece las fechas cuando aplicará esta temporada
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fecha inicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Inicio *
            </label>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => handleInputChange('start_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          {/* Fecha fin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Fin *
            </label>
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => handleInputChange('end_date', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Duración calculada */}
        {formData.start_date && formData.end_date && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-blue-800">
                <strong>Duración:</strong> {calculateDays()} días
                {calculateDays() < 7 && ' (menos de una semana)'}
                {calculateDays() >= 30 && ' (un mes o más)'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Configuración de precios */}
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <span className="text-2xl">💰</span>
            Ajuste de Precios
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Define el porcentaje de ajuste para esta temporada
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Porcentaje de descuento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ajuste de Precio (%) *
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.discount_percentage}
                onChange={(e) => handleInputChange('discount_percentage', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="0"
                step="0.01"
                min="-100"
                max="500"
              />
              <span className="absolute right-3 top-2 text-gray-500">%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Positivo = incremento, Negativo = descuento, 0 = sin cambio
            </p>
          </div>

          {/* Prioridad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prioridad *
            </label>
            <input
              type="number"
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              min="1"
              max="10"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Mayor número = mayor prioridad en conflictos
            </p>
          </div>
        </div>

        {/* Vista previa de precios con ejemplos detallados */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <div>
                <h4 className="font-medium text-gray-900">Vista Previa de Precios</h4>
                <p className="text-xs text-gray-600">Cómo afecta esta temporada a diferentes tipos de precios</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 bg-white px-2 py-1 rounded-md border border-purple-200"
            >
              <Eye className="w-4 h-4" />
              {showPreview ? 'Ocultar' : 'Ver Ejemplos'}
            </button>
          </div>
          
          {showPreview && (
            <div className="space-y-3">
              {/* Explicación del cálculo */}
              <div className="bg-white border border-blue-200 rounded-lg p-3">
                <div className="text-sm text-gray-700 mb-2">
                  <strong>Fórmula de cálculo:</strong> Precio Final = Precio Base × (1 + {formData.discount_percentage}% ÷ 100)
                </div>
                {formData.discount_percentage !== 0 && (
                  <div className="text-xs text-gray-600">
                    {formData.discount_percentage > 0 
                      ? `🔴 Esta temporada INCREMENTA los precios en ${formData.discount_percentage}%`
                      : `🟢 Esta temporada REDUCE los precios en ${Math.abs(formData.discount_percentage)}%`
                    }
                  </div>
                )}
              </div>

              {/* Tabla de ejemplos */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 text-xs font-medium text-gray-700 border-b border-gray-200">
                  EJEMPLOS DE APLICACIÓN
                </div>
                <div className="divide-y divide-gray-100">
                  {getPreviewPrices().map((example, index) => (
                    <div key={index} className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {example.type.includes('Habitación') ? '🏨' : '🎯'} {example.type}
                          </span>
                          <span className="text-xs text-gray-500">
                            {example.description}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-600">Aplica: {
                            example.type.includes('Habitación') 
                              ? (formData.applies_to_rooms ? '✅' : '❌')
                              : (formData.applies_to_programs ? '✅' : '❌')
                          }</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Precio base: ${example.base.toLocaleString()}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${
                            formData.discount_percentage > 0 ? 'text-red-600' : 
                            formData.discount_percentage < 0 ? 'text-green-600' : 'text-gray-600'
                          }`}>
                            ${example.adjusted.toLocaleString()}
                          </span>
                          {formData.discount_percentage !== 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              formData.discount_percentage > 0 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {formData.discount_percentage > 0 ? '+' : ''}${example.difference.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advertencias */}
              {(!formData.applies_to_rooms || !formData.applies_to_programs) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-600">⚠️</span>
                    <div className="text-sm text-yellow-800">
                      <strong>Atención:</strong> Esta temporada NO se aplicará a {
                        !formData.applies_to_rooms && !formData.applies_to_programs 
                          ? 'habitaciones NI programas'
                          : !formData.applies_to_rooms 
                            ? 'habitaciones'
                            : 'programas de alojamiento'
                      }.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Aplicación */}
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            Aplicación
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Selecciona dónde se aplicará esta temporada
          </p>
        </div>

        <div className="space-y-4">
          {/* Aplicar a habitaciones */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="applies_to_rooms"
              checked={formData.applies_to_rooms}
              onChange={(e) => handleInputChange('applies_to_rooms', e.target.checked)}
              className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <div>
              <label htmlFor="applies_to_rooms" className="text-sm font-medium text-gray-700">
                🏨 Habitaciones
              </label>
              <p className="text-xs text-gray-500">
                El ajuste se aplicará a los precios de las habitaciones
              </p>
            </div>
          </div>

          {/* Aplicar a programas */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="applies_to_programs"
              checked={formData.applies_to_programs}
              onChange={(e) => handleInputChange('applies_to_programs', e.target.checked)}
              className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <div>
              <label htmlFor="applies_to_programs" className="text-sm font-medium text-gray-700">
                🎯 Programas de Alojamiento
              </label>
              <p className="text-xs text-gray-500">
                El ajuste se aplicará a los precios de los programas de alojamiento
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Estado */}
      <div className="space-y-6">
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <span className="text-2xl">⚙️</span>
            Estado
          </h3>
        </div>

        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => handleInputChange('is_active', e.target.checked)}
            className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
          />
          <div>
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              ✅ Temporada Activa
            </label>
            <p className="text-xs text-gray-500">
              Solo las temporadas activas se aplicarán a los cálculos de precios
            </p>
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === 'create' ? 'Crear Temporada' : 'Actualizar Temporada'}
        </button>
      </div>
    </form>
  );
} 