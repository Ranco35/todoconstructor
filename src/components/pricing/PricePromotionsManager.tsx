'use client';

import React, { useState, useEffect } from 'react';
// Iconos reemplazados con emojis
import { formatPrice, formatPercentage, getPromotionTypeDescription, getPromotionAppliesToDescription } from '@/utils/price-utils';
import { 
  getPricePromotions, 
  createPricePromotion,
  updatePricePromotion,
  deletePricePromotion 
} from '@/actions/pricing/price-management-actions';

interface PricePromotion {
  id: number;
  name: string;
  description?: string;
  promotionType: 'discount_percentage' | 'discount_fixed' | 'markup_percentage' | 'markup_fixed' | 'special_price';
  value: number;
  appliesTo: 'all_products' | 'categories' | 'specific_products' | 'suppliers';
  targetIds: number[];
  startDate: string;
  endDate: string;
  isActive: boolean;
  priority: number;
  maxUsage?: number;
  currentUsage: number;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  name: string;
  description: string;
  promotionType: 'discount_percentage' | 'discount_fixed' | 'markup_percentage' | 'markup_fixed' | 'special_price';
  value: number;
  appliesTo: 'all_products' | 'categories' | 'specific_products' | 'suppliers';
  targetIds: number[];
  startDate: string;
  endDate: string;
  priority: number;
  maxUsage?: number;
}

