'use client';

import React, { useState, useEffect } from 'react';
import { getAllCategories } from '@/actions/configuration/category-actions';

interface CategoryMultiSelectorProps {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

interface Category {
  id: number;
  name: string;
  _count?: {
    Product: number;
  };
}

export default function CategoryMultiSelector({ selectedIds, onChange }: CategoryMultiSelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window !== 'undefined') {
      setMounted(true);
      loadCategories();
    }
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const categoriesData = await getAllCategories();
      // getAllCategories no incluye _count, así que lo agregamos como opcional
      const categoriesWithCount = (categoriesData || []).map(cat => ({
        ...cat,
        _count: cat._count || undefined
      }));
      setCategories(categoriesWithCount);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]); // Asegurar que haya un array vacío en caso de error
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (categoryId: number) => {
    if (selectedIds.includes(categoryId)) {
      onChange(selectedIds.filter(id => id !== categoryId));
    } else {
      onChange([...selectedIds, categoryId]);
    }
  };

  const handleSelectAll = () => {
    const allIds = filteredCategories.map(c => c.id);
    onChange(allIds);
  };

  const handleDeselectAll = () => {
    onChange([]);
  };

  const filteredCategories = categories.filter(cat => 
    search.trim() === '' || 
    cat.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">
          Seleccionar Categorías
          {selectedIds.length > 0 && (
            <span className="ml-2 text-blue-600">({selectedIds.length} seleccionadas)</span>
          )}
        </h4>

        {/* Búsqueda */}
        <div className="mb-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar categoría..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>

        {/* Botones de selección */}
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          >
            Seleccionar todas
          </button>
          <button
            type="button"
            onClick={handleDeselectAll}
            className="text-xs px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            Deseleccionar todas
          </button>
        </div>
      </div>

      {/* Lista de categorías */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-sm text-gray-600">Cargando categorías...</span>
        </div>
      ) : (
        <div className="overflow-y-auto max-h-96 border border-gray-200 rounded bg-white">
          {filteredCategories.length === 0 ? (
            <div className="px-3 py-4 text-center text-gray-500 text-sm">
              No se encontraron categorías
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className={`px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedIds.includes(category.id) ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleToggle(category.id)}
                >
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(category.id)}
                      onChange={() => handleToggle(category.id)}
                      className="rounded mr-3"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{category.name}</div>
                      {category._count && (
                        <div className="text-xs text-gray-500">
                          {category._count.Product} productos
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

