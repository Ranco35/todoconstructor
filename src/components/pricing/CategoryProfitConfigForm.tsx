'use client';

import React, { useState, useEffect } from 'react';
// Iconos reemplazados con emojis
import { formatPercentage } from '@/utils/price-utils';
import { 
  getCategoryProfitConfigs, 
  createCategoryProfitConfig,
  updateCategoryProfitConfig,
  deleteCategoryProfitConfig
} from '@/actions/pricing/price-management-actions';
import { getAllCategories } from '@/actions/configuration/category-actions';

interface CategoryProfitConfig {
  id: number;
  categoryId: number;
  defaultProfitMargin: number;
  minProfitMargin: number;
  maxProfitMargin: number;
  roundingRule: 'none' | 'tens' | 'hundreds' | 'thousands';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  Category?: {
    name: string;
  };
}

interface Category {
  id: number;
  name: string;
}

interface FormData {
  categoryId: number;
  defaultProfitMargin: number;
  minProfitMargin: number;
  maxProfitMargin: number;
  roundingRule: 'none' | 'tens' | 'hundreds' | 'thousands';
}

export default function CategoryProfitConfigForm() {
  const [configs, setConfigs] = useState<CategoryProfitConfig[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingPrices, setUpdatingPrices] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    categoryId: 0,
    defaultProfitMargin: 30,
    minProfitMargin: 10,
    maxProfitMargin: 100,
    roundingRule: 'hundreds'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [configsResult, categoriesData] = await Promise.all([
        getCategoryProfitConfigs(),
        getAllCategories()
      ]);

      if (configsResult.success) {
        setConfigs(configsResult.data || []);
      } else {
        setError(configsResult.error || 'Error al cargar configuraciones');
      }

      // Configurar categorías desde getAllCategories()
      setCategories(categoriesData || []);

    } catch (error) {
      console.error('Error loading data:', error);
      setError('Error interno del servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.categoryId) {
      setError('Selecciona una categoría');
      return;
    }

    if (formData.defaultProfitMargin < formData.minProfitMargin) {
      setError('El margen por defecto debe ser mayor o igual al margen mínimo');
      return;
    }

    if (formData.defaultProfitMargin > formData.maxProfitMargin) {
      setError('El margen por defecto debe ser menor o igual al margen máximo');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      if (editingId) {
        // Actualizar configuración existente
        const result = await updateCategoryProfitConfig(editingId, formData);
        
        if (result.success) {
          setSuccess('Configuración actualizada exitosamente');
          await loadData();
          resetForm();
        } else {
          setError(result.error || 'Error al actualizar configuración');
        }
      } else {
        // Crear nueva configuración
        const result = await createCategoryProfitConfig(formData);
        
        if (result.success) {
          setSuccess('Configuración creada exitosamente');
          await loadData();
          resetForm();
        } else {
          setError(result.error || 'Error al crear configuración');
        }
      }

    } catch (error) {
      console.error('Error saving configuration:', error);
      setError('Error interno del servidor');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (config: CategoryProfitConfig) => {
    setFormData({
      categoryId: config.categoryId,
      defaultProfitMargin: config.defaultProfitMargin,
      minProfitMargin: config.minProfitMargin,
      maxProfitMargin: config.maxProfitMargin,
      roundingRule: config.roundingRule
    });
    setEditingId(config.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta configuración?')) {
      return;
    }

    try {
      setError(null);
      const result = await deleteCategoryProfitConfig(id);
      
      if (result.success) {
        setSuccess('Configuración eliminada exitosamente');
        await loadData();
      } else {
        setError(result.error || 'Error al eliminar configuración');
      }
    } catch (error) {
      console.error('Error deleting configuration:', error);
      setError('Error interno del servidor');
    }
  };

  const handleUpdatePrices = async (categoryId: number, categoryName: string) => {
    if (!confirm(`¿Estás seguro de que quieres actualizar los precios de todos los productos de la categoría "${categoryName}"?`)) {
      return;
    }

    try {
      setUpdatingPrices(categoryId);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/pricing/update-category-prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          categoryId,
          reason: 'margin_adjustment'
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        const { updated, errors } = result.data || { updated: 0, errors: [] };
        setSuccess(`Precios actualizados exitosamente: ${updated} productos actualizados${errors.length > 0 ? `. ${errors.length} errores.` : '.'}`);
        if (errors.length > 0) {
          console.warn('Errores durante la actualización:', errors);
        }
      } else {
        setError(result.error || 'Error al actualizar precios');
      }
    } catch (error) {
      console.error('Error updating prices:', error);
      setError('Error interno del servidor');
    } finally {
      setUpdatingPrices(null);
    }
  };

  const resetForm = () => {
    setFormData({
      categoryId: 0,
      defaultProfitMargin: 30,
      minProfitMargin: 10,
      maxProfitMargin: 100,
      roundingRule: 'hundreds'
    });
    setEditingId(null);
    setShowForm(false);
  };

  const getRoundingRuleDescription = (rule: string) => {
    switch (rule) {
      case 'none': return 'Sin redondeo';
      case 'tens': return 'Decenas';
      case 'hundreds': return 'Centenas';
      case 'thousands': return 'Miles';
      default: return rule;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Cargando configuraciones...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Utilidades por Categoría</h2>
          <p className="text-gray-600">Configura márgenes de utilidad por categoría de productos</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <span className="mr-2">➕</span>
          Nueva Configuración
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

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Editar Configuración' : 'Nueva Configuración'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Categoría */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value={0}>Seleccionar categoría</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Regla de Redondeo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Regla de Redondeo
                </label>
                <select
                  value={formData.roundingRule}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    roundingRule: e.target.value as 'none' | 'tens' | 'hundreds' | 'thousands' 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="none">Sin redondeo</option>
                  <option value="tens">Decenas</option>
                  <option value="hundreds">Centenas</option>
                  <option value="thousands">Miles</option>
                </select>
              </div>

              {/* Margen por Defecto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Margen por Defecto (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  step="0.1"
                  value={formData.defaultProfitMargin}
                  onChange={(e) => setFormData({ ...formData, defaultProfitMargin: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Margen Mínimo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Margen Mínimo (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  step="0.1"
                  value={formData.minProfitMargin}
                  onChange={(e) => setFormData({ ...formData, minProfitMargin: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Margen Máximo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Margen Máximo (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  step="0.1"
                  value={formData.maxProfitMargin}
                  onChange={(e) => setFormData({ ...formData, maxProfitMargin: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Configurations Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Configuraciones Existentes</h3>
        </div>
        
        {configs.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No hay configuraciones de utilidad por categoría
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Margen por Defecto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rango
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Redondeo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {configs.map((config) => (
                  <tr key={config.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {config.Category?.name || `Categoría ${config.categoryId}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPercentage(config.defaultProfitMargin)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatPercentage(config.minProfitMargin)} - {formatPercentage(config.maxProfitMargin)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getRoundingRuleDescription(config.roundingRule)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        config.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {config.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(config)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar configuración"
                      >
                        <span>✏️</span>
                      </button>
                      <button
                        onClick={() => handleUpdatePrices(config.categoryId, config.Category?.name || `Categoría ${config.categoryId}`)}
                        disabled={updatingPrices === config.categoryId}
                        className={`text-green-600 hover:text-green-900 ${updatingPrices === config.categoryId ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Actualizar precios de productos"
                      >
                        {updatingPrices === config.categoryId ? '⏳' : '💰'}
                      </button>
                      <button
                        onClick={() => handleDelete(config.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar configuración"
                      >
                        <span>🗑️</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