export default function PricePromotionsManager() {
  const [promotions, setPromotions] = useState<PricePromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    promotionType: 'discount_percentage',
    value: 0,
    appliesTo: 'all_products',
    targetIds: [],
    startDate: '',
    endDate: '',
    priority: 0,
    maxUsage: undefined
  });

  // Filter state
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'expired'>('all');

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getPricePromotions();
      
      if (result.success) {
        setPromotions(result.data || []);
      } else {
        setError(result.error || 'Error al cargar promociones');
      }

    } catch (error) {
      console.error('Error loading promotions:', error);
      setError('Error interno del servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('El nombre de la promoción es requerido');
      return;
    }

    if (!formData.value || formData.value <= 0) {
      setError('El valor de la promoción debe ser mayor a cero');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      setError('Las fechas de inicio y fin son requeridas');
      return;
    }

    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    
    if (startDate >= endDate) {
      setError('La fecha de inicio debe ser anterior a la fecha de fin');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const submitData = {
        ...formData,
        targetIds: formData.appliesTo === 'all_products' ? [] : formData.targetIds
      };

      if (editingId) {
        // Actualizar promoción existente
        const result = await updatePricePromotion(editingId, submitData);
        
        if (result.success) {
          setSuccess('Promoción actualizada exitosamente');
          await loadPromotions();
          resetForm();
        } else {
          setError(result.error || 'Error al actualizar promoción');
        }
      } else {
        // Crear nueva promoción
        const result = await createPricePromotion(submitData);
        
        if (result.success) {
          setSuccess('Promoción creada exitosamente');
          await loadPromotions();
          resetForm();
        } else {
          setError(result.error || 'Error al crear promoción');
        }
      }

    } catch (error) {
      console.error('Error saving promotion:', error);
      setError('Error interno del servidor');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (promotion: PricePromotion) => {
    setFormData({
      name: promotion.name,
      description: promotion.description || '',
      promotionType: promotion.promotionType,
      value: promotion.value,
      appliesTo: promotion.appliesTo,
      targetIds: promotion.targetIds,
      startDate: promotion.startDate.split('T')[0],
      endDate: promotion.endDate.split('T')[0],
      priority: promotion.priority,
      maxUsage: promotion.maxUsage
    });
    setEditingId(promotion.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta promoción?')) {
      return;
    }

    try {
      setError(null);
      const result = await deletePricePromotion(id);
      
      if (result.success) {
        setSuccess('Promoción eliminada exitosamente');
        await loadPromotions();
      } else {
        setError(result.error || 'Error al eliminar promoción');
      }
    } catch (error) {
      console.error('Error deleting promotion:', error);
      setError('Error interno del servidor');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      promotionType: 'discount_percentage',
      value: 0,
      appliesTo: 'all_products',
      targetIds: [],
      startDate: '',
      endDate: '',
      priority: 0,
      maxUsage: undefined
    });
    setEditingId(null);
    setShowForm(false);
  };

  const isPromotionActive = (promotion: PricePromotion): boolean => {
    if (!promotion.isActive) return false;
    
    const now = new Date();
    const startDate = new Date(promotion.startDate);
    const endDate = new Date(promotion.endDate);
    
    return now >= startDate && now <= endDate;
  };

  const isPromotionExpiring = (promotion: PricePromotion): boolean => {
    const endDate = new Date(promotion.endDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  const getPromotionStatus = (promotion: PricePromotion): { status: string; color: string } => {
    if (!promotion.isActive) {
      return { status: 'Inactiva', color: 'bg-gray-100 text-gray-800' };
    }
    
    if (isPromotionActive(promotion)) {
      if (isPromotionExpiring(promotion)) {
        return { status: 'Por Vencer', color: 'bg-orange-100 text-orange-800' };
      }
      return { status: 'Activa', color: 'bg-green-100 text-green-800' };
    }
    
    const now = new Date();
    const startDate = new Date(promotion.startDate);
    
    if (now < startDate) {
      return { status: 'Programada', color: 'bg-blue-100 text-blue-800' };
    }
    
    return { status: 'Expirada', color: 'bg-red-100 text-red-800' };
  };

  const filteredPromotions = promotions.filter(promotion => {
    switch (filterActive) {
      case 'active':
        return isPromotionActive(promotion);
      case 'expired':
        return !isPromotionActive(promotion) && promotion.isActive;
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Cargando promociones...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Promociones de Precios</h2>
          <p className="text-gray-600">Gestiona descuentos y promociones temporales</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
        >
          <span className="mr-2">➕</span>
          Nueva Promoción
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setFilterActive('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterActive === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilterActive('active')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterActive === 'active' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Activas
          </button>
          <button
            onClick={() => setFilterActive('expired')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterActive === 'expired' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Expiradas
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Editar Promoción' : 'Nueva Promoción'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombre */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Promoción
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Descuento Verano 2025"
                  required
                />
              </div>

              {/* Descripción */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Descripción opcional de la promoción"
                />
              </div>

              {/* Tipo de Promoción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Promoción
                </label>
                <select
                  value={formData.promotionType}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    promotionType: e.target.value as any 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="discount_percentage">Descuento por Porcentaje</option>
                  <option value="discount_fixed">Descuento Fijo</option>
                  <option value="markup_percentage">Aumento por Porcentaje</option>
                  <option value="markup_fixed">Aumento Fijo</option>
                  <option value="special_price">Precio Especial</option>
                </select>
              </div>

              {/* Valor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={
                    formData.promotionType.includes('percentage') 
                      ? 'Ej: 15 (para 15%)' 
                      : 'Ej: 5000 (para $5,000)'
                  }
                  required
                />
              </div>

              {/* Aplica a */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Aplica a
                </label>
                <select
                  value={formData.appliesTo}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    appliesTo: e.target.value as any 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all_products">Todos los productos</option>
                  <option value="categories">Categorías específicas</option>
                  <option value="specific_products">Productos específicos</option>
                  <option value="suppliers">Proveedores específicos</option>
                </select>
              </div>

              {/* Prioridad */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioridad
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Mayor número = mayor prioridad"
                />
              </div>

              {/* Fecha de Inicio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Inicio
                </label>
                <input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Fecha de Fin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Fin
                </label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Límite de Uso */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Límite de Uso (opcional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxUsage || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    maxUsage: e.target.value ? Number(e.target.value) : undefined 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Dejar vacío para sin límite"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Promotions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Promociones ({filteredPromotions.length})
          </h3>
        </div>
        
        {filteredPromotions.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No hay promociones que coincidan con el filtro seleccionado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fechas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPromotions.map((promotion) => {
                  const status = getPromotionStatus(promotion);
                  return (
                    <tr key={promotion.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{promotion.name}</div>
                          {promotion.description && (
                            <div className="text-sm text-gray-500">{promotion.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getPromotionTypeDescription(promotion.promotionType)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {promotion.promotionType.includes('percentage') 
                          ? `${promotion.value}%`
                          : formatPrice(promotion.value)
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <span className="mr-1">📅</span>
                          <div>
                            <div>{new Date(promotion.startDate).toLocaleDateString()}</div>
                            <div>{new Date(promotion.endDate).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                          {status.status}
                        </span>
                        {isPromotionExpiring(promotion) && (
                          <span className="ml-1 inline">⚠️</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {promotion.maxUsage 
                          ? `${promotion.currentUsage}/${promotion.maxUsage}`
                          : `${promotion.currentUsage}`
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(promotion)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <span>✏️</span>
                        </button>
                        <button
                          onClick={() => handleDelete(promotion.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <span>🗑️</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
